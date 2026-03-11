import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
getFirestore
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDka78iWPf69fShIaS1uVOnKBx0UyoRUeY",
  authDomain: "campaign-chronicle-pro.firebaseapp.com",
  projectId: "campaign-chronicle-pro",
  storageBucket: "campaign-chronicle-pro.firebasestorage.app",
  messagingSenderId: "390100005209",
  appId: "1:390100005209:web:725840a61a273bc9aa1c48",
  measurementId: "G-TY2MZ2WE9M"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);