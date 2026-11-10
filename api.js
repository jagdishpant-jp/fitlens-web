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

  // Advanced feature 1 - Azure Function: progress insights
  async insights(items) {
    const res = await fetch(C.INSIGHTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items)
    });
    return readJson(res);
  },

  // Advanced feature 2 - Azure AI Translator (called via the Azure Function)
  async translate(text, to) {
    const res = await fetch(C.TRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, to })
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

function initials(name) {
  return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}
const ICONS = {
  camera: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  video: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  chat: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  spark: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
  whistle: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="14" r="5"/><path d="M13 11l8-4v4l-6 2"/></svg>'
};

// ---- Demo session (role selection). Not secure authentication - see CW1 limitations. ----
const FitLensSession = {
  key: "fitlens.user",
  get() {
    try { return JSON.parse(localStorage.getItem(this.key)); } catch { return null; }
  },
  signIn(role) {
    const user = role === "coach"
      ? { role: "coach", name: C.TRAINER_NAME, id: C.TRAINER_ID }
      : { role: "client", name: C.CLIENT_NAME, id: C.CLIENT_ID };
    try { localStorage.setItem(this.key, JSON.stringify(user)); } catch { /* storage unavailable */ }
    return user;
  },
  signOut() {
    try { localStorage.removeItem(this.key); } catch { /* ignore */ }
  },
  require() {
    const user = this.get();
    if (!user) location.replace(`login.html?next=${encodeURIComponent(location.pathname.split("/").pop() + location.search)}`);
    return user;
  }
};
