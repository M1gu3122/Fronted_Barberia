/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Perfil
   ============================================================ */
(function () {
  "use strict";

  function rPerfilAdmin() {
    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        <section class="card">
          <div class="card-body" style="text-align:center;">
            <span class="avatar avatar-xl" style="margin:0 auto 14px;display:grid;">AR</span>
            <div class="font-display" style="font-size:22px;font-weight:700;">Andres Reyes</div>
            <div class="card-sub">Administrador de la barberia</div>
            <div style="display:flex;justify-content:center;margin-top:12px;">${UI.badge("activo")}</div>
          </div>
        </section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Datos de la cuenta</div></div></div>
          <div class="card-body" style="display:grid;gap:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field"><label class="field-label">Nombre</label><input class="input" value="Andres"></div>
              <div class="field"><label class="field-label">Apellido</label><input class="input" value="Reyes"></div>
            </div>
            <div class="field"><label class="field-label">Correo</label><input class="input" type="email" value="admin@corteperfecto.com"></div>
            <div class="field"><label class="field-label">Telefono</label><input class="input" value="300 456 7890"></div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end;"><button class="btn btn-primary" id="guardar-perfil"><i class="fas fa-floppy-disk"></i> Guardar</button></div>
        </section>
      </div>`;
    return html;
  }

  function bindPerfilAdmin() {
    var region = App.el("view-region");
    if (!region) return;
    var btn = region.querySelector("#guardar-perfil");
    if (btn) btn.addEventListener("click", async function () {
      UI.toast("Perfil actualizado", "Tus datos fueron guardados correctamente.", "success");
    });
  }

  /* Registro de vistas */
  App.registerVista("admin", "perfil", rPerfilAdmin, bindPerfilAdmin);
})();