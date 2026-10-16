---
marp: true
theme: uncover
size: 16:9
paginate: true
header: ' '
footer: 'IDSC 2026 IBCC | Telkomsel Case Solution | Tim Doa Ibu'
style: |
  section {
    font-family: 'Times New Roman', serif;
    background-color: #FFFFFF;
    color: #1A1A1A;
    padding: 35px 50px;
    font-size: 16px;
    text-align: left;
    justify-content: flex-start;
  }
  header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h1 {
    font-size: 24px;
    color: #002B66;
    margin-top: 0px;
    margin-bottom: 8px;
    font-weight: bold;
    border-bottom: 2px solid #E4002B;
    padding-bottom: 4px;
  }
  h2 {
    font-size: 18px;
    color: #E4002B;
    margin-top: 0;
    margin-bottom: 8px;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
  }
  .card {
    background-color: #F8F9FA;
    border: 1px solid #D0D5DD;
    border-left: 4px solid #002B66;
    border-radius: 6px;
    padding: 12px 14px;
  }
  .card-green {
    background-color: #F0FFF4;
    border: 1px solid #C6F6D5;
    border-left: 4px solid #28A745;
    border-radius: 6px;
    padding: 12px 14px;
  }
  .card-red {
    background-color: #FFF5F5;
    border: 1px solid #FED7D7;
    border-left: 4px solid #E4002B;
    border-radius: 6px;
    padding: 12px 14px;
  }
  .stat-num {
    font-size: 26px;
    font-weight: bold;
    color: #002B66;
    line-height: 1;
    margin-bottom: 4px;
  }
  .stat-label {
    font-size: 12px;
    color: #555555;
    text-transform: uppercase;
    font-weight: bold;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-top: 6px;
  }
  th {
    background-color: #002B66;
    color: #FFFFFF;
    padding: 6px 8px;
    text-align: left;
  }
  td {
    padding: 5px 8px;
    border-bottom: 1px solid #E5E7EB;
  }
  tr:nth-child(even) {
    background-color: #F9FAFB;
  }
---

<!-- Slide 1: Title & Team Introduction -->
<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _footer: '' -->

<div style="text-align: center; margin-top: 40px;">
  <div style="display: flex; justify-content: center; gap: 40px; margin-bottom: 20px;">
    <img src="../../assets/telkomsel_logo.svg" height="42" />
    <img src="../../assets/idsc_logo.svg" height="42" />
  </div>

  <h1 style="font-size: 32px; color: #001A3F; border: none; margin-bottom: 5px;">ECO-CONNECT</h1>
  <h2 style="font-size: 20px; color: #E4002B; font-weight: bold; margin-bottom: 15px;">
    Reimagining Telkomsel's Consumer Touchpoints Through Agentic Multimodal AI, Green Monetization, and Next-Gen Experience Hubs
  </h2>

  <p style="font-size: 15px; color: #4A5568; max-width: 800px; margin: 0 auto 25px auto;">
    Simulated Business Case Solution for Telkomsel – International Business Case Competition (IBCC) 2026<br/>
    Faculty of Economics and Business, Universitas Airlangga
  </p>

  <div style="display: inline-block; background: #F8F9FA; border: 1px solid #CBD5E0; border-radius: 6px; padding: 10px 25px;">
    <strong style="color: #002B66; font-size: 16px;">Submitted by: Tim Doa Ibu</strong>
    <div style="font-size: 13px; color: #666666; margin-top: 3px;">
      Lead Strategist • Financial Modeler • Technology Architect
    </div>
  </div>
</div>

---

<!-- Slide 2: Problem Statement & Diagnostic -->
# 1. Problem Statement: Decoupling Traffic Surges from Flat ARPU & Carbon Drag

