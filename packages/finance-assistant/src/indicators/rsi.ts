export function computeRsi(values: number[], period = 14): number {
	if (values.length <= period) {
		return Number.NaN;
	}

	let gains = 0;
	let losses = 0;
	for (let i = values.length - period; i < values.length; i++) {
		const prev = values[i - 1];
		const next = values[i];
		const change = next - prev;
		if (change >= 0) {
			gains += change;
		} else {
			losses += Math.abs(change);
		}
	}

	if (losses === 0) {
		return 100;
	}

	const avgGain = gains / period;
	const avgLoss = losses / period;
	const rs = avgGain / avgLoss;
	return 100 - 100 / (1 + rs);
}
