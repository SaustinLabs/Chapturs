'use client'

import React, { useEffect, useState } from 'react';
import AdSupportSettings from './AdSupportSettings';
import PremiumSubscriptionSettings from './PremiumSubscriptionSettings';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  premiumStatus?: 'success' | 'canceled'
}

function DeleteAccountSection() {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/account', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      // Sign out and redirect after successful deletion
      await signOut({ callbackUrl: '/' });
    } catch {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-start gap-3 mb-4">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-400">Danger Zone</h3>
            <p className="text-sm text-red-600 dark:text-red-500 mt-1">
              Permanently delete your account and all associated data — bookmarks, reading history,
              comments, and any stories you've created. This cannot be undone.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
        >
          Delete my account
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Delete account?</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will permanently erase your account, all your stories, comments, bookmarks, and
              reading history. There is no recovery.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowModal(false); setConfirmText(''); }}
                className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || loading}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {loading ? 'Deleting…' : 'Yes, delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const ReaderMonetizationSettings: React.FC<Props> = ({ premiumStatus }) => {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!premiumStatus) return;
    if (premiumStatus === 'success') {
      toast.success('Welcome to Premium! Ads are now hidden and your subscription supports your favourite authors.');
    } else if (premiumStatus === 'canceled') {
      toast.info('Checkout canceled — you can subscribe any time.');
    }
    // Strip the query param so a refresh doesn't re-show the toast
    router.replace('/reader/settings', { scroll: false });
  }, [premiumStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <AdSupportSettings />
      <PremiumSubscriptionSettings />
      <DeleteAccountSection />
    </div>
  );
};

export default ReaderMonetizationSettings;
