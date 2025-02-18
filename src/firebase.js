import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

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

export { db, addDoc, collection, getDocs };