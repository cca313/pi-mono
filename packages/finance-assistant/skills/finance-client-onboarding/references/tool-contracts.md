# Tool Contracts (Client Onboarding)

## Required Tools

- `finance_capture_investor_profile(profile)`
- `finance_capture_client_goals(goals)`
- `finance_build_investment_policy_statement(profile|profileId, goals|goalsId, portfolio?|portfolioId?)`

## Important Rules

- `profile` and `profileId`: at least one is required to build IPS.
- `goals` and `goalsId`: at least one is required to build IPS.
- If both direct object and id are supplied, direct object takes priority.
- Include assumptions and missing input warnings in onboarding output.

## Key Outputs

- `finance_capture_client_goals` -> `goalsId`, `coverage`, `warnings`
- `finance_build_investment_policy_statement` -> `ipsId`, `ips.riskProfileTier`, guardrails, `disclaimer`
