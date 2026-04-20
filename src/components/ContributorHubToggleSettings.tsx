'use client'

import React, { useState, useEffect } from 'react';

const ContributorHubToggleSettings: React.FC = () => {
  const [isContributor, setIsContributor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/contributor')
      .then(res => res.json())
      .then(data => {
        setIsContributor(!!data.isContributor);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggleContributor = async (checked: boolean) => {
    setLoading(true);
    await fetch('/api/user/contributor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isContributor: checked }),
    });
    setIsContributor(checked);
    setLoading(false);
    // Reload page to reflect sidebar updates
    window.location.reload();
  };

  return (
    <div className="border border-blue-200 dark:border-blue-900/50 rounded-xl p-6 bg-blue-50/50 dark:bg-blue-950/20 mt-8">
      <h2 className="text-xl font-bold mb-2 text-blue-900 dark:text-blue-100">Contributor Hub</h2>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-6">
        Turn on the Contributor Hub to access tools for translating stories, drawing fan-art, and narrating audiobooks.
      </p>
      {loading ? (
        <div className="text-sm text-blue-500">Loading...</div>
      ) : (
        <div className="flex items-center space-x-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isContributor}
              onChange={e => toggleContributor(e.target.checked)}
              className="sr-only peer"
              disabled={loading}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isContributor ? 'Contributor Mode Active' : 'Enable Contributor Mode'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ContributorHubToggleSettings;
