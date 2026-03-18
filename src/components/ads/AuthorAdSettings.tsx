'use client'

import React, { useState } from 'react'
import { DollarSign, Settings, Eye, EyeOff, BarChart3, Info } from 'lucide-react'

interface AuthorAdSettingsProps {
  workId: string
  initialSettings: AdSettings
  onSave: (settings: AdSettings) => Promise<void>
}

export interface AdSettings {
  // Ad placement preferences
  sidebarEnabled: boolean // Always true, can't be disabled (platform requirement)
  inlineEnabled: boolean  // Author can toggle
  videoInterstitialEnabled: boolean // "Support Author" button between chapters
  
  // Density settings
  autoDensity: boolean // If true, platform calculates ad count based on word count
  maxAdsPerChapter: number // 1-5, only used if autoDensity is false
  
  // Creator cross-promotion
  showCreatorPromos: boolean // Show other creators' work recommendations
  creatorPromoSlots: number // How many promo slots to reserve (0-2)
  
  // Ad types allowed
  allowBanner: boolean
  allowNative: boolean
  allowVideo: boolean
}

const defaultSettings: AdSettings = {
  sidebarEnabled: true,
  inlineEnabled: true,
  videoInterstitialEnabled: true,
  autoDensity: true,
  maxAdsPerChapter: 3,
  showCreatorPromos: true,
  creatorPromoSlots: 1,
  allowBanner: true,
  allowNative: true,
  allowVideo: false,
}

export default function AuthorAdSettings({
  workId,
  initialSettings,
  onSave,
}: AuthorAdSettingsProps) {
  const [settings, setSettings] = useState<AdSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const updateSetting = <K extends keyof AdSettings>(
    key: K,
    value: AdSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(settings)
      setSaved(true)
    } catch (error) {
      console.error('Failed to save ad settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Monetization Settings
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Control how ads appear in your work
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BarChart3 className="w-4 h-4" />
          70% revenue share
        </div>
      </div>

      {/* Revenue Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium">How revenue works</p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            You earn 70% of ad revenue from your work. Sidebar ads are always shown 
            (platform requirement). Inline and video ads are your choice. More engaged 
            readers = more revenue.
          </p>
        </div>
      </div>

      {/* Sidebar Ads - Always On */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Ad Placements
        </h4>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Sidebar Ads
              </p>
              <p className="text-xs text-gray-500">Always shown on chapter pages</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            Required
          </div>
        </div>

        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            {settings.inlineEnabled ? (
              <Eye className="w-4 h-4 text-green-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Inline Ads
              </p>
              <p className="text-xs text-gray-500">
                Ads between scenes/paragraphs based on chapter length
              </p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('inlineEnabled', !settings.inlineEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.inlineEnabled
                ? 'bg-green-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.inlineEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            {settings.videoInterstitialEnabled ? (
              <Eye className="w-4 h-4 text-green-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                "Support Author" Video Ads
              </p>
              <p className="text-xs text-gray-500">
                Readers can watch video ads between chapters to support you
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              updateSetting('videoInterstitialEnabled', !settings.videoInterstitialEnabled)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.videoInterstitialEnabled
                ? 'bg-green-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.videoInterstitialEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Density Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Ad Density
        </h4>

        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Automatic Density
            </p>
            <p className="text-xs text-gray-500">
              Platform calculates ads based on chapter word count (1 per 1000 words, max 5)
            </p>
          </div>
          <button
            onClick={() => updateSetting('autoDensity', !settings.autoDensity)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoDensity ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autoDensity ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {!settings.autoDensity && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Max Ads Per Chapter: {settings.maxAdsPerChapter}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.maxAdsPerChapter}
              onChange={(e) =>
                updateSetting('maxAdsPerChapter', parseInt(e.target.value))
              }
              className="w-full mt-2 accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 (minimal)</span>
              <span>5 (maximum)</span>
            </div>
          </div>
        )}
      </div>

      {/* Creator Cross-Promotion */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Creator Cross-Promotion
        </h4>
        <p className="text-xs text-gray-500">
          Promote other creators&apos; work (free, no revenue earned from these)
        </p>

        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Show Creator Recommendations
            </p>
            <p className="text-xs text-gray-500">
              Display other creators&apos; works in your chapters
            </p>
          </div>
          <button
            onClick={() =>
              updateSetting('showCreatorPromos', !settings.showCreatorPromos)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.showCreatorPromos
                ? 'bg-green-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.showCreatorPromos ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.showCreatorPromos && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Promo Slots: {settings.creatorPromoSlots}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              value={settings.creatorPromoSlots}
              onChange={(e) =>
                updateSetting('creatorPromoSlots', parseInt(e.target.value))
              }
              className="w-full mt-2 accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>2 (max)</span>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Settings saved!
          </p>
        )}
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
