/* ============================================================
   Login — lógica de autenticación real contra el backend
   POST /auth/login  { correo, contraseña }
   Al éxito: guarda la sesión en sessionStorage y va a app.html
   ============================================================ */
(function () {
  "use strict";

  // Entrada GSAP
  if (window.gsap) {
    gsap.from(".auth-form-side", { autoAlpha: 0, y: 24, duration: 0.5, ease: "power2.out", delay: 0.1 });
    gsap.from(".auth-hero > *", { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.15 });
  }

  var pass = document.getElementById("password");
  var toggle = document.getElementById("toggle-pass");
  if (toggle && pass) {
    toggle.addEventListener("click", function () {
      var ver = pass.type === "password";
      pass.type = ver ? "text" : "password";
      toggle.innerHTML = ver ? `<i class="fas fa-eye-slash"></i>` : `<i class="fas fa-eye"></i>`;
    });
  }

  function setError(input, msgEl, on) {
    if (input) input.classList.toggle("is-error", on);
    if (msgEl) msgEl.style.display = on ? "flex" : "none";
  }

  var form = document.getElementById("login-form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var email = document.getElementById("email");
      var errs = form.querySelectorAll(".field-error");
      setError(email, errs[0], false);
      setError(pass, errs[1], false);

      var ok = true;
      if (!email.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) { setError(email, errs[0], true); ok = false; }
      if (!pass.value) { setError(pass, errs[1], true); ok = false; }
      if (!ok) return;

      var btn = document.getElementById("login-btn");
      if (btn) btn.disabled = true;

      try {
        var res = await api.login(email.value.trim(), pass.value);
        sessionStorage.setItem("sesion", JSON.stringify(res));
        window.location.replace("app.html");
      } catch (err) {
        showToast(err.message || "No se pudo iniciar sesion.", "error");
        if (btn) btn.disabled = false;
      }
    });
  }

  // Demo: acceso rapido por rol (sin backend)
  document.querySelectorAll("[data-rol]").forEach(function (b) {
    b.addEventListener("click", function () {
      var rol = b.getAttribute("data-rol");
      window.location.href = "app.html?rol=" + rol;
    });
  });
})();
