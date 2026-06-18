"""
BALANCING experiment: the target is heavily right-skewed and the TEST is enriched
in high-demand roads. We compare target-handling strategies FAIRLY — identical
v1 features and CV; only the objective / transform / sample-weights change.

Strategies:
  raw      : L2 on raw demand                         (current v1)
  log1p    : train on log1p(demand), expm1 back        (compresses tail)
  sqrt     : train on sqrt(demand), square back
  tweedie  : Tweedie objective (positive, skewed)
  huber    : robust to outliers
  wtail    : L2 with sample weight = 1 + k*demand      (emphasize high-demand tail
             so the model fits the highway rows the TEST is enriched in)

Compared on BOTH:
  CV-A : fit day48 -> predict day49 (night; lag faithful)
  CV-B : 5-fold GroupKFold(geohash) OOF (all slots + road types; tail-faithful)

Run: python ml_hackathon_solution/src/balancing.py
"""
from __future__ import annotations
import os, json, time, warnings
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold
import features as F

warnings.filterwarnings("ignore")
T0 = time.time()
def tlog(*a): print(f"[{time.time()-T0:6.1f}s]", *a, flush=True)
import lightgbm as lgb

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE); REPO = os.path.dirname(ROOT)
DATA = os.path.join(REPO, "dataset"); OUT = os.path.join(ROOT, "outputs"); SUB = os.path.join(ROOT, "submissions")
SEED = 42; TARGET = "demand"
FEATS = F.feature_columns(); CAT = F.categorical_columns()


def rmse(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(np.sqrt(np.mean((y - p) ** 2)))

def cast(df):
    df = df.copy()
    for c in CAT: df[c] = df[c].astype("category")
    return df


def transform_y(y, mode):
    if mode == "log1p": return np.log1p(y)
    if mode == "sqrt": return np.sqrt(y)
    return y

def inverse_y(p, mode):
    if mode == "log1p": return np.expm1(p)
    if mode == "sqrt": return np.square(p)
    return p


def fit_predict(Xtr, ytr, Xva, yva, Xpred, mode, rounds=4000, seed=SEED):
    """Returns predictions on Xpred in ORIGINAL demand scale."""
    params = dict(learning_rate=0.03, num_leaves=63, min_child_samples=40,
                  subsample=0.8, subsample_freq=1, colsample_bytree=0.8,
                  reg_lambda=2.0, reg_alpha=0.5, seed=seed, n_jobs=-1, verbose=-1,
                  metric="rmse")
    w = None
    if mode == "tweedie":
        params.update(objective="tweedie", tweedie_variance_power=1.3)
        ytr_t, yva_t = ytr, yva
    elif mode == "huber":
        params.update(objective="huber", alpha=0.9)
        ytr_t, yva_t = ytr, yva
    elif mode == "wtail":
        params.update(objective="regression")
        ytr_t, yva_t = ytr, yva
        w = 1.0 + 4.0 * ytr  # upweight high-demand rows
    else:
        params.update(objective="regression")
        ytr_t, yva_t = transform_y(ytr, mode), transform_y(yva, mode)

    dtr = lgb.Dataset(Xtr, ytr_t, weight=w, categorical_feature=CAT, free_raw_data=False)
    valid, names, cbs = [dtr], ["train"], [lgb.log_evaluation(0)]
    if Xva is not None:
        dva = lgb.Dataset(Xva, yva_t, categorical_feature=CAT, reference=dtr, free_raw_data=False)
        valid, names = [dtr, dva], ["train", "valid"]; cbs.append(lgb.early_stopping(150, verbose=False))
    m = lgb.train(params, dtr, num_boost_round=rounds, valid_sets=valid, valid_names=names, callbacks=cbs)
    it = m.best_iteration or rounds
    pred = m.predict(Xpred, num_iteration=it)
    if mode in ("log1p", "sqrt"):
        pred = inverse_y(pred, mode)
    return np.clip(pred, 0, 1), it


def main():
    res = {}
    train = F.add_base_features(pd.read_csv(os.path.join(DATA, "train.csv")))
    test = F.add_base_features(pd.read_csv(os.path.join(DATA, "test.csv")))
    d48 = train[train.day == 48].copy().reset_index(drop=True)
    d49 = train[train.day == 49].copy().reset_index(drop=True)

    modes = ["raw", "log1p", "sqrt", "tweedie", "huber", "wtail"]

    # ---- CV-A ----
    he = F.HistoryEncoder().fit(d48)
    trA = he.transform(d48, use_geo_tod=False); vaA = he.transform(d49, use_geo_tod=True)
    XtrA, ytrA = cast(trA[FEATS]), trA[TARGET].values
    XvaA, yvaA = cast(vaA[FEATS]), vaA[TARGET].values
    tlog("CV-A (predict day49):")
    for md in modes:
        p, _ = fit_predict(XtrA, ytrA, XvaA, yvaA, XvaA, md)
        res.setdefault(md, {})["cvA"] = rmse(yvaA, p)
        tlog(f"  {md:8s} CV-A={res[md]['cvA']:.5f}")

    # ---- CV-B (5-fold geohash OOF) ----
    tlog("CV-B (GroupKFold geohash OOF):")
    groups = d48["geohash"].values; y48 = d48[TARGET].values
    for md in modes:
        oof = np.zeros(len(d48))
        for tri, vai in GroupKFold(5).split(d48, y48, groups):
            tk, vk = d48.iloc[tri], d48.iloc[vai]; ek = F.HistoryEncoder().fit(tk)
            te_, ve_ = ek.transform(tk, False), ek.transform(vk, False)
            p, _ = fit_predict(cast(te_[FEATS]), te_[TARGET].values,
                               cast(ve_[FEATS]), ve_[TARGET].values, cast(ve_[FEATS]), md, rounds=2500)
            oof[vai] = p
        res[md]["cvB"] = rmse(y48, oof)
        tlog(f"  {md:8s} CV-B={res[md]['cvB']:.5f}")

    # rank: prioritise CV-B (tail-faithful) but report both
    tlog("\nRANKING (by CV-B, then CV-A):")
    order = sorted(modes, key=lambda m: (res[m]["cvB"], res[m]["cvA"]))
    for m in order:
        tlog(f"  {m:8s} CV-B={res[m]['cvB']:.5f}  CV-A={res[m]['cvA']:.5f}")
    best = order[0]
    tlog(f"\nBEST target-handling: {best}")

    with open(os.path.join(OUT, "balancing_results.json"), "w") as f:
        json.dump({"results": res, "best": best, "rank": order}, f, indent=2)
    tlog("[written outputs/balancing_results.json]")


if __name__ == "__main__":
    main()
