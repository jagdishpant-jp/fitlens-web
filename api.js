// FitLens API layer: every call to the Logic App REST endpoints lives here.
const C = FITLENS_CONFIG;

function isConfigured(key) {
  return C[key] && !C[key].startsWith("PASTE_");
}

function withParams(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

async function readJson(res) {
  const text = await res.text();
  if (!res.ok) throw new Error(`Request failed (${res.status}). ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const FitLensAPI = {
  // IUPS - Create (multipart form upload, with progress)
  upload(formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", C.IUPS_URL);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({}); }
        } else {
          reject(new Error(`Upload failed (${xhr.status}). ${xhr.responseText.slice(0, 200)}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error: the upload could not reach the API."));
      xhr.send(formData);
    });
  },

  // RAI - Retrieve all for the trainer
  async listAll() {
    const res = await fetch(withParams(C.RAI_URL, { trainerId: C.TRAINER_ID }));
    return (await readJson(res)) || [];
  },

  // RIPS - Retrieve one
  async getOne(id) {
    const res = await fetch(withParams(C.RIPS_URL, { id, trainerId: C.TRAINER_ID }));
    return readJson(res);
  },

  // UIPS - Update caption / trainer comment
  async update(id, caption, trainerComment) {
    const res = await fetch(C.UIPS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, trainerId: C.TRAINER_ID, caption, trainerComment })
    });
    return readJson(res);
  },

  // DIPS - Delete file + record
  async remove(id) {
    const res = await fetch(withParams(C.DIPS_URL, { id, trainerId: C.TRAINER_ID }), { method: "DELETE" });
    return readJson(res);
  }
};

// Small shared helpers
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function formatDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatSize(bytes) {
  const n = Number(bytes);
  if (!n) return "";
  return n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}
function showNotice(el, message, kind = "info") {
  el.textContent = message;
  el.className = `notice notice-${kind}`;
  el.hidden = false;
}
