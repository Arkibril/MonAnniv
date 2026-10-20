import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function ConfigBanner() {
  const [isOpen, setIsOpen] = useState(false);

  if (isSupabaseConfigured) return null;

  return (
    <div style={{
      background: '#fafafa',
      borderBottom: '1px solid var(--border-light)',
      padding: '8px 16px',
      fontSize: '0.82rem',
      position: 'relative',
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#52525b' }}>
          <AlertCircle size={15} color="#09090b" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: '#09090b' }}>Mode Démo local :</strong> Supabase n'est pas encore configuré dans <code>.env</code>. Tout fonctionne en simulation locale.
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-light)',
            color: '#09090b',
            padding: '3px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>{isOpen ? 'Masquer le guide' : 'Connecter Supabase'}</span>
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {isOpen && (
        <div style={{
          maxWidth: '1000px',
          margin: '10px auto 4px',
          background: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: '#27272a'
        }}>
          <h4 style={{ color: '#09090b', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700 }}>
            Connexion à Supabase en 3 étapes rapides :
          </h4>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.6', fontSize: '0.82rem' }}>
            <li>
              Rendez-vous sur <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#09090b', textDecoration: 'underline' }}>supabase.com</a> et créez un projet gratuit.
            </li>
            <li>
              Dans le menu <strong>SQL Editor</strong>, collez le contenu du fichier <code>supabase/schema.sql</code> et cliquez sur <strong>Run</strong>.
            </li>
            <li>
              Allez dans <strong>Settings &gt; Data API</strong>, copiez l'URL et la clé <code>anon public</code>, puis collez-les dans votre <code>.env</code>.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
