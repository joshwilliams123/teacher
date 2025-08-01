import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyCG2fRn8Gu0qmR5NFYi-grcnHtrl9zVHrs",
  authDomain: "harli-platform.firebaseapp.com",
  projectId: "harli-platform",
  storageBucket: "harli-platform.firebasestorage.app",
  messagingSenderId: "380977456320",
  appId: "1:380977456320:web:6848a021e071c32dcff925"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider(); 

export {
  db,
  auth,
  addDoc,
  collection,
  getDocs,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  query,
  where,
  googleProvider, 
  signInWithPopup 
};