export function computeMaxDrawdown(values: number[]): number {
	if (values.length === 0) {
		return Number.NaN;
	}

	let peak = values[0];
	let maxDrawdown = 0;

	for (const value of values) {
		if (value > peak) {
			peak = value;
			continue;
		}

		const drawdown = (value - peak) / peak;
		if (drawdown < maxDrawdown) {
			maxDrawdown = drawdown;
		}
	}

	return maxDrawdown;
}
