
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// TODO: Replace the following with your app's Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General -> Your Apps
const firebaseConfig = {
    apiKey: "AIzaSyAq9wiLaOhk85jrPPXRh1UhDx__fCUN7xs",
    authDomain: "geetas-photography-6acde.firebaseapp.com",
    projectId: "geetas-photography-6acde",
    storageBucket: "geetas-photography-6acde.firebasestorage.app",
    messagingSenderId: "224770509888",
    appId: "1:224770509888:web:1d58fab781f009c6c5a3a5",
    measurementId: "G-MZ6WL8V9Z1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics
export const analytics = getAnalytics(app);
