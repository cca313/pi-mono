import { computeEma } from "./ma.js";

export interface MacdResult {
	line: number;
	signal: number;
	histogram: number;
}

export function computeMacd(values: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MacdResult {
	if (values.length < slowPeriod) {
		return { line: Number.NaN, signal: Number.NaN, histogram: Number.NaN };
	}

	const line = computeEma(values, fastPeriod) - computeEma(values, slowPeriod);
	const macdSeed = values.map((_v, index) => {
		const chunk = values.slice(0, index + 1);
		return computeEma(chunk, fastPeriod) - computeEma(chunk, slowPeriod);
	});
	const signal = computeEma(
		macdSeed.filter((item) => Number.isFinite(item)),
		signalPeriod,
	);

	return {
		line,
		signal,
		histogram: line - signal,
	};
}
