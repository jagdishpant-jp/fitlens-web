const user = FitLensSession.require();
const isCoach = user && user.role === "coach";
// Detail page: RIPS (read one), UIPS (update), DIPS (delete) + Translator
const id = new URLSearchParams(location.search).get("id");
const notice = document.getElementById("notice");
const viewer = document.getElementById("viewer");
const form = document.getElementById("editForm");
const deleteDialog = document.getElementById("deleteDialog");

document.getElementById("coachInitials").textContent = initials(C.TRAINER_NAME);
document.getElementById("coachName").textContent = C.TRAINER_NAME;

function showComment(text) {
  const bubble = document.getElementById("bubble");
  document.getElementById("bubbleText").textContent = text || (isCoach ? "No feedback yet. Write your reply below." : "No feedback yet. Your coach will reply here.");
  bubble.classList.toggle("empty-comment", !text);
  document.getElementById("translated").hidden = true;
}

function showTitle(item) {
  const isVideo = item.mediaType === "video";
  document.getElementById("title").textContent = item.caption || (isVideo ? "Form check video" : "Progress photo");
  document.getElementById("weekLine").textContent = `Week ${item.weekNumber} · ${isVideo ? "video" : "photo"} · ${item.clientName || C.CLIENT_NAME}`;
  document.getElementById("captionText").textContent = item.caption || "No caption";
}

// Role-based editing: clients edit captions, coaches write feedback
document.getElementById("editTitle").textContent = isCoach ? "Reply to your client" : "Edit check-in";
document.getElementById("captionEdit").hidden = isCoach;
document.getElementById("captionRead").hidden = !isCoach;
document.getElementById("commentEdit").hidden = !isCoach;
document.getElementById("deleteBtn").hidden = isCoach;
document.getElementById("saveBtn").textContent = isCoach ? "Send feedback" : "Save changes";

async function load() {
  if (!id) return showNotice(notice, "No check-in selected. Go back to the timeline and choose one.", "error");
  if (!isConfigured("RIPS_URL")) return showNotice(notice, "Add your RIPS URL to js/config.js first.", "error");
  try {
    const item = await FitLensAPI.getOne(id);
    const isVideo = item.mediaType === "video";
    showTitle(item);
    viewer.innerHTML = isVideo
      ? `<video src="${escapeHtml(item.sasUrl)}" controls playsinline preload="metadata"></video>`
      : `<img src="${escapeHtml(item.sasUrl)}" alt="${escapeHtml(item.caption || "Progress photo")}">`;
    document.getElementById("facts").innerHTML = [
      `${isVideo ? "Video" : "Photo"}`,
      `Uploaded ${formatDate(item.uploadedAt)}`,
      formatSize(item.sizeBytes),
      `Client: ${escapeHtml(item.clientName)}`
    ].filter(Boolean).map((t) => `<li>${t}</li>`).join("");
    form.caption.value = item.caption || "";
    form.comment.value = item.trainerComment || "";
    showComment(item.trainerComment);
    document.getElementById("edited").textContent = item.lastEditedAt ? `Last edited ${formatDate(item.lastEditedAt)}` : "";
    if (location.hash === "#edit") (isCoach ? form.comment : form.caption).focus();
  } catch (e) {
    showNotice(notice, `Couldn't load this check-in. ${e.message}`, "error");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isConfigured("UIPS_URL")) return showNotice(notice, "Add your UIPS URL to js/config.js first.", "error");
  const btn = document.getElementById("saveBtn");
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const updated = await FitLensAPI.update(id, form.caption.value.trim(), form.comment.value.trim());
    showNotice(notice, isCoach ? "Feedback sent." : "Changes saved.", "success");
    showComment(form.comment.value.trim());
    if (updated) showTitle(updated);
    document.getElementById("edited").textContent = `Last edited ${formatDate(updated?.lastEditedAt || new Date())}`;
  } catch (err) {
    showNotice(notice, `Couldn't save. ${err.message}`, "error");
  }
  btn.disabled = false; btn.textContent = isCoach ? "Send feedback" : "Save changes";
});

document.getElementById("deleteBtn").addEventListener("click", () => deleteDialog.showModal());
document.getElementById("cancelDelete").addEventListener("click", () => deleteDialog.close());
document.getElementById("confirmDelete").addEventListener("click", async () => {
  deleteDialog.close();
  if (!isConfigured("DIPS_URL")) return showNotice(notice, "Add your DIPS URL to js/config.js first.", "error");
  try {
    await FitLensAPI.remove(id);
    location.href = "dashboard.html?deleted=1";
  } catch (err) {
    showNotice(notice, `Couldn't delete. ${err.message}`, "error");
  }
});

// Advanced feature 2: translate the coach comment (Azure Function -> Azure AI Translator)
if (isConfigured("TRANSLATE_URL")) document.getElementById("translateRow").hidden = false;
document.getElementById("translateBtn").addEventListener("click", async () => {
  const out = document.getElementById("translated");
  const text = form.comment.value.trim();
  if (!text) { out.textContent = "There is no coach comment to translate yet."; out.hidden = false; return; }
  const btn = document.getElementById("translateBtn");
  btn.disabled = true; btn.textContent = "Translating…";
  try {
    const r = await FitLensAPI.translate(text, document.getElementById("lang").value);
    out.textContent = r.translatedText;
  } catch (err) {
    out.textContent = `Couldn't translate. ${err.message}`;
  }
  out.hidden = false;
  btn.disabled = false; btn.textContent = "Translate";
});

load();
