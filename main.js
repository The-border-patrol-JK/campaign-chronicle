import { setupAuth } from "./auth.js";

import {
  setUser,
  createCampaign,
  loadCampaigns,
  openEditor,
  joinCampaign
} from "./campaign.js";

import {
  renderCampaignList,
  showCampaign,
  generateCharacterIdea,
  fireIdea
} from "./ui.js";

import {
  setupPresence,
  watchPresence,
  trackTyping
} from "./presence.js";

import { loadSettings } from "./settings.js";

import { db } from "./firebase.js";
import { doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


/* =========================
   DOM REFERENCES
========================= */

const authSection = document.getElementById("authSection");
const appLayout = document.getElementById("appLayout");

const campaignTitle = document.getElementById("campaignTitle");
const campaignList = document.getElementById("campaignList");

const textarea = document.getElementById("noteText");

const fireBtn = document.getElementById("fireBtn");
const newCampaignBtn = document.getElementById("newCampaignBtn");
const settingsBtn = document.getElementById("settingsBtn");
const inviteBtn = document.getElementById("inviteBtn");
const charBtn = document.getElementById("characterBtn");

const mapUpload = document.getElementById("mapUpload");
const mapPreview = document.getElementById("mapPreview");


/* =========================
   STATE
========================= */

let currentUser = null;
let currentCampaign = null;


/* =========================
   AUTH SYSTEM
========================= */

setupAuth(

  /* LOGIN */

  (user) => {

    currentUser = user;

    authSection.classList.add("hidden");
    appLayout.classList.remove("hidden");

    setUser(user);

    checkInvite(user);

    loadCampaigns((campaigns) => {

      renderCampaignList(campaigns, openCampaign);

    });

  },

  /* LOGOUT */

  () => {

    authSection.classList.remove("hidden");
    appLayout.classList.add("hidden");

    currentUser = null;
    currentCampaign = null;

  }

);


/* =========================
   CREATE CAMPAIGN
========================= */

newCampaignBtn.onclick = () => {

  createCampaign();

};


/* =========================
   OPEN CAMPAIGN
========================= */

function openCampaign(campaign){

  currentCampaign = campaign.id;

  showCampaign(campaign.name);

  /* collaborative editor */

  openEditor(currentCampaign, textarea);

  /* presence system */

  setupPresence(currentUser, currentCampaign);

  watchPresence((users) => {

    const indicator = document.getElementById("typingIndicator");

    indicator.innerText = users.join(", ") + " online";

  });

  trackTyping(textarea);

}


/* =========================
   INVITE SYSTEM
========================= */

inviteBtn.onclick = () => {

  if(!currentCampaign) return;

  const link =
    `${window.location.origin}${window.location.pathname}?join=${currentCampaign}`;

  navigator.clipboard.writeText(link);

  alert("Invite link copied!");

};


/* =========================
   AUTO JOIN FROM LINK
========================= */

function checkInvite(user){

  const params = new URLSearchParams(window.location.search);

  const campaignId = params.get("join");

  if(!campaignId) return;

  joinCampaign(campaignId,user.uid);

}


/* =========================
   CHARACTER IDEA BUTTON
========================= */

charBtn.onclick = () => {

  const idea = generateCharacterIdea();

  document.getElementById("characterIdea").innerText = idea;

};


/* =========================
   STORY IDEA BUTTON
========================= */

fireBtn.onclick = () => {

  const indicator = document.getElementById("typingIndicator");

  fireIdea(textarea.value,indicator);

};


/* =========================
   SETTINGS PANEL
========================= */

settingsBtn.onclick = () => {

  if(!currentCampaign){

    alert("Open a campaign first.");

    return;

  }

  loadSettings(currentCampaign);

};


/* =========================
   MAP UPLOAD PREVIEW
========================= */

mapUpload.onchange = (e)=>{

  const file = e.target.files[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = ()=>{

    mapPreview.src = reader.result;

  };

  reader.readAsDataURL(file);

};


/* =========================
   AUTOSAVE SYSTEM
========================= */

let autosaveTimer;

textarea.addEventListener("input",()=>{

  clearTimeout(autosaveTimer);

  autosaveTimer = setTimeout(()=>{

    textarea.dispatchEvent(new Event("saveEditor"));

  },2000);

});


/* =========================
   AUTOSAVE EVENT
========================= */

textarea.addEventListener("saveEditor",()=>{

  console.log("Autosaved session text");

});
