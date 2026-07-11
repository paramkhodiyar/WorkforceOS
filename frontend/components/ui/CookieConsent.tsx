'use client';

import React, { useState, useEffect } from 'react';

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true, // Always true
    functional: true,
    analytics: true,
  });

  useEffect(() => {
    // Check if user already set their cookie consent preferences
    if (typeof window !== 'undefined') {
      const storedConsent = localStorage.getItem('wos-cookie-consent');
      if (!storedConsent) {
        // Wait 1.5 seconds to show banner for smooth initial load UX
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        try {
          const parsed = JSON.parse(storedConsent);
          applyPreferences(parsed);
        } catch (e) {
          setShowBanner(true);
        }
      }
    }
  }, []);

  const applyPreferences = (preferences: CookiePreferences) => {
    if (typeof window !== 'undefined') {
      (window as any).allowedCookies = preferences;
      
      // Dispatch custom event so other components or services can listen to consent changes
      const event = new CustomEvent('cookie-consent-changed', { detail: preferences });
      window.dispatchEvent(event);
    }
  };

  const handleAcceptAll = () => {
    const allAccept: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
    };
    savePreferences(allAccept);
  };

  const handleDeclineAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
    };
    savePreferences(essentialOnly);
  };

  const handleSavePreferences = () => {
    savePreferences(prefs);
  };

  const savePreferences = (preferences: CookiePreferences) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wos-cookie-consent', JSON.stringify(preferences));
      applyPreferences(preferences);
      setShowBanner(false);
      setShowPreferences(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[420px] bg-white border border-slate-200 rounded-2xl shadow-xl z-[9999] p-5 animate-slide-in-up font-sans">
      {!showPreferences ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-primary shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">cookie</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Cookie Consent</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                We use cookies to secure authentication, manage shifts, and analyze app metrics. 
                Configure your choices below or read our{' '}
                <a href="/cookie-policy" className="text-primary hover:underline font-semibold font-sans">
                  Cookie Policy
                </a>.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleAcceptAll}
              className="flex-1 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
            >
              Accept All
            </button>
            <button
              onClick={handleDeclineAll}
              className="flex-1 px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
            >
              Essential Only
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
            >
              Preferences
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Cookie Preferences</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize which cookies you permit us to set on your device.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Essential Cookies */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Strictly Essential</span>
                <span className="text-[10px] text-slate-450 block mt-0.5 font-medium">Authentication & security. Required.</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  disabled
                  checked
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-primary rounded-full opacity-60"></div>
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-all"></div>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Functional</span>
                <span className="text-[10px] text-slate-450 block mt-0.5 font-medium">Saves user UI configurations & custom views.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.functional}
                  onChange={(e) => setPrefs({ ...prefs, functional: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Analytical Cookies */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Performance & Analytics</span>
                <span className="text-[10px] text-slate-450 block mt-0.5 font-medium font-sans">Monitors app errors and performance metrics.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSavePreferences}
              className="flex-1 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
            >
              Save Choices
            </button>
            <button
              onClick={() => setShowPreferences(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
