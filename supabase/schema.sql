-- ==============================================================================
-- SCHEMA SUPABASE : SITE D'ANNIVERSAIRE INTERACTIF & SÉCURISÉ
-- ==============================================================================
-- Ce script configure les tables, la sécurité Row Level Security (RLS),
-- les fonctions RPC avec SECURITY DEFINER et active le temps réel.
-- À exécuter dans le "SQL Editor" de votre projet Supabase.
-- ==============================================================================

-- 1. EXTENSIONS NÉCESSAIRES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CRÉATION DES TABLES

-- Table des profils invités (visible publiquement en lecture)
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🎉',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des codes secrets d'invitation (JAMAIS accessible publiquement)
CREATE TABLE IF NOT EXISTS public.guest_codes (
    code TEXT PRIMARY KEY,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des réponses aux questions (visible publiquement en lecture pour le dashboard)
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_guest_question UNIQUE (guest_id, question_id)
);

-- Table des paramètres administrateur (stocke le hash du mot de passe)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INITIALISATION DU MOT DE PASSE ADMIN PAR DÉFAUT
-- Mot de passe par défaut : 'anniv2026' (VOUS POUVEZ LE CHANGER CI-DESSOUS OU VIA LE DASHBOARD ADMIN)
INSERT INTO public.admin_settings (key, value_hash)
VALUES ('admin_password', crypt('anniv2026', gen_salt('bf')))
ON CONFLICT (key) DO NOTHING;

-- 4. ROW LEVEL SECURITY (RLS) - PROTECTION STRICTE
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique
DROP POLICY IF EXISTS "Lecture publique des invites" ON public.guests;
CREATE POLICY "Lecture publique des invites"
ON public.guests FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Lecture publique des reponses" ON public.answers;
CREATE POLICY "Lecture publique des reponses"
ON public.answers FOR SELECT
USING (true);

-- REMARQUE DE SÉCURITÉ :
-- Aucune politique pour guest_codes et admin_settings !
-- Ni INSERT/UPDATE/DELETE direct sur aucune table.
-- Toutes les écritures et vérifications passent obligatoirement par les fonctions RPC ci-dessous.

-- 5. FONCTIONS RPC SÉCURISÉES (SECURITY DEFINER)

