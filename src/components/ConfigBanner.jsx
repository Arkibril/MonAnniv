import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';

// Visible uniquement en local, quand Supabase n'est pas configuré
export default function ConfigBanner() {
  const [isOpen, setIsOpen] = useState(false);

  if (isSupabaseConfigured) return null;

  return (
    <div className="demo-banner">
      <span>Mode démo : les données restent dans ce navigateur.</span>
      <button
        type="button"
        className="btn btn--link btn--sm"
        style={{ color: 'inherit', textDecoration: 'underline', minHeight: 28 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {isOpen ? 'Masquer' : 'Connecter Supabase'}
      </button>

      {isOpen && (
        <ol>
          <li>Crée un projet gratuit sur <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a>.</li>
          <li>Dans <strong>SQL Editor</strong>, colle le contenu de <code>supabase/schema.sql</code> puis clique sur <strong>Run</strong>.</li>
          <li>Dans <strong>Settings › Data API</strong>, copie l'URL et la clé <code>anon public</code> dans ton fichier <code>.env</code>.</li>
        </ol>
      )}
    </div>
  );
}
