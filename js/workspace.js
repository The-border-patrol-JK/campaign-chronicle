import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";
import { auth, db, ensureSignedIn, storage } from "./firebase.js";

const DEFAULT_PROFILE = { name: "Wandering Player", color: "#d97706" };
const MAP_MIN = 480;
const MAP_MAX = 3200;
const TOKEN_MIN = 36;
const TOKEN_MAX = 256;

const state = {
  user: null,
  authReady: false,
  authFailed: false,
  profile: loadProfile(),
  activeView: "campaign",
  activeTool: "move",
  currentCampaignId: null,
  currentCampaign: null,
  currentMapId: null,
  campaigns: [],
  maps: [],
  members: [],
  tokens: [],
  drawings: [],
  fogActions: [],
  sharedPages: [],
  privatePages: [],
  activeSharedPageId: null,
  activePrivatePageId: null,
  selected: null,
  zoom: 1,
  pan: { x: 56, y: 56 },
  dragging: null,
  panning: null,
  pendingStroke: null,
  pendingFog: null,
  pendingPatches: new Map(),
  patchTimer: null,
  pendingPresence: null,
  presenceTimer: null,
  unsubs: [],
  mapUnsubs: [],
  campaignListUnsub: null,
  summaryTimer: null,
  noteTimers: { shared: null, private: null }
};

const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheEls();
  bindUi();
  renderProfile();
  renderViews();
  renderCampaignList();
  renderMembers();
  renderMapList();
  renderNotes("shared");
  renderNotes("private");
  updateInspector();
  updateAuthControls();
  setStatus("Connecting to Firebase...");

  onAuthStateChanged(auth, async user => {
    if (!user) {
      state.user = null;
      state.authReady = false;
      updateAuthControls();
      return;
    }

    if (state.user?.uid === user.uid && state.authReady) {
      return;
    }

    state.user = user;
    state.authReady = true;
    state.authFailed = false;
    updateAuthControls();
    setStatus(`Connected as ${state.profile.name}`);
    watchCampaignList();

    if (state.currentCampaignId) {
      await ensureMembership(state.currentCampaignId);
    }
  });

  try {
    await ensureSignedIn();
  } catch (error) {
    console.error("Anonymous sign-in failed", error);
    state.authFailed = true;
    updateAuthControls();
    setStatus("Firebase sign-in failed. Enable Anonymous Auth in Firebase Authentication.");
  }
  window.setInterval(() => {
    renderMembers();
    renderOverview();
    renderCursors();
  }, 10000);
}

function cacheEls() {
  [
    "displayNameInput", "playerColorInput", "saveProfileBtn", "authStatus",
    "campaignNameInput", "createCampaignBtn", "joinCodeInput", "joinCampaignBtn",
    "campaignList", "memberList", "memberCount", "campaignTitle", "campaignMeta",
    "copyCodeBtn", "campaignView", "mapView", "sharedNotesView", "privateNotesView",
    "overviewName", "overviewCode", "overviewMapCount", "overviewPageCount",
    "overviewOnlineCount", "campaignOwnerLabel", "campaignSummaryInput",
    "mapUpload", "markerUpload", "uploadMapsBtn", "placePlayerMarkerBtn", "uploadMarkerBtn", "deleteSelectionBtn",
    "brushSizeInput", "drawColorInput", "zoomInput", "toggleFogBtn", "clearDrawingBtn",
    "clearFogBtn", "mapList", "mapCount", "activeMapName", "toolHint", "boardViewport",
    "boardStage", "mapBoard", "mapItemLayer", "tokenLayer", "cursorLayer", "drawCanvas",
    "fogCanvas", "selectionLabel", "inspectorEmpty", "inspectorForm", "selectedNameInput",
    "selectedSizeInput", "selectedXInput", "selectedYInput", "selectionMeta", "sizeLabel",
    "sharedPageList", "privatePageList", "addSharedPageBtn", "addPrivatePageBtn",
    "sharedTitleInput", "sharedBodyInput", "sharedSaveStatus", "privateTitleInput",
    "privateBodyInput", "privateSaveStatus"
  ].forEach(id => {
    els[id] = document.getElementById(id);
  });
}

function bindUi() {
  els.saveProfileBtn.addEventListener("click", saveProfile);
  els.createCampaignBtn.addEventListener("click", createCampaign);
  els.joinCampaignBtn.addEventListener("click", joinCampaign);
  els.campaignNameInput.addEventListener("keydown", onCampaignNameKeyDown);
  els.joinCodeInput.addEventListener("input", onJoinCodeInput);
  els.joinCodeInput.addEventListener("keydown", onJoinCodeKeyDown);
  els.copyCodeBtn.addEventListener("click", copyJoinCode);
  els.uploadMapsBtn.addEventListener("click", () => els.mapUpload.click());
  els.placePlayerMarkerBtn.addEventListener("click", placePlayerMarker);
  els.uploadMarkerBtn.addEventListener("click", () => els.markerUpload.click());
  els.mapUpload.addEventListener("change", () => uploadMaps([...els.mapUpload.files]));
  els.markerUpload.addEventListener("change", () => uploadMarker(els.markerUpload.files[0]));
  els.zoomInput.addEventListener("input", () => {
    state.zoom = clamp(Number(els.zoomInput.value) / 100, 0.4, 2.2);
    applyStageTransform();
  });
  els.toggleFogBtn.addEventListener("click", toggleFog);
  els.clearDrawingBtn.addEventListener("click", clearOverlayCollection.bind(null, "drawings"));
  els.clearFogBtn.addEventListener("click", clearOverlayCollection.bind(null, "fogActions"));
  els.deleteSelectionBtn.addEventListener("click", deleteSelection);
  els.campaignSummaryInput.addEventListener("input", scheduleSummarySave);
  els.addSharedPageBtn.addEventListener("click", () => createNotePage("shared"));
  els.addPrivatePageBtn.addEventListener("click", () => createNotePage("private"));
  els.sharedTitleInput.addEventListener("input", () => scheduleNoteSave("shared"));
  els.sharedBodyInput.addEventListener("input", () => scheduleNoteSave("shared"));
  els.privateTitleInput.addEventListener("input", () => scheduleNoteSave("private"));
  els.privateBodyInput.addEventListener("input", () => scheduleNoteSave("private"));
  els.selectedNameInput.addEventListener("input", syncInspectorSelection);
  els.selectedSizeInput.addEventListener("input", syncInspectorSelection);
  els.selectedXInput.addEventListener("change", syncInspectorSelection);
  els.selectedYInput.addEventListener("change", syncInspectorSelection);
  els.boardViewport.addEventListener("pointerdown", onBoardDown);
  els.boardViewport.addEventListener("pointermove", onBoardMove);
  els.boardViewport.addEventListener("pointerup", onBoardUp);
  els.boardViewport.addEventListener("pointerleave", onBoardUp);
  els.boardViewport.addEventListener("wheel", onBoardWheel, { passive: false });

  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelectorAll("[data-tool]").forEach(button => {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  });
}

