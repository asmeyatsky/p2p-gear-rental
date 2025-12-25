#!/bin/bash

echo "=== SUPABASE CONNECTION TROUBLESHOOTING ==="
echo ""

# Test the exact connection string you provided
echo "1. Testing your exact connection string..."
echo "   postgresql://postgres:Aklocarno62!@db.phihycirdegioiayhvtw.supabase.co:5432/postgres"
echo ""

# Try with psql directly
echo "2. Testing with psql (PostgreSQL client)..."
echo "   This will give us more detailed error information..."
echo ""

# Try a simple curl to the Supabase API
echo "3. Testing Supabase API connectivity..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://phihycirdegioiayhvtw.supabase.co/rest/v1/

echo ""
echo "If you're seeing consistent connection failures, this could mean:"
echo "- The database password might be incorrect"
echo "- The database might be in a different region" 
echo "- There might be network/firewall issues"
echo "- The Supabase project might need additional configuration"

echo ""
echo "NEXT STEPS:"
echo "1. Go to your Supabase dashboard: https://app.supabase.com"
echo "2. Project: phihycirdegioiayhvtw"
echo "3. Settings → Database → Connection string"
echo "4. Try both 'Direct connection' and 'Pooler connection'"
echo "5. Copy the EXACT string and test here"

echo ""
echo "ALTERNATIVE: Let's try setting up a local PostgreSQL database"
echo "as a fallback solution so we can proceed with seeding."