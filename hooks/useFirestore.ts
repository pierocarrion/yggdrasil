import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, onSnapshot, QueryConstraint, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { createConverter } from '@/lib/firebase/converters';

export function useFirestore<T>(path: string, ...queryConstraints: QueryConstraint[]) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) return;

    const colRef = collection(db, path).withConverter(createConverter<T>());
    const q = query(colRef, ...queryConstraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result = snapshot.docs.map((doc) => doc.data());
        setData(result);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path, ...queryConstraints]);

  return { data, loading, error };
}

export function useFirestoreDoc<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) return;

    const docRef = doc(db, path).withConverter(createConverter<T>());

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setData(snapshot.data() || null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}
