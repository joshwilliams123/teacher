import React from 'react';
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'; 
import './css/styles.css'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import { initializeApp } from "firebase/app";


const firebaseConfig = {
  apiKey: "AIzaSyCG2fRn8Gu0qmR5NFYi-grcnHtrl9zVHrs",
  authDomain: "harli-platform.firebaseapp.com",
  projectId: "harli-platform",
  storageBucket: "harli-platform.firebasestorage.app",
  messagingSenderId: "380977456320",
  appId: "1:380977456320:web:6848a021e071c32dcff925"
};

 initializeApp(firebaseConfig);

createRoot(
  document.getElementById('root')
).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
    
);