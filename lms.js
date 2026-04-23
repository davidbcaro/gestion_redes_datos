(function () {
  const app = document.querySelector(".lms-app");
  if (!app) return;

  const btn = app.querySelector(".lms-burger");
  const scrim = app.querySelector(".lms-scrim");

  function setOpen(open) {
    app.classList.toggle("lms--nav-open", open);
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }

  function toggle() {
    setOpen(!app.classList.contains("lms--nav-open"));
  }

  btn?.addEventListener("click", function (e) {
    e.stopPropagation();
    toggle();
  });

  scrim?.addEventListener("click", function () {
    setOpen(false);
  });

  app.querySelectorAll(".lms-sidebar a").forEach(function (a) {
    a.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 1024px)").matches) setOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();
