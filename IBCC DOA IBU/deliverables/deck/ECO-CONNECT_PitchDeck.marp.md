---
marp: true
size: 16:9
paginate: true
footer: 'IDSC 2026 IBCC · Preliminary Stage · Team Doa Ibu'
style: |
  section { font-family: 'Times New Roman', serif; font-size: 22px; padding: 40px 56px; color: #1a1a1a; }
  h1 { color: #002B66; font-size: 34px; border-bottom: 2px solid #E4002B; padding-bottom: 6px; }
  h2 { color: #E4002B; font-size: 24px; }
  table { font-size: 19px; width: 100%; }
  th { background: #002B66; color: #fff; }
  .small { font-size: 17px; color: #444; }
---

<!-- _paginate: false -->

![h:44](../../assets/telkomsel_logo.svg) &nbsp;&nbsp;&nbsp; ![h:44](../../assets/idsc_logo.svg)

# ECO-CONNECT
## Turning GraPARI Visits into Digital Value for Telkomsel

Team Doa Ibu · Team leader: Farel Putra Firmansyah · Members: [name], [name]

International Business Case Competition (IBCC) 2026 · FEB Universitas Airlangga

---

# 1. Problem: traffic grows, revenue per user does not

- Data traffic grows 18–25% a year; blended ARPU only moved Rp45,000 → Rp49,000 (Casebook, Exhibit A).
- Market share fell 46% → 44%.
- ~350 GraPARI outlets handle 12–18M walk-in visits a year, about Rp25,000 and 2.0–3.0 kg CO₂e each (Exhibits B–C).
- 55–65% of those transactions are technically eligible for self-service, yet visits persist.

Why: limited digital literacy, weak trust in remote identity checks for SIM replacement, and no reward for choosing digital.

---

# 2. Solution: ECO-CONNECT, three pillars

**Pillar 1 · Veronika for everyone.** Voice and WhatsApp flows in Bahasa Indonesia and regional languages. SIM replacement verified by a liveness check, then eSIM or courier.

**Pillar 2 · Eco-Pass and CyberGuard.** Each digital completion credits avoided emissions and Telkomsel Poin. CyberGuard (anti-scam, family protection) at Rp10,000 per month. Partner brands sponsor rewards.

**Pillar 3 · GraPARI as an experience hub.** Counters move to 24/7 kiosks. Staff become digital advisors for complex cases, seniors, and MSMEs.

---

# 3. Feasibility

- Veronika already runs on Azure OpenAI. Microsoft reports self-service completion rising 19% → 45%, and calls falling from about 8,000 to 1,000 per day (Microsoft Customer Stories, 2024).
- ECO-CONNECT reuses that stack and adds identity verification and a payment-linked reward engine.
- Dependencies: Dukcapil identity API, Core BSS/OSS for eSIM provisioning, kiosk hardware.
- Main technical risks: identity fraud, AI errors. Mitigations on slide 7.

---

# 4. Financials (IDR billion, 10% WACC)

| Line item | Y0 | Y1 | Y2 | Y3 | Y5 |
|---|--:|--:|--:|--:|--:|
| Visits shifted (M) | – | 1.8 | 4.0 | 5.7 | 7.1 |
| GraPARI cost saved | – | 40.5 | 91.2 | 131.8 | 162.2 |
| CyberGuard VAS revenue | – | 60.0 | 150.0 | 240.0 | 300.0 |
| Partner revenue | – | 15.0 | 25.0 | 35.0 | 45.0 |
| CapEx and kiosks | (54.0) | – | (90.0) | (51.0) | (5.0) |
| Program and variable OpEx | – | (29.0) | (42.5) | (54.0) | (63.0) |
| **Net cash flow** | **(54.0)** | **86.5** | **133.7** | **301.8** | **439.2** |

**NPV Rp924 bn · IRR 222% · Payback 0.6 years.**

---

# 5. Business viability: what drives the result

- Largest driver is paid conversion: 5% of 50M MAU by Year 5 is an assumption, not a case figure.
- With 60% of base adoption and 70% of base conversion, NPV is **Rp567 bn**. Still positive.
- Cost saving uses Rp25,000 walk-in vs Rp2,000 digital per interaction (team assumptions).
- Carbon: 2.5 kg vs 0.03 kg CO₂e per shifted visit (Exhibit C midpoints). **62,051 t CO₂e avoided over five years** (14,152 t in Year 3).

---

# 6. Collaboration and implementation fit

- **Digital squad:** MyTelkomsel and WhatsApp flows.
- **AI and network squad:** Azure OpenAI tuning, Core BSS/OSS integration.
- **Retail squad:** kiosk rollout, advisor training for GraPARI staff.
- **ESG function:** Scope 3 accounting and audit of the emission factors.
- **External:** Dukcapil (identity API), Microsoft (Azure OpenAI), partner brands (Eco-Pass rewards).

---

# 7. Execution roadmap and risks

- **Horizon 1 (M1–M6):** WhatsApp SIM replacement pilot, 30 kiosks in Jabodetabek.
- **Horizon 2 (M7–M18):** 200 more kiosks; Eco-Pass and CyberGuard launch nationally.
- **Horizon 3 (M19–M36):** counters converted to advisory hubs.

**Risks:** identity fraud (multi-factor liveness, SIM binding) · low adoption among older customers (assisted kiosks) · AI errors (guardrails, human handoff within 30 seconds) · churn if CyberGuard reads as a surcharge.

---

# 8. Closing and support needed

**ECO-CONNECT turns routine service demand into paid digital value and avoided emissions.**

Support needed from Telkomsel:
1. Executive sponsor across Digital and Retail.
2. Access to the identity API sandbox.
3. Year-1 budget of Rp54 bn.

<span class="small">Assumptions behind every figure are in the executive summary and the model (analysis/model.py).</span>
