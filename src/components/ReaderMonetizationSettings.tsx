'use client'

import React, { useEffect } from 'react';
import AdSupportSettings from './AdSupportSettings';
import PremiumSubscriptionSettings from './PremiumSubscriptionSettings';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

interface Props {
  premiumStatus?: 'success' | 'canceled'
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
    </div>
  );
};

export default ReaderMonetizationSettings;
