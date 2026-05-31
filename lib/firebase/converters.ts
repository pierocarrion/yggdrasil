import { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export const createConverter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => {
    return data as DocumentData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T => {
    const data = snapshot.data(options);
    return { id: snapshot.id, ...data } as T;
  },
});
