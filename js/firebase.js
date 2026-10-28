// firebase.js - Firebase configuration & Modular initialization
// Using Firebase v10 CDN ES Modules for modern, zero-bundler setup in browser

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter,
    serverTimestamp, 
    onSnapshot,
    arrayUnion,
    arrayRemove,
    increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// REPLACE WITH YOUR FIREBASE PROJECT CONFIGURATION
// You can obtain these keys from the Firebase Console (Project Settings > General > Your apps)
export const firebaseConfig = {
    apiKey: "AIzaSyDummyKey_ReplaceWithYourActualFirebaseApiKey",
    authDomain: "instavibe-app.firebaseapp.com",
    projectId: "instavibe-app",
    storageBucket: "instavibe-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Check if developer has replaced dummy keys
export const isConfigured = () => {
    return firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("DummyKey");
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
    app,
    auth,
    db,
    storage,
    // Auth helpers
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    // Firestore helpers
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    increment,
    // Storage helpers
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
};
