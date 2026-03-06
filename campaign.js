import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

let currentUser = null;

export function setUser(user){
  currentUser = user;
}

/* CREATE CAMPAIGN */

export async function createCampaign(){

  const name = prompt("Campaign name?");
  if(!name) return;

  await addDoc(collection(db,"campaigns"),{
    name,
    ownerId: currentUser.uid,
    members:[currentUser.uid],
    createdAt: new Date()
  });

}

/* LOAD CAMPAIGNS */

export function loadCampaigns(render){

  const q = query(
    collection(db,"campaigns"),
    where("members","array-contains",currentUser.uid)
  );

  onSnapshot(q,snap=>{

    const campaigns=[];

    snap.forEach(docSnap=>{
      campaigns.push({
        id:docSnap.id,
        ...docSnap.data()
      });
    });

    render(campaigns);

  });

}

/* JOIN CAMPAIGN FROM LINK */

export async function joinCampaign(campaignId,userId){

  const ref = doc(db,"campaigns",campaignId);

  await updateDoc(ref,{
    members: arrayUnion(userId)
  });

}

/* LIVE EDITOR */

export function openEditor(campaignId,textarea){

  const noteRef = doc(db,"campaigns",campaignId,"editor","live");

  onSnapshot(noteRef,snap=>{

    if(!snap.exists()) return;

    const data = snap.data();

    if(textarea.value !== data.text){
      textarea.value = data.text;
    }

  });

  textarea.addEventListener("input",async()=>{

    await setDoc(noteRef,{
      text:textarea.value,
      updated:new Date()
    });

  });

}
