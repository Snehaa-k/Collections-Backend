#!/bin/bash
# Render build script

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Create logs directory if it doesn't exist (for development)
echo "📁 Creating logs directory..."
mkdir -p logs || echo "Logs directory creation skipped (production)"

echo "✅ Build completed successfully!"
echo "⚠️ Database migrations will run on first server start"