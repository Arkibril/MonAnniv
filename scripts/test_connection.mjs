import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('.env', 'utf8');

let supabaseUrl = '';
let supabaseAnonKey = '';

envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    const val = rest.join('=').trim();
    if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = val;
    if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
  }
});

console.log('Testing Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  const results = {
    connection: false,
    tables: {},
    rpc_login: false,
    rpc_admin_verify: false,
    errors: []
  };

  try {
    // 1. Test SELECT sur guests
    console.log('--- Test 1: SELECT FROM guests ---');
    const { data: guestsData, error: guestsError } = await supabase
      .from('guests')
      .select('*')
      .limit(5);

    if (guestsError) {
      console.error('Error fetching guests:', guestsError.message);
      results.errors.push(`Table 'guests': ${guestsError.message}`);
    } else {
      console.log('Success! Guests count:', guestsData?.length);
      results.tables.guests = true;
      results.connection = true;
    }

    // 2. Test SELECT sur answers
    console.log('--- Test 2: SELECT FROM answers ---');
    const { data: answersData, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .limit(5);

    if (answersError) {
      console.error('Error fetching answers:', answersError.message);
      results.errors.push(`Table 'answers': ${answersError.message}`);
    } else {
      console.log('Success! Answers count:', answersData?.length);
      results.tables.answers = true;
    }

    // 3. Test RPC admin_verify_password
    console.log('--- Test 3: RPC admin_verify_password ---');
    const { data: pwdVerifyData, error: pwdVerifyError } = await supabase.rpc('admin_verify_password', {
      p_password: 'anniv2026'
    });

    if (pwdVerifyError) {
      console.error('Error rpc admin_verify_password:', pwdVerifyError.message);
      results.errors.push(`RPC 'admin_verify_password': ${pwdVerifyError.message}`);
    } else {
      console.log('Success! Password verification result:', pwdVerifyData);
      results.rpc_admin_verify = pwdVerifyData;
    }

    // 4. Test RPC login_with_code
    console.log('--- Test 4: RPC login_with_code ---');
    const { data: loginData, error: loginError } = await supabase.rpc('login_with_code', {
      p_code: 'TEST-9999'
    });

    if (loginError) {
      console.log('RPC login_with_code responded:', loginError.message);
      if (loginError.message.includes('invalide') || loginError.message.includes('introuvable')) {
        results.rpc_login = true;
      } else {
        results.errors.push(`RPC 'login_with_code': ${loginError.message}`);
      }
    } else {
      results.rpc_login = true;
    }

    console.log('\n--- RAPPORT FINAL ---');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Unexpected exception during test:', err);
  }
}

runTests();
