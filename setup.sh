#!/bin/bash

echo "🎉 Citizenly MVP - Quick Setup"
echo "============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the citizenly-mvp directory"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your actual values:"
    echo "   - Set DATABASE_URL to your PostgreSQL connection"
    echo "   - Set JWT_SECRET to a secure 32+ character string"
    echo ""
    read -p "Press Enter to continue once you've updated .env..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check environment variables
echo "🔍 Checking environment variables..."
npm run db:check-env

if [ $? -ne 0 ]; then
    echo "❌ Environment check failed. Please fix your .env file and try again."
    exit 1
fi

# Set up database
echo "🗄️ Setting up database..."
npm run db:setup

if [ $? -ne 0 ]; then
    echo "❌ Database setup failed. Make sure PostgreSQL is running and DATABASE_URL is correct."
    exit 1
fi

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "✅ Dependencies installed"
echo "✅ Database schema created"
echo "✅ Test data seeded"
echo ""
echo "🚀 To start development:"
echo "   npm run dev"
echo ""
echo "🧪 Test accounts:"
echo "   Citizen: citizen@test.com / password123"
echo "   Politician: politician@test.com / password123"
echo "   Admin: admin@citizenly.com / admin123"
echo ""
echo "📖 Visit: http://localhost:3000"
echo ""
echo "🎉 Ready to build civic engagement features!"
