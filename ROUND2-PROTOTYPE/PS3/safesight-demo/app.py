"""SafeSight EN - Responsible Edge Enforcement (PROTOTYPE)
Flipkart Gridlock Hackathon 2.0 - Round 2 - Theme 3 (PS3).

A clickable proof-of-concept for automated traffic-violation evidence with:
  detect -> classify -> ANPR -> DPDP privacy blur -> SHA-256 evidence ->
  human review -> BSA certificate -> analytics.

IMPORTANT: Detections are SIMULATED (no ML weights bundled). In production the
detector is RT-DETRv2-S (Apache-2.0) fine-tuned on UVH-26. The evidence
integrity (SHA-256), Indian plate validation, and privacy masking are REAL.
"""
from __future__ import annotations

import io
from datetime import datetime

import pandas as pd
import plotly.express as px
import streamlit as st
from PIL import Image

from core import samples, annotate, evidence
from core.detection import SceneResult, VIOLATION_LABELS, detect_uploaded

st.set_page_config(page_title="SafeSight EN - PS3 Prototype",
                   page_icon="🚦", layout="wide")

# --------------------------------------------------------------------------- #
# Session state
# --------------------------------------------------------------------------- #
if "cases" not in st.session_state:
    st.session_state.cases = {}          # violation_id -> evidence dict
if "seq" not in st.session_state:
    st.session_state.seq = 0
if "review_seconds" not in st.session_state:
    st.session_state.review_seconds = []


def _next_seq() -> int:
    st.session_state.seq += 1
    return st.session_state.seq


def _register_case(ev: dict):
    st.session_state.cases[ev["violation_id"]] = ev


# --------------------------------------------------------------------------- #
# Sidebar
# --------------------------------------------------------------------------- #
with st.sidebar:
    st.title("🚦 SafeSight EN")
    st.caption("Responsible Edge Enforcement · PS3 prototype")
    st.warning("**Prototype / proof-of-concept.** Detections are *simulated* "
               "for the demo. Evidence hashing, plate validation and privacy "
               "blur are real. Production detector: RT-DETRv2-S on UVH-26.")
    st.markdown("**Pipeline**")
    st.markdown("1. Preprocess\n2. Detect & track\n3. Classify violation\n"
                "4. ANPR + RTO regex\n5. DPDP privacy blur\n6. SHA-256 evidence\n"
                "7. Human review\n8. BSA S.63(4) certificate\n9. Analytics")
    st.divider()
    st.metric("Cases in queue", len(st.session_state.cases))

st.title("Automated Traffic-Violation Evidence — SafeSight EN")
st.caption("Flipkart Gridlock Hackathon 2.0 · Round 2 · Theme 3 · Bengaluru Traffic Police")

tab_pipeline, tab_review, tab_analytics, tab_perf, tab_about = st.tabs(
    ["🔍 Detection & Evidence", "🧑‍⚖️ Human Review", "📊 Analytics",
     "📈 Performance", "ℹ️ About / Architecture"]
)


