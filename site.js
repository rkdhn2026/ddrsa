(function () {
  // Register 2026-27 dropdown
  var toggle = document.querySelector(".sub-toggle");
  if (toggle) {
    var menu = document.getElementById(toggle.getAttribute("aria-controls"));
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.hidden = !open;
    }
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(menu.hidden);
    });
    menu.addEventListener("click", function (e) { if (e.target.tagName === "A") setOpen(false); });
    document.addEventListener("click", function (e) { if (!menu.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setOpen(false); toggle.focus(); }
    });
  }
  // Coach and referee forms (front-end only)
  document.querySelectorAll("[data-simple-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".notice");
      var missing = [].filter.call(form.querySelectorAll("[required]"), function (el) { return !el.value.trim(); });
      status.hidden = false;
      if (missing.length) {
        status.textContent = "Please fill in your name and a mobile number.";
        missing[0].focus();
        return;
      }
      status.textContent = "Form complete. Registrations are not saved yet, so please also register through your club or the office.";
    });
  });
})();
