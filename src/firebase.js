import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// Standard Firebase Configuration (Placeholder for production keys or environment variables)
const firebaseConfig = {
  apiKey: "AIzaSyDemoConfigKeyForLakshyaCRM",
  authDomain: "lakshya-crm-bhoomi.firebaseapp.com",
  databaseURL: "https://lakshya-crm-bhoomi-default-rtdb.firebaseio.com",
  projectId: "lakshya-crm-bhoomi",
  storageBucket: "lakshya-crm-bhoomi.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);

export { ref, onValue, set, storageRef, uploadBytes, getDownloadURL };
