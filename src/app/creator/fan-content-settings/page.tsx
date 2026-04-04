'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { FeatureHint } from '@/components/ui/FeatureHint'

export default function FanContentSettingsPage() {
  const [settings, setSettings] = useState({
    allowTier3Translations: true,
    allowTier3Audiobooks: true,
    defaultTranslationRevenueShare: 0.30,
    defaultAudiobookRevenueShare: 0.40,
    requireCustomDealApproval: false,
    autoApproveFanArt: false,
    autoConfirmProvisionalCharacters: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/creator/fan-content-settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/creator/fan-content-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Fan Content Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Control how fans can contribute translations and audiobooks to your works
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* Tier 3 Toggles */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              Allow Tier 3 Contributions
              <FeatureHint title="How fan contributions work">
                <p>There are three tiers of fan content on Chapturs:</p>
                <ul className="mt-1 space-y-1 list-none">
                  <li><strong>Tier 1 — AI:</strong> Instant machine translations and AI-generated narrations. Always available, no approval needed.</li>
                  <li><strong>Tier 2 — Community:</strong> Reader-submitted translations or recordings reviewed and approved by you.</li>
                  <li><strong>Tier 3 — Professional:</strong> Contracted contributors who work independently under a custom revenue-share deal you set.</li>
                </ul>
                <p className="mt-2">Enabling Tier 3 opens your story to applications from serious translators and narrators.</p>
              </FeatureHint>
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Allow Tier 3 Translations
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Let fans submit professional translations of your chapters
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowTier3Translations}
                  onChange={(e) =>
                    setSettings({ ...settings, allowTier3Translations: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Allow Tier 3 Audiobooks
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Let fans submit professional narrations of your chapters
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowTier3Audiobooks}
                  onChange={(e) =>
                    setSettings({ ...settings, allowTier3Audiobooks: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Revenue Share */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              Default Revenue Share
              <FeatureHint title="How revenue sharing works">
                <p>When a fan translator or narrator has an approved submission, they earn the percentage you set here out of the ad revenue generated by their version of the chapter.</p>
                <p className="mt-1">You keep the remainder. You can override these defaults on a per-contributor basis if you negotiate a custom Tier 3 deal.</p>
              </FeatureHint>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Translation Revenue Share (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={settings.defaultTranslationRevenueShare * 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultTranslationRevenueShare: parseFloat(e.target.value) / 100,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Percentage of ad revenue shared with translators (default: 30%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Audiobook Revenue Share (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={settings.defaultAudiobookRevenueShare * 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultAudiobookRevenueShare: parseFloat(e.target.value) / 100,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Percentage of ad revenue shared with narrators (default: 40%)
                </p>
              </div>
            </div>
          </div>

          {/* Custom Deal Approval */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Deal Approval
            </h2>
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Require Custom Deal Approval
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  If enabled, you must approve each Tier 3 contributor before they can submit content
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.requireCustomDealApproval}
                onChange={(e) =>
                  setSettings({ ...settings, requireCustomDealApproval: e.target.checked })
                }
                className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Fan Art Automation */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Fan Art Automation
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Auto-confirm provisional characters
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    When readers submit fan art with new names, auto-confirm those provisional characters.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoConfirmProvisionalCharacters}
                  onChange={(e) =>
                    setSettings({ ...settings, autoConfirmProvisionalCharacters: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Auto-approve fan art submissions
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically approve incoming fan art instead of sending it to pending review.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoApproveFanArt}
                  onChange={(e) =>
                    setSettings({ ...settings, autoApproveFanArt: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 How Fan Content Works
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>Tier 1 (Official):</strong> LLM translations and AI audiobooks (always available)</li>
              <li>• <strong>Tier 2 (Community):</strong> Crowdsourced edits on Tier 1 translations</li>
              <li>• <strong>Tier 3 (Professional):</strong> Fan-submitted complete translations & audiobooks</li>
              <li>• Fan art can be auto-approved and provisional characters can be auto-confirmed</li>
              <li>• Contributors earn revenue based on views/listens and your revenue share %</li>
              <li>• Quality voting helps readers find the best versions</li>
            </ul>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
