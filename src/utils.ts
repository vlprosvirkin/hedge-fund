/**
 * Utility functions for symbol/ticker conversion
 */

/**
 * Add USD suffix for technical analysis API (BTC -> BTCUSD, BTCUSDT -> BTCUSD)
 * @deprecated Use addUSDSuffixForAPI instead
 */
export function addUSDSuffix(ticker: string): string {
    return addUSDSuffixForAPI(ticker);
}

/**
 * Add USD suffix for external APIs that require it (BTC -> BTCUSD)
 * Use this only in adapters when calling external APIs
 */
export function addUSDSuffixForAPI(ticker: string): string {
    // If ticker already ends with USDT, remove it and add USD
    if (ticker.endsWith('USDT')) {
        return ticker.slice(0, -4) + 'USD';
    }
    // If ticker already ends with USD, return as is
    if (ticker.endsWith('USD')) {
        return ticker;
    }
    // Otherwise add USD suffix
    return `${ticker}USD`;
}

/**
 * Add USDT suffix for Binance API (BTC -> BTCUSDT)
 * Use this only in Binance adapter when calling Binance API
 */
export function addUSDTSuffixForBinance(ticker: string): string {
    // If ticker already ends with USDT, return as is
    if (ticker.endsWith('USDT')) {
        return ticker;
    }
    // If ticker ends with USD, replace with USDT
    if (ticker.endsWith('USD')) {
        return ticker.slice(0, -3) + 'USDT';
    }
    // Otherwise add USDT suffix
    return `${ticker}USDT`;
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
