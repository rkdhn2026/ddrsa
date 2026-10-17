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
  // Coach registration form: sent to the DDRSA Google Apps Script (see setup/skater-sheet-setup.md)
  document.querySelectorAll("[data-simple-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".notice"), btn = form.querySelector("button[type=submit]");
      var missing = [].filter.call(form.querySelectorAll("[required]"), function (el) { return !el.value.trim(); });
      status.hidden = false;
      if (missing.length) {
        status.textContent = "Please fill in your name and a mobile number.";
        missing[0].focus();
        return;
      }
      if (!window.DDRSA_API) { status.textContent = "Registrations cannot be sent from this page right now. Please email rollerskatingdhanbad@gmail.com."; return; }
      var data = { form: form.getAttribute("data-simple-form"), website: form.elements.website ? form.elements.website.value : "" };
      form.querySelectorAll("input[id], select[id]").forEach(function (el) { if (el.name !== "website") data[el.id.replace(/^c-/, "")] = el.value; });
      btn.disabled = true; status.textContent = "Sending...";
      fetch(window.DDRSA_API, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
        .then(function () { status.textContent = "Thank you. Your coach registration has been received and will be checked by DDRSA."; form.reset(); })
        .catch(function () { status.textContent = "Could not send the registration. Please check your connection and try again."; })
        .then(function () { btn.disabled = false; });
    });
  });
  // Photo albums: show/hide grid and lightbox viewer
  document.querySelectorAll("[data-album-toggle]").forEach(function (btn) {
    var grid = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", function () {
      var open = grid.hidden;
      grid.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Hide photos" : btn.getAttribute("data-label");
    });
    btn.setAttribute("data-label", btn.textContent);
  });
  var lbLinks = [].slice.call(document.querySelectorAll("[data-lightbox]"));
  if (lbLinks.length && typeof HTMLDialogElement === "function") {
    var dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.setAttribute("aria-label", "Photo viewer");
    dlg.innerHTML = '<div class="lightbox-inner"><img alt=""><p></p><button type="button" class="lb-close" aria-label="Close">\u00d7</button><button type="button" class="lb-prev" aria-label="Previous photo">\u2039</button><button type="button" class="lb-next" aria-label="Next photo">\u203a</button></div>';
    document.body.appendChild(dlg);
    var big = dlg.querySelector("img"), cap = dlg.querySelector("p"), cur = 0;
    function showPhoto(n) {
      cur = (n + lbLinks.length) % lbLinks.length;
      var a = lbLinks[cur];
      big.src = a.getAttribute("href");
      big.alt = a.querySelector("img").alt;
      cap.textContent = a.getAttribute("data-caption") + " (" + (cur + 1) + " of " + lbLinks.length + ")";
    }
    lbLinks.forEach(function (a, k) {
      a.addEventListener("click", function (e) { e.preventDefault(); showPhoto(k); dlg.showModal(); });
    });
    dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
    dlg.querySelector(".lb-prev").addEventListener("click", function () { showPhoto(cur - 1); });
    dlg.querySelector(".lb-next").addEventListener("click", function () { showPhoto(cur + 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") showPhoto(cur - 1);
      if (e.key === "ArrowRight") showPhoto(cur + 1);
    });
  }
})();
