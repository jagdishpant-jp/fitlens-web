// Demo role sign-in
document.getElementById("clientName").textContent = C.CLIENT_NAME;
document.getElementById("coachName").textContent = C.TRAINER_NAME;
const next = new URLSearchParams(location.search).get("next");
if (next) showNotice(document.getElementById("notice"), "Please log in to continue.", "info");

document.querySelectorAll(".role-card").forEach((card) => card.addEventListener("click", () => {
  FitLensSession.signIn(card.dataset.role);
  const safeNext = next && /^[a-z]+\.html(\?[\w=&%.-]*)?$/i.test(next) ? next : "dashboard.html";
  location.href = safeNext;
}));
