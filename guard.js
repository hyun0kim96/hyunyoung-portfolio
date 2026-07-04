(function () {
  // Block right-click context menu
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); }, { capture: true });
})();
