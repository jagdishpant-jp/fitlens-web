// Detail page: RIPS (read one), UIPS (update), DIPS (delete)
const id = new URLSearchParams(location.search).get("id");
const notice = document.getElementById("notice");
const viewer = document.getElementById("viewer");
const form = document.getElementById("editForm");
const deleteDialog = document.getElementById("deleteDialog");

async function load() {
  if (!id) return showNotice(notice, "No upload selected. Go back to the timeline and choose one.", "error");
  if (!isConfigured("RIPS_URL")) return showNotice(notice, "Add your RIPS URL to js/config.js first.", "error");
  try {
    const item = await FitLensAPI.getOne(id);
    const isVideo = item.mediaType === "video";
    document.getElementById("title").textContent = `Week ${item.weekNumber} · ${item.caption || (isVideo ? "Video" : "Photo")}`;
    viewer.innerHTML = isVideo
      ? `<video src="${escapeHtml(item.sasUrl)}" controls playsinline preload="metadata"></video>`
      : `<img src="${escapeHtml(item.sasUrl)}" alt="${escapeHtml(item.caption || "Progress photo")}">`;
    document.getElementById("facts").innerHTML = [
      `Week ${escapeHtml(item.weekNumber)} ${isVideo ? "video" : "photo"}`,
      `Uploaded ${formatDate(item.uploadedAt)}`,
      formatSize(item.sizeBytes),
      `Client: ${escapeHtml(item.clientName)}`
    ].filter(Boolean).map((t) => `<li>${t}</li>`).join("");
    form.caption.value = item.caption || "";
    form.comment.value = item.trainerComment || "";
    document.getElementById("edited").textContent = item.lastEditedAt ? `Last edited ${formatDate(item.lastEditedAt)}` : "";
    if (location.hash === "#edit") form.caption.focus();
  } catch (e) {
    showNotice(notice, `Couldn't load this upload. ${e.message}`, "error");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isConfigured("UIPS_URL")) return showNotice(notice, "Add your UIPS URL to js/config.js first.", "error");
  const btn = document.getElementById("saveBtn");
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const updated = await FitLensAPI.update(id, form.caption.value.trim(), form.comment.value.trim());
    showNotice(notice, "Changes saved.", "success");
    document.getElementById("edited").textContent = `Last edited ${formatDate(updated?.lastEditedAt || new Date())}`;
    document.getElementById("title").textContent = `Week ${updated?.weekNumber ?? ""} · ${form.caption.value.trim()}`;
  } catch (err) {
    showNotice(notice, `Couldn't save. ${err.message}`, "error");
  }
  btn.disabled = false; btn.textContent = "Save changes";
});

document.getElementById("deleteBtn").addEventListener("click", () => deleteDialog.showModal());
document.getElementById("cancelDelete").addEventListener("click", () => deleteDialog.close());
document.getElementById("confirmDelete").addEventListener("click", async () => {
  deleteDialog.close();
  if (!isConfigured("DIPS_URL")) return showNotice(notice, "Add your DIPS URL to js/config.js first.", "error");
  try {
    await FitLensAPI.remove(id);
    location.href = "index.html?deleted=1";
  } catch (err) {
    showNotice(notice, `Couldn't delete. ${err.message}`, "error");
  }
});

load();
