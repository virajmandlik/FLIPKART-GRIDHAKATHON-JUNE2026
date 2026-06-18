# Reproducing `submission_BC.csv` in Google Colab

This guide reproduces the **exact** winning prediction file `submission_BC.csv`
(evaluation score **91.25092**, where score = `100 * (1 - RMSE)`) using
`reproduce.py` in a free Google Colab notebook.

`reproduce.py` is a single, self-contained, **deterministic** script. It reads
`train.csv` and `test.csv`, rebuilds model **B** (feature-enhanced LightGBM,
seeds 42–47, 437 rounds) and model **C** (`0.406 * LightGBM[217 rounds] +
0.594 * XGBoost[geohash dropped, 259 rounds]`, seeds 42/143/244/345), averages
them 50/50, clips to `[0, 1]`, and writes `submission_BC.csv`
(**41778 rows**, columns `Index,demand`). All seeds are fixed, so the output is
byte-for-byte reproducible on the same library versions.

> A ready-to-run notebook version of this guide is provided as
> `Gridlock_Reproduce_Colab.ipynb` — you can upload that to Colab instead of
> following the steps manually.

---

## How `reproduce.py` finds the data (read this first)

The script locates the dataset by probing these directories **in order**, where
`HERE` is the folder containing `reproduce.py`:

1. `HERE/../dataset`   (the original repo layout: `HACKATHON/dataset`)
2. `HERE/dataset`      (a `dataset/` folder **next to** `reproduce.py`)
3. `.`                 (the current working directory)
4. `dataset`           (`./dataset` relative to the working directory)
5. `/content`          (Colab's default working directory)
6. `/content/dataset`  (a `dataset/` folder under `/content`)

It uses the **first** directory that contains **both** `train.csv` and
`test.csv`. If none match, it falls back to `google.colab.files.upload()` and
then reads `train.csv` / `test.csv` from the current directory.

**Output location:** `submission_BC.csv` is written **next to `reproduce.py`**
(not to the working directory). In Colab, if you upload `reproduce.py` to
`/content/` (the default), the output will be `/content/submission_BC.csv`.

### Recommended Colab layout

Put `reproduce.py` in `/content/` and the two CSVs in `/content/dataset/`:

```
/content/
├── reproduce.py
└── dataset/
    ├── train.csv
    └── test.csv
```

This satisfies probe rules **#2** (`HERE/dataset`) and **#6**
(`/content/dataset`) at the same time, and the output lands at
`/content/submission_BC.csv`. (Putting the CSVs directly in `/content/`
alongside `reproduce.py` also works, via probe rules **#3**/**#5**.)

---

## Step 1 — Create a new Colab notebook

1. Go to [colab.research.google.com](https://colab.research.google.com).
2. **File → New notebook**.
3. A **CPU** runtime is fine — no GPU is required. (Optional: `Runtime →
   Change runtime type → CPU`.)

---

## Step 2 — Get the files into Colab

You need three files: `reproduce.py`, `train.csv`, and `test.csv`. Choose **one**
of the two options below.

### Option A — Upload the files (simplest)

Run this in a code cell, then pick all three files (`reproduce.py`,
`train.csv`, `test.csv`) in the upload dialog:

```python
from google.colab import files
uploaded = files.upload()   # select reproduce.py, train.csv, test.csv
```

The files land in `/content/`. Now move the CSVs into a `dataset/` folder so
the layout matches what the script expects:

```python
!mkdir -p /content/dataset
!mv /content/train.csv /content/test.csv /content/dataset/ 2>/dev/null || true
!ls -la /content /content/dataset
```

> You can also drag-and-drop the three files into the **Files** pane on the
> left (folder icon) instead of using `files.upload()`. If you do that, still
> run the `mkdir`/`mv` cell above to create `/content/dataset/`.

### Option B — Mount Google Drive

If your files already live in Drive (e.g. in a folder
`MyDrive/gridlock/`), mount Drive and copy them into the expected layout:

```python
from google.colab import drive
drive.mount('/content/drive')

# Adjust this path to wherever your files are in Drive:
SRC = '/content/drive/MyDrive/gridlock'

!mkdir -p /content/dataset
!cp "{SRC}/reproduce.py" /content/reproduce.py
!cp "{SRC}/train.csv" /content/dataset/train.csv
!cp "{SRC}/test.csv"  /content/dataset/test.csv
!ls -la /content /content/dataset
```

---

## Step 3 — (Optional) Install dependencies

`reproduce.py` **auto-installs** any missing packages when it runs, so this step
is usually unnecessary. If you'd rather install them up front (or the auto-install
is blocked in your environment), run:

```python
!pip install numpy pandas scikit-learn lightgbm xgboost
```

Colab already ships with `numpy`, `pandas`, and `scikit-learn`; typically only
`lightgbm` / `xgboost` (if anything) get installed.

---

## Step 4 — Run the reproducer

```python
!python /content/reproduce.py
```

What to expect:

- Runtime is short — typically a **couple of minutes** on a Colab CPU runtime.
- You'll see timestamped progress lines, e.g. the data directory it picked,
  `B seed 42 done … 47 done`, the `C LGBM`/`C XGB` seeds, and finally
  `wrote /content/submission_BC.csv rows=41778`.
- The line `verify: no reference file found -- skipping comparison` is **normal**
  in Colab — there's no reference winner file present, so it simply skips the
  optional self-check. The predictions are still the exact reproduced result.

---

## Step 5 — Sanity-check the output

Because all seeds are fixed, the regenerated file is identical to the
**91.25092** submission. Verify the basic invariants:

```python
import pandas as pd
sub = pd.read_csv('/content/submission_BC.csv')
print('rows:', len(sub))                 # expect 41778
print('columns:', list(sub.columns))     # expect ['Index', 'demand']
print('demand min/max:', sub['demand'].min(), sub['demand'].max())  # within [0, 1]
print('any NaN:', sub.isna().any().any())                            # expect False
sub.head()
```

Expected: `rows: 41778`, columns `['Index', 'demand']`, `demand` values inside
`[0, 1]`, and no missing values.

---

## Step 6 — Download `submission_BC.csv`

```python
from google.colab import files
files.download('/content/submission_BC.csv')
```

(If your browser blocks the auto-download, you can also right-click the file in
the **Files** pane → **Download**.)

---

## Troubleshooting

- **`FileNotFoundError: train.csv / test.csv not found.`**
  The script couldn't find the data in any probed directory. Confirm the layout:
  ```python
  !ls -la /content /content/dataset
  ```
  You should see `reproduce.py` in `/content/` and both CSVs in
  `/content/dataset/`. If not, re-run the `mkdir`/`mv` (or `cp`) cell from
  Step 2. Note the script writes output **next to `reproduce.py`** — keep
  `reproduce.py` in `/content/` so the output is at `/content/submission_BC.csv`.

- **Output isn't where I expected.**
  `submission_BC.csv` is written to the directory that contains `reproduce.py`.
  If you uploaded `reproduce.py` somewhere other than `/content/`, look there,
  and adjust the `files.download(...)` path accordingly.

- **Library version differences / "it doesn't match elsewhere".**
  Determinism holds for a given set of library versions. The auto-installer pulls
  the current `numpy / pandas / scikit-learn / lightgbm / xgboost`. To reproduce
  the exact bytes the original run produced, match the versions documented in
  `requirements.txt`. The model, seeds, round counts, and blend weights are all
  baked into `reproduce.py`, so the result is stable on a consistent environment.

- **GPU vs CPU.**
  No GPU is needed — the script runs entirely on CPU. A standard Colab CPU
  runtime is the recommended (and tested) environment.

- **Re-running.**
  Re-running `reproduce.py` overwrites `submission_BC.csv` with the identical
  result. Safe to run multiple times.
