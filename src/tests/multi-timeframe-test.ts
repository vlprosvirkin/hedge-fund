import { TechnicalAnalysisService } from '../services/analysis/technical-analysis.service.js';
import { Signals } from '../adapters/signals-adapter.js';

async function testMultiTimeframeAnalysis() {
    console.log('🚀 Starting Multi-Timeframe Analysis Test...\n');

    const technicalAnalysis = new TechnicalAnalysisService(new Signals());

    try {
        // Test with BTC
        const symbol = 'BTC';
        console.log(`📊 Testing multi-timeframe analysis for ${symbol}...`);

        // Get multi-timeframe data
        console.log('📈 Getting multi-timeframe data...');
        const timeframeData = await technicalAnalysis.getMultiTimeframeData(symbol);

        console.log('✅ Multi-timeframe data received:');
        console.log(`   H1: ${Object.keys(timeframeData.h1).length} indicators`);
        console.log(`   H4: ${Object.keys(timeframeData.h4).length} indicators`);
        console.log(`   D1: ${Object.keys(timeframeData.d1).length} indicators`);

        // Calculate multi-timeframe strength
        console.log('\n🎯 Calculating multi-timeframe signal strength...');
        const multiTimeframeResult = technicalAnalysis.calculateMultiTimeframeStrength(timeframeData);

        console.log('✅ Multi-timeframe analysis completed:');
        console.log(`   Overall Strength: ${multiTimeframeResult.strength.toFixed(3)}`);
        console.log(`   Alignment: ${(multiTimeframeResult.alignment * 100).toFixed(1)}%`);

        console.log('\n📊 Timeframe Details:');
        console.log(`   H1: Strength ${multiTimeframeResult.timeframes.h1.strength.toFixed(3)}, Regime: ${multiTimeframeResult.timeframes.h1.regime}`);
        console.log(`   H4: Strength ${multiTimeframeResult.timeframes.h4.strength.toFixed(3)}, Regime: ${multiTimeframeResult.timeframes.h4.regime}`);
        console.log(`   D1: Strength ${multiTimeframeResult.timeframes.d1.strength.toFixed(3)}, Regime: ${multiTimeframeResult.timeframes.d1.regime}`);

        // Test alignment bonus
        if (multiTimeframeResult.alignment >= 0.67) {
            console.log('\n🎉 High alignment detected! All timeframes agree on direction.');
        } else if (multiTimeframeResult.alignment >= 0.33) {
            console.log('\n⚠️ Moderate alignment detected. Some timeframes disagree.');
        } else {
            console.log('\n❌ Low alignment detected. Timeframes are mixed.');
        }

        // Test with ETH
        console.log('\n📊 Testing multi-timeframe analysis for ETH...');
        const ethTimeframeData = await technicalAnalysis.getMultiTimeframeData('ETH');
        const ethResult = technicalAnalysis.calculateMultiTimeframeStrength(ethTimeframeData);

        console.log('✅ ETH Multi-timeframe analysis:');
        console.log(`   Overall Strength: ${ethResult.strength.toFixed(3)}`);
        console.log(`   Alignment: ${(ethResult.alignment * 100).toFixed(1)}%`);

        console.log('\n🎉 Multi-Timeframe Analysis Test PASSED!');

    } catch (error) {
        console.error('❌ Multi-Timeframe Analysis Test FAILED:', error);
        throw error;
    }
}

// Run the test
testMultiTimeframeAnalysis()
    .then(() => {
        console.log('\n✨ Multi-timeframe test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Multi-timeframe test failed:', error);
        process.exit(1);
    });
