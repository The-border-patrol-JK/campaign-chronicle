// ===== Campaign Chronicle PRO SaaS Edition =====

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "AIzaSyDka78iWPf69fShIaS1uVOnKBx0UyoRUeY",
  authDomain: "campaign-chronicle-pro.firebaseapp.com",
  projectId: "campaign-chronicle-pro",
  storageBucket: "campaign-chronicle-pro.firebasestorage.app",
  messagingSenderId: "390100005209",
  appId: "1:390100005209:web:725840a61a273bc9aa1c48"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentCampaignId = null;
let currentUser = null;

/* ===== AUTH SYSTEM ===== */

window.register = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  await createUserWithEmailAndPassword(auth, email, password);
};

window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  await signInWithEmailAndPassword(auth, email, password);
};

window.logout = async function () {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("appSection").classList.remove("hidden");
    loadCampaigns();
  } else {
    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("appSection").classList.add("hidden");
  }
});

/* ===== CAMPAIGNS ===== */

window.createCampaign = async function () {
  const name = prompt("Campaign name?");
  if (!name) return;

  await addDoc(collection(db, "campaigns"), {
    name,
    ownerId: currentUser.uid,
    members: [],
    createdAt: new Date()
  });
};

function loadCampaigns() {
  const q = query(
    collection(db, "campaigns"),
    where("ownerId", "==", currentUser.uid)
  );

  onSnapshot(q, snapshot => {
    const list = document.getElementById("campaignList");
    list.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      list.innerHTML += `
        <strong>${data.name}</strong>
        <button onclick="openCampaign('${docSnap.id}')">Open</button>
        <hr>
      `;
    });
  });
}

/* ===== OPEN CAMPAIGN ===== */

window.openCampaign = function (id) {
  currentCampaignId = id;
  loadNotes();
};

/* ===== NOTES ===== */

function loadNotes() {
  onSnapshot(collection(db, "campaigns", currentCampaignId, "notes"), snapshot => {
    const div = document.getElementById("notes");
    div.innerHTML = `
      <input id="noteTitle" placeholder="Session Title">
      <textarea id="noteText" placeholder="Write notes..."></textarea>
      <button onclick="saveNote()">Save</button>
      <hr>
    `;

    snapshot.forEach(docSnap => {
      const note = docSnap.data();
      div.innerHTML += `
        <div class="note-card">
          <h3>${note.title}</h3>
          <p>${note.text}</p>
          <button onclick="deleteNote('${docSnap.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.saveNote = async function () {
  const title = document.getElementById("noteTitle").value;
  const text = document.getElementById("noteText").value;

  await addDoc(collection(db, "campaigns", currentCampaignId, "notes"), {
    title,
    text,
    createdAt: new Date()
  });
};

window.deleteNote = async function (noteId) {
  await deleteDoc(doc(db, "campaigns", currentCampaignId, "notes", noteId));
};