-- Helper interne : vérification mot de passe admin
CREATE OR REPLACE FUNCTION public._check_admin_password(p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_hash TEXT;
BEGIN
    SELECT value_hash INTO v_hash
    FROM public.admin_settings
    WHERE key = 'admin_password';

    IF v_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN (crypt(p_password, v_hash) = v_hash);
END;
$$;

-- RPC : Connexion d'un invité via son code
CREATE OR REPLACE FUNCTION public.login_with_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_code TEXT;
    v_guest RECORD;
BEGIN
    v_clean_code := UPPER(TRIM(p_code));

    SELECT g.id, g.first_name, g.emoji, gc.code
    INTO v_guest
    FROM public.guest_codes gc
    JOIN public.guests g ON g.id = gc.guest_id
    WHERE UPPER(gc.code) = v_clean_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Code invalide ou introuvable. Verifiez les majuscules et le tiret !';
    END IF;

    RETURN jsonb_build_object(
        'id', v_guest.id,
        'first_name', v_guest.first_name,
        'emoji', v_guest.emoji,
        'code', v_guest.code
    );
END;
$$;

-- RPC : Enregistrement ou mise à jour d'une réponse
CREATE OR REPLACE FUNCTION public.save_answer(
    p_code TEXT,
    p_question_id TEXT,
    p_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_code TEXT;
    v_guest_id UUID;
    v_result RECORD;
BEGIN
    v_clean_code := UPPER(TRIM(p_code));

    -- Validation du code
    SELECT guest_id INTO v_guest_id
    FROM public.guest_codes
    WHERE UPPER(code) = v_clean_code;

    IF v_guest_id IS NULL THEN
        RAISE EXCEPTION 'Code invalide ou session expiree.';
    END IF;

    -- Upsert de la réponse
    INSERT INTO public.answers (guest_id, question_id, value, updated_at)
    VALUES (v_guest_id, p_question_id, p_value, now())
    ON CONFLICT (guest_id, question_id)
    DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = now()
    RETURNING id, guest_id, question_id, value, updated_at INTO v_result;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_result.id,
        'guest_id', v_result.guest_id,
        'question_id', v_result.question_id,
        'value', v_result.value,
        'updated_at', v_result.updated_at
    );
END;
$$;

-- RPC ADMIN : Vérifier si le mot de passe est bon
CREATE OR REPLACE FUNCTION public.admin_verify_password(p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN public._check_admin_password(p_password);
END;
$$;

-- RPC ADMIN : Modifier le mot de passe organisateur
CREATE OR REPLACE FUNCTION public.admin_change_password(p_current_password TEXT, p_new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF NOT public._check_admin_password(p_current_password) THEN
        RAISE EXCEPTION 'Mot de passe actuel incorrect.';
    END IF;

    IF LENGTH(p_new_password) < 4 THEN
        RAISE EXCEPTION 'Le nouveau mot de passe doit comporter au moins 4 caracteres.';
    END IF;

    UPDATE public.admin_settings
    SET value_hash = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE key = 'admin_password';

    RETURN TRUE;
END;
$$;

-- Helper interne : Générer un code unique convivial (ex: LUNA-4821 ou THEO-9382)
CREATE OR REPLACE FUNCTION public._generate_unique_guest_code(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_prefix TEXT;
    v_suffix INT;
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    -- Nettoie le prénom pour ne garder que 3 à 5 lettres majuscules
    v_prefix := UPPER(REGEXP_REPLACE(p_name, '[^a-zA-Z]', '', 'g'));
    IF LENGTH(v_prefix) = 0 THEN
        v_prefix := 'INVITE';
    ELSE
        v_prefix := SUBSTRING(v_prefix FROM 1 FOR 6);
    END IF;

    LOOP
        v_suffix := FLOOR(1000 + random() * 9000)::INT;
        v_code := v_prefix || '-' || v_suffix::TEXT;

        SELECT EXISTS(SELECT 1 FROM public.guest_codes WHERE code = v_code) INTO v_exists;
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$;

-- RPC ADMIN : Créer un invité individuel
CREATE OR REPLACE FUNCTION public.admin_create_guest(
    p_password TEXT,
    p_first_name TEXT,
    p_emoji TEXT DEFAULT '🎉'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_new_guest_id UUID;
    v_new_code TEXT;
    v_clean_name TEXT;
    v_clean_emoji TEXT;
BEGIN
    IF NOT public._check_admin_password(p_password) THEN
        RAISE EXCEPTION 'Acces refuse : mot de passe administrateur incorrect.';
    END IF;

    v_clean_name := TRIM(p_first_name);
    IF LENGTH(v_clean_name) = 0 THEN
        RAISE EXCEPTION 'Le prenom ne peut pas etre vide.';
    END IF;

    v_clean_emoji := COALESCE(NULLIF(TRIM(p_emoji), ''), '🎉');
    v_new_code := public._generate_unique_guest_code(v_clean_name);

    INSERT INTO public.guests (first_name, emoji)
    VALUES (v_clean_name, v_clean_emoji)
    RETURNING id INTO v_new_guest_id;

    INSERT INTO public.guest_codes (code, guest_id)
    VALUES (v_new_code, v_new_guest_id);

    RETURN jsonb_build_object(
        'id', v_new_guest_id,
        'first_name', v_clean_name,
        'emoji', v_clean_emoji,
        'code', v_new_code
    );
END;
$$;

-- RPC ADMIN : Création en masse d'invités
CREATE OR REPLACE FUNCTION public.admin_bulk_create_guests(
    p_password TEXT,
    p_names TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_name TEXT;
    v_created_list JSONB := '[]'::JSONB;
    v_res JSONB;
    v_emojis TEXT[] := ARRAY['🎉', '🥳', '🚀', '✨', '🎸', '🌟', '🦄', '🕺', '💃', '🥂', '🍕', '🎂'];
    v_rand_emoji TEXT;
BEGIN
    IF NOT public._check_admin_password(p_password) THEN
        RAISE EXCEPTION 'Acces refuse : mot de passe administrateur incorrect.';
    END IF;

    FOREACH v_name IN ARRAY p_names
    LOOP
        v_name := TRIM(v_name);
        IF LENGTH(v_name) > 0 THEN
            v_rand_emoji := v_emojis[1 + floor(random() * array_length(v_emojis, 1))::int];
            v_res := public.admin_create_guest(p_password, v_name, v_rand_emoji);
            v_created_list := v_created_list || jsonb_build_array(v_res);
        END IF;
    END LOOP;

    RETURN v_created_list;
END;
$$;

-- RPC ADMIN : Lister tous les invités et leurs codes
CREATE OR REPLACE FUNCTION public.admin_list_guests(p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_list JSONB;
BEGIN
    IF NOT public._check_admin_password(p_password) THEN
        RAISE EXCEPTION 'Acces refuse : mot de passe administrateur incorrect.';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', g.id,
            'first_name', g.first_name,
            'emoji', g.emoji,
            'code', gc.code,
            'created_at', g.created_at,
            'answers_count', (SELECT COUNT(*) FROM public.answers a WHERE a.guest_id = g.id)
        ) ORDER BY g.created_at DESC
    ) INTO v_list
    FROM public.guests g
    JOIN public.guest_codes gc ON gc.guest_id = g.id;

    RETURN COALESCE(v_list, '[]'::JSONB);
END;
$$;

-- RPC ADMIN : Supprimer un invité
CREATE OR REPLACE FUNCTION public.admin_delete_guest(
    p_password TEXT,
    p_guest_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF NOT public._check_admin_password(p_password) THEN
        RAISE EXCEPTION 'Acces refuse : mot de passe administrateur incorrect.';
    END IF;

    DELETE FROM public.guests WHERE id = p_guest_id;
    RETURN TRUE;
END;
$$;

-- 6. ACTIVATION DU TEMPS RÉEL SUR LA TABLE ANSWERS & GUESTS
-- Permet aux navigateurs d'écouter les modifications instantanément via Supabase Realtime
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
    EXCEPTION WHEN duplicate_object THEN
        -- Déjà ajouté à la publication
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
    EXCEPTION WHEN duplicate_object THEN
        -- Déjà ajouté
    END;
END $$;

-- 7. RECHARGEMENT DU CACHE DE SCHÉMA
NOTIFY pgrst, 'reload schema';
