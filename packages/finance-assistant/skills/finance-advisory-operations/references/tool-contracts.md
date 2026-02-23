# Tool Contracts (Advisory Operations)

## Required Tools

- `finance_monitor_portfolio_drift(portfolio|portfolioId, targetPolicy?, ipsId?)`
- `finance_monitor_risk_budget(riskTier?|profile|profileId?, portfolio|portfolioId, analysisId?, stressTestId?, targetPolicy?, riskTemplate?)`
- `finance_generate_client_review_packet(clientLabel?, goalsId?, portfolioReviewId?, stressTestId?, rebalancePlanId?, driftReportId?, riskMonitorId?)`
- `finance_log_advisory_decision(decisionSummary, recommendation, evidence, constraints?, relatedArtifactIds?)`
- `finance_generate_advisory_summary(profileId?, goalsId?, ipsId?, portfolioReviewId?, stressTestId?, rebalancePlanId?, driftReportId?, riskMonitorId?, reviewPacketId?, decisionLogId?, includeAudit?, workflow?, runId?)`

## Important Rules

- `portfolio` and `portfolioId`: at least one is required for drift/risk monitors.
- `riskTier` defaults to `moderate` when no profile context is available.
- `riskTemplate` can override built-in risk thresholds and should include `templateId` and `version`.
- Monitors can run with partial inputs; warnings must be disclosed.
- Decision logs must include evidence and disclaimer context.
- Advisory summary should reference IDs from prior steps for deterministic traceability.
- Set `includeAudit=true` for compliance/reporting exports.

## Key Outputs

- `finance_monitor_portfolio_drift` -> `driftReportId`, `breaches`, `priorityQueue`
- `finance_monitor_risk_budget` -> `riskMonitorId`, `riskTier`, `flags`, `overallSeverity`
- `finance_generate_client_review_packet` -> `reviewPacketId`, actionable sections for clients
- `finance_log_advisory_decision` -> `decisionLogId`, auditable recommendation/evidence record
- `finance_generate_advisory_summary` -> `summaryId`, consolidated machine-readable advisory snapshot