<div class="grid-3" style="margin-bottom: 12px;">
  <div class="card-red">
    <div class="stat-num">+25% vs +3%</div>
    <div class="stat-label">Monetization Squeeze</div>
    <p style="font-size: 12px; margin-top: 5px; color: #333;">Data traffic expands +25%/yr while blended ARPU crawls from Rp45k to Rp49k, squeezing EBITDA margins.</p>
  </div>
  <div class="card-red">
    <div class="stat-num">15M Visits/Yr</div>
    <div class="stat-label">GraPARI Cost Drain</div>
    <p style="font-size: 12px; margin-top: 5px; color: #333;">±350 outlets handle 15M routine visits costing ~Rp375B annually, with 60% technically eligible for self-service.</p>
  </div>
  <div class="card-red">
    <div class="stat-num">37,500 tCO₂e</div>
    <div class="stat-label">Carbon Footprint</div>
    <p style="font-size: 12px; margin-top: 5px; color: #333;">Customer travel (10–15 km roundtrip) generates 2.5 kg CO₂e per physical visit, hindering 2030 net-zero goals.</p>
  </div>
</div>

<div class="card">
  <strong style="color: #002B66; font-size: 14px;">Root Cause Diagnosis (Why 60% of Visits Remain Physical):</strong>
  <div class="grid-3" style="margin-top: 8px; font-size: 12.5px;">
    <div><strong>1. Digital Literacy Friction:</strong> Elderly & rural segments struggle with complex app navigation and English terms.</div>
    <div><strong>2. Biometric Trust Deficit:</strong> Lost SIM & e-KYC swap require physical KTP photocopying and in-person verification.</div>
    <div><strong>3. Absence of Green Incentives:</strong> Customers lack tangible gamified motivation to choose digital channels over walk-in.</div>
  </div>
</div>

---

<!-- Slide 3: Solution Idea: ECO-CONNECT -->
# 2. Solution Idea: The Three Pillars of ECO-CONNECT

<div class="grid-3">
  <div class="card" style="border-left-color: #002B66;">
    <h2 style="font-size: 16px; color: #002B66; margin-bottom: 6px;">Pillar 1: Agentic Veronika 2.0 & Inclusive e-KYC</h2>
    <ul style="font-size: 12.5px; padding-left: 16px; margin: 0; line-height: 1.4;">
      <li><strong>Vernacular Voice AI:</strong> Voice commands in Bahasa, Javanese & Sundanese via Azure OpenAI.</li>
      <li><strong>WhatsApp-Native Self-Service:</strong> 100% flow execution without forcing app downloads.</li>
      <li><strong>Biometric Remote SIM Swap:</strong> Dukcapil liveness verification for instant eSIM / courier delivery.</li>
    </ul>
    <div style="margin-top: 10px; font-size: 12px; color: #002B66; font-weight: bold;">
      🎯 Impact: Shifts 7.5M visits to digital by Year 3 (SDGs 9 & 10).
    </div>
  </div>

  <div class="card-green">
    <h2 style="font-size: 16px; color: #1E7E34; margin-bottom: 6px;">Pillar 2: Green Eco-Pass & Monetized VAS</h2>
    <ul style="font-size: 12.5px; padding-left: 16px; margin: 0; line-height: 1.4;">
      <li><strong>Telkomsel Eco-Pass:</strong> In-app tracker rewarding 2.47 kg CO₂e saved per digital shift with Eco-Poin.</li>
      <li><strong>Monetized AI VAS:</strong> "Veronika CyberGuard" (SMS scam filter, banking protector) @ Rp10,000/mo.</li>
      <li><strong>B2B ESG Syndication:</strong> Anonymized mobility carbon data sold to enterprise clients.</li>
    </ul>
    <div style="margin-top: 10px; font-size: 12px; color: #1E7E34; font-weight: bold;">
      🎯 Impact: +Rp306B new revenue & +Rp3,000 ARPU by Y3 (SDGs 12 & 13).
    </div>
  </div>

  <div class="card" style="border-left-color: #E4002B;">
    <h2 style="font-size: 16px; color: #E4002B; margin-bottom: 6px;">Pillar 3: GraPARI NextGen Experience Hubs</h2>
    <ul style="font-size: 12.5px; padding-left: 16px; margin: 0; line-height: 1.4;">
      <li><strong>24/7 Smart Exterior Kiosks:</strong> Automated physical SIM dispensing, cutting counter space by 60%.</li>
      <li><strong>MSME Digitalization Lounges:</strong> Interior repurposed for 5G, Smart Home (IndiHome), & SME labs.</li>
      <li><strong>High-Touch Concierge:</strong> Staff upskilled for complex disputes, fraud, and senior guidance.</li>
    </ul>
    <div style="margin-top: 10px; font-size: 12px; color: #E4002B; font-weight: bold;">
      🎯 Impact: Saves Rp172.5B OpEx/yr; transforms cost drain into retail asset.
    </div>
  </div>
