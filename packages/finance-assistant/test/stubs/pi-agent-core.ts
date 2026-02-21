import type { Model } from "./pi-ai.js";

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

export interface AgentToolResult<TDetails> {
	content: Array<{ type: "text"; text: string }>;
	details: TDetails;
}

export interface AgentTool<TParameters = unknown, TDetails = unknown> {
	name: string;
	label: string;
	description: string;
	parameters: unknown;
	execute: (
		toolCallId: string,
		params: TParameters,
		signal?: AbortSignal,
		onUpdate?: (partial: AgentToolResult<TDetails>) => void,
	) => Promise<AgentToolResult<TDetails>>;
}

export interface AgentState {
	systemPrompt: string;
	model: Model;
	thinkingLevel: ThinkingLevel;
	tools: AgentTool[];
	messages: unknown[];
}

export class Agent {
	public state: AgentState;

	public constructor(options?: { initialState?: Partial<AgentState> }) {
		this.state = {
			systemPrompt: options?.initialState?.systemPrompt ?? "",
			model:
				options?.initialState?.model ??
				({
					id: "deepseek-chat",
					name: "DeepSeek Chat",
					api: "openai-responses",
					provider: "deepseek",
				} as Model),
			thinkingLevel: options?.initialState?.thinkingLevel ?? "off",
			tools: options?.initialState?.tools ?? [],
			messages: options?.initialState?.messages ?? [],
		};
	}

	public subscribe(_listener: (event: unknown) => void): () => void {
		return () => {};
	}

	public async prompt(_input: string): Promise<void> {
		return;
	}
}
