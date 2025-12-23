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

async function createTables() {
  console.log('🏗️ Creating database tables...');

  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  try {
    // Create users table
    console.log('📋 Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'lector')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (usersError) {
      console.error('❌ Error creating users table:', usersError);
    } else {
      console.log('✅ Users table created');
    }

    // Create transactions table
    console.log('📋 Creating transactions table...');
    const { error: transactionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('ingreso', 'egreso')),
          amount DECIMAL(10,2) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          category TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (transactionsError) {
      console.error('❌ Error creating transactions table:', transactionsError);
    } else {
      console.log('✅ Transactions table created');
    }

    // Disable RLS
    console.log('🔓 Disabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users DISABLE ROW LEVEL SECURITY;
        ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Error disabling RLS:', rlsError);
    } else {
      console.log('✅ RLS disabled');
    }

    // Create indexes
    console.log('📊 Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      `
    });

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
    } else {
      console.log('✅ Indexes created');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createTables();