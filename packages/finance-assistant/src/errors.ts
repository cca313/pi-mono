export class FinanceAssistantError extends Error {
	public readonly code: string;

	public constructor(code: string, message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "FinanceAssistantError";
		this.code = code;
	}
}
