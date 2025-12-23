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

async function checkUsersAndTransactions() {
  console.log('🔍 Checking users and transactions in database...');

  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  try {
    // Check users
    console.log('👥 Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Error querying users:', usersError);
    } else {
      console.log('📊 Users found:', users);

      // If no transactions exist, add a test transaction
      const { data: existingTransactions, error: txError } = await supabase
        .from('transactions')
        .select('*');

      if (!txError && existingTransactions.length === 0 && users.length > 0) {
        console.log('🧪 Adding test transaction for admin user...');
        const adminUser = users.find(u => u.username === 'admin');
        if (adminUser) {
          const { data: newTx, error: insertError } = await supabase
            .from('transactions')
            .insert([{
              user_id: adminUser.id,
              type: 'ingreso',
              amount: 1000.50,
              description: 'Transacción de prueba',
              date: '2025-12-22',
              category: 'Diezmos'
            }])
            .select()
            .single();

          if (insertError) {
            console.error('❌ Error adding test transaction:', insertError);
          } else {
            console.log('✅ Test transaction added:', newTx);
          }
        }
      }
    }

    // Check transactions again
    console.log('💰 Checking transactions table...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*');

    if (transactionsError) {
      console.error('❌ Error querying transactions:', transactionsError);
    } else {
      console.log('📊 Transactions found:', transactions);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkUsersAndTransactions();