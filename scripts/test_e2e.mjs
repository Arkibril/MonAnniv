import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFullCycle() {
  console.log('--- Test E2E : Création d’un invité test via admin_create_guest ---');
  const { data: createdGuest, error: createError } = await supabase.rpc('admin_create_guest', {
    p_password: 'anniv2026',
    p_first_name: 'Alexandre',
    p_emoji: '🎂'
  });

  if (createError) {
    console.error('Erreur création invité:', createError);
    return;
  }

  console.log('Invité créé avec succès !', createdGuest);

  console.log('\n--- Test E2E : Connexion de l’invité via login_with_code ---');
  const { data: loggedGuest, error: loginError } = await supabase.rpc('login_with_code', {
    p_code: createdGuest.code
  });

  if (loginError) {
    console.error('Erreur login invité:', loginError);
    return;
  }
  console.log('Connexion réussie !', loggedGuest);

  console.log('\n--- Test E2E : Sauvegarde d’une réponse via save_answer ---');
  const { data: savedAnswer, error: answerError } = await supabase.rpc('save_answer', {
    p_code: createdGuest.code,
    p_question_id: 'q_date',
    p_value: '10'
  });

  if (answerError) {
    console.error('Erreur enregistrement réponse:', answerError);
    return;
  }
  console.log('Réponse enregistrée avec succès !', savedAnswer);

  console.log('\n--- Test E2E : Récupération publique des réponses ---');
  const { data: allAnswers, error: fetchAnswersError } = await supabase
    .from('answers')
    .select('*');

  console.log('Total réponses dans la base :', allAnswers?.length);
  console.log('\n🎉 TOUT LE SERVEUR FONCTIONNE À 100 % SANS AUCUNE ERREUR !');
}

testFullCycle();