</div>

---

<!-- Slide 4: Technical & Operational Feasibility -->
# 3. Technical & Operational Feasibility: Solution Architecture

<div style="text-align: center; margin-bottom: 10px;">
  <img src="../../assets/diagrams/solution_architecture.svg" height="230" style="border: 1px solid #D0D5DD; border-radius: 6px;" />
</div>

<div class="grid-3" style="font-size: 12px;">
  <div class="card">
    <strong>1. Touchpoint Integration:</strong> Omnichannel integration across MyTelkomsel (50M MAU), WhatsApp Business API, and 24/7 Smart Kiosks.
  </div>
  <div class="card">
    <strong>2. Azure OpenAI Orchestration:</strong> Intent classification, autonomous tool execution via Telkomsel Core BSS/OSS APIs, and local SLM voice models.
  </div>
  <div class="card">
    <strong>3. Dukcapil Security Fabric:</strong> Encrypted telco SIM-IMEI binding with government biometric liveness check to prevent fraud and deepfakes.
  </div>
</div>

---

<!-- Slide 5: Business & Financial Viability -->
# 4. Business & Financial Viability: High-Margin Dual-Engine Returns

<div class="grid-2">
  <div>
    <table>
      <thead>
        <tr>
          <th>Financial Metric (IDR Billion)</th>
          <th>Y1 (2027)</th>
          <th>Y2 (2028)</th>
          <th>Y3 (2029)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Shifted Physical Visits (M)</td>
          <td>2.7M</td>
          <td>5.0M</td>
          <td>7.5M</td>
        </tr>
        <tr>
          <td>GraPARI OpEx Savings (@Rp23k)</td>
          <td>Rp 62.1</td>
          <td>Rp 115.0</td>
          <td>Rp 172.5</td>
        </tr>
        <tr>
          <td>New AI VAS (CyberGuard @Rp10k)</td>
          <td>Rp 96.0</td>
          <td>Rp 180.0</td>
          <td>Rp 264.0</td>
        </tr>
        <tr>
          <td>Eco-Pass Brand Partnerships</td>
          <td>Rp 15.0</td>
          <td>Rp 28.0</td>
          <td>Rp 42.0</td>
        </tr>
        <tr style="font-weight: bold; background: #EBF8FF;">
          <td>Total Gross Economic Benefit</td>
          <td>Rp 173.1</td>
          <td>Rp 323.0</td>
          <td>Rp 478.5</td>
        </tr>
        <tr>
          <td>Total CapEx & OpEx Investment</td>
          <td>(Rp 67.0)</td>
          <td>(Rp 40.0)</td>
          <td>(Rp 32.0)</td>
        </tr>
        <tr style="font-weight: bold; background: #D1E7DD;">
          <td>Net Cash Flow (NCF)</td>
          <td>Rp 106.1</td>
          <td>Rp 283.0</td>
          <td>Rp 446.5</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div>
    <div class="card-green" style="margin-bottom: 10px;">
      <div class="stat-num">Rp 672.4 B</div>
      <div class="stat-label">Net Present Value (10% WACC)</div>
      <p style="font-size: 12px; margin-top: 4px; color: #333;">Exceptional financial return with <strong>142% IRR</strong> and an aggressive <strong>7.8-Month Payback Period</strong>.</p>
    </div>
    <div class="card">
      <div class="stat-num">37,544 Tons CO₂e</div>
      <div class="stat-label">Cumulative Carbon Avoided (GHG Scope 3)</div>
      <p style="font-size: 12px; margin-top: 4px; color: #333;">7.5M shifted visits eliminate 2.47 kg CO₂e each, equivalent to planting <strong>620,000 mature trees</strong> and saving <strong>6.25M hours</strong>.</p>
    </div>
  </div>
