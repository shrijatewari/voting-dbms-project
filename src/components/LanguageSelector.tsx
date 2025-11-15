import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { profileService } from '../services/api';

interface LanguageSelectorProps {
  compact?: boolean;
  showLabel?: boolean;
}

const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

export default function LanguageSelector({ compact = false, showLabel = true }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = async (langCode: string) => {
    try {
      setSaving(true);
      await i18n.changeLanguage(langCode);
      localStorage.setItem('i18nextLng', langCode);
      
      // Save to user profile if logged in
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.voter_id) {
            await profileService.updateProfile(user.voter_id, {
              preferred_language: langCode
            });
          }
        } catch (err) {
          console.error('Failed to save language preference:', err);
        }
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-primary-navy transition-colors"
          disabled={saving}
        >
          <span className="text-lg">🌐</span>
          <span className="hidden md:inline">{currentLanguage.native}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between ${
                  i18n.language === lang.code ? 'bg-blue-50 text-primary-navy font-semibold' : 'text-gray-700'
                }`}
              >
                <div>
                  <div className="font-medium">{lang.native}</div>
                  <div className="text-xs text-gray-500">{lang.name}</div>
                </div>
                {i18n.language === lang.code && (
                  <span className="text-primary-navy">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-primary-navy rounded-lg hover:bg-blue-50 transition-all shadow-sm"
        disabled={saving}
      >
        <span className="text-xl">🌐</span>
        {showLabel && (
          <span className="font-medium text-primary-navy">
            {t('language')}: {currentLanguage.native}
          </span>
        )}
        <svg className={`w-5 h-5 text-primary-navy transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border-2 border-primary-navy z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200 mb-1">
              {t('select_language')}
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-between mb-1 ${
                  i18n.language === lang.code ? 'bg-blue-100 text-primary-navy font-semibold border-2 border-primary-navy' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="font-semibold text-base">{lang.native}</div>
                    <div className="text-xs text-gray-500">{lang.name}</div>
                  </div>
                </div>
                {i18n.language === lang.code && (
                  <span className="text-primary-navy text-lg font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


