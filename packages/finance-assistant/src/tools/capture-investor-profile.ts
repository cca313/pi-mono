import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import { normalizeInvestorProfile } from "../advisory/profile.js";
import { investorProfileSchema } from "../advisory/schemas.js";
import type { InvestorProfileEnvelope } from "../advisory/types.js";
import type { FinanceAdvisoryStore } from "./advisory-store.js";

const captureInvestorProfileParameters = Type.Object({
	profile: investorProfileSchema,
});

type CaptureInvestorProfileParams = Static<typeof captureInvestorProfileParameters>;

export type FinanceCaptureInvestorProfileDetails = InvestorProfileEnvelope;

export interface CreateFinanceCaptureInvestorProfileToolOptions {
	store: FinanceAdvisoryStore;
}

export function createFinanceCaptureInvestorProfileTool(
	options: CreateFinanceCaptureInvestorProfileToolOptions,
): AgentTool<typeof captureInvestorProfileParameters, FinanceCaptureInvestorProfileDetails> {
	return {
		name: "finance_capture_investor_profile",
		label: "Finance Capture Investor Profile",
		description: "Normalize and cache an investor profile for later advisory tools.",
		parameters: captureInvestorProfileParameters,
		execute: async (_toolCallId: string, params: CaptureInvestorProfileParams) => {
			const profile = normalizeInvestorProfile(params.profile);
			const envelope = options.store.saveProfile(profile, "full", []);

			return {
				content: [
					{
						type: "text",
						text:
							`Captured investor profile (profileId=${envelope.profileId}) ` +
							`risk=${profile.riskTolerance}, horizon=${profile.investmentHorizon}.`,
					},
				],
				details: envelope,
			};
		},
	};
}
