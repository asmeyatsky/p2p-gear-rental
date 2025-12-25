import fetch from 'node-fetch';

const SUPABASE_URL = 'https://gietfsryjwphwxfvwbnd.supabase.co';
const SUPABASE_KEY = 'sb_secret_lV5toBZbUvjkAxlyu4keMA_pLjMz6-h';

async function testSupabaseDirect() {
  console.log('Testing Supabase direct API access...');
  
  try {
    // Test basic connection
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase API connection successful!');
      
      // Try to create a simple table via SQL
      const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: 'SELECT version();'
        })
      });
      
      if (sqlResponse.ok) {
        const result = await sqlResponse.text();
        console.log('✅ SQL execution works:', result.substring(0, 100));
        return true;
      } else {
        console.log('❌ SQL execution failed:', await sqlResponse.text());
      }
    } else {
      console.log('❌ API connection failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  return false;
}

testSupabaseDirect();