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

    // Execute the SQL using Supabase's rpc function
    // Note: This requires the pg_execute_sql function to be available
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      console.log('💡 You may need to run this SQL manually in the Supabase dashboard');
      console.log('📋 SQL to run manually:');
      console.log(sqlContent);
    } else {
      console.log('✅ RLS policies fixed successfully');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.log('💡 You may need to run the SQL manually in the Supabase dashboard');
  }
}

fixRLS();