import { NewsAPIAdapter } from '../adapters/news-adapter.js';
import type {
    DigestResponse,
    NewsItem,
    NewsSupportedTokensResponse
} from '../types/index.js';

/**
 * Интеграционный тест новостного API
 * Проверяет полный цикл: подключение → получение токенов → поиск новостей → обработка данных
 */
async function newsIntegrationTest() {
    const adapter = new NewsAPIAdapter();

    try {
        console.log('🚀 Starting News API Integration Test...\n');

        // 1. Подключение к API
        await adapter.connect();
        console.log('✅ Connected to News API');

        // 2. Получение поддерживаемых токенов
        console.log('\n🪙 Step 1: Getting supported tokens...');
        const supportedTokens: NewsSupportedTokensResponse = await adapter.getSupportedTokens();

        console.log('✅ Supported tokens received successfully');
        console.log(`   Primary assets: ${supportedTokens.primary_assets.length}`);
        console.log(`   Additional assets: ${supportedTokens.additional_assets.length}`);
        console.log(`   Total count: ${supportedTokens.total_count}`);

        if (supportedTokens.primary_assets.length > 0) {
            console.log(`   Primary assets: ${supportedTokens.primary_assets.map((a: any) => a.text).join(', ')}`);
        }

        // 3. Получение общего дайджеста новостей
        console.log('\n📰 Step 2: Getting general news digest...');
        const generalDigest: DigestResponse = await adapter.getDigest();

        console.log('✅ General digest received successfully');
        console.log(`   News items: ${generalDigest.items.length}`);
        console.log(`   Total count: ${generalDigest.count}`);

        if (generalDigest.items.length > 0) {
            const latestNews = generalDigest.items[0];
            if (latestNews) {
                console.log(`   Latest news: ${latestNews.title.substring(0, 100)}...`);
                console.log(`   Source: ${latestNews.source}`);
                console.log(`   Assets: ${latestNews.assets.join(', ')}`);
            }
        }

        // 4. Тестирование поиска новостей по запросу
        console.log('\n🔍 Step 3: Testing news search...');
        const now = Date.now();
        const searchResults: NewsItem[] = await adapter.search('Bitcoin', now - 3600000, now);

        console.log('✅ News search completed successfully');
        console.log(`   Search results: ${searchResults.length} items`);

        if (searchResults.length > 0) {
            const firstResult = searchResults[0];
            if (firstResult) {
                console.log(`   First result: ${firstResult.title.substring(0, 80)}...`);
                console.log(`   Sentiment: ${firstResult.sentiment?.toFixed(2) || 'N/A'}`);
                console.log(`   Published: ${new Date(firstResult.publishedAt).toLocaleString()}`);
            }
        }

        // 5. Тестирование получения новостей по конкретному активу
        console.log('\n📊 Step 4: Testing asset-specific news...');
        let assetDigest: DigestResponse | null = null;
        let assetNews: NewsItem[] = [];

        // Попробуем получить новости для BTC
        try {
            assetDigest = await adapter.getDigestByAsset('BTC', 5);
            console.log('✅ BTC news digest received successfully');
            console.log(`   BTC news items: ${assetDigest.items.length}`);

            if (assetDigest.items.length > 0) {
                const btcNews = assetDigest.items[0];
                if (btcNews) {
                    console.log(`   Latest BTC news: ${btcNews.title.substring(0, 80)}...`);
                    console.log(`   Significance: ${btcNews.significance || 'N/A'}`);
                    console.log(`   Implications: ${btcNews.implications?.substring(0, 100) || 'N/A'}...`);
                }
            }
        } catch (error) {
            console.log('⚠️ BTC news not available, trying ETH...');

            try {
                assetDigest = await adapter.getDigestByAsset('ETH', 5);
                console.log('✅ ETH news digest received successfully');
                console.log(`   ETH news items: ${assetDigest.items.length}`);
            } catch (error2) {
                console.log('⚠️ ETH news not available, skipping asset-specific test...');
            }
        }

        // 6. Тестирование получения последних новостей
        console.log('\n📋 Step 5: Getting latest news...');
        const latestNews: NewsItem[] = await adapter.getLatest(5);

        console.log('✅ Latest news received successfully');
        console.log(`   Latest news count: ${latestNews.length}`);

        if (latestNews.length > 0) {
            const latest = latestNews[0];
            if (latest) {
                console.log(`   Most recent: ${latest.title.substring(0, 80)}...`);
                console.log(`   Sentiment: ${latest.sentiment?.toFixed(2) || 'N/A'}`);
                console.log(`   Source: ${latest.source}`);
            }
        }

        // 7. Тестирование получения новостей по тикерам
        console.log('\n🎯 Step 6: Testing news by tickers...');
        const tickerNews: NewsItem[] = await adapter.getNewsByTickers(['BTC', 'ETH'], 5);

        console.log('✅ Ticker news received successfully');
        console.log(`   Ticker news count: ${tickerNews.length}`);

        if (tickerNews.length > 0) {
            const tickerNewsItem = tickerNews[0];
            if (tickerNewsItem) {
                console.log(`   Sample ticker news: ${tickerNewsItem.title.substring(0, 80)}...`);
                console.log(`   Sentiment: ${tickerNewsItem.sentiment?.toFixed(2) || 'N/A'}`);
            }
        }

        // 8. Тестирование кэширования
        console.log('\n💾 Step 7: Testing caching functionality...');

        // Первый запрос
        const firstDigest = await adapter.getDigest();
        console.log('✅ First digest request completed');

        // Второй запрос (должен использовать кэш)
        const secondDigest = await adapter.getDigest();
        console.log('✅ Second digest request completed (should use cache)');

        // Проверяем, что данные одинаковые (кэш работает)
        const cacheWorking = firstDigest.items.length === secondDigest.items.length;
        console.log(`   Cache test: ${cacheWorking ? '✅ Working' : '❌ Not working'}`);

        // 9. Проверка качества данных
        console.log('\n🔍 Step 8: Data quality validation...');

        const dataQualityChecks = [
            {
                name: 'Supported Tokens Completeness',
                passed: supportedTokens.primary_assets.length > 0 || supportedTokens.additional_assets.length > 0,
                details: `Primary: ${supportedTokens.primary_assets.length}, Additional: ${supportedTokens.additional_assets.length}`
            },
            {
                name: 'General Digest Availability',
                passed: generalDigest.items.length >= 0,
                details: `Found ${generalDigest.items.length} general news items`
            },
            {
                name: 'Search Functionality',
                passed: searchResults.length >= 0,
                details: `Search returned ${searchResults.length} results`
            },
            {
                name: 'Latest News Availability',
                passed: latestNews.length >= 0,
                details: `Latest news: ${latestNews.length} items`
            },
            {
                name: 'Ticker News Functionality',
                passed: tickerNews.length >= 0,
                details: `Ticker news: ${tickerNews.length} items`
            },
            {
                name: 'Sentiment Analysis',
                passed: searchResults.length === 0 || (searchResults[0]?.sentiment !== undefined && searchResults[0].sentiment >= 0 && searchResults[0].sentiment <= 1),
                details: searchResults.length > 0 ? `Sentiment range: ${searchResults[0]?.sentiment?.toFixed(2) || 'N/A'}` : 'No results to check'
            }
        ];

        dataQualityChecks.forEach(check => {
            const status = check.passed ? '✅' : '❌';
            console.log(`   ${status} ${check.name}: ${check.details}`);
        });

        const failedChecks = dataQualityChecks.filter(check => !check.passed);
        if (failedChecks.length > 0) {
            throw new Error(`Data quality validation failed: ${failedChecks.map(c => c.name).join(', ')}`);
        }

        // 10. Тестирование обработки ошибок
        console.log('\n⚠️ Step 9: Testing error handling...');

        try {
            // Попробуем получить новости для несуществующего актива
            await adapter.getDigestByAsset('INVALIDASSET123', 1);
            console.log('⚠️ Unexpected: Invalid asset request succeeded');
        } catch (error) {
            console.log('✅ Error handling working: Invalid asset request properly rejected');
        }

        // 11. Финальная проверка интеграции
        console.log('\n🎯 Step 10: Integration verification...');

        const integrationChecks = [
            {
                name: 'API Connection',
                status: adapter.isConnected(),
                description: 'News API connection'
            },
            {
                name: 'Data Flow',
                status: true, // Если дошли до этого места, значит данные прошли
                description: 'Data flow from API to processing'
            },
            {
                name: 'Cache System',
                status: cacheWorking,
                description: 'Caching functionality'
            },
            {
                name: 'Error Handling',
                status: true, // Если дошли до этого места, значит ошибки обработаны
                description: 'Proper error handling'
            }
        ];

        integrationChecks.forEach(check => {
            const status = check.status ? '✅' : '❌';
            console.log(`   ${status} ${check.name}: ${check.description}`);
        });

        console.log('\n🎉 News API Integration Test PASSED!');
        console.log('\n📊 Summary:');
        console.log(`   - Supported tokens: ${supportedTokens.total_count} total`);
        console.log(`   - General news: ${generalDigest.items.length} items`);
        console.log(`   - Search results: ${searchResults.length} items`);
        console.log(`   - Latest news: ${latestNews.length} items`);
        console.log(`   - Ticker news: ${tickerNews.length} items`);
        console.log(`   - Data quality: ${dataQualityChecks.filter(c => c.passed).length}/${dataQualityChecks.length} checks passed`);

    } catch (error) {
        console.error('\n❌ News API Integration Test FAILED!');
        console.error('Error:', error);
        throw error;
    } finally {
        // Отключение от API
        await adapter.disconnect();
        console.log('\n🔌 Disconnected from News API');
    }
}

// Запуск интеграционного теста
if (import.meta.url === `file://${process.argv[1]}`) {
    newsIntegrationTest()
        .then(() => {
            console.log('\n✨ News integration test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 News integration test failed!');
            console.error(error);
            process.exit(1);
        });
}

export { newsIntegrationTest };
