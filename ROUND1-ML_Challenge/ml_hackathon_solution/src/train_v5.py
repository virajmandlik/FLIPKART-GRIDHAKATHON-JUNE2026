"""
Gridlock 2.0 — v5. DISCIPLINED refactor after leaderboard feedback.

Evidence:
  v1 (single LGBM, 217 rounds)         -> LB 90.791  (best)
  v3 (morning feats + blend)           -> LB 90.678
  v4 (10-seed bag, 175 rounds)         -> LB 90.689
  Neither CV-A nor CV-B predicted LB order. We have NO daytime labels offline,
  so offline CV is a weak proxy and sub-0.1 LB differences are within noise.

The ONLY clean, non-noise difference between v1 (won) and v4 (lost) is rounds:
  v1=217, v4=175 (v4 underfit). Seed-averaging reduces variance and should NOT hurt
  IF rounds match. v5 isolates this:

  A) REPRODUCE v1 EXACTLY -> submission_v5_repro.csv
     (must match submission_lgbm.csv -> proves we can regenerate the 90.79 model)
  B) v5 = v1-EXACT params, ONLY `seed` varied (sub-seeds derived, like v1),
     rounds matched to v1 (217), seed-averaged over N_SEEDS -> submission_v5.csv
     Hypothesis: >= v1 with lower variance.

Run: python ml_hackathon_solution/src/train_v5.py
Env: N_SEEDS (default 7)
"""
from __future__ import annotations
import os, json, time, warnings
import numpy as np
import pandas as pd
import features as F

warnings.filterwarnings("ignore")
T0 = time.time()
def tlog(*a): print(f"[{time.time()-T0:6.1f}s]", *a, flush=True)
import lightgbm as lgb

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE); REPO = os.path.dirname(ROOT)
DATA = os.path.join(REPO, "dataset"); OUT = os.path.join(ROOT, "outputs"); SUB = os.path.join(ROOT, "submissions")
SEED = 42; TARGET = "demand"
N_SEEDS = int(os.environ.get("N_SEEDS", "7"))
FEATS = F.feature_columns(); CAT = F.categorical_columns()


def rmse(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(np.sqrt(np.mean((y - p) ** 2)))

def cast(df):
    df = df.copy()
    for c in CAT: df[c] = df[c].astype("category")
    return df


def v1_params(seed=SEED):
    """EXACT v1 base params (only `seed` set; LightGBM derives the sub-seeds)."""
    return dict(objective="regression", metric="rmse", learning_rate=0.03,
                num_leaves=63, min_child_samples=40, subsample=0.8, subsample_freq=1,
                colsample_bytree=0.8, reg_lambda=2.0, reg_alpha=0.5,
                max_depth=-1, seed=seed, n_jobs=-1, verbose=-1)


def fit(Xtr, ytr, Xva, yva, Xpred, seed=SEED, rounds=4000):
    dtr = lgb.Dataset(Xtr, label=ytr, categorical_feature=CAT, free_raw_data=False)
    valid, names, cbs = [dtr], ["train"], [lgb.log_evaluation(0)]
    if Xva is not None:
        dva = lgb.Dataset(Xva, label=yva, categorical_feature=CAT, reference=dtr, free_raw_data=False)
        valid, names = [dtr, dva], ["train", "valid"]; cbs.append(lgb.early_stopping(150, verbose=False))
    m = lgb.train(v1_params(seed), dtr, num_boost_round=rounds, valid_sets=valid, valid_names=names, callbacks=cbs)
    it = m.best_iteration or rounds
    return m, it, m.predict(Xpred, num_iteration=it)


def main():
    log = {}
    train = F.add_base_features(pd.read_csv(os.path.join(DATA, "train.csv")))
    test = F.add_base_features(pd.read_csv(os.path.join(DATA, "test.csv")))
    d48 = train[train.day == 48].copy(); d49 = train[train.day == 49].copy()

    # CV-A to recover v1's best_iter (=152 -> rounds 217)
    he = F.HistoryEncoder().fit(d48)
    trA, vaA = he.transform(d48, use_geo_tod=False), he.transform(d49, use_geo_tod=True)
    XtrA, ytrA = cast(trA[FEATS]), trA[TARGET].values
    XvaA, yvaA = cast(vaA[FEATS]), vaA[TARGET].values
    _, itA, pA = fit(XtrA, ytrA, XvaA, yvaA, XvaA)
    v1_rounds = int(itA * 1.1) + 50
    tlog(f"CV-A best_iter={itA} -> v1_rounds={v1_rounds}  (CV-A RMSE={rmse(yvaA, np.clip(pA,0,1)):.5f})")
    log["best_iter"] = int(itA); log["v1_rounds"] = v1_rounds

    # build final matrices (identical to v1)
    he_f = F.HistoryEncoder().fit(d48)
    full = pd.concat([he_f.transform(d48, use_geo_tod=False),
                      he_f.transform(d49, use_geo_tod=True)], ignore_index=True)
    tef = he_f.transform(test, use_geo_tod=True)
    Xf, yf = cast(full[FEATS]), full[TARGET].values
    Xte = cast(tef[FEATS])

    # ---- A) reproduce v1 exactly (single seed=42, v1_rounds) ----
    _, _, prepro = fit(Xf, yf, None, None, Xte, seed=SEED, rounds=v1_rounds)
    prepro = np.clip(prepro, 0, 1)
    pd.DataFrame({"Index": test["Index"].values, "demand": prepro}).to_csv(
        os.path.join(SUB, "submission_v5_repro.csv"), index=False)
    tlog(f"REPRO v1: mean={prepro.mean():.5f} (v1 was 0.1308)")

    # compare to the known 90.79 file if present
    p_lgbm = os.path.join(SUB, "submission_lgbm.csv")
    if os.path.exists(p_lgbm):
        old = pd.read_csv(p_lgbm)["demand"].values
        if len(old) == len(prepro):
            diff = float(np.max(np.abs(old - prepro)))
            corr = float(np.corrcoef(old, prepro)[0, 1])
            tlog(f"REPRO vs submission_lgbm.csv: max_abs_diff={diff:.3e}  corr={corr:.6f}")
            log["repro_max_abs_diff"] = diff; log["repro_corr"] = corr

    # ---- B) v5: seed-averaged at MATCHED rounds (v1_rounds) ----
    preds = np.zeros(len(test))
    for s in range(N_SEEDS):
        _, _, pt = fit(Xf, yf, None, None, Xte, seed=SEED + s * 101, rounds=v1_rounds)
        preds += np.clip(pt, 0, 1) / N_SEEDS
        tlog(f"  v5 seed {s} done")
    pd.DataFrame({"Index": test["Index"].values, "demand": preds}).to_csv(
        os.path.join(SUB, "submission_v5.csv"), index=False)
    tlog(f"v5 ({N_SEEDS}-seed avg @ {v1_rounds} rounds): mean={preds.mean():.5f} "
         f"min={preds.min():.4f} max={preds.max():.4f}")

    # how much does averaging move predictions vs the single v1 repro?
    tlog(f"v5 vs repro: max_abs_diff={np.max(np.abs(preds-prepro)):.3e} "
         f"mean_abs_diff={np.mean(np.abs(preds-prepro)):.3e} corr={np.corrcoef(preds,prepro)[0,1]:.6f}")
    log["v5_mean"] = float(preds.mean())

    with open(os.path.join(OUT, "train_v5_log.json"), "w") as f: json.dump(log, f, indent=2)
    tlog("SUMMARY:\n" + json.dumps(log, indent=2))


if __name__ == "__main__":
    main()
