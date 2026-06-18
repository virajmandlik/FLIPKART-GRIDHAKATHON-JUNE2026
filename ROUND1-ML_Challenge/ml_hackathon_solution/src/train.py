"""
Train + validate + submit for Gridlock 2.0 traffic demand prediction.

Validation protocol (see STRATEGY.md):
  CV-A (primary): fit history on day 48 -> predict day-49 train rows (mirrors test).
  CV-B (spatial): GroupKFold by geohash on day 48 (cold-start generalization).
Final: train on day48 + day49-train, predict day-49 test, clip to [0,1].

Run: python ml_hackathon_solution/src/train.py
"""
from __future__ import annotations

import json
import os
import warnings

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold

import features as F

warnings.filterwarnings("ignore")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.dirname(ROOT)
DATA = os.path.join(REPO, "dataset")
OUT = os.path.join(ROOT, "outputs")
SUB = os.path.join(ROOT, "submissions")
os.makedirs(OUT, exist_ok=True)
os.makedirs(SUB, exist_ok=True)

SEED = 42
TARGET = "demand"
CAT = F.categorical_columns()
FEATS = F.feature_columns()


def rmse(y, p):
    y = np.asarray(y, dtype=float)
    p = np.asarray(p, dtype=float)
    return float(np.sqrt(np.mean((y - p) ** 2)))


