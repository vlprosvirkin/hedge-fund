/**
 * Utility functions for symbol/ticker conversion
 */

/**
 * Add USD suffix for technical analysis API (BTC -> BTCUSD)
 */
export function addUSDSuffix(ticker: string): string {
    return `${ticker}USD`;
}