</div>

---

<!-- Slide 6: Collaboration & Implementation Fit -->
# 5. Collaboration & Implementation Fit: Seamless Organizational Alignment

<div class="grid-2">
  <div class="card">
    <h2 style="font-size: 16px; color: #002B66;">Internal Cross-Functional Governance</h2>
    <p style="font-size: 13px; color: #444; margin-bottom: 8px;">Operated via dedicated Agile Squads on 2-week sprint cadences:</p>
    <ul style="font-size: 12.5px; padding-left: 18px; margin: 0; line-height: 1.5;">
      <li><strong>Digital Touchpoint Squad:</strong> Drives MyTelkomsel UI/UX & WhatsApp conversational flows.</li>
      <li><strong>AI & Network Engineering:</strong> Fine-tunes Azure OpenAI models & integrates Core BSS/OSS APIs.</li>
      <li><strong>Retail Operations & GraPARI Squad:</strong> Coordinates smart kiosk retrofitting and staff upskilling.</li>
      <li><strong>ESG Directorate:</strong> Audits GHG Scope 3 emission accounting and carbon credit registries.</li>
    </ul>
  </div>

  <div class="card">
    <h2 style="font-size: 16px; color: #E4002B;">External Strategic Ecosystem</h2>
    <p style="font-size: 13px; color: #444; margin-bottom: 8px;">Key multi-stakeholder partnerships:</p>
    <ul style="font-size: 12.5px; padding-left: 18px; margin: 0; line-height: 1.5;">
      <li><strong>Directorate General of Dukcapil:</strong> Real-time national biometric e-KYC integration.</li>
      <li><strong>Microsoft Azure AI Team:</strong> Enterprise-grade OpenAI infrastructure & zero-data-retention security.</li>
      <li><strong>Green Merchant Ecosystem:</strong> Electric mobility (EV charging), mass transit, & eco-merchants for Eco-Poin redemption.</li>
      <li><strong>GraPARI Workforce Compact:</strong> Zero-layoff pledge; staff re-skilled as MSME Digital Transformation Advisors.</li>
    </ul>
  </div>
</div>

---

<!-- Slide 7: Execution Readiness & Roadmap -->
# 6. Execution Readiness & Phased 36-Month Roadmap

