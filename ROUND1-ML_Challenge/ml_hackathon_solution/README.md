# ML Hackathon Solution Workspace

This is a self-contained workspace. All analysis, code, and artifacts for the
hackathon solution live here and are independent of anything else in the repo.

## Status

**WAITING FOR INPUTS.** No modeling has started. Per the agreed workflow, modeling
will not begin until all of the following are provided:

1. Problem Statement
2. Dataset (train / test files)
3. Sample Submission
4. Evaluation Metric
5. Additional Context (rules, constraints, deadlines, allowed libraries)

## Folder Structure

```
ml_hackathon_solution/
├── data/            # raw + processed datasets (drop train/test/sample here)
│   ├── raw/
│   └── processed/
├── notebooks/       # Colab-ready notebooks (EDA, modeling, submission)
├── src/             # modular production-grade Python (pipelines, features, models)
├── outputs/         # EDA reports, SHAP plots, CV logs, model artifacts
├── submissions/     # generated submission files
└── requirements.txt # pinned dependencies for reproducibility
```

## Planned Workflow (will execute once inputs arrive)

1. **Problem Understanding** — task type, target, metric optimization, constraints.
2. **Deep EDA** — missingness, outliers, imbalance, distributions, categoricals,
   correlations, duplicates, train/test drift, and aggressive leakage detection.
3. **Validation Strategy** — pick and justify (StratifiedKFold / GroupKFold /
   TimeSeriesSplit / Nested CV) to match the data-generating process.
4. **Feature Engineering** — aggregations, interactions, target/frequency encoding,
   datetime features, text embeddings if needed, scaling where required.
5. **Model Selection** — XGBoost, LightGBM, CatBoost, RF, Logistic/Linear, NN if useful.
6. **Hyperparameter Optimization** — Optuna with CV, guarding against overfitting.
7. **Ensembling** — blend / stack / weighted average, only if CV improves.
8. **Explainability** — SHAP, feature importance, error analysis.
9. **Final Pipeline** — end-to-end Colab-ready training + inference + submission.

## Reproducibility Principles

- Fixed global seeds; deterministic splits.
- Out-of-fold (OOF) predictions for honest CV estimates.
- No target leakage: all encoders/scalers fit inside CV folds only.
- Pinned dependency versions in `requirements.txt`.
