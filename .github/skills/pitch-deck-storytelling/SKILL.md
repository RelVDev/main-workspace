# Pitch Deck & Storytelling Skill

## Overview
Guidelines for creating high-impact, consultancy-grade slide decks for case competition judges using Marp Markdown and Python PPTX.

## Golden Rules for Case Decks

### 1. The Pyramid Principle & Action Titles
- Every slide title MUST express the core message and recommendation (the "so what?"), not just describe the topic.
- Format: `[Subject] [Action Verb] [Quantified Outcome/Impact] through [Key Mechanism]`.
- Bad Title: "Financial Projections"
- Good Title: "Strategy Delivers $18.4M Net Profit by Year 3 with a 14-Month Payback Period"

### 2. Standard 10-12 Slide Competition Structure
1. **Title / Cover Slide**: Crisp project name, tagline, team name.
2. **Executive Summary**: SCQA structure, 3 core pillars, expected ROI.
3. **Market & Problem Diagnostic**: Root cause analysis, macro tailwinds, customer pain points.
4. **Strategic Direction (Pillar Overview)**: The 3 MECE strategic initiatives.
5. **Deep Dive Pillar 1**: Operational blueprint & customer experience.
6. **Deep Dive Pillar 2**: Technology / Go-to-Market / Partner ecosystem.
7. **Deep Dive Pillar 3**: Scalability / Retention / Unit economics optimizer.
8. **Go-to-Market & Launch Roadmap**: Phased timeline (Horizon 1, 2, 3), pilot testing.
9. **Financial Projections & Unit Economics**: 3-5 Year P&L, CapEx/OpEx, Break-even, NPV.
10. **Risk & Mitigation Matrix**: Probability vs. Impact, contingency mechanisms.
11. **Conclusion & The Call to Action**: Final vision and why we win.
12. **Appendix**: Data sources, sensitivity analysis, detailed technical specs.

### 3. Marp Markdown Template Reference
```markdown
---
marp: true
theme: uncover
paginate: true
style: |
  section {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background: #fdfdfd;
    color: #1a1a1a;
  }
  h1 { color: #0f4c81; font-size: 1.8rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; }
  .card { background: #f0f4f8; padding: 20px; border-radius: 8px; border-left: 5px solid #0f4c81; }
  .stat { font-size: 2.2rem; font-weight: bold; color: #0f4c81; }
---

# Action Title: Capturing $50M Market Through Targeted Segment Expansion

<div class="grid">
  <div class="card">
    <div class="stat">+42%</div>
    <p>CAGR projected over 3 years driven by Tier-2 city penetration.</p>
  </div>
  <div class="card">
    <div class="stat">1.8x</div>
    <p>Improvement in customer retention via automated loyalty program.</p>
  </div>
</div>
```
