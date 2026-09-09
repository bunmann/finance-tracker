# 🛠️ TO-FIX LIST (Deferred Issues)

This document tracks known bugs, discrepancies, or broken features that have been temporarily deferred to keep the main development sprint moving forward.

## 1. Historical Capital Compounding Chart (Currency & Deduplication Discrepancy)

**Status:** Temporarily Disabled in Frontend (`StocksSummaryContent.jsx`)
**Severity:** High (Math/Logic Discrepancy)

### Description of the Issue:
The `Historical Capital Compounding` feature attempts to plot the cumulative `cost_basis` against the `market_value` over time. However, the calculation diverged significantly from the actual Portfolio Top-Card totals (e.g., ~$997 difference in market value).

The root cause comes down to two major backend alignment issues:
1. **US Ticker Currency Conversion Double-Dipping / Skipping:** 
   The `_get_cad_price` logic was originally missing conversion for US tickers (e.g., AAPL) if the `holding.currency` was marked as `CAD` from the broker CSV import. This caused the Top Cards to undervalue US holdings by not multiplying by `1.37`, while the Historical Chart evaluated them accurately, leading to a massive discrepancy between the two. While `_get_cad_price` was partially patched, the historical loop re-evaluates every transaction using historical Yahoo Finance prices, leading to subtle FX discrepancies on exactly *when* the conversion rate is applied vs the live spot price.
2. **Fuzzy Deduplication & Ticker Normalization Overlap:**
   When re-importing CSVs, Wealthsimple/Questrade timestamp shifts (00:00 UTC vs local settlement date) bypass exact SHA256 deduplication. Although a ±2 day fuzzy deduplication was added, historical transactions using bare tickers (e.g., `GOOG`) vs resolved Canadian CDR tickers (`GOOG.NE`) end up getting double-counted or mismatched in the `shares_on_date` aggregation loop, causing the historical share counts to diverge from the `models.Holding` ground truth.

### Files That Need to be Fixed:
- **`week3_fastapi/common/stock_service.py`**
  - `calculate_portfolio_historical_curve()`: The core logic where transaction arrays are aggregated into a daily time series. Needs to perfectly align its `t_sym` resolution and `shares_on_date` counting with the final `models.Holding` state.
  - `_get_cad_price()`: Verify all edge cases for USD vs CAD conversion based on ticker suffix.
- **`week3_fastapi/routers/stocks.py`**
  - `POST /transactions/upload`: The CSV fuzzy deduplication (`fuzzy_existing`) and ticker normalization (`normalize_ticker_symbol` with `currency_hint`) logic must guarantee zero double-counting on re-imports.
- **`week4_react/src/components/stocks-master/stocks-summary/StocksSummaryContent.jsx`**
  - Uncomment `<PortfolioHistoryChart />` once the backend math is verified.

---
