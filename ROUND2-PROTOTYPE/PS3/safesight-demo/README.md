# SafeSight EN — PS3 Prototype Demo

Clickable proof-of-concept for **Flipkart Gridlock Hackathon 2.0 · Round 2 · Theme 3 (PS3)** —
*Automated Photo Identification & Classification for Traffic Violations*.

> **Prototype notice:** object detections are **simulated** (no ML weights are bundled, so it
> runs anywhere with zero GPU). The **evidence integrity (SHA-256), Indian RTO plate validation,
> and DPDP privacy blurring are real, runnable code**. In production the detector is
> **RT-DETRv2-S (Apache-2.0)** fine-tuned on **UVH-26**. See `../PS3_DEPLOYMENT_ARCHITECTURE.md`.

## What it demonstrates (full PS3 pipeline)

`Detect → Classify violation → ANPR + RTO regex → DPDP privacy blur → SHA-256 evidence → Human review → BSA §63(4) certificate → Analytics`

Tabs: **Detection & Evidence**, **Human Review**, **Analytics**, **Performance** (PS3 §8 methodology), **About / Architecture**.

## Run locally

```bash
pip install -r requirements.txt
python -m streamlit run app.py
```

Open the URL it prints (default http://localhost:8501). No models, no datasets, no GPU needed.

## Deploy free (gives you the required public Demo Link)

**Streamlit Community Cloud** (recommended, free, ~3 min):

1. Push this `safesight-demo/` folder to a **public GitHub repo**.
2. Go to https://share.streamlit.io → *New app* → pick the repo/branch.
3. Set **Main file path** = `app.py`. Click **Deploy**.
4. You get a public URL like `https://<your-app>.streamlit.app` → paste it into the **Demo Link** field.

Alternative free host: **Hugging Face Spaces** (SDK = Streamlit), same files.

## Tech

- Python · Streamlit · Pillow · pandas · plotly (all OSS, no OpenCV → installs on any Python incl. 3.14).
- `core/plates.py` — real Indian plate validation (classic + Bharat series, OCR-confusion fixes).
- `core/evidence.py` — real SHA-256 hashing + BSA-2023 §63(4) certificate generation.
- `core/annotate.py` — Pillow annotation + DPDP face/plate blurring.
- `core/detection.py`, `core/samples.py` — simulated detections + synthetic junction scenes.

## Suggested submission-form text

**Title:** SafeSight EN — Responsible Edge Enforcement for Bengaluru Traffic

**Demo Link:** *(your Streamlit Cloud URL)*

**Instructions to Run:**
```
pip install -r requirements.txt
python -m streamlit run app.py
# Or just open the hosted Demo Link. Pick a sample junction scene →
# "Generate evidence" → Human Review tab → Approve to issue a BSA certificate →
# Analytics tab for KPIs (incl. false-challan rate).
```

> Detections are simulated for the prototype; evidence hashing, plate validation, and privacy
> blurring are fully functional. Production detector: RT-DETRv2-S (Apache-2.0) on UVH-26.
