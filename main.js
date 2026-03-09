import { addMap, enableDrawing, createToken, createFog, addMarker } from "./map.js";

function get(id){
return document.getElementById(id);
}

/* =========================
PAGE SYSTEM
========================= */

const mapsPageBtn = get("mapsPageBtn");
const notesPageBtn = get("notesPageBtn");

const mapsPage = get("mapsPage");
const notesPage = get("notesPage");

if(mapsPageBtn && mapsPage && notesPage){

mapsPageBtn.onclick = ()=>{

mapsPage.classList.remove("hidden");
notesPage.classList.add("hidden");

};

}

if(notesPageBtn && mapsPage && notesPage){

notesPageBtn.onclick = ()=>{

notesPage.classList.remove("hidden");
mapsPage.classList.add("hidden");

};

}


/* =========================
MAP UPLOAD
========================= */

const addMapBtn = get("addMapBtn");
const mapUpload = get("mapUpload");

if(addMapBtn && mapUpload){

addMapBtn.onclick = ()=>{

mapUpload.click();

};

mapUpload.onchange = (e)=>{

const file = e.target.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = ()=>{

addMap(reader.result);

};

reader.readAsDataURL(file);

};

}


/* =========================
TOKEN BUTTON
========================= */

const tokenBtn = get("tokenBtn");

if(tokenBtn){

tokenBtn.onclick = ()=>{

createToken("https://cdn-icons-png.flaticon.com/512/3522/3522099.png");

};

}


/* =========================
FOG BUTTON
========================= */

const fogBtn = get("fogBtn");

if(fogBtn){

fogBtn.onclick = ()=>{

createFog();

};

}


/* =========================
MARKER BUTTON
========================= */

const markerBtn = get("markerBtn");

if(markerBtn){

markerBtn.onclick = ()=>{

addMarker(200,200,"📍");

};

}