function renderProfile() {
  els.displayNameInput.value = state.profile.name;
  els.playerColorInput.value = state.profile.color;
}

function setStatus(text) {
  els.authStatus.textContent = text;
}

function updateAuthControls() {
  const waitingForAuth = !state.authReady;
  els.createCampaignBtn.disabled = waitingForAuth;
  els.joinCampaignBtn.disabled = waitingForAuth;
  els.campaignNameInput.disabled = waitingForAuth;
  els.joinCodeInput.disabled = waitingForAuth;
}

function onCampaignNameKeyDown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  createCampaign().catch(console.error);
}

function onJoinCodeInput() {
  const normalized = normalizeCampaignCode(els.joinCodeInput.value);
  if (els.joinCodeInput.value !== normalized) {
    els.joinCodeInput.value = normalized;
  }
}

function onJoinCodeKeyDown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  joinCampaign().catch(console.error);
}

async function requireSignedIn() {
  if (state.user) {
    return state.user;
  }

  if (!state.authFailed) {
    setStatus("Finishing Firebase sign-in...");
  }

  try {
    const user = await ensureSignedIn();
    state.user = user;
    state.authReady = true;
    state.authFailed = false;
    updateAuthControls();
    return user;
  } catch (error) {
    console.error("Anonymous sign-in failed", error);
    state.authFailed = true;
    updateAuthControls();
    setStatus("Firebase sign-in failed. Enable Anonymous Auth in Firebase Authentication.");
    alert("Sign-in is not ready yet. Enable Anonymous Auth in Firebase Authentication, then refresh and try again.");
    return null;
  }
}

async function createCampaign() {
  if (!await requireSignedIn()) return;
  const name = els.campaignNameInput.value.trim();
  if (!name) {
    alert("Add a campaign name first.");
    return;
  }

  try {
    const code = await generateCode();
    const now = Date.now();
    await setDoc(doc(db, "campaigns", code), {
      name,
      code,
      ownerId: state.user.uid,
      summary: "",
      createdAt: now,
      updatedAt: now
    });

    await setDoc(doc(db, "users", state.user.uid, "campaigns", code), {
      code,
      name,
      role: "DM",
      updatedAt: now
    });

    await setDoc(doc(db, "campaigns", code, "members", state.user.uid), {
      name: state.profile.name,
      color: state.profile.color,
      role: "DM",
      heartbeatAt: now,
      joinedAt: now,
      currentMapId: null,
      activeView: state.activeView
    });

    await setDoc(doc(db, "campaigns", code, "sharedPages", "session-log"), {
      title: "Session Log",
      content: "",
      createdAt: now,
      updatedAt: now,
      createdBy: state.user.uid
    });

    els.campaignNameInput.value = "";
    await openCampaign(code);
    setStatus(`Campaign created with join code ${code}`);
    alert(`Campaign created. Share join code ${code} with your players.`);
  } catch (error) {
    console.error("Failed to create campaign", error);
    setStatus("Campaign creation failed. Check Firebase Authentication and Firestore rules.");
    alert("Campaign creation failed. Refresh the page and try again.");
  }
}

async function joinCampaign() {
  if (!await requireSignedIn()) return;
  const code = normalizeCampaignCode(els.joinCodeInput.value);
  els.joinCodeInput.value = code;
  if (!code) {
    alert("Enter a join code first.");
    return;
  }

  if (code.length !== 6) {
    alert("Join codes are 6 characters. Double-check the code and try again.");
    return;
  }

  try {
    const snap = await getDoc(doc(db, "campaigns", code));
    if (!snap.exists()) {
      alert(`No campaign was found for code ${code}.`);
      return;
    }

    const campaign = snap.data();
    const now = Date.now();
    const batch = writeBatch(db);
    batch.set(doc(db, "users", state.user.uid, "campaigns", code), {
      code,
      name: campaign.name,
      role: campaign.ownerId === state.user.uid ? "DM" : "Player",
      updatedAt: now
    }, { merge: true });
    batch.set(doc(db, "campaigns", code, "members", state.user.uid), {
      name: state.profile.name,
      color: state.profile.color,
      role: campaign.ownerId === state.user.uid ? "DM" : "Player",
      heartbeatAt: now,
      joinedAt: now,
      currentMapId: null,
      activeView: state.activeView
    }, { merge: true });
    await batch.commit();
    els.joinCodeInput.value = "";
    await openCampaign(code);
    setStatus(`Joined ${campaign.name} with code ${code}`);
  } catch (error) {
    console.error("Failed to join campaign", error);
    setStatus("Join failed. Check Firebase Authentication and Firestore rules.");
    alert("Couldn't join that campaign right now. Refresh and try again.");
  }
}

