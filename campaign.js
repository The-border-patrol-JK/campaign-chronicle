import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

let currentUser = null;
let currentCampaign = null;

/* =========================
   USER
========================= */

export function setUser(user) {
  currentUser = user;
}

/* =========================
   CREATE CAMPAIGN
========================= */

export function createCampaign() {

  const name = prompt("Campaign name?");
  if (!name) return;

  addDoc(collection(db, "campaigns"), {
    name,
    ownerId: currentUser.uid,
    createdAt: new Date()
  });

}

/* =========================
   LOAD CAMPAIGNS
========================= */

export function loadCampaigns(render) {

  const q = query(
    collection(db, "campaigns"),
    where("ownerId", "==", currentUser.uid)
  );

  onSnapshot(q, snapshot => {

    const campaigns = [];

    snapshot.forEach(docSnap => {
      campaigns.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    render(campaigns);

  });

}

/* =========================
   LIVE COLLAB EDITOR
========================= */

export function openEditor(campaignId, textarea) {

  currentCampaign = campaignId;

  const noteRef = doc(db, "campaigns", campaignId, "editor", "live");

  /* listen for updates */

  onSnapshot(noteRef, snap => {

    if (!snap.exists()) return;

    const data = snap.data();

    if (textarea.value !== data.text) {
      textarea.value = data.text;
    }

  });

  /* live typing save */

  textarea.addEventListener("input", async () => {

    await setDoc(noteRef, {
      text: textarea.value,
      updated: new Date()
    });

  });

}
