/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Horarios
   Implementado con API real
   ============================================================ */
(function () {
  "use strict";

  var filtroHorarios = { barbero: 0, fecha: "" };
  var _barberos = [];

  function rHorariosAdmin() {
    var d = DB;
    var fechaSel = filtroHorarios.fecha || d.iso(0);

    return `
      <section class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:12px;">
          <div><div class="card-title">Consulta de horarios</div><div class="card-sub">Disponibilidad de los barberos</div></div>
          <div style="margin-left:auto;" class="filters">
            <select class="select" id="h-barbero">
              <option value="0">Cargando barberos...</option>
            </select>
            <input type="date" class="input" id="h-fecha" value="${fechaSel}">
          </div>
        </div>
        <div class="card-body" id="horarios-content">
          <div class="empty" style="padding:40px;text-align:center;">
            <div class="empty-ico"><i class="fas fa-spinner fa-spin"></i></div>
            <div class="empty-title">Cargando horarios...</div>
          </div>
        </div>
      </section>`;
  }

  function bindHorariosAdmin() {
    var region = App.el("view-region");
    if (!region) return;

    var barberoSel = region.querySelector("#h-barbero");
    var fechaSel = region.querySelector("#h-fecha");

    // Cargar barberos
    api.getEmpleados()
      .then(function(lista) {
        // API devuelve: [{ id_usuario, tipo_empleado, estado, usuario: { nombres, apellidos, ... } }]
        _barberos = (lista || [])
          .filter(function(b) {
            return (b.tipo_empleado || "").toLowerCase() === "barbero" &&
                   String(b.estado).toLowerCase() === "activo";
          })
          .map(function(b) {
            var u = b.usuario || {};
            return {
              id_usuario: b.id_usuario,
              nombres: u.nombres || "",
              apellidos: u.apellidos || "",
              especialidad: b.especialidad || "Barbero",
              horarioIni: b.horarioIni || "09:00",
              horarioFin: b.horarioFin || "18:00"
            };
          });

        var barberoSelId = filtroHorarios.barbero || (_barberos[0] ? _barberos[0].id_usuario : 0);
        filtroHorarios.barbero = barberoSelId;

        if (barberoSel) {
          barberoSel.innerHTML = `<option value="0">Seleccione un barbero</option>` +
            _barberos.map(function(bb) {
              return `<option value="${bb.id_usuario}"${bb.id_usuario === barberoSelId ? " selected" : ""}>${bb.nombres} ${bb.apellidos}</option>`;
            }).join("");
        }
        return cargarHorarios(barberoSelId, filtroHorarios.fecha || DB.iso(0));
      })
      .catch(function(err) {
        console.error("Error cargando barberos:", err);
        var content = document.getElementById("horarios-content");
        if (content) content.innerHTML = '<div class="empty"><div class="empty-ico"><i class="fas fa-exclamation-triangle"></i></div><div class="empty-title">Error cargando barberos</div></div>';
      });

    // Eventos
    var barbero = region.querySelector("#h-barbero");
    var fecha = region.querySelector("#h-fecha");

    if (barbero) barbero.addEventListener("change", function () {
      filtroHorarios.barbero = +this.value;
      App.navigate("horarios");
    });

    if (fecha) fecha.addEventListener("change", function () {
      filtroHorarios.fecha = this.value;
      App.navigate("horarios");
    });
  }

  async function cargarHorarios(barberoId, fecha) {
    var content = document.getElementById("horarios-content");
    if (!content) return;

    if (!barberoId) {
      content.innerHTML = '<div class="empty"><div class="empty-ico"><i class="fas fa-user-tie"></i></div><div class="empty-title">Seleccione un barbero</div></div>';
      return;
    }

    content.innerHTML = '<div class="empty" style="padding:40px;text-align:center;"><div class="empty-ico"><i class="fas fa-spinner fa-spin"></i></div><div class="empty-title">Cargando horarios...</div></div>';

    try {
      var barbero = _barberos.find(function(b) { return b.id_usuario === barberoId; });

      if (!barbero) {
        content.innerHTML = '<div class="empty"><div class="empty-ico"><i class="fas fa-user-tie"></i></div><div class="empty-title">Barbero no encontrado</div></div>';
        return;
      }

      // Obtener citas del barbero para la fecha
      var citas = [];
      try {
        var todasCitas = await api.obtenerCitasDetalles();
        citas = (todasCitas || []).filter(function(c) {
          return c.id_barbero === barberoId &&
                 (c.fecha_hora || "").substr(0, 10) === fecha &&
                 String(c.estado_cita).toLowerCase() !== "cancelada";
        });
      } catch (e) {
        console.warn("Error cargando citas para horarios:", e);
      }

      // Generar slots de 30 min
      var horarioIni = barbero.horarioIni || "09:00";
      var horarioFin = barbero.horarioFin || "18:00";
      var ini = parseInt(horarioIni.split(":")[0]) * 60;
      var fin = parseInt(horarioFin.split(":")[0]) * 60;

      var slots = [];
      for (var t = ini; t + 30 <= fin; t += 30) {
        var hh = String(Math.floor(t / 60)).padStart(2, "0");
        var mm = String(t % 60).padStart(2, "0");
        var slot = hh + ":" + mm;

        var ocupado = citas.some(function(c) {
          var ch = (c.fecha_hora || "").substr(11, 5);
          return ch === slot;
        });

        slots.push({ hora: slot, libre: !ocupado });
      }

      // Render
      var html = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
          ${UI.avatar(barbero.nombres + " " + barbero.apellidos)}
          <div><div style="font-weight:700;">${barbero.nombres} ${barbero.apellidos}</div>
          <div class="cell-muted">${barbero.especialidad} · Horario laboral: <strong>${barbero.horarioIni} - ${barbero.horarioFin}</strong></div></div>
          <div style="margin-left:auto;" class="hide-xs">
            <span class="badge badge-completada badge-dotless">Disponible</span>
            <span class="badge badge-neutral badge-dotless" style="margin-left:4px;">Ocupado</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:8px;">
          ${slots.map(function (sl) {
            return `<div class="schedule-slot ${sl.libre ? "available" : "taken"}" title="${sl.hora}">${sl.hora}</div>`;
          }).join("")}
        </div>
        <div class="show-xs" style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">
          <span class="badge badge-completada badge-dotless">Disponible</span>
          <span class="badge badge-neutral badge-dotless">Ocupado</span>
        </div>`;

      var content = document.getElementById("horarios-content");
      if (content) content.innerHTML = html;

    } catch (err) {
      console.error("Error cargando horarios:", err);
      var content = document.getElementById("horarios-content");
      if (content) content.innerHTML = '<div class="empty"><div class="empty-ico"><i class="fas fa-exclamation-triangle"></i></div><div class="empty-title">Error cargando horarios</div></div>';
    }
  }

  /* Registro de vistas */
  App.registerVista("admin", "horarios", rHorariosAdmin, bindHorariosAdmin);
  App.registerVista("recepcion", "horarios", rHorariosAdmin, bindHorariosAdmin);

  // Acceso compartido: permite fijar el barbero filtrado desde otras vistas
  App.filtroHorarios = function (bId) { filtroHorarios.barbero = bId; };
})();