function watchCampaignList() {
  state.campaignListUnsub?.();
  state.campaignListUnsub = onSnapshot(
    query(collection(db, "users", state.user.uid, "campaigns"), orderBy("updatedAt", "desc")),
    snapshot => {
      state.campaigns = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      renderCampaignList();
      if (!state.currentCampaignId && state.campaigns.length) {
        openCampaign(state.campaigns[0].id);
      }
    }
  );
}

async function openCampaign(campaignId) {
  cleanupCampaignSubs();
  cleanupMapSubs();
  state.currentCampaignId = campaignId;
  state.currentCampaign = null;
  state.currentMapId = null;
  state.maps = [];
  state.tokens = [];
  state.drawings = [];
  state.fogActions = [];
  state.sharedPages = [];
  state.privatePages = [];
  state.selected = null;
  renderBoard();
  updateInspector();

  state.unsubs.push(onSnapshot(doc(db, "campaigns", campaignId), snapshot => {
    if (!snapshot.exists()) return;
    state.currentCampaign = { id: snapshot.id, ...snapshot.data() };
    els.campaignTitle.textContent = state.currentCampaign.name;
    els.campaignMeta.textContent = `Join code ${state.currentCampaign.code} • autosaved with Firebase`;
    if (document.activeElement !== els.campaignSummaryInput) {
      els.campaignSummaryInput.value = state.currentCampaign.summary || "";
    }
    renderOverview();
    renderCampaignList();
  }));

  state.unsubs.push(onSnapshot(
    query(collection(db, "campaigns", campaignId, "maps"), orderBy("createdAt", "asc")),
    snapshot => {
      state.maps = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      if (!state.currentMapId || !state.maps.some(map => map.id === state.currentMapId)) {
        state.currentMapId = state.maps[0]?.id || null;
        resetBoardView();
        watchCurrentMap();
      }
      renderMapList();
      renderBoard();
      renderOverview();
    }
  ));

  state.unsubs.push(onSnapshot(collection(db, "campaigns", campaignId, "members"), snapshot => {
    state.members = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderMembers();
    renderOverview();
    renderCursors();
  }));

  state.unsubs.push(onSnapshot(
    query(collection(db, "campaigns", campaignId, "tokens"), orderBy("createdAt", "asc")),
    snapshot => {
      state.tokens = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      renderBoard();
      updateInspector();
    }
  ));

  state.unsubs.push(onSnapshot(
    query(collection(db, "campaigns", campaignId, "sharedPages"), orderBy("createdAt", "asc")),
    snapshot => {
      state.sharedPages = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      if (!state.activeSharedPageId || !state.sharedPages.some(page => page.id === state.activeSharedPageId)) {
        state.activeSharedPageId = state.sharedPages[0]?.id || null;
      }
      renderNotes("shared");
      renderOverview();
    }
  ));

  state.unsubs.push(onSnapshot(
    query(collection(db, "users", state.user.uid, "campaignNotes", campaignId, "pages"), orderBy("createdAt", "asc")),
    snapshot => {
      state.privatePages = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      if (!state.activePrivatePageId || !state.privatePages.some(page => page.id === state.activePrivatePageId)) {
        state.activePrivatePageId = state.privatePages[0]?.id || null;
      }
      renderNotes("private");
    }
  ));

  await ensureMembership(campaignId);
}

async function ensureMembership(campaignId) {
  const snap = await getDoc(doc(db, "campaigns", campaignId));
  if (!snap.exists()) return;
  const campaign = snap.data();
  await setDoc(doc(db, "users", state.user.uid, "campaigns", campaignId), {
    code: campaign.code,
    name: campaign.name,
    role: campaign.ownerId === state.user.uid ? "DM" : "Player",
    updatedAt: Date.now()
  }, { merge: true });
  await syncPresence({ heartbeat: true });
}

function watchCurrentMap() {
  cleanupMapSubs();
  if (!state.currentCampaignId || !state.currentMapId) {
    renderBoard();
    return;
  }

  const path = ["campaigns", state.currentCampaignId, "maps", state.currentMapId];
  state.mapUnsubs.push(onSnapshot(query(collection(db, ...path, "drawings"), orderBy("createdAt", "asc")), snapshot => {
    state.drawings = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderOverlays();
  }));
  state.mapUnsubs.push(onSnapshot(query(collection(db, ...path, "fogActions"), orderBy("createdAt", "asc")), snapshot => {
    state.fogActions = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderOverlays();
  }));
  syncPresence({ heartbeat: true }).catch(console.error);
}

function renderCampaignList() {
  if (!state.campaigns.length) {
    els.campaignList.innerHTML = `<div class="empty-state">Create a campaign or join one with a code.</div>`;
    return;
  }

  els.campaignList.innerHTML = state.campaigns.map(campaign => `
    <button class="list-item ${campaign.id === state.currentCampaignId ? "is-active" : ""}" data-campaign-id="${campaign.id}">
      <span class="list-item-title">${escapeHtml(campaign.name || campaign.id)}</span>
      <span class="list-item-meta">${escapeHtml(campaign.code || campaign.id)} • ${escapeHtml(campaign.role || "Player")}</span>
    </button>
  `).join("");

  els.campaignList.querySelectorAll("[data-campaign-id]").forEach(button => {
    button.addEventListener("click", () => openCampaign(button.dataset.campaignId));
  });
}

function renderMembers() {
  const members = [...state.members].sort((a, b) => (b.heartbeatAt || 0) - (a.heartbeatAt || 0));
  els.memberCount.textContent = String(members.length);
  els.memberList.innerHTML = members.length ? members.map(member => `
    <div class="member-card">
      <div class="member-swatch" style="background:${escapeHtml(member.color || DEFAULT_PROFILE.color)}"></div>
      <div class="member-copy">
        <strong>${escapeHtml(member.name || "Unknown player")}</strong>
        <span class="muted">${escapeHtml(member.role || "Player")} • ${isOnline(member) ? "Online" : "Away"}</span>
      </div>
    </div>
  `).join("") : `<div class="empty-state">Player presence will show up here after someone joins.</div>`;
}

