import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { setLocale, type Lang } from './locale';

export type { Lang };
export type DictKey = keyof typeof en;
export type Dict = Record<DictKey, string>;

const DICTS: Record<Lang, Dict> = { en, es, fr };

export const SUPPORTED_LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

const STORAGE_KEY = 'lang';

/**
 * Language priority:
 *   1. explicit choice saved in localStorage
 *   2. browser preferred languages (navigator.languages)
 *   3. English
 */
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in DICTS) return saved as Lang;
    const nav = navigator.languages?.[0] ?? navigator.language ?? 'en';
    const code = nav.split('-')[0].toLowerCase();
    return code in DICTS ? (code as Lang) : 'en';
  } catch {
    return 'en';
  }
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a key, replacing {placeholders} with vars. */
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  /** Translated body-type name: typeLabel('Moon', true) → "Moons". */
  typeLabel: (type: string, plural?: boolean) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    setLocale(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* private browsing */
    }
  }, [lang]);

  const t = useCallback<I18nValue['t']>(
    (key, vars) => {
      const dict = DICTS[lang];
      let str: string = dict[key] ?? DICTS.en[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return str;
    },
    [lang],
  );

  const typeLabel = useCallback<I18nValue['typeLabel']>(
    (type, plural = false) => {
      const key = (plural ? `type.${type}.plural` : `type.${type}`) as DictKey;
      const dict = DICTS[lang];
      return dict[key] ?? DICTS.en[key] ?? type;
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang: setLangState, t, typeLabel }),
    [lang, t, typeLabel],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
