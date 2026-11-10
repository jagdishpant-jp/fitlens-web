// Upload page: IUPS (create)
const fileInput = document.getElementById("file");
const drop = document.getElementById("drop");
const chip = document.getElementById("fileChip");
const bar = document.getElementById("barFill");
const pct = document.getElementById("pct");
const form = document.getElementById("uploadForm");
const notice = document.getElementById("notice");
const submitBtn = document.getElementById("submitBtn");
let selected = null;

document.getElementById("who").textContent = `${C.CLIENT_NAME} · Coach: ${C.TRAINER_NAME}`;
document.getElementById("coachOption").textContent = `My coach (${C.TRAINER_NAME})`;

function pick(file) {
  if (!file) return;
  if (!/^image\/|^video\//.test(file.type)) {
    showNotice(notice, "Choose a photo (JPG, PNG) or a video (MP4).", "error");
    return;
  }
  selected = file;
  notice.hidden = true;
  document.getElementById("chipName").textContent = file.name;
  document.getElementById("chipSize").textContent = formatSize(file.size);
  chip.hidden = false;
  bar.style.width = "0%";
  pct.textContent = "";
  form.mediaType.value = file.type.startsWith("video/") ? "video" : "photo";
}

fileInput.addEventListener("change", () => pick(fileInput.files[0]));
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => pick(e.dataTransfer.files[0]));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isConfigured("IUPS_URL")) return showNotice(notice, "Add your IUPS URL to js/config.js first.", "error");
  if (!selected) return showNotice(notice, "Choose a photo or video to upload.", "error");

  const safeName = selected.name.replace(/[^A-Za-z0-9._-]/g, "-");
  const fd = new FormData();
  fd.append("file", selected, safeName);
  fd.append("fileName", safeName);
  fd.append("contentType", selected.type);
  fd.append("mediaType", form.mediaType.value);
  fd.append("sizeBytes", String(selected.size));
  fd.append("trainerId", C.TRAINER_ID);
  fd.append("trainerName", C.TRAINER_NAME);
  fd.append("clientId", C.CLIENT_ID);
  fd.append("clientName", C.CLIENT_NAME);
  fd.append("caption", form.caption.value.trim());
  fd.append("weekNumber", form.week.value || "1");

  submitBtn.disabled = true;
  submitBtn.textContent = "Uploading…";
  try {
    await FitLensAPI.upload(fd, (p) => { bar.style.width = `${p}%`; pct.textContent = `${p}%`; });
    pct.textContent = "Done";
    location.href = "index.html?uploaded=1";
  } catch (err) {
    showNotice(notice, err.message, "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Upload";
  }
});
