// Timeline page: RAI (read all) + DIPS (delete) + Azure Function insights + compare
let allItems = [];
let filter = "all";
let pendingDeleteId = null;

const grid = document.getElementById("grid");
const notice = document.getElementById("notice");
const sortSelect = document.getElementById("sort");
const deleteDialog = document.getElementById("deleteDialog");
const compareDialog = document.getElementById("compareDialog");

const user = FitLensSession.require();
const isCoach = user && user.role === "coach";
document.getElementById("pageTitle").innerHTML = isCoach
  ? `${escapeHtml(C.CLIENT_NAME.split(" ")[0])}’s <em>progress</em>`
  : `My <em>progress</em>`;
document.getElementById("pageSub").textContent = isCoach
  ? `Client: ${C.CLIENT_NAME} · reviewing as coach ${C.TRAINER_NAME}`
  : `${C.CLIENT_NAME} · coached by ${C.TRAINER_NAME}`;

const weekOf = (item) => Number(item.weekNumber) || 0;
if (isCoach) document.getElementById("compareBtn").classList.add("btn-primary");
const mediaTag = (i, extra = "") => i.mediaType === "video"
  ? `<video src="${escapeHtml(i.sasUrl)}#t=0.5" muted preload="metadata" ${extra}></video>`
  : `<img src="${escapeHtml(i.sasUrl)}" alt="Week ${escapeHtml(i.weekNumber)} ${escapeHtml(i.caption || "progress photo")}" loading="lazy">`;

function renderJourney() {
  const box = document.getElementById("journey");
  const items = [...allItems].sort((a, b) => weekOf(a) - weekOf(b));
  if (!items.length) { box.hidden = true; return; }
  document.getElementById("journeyRange").textContent =
    items.length > 1 ? `Week ${weekOf(items[0])} to week ${weekOf(items[items.length - 1])}` : `Week ${weekOf(items[0])}`;
  document.getElementById("track").innerHTML = `<div class="track-inner">` + items.map((i, idx) => `
    <a class="stop ${idx === items.length - 1 ? "latest" : ""}" href="media.html?id=${encodeURIComponent(i.id)}">
      <span class="stop-img">${mediaTag(i)}</span>
      <span class="stop-week">Week ${escapeHtml(i.weekNumber)}</span>
      <span class="stop-type">${i.mediaType === "video" ? "Video" : "Photo"}</span>
    </a>`).join("") + `</div>`;
  box.hidden = false;
}

