import React from 'react'
import { X, CheckCircle, AlertTriangle, TrendingUp, BookOpen, Users, Globe, Zap, Sparkles } from 'lucide-react'

interface QualityReportModalProps {
  isOpen: boolean
  onClose: () => void
  assessment: any
  isLoading: boolean
}

export default function QualityReportModal({ isOpen, onClose, assessment, isLoading }: QualityReportModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-bold">Story Quality Assessment</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500 font-medium">Analyzing your story with GROQ AI...</p>
            </div>
          ) : assessment ? (
            <div className="space-y-6">
              {/* Top Summary Header */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <div>
                  <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-1">Overall Score</h3>
                  <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                    {assessment.overallScore}<span className="text-xl text-indigo-400 dark:text-indigo-600">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${assessment.qualityTier === 'exceptional' ? 'bg-green-100 text-green-800 border border-green-200' : 
                      assessment.qualityTier === 'strong' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                      assessment.qualityTier === 'developing' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                      'bg-red-100 text-red-800 border border-red-200'}`}>
                    Tier: {assessment.qualityTier.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Feedback Message */}
              <div>
                <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Constructive Feedback
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic p-3 bg-gray-50 dark:bg-gray-700/30 rounded border-l-4 border-green-500">
                  "{assessment.feedbackMessage}"
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <MetricCard icon={<BookOpen />} label="Writing Quality" score={assessment.writingQuality} />
                <MetricCard icon={<TrendingUp />} label="Storytelling" score={assessment.storytelling} />
                <MetricCard icon={<Users />} label="Characterization" score={assessment.characterization} />
                <MetricCard icon={<Globe />} label="World Building" score={assessment.worldBuilding} />
                <MetricCard icon={<Zap />} label="Engagement" score={assessment.engagement} />
                <MetricCard icon={<Sparkles />} label="Originality" score={assessment.originality} />
              </div>

              {/* Tags */}
              {assessment.discoveryTags && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">AI-Suggested Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(assessment.discoveryTags).map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <p>Failed to load quality assessment.</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, score }: { icon: React.ReactElement, label: string, score: number }) {
  // Determine color based on score
  const colorClass = score >= 90 ? 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200' :
                     score >= 75 ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200' :
                     score >= 60 ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' :
                     'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200'
  
  const barClass = score >= 90 ? 'bg-green-500' :
                   score >= 75 ? 'bg-blue-500' :
                   score >= 60 ? 'bg-yellow-500' :
                   'bg-red-500'

  return (
    <div className={`p-3 rounded-lg border ${colorClass} flex flex-col justify-between h-full`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5 opacity-80">
          {React.cloneElement(icon, { className: 'w-4 h-4' })}
          <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <span className="font-bold text-lg">{score}</span>
      </div>
      <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-1.5 mt-auto">
        <div className={`h-1.5 rounded-full ${barClass}`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  )
}
