import { useTranslation } from 'react-i18next';

interface LanguageToggleProps {
  collapsed: boolean;
}

export function LanguageToggle({ collapsed }: LanguageToggleProps) {
  const { i18n } = useTranslation();

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const currentLang = i18n.language?.substring(0, 2) || 'de';

  if (collapsed) {
    return (
      <button
        onClick={() => toggleLanguage(currentLang === 'de' ? 'en' : 'de')}
        className="w-full flex items-center justify-center py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        {currentLang.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1 py-2 px-3">
      <button
        onClick={() => toggleLanguage('de')}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          currentLang === 'de'
            ? 'bg-teal-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        DE
      </button>
      <button
        onClick={() => toggleLanguage('en')}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          currentLang === 'en'
            ? 'bg-teal-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        EN
      </button>
    </div>
  );
}
