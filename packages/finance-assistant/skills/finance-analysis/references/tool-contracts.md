# Tool Contracts

## `finance_fetch_market_data`

### Parameters
- `symbol` (`string`, required): US ticker symbol, e.g. `AAPL`.
- `timeframe` (`"1H" | "1D" | "1W" | "1M"`, optional, default `1D`).
- `limit` (`number`, optional, default `200`, minimum `30`).

### Details
- `analysisId`: workflow id for chained tools.
- `market`:
  - `symbol`, `timeframe`, `limit`
  - `sourceUsed`, `warnings`
  - `candles`: full raw OHLCV candles
  - `fetchedAt`

## `finance_compute_indicators`

### Parameters
- `analysisId` (`string`, required)

### Details
- `analysisId`
- `market` (full raw market data from previous step)
- `indicators`:
  - `lastClose`
  - `sma20`, `ema20`
  - `rsi14`
  - `macdLine`, `macdSignal`, `macdHistogram`
  - `volatilityAnnualized`
  - `maxDrawdown`

## `finance_generate_report`

### Parameters
- `analysisId` (`string`, required)

### Details
- `analysisId`
- `market`
- `indicators`
- `report`:
  - `conclusion`
  - `keyEvidence`
  - `riskPoints`
  - `watchLevels`
  - `confidence`
  - `disclaimer`
  - `warnings`

## Standard Errors

- `WORKFLOW_STATE_NOT_FOUND`: analysis id not in cache or missing required stage data.
- `INSUFFICIENT_DATA`: not enough valid candles to compute indicators.
- `PROVIDERS_FAILED`: quote providers unavailable or all failed.
