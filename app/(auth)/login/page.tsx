'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithGoogle, loading, error } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      router.push('/journal');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary text-background">
      <div className="p-8 bg-white rounded-lg shadow-lg text-foreground text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Yggdrasil</h1>
        {error && <p className="text-red-500 mb-4">{error.message}</p>}
        <button
          onClick={handleLogin}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
