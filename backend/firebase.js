// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyDkX5hrDKWtToB7VCGxa2wADifa0UUBuCo",
  authDomain: "bethel-7acbb.firebaseapp.com",
  projectId: "bethel-7acbb",
  storageBucket: "bethel-7acbb.firebasestorage.app",
  messagingSenderId: "910404607224",
  appId: "1:910404607224:web:972c755fc45461832d6f0d",
  measurementId: "G-CV320RJVKH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})
export const db = getFirestore(app);
const analytics = getAnalytics(app);