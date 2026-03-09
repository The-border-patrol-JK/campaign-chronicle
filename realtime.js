import { db } from "./firebase.js";
import {
doc,
setDoc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


/* =========================
SYNC TOKEN
========================= */

export function syncToken(campaignId, tokenId, data){

const ref = doc(db,"campaigns",campaignId,"tokens",tokenId);

setDoc(ref,data);

}


export function watchTokens(campaignId, callback){

const ref = doc(db,"campaigns",campaignId,"tokens","live");

onSnapshot(ref,(snap)=>{

if(!snap.exists()) return;

callback(snap.data());

});

}


/* =========================
SYNC DRAW
========================= */

export function syncDrawing(campaignId,data){

const ref = doc(db,"campaigns",campaignId,"drawing","live");

setDoc(ref,data);

}


export function watchDrawing(campaignId,callback){

const ref = doc(db,"campaigns",campaignId,"drawing","live");

onSnapshot(ref,(snap)=>{

if(!snap.exists()) return;

callback(snap.data());

});

}