function render() {
  let items = allItems.filter((i) => filter === "all" || i.mediaType === filter);
  items.sort((a, b) => sortSelect.value === "newest" ? weekOf(b) - weekOf(a) : weekOf(a) - weekOf(b));

  if (!items.length) {
    grid.innerHTML = `<div class="empty"><h3>${allItems.length ? "Nothing matches this filter" : "Start your progress journey"}</h3>
      <p>${allItems.length ? "Try another filter." : isCoach ? "Your client hasn’t uploaded anything yet." : "Upload your first photo or video and your coach will be able to review it."}</p>
      ${isCoach ? "" : `<a class="btn btn-black" href="upload.html">Add a check-in <span class="arrow">→</span></a>`}</div>`;
    return;
  }

  grid.innerHTML = items.map((i) => {
    const isVideo = i.mediaType === "video";
    const link = `media.html?id=${encodeURIComponent(i.id)}`;
    return `<article class="card">
      <a class="thumb" href="${link}">
        ${mediaTag(i, `data-id="${escapeHtml(i.id)}"`)}
        <span class="week-badge">Week ${escapeHtml(i.weekNumber)}</span>
        <span class="type-badge">${isVideo ? ICONS.video + "Video" : ICONS.camera + "Photo"}</span>
        ${isVideo ? `<span class="play" aria-hidden="true"></span><span class="duration" data-for="${escapeHtml(i.id)}"></span>` : ""}
      </a>
      <div class="card-body">
        <a class="card-title" href="${link}">${escapeHtml(i.caption || (isVideo ? "Form check video" : "Progress photo"))}</a>
        <span class="card-date">Uploaded ${formatDate(i.uploadedAt)}</span>
        <div class="card-foot">
          <span class="status ${i.trainerComment ? "has" : ""}">${ICONS.chat}${i.trainerComment ? "Coach replied" : "Awaiting feedback"}</span>
          <span class="card-actions">
            <a href="${link}#edit" class="icon-btn" aria-label="${isCoach ? "Comment on" : "Edit"} week ${escapeHtml(i.weekNumber)}">${isCoach ? ICONS.chat : ICONS.edit}</a>
            ${isCoach ? "" : `<button class="icon-btn danger" data-delete="${escapeHtml(i.id)}" aria-label="Delete week ${escapeHtml(i.weekNumber)}" type="button">${ICONS.trash}</button>`}
          </span>
        </div>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll("video[data-id]").forEach((v) => v.addEventListener("loadedmetadata", () => {
    const tag = grid.querySelector(`.duration[data-for="${v.dataset.id}"]`);
    if (tag && isFinite(v.duration)) tag.textContent = `${Math.floor(v.duration / 60)}:${String(Math.round(v.duration % 60)).padStart(2, "0")}`;
  }));
}

// Advanced feature 1: progress insights from the Azure Function
async function loadInsights() {
  const box = document.getElementById("insights");
  if (!isConfigured("INSIGHTS_URL") || !allItems.length) { box.hidden = true; return; }
  try {
    const r = await FitLensAPI.insights(allItems);
    const pct = Math.max(0, Math.min(100, Number(r.consistencyPercent) || 0));
    const circ = 2 * Math.PI * 22;
    box.innerHTML = `
      <div class="tile nudge"><p class="nudge-title">Coach insight</p><p class="nudge-text">${escapeHtml(r.nudge)}</p></div>
      <dl class="tile"><dt>Check-ins</dt><dd>${escapeHtml(r.totalUploads)}</dd></dl>
      <dl class="tile"><dt>Weeks tracked</dt><dd>${escapeHtml(r.weeksSpan)}</dd></dl>
      <div class="tile ring">
        <svg viewBox="0 0 54 54" aria-hidden="true"><circle class="bg" cx="27" cy="27" r="22"/><circle class="fg" cx="27" cy="27" r="22" stroke-dasharray="${(pct / 100) * circ} ${circ}"/></svg>
        <dl><dt>Consistency</dt><dd>${pct}%</dd></dl>
      </div>
      <dl class="tile"><dt>Coach replies</dt><dd>${escapeHtml(r.coachReplies)}</dd></dl>`;
    box.hidden = false;
    document.getElementById("powered").hidden = false;
  } catch (e) {
    console.warn("Insights unavailable:", e.message);
  }
}

async function load() {
  if (!isConfigured("RAI_URL")) {
    showNotice(notice, "Add your RAI URL to js/config.js to load the timeline.", "error");
    grid.innerHTML = "";
    return;
  }
  grid.innerHTML = `<p class="loading">Loading progress…</p>`;
  try {
    allItems = await FitLensAPI.listAll();
    render();
    renderJourney();
    loadInsights();
  } catch (e) {
    grid.innerHTML = "";
    showNotice(notice, `Couldn't load the timeline. ${e.message}`, "error");
  }
}

document.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
  chip.setAttribute("aria-pressed", "true");
  filter = chip.dataset.filter;
  render();
}));
sortSelect.addEventListener("change", render);

// Delete (DIPS)
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-delete]");
  if (!btn) return;
  pendingDeleteId = btn.dataset.delete;
  deleteDialog.showModal();
});
document.getElementById("confirmDelete").addEventListener("click", async () => {
  deleteDialog.close();
  try {
    await FitLensAPI.remove(pendingDeleteId);
    showNotice(notice, "Check-in deleted. The file and its record were removed.", "success");
    await load();
  } catch (e) {
    showNotice(notice, `Couldn't delete. ${e.message}`, "error");
  }
});
document.getElementById("cancelDelete").addEventListener("click", () => deleteDialog.close());

// Compare first vs latest week
document.getElementById("compareBtn").addEventListener("click", () => {
  const items = allItems.filter((i) => i.sasUrl).sort((a, b) => weekOf(a) - weekOf(b));
  const body = document.getElementById("compareBody");
  if (items.length < 2) {
    body.innerHTML = `<p>Upload at least two weeks of progress to compare.</p>`;
  } else {
    const [first, last] = [items[0], items[items.length - 1]];
    const media = (i) => i.mediaType === "video"
      ? `<video src="${escapeHtml(i.sasUrl)}" controls preload="metadata"></video>`
      : `<img src="${escapeHtml(i.sasUrl)}" alt="Week ${escapeHtml(i.weekNumber)}">`;
    body.innerHTML = `<figure>${media(first)}<figcaption>Week ${escapeHtml(first.weekNumber)}</figcaption></figure>
                      <span class="vs" aria-hidden="true">VS</span>
                      <figure>${media(last)}<figcaption>Week ${escapeHtml(last.weekNumber)}</figcaption></figure>`;
  }
  compareDialog.showModal();
});
document.getElementById("closeCompare").addEventListener("click", () => compareDialog.close());

const qs = new URLSearchParams(location.search);
if (qs.has("deleted")) showNotice(notice, "Check-in deleted.", "success");
if (qs.has("uploaded")) showNotice(notice, "Upload complete. It now appears in your timeline.", "success");
load();
