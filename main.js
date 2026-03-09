import { addMap } from "./map.js";

/* =========================
MAP SYSTEM
========================= */

const addMapBtn = document.getElementById("addMapBtn");
const mapUpload = document.getElementById("mapUpload");

addMapBtn.onclick = () => {

mapUpload.click();

};

mapUpload.onchange = (e) => {

const file = e.target.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = () => {

addMap(reader.result);

};

reader.readAsDataURL(file);

};


/* =========================
PAGE SWITCHING
========================= */

const mapsPageBtn = document.getElementById("mapsPageBtn");
const notesPageBtn = document.getElementById("notesPageBtn");

const mapsPage = document.getElementById("mapsPage");
const notesPage = document.getElementById("notesPage");

mapsPageBtn.onclick = () => {

mapsPage.classList.remove("hidden");
notesPage.classList.add("hidden");

};

notesPageBtn.onclick = () => {

notesPage.classList.remove("hidden");
mapsPage.classList.add("hidden");

};
