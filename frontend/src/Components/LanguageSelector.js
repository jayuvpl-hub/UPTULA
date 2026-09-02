import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * Language selector for the top navbar.
 *
 * Implemented as a CUSTOM dropdown (button + list), NOT a native <select>, because
 * the theme's custom.js runs `$('select').niceSelect()` which hijacks native selects
 * and stops React's onChange from firing. This custom control is immune to that.
 *
 * It records the user's preferred language (localStorage + PUT /api/profile/language
 * when logged in) AND translates the whole page via Google Website Translate: it
 * sets the `googtrans` cookie and reloads; the widget injected in index.html reads
 * the cookie on load and translates the page into the chosen language.
 */

// Set/clear the Google Translate cookie across path + domain variants, then the
// next page load translates from English (en) into the chosen language code.
function applyGoogleTranslate(code) {
  const host = window.location.hostname;
  const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
  // clear any existing googtrans cookie (all scopes)
  document.cookie = `googtrans=;expires=${expire};path=/`;
  document.cookie = `googtrans=;expires=${expire};path=/;domain=${host}`;
  document.cookie = `googtrans=;expires=${expire};path=/;domain=.${host}`;
  if (code && code !== 'en') {
    const val = `/en/${code}`;
    document.cookie = `googtrans=${val};path=/`;
    document.cookie = `googtrans=${val};path=/;domain=${host}`;
    document.cookie = `googtrans=${val};path=/;domain=.${host}`;
  }
}
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ' }
];

function LanguageSelector() {
  const [lang, setLang] = useState(() => localStorage.getItem('preferredLanguage') || 'en');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const choose = async (code) => {
    setLang(code);
    setOpen(false);
    try { localStorage.setItem('preferredLanguage', code); } catch (_) {}
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/profile/language`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: code }),
        });
      } catch (_) { /* non-blocking */ }
    }
    // Persist the choice in the Google Translate cookie (so it survives reloads).
    applyGoogleTranslate(code);
    // English = restore original: cookie was cleared above, reload to reset.
    if (code === 'en') {
      window.location.reload();
      return;
    }
    // Santali and other newly added codes may not appear in the widget
    // dropdown immediately — reload so the googtrans cookie is applied.
    if (code === 'sat') {
      window.location.reload();
      return;
    }
    // Prefer instant translation via the widget's hidden <select>; if the widget
    // hasn't loaded yet or doesn't list this language, reload so the cookie applies.
    const combo = document.querySelector('select.goog-te-combo');
    const comboHasLanguage = combo
      && Array.from(combo.options).some((option) => option.value === code);
    if (comboHasLanguage) {
      combo.value = code;
      combo.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 42,
          padding: '0 16px',
          borderRadius: 21,
          border: '1px solid rgba(255,255,255,0.45)',
          background: 'rgba(255,255,255,0.12)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
        }}
      >
        <img
          src="/assets/img/translator_img.png"
          alt=""
          aria-hidden="true"
          style={{ width: 18, height: 18, objectFit: 'contain', display: 'block' }}
        />
        <span>{current.label}</span>
        <span aria-hidden="true" style={{ fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            margin: 0,
            padding: '6px 0',
            listStyle: 'none',
            minWidth: 150,
            maxHeight: 320,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 2000,
          }}
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                onClick={() => choose(l.code)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  border: 0,
                  background: l.code === lang ? '#eef2ff' : 'transparent',
                  color: l.code === lang ? '#3730a3' : '#1f2937',
                  fontSize: 14,
                  fontWeight: l.code === lang ? 700 : 500,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = l.code === lang ? '#eef2ff' : 'transparent'; }}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LanguageSelector;
