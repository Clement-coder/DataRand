#!/bin/bash

echo "🔧 Applying Task Funding Fix..."
echo ""

# Check if we're in the right directory
if [ ! -d "dataRand_front-end" ] || [ ! -d "back-end" ]; then
    echo "❌ Error: Please run this script from the DataRand project root"
    exit 1
fi

echo "📦 Installing dependencies..."
cd back-end
npm install
cd ..

cd dataRand_front-end
npm install
cd ..

echo ""
echo "🗄️  Database Migration"
echo "Please run the following SQL in your Supabase SQL editor:"
echo ""
cat sql/10_add_funding_tx_hash.sql
echo ""
echo "Or run: psql <your-connection-string> -f sql/10_add_funding_tx_hash.sql"
echo ""

echo "✅ Code changes applied!"
echo ""
echo "📝 Next steps:"
echo "1. Apply the database migration (see above)"
echo "2. Restart your backend: cd back-end && npm start"
echo "3. Restart your frontend: cd dataRand_front-end && npm run dev"
echo "4. Test task creation and funding"
echo ""
echo "📖 See TASK_FUNDING_FIX.md for detailed documentation"
