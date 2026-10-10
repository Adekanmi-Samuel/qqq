"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const CONSENT_COOKIE_NAME = "sh_consent";
const CONSENT_LOCAL_STORAGE_KEY = "schoolhub_cookie_consent";
const AUTO_DISMISS_MS = 10_000;

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
  });
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedConsent = localStorage.getItem(CONSENT_LOCAL_STORAGE_KEY);
    if (!storedConsent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }

    try {
      const parsed = JSON.parse(storedConsent) as ConsentPreferences;
      setPreferences(parsed);
      applyConsentSettings(parsed);
    } catch {
      setShowBanner(true);
    }
  }, []);

  // Push page content up so footer isn't hidden behind the banner
  useEffect(() => {
    if (!showBanner) {
      document.body.style.paddingBottom = "";
      return;
    }
    document.body.style.paddingBottom = "160px";
    return () => { document.body.style.paddingBottom = ""; };
  }, [showBanner]);

  // Auto-dismiss after 10 seconds: reject non-essential cookies by default
  useEffect(() => {
    if (!showBanner) return;

    autoDismissRef.current = setTimeout(() => {
      handleRejectNonEssential();
    }, AUTO_DISMISS_MS);

    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBanner]);

  const clearAutoDismiss = useCallback(() => {
    if (autoDismissRef.current) {
      clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }
  }, []);

  const applyConsentSettings = (prefs: ConsentPreferences) => {
    console.log("[Cookie Consent] Applied settings:", prefs);
  };

  const saveConsent = (prefs: ConsentPreferences) => {
    clearAutoDismiss();
    const consentData = { ...prefs, timestamp: Date.now() };

    localStorage.setItem(CONSENT_LOCAL_STORAGE_KEY, JSON.stringify(consentData));

    document.cookie = `${CONSENT_COOKIE_NAME}=${JSON.stringify(consentData)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax; Secure`;

    setPreferences(consentData);
    applyConsentSettings(consentData);
    setShowBanner(false);
    setShowCustomize(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  };

  const handleSavePreferences = () => {
    saveConsent({
      ...preferences,
      essential: true,
      timestamp: Date.now(),
    });
  };

  const handleClose = () => {
    handleRejectNonEssential();
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm md:bottom-6 md:left-auto md:translate-x-0 md:right-6 md:w-auto md:max-w-lg z-50"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {!showCustomize ? (
          <div className="p-3 md:p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Cookie Preferences
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  We use cookies to enhance your experience.
                  <span className="hidden sm:inline"> Essential cookies are always active.</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close cookie banner"
                className="shrink-0 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
              <button
                onClick={handleAcceptAll}
                className="flex-1 sm:flex-none min-h-[40px] md:min-h-[44px] px-4 md:px-5 py-2 md:py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="flex-1 sm:flex-none min-h-[40px] md:min-h-[44px] px-4 md:px-5 py-2 md:py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  clearAutoDismiss();
                  setShowCustomize(true);
                }}
                className="min-h-[40px] md:min-h-[44px] px-4 md:px-5 py-2 md:py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
              >
                Customize
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Cookie Settings
              </h3>
              <button
                onClick={handleClose}
                aria-label="Close cookie settings"
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Essential Cookies</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                      Always Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Required for authentication, security, and core functionality.
                  </p>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Analytics Cookies</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Marketing Cookies</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Used to track visitors for display of relevant advertisements.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCustomize(false);
                  // Restart auto-dismiss since user went back
                  autoDismissRef.current = setTimeout(() => {
                    handleRejectNonEssential();
                  }, AUTO_DISMISS_MS);
                }}
                className="min-h-[44px] px-5 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSavePreferences}
                className="min-h-[44px] px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
