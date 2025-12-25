#!/bin/bash

echo "=== TESTING ALL SUPABASE CONNECTION TYPES ==="
echo "Project: gietfsryjwphwxfvwbnd"
echo ""

# Test 1: Direct Connection
echo "1. Testing Direct Connection (Port 5432):"
DATABASE_URL="postgresql://postgres:Aklocarno62!@gietfsryjwphwxfvwbnd.supabase.co:5432/postgres" npx tsx test-db-connection-detailed.ts 2>&1 | grep -E "(✅|❌|database server at)" || echo "No clear result"

echo ""
echo "2. Testing Transaction Pooler (Port 6543):"
DATABASE_URL="postgresql://postgres:Aklocarno62!@aws-0-us-east-1.pooler.supabase.co:6543/postgres" npx tsx test-db-connection-detailed.ts 2>&1 | grep -E "(✅|❌|database server at)" || echo "No clear result"

echo ""
echo "3. Testing Session Pooler (Port 5432 with pooler):"
DATABASE_URL="postgresql://postgres:Aklocarno62!@gietfsryjwphwxfvwbnd.supabase.co:5432/postgres?pgbouncer=true" npx tsx test-db-connection-detailed.ts 2>&1 | grep -E "(✅|❌|database server at)" || echo "No clear result"

echo ""
echo "4. Testing Alternative Direct (with db. prefix):"
DATABASE_URL="postgresql://postgres:Aklocarno62!@db.gietfsryjwphwxfvwbnd.supabase.co:5432/postgres" npx tsx test-db-connection-detailed.ts 2>&1 | grep -E "(✅|❌|database server at)" || echo "No clear result"

echo ""
echo "=== CONNECTION TESTS COMPLETE ==="
echo "Which one would you like to try with proper configuration?"