import AppLayout from '@/components/AppLayout';
import ReaderMonetizationSettings from '@/components/ReaderMonetizationSettings';
import ContributorHubToggleSettings from '@/components/ContributorHubToggleSettings';
import WeeklyDigestToggle from '@/components/WeeklyDigestToggle';

export default async function ReaderSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ premium?: string }>
}) {
  const { premium } = await searchParams;
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Reader Settings</h1>
        <ReaderMonetizationSettings premiumStatus={premium as 'success' | 'canceled' | undefined} />
        <ContributorHubToggleSettings />
        <WeeklyDigestToggle />
      </div>
    </AppLayout>
  );
}
