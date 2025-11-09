#!/bin/bash

# FastCheckOut Setup Script
# Automates initial project setup

set -e

echo "🚀 FastCheckOut Setup Script"
echo "============================"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20+ is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Setup environment file
echo "⚙️  Setting up environment..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
    echo "⚠️  Please edit .env.local with your API keys before running"
else
    echo "ℹ️  .env.local already exists, skipping..."
fi
echo ""

# Setup Git hooks (optional)
echo "🔧 Setting up Git hooks..."
if [ -d .git ]; then
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."
npm run lint
EOF
    chmod +x .git/hooks/pre-commit
    echo "✅ Git pre-commit hook installed"
else
    echo "ℹ️  Not a git repository, skipping hooks..."
fi
echo ""

# Install Playwright browsers (for E2E tests)
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps chromium
echo "✅ Playwright browsers installed"
echo ""

# Build project
echo "🏗️  Building project..."
npm run build
echo "✅ Project built successfully"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Stripe and PayPal keys"
echo "2. Run: npm run dev"
echo "3. Visit: http://localhost:3000/checkout"
echo ""
echo "For more information, see QUICKSTART.md"
