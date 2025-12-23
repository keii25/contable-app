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

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Prefer service role key for executing admin SQL; fall back to anon (may not have permission)
const supabase = supabaseUrl && (serviceRoleKey || supabaseAnonKey)
  ? createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey)
  : null;

async function fixRLS() {
  console.log('🔧 Fixing RLS policies...');

  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'fix-rls.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL to execute:', sqlContent);

    // Try to execute the SQL using an RPC if available
    if (serviceRoleKey) {
      console.log('🔐 Using service role key to execute SQL');
      try {
        // Some setups provide an RPC to execute raw SQL; try common names
        const rpcNames = ['exec_sql', 'run_sql', 'pg_exec'];
        let executed = false;
        for (const name of rpcNames) {
          const { data, error } = await supabase.rpc(name, { sql: sqlContent });
          if (!error) {
            console.log('✅ Executed SQL via rpc:', name);
            executed = true;
            break;
          }
          console.log('ℹ️ RPC', name, 'not available or failed:', error?.message || error);
        }
        if (!executed) {
          console.log('⚠️ No suitable RPC found. You may need to run the SQL manually in the Supabase SQL editor.');
          console.log(sqlContent);
        }
      } catch (e) {
        console.error('❌ Error executing SQL with service role key:', e);
        console.log('💡 Please run the following SQL manually in Supabase SQL editor:');
        console.log(sqlContent);
      }
    } else {
      console.log('⚠️ Service role key not present. Cannot execute admin SQL programmatically with anon key.');
      console.log('💡 Please run the following SQL manually in the Supabase SQL editor:');
      console.log(sqlContent);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.log('💡 You may need to run the SQL manually in the Supabase dashboard');
  }
}

fixRLS();