import { setupAuth } from "./auth.js";

import {
  setUser,
  createCampaign,
  loadCampaigns,
  openEditor
} from "./campaign.js";

import {
  renderCampaignList,
  showCampaign,
  updateTypingIndicator,
  fireIdea
} from "./ui.js";

import {
  setupPresence,
  watchPresence,
  trackTyping
} from "./presence.js";

import { loadSettings } from "./settings.js";

/* =========================
   DOM REFERENCES
========================= */

const authSection = document.getElementById("authSection");
const appLayout = document.getElementById("appLayout");

const textarea = document.getElementById("noteText");

const fireBtn = document.getElementById("fireBtn");
const newCampaignBtn = document.getElementById("newCampaignBtn");
const settingsBtn = document.getElementById("settingsBtn");

/* =========================
   STATE
========================= */

let currentUser = null;
let currentCampaign = null;

/* =========================
   AUTH SYSTEM
========================= */

setupAuth(

  (user) => {

    currentUser = user;

    authSection.classList.add("hidden");
    appLayout.classList.remove("hidden");

    setUser(user);

    loadCampaigns((campaigns) => {
      renderCampaignList(campaigns, openCampaign);
    });

  },

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

function openCampaign(campaign) {

  currentCampaign = campaign.id;

  showCampaign(campaign.name);

  /* collaborative editor */

  openEditor(currentCampaign, textarea);

  /* presence system */

  setupPresence(currentUser, currentCampaign);

  watchPresence((users) => {
    updateTypingIndicator(users);
  });

  trackTyping(textarea);

}

/* =========================
   FIRE IDEA BUTTON
========================= */

fireBtn.onclick = () => {

  const text = textarea.value;

  const indicator = document.getElementById("typingIndicator");

  fireIdea(text, indicator);

};

/* =========================
   SETTINGS PANEL
========================= */

settingsBtn.onclick = () => {

  if (!currentCampaign) {
    alert("Open a campaign first.");
    return;
  }

  loadSettings(currentCampaign);

};

/* =========================
   AUTOSAVE SYSTEM
========================= */

let autosaveTimer;

textarea.addEventListener("input", () => {

  clearTimeout(autosaveTimer);

  autosaveTimer = setTimeout(() => {

    textarea.dispatchEvent(new Event("saveEditor"));

  }, 2000);

});

/* =========================
   AUTOSAVE EVENT
========================= */

textarea.addEventListener("saveEditor", () => {

  console.log("Autosaved session text");

});
