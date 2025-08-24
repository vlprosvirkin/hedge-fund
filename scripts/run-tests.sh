#!/bin/bash

echo "🧪 Running Hedge Fund Tests"
echo "=========================="

# Run the main CI test
echo "Running CI test..."
npm test

if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Tests failed!"
    exit 1
fi
