import { initializeApp } from "firebase/app";
import { getDatabase, get, ref, onValue, set, update } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeAuth, browserLocalPersistence, browserSessionPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";

// Production Firebase Configuration for Bhoomi CRM
const firebaseConfig = {
  apiKey: "AIzaSyAZVHMqc7oYLRUbcqIfzLYYUhZspVjolXU",
  authDomain: "bhoomi-crm.firebaseapp.com",
  databaseURL: "https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bhoomi-crm",
  storageBucket: "bhoomi-crm.firebasestorage.app",
  messagingSenderId: "999168990517",
  appId: "1:999168990517:web:703ec59210b4e8a008407c",
  measurementId: "G-3V89YW5S8Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
// Avoid IndexedDB failures while the Google popup backgrounds the CRM tab.
export const auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, browserSessionPersistence],
  popupRedirectResolver: browserPopupRedirectResolver
});
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { get, ref, onValue, set, update, storageRef, uploadBytes, getDownloadURL, signInWithEmailAndPassword, signInWithPopup, signOut };
