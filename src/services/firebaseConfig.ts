import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let firestoreDb;
try {
  // Use persistent IndexedDB local cache in browser environment
  if (typeof window !== 'undefined') {
    firestoreDb = initializeFirestore(
      app,
      { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
      (firebaseConfig as any).firestoreDatabaseId
    );
  } else {
    // Memory cache for SSR / Node environment
    firestoreDb = initializeFirestore(
      app,
      { localCache: memoryLocalCache() },
      (firebaseConfig as any).firestoreDatabaseId
    );
  }
} catch {
  firestoreDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);

