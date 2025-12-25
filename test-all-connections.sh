#!/bin/bash

echo "Testing different Supabase connection formats..."
echo ""

# Try pooler connection (recommended for applications)
echo "1. Testing pooler connection (6543 port):"
DATABASE_URL="postgresql://postgres.Aklocarno62!@aws-0-us-east-1.pooler.supabase.co:6543/postgres" npx tsx test-db-connection-detailed.ts 2>&1 | head -20

echo ""
echo "2. Testing direct connection (5432 port):"
DATABASE_URL="postgresql://postgres.Aklocarno62!@aws-0-us-east-1.pooler.supabase.co:5432/postgres" npx tsx test-db-connection-detailed.ts 2>&1 | head -20

echo ""
echo "3. Testing your original format:"
DATABASE_URL="postgresql://postgres:Aklocarno62!@phihycirdegioiayhvtw.supabase.co:5432/postgres" npx tsx test-db-connection-detailed.ts 2>&1 | head -20

echo ""
echo "Connection testing complete."