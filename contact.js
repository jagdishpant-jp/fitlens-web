// Contact form: validates, then opens the visitor's email app with the message filled in.
const form = document.getElementById("contactForm");
const notice = document.getElementById("notice");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form).entries());
  if (!f.first.trim() || !f.last.trim() || !f.message.trim()) return showNotice(notice, "Fill in your name and a message.", "error");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return showNotice(notice, "Enter a valid email address.", "error");
  const subject = `FitLens enquiry from ${f.first} ${f.last} (${f.who})`;
  const body = `${f.message}\n\n${f.first} ${f.last}\n${f.email}`;
  location.href = `mailto:hello@fitlens.example?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  showNotice(notice, "Your email app should open with the message ready to send.", "success");
});
