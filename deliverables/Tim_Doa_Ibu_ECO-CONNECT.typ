#set document(title: "Tim Doa Ibu - ECO-CONNECT Executive Summary", author: "Tim Doa Ibu")

#set page(
  paper: "a4",
  margin: (left: 3cm, right: 3cm, top: 3cm, bottom: 3cm),
  header: [
    #grid(
      columns: (1fr, 1fr),
      align: (left + horizon, right + horizon),
      image("/assets/telkomsel_logo.svg", height: 18pt),
      image("/assets/idsc_logo.svg", height: 18pt)
    )
    #v(-6pt)
    #line(length: 100%, stroke: 0.5pt + rgb("#002B66"))
  ],
  footer: context [
    #line(length: 100%, stroke: 0.5pt + rgb("#CCCCCC"))
    #v(-6pt)
    #grid(
      columns: (1fr, 1fr),
      align: (left, right),
      text(font: "Times New Roman", size: 8.5pt, style: "italic", fill: rgb("#555555"))[
        IDSC 2026 IBCC – Preliminary Stage | Tim Doa Ibu
      ],
      text(font: "Times New Roman", size: 8.5pt, fill: rgb("#555555"))[
        Page #counter(page).display("1 of 1", both: true)
      ]
    )
  ]
)

#set text(font: "Times New Roman", size: 12pt, lang: "en")
#set par(justify: true, leading: 0.42em)

// Document Header Block
#align(center)[
  #text(font: "Times New Roman", size: 12.5pt, weight: "bold", fill: rgb("#001A3F"))[
    ECO-CONNECT: REIMAGINING TELKOMSEL'S CONSUMER TOUCHPOINTS
  ] \
  #v(-6pt)
  #text(font: "Times New Roman", size: 10pt, weight: "bold", fill: rgb("#E4002B"))[
    Scaling Agentic Multimodal AI, Green Gamification, and Next-Gen Experience Hubs
  ] \
  #v(-6pt)
  #text(font: "Times New Roman", size: 8.5pt, style: "italic", fill: rgb("#444444"))[
    *Tim Doa Ibu* | International Business Case Competition (IBCC) 2026 – FEB Universitas Airlangga
  ]
]
#v(-2pt)
#line(length: 100%, stroke: 0.8pt + rgb("#E4002B"))
#v(1pt)

// 1. STRATEGIC CONTEXT & PROBLEM DIAGNOSIS (30%)
#text(weight: "bold", size: 10.5pt, fill: rgb("#002B66"))[1. Strategic Context & Root Cause Diagnostic (30% Rubric)]

#grid(
  columns: (1.2fr, 0.8fr),
  gutter: 7pt,
  [
    *The Squeeze:* Telkomsel leads Indonesia (159M cellular & 8.5M broadband users) but faces a structural *Monetization Squeeze*: annual data traffic surges $+25%$, yet blended ARPU stagnates at Rp49,000 and market share slipped to 44%. Simultaneously, ±350 GraPARI branches log *15M walk-in visits/year*, generating massive OpEx (~Rp375B/yr \@Rp25k/serve) and *~37,500 tons $upright(C O)_2 upright(e)$* ($2.5 " kg " upright(C O)_2 upright(e)$/visit, driven by customer travel).
  ],
  [
    #rect(fill: rgb("#F8F9FA"), stroke: 0.5pt + rgb("#002B66"), radius: 2.5pt, inset: 3.5pt)[
      #text(weight: "bold", size: 8pt, fill: rgb("#002B66"))[Core Problem Metrics:]
      #text(size: 7.2pt)[
        - *Traffic vs. ARPU:* Traffic $+25%$ vs. ARPU $+3%$.
        - *GraPARI Cost:* 15M visits $times$ Rp25k = Rp375B/yr.
        - *Carbon Impact:* 15M visits $approx 37,500$ tons $upright(C O)_2 upright(e)$.
        - *Adoption Friction:* 60% eligible for digital, but blocked by literacy & e-KYC.
      ]
    ]
  ]
)

