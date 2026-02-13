export function computeSma(values: number[], period: number): number {
	if (values.length < period || period <= 0) {
		return Number.NaN;
	}

	const window = values.slice(values.length - period);
	const sum = window.reduce((acc, value) => acc + value, 0);
	return sum / period;
}

export function computeEma(values: number[], period: number): number {
	if (values.length === 0 || period <= 0) {
		return Number.NaN;
	}

	const k = 2 / (period + 1);
	let ema = values[0];
	for (let i = 1; i < values.length; i++) {
		ema = values[i] * k + ema * (1 - k);
	}
	return ema;
}
