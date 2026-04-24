(function () {
  var t = null;
  try { t = localStorage.getItem("sena-site-theme") || localStorage.getItem("sena-index-theme"); } catch (e) {}
  var d = document.documentElement.getAttribute("data-default-theme");
  if (d !== "light" && d !== "dark") d = "dark";
  document.documentElement.setAttribute("data-theme", t === "light" || t === "dark" ? t : d);
})();