function renderOverview() {
  const campaign = state.currentCampaign;
  els.overviewName.textContent = campaign?.name || "No campaign selected";
  els.overviewCode.textContent = campaign?.code || "-";
  els.overviewMapCount.textContent = String(state.maps.length);
  els.overviewPageCount.textContent = String(state.sharedPages.length);
  els.overviewOnlineCount.textContent = String(state.members.filter(isOnline).length);
  els.campaignOwnerLabel.textContent = `Owner: ${ownerName(campaign?.ownerId)}`;
}

function renderViews() {
  const views = {
    campaign: els.campaignView,
    map: els.mapView,
    "shared-notes": els.sharedNotesView,
    "private-notes": els.privateNotesView
  };
  Object.entries(views).forEach(([name, node]) => node.classList.toggle("is-active", state.activeView === name));
  document.querySelectorAll("[data-view]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.view === state.activeView);
  });
}

function renderMapList() {
  els.mapCount.textContent = String(state.maps.length);
  const map = getActiveMap();
  els.activeMapName.textContent = map ? `${map.name} (active map)` : "Upload a map to begin";
  els.toggleFogBtn.textContent = `Fog: ${map?.fogEnabled ? "On" : "Off"}`;
  els.mapList.innerHTML = state.maps.length ? state.maps.map(mapItem => `
    <button class="list-item ${mapItem.id === state.currentMapId ? "is-active" : ""}" data-map-id="${mapItem.id}">
      <span class="list-item-title">${escapeHtml(mapItem.name || "Unnamed map")}</span>
      <span class="list-item-meta">${Math.round(mapItem.width || 0)}px wide • ${mapItem.fogEnabled ? "Fog on" : "Fog off"}</span>
    </button>
  `).join("") : `<div class="empty-state">Upload one or many maps. They stay on the board together so you can stitch them into one scene.</div>`;

  els.mapList.querySelectorAll("[data-map-id]").forEach(button => {
    button.addEventListener("click", () => {
      state.currentMapId = button.dataset.mapId;
      state.selected = null;
      resetBoardView();
      watchCurrentMap();
      renderMapList();
      renderBoard();
      updateInspector();
    });
  });
}

function renderBoard() {
  const size = boardSize();
  els.mapBoard.style.width = `${size.width}px`;
  els.mapBoard.style.height = `${size.height}px`;
  resizeCanvas(els.drawCanvas, size);
  resizeCanvas(els.fogCanvas, size);

  els.mapItemLayer.innerHTML = state.maps.map(map => `
    <div class="scene-item map-item ${isSelected("map", map.id) ? "is-selected" : ""} ${map.id === state.currentMapId ? "is-active-map" : ""}" data-kind="map" data-id="${map.id}" style="left:${map.x}px;top:${map.y}px;width:${map.width}px;height:${map.height}px;">
      <img src="${escapeHtml(map.imageUrl)}" alt="${escapeHtml(map.name)}">
      <div class="scene-tag">${escapeHtml(map.id === state.currentMapId ? `${map.name} - active` : map.name)}</div>
    </div>
  `).join("");

  els.tokenLayer.innerHTML = state.tokens.map(token => `
    <div class="scene-item token-item ${isSelected("token", token.id) ? "is-selected" : ""}" data-kind="token" data-id="${token.id}" style="left:${token.x}px;top:${token.y}px;width:${token.size}px;height:${token.size}px;">
      ${renderTokenVisual(token)}
      <div class="scene-tag">${escapeHtml(token.name)}</div>
    </div>
  `).join("");

  renderCursors();
  renderOverlays();
  applyStageTransform();
}

function renderCursors() {
  if (!state.currentMapId) {
    els.cursorLayer.innerHTML = "";
    return;
  }

  els.cursorLayer.innerHTML = state.members.filter(member => {
    return member.id !== state.user?.uid && member.currentMapId === state.currentMapId && member.cursor && isOnline(member);
  }).map(member => `
    <div class="cursor-dot" style="left:${member.cursor.x}px;top:${member.cursor.y}px;background:${escapeHtml(member.color || DEFAULT_PROFILE.color)}"></div>
    <div class="cursor-label" style="left:${member.cursor.x}px;top:${member.cursor.y}px;">${escapeHtml(member.name || "Player")}</div>
  `).join("");
}

function renderOverlays() {
  const drawCtx = els.drawCanvas.getContext("2d");
  drawCtx.clearRect(0, 0, els.drawCanvas.width, els.drawCanvas.height);
  [...state.drawings, ...(state.pendingStroke ? [state.pendingStroke] : [])].forEach(stroke => drawPath(drawCtx, stroke, stroke.color || "#f97316"));

  const fogCtx = els.fogCanvas.getContext("2d");
  fogCtx.clearRect(0, 0, els.fogCanvas.width, els.fogCanvas.height);
  if (!getActiveMap()?.fogEnabled) return;
  fogCtx.fillStyle = "rgba(8, 10, 14, 0.86)";
  fogCtx.fillRect(0, 0, els.fogCanvas.width, els.fogCanvas.height);
  [...state.fogActions, ...(state.pendingFog ? [state.pendingFog] : [])].forEach(action => drawFogAction(fogCtx, action));
}

