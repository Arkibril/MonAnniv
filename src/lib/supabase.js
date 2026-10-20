import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Vérification si Supabase est configuré avec des vraies clés
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('votre-projet.supabase.co') &&
  !supabaseAnonKey.includes('votre-cle-anon')
);

// Client Supabase unique
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// ============================================================================
// SIMULATION LOCALE (FALLBACK DE TEST HORS-LIGNE)
// Utilisée UNIQUEMENT si les variables d'environnement ne sont pas encore renseignées.
// Cela permet de tester toute l'interface avant même de créer le projet Supabase !
// ============================================================================
const MOCK_STORAGE_KEY_GUESTS = 'monanniv_mock_guests';
const MOCK_STORAGE_KEY_ANSWERS = 'monanniv_mock_answers';
const MOCK_ADMIN_PWD_KEY = 'monanniv_mock_admin_pwd';

const getMockGuests = () => {
  const data = localStorage.getItem(MOCK_STORAGE_KEY_GUESTS);
  if (data) return JSON.parse(data);
  const initial = [
    { id: '11111111-1111-4111-8111-111111111111', first_name: 'Camille', emoji: '✨', code: 'CAMILLE-1024', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: '22222222-2222-4222-8222-222222222222', first_name: 'Thomas', emoji: '🚀', code: 'THOMAS-8492', created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: '33333333-3333-4333-8333-333333333333', first_name: 'Sarah', emoji: '🦄', code: 'SARAH-3912', created_at: new Date(Date.now() - 3600000 * 4).toISOString() }
  ];
  localStorage.setItem(MOCK_STORAGE_KEY_GUESTS, JSON.stringify(initial));
  return initial;
};

const getMockAnswers = () => {
  const data = localStorage.getItem(MOCK_STORAGE_KEY_ANSWERS);
  if (data) return JSON.parse(data);
  const initial = [
    { id: 'a1', guest_id: '11111111-1111-4111-8111-111111111111', question_id: 'q_date', value: '19_dec', updated_at: new Date().toISOString() },
    { id: 'a1_city', guest_id: '11111111-1111-4111-8111-111111111111', question_id: 'q_city', value: 'paris', updated_at: new Date().toISOString() },
    { id: 'a1_theme', guest_id: '11111111-1111-4111-8111-111111111111', question_id: 'q_theme', value: 'gaming', updated_at: new Date().toISOString() },
    { id: 'a2', guest_id: '11111111-1111-4111-8111-111111111111', question_id: 'q_presence', value: 'yes', updated_at: new Date().toISOString() },
    { id: 'a3', guest_id: '11111111-1111-4111-8111-111111111111', question_id: 'q_message', value: 'Trop hâte de célébrer ça avec toi !! 🎂🍾', updated_at: new Date().toISOString() },
    { id: 'a4', guest_id: '22222222-2222-4222-8222-222222222222', question_id: 'q_date', value: '25_dec', updated_at: new Date().toISOString() },
    { id: 'a4_city', guest_id: '22222222-2222-4222-8222-222222222222', question_id: 'q_city', value: 'strasbourg', updated_at: new Date().toISOString() },
    { id: 'a4_theme', guest_id: '22222222-2222-4222-8222-222222222222', question_id: 'q_theme', value: 'anime', updated_at: new Date().toISOString() },
    { id: 'a5', guest_id: '22222222-2222-4222-8222-222222222222', question_id: 'q_presence', value: 'yes', updated_at: new Date().toISOString() },
    { id: 'a6', guest_id: '22222222-2222-4222-8222-222222222222', question_id: 'q_message', value: 'Compte sur moi pour enflammer le dancefloor !', updated_at: new Date().toISOString() }
  ];
  localStorage.setItem(MOCK_STORAGE_KEY_ANSWERS, JSON.stringify(initial));
  return initial;
};

// ============================================================================
// FONCTIONS CLIENTES & RPC EXPORTÉES
// ============================================================================

/**
 * Connexion d'un invité via son code secret
 */
export async function loginWithCode(code) {
  const cleanCode = (code || '').trim().toUpperCase();

  if (!isSupabaseConfigured) {
    const guests = getMockGuests();
    const guest = guests.find(g => g.code.toUpperCase() === cleanCode);
    if (!guest) {
      throw new Error("Code introuvable. Testez avec 'CAMILLE-1024', 'THOMAS-8492' ou créez-en un dans /admin !");
    }
    return {
      id: guest.id,
      first_name: guest.first_name,
      emoji: guest.emoji,
      code: guest.code
    };
  }

  const { data, error } = await supabase.rpc('login_with_code', {
    p_code: cleanCode
  });

  if (error) {
    throw new Error(error.message || 'Code invalide ou expiré.');
  }

  return data;
}

/**
 * Enregistrer ou mettre à jour la réponse d'un invité
 */
export async function saveAnswer(code, questionId, value) {
  const cleanCode = (code || '').trim().toUpperCase();

  if (!isSupabaseConfigured) {
    const guests = getMockGuests();
    const guest = guests.find(g => g.code.toUpperCase() === cleanCode);
    if (!guest) throw new Error('Session expirée ou code invalide.');

    const answers = getMockAnswers();
    const existingIndex = answers.findIndex(a => a.guest_id === guest.id && a.question_id === questionId);
    const updatedRecord = {
      id: existingIndex >= 0 ? answers[existingIndex].id : 'mock_' + Math.random().toString(36).slice(2),
      guest_id: guest.id,
      question_id: questionId,
      value: value,
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      answers[existingIndex] = updatedRecord;
    } else {
      answers.push(updatedRecord);
    }
    localStorage.setItem(MOCK_STORAGE_KEY_ANSWERS, JSON.stringify(answers));

    // Déclencher un événement local pour le temps réel en mode mock
    window.dispatchEvent(new CustomEvent('mock_answers_updated', { detail: updatedRecord }));

    return { success: true, ...updatedRecord };
  }

  const { data, error } = await supabase.rpc('save_answer', {
    p_code: cleanCode,
    p_question_id: questionId,
    p_value: value
  });

  if (error) {
    throw new Error(error.message || 'Erreur lors de la sauvegarde de la réponse.');
  }

  return data;
}

