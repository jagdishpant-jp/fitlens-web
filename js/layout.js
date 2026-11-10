// Shared header + footer for every FitLens page (keeps navigation consistent).
(function () {
  const user = FitLensSession.get();
  const page = location.pathname.split("/").pop() || "index.html";
  const link = (href, label) =>
    `<a class="nav-link" href="${href}"${page === href ? ' aria-current="page"' : ""}>${label}</a>`;

  const appLinks = user
    ? link("dashboard.html", user.role === "coach" ? "Client progress" : "My progress")
    : "";
  const right = user
    ? `<span class="user-chip"><span class="user-dot">${initials(user.name)}</span><span><b>${escapeHtml(user.name)}</b><small>${user.role === "coach" ? "Coach" : "Client"}</small></span></span>
       <button class="btn-ghost" id="logoutBtn" type="button">Log out</button>
       ${user.role === "client" ? `<a class="btn-lime" href="upload.html">Add update <span aria-hidden="true">+</span></a>` : ""}`
    : `<a class="nav-link" href="login.html">Log in</a><a class="btn-lime" href="login.html">Start tracking <span aria-hidden="true">→</span></a>`;

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <div class="bar">
        <a class="logo" href="index.html" aria-label="FitLens home">FIT<span>/</span>LENS</a>
        <button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="mainNav" aria-label="Menu"><span></span><span></span></button>
        <nav class="main-nav" id="mainNav">
          <div class="nav-left">${link("index.html", "Home")}${appLinks}${link("contact.html", "Contact")}${link("privacy.html", "Privacy")}</div>
          <div class="nav-right">${right}</div>
        </nav>
      </div>`;
    document.getElementById("menuBtn").addEventListener("click", (e) => {
      const nav = document.getElementById("mainNav");
      const open = nav.classList.toggle("open");
      e.currentTarget.setAttribute("aria-expanded", String(open));
    });
    const logout = document.getElementById("logoutBtn");
    if (logout) logout.addEventListener("click", () => { FitLensSession.signOut(); location.href = "index.html?loggedout=1"; });
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML = `
      <div class="foot-top">
        <span>Belfast, Northern Ireland</span>
        <a href="mailto:hello@fitlens.example">hello@fitlens.example</a>
        <a href="contact.html">Contact us</a>
      </div>
      <div class="foot-word" aria-hidden="true">FIT/LENS</div>
      <div class="foot-bottom">
        <nav aria-label="Footer"><a href="privacy.html">Privacy &amp; data</a><a href="contact.html">Contact</a><a href="login.html">Log in</a></nav>
        <span>© 2026 FitLens · COM682 Cloud Native Development · Hosted on Microsoft Azure</span>
      </div>`;
  }
})();
