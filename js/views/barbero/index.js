/* ============================================================
   Barberia El Corte Perfecto — Vistas del Barbero
   Barbero demo: Andres Duarte (id 1)
   ============================================================ */
(function () {
  "use strict";
  var YO = 1;

  function citasHoy() {
    return DB.citasDe({ barbero: YO, fecha: DB.iso(0) }).filter(function (c) { return c.estado !== "cancelada"; });
  }
  function citasFuturas() {
    return DB.citasDe({ barbero: YO }).filter(function (c) {
      return c.estado !== "completada" && c.estado !== "cancelada" && c.fecha >= DB.iso(0);
    }).sort(function (a, b) { return (a.fecha + a.hora) < (b.fecha + b.hora) ? -1 : 1; });
  }
  function citasHistorial() {
    return DB.citasDe({ barbero: YO }).filter(function (c) { return c.estado === "completada"; })
      .sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
  }

  function tileCita(c, acciones) {
    var cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio);
    return `
      <div class="appt-tile ${c.estado}">
        <div class="appt-time">${c.hora}</div>
        <div class="appt-main"><div class="appt-title">${cl.nombre}</div>
        <div class="appt-sub">${s.nombre} · ${s.duracion} min</div></div>
        <div style="display:flex;align-items:center;gap:8px;">${UI.estadoBadge(c.estado)}${acciones || ""}</div>
      </div>`;
  }


  function rDashboard() {
    var hoy = citasHoy();
    var proxima = hoy.filter(function (c) {
      return c.estado === "pendiente" || c.estado === "confirmada" || c.estado === "espera";
    }).sort(function (a, b) { return a.hora < b.hora ? -1 : 1; })[0];
    var completadas = hoy.filter(function (c) { return c.estado === "completada"; }).length;
    var pendientes = hoy.filter(function (c) { return c.estado === "pendiente" || c.estado === "confirmada"; }).length;
    var enAtencion = hoy.filter(function (c) { return c.estado === "atencion" || c.estado === "espera"; }).length;

    var kpis = [
      [hoy.length, "Citas hoy", "fa-calendar-day", "var(--st-atencion-bg)", "var(--st-atencion)"],
      [enAtencion, "En espera/atencion", "fa-users", "var(--st-pendiente-bg)", "var(--st-pendiente)"],
      [pendientes, "Pendientes", "fa-clock", "var(--bone)", "var(--brass-dim)"],
      [completadas, "Completadas", "fa-circle-check", "var(--st-completada-bg)", "var(--st-completada)"]
    ];

    var html = `
      <section class="card hero-cita">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <span class="avatar avatar-xl" style="background:linear-gradient(135deg,var(--brass-light),var(--brass));">AD</span>
          <div style="flex:1;min-width:220px;">
            <div class="day-pill" style="background:rgba(197,160,89,.16);color:var(--brass-light);">RESUMEN DEL DIA</div>
            <div class="font-display" style="font-size:24px;font-weight:700;color:#fff;margin-top:4px;">Hola, Andres</div>
            <div style="color:#cfccc4;font-size:14px;">${DB.formatFechaLargaConAno(DB.iso(0))} · Tienes ${hoy.length} citas hoy</div>
          </div>
          ${proxima ? `
            <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 18px;min-width:230px;">
              <div class="card-sub" style="color:#cfccc4;">Proxima cita</div>
              <div style="font-size:16px;font-weight:700;color:#fff;">${DB.cliente(proxima.cliente).nombre}</div>
              <div style="color:var(--brass-light);font-size:14px;font-weight:600;">${proxima.hora} hs</div>
            </div>` : ""}
        </div>
      </section>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;">
        ${kpis.map(function (k) {
          return `
            <section class="card kpi"><div class="kpi-top"><span class="kpi-ico" style="background:${k[3]};color:${k[4]};"><i class="fas ${k[2]}"></i></span><span class="kpi-label">${k[1]}</span></div>
              <div class="kpi-value">${k[0]}</div></section>`;
        }).join("")}
      </div>
      <section class="card"><div class="card-header"><div><div class="card-title">Agenda de hoy</div><div class="card-sub">${DB.formatFechaLarga(DB.iso(0))}</div></div>
        <button class="btn btn-sm btn-ghost" style="margin-left:auto;" onclick="App.navigate('agenda')">Ver agenda</button></div>
        <div style="padding:14px;display:grid;gap:8px;">
          ${hoy.length ? hoy.map(function (c) {
            return tileCita(c, `<button class="btn btn-sm btn-ghost" data-ver="${c.id}"><i class="fas fa-eye"></i></button>`);
          }).join("") : `
            <div class="empty" style="padding:34px;"><div class="empty-ico"><i class="fas fa-mug-hot"></i></div><div class="empty-title">Dia libre</div><div class="empty-text">No tienes citas programadas para hoy.</div></div>`}
        </div>
      </section>`;
    return html;
  }

  /* ---------- Agenda (dia / semana) ---------- */
  var agendaModo = "dia";

  function rAgenda() {
    var html = `
      <section class="card"><div class="card-header">
        <div><div class="card-title">Mi agenda</div><div class="card-sub">Distribucion de tus citas</div></div>
        <div style="margin-left:auto;display:flex;gap:6px;" class="tabs" style="border:none;">
          <button class="tab${agendaModo === "dia" ? " active" : ""}" data-modo="dia">Dia</button>
          <button class="tab${agendaModo === "semana" ? " active" : ""}" data-modo="semana">Semana</button>
        </div>
      </div>
      <div class="card-body" style="padding-top:16px;">
        ${agendaModo === "dia" ? agendaDia() : agendaSemana()}
      </div></section>`;
    return html;
  }

  function agendaDia() {
    var citas = DB.citasDe({ barbero: YO, fecha: DB.iso(0) }).filter(function (c) { return c.estado !== "cancelada"; });
    var filas = [];
    for (var h = 9; h <= 18; h++) {
      var hh = String(h).padStart(2, "0") + ":00";
      var delSlot = citas.filter(function (c) { return c.hora.slice(0, 2) === String(h).padStart(2, "0"); });
      filas.push(`
        <div class="agenda-hour">${hh}</div>
        ${delSlot.length ? delSlot.map(function (c) {
          return `<div class="agenda-item">${tileCita(c, `<button class="btn btn-sm btn-ghost" data-ver="${c.id}"><i class="fas fa-eye"></i></button>`)}</div>`;
        }).join("") : `
        <div class="agenda-item"><div style="padding:12px 14px;border-radius:10px;border:1px dashed var(--line);color:var(--mist);font-size:12.5px;">Horario disponible</div></div>`}
      `);
    }
    return `<div class="agenda">${filas.join("")}</div>`;
  }

  function agendaSemana() {
    var dias = [0, 1, 2, 3, 4, 5, 6].map(function (i) {
      var fecha = DB.iso(i);
      return {
        fecha: fecha,
        nombre: DB.formatFechaLarga(fecha).split(",")[0],
        citas: DB.citasDe({ barbero: YO, fecha: fecha }).filter(function (c) { return c.estado !== "cancelada"; })
      };
    });
    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">
        ${dias.map(function (dia) {
          var esHoy = dia.fecha === DB.iso(0);
          return `
            <div class="card" style="${esHoy ? "border-color:var(--brass);" : ""}"><div class="card-header" style="padding:10px 12px;">
              <div class="card-title" style="font-size:13px;text-transform:capitalize;">${dia.nombre}</div>
            </div>
            <div style="padding:10px;display:grid;gap:6px;">
              ${dia.citas.length ? dia.citas.map(function (c) {
                var cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio);
                return `<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;border-radius:7px;padding:6px 8px;background:var(--sand);border-left:3px solid var(--brass);" data-ver="${c.id}" style="cursor:pointer;">
                  <span style="font-weight:700;">${c.hora.slice(0, 5)}</span><span>${cl.nombre}</span></div>`;
              }).join("") : `<div class="cell-muted" style="font-size:12px;text-align:center;padding:8px;">Libre</div>`}
            </div></div>`;
        }).join("")}
      </div>`;
    return html;
  }

  function bindAgenda() {
    var region = App.el("view-region");
    if (!region) return;
    if (region._agendaClick) region.removeEventListener("click", region._agendaClick);
    region._agendaClick = function (e) {
      var tab = e.target.closest("[data-modo]");
      if (tab) {
        agendaModo = tab.getAttribute("data-modo");
        App.navigate("agenda");
      }
    };
    region.addEventListener("click", region._agendaClick);
  }

  /* ---------- Detalle de cita (barbero) ---------- */
  function rDetalleCita(citaId) {
    var c = DB.cita(citaId);
    if (!c) return '<div class="empty"><div class="empty-text">Cita no encontrada.</div></div>';
    var cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio), b = DB.barbero(c.barbero);

    var acciones = "";
    if (c.estado === "pendiente" || c.estado === "confirmada") {
      acciones = `<button class="btn btn-primary" data-estado="espera"><i class="fas fa-user-clock"></i> Marcar en espera</button>`;
    } else if (c.estado === "espera") {
      acciones = `<button class="btn btn-primary" data-estado="atencion"><i class="fas fa-scissors"></i> Marcar en atencion</button>`;
    } else if (c.estado === "atencion") {
      acciones = `
        <button class="btn btn-primary" data-estado="completada"><i class="fas fa-circle-check"></i> Marcar completada</button>
        <button class="btn btn-danger" data-estado="cancelada"><i class="fas fa-xmark"></i> Cancelar</button>`;
    }

    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Detalle de cita #${c.id}</div><div class="card-sub">${DB.formatFechaLargaConAno(c.fecha)} · ${c.hora} hs</div></div>
          <div style="margin-left:auto;">${UI.estadoBadge(c.estado)}</div></div>
        <div class="card-body" style="display:grid;gap:14px;">
          <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--sand);border-radius:10px;">
            <span class="avatar avatar-lg">${DB.getIniciales(cl.nombre)}</span>
            <div><div style="font-size:15px;font-weight:700;">${cl.nombre}</div>
            <div class="cell-muted">${cl.telefono} · ${cl.correo}</div></div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
            ${[["Servicio", s.nombre, "fa-scissors"], ["Barbero", b.nombre, "fa-user-tie"],
               ["Duracion", s.duracion + " min", "fa-hourglass-half"], ["Hora", c.hora + " hs", "fa-clock"]].map(function (f) {
                return `<div style="padding:12px;border:1px solid var(--line);border-radius:9px;"><div class="cell-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:700;">${f[0]}</div>
                  <div style="font-weight:600;font-size:13.5px;margin-top:3px;"><i class="fas ${f[2]}" style="color:var(--brass-dim);margin-right:6px;"></i>${f[1]}</div></div>`;
            }).join("")}
          </div>
        </div>
        <div class="card-footer" style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-ghost" onclick="App.navigate('dashboard')"><i class="fas fa-arrow-left"></i> Volver</button>
          <div style="display:flex;gap:8px;">${acciones}</div>
        </div>
      </section>`;
    return html;
  }

  function bindDetalle() {
    var region = App.el("view-region");
    if (!region) return;
    if (region._detalleClick) region.removeEventListener("click", region._detalleClick);
    region._detalleClick = function (e) {
      var btn = e.target.closest("[data-estado]");
      if (!btn) return;
      var estado = btn.getAttribute("data-estado");
      var citaId = parseInt(document.querySelector("#detalle-cita-id").textContent, 10);
      var msg = {
        espera: "Has marcado al cliente en espera.",
        atencion: "El cliente paso a atencion.",
        completada: "Servicio completado. \u00a1Buen trabajo!",
        cancelada: "La cita fue cancelada."
      };
      DB.actualizarEstadoCita(citaId, estado);
      UI.toast("Estado actualizado", msg[estado] || "Estado actualizado.", estado === "cancelada" ? "info" : "success");
      App.navigate("dashboard");
    };
    region.addEventListener("click", region._detalleClick);
  }

  /* ---------- Mis citas (barbero) ---------- */
  function rMisCitasBarbero() {
    var futuras = citasFuturas();
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Mis citas</div><div class="card-sub">Proximas y pendientes</div></div></div>
        <div style="padding:14px;display:grid;gap:8px;">
          ${!futuras.length ? `
            <div class="empty" style="padding:34px;"><div class="empty-ico"><i class="fas fa-calendar-check"></i></div><div class="empty-title">Sin citas proximas</div><div class="empty-text">Cuando te asignen citas apareceran aqui.</div></div>` : ""}
          ${futuras.map(function (c) {
            var cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio);
            return `
              <div class="appt-tile ${c.estado}">
                <div class="appt-time">${c.hora}</div>
                <div class="appt-main"><div class="appt-title">${cl.nombre}</div>
                <div class="appt-sub">${s.nombre} · ${DB.formatFechaLarga(c.fecha)}</div></div>
                <div style="display:flex;align-items:center;gap:8px;">${UI.estadoBadge(c.estado)}
                  <button class="btn btn-sm btn-ghost" data-ver="${c.id}"><i class="fas fa-eye"></i></button></div>
              </div>`;
          }).join("")}
        </div>
      </section>`;
    return html;
  }

  /* ---------- Historial (barbero) ---------- */
  function rHistorialBarbero() {
    var hist = citasHistorial();
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Citas atendidas</div><div class="card-sub">${hist.length} servicios completados</div></div></div>
        <div class="table-wrap"><table class="table table-responsive"><thead><tr>
          ${["Fecha", "Cliente", "Servicio", "Duracion", "Estado"].map(function (h) { return `<th>${h}</th>`; }).join("")}
        </tr></thead><tbody>
          ${!hist.length ? `
            <tr><td colspan="5"><div class="empty"><div class="empty-ico"><i class="fas fa-clock-rotate-left"></i></div><div class="empty-title">Sin historial</div><div class="empty-text">Aun no has atendido servicios.</div></div></td></tr>` : ""}
          ${hist.map(function (c) {
            var cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio);
            return `
              <tr>
                <td data-label="Fecha"><span class="cell-primary">${DB.formatFechaLarga(c.fecha)}</span></td>
                <td data-label="Cliente">${cl.nombre}</td>
                <td data-label="Servicio">${s.nombre}</td>
                <td data-label="Duracion">${s.duracion} min</td>
                <td data-label="Estado">${UI.estadoBadge(c.estado)}</td>
              </tr>`;
          }).join("")}
        </tbody></table></div>
      </section>`;
    return html;
  }

  /* ---------- Perfil (barbero) ---------- */
  function rPerfilBarbero() {
    var b = DB.barbero(YO);
    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        <section class="card"><div class="card-body" style="text-align:center;">
          <span class="avatar avatar-xl" style="margin:0 auto 14px;display:grid;">AD</span>
          <div class="font-display" style="font-size:22px;font-weight:700;">Andres Duarte</div>
          <div class="card-sub">${b.especialidad} · ${b.experiencia}</div>
          <div style="display:flex;justify-content:center;gap:8px;margin-top:12px;">${UI.badge("activo")}</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line);">
            ${[["14", "Citas"], ["12", "Completadas"], ["2", "Canceladas"]].map(function (k) {
              return `<div style="text-align:center;"><div style="font-size:18px;font-weight:700;">${k[0]}</div><div class="cell-muted" style="font-size:11px;">${k[1]}</div></div>`;
            }).join("")}
          </div>
        </div></section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Datos profesionales</div><div class="card-sub">Tu informacion de trabajo</div></div></div>
          <div class="card-body" style="display:grid;gap:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field"><label class="field-label">Nombre</label><input class="input" value="Andres"></div>
              <div class="field"><label class="field-label">Apellido</label><input class="input" value="Duarte"></div>
            </div>
            <div class="field"><label class="field-label">Especialidad</label><input class="input" value="Fades y cortes clasicos"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field"><label class="field-label">Hora inicio</label><input class="input" type="time" value="09:00"></div>
              <div class="field"><label class="field-label">Hora fin</label><input class="input" type="time" value="18:00"></div>
            </div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end;"><button class="btn btn-primary" id="guardar-perfil"><i class="fas fa-floppy-disk"></i> Guardar cambios</button></div>
        </section>
      </div>`;
    return html;
  }

  /* ---------- Registro ---------- */
  App.registerVista("barbero", "dashboard", rDashboard);
  App.registerVista("barbero", "agenda", rAgenda, bindAgenda);
  App.registerVista("barbero", "mis-citas", rMisCitasBarbero, bindVerCita);
  App.registerVista("barbero", "historial", rHistorialBarbero);
  App.registerVista("barbero", "perfil", rPerfilBarbero, bindPerfilBarbero);
  App.registerVista("barbero", "detalle-cita", rDetalleCita, bindDetalle);

  // ver detalle
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-ver]");
    if (!btn) return;
    var id = parseInt(btn.getAttribute("data-ver"), 10);
    var region = App.el("view-region");
    if (!region) return;
    // solo si estamos en vista barbero con cita
    if (DB.rol !== "barbero") return;
    var html = rDetalleCita(id);
    // coloca el id para detalle
    App.el("page-title").textContent = "Detalle de cita";
    App.el("page-crumb").textContent = "Informacion de la atencion";
    region.innerHTML = html;
    setTimeout(function () {
      var idSpan = document.createElement("span");
      idSpan.id = "detalle-cita-id";
      idSpan.style.display = "none";
      idSpan.textContent = id;
      region.appendChild(idSpan);
      bindDetalle();
    }, 10);
  });

  function bindVerCita() { /* delegado global */ }
  function bindPerfilBarbero() {
    var region = App.el("view-region");
    if (!region) return;
    var btn = region.querySelector("#guardar-perfil");
    if (btn) btn.addEventListener("click", function () {
      UI.toast("Perfil actualizado", "Tus datos fueron guardados correctamente.", "success");
    });
  }
})();

