'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const { signInWithGoogle, loading, error } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
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
        <h1 className="text-2xl font-bold mb-4">Join Yggdrasil</h1>
        {error && <p className="text-red-500 mb-4">{error.message}</p>}
        <button
          onClick={handleSignup}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Sign up with Google
        </button>
      </div>
    </div>
  );
}