# --------------------------------------------------------------------------- #
# TAB 1 — Detection & Evidence
# --------------------------------------------------------------------------- #
with tab_pipeline:
    left, right = st.columns([1, 1])

    with left:
        st.subheader("1 · Input image")
        source = st.radio("Source", ["Sample junction scene", "Upload my own image"],
                          horizontal=True)

        scene: SceneResult | None = None
        cam_id = "KA-UPLOAD-00"
        location = "Uploaded image"

        if source == "Sample junction scene":
            name = st.selectbox("Sample", list(samples.SAMPLES.keys()))
            img, scene, cam_id, location = samples.get_sample(name)
        else:
            up = st.file_uploader("Upload JPG/PNG", type=["jpg", "jpeg", "png"])
            if up:
                img = Image.open(up).convert("RGB")
                scene = detect_uploaded(samples.image_to_bytes(img))
                st.info("Detections on uploaded images are simulated & deterministic.")
            else:
                img = None

        blur_faces = st.checkbox("Blur faces (DPDP)", value=True)
        blur_plates = st.checkbox("Blur non-violator plates (DPDP)", value=True)
        show_labels = st.checkbox("Show detection labels", value=True)

    with right:
        st.subheader("2 · Detection + privacy-masked evidence")
        if scene is not None and img is not None:
            masked, n_faces, n_plates = annotate.apply_privacy_blur(
                img, scene, blur_faces, blur_plates)
            annotated = annotate.annotate(masked, scene, show_labels)
            st.image(annotated, caption=f"{location} · {cam_id}", width="stretch")
            st.caption(f"Privacy: {n_faces} face(s) and {n_plates} non-violator "
                       f"plate(s) blurred (DPDP Rule 6).")
        else:
            st.info("Pick a sample or upload an image to run the pipeline.")

    if scene is not None and img is not None:
        st.divider()
        st.subheader("3 · Violations detected")
        viols = scene.violators()
        if not viols:
            st.success("No violations detected in this frame.")
        else:
            cols = st.columns(len(viols))
            frame_hash = evidence.sha256_image(annotated)
            captured = datetime.now(evidence.IST)
            for col, d in zip(cols, viols):
                with col:
                    st.markdown(f"**{VIOLATION_LABELS.get(d.violation, d.violation)}**")
                    st.metric("Confidence", f"{d.confidence:.0%}")
                    if d.plate_text:
                        st.code(d.plate_text, language=None)
                    if d.headwear:
                        st.caption(f"Headwear: {d.headwear}")

            st.divider()
            st.subheader("4 · Generate tamper-evident evidence packages")
            st.caption(f"Frame SHA-256: `{frame_hash}`")
            if st.button("📦 Generate evidence & send to review queue", type="primary"):
                added = 0
                for d in viols:
                    ev = evidence.build_evidence(
                        d, camera_id=cam_id, location=location, frame_hash=frame_hash,
                        captured_at=captured, seq=_next_seq(),
                        faces_blurred=n_faces, plates_blurred=n_plates)
                    _register_case(ev)
                    added += 1
                st.success(f"{added} evidence package(s) created and queued for human "
                           f"review. Open the **Human Review** tab.")

            with st.expander("Preview evidence package JSON (first violation)"):
                d0 = viols[0]
                preview = evidence.build_evidence(
                    d0, camera_id=cam_id, location=location, frame_hash=frame_hash,
                    captured_at=captured, seq=0, faces_blurred=n_faces,
                    plates_blurred=n_plates)
                st.json(preview)


