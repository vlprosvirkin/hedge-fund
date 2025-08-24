/**
 * Utility functions for symbol/ticker conversion
 */

/**
 * Add USD suffix for technical analysis API (BTC -> BTCUSD)
 */
export function addUSDSuffix(ticker: string): string {
    return `${ticker}USD`;
}

/**
 * Convert token quantity to USDT amount for Aspis API
 * @param quantity - Number of tokens to buy/sell
 * @param symbol - Token symbol (BTC, ETH, etc.)
 * @param currentPrice - Current price of the token in USDT
 * @returns USDT amount to spend/receive
 */
export function convertQuantityToUsdt(quantity: number, symbol: string, currentPrice: number): number {
    return quantity * currentPrice;
}

/**
 * Convert USDT amount to token quantity
 * @param usdtAmount - USDT amount to spend
 * @param symbol - Token symbol (BTC, ETH, etc.)
 * @param currentPrice - Current price of the token in USDT
 * @returns Number of tokens to buy/sell
 */
export function convertUsdtToQuantity(usdtAmount: number, symbol: string, currentPrice: number): number {
    return usdtAmount / currentPrice;
}
