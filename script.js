let campaigns = JSON.parse(localStorage.getItem("campaigns")) || [];
let currentCampaignIndex = null;
let editingNoteIndex = null;

/* ===== DATA MIGRATION ===== */
campaigns = campaigns.map(c => ({
  name: c.name || "Untitled",
  notes: c.notes || [],
  reviews: c.reviews || []
}));

saveData();

/* ===== SAVE ===== */
function saveData() {
  localStorage.setItem("campaigns", JSON.stringify(campaigns));
}

/* ===== HOME ===== */
function renderCampaigns() {
  const list = document.getElementById("campaignList");
  list.innerHTML = "";

  campaigns.forEach((c, i) => {
    list.innerHTML += `
      <strong>${c.name}</strong>
      <button onclick="openCampaign(${i})">Open</button>
      <button onclick="deleteCampaign(${i})">Delete</button>
      <hr>
    `;
  });
}

function createCampaign() {
  const name = prompt("Campaign name?");
  if (!name) return;

  campaigns.push({ name, notes: [], reviews: [] });
  saveData();
  renderCampaigns();
}

function deleteCampaign(i) {
  campaigns.splice(i, 1);
  saveData();
  renderCampaigns();
}

/* ===== OPEN ===== */
function openCampaign(i) {
  currentCampaignIndex = i;
  document.getElementById("home").classList.add("hidden");
  document.getElementById("campaignView").classList.remove("hidden");
  document.getElementById("campaignTitle").innerText = campaigns[i].name;
  renderNotes();
  renderReviews();
}

function goHome() {
  document.getElementById("campaignView").classList.add("hidden");
  document.getElementById("home").classList.remove("hidden");
}

/* ===== TABS ===== */
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* ===== NOTES ===== */
function renderNotes() {
  const campaign = campaigns[currentCampaignIndex];
  const div = document.getElementById("notes");

  div.innerHTML = `
    <input id="noteTitle" placeholder="Session Title">
    <textarea id="noteText" placeholder="Write session notes..."></textarea>
    <button onclick="saveNote()">Save</button>
    <button onclick="spiceSession()">🔥 Make Interesting</button>
    <div id="spiceBox"></div>
    <hr>
  `;

  campaign.notes.forEach((n, i) => {
    div.innerHTML += `
      <div class="note-card">
        <h3>${n.title}</h3>
        <p>${n.text}</p>
        <button onclick="editNote(${i})">Edit</button>
        <button onclick="deleteNote(${i})">Delete</button>
      </div>
    `;
  });
}

function saveNote() {
  const title = document.getElementById("noteTitle").value.trim();
  const text = document.getElementById("noteText").value.trim();
  if (!title || !text) return;

  campaigns[currentCampaignIndex].notes.push({ title, text });
  saveData();
  renderNotes();
}

function editNote(i) {
  const n = campaigns[currentCampaignIndex].notes[i];
  document.getElementById("noteTitle").value = n.title;
  document.getElementById("noteText").value = n.text;
  campaigns[currentCampaignIndex].notes.splice(i, 1);
  saveData();
  renderNotes();
}

function deleteNote(i) {
  campaigns[currentCampaignIndex].notes.splice(i, 1);
  saveData();
  renderNotes();
}

function spiceSession() {
  const campaign = campaigns[currentCampaignIndex];
  const box = document.getElementById("spiceBox");

  if (!campaign.notes.length) {
    box.innerText = "Write a session first.";
    return;
  }

  const text = campaign.notes[campaign.notes.length - 1].text.toLowerCase();

  if (text.includes("fight")) {
    box.innerText = "Add a third faction to interrupt the battle.";
  } else {
    box.innerText = "Raise the stakes with a ticking clock.";
  }
}

/* ===== REVIEWS ===== */
function addReview() {
  const text = document.getElementById("reviewInput").value.trim();
  if (!text) return;

  campaigns[currentCampaignIndex].reviews.push(text);
  saveData();
  renderReviews();
}

function renderReviews() {
  const div = document.getElementById("reviewList");
  div.innerHTML = "";

  campaigns[currentCampaignIndex].reviews.forEach(r => {
    div.innerHTML += `<div class="note-card">${r}</div>`;
  });
}

/* ===== BACKSTORY ===== */
function generateBackstoryPrompt() {
  const prompts = [
    "What trauma shaped your character?",
    "Who do they secretly hate?",
    "What is their greatest regret?"
  ];
  document.getElementById("backstoryPrompt").innerText =
    prompts[Math.floor(Math.random() * prompts.length)];
}

/* ===== SUMMARIZER ===== */
function summarizeFile() {
  const file = document.getElementById("fileInput").files[0];
  const output = document.getElementById("summaryOutput");

  if (!file) {
    output.innerText = "Upload a file.";
    return;
  }

  if (file.type === "application/pdf") {
    const reader = new FileReader();
    reader.onload = function(e) {
      const typedarray = new Uint8Array(e.target.result);

      pdfjsLib.getDocument(typedarray).promise.then(pdf => {
        pdf.getPage(1).then(page => {
          page.getTextContent().then(content => {
            const text = content.items.map(item => item.str).join(" ");
            output.innerText = simpleSummarize(text);
          });
        });
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = e => {
      output.innerText = simpleSummarize(e.target.result);
    };
    reader.readAsText(file);
  }
}

function simpleSummarize(text) {
  const sentences = text.split(".");
  return sentences.slice(0, 3).join(".") + ".";
}

/* ===== INIT ===== */
renderCampaigns();