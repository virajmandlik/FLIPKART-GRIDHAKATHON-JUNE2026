# Gridlock Hackathon 2.0 — Winning Playbook + Judging Research

**Author lane:** "Hackathon Winning Playbook + Judging"
**Date:** 2026-06-18 · **Deadline context:** Round 2 prototype due 2026-06-21 23:59 IST (~3 days)
**Method note:** Findings below are evidence-based with URLs. Where Flipkart/Gridlock-specific data did not exist, I generalize from comparable HackerEarth / smart-city / govtech hackathons and **say so explicitly**. No winners or links are fabricated.

---

## 0. Quick TL;DR (read this first)

- The finale explicitly requires a **working prototype demo + comprehensive presentation**, judged on **robustness, innovation, prototype clarity, scalability, real-world viability** ([official site](https://gridlock2point0.hackerearth.com/)).
- The jury is a **mixed govt + tech panel** (BTP leadership / ASTraM + Flipkart). Govt jurors reward **feasibility, deployability, fit into existing workflows, measurable impact**; tech jurors reward **innovation, technical depth, scalability** (see §4).
- Prizes appear to be **3 overall awards (not per-theme)** — top 10 overall → finale → top 3 overall (§7).
- For a solo builder in 3 days, **presentation/demo/video quality is the differentiator**, not raw code volume. "A mediocre project with an amazing pitch beats an amazing project with a mediocre pitch" ([ainna.ai](https://ainna.ai/resources/faq/winning-hackathon-guide)).

---

## 1. Flipkart hackathon history — who wins & what they build

### 1a. Gridlock Hackathon 1.0 (2017) — the most relevant precedent
The original "Gridlock Hackathon" ran in 2017 during Flipkart's 10th-anniversary "Month of Innovation," crowdsourcing **implementable** traffic ideas ([HackerEarth page](https://www.hackerearth.com/challenges/hackathon/flipkart-hackathon/), [Times of India](https://timesofindia.indiatimes.com/city/bengaluru/gridlock-hackathon-sparks-smart-solutions-to-traffic-woes/articleshow/59560282.cms)).

| Place | Team | Idea | Why it won |
|---|---|---|---|
| Winner | **Affine Anonymous** | On-demand AI traffic signals (green for longer pileup), fed by Google/Bing maps data | Ran a **real pilot at Silk Board Junction → 17% wait-time reduction**; "does not require major investment" |
| Runner-up | **By2Rides** | Carpooling / ride-sharing | Practical, citizen-scale |
| 3rd | **Eurus** | App-based Road Smoothness Detector (potholes/humps), crowd-sourced for govt use | Gives authorities qualitative road data |

- **Jury (2017):** Binny Bansal (Flipkart Group CEO) + Sridhar Pabbisetty (CEO, Namma Bengaluru Foundation) + **Abhishek Goyal, DCP Traffic (East)** — i.e., a **Flipkart + civic + police** mix, same pattern as 2.0. Prize pool then was ₹3,50,000 ([ToI](https://timesofindia.indiatimes.com/city/bengaluru/gridlock-hackathon-gives-smart-solutions-to-end-traffic-woes/articleshow/59537266.cms)).
- **Decisive signal:** the winner brought **on-ground pilot evidence and a quantified metric** and stressed **low cost / implementability**. Organizers then formed a committee with NBF to **take solutions forward** — they cared about real deployment, not just demos.

### 1b. Flipkart GRiD (campus flagship; different format, still instructive)
GRiD is Flipkart's national student hackathon (Software Dev, Robotics, InfoSec tracks; 5L+ registrations in 6.0) judged by **Flipkart domain experts/engineers** at an HQ grand finale ([Unstop case study](https://unstop.com/blog/flipkart-grid-case-study-how-an-online-hackathon-helped-flipkart-cast-a-wider-net-amongst-budding-engineers), [Unstop how-to-win](https://unstop.com/blog/how-to-win-flipkart-grid)).
- Documented winner example: **GRiD 6.0 InfoSec national winners** built **API Security Management with a custom dashboard** — a clean, demoable, product-shaped tool, not a research paper ([LinkedIn winner post](https://www.linkedin.com/posts/ayush-chandram_flipkartgrid-hackathonwinners-infosec-activity-7240349597028491265-iDzl)).
- Tier-2/3 college teams have won repeatedly → **judges reward the solution, not the pedigree** ([Unstop case study](https://unstop.com/blog/flipkart-grid-case-study-how-an-online-hackathon-helped-flipkart-cast-a-wider-net-amongst-budding-engineers)).
- GRiD prizes are **per-track**; Gridlock 2.0's public page lists only 3 overall prizes (see §7 — different model, don't assume per-theme).

---

## 2. What the organizers (BTP/ASTraM) actually value — your secret weapon

The jury is **Bengaluru Traffic Police leadership + Flipkart** ([official site](https://gridlock2point0.hackerearth.com/)). BTP already runs a sophisticated AI stack called **ASTraM** (built with Arcadis). Aligning your prototype to **how ASTraM already works** is the single biggest "flatter the jury" lever.

What ASTraM is/does (use this vocabulary in your deck):
- **Big-data platform launched Jan 2024**; collates **9,000 police cameras** + cab aggregators + map providers + public transport ([The Hindu](https://www.thehindu.com/news/cities/bangalore/btp-astram-app-a-one-stop-platform-for-all-commuter-needs-launched/article69155838.ece)).
- Core features: **congestion alerts to field officers every 15 min**, **incident reporting (BOT app)**, **special-event management**, **dashboard analytics**, **congestion prediction**, **ambulance green corridors (e-Path)** ([The Hindu launch](https://www.thehindu.com/news/cities/bangalore/bengaluru-traffic-police-launch-astram-initiative-for-enhanced-traffic-management/article67737199.ece), [Arcadis](https://www.arcadis.com/en/projects/asia/india/actionable-intelligence-for-sustainable-traffic-management)).
- **Open data**: incidents shared as **API** for any map service → they love **interoperable, shareable outputs** ([Arcadis](https://www.arcadis.com/en/projects/asia/india/actionable-intelligence-for-sustainable-traffic-management)).
- Building a **city-scale Mobility Digital Twin** to simulate events (e.g., a concert at BIEC → alert BMTC for feeder buses) → they value **simulation + proactive manpower planning** ([The Hindu](https://www.thehindu.com/news/cities/bangalore/btp-astram-app-a-one-stop-platform-for-all-commuter-needs-launched/article69155838.ece), [Analytics India Mag](https://analyticsindiamag.com/ai-features/when-ai-meets-bengaluru-traffic-this-knight-is-in-control)).
- Already **exploring CCTV-based violation detection** + student violation reporting; signal AI via C-DAC tool. JCP Anucheth's caveat: **"If infrastructure is not in place, no amount of AI is going to solve the bottleneck"** → don't over-promise; show realism ([Analytics India Mag](https://analyticsindiamag.com/ai-features/when-ai-meets-bengaluru-traffic-this-knight-is-in-control)).

**Implication:** Frame your output as **"actionable intelligence for the field officer"** — alerts, hotspots, deployment recommendations, an API/dashboard — i.e., a feature that **slots into ASTraM**, not a parallel universe.

---

## 3. The official judging rubric (Gridlock 2.0)

From the official site ([gridlock2point0.hackerearth.com](https://gridlock2point0.hackerearth.com/)):

| Phase | What judges evaluate |
|---|---|
| **Phase 2 (Prototype, online)** | "Feasibility, relevance, innovation and real-world impact" — by an **expert panel** |
| **Phase 3 (Onsite finale)** | "Solution **robustness, innovation, prototype clarity, scalability, and real-world viability** for Bengaluru's traffic" — working prototype demo + full presentation |

Exact percentage weightings are **not published** for Gridlock 2.0 (check the HackerEarth "How will submissions be evaluated?" FAQ for any update). Note the rubric is **impact/feasibility-heavy**, not pure-tech.

### Typical HackerEarth weightings (benchmark when exact weights unknown)
HackerEarth lets each organizer set weights; common patterns ([Elastic](https://elastic.hackerearth.com/challenges/hackathon/elastics-hackathon/custom-tab/judging-criteria/), [UST D3CODE](https://www.hackerearth.com/challenges/hackathon/ust-d3code-campus-hackathon24/custom-tab/evaluation-criteria/), [MOSIP CREATE](https://www.hackerearth.com/challenges/hackathon/mosip-create/custom-tab/evaluation-criteria/)):

| Criterion | Typical range |
|---|---|
| Innovation/Creativity | 15–40% |
| Technical Implementation | 20–30% |
| Impact | 15–30% |
| Feasibility & Scalability | 10–30% |
| UX / Aesthetics | 10–15% |
| Presentation/Communication | 10% |

HackerEarth's classic **prototype rubric** (UST D3CODE) is a good proxy for Phase 2: **Completeness of working prototype 40%**, Scope 25%, UX 15%, Aesthetics 10%, "Wow factors" 10% → **a bug-free happy-path demo is the dominant scoring lever**.

---

## 4. Govt/police jury vs. tech jury — what each rewards

This panel is **dual-audience**. You must satisfy both. Evidence from govtech/smart-city programs:

| Dimension | **Police/Govt (BTP) values** | **Tech company (Flipkart) values** |
|---|---|---|
| Primary lens | **Mission risk reduction**, operational reality, "does it fit my officers' workflow?" ([energizegtm](https://energizegtm.com/govtech-pilot-window-federal-ai-saas/), [GovTech Lab Ukraine](https://itukraine.org.ua/en/govtech-lab-ukraine-selects-three-startups-to-pilot-digital-solutions-in-the-public-sector/)) | Technical depth, novelty, architecture, **scalability** |
| Impact | **Tangible, measurable** (e.g., −X% wait time, faster response, fewer manual reviews) | Scale potential, "could this be a product/startup?" |
| Feasibility | **Bounded pilot**, clear success metrics, timeline, low burden on staff, data/privacy readiness ([energizegtm](https://energizegtm.com/govtech-pilot-window-federal-ai-saas/), [innovate4cities](https://www.innovate4cities.org/hackathon2025/)) | Clean engineering, reproducibility, sensible stack |
| Data | Uses **real data** (ASTraM), respects data governance | Good ML/eval methodology, no leakage, honest metrics |
| "Wow" | A working thing officers could **actually use Monday** | Elegant solution to a hard problem |
| Turn-offs | Buzzwords, over-promising, ignoring infra constraints | Broken demo, hand-wavy tech, hard-coded everything with no path to scale |

Govt jurors consistently "prioritize feasibility and tangible impact over conceptual novelty" and reward **bounded pilots with measurable success metrics and a deployment path** ([GovTech Lab Ukraine](https://itukraine.org.ua/en/govtech-lab-ukraine-selects-three-startups-to-pilot-digital-solutions-in-the-public-sector/), [energizegtm](https://energizegtm.com/govtech-pilot-window-federal-ai-saas/), [innovate4cities](https://www.innovate4cities.org/hackathon2025/)). India's MoSPI hackathon SOP also scores on **problem understanding, innovation, technical feasibility, data methodology, UI/UX**, with explicit **pilot-implementation framing** ([MoSPI SOP PDF](https://mospi.gov.in/sites/default/files/announcements/Standard%20Operating%20Procedure%28SOP%29%20for%20Conducting%20Hackathon.pdf)).

**Winning move:** open and close with the **police/operational story**; use a **"pilot proposal" slide** (scope, metric, timeline, data needs, low cost) — the exact thing the 2017 winner did (Silk Board pilot, 17%, "no major investment").

---

## 5. What makes a prototype/demo/deck WIN (and why strong teams lose)

### Win factors (consistent across sources)
- **Story > features.** Spend ~30% on problem, 70% on solution; make judges *feel* the pain with one specific user/scenario before the tech ([ainna.ai](https://ainna.ai/resources/faq/winning-hackathon-guide), [Medium: 90% lose](https://koustavx08.medium.com/hackathons-arent-coding-competitions-here-s-why-90-of-teams-lose-2d9960dee6d1)).
- **One bulletproof "golden path."** A simple working demo beats a feature-rich broken one. **Mock/hard-code unstable external calls** so the live demo never crashes ([Medium playbook](https://medium.com/@kartikeypandey.official/the-hackathon-playbook-what-actually-works-2fda3c1004ba), [Medium: 90% lose](https://koustavx08.medium.com/hackathons-arent-coding-competitions-here-s-why-90-of-teams-lose-2d9960dee6d1)).
- **Clarity in 15 seconds.** Judges see many projects; a one-line hook in the first 30s wins attention ([slidemodel](https://slidemodel.com/hackathon-presentation/), [inknarrates](https://www.inknarrates.com/post/hackathon-pitch-deck)).
- **Narrative spine:** Problem → Why now → Demo → Impact → Ask/Roadmap ([ainna.ai](https://ainna.ai/resources/faq/winning-hackathon-guide)).
- **Show the "day after."** Judges (esp. govt) want to see you thought about deployment/scale, not just the weekend ([Medium: 90% lose](https://koustavx08.medium.com/hackathons-arent-coding-competitions-here-s-why-90-of-teams-lose-2d9960dee6d1), [Colosseum](https://blog.colosseum.com/perfecting-your-hackathon-submission/)).
- **Tailor to the panel.** Lead with operational/impact framing for BTP, technical depth/scale for Flipkart ([Medium playbook](https://medium.com/@kartikeypandey.official/the-hackathon-playbook-what-actually-works-2fda3c1004ba)).

### Why strong teams LOSE
- Over-scoping; building login/CRUD plumbing instead of the core "wow" ([Medium: 90% lose](https://koustavx08.medium.com/hackathons-arent-coding-competitions-here-s-why-90-of-teams-lose-2d9960dee6d1)).
- Treating the pitch as a technical defense / jargon dump; vague problem statement ([slidemodel](https://slidemodel.com/hackathon-presentation/), [inknarrates](https://www.inknarrates.com/post/hackathon-pitch-deck)).
- **Under-investing in presentation/video** ("90% on code, rush the video") ([ElevenHacks](https://hacks.elevenlabs.io/guide)).
- Broken demo; perfectionism over progress; forgetting to grant judges access to repo/video/docs ([ainna.ai](https://ainna.ai/resources/faq/winning-hackathon-guide), [Colosseum](https://blog.colosseum.com/perfecting-your-hackathon-submission/)).

---

## 6. Realistic "winning submission package" for a 1-person team in 3 days

> Note: the public Gridlock 2.0 page mentions teams of up to 4; per the shared brief, **you are solo**. Solo is allowed at this caliber of hackathon, but you must compensate with ruthless scope-cutting and **polish**. Solo founders should explicitly state why they're suited to build it ([Colosseum](https://blog.colosseum.com/perfecting-your-hackathon-submission/)).

The bar (from convergent sources):

| Asset | Realistic bar | Notes |
|---|---|---|
| **Working prototype** | ONE end-to-end golden path, runs reliably, ideally a clickable dashboard/map on **real ASTraM data** | Completeness of happy path is the top scoring lever ([UST rubric](https://www.hackerearth.com/challenges/hackathon/ust-d3code-campus-hackathon24/custom-tab/evaluation-criteria/)) |
| **Demo video** | **~2 min hard cap** (≤90s of actual demo). Hook in 5s → problem 15–20s → product in action 60–75s → impact/roadmap 15–20s. Screen recording, clear audio, captions | Spend **≥half your time** on the submission/video, not just code ([ElevenHacks](https://hacks.elevenlabs.io/guide), [FutureStack tips](https://www.ajeetraina.com/top-5-tips-to-win-the-futurestack-genai-hackathon/), [video-production.md](https://github.com/ghiyaayush/bunkermode/blob/main/docs/video-production.md)) |
| **Pitch deck** | 8–12 slides, one idea per slide, Problem→Why now→Demo→Impact(metric)→Feasibility/Pilot→Scale/Roadmap→Ask | Distinct from technical docs; designed for a tired panel ([slidemodel](https://slidemodel.com/hackathon-presentation/), [inknarrates](https://www.inknarrates.com/post/hackathon-pitch-deck)) |
| **Repo hygiene** | Clean README (1-line value prop on top, setup steps, stack, screenshots/GIFs, architecture, limitations), **visible commit history**, runnable | First thing judges open; commit history proves real work ([FutureStack tips](https://www.ajeetraina.com/top-5-tips-to-win-the-futurestack-genai-hackathon/), [README template](https://www.learnist.org/vibe-coding-project-readme-template/)) |
| **Impact metric** | At least one quantified, defensible number (e.g., "flags X% of illegal-parking congestion hotspots", "cuts manual review time by Y") | Mirrors the 2017 winner's "17% at Silk Board" |
| **Pilot slide** | Scope + success metric + timeline + data/infra needs + low cost | The govt-jury clincher (§4) |

**3-day allocation (suggested):** Day 1 lock scope + build core path on real data; Day 2 finish golden path + dashboard polish + start deck; Day 3 freeze code, record video, finish deck + README, rehearse pitch ≥5×. Reserve the **last ~40%** of total effort for submission polish.

---

## 7. Strategic angle — theme choice & prize structure

### Prize structure signal
The official page lists **only three prizes — 1st ₹2,25,000 / 2nd ₹1,75,000 / 3rd ₹1,00,000 — and a single Top-10 finale pool**, with no per-theme breakdown ([official site](https://gridlock2point0.hackerearth.com/)). **Most likely interpretation: prizes are OVERALL across all 3 themes** (top 10 overall → top 3 overall), unlike Flipkart GRiD's per-track model. **Confirm via the HackerEarth FAQ "How will submissions be evaluated?"** before betting on it.

**Consequence:** a less-crowded theme raises your odds of **reaching the top 10**, but the final ranking is **cross-theme** — so within your chosen theme you must also be best-in-class on impact + demo.

### Theme-by-theme read (inference, flagged as such)
| Theme | Crowding (est.) | Demo-ability | BTP/ASTraM fit | Verdict |
|---|---|---|---|---|
| **PS1 — Parking-intelligence hotspots + congestion impact** (~298k rows) | Medium | **High** (rich dataset → maps/dashboard/quantified hotspots) | Strong — matches ASTraM **congestion analytics & hotspot** focus | **Strong pick**; easy to produce a hard impact metric |
| **PS2 — Event-driven congestion forecast + manpower/barricading/diversion** (~8.2k Astram event rows) | **Likely lower** (smallest dataset, more domain-specific) | High (forecast + recommendation UI) | **Strongest** — directly mirrors ASTraM **special-event management + digital-twin manpower planning** that BTP is actively building | **Best "flatter-the-police-jury" pick** if you can handle the small/specialized data |
| **PS3 — CV traffic-violation detection (IDEA-ONLY)** | **Likely highest** (no build barrier) | **Low for finale** — idea-only, but finale demands a **working prototype demo** | BTP is exploring CCTV violations, but already has C-DAC/vendors | **Riskiest** to win the cash: hard to differentiate among many ideas and weak for a working-demo finale |

**Bottom line on strategy:**
- If you want **best odds + a wow demo**, choose **PS1 or PS2** (both produce a tangible, real-data prototype the finale rewards). **PS2 best flatters the BTP operational mindset** (manpower/diversion = their job); **PS1 is the safest for a clean quantified demo**.
- **PS3 (idea-only)** is the weakest path to prize money here because the finale explicitly scores a **working prototype demo** ([official site](https://gridlock2point0.hackerearth.com/)) — pick it only if you'd build a working CV prototype anyway and lean hard on a live demo.
- Whatever you pick, **package it as an ASTraM-compatible feature** (alerts/hotspots/recommendations + API/dashboard) and bring a **pilot proposal + one quantified metric**.

*(Crowding estimates are reasoned inference — there is no public per-theme submission count. Validate by checking the HackerEarth discussion tab / leaderboard if available.)*

---

## TOP 7 ACTIONABLE TAKEAWAYS

1. **Build for the BTP field officer, not the judge's eyebrow.** Frame your prototype as an **ASTraM-compatible feature** (congestion hotspots, alerts, manpower/diversion recommendations, an API/dashboard) — use their own vocabulary (ASTraM, congestion alerts, special-event management, digital twin) ([Arcadis](https://www.arcadis.com/en/projects/asia/india/actionable-intelligence-for-sustainable-traffic-management), [The Hindu](https://www.thehindu.com/news/cities/bangalore/btp-astram-app-a-one-stop-platform-for-all-commuter-needs-launched/article69155838.ece)).
2. **Bring ONE quantified impact metric + a "pilot proposal" slide** (scope, metric, timeline, data needs, low cost). This is exactly what won Gridlock 1.0 ("17% wait reduction at Silk Board, no major investment") and what govt jurors reward ([ToI](https://timesofindia.indiatimes.com/city/bengaluru/gridlock-hackathon-sparks-smart-solutions-to-traffic-woes/articleshow/59560282.cms), [energizegtm](https://energizegtm.com/govtech-pilot-window-federal-ai-saas/)).
3. **One bulletproof golden-path demo > broad-but-broken.** Mock/hard-code anything flaky; rehearse the live demo so it never crashes — broken demos kill strong projects ([Medium: 90% lose](https://koustavx08.medium.com/hackathons-arent-coding-competitions-here-s-why-90-of-teams-lose-2d9960dee6d1), [ainna.ai](https://ainna.ai/resources/faq/winning-hackathon-guide)).
4. **Spend ≥40–50% of remaining time on the submission package** (2-min video, deck, README), not just code. A great video + deck on a decent build beats a great build with a weak pitch ([ElevenHacks](https://hacks.elevenlabs.io/guide), [FutureStack](https://www.ajeetraina.com/top-5-tips-to-win-the-futurestack-genai-hackathon/)).
5. **Use the dual-jury narrative spine:** open + close with the **police/operational story and impact** (for BTP), put **technical depth + scalability** in the middle (for Flipkart). Problem → Why now → Demo → Impact → Pilot → Scale → Ask ([Medium playbook](https://medium.com/@kartikeypandey.official/the-hackathon-playbook-what-actually-works-2fda3c1004ba), [slidemodel](https://slidemodel.com/hackathon-presentation/)).
6. **Choose PS1 or PS2, not PS3, to win cash.** The finale demands a **working prototype**; idea-only PS3 is hardest to differentiate and weakest to demo. **PS2 best flatters the police jury** (manpower/diversion = ASTraM event management); **PS1 is the safest clean quantified demo** ([official site](https://gridlock2point0.hackerearth.com/)).
7. **Assume overall (cross-theme) prizes + mandatory in-person finale.** Verify the per-theme question in the HackerEarth FAQ, ensure judges can access your repo/video/docs, and confirm you can attend Flipkart HQ on **July 3, 2026** (in-person attendance is required to stay prize-eligible) ([official site](https://gridlock2point0.hackerearth.com/)).

---

### Sources (primary)
- Gridlock 2.0 official: https://gridlock2point0.hackerearth.com/
- Gridlock 1.0 (2017) HackerEarth + ToI coverage: https://www.hackerearth.com/challenges/hackathon/flipkart-hackathon/ · https://timesofindia.indiatimes.com/city/bengaluru/gridlock-hackathon-sparks-smart-solutions-to-traffic-woes/articleshow/59560282.cms
- ASTraM / BTP: https://www.arcadis.com/en/projects/asia/india/actionable-intelligence-for-sustainable-traffic-management · https://www.thehindu.com/news/cities/bangalore/btp-astram-app-a-one-stop-platform-for-all-commuter-needs-launched/article69155838.ece · https://analyticsindiamag.com/ai-features/when-ai-meets-bengaluru-traffic-this-knight-is-in-control
- HackerEarth rubrics: Elastic, UST D3CODE, MOSIP CREATE (linked inline above)
- Govt/pilot framing: GovTech Lab Ukraine, energizegtm, innovate4cities, MoSPI SOP (linked inline above)
- Pitch/demo/video/repo: ainna.ai, Medium (Koustav Singh; Kartikey Pandey), slidemodel, inknarrates, ElevenHacks, FutureStack, Colosseum (linked inline above)
- Flipkart GRiD: Unstop case study + how-to-win; GRiD 6.0 InfoSec winner LinkedIn (linked inline above)
