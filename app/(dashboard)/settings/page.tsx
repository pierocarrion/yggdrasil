'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { SettingsTracker } from './_tracker';

export default function SettingsPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div>
      <SettingsTracker />
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded">
        Log Out
      </button>
    </div>
  );
}
