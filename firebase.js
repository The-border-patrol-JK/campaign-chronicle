import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDka78iWPf69fShIaS1uVOnKBx0UyoRUeY",
  authDomain: "campaign-chronicle-pro.firebaseapp.com",
  projectId: "campaign-chronicle-pro",
  storageBucket: "campaign-chronicle-pro.firebasestorage.app",
  messagingSenderId: "390100005209",
  appId: "1:390100005209:web:725840a61a273bc9aa1c48"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function ensureSignedIn() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const result = await signInAnonymously(auth);
  return result.user;
}