# --------------------------------------------------------------------------- #
# TAB 2 — Human review
# --------------------------------------------------------------------------- #
with tab_review:
    st.subheader("Human-in-the-loop review queue")
    st.caption("No challan is auto-issued. An officer approves/rejects each case. "
               "Approval generates a BSA-2023 Section 63(4) certificate.")

    pending = {k: v for k, v in st.session_state.cases.items()
               if v["review"]["status"] == "PENDING"}

    if not pending:
        st.info("Queue empty. Generate evidence from the **Detection & Evidence** tab.")
    else:
        reviewer = st.text_input("Reviewer ID", value="OFFICER-4471")
        for vid, ev in list(pending.items()):
            with st.container(border=True):
                c1, c2, c3 = st.columns([2, 1, 1])
                with c1:
                    st.markdown(f"**{ev['violation_label']}** — `{vid}`")
                    st.caption(f"{ev['location']} · {ev['camera_id']} · "
                               f"{ev['captured_at'][:19].replace('T', ' ')}")
                    plate = ev["vehicle"].get("plate")
                    if plate:
                        ok = "✅" if plate["rto_regex_valid"] else "⚠️"
                        st.write(f"Plate: **{plate['plate_pretty']}** {ok} "
                                 f"({plate['plate_type']})")
                with c2:
                    st.metric("Confidence", f"{ev['confidence']:.0%}")
                    st.caption(f"Faces blurred: {ev['privacy']['faces_blurred']}")
                with c3:
                    note = st.text_input("Note", key=f"note_{vid}",
                                         label_visibility="collapsed",
                                         placeholder="optional note")
                    a, b, c = st.columns(3)
                    if a.button("✅", key=f"ap_{vid}", help="Approve → issue challan"):
                        ev["review"].update(status="APPROVED", reviewer_id=reviewer,
                                            decision_at=datetime.now(evidence.IST).isoformat(),
                                            decision_note=note)
                        ev["bsa_certificate"] = evidence.issue_bsa_certificate(ev, reviewer)
                        st.session_state.review_seconds.append(8)
                        st.rerun()
                    if b.button("❌", key=f"rj_{vid}", help="Reject (false positive)"):
                        ev["review"].update(status="REJECTED", reviewer_id=reviewer,
                                            decision_at=datetime.now(evidence.IST).isoformat(),
                                            decision_note=note or "false positive")
                        st.session_state.review_seconds.append(6)
                        st.rerun()
                    if c.button("🔁", key=f"rc_{vid}", help="Recheck (VLM second opinion)"):
                        ev["review"]["decision_note"] = "Sent to VLM second-opinion (Qwen3-VL)"
                        st.toast("Queued for VLM recheck (simulated).")

    # Decided cases + certificate view
    decided = {k: v for k, v in st.session_state.cases.items()
               if v["review"]["status"] in ("APPROVED", "REJECTED")}
    if decided:
        st.divider()
        st.subheader("Decided cases")
        for vid, ev in decided.items():
            icon = "✅" if ev["review"]["status"] == "APPROVED" else "❌"
            with st.expander(f"{icon} {vid} — {ev['review']['status']} "
                             f"({ev['violation_label']})"):
                st.json(ev["review"])
                if ev["bsa_certificate"]:
                    st.markdown("**BSA-2023 Section 63(4) certificate**")
                    st.json(ev["bsa_certificate"])
                st.download_button("⬇️ Download evidence JSON",
                                   evidence.evidence_to_json(ev),
                                   file_name=f"{vid}.json", mime="application/json",
                                   key=f"dl_{vid}")


# --------------------------------------------------------------------------- #
# TAB 3 — Analytics
# --------------------------------------------------------------------------- #
with tab_analytics:
    st.subheader("Enforcement analytics")
    cases = list(st.session_state.cases.values())
    if not cases:
        st.info("No data yet. Generate and review some cases first.")
    else:
        df = pd.DataFrame([{
            "violation": c["violation_label"],
            "camera": c["camera_id"],
            "location": c["location"],
            "confidence": c["confidence"],
            "status": c["review"]["status"],
        } for c in cases])

        reviewed = df[df["status"].isin(["APPROVED", "REJECTED"])]
        false_rate = (len(reviewed[reviewed["status"] == "REJECTED"]) / len(reviewed) * 100
                      if len(reviewed) else 0.0)
        avg_review = (sum(st.session_state.review_seconds) /
                      len(st.session_state.review_seconds)
                      if st.session_state.review_seconds else 0.0)

        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Total cases", len(df))
        m2.metric("Approved", int((df["status"] == "APPROVED").sum()))
        m3.metric("False-challan rate", f"{false_rate:.0f}%",
                  help="Rejected / reviewed. The KPI BTP cares about most.")
        m4.metric("Avg review time", f"{avg_review:.0f}s")

        c1, c2 = st.columns(2)
        with c1:
            fig = px.bar(df["violation"].value_counts().reset_index(),
                         x="violation", y="count", title="Violations by type",
                         color="violation")
            fig.update_layout(showlegend=False)
            st.plotly_chart(fig, width='stretch')
        with c2:
            fig2 = px.histogram(df, x="confidence", nbins=10,
                                title="Detection confidence distribution")
            st.plotly_chart(fig2, width='stretch')

        fig3 = px.bar(df.groupby(["location", "status"]).size().reset_index(name="n"),
                      x="location", y="n", color="status",
                      title="Cases by junction & status", barmode="stack")
        st.plotly_chart(fig3, width='stretch')

        st.dataframe(df, width='stretch')