function renderNotes(kind) {
  const pages = kind === "shared" ? state.sharedPages : state.privatePages;
  const currentId = kind === "shared" ? state.activeSharedPageId : state.activePrivatePageId;
  const safeId = pages.some(page => page.id === currentId) ? currentId : pages[0]?.id || null;
  if (kind === "shared") state.activeSharedPageId = safeId;
  else state.activePrivatePageId = safeId;

  const list = kind === "shared" ? els.sharedPageList : els.privatePageList;
  const title = kind === "shared" ? els.sharedTitleInput : els.privateTitleInput;
  const body = kind === "shared" ? els.sharedBodyInput : els.privateBodyInput;

  if (!pages.length) {
    list.innerHTML = `<div class="empty-state">Create the first ${kind === "shared" ? "shared" : "private"} page.</div>`;
    title.value = "";
    body.value = "";
    return;
  }

  list.innerHTML = pages.map(page => `
    <button class="list-item ${page.id === safeId ? "is-active" : ""}" data-page-kind="${kind}" data-page-id="${page.id}">
      <span class="list-item-title">${escapeHtml(page.title || "Untitled page")}</span>
      <span class="list-item-meta">Autosaved notes page</span>
    </button>
  `).join("");

  list.querySelectorAll("[data-page-id]").forEach(button => {
    button.addEventListener("click", () => {
      if (kind === "shared") state.activeSharedPageId = button.dataset.pageId;
      else state.activePrivatePageId = button.dataset.pageId;
      renderNotes(kind);
    });
  });

  const page = pages.find(entry => entry.id === safeId);
  if (document.activeElement !== title) title.value = page?.title || "";
  if (document.activeElement !== body) body.value = page?.content || "";
}

function updateInspector() {
  const entity = selectedEntity();
  if (!entity) {
    els.selectionLabel.textContent = "Nothing selected";
    els.inspectorEmpty.classList.remove("hidden");
    els.inspectorForm.classList.add("hidden");
    return;
  }

  const isMap = state.selected.kind === "map";
  els.selectionLabel.textContent = isMap ? "Map selected" : "Marker selected";
  els.inspectorEmpty.classList.add("hidden");
  els.inspectorForm.classList.remove("hidden");
  els.selectedNameInput.value = entity.name || "";
  els.selectedXInput.value = String(Math.round(entity.x || 0));
  els.selectedYInput.value = String(Math.round(entity.y || 0));
  els.sizeLabel.textContent = isMap ? "Map width" : "Marker size";
  els.selectedSizeInput.min = String(isMap ? MAP_MIN : TOKEN_MIN);
  els.selectedSizeInput.max = String(isMap ? MAP_MAX : TOKEN_MAX);
  els.selectedSizeInput.value = String(Math.round(isMap ? entity.width : entity.size));
  els.selectionMeta.textContent = isMap
    ? `Height follows the original ratio. Current height: ${Math.round(entity.height)}px`
    : `Marker size: ${Math.round(entity.size)}px`;
}

function syncInspectorSelection() {
  const entity = selectedEntity();
  if (!entity) return;

  if (state.selected.kind === "map") {
    const width = clamp(Number(els.selectedSizeInput.value), MAP_MIN, MAP_MAX);
    const aspectRatio = entity.aspectRatio || 1;
    patchEntity("map", entity.id, {
      name: sanitizeLabel(els.selectedNameInput.value) || entity.name,
      x: Number(els.selectedXInput.value) || 0,
      y: Number(els.selectedYInput.value) || 0,
      width,
      height: Math.round(width / aspectRatio)
    });
    return;
  }

  patchEntity("token", entity.id, {
    name: sanitizeLabel(els.selectedNameInput.value) || entity.name,
    x: Number(els.selectedXInput.value) || 0,
    y: Number(els.selectedYInput.value) || 0,
    size: clamp(Number(els.selectedSizeInput.value), TOKEN_MIN, TOKEN_MAX)
  });
}

function onBoardWheel(event) {
  event.preventDefault();
  state.zoom = clamp(state.zoom + (event.deltaY > 0 ? -0.1 : 0.1), 0.4, 2.2);
  els.zoomInput.value = String(Math.round(state.zoom * 100));
  applyStageTransform();
}

function onBoardDown(event) {
  if (!state.currentCampaignId || !state.currentMapId) return;
  const item = event.target.closest(".scene-item");
  const point = boardPoint(event.clientX, event.clientY);

  if (state.activeTool === "pan") {
    event.preventDefault();
    els.boardViewport.setPointerCapture?.(event.pointerId);
    state.panning = {
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startPan: { ...state.pan }
    };
    return;
  }

  if (item && state.activeTool === "move") {
    event.preventDefault();
    els.boardViewport.setPointerCapture?.(event.pointerId);
    selectItem(item.dataset.kind, item.dataset.id);
    const entity = selectedEntity();
    state.dragging = {
      pointerId: event.pointerId,
      kind: item.dataset.kind,
      id: item.dataset.id,
      startPoint: point,
      startPosition: { x: entity.x, y: entity.y }
    };
    return;
  }

  if (state.activeTool === "draw") {
    event.preventDefault();
    els.boardViewport.setPointerCapture?.(event.pointerId);
    state.pendingStroke = {
      color: els.drawColorInput.value,
      size: Number(els.brushSizeInput.value),
      points: [point]
    };
    renderOverlays();
    return;
  }

  if (state.activeTool === "fog-cover" || state.activeTool === "fog-reveal") {
    if (!getActiveMap()?.fogEnabled) {
      alert("Turn fog on first.");
      return;
    }

    event.preventDefault();
    els.boardViewport.setPointerCapture?.(event.pointerId);
    state.pendingFog = {
      mode: state.activeTool === "fog-reveal" ? "reveal" : "cover",
      size: Number(els.brushSizeInput.value),
      points: [point]
    };
    renderOverlays();
    return;
  }

  if (item) {
    selectItem(item.dataset.kind, item.dataset.id);
  } else {
    state.selected = null;
    renderBoard();
    updateInspector();
  }
}

function onBoardMove(event) {
  if (!state.currentCampaignId || !state.currentMapId) return;
  const point = boardPoint(event.clientX, event.clientY);
  syncPresence({ cursor: point }).catch(console.error);

  if (state.panning && state.panning.pointerId === event.pointerId) {
    state.pan = {
      x: state.panning.startPan.x + (event.clientX - state.panning.startClient.x),
      y: state.panning.startPan.y + (event.clientY - state.panning.startClient.y)
    };
    applyStageTransform();
    return;
  }

  if (state.dragging && state.dragging.pointerId === event.pointerId) {
    patchEntity(state.dragging.kind, state.dragging.id, {
      x: Math.round(state.dragging.startPosition.x + (point.x - state.dragging.startPoint.x)),
      y: Math.round(state.dragging.startPosition.y + (point.y - state.dragging.startPoint.y))
    });
    return;
  }

  if (state.pendingStroke) {
    state.pendingStroke.points.push(point);
    renderOverlays();
    return;
  }

  if (state.pendingFog) {
    state.pendingFog.points.push(point);
    renderOverlays();
  }
}

