// Timeline page: RAI (read all) + DIPS (delete) + compare view
let allItems = [];
let filter = "all";
let pendingDeleteId = null;

const grid = document.getElementById("grid");
const notice = document.getElementById("notice");
const summary = document.getElementById("summary");
const sortSelect = document.getElementById("sort");
const deleteDialog = document.getElementById("deleteDialog");
const compareDialog = document.getElementById("compareDialog");

document.getElementById("clientName").textContent = C.CLIENT_NAME;

function weekOf(item) { return Number(item.weekNumber) || 0; }

function render() {
  let items = allItems.filter((i) => filter === "all" || i.mediaType === filter);
  items.sort((a, b) => sortSelect.value === "newest" ? weekOf(b) - weekOf(a) : weekOf(a) - weekOf(b));

  summary.textContent = allItems.length
    ? `${allItems.length} upload${allItems.length === 1 ? "" : "s"} · coached by ${C.TRAINER_NAME}`
    : `No uploads yet · coached by ${C.TRAINER_NAME}`;

  if (!items.length) {
    grid.innerHTML = `<div class="empty"><p>${allItems.length ? "Nothing matches this filter." : "No progress media yet."}</p>
      <a class="btn btn-primary" href="upload.html">Add the first update</a></div>`;
    return;
  }

  grid.innerHTML = items.map((i) => {
    const isVideo = i.mediaType === "video";
    const thumb = isVideo
      ? `<video src="${escapeHtml(i.sasUrl)}#t=0.5" muted preload="metadata" data-id="${escapeHtml(i.id)}"></video><span class="play" aria-hidden="true"></span><span class="duration" data-for="${escapeHtml(i.id)}"></span>`
      : `<img src="${escapeHtml(i.sasUrl)}" alt="${escapeHtml(i.caption || "Progress photo")}" loading="lazy">`;
    return `<article class="card">
      <a class="thumb" href="media.html?id=${encodeURIComponent(i.id)}">${thumb}</a>
      <div class="card-body">
        <a class="card-title" href="media.html?id=${encodeURIComponent(i.id)}">Week ${escapeHtml(i.weekNumber)} · ${isVideo ? "Video" : "Photo"}</a>
        <p class="card-caption">${escapeHtml(i.caption || "No caption")}</p>
        <div class="card-foot">
          <span class="comment-flag ${i.trainerComment ? "has" : ""}">${i.trainerComment ? "Coach replied" : "Awaiting feedback"}</span>
          <span class="card-actions">
            <a href="media.html?id=${encodeURIComponent(i.id)}#edit" class="icon-btn" aria-label="Edit">Edit</a>
            <button class="icon-btn danger" data-delete="${escapeHtml(i.id)}" aria-label="Delete">Delete</button>
          </span>
        </div>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll("video").forEach((v) => v.addEventListener("loadedmetadata", () => {
    const tag = grid.querySelector(`.duration[data-for="${v.dataset.id}"]`);
    if (tag && isFinite(v.duration)) tag.textContent = `${Math.floor(v.duration / 60)}:${String(Math.round(v.duration % 60)).padStart(2, "0")}`;
  }));
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
    showNotice(notice, "Upload deleted. The file and its record were removed.", "success");
    await load();
  } catch (e) {
    showNotice(notice, `Couldn't delete. ${e.message}`, "error");
  }
});
document.getElementById("cancelDelete").addEventListener("click", () => deleteDialog.close());

// Compare first vs latest week
document.getElementById("compareBtn").addEventListener("click", () => {
  const photos = allItems.filter((i) => i.sasUrl).sort((a, b) => weekOf(a) - weekOf(b));
  const body = document.getElementById("compareBody");
  if (photos.length < 2) {
    body.innerHTML = `<p>Upload at least two weeks of progress to compare.</p>`;
  } else {
    const [first, last] = [photos[0], photos[photos.length - 1]];
    const media = (i) => i.mediaType === "video"
      ? `<video src="${escapeHtml(i.sasUrl)}" controls preload="metadata"></video>`
      : `<img src="${escapeHtml(i.sasUrl)}" alt="Week ${escapeHtml(i.weekNumber)}">`;
    body.innerHTML = `<figure>${media(first)}<figcaption>Week ${escapeHtml(first.weekNumber)}</figcaption></figure>
                      <figure>${media(last)}<figcaption>Week ${escapeHtml(last.weekNumber)}</figcaption></figure>`;
  }
  compareDialog.showModal();
});
document.getElementById("closeCompare").addEventListener("click", () => compareDialog.close());

if (new URLSearchParams(location.search).has("deleted")) showNotice(notice, "Upload deleted.", "success");
if (new URLSearchParams(location.search).has("uploaded")) showNotice(notice, "Upload complete. It now appears in the timeline.", "success");
load();
