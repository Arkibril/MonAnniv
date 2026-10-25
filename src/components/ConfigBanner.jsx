import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';

// Visible uniquement en local, quand Supabase n'est pas configuré
export default function ConfigBanner() {
  const [isOpen, setIsOpen] = useState(false);

  if (isSupabaseConfigured) return null;

  return (
    <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--separator)', fontSize: 13, color: 'var(--label-2)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '6px var(--gutter)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span>Mode démo : Supabase n'est pas configuré, les données restent dans ce navigateur.</span>
        <button type="button" className="btn btn--plain btn--small" style={{ fontSize: 13, minHeight: 32 }} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
          {isOpen ? 'Masquer' : 'Connecter Supabase'}
        </button>
      </div>

      {isOpen && (
        <ol style={{ maxWidth: 980, margin: '0 auto', padding: '4px var(--gutter) 14px calc(var(--gutter) + 18px)', lineHeight: 1.6 }}>
          <li>Crée un projet gratuit sur <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a>.</li>
          <li>Dans <strong>SQL Editor</strong>, colle le contenu de <code>supabase/schema.sql</code> puis clique sur <strong>Run</strong>.</li>
          <li>Dans <strong>Settings › Data API</strong>, copie l'URL et la clé <code>anon public</code> dans ton fichier <code>.env</code>.</li>
        </ol>
      )}
    </div>
  );
}
