#!/bin/bash

echo "🚀 Installing packages for Admin Dashboard redesign..."

# Core Data Management
echo "📊 Installing data table and query packages..."
npm install --legacy-peer-deps \
  @tanstack/react-table@latest \
  @tanstack/react-query@latest \
  @tanstack/react-query-devtools@latest

# Charts & Visualization  
echo "📈 Installing chart libraries..."
npm install --legacy-peer-deps \
  recharts@latest \
  react-chartjs-2@latest \
  chart.js@latest

# Developer Tools
echo "🛠️ Installing developer tool packages..."
npm install --legacy-peer-deps \
  react-json-view@latest \
  @monaco-editor/react@latest \
  react-hotkeys-hook@latest

# Enhanced UI Components
echo "✨ Installing UI enhancement packages..."
npm install --legacy-peer-deps \
  react-hot-toast@latest \
  cmdk@latest \
  vaul@latest \
  sonner@latest

# File Management
echo "📁 Installing file management packages..."
npm install --legacy-peer-deps \
  react-dropzone@latest \
  papaparse@latest \
  xlsx@latest

# Utilities
echo "🔧 Installing utility packages..."
npm install --legacy-peer-deps \
  fuse.js@latest \
  date-fns@latest \
  zustand@latest \
  next-themes@latest

# Additional shadcn/ui components we'll need
echo "🎨 Installing additional Radix UI components..."
npm install --legacy-peer-deps \
  @radix-ui/react-dialog@latest \
  @radix-ui/react-dropdown-menu@latest \
  @radix-ui/react-tabs@latest \
  @radix-ui/react-toast@latest \
  @radix-ui/react-tooltip@latest \
  @radix-ui/react-select@latest \
  @radix-ui/react-checkbox@latest \
  @radix-ui/react-switch@latest \
  @radix-ui/react-separator@latest \
  @radix-ui/react-navigation-menu@latest \
  @radix-ui/react-collapsible@latest \
  @radix-ui/react-alert-dialog@latest

echo "✅ Package installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Run 'chmod +x scripts/install-admin-packages.sh' to make this executable"
echo "2. Run './scripts/install-admin-packages.sh' to install packages"
echo "3. Start implementing the new admin dashboard components"