*Core Question:* How can Telkomsel scale *MyTelkomsel* and Azure OpenAI-powered *Veronika* to migrate routine GraPARI visits into inclusive self-service, lifting ARPU while cutting emissions toward its 2030 target (-20% carbon intensity)?

#v(1pt)
// 2. THE ECO-CONNECT STRATEGY
#text(weight: "bold", size: 10.5pt, fill: rgb("#002B66"))[2. The Solution Idea: Three Synergistic Pillars of ECO-CONNECT (45% Rubric)]

#table(
  columns: (0.95fr, 2.35fr, 1.2fr),
  fill: (x, y) => if y == 0 { rgb("#002B66") } else if calc.even(y) { rgb("#F5F7FA") } else { none },
  stroke: 0.3pt + rgb("#D0D5DD"),
  inset: 2.8pt,
  align: (center + horizon, left + horizon, left + horizon),
  [#text(weight: "bold", fill: white, size: 7.5pt)[Pillar]],
  [#text(weight: "bold", fill: white, size: 7.5pt)[Strategic Initiatives & Operational Mechanisms]],
  [#text(weight: "bold", fill: white, size: 7.5pt)[Impact & Value Moat]],

  [*Pillar 1:*\ *Agentic Veronika*\ *& Inclusive e-KYC*],
  [
    #text(size: 7.5pt)[
      - *Vernacular Voice AI:* Conversational agent in Bahasa and dialects (Javanese, Sundanese) for seniors/rural users.
      - *WhatsApp-Native Engine:* Full self-service without requiring app downloads, lowering entry friction.
      - *Biometric Remote SIM Swap:* Dukcapil-backed liveness e-KYC enabling instant eSIM delivery and lost-SIM courier dispatch.
    ]
  ],
  [
    #text(size: 7.5pt)[
      - Migrates *7.5M visits* to digital by Year 3.
      - Resolves GraPARI's \#1 walk-in driver.
      - Champions *SDGs 9 & 10*.
    ]
  ],

  [*Pillar 2:*\ *Green Eco-Pass*\ *& AI VAS Engine*],
  [
    #text(size: 7.5pt)[
      - *Telkomsel Eco-Pass:* In-app carbon counter tracking avoided travel emissions ($2.47 " kg " upright(C O)_2 upright(e) " / visit"$), earning *Eco-Poin* for data vouchers & green merchants.
      - *Monetized AI VAS (Veronika CyberGuard):* B2C scam/phishing filter & family digital shield priced at Rp10,000/month.
      - *B2B ESG Syndication:* Anonymized mobility carbon savings syndicated into corporate client ESG reporting suites.
    ]
  ],
  [
    #text(size: 7.5pt)[
      - Unlocks *Rp306B new revenue* by Y3.
      - Raises active ARPU by *+Rp3,000*.
      - Fosters brand advocacy (*SDGs 12 & 13*).
    ]
  ],

  [*Pillar 3:*\ *GraPARI NextGen:*\ *Experience Hubs*],
  [
    #text(size: 7.5pt)[
      - *24/7 Smart Kiosks:* Exterior automated biometric kiosks for physical SIM issuing, downsizing branch transactional space by 60%.
      - *MSME Digitalization Lounges:* Indoor space repurposed for 5G/IoT smart living demos and local enterprise digital training.
      - *High-Touch Assisted Care:* Staff re-skilled as digital ambassadors for complex disputes, fraud cases, and senior onboarding.
    ]
  ],
  [
    #text(size: 7.5pt)[
      - Deflates GraPARI branch OpEx by *Rp172.5B/year*.
      - Reinvents GraPARI from cost drain into experiential retail hub.
    ]
  ]
)

