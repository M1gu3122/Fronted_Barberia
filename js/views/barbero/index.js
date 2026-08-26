/* ============================================================
   Barberia El Corte Perfecto — Vistas del Barbero
   Identidad: id_usuario desde la sesion (TokenResponse)
   ============================================================ */
(function () {
  "use strict";
  var YO = 1; // barbero demo de respaldo (Andres Duarte)

  // A. Identidad del barbero logueado
  function _sesion() {
    try { return JSON.parse(sessionStorage.getItem("sesion") || "null"); }
    catch (e) { return null; }
  }
  function _miId() {
    var s = _sesion();
    return (s && s.id_usuario) || YO;
  }
  function _miNombre() {
    var s = _sesion();
    if (s && (s.nombres || s.apellidos)) return ((s.nombres || "") + " " + (s.apellidos || "")).trim();
    var b = DB.barbero(YO);
    return b ? b.nombre : "Barbero";
  }

  /* Normalizar una cita de la API -> objeto de presentacion */
  function _normalizarCita(c) {
    return {
      id: c.id_cita,
      fecha: DateUtils.dateFromDateTime(c.fecha_hora),
      hora: DateUtils.timeFromDateTime(c.fecha_hora),
      estado: String(c.estado_cita || "").toLowerCase(),
      cliente: ((c.nombres || "") + " " + (c.apellidos || "")).trim() || "Cliente",
      telefono: c.telefono || "",
      correo: c.correo || "",
      servicios: c.servicios || "Servicio",
      duracion: c.tiempo_total || 0,
      barbero: ((c.nombres_barbero || "") + " " + (c.apellidos_barbero || "")).trim()
    };
  }

  function citasFuturas() {
    return _dash.citas.filter(function (c) {
      return c.estado !== "completada" && c.estado !== "cancelada" && c.fecha >= DateUtils.today();
    }).sort(function (a, b) { return (a.fecha + a.hora) < (b.fecha + b.hora) ? -1 : 1; });
  }
  function citasHistorial() {
    return _dash.citas.filter(function (c) { return c.estado === "completada"; })
      .sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
  }

  function tileCitaReal(c, acciones) {
    return `
      <div class="appt-tile ${c.estado}">
        <div class="appt-time">${c.hora}</div>
        <div class="appt-main"><div class="appt-title">${c.cliente}</div>
        <div class="appt-sub">${c.servicios} · ${c.duracion} min</div></div>
        <div style="display:flex;align-items:center;gap:8px;">${UI.estadoBadge(c.estado)}${acciones || ""}</div>
      </div>`;
  }

  /* ---------- Dashboard (B: datos reales) ---------- */
  var _dash = { citas: [], usandoMock: false };

  function _usarMockCitas() {
    _dash.citas = DB.citasDe({ barbero: _miId() }).map(function (c) {
      var cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio);
      return {
        id: c.id, fecha: c.fecha, hora: c.hora, estado: c.estado,
        cliente: cl ? cl.nombre : "Cliente",
        telefono: cl ? cl.telefono : "", correo: cl ? cl.correo : "",
        servicios: s ? s.nombre : "Servicio", duracion: s ? s.duracion : 0,
        barbero: DB.barbero(c.barbero) ? DB.barbero(c.barbero).nombre : "Barbero"
      };
    });
    _dash.usandoMock = true;
  }

  async function cargarCitasBarbero() {
    if (!_sesion()) { _usarMockCitas(); return true; } // modo demo sin sesion

    try {
      var citas = await api.obtenerCitasDetalles();
      _dash.citas = (citas || []).filter(function (c) { return String(c.id_barbero) === String(_miId()); })
        .map(_normalizarCita);
      _dash.usandoMock = false;
      return true;
    } catch (err) {
      console.error("Error cargando citas del barbero:", err);
      _usarMockCitas();
      return true;
    }
  }

  function rDashboardBarbero() {
    var hoy = DateUtils.today();
    var delDia = _dash.citas.filter(function (c) { return c.fecha === hoy && c.estado !== "cancelada"; });
    var proxima = delDia.filter(function (c) {
      return c.estado === "pendiente" || c.estado === "confirmada";
    }).sort(function (a, b) { return a.hora < b.hora ? -1 : 1; })[0];
    var pendientes = delDia.filter(function (c) { return c.estado === "pendiente" || c.estado === "confirmada"; }).length;
    var completadas = delDia.filter(function (c) { return c.estado === "completada"; }).length;
    var canceladas = _dash.citas.filter(function (c) { return c.fecha === hoy && c.estado === "cancelada"; }).length;

    var kpis = [
      [delDia.length, "Citas hoy", "fa-calendar-day", "var(--st-atencion-bg)", "var(--st-atencion)"],
      [pendientes, "Por atender", "fa-clock", "var(--st-pendiente-bg)", "var(--st-pendiente)"],
      [completadas, "Completadas", "fa-circle-check", "var(--st-completada-bg)", "var(--st-completada)"],
      [canceladas, "Canceladas", "fa-ban", "var(--st-cancelada-bg)", "var(--st-cancelada)"]
    ];

    var html = `
      <section class="card hero-cita">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <span class="avatar avatar-xl" style="background:linear-gradient(135deg,var(--brass-light),var(--brass));">${DB.getIniciales(_miNombre())}</span>
          <div style="flex:1;min-width:220px;">
            <div class="day-pill" style="background:rgba(197,160,89,.16);color:var(--brass-light);">RESUMEN DEL DIA</div>
            <div class="font-display" style="font-size:24px;font-weight:700;color:#fff;margin-top:4px;">Hola, ${_miNombre()}</div>
            <div style="color:#cfccc4;font-size:14px;">${DB.formatFechaLargaConAno(hoy)} · Tienes ${delDia.length} citas hoy</div>
          </div>
          ${proxima ? `
            <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 18px;min-width:230px;">
              <div class="card-sub" style="color:#cfccc4;">Proxima cita</div>
              <div style="font-size:16px;font-weight:700;color:#fff;">${proxima.cliente}</div>
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
      <section class="card"><div class="card-header"><div><div class="card-title">Agenda de hoy</div><div class="card-sub">${DB.formatFechaLarga(hoy)}</div></div>
        <button class="btn btn-sm btn-ghost" style="margin-left:auto;" onclick="App.navigate('agenda')">Ver agenda</button></div>
        <div style="padding:14px;display:grid;gap:8px;">
          ${delDia.length ? delDia.map(function (c) {
            return tileCitaReal(c, `<button class="btn btn-sm btn-ghost" data-ver="${c.id}"><i class="fas fa-eye"></i></button>`);
          }).join("") : `
            <div class="empty" style="padding:34px;"><div class="empty-ico"><i class="fas fa-mug-hot"></i></div><div class="empty-title">Dia libre</div><div class="empty-text">No tienes citas programadas para hoy.</div></div>`}
        </div>
      </section>`;
    return html;
  }

  /* ---------- Agenda (C: dia / semana con horario real) ---------- */
  var agendaModo = "dia";
  var _horarios = null; // { Lunes: {ini: 480, fin: 1200}, ... } en minutos
  var _agendaFecha = DateUtils.today();

  function _horaMin(t) {
    var p = String(t || "").split(":");
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }
  function _minHora(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }

  async function cargarHorariosBarberia() {
    if (!_sesion()) { _horarios = null; return; } // demo: sin horario, se usa 09:00-18:00
    try {
      var bar = await api.getBarberia();
      var idBarberia = (bar && bar.id_barberia) || 1;
      var lista = await api.getHorariosSemanales(idBarberia);
      _horarios = {};
      (lista || []).forEach(function (h) {
        _horarios[h.dia_semana] = { ini: _horaMin(h.hora_apertura), fin: _horaMin(h.hora_cierre) };
      });
    } catch (err) {
      console.error("Error cargando horarios:", err);
      _horarios = null;
    }
  }

  function _horarioDelDia(fecha) {
    if (_horarios) {
      var d = new Date(String(fecha).substr(0, 10) + "T00:00:00");
      var dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      var nombre = dias[d.getDay()];
      if (_horarios[nombre]) return _horarios[nombre];
    }
    return { ini: 9 * 60, fin: 18 * 60 };
  }

  function _citasDelDia(fecha) {
    return _dash.citas.filter(function (c) { return c.fecha === fecha && c.estado !== "cancelada"; })
      .sort(function (a, b) { return a.hora < b.hora ? -1 : 1; });
  }

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

  /* Bloques ocupados: inicio + duracion (respetando el tiempo del servicio) */
  function _bloquesOcupados(citas) {
    return citas.map(function (c) {
      var ini = _horaMin(c.hora);
      return { ini: ini, fin: ini + (c.duracion || 30), cita: c };
    });
  }

  function agendaDia() {
    var citas = _citasDelDia(_agendaFecha);
    var bloques = _bloquesOcupados(citas);
    var hor = _horarioDelDia(_agendaFecha);
    var filas = [];
    for (var t = hor.ini; t < hor.fin; t += 30) {
      var hh = _minHora(t);
      var ocupado = bloques.some(function (o) { return t < o.fin && t + 30 > o.ini; });
      var citaEnInicio = citas.filter(function (c) { return c.hora === hh; });
      filas.push(`
        <div class="agenda-hour">${hh}</div>
        ${citaEnInicio.length ? citaEnInicio.map(function (c) {
          return `<div class="agenda-item">${tileCitaReal(c, `<button class="btn btn-sm btn-ghost" data-ver="${c.id}"><i class="fas fa-eye"></i></button>`)}</div>`;
        }).join("") : ocupado ? `
        <div class="agenda-item"><div style="padding:12px 14px;border-radius:10px;border:1px solid var(--line);color:var(--mist);font-size:12.5px;background:var(--bone);">Ocupado</div></div>` : `
        <div class="agenda-item"><div style="padding:12px 14px;border-radius:10px;border:1px dashed var(--line);color:var(--mist);font-size:12.5px;">Horario disponible</div></div>`}
      `);
    }
    return `<div class="agenda">${filas.join("")}</div>`;
  }

  function agendaSemana() {
    var dias = [0, 1, 2, 3, 4, 5, 6].map(function (i) {
      var fecha = DateUtils.addDays(i);
      var nombre = DB.formatFechaLarga(fecha).split(",")[0];
      return { fecha: fecha, nombre: nombre, citas: _citasDelDia(fecha) };
    });
    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">
        ${dias.map(function (dia) {
          var esHoy = dia.fecha === DateUtils.today();
          return `
            <div class="card" style="${esHoy ? "border-color:var(--brass);" : ""}"><div class="card-header" style="padding:10px 12px;">
              <div class="card-title" style="font-size:13px;text-transform:capitalize;">${dia.nombre}</div>
            </div>
            <div style="padding:10px;display:grid;gap:6px;">
              ${dia.citas.length ? dia.citas.map(function (c) {
                return `<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;border-radius:7px;padding:6px 8px;background:var(--sand);border-left:3px solid var(--brass);" data-ver="${c.id}" style="cursor:pointer;">
                  <span style="font-weight:700;">${c.hora.slice(0, 5)}</span><span>${c.cliente}</span></div>`;
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
    var c = null;
    for (var i = 0; i < _dash.citas.length; i++) {
      if (_dash.citas[i].id === citaId) { c = _dash.citas[i]; break; }
    }
    var mock = null;
    if (!c) mock = DB.cita(citaId);
    if (!c && !mock) return '<div class="empty"><div class="empty-text">Cita no encontrada.</div></div>';

    var clNombre, clTel, clCorreo, sNombre, sDur, bNombre;
    if (c) {
      clNombre = c.cliente; clTel = c.telefono || "Sin telefono"; clCorreo = c.correo || "";
      sNombre = c.servicios; sDur = c.duracion; bNombre = c.barbero;
    } else {
      var cl = DB.cliente(mock.cliente), s = DB.servicio(mock.servicio), b = DB.barbero(mock.barbero);
      clNombre = cl.nombre; clTel = cl.telefono; clCorreo = cl.correo;
      sNombre = s.nombre; sDur = s.duracion; bNombre = b.nombre;
    }
    var cita = c || mock;

    var acciones = "";
    if (_dash.usandoMock && (cita.estado === "pendiente" || cita.estado === "confirmada")) {
      acciones = `<button class="btn btn-primary" data-estado="espera"><i class="fas fa-user-clock"></i> Marcar en espera</button>`;
    } else if (_dash.usandoMock && cita.estado === "espera") {
      acciones = `<button class="btn btn-primary" data-estado="atencion"><i class="fas fa-scissors"></i> Marcar en atencion</button>`;
    } else if (_dash.usandoMock && cita.estado === "atencion") {
      acciones = `
        <button class="btn btn-primary" data-estado="completada"><i class="fas fa-circle-check"></i> Marcar completada</button>
        <button class="btn btn-danger" data-estado="cancelada"><i class="fas fa-xmark"></i> Cancelar</button>`;
    }

    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Detalle de cita #${cita.id}</div><div class="card-sub">${DB.formatFechaLargaConAno(cita.fecha)} · ${cita.hora} hs</div></div>
          <div style="margin-left:auto;">${UI.estadoBadge(cita.estado)}</div></div>
        <div class="card-body" style="display:grid;gap:14px;">
          <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--sand);border-radius:10px;">
            <span class="avatar avatar-lg">${DB.getIniciales(clNombre)}</span>
            <div><div style="font-size:15px;font-weight:700;">${clNombre}</div>
            <div class="cell-muted">${clTel}${clCorreo ? " · " + clCorreo : ""}</div></div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
            ${[["Servicio", sNombre, "fa-scissors"], ["Barbero", bNombre, "fa-user-tie"],
               ["Duracion", sDur + " min", "fa-hourglass-half"], ["Hora", cita.hora + " hs", "fa-clock"]].map(function (f) {
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

  /* ---------- Mis citas (E: barbero, datos reales) ---------- */
  function rMisCitasBarbero() {
    var futuras = citasFuturas();
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Mis citas</div><div class="card-sub">Proximas y pendientes</div></div></div>
        <div style="padding:14px;display:grid;gap:8px;">
          ${!futuras.length ? `
            <div class="empty" style="padding:34px;"><div class="empty-ico"><i class="fas fa-calendar-check"></i></div><div class="empty-title">Sin citas proximas</div><div class="empty-text">Cuando te asignen citas apareceran aqui.</div></div>` : ""}
          ${futuras.map(function (c) {
            return `
              <div class="appt-tile ${c.estado}">
                <div class="appt-time">${c.hora}</div>
                <div class="appt-main"><div class="appt-title">${c.cliente}</div>
                <div class="appt-sub">${c.servicios} · ${DB.formatFechaLarga(c.fecha)}</div></div>
                <div style="display:flex;align-items:center;gap:8px;">${UI.estadoBadge(c.estado)}
                  <button class="btn btn-sm btn-ghost" data-ver="${c.id}"><i class="fas fa-eye"></i></button></div>
              </div>`;
          }).join("")}
        </div>
      </section>`;
    return html;
  }

  /* ---------- Historial (F: barbero, datos reales) ---------- */
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
            return `
              <tr>
                <td data-label="Fecha"><span class="cell-primary">${DB.formatFechaLarga(c.fecha)}</span></td>
                <td data-label="Cliente">${c.cliente}</td>
                <td data-label="Servicio">${c.servicios}</td>
                <td data-label="Duracion">${c.duracion} min</td>
                <td data-label="Estado">${UI.estadoBadge(c.estado)}</td>
              </tr>`;
          }).join("")}
        </tbody></table></div>
      </section>`;
    return html;
  }

  /* ---------- Perfil (G: barbero, datos reales) ---------- */
  var _perfil = { emp: null, usandoMock: false };

  function _usarMockPerfil() {
    var b = DB.barbero(_miId()) || DB.barbero(YO);
    _perfil.emp = {
      id_usuario: _miId(), tipo_empleado: "Barbero", estado: "Activo",
      fecha_contratacion: "",
      usuario: { id_usuario: _miId(), nombres: (b.nombre || "").split(" ")[0] || "Barbero",
                 apellidos: (b.nombre || "").split(" ").slice(1).join(" ") || "",
                 usuario: "", correo: "", telefono: "" }
    };
    _perfil.usandoMock = true;
  }

  async function cargarPerfilBarbero() {
    if (!_sesion()) { _usarMockPerfil(); return true; }
    try {
      _perfil.emp = await api.getEmpleado(_miId());
      _perfil.usandoMock = false;
      return true;
    } catch (err) {
      console.error("Error cargando perfil:", err);
      _usarMockPerfil();
      return true;
    }
  }

  function rPerfilBarbero() {
    var emp = _perfil.emp;
    var u = emp.usuario || {};
    var nombre = ((u.nombres || "") + " " + (u.apellidos || "")).trim() || "Barbero";
    var completadas = _dash.citas.filter(function (c) { return c.estado === "completada"; }).length;
    var pendientes = _dash.citas.filter(function (c) { return c.estado === "pendiente" || c.estado === "confirmada"; }).length;
    var canceladas = _dash.citas.filter(function (c) { return c.estado === "cancelada"; }).length;

    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        <section class="card"><div class="card-body" style="text-align:center;">
          <span class="avatar avatar-xl" style="margin:0 auto 14px;display:grid;">${DB.getIniciales(nombre)}</span>
          <div class="font-display" style="font-size:22px;font-weight:700;">${nombre}</div>
          <div class="card-sub">${emp.tipo_empleado || "Barbero"}${emp.fecha_contratacion ? " · Desde " + DB.formatFechaLarga(emp.fecha_contratacion) : ""}</div>
          <div style="display:flex;justify-content:center;gap:8px;margin-top:12px;">${UI.badge(String(emp.estado || "").toLowerCase())}</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line);">
            ${[[_dash.citas.length, "Citas"], [completadas, "Completadas"], [canceladas, "Canceladas"]].map(function (k) {
              return `<div style="text-align:center;"><div style="font-size:18px;font-weight:700;">${k[0]}</div><div class="cell-muted" style="font-size:11px;">${k[1]}</div></div>`;
            }).join("")}
          </div>
        </div></section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Datos profesionales</div><div class="card-sub">Tu informacion de trabajo</div></div></div>
          <div class="card-body" style="display:grid;gap:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field"><label class="field-label">Nombre</label><input class="input" id="perf-nombres" value="${u.nombres || ""}"></div>
              <div class="field"><label class="field-label">Apellido</label><input class="input" id="perf-apellidos" value="${u.apellidos || ""}"></div>
            </div>
            <div class="field"><label class="field-label">Telefono</label><input class="input" id="perf-telefono" value="${u.telefono || ""}"></div>
            <div class="field"><label class="field-label">Correo</label><input class="input" id="perf-correo" value="${u.correo || ""}" disabled></div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end;"><button class="btn btn-primary" id="guardar-perfil"><i class="fas fa-floppy-disk"></i> Guardar cambios</button></div>
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

  function bindPerfilBarbero() {
    var region = App.el("view-region");
    if (!region) return;
    var btn = region.querySelector("#guardar-perfil");
    if (btn) btn.addEventListener("click", function () {
      var id = _miId();
      var nombres = (region.querySelector("#perf-nombres") || {}).value || "";
      var apellidos = (region.querySelector("#perf-apellidos") || {}).value || "";
      var telefono = (region.querySelector("#perf-telefono") || {}).value || "";
      if (_perfil.usandoMock || !_sesion()) {
        UI.toast("Perfil actualizado", "Tus datos fueron guardados correctamente.", "success");
        return;
      }
      api.actualizarUsuario(id, { nombres: nombres, apellidos: apellidos, telefono: telefono })
        .then(function () {
          UI.toast("Perfil actualizado", "Tus datos fueron guardados correctamente.", "success");
        })
        .catch(function (err) {
          console.error("Error guardando perfil:", err);
          UI.toast("Error", "No se pudo guardar tu perfil.", "error");
        });
    });

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

    var pass = region.querySelector("#guardar-pass");
    if (pass) pass.addEventListener("click", async function () {
      var actual = (region.querySelector("#perf-pass-actual") || {}).value || "";
      var nueva = (region.querySelector("#perf-pass-nueva") || {}).value || "";
      var confirmar = (region.querySelector("#perf-pass-confirmar") || {}).value || "";
      if (nueva.length < 6) { UI.toast("Contrasena corta", "La nueva contrasena debe tener al menos 6 caracteres.", "error"); return; }
      if (nueva !== confirmar) { UI.toast("No coinciden", "La confirmacion no coincide con la nueva contrasena.", "error"); return; }
      if (_perfil.usandoMock || !_sesion()) { UI.toast("Modo demo", "Inicia sesion para cambiar tu contrasena.", "info"); return; }
      try {
        await api.cambiarContrasena(actual, nueva);
        region.querySelectorAll("#perf-pass-actual, #perf-pass-nueva, #perf-pass-confirmar").forEach(function (i) { i.value = ""; });
        UI.toast("Contrasena actualizada", "Tu contrasena fue cambiada con exito.", "success");
      } catch (err) {
        console.error("Error cambiando contrasena:", err);
        UI.toast("Error", (Array.isArray(err && err.detail) ? "Revise los datos enviados." : (err && err.message)) || "No se pudo cambiar la contrasena.", "error");
      }
    });
  }

  /* ---------- Servicios (H: barbero, datos reales) ---------- */
  var _servicios = { lista: [], usandoMock: false };

  async function cargarServiciosBarbero() {
    if (!_sesion()) { _usarMockServicios(); return true; }
    try {
      var [rels, todos] = await Promise.all([
        api.getServiciosDelBarbero(_miId()).catch(function () { return []; }),
        api.getServicios().catch(function () { return []; })
      ]);
      var ids = new Set((rels || []).map(function (r) { return r.id_servicio; }));
      _servicios.lista = (todos || []).filter(function (s) { return ids.has(s.id_servicio); });
      _servicios.usandoMock = false;
      return true;
    } catch (err) {
      console.error("Error cargando servicios:", err);
      _usarMockServicios();
      return true;
    }
  }

  function _usarMockServicios() {
    var ids = [1, 2, 5, 8, 11, 13, 15, 16];
    _servicios.lista = DB.servicios.filter(function (s) { return ids.indexOf(s.id) > -1; }).map(function (s) {
      return {
        id_servicio: s.id, nombre_servicio: s.nombre, tipo_servicio: s.tipo || "PRINCIPAL",
        precio_servicio: s.precio, tiempo_estimado: s.duracion, descripcion_servicio: s.descripcion || ""
      };
    });
    _servicios.usandoMock = true;
  }

  function rServiciosBarbero() {
    var lista = _servicios.lista;
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Mis servicios</div><div class="card-sub">${lista.length} servicios que puedes realizar</div></div></div>
        <div style="padding:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">
          ${!lista.length ? `
            <div class="empty" style="padding:34px;grid-column:1/-1;"><div class="empty-ico"><i class="fas fa-scissors"></i></div><div class="empty-title">Sin servicios asignados</div><div class="empty-text">Aun no te han asignado servicios.</div></div>` : ""}
          ${lista.map(function (s) {
            return `
              <div class="card" style="border-color:var(--line);">
                <div class="card-body" style="padding:16px;">
                  <div style="display:flex;align-items:flex-start;gap:10px;">
                    <span style="width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:var(--sand);color:var(--brass);flex:none;"><i class="fas fa-scissors"></i></span>
                    <div style="flex:1;min-width:0;">
                      <div style="font-weight:700;font-size:14px;">${s.nombre_servicio}</div>
                      <div class="cell-muted" style="font-size:12px;text-transform:capitalize;">${String(s.tipo_servicio || "").toLowerCase()}</div>
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid var(--line);">
                    <div style="font-size:13px;color:var(--smoke);"><i class="fas fa-clock" style="color:var(--brass-dim);margin-right:5px;"></i>${s.tiempo_estimado} min</div>
                    <div style="font-weight:700;color:var(--brass);font-size:15px;">$${Number(s.precio_servicio || 0).toLocaleString("es-CO")}</div>
                  </div>
                </div>
              </div>`;
          }).join("")}
        </div>
      </section>`;
    return html;
  }
  async function initDashboard() {
    await cargarCitasBarbero();
    var region = App.el("view-region");
    if (region) region.innerHTML = rDashboardBarbero();
  }

  var renderDashboardWrapper = function () {
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;">
          ${[1, 2, 3, 4].map(function () { return '<section class="card kpi skeleton" style="height:100px;"></section>'; }).join("")}
        </div>
        <section class="card skeleton" style="height:280px;"></section>
      `;
    }
    initDashboard();
  };

  async function initAgenda() {
    await Promise.all([cargarCitasBarbero(), cargarHorariosBarberia()]);
    var region = App.el("view-region");
    if (region) region.innerHTML = rAgenda();
    bindAgenda();
  }

  var renderAgendaWrapper = function () {
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = '<section class="card skeleton" style="height:380px;"></section>';
    }
    initAgenda();
  };

  async function initMisCitas() {
    await cargarCitasBarbero();
    var region = App.el("view-region");
    if (region) region.innerHTML = rMisCitasBarbero();
  }

  var renderMisCitasWrapper = function () {
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = '<section class="card skeleton" style="height:320px;"></section>';
    }
    initMisCitas();
  };

  async function initHistorial() {
    await cargarCitasBarbero();
    var region = App.el("view-region");
    if (region) region.innerHTML = rHistorialBarbero();
  }

  var renderHistorialWrapper = function () {
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = '<section class="card skeleton" style="height:280px;"></section>';
    }
    initHistorial();
  };

  async function initPerfil() {
    await Promise.all([cargarPerfilBarbero(), cargarCitasBarbero()]);
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = rPerfilBarbero();
      bindPerfilBarbero();
    }
  }

  var renderPerfilWrapper = function () {
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">' +
        '<section class="card skeleton" style="height:320px;"></section><section class="card skeleton" style="height:320px;"></section></div>';
    }
    initPerfil();
  };

  async function initServicios() {
    await cargarServiciosBarbero();
    var region = App.el("view-region");
    if (region) region.innerHTML = rServiciosBarbero();
  }

  var renderServiciosWrapper = function () {
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = '<section class="card skeleton" style="height:280px;"></section>';
    }
    initServicios();
  };

  App.registerVista("barbero", "dashboard", renderDashboardWrapper);
  App.registerVista("barbero", "agenda", renderAgendaWrapper, bindAgenda);
  App.registerVista("barbero", "mis-citas", renderMisCitasWrapper);
  App.registerVista("barbero", "historial", renderHistorialWrapper);
  App.registerVista("barbero", "perfil", renderPerfilWrapper);
  App.registerVista("barbero", "mis-servicios", renderServiciosWrapper);
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
})();

