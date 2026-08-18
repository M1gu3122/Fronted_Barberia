/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Barberos / Empleados
   ============================================================ */
(function () {
  "use strict";

  var _empleados = [];

  function _nombre(e) {
    return (((e.usuario && e.usuario.nombres) || "") + " " + ((e.usuario && e.usuario.apellidos) || "")).trim();
  }

  function _activo(e) {
    return String(e.estado || "").toLowerCase() === "activo";
  }

  function _barbero(id) {
    for (var i = 0; i < _empleados.length; i++) {
      if (_empleados[i].id_usuario == id) return _empleados[i];
    }
    return null;
  }

  function rBarberosAdmin() {
    var html = `
      <section class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:12px;">
          <div><div class="card-title">Barberos y empleados</div><div class="card-sub" id="barberos-count">Cargando empleados...</div></div>
          <button class="btn btn-primary btn-sm" style="margin-left:auto;" id="nuevo-barbero"><i class="fas fa-plus"></i> Agregar empleado</button>
        </div>
        <div id="barberos-grid" style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;">
          <div class="cell-muted" style="grid-column:1/-1;text-align:center;padding:20px;">Cargando empleados...</div>
        </div>
      </section>`;

    api.getEmpleados()
      .then(function (lista) {
        _empleados = lista || [];
        var grid = document.getElementById("barberos-grid");
        if (!grid) return;
        var count = document.getElementById("barberos-count");
        var activos = _empleados.filter(_activo).length;
        if (count) count.textContent = activos + " activos";
        if (!_empleados.length) {
          grid.innerHTML = `<div class="cell-muted" style="grid-column:1/-1;text-align:center;padding:20px;">Sin empleados registrados</div>`;
          return;
        }
grid.innerHTML = _empleados.map(function (b) {
          var activo = _activo(b);
          var esBarbero = (b.tipo_empleado || "").toLowerCase() === "barbero";
 return `
  <div class="card" style="
    padding:16px;
    display:flex;
    flex-direction:column;
    gap:12px;
    ${activo ? "" : "opacity:.75;"}
  ">

    <div style="display:flex;align-items:center;gap:12px;">
      ${UI.avatar(_nombre(b), "avatar-lg")}

      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;">
          ${_nombre(b)}
        </div>

        <div class="cell-muted" style="font-size:12px;">
          ${b.tipo_empleado}
        </div>
      </div>

      ${UI.badge(activo ? "activo" : "inactivo")}
    </div>

    <div style="
      display:grid;
      grid-template-columns:repeat(2, 1fr);
      gap:7px;
      width:100%;
      max-width:420px;
      margin:4px auto 0;
    ">

      <button
        class="btn btn-sm btn-ghost"
        data-editar-barbero="${b.id_usuario}"
        style="justify-content:center;">
        <i class="fas fa-pen"></i>
        Editar
      </button>

      <button
        class="btn btn-sm btn-ghost"
        data-agenda-barbero="${b.id_usuario}"
        style="justify-content:center;">
        <i class="fas fa-calendar-days"></i>
        Agenda
      </button>

      ${esBarbero ? `
      <button
        class="btn btn-sm btn-ghost"
        data-servicios-barbero="${b.id_usuario}"
        style="justify-content:center;">
        <i class="fas fa-scissors"></i>
        Servicios
      </button>
      ` : ""}

      <button
        class="btn btn-sm ${activo ? "btn-danger" : "btn-ghost"}"
        data-toggle-barbero="${b.id_usuario}"
        style="justify-content:center;">
        ${activo
          ? '<i class="fas fa-pause"></i> Desactivar'
          : '<i class="fas fa-play"></i> Activar'}
      </button>

    </div>

  </div>`;
        }).join("");
      })
      .catch(function (err) {
        var grid = document.getElementById("barberos-grid");
        if (grid) grid.innerHTML = `<div class="cell-muted" style="grid-column:1/-1;text-align:center;padding:20px;">Error al cargar empleados</div>`;
        var count = document.getElementById("barberos-count");
        if (count) count.textContent = "Error al cargar";
        console.error("Backend error:", err);
      });

    return html;
  }

  function bindBarberosAdmin() {
    var region = App.el("view-region");
    if (!region) return;
    var nuevo = region.querySelector("#nuevo-barbero");
    if (nuevo) nuevo.addEventListener("click", async function () { abrirFormEmpleado(null); });

    if (region._barberosClick) region.removeEventListener("click", region._barberosClick);
    region._barberosClick = function (e) {
      var editar = e.target.closest("[data-editar-barbero]");
      if (editar) abrirFormEmpleado(+editar.getAttribute("data-editar-barbero"));
      var toggle = e.target.closest("[data-toggle-barbero]");
      if (toggle) {
        var b = _barbero(+toggle.getAttribute("data-toggle-barbero"));
        if (!b) return;
        var activar = !_activo(b);
        var nombre = _nombre(b);
        toggle.classList.add("btn-loading");
        toggle.disabled = true;
        (activar
          ? api.actualizarEmpleado(b.id_usuario, { estado: "Activo" })
          : api.actualizarEmpleado(b.id_usuario, { estado: "Inactivo" }))
          .then(function () {
            UI.toast(activar ? "Empleado activado" : "Empleado desactivado", nombre + " fue " + (activar ? "reactivado" : "desactivado") + " del sistema.", "success");
            App.navigate("barberos");
          })
          .catch(function (err) {
            toggle.classList.remove("btn-loading");
            toggle.disabled = false;
            UI.toast("Error", err.message || "No se pudo cambiar el estado.", "error");
          });
        return;
      }
      var agenda = e.target.closest("[data-agenda-barbero]");
      if (agenda) {
        filtroHorarios.barbero = +agenda.getAttribute("data-agenda-barbero");
        App.navigate("horarios");
      }
      var serviciosBtn = e.target.closest("[data-servicios-barbero]");
      if (serviciosBtn) abrirServiciosBarbero(+serviciosBtn.getAttribute("data-servicios-barbero"));
    };
    region.addEventListener("click", region._barberosClick);
  }

  async function abrirServiciosBarbero(barberoId) {
    var b = _barbero(barberoId);
    if (!b) return;
    var nombreBarbero = _nombre(b);

    // Cargar servicios del barbero y lista completa
    var [serviciosBarbero, todosServicios] = await Promise.all([
      api.getServiciosDelBarbero(barberoId).catch(() => []),
      api.getServicios().catch(() => [])
    ]);

    // Backend devuelve: { id_usuario, id_servicio }
    var idsAsignados = new Set((serviciosBarbero || []).map(function(s) { return s.id_servicio; }));
    var activos = todosServicios.filter(function(s) { return String(s.estado_servicio || "").toLowerCase() === "activo"; });

    var body = `
      <div style="display:grid;gap:14px;">
        <div style="background:var(--sand);padding:14px;border-radius:8px;border:1px solid var(--line);">
          <div style="font-weight:700;font-size:15px;">Asignar servicios a <strong>${nombreBarbero}</strong></div>
          <div class="cell-muted" style="font-size:12.5px;">Marca los servicios que este barbero puede realizar.</div>
        </div>
        <div style="max-height:320px;overflow-y:auto;display:grid;gap:8px;">
          ${activos.map(function (s) {
            var checked = idsAsignados.has(s.id_servicio) ? "checked" : "";
            return `
              <label class="adds-item" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--paper);border:1px solid var(--line);border-radius:8px;cursor:pointer;transition:all .15s;">
                <input type="checkbox" class="servicio-chk" value="${s.id_servicio}" ${checked} style="accent-color:var(--brass);width:18px;height:18px;">
                <div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13px;">${s.nombre_servicio}</div><div class="cell-muted" style="font-size:11.5px;">${s.tipo_servicio} · ${DB.formatPrecio(Number(s.precio_servicio))} · ${s.tiempo_estimado} min</div></div>
              </label>`;
          }).join("")}
        </div>
        <div class="field-hint">Los cambios se guardan automáticamente al hacer click en cada checkbox.</div>
      </div>
    `;

    var m = UI.modal({
      titulo: "Servicios del barbero",
      icon: '<i class="fas fa-scissors"></i>',
      body: body,
      footer: `
        <button class="btn btn-ghost" data-cerrar-modal>Cerrar</button>
      `
    });

    setTimeout(function () {
      m.overlay.querySelectorAll(".servicio-chk").forEach(function (chk) {
        chk.addEventListener("change", async function () {
          var idServicio = +chk.value;
          var asignar = chk.checked;
          chk.disabled = true;
          try {
            if (asignar) {
              await api.asignarServicioBarbero(barberoId, idServicio);
              UI.toast("Servicio asignado", "El servicio fue agregado al barbero.", "success");
            } else {
              await api.desasignarServicioBarbero(barberoId, idServicio);
              UI.toast("Servicio quitado", "El servicio fue removido del barbero.", "info");
            }
          } catch (err) {
            chk.checked = !asignar; // revertir
            UI.toast("Error", err.message || "No se pudo actualizar.", "error");
          } finally {
            chk.disabled = false;
          }
        });
      });
      m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (btn) {
        btn.addEventListener("click", function () { m.close(); });
      });
    }, 30);
  }

  function abrirFormEmpleado(id) {
    var b = id ? _barbero(id) : null;
    var partes = b ? _nombre(b).split(/\s+/) : [];
    var m = UI.modal({
      titulo: b ? "Editar empleado" : "Nuevo empleado",
      icon: '<i class="fas fa-user-tie"></i>',
      body: `
        <div style="display:grid;gap:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field"><label class="field-label">Nombres <span class="req">*</span></label><input class="input" id="b-nombres" value="${partes[0] || ""}" placeholder="Nombre del empleado"></div>
            <div class="field"><label class="field-label">Apellidos</label><input class="input" id="b-apellidos" value="${partes.slice(1).join(" ") || ""}" placeholder="Apellidos"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field"><label class="field-label">Identificacion <span class="req">*</span></label><input class="input" id="b-identificacion" value="${b ? (b.usuario && b.usuario.id_usuario) || "" : ""}" placeholder="Numero de identificacion"${b ? " readonly" : ""} style="${b ? "background:#f1f5f9;color:#64748b;cursor:not-allowed;" : ""}"></div>
            <div class="field"><label class="field-label">Correo <span class="req">*</span></label><input class="input" type="email" id="b-correo" value="${b ? (b.usuario && b.usuario.correo) || "" : ""}" placeholder="correo@barberia.com"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field"><label class="field-label">Telefono</label><input class="input" id="b-telefono" value="${b ? (b.usuario && b.usuario.telefono) || "" : ""}" placeholder="300 000 0000"></div>
            <div class="field"><label class="field-label">Fecha de contratacion</label><input class="input" type="text" id="b-fecha" value="${b ? b.fecha_contratacion || "" : ""}" placeholder="AAAA-MM-DD"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field"><label class="field-label">Tipo empleado</label><select class="select" id="b-tipo">
              <option value="Barbero"${b && b.tipo_empleado === "Barbero" ? " selected" : ""}>Barbero</option>
              <option value="Administrador"${b && b.tipo_empleado === "Administrador" ? " selected" : ""}>Administrador</option>
              <option value="Recepcionista"${b && b.tipo_empleado === "Recepcionista" ? " selected" : ""}>Recepcionista</option>
            </select></div>
            <div class="field"><label class="field-label">Estado</label><select class="select" id="b-estado">
              <option value="activo"${!b || _activo(b) ? " selected" : ""}>Activo</option>
              <option value="inactivo"${b && !_activo(b) ? " selected" : ""}>Inactivo</option>
            </select></div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>
        <button class="btn btn-primary" data-guardar><i class="fas fa-floppy-disk"></i> Guardar</button>
      `
    });
    setTimeout(function () {
      UI.datepicker(m.overlay.querySelector("#b-fecha"));
      m.overlay.querySelector("[data-guardar]").addEventListener("click", async function () {
        var n = m.overlay.querySelector("#b-nombres").value.trim();
        var a = m.overlay.querySelector("#b-apellidos").value.trim();
        var c = m.overlay.querySelector("#b-correo").value.trim();
        var t = m.overlay.querySelector("#b-telefono").value.trim();
        var tipo = m.overlay.querySelector("#b-tipo").value;

        if (!n || !c) {
          UI.toast("Datos incompletos", "Nombres y correo son obligatorios.", "error");
          return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)) {
          UI.toast("Correo invalido", "Ingresa un correo valido.", "error");
          return;
        }

        var fecha = m.overlay.querySelector("#b-fecha").value;
        var estado = m.overlay.querySelector("#b-estado").value;

        try {
          if (b) {
            var idu = (b.usuario && b.usuario.id_usuario) || b.id_usuario;
            var updUsuario = {
              nombres: n,
              apellidos: a,
              usuario: (n.split(" ")[0] + "." + a.split(" ")[0]).toLowerCase(),
              correo: c,
              telefono: t
            };
            await api.actualizarUsuario(idu, updUsuario);
            await api.actualizarEmpleado(b.id_usuario, {
              tipo_empleado: tipo,
              estado: estado === "inactivo" ? "Inactivo" : "Activo",
              fecha_contratacion: fecha
            });
            UI.toast("Empleado actualizado", "Los datos fueron guardados correctamente.", "success");
            m.close();
            App.navigate("barberos");
            return;
          }
          // Paso 1: crear el usuario
          var idu = m.overlay.querySelector("#b-identificacion").value.trim();
          if (!idu) {
            UI.toast("Datos incompletos", "La identificacion es obligatoria.", "error");
            return;
          }
          var userData = {
            id_usuario: idu,
            nombres: n,
            apellidos: a,
            usuario: (n.split(" ")[0] + "." + a.split(" ")[0]).toLowerCase(),
            contraseña: idu,
            correo: c,
            telefono: t
          };
          var nuevo = await api.crearUsuario(userData);
          // Paso 2: crear el empleado vinculado al usuario recien creado
          var empleadoId = (nuevo && (nuevo.id_usuario || nuevo.id)) || idu;
          var barb = await api.obtenerBarberia();
          await api.crearEmpleado({
            id_usuario: empleadoId,
            tipo_empleado: tipo,
            fecha_contratacion: fecha || DB.iso(0),
            id_barberia: (barb && barb.id_barberia) || 1
          });
          UI.toast("Empleado creado", "El registro fue guardado correctamente.", "success");
          m.close();
          App.navigate("barberos");
        } catch (err) {
          UI.toast("Error", err.message || "No se pudo guardar el empleado.", "error");
        }
      });
      m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (btn) {
        btn.addEventListener("click", async function () { m.close(); });
      });
    }, 30);
  }

  /* Registro de vistas */
  App.registerVista("admin", "barberos", rBarberosAdmin, bindBarberosAdmin);
})();