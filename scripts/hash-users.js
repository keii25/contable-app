import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Load environment variables from .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
let envContent = '';
try { envContent = readFileSync(envPath, 'utf8'); } catch (e) { /* ignore */ }
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL not found in .env or env');
  process.exit(1);
}
if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found. This script requires the service role key to update user passwords.');
  console.error('💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env (service_role key from Supabase project settings) and re-run.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function hashUsers() {
  console.log('🔧 Fetching users...');
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('❌ Error fetching users:', error);
    process.exit(1);
  }

  for (const u of users || []) {
    const pwd = u.password_hash || u.password || '';
    if (!pwd) {
      console.log('⚠️ Skipping user without password:', u.username || u.id);
      continue;
    }

    // Detect if already hashed (bcrypt hashes usually start with $2a$/$2b$)
    if (String(pwd).startsWith('$2')) {
      console.log('ℹ️ Already hashed:', u.username || u.id);
      continue;
    }

    const hashed = bcrypt.hashSync(String(pwd), 10);
    console.log('🔒 Hashing user', u.username || u.id);

    const { error: updErr } = await supabase.from('users').update({ password_hash: hashed }).eq('id', u.id);
    if (updErr) {
      console.error('❌ Error updating user', u.id, updErr);
    } else {
      console.log('✅ Updated user', u.username || u.id);
    }
  }

  console.log('✅ Migration finished');
}

hashUsers().catch(e=>{ console.error('Unexpected error:', e); process.exit(1); });