def cast_cats(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for c in CAT:
        df[c] = df[c].astype("category")
    return df


def lgbm_fit_predict(Xtr, ytr, Xva, yva, Xpred_list, params=None, num_round=4000):
    import lightgbm as lgb

    base = dict(
        objective="regression", metric="rmse", learning_rate=0.03,
        num_leaves=63, min_child_samples=40, subsample=0.8, subsample_freq=1,
        colsample_bytree=0.8, reg_lambda=2.0, reg_alpha=0.5,
        max_depth=-1, seed=SEED, n_jobs=-1, verbose=-1,
    )
    if params:
        base.update(params)
    dtr = lgb.Dataset(Xtr, label=ytr, categorical_feature=CAT, free_raw_data=False)
    valid_sets, valid_names = [dtr], ["train"]
    if Xva is not None:
        dva = lgb.Dataset(Xva, label=yva, categorical_feature=CAT, reference=dtr,
                          free_raw_data=False)
        valid_sets, valid_names = [dtr, dva], ["train", "valid"]
    callbacks = [lgb.log_evaluation(0)]
    if Xva is not None:
        callbacks.append(lgb.early_stopping(150, verbose=False))
    model = lgb.train(base, dtr, num_boost_round=num_round,
                      valid_sets=valid_sets, valid_names=valid_names, callbacks=callbacks)
    best_it = model.best_iteration or num_round
    preds = [model.predict(X, num_iteration=best_it) for X in Xpred_list]
    return model, best_it, preds


def main():
    log = {}
    train = pd.read_csv(os.path.join(DATA, "train.csv"))
    test = pd.read_csv(os.path.join(DATA, "test.csv"))

    train = F.add_base_features(train)
    test = F.add_base_features(test)

    d48 = train[train.day == 48].copy()
    d49 = train[train.day == 49].copy()
    print(f"day48={len(d48)}  day49-train={len(d49)}  test={len(test)}")

    # ---------------------------------------------------------- BASELINES (CV-A)
    print("\n=== BASELINES on CV-A (fit day48, predict day49-train) ===")
    he = F.HistoryEncoder().fit(d48)
    d49_enc = he.transform(d49, use_geo_tod=True)
    yA = d49[TARGET].values
    b_global = rmse(yA, np.full(len(yA), d48[TARGET].mean()))
    b_tod = rmse(yA, d49_enc["tod_mean"].values)
    b_yesterday = rmse(yA, d49_enc["geo_tod_mean"].values)  # day48 same cell+time
    print(f"  global-mean   RMSE: {b_global:.5f}")
    print(f"  tod-mean      RMSE: {b_tod:.5f}")
    print(f"  YESTERDAY     RMSE: {b_yesterday:.5f}  <-- bar to beat")
    log["baselines_cvA"] = {"global": b_global, "tod_mean": b_tod, "yesterday": b_yesterday}

    # ---------------------------------------------------------- LGBM CV-A
    print("\n=== LightGBM CV-A ===")
    he = F.HistoryEncoder().fit(d48)
    tr_enc = he.transform(d48, use_geo_tod=False)   # day48: no prior day -> geo_tod NaN
    va_enc = he.transform(d49, use_geo_tod=True)    # day49: geo_tod = day48 lag
    Xtr, ytr = cast_cats(tr_enc[FEATS]), tr_enc[TARGET].values
    Xva, yva = cast_cats(va_enc[FEATS]), va_enc[TARGET].values
    model_A, best_it_A, (pA,) = lgbm_fit_predict(Xtr, ytr, Xva, yva, [Xva])
    pA = np.clip(pA, 0, 1)
    cvA = rmse(yva, pA)
    print(f"  LightGBM CV-A RMSE: {cvA:.5f}  (best_iter={best_it_A})")
    log["lgbm_cvA"] = {"rmse": cvA, "best_iter": int(best_it_A)}

    # ---------------------------------------------------------- LGBM CV-B (spatial)
    print("\n=== LightGBM CV-B (GroupKFold by geohash on day48) ===")
    gkf = GroupKFold(n_splits=5)
    oof = np.zeros(len(d48))
    groups = d48["geohash"].values
    for k, (tri, vai) in enumerate(gkf.split(d48, d48[TARGET], groups)):
        tr_k, va_k = d48.iloc[tri], d48.iloc[vai]
        he_k = F.HistoryEncoder().fit(tr_k)
        tr_e = he_k.transform(tr_k, use_geo_tod=False)
        va_e = he_k.transform(va_k, use_geo_tod=False)  # unseen geohashes -> cold start
        Xtr_k, ytr_k = cast_cats(tr_e[FEATS]), tr_e[TARGET].values
        Xva_k, yva_k = cast_cats(va_e[FEATS]), va_e[TARGET].values
        _, _, (pk,) = lgbm_fit_predict(Xtr_k, ytr_k, Xva_k, yva_k, [Xva_k], num_round=2000)
        oof[vai] = np.clip(pk, 0, 1)
        print(f"  fold{k} RMSE: {rmse(yva_k, oof[vai]):.5f}")
    cvB = rmse(d48[TARGET].values, oof)
    print(f"  LightGBM CV-B OOF RMSE: {cvB:.5f}")
    log["lgbm_cvB"] = {"oof_rmse": cvB}

    # ---------------------------------------------------------- FINAL FIT + SUBMIT
    print("\n=== FINAL: train day48+day49, predict test ===")
    he_f = F.HistoryEncoder().fit(d48)  # history from prior day (day48)
    d48_e = he_f.transform(d48, use_geo_tod=False)
    d49_e = he_f.transform(d49, use_geo_tod=True)
    test_e = he_f.transform(test, use_geo_tod=True)
    full = pd.concat([d48_e, d49_e], ignore_index=True)
    Xf, yf = cast_cats(full[FEATS]), full[TARGET].values
    Xtest = cast_cats(test_e[FEATS])
    # use the CV-A best iteration (validated) to set rounds; no val here
    model_f, _, (ptest,) = lgbm_fit_predict(
        Xf, yf, None, None, [Xtest], num_round=int(best_it_A * 1.1) + 50)
    ptest = np.clip(ptest, 0, 1)

    sub = pd.DataFrame({"Index": test["Index"].values, "demand": ptest})
    sub_path = os.path.join(SUB, "submission_lgbm.csv")
    sub.to_csv(sub_path, index=False)
    print(f"  wrote {sub_path}  rows={len(sub)}")
    print(f"  pred stats: min={ptest.min():.4f} mean={ptest.mean():.4f} "
          f"max={ptest.max():.4f}  (train mean={yf.mean():.4f})")
    log["submission"] = {"rows": len(sub), "pred_mean": float(ptest.mean())}

    # feature importance
    imp = pd.DataFrame({
        "feature": model_f.feature_name(),
        "gain": model_f.feature_importance("gain"),
    }).sort_values("gain", ascending=False)
    imp.to_csv(os.path.join(OUT, "lgbm_importance.csv"), index=False)
    print("\n  top features by gain:")
    print(imp.head(15).to_string(index=False))

    with open(os.path.join(OUT, "train_log.json"), "w") as f:
        json.dump(log, f, indent=2)
    print("\n[done] log -> outputs/train_log.json")


if __name__ == "__main__":
    main()
