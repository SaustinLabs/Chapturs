'use client'

import React, { useEffect, useState } from 'react';
import { PaymentService } from '@/lib/payment';
import { useToast } from '@/components/ui/Toast';

const PremiumSubscriptionSettings: React.FC = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/user/monetization')
      .then(res => res.json())
      .then(data => {
        setIsPremium(!!data.isPremium);
        setLoading(false);
      });
  }, []);

  const goPremium = async () => {
    setProcessing(true);
    try {
      // TODO: Get user ID from auth context
      const result = await PaymentService.createPremiumSubscription('user_id_placeholder');
      if (result.success) {
        await fetch('/api/user/monetization', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPremium: true }),
        });
        setIsPremium(true);
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred. Please try again.');
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Premium Subscription</h2>
      {loading && <div>Loading subscription status...</div>}
      {isPremium ? (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-green-700 font-medium mb-2">You are a Premium member!</p>
          <p>No ads will be shown. Your $5/month supports your favorite creators directly.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p>Go ad-free and support creators for just <span className="font-semibold">$5/month</span>.</p>
          <button 
            onClick={goPremium} 
            disabled={processing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Go Premium'}
          </button>
          <p className="text-xs text-gray-500 mt-1">Subscription revenue is split among creators you read, just like ad revenue.</p>
        </div>
      )}
    </div>
  );
};

export default PremiumSubscriptionSettings;