function onBoardUp(event) {
  if (state.panning && state.panning.pointerId === event.pointerId) {
    state.panning = null;
  }

  if (state.dragging && state.dragging.pointerId === event.pointerId) {
    flushPendingPatches().catch(console.error);
    state.dragging = null;
    return;
  }

  if (state.pendingStroke) {
    addOverlayDoc("drawings", {
      ...state.pendingStroke,
      points: compactPoints(state.pendingStroke.points),
      createdAt: Date.now(),
      createdBy: state.user.uid
    }).catch(console.error);
    state.pendingStroke = null;
    renderOverlays();
    return;
  }

  if (state.pendingFog) {
    addOverlayDoc("fogActions", {
      ...state.pendingFog,
      points: compactPoints(state.pendingFog.points),
      createdAt: Date.now(),
      createdBy: state.user.uid
    }).catch(console.error);
    state.pendingFog = null;
    renderOverlays();
  }

  if (els.boardViewport.hasPointerCapture?.(event.pointerId)) {
    els.boardViewport.releasePointerCapture(event.pointerId);
  }
}

function setView(view) {
  state.activeView = view;
  renderViews();
  syncPresence({}).catch(console.error);
}

function setTool(tool) {
  state.activeTool = tool;
  document.querySelectorAll("[data-tool]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.tool === tool);
  });

  const hints = {
    move: "Drag maps and markers around the board. Uploaded maps stay on the same scene so you can stitch them together.",
    pan: "Drag the viewport to move across larger maps.",
    draw: "Sketch directly on the active map.",
    "fog-cover": "Paint fog back over unexplored areas.",
    "fog-reveal": "Reveal the map for players."
  };

  els.toolHint.textContent = hints[tool];
}

function selectItem(kind, id) {
  if (kind === "map" && state.currentMapId !== id) {
    state.currentMapId = id;
    watchCurrentMap();
    renderMapList();
  }
  state.selected = { kind, id };
  renderBoard();
  updateInspector();
}

function selectedEntity() {
  if (!state.selected) return null;
  if (state.selected.kind === "map") {
    return state.maps.find(map => map.id === state.selected.id) || null;
  }
  return state.tokens.find(token => token.id === state.selected.id) || null;
}

function isSelected(kind, id) {
  return state.selected?.kind === kind && state.selected?.id === id;
}

function patchEntity(kind, id, patch) {
  const entity = kind === "map"
    ? state.maps.find(entry => entry.id === id)
    : state.tokens.find(entry => entry.id === id);

  if (!entity) return;
  Object.assign(entity, patch, { updatedAt: Date.now() });

  const key = `${kind}:${id}`;
  const pending = state.pendingPatches.get(key) || {
    kind,
    id,
    mapId: state.currentMapId,
    patch: {}
  };
  pending.patch = { ...pending.patch, ...patch, updatedAt: Date.now() };
  state.pendingPatches.set(key, pending);

  if (!state.patchTimer) {
    state.patchTimer = window.setTimeout(() => flushPendingPatches().catch(console.error), 90);
  }

  renderBoard();
  updateInspector();
}

async function flushPendingPatches() {
  if (!state.pendingPatches.size) return;
  const items = [...state.pendingPatches.values()];
  state.pendingPatches.clear();
  window.clearTimeout(state.patchTimer);
  state.patchTimer = null;
  await Promise.all(items.map(item => {
    if (item.kind === "map") {
      return updateDoc(doc(db, "campaigns", state.currentCampaignId, "maps", item.id), item.patch);
    }
    return updateDoc(doc(db, "campaigns", state.currentCampaignId, "tokens", item.id), item.patch);
  }));
}

function applyStageTransform() {
  els.boardStage.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
}

function resetBoardView() {
  state.zoom = 1;
  state.pan = { x: 56, y: 56 };
  els.zoomInput.value = "100";
  applyStageTransform();
}

function boardPoint(clientX, clientY) {
  const rect = els.boardViewport.getBoundingClientRect();
  return {
    x: Math.round((clientX - rect.left - state.pan.x) / state.zoom),
    y: Math.round((clientY - rect.top - state.pan.y) / state.zoom)
  };
}

function boardSize() {
  let width = 2200;
  let height = 1400;
  state.maps.forEach(map => {
    width = Math.max(width, map.x + map.width + 240);
    height = Math.max(height, map.y + map.height + 240);
  });
  state.tokens.forEach(token => {
    width = Math.max(width, token.x + token.size + 180);
    height = Math.max(height, token.y + token.size + 180);
  });
  return { width, height };
}

function nextMapPlacement() {
  if (!state.maps.length) {
    return { x: 120, y: 120 };
  }

  return {
    x: Math.max(...state.maps.map(map => (map.x || 0) + (map.width || 0))) + 80,
    y: Math.max(120, Math.min(...state.maps.map(map => map.y || 120)))
  };
}

function resizeCanvas(canvas, size) {
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
}

function drawPath(ctx, stroke, color) {
  const points = stroke.points || [];
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.lineWidth = stroke.size || 16;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
  ctx.stroke();
}

function drawFogAction(ctx, action) {
  const points = action.points || [];
  if (!points.length) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = action.size || 42;
  if (action.mode === "reveal") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(8, 10, 14, 0.92)";
    ctx.fillStyle = "rgba(8, 10, 14, 0.92)";
  }
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, (action.size || 42) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
  ctx.stroke();
  ctx.restore();
}

