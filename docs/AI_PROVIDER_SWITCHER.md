# AI Provider Switcher

## Overview

The system now supports multiple AI providers (OpenAI and Google Gemini) with automatic model selection and cost optimization for different environments.

## 🎯 **Supported Providers**

### **OpenAI (Default)**
- **Models**: GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-4, GPT-3.5-turbo
- **Best for**: High-quality reasoning, complex analysis
- **Cost**: $0.0025-$0.06 per 1k tokens

### **Google Gemini**
- **Models**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 1.0 Pro
- **Best for**: Cost-effective development, testing
- **Cost**: $0.000075-$0.0105 per 1k tokens

## 🔧 **Configuration**

### **Environment Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_PROVIDER` | Choose AI provider | `openai`, `gemini` |
| `NODE_ENV` | Environment (auto-selects model) | `development`, `test`, `production` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GEMINI_API_KEY` | Gemini API key | `AIza...` |
| `OPENAI_MODEL` | Force specific OpenAI model | `gpt-4o`, `gpt-4o-mini` |
| `GEMINI_MODEL` | Force specific Gemini model | `gemini-1.5-pro`, `gemini-1.5-flash` |

## 📊 **Model Selection by Environment**

### **Production Environment**
- **OpenAI**: `gpt-4o` (best quality)
- **Gemini**: `gemini-1.5-pro` (best quality)

### **Development/Testing Environment**
- **OpenAI**: `gpt-4o-mini` (cost-effective)
- **Gemini**: `gemini-1.5-flash` (cost-effective)

## 🚀 **Usage Examples**

### **OpenAI Provider (Default)**
```bash
# .env file
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
NODE_ENV=development
```
**Result**: Uses `gpt-4o-mini` for development

### **Gemini Provider**
```bash
# .env file
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
NODE_ENV=development
```
**Result**: Uses `gemini-1.5-flash` for development

### **Production with OpenAI**
```bash
# .env file
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
NODE_ENV=production
```
**Result**: Uses `gpt-4o` for production

### **Production with Gemini**
```bash
# .env file
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
NODE_ENV=production
```
**Result**: Uses `gemini-1.5-pro` for production

### **Manual Model Override**
```bash
# Force specific model regardless of environment
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```
**Result**: Uses `gpt-4o-mini` regardless of environment

## 📈 **Cost Comparison**

### **Development Session (50 requests, 500 input + 300 output tokens each)**

#### **OpenAI**
- **GPT-4o**: $0.21
- **GPT-4o-mini**: $0.013
- **Savings**: ~94%

#### **Gemini**
- **Gemini 1.5 Pro**: $0.35
- **Gemini 1.5 Flash**: $0.00375
- **Savings**: ~99%

### **Cross-Provider Comparison**
- **OpenAI GPT-4o-mini**: $0.013
- **Gemini 1.5 Flash**: $0.00375
- **Gemini savings**: ~71% vs OpenAI

## 🔍 **Implementation Details**

### **Provider Factory**
```typescript
import { AIProviderFactory } from './services/ai-provider-factory.js';

// Create provider based on environment
const provider = AIProviderFactory.createProvider();

// Validate configuration
const validation = AIProviderFactory.validateConfiguration();
if (!validation.isValid) {
    console.error('Configuration errors:', validation.errors);
}

// Get available providers
const providers = AIProviderFactory.getAvailableProviders();
```

### **Unified Interface**
Both providers implement the same interface:
```typescript
interface AIProvider {
    generateClaimsWithReasoning(systemPrompt: string, userPrompt: string, context: any): Promise<AIProviderResponse>;
    generateClaims(systemPrompt: string, userPrompt: string, context: any): Promise<Claim[]>;
    generateResponse(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string>;
    getModelInfo(): { model: string; costPer1kTokens: string; maxTokens: number };
}
```

## 🎯 **Provider Selection Strategy**

### **When to Use OpenAI**
- **High-quality reasoning** required
- **Complex analysis** tasks
- **Production trading** decisions
- **Budget allows** for premium models

### **When to Use Gemini**
- **Development and testing**
- **Cost-sensitive** operations
- **Simple reasoning** tasks
- **High-volume** processing

## 🔧 **Setup Instructions**

### **1. OpenAI Setup**
```bash
# Install dependencies (already included)
npm install openai

# Configure environment
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key
NODE_ENV=development
```

### **2. Gemini Setup**
```bash
# Install dependencies
npm install @google/generative-ai

# Configure environment
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza-your-gemini-key
NODE_ENV=development
```

### **3. Validation**
```typescript
// Check configuration
const validation = AIProviderFactory.validateConfiguration();
console.log('Configuration valid:', validation.isValid);
console.log('Errors:', validation.errors);
```

## 📊 **Monitoring and Debugging**

### **Provider Information**
```typescript
const provider = AIProviderFactory.createProvider();
const modelInfo = provider.getModelInfo();
console.log(modelInfo);
// Output: { model: 'gpt-4o-mini', costPer1kTokens: '$0.00015 (input) / $0.0006 (output)', maxTokens: 128000 }
```

### **Log Output**
```bash
🤖 Creating AI provider: openai
🤖 OpenAI Service initialized with model: gpt-4o-mini
🔍 OpenAI Request ID: fundamental_1234567890_abc123 using model: gpt-4o-mini
💰 Token usage: 500 input + 300 output = 800 total (gpt-4o-mini)
```

## 🎯 **Best Practices**

### **1. Provider Selection**
- **Development**: Use Gemini for cost savings
- **Testing**: Use Gemini for high-volume testing
- **Production**: Use OpenAI for quality assurance

### **2. Model Selection**
- **High Quality**: GPT-4o, Gemini 1.5 Pro
- **Cost Effective**: GPT-4o-mini, Gemini 1.5 Flash
- **Balanced**: GPT-4 Turbo, Gemini 1.0 Pro

### **3. Environment Configuration**
- **Development**: Focus on functionality, use cheaper models
- **Testing**: Validate logic, use cheaper models
- **Production**: Optimize for quality, use best models

## 🔧 **Troubleshooting**

### **Configuration Issues**
```bash
# Check required API keys
echo $OPENAI_API_KEY
echo $GEMINI_API_KEY

# Validate configuration
node -e "const { AIProviderFactory } = require('./dist/services/ai-provider-factory.js'); console.log(AIProviderFactory.validateConfiguration());"
```

### **Provider Issues**
```bash
# Check provider selection
echo $AI_PROVIDER

# Force specific provider
AI_PROVIDER=openai
```

### **Model Issues**
```bash
# Check model selection
echo $OPENAI_MODEL
echo $GEMINI_MODEL

# Force specific model
OPENAI_MODEL=gpt-4o-mini
```

## 🎉 **Benefits**

1. **Cost Optimization**: Choose most cost-effective provider for each use case
2. **Quality Flexibility**: Use best models for production, cheaper for development
3. **Provider Diversity**: Avoid vendor lock-in, compare performance
4. **Easy Switching**: Simple environment variable to change providers
5. **Unified Interface**: Same API regardless of provider

## 📋 **Migration Guide**

### **From OpenAI Only**
1. **Add Gemini API key** to environment
2. **Set AI_PROVIDER** to desired provider
3. **Test with both providers** to compare performance
4. **Choose optimal provider** for each environment

### **To Multi-Provider**
1. **Install Gemini dependency**: `npm install @google/generative-ai`
2. **Update environment variables** with provider selection
3. **Validate configuration** with AIProviderFactory
4. **Test both providers** in development environment

The AI Provider Switcher provides maximum flexibility for cost optimization and quality assurance across different environments!