/**
 * Récupérer la liste publique des profils invités
 */
export async function fetchGuests() {
  if (!isSupabaseConfigured) {
    return getMockGuests();
  }

  const { data, error } = await supabase
    .from('guests')
    .select('id, first_name, emoji, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetchGuests:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupérer l'ensemble des réponses publiques
 */
export async function fetchAnswers() {
  if (!isSupabaseConfigured) {
    return getMockAnswers();
  }

  const { data, error } = await supabase
    .from('answers')
    .select('id, guest_id, question_id, value, updated_at');

  if (error) {
    console.error('Erreur fetchAnswers:', error);
    return [];
  }

  return data || [];
}

/**
 * S'abonner aux changements en temps réel sur la table answers
 */
export function subscribeToAnswers(onChangeCallback) {
  if (!isSupabaseConfigured) {
    const handleMockEvent = (e) => {
      onChangeCallback(e.detail);
    };
    window.addEventListener('mock_answers_updated', handleMockEvent);
    return () => {
      window.removeEventListener('mock_answers_updated', handleMockEvent);
    };
  }

  const channel = supabase
    .channel('public:answers')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'answers' },
      (payload) => {
        onChangeCallback(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connecté au flux Realtime Supabase sur "answers"');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// FONCTIONS ORGANISATEUR / ADMIN (SÉCURISÉES PAR MOT DE PASSE POSTGRES)
// ============================================================================

export async function adminVerifyPassword(password) {
  if (!isSupabaseConfigured) {
    const current = localStorage.getItem(MOCK_ADMIN_PWD_KEY) || 'anniv2026';
    return password === current;
  }

  const { data, error } = await supabase.rpc('admin_verify_password', {
    p_password: password
  });

  if (error) return false;
  return Boolean(data);
}

export async function adminListGuests(password) {
  if (!isSupabaseConfigured) {
    const isOk = await adminVerifyPassword(password);
    if (!isOk) throw new Error('Mot de passe administrateur incorrect.');
    const guests = getMockGuests();
    const answers = getMockAnswers();
    return guests.map(g => ({
      ...g,
      answers_count: answers.filter(a => a.guest_id === g.id).length
    }));
  }

  const { data, error } = await supabase.rpc('admin_list_guests', {
    p_password: password
  });

  if (error) {
    throw new Error(error.message || 'Impossible de lister les invités.');
  }

  return data || [];
}

export async function adminCreateGuest(password, firstName, emoji = '🎉') {
  if (!isSupabaseConfigured) {
    const isOk = await adminVerifyPassword(password);
    if (!isOk) throw new Error('Mot de passe administrateur incorrect.');

    const guests = getMockGuests();
    const cleanName = (firstName || '').trim();
    if (!cleanName) throw new Error('Le prénom ne peut être vide.');

    const prefix = cleanName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'INVITE';
    const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGuest = {
      id: 'mock_' + Math.random().toString(36).slice(2),
      first_name: cleanName,
      emoji: emoji || '🎉',
      code: code,
      created_at: new Date().toISOString(),
      answers_count: 0
    };
    guests.unshift(newGuest);
    localStorage.setItem(MOCK_STORAGE_KEY_GUESTS, JSON.stringify(guests));
    return newGuest;
  }

  const { data, error } = await supabase.rpc('admin_create_guest', {
    p_password: password,
    p_first_name: firstName,
    p_emoji: emoji
  });

  if (error) {
    throw new Error(error.message || 'Erreur lors de la création de l’invité.');
  }

  return data;
}

export async function adminBulkCreateGuests(password, namesArray) {
  if (!isSupabaseConfigured) {
    const results = [];
    for (const name of namesArray) {
      if (name.trim()) {
        const g = await adminCreateGuest(password, name.trim());
        results.push(g);
      }
    }
    return results;
  }

  const { data, error } = await supabase.rpc('admin_bulk_create_guests', {
    p_password: password,
    p_names: namesArray
  });

  if (error) {
    throw new Error(error.message || 'Erreur lors de la création en masse.');
  }

  return data || [];
}

export async function adminDeleteGuest(password, guestId) {
  if (!isSupabaseConfigured) {
    let guests = getMockGuests();
    guests = guests.filter(g => g.id !== guestId);
    localStorage.setItem(MOCK_STORAGE_KEY_GUESTS, JSON.stringify(guests));
    return true;
  }

  const { data, error } = await supabase.rpc('admin_delete_guest', {
    p_password: password,
    p_guest_id: guestId
  });

  if (error) {
    throw new Error(error.message || 'Impossible de supprimer cet invité.');
  }

  return data;
}

export async function adminChangePassword(currentPassword, newPassword) {
  if (!isSupabaseConfigured) {
    const isOk = await adminVerifyPassword(currentPassword);
    if (!isOk) throw new Error('Mot de passe actuel incorrect.');
    localStorage.setItem(MOCK_ADMIN_PWD_KEY, newPassword);
    return true;
  }

  const { data, error } = await supabase.rpc('admin_change_password', {
    p_current_password: currentPassword,
    p_new_password: newPassword
  });

  if (error) {
    throw new Error(error.message || 'Impossible de changer le mot de passe.');
  }

  return data;
}
