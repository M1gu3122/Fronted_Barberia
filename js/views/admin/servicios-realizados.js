/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Servicios Realizados
   ============================================================ */
(function () {
  "use strict";

  function rServicioRealizado() {
    var d = DB;
    var hoy = d.citasDe({ fecha: d.iso(0) }).filter(function (c) {
      return c.estado !== "cancelada" && c.estado !== "completada";
    });
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Registro de servicio realizado</div><div class="card-sub">Confirma la atencion de una cita</div></div></div>
        ${!hoy.length ? `
          <div class="empty"><div class="empty-ico"><i class="fas fa-scissors"></i></div><div class="empty-title">No hay citas pendientes hoy</div><div class="empty-text">Todas las citas del dia ya fueron atendidas o canceladas.</div></div>
        ` : `
          <div style="padding:14px;display:grid;gap:10px;">
            ${hoy.map(function (c) {
              var cl = d.cliente(c.cliente), s = d.servicio(c.servicio), b = d.barbero(c.barbero);
              return `
                <div class="appt-tile ${c.estado}">
                  <div class="appt-time">${c.hora}</div>
                  <div class="appt-main"><div class="appt-title">${cl.nombre} — ${s.nombre}</div>
                  <div class="appt-sub">${b.nombre} · ${s.duracion} min · ${d.formatPrecio(s.precio)}</div></div>
                  ${UI.estadoBadge(c.estado)}
                  <button class="btn btn-sm btn-primary" data-servicio-realizado="${c.id}"><i class="fas fa-circle-check"></i> Confirmar</button>
                </div>`;
            }).join("")}
          </div>
        `}
      </section>`;
    return html;
  }

  function bindServicioRealizado() {
    var region = App.el("view-region");
    if (!region) return;
    if (region._servicioRealizadoClick) region.removeEventListener("click", region._servicioRealizadoClick);
    region._servicioRealizadoClick = function (e) {
      var btn = e.target.closest("[data-servicio-realizado]");
      if (!btn) return;
      var id = +btn.getAttribute("data-servicio-realizado");
      var c = DB.cita(id), cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio);
      UI.confirm({
        titulo: "Confirmar servicio",
        tipo: "success",
        icono: "fa-circle-check",
        mensaje: `Confirma que el servicio <strong>${s.nombre}</strong> fue realizado a <strong>${cl.nombre}</strong>.`,
        confirmarTexto: "Si, fue realizado",
        onConfirm: function () {
          DB.actualizarEstadoCita(id, "completada");
          UI.toast("Servicio registrado", "La atencion de " + cl.nombre + " fue marcada como completada.", "success");
          App.navigate("servicios-realizados");
        }
      });
    };
    region.addEventListener("click", region._servicioRealizadoClick);
  }

  /* Registro de vistas */
  /* Compartidas con recepcionista */
  App.registerVista("admin", "servicios-realizados", rServicioRealizado, bindServicioRealizado);
  App.registerVista("recepcion", "servicios-realizados", rServicioRealizado, bindServicioRealizado);
})();