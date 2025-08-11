#!/bin/bash
# Render build script

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Create logs directory if it doesn't exist (for development)
echo "📁 Creating logs directory..."
mkdir -p logs || echo "Logs directory creation skipped (production)"

# Run database migrations
echo "🗄️ Running database migrations..."
npm run migrate

# Seed database with initial data
echo "🌱 Seeding database..."
npm run seed

echo "✅ Build completed successfully!"