<div class="grid-3" style="margin-bottom: 12px;">
  <div class="card">
    <strong style="color: #002B66; font-size: 14px;">Horizon 1: Pilot & Validate (M1–M6)</strong>
    <ul style="font-size: 11.5px; padding-left: 15px; margin-top: 6px; line-height: 1.4;">
      <li>Fine-tune vernacular AI in Javanese & Sundanese.</li>
      <li>Integrate Dukcapil biometric liveness API.</li>
      <li>Pilot WhatsApp SIM swap & 30 smart kiosks in Jabodetabek.</li>
      <li><strong>KPI:</strong> 85% first-contact resolution; 300k visits shifted.</li>
    </ul>
  </div>

  <div class="card">
    <strong style="color: #002B66; font-size: 14px;">Horizon 2: Scale Nationwide (M7–M18)</strong>
    <ul style="font-size: 11.5px; padding-left: 15px; margin-top: 6px; line-height: 1.4;">
      <li>Deploy 350+ 24/7 Smart Kiosks across all branches.</li>
      <li>Launch nationwide Eco-Pass gamification campaign.</li>
      <li>Commercialize Veronika CyberGuard VAS (@Rp10k/mo).</li>
      <li><strong>KPI:</strong> 5.0M visits shifted; +Rp180B VAS revenue.</li>
    </ul>
  </div>

  <div class="card">
    <strong style="color: #002B66; font-size: 14px;">Horizon 3: Ecosystem Maturity (M19–M36)</strong>
    <ul style="font-size: 11.5px; padding-left: 15px; margin-top: 6px; line-height: 1.4;">
      <li>Complete GraPARI transition into MSME Hubs.</li>
      <li>Syndicate B2B Scope 3 carbon credits to corporate clients.</li>
      <li>Scale AI Concierge to full FMC home automation.</li>
      <li><strong>KPI:</strong> 7.5M visits shifted; 37.5k tCO₂e avoided.</li>
    </ul>
  </div>
</div>

<div class="card" style="border-left-color: #D97706; padding: 10px 14px;">
  <strong style="color: #B45309; font-size: 13px;">Critical Risk Governance:</strong>
  <span style="font-size: 12px; color: #333; margin-left: 10px;">
    <strong>Biometric Fraud:</strong> Multi-factor liveness + telco SIM lock |
    <strong>Elderly Friction:</strong> GraPARI Digital Concierge staff on floor |
    <strong>AI Hallucination:</strong> Deterministic guardrails with instant fallback to human contact center &lt; 30s.
  </span>
</div>

---

<!-- Slide 8: Closing & Support Needed -->
# 7. Closing & Support Needed: Building Indonesia's Green Telco Champion

<div class="grid-2">
  <div class="card-green">
    <h2 style="font-size: 18px; color: #1E7E34; margin-bottom: 8px;">The ECO-CONNECT Value Dividend</h2>
    <ul style="font-size: 13px; padding-left: 18px; line-height: 1.6; color: #2D3748;">
      <li><strong>Decouples Growth from Emissions:</strong> Eliminates 37,544 tCO₂e, directly contributing to Telkomsel's 2030 -20% carbon intensity mandate.</li>
      <li><strong>Closes the Monetization Gap:</strong> Delivers Rp835.6B cumulative net benefit and lifts ARPU by +Rp3,000 for active digital users.</li>
      <li><strong>Drives True Digital Inclusion:</strong> Empowers non-digital natives via local dialects and zero-download WhatsApp self-service (SDGs 9, 10).</li>
      <li><strong>Future-Proofs Physical Assets:</strong> Reinvents 350 GraPARI outlets from costly complaint desks into high-margin experience hubs.</li>
    </ul>
  </div>

  <div class="card">
    <h2 style="font-size: 18px; color: #002B66; margin-bottom: 8px;">Support & Resources Required from Telkomsel</h2>
    <ul style="font-size: 13px; padding-left: 18px; line-height: 1.6; color: #2D3748;">
      <li><strong>Executive Sponsorship:</strong> Joint mandate from Director of Marketing and Director of Network & IT.</li>
      <li><strong>Regulatory Facilitation:</strong> Priority coordination with Dukcapil for high-throughput biometric API access.</li>
      <li><strong>CapEx Budget Allocation:</strong> Rp42 Billion Year 1 investment for kiosk procurement and voice AI fine-tuning.</li>
      <li><strong>Retail Operations Alignment:</strong> Phased transition plan for GraPARI customer service workforce upskilling.</li>
    </ul>

    <div style="margin-top: 15px; text-align: center; background: #002B66; color: white; padding: 10px; border-radius: 4px; font-weight: bold; font-size: 13px;">
      "Together, let's empower every Indonesian home and business sustainably."
    </div>
  </div>
</div>
