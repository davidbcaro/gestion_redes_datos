(function () {
  var KEY = "sena-site-theme";
  var root = document.documentElement;
  var btn = document.getElementById("site-theme-btn");
  if (!btn) return;

  function sync() {
    var isLight = root.getAttribute("data-theme") === "light";
    btn.setAttribute("aria-pressed", isLight ? "true" : "false");
  }

  btn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch (e) {}
    sync();
  });

  sync();
})();
