/**
 * Utility functions for symbol/ticker conversion
 */

/**
 * Add USDT suffix to clean ticker for technical analysis API (BTC -> BTCUSDT)
 */
export function addUSDT(ticker: string): string {
    return `${ticker}USDT`;
}
