"""
ECO-CONNECT financial and GHG model (IBCC 2026, Telkomsel case).

Input tags:
  [CASE]   from Casebook_IBCC_2026.md (figures the case itself labels illustrative/midpoint)
  [MS]     from Microsoft customer story on Telkomsel + Veronika (published 2024-02-23)
  [ASSUMP] team assumption; must be labelled as assumption in the submission

Timing: Year 0 = upfront Year-1 CapEx (deployed before benefits). Years 1..5 = operating cash flows.
Units: money in IDR billion; volumes in millions; CO2e in tonnes.
"""
from dataclasses import dataclass, field


@dataclass
class Inputs:
    # Baseline physical demand
    outlets: int = 350                          # [CASE] ~350 GraPARI outlets
    visits_per_outlet_day: float = 115          # [CASE] 80-150/day, midpoint
    operating_days: int = 365                   # [ASSUMP]
    eligible_share: float = 0.60                # [CASE] 55-65%, midpoint

    # Migration ramp: share of eligible visits moved to digital, Years 1..5
    adoption: list = field(default_factory=lambda: [0.20, 0.45, 0.65, 0.75, 0.80])  # [ASSUMP], anchored on [MS] 19%->45%

    # Unit economics (IDR per interaction)
    cost_physical_idr: float = 25_000           # [ASSUMP] fully loaded walk-in cost
    cost_digital_idr: float = 2_000             # [ASSUMP] digital servicing incl. AI inference

    # Carbon per interaction (kg CO2e)
    co2_physical_kg: float = 2.5                # [CASE] 2.0-3.0, midpoint
    co2_digital_kg: float = 0.03                # [CASE] 0.01-0.05, midpoint

    # Monetisation
    active_users_m: float = 50.0                # [MS]/[CASE] ~50M MAU
    paid_conversion: list = field(default_factory=lambda: [0.01, 0.025, 0.04, 0.05, 0.05])  # [ASSUMP]
    vas_price_idr_month: float = 10_000         # [ASSUMP] CyberGuard price
    partner_revenue_bn: list = field(default_factory=lambda: [15, 25, 35, 40, 45])  # [ASSUMP]

    # Investment
    capex_bn: list = field(default_factory=lambda: [45, 30, 15, 5, 5])   # [ASSUMP] AI integration, Dukcapil API
    kiosks_count: list = field(default_factory=lambda: [30, 200, 120, 0, 0])  # [ASSUMP] rollout
    kiosk_cost_bn: float = 0.30                 # [ASSUMP] IDR 300 million per kiosk
    program_opex_bn: list = field(default_factory=lambda: [20, 20, 18, 18, 18])  # [ASSUMP]
    vas_variable_cost_share: float = 0.15       # [ASSUMP]

    wacc: float = 0.10                          # [ASSUMP]


def npv_at(rate, cfs):
    """cfs[0] is Year 0 (undiscounted)."""
    return sum(cf / (1 + rate) ** t for t, cf in enumerate(cfs))


