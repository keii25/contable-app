import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Environment variables loaded:', {
  url: supabaseUrl ? 'Present' : 'Missing',
  key: supabaseAnonKey ? 'Present' : 'Missing'
});

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');

  if (!supabase) {
    console.error('❌ Supabase client not initialized - check environment variables');
    return;
  }

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Check if users table exists and has data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Error querying users table:', usersError);
    } else {
      console.log('📊 Users in database:', users);
    }

    // Check if transactions table exists
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);

    if (transactionsError) {
      console.error('❌ Error querying transactions table:', transactionsError);
    } else {
      console.log('✅ Transactions table accessible');
    }

  } catch (error) {
    console.error('💥 Unexpected error during Supabase test:', error);
  }
}

testSupabaseConnection();