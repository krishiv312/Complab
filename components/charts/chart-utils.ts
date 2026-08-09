/** Rounds a max value up to a "nice" axis ceiling (1/2/2.5/5 * 10^n), and
 * returns evenly-spaced tick values from 0 to that ceiling. */
export function niceAxisTicks(maxValue: number, tickCount = 5): number[] {
  if (maxValue <= 0) return [0];
  const rawStep = maxValue / (tickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  const step = niceNormalized * magnitude;
  const ceiling = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= ceiling + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

function niceStep(range: number, tickCount: number): number {
  const rawStep = range / Math.max(tickCount - 1, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const normalized = rawStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

/** Like niceAxisTicks, but for a domain that may span negative values (e.g. growth %). */
export function niceDomainTicks(min: number, max: number, tickCount = 5): number[] {
  if (min === max) return [min - 1, min, min + 1];
  const step = niceStep(max - min, tickCount);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v * 10000) / 10000);
  return ticks;
}
