/* ============================================================
   Barberia El Corte Perfecto — Vistas del Administrador
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Dashboard admin ---------- */
  function rDashboardAdmin() {
    var d = DB;
    var hoy = d.citasDe({ fecha: d.iso(0) }).filter(function (c) { return c.estado !== "cancelada"; });
    var completadas = hoy.filter(function (c) { return c.estado === "completada"; }).length;
    var pendientes = hoy.filter(function (c) { return c.estado === "pendiente" || c.estado === "confirmada"; }).length;
    var activos = d.barberos.filter(function (b) { return b.activo; }).length;
    var clientesActivos = d.clientes.filter(function (c) { return c.estado === "activo"; }).length;

    var html = "";

    /* KPIs */
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:14px;">' +
      [[hoy.length, "Citas de hoy", "fa-calendar-day", "var(--st-atencion-bg)", "var(--st-atencion)"],
       [pendientes, "Citas pendientes", "fa-clock", "var(--st-pendiente-bg)", "var(--st-pendiente)"],
       [completadas, "Completadas hoy", "fa-circle-check", "var(--st-completada-bg)", "var(--st-completada)"],
       [clientesActivos, "Clientes registrados", "fa-users", "var(--bone)", "var(--brass-dim)"],
       [activos, "Barberos activos", "fa-user-tie", "var(--bone)", "var(--brass-dim)"]].map(function (k) {
        return '<section class="card kpi"><div class="kpi-top"><span class="kpi-ico" style="background:' + k[3] + ";color:" + k[4] + ';"><i class="fas ' + k[2] + '"></i></span><span class="kpi-label">' + k[1] + "</span></div>" +
          '<div class="kpi-value">' + k[0] + "</div></section>";
      }).join("") +
      "</div>";

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;">';

    /* Agenda del dia */
    html += '<section class="card"><div class="card-header"><div><div class="card-title">Agenda de hoy</div><div class="card-sub">' + d.formatFechaLarga(d.iso(0)) + "</div></div>" +
      '<button class="btn btn-sm btn-ghost" style="margin-left:auto;" onclick="App.navigate(\'citas\')">Ver todas</button></div>';
    html += '<div style="padding:12px;display:grid;gap:8px;">' +
      hoy.slice(0, 5).map(function (c) {
        var cl = d.cliente(c.cliente), s = d.servicio(c.servicio), b = d.barbero(c.barbero);
        return '<div class="appt-tile ' + c.estado + '">' +
          '<div class="appt-time">' + c.hora + "</div>" +
          '<div class="appt-main"><div class="appt-title">' + cl.nombre + "</div>" +
          '<div class="appt-sub">' + s.nombre + " · " + b.nombre + "</div></div>" +
          UI.estadoBadge(c.estado) + "</div>";
      }).join("") +
      "</div></section>";

    /* Grafico: distribucion de estados */
    html += '<section class="card"><div class="card-header"><div><div class="card-title">Distribucion de estados</div><div class="card-sub">Citas de hoy</div></div></div>';
    html += '<div class="card-body"><div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;justify-content:center;">';
    var donut = donutChart([
      ["Confirmadas", hoy.filter(function (c) { return c.estado === "confirmada"; }).length, "#0E7A5F"],
      ["Pendientes", hoy.filter(function (c) { return c.estado === "pendiente"; }).length, "#B45309"],
      ["En atencion", hoy.filter(function (c) { return c.estado === "atencion"; }).length, "#1D6FA8"],
      ["Completadas", completadas, "#2E7D32"],
      ["Canceladas", d.citasDe({ fecha: d.iso(0) }).filter(function (c) { return c.estado === "cancelada"; }).length, "#C0392B"]
    ]);
    html += donut.html + '<div class="legend">' + donut.leyenda + "</div>";
    html += "</div></div></section>";

    /* Servicios mas solicitados */
    html += '<section class="card"><div class="card-header"><div><div class="card-title">Servicios mas solicitados</div><div class="card-sub">Este mes</div></div></div>';
    html += '<div class="card-body">';
    var conteo = {};
    d.citas.forEach(function (c) {
      if (c.estado === "cancelada") return;
      conteo[c.servicio] = (conteo[c.servicio] || 0) + 1;
    });
    var top = Object.keys(conteo).map(function (k) { return { id: +k, n: conteo[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
    var max = top[0] ? top[0].n : 1;
    html += top.map(function (t) {
      var s = d.servicio(t.id);
      var pct = Math.round((t.n / max) * 100);
      return '<div style="margin-bottom:14px;"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:6px;">' +
        '<span>' + s.nombre + '</span><span class="text-brass">' + t.n + " reservas</span></div>" +
        '<div style="height:8px;background:var(--bone);border-radius:999px;overflow:hidden;">' +
        '<div class="barra" data-w="' + pct + '" style="height:100%;width:0;background:linear-gradient(90deg,var(--brass-light),var(--brass));border-radius:999px;"></div></div></div>';
    }).join("") + "</div></section>";

    html += "</div>";
    return html;
  }

  /* Donut simple en CSS con conic-gradient */
  function donutChart(datos) {
    var total = datos.reduce(function (a, b) { return a + b[1]; }, 0) || 1;
    var acc = 0;
    var grad = datos.filter(function (d) { return d[1] > 0; }).map(function (d) {
      var pct = (d[1] / total) * 360;
      var seg = acc + "deg " + (acc + pct) + "deg";
      acc += pct;
      return d[2] + " " + seg;
    }).join(", ");
    var html = '<div class="donut" style="background:conic-gradient(' + (grad || "#E2DCD0 0 360deg") + ');">' +
      '<div class="donut-center"><div style="font-size:22px;font-weight:700;">' + total + '</div><div class="cell-muted" style="font-size:11px;">citas</div></div></div>';
    var leyenda = datos.map(function (d) {
      return '<div class="legend-item"><span class="legend-dot" style="background:' + d[2] + ';"></span><span>' + d[0] + "</span>" +
        '<span class="legend-val">' + d[1] + "</span></div>";
    }).join("");
    return { html: html, leyenda: leyenda };
  }
  /* ---------- Gestion de citas (admin) ---------- */
  var filtroCitas = { fecha: "", barbero: 0, estado: "", servicio: 0 };

  function rCitasAdmin() {
    var d = DB;
    var lista = d.citas.slice().sort(function (a, b) { return (a.fecha + a.hora) < (b.fecha + b.hora) ? 1 : -1; });

    /* Filtros */
    if (filtroCitas.fecha) lista = lista.filter(function (c) { return c.fecha === filtroCitas.fecha; });
    if (filtroCitas.barbero) lista = lista.filter(function (c) { return c.barbero === filtroCitas.barbero; });
    if (filtroCitas.estado) lista = lista.filter(function (c) { return c.estado === filtroCitas.estado; });
    if (filtroCitas.servicio) lista = lista.filter(function (c) { return c.servicio === filtroCitas.servicio; });

    var html = '<section class="card">';

    /* Filtros */
    html += '<div class="card-header" style="flex-wrap:wrap;gap:12px;">' +
      '<div><div class="card-title">Citas</div><div class="card-sub">' + lista.length + " registros</div></div>" +
      '<div style="margin-left:auto;" class="filters">' +
      '<input type="date" class="input" id="f-fecha" value="' + filtroCitas.fecha + '">' +
      '<select class="select" id="f-barbero"><option value="0">Todos los barberos</option>' +
      d.barberos.map(function (b) { return '<option value="' + b.id + '"' + (filtroCitas.barbero === b.id ? " selected" : "") + ">" + b.nombre + "</option>"; }).join("") +
      "</select>" +
      '<select class="select" id="f-estado"><option value="">Todos los estados</option>' +
      ["pendiente", "confirmada", "espera", "atencion", "completada", "cancelada"].map(function (e) {
        return '<option value="' + e + '"' + (filtroCitas.estado === e ? " selected" : "") + ">" + UI.ESTADOS[e].label + "</option>";
      }).join("") + "</select>" +
      '<select class="select" id="f-servicio"><option value="0">Todos los servicios</option>' +
      d.servicios.map(function (s) { return '<option value="' + s.id + '"' + (filtroCitas.servicio === s.id ? " selected" : "") + ">" + s.nombre + "</option>"; }).join("") +
      "</select>" +
      '<button class="btn btn-sm btn-ghost" id="f-limpiar"><i class="fas fa-rotate-left"></i></button>' +
      "</div></div>";

    /* Tabla */
    html += '<div class="table-wrap"><table class="table table-responsive"><thead><tr>' +
      ["ID", "Cliente", "Barbero", "Servicio", "Fecha", "Hora", "Estado", "Acciones"].map(function (h) { return "<th>" + h + "</th>"; }).join("") +
      "</tr></thead><tbody>";

    if (!lista.length) {
      html += '<tr><td colspan="8"><div class="empty"><div class="empty-ico"><i class="fas fa-calendar-check"></i></div><div class="empty-title">Sin resultados</div><div class="empty-text">Ajusta los filtros o crea una nueva cita.</div></div></td></tr>';
    }
    lista.forEach(function (c) {
      var cl = d.cliente(c.cliente), b = d.barbero(c.barbero), s = d.servicio(c.servicio);
      html += "<tr>" +
        '<td data-label="ID"><span class="cell-primary">#' + c.id + "</span></td>" +
        '<td data-label="Cliente">' + cl.nombre + "</td>" +
        '<td data-label="Barbero">' + b.nombre + "</td>" +
        '<td data-label="Servicio">' + s.nombre + "</td>" +
        '<td data-label="Fecha">' + d.formatFechaLarga(c.fecha) + "</td>" +
        '<td data-label="Hora">' + c.hora + "</td>" +
        '<td data-label="Estado">' + UI.estadoBadge(c.estado) + "</td>" +
        '<td data-label="Acciones"><div class="actions">' +
        '<button class="btn btn-icon btn-ghost" data-ver-cita="' + c.id + '" title="Ver"><i class="fas fa-eye"></i></button>' +
        '<button class="btn btn-icon btn-ghost" data-editar-cita="' + c.id + '" title="Editar"><i class="fas fa-pen"></i></button>' +
        '<button class="btn btn-icon btn-ghost" data-cambiar-barbero="' + c.id + '" title="Cambiar barbero"><i class="fas fa-user-tie"></i></button>' +
        '<button class="btn btn-icon btn-ghost" data-reprogramar="' + c.id + '" title="Reprogramar"><i class="fas fa-calendar-plus"></i></button>' +
        '<button class="btn btn-icon btn-danger" data-cancelar-cita="' + c.id + '" title="Cancelar"><i class="fas fa-xmark"></i></button>' +
        "</div></td></tr>";
    });
    html += "</tbody></table></div></section>";

    /* Boton crear */
    html += '<div style="margin-top:14px;display:flex;justify-content:flex-end;">' +
      '<button class="btn btn-primary" id="crear-cita-btn"><i class="fas fa-plus"></i> Crear cita</button></div>';
    return html;
  }

  function bindCitasAdmin() {
    var region = App.el("view-region");
    if (!region) return;

    ["f-fecha", "f-barbero", "f-estado", "f-servicio"].forEach(function (id) {
      var elInp = region.querySelector("#" + id);
      if (!elInp) return;
      elInp.addEventListener("change", function () {
        filtroCitas.fecha = region.querySelector("#f-fecha").value;
        filtroCitas.barbero = +region.querySelector("#f-barbero").value;
        filtroCitas.estado = region.querySelector("#f-estado").value;
        filtroCitas.servicio = +region.querySelector("#f-servicio").value;
        App.navigate("citas");
      });
    });
    var limpiar = region.querySelector("#f-limpiar");
    if (limpiar) limpiar.addEventListener("click", function () {
      filtroCitas = { fecha: "", barbero: 0, estado: "", servicio: 0 };
      App.navigate("citas");
    });

    var crear = region.querySelector("#crear-cita-btn");
    if (crear) crear.addEventListener("click", function () { abrirFormCita(null); });

    region.addEventListener("click", function (e) {
      var ver = e.target.closest("[data-ver-cita]");
      if (ver) abrirDetalleCita(+ver.getAttribute("data-ver-cita"));
      var editar = e.target.closest("[data-editar-cita]");
      if (editar) abrirFormCita(+editar.getAttribute("data-editar-cita"));
      var cambiarB = e.target.closest("[data-cambiar-barbero]");
      if (cambiarB) abrirCambiarBarbero(+cambiarB.getAttribute("data-cambiar-barbero"));
      var rep = e.target.closest("[data-reprogramar]");
      if (rep) abrirReprogramarAdmin(+rep.getAttribute("data-reprogramar"));
      var canc = e.target.closest("[data-cancelar-cita]");
      if (canc) cancelarCitaAdmin(+canc.getAttribute("data-cancelar-cita"));
    });
  }

  function abrirDetalleCita(id) {
    var c = DB.cita(id), cl = DB.cliente(c.cliente), b = DB.barbero(c.barbero), s = DB.servicio(c.servicio);
    UI.modal({
      titulo: "Detalle de cita #" + id,
      icon: '<i class="fas fa-calendar-check"></i>',
      body:
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">' + UI.avatar(cl.nombre, "avatar-lg") +
        '<div><div style="font-weight:700;">' + cl.nombre + "</div><div class='cell-muted'>" + cl.telefono + "</div></div>" +
        '<div style="margin-left:auto;">' + UI.estadoBadge(c.estado) + "</div></div>" +
        '<div style="display:grid;gap:10px;">' +
        [["Servicio", s.nombre], ["Barbero", b.nombre], ["Fecha", DB.formatFechaLargaConAno(c.fecha)], ["Hora", c.hora + " hs"], ["Duracion", s.duracion + " min"], ["Precio", DB.formatPrecio(s.precio)]].map(function (f) {
          return '<div style="display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--line);"><span class="cell-muted">' + f[0] + "</span><span style='font-weight:600;'>" + f[1] + "</span></div>";
        }).join("") + "</div>",
      footer: '<button class="btn btn-ghost" data-cerrar-modal>Cerrar</button>' +
        '<button class="btn btn-primary" data-cerrar-modal>Entendido</button>'
    });
    setTimeout(function () {
      document.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", function () {
          document.querySelectorAll(".modal-overlay").forEach(function (o) { o.remove(); });
          document.body.style.overflow = "";
        });
      });
    }, 30);
  }

  function abrirFormCita(id) {
    var c = id ? DB.cita(id) : null;
    var d = DB;
    var body =
      '<div style="display:grid;gap:12px;">' +
      '<div class="field"><label class="field-label">Cliente <span class="req">*</span></label>' +
      '<select class="select" id="f-cliente"><option value="">Selecciona</option>' +
      d.clientes.map(function (cl) { return '<option value="' + cl.id + '"' + (c && c.cliente === cl.id ? " selected" : "") + ">" + cl.nombre + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="field"><label class="field-label">Servicio <span class="req">*</span></label>' +
      '<select class="select" id="f-servicio"><option value="">Selecciona</option>' +
      d.servicios.filter(function (s) { return s.activo; }).map(function (s) { return '<option value="' + s.id + '"' + (c && c.servicio === s.id ? " selected" : "") + ">" + s.nombre + " · " + d.formatPrecio(s.precio) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="field"><label class="field-label">Barbero <span class="req">*</span></label>' +
      '<select class="select" id="f-barbero"><option value="">Selecciona</option>' +
      d.barberos.filter(function (b) { return b.activo; }).map(function (b) { return '<option value="' + b.id + '"' + (c && c.barbero === b.id ? " selected" : "") + ">" + b.nombre + " (" + b.horarioIni + "-" + b.horarioFin + ")</option>"; }).join("") +
      "</select></div>" +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div class="field"><label class="field-label">Fecha <span class="req">*</span></label><input type="date" class="input" id="f-fecha" value="' + (c ? c.fecha : d.iso(1)) + '"></div>' +
      '<div class="field"><label class="field-label">Hora <span class="req">*</span></label><input type="time" class="input" id="f-hora" value="' + (c ? c.hora : "10:00") + '"></div>' +
      "</div>" +
      '<div class="field"><label class="field-label">Estado</label>' +
      '<select class="select" id="f-estado">' +
      ["pendiente", "confirmada", "espera", "atencion", "completada", "cancelada"].map(function (e) {
        return '<option value="' + e + '"' + (c && c.estado === e ? " selected" : "") + ">" + UI.ESTADOS[e].label + "</option>";
      }).join("") + "</select></div>" +
      "</div>" +
      '<div style="margin-top:14px;padding:12px;background:var(--sand);border-radius:9px;font-size:12.5px;color:var(--smoke);">' +
      '<i class="fas fa-circle-info" style="color:var(--brass-dim);margin-right:6px;"></i>El sistema verifica la disponibilidad del barbero al guardar.</div>';

    var m = UI.modal({
      titulo: c ? "Editar cita #" + id : "Nueva cita",
      icon: '<i class="fas fa-calendar-check"></i>',
      body: body,
      footer:
        '<button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>' +
        '<button class="btn btn-primary" data-guardar-cita="' + (id || "") + '"><i class="fas fa-floppy-disk"></i> Guardar</button>'
    });
    setTimeout(function () {
      var guardar = m.overlay.querySelector("[data-guardar-cita]");
      var cerrar = m.overlay.querySelectorAll("[data-cerrar-modal]");
      if (guardar) guardar.addEventListener("click", function () {
        var clId = m.overlay.querySelector("#f-cliente").value;
        var sId = m.overlay.querySelector("#f-servicio").value;
        if (!clId || !sId) {
          UI.toast("Campos incompletos", "Selecciona cliente y servicio.", "error");
          return;
        }
        UI.toast(c ? "Cita actualizada" : "Cita creada", "La cita fue " + (c ? "modificada" : "registrada") + " correctamente.", "success");
        m.close();
        App.navigate("citas");
      });
      cerrar.forEach(function (b) { b.addEventListener("click", function () { m.close(); }); });
    }, 30);
  }

  function abrirCambiarBarbero(id) {
    var c = DB.cita(id), s = DB.servicio(c.servicio);
    var body = '<div style="display:grid;gap:12px;">' +
      '<div style="font-size:13.5px;color:var(--smoke);">Cambia el barbero asignado a la cita de <strong>' + s.nombre + "</strong> del " + DB.formatFechaLarga(c.fecha) + " a las " + c.hora + ".</div>" +
      '<div class="field"><label class="field-label">Nuevo barbero <span class="req">*</span></label>' +
      '<select class="select" id="nb-barbero">' +
      DB.barberos.filter(function (b) { return b.activo; }).map(function (b) {
        return '<option value="' + b.id + '"' + (b.id === c.barbero ? " selected" : "") + ">" + b.nombre + "</option>";
      }).join("") + "</select></div></div>";
    var m = UI.modal({
      titulo: "Cambiar barbero",
      icon: '<i class="fas fa-user-tie"></i>',
      body: body,
      footer: '<button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>' +
        '<button class="btn btn-primary" data-ok>Confirmar cambio</button>'
    });
    setTimeout(function () {
      m.overlay.querySelector("[data-ok]").addEventListener("click", function () {
        var nuevo = m.overlay.querySelector("#nb-barbero").value;
        DB.cita(id).barbero = +nuevo;
        UI.toast("Barbero actualizado", "La cita fue reasignada correctamente.", "success");
        m.close();
        App.navigate("citas");
      });
      m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", function () { m.close(); });
      });
    }, 30);
  }

  function abrirReprogramarAdmin(id) {
    var c = DB.cita(id), s = DB.servicio(c.servicio);
    var body = '<div style="display:grid;gap:12px;">' +
      '<div style="font-size:13.5px;color:var(--smoke);">Reprograma la cita de <strong>' + s.nombre + "</strong> del " + DB.formatFechaLarga(c.fecha) + ".</div>" +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div class="field"><label class="field-label">Nueva fecha <span class="req">*</span></label><input type="date" class="input" id="n-fecha" value="' + c.fecha + '"></div>' +
      '<div class="field"><label class="field-label">Nueva hora <span class="req">*</span></label><input type="time" class="input" id="n-hora" value="' + c.hora + '"></div>' +
      "</div></div>";
    var m = UI.modal({
      titulo: "Reprogramar cita",
      icon: '<i class="fas fa-calendar-plus"></i>',
      body: body,
      footer: '<button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>' +
        '<button class="btn btn-primary" data-ok>Confirmar</button>'
    });
    setTimeout(function () {
      m.overlay.querySelector("[data-ok]").addEventListener("click", function () {
        var f = m.overlay.querySelector("#n-fecha").value;
        var h = m.overlay.querySelector("#n-hora").value;
        if (!f || !h) { UI.toast("Datos incompletos", "Indica fecha y hora.", "error"); return; }
        c.fecha = f; c.hora = h;
        UI.toast("Cita reprogramada", "Se notifico al cliente del nuevo horario.", "success");
        m.close();
        App.navigate("citas");
      });
      m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", function () { m.close(); });
      });
    }, 30);
  }

  function cancelarCitaAdmin(id) {
    var c = DB.cita(id), cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio);
    UI.confirm({
      titulo: "Cancelar cita #" + id,
      tipo: "danger",
      icono: "fa-xmark",
      mensaje: "Vas a cancelar la cita de <strong>" + cl.nombre + "</strong> (" + s.nombre + "). Se notificara al cliente.",
      confirmarTexto: "Cancelar cita",
      onConfirm: function () {
        DB.actualizarEstadoCita(id, "cancelada");
        UI.toast("Cita cancelada", "El cliente fue notificado del cambio.", "info");
        App.navigate("citas");
      }
    });
  }
  /* ---------- Gestion de clientes (admin) ---------- */
  function rClientesAdmin() {
    var d = DB;
    var html = '<section class="card"><div class="card-header" style="flex-wrap:wrap;gap:12px;">' +
      '<div><div class="card-title">Clientes</div><div class="card-sub">' + d.clientes.length + " registrados</div></div>" +
      '<div style="margin-left:auto;" class="filters">' +
      '<div class="input-wrap"><i class="fas fa-magnifying-glass" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--mist);font-size:13px;"></i>' +
      '<input class="input" id="buscar-cliente" placeholder="Buscar por nombre, telefono..." style="padding-left:32px;min-width:230px;"></div>' +
      '<button class="btn btn-primary btn-sm" id="nuevo-cliente"><i class="fas fa-plus"></i> Nuevo cliente</button>' +
      "</div></div>";

    html += '<div class="table-wrap"><table class="table table-responsive"><thead><tr>' +
      ["Cliente", "Telefono", "Correo", "Citas", "Ultima cita", "Estado", "Acciones"].map(function (h) { return "<th>" + h + "</th>"; }).join("") +
      "</tr></thead><tbody>";
    d.clientes.forEach(function (cl) {
      html += "<tr>" +
        '<td data-label="Cliente"><div style="display:flex;align-items:center;gap:10px;">' + UI.avatar(cl.nombre) +
        '<span class="cell-primary">' + cl.nombre + "</span></div></td>" +
        '<td data-label="Telefono">' + cl.telefono + "</td>" +
        '<td data-label="Correo" class="cell-muted">' + cl.correo + "</td>" +
        '<td data-label="Citas">' + cl.citas + "</td>" +
        '<td data-label="Ultima cita">' + (cl.ultima ? d.formatFechaLarga(cl.ultima) : "<span class='cell-muted'>Sin citas</span>") + "</td>" +
        '<td data-label="Estado">' + UI.badge(cl.estado) + "</td>" +
        '<td data-label="Acciones"><div class="actions">' +
        '<button class="btn btn-icon btn-ghost" data-perfil-cliente="' + cl.id + '" title="Ver perfil"><i class="fas fa-user"></i></button>' +
        '<button class="btn btn-icon btn-ghost" data-editar-cliente="' + cl.id + '" title="Editar"><i class="fas fa-pen"></i></button>' +
        '<button class="btn btn-icon btn-ghost" data-historial-cliente="' + cl.id + '" title="Historial"><i class="fas fa-clock-rotate-left"></i></button>' +
        "</div></td></tr>";
    });
    html += "</tbody></table></div></section>";
    return html;
  }

  function bindClientesAdmin() {
    var region = App.el("view-region");
    if (!region) return;

    var buscar = region.querySelector("#buscar-cliente");
    if (buscar) buscar.addEventListener("input", function () {
      var q = buscar.value.toLowerCase();
      region.querySelectorAll("tbody tr").forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().indexOf(q) > -1 ? "" : "none";
      });
    });

    var nuevo = region.querySelector("#nuevo-cliente");
    if (nuevo) nuevo.addEventListener("click", function () { abrirFormCliente(null); });

    region.addEventListener("click", function (e) {
      var perfil = e.target.closest("[data-perfil-cliente]");
      if (perfil) abrirPerfilCliente(+perfil.getAttribute("data-perfil-cliente"));
      var editar = e.target.closest("[data-editar-cliente]");
      if (editar) abrirFormCliente(+editar.getAttribute("data-editar-cliente"));
      var hist = e.target.closest("[data-historial-cliente]");
      if (hist) abrirHistorialCliente(+hist.getAttribute("data-historial-cliente"));
    });
  }

  function abrirPerfilCliente(id) {
    var cl = DB.cliente(id);
    var citasCl = DB.citas.filter(function (c) { return c.cliente === id; });
    var completadas = citasCl.filter(function (c) { return c.estado === "completada"; }).length;
    var canceladas = citasCl.filter(function (c) { return c.estado === "cancelada"; }).length;
    var ultimo = citasCl.filter(function (c) { return c.estado === "completada"; }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; })[0];
    var ultimoS = ultimo ? DB.servicio(ultimo.servicio).nombre : "—";

    var html =
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">' + UI.avatar(cl.nombre, "avatar-lg") +
      '<div><div style="font-size:16px;font-weight:700;">' + cl.nombre + "</div>" +
      '<div class="cell-muted">' + cl.telefono + " · " + cl.correo + "</div></div>" +
      '<div style="margin-left:auto;">' + UI.badge(cl.estado) + "</div></div>" +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px;">' +
      [[citasCl.length, "Total citas"], [completadas, "Completadas"], [canceladas, "Canceladas"], [ultimoS, "Ultimo servicio"]].map(function (k) {
        return '<div style="text-align:center;padding:10px 4px;background:var(--sand);border-radius:9px;"><div style="font-size:16px;font-weight:700;">' + k[0] + "</div>" +
          '<div class="cell-muted" style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;">' + k[1] + "</div></div>";
      }).join("") + "</div>" +

      '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--smoke);margin-bottom:10px;">Historial de citas</div>' +
      '<div style="display:grid;gap:8px;">' +
      (citasCl.length ? citasCl.slice(0, 5).map(function (c) {
        var s = DB.servicio(c.servicio), b = DB.barbero(c.barbero);
        return '<div class="appt-tile ' + c.estado + '">' +
          '<div class="appt-time">' + c.hora + "</div>" +
          '<div class="appt-main"><div class="appt-title">' + s.nombre + "</div>" +
          '<div class="appt-sub">' + b.nombre + " · " + DB.formatFechaLarga(c.fecha) + "</div></div>" +
          UI.estadoBadge(c.estado) + "</div>";
      }).join("") : '<div class="cell-muted" style="text-align:center;padding:20px;">Sin citas registradas.</div>') +
      "</div>";

    UI.modal({
      titulo: "Perfil del cliente",
      icon: '<i class="fas fa-user"></i>',
      body: html,
      footer: '<button class="btn btn-ghost" data-cerrar-modal>Cerrar</button>' +
        '<button class="btn btn-primary" data-cerrar-modal>Entendido</button>'
    });
    setTimeout(function () {
      document.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", function () {
          document.querySelectorAll(".modal-overlay").forEach(function (o) { o.remove(); });
          document.body.style.overflow = "";
        });
      });
    }, 30);
  }

  function abrirFormCliente(id) {
    var cl = id ? DB.cliente(id) : null;
    var m = UI.modal({
      titulo: cl ? "Editar cliente" : "Nuevo cliente",
      icon: '<i class="fas fa-user-plus"></i>',
      body:
        '<div style="display:grid;gap:12px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div class="field"><label class="field-label">Nombre <span class="req">*</span></label><input class="input" id="cl-nombre" value="' + (cl ? cl.nombre : "") + '"></div>' +
        '<div class="field"><label class="field-label">Telefono <span class="req">*</span></label><input class="input" id="cl-tel" value="' + (cl ? cl.telefono : "") + '"></div>' +
        "</div>" +
        '<div class="field"><label class="field-label">Correo <span class="req">*</span></label><input class="input" type="email" id="cl-correo" value="' + (cl ? cl.correo : "") + '"></div>' +
        '<div class="field"><label class="field-label">Estado</label>' +
        '<select class="select" id="cl-estado">' +
        '<option value="activo"' + (cl && cl.estado === "activo" ? " selected" : "") + ">Activo</option>" +
        '<option value="inactivo"' + (cl && cl.estado === "inactivo" ? " selected" : "") + ">Inactivo</option>" +
        "</select></div></div>",
      footer:
        '<button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>' +
        '<button class="btn btn-primary" data-guardar>Guardar</button>'
    });
    setTimeout(function () {
      m.overlay.querySelector("[data-guardar]").addEventListener("click", function () {
        var n = m.overlay.querySelector("#cl-nombre").value;
        var t = m.overlay.querySelector("#cl-tel").value;
        if (!n || !t) { UI.toast("Datos incompletos", "Nombre y telefono son obligatorios.", "error"); return; }
        UI.toast(cl ? "Cliente actualizado" : "Cliente creado", "Los datos fueron guardados.", "success");
        m.close();
        App.navigate("clientes");
      });
      m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", function () { m.close(); });
      });
    }, 30);
  }

  function abrirHistorialCliente(id) {
    var cl = DB.cliente(id);
    var citasCl = DB.citas.filter(function (c) { return c.cliente === id; })
      .sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
    var html =
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">' + UI.avatar(cl.nombre) +
      '<div><div style="font-weight:700;">' + cl.nombre + "</div><div class='cell-muted'>" + citasCl.length + " citas registradas</div></div></div>" +
      '<div style="display:grid;gap:8px;">' +
      (citasCl.length ? citasCl.map(function (c) {
        var s = DB.servicio(c.servicio), b = DB.barbero(c.barbero);
        return '<div class="appt-tile ' + c.estado + '">' +
          '<div class="appt-time">' + c.hora + "</div>" +
          '<div class="appt-main"><div class="appt-title">' + s.nombre + "</div>" +
          '<div class="appt-sub">' + b.nombre + " · " + DB.formatFechaLarga(c.fecha) + "</div></div>" +
          UI.estadoBadge(c.estado) + "</div>";
      }).join("") : '<div class="cell-muted" style="text-align:center;padding:20px;">Sin historial.</div>') +
      "</div>";
    UI.modal({
      titulo: "Historial de citas",
      icon: '<i class="fas fa-clock-rotate-left"></i>',
      body: html,
      footer: '<button class="btn btn-ghost" data-cerrar-modal>Cerrar</button>'
    });
    setTimeout(function () {
      document.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", function () {
          document.querySelectorAll(".modal-overlay").forEach(function (o) { o.remove(); });
          document.body.style.overflow = "";
        });
      });
    }, 30);
  }
  /* ---------- Gestion de barberos (admin) ---------- */
  function rBarberosAdmin() {
    var d = DB;
    var html = '<section class="card"><div class="card-header" style="flex-wrap:wrap;gap:12px;">' +
      '<div><div class="card-title">Barberos y empleados</div><div class="card-sub">' + d.barberos.filter(function (b) { return b.activo; }).length + " activos</div></div>" +
      '<button class="btn btn-primary btn-sm" style="margin-left:auto;" id="nuevo-barbero"><i class="fas fa-plus"></i> Agregar empleado</button></div>';

    html += '<div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;">';
    d.barberos.forEach(function (b) {
      html += '<div class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px;' + (b.activo ? "" : "opacity:.75;") + '">' +
        '<div style="display:flex;align-items:center;gap:12px;">' + UI.avatar(b.nombre, "avatar-lg") +
        '<div style="flex:1;min-width:0;"><div style="font-weight:700;">' + b.nombre + "</div>" +
        '<div class="cell-muted" style="font-size:12px;">' + b.especialidad + "</div></div>" +
        UI.badge(b.activo ? "activo" : "inactivo") + "</div>" +
        '<div style="display:flex;gap:8px;font-size:12.5px;color:var(--smoke);flex-wrap:wrap;">' +
        '<span><i class="fas fa-clock" style="color:var(--brass-dim);margin-right:4px;"></i>' + b.horarioIni + " - " + b.horarioFin + "</span>" +
        '<span><i class="fas fa-calendar-check" style="color:var(--brass-dim);margin-right:4px;"></i>' + b.citas + " citas</span>" +
        "</div>" +
        '<div style="display:flex;gap:6px;margin-top:2px;">' +
        '<button class="btn btn-sm btn-ghost" data-editar-barbero="' + b.id + '"><i class="fas fa-pen"></i> Editar</button>' +
        '<button class="btn btn-sm btn-ghost" data-agenda-barbero="' + b.id + '"><i class="fas fa-calendar-days"></i> Agenda</button>' +
        '<button class="btn btn-sm ' + (b.activo ? "btn-danger" : "btn-ghost") + '" data-toggle-barbero="' + b.id + '" style="margin-left:auto;">' +
        (b.activo ? '<i class="fas fa-pause"></i> Desactivar' : '<i class="fas fa-play"></i> Activar') + "</button>" +
        "</div></div>";
    });
    html += "</div></section>";
    return html;
  }

  function bindBarberosAdmin() {
    var region = App.el("view-region");
    if (!region) return;
    var nuevo = region.querySelector("#nuevo-barbero");
    if (nuevo) nuevo.addEventListener("click", function () { abrirFormBarbero(null); });

    region.addEventListener("click", function (e) {
      var editar = e.target.closest("[data-editar-barbero]");
      if (editar) abrirFormBarbero(+editar.getAttribute("data-editar-barbero"));
      var toggle = e.target.closest("[data-toggle-barbero]");
      if (toggle) {
        var b = DB.barbero(+toggle.getAttribute("data-toggle-barbero"));
        b.activo = !b.activo;
        UI.toast(b.activo ? "Barbero activado" : "Barbero desactivado", b.nombre + " fue " + (b.activo ? "reactivado" : "desactivado") + " del sistema.", "success");
        App.navigate("barberos");
      }
      var agenda = e.target.closest("[data-agenda-barbero]");
      if (agenda) {
        filtroHorarios.barbero = +agenda.getAttribute("data-agenda-barbero");
        App.navigate("horarios");
      }
    });
  }

  function abrirFormBarbero(id) {
    var b = id ? DB.barbero(id) : null;
    var m = UI.modal({
      titulo: b ? "Editar barbero" : "Nuevo empleado",
      icon: '<i class="fas fa-user-tie"></i>',
      body:
        '<div style="display:grid;gap:12px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div class="field"><label class="field-label">Nombre <span class="req">*</span></label><input class="input" id="b-nombre" value="' + (b ? b.nombre : "") + '"></div>' +
        '<div class="field"><label class="field-label">Apellido</label><input class="input" value=""></div>' +
        "</div>" +
        '<div class="field"><label class="field-label">Correo <span class="req">*</span></label><input class="input" type="email" value="' + (b ? b.nombre.toLowerCase().replace(/\s/g, ".") + "@barberia.com" : "") + '"></div>' +
        '<div class="field"><label class="field-label">Telefono</label><input class="input" placeholder="300 000 0000"></div>' +
        '<div class="field"><label class="field-label">Especialidad <span class="req">*</span></label><input class="input" id="b-esp" value="' + (b ? b.especialidad : "") + '"></div>' +
        '<div class="field"><label class="field-label">Experiencia</label><input class="input" value="' + (b ? b.experiencia : "") + '"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div class="field"><label class="field-label">Hora inicio <span class="req">*</span></label><input class="input" type="time" value="' + (b ? b.horarioIni : "09:00") + '"></div>' +
        '<div class="field"><label class="field-label">Hora fin <span class="req">*</span></label><input class="input" type="time" value="' + (b ? b.horarioFin : "18:00") + '"></div>' +
        "</div>" +
        '<div class="field"><label class="field-label">Estado</label><select class="select">' +
        '<option value="activo"' + (!b || b.activo ? " selected" : "") + ">Activo</option>" +
        '<option value="inactivo"' + (b && !b.activo ? " selected" : "") + ">Inactivo</option></select></div>" +
        "</div>",
      footer:
        '<button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>' +
        '<button class="btn btn-primary" data-guardar><i class="fas fa-floppy-disk"></i> Guardar</button>'
    });
    setTimeout(function () {
      m.overlay.querySelector("[data-guardar]").addEventListener("click", function () {
        var n = m.overlay.querySelector("#b-nombre").value;
        var e = m.overlay.querySelector("#b-esp").value;
        if (!n || !e) { UI.toast("Datos incompletos", "Nombre y especialidad son obligatorios.", "error"); return; }
        UI.toast(b ? "Empleado actualizado" : "Empleado creado", "El registro fue guardado correctamente.", "success");
        m.close();
        App.navigate("barberos");
      });
      m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (btn) {
        btn.addEventListener("click", function () { m.close(); });
      });
    }, 30);
  }

  /* ---------- Gestion de servicios ---------- */
  function rServiciosAdmin() {
    var d = DB;
    var html = '<section class="card"><div class="card-header" style="flex-wrap:wrap;gap:12px;">' +
      '<div><div class="card-title">Servicios</div><div class="card-sub">' + d.servicios.filter(function (s) { return s.activo; }).length + " activos</div></div>" +
      '<button class="btn btn-primary btn-sm" style="margin-left:auto;" id="nuevo-servicio"><i class="fas fa-plus"></i> Crear servicio</button></div>';

    html += '<div class="table-wrap"><table class="table table-responsive"><thead><tr>' +
      ["Servicio", "Descripcion", "Duracion", "Precio", "Estado", "Acciones"].map(function (h) { return "<th>" + h + "</th>"; }).join("") +
      "</tr></thead><tbody>";
    d.servicios.forEach(function (s) {
      html += "<tr" + (s.activo ? "" : ' style="opacity:.7;"') + ">" +
        '<td data-label="Servicio"><span class="cell-primary">' + s.nombre + "</span></td>" +
        '<td data-label="Descripcion" class="cell-muted">' + s.descripcion + "</td>" +
        '<td data-label="Duracion">' + s.duracion + " min</td>" +
        '<td data-label="Precio"><span class="cell-primary text-brass">' + d.formatPrecio(s.precio) + "</span></td>" +
        '<td data-label="Estado">' + UI.badge(s.activo ? "activo" : "inactivo") + "</td>" +
        '<td data-label="Acciones"><div class="actions">' +
        '<button class="btn btn-icon btn-ghost" data-editar-servicio="' + s.id + '" title="Editar"><i class="fas fa-pen"></i></button>' +
        '<button class="btn btn-icon ' + (s.activo ? "btn-danger" : "btn-ghost") + '" data-toggle-servicio="' + s.id + '" title="' + (s.activo ? "Desactivar" : "Activar") + '"><i class="fas ' + (s.activo ? "fa-pause" : "fa-play") + '"></i></button>' +
        '<button class="btn btn-icon btn-danger" data-eliminar-servicio="' + s.id + '" title="Eliminar"><i class="fas fa-trash"></i></button>' +
        "</div></td></tr>";
    });
    html += "</tbody></table></div></section>";
    return html;
  }

  function bindServiciosAdmin() {
    var region = App.el("view-region");
    if (!region) return;
    var nuevo = region.querySelector("#nuevo-servicio");
    if (nuevo) nuevo.addEventListener("click", function () { abrirFormServicio(null); });

    region.addEventListener("click", function (e) {
      var editar = e.target.closest("[data-editar-servicio]");
      if (editar) abrirFormServicio(+editar.getAttribute("data-editar-servicio"));
      var toggle = e.target.closest("[data-toggle-servicio]");
      if (toggle) {
        var s = DB.servicio(+toggle.getAttribute("data-toggle-servicio"));
        s.activo = !s.activo;
        UI.toast(s.activo ? "Servicio activado" : "Servicio desactivado", s.nombre + " fue actualizado.", "success");
        App.navigate("servicios");
      }
      var eliminar = e.target.closest("[data-eliminar-servicio]");
      if (eliminar) {
        var srv = DB.servicio(+eliminar.getAttribute("data-eliminar-servicio"));
        UI.confirm({
          titulo: "Eliminar servicio",
          tipo: "danger",
          icono: "fa-trash",
          mensaje: "Vas a eliminar <strong>" + srv.nombre + "</strong>. Esta accion no se puede deshacer.",
          confirmarTexto: "Eliminar",
          onConfirm: function () {
            srv.activo = false;
            UI.toast("Servicio eliminado", srv.nombre + " ya no esta disponible.", "info");
            App.navigate("servicios");
          }
        });
      }
    });
  }

  function abrirFormServicio(id) {
    var s = id ? DB.servicio(id) : null;
    var m = UI.modal({
      titulo: s ? "Editar servicio" : "Nuevo servicio",
      icon: '<i class="fas fa-scissors"></i>',
      body:
        '<div style="display:grid;gap:12px;">' +
        '<div class="field"><label class="field-label">Nombre del servicio <span class="req">*</span></label><input class="input" id="s-nombre" value="' + (s ? s.nombre : "") + '"></div>' +
        '<div class="field"><label class="field-label">Descripcion</label><textarea class="textarea" rows="2">' + (s ? s.descripcion : "") + "</textarea></div>" +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div class="field"><label class="field-label">Duracion (min) <span class="req">*</span></label><input class="input" type="number" id="s-duracion" value="' + (s ? s.duracion : 30) + '"></div>' +
        '<div class="field"><label class="field-label">Precio (COP) <span class="req">*</span></label><input class="input" type="number" id="s-precio" value="' + (s ? s.precio : 15000) + '"></div>' +
        "</div>" +
        '<div class="field"><label class="field-label">Estado</label><select class="select">' +
        '<option value="activo"' + (!s || s.activo ? " selected" : "") + ">Activo</option>" +
        '<option value="inactivo"' + (s && !s.activo ? " selected" : "") + ">Inactivo</option></select></div>" +
        "</div>",
      footer:
        '<button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>' +
        '<button class="btn btn-primary" data-guardar><i class="fas fa-floppy-disk"></i> Guardar</button>'
    });
    setTimeout(function () {
      m.overlay.querySelector("[data-guardar]").addEventListener("click", function () {
        var n = m.overlay.querySelector("#s-nombre").value;
        var dur = m.overlay.querySelector("#s-duracion").value;
        var pre = m.overlay.querySelector("#s-precio").value;
        if (!n || !dur || !pre) { UI.toast("Datos incompletos", "Todos los campos obligatorios deben completarse.", "error"); return; }
        UI.toast(s ? "Servicio actualizado" : "Servicio creado", n + " fue guardado correctamente.", "success");
        m.close();
        App.navigate("servicios");
      });
      m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (btn) {
        btn.addEventListener("click", function () { m.close(); });
      });
    }, 30);
  }
  /* ---------- Horarios / disponibilidad ---------- */
  var filtroHorarios = { barbero: 0, fecha: "" };

  function rHorariosAdmin() {
    var d = DB;
    var barberoSel = filtroHorarios.barbero || (d.barberos.find(function (b) { return b.activo; }) || {}).id || 1;
    var fechaSel = filtroHorarios.fecha || d.iso(0);
    var b = d.barbero(barberoSel);

    var html = '<section class="card"><div class="card-header" style="flex-wrap:wrap;gap:12px;">' +
      '<div><div class="card-title">Consulta de horarios</div><div class="card-sub">Disponibilidad de los barberos</div></div>' +
      '<div style="margin-left:auto;" class="filters">' +
      '<select class="select" id="h-barbero">' +
      d.barberos.map(function (bb) { return '<option value="' + bb.id + '"' + (bb.id === barberoSel ? " selected" : "") + ">" + bb.nombre + "</option>"; }).join("") +
      "</select>" +
      '<input type="date" class="input" id="h-fecha" value="' + fechaSel + '">' +
      "</div></div>";

    html += '<div class="card-body">';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' + UI.avatar(b.nombre) +
      '<div><div style="font-weight:700;">' + b.nombre + "</div>" +
      '<div class="cell-muted">' + b.especialidad + " · Horario laboral: <strong>" + b.horarioIni + " - " + b.horarioFin + "</strong></div></div>" +
      '<div style="margin-left:auto;" class="hide-xs">' +
      '<span class="badge badge-completada badge-dotless">Disponible</span> ' +
      '<span class="badge badge-neutral badge-dotless" style="margin-left:4px;">Ocupado</span></div></div>';

    var slots = d.horariosLibres(barberoSel, fechaSel);
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:8px;">';
    slots.forEach(function (sl) {
      html += '<div class="schedule-slot ' + (sl.libre ? "available" : "taken") + '">' + sl.hora + "</div>";
    });
    html += "</div>";
    html += "</div></section>";

    /* Leyenda mobile */
    html += '<div class="show-xs" style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">' +
      '<span class="badge badge-completada badge-dotless">Disponible</span>' +
      '<span class="badge badge-neutral badge-dotless">Ocupado</span></div>';
    return html;
  }

  function bindHorariosAdmin() {
    var region = App.el("view-region");
    if (!region) return;
    var barbero = region.querySelector("#h-barbero");
    var fecha = region.querySelector("#h-fecha");
    if (barbero) barbero.addEventListener("change", function () {
      filtroHorarios.barbero = +barbero.value;
      App.navigate("horarios");
    });
    if (fecha) fecha.addEventListener("change", function () {
      filtroHorarios.fecha = fecha.value;
      App.navigate("horarios");
    });
  }

  /* ---------- Registro de servicio realizado ---------- */
  function rServicioRealizado() {
    var d = DB;
    var hoy = d.citasDe({ fecha: d.iso(0) }).filter(function (c) {
      return c.estado !== "cancelada" && c.estado !== "completada";
    });
    var html = '<section class="card"><div class="card-header"><div><div class="card-title">Registro de servicio realizado</div><div class="card-sub">Confirma la atencion de una cita</div></div></div>';

    if (!hoy.length) {
      html += '<div class="empty"><div class="empty-ico"><i class="fas fa-scissors"></i></div><div class="empty-title">No hay citas pendientes hoy</div><div class="empty-text">Todas las citas del dia ya fueron atendidas o canceladas.</div></div></section>';
      return html;
    }

    html += '<div style="padding:14px;display:grid;gap:10px;">';
    hoy.forEach(function (c) {
      var cl = d.cliente(c.cliente), s = d.servicio(c.servicio), b = d.barbero(c.barbero);
      html += '<div class="appt-tile ' + c.estado + '">' +
        '<div class="appt-time">' + c.hora + "</div>" +
        '<div class="appt-main"><div class="appt-title">' + cl.nombre + " — " + s.nombre + "</div>" +
        '<div class="appt-sub">' + b.nombre + " · " + s.duracion + " min · " + d.formatPrecio(s.precio) + "</div></div>" +
        UI.estadoBadge(c.estado) +
        '<button class="btn btn-sm btn-primary" data-servicio-realizado="' + c.id + '"><i class="fas fa-circle-check"></i> Confirmar</button>' +
        "</div>";
    });
    html += "</div></section>";
    return html;
  }

  function bindServicioRealizado() {
    var region = App.el("view-region");
    if (!region) return;
    region.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-servicio-realizado]");
      if (!btn) return;
      var id = +btn.getAttribute("data-servicio-realizado");
      var c = DB.cita(id), cl = DB.cliente(c.cliente), s = DB.servicio(c.servicio);
      UI.confirm({
        titulo: "Confirmar servicio",
        tipo: "success",
        icono: "fa-circle-check",
        mensaje: "Confirma que el servicio <strong>" + s.nombre + "</strong> fue realizado a <strong>" + cl.nombre + "</strong>.",
        confirmarTexto: "Si, fue realizado",
        onConfirm: function () {
          DB.actualizarEstadoCita(id, "completada");
          UI.toast("Servicio registrado", "La atencion de " + cl.nombre + " fue marcada como completada.", "success");
          App.navigate("servicios-realizados");
        }
      });
    });
  }

  /* ---------- Reportes ---------- */
  var filtroReporte = "semana";

  function rReportes() {
    var d = DB;
    var html = "";

    html += '<section class="card"><div class="card-header" style="flex-wrap:wrap;gap:12px;">' +
      '<div><div class="card-title">Reportes y estadisticas</div><div class="card-sub">Rendimiento del negocio</div></div>' +
      '<div style="margin-left:auto;display:flex;gap:6px;">' +
      ["dia", "semana", "mes"].map(function (p) {
        return '<button class="btn btn-sm ' + (filtroReporte === p ? "btn-dark" : "btn-ghost") + '" data-reporte="' + p + '">' +
          p.charAt(0).toUpperCase() + p.slice(1) + "</button>";
      }).join("") + "</div></div>";

    /* KPIs de reporte */
    var rango = filtroReporte === "dia" ? 1 : (filtroReporte === "semana" ? 7 : 30);
    var enRango = d.citas.filter(function (c) {
      var f = new Date(c.fecha + "T00:00:00");
      var lim = new Date(); lim.setDate(lim.getDate() - rango);
      return f >= lim;
    });
    var complet = enRango.filter(function (c) { return c.estado === "completada"; });
    var canc = enRango.filter(function (c) { return c.estado === "cancelada"; });
    var ingreso = complet.reduce(function (a, c) { return a + d.servicio(c.servicio).precio; }, 0);

    html += '<div style="padding:18px 20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;">' +
      [[enRango.length, "Citas en el periodo", "fa-calendar-day", "var(--st-atencion-bg)", "var(--st-atencion)"],
       [complet.length, "Completadas", "fa-circle-check", "var(--st-completada-bg)", "var(--st-completada)"],
       [canc.length, "Canceladas", "fa-xmark", "var(--st-cancelada-bg)", "var(--st-cancelada)"],
       [d.formatPrecio(ingreso), "Ingresos estimados", "fa-sack-dollar", "var(--bone)", "var(--brass-dim)"]].map(function (k) {
        return '<div class="kpi" style="border:1px solid var(--line);border-radius:10px;"><div class="kpi-top"><span class="kpi-ico" style="background:' + k[3] + ";color:" + k[4] + ';"><i class="fas ' + k[2] + '"></i></span><span class="kpi-label">' + k[1] + "</span></div>" +
          '<div class="kpi-value" style="font-size:22px;">' + k[0] + "</div></div>";
      }).join("") +
      "</div></section>";

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;margin-top:16px;">';

    /* Citas por dia de la semana */
    html += '<section class="card"><div class="card-header"><div><div class="card-title">Citas por dia</div><div class="card-sub">Ultimos 7 dias</div></div></div>';
    html += '<div class="card-body"><div class="bar-chart" id="chart-dias">';
    var diasSemana = [];
    for (var i = 6; i >= 0; i--) {
      var f = d.iso(-i);
      diasSemana.push({ fecha: f, n: d.citas.filter(function (c) { return c.fecha === f && c.estado !== "cancelada"; }).length });
    }
    var maxD = Math.max.apply(null, diasSemana.map(function (x) { return x.n; })) || 1;
    diasSemana.forEach(function (dd) {
      var pct = Math.round((dd.n / maxD) * 100);
      var lbl = new Date(dd.fecha + "T00:00:00").toLocaleDateString("es-CO", { weekday: "short" }).slice(0, 2);
      html += '<div class="bar-col"><div class="bar-track" style="height:0;" data-alto="' + pct + '"><span class="bar-val">' + dd.n + "</span></div>" +
        '<div class="bar-label">' + lbl + "</div></div>";
    });
    html += "</div></div></section>";

    /* Barberos con mas citas */
    html += '<section class="card"><div class="card-header"><div><div class="card-title">Barberos con mas citas</div><div class="card-sub">Todo el periodo</div></div></div>';
    html += '<div class="card-body">';
    var conteoB = {};
    enRango.forEach(function (c) {
      if (c.estado === "cancelada") return;
      conteoB[c.barbero] = (conteoB[c.barbero] || 0) + 1;
    });
    var topB = Object.keys(conteoB).map(function (k) { return { id: +k, n: conteoB[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
    var maxB = topB[0] ? topB[0].n : 1;
    html += topB.map(function (t) {
      var bb = d.barbero(t.id);
      var pct = Math.round((t.n / maxB) * 100);
      return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' + UI.avatar(bb.nombre, "avatar-sm") +
        '<div style="flex:1;"><div style="font-size:13px;font-weight:600;margin-bottom:4px;">' + bb.nombre + "</div>" +
        '<div style="height:7px;background:var(--bone);border-radius:999px;overflow:hidden;"><div class="barra" data-w="' + pct + '" style="height:100%;width:0;background:linear-gradient(90deg,var(--brass-light),var(--brass));border-radius:999px;"></div></div></div>' +
        '<span style="font-weight:700;font-size:13px;">' + t.n + "</span></div>";
    }).join("") + "</div></section>";

    /* Clientes frecuentes */
    html += '<section class="card"><div class="card-header"><div><div class="card-title">Clientes frecuentes</div><div class="card-sub">Top visitas</div></div></div>';
    html += '<div class="card-body">';
    var conteoC = {};
    enRango.forEach(function (c) {
      if (c.estado === "cancelada") return;
      conteoC[c.cliente] = (conteoC[c.cliente] || 0) + 1;
    });
    var topC = Object.keys(conteoC).map(function (k) { return { id: +k, n: conteoC[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
    html += topC.map(function (t, idx) {
      var cl = d.cliente(t.id);
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);">' +
        '<span style="font-weight:700;color:var(--brass-dim);width:18px;">' + (idx + 1) + "</span>" +
        UI.avatar(cl.nombre, "avatar-sm") +
        '<div style="flex:1;font-weight:600;font-size:13.5px;">' + cl.nombre + "</div>" +
        '<span class="badge badge-brass badge-dotless">' + t.n + " visitas</span></div>";
    }).join("") + "</div></section>";

    html += "</div>";
    return html;
  }

  function bindReportes() {
    var region = App.el("view-region");
    if (!region) return;
    region.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-reporte]");
      if (btn) {
        filtroReporte = btn.getAttribute("data-reporte");
        App.navigate("reportes");
      }
    });
  }

  /* ---------- Perfil (admin) ---------- */
  function rPerfilAdmin() {
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">';
    html += '<section class="card"><div class="card-body" style="text-align:center;">' +
      '<span class="avatar avatar-xl" style="margin:0 auto 14px;display:grid;">AR</span>' +
      '<div class="font-display" style="font-size:22px;font-weight:700;">Andres Reyes</div>' +
      '<div class="card-sub">Administrador de la barberia</div>' +
      '<div style="display:flex;justify-content:center;margin-top:12px;">' + UI.badge("activo") + "</div></div></section>";
    html += '<section class="card"><div class="card-header"><div><div class="card-title">Datos de la cuenta</div></div></div>' +
      '<div class="card-body" style="display:grid;gap:14px;">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div class="field"><label class="field-label">Nombre</label><input class="input" value="Andres"></div>' +
      '<div class="field"><label class="field-label">Apellido</label><input class="input" value="Reyes"></div></div>' +
      '<div class="field"><label class="field-label">Correo</label><input class="input" type="email" value="admin@corteperfecto.com"></div>' +
      '<div class="field"><label class="field-label">Telefono</label><input class="input" value="300 456 7890"></div></div>' +
      '<div class="card-footer" style="display:flex;justify-content:flex-end;"><button class="btn btn-primary" id="guardar-perfil"><i class="fas fa-floppy-disk"></i> Guardar</button></div></section>';
    html += "</div>";
    return html;
  }

  function bindPerfilAdmin() {
    var region = App.el("view-region");
    if (!region) return;
    var btn = region.querySelector("#guardar-perfil");
    if (btn) btn.addEventListener("click", function () {
      UI.toast("Perfil actualizado", "Tus datos fueron guardados correctamente.", "success");
    });
  }

  /* ---------- Registro de vistas admin ---------- */
  App.registerVista("admin", "dashboard", rDashboardAdmin, bindBarras);
  App.registerVista("admin", "barberos", rBarberosAdmin, bindBarberosAdmin);
  App.registerVista("admin", "servicios", rServiciosAdmin, bindServiciosAdmin);
  App.registerVista("admin", "reportes", rReportes, bindReportes);
  App.registerVista("admin", "perfil", rPerfilAdmin, bindPerfilAdmin);

  /* Compartidas con recepcionista */
  App.registerVista("admin", "citas", rCitasAdmin, bindCitasAdmin);
  App.registerVista("recepcion", "citas", rCitasAdmin, bindCitasAdmin);
  App.registerVista("admin", "clientes", rClientesAdmin, bindClientesAdmin);
  App.registerVista("recepcion", "clientes", rClientesAdmin, bindClientesAdmin);
  App.registerVista("admin", "horarios", rHorariosAdmin, bindHorariosAdmin);
  App.registerVista("recepcion", "horarios", rHorariosAdmin, bindHorariosAdmin);
  App.registerVista("admin", "servicios-realizados", rServicioRealizado, bindServicioRealizado);
  App.registerVista("recepcion", "servicios-realizados", rServicioRealizado, bindServicioRealizado);

  function bindBarras() {
    var region = App.el("view-region");
    if (!region) return;
    setTimeout(function () {
      if (window.gsap) {
        gsap.to(region.querySelectorAll(".barra"), {
          width: function () { return this.dataset.w + "%"; },
          duration: 0.8, ease: "power2.out", stagger: 0.06
        });
      }
      var chart = region.querySelector("#chart-dias");
      if (chart) {
        var tracks = chart.querySelectorAll(".bar-track");
        if (window.gsap) {
          gsap.fromTo(tracks, { height: 0 }, {
            height: function () { return this.dataset.alto + "%"; },
            duration: 0.8, ease: "power2.out", stagger: 0.07
          });
        } else {
          tracks.forEach(function (t) { t.style.height = t.dataset.alto + "%"; });
        }
      }
    }, 60);
  }

  // Compartir acceso a citas admin desde horarios
  App.filtroHorarios = function (bId) { filtroHorarios.barbero = bId; };
})();

