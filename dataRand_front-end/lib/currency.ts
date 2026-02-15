// Utility functions for currency conversion

/**
 * Convert Wei (smallest ETH unit) to ETH
 * @param wei - Amount in Wei (string or number)
 * @returns Amount in ETH
 */
export function weiToEth(wei: string | number): number {
  const weiAmount = typeof wei === 'string' ? BigInt(wei) : BigInt(Math.floor(wei));
  const ethAmount = Number(weiAmount) / 1e18;
  return ethAmount;
}

/**
 * Convert Wei to USD using current ETH price
 * @param wei - Amount in Wei
 * @param ethPrice - Current ETH price in USD (default: 2500)
 * @returns Amount in USD
 */
export function weiToUsd(wei: string | number, ethPrice: number = 2500): number {
  const eth = weiToEth(wei);
  return eth * ethPrice;
}

/**
 * Format payout amount for display
 * If amount is very large (in Wei), convert to USD
 * Otherwise show as is
 */
export function formatPayoutAmount(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // If amount is greater than 1000, it's likely in Wei
  if (numAmount > 1000) {
    const usd = weiToUsd(numAmount);
    return usd.toFixed(2);
  }
  
  // Otherwise it's already in USD
  return numAmount.toFixed(2);
}

/**
 * Get payout display with currency symbol
 */
export function getPayoutDisplay(amount: number | string): string {
  return `$${formatPayoutAmount(amount)}`;
}
