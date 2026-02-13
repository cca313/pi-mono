export function computeVolatility(values: number[], period = 20): number {
	if (values.length <= period) {
		return Number.NaN;
	}

	const returns: number[] = [];
	for (let i = values.length - period; i < values.length; i++) {
		const prev = values[i - 1];
		const curr = values[i];
		returns.push(Math.log(curr / prev));
	}

	const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
	const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
	return Math.sqrt(variance) * Math.sqrt(252);
}
