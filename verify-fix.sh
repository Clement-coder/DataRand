#!/bin/bash

echo "🔍 Verifying Task Funding Fix..."
echo ""

# Check if files were modified
echo "✓ Checking modified files..."

files=(
    "back-end/src/services/escrowService.js"
    "back-end/src/services/taskService.js"
    "back-end/src/controllers/taskController.js"
    "back-end/src/routes/taskRoutes.js"
    "dataRand_front-end/lib/datarand.ts"
    "dataRand_front-end/components/pages/client/CreateTask.tsx"
    "sql/10_add_funding_tx_hash.sql"
)

all_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        all_exist=false
    fi
done

echo ""

# Check for key changes
echo "✓ Checking key code changes..."

if grep -q "verifyTaskFunding" back-end/src/services/escrowService.js; then
    echo "  ✅ verifyTaskFunding function added"
else
    echo "  ❌ verifyTaskFunding function not found"
fi

if grep -q "confirmTaskFunding" back-end/src/services/taskService.js; then
    echo "  ✅ confirmTaskFunding function added"
else
    echo "  ❌ confirmTaskFunding function not found"
fi

if grep -q "confirm-funding" back-end/src/routes/taskRoutes.js; then
    echo "  ✅ confirm-funding route added"
else
    echo "  ❌ confirm-funding route not found"
fi

if grep -q "eth_sendTransaction" dataRand_front-end/components/pages/client/CreateTask.tsx; then
    echo "  ✅ Wallet transaction signing added"
else
    echo "  ❌ Wallet transaction signing not found"
fi

echo ""

# Check database migration
echo "✓ Checking database migration..."
if [ -f "sql/10_add_funding_tx_hash.sql" ]; then
    echo "  ✅ Migration file exists"
    echo "  ⚠️  Remember to apply it in Supabase!"
else
    echo "  ❌ Migration file not found"
fi

echo ""
echo "📋 Summary:"
if [ "$all_exist" = true ]; then
    echo "  ✅ All files are in place"
    echo ""
    echo "Next steps:"
    echo "  1. Apply database migration in Supabase"
    echo "  2. Restart backend and frontend"
    echo "  3. Test task creation and funding"
else
    echo "  ⚠️  Some files are missing - please review"
fi
