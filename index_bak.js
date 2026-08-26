/* ============================================================
   Barberia El Corte Perfecto — Vistas del Cliente
   ============================================================ */
(function () {
  "use strict";

  function rDashboard() {
    var d = DB;
    var misCitas = d.citas.filter(function (c) { return c.cliente === 1; });
    var proxima = misCitas.filter(function (c) {
      return c.estado !== "completada" && c.estado !== "cancelada";
    }).sort(function (a, b) { return (a.fecha + a.hora) < (b.fecha + a.hora) ? -1 : 1; })[0];
    var completadas = misCitas.filter(function (c) { return c.estado === "completada"; }).length;
    var pendientes = misCitas.filter(function (c) { return c.estado === "pendiente" || c.estado === "confirmada"; }).length;
    var canceladas = misCitas.filter(function (c) { return c.estado === "cancelada"; }).length;

    api.getProximasCitas().then(function (data) {
      var apiProximas = data || [];
      var s = proxima ? d.servicio(proxima.servicio) : null;
      var b = proxima ? d.barbero(proxima.barbero) : null;
    });
    var futuras = misCitas.filter(function (c) {
      return c.estado !== "cancelada" && c.fecha >= d.iso(0);
    }).sort(function (a, b) { return (a.fecha + a.hora) < (b.fecha + b.hora) ? -1 : 1; }).slice(0, 3);

    var html = `
      ${proxima ? `
        <section class="card hero-cita">
          <div style="position:absolute;right:-60px;top:-60px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(197,160,89,.18),transparent 70%);"></div>
          <div style="display:grid;gap:6px;position:relative;">
            <div class="day-pill" style="background:rgba(197,160,89,.16);color:var(--brass-light);justify-self:start;">PROXIMA CITA</div>
            <div class="font-display" style="font-size:26px;font-weight:700;color:#fff;margin-top:4px;">${s.nombre}</div>
            <div style="color:#cfccc4;font-size:14px;">${d.formatFechaLargaConAno(proxima.fecha)} · ${proxima.hora} hs</div>
            <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:13px;color:#cfccc4;">
              <span><i class="fas fa-user-tie" style="color:var(--brass-light);margin-right:6px;"></i>${b.nombre}</span>
              <span><i class="fas fa-clock" style="color:var(--brass-light);margin-right:6px;"></i>${s.duracion} min</span>
              <span><i class="fas fa-tag" style="color:var(--brass-light);margin-right:6px;"></i>${d.formatPrecio(s.precio)}</span>
              <span>${UI.estadoBadge(proxima.estado)}</span>
            </div>
            <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="App.navigate('mis-citas')"><i class="fas fa-calendar-check"></i> Ver mi cita</button>
              <button class="btn btn-ghost" style="border-color:rgba(255,255,255,.25);color:#fff;" onclick="App.navigate('reservar')"><i class="fas fa-pen"></i> Reprogramar</button>
            </div>
          </div>
        </section>` : `
        <section class="card empty" style="border:1px dashed var(--line);">
          <div class="empty-ico"><i class="fas fa-calendar-plus"></i></div>
          <div class="empty-title">No tienes citas proximas</div>
          <div class="empty-text">Reserva tu proximo corte y mantente siempre con estilo.</div>
          <button class="btn btn-primary" onclick="App.navigate('reservar')"><i class="fas fa-calendar-plus"></i> Reservar cita</button>
        </section>`}
      <section class="card" style="padding:6px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;padding:8px;">
          ${[["Reservar cita", "fa-calendar-plus", "reservar"],
      ["Mis citas", "fa-calendar-check", "mis-citas"],
      ["Historial", "fa-clock-rotate-left", "historial"],
      ["Notificaciones", "fa-bell", "notificaciones"]].map(function (a) {
        return `<button onclick="App.navigate('${a[2]}')" class="btn btn-ghost" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 8px;border-radius:10px;">
                <i class="fas ${a[1]}" style="font-size:20px;color:var(--brass-dim);"></i><span>${a[0]}</span></button>`;
      }).join("")}
        </div>
      </section>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;">
        ${[[completadas, "Cortes completados", "fa-scissors"], [pendientes, "Citas por venir", "fa-calendar-day"], [canceladas, "Cancelaciones", "fa-ban"]].map(function (k) {
        return `<section class="card kpi"><div class="kpi-top"><span class="kpi-ico" style="background:var(--bone);color:var(--brass-dim);"><i class="fas ${k[2]}"></i></span><span class="kpi-label">${k[1]}</span></div>
            <div class="kpi-value">${k[0]}</div></section>`;
      }).join("")}
      </div>
      <section class="card"><div class="card-header"><div><div class="card-title">Proximas citas</div><div class="card-sub">Tus proximos compromisos</div></div>
        <button class="btn btn-sm btn-ghost" style="margin-left:auto;" onclick="App.navigate('mis-citas')">Ver todas</button></div>
        <div style="padding:10px 14px;">
          ${futuras.length ? futuras.map(function (c) {
        var s = d.servicio(c.servicio), b = d.barbero(c.barbero);
        return `
              <div class="appt-tile ${c.estado}">
                <div class="appt-time">${c.hora}</div>
                <div class="appt-main"><div class="appt-title">${s.nombre}</div>
                <div class="appt-sub">${b.nombre} · ${d.formatFechaLarga(c.fecha)}</div></div>
                <div>${UI.estadoBadge(c.estado)}</div>
              </div>`;
      }).join("") : `<div class="empty" style="padding:30px;"><div class="empty-text" style="margin:0;">Aun no tienes citas programadas.</div></div>`}
        </div>
      </section>`;
    return html;
  }
  /* ---------- Reservar cita (5 pasos) ---------- */
  var reserva = { paso: 1, servicio: null, barbero: null, fecha: null, hora: null };

  function rReservar() {
    var pasos = ["Servicio", "Barbero", "Fecha", "Hora", "Confirmacion"];

    var html = `
      <section class="card" style="padding:18px 20px;">
        <div class="steps">
          ${pasos.map(function (p, i) {
      var n = i + 1;
      var cls = n === reserva.paso ? "active" : (n < reserva.paso ? "done" : "");
      return `
              <div class="step ${cls}"><span class="step-dot">${n < reserva.paso ? '\u2713' : n}</span>
                <span class="step-label">${p}</span></div>
              ${n < pasos.length ? '<div class="step-line"></div>' : ""}`;
    }).join("")}
        </div>
      </section>
      <div id="reserva-panel" style="margin-top:16px;">
        ${reserva.paso === 1 ? pasoServicio() :
        (reserva.paso === 2 ? pasoBarbero() :
          (reserva.paso === 3 ? pasoFecha() :
            (reserva.paso === 4 ? pasoHora() : pasoConfirmacion())))}
      </div>`;

    return html;
  }

  function pasoServicio() {
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Selecciona el servicio</div><div class="card-sub">Elige el estilo que quieres</div></div></div>
        <div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
          ${DB.servicios.filter(function (s) { return s.activo; }).map(function (s) {
      var sel = reserva.servicio === s.id ? " selected" : "";
      return `
              <div class="service-card${sel}" data-sel="servicio" data-id="${s.id}">
                <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${s.nombre}</div>
                <div class="cell-muted" style="font-size:12.5px;margin-bottom:10px;">${s.descripcion}</div>
                <div style="display:flex;gap:12px;align-items:center;font-size:12.5px;color:var(--smoke);">
                  <span><i class="fas fa-clock" style="color:var(--brass-dim);margin-right:4px;"></i>${s.duracion} min</span>
                  <span style="font-weight:700;color:var(--brass-dim);margin-left:auto;">${DB.formatPrecio(s.precio)}</span>
                </div>
              </div>`;
    }).join("")}
        </div></div>
        <div class="card-footer" style="display:flex;justify-content:flex-end;gap:10px;">
          <button class="btn btn-primary" id="reserva-next" ${reserva.servicio ? "" : "disabled"}>Continuar <i class="fas fa-arrow-right"></i></button>
        </div>
      </section>`;
    return html;
  }

  function pasoBarbero() {
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Elige tu barbero</div><div class="card-sub">Todos son profesionales certificados</div></div></div>
        <div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
          ${DB.barberos.filter(function (b) { return b.activo; }).map(function (b) {
      var sel = reserva.barbero === b.id ? " selected" : "";
      return `
              <div class="barber-card${sel}" data-sel="barbero" data-id="${b.id}">
                <span class="avatar avatar-lg">${DB.getIniciales(b.nombre)}</span>
                <div><div style="font-size:14.5px;font-weight:700;">${b.nombre}</div>
                <div class="cell-muted" style="font-size:12px;margin-bottom:4px;">${b.especialidad}</div>
                <div style="font-size:12px;color:var(--st-completada);"><i class="fas fa-circle-check"></i> Disponible hoy</div></div>
              </div>`;
    }).join("")}
        </div></div>
        <div class="card-footer" style="display:flex;justify-content:space-between;gap:10px;">
          <button class="btn btn-ghost" onclick="App.goReserva(1)"><i class="fas fa-arrow-left"></i> Atras</button>
          <button class="btn btn-primary" id="reserva-next" ${reserva.barbero ? "" : "disabled"}>Continuar <i class="fas fa-arrow-right"></i></button>
        </div>
      </section>`;
    return html;
  }

  function pasoFecha() {
    var today = new Date();
    var mes = today.getMonth(), ano = today.getFullYear();
    var primero = new Date(ano, mes, 1);
    var diaSemanaInicio = primero.getDay();
    var diasEnMes = new Date(ano, mes + 1, 0).getDate();
    var nomMes = primero.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

    var celdas = [];
    for (var i = 0; i < diaSemanaInicio; i++) celdas.push('<div class="cal-day other"></div>');
    for (var dia = 1; dia <= diasEnMes; dia++) {
      var d = new Date(ano, mes, dia);
      var fechaIso = DateUtils.fromDate(d);
      var cls = "cal-day";
      if (fechaIso === DB.iso(0)) cls += " today";
      if (fechaIso === reserva.fecha) cls += " selected";
      if (d < today) cls += " other";
      var dots = (DB.citas.filter(function (c) { return c.fecha === fechaIso && c.estado !== "cancelada"; }).length > 0) ? '<span class="cdot"></span>' : "";
      celdas.push(`<button type="button" class="${cls}" data-fecha="${fechaIso}"${d < today ? " disabled" : ""}>${dia}${dots}</button>`);
    }

    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Selecciona la fecha</div><div class="card-sub" style="text-transform:capitalize;">${nomMes}</div></div></div>
        <div class="card-body">
          <div class="cal-head">${["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map(function (d) { return `<span>${d}</span>`; }).join("")}</div>
          <div class="cal-grid">${celdas.join("")}</div>
        </div>
        <div class="card-footer" style="display:flex;justify-content:space-between;gap:10px;">
          <button class="btn btn-ghost" onclick="App.goReserva(2)"><i class="fas fa-arrow-left"></i> Atras</button>
          <button class="btn btn-primary" id="reserva-next" ${reserva.fecha ? "" : "disabled"}>Continuar <i class="fas fa-arrow-right"></i></button>
        </div>
      </section>`;
    return html;
  }

  function pasoHora() {
    var slots = DB.horariosLibres(reserva.barbero, reserva.fecha);
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Selecciona la hora</div><div class="card-sub">Solo se muestran horarios disponibles</div></div></div>
        <div class="card-body">
          ${UI.timeGrid(slots, reserva.hora)}
          <div style="display:flex;gap:12px;margin-top:16px;font-size:12.5px;color:var(--smoke);">
            <span><span class="badge badge-completada badge-dotless">Disponible</span></span>
            <span><span class="badge badge-neutral badge-dotless">Ocupado</span></span>
          </div>
        </div>
        <div class="card-footer" style="display:flex;justify-content:space-between;gap:10px;">
          <button class="btn btn-ghost" onclick="App.goReserva(3)"><i class="fas fa-arrow-left"></i> Atras</button>
          <button class="btn btn-primary" id="reserva-next" ${reserva.hora ? "" : "disabled"}>Continuar <i class="fas fa-arrow-right"></i></button>
        </div>
      </section>`;
    return html;
  }

  function pasoConfirmacion() {
    var s = DB.servicio(reserva.servicio), b = DB.barbero(reserva.barbero);
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Confirma tu cita</div><div class="card-sub">Revisa que todo este en orden</div></div></div>
        <div class="card-body">
          <div style="display:grid;gap:14px;">
            ${[
        ["Servicio", s.nombre + " (" + s.duracion + " min)", "fa-scissors"],
        ["Barbero", b.nombre + " — " + b.especialidad, "fa-user-tie"],
        ["Fecha", DB.formatFechaLargaConAno(reserva.fecha), "fa-calendar-day"],
        ["Hora", reserva.hora + " hs", "fa-clock"],
        ["Duracion", s.duracion + " minutos", "fa-hourglass-half"],
        ["Precio", DB.formatPrecio(s.precio), "fa-tag"]
      ].map(function (f) {
        return `
                <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--sand);border-radius:9px;">
                  <span class="kpi-ico" style="background:var(--bone);color:var(--brass-dim);"><i class="fas ${f[2]}"></i></span>
                  <div style="flex:1;"><div class="cell-muted" style="font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;font-weight:700;">${f[0]}</div>
                  <div style="font-weight:600;font-size:14px;">${f[1]}</div></div>
                </div>`;
      }).join("")}
          </div>
        </div>
        <div class="card-footer" style="display:flex;justify-content:space-between;gap:10px;">
          <button class="btn btn-ghost" onclick="App.goReserva(4)"><i class="fas fa-arrow-left"></i> Atras</button>
          <button class="btn btn-primary" id="reserva-confirmar"><i class="fas fa-circle-check"></i> Confirmar cita</button>
        </div>
      </section>`;
    return html;
  }

  function bindReserva() {
    var panel = App.el("reserva-panel");
    if (!panel) return;
    panel.addEventListener("click", function (e) {
      var sel = e.target.closest("[data-sel]");
      if (sel) {
        var tipo = sel.getAttribute("data-sel");
        var id = parseInt(sel.getAttribute("data-id"), 10);
        if (tipo === "servicio") reserva.servicio = id;
        if (tipo === "barbero") reserva.barbero = id;
        document.querySelectorAll("#reserva-panel [data-sel]").forEach(function (el) { el.classList.remove("selected"); });
        sel.classList.add("selected");
        var next = App.el("reserva-next");
        if (next) next.disabled = false;
      }
      var fechaBtn = e.target.closest("[data-fecha]");
      if (fechaBtn) {
        reserva.fecha = fechaBtn.getAttribute("data-fecha");
        document.querySelectorAll("#reserva-panel [data-fecha]").forEach(function (el) { el.classList.remove("selected"); });
        fechaBtn.classList.add("selected");
        var next2 = App.el("reserva-next");
        if (next2) next2.disabled = false;
      }
      var horaBtn = e.target.closest(".time-slot:not(.taken)");
      if (horaBtn) {
        reserva.hora = horaBtn.getAttribute("data-hora");
        document.querySelectorAll("#reserva-panel .time-slot").forEach(function (el) { el.classList.remove("selected"); });
        horaBtn.classList.add("selected");
        var next3 = App.el("reserva-next");
        if (next3) next3.disabled = false;
      }
      var nextBtn = e.target.closest("#reserva-next");
      if (nextBtn) { App.goReserva(reserva.paso + 1); }
      var confirmar = e.target.closest("#reserva-confirmar");
      if (confirmar) {
        confirmar.classList.add("btn-loading");
        (async function () {
          try {
            var s = DB.servicio(reserva.servicio);
            var b = DB.barbero(reserva.barbero);
            await api.crearCita({
              id_usuario: 1, // TODO: obtener ID de cliente de la sesión
              servicio: reserva.servicio,
              barbero: reserva.barbero,
              fecha: reserva.fecha,
              hora: reserva.hora,
              estado: "confirmada"
            });
            UI.toast("Cita reservada", "Tu cita fue agendada con exito. Te enviamos la confirmacion.", "success");
          } catch (err) {
            UI.toast("Error", err.message || "No se pudo reservar la cita.", "error");
          }
          reserva = { paso: 1, servicio: null, barbero: null, fecha: null, hora: null };
          App.navigate("mis-citas");
        })();
      }
    });
  }
  /* ---------- Mis citas ---------- */
  function rMisCitas() {
    var d = DB;
    var mis = d.citas.filter(function (c) { return c.cliente === 1; });
    var activas = mis.filter(function (c) { return c.estado !== "completada" && c.estado !== "cancelada"; })
      .sort(function (a, b) { return (a.fecha + a.hora) < (b.fecha + b.hora) ? -1 : 1; });
    var pasadas = mis.filter(function (c) { return c.estado === "completada" || c.estado === "cancelada"; })
      .sort(function (a, b) { return (a.fecha + a.hora) > (b.fecha + b.hora) ? -1 : 1; });

    function tile(c) {
      var s = d.servicio(c.servicio), b = d.barbero(c.barbero);
      var acciones = "";
      if (c.estado === "pendiente" || c.estado === "confirmada") {
        acciones = `
          <button class="btn btn-sm btn-ghost" data-cita="${c.id}" data-accion="ver"><i class="fas fa-eye"></i></button>
          <button class="btn btn-sm btn-ghost" data-cita="${c.id}" data-accion="reprogramar"><i class="fas fa-pen"></i> Reprogramar</button>
          <button class="btn btn-sm btn-danger" data-cita="${c.id}" data-accion="cancelar"><i class="fas fa-xmark"></i> Cancelar</button>`;
      }
      return `
        <div class="appt-tile ${c.estado}">
          <div class="appt-time">${c.hora}</div>
          <div class="appt-main"><div class="appt-title">${s.nombre}</div>
          <div class="appt-sub">${b.nombre} · ${d.formatFechaLarga(c.fecha)} · ${s.duracion} min</div></div>
          <div style="display:flex;align-items:center;gap:10px;">${UI.estadoBadge(c.estado)}${acciones}</div>
        </div>`;
    }

    var html = `
      <section class="card"><div class="card-header"><div><div class="card-title">Proximas citas</div><div class="card-sub">${activas.length} programadas</div></div></div>
        <div style="padding:14px;display:grid;gap:8px;">
          ${activas.length ? activas.map(tile).join("") :
        `<div class="empty" style="padding:34px;"><div class="empty-ico"><i class="fas fa-calendar-check"></i></div><div class="empty-title">Sin citas proximas</div><div class="empty-text">Reserva tu proximo corte ahora.</div><button class="btn btn-primary" onclick="App.navigate('reservar')">Reservar</button></div>`}
        </div>
      </section>
      <section class="card" style="margin-top:16px;"><div class="card-header"><div><div class="card-title">Citas anteriores</div><div class="card-sub">${pasadas.length} registros</div></div></div>
        <div style="padding:14px;display:grid;gap:8px;">
          ${pasadas.length ? pasadas.slice(0, 6).map(tile).join("") :
        `<div class="empty" style="padding:34px;"><div class="empty-text" style="margin:0;">Aun no tienes historial.</div></div>`}
        </div>
      </section>`;

    return html;
  }

  function bindMisCitas() {
    var region = App.el("view-region");
    if (!region) return;
    if (region._misCitasClick) region.removeEventListener("click", region._misCitasClick);
    region._misCitasClick = function (e) {
      var btn = e.target.closest("[data-accion]");
      if (!btn) return;
      var citaId = parseInt(btn.getAttribute("data-cita"), 10);
      var accion = btn.getAttribute("data-accion");
      var c = DB.cita(citaId);
      var s = DB.servicio(c.servicio), b = DB.barbero(c.barbero);

      if (accion === "cancelar") {
        UI.confirm({
          titulo: "Cancelar cita",
          tipo: "danger",
          icono: "fa-xmark",
          mensaje: `Vas a cancelar tu cita de <strong>${s.nombre}</strong> con ${b.nombre} el ${DB.formatFechaLarga(c.fecha)} a las ${c.hora}.`,
          confirmarTexto: "Cancelar cita",
          onConfirm: async function () {
            try {
              await api.cancelarCita(citaId);
              UI.toast("Cita cancelada", "Hemos notificado al barbero del cambio.", "info");
            } catch (err) {
              UI.toast("Error", err.message || "No se pudo cancelar la cita.", "error");
            }
            App.navigate("mis-citas");
          }
        });
      }
      if (accion === "reprogramar") {
        App.reservarPara = { id: citaId, servicio: c.servicio, barbero: c.barbero };
        App.navigate("reprogramar");
      }
      if (accion === "ver") {
        UI.modal({
          titulo: "Detalle de cita",
          icon: '<i class="fas fa-calendar-check"></i>',
          body:
            `
            <div style="display:grid;gap:12px;">
              ${[["Servicio", s.nombre], ["Barbero", b.nombre + " — " + b.especialidad],
            ["Fecha", DB.formatFechaLargaConAno(c.fecha)], ["Hora", c.hora + " hs"],
            ["Duracion", s.duracion + " min"], ["Estado", UI.estadoBadge(c.estado)]].map(function (f) {
              return `<div style="display:flex;justify-content:space-between;gap:10px;padding-bottom:8px;border-bottom:1px solid var(--line);">
                    <span class="cell-muted">${f[0]}</span><span style="font-weight:600;text-align:right;">${f[1]}</span></div>`;
            }).join("")}
            </div>
            `,
          footer: `<button class="btn btn-ghost" data-close-modal>Cerrar</button>`
        });
        setTimeout(function () {
          var close = document.querySelector("[data-close-modal]");
          if (close) close.addEventListener("click", function () {
            document.querySelectorAll(".modal-overlay").forEach(function (o) { o.remove(); });
          });
        }, 50);
      }
    };
    region.addEventListener("click", region._misCitasClick);
  }

  /* ---------- Reprogramar cita ---------- */
  function rReprogramar() {
    var orig = DB.cita(App.reservarPara ? App.reservarPara.id : 1013);
    if (!orig) return '<div class="empty"><div class="empty-text">Cita no encontrada.</div></div>';
    var s = DB.servicio(orig.servicio), b = DB.barbero(orig.barbero);
    var reservaActual = App.reservarPara || {};
    var fechaSel = reservaActual.nuevaFecha || DB.iso(2);
    var horaSel = reservaActual.nuevaHora || "";
    var slots = DB.horariosLibres(reservaActual.barbero || orig.barbero, fechaSel);

    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Reprogramar cita</div><div class="card-sub">Selecciona nueva fecha y hora</div></div></div>
        <div class="card-body">
          <div style="display:grid;gap:10px;margin-bottom:20px;">
            <div class="appt-tile ${orig.estado}">
              <div class="appt-time">${orig.hora}</div>
              <div class="appt-main"><div class="appt-title">${s.nombre} — Actual</div>
              <div class="appt-sub">${b.nombre} · ${DB.formatFechaLarga(orig.fecha)}</div></div>
              <div>${UI.estadoBadge(orig.estado)}</div>
            </div>
          </div>
          <div class="field"><label class="field-label">Nueva fecha <span class="req">*</span></label>
            <input type="date" class="input" id="reprogramar-fecha" value="${fechaSel}" min="${DB.iso(1)}">
          </div>
          <div class="field" style="margin-top:16px;"><label class="field-label">Nuevos horarios disponibles <span class="req">*</span></label>
            <div id="reprogramar-horas">${UI.timeGrid(slots, horaSel)}</div>
          </div>
        </div>
        <div class="card-footer" style="display:flex;justify-content:space-between;gap:10px;">
          <button class="btn btn-ghost" onclick="App.navigate('mis-citas')">Cancelar</button>
          <button class="btn btn-primary" id="reprogramar-confirmar" ${horaSel ? "" : "disabled"}><i class="fas fa-circle-check"></i> Confirmar cambio</button>
        </div>
      </section>`;
    return html;
  }

  function bindReprogramar() {
    var region = App.el("view-region");
    if (!region) return;
    if (region._reprogramarClick) region.removeEventListener("click", region._reprogramarClick);
    region._reprogramarClick = function (e) {
      var fecha = e.target.closest("#reprogramar-fecha");
      if (fecha) {
        var val = fecha.value;
        if (val) {
          App.reservarPara.nuevaFecha = val;
          App.reservarPara.nuevaHora = "";
          App.navigate("reprogramar");
        }
      }
      var slot = e.target.closest(".time-slot:not(.taken)");
      if (slot) {
        App.reservarPara.nuevaHora = slot.getAttribute("data-hora");
        document.querySelectorAll(".time-slot").forEach(function (el) { el.classList.remove("selected"); });
        slot.classList.add("selected");
        var b = App.el("reprogramar-confirmar");
        if (b) b.disabled = false;
      }
      var confirmar = e.target.closest("#reprogramar-confirmar");
      if (confirmar) {
        confirmar.classList.add("btn-loading");
        (async function () {
          try {
            await api.actualizarCita(App.reservarPara.id, {
              fecha: App.reservarPara.nuevaFecha,
              hora: App.reservarPara.nuevaHora
            });
            UI.toast("Cita reprogramada", "Tu cita fue movida al " + App.reservarPara.nuevaFecha + " a las " + App.reservarPara.nuevaHora + ".", "success");
          } catch (err) {
            UI.toast("Error", err.message || "No se pudo reprogramar la cita.", "error");
          }
          App.reservarPara = null;
          App.navigate("mis-citas");
        })();
      }
    };
    region.addEventListener("click", region._reprogramarClick);
  }

  /* ---------- Historial ---------- */
  function rHistorial() {
    api.obtenerCitasDetalle().then(function (data) {
      var historial = [];
      if (data && data.length) {
        historial = data.filter(function (c) { return c.cliente === 1 && c.estado === "completada"; })
          .sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
      }
      if (!historial.length) {
        historial = DB.citas.filter(function (c) { return c.cliente === 1 && c.estado === "completada"; })
          .sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
      }

      var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Historial de servicios</div><div class="card-sub">${historial.length} servicios realizados</div></div></div>
        <div class="table-wrap"><table class="table table-responsive">
          <thead><tr>
            ${["Fecha", "Servicio", "Barbero", "Duracion", "Estado"].map(function (h) { return `<th>${h}</th>`; }).join("")}
          </tr></thead>
          <tbody>
            ${!historial.length ? `
              <tr><td colspan="5"><div class="empty"><div class="empty-ico"><i class="fas fa-clock-rotate-left"></i></div><div class="empty-title">Sin historial aun</div><div class="empty-text">Cuando completes tu primer servicio aparecera aqui.</div></div></td></tr>` : ""}
            ${historial.map(function (c) {
        var s = d.servicio(c.servicio), b = d.barbero(c.barbero);
        return `
                <tr>
                  <td data-label="Fecha"><span class="cell-primary">${d.formatFechaLarga(c.fecha)}</span></td>
                  <td data-label="Servicio">${s.nombre}</td>
                  <td data-label="Barbero">${b.nombre}</td>
                  <td data-label="Duracion">${s.duracion} min</td>
                  <td data-label="Estado">${UI.estadoBadge(c.estado)}</td>
                </tr>`;
      }).join("")}
          </tbody>
        </table></div>
      </section>`;
      return html;
    })
  }
  /* ---------- Notificaciones ---------- */
  function rNotificaciones() {
    api.obtenerCitasDetalle().then(function (data) {
      var tipos = { cita: ["cita", "fa-calendar-check"], cambio: ["cambio", "fa-arrows-rotate"], cancel: ["cancel", "fa-xmark"], record: ["record", "fa-bell"] };
      var notificaciones = data || DB.notificaciones;
      var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Notificaciones</div><div class="card-sub">Novedades de tus citas</div></div>
          <button class="btn btn-sm btn-ghost" style="margin-left:auto;" id="marcar-leidas">Marcar todas como leidas</button></div>
        <div style="max-height:520px;overflow-y:auto;">
          ${notificaciones.map(function (n) {
        var t = tipos[n.tipo] || ["cita", "fa-bell"];
        return `
              <div class="notif${n.leida ? "" : " unread"}" data-notif="${n.id}">
                <span class="notif-ico ${t[0]}"><i class="fas ${t[1]}"></i></span>
                <div style="flex:1;min-width:0;"><div class="notif-title">${n.titulo}</div>
                <div class="notif-body">${n.cuerpo}</div>
                <div class="notif-time" style="margin-top:3px;">${n.fecha}</div></div>
                ${n.leida ? "" : '<span class="unread-dot"></span>'}
              </div>`;
      }).join("")}
        </div>
      </section>`;
    }).catch(function () {
      // Fallback a datos mock si la API falla
      var tipos = { cita: ["cita", "fa-calendar-check"], cambio: ["cambio", "fa-arrows-rotate"], cancel: ["cancel", "fa-xmark"], record: ["record", "fa-bell"] };
      var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Notificaciones</div><div class="card-sub">Novedades de tus citas</div></div>
          <button class="btn btn-sm btn-ghost" style="margin-left:auto;" id="marcar-leidas">Marcar todas como leidas</button></div>
        <div style="max-height:520px;overflow-y:auto;">
          ${DB.notificaciones.map(function (n) {
        var t = tipos[n.tipo] || ["cita", "fa-bell"];
        return `
              <div class="notif${n.leida ? "" : " unread"}" data-notif="${n.id}">
                <span class="notif-ico ${t[0]}"><i class="fas ${t[1]}"></i></span>
                <div style="flex:1;min-width:0;"><div class="notif-title">${n.titulo}</div>
                <div class="notif-body">${n.cuerpo}</div>
                <div class="notif-time" style="margin-top:3px;">${n.fecha}</div></div>
                ${n.leida ? "" : '<span class="unread-dot"></span>'}
              </div>`;
      }).join("")}
        </div>
      </section>`;
    })
  }
  ;

  function bindNotificaciones() {
    var region = App.el("view-region");
    if (!region) return;
    var marcar = region.querySelector("#marcar-leidas");
    if (marcar) marcar.addEventListener("click", function () {
      DB.notificaciones.forEach(function (n) { n.leida = true; });
      region.querySelectorAll(".notif").forEach(function (n) {
        n.classList.remove("unread");
        var dot = n.querySelector(".unread-dot");
        if (dot) dot.remove();
      });
      UI.toast("Notificaciones", "Todas las notificaciones fueron marcadas como leidas.", "success");
    });
  }

  /* ---------- Perfil cliente ---------- */
  function rPerfilCliente() {
    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        <section class="card"><div class="card-body" style="text-align:center;">
          <span class="avatar avatar-xl" style="margin:0 auto 14px;display:grid;">CL</span>
          <div class="font-display" style="font-size:22px;font-weight:700;">Carlos Lopez</div>
          <div class="card-sub">Cliente desde 2023</div>
          <div style="display:flex;justify-content:center;gap:10px;margin-top:14px;">
            <button class="btn btn-sm btn-ghost"><i class="fas fa-camera"></i> Cambiar foto</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line);">
            ${[["12", "Cortes"], ["9", "Completados"], ["3", "Cancelados"]].map(function (k) {
      return `<div style="text-align:center;"><div style="font-size:18px;font-weight:700;">${k[0]}</div><div class="cell-muted" style="font-size:11px;">${k[1]}</div></div>`;
    }).join("")}
          </div>
        </div></section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Datos personales</div><div class="card-sub">Informacion de tu cuenta</div></div></div>
          <div class="card-body" style="display:grid;gap:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field"><label class="field-label">Nombre <span class="req">*</span></label><input class="input" value="Carlos"></div>
              <div class="field"><label class="field-label">Apellido <span class="req">*</span></label><input class="input" value="Lopez"></div>
            </div>
            <div class="field"><label class="field-label">Correo electronico <span class="req">*</span></label><input class="input" type="email" value="carlos.lopez@mail.com"></div>
            <div class="field"><label class="field-label">Telefono <span class="req">*</span></label><input class="input" type="tel" value="300 123 4567"></div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="btn btn-ghost">Cancelar</button>
            <button class="btn btn-primary" id="guardar-perfil"><i class="fas fa-floppy-disk"></i> Guardar cambios</button>
          </div>
        </section>
        <section class="card" style="grid-column:1/-1;">
          <div class="card-header"><div><div class="card-title">Cambiar contrasena</div><div class="card-sub">Actualiza el acceso a tu cuenta</div></div></div>
          <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
            <div class="field"><label class="field-label">Contrasena actual <span class="req">*</span></label><div class="input-wrap"><input class="input" type="password" placeholder="••••••••"><button class="input-toggle"><i class="fas fa-eye"></i></button></div></div>
            <div class="field"><label class="field-label">Nueva contrasena <span class="req">*</span></label><div class="input-wrap"><input class="input" type="password" placeholder="••••••••"><button class="input-toggle"><i class="fas fa-eye"></i></button></div></div>
            <div class="field"><label class="field-label">Confirmar contrasena <span class="req">*</span></label><div class="input-wrap"><input class="input" type="password" placeholder="••••••••"><button class="input-toggle"><i class="fas fa-eye"></i></button></div></div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end;"><button class="btn btn-primary" id="guardar-pass"><i class="fas fa-key"></i> Actualizar contrasena</button></div>
        </section>
      </div>`;
    return html;
  }

  function bindPerfil() {
    var region = App.el("view-region");
    if (!region) return;
    var guardar = region.querySelector("#guardar-perfil");
    if (guardar) guardar.addEventListener("click", async function () {
      try {
        // Use the profile form container - personal data inputs
        var perfil = region.querySelector("#perfil");
        if (!perfil) return;
        var personalInputs = perfil.querySelectorAll(".card-body:first-child .input");
        var sesion = JSON.parse(sessionStorage.getItem("sesion") || "null");
        var clienteId = sesion ? sesion.id_usuario : 1; // TODO: integrar ID real de sesión


        var data = {};
        personalInputs.forEach(function (input) {
          if (input.name) data[input.name] = input.value;
        });
        await api.actualizarUsuario(clienteId, data);
        UI.toast("Perfil actualizado", "Tus datos fueron guardados correctamente.", "success");
      } 
      
      
      
      catch (err) {
        UI.toast("Error", err.message || "No se pudo actualizar el perfil.", "error");
      }
    
    });

  };
})



var pass = region.querySelector("#guardar-pass");
if (pass) pass.addEventListener("click", async function () {
  try {
    var perfil = region.querySelector("#perfil");
    if (!perfil) return;
    var passInputs = perfil.querySelectorAll(".card-body:last-child .input");
    await api.actualizarUsuario(1, { contraseña: passInputs[0].value }); // TODO: obtener ID cliente
    UI.toast("Contrasena actualizada", "Tu contrasena fue cambiada con exito.", "success");
  } catch (err) {
    UI.toast("Error", err.message || "No se pudo actualizar la contrasena.", "error");
  }
});
var pass2 = region.querySelector("#guardar-pass2");
if (pass2) pass2.addEventListener("click", function () {
  try {
    // Close modal
    var overlay = document.querySelector(".modal-overlay");
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
    UI.toast("Contrasena actualizada", "Tu contrasena fue cambiada con exito.", "success");
  } catch (err) {
    UI.toast("Error", err.message || "No se pudo actualizar la contrasena.", "error");
  }
});
  

/* ---------- Registro de vistas ---------- */
App.registerVista("cliente", "dashboard", rDashboard);
App.registerVista("cliente", "reservar", rReservar, bindReserva);
App.registerVista("cliente", "mis-citas", rMisCitas, bindMisCitas);
App.registerVista("cliente", "reprogramar", rReprogramar, bindReprogramar);
App.registerVista("cliente", "historial", rHistorial);
App.registerVista("cliente", "notificaciones", rNotificaciones, bindNotificaciones);
App.registerVista("cliente", "perfil", rPerfilCliente, bindPerfil);

// Paso del wizard reserva
App.goReserva = function (paso) {
  if (paso > 5) { UI.toast("Reserva", "Selecciona servicio, barbero, fecha y hora.", "info"); return; }
  if (paso === 2 && !reserva.servicio) { UI.toast("Reserva", "Selecciona un servicio primero.", "info"); return; }
  if (paso === 3 && !reserva.barbero) { UI.toast("Reserva", "Selecciona un barbero.", "info"); return; }
  if (paso === 4 && !reserva.fecha) { UI.toast("Reserva", "Selecciona una fecha.", "info"); return; }
  if (paso === 5 && !reserva.hora) { UI.toast("Reserva", "Selecciona una hora disponible.", "info"); return; }
  reserva.paso = paso;
  App.navigate("reservar");
};



