# Financial Modeling & Valuation Skill

## Overview
This skill guides the design, calculation, and presentation of quantitative financial models for business case solutions, including unit economics, investment sizing, pro-forma financials, and valuation metrics.

## Key Formulas & Metrics

### 1. Unit Economics
- **Customer Acquisition Cost (CAC)**: $\text{Total Sales \& Marketing Costs} / \text{New Customers Acquired}$
- **Customer Lifetime Value (LTV)**: $(\text{Average Order Value} \times \text{Gross Margin} \times \text{Purchase Frequency}) / \text{Churn Rate}$
- **LTV/CAC Ratio**: Ideal $\ge 3.0\times$ (Healthy scale); $< 1.0\times$ (Unsustainable).
- **Contribution Margin**: $\text{Revenue} - \text{Variable Costs}$

### 2. Investment Returns
- **Net Present Value (NPV)**:
  $$\text{NPV} = \sum_{t=1}^{T} \frac{\text{FCF}_t}{(1 + \text{WACC})^t} - \text{Initial Investment}$$
- **Internal Rate of Return (IRR)**: The discount rate at which $\text{NPV} = 0$.
- **Payback Period**: Time elapsed until cumulative cash flows turn positive.
- **Return on Investment (ROI)**: $(\text{Cumulative Net Profit} / \text{Total Capital Invested}) \times 100\%$

### 3. Pro-Forma Income Statement Structure (5-Year Forecast)
```
Line Item                 | Year 1 | Year 2 | Year 3 | Year 4 | Year 5
--------------------------|--------|--------|--------|--------|-------
Gross Revenue             | ...    | ...    | ...    | ...    | ...
- Cost of Goods Sold      | ...    | ...    | ...    | ...    | ...
Gross Profit              | ...    | ...    | ...    | ...    | ...
Gross Margin (%)          | %      | %      | %      | %      | %
- Operating Expenses      | ...    | ...    | ...    | ...    | ...
  - Sales & Marketing     | ...    | ...    | ...    | ...    | ...
  - Product & Engineering | ...    | ...    | ...    | ...    | ...
  - General & Admin       | ...    | ...    | ...    | ...    | ...
EBITDA                    | ...    | ...    | ...    | ...    | ...
EBITDA Margin (%)         | %      | %      | %      | %      | %
- Depreciation & Amort.   | ...    | ...    | ...    | ...    | ...
EBIT / Operating Income   | ...    | ...    | ...    | ...    | ...
- Taxes                   | ...    | ...    | ...    | ...    | ...
Net Income                | ...    | ...    | ...    | ...    | ...
Free Cash Flow (FCF)      | ...    | ...    | ...    | ...    | ...
```

### 4. Sensitivity Analysis
Always run a $3 \times 3$ sensitivity table testing key vulnerabilities:
- **X-Axis**: Market Adoption / Customer Growth (+/- 20%)
- **Y-Axis**: CAC or Pricing (+/- 15%)
- **Cell Output**: NPV or EBITDA at Year 3.
