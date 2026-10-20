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

async function addGuests() {
  const adminPassword = 'anniv2026';

  // 1. Nettoyer les tests précédents
  const { data: existingGuests } = await supabase.rpc('admin_list_guests', {
    p_password: adminPassword
  });

  if (existingGuests && existingGuests.length > 0) {
    for (const g of existingGuests) {
      if (['Alexandre', 'Sophie'].includes(g.first_name)) {
        console.log(`Suppression du profil de test : ${g.first_name}`);
        await supabase.rpc('admin_delete_guest', {
          p_password: adminPassword,
          p_guest_id: g.id
        });
      }
    }
  }

  // 2. Liste des vrais invités demandés
  const guestsToAdd = [
    { name: 'Lénaïk', emoji: '✨' },
    { name: 'Alexia', emoji: '🌸' },
    { name: 'Julien', emoji: '⚡' },
    { name: 'Romain', emoji: '🎸' },
    { name: 'Lohan', emoji: '🚀' },
    { name: 'Mathilde & Guillaume', emoji: '🥂' },
    { name: 'Assiya & Sacha', emoji: '🎉' }
  ];

  const results = [];

  for (const g of guestsToAdd) {
    const { data: created, error } = await supabase.rpc('admin_create_guest', {
      p_password: adminPassword,
      p_first_name: g.name,
      p_emoji: g.emoji
    });

    if (error) {
      console.error(`Erreur pour ${g.name}:`, error.message);
    } else {
      results.push(created);
    }
  }

  console.log('\n================ TOUS LES INVITÉS ONT ÉTÉ AJOUTÉS ================');
  console.log(JSON.stringify(results, null, 2));
}

addGuests();
