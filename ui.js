/* =========================
   CAMPAIGN LIST UI
========================= */

export function renderCampaignList(campaigns, openCampaign) {

  const list = document.getElementById("campaignList");

  if (!list) return;

  list.innerHTML = "";

  campaigns.forEach(c => {

    const div = document.createElement("div");

    div.innerHTML = `
      <strong>${c.name}</strong>
      <button class="btn">Open</button>
      <hr>
    `;

    div.querySelector("button").onclick = () => openCampaign(c);

    list.appendChild(div);

  });

}


/* =========================
   SHOW CAMPAIGN
========================= */

export function showCampaign(name) {

  const title = document.getElementById("campaignTitle");

  if (title) {
    title.textContent = name;
  }

}


/* =========================
   TYPING INDICATOR
========================= */

export function updateTypingIndicator(users) {

  const indicator = document.getElementById("typingIndicator");

  if (!indicator) return;

  indicator.innerHTML = users
    .filter(u => u.typing)
    .map(u => `${u.email} typing...`)
    .join("<br>");

}


/* =========================
   FIRE IDEA BUTTON
========================= */

export function fireIdea(text, indicator) {

  const ideas = [

    "A mysterious NPC interrupts the party.",
    "A hidden trap activates.",
    "A rival adventuring group appears.",
    "The dungeon begins collapsing.",
    "A cursed artifact activates.",
    "An ally betrays the party.",
    "A monster breaks through the wall."

  ];

  const idea = ideas[Math.floor(Math.random() * ideas.length)];

  indicator.innerText = "🔥 " + idea;

}
