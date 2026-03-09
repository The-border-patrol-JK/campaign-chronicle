import { db } from "./firebase.js";

import {
collection,
addDoc,
query,
where,
getDocs,
updateDoc,
doc,
arrayUnion
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

let currentUser = null;

export function setUser(user){

currentUser = user;

}


/* =========================
GENERATE JOIN CODE
========================= */

function generateCode(){

return Math.floor(100000 + Math.random() * 900000).toString();

}


/* =========================
CREATE CAMPAIGN
========================= */

export async function createCampaign(){

const name = prompt("Campaign name?");

if(!name) return;

const code = generateCode();

await addDoc(collection(db,"campaigns"),{

name,
code,

ownerId: currentUser.uid,

members:[currentUser.uid],

roles:{
[currentUser.uid]:"dm"
}

});

alert("Campaign Join Code: " + code);

}


/* =========================
JOIN CAMPAIGN BY CODE
========================= */

export async function joinWithCode(code,userId){

const q = query(
collection(db,"campaigns"),
where("code","==",code)
);

const snap = await getDocs(q);

snap.forEach(async(docSnap)=>{

await updateDoc(doc(db,"campaigns",docSnap.id),{

members: arrayUnion(userId)

});

});

}
