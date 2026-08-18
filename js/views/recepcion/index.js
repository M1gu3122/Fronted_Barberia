/* ============================================================
   Barberia El Corte Perfecto — Vistas del Recepcionista
   Reutiliza vistas compartidas (citas, horarios, clientes,
   servicios realizados) y define su propio dashboard.
   ============================================================ */
(function () {
  "use strict";

  function rDashboardRecepcion() {
    var d = DB;
    var hoy = d.citasDe({ fecha: d.iso(0) }).filter(function (c) { return c.estado !== "cancelada"; });
    var pendientes = hoy.filter(function (c) { return c.estado === "pendiente" || c.estado === "confirmada"; }).length;
    var completadas = hoy.filter(function (c) { return c.estado === "completada"; }).length;
    var enAtencion = hoy.filter(function (c) { return c.estado === "atencion" || c.estado === "espera"; }).length;

var kpis = [
      [hoy.length, "Citas de hoy", "fa-calendar-day", "var(--st-atencion-bg)", "var(--st-atencion)"],
      [pendientes, "Pendientes", "fa-clock", "var(--st-pendiente-bg)", "var(--st-pendiente)"],
      [enAtencion, "En espera/atencion", "fa-users", "var(--bone)", "var(--brass-dim)"],
      [completadas, "Completadas", "fa-circle-check", "var(--st-completada-bg)", "var(--st-completada)"]
    ];

    var proximas = d.citas.filter(function (c) {
      return c.fecha >= d.iso(0) && c.fecha <= d.iso(2) && c.estado !== "cancelada" && c.estado !== "completada";
    }).sort(function (a, b) { return (a.fecha + a.hora) < (b.fecha + b.hora) ? -1 : 1; }).slice(0, 5);

    var html = `
      <section class="card hero-cita">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <span class="avatar avatar-xl" style="background:linear-gradient(135deg,var(--brass-light),var(--brass));">RM</span>
          <div style="flex:1;min-width:220px;">
            <div class="day-pill" style="background:rgba(197,160,89,.16);color:var(--brass-light);">RECEPCION</div>
            <div class="font-display" style="font-size:24px;font-weight:700;color:#fff;margin-top:4px;">Hola, Rosa Maria</div>
            <div style="color:#cfccc4;font-size:14px;">${d.formatFechaLargaConAno(d.iso(0))} · ${hoy.length} citas por atender hoy</div>
          </div>
          <button class="btn btn-primary" style="background:var(--brass-light);" onclick="App.navigate('servicios-realizados')"><i class="fas fa-scissors"></i> Registrar servicio</button>
        </div>
      </section>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;">
        ${kpis.map(function (k) {
          return `
            <section class="card kpi"><div class="kpi-top"><span class="kpi-ico" style="background:${k[3]};color:${k[4]};"><i class="fas ${k[2]}"></i></span><span class="kpi-label">${k[1]}</span></div>
              <div class="kpi-value">${k[0]}</div></section>`;
        }).join("")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;">
        <section class="card"><div class="card-header"><div><div class="card-title">Citas de hoy</div><div class="card-sub">Atencion del dia</div></div>
          <button class="btn btn-sm btn-ghost" style="margin-left:auto;" onclick="App.navigate('citas')">Gestionar</button></div>
          <div style="padding:12px;display:grid;gap:8px;">
            ${hoy.slice(0, 5).map(function (c) {
              var cl = d.cliente(c.cliente), s = d.servicio(c.servicio), b = d.barbero(c.barbero);
              return `
                <div class="appt-tile ${c.estado}">
                  <div class="appt-time">${c.hora}</div>
                  <div class="appt-main"><div class="appt-title">${cl.nombre}</div>
                  <div class="appt-sub">${s.nombre} · ${b.nombre}</div></div>
                  ${UI.estadoBadge(c.estado)}
                  <button class="btn btn-sm btn-primary" data-servicio-realizado="${c.id}" style="${c.estado === "pendiente" || c.estado === "confirmada" ? "" : "display:none;"}"><i class="fas fa-circle-check"></i></button>
                </div>`;
            }).join("")}
          </div>
        </section>
        <section class="card"><div class="card-header"><div><div class="card-title">Proximas citas</div><div class="card-sub">Los proximos 3 dias</div></div></div>
          <div style="padding:12px;display:grid;gap:8px;">
            ${proximas.length ? proximas.map(function (c) {
              var cl = d.cliente(c.cliente), s = d.servicio(c.servicio), b = d.barbero(c.barbero);
              return `
                <div class="appt-tile ${c.estado}">
                  <div class="appt-time">${c.hora}</div>
                  <div class="appt-main"><div class="appt-title">${cl.nombre}</div>
                  <div class="appt-sub">${s.nombre} · ${b.nombre} · ${d.formatFechaLarga(c.fecha)}</div></div>
                  ${UI.estadoBadge(c.estado)}
                </div>`;
            }).join("") : `<div class="cell-muted" style="text-align:center;padding:20px;">Sin citas proximas.</div>`}
          </div>
        </section>
        <section class="card"><div class="card-header"><div><div class="card-title">Horarios disponibles hoy</div><div class="card-sub">Por barbero</div></div>
          <button class="btn btn-sm btn-ghost" style="margin-left:auto;" onclick="App.navigate('horarios')">Ver todos</button></div>
          <div style="padding:12px;display:grid;gap:8px;">
            ${d.barberos.filter(function (b) { return b.activo; }).slice(0, 4).map(function (b) {
              var libres = d.horariosLibres(b.id, d.iso(0)).filter(function (s) { return s.libre; });
              return `
                <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--sand);border-radius:9px;">
                  ${UI.avatar(b.nombre, "avatar-sm")}
                  <div style="flex:1;"><span style="font-weight:600;font-size:13.5px;">${b.nombre}</span></div>
                  <span class="badge badge-completada badge-dotless">${libres.length} libres</span>
                </div>`;
            }).join("")}
          </div>
        </section>
      </div>`;
    return html;
  }

  /* Perfil recepcionista */
function rPerfilRecepcion() {
    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        <section class="card"><div class="card-body" style="text-align:center;">
          <span class="avatar avatar-xl" style="margin:0 auto 14px;display:grid;">RM</span>
          <div class="font-display" style="font-size:22px;font-weight:700;">Rosa Maria</div>
          <div class="card-sub">Recepcionista de la barberia</div>
          <div style="display:flex;justify-content:center;margin-top:12px;">${UI.badge("activo")}</div>
        </div></section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Datos de la cuenta</div></div></div>
          <div class="card-body" style="display:grid;gap:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field"><label class="field-label">Nombre</label><input class="input" value="Rosa Maria"></div>
              <div class="field"><label class="field-label">Apellido</label><input class="input" value="Cardenas"></div>
            </div>
            <div class="field"><label class="field-label">Correo</label><input class="input" type="email" value="recepcion@corteperfecto.com"></div>
            <div class="field"><label class="field-label">Telefono</label><input class="input" value="301 222 3344"></div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end;"><button class="btn btn-primary" id="guardar-perfil"><i class="fas fa-floppy-disk"></i> Guardar</button></div>
        </section>
      </div>`;
    return html;
  }

  App.registerVista("recepcion", "dashboard", rDashboardRecepcion, bindRecepcionDashboard);
  App.registerVista("recepcion", "perfil", rPerfilRecepcion, function () {
    var region = App.el("view-region");
    var btn = region && region.querySelector("#guardar-perfil");
    if (btn) btn.addEventListener("click", function () {
      UI.toast("Perfil actualizado", "Tus datos fueron guardados correctamente.", "success");
    });
  });

  function bindRecepcionDashboard() {
    var region = App.el("view-region");
    if (!region) return;
if (region._recepcionClick) region.removeEventListener("click", region._recepcionClick);
    region._recepcionClick = function (e) {
      var btn = e.target.closest("[data-servicio-realizado]");
      if (!btn) return;
      var id = +btn.getAttribute("data-servicio-realizado");
      var c = DB.cita(id), cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio);
      UI.confirm({
        titulo: "Registrar servicio",
        tipo: "success",
        icono: "fa-circle-check",
        mensaje: `Confirma que <strong>${s.nombre}</strong> fue realizado a <strong>${cl.nombre}</strong>.`,
        confirmarTexto: "Si, fue realizado",
        onConfirm: function () {
          DB.actualizarEstadoCita(id, "completada");
          UI.toast("Servicio registrado", "La atencion de " + cl.nombre + " fue completada.", "success");
          App.navigate("dashboard");
        }
      });
    };
    region.addEventListener("click", region._recepcionClick);
  }
})();
