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

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

async function testTransactionLoading() {
  console.log('🧪 Testing transaction loading...');

  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  try {
    // Get admin user ID
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin');

    if (usersError || !users || users.length === 0) {
      console.error('❌ Could not find admin user');
      return;
    }

    const adminUser = users[0];
    console.log('👤 Admin user:', adminUser);

    // Try loading transactions with correct UUID
    console.log('📋 Loading transactions for userId:', adminUser.id);
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', adminUser.id)
      .order('date', { ascending: false });

    if (txError) {
      console.error('❌ Error loading transactions:', txError);
    } else {
      console.log('✅ Transactions loaded successfully:', transactions);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testTransactionLoading();