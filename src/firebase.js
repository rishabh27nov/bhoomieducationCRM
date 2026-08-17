import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// Production Firebase Configuration for Bhoomi CRM
const firebaseConfig = {
  apiKey: "AIzaSyAZVHMcC7oYLRUbcqIfzLYYUhZspWjoLXU",
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

export { ref, onValue, set, storageRef, uploadBytes, getDownloadURL };
