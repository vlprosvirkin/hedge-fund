# Environment Setup Guide

## Overview

This guide explains how to configure the system for different environments (development, testing, production) with automatic model selection to optimize costs and performance.

## 🎯 **Model Selection Strategy**

### **Production Environment**
- **OpenAI**: `gpt-4o` (highest quality, newest model)
- **Gemini**: `gemini-1.5-pro` (best quality)
- **Use Case**: Live trading decisions
- **Cost**: ~$0.0025/1k input tokens, ~$0.01/1k output tokens (OpenAI)

### **Development/Testing Environment**
- **OpenAI**: `gpt-4o-mini` (most cost-effective)
- **Gemini**: `gemini-1.5-flash` (most cost-effective)
- **Use Case**: Development, testing, validation
- **Cost**: ~$0.00015/1k input tokens, ~$0.0006/1k output tokens (OpenAI)

## 🔧 **Environment Variables**

### **Required Variables**
```bash
# AI Provider Selection
AI_PROVIDER=openai                      # openai, gemini

# API Keys (required based on provider)
OPENAI_API_KEY=your_openai_api_key_here # Required if AI_PROVIDER=openai
GEMINI_API_KEY=your_gemini_api_key_here # Required if AI_PROVIDER=gemini

# Environment (auto-selects model)
NODE_ENV=development                    # development, test, production
```

### **Optional Model Override**
```bash
# Force specific model (overrides environment detection)
OPENAI_MODEL=gpt-4o                    # Force GPT-4o (newest)
OPENAI_MODEL=gpt-4o-mini               # Force GPT-4o-mini (cheapest)
OPENAI_MODEL=gpt-4-turbo               # Force GPT-4 Turbo
OPENAI_MODEL=gpt-4                     # Force GPT-4 (legacy)
OPENAI_MODEL=gpt-3.5-turbo             # Force GPT-3.5-turbo (legacy)

GEMINI_MODEL=gemini-1.5-pro            # Force Gemini 1.5 Pro
GEMINI_MODEL=gemini-1.5-flash          # Force Gemini 1.5 Flash (cheapest)
GEMINI_MODEL=gemini-1.0-pro            # Force Gemini 1.0 Pro

# Automatically uses cost-effective models in development/testing
```

## 📊 **Cost Comparison**

| Provider | Model | Input Cost/1k | Output Cost/1k | Max Tokens | Use Case |
|----------|-------|---------------|----------------|------------|----------|
| OpenAI | GPT-4o | $0.0025 | $0.01 | 128,000 | Production (newest) |
| OpenAI | GPT-4o-mini | $0.00015 | $0.0006 | 128,000 | Testing/Dev (cheapest) |
| OpenAI | GPT-4 Turbo | $0.01 | $0.03 | 128,000 | High-volume |
| OpenAI | GPT-4 | $0.03 | $0.06 | 8,192 | Legacy |
| OpenAI | GPT-3.5 Turbo | $0.0005 | $0.0015 | 16,385 | Legacy |
| Gemini | Gemini 1.5 Pro | $0.0035 | $0.0105 | 1,000,000 | Production |
| Gemini | Gemini 1.5 Flash | $0.000075 | $0.0003 | 1,000,000 | Testing/Dev (cheapest) |
| Gemini | Gemini 1.0 Pro | $0.0005 | $0.0015 | 30,000 | Legacy |

### **Cost Savings Example**
For a typical request with 500 input tokens and 300 output tokens:
- **GPT-4o**: $0.00125 + $0.003 = **$0.00425**
- **GPT-4o-mini**: $0.000075 + $0.00018 = **$0.000255**
- **Gemini 1.5 Flash**: $0.0000375 + $0.00009 = **$0.0001275**
- **OpenAI savings**: ~94% cost reduction
- **Gemini savings**: ~97% cost reduction vs GPT-4o

## 🚀 **Setup Instructions**

### **1. Development Environment**
```bash
# .env file
NODE_ENV=development
OPENAI_API_KEY=your_key_here
# Automatically uses gpt-4o-mini
```

### **2. Testing Environment**
```bash
# .env file
NODE_ENV=test
OPENAI_API_KEY=your_key_here
# Automatically uses gpt-4o-mini
```

### **3. Production Environment**
```bash
# .env file
NODE_ENV=production
OPENAI_API_KEY=your_key_here
# Automatically uses gpt-4o
```