# --------------------------------------------------------------------------- #
# TAB 4 — Performance (PS3 lines 32-34)
# --------------------------------------------------------------------------- #
with tab_perf:
    st.subheader("Performance evaluation methodology (PS3 §8)")
    st.markdown(
        "PS3 requires evaluation via **Accuracy, Precision, Recall, F1-score, mAP** "
        "plus **computational efficiency & scalability**. These are *computed* by "
        "running the detector on a **labelled** validation split — they are not "
        "shipped in this prototype. Below are the target metrics and the cited "
        "literature benchmarks we will reproduce on UVH-26 during the finale."
    )

    bench = pd.DataFrame([
        {"Model": "RT-DETRv2-S (target)", "mAP@.5:.95": 0.52, "License": "Apache-2.0",
         "Note": "Edge-friendly, AGPL-free"},
        {"Model": "RT-DETR-X (UVH-26 paper)", "mAP@.5:.95": 0.70, "License": "Apache-2.0",
         "Note": "IISc UVH-26 benchmark"},
        {"Model": "YOLOv11-S (reference)", "mAP@.5:.95": 0.47, "License": "AGPL-3.0 ⚠️",
         "Note": "Procurement risk for govt"},
    ])
    st.dataframe(bench, width='stretch')

    st.markdown("**Evaluation plan**")
    st.markdown(
        "- Dataset: **UVH-26** (IISc, real Bengaluru CCTV) val split with ground-truth boxes.\n"
        "- Detection: mAP@0.5 and mAP@0.5:0.95 (COCO protocol).\n"
        "- Per-violation classifier: Accuracy / Precision / Recall / F1 (confusion matrix).\n"
        "- ANPR: character + full-plate accuracy after RTO-regex correction.\n"
        "- **False-challan rate** (operational KPI) via human-review audit.\n"
        "- Efficiency: FPS + latency on **Jetson Orin Nano Super (TensorRT INT8)**.\n"
        "- Scalability: throughput per node × node count (edge-first → sub-linear cloud cost)."
    )
    st.info("During Round 2 (idea phase) we cite published benchmarks; during the "
            "finale we reproduce them on UVH-26 using free GPU (Colab/Kaggle).")


# --------------------------------------------------------------------------- #
# TAB 5 — About
# --------------------------------------------------------------------------- #
with tab_about:
    st.subheader("About this prototype")
    st.markdown(
        "**SafeSight EN** is an India-first, legally-defensible, edge-deployable "
        "computer-vision enforcement pipeline for Bengaluru Traffic Police.\n\n"
        "What makes it different from a generic YOLO detector:\n"
        "- **Privacy by design** — faces & non-violator plates blurred at the edge (DPDP 2023).\n"
        "- **Legally admissible** — SHA-256 frame hashing + BSA-2023 §63(4) certificate.\n"
        "- **Culturally adaptive** — Helmet / **Pagdi** / No-helmet (MV Act §129 exemption).\n"
        "- **Procurement-clean** — Apache-2.0 model stack (RT-DETRv2), avoids AGPL YOLO trap.\n"
        "- **Operational fit** — human-in-the-loop, ASTraM/e-Challan integration, edge-first.\n"
        "- **False-challan rate** as the headline KPI, not just mAP."
    )
    st.markdown("**Architecture & approach docs:** `PS3_FULL_APPROACH.md`, "
                "`PS3_WINNING_PLAYBOOK.md`, `PS3_DEPLOYMENT_ARCHITECTURE.md`.")
    st.caption("Prototype detections are simulated. Evidence integrity, plate "
               "validation, and privacy masking are real, runnable code.")