function renderTokenVisual(token) {
  if (token.imageUrl) {
    return `<img src="${escapeHtml(token.imageUrl)}" alt="${escapeHtml(token.name)}">`;
  }

  return `
    <div class="token-fallback" style="background:${escapeHtml(token.color || DEFAULT_PROFILE.color)}">
      ${escapeHtml(token.label || "P")}
    </div>
  `;
}

function findOwnedToken() {
  if (!state.user) return null;
  return state.tokens.find(token => token.ownerId === state.user.uid) || null;
}

function profileMarkerLabel() {
  const words = sanitizeName(state.profile.name).split(" ").filter(Boolean);
  const initials = words.slice(0, 2).map(word => word[0]).join("");
  return (initials || "P").toUpperCase();
}

function markerSpawnPoint() {
  const map = getActiveMap();
  if (map) {
    return {
      x: Math.round(map.x + Math.min(map.width * 0.18, 180)),
      y: Math.round(map.y + Math.min(map.height * 0.18, 180))
    };
  }

  return { x: 260, y: 260 };
}

async function uploadMaps(files) {
  if (!state.currentCampaignId) {
    alert("Open a campaign before uploading maps.");
    return;
  }

  const now = Date.now();
  const start = nextMapPlacement();
  let nextX = start.x;
  for (const [index, file] of files.entries()) {
    const meta = await readImageMeta(file);
    const storagePath = `campaigns/${state.currentCampaignId}/maps/${now + index}-${safeFileName(file.name)}`;
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file);
    const imageUrl = await getDownloadURL(fileRef);
    const width = clamp(meta.width, 800, 1800);
    const aspectRatio = meta.width / meta.height;
    await addDoc(collection(db, "campaigns", state.currentCampaignId, "maps"), {
      name: fileBaseName(file.name),
      imageUrl,
      storagePath,
      x: nextX,
      y: start.y + ((index % 2) * 36),
      width,
      height: Math.round(width / aspectRatio),
      aspectRatio,
      fogEnabled: false,
      createdAt: now + index,
      updatedAt: now + index
    });
    nextX += width + 80;
  }

  els.mapUpload.value = "";
  setView("map");
}

async function placePlayerMarker() {
  if (!state.currentCampaignId || !state.user) {
    alert("Open a campaign first.");
    return;
  }

  const existing = findOwnedToken();
  if (existing) {
    selectItem("token", existing.id);
    setView("map");
    setStatus(`Selected your marker for ${state.profile.name}`);
    return;
  }

  const now = Date.now();
  const spawn = markerSpawnPoint();
  const tokenRef = await addDoc(collection(db, "campaigns", state.currentCampaignId, "tokens"), {
    name: sanitizeLabel(state.profile.name) || DEFAULT_PROFILE.name,
    ownerId: state.user.uid,
    label: profileMarkerLabel(),
    color: state.profile.color,
    x: spawn.x,
    y: spawn.y,
    size: 84,
    createdAt: now,
    updatedAt: now
  });

  setView("map");
  selectItem("token", tokenRef.id);
  setStatus("Placed your player marker on the board");
}

async function uploadMarker(file) {
  if (!state.currentCampaignId || !state.user || !file) {
    if (!state.currentCampaignId) {
      alert("Open a campaign first.");
    }
    return;
  }

  const now = Date.now();
  const existing = findOwnedToken();
  const spawn = markerSpawnPoint();
  const storagePath = `campaigns/${state.currentCampaignId}/tokens/${state.user.uid}/${now}-${safeFileName(file.name)}`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file);
  const imageUrl = await getDownloadURL(fileRef);
  const payload = {
    name: sanitizeLabel(state.profile.name) || fileBaseName(file.name),
    imageUrl,
    storagePath,
    label: profileMarkerLabel(),
    color: state.profile.color,
    ownerId: state.user.uid,
    x: existing?.x ?? spawn.x,
    y: existing?.y ?? spawn.y,
    size: existing?.size ?? 84,
    updatedAt: now
  };

  if (existing) {
    await updateDoc(doc(db, "campaigns", state.currentCampaignId, "tokens", existing.id), payload);
    selectItem("token", existing.id);
  } else {
    const tokenRef = await addDoc(collection(db, "campaigns", state.currentCampaignId, "tokens"), {
      ...payload,
      createdAt: now
    });
    selectItem("token", tokenRef.id);
  }

  els.markerUpload.value = "";
  setView("map");
  setStatus("Updated your player marker");
}

async function toggleFog() {
  const map = getActiveMap();
  if (!map) return;
  await updateDoc(doc(db, "campaigns", state.currentCampaignId, "maps", map.id), {
    fogEnabled: !map.fogEnabled,
    updatedAt: Date.now()
  });
}

async function clearOverlayCollection(kind) {
  if (!state.currentCampaignId || !state.currentMapId) return;
  const docs = kind === "drawings" ? state.drawings : state.fogActions;
  if (!docs.length) return;
  const label = kind === "drawings" ? "drawing" : "fog changes";
  if (!confirm(`Clear all ${label} from this map?`)) return;
  await Promise.all(docs.map(entry => {
    return deleteDoc(doc(db, "campaigns", state.currentCampaignId, "maps", state.currentMapId, kind, entry.id));
  }));
}

async function deleteSelection() {
  if (!state.selected || !state.currentCampaignId) return;
  if (!confirm("Delete the selected item?")) return;

  if (state.selected.kind === "map") {
    const map = selectedEntity();
    if (!map) return;
    await deleteDoc(doc(db, "campaigns", state.currentCampaignId, "maps", map.id));
  } else {
    const token = selectedEntity();
    if (!token) return;
    await deleteDoc(doc(db, "campaigns", state.currentCampaignId, "tokens", token.id));
  }

  state.selected = null;
  updateInspector();
}

