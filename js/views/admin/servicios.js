/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Servicios
   ============================================================ */
(function () {
  "use strict";

  var _servicios = [];

  function _activo(s) {
    return String(s.estado_servicio || "").toLowerCase() === "activo";
  }

  function _servicio(id) {
    for (var i = 0; i < _servicios.length; i++) {
      if (_servicios[i].id_servicio === id) return _servicios[i];
    }
    return null;
  }

  function rServiciosAdmin() {
    var html = `
      <section class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:12px;">
          <div><div class="card-title">Servicios</div><div class="card-sub" id="servicios-count">Cargando servicios...</div></div>
          <button class="btn btn-primary btn-sm" style="margin-left:auto;" id="nuevo-servicio"><i class="fas fa-plus"></i> Crear servicio</button>
        </div>
        <div class="table-wrap">
          <table class="table table-responsive">
            <thead><tr>
              ${["Servicio", "Tipo", "Descripcion", "Duracion", "Precio", "Estado", "Acciones"].map(function (h) { return `<th>${h}</th>`; }).join("")}
            </tr></thead>
            <tbody id="servicios-tbody">
              <tr><td colspan="7" class="cell-muted" style="text-align:center;padding:20px;">Cargando servicios...</td></tr>
            </tbody>
          </table>
        </div>
      </section>`;

    api.getServicios()
      .then(function (lista) {
        _servicios = lista || [];
        var count = document.getElementById("servicios-count");
        if (count) count.textContent = _servicios.filter(_activo).length + " activos";
        var tbody = document.getElementById("servicios-tbody");
        if (!tbody) return;
        if (!_servicios.length) {
          tbody.innerHTML = `<tr><td colspan="7" class="cell-muted" style="text-align:center;padding:20px;">Sin servicios registrados</td></tr>`;
          return;
        }
        tbody.innerHTML = _servicios.map(function (s) {
          var activo = _activo(s);
          return `
            <tr${activo ? "" : ' style="opacity:.7;"'}>
              <td data-label="Servicio"><span class="cell-primary">${s.nombre_servicio}</span></td>
              <td data-label="Tipo"><span class="badge badge-dotless ${s.tipo_servicio === "PRINCIPAL" ? "badge-confirmada" : "badge-pendiente"}">${s.tipo_servicio}</span></td>
              <td data-label="Descripcion" class="cell-muted">${s.descripcion_servicio || ""}</td>
              <td data-label="Duracion">${s.tiempo_estimado} min</td>
              <td data-label="Precio">
    <span class="cell-primary text-brass">
        $${Number(s.precio_servicio).toLocaleString('es-CO')}
    </span>
</td>
              <td data-label="Estado">${UI.badge(activo ? "activo" : "inactivo")}</td>
              <td data-label="Acciones"><div class="actions">
                <button class="btn btn-icon btn-ghost" data-editar-servicio="${s.id_servicio}" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn btn-icon ${activo ? "btn-danger" : "btn-ghost"}" data-toggle-servicio="${s.id_servicio}" title="${activo ? "Desactivar" : "Activar"}"><i class="fas ${activo ? "fa-pause" : "fa-play"}"></i></button>
                <button class="btn btn-icon btn-danger" data-eliminar-servicio="${s.id_servicio}" title="Eliminar"><i class="fas fa-trash"></i></button>
              </div></td>
            </tr>`;
        }).join("");
      })
      .catch(function (err) {
        var count = document.getElementById("servicios-count");
        if (count) count.textContent = "Error al cargar";
        var tbody = document.getElementById("servicios-tbody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="cell-muted" style="text-align:center;padding:20px;">Error al cargar servicios</td></tr>`;
        console.error("Backend error:", err);
      });

    return html;
  }

  function bindServiciosAdmin() {
    var region = App.el("view-region");
    if (!region) return;
    var nuevo = region.querySelector("#nuevo-servicio");
    if (nuevo) nuevo.addEventListener("click", function () { abrirFormServicio(null); });

    if (region._serviciosClick) region.removeEventListener("click", region._serviciosClick);
    region._serviciosClick = function (e) {
      var editar = e.target.closest("[data-editar-servicio]");
      if (editar) { abrirFormServicio(+editar.getAttribute("data-editar-servicio")); return; }

      var toggle = e.target.closest("[data-toggle-servicio]");
      if (toggle) {
        var s = _servicio(+toggle.getAttribute("data-toggle-servicio"));
        if (!s) return;
        var activar = !_activo(s);
        var nombre = s.nombre_servicio;
        toggle.classList.add("btn-loading");
        toggle.disabled = true;
        api.actualizarServicio(s.id_servicio, { estado_servicio: activar ? "Activo" : "Inactivo" })
          .then(function () {
            UI.toast(activar ? "Servicio activado" : "Servicio desactivado", nombre + " fue actualizado.", "success");
            App.navigate("servicios");
          })
          .catch(function (err) {
            toggle.classList.remove("btn-loading");
            toggle.disabled = false;
            UI.toast("Error", err.message || "No se pudo cambiar el estado.", "error");
          });
        return;
      }

      var eliminar = e.target.closest("[data-eliminar-servicio]");
      if (eliminar) {
        var srv = _servicio(+eliminar.getAttribute("data-eliminar-servicio"));
        if (!srv) return;
        UI.confirm({
          titulo: "Eliminar servicio",
          tipo: "danger",
          icono: "fa-trash",
          mensaje: `Vas a eliminar <strong>${srv.nombre_servicio}</strong>. Esta accion no se puede deshacer.`,
          confirmarTexto: "Eliminar",
          onConfirm: function () {
            api.eliminarServicio(srv.id_servicio)
              .then(function () {
                UI.toast("Servicio eliminado", srv.nombre_servicio + " ya no esta disponible.", "info");
                App.navigate("servicios");
              })
              .catch(function (err) { UI.toast("Error", err.message || "No se pudo eliminar el servicio.", "error"); });
          }
        });
      }
    };
    region.addEventListener("click", region._serviciosClick);
  }

  function abrirFormServicio(id) {
    var s = id ? _servicio(id) : null;
    var m = UI.modal({
      titulo: s ? "Editar servicio" : "Nuevo servicio",
      icon: '<i class="fas fa-scissors"></i>',
      body:
        `
        <div style="display:grid;gap:12px;">
          <div class="field"><label class="field-label">Nombre del servicio <span class="req">*</span></label><input class="input" id="s-nombre" value="${s ? s.nombre_servicio : ""}"></div>
          <div class="field"><label class="field-label">Descripcion</label><textarea class="textarea" rows="2" id="s-descripcion">${s ? s.descripcion_servicio || "" : ""}</textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field"><label class="field-label">Tipo <span class="req">*</span></label>
              <select class="select" id="s-tipo">
                ${["PRINCIPAL", "ADICIONAL", "COMBO"].map(function (t) {
          return `<option value="${t}"${s && s.tipo_servicio === t ? " selected" : ""}>${t}</option>`;
        }).join("")}
              </select></div>
            <div class="field"><label class="field-label">Duracion (min) <span class="req">*</span></label><input class="input" type="number" id="s-duracion" value="${s ? s.tiempo_estimado : 30}"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field"><label class="field-label">Precio (COP) <span class="req">*</span></label><input class="input" type="number" step="0.01" id="s-precio" value="${s ? s.precio_servicio : 15000}"></div>
            <div class="field"><label class="field-label">Estado</label><select class="select" id="s-estado">
              <option value="Activo"${!s || _activo(s) ? " selected" : ""}>Activo</option>
              <option value="Inactivo"${s && !_activo(s) ? " selected" : ""}>Inactivo</option>
            </select></div>
          </div>
        </div>
        `,
      footer:
        `
        <button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>
        <button class="btn btn-primary" data-guardar><i class="fas fa-floppy-disk"></i> Guardar</button>
        `
    });
    setTimeout(function () {
      m.overlay.querySelector("[data-guardar]").addEventListener("click", async function () {
        var n = m.overlay.querySelector("#s-nombre").value.trim();
        var tipo = m.overlay.querySelector("#s-tipo").value;
        var desc = m.overlay.querySelector("#s-descripcion").value.trim();
        var dur = m.overlay.querySelector("#s-duracion").value;
        var pre = m.overlay.querySelector("#s-precio").value;
        var estado = m.overlay.querySelector("#s-estado").value;
        if (!n || !dur || !pre || !tipo) { UI.toast("Datos incompletos", "Todos los campos obligatorios deben completarse.", "error"); return; }
        var data = {
          nombre_servicio: n,
          tipo_servicio: tipo,
          descripcion_servicio: desc,
          estado_servicio: estado,
          tiempo_estimado: +dur,
          precio_servicio: +pre
        };
        try {
          if (s) {
            await api.actualizarServicio(s.id_servicio, data);
          } else {
            await api.crearServicio(data);
          }
          UI.toast(s ? "Servicio actualizado" : "Servicio creado", n + " fue guardado correctamente.", "success");
          m.close();
          App.navigate("servicios");
        } catch (err) {
          UI.toast("Error", err.message || "No se pudo guardar el servicio.", "error");
        }
      });
      m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (btn) {
        btn.addEventListener("click", function () { m.close(); });
      });
    }, 30);
  }

  /* Registro de vistas */
  App.registerVista("admin", "servicios", rServiciosAdmin, bindServiciosAdmin);
})();