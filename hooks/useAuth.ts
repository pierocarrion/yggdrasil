import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    return firebaseSignOut(auth);
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
  };
}
