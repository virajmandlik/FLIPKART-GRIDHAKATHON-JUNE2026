"""
Gridlock 2.0 — v4. REVERT to the proven v1 recipe (LB 90.791) and improve it ONLY
with low-risk, bias-preserving techniques:

  * EXACT v1 feature set (features.py) — no night->day extrapolation, no ratios.
  * Seed-averaged LightGBM bagging (variance reduction; matches-or-beats single model).
  * Mild bagging (subsample) per seed for decorrelation.

Why: v3's extra features (day_shift / scaled_lag / morning anchor) LOWERED the LB
(90.678) because they extrapolate night signal onto the daytime test and were never
truly exercised by CV-B (which runs within day 48 with cross-day features = NaN).
The honest, reliable win over v1 is seed-averaging the same model.

Run: python ml_hackathon_solution/src/train_v4.py
Env: N_SEEDS (default 10)
"""
from __future__ import annotations
import os, json, time, warnings
import numpy as np
import pandas as pd
import features as F  # v1 feature set: HistoryEncoder, feature_columns, categorical_columns

warnings.filterwarnings("ignore")
T0 = time.time()
def tlog(*a): print(f"[{time.time()-T0:6.1f}s]", *a, flush=True)

import lightgbm as lgb

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE); REPO = os.path.dirname(ROOT)
DATA = os.path.join(REPO, "dataset"); OUT = os.path.join(ROOT, "outputs"); SUB = os.path.join(ROOT, "submissions")
os.makedirs(SUB, exist_ok=True)

SEED = 42
TARGET = "demand"
N_SEEDS = int(os.environ.get("N_SEEDS", "10"))
FEATS = F.feature_columns()
CAT = F.categorical_columns()


def rmse(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(np.sqrt(np.mean((y - p) ** 2)))


def cast(df):
    df = df.copy()
    for c in CAT: df[c] = df[c].astype("category")
    return df


def fit_lgbm(Xtr, ytr, Xva, yva, Xpred, rounds=5000, seed=SEED):
    p = dict(objective="regression", metric="rmse", learning_rate=0.03, num_leaves=63,
             min_child_samples=40, subsample=0.8, subsample_freq=1, colsample_bytree=0.8,
             reg_lambda=2.0, reg_alpha=0.5, seed=seed, bagging_seed=seed,
             feature_fraction_seed=seed, n_jobs=-1, verbose=-1)
    dtr = lgb.Dataset(Xtr, ytr, categorical_feature=CAT, free_raw_data=False)
    valid, names, cbs = [dtr], ["train"], [lgb.log_evaluation(0)]
    if Xva is not None:
        dva = lgb.Dataset(Xva, yva, categorical_feature=CAT, reference=dtr, free_raw_data=False)
        valid, names = [dtr, dva], ["train", "valid"]; cbs.append(lgb.early_stopping(150, verbose=False))
    m = lgb.train(p, dtr, num_boost_round=rounds, valid_sets=valid, valid_names=names, callbacks=cbs)
    it = m.best_iteration or rounds
    return m, it, np.clip(m.predict(Xpred, num_iteration=it), 0, 1)


def main():
    log = {}
    train = F.add_base_features(pd.read_csv(os.path.join(DATA, "train.csv")))
    test = F.add_base_features(pd.read_csv(os.path.join(DATA, "test.csv")))
    d48 = train[train.day == 48].copy(); d49 = train[train.day == 49].copy()
    tlog(f"day48={len(d48)} day49={len(d49)} test={len(test)} feats={len(FEATS)}")

    # CV-A to fix the iteration count (same as v1)
    he = F.HistoryEncoder().fit(d48)
    trA = he.transform(d48, use_geo_tod=False); vaA = he.transform(d49, use_geo_tod=True)
    XtrA, ytrA = cast(trA[FEATS]), trA[TARGET].values
    XvaA, yvaA = cast(vaA[FEATS]), vaA[TARGET].values
    _, itA, pA = fit_lgbm(XtrA, ytrA, XvaA, yvaA, XvaA)
    tlog(f"CV-A LGBM={rmse(yvaA, pA):.5f} (it={itA})")
    log["cvA_lgbm"] = rmse(yvaA, pA); log["best_it"] = int(itA)

    # FINAL: seed-averaged bagging on day48+day49 (identical features to v1)
    he_f = F.HistoryEncoder().fit(d48)
    d48_f = he_f.transform(d48, use_geo_tod=False)
    d49_f = he_f.transform(d49, use_geo_tod=True)
    full = pd.concat([d48_f, d49_f], ignore_index=True)
    test_f = he_f.transform(test, use_geo_tod=True)
    Xf, yf = cast(full[FEATS]), full[TARGET].values
    Xte = cast(test_f[FEATS])
    rounds = int(itA * 1.10) + 50

    preds = np.zeros(len(test))
    for s in range(N_SEEDS):
        _, _, pt = fit_lgbm(Xf, yf, None, None, Xte, rounds=rounds, seed=SEED + s * 101)
        preds += pt / N_SEEDS
        tlog(f"  seed {s} done")
    preds = np.clip(preds, 0, 1)

    sub = pd.DataFrame({"Index": test["Index"].values, "demand": preds})
    path = os.path.join(SUB, "submission_v4.csv"); sub.to_csv(path, index=False)
    tlog(f"wrote {path} rows={len(sub)}")
    tlog(f"pred: min={preds.min():.4f} mean={preds.mean():.4f} max={preds.max():.4f} "
         f"(v1 mean was ~0.1308; aim to stay close)")
    log["pred_mean"] = float(preds.mean())
    with open(os.path.join(OUT, "train_v4_log.json"), "w") as f: json.dump(log, f, indent=2)
    tlog("SUMMARY:\n" + json.dumps(log, indent=2))


if __name__ == "__main__":
    main()
