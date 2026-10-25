-- ==============================================================================
-- MIGRATION : le code d'accès de chaque invité devient simplement son prénom
-- (majuscules / minuscules / accents / espaces ignorés à la connexion)
-- À exécuter UNE FOIS dans le "SQL Editor" de Supabase, puis cliquer sur Run.
-- ==============================================================================

-- Helper : normalise un prénom (minuscules, sans accents, sans espaces ni ponctuation)
-- Ex : 'Lénaïk' -> 'lenaik', '  MATHILDE ' -> 'mathilde'
CREATE OR REPLACE FUNCTION public._normalize_name(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT regexp_replace(
        translate(lower(COALESCE(p_text, '')), 'àáâãäåāăąçćčďèéêëēėęěîïíīįìłñńňôöòóøōõŕřśšşťûüùúūůÿýžźż', 'aaaaaaaaacccdeeeeeeeeiiiiiilnnnooooooorrssstuuuuuuyyzzz'),
        '[^a-z0-9]', '', 'g'
    );
$$;

-- RPC : Connexion d'un invité avec son prénom (majuscules, accents et espaces ignorés)
-- Pour un couple ('Mathilde & Guillaume'), chaque prénom seul fonctionne aussi.
CREATE OR REPLACE FUNCTION public.login_with_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_input TEXT;
    v_guest RECORD;
BEGIN
    v_input := public._normalize_name(p_code);

    IF LENGTH(v_input) = 0 THEN
        RAISE EXCEPTION 'Entre ton prenom pour continuer.';
    END IF;

    SELECT g.id, g.first_name, g.emoji, gc.code
    INTO v_guest
    FROM public.guest_codes gc
    JOIN public.guests g ON g.id = gc.guest_id
    WHERE public._normalize_name(gc.code) = v_input
       OR v_input IN (
            SELECT public._normalize_name(part)
            FROM regexp_split_to_table(g.first_name, '\s*[&+,/]\s*|\s+et\s+', 'i') AS part
       )
    ORDER BY (public._normalize_name(gc.code) = v_input) DESC, g.created_at
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prenom introuvable. Verifie l''orthographe ou demande a Jibril !';
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

    -- Validation du code (= prénom, casse et accents ignorés)
    SELECT guest_id INTO v_guest_id
    FROM public.guest_codes
    WHERE public._normalize_name(code) = public._normalize_name(p_code)
    LIMIT 1;

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

-- Helper interne : le code d'un invité est simplement son prénom.
-- Refuse un doublon (même prénom à la casse / aux accents près).
CREATE OR REPLACE FUNCTION public._generate_unique_guest_code(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_code TEXT;
BEGIN
    v_code := TRIM(p_name);

    IF LENGTH(public._normalize_name(v_code)) = 0 THEN
        RAISE EXCEPTION 'Le prenom doit contenir au moins une lettre.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.guest_codes
        WHERE public._normalize_name(code) = public._normalize_name(v_code)
    ) THEN
        RAISE EXCEPTION 'Un invite avec le prenom "%" existe deja. Ajoute une initiale (ex : % B.).', v_code, v_code;
    END IF;

    RETURN v_code;
END;
$$;

-- Remplace les anciens codes (ex : LNAK-4821) par le prénom de l'invité
UPDATE public.guest_codes gc
SET code = g.first_name
FROM public.guests g
WHERE g.id = gc.guest_id
  AND gc.code <> g.first_name;

-- Vérification : liste des invités et de leur nouveau code
SELECT g.first_name, gc.code
FROM public.guest_codes gc
JOIN public.guests g ON g.id = gc.guest_id
ORDER BY g.created_at;