#v(1pt)
// 3. TECHNICAL & OPERATIONAL FEASIBILITY
#text(weight: "bold", size: 10.5pt, fill: rgb("#002B66"))[3. Technical Architecture & Ecosystem Integration]

#text(size: 8.5pt)[
  ECO-CONNECT leverages existing Telkomsel investments: (1) *Azure OpenAI Service* orchestrates autonomous intent routing and tool execution via Core BSS/OSS APIs; (2) *Dukcapil e-KYC* enables real-time biometric liveness and NIK matching for bank-grade SIM security; (3) *FMC Unified CRM* pairs mobile and IndiHome subscriber data for personalized cross-selling.
]

#pagebreak()

// 4. ENVIRONMENTAL IMPACT METHODOLOGY
#text(weight: "bold", size: 10.5pt, fill: rgb("#002B66"))[4. Environmental Impact Methodology (GHG Protocol Scope 3)]

Using the *GHG Protocol Corporate Value Chain (Scope 3) Standard*, avoided emissions are quantified by comparing physical customer journeys against digital interaction cloud footprints:

$ upright(E)_"avoided" = sum_(t=1)^3 "Shifted Visits"_t times (e_"travel" + e_"facility" + e_"paper" - e_"digital"), quad Delta e = 2.47 " kg " upright(C O)_2 upright(e) " / visit" $

#grid(
  columns: (1.15fr, 0.85fr),
  gutter: 7pt,
  [
    #text(size: 8.2pt)[
      - *Avoided Travel ($e_"travel"$):* Avg. 12.5 km round-trip via urban motorcycle/car mix ($0.18 " kg " upright(C O)_2 upright(e) " / pkm"$) $= 2.25 " kg " upright(C O)_2 upright(e)$.
      - *Facility & Paper ($e_"facility" + e_"paper"$):* Grid electricity ($0.78 " kg " upright(C O)_2 " / kWh"$) + paper printing $= 0.25 " kg " upright(C O)_2 upright(e)$.
      - *Cloud Inference ($e_"digital"$):* Azure OpenAI inference and transmission $= -0.03 " kg " upright(C O)_2 upright(e)$.
      - *Net Decarbonization:* Shifting 2.7M (Y1), 5.0M (Y2), and 7.5M (Y3) visits cumulatively eliminates *37,544 tons of $upright(C O)_2 upright(e)$*, directly supporting Telkomsel's 2030 -20% emission intensity target.
    ]
  ],
  [
    #rect(fill: rgb("#F5FBF7"), stroke: 0.5pt + rgb("#28A745"), radius: 2.5pt, inset: 3.5pt)[
      #text(weight: "bold", size: 7.5pt, fill: rgb("#1E7E34"))[Decarbonization Dividends:]
      #text(size: 7.2pt)[
        - *Total Avoided Emissions:* *37,544 Tons $upright(C O)_2 upright(e)$* (equiv. to 620,000 trees).
        - *Paperless Impact:* 15M paper receipts eliminated.
        - *Societal Time Saved:* *6.25 million hours* of travel and queuing eliminated (*SDG 8*).
      ]
    ]
  ]
)

#v(-1pt)
// 5. BUSINESS & FINANCIAL VIABILITY
#text(weight: "bold", size: 10.5pt, fill: rgb("#002B66"))[5. Business & Financial Viability (3-Year Forecast)]

ECO-CONNECT establishes a dual-engine model combining cost deflation with high-margin AI subscription revenue:

#table(
  columns: (2.2fr, 0.9fr, 0.9fr, 0.9fr),
  fill: (x, y) => if y == 0 { rgb("#002B66") } else if y == 4 or y == 7 { rgb("#EAECF0") } else { none },
  stroke: 0.3pt + rgb("#D0D5DD"),
  inset: 2.5pt,
  align: (left + horizon, right + horizon, right + horizon, right + horizon),
  [#text(weight: "bold", fill: white, size: 7.2pt)[Financial Metric (IDR Billion)]],
  [#text(weight: "bold", fill: white, size: 7.2pt)[Year 1 (2027)]],
  [#text(weight: "bold", fill: white, size: 7.2pt)[Year 2 (2028)]],
  [#text(weight: "bold", fill: white, size: 7.2pt)[Year 3 (2029)]],

  [Shifted Physical Visits (Millions)], [2.7M], [5.0M], [7.5M],
  [GraPARI Cost-to-Serve Savings (\@Rp23k net/visit)], [Rp 62.1], [Rp 115.0], [Rp 172.5],
  [New Monetized AI VAS (Veronika CyberGuard \@Rp10k/mo)], [Rp 96.0], [Rp 180.0], [Rp 264.0],
  [Eco-Pass Merchant Sponsorship & Brand Partnerships], [Rp 15.0], [Rp 28.0], [Rp 42.0],
  [*Total Gross Economic Benefit*], [*Rp 173.1*], [*Rp 323.0*], [*Rp 478.5*],
  [CapEx (AI voice fine-tuning, Dukcapil API, Kiosks)], [(Rp 42.0)], [(Rp 18.0)], [(Rp 12.0)],
  [OpEx (Cloud inference, marketing, staff training)], [(Rp 25.0)], [(Rp 22.0)], [(Rp 20.0)],
  [*Net Cash Flow (NCF)*], [*Rp 106.1*], [*Rp 283.0*], [*Rp 446.5*],
  [*Cumulative Net Benefit*], [*Rp 106.1*], [*Rp 389.1*], [*Rp 835.6*]
)

#v(-3pt)
#text(size: 7.8pt)[
  *Investment Returns:* *NPV (10% WACC) = Rp 672.4 Billion* | *IRR = 142%* | *Payback = 7.8 Months*. Cash flow positive in Year 1 while boosting active user ARPU by *+Rp3,000*, closing the monetization gap.
]

#v(-2pt)
// 6. COLLABORATION, ROADMAP, RISKS & SUPPORT NEEDED
#text(weight: "bold", size: 10.5pt, fill: rgb("#002B66"))[6. Execution Roadmap, Governance & Support Needed]

#grid(
  columns: (1.2fr, 0.8fr),
  gutter: 7pt,
  [
    #text(size: 7.5pt)[
      *Phased Rollout & Governance:*
      - *Horizon 1 (M1–M6):* Pilot WhatsApp SIM swap & 30 Jabodetabek kiosks; fine-tune vernacular voice AI with cross-functional agile squads.
      - *Horizon 2 (M7–M18):* Deploy 350+ kiosks nationwide; launch Eco-Pass & Veronika CyberGuard; downsize branch manual desks.
      - *Horizon 3 (M19–M36):* Complete MSME Lounge transition; syndicate B2B Scope 3 carbon credits to corporate clients.
    ]
  ],
  [
    #rect(fill: rgb("#FFF9F2"), stroke: 0.5pt + rgb("#D97706"), radius: 2.5pt, inset: 3.5pt)[
      #text(weight: "bold", size: 7.2pt, fill: rgb("#B45309"))[Risk Mitigation Matrix:]
      #text(size: 6.8pt)[
        - *Biometric Fraud:* Multi-factor liveness $+$ telco SIM lock.
        - *Elderly Resistance:* Staff re-skilled as Digital Concierges.
        - *AI Hallucinations:* Deterministic guardrails $+$ 30s human fallback.
        - *Support Needed:* Dukcapil API sandbox & CMO sponsorship.
      ]
    ]
  ]
)

#v(-2pt)
#text(size: 8.2pt)[
  *Conclusion:* ECO-CONNECT transitions Telkomsel from an infrastructure-heavy telco into a high-margin, carbon-negative Digital Telco (DigiCo). By converting routine friction into decarbonization and generating *Rp835.6B in net cash flow*, Telkomsel future-proofs Indonesia's digital economy for inclusive and resilient growth.
]
