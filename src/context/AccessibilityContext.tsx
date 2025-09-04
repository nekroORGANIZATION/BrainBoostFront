'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Prefs = {
  textScale: number;                   // 0.8..1.6 (умножитель на базовый 16px)
  lineHeight: 'normal' | 'relaxed' | 'loose';
  font: 'system' | 'serif' | 'mono' | 'opendyslexic';
  letterSpacing: 'normal' | 'wide';
  theme: 'system' | 'light' | 'dark';
  contrast: 'normal' | 'high';
  motion: 'system' | 'reduce' | 'allow';
  uiScale: 'md' | 'lg';
};

const DEFAULT: Prefs = {
  textScale: 1,
  lineHeight: 'relaxed',
  font: 'system',
  letterSpacing: 'normal',
  theme: 'system',
  contrast: 'normal',
  motion: 'system',
  uiScale: 'md',
};

const KEY = 'bb_accessibility_prefs';

type Ctx = {
  prefs: Prefs;
  setPrefs: (u: Partial<Prefs>) => void;
  reset: () => void;
};

const AccessibilityContext = createContext<Ctx | null>(null);
export const useA11y = () => {
  const v = useContext(AccessibilityContext);
  if (!v) throw new Error('AccessibilityProvider is missing');
  return v;
};

function applyToDOM(p: Prefs) {
  const root = document.documentElement;

  // CSS vars
  root.style.setProperty('--text-scale', String(p.textScale));
  root.style.setProperty('--line-height', p.lineHeight === 'normal' ? '1.5' : p.lineHeight === 'relaxed' ? '1.7' : '1.9');
  root.style.setProperty('--letter-spacing', p.letterSpacing === 'wide' ? '0.02em' : '0');

  // font class
  root.classList.remove('font-system', 'font-serif', 'font-mono', 'font-odys');
  root.classList.add(
    p.font === 'system' ? 'font-system' :
    p.font === 'serif'  ? 'font-serif'  :
    p.font === 'mono'   ? 'font-mono'   : 'font-odys'
  );

  // contrast
  root.classList.toggle('hc', p.contrast === 'high');

  // UI scale
  root.classList.toggle('ui-lg', p.uiScale === 'lg');

  // motion
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldReduce = p.motion === 'reduce' || (p.motion === 'system' && prefersReduce);
  root.setAttribute('data-motion', shouldReduce ? 'reduce' : 'allow');

  // theme
  const isSysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = p.theme === 'dark' || (p.theme === 'system' && isSysDark);
  root.classList.toggle('dark', !!dark);
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT);

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const saved = raw ? JSON.parse(raw) : null;
      const merged: Prefs = { ...DEFAULT, ...(saved || {}) };
      setPrefsState(merged);
      applyToDOM(merged);
    } catch {
      applyToDOM(DEFAULT);
    }
  }, []);

  // react to OS changes if theme/motion set to system
  useEffect(() => {
    const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => applyToDOM(prefs);
    mqDark.addEventListener('change', onChange);
    mqMotion.addEventListener('change', onChange);
    return () => {
      mqDark.removeEventListener('change', onChange);
      mqMotion.removeEventListener('change', onChange);
    };
  }, [prefs]);

  const api = useMemo<Ctx>(() => ({
    prefs,
    setPrefs: (u) => {
      setPrefsState(prev => {
        const next = { ...prev, ...u };
        try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
        applyToDOM(next);
        return next;
      });
    },
    reset: () => {
      setPrefsState(DEFAULT);
      try { localStorage.removeItem(KEY); } catch {}
      applyToDOM(DEFAULT);
    },
  }), [prefs]);

  return <AccessibilityContext.Provider value={api}>{children}</AccessibilityContext.Provider>;
}
