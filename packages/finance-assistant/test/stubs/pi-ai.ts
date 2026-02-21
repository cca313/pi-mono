export type Api = string;
export type KnownProvider = string;

export interface Model<TApi = Api> {
	id: string;
	name: string;
	api: TApi;
	provider: string;
	baseUrl?: string;
	reasoning?: boolean;
	input?: string[];
	cost?: {
		input: number;
		output: number;
		cacheRead: number;
		cacheWrite: number;
	};
	contextWindow?: number;
	maxTokens?: number;
}

const MODELS: Model<Api>[] = [
	{
		id: "deepseek-chat",
		name: "DeepSeek Chat",
		api: "openai-responses",
		provider: "deepseek",
		baseUrl: "https://api.deepseek.com",
		reasoning: false,
	},
	{
		id: "gpt-4o",
		name: "GPT-4o",
		api: "openai-responses",
		provider: "openai",
		baseUrl: "https://api.openai.com",
		reasoning: false,
	},
];

export function getProviders(): string[] {
	return Array.from(new Set(MODELS.map((model) => model.provider)));
}

export function getModels(provider: string): Model<Api>[] {
	return MODELS.filter((model) => model.provider === provider);
}

export function getModel(provider: string, id: string): Model<Api> {
	const model = MODELS.find((candidate) => candidate.provider === provider && candidate.id === id);
	if (!model) {
		throw new Error(`Model not found: ${provider}/${id}`);
	}

	return model;
}