### **4. Manual Override**
```bash
# Force specific model regardless of environment
OPENAI_MODEL=gpt-3.5-turbo
```

## 🔍 **Monitoring and Debugging**

### **Model Information**
The system logs model selection and usage:
```bash
🤖 OpenAI Service initialized with model: gpt-4o-mini
🔍 OpenAI Request ID: fundamental_1234567890_abc123 using model: gpt-4o-mini
💰 Token usage: 500 input + 300 output = 800 total (gpt-4o-mini)
```

### **Cost Tracking**
Token usage is logged for each request:
- Input tokens (prompt)
- Output tokens (response)
- Total tokens
- Model used

### **Model Info API**
```typescript
const openaiService = new OpenAIService();
const modelInfo = openaiService.getModelInfo();
console.log(modelInfo);
// Output: { model: 'gpt-4o-mini', costPer1kTokens: '$0.00015 (input) / $0.0006 (output)', maxTokens: 128000 }
```

## 📋 **Environment Configuration Examples**

### **Development Environment**
```bash
NODE_ENV=development
OPENAI_API_KEY=sk-...
```
**Result**: Uses `gpt-4o-mini` for development (cost-effective)

### **Testing Environment**
```bash
NODE_ENV=test
OPENAI_API_KEY=sk-...
```
**Result**: Uses `gpt-4o-mini` for testing

### **Production Environment**
```bash
NODE_ENV=production
OPENAI_API_KEY=sk-...
```
**Result**: Uses `gpt-4o` for production

### **Manual Override**
```bash
NODE_ENV=production
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```
**Result**: Uses `gpt-4o-mini` despite production environment

## 🎯 **Best Practices**

### **1. Cost Optimization**
- Use `gpt-4o-mini` for testing and development
- Use `gpt-4o` only for production and critical development
- Monitor token usage with built-in logging

### **2. Quality vs Cost Trade-off**
- **High Quality**: GPT-4o for complex reasoning
- **Cost Effective**: GPT-4o-mini for simple tasks
- **Balanced**: GPT-4 Turbo for high-volume production

### **3. Environment Separation**
- **Development**: Focus on functionality, use cheaper models
- **Testing**: Validate logic, use cheaper models
- **Production**: Optimize for quality, use best models

## 🔧 **Troubleshooting**

### **Model Selection Issues**
```bash
# Check current model
console.log(openaiService.getModelInfo());

# Force specific model
OPENAI_MODEL=gpt-4o-mini
```

### **Cost Monitoring**
```bash
# Monitor token usage in logs
grep "Token usage" logs/app.log

# Calculate costs
# Input tokens * $0.0005/1000 + Output tokens * $0.0015/1000
```

### **Performance Issues**
- **Slow responses**: Consider using GPT-4o-mini
- **Quality issues**: Switch to GPT-4o
- **Token limits**: Use GPT-4 Turbo for longer contexts

## 📈 **Cost Estimation**

### **Typical Usage Scenarios**

#### **Development Session (2 hours)**
- 50 requests with 500 input + 300 output tokens each
- **GPT-4o**: 50 × (500×$0.0025/1000 + 300×$0.01/1000) = **$0.2125**
- **GPT-4o-mini**: 50 × (500×$0.00015/1000 + 300×$0.0006/1000) = **$0.01275**
- **Savings**: ~94%

#### **Testing Session (100 tests)**
- 100 requests with 300 input + 200 output tokens each
- **GPT-4o**: 100 × (300×$0.0025/1000 + 200×$0.01/1000) = **$0.275**
- **GPT-4o-mini**: 100 × (300×$0.00015/1000 + 200×$0.0006/1000) = **$0.0165**
- **Savings**: ~94%

#### **Production Day (1000 requests)**
- 1000 requests with 800 input + 500 output tokens each
- **GPT-4o**: 1000 × (800×$0.0025/1000 + 500×$0.01/1000) = **$7.00**
- **GPT-4o-mini**: 1000 × (800×$0.00015/1000 + 500×$0.0006/1000) = **$0.42**
- **Savings**: ~94%

## 🎉 **Conclusion**

The flexible model selection system allows you to:
- **Save costs** during development and testing
- **Maintain quality** in production
- **Monitor usage** with built-in logging
- **Override settings** when needed

Configure your environment variables appropriately and enjoy significant cost savings while maintaining system quality!
