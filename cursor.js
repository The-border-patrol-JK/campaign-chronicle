import { db } from "./firebase.js";

import {
doc,
setDoc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


export function initCursorTracking(userId){

const board=document.getElementById("mapBoard");

const cursor=document.createElement("div");

cursor.className="cursor";

board.appendChild(cursor);


document.onmousemove=(e)=>{

setDoc(
doc(db,"cursors",userId),
{
x:e.clientX,
y:e.clientY
}
);

};


onSnapshot(
doc(db,"cursors",userId),
(snap)=>{

if(!snap.exists()) return;

const data=snap.data();

cursor.style.left=data.x+"px";
cursor.style.top=data.y+"px";

}
);

}