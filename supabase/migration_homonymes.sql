-- Homonymes (ex. deux Solène) : connexion avec le prénom + le début du nom.
-- "solene" seul affiche : "Il y a plusieurs invites avec ce prenom : ajoute ton nom de famille".
-- Déjà appliquée sur le projet Supabase.
CREATE OR REPLACE FUNCTION public.login_with_code(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_input TEXT;
    v_guest RECORD;
    v_count INT;
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

    IF FOUND THEN
        RETURN jsonb_build_object('id', v_guest.id, 'first_name', v_guest.first_name, 'emoji', v_guest.emoji, 'code', v_guest.code);
    END IF;

    SELECT count(*) INTO v_count
    FROM public.guests g
    WHERE public._normalize_name(g.first_name) LIKE v_input || '%'
      AND LENGTH(v_input) >= LENGTH(public._normalize_name(split_part(g.first_name, ' ', 1)));

    IF v_count = 1 THEN
        SELECT g.id, g.first_name, g.emoji, gc.code
        INTO v_guest
        FROM public.guests g
        JOIN public.guest_codes gc ON gc.guest_id = g.id
        WHERE public._normalize_name(g.first_name) LIKE v_input || '%'
          AND LENGTH(v_input) >= LENGTH(public._normalize_name(split_part(g.first_name, ' ', 1)))
        LIMIT 1;
        RETURN jsonb_build_object('id', v_guest.id, 'first_name', v_guest.first_name, 'emoji', v_guest.emoji, 'code', v_guest.code);
    ELSIF v_count > 1 THEN
        RAISE EXCEPTION 'Il y a plusieurs invites avec ce prenom : ajoute ton nom de famille (ex. %).',
            (SELECT first_name FROM public.guests g WHERE public._normalize_name(g.first_name) LIKE v_input || '%' ORDER BY created_at LIMIT 1);
    END IF;

    RAISE EXCEPTION 'Prenom introuvable. Verifie l''orthographe ou demande a Jibril !';
END;
$function$;
