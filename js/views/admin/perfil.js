/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Perfil
   Datos reales desde la sesion/token + cambio de contrasena
   ============================================================ */
(function () {
  "use strict";

  function _decodificarToken() {
    try {
      var t = sessionStorage.getItem("token");
      if (!t) return null;
      var payload = t.split(".")[1];
      var base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      var json = decodeURIComponent(Array.prototype.map.call(atob(base64), function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(""));
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  function _datosPerfil() {
    var sesion = JSON.parse(sessionStorage.getItem("sesion") || "null");
    var payload = _decodificarToken();
    var id = (sesion && (sesion.id_usuario || sesion.id)) || (payload && parseInt(payload.sub, 10)) || null;
    return {
      id: id,
      nombres: (sesion && sesion.nombres) || "",
      apellidos: (sesion && sesion.apellidos) || "",
      correo: (sesion && sesion.correo) || "",
      telefono: (sesion && sesion.telefono) || "",
      usuario: (sesion && sesion.usuario) || "",
      demo: !id || !sesion
    };
  }

  function _mensajeError(err) {
    if (!err) return "Ocurrio un error inesperado.";
    if (Array.isArray(err.detail)) return "Revise los datos enviados.";
    return err.message || "Ocurrio un error inesperado.";
  }

  async function rPerfilAdmin() {
    var p = _datosPerfil();
    var nombre = ((p.nombres || "") + " " + (p.apellidos || "")).trim() || "Administrador";
    var sub = p.demo ? "Administrador de la barberia" : (p.usuario ? "Usuario: " + p.usuario : "Administrador");
    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        <section class="card">
          <div class="card-body" style="text-align:center;">
            <span class="avatar avatar-xl" style="margin:0 auto 14px;display:grid;">${DB.getIniciales(nombre)}</span>
            <div class="font-display" style="font-size:22px;font-weight:700;">${nombre}</div>
            <div class="card-sub">${sub}</div>
            <div style="display:flex;justify-content:center;margin-top:12px;">${UI.badge("activo")}</div>
          </div>
        </section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Datos de la cuenta</div></div></div>
          <div class="card-body" style="display:grid;gap:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field"><label class="field-label">Nombre</label><input class="input" id="perf-nombres" value="${p.nombres}"></div>
              <div class="field"><label class="field-label">Apellido</label><input class="input" id="perf-apellidos" value="${p.apellidos}"></div>
            </div>
            <div class="field"><label class="field-label">Correo</label><input class="input" type="email" id="perf-correo" value="${p.correo}"></div>
            <div class="field"><label class="field-label">Telefono</label><input class="input" id="perf-telefono" value="${p.telefono}"></div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end;"><button class="btn btn-primary" id="guardar-perfil"><i class="fas fa-floppy-disk"></i> Guardar</button></div>
        </section>
        <section class="card" style="grid-column:1/-1;">
          <div class="card-header"><div><div class="card-title">Cambiar contrasena</div><div class="card-sub">Actualiza el acceso a tu cuenta</div></div></div>
          <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
            <div class="field"><label class="field-label">Contrasena actual <span class="req">*</span></label><div class="input-wrap"><input class="input" type="password" id="perf-pass-actual" placeholder="••••••••"><button class="input-toggle"><i class="fas fa-eye"></i></button></div></div>
            <div class="field"><label class="field-label">Nueva contrasena <span class="req">*</span></label><div class="input-wrap"><input class="input" type="password" id="perf-pass-nueva" placeholder="••••••••"><button class="input-toggle"><i class="fas fa-eye"></i></button></div></div>
            <div class="field"><label class="field-label">Confirmar contrasena <span class="req">*</span></label><div class="input-wrap"><input class="input" type="password" id="perf-pass-confirmar" placeholder="••••••••"><button class="input-toggle"><i class="fas fa-eye"></i></button></div></div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end;"><button class="btn btn-primary" id="guardar-pass"><i class="fas fa-key"></i> Actualizar contrasena</button></div>
        </section>
      </div>`;
    return html;
  }

  function bindPerfilAdmin() {
    var region = App.el("view-region");
    if (!region) return;

    region.querySelectorAll(".input-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var wrap = btn.closest(".input-wrap");
        if (!wrap) return;
        var input = wrap.querySelector(".input");
        var mostrar = input.type === "password";
        input.type = mostrar ? "text" : "password";
        btn.innerHTML = mostrar ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
      });
    });

    var btn = region.querySelector("#guardar-perfil");
    if (btn) btn.addEventListener("click", async function () {
      var p = _datosPerfil();
      if (p.demo) { UI.toast("Modo demo", "Inicia sesion para guardar tus datos.", "info"); return; }
      var nombres = (region.querySelector("#perf-nombres") || {}).value || "";
      var apellidos = (region.querySelector("#perf-apellidos") || {}).value || "";
      var correo = (region.querySelector("#perf-correo") || {}).value || "";
      var telefono = (region.querySelector("#perf-telefono") || {}).value || "";
      try {
        await api.actualizarUsuario(p.id, { nombres: nombres, apellidos: apellidos, correo: correo, telefono: telefono });
        var sesion = JSON.parse(sessionStorage.getItem("sesion") || "null");
        if (sesion) {
          sesion.nombres = nombres; sesion.apellidos = apellidos; sesion.correo = correo; sesion.telefono = telefono;
          sessionStorage.setItem("sesion", JSON.stringify(sesion));
        }
        UI.toast("Perfil actualizado", "Tus datos fueron guardados correctamente.", "success");
      } catch (err) {
        console.error("Error guardando perfil:", err);
        UI.toast("Error", _mensajeError(err) || "No se pudo guardar tu perfil.", "error");
      }
    });

    var pass = region.querySelector("#guardar-pass");
    if (pass) pass.addEventListener("click", async function () {
      var actual = (region.querySelector("#perf-pass-actual") || {}).value || "";
      var nueva = (region.querySelector("#perf-pass-nueva") || {}).value || "";
      var confirmar = (region.querySelector("#perf-pass-confirmar") || {}).value || "";
      if (nueva.length < 6) { UI.toast("Contrasena corta", "La nueva contrasena debe tener al menos 6 caracteres.", "error"); return; }
      if (nueva !== confirmar) { UI.toast("No coinciden", "La confirmacion no coincide con la nueva contrasena.", "error"); return; }
      var p = _datosPerfil();
      if (p.demo) { UI.toast("Modo demo", "Inicia sesion para cambiar tu contrasena.", "info"); return; }
      try {
        await api.cambiarContrasena(actual, nueva);
        region.querySelectorAll("#perf-pass-actual, #perf-pass-nueva, #perf-pass-confirmar").forEach(function (i) { i.value = ""; });
        UI.toast("Contrasena actualizada", "Tu contrasena fue cambiada con exito.", "success");
      } catch (err) {
        console.error("Error cambiando contrasena:", err);
        UI.toast("Error", _mensajeError(err) || "No se pudo cambiar la contrasena.", "error");
      }
    });
  }

  /* Registro de vistas */
  App.registerVista("admin", "perfil", rPerfilAdmin, bindPerfilAdmin);
})();