import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '../utils/i18n';
import toast from 'react-hot-toast';
import { HiUser, HiBell, HiMoon, HiGlobe, HiSave, HiColorSwatch } from 'react-icons/hi';
import { authAPI } from '../services/api';
import { generatePalette, CUSTOM_THEME_KEY } from '../utils/themes';

const LEVELS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const Settings = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const { isDark, toggleTheme, theme, setTheme, themes, setCustomPalette } = useContext(ThemeContext);
  const [tab, setTab] = useState('profile');
  useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [profile, setProfile] = useState({
    username: user?.username || '',
    channelDescription: user?.channelDescription || '',
  });
  const [saving, setSaving] = useState(false);
  const savedCustom = localStorage.getItem(CUSTOM_THEME_KEY);
  const initialCustomHex = savedCustom ? (() => {
    try { const p = JSON.parse(savedCustom); const [r, g, b] = p[500].split(' '); return `#${[r, g, b].map(v => parseInt(v).toString(16).padStart(2, '0')).join('')}`; } catch { return '#a21caf'; }
  })() : '#a21caf';
  const [customColor, setCustomColor] = useState(initialCustomHex);
  const [customPalette, setCustomPalettePreview] = useState(null);

  const handleThemeChange = async (t) => {
    setTheme(t);
    if (t === 'custom') {
      const saved = localStorage.getItem(CUSTOM_THEME_KEY);
      if (saved) {
        try { setCustomPalettePreview(JSON.parse(saved)); } catch { }
      }
    } else {
      setCustomPalettePreview(null);
    }
    try {
      await authAPI.updatePreferences({ theme: t });
    } catch {
    }
  };

  const handleCustomColorChange = (hex) => {
    setCustomColor(hex);
    const palette = generatePalette(hex);
    setCustomPalettePreview(palette);
  };

  const handleApplyCustom = async () => {
    const palette = setCustomPalette(customColor);
    setCustomPalettePreview(palette);
    if (theme !== 'custom') {
      setTheme('custom');
    }
    try {
      await authAPI.updatePreferences({ theme: 'custom' });
      toast.success('Custom theme applied!');
    } catch {
      toast.error('Failed to save theme');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(profile);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: HiUser },
    { id: 'appearance', label: 'Appearance', icon: HiMoon },
    { id: 'notifications', label: 'Notifications', icon: HiBell },
    { id: 'language', label: 'Language', icon: HiGlobe },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      <div className="flex gap-6">
        <div className="w-56 space-y-1 flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-all ${
                tab === t.id ? 'bg-dark-700 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              <t.icon className="text-lg" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 card p-6">
          {tab === 'profile' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Profile Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Channel Description</label>
                <textarea
                  value={profile.channelDescription}
                  onChange={(e) => setProfile({ ...profile, channelDescription: e.target.value })}
                  className="input-field h-24 resize-none"
                  placeholder="Tell viewers about your channel"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <HiSave className="text-lg" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Appearance</h2>
                <p className="text-sm text-gray-400 mt-1">Choose your preferred theme</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      theme === t.id
                        ? 'border-primary-500 bg-dark-700'
                        : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: t.primary }}
                      />
                      <span className="text-white font-medium text-sm">{t.name}</span>
                    </div>
                    <p className="text-xs text-gray-400">{t.description}</p>
                    {theme === t.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {theme === 'custom' && (
                <div className="bg-dark-800 rounded-xl border border-dark-600 p-4 space-y-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <HiColorSwatch className="text-primary-500" />
                    Custom Theme Colors
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      className="w-12 h-12 rounded-lg border border-dark-600 cursor-pointer bg-transparent"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">Accent Color</p>
                      <p className="text-xs text-gray-500">Choose your primary accent color</p>
                    </div>
                  </div>
                  {customPalette && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Palette Preview</p>
                      <div className="flex gap-1">
                        {LEVELS.map((l) => {
                          const rgb = customPalette[l];
                          return (
                            <div
                              key={l}
                              className="flex-1 h-8 rounded first:rounded-l-md last:rounded-r-md"
                              style={{ backgroundColor: `rgb(${rgb})` }}
                              title={`${l}: rgb(${rgb})`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button onClick={handleApplyCustom} className="btn-primary text-sm w-full">
                    Apply Custom Theme
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl">
                <div>
                  <p className="text-white font-medium">Quick Toggle</p>
                  <p className="text-sm text-gray-400">Switch between dark and light</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isDark ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
              {['Push Notifications', 'Email Notifications', 'Subscriber Alerts', 'Comment Alerts'].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 bg-dark-800 rounded-xl">
                  <p className="text-white">{item}</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {tab === 'language' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Language & Region</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                <select
                  className="input-field"
                  value={language}
                  onChange={(e) => {
                    const lng = e.target.value;
                    setLanguage(lng);
                    i18n.changeLanguage(lng);
                  }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
