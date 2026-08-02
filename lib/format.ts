/** Input is always in millions, per the lib/finance/types unit convention. */
export function formatCurrency(millions: number): string {
  const sign = millions < 0 ? "-" : "";
  const abs = Math.abs(millions);
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(2)}B`;
  }
  return `${sign}$${abs.toFixed(1)}M`;
}

export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPerShare(value: number): string {
  return `$${value.toFixed(2)}`;
}