async function createNotePage(kind) {
  if (!state.currentCampaignId) {
    alert("Open a campaign first.");
    return;
  }

  const title = prompt("Page title?", kind === "shared" ? "New shared page" : "New private page");
  if (title === null) return;

  const payload = {
    title: sanitizeLabel(title) || "Untitled page",
    content: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: state.user.uid
  };

  if (kind === "shared") {
    const pageRef = await addDoc(collection(db, "campaigns", state.currentCampaignId, "sharedPages"), payload);
    state.activeSharedPageId = pageRef.id;
    setView("shared-notes");
    return;
  }

  const pageRef = await addDoc(collection(db, "users", state.user.uid, "campaignNotes", state.currentCampaignId, "pages"), payload);
  state.activePrivatePageId = pageRef.id;
  setView("private-notes");
}

function scheduleSummarySave() {
  window.clearTimeout(state.summaryTimer);
  state.summaryTimer = window.setTimeout(async () => {
    if (!state.currentCampaignId) return;
    await updateDoc(doc(db, "campaigns", state.currentCampaignId), {
      summary: els.campaignSummaryInput.value,
      updatedAt: Date.now()
    });
  }, 450);
}

function scheduleNoteSave(kind) {
  const status = kind === "shared" ? els.sharedSaveStatus : els.privateSaveStatus;
  const pageId = kind === "shared" ? state.activeSharedPageId : state.activePrivatePageId;
  if (!pageId || !state.currentCampaignId) return;
  status.textContent = "Saving...";
  window.clearTimeout(state.noteTimers[kind]);
  state.noteTimers[kind] = window.setTimeout(async () => {
    const payload = {
      title: (kind === "shared" ? els.sharedTitleInput.value : els.privateTitleInput.value).trim() || "Untitled page",
      content: kind === "shared" ? els.sharedBodyInput.value : els.privateBodyInput.value,
      updatedAt: Date.now()
    };

    if (kind === "shared") {
      await updateDoc(doc(db, "campaigns", state.currentCampaignId, "sharedPages", pageId), payload);
      status.textContent = "Shared page saved.";
      return;
    }

    await updateDoc(doc(db, "users", state.user.uid, "campaignNotes", state.currentCampaignId, "pages", pageId), payload);
    status.textContent = "Private page saved.";
  }, 400);
}

async function copyJoinCode() {
  if (!state.currentCampaign?.code) return;
  try {
    await navigator.clipboard.writeText(state.currentCampaign.code);
    setStatus(`Copied join code ${state.currentCampaign.code}`);
  } catch {
    alert(`Copy failed. Join code: ${state.currentCampaign.code}`);
  }
}

async function syncPresence({ cursor = null, heartbeat = false } = {}) {
  if (!state.currentCampaignId || !state.user) return;
  state.pendingPresence = {
    name: state.profile.name,
    color: state.profile.color,
    role: state.currentCampaign?.ownerId === state.user.uid ? "DM" : "Player",
    activeView: state.activeView,
    currentMapId: state.currentMapId || null
  };
  if (cursor) state.pendingPresence.cursor = cursor;
  if (cursor || heartbeat) state.pendingPresence.heartbeatAt = Date.now();

  if (state.presenceTimer && !heartbeat && !cursor) {
    return;
  }

  window.clearTimeout(state.presenceTimer);
  state.presenceTimer = window.setTimeout(async () => {
    if (!state.pendingPresence) return;
    const payload = state.pendingPresence;
    state.pendingPresence = null;
    state.presenceTimer = null;
    await setDoc(doc(db, "campaigns", state.currentCampaignId, "members", state.user.uid), payload, { merge: true });
  }, heartbeat ? 0 : 90);
}

async function addOverlayDoc(kind, payload) {
  if (!state.currentCampaignId || !state.currentMapId) return;
  await addDoc(collection(db, "campaigns", state.currentCampaignId, "maps", state.currentMapId, kind), payload);
}

function saveProfile() {
  state.profile = {
    name: sanitizeName(els.displayNameInput.value) || DEFAULT_PROFILE.name,
    color: els.playerColorInput.value || DEFAULT_PROFILE.color
  };
  localStorage.setItem("campaign-chronicle-profile", JSON.stringify(state.profile));
  renderProfile();
  setStatus(`Saved profile for ${state.profile.name}`);
  syncPresence({ heartbeat: true }).catch(console.error);
}

function getActiveMap() {
  return state.maps.find(map => map.id === state.currentMapId) || null;
}

function ownerName(ownerId) {
  if (!ownerId) return "-";
  const owner = state.members.find(member => member.id === ownerId);
  return owner?.name || (ownerId === state.user?.uid ? state.profile.name : "Player");
}

function isOnline(member) {
  return Date.now() - (member.heartbeatAt || 0) < 20000;
}

function cleanupCampaignSubs() {
  state.unsubs.forEach(unsub => unsub());
  state.unsubs = [];
}

function cleanupMapSubs() {
  state.mapUnsubs.forEach(unsub => unsub());
  state.mapUnsubs = [];
  state.drawings = [];
  state.fogActions = [];
}

function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem("campaign-chronicle-profile"));
    if (saved?.name && saved?.color) return saved;
  } catch (error) {
    console.warn("Failed to read saved profile", error);
  }
  return { ...DEFAULT_PROFILE, color: randomColor() };
}

async function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  while (true) {
    let code = "";
    for (let index = 0; index < 6; index += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const snap = await getDoc(doc(db, "campaigns", code));
    if (!snap.exists()) return code;
  }
}

function compactPoints(points) {
  return points.filter((point, index) => index === 0 || index === points.length - 1 || index % 2 === 0);
}

function readImageMeta(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = error => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });
}

function fileBaseName(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

function safeFileName(fileName) {
  return fileName.replace(/[^\w.-]+/g, "-").toLowerCase();
}

function randomColor() {
  const palette = ["#d97706", "#2dd4bf", "#38bdf8", "#f97316", "#f43f5e", "#a3e635"];
  return palette[Math.floor(Math.random() * palette.length)];
}

function sanitizeName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}

function sanitizeLabel(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 36);
}

function normalizeCampaignCode(value) {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
