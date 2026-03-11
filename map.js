import { db } from "./firebase.js";
import { getCampaign } from "./campaign.js";

import {
doc,
setDoc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

function board(){
return document.getElementById("mapBoard");
}

export function addMap(src){

const img=document.createElement("img");

img.src=src;
img.className="mapLayer";

img.style.left="100px";
img.style.top="100px";

board().appendChild(img);

saveState();

}

export function createToken(src){

const token=document.createElement("img");

token.src=src;
token.className="token";

token.style.left="200px";
token.style.top="200px";

board().appendChild(token);

drag(token);

saveState();

}

function drag(el){

let x=0,y=0;

el.onmousedown=(e)=>{

x=e.clientX-el.offsetLeft;
y=e.clientY-el.offsetTop;

document.onmousemove=(e)=>{

el.style.left=(e.clientX-x)+"px";
el.style.top=(e.clientY-y)+"px";

};

document.onmouseup=()=>{
document.onmousemove=null;
saveState();
};

};

}

/* SAVE MAP STATE */

async function saveState(){

const campaign=getCampaign();

if(!campaign) return;

const items=[...board().children].map(el=>({

src:el.src,
x:el.style.left,
y:el.style.top,
type:el.className

}));

await setDoc(doc(db,"maps",campaign),{
items
});

}

/* REALTIME SYNC */

export function startSync(){

const campaign=getCampaign();

if(!campaign) return;

onSnapshot(doc(db,"maps",campaign),(snap)=>{

if(!snap.exists()) return;

const data=snap.data();

board().innerHTML="";

data.items.forEach(item=>{

const el=document.createElement("img");

el.src=item.src;
el.className=item.type;

el.style.left=item.x;
el.style.top=item.y;

board().appendChild(el);

});

});

}