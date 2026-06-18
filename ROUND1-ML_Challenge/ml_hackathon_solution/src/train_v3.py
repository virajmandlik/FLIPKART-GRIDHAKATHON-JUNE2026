"""
Gridlock 2.0 — v3. Adds the LEAKAGE-FREE "same-day morning anchor" lever on top
of the proven base, then seed-averaged LightGBM + CatBoost blend.

KEY IDEA: the organizers give day-49's first 2 hours (00:00-02:00) in TRAIN.
For each test row (day-49, 02:15-13:45) we therefore KNOW how busy that cell was
this morning -> a same-day level anchor. This is observed-at-inference data, so it
is fully legal. We compute it with leave-one-out on morning rows to avoid any
same-row leakage.

New features:
  morning_mean : same-day morning (tod<=120) mean demand per geohash (LOO on train)
  day_shift    : day49_morning_mean / day48_morning_mean per geohash (level change)
  scaled_lag   : geo_tod_mean(day48 @ same time) * day_shift  (analog-day, recalibrated)

Run: python ml_hackathon_solution/src/train_v3.py
Env: N_SEEDS (default 3)
"""
from __future__ import annotations
import os, json, time, warnings
import numpy as np
import pandas as pd
import train_v2 as v2  # reuse add_base, Encoder, fit_lgbm, fit_cat, FEATS, CAT, cast, rmse

warnings.filterwarnings("ignore")
T0 = time.time()
def tlog(*a): print(f"[{time.time()-T0:6.1f}s]", *a, flush=True)

DATA, SUB, OUT = v2.DATA, v2.SUB, v2.OUT
TARGET, SEED = "demand", 42
N_SEEDS = int(os.environ.get("N_SEEDS", "3"))
MORNING_MAX = 120  # day-49 is observed through tod=120 (02:00)

FEATS3 = v2.FEATS + ["morning_mean", "day_shift", "scaled_lag"]
CAT = v2.CAT
rmse, cast = v2.rmse, v2.cast


def add_morning(train: pd.DataFrame, test: pd.DataFrame):
    """Attach morning_mean (LOO on train) + day_shift to train & test frames."""
    m = train[train.tod <= MORNING_MAX]
    agg = (m.groupby(["day", "geohash"])[TARGET]
           .agg(mS="sum", mC="count").reset_index())
    agg["mmean"] = agg.mS / agg.mC
    # per-geohash morning mean for each day -> day_shift
    piv = agg.pivot_table(index="geohash", columns="day", values="mmean")
    piv.columns = [f"m_day{int(c)}" for c in piv.columns]
    d48col = "m_day48" if "m_day48" in piv.columns else None
    d49col = "m_day49" if "m_day49" in piv.columns else None
    piv["day_shift"] = (piv[d49col] / piv[d48col]) if (d48col and d49col) else np.nan
    piv["m_day48_fill"] = piv[d48col] if d48col else np.nan
    shift = piv[["day_shift", "m_day48_fill"]].reset_index()

    gmean = float(train[TARGET].mean())

    def attach(df, is_train):
        o = df.merge(agg[["day", "geohash", "mS", "mC"]], on=["day", "geohash"], how="left")
        o["morning_mean"] = o.mS / o.mC
        if is_train:
            morning_row = o["tod"] <= MORNING_MAX
            loo = (o["mS"] - o[TARGET]) / (o["mC"] - 1)
            o.loc[morning_row, "morning_mean"] = loo[morning_row]
        o = o.merge(shift, on="geohash", how="left")
        # backoff: morning_mean -> day48 morning -> global
        o["morning_mean"] = o["morning_mean"].fillna(o["m_day48_fill"]).fillna(gmean)
        o["day_shift"] = o["day_shift"].fillna(1.0).clip(0.2, 5.0)
        return o.drop(columns=["mS", "mC", "m_day48_fill"])

    return attach(train, True), attach(test, False)


def build(enc, df, cross_day):
    """Encode + add scaled_lag, return feature matrix carrying morning cols."""
    o = enc.transform(df, cross_day=cross_day)
    # morning_mean / day_shift rode along from df through the left-merges
    o["scaled_lag"] = (o["geo_tod_mean"] * o["day_shift"])
    o["scaled_lag"] = o["scaled_lag"].fillna(o["geo_tod_mean"])
    return o


def main():
    log = {}
    train = v2.add_base(pd.read_csv(os.path.join(DATA, "train.csv")))
    test = v2.add_base(pd.read_csv(os.path.join(DATA, "test.csv")))
    train, test = add_morning(train, test)
    d48 = train[train.day == 48].copy().reset_index(drop=True)
    d49 = train[train.day == 49].copy().reset_index(drop=True)
    tlog(f"day48={len(d48)} day49={len(d49)} test={len(test)}  feats={len(FEATS3)}")

    # ---------- CV-A (lag/morning sanity; night-biased, secondary) ----------
    enc = v2.Encoder().fit(d48)
    trA, vaA = build(enc, d48, False), build(enc, d49, True)
    XtrA, ytrA = cast(trA[FEATS3]), trA[TARGET].values
    XvaA, yvaA = cast(vaA[FEATS3]), vaA[TARGET].values
    _, itA, pL = v2.fit_lgbm(XtrA, ytrA, XvaA, yvaA, XvaA)
    rL = rmse(yvaA, pL); tlog(f"CV-A LGBM(+morning)={rL:.5f} (it={itA})")
    log["cvA_lgbm"] = rL
    pC = None
    if v2.HAVE_CAT:
        try:
            _, _, pC = v2.fit_cat(XtrA, ytrA, XvaA, yvaA, XvaA, rounds=3000)
            tlog(f"CV-A CatBoost(+morning)={rmse(yvaA, pC):.5f}")
            log["cvA_cat"] = rmse(yvaA, pC)
        except Exception as e:
            tlog("cat CV-A err", e)

    # blend weights on CV-A val
    w = (1.0, 0.0)
    if pC is not None:
        best = rL; bw = (1.0, 0.0)
        for a in np.linspace(0, 1, 51):
            r = rmse(yvaA, a * pL + (1 - a) * pC)
            if r < best: best, bw = r, (a, 1 - a)
        w = bw; tlog(f"CV-A blend weights lgbm/cat={np.round(w,3)} -> {best:.5f}")
        log["cvA_blend"] = best

    # ---------- CV-B (cold-start sanity; primary proxy) ----------
    from sklearn.model_selection import GroupKFold
    gkf = GroupKFold(5); groups = d48["geohash"].values
    oof = np.zeros(len(d48))
    for k, (tri, vai) in enumerate(gkf.split(d48, d48[TARGET], groups)):
        tk, vk = d48.iloc[tri], d48.iloc[vai]
        ek = v2.Encoder().fit(tk)
        te_, ve_ = build(ek, tk, False), build(ek, vk, False)
        _, _, p = v2.fit_lgbm(cast(te_[FEATS3]), te_[TARGET].values,
                              cast(ve_[FEATS3]), ve_[TARGET].values,
                              cast(ve_[FEATS3]), rounds=2500)
        oof[vai] = p
    tlog(f"CV-B OOF LGBM(+morning)={rmse(d48[TARGET].values, oof):.5f}")
    log["cvB_lgbm"] = rmse(d48[TARGET].values, oof)

    # ---------- FINAL: seed-averaged blend on day48+day49 ----------
    tlog("Final fit (day48+day49), seed-averaged blend, predict test")
    encf = v2.Encoder().fit(d48)
    f48, f49 = build(encf, d48, False), build(encf, d49, True)
    full = pd.concat([f48, f49], ignore_index=True)
    tef = build(encf, test, True)
    Xf, yf = cast(full[FEATS3]), full[TARGET].values
    Xte = cast(tef[FEATS3])
    rounds_l = int(itA * 1.15) + 60

    pl = np.zeros(len(test))
    for s in range(N_SEEDS):
        _, _, pt = v2.fit_lgbm(Xf, yf, None, None, Xte, rounds=rounds_l, seed=SEED + s)
        pl += pt / N_SEEDS
    tlog("lgbm final done")
    pc = None
    if v2.HAVE_CAT and w[1] > 0:
        pc = np.zeros(len(test))
        for s in range(max(2, N_SEEDS - 1)):
            _, _, pt = v2.fit_cat(Xf, yf, None, None, Xte, rounds=900, seed=SEED + s)
            pc += pt / max(2, N_SEEDS - 1)
        tlog("cat final done")

    ptest = pl if pc is None else (w[0] * pl + w[1] * pc)
    ptest = np.clip(ptest, 0, 1)
    sub = pd.DataFrame({"Index": test["Index"].values, "demand": ptest})
    path = os.path.join(SUB, "submission_v3.csv"); sub.to_csv(path, index=False)
    tlog(f"wrote {path} rows={len(sub)}")
    tlog(f"pred: min={ptest.min():.4f} mean={ptest.mean():.4f} max={ptest.max():.4f} (train mean={yf.mean():.4f})")

    # importance
    mexp, _, _ = v2.fit_lgbm(XtrA, ytrA, XvaA, yvaA, XvaA)
    imp = pd.DataFrame({"feature": mexp.feature_name(), "gain": mexp.feature_importance("gain")}).sort_values("gain", ascending=False)
    imp.to_csv(os.path.join(OUT, "lgbm_v3_importance.csv"), index=False)
    tlog("top features:\n" + imp.head(18).to_string(index=False))
    with open(os.path.join(OUT, "train_v3_log.json"), "w") as f: json.dump(log, f, indent=2)
    tlog("SUMMARY:\n" + json.dumps(log, indent=2))


if __name__ == "__main__":
    main()
