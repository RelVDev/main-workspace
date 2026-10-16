#set document(title: "Team Doa Ibu - ECO-CONNECT Executive Summary", author: "Team Doa Ibu")

#set page(
  paper: "a4",
  margin: (left: 3cm, right: 3cm, top: 3cm, bottom: 3cm),
  header: [
    #grid(columns: (1fr, 1fr), align: (left + horizon, right + horizon),
      image("/assets/telkomsel_logo.svg", height: 18pt),
      image("/assets/idsc_logo.svg", height: 18pt))
    #v(-4pt)
    #line(length: 100%, stroke: 0.5pt)
  ],
  footer: context [
    #line(length: 100%, stroke: 0.5pt)
    #v(-4pt)
    #set text(font: "Times New Roman", size: 9pt)
    IDSC 2026 IBCC – Preliminary Stage | Team Doa Ibu #h(1fr) Page #counter(page).display("1 of 1", both: true)
  ],
)

#set text(font: "Times New Roman", size: 12pt, lang: "en")
#set par(justify: true, leading: 0.5em, spacing: 0.6em)

#let h(t) = text(weight: "bold", size: 12pt)[#t]
#let small(body) = text(size: 10pt, body)

#align(center)[
  #text(weight: "bold", size: 13pt)[ECO-CONNECT: Turning GraPARI Visits into Digital Value for Telkomsel] \
  #text(size: 11pt, style: "italic")[Team Doa Ibu · Team leader: [name] · Members: [name], [name], [name]]
]

#h[1. Problem: Traffic is growing, revenue per user is not]

Telkomsel's data traffic grows 18–25% a year while blended ARPU moved only from Rp45,000 to Rp49,000, and share fell from 46% to 44% (Casebook, Exhibit A). The company runs about 350 GraPARI outlets that handle roughly 12–18 million walk-in visits a year, at an estimated Rp25,000 per visit and 2.0–3.0 kg CO₂e per visit, mostly from customer travel (Exhibits B–C). The case states that 55–65% of these transactions are technically eligible for self-service, yet visits persist. We attribute this to three frictions: limited digital literacy, weak trust in remote identity checks for SIM replacement, and no reward for choosing digital.

The question is how to move eligible visits to MyTelkomsel and Veronika, lift paid digital services, and cut emissions, without building a new channel.

#h[2. Solution: ECO-CONNECT, three pillars]

#small[
  *Pillar 1 – Veronika for everyone.* Voice and WhatsApp flows in Bahasa Indonesia and regional languages, so customers can finish common tasks without downloading an app. Remote SIM replacement is verified through a liveness check against national identity data, with eSIM delivery or courier dispatch.

  *Pillar 2 – Eco-Pass and CyberGuard.* An in-app counter credits each digital completion with avoided emissions and pays Telkomsel Poin. CyberGuard, a paid anti-scam and family-protection add-on, is priced at Rp10,000 per month. Partner brands sponsor Eco-Pass rewards.

  *Pillar 3 – GraPARI as an experience hub.* Routine counters move to 24/7 self-service kiosks. Staff are retrained as digital advisors for complex cases, seniors, and MSMEs. Floor space is used for IndiHome and 5G demonstrations.
]

#h[3. Feasibility]

#small[
  Veronika already runs on Azure OpenAI and reported self-service completion rising from 19% to 45% and calls falling from about 8,000 to 1,000 per day (Microsoft, 2024). ECO-CONNECT reuses that stack and adds identity verification and a payment-linked reward engine. Dependencies are the Dukcapil identity API, Core BSS/OSS provisioning for eSIM, and kiosk hardware.
]

#h[4. Financials (IDR billion, 10% WACC)]

#table(
  columns: (3.1fr, 1fr, 1fr, 1fr, 1fr, 1fr),
  align: (left, right, right, right, right, right),
  stroke: 0.4pt,
  inset: 3pt,
  table.header([*Line item*], [*Y0*], [*Y1*], [*Y2*], [*Y3*], [*Y5*]),
  [Visits shifted from GraPARI (M)], [–], [1.8], [4.0], [5.7], [7.1],
  [GraPARI cost saved], [–], [40.5], [91.2], [131.8], [162.2],
  [CyberGuard VAS revenue], [–], [60.0], [150.0], [240.0], [300.0],
  [Partner revenue], [–], [15.0], [25.0], [35.0], [45.0],
  [Gross benefit], [–], [115.5], [266.2], [406.8], [507.2],
  [CapEx and kiosks], [(54.0)], [–], [(90.0)], [(51.0)], [(5.0)],
  [Program and variable OpEx], [–], [(29.0)], [(42.5)], [(54.0)], [(63.0)],
  [*Net cash flow*], [*(54.0)*], [*86.5*], [*133.7*], [*301.8*], [*439.2*],
)

#small[
  *NPV* Rp924 bn · *IRR* 222% · *Payback* 0.6 years (about 7 months) · *Cumulative CO₂e avoided* 62,051 t over five years (14,152 t in Year 3).

  Assumptions: 14.7M baseline visits (350 outlets × 115 per day); 60% eligible; adoption 20%→80%; Rp25,000 walk-in cost vs Rp2,000 digital; 2.5 kg vs 0.03 kg CO2e per interaction; 5% of 50M MAU paying Rp10,000 per month by Year 5. The VAS conversion assumption drives most of the result. With 60% of base adoption and 70% of base conversion, NPV is Rp567 bn.
]

#h[5. Execution and risk]

#small[
  *Horizon 1 (M1–M6):* pilot WhatsApp SIM replacement and 30 kiosks in Jabodetabek. *Horizon 2 (M7–M18):* roll out 200 more kiosks, launch Eco-Pass and CyberGuard nationally. *Horizon 3 (M19–M36):* convert the remaining counters into advisory hubs.

  *Risks:* identity fraud (multi-factor liveness and SIM binding); low adoption among older customers (assisted kiosks, advisors); AI errors (rule-based guardrails and human handoff within 30 seconds); fee-driven churn if CyberGuard is perceived as a surcharge.

  *Support needed from Telkomsel:* executive sponsor across Digital and Retail; access to the identity API sandbox; Year-1 budget of Rp54 bn.
]

#v(0.4em)
#small[
  *Conclusion.* ECO-CONNECT converts routine service demand into paid digital value and avoided emissions. The case rests on an uncertain paid-conversion assumption, which the team has stated and stress-tested.
]