def irr(cfs):
    lo, hi = -0.99, 10.0
    if npv_at(lo, cfs) * npv_at(hi, cfs) > 0:
        return None
    for _ in range(300):
        mid = (lo + hi) / 2
        if npv_at(lo, cfs) * npv_at(mid, cfs) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def run(inp: Inputs = Inputs()):
    years = range(5)

    base_visits_m = inp.outlets * inp.visits_per_outlet_day * inp.operating_days / 1e6
    eligible_m = base_visits_m * inp.eligible_share
    shifted_m = [eligible_m * a for a in inp.adoption]

    saving_per_visit_idr = inp.cost_physical_idr - inp.cost_digital_idr
    cost_saving = [s * saving_per_visit_idr / 1e3 for s in shifted_m]   # M visits x IDR /1e3 = IDR bn

    vas_subs_m = [inp.active_users_m * c for c in inp.paid_conversion]
    vas_rev = [s * inp.vas_price_idr_month * 12 / 1e3 for s in vas_subs_m]  # M subs x IDR x 12 /1e3 = IDR bn

    gross = [cost_saving[t] + vas_rev[t] + inp.partner_revenue_bn[t] for t in years]

    capex = [inp.capex_bn[t] + inp.kiosks_count[t] * inp.kiosk_cost_bn for t in years]
    opex = [inp.program_opex_bn[t] + inp.vas_variable_cost_share * vas_rev[t] for t in years]

    # Year-0 cash flow = Year-1 CapEx (upfront). Years 1..5 = operating NCF, with CapEx of Y2..Y5 included in-year.
    op_ncf = [gross[t] - opex[t] - (capex[t] if t > 0 else 0.0) for t in years]
    cfs = [-capex[0]] + op_ncf                                             # index 0 = Year 0
    # Year-1 operating cash flow already appears in op_ncf[0]; keep it as Year 1 (index 1).

    cum, c = [], 0.0
    for v in cfs:
        c += v
        cum.append(c)

    npv = npv_at(inp.wacc, cfs)

    payback = None
    for t in range(1, len(cfs)):
        if cum[t] >= 0 and cum[t - 1] < 0:
            payback = (t - 1) + (-cum[t - 1]) / cfs[t]
            break
    if payback is None and cum[0] >= 0:
        payback = 0.0

    co2_avoided_t = [shifted_m[t] * (inp.co2_physical_kg - inp.co2_digital_kg) * 1000 for t in years]

    return {
        "base_visits_m": base_visits_m,
        "eligible_m": eligible_m,
        "shifted_m": shifted_m,
        "cost_saving": cost_saving,
        "vas_subs_m": vas_subs_m,
        "vas_rev": vas_rev,
        "partner": inp.partner_revenue_bn,
        "gross": gross,
        "capex": capex,
        "opex": opex,
        "cfs": cfs,
        "cum": cum,
        "npv": npv,
        "irr": irr(cfs),
        "payback_years": payback,
        "co2_avoided_t": co2_avoided_t,
        "co2_cum_t": sum(co2_avoided_t),
    }


def scenario(adoption_scale: float, conversion_scale: float = 1.0):
    base = Inputs()
    return run(Inputs(
        adoption=[min(1.0, a * adoption_scale) for a in base.adoption],
        paid_conversion=[p * conversion_scale for p in base.paid_conversion],
    ))


if __name__ == "__main__":
    r = run()
    f = lambda xs: [round(x, 1) for x in xs]
    print(f"Baseline visits {r['base_visits_m']:.1f}M/yr; eligible {r['eligible_m']:.1f}M")
    print("Shifted visits (M):", [round(x, 2) for x in r["shifted_m"]])
    print("Cost saving:", f(r["cost_saving"]))
    print("VAS subs (M):", [round(x, 2) for x in r["vas_subs_m"]])
    print("VAS rev:", f(r["vas_rev"]), " Partner:", r["partner"])
    print("Gross:", f(r["gross"]))
    print("CapEx:", f(r["capex"]), " OpEx:", f(r["opex"]))
    print("CFs Y0..Y5:", f(r["cfs"]))
    print("Cum CFs:", f(r["cum"]))
    print(f"NPV@{Inputs().wacc:.0%}: {r['npv']:.1f}")
    print("IRR:", None if r["irr"] is None else f"{r['irr']:.1%}")
    print("Payback yrs:", None if r["payback_years"] is None else round(r["payback_years"], 2))
    print("CO2e t/yr:", [round(x) for x in r["co2_avoided_t"]], "cum:", round(r["co2_cum_t"]))
    for name, s in [("Bear", scenario(0.6, 0.7)), ("Base", r), ("Bull", scenario(1.2, 1.2))]:
        print(f"{name}: NPV {s['npv']:.1f}  Y3 shifted {s['shifted_m'][2]:.2f}M")
