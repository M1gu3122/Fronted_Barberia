/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Citas
   ============================================================ */
(function () {
  "use strict";

  var filtroCitas = { fecha: "", barbero: 0, estado: "", servicio: 0 };
  var _citas = [];
  var _servicios = [];
  var _clientes = [];
  var _barberia = null;
  var _prefillAdicionales = [];

  function _servicioActivo(s) {
    return String(s.estado_servicio || "").toLowerCase() === "activo";
  }

  function _precioServicio(s) {
    return Number(s.precio_servicio);
  }

  function _nombreCliente(cl) {
    return ((cl.nombres || "") + " " + (cl.apellidos || "")).trim();
  }

  function _clienteCoincide(cl, q) {
    var texto = (_nombreCliente(cl) + " " + (cl.telefono || "") + " " + (cl.correo || "")).toLowerCase();
    return texto.indexOf(q) > -1;
  }

  function _encontrarClientePorId(id) {
    for (var i = 0; i < _clientes.length; i++) {
      if (_clientes[i].id_usuario == id) return _clientes[i];
    }
    return null;
  }

  function _encontrarClientePorNombre(nombre) {
    var n = String(nombre || "").toLowerCase();
    for (var i = 0; i < _clientes.length; i++) {
      if (_nombreCliente(_clientes[i]).toLowerCase() === n) return _clientes[i];
    }
    return null;
  }

  function _autocompletarCliente(cliInput, cliResults, cliIdEl) {
    if (!cliInput || !cliResults || !cliIdEl || cliInput.readOnly) return;

    var cliSelIndex = -1;

    function pintarResultados() {
      var items = cliResults.querySelectorAll(".autocomplete-item");
      for (var i = 0; i < items.length; i++) items[i].classList.toggle("activo", i === cliSelIndex);
    }

    function mostrarResultados(lista) {
      cliResults.innerHTML = lista.map(function (cl, i) {
        return `<div class="autocomplete-item" data-index="${i}" data-id="${cl.id_usuario}"><span class="ac-nombre">${_nombreCliente(cl)}</span>${cl.telefono ? `<span class="ac-sub">${cl.telefono}</span>` : ""}</div>`;
      }).join("");
      cliResults.style.display = lista.length ? "block" : "none";
      cliSelIndex = -1;
    }

    function filtrarResultados() {
      var q = (cliInput.value || "").toLowerCase().trim();
      var lista = q ? _clientes.filter(function (cl) { return _clienteCoincide(cl, q); }) : _clientes.slice(0, 8);
      mostrarResultados(lista);
    }

    function elegirCliente(cl) {
      if (!cl) return;
      cliInput.value = _nombreCliente(cl);
      cliIdEl.value = cl.id_usuario;
      cliResults.style.display = "none";
    }

    cliInput.addEventListener("input", filtrarResultados);
    cliInput.addEventListener("focus", function () { filtrarResultados(); cliInput.classList.add("focused"); });
    cliInput.addEventListener("blur", function () { setTimeout(function () { cliResults.style.display = "none"; cliInput.classList.remove("focused"); }, 150); });
    cliInput.addEventListener("keydown", function (e) {
      var items = cliResults.querySelectorAll(".autocomplete-item");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (items.length) { cliSelIndex = (cliSelIndex + 1) % items.length; pintarResultados(); }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length) { cliSelIndex = (cliSelIndex - 1 + items.length) % items.length; pintarResultados(); }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (cliSelIndex > -1 && items[cliSelIndex]) {
          var cl = _encontrarClientePorId(items[cliSelIndex].getAttribute("data-id"));
          if (!cl) cl = _encontrarClientePorNombre(items[cliSelIndex].querySelector(".ac-nombre").textContent);
          elegirCliente(cl);
        }
      } else if (e.key === "Escape") {
        cliResults.style.display = "none";
      }
    });

    cliResults.addEventListener("mousedown", function (e) {
      var item = e.target.closest(".autocomplete-item");
      if (!item) return;
      e.preventDefault();
      var cl = _encontrarClientePorId(item.getAttribute("data-id"));
      if (!cl) cl = _encontrarClientePorNombre(item.querySelector(".ac-nombre").textContent);
      elegirCliente(cl);
    });
  }

  function _cargarClientes() {
    var usuarios = api.getUsuariosPanelAdmin().catch(function () { return []; });
    var empleados = api.getEmpleados().catch(function () { return []; });
    return Promise.all([usuarios, empleados]).then(function (res) {
      var empIds = {};
      (res[1] || []).forEach(function (e) { if (e && e.id_usuario) empIds[e.id_usuario] = true; });
      return (res[0] || []).filter(function (u) { return u && !empIds[u.id_usuario]; });
    });
  }

  function _estadoKey(est) {
    var s = String(est || "").toLowerCase();
    if (s === "en espera") return "espera";
    if (s === "en atencion") return "atencion";
    return s;
  }

  function _estadoApi(est) {
    var s = String(est || "").toLowerCase();
    if (s === "espera") return "En espera";
    if (s === "atencion") return "En atencion";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function _precioCitaServicios(nombres) {
    var total = 0;
    var lista = String(nombres || "").split(",").map(function (n) { return n.trim().toLowerCase(); }).filter(Boolean);
    _servicios.forEach(function (s) {
      if (lista.indexOf(String(s.nombre_servicio).toLowerCase()) > -1) {
        total += Number(s.precio_servicio) || 0;
      }
    });
    return total;
  }

  function _norm(r) {
    return {
      id: r.id_cita,
      cliente: {
        id: r.id_usuario,
        nombre: ((r.nombres || "") + " " + (r.apellidos || "")).trim(),
        telefono: r.telefono || "",
        correo: r.correo || ""
      },
      barbero: {
        id: r.id_barbero,
        nombre: ((r.nombres_barbero || "") + " " + (r.apellidos_barbero || "")).trim()
      },
      servicio: { nombre: r.servicios || "", duracion: "", precio: 0 },
      fecha: (r.fecha_hora || "").substr(0, 10),
      hora: (r.fecha_hora || "").substr(11, 5),
      tiempoTotal: r.tiempo_total || 0,
      estado: _estadoKey(r.estado_cita)
    };
  }

  function _cita(id) {
    for (var i = 0; i < _citas.length; i++) {
      if (_citas[i].id_cita === id) return _norm(_citas[i]);
    }
    return null;
  }

  function _citaDesdeApi(id) {
    for (var i = 0; i < _citas.length; i++) {
      if (_citas[i].id_cita === id) return _norm(_citas[i]);
    }
    return null;
  }

  async function _citaDesdeApiConFallback(id) {
    var c = _citaDesdeApi(id);
    if (c) return c;
    try {
      var lista = await api.obtenerCitasDetalles();
      _citas = lista || [];
      for (var i = 0; i < _citas.length; i++) {
        if (_citas[i].id_cita === id) return _norm(_citas[i]);
      }
    } catch (e) {
      // Error en API, retorno null - el llamador manejará el caso
    }
    return null;
  }

  function _filtradas() {
    return _citas.map(_norm).filter(function (c) {
      if (filtroCitas.fecha && c.fecha !== filtroCitas.fecha) return false;
      if (filtroCitas.estado && c.estado.toLowerCase() !== filtroCitas.estado.toLowerCase()) return false;
      if (filtroCitas.barbero) {
        var porId = typeof c.barbero.id === "number" && c.barbero.id === filtroCitas.barbero;
        var porNombre = c.barbero.nombre.toLowerCase().indexOf(String(filtroCitas.barbero).toLowerCase()) !== -1;
        if (!porId && !porNombre) return false;
      }
      if (filtroCitas.servicio) {
        var sNombre = String(filtroCitas.servicio).toLowerCase();
        if (c.servicio.nombre.toLowerCase().indexOf(sNombre) === -1) return false;
      }
      return true;
    });
  }

  function rCitasAdmin() {
    var d = DB;
    var html = `
      <section class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:12px;">
          <div><div class="card-title">Citas</div><div class="card-sub" id="citas-count">Cargando citas...</div></div>
          <div style="margin-left:auto;" class="filters">
            <input type="date" class="input" id="f-fecha" value="${filtroCitas.fecha}">
            <select class="select" id="f-barbero"><option value="0">Todos los barberos</option>
              ${(() => { try { return (d.barberos || []).map(function (b) { return `<option value="${b.id}"${filtroCitas.barbero === b.id ? " selected" : ""}>${b.nombre}</option>`; }).join(""); } catch (e) { return ""; } })()}</select>
            <select class="select" id="f-estado"><option value="">Todos los estados</option>
              ${["Pendiente", "Confirmada", "Completada", "Cancelada", "En Atencion"].map(function (e) {
      return `<option value="${e}"${filtroCitas.estado === e ? " selected" : ""}>${e}</option>`;
    }).join("")}
            </select>
            <select class="select" id="f-servicio"><option value="0">Todos los servicios</option>
              ${(() => { try { return (d.servicios || []).map(function (s) { return `<option value="${s.id}"${filtroCitas.servicio === s.id ? " selected" : ""}>${s.nombre}</option>`; }).join(""); } catch (e) { return ""; } })()}</select>
            <button class="btn btn-sm btn-ghost" id="f-limpiar"><i class="fas fa-rotate-left"></i></button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table table-responsive">
            <thead><tr>
              ${["ID", "Cliente", "Barbero", "Servicio", "Fecha", "Hora", "Tiempo est.", "Estado", "Acciones"].map(function (h) { return `<th>${h}</th>`; }).join("")}
            </tr></thead>
            <tbody id="citas-tbody">
              <tr><td colspan="9" class="cell-muted" style="text-align:center;padding:20px;">Cargando citas...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <div style="margin-top:14px;display:flex;justify-content:flex-end;">
        <button class="btn btn-primary" id="crear-cita-btn"><i class="fas fa-plus"></i> Crear cita</button>
      </div>`;

    api.obtenerCitasDetalles()
      .then(
        function (lista) {
          _citas = lista || [];
          var tbody = document.getElementById("citas-tbody");
          if (!tbody) return;
          var count = document.getElementById("citas-count");
          var rows = _filtradas();
          if (count) count.textContent = rows.length + " registros";
          if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="9" class="cell-muted" style="text-align:center;padding:20px;">Sin citas registradas</td></tr>`;
            return;
          }
          tbody.innerHTML = rows.map(function (c) {
            return `
            <tr>
              <td data-label="ID"><span class="cell-primary">#${c.id}</span></td>
              <td data-label="Cliente">${c.cliente.nombre}</td>
              <td data-label="Barbero">${c.barbero.nombre}</td>
              <td data-label="Servicio">${c.servicio.nombre}</td>
              <td data-label="Fecha">${c.fecha ? d.formatFechaLarga(c.fecha) : ""}</td>
              <td data-label="Hora">${c.hora}</td>
              <td data-label="Tiempo est.">${c.tiempoTotal} min</td>
              <td data-label="Estado">${UI.estadoBadge(c.estado)}</td>
              <td data-label="Acciones"><div class="actions">
                <button class="btn btn-icon btn-ghost" data-ver-cita="${c.id}" title="Ver"><i class="fas fa-eye"></i></button>
                <button class="btn btn-icon btn-ghost" data-editar-cita="${c.id}" title="Editar" ${c.estado === "completada" || c.estado === "cancelada" ? "disabled" : ""}><i class="fas fa-pen"></i></button>
                <button class="btn btn-icon btn-ghost" data-cambiar-barbero="${c.id}" title="Cambiar barbero"><i class="fas fa-user-tie"></i></button>
                <button class="btn btn-icon btn-ghost" data-reprogramar="${c.id}" title="Reprogramar"><i class="fas fa-calendar-plus"></i></button>
                <button class="btn btn-icon btn-danger" data-cancelar-cita="${c.id}" title="Cancelar" ${c.estado === "completada" || c.estado === "cancelada" ? "disabled" : ""}><i class="fas fa-xmark"></i></button>
              </div></td>
            </tr>`;
          }).join("");
        })
      .catch(function (err) {
        var tbody = document.getElementById("citas-tbody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="cell-muted" style="text-align:center;padding:20px;">Error al cargar citas</td></tr>`;
        var count = document.getElementById("citas-count");
        if (count) count.textContent = "Error al cargar";
        console.error("Backend error:", err);
      });

    api.getServicios()
      .then(function (lista) { _servicios = lista || []; })
      .catch(function () { _servicios = []; });

    _cargarClientes()
      .then(function (lista) { _clientes = lista || []; })
      .catch(function () { _clientes = []; });

    // api.obtenerBarberia()
    //   .then(function (b) { _barberia = b || null; })
    //   .catch(function () { _barberia = null; });

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
    if (limpiar) limpiar.addEventListener("click", async function () {
      filtroCitas = { fecha: "", barbero: 0, estado: "", servicio: 0 };
      App.navigate("citas");
    });

    var crear = region.querySelector("#crear-cita-btn");
    if (crear) crear.addEventListener("click", async function () { abrirFormCita(null); });

    if (region._citasClick) region.removeEventListener("click", region._citasClick);
    region._citasClick = function (e) {
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
    };
    // Cargar barberos en el filtro
    async function cargarBarberosEnFiltro() {
        try {
            const barberos = await api.getEmpleadosByTipo('Barbero');
            const select = region.querySelector('#f-barbero');
            if (!select) return;
            select.innerHTML = '<option value="0">Todos los barberos</option>';
            barberos.forEach(function (emp) {
                const opt = document.createElement('option');
                opt.value = emp.id_usuario;
                opt.textContent = emp.usuario.nombres + ' ' + emp.usuario.apellidos;
                if (filtroCitas.barbero !== undefined && opt.value == filtroCitas.barbero) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });
        } catch (e) {
            console.error('Error al cargar barberos en el filtro', e);
        }
    }
    if (region) cargarBarberosEnFiltro();
     region.addEventListener("click", region._citasClick);
   }

  function abrirCambiarBarbero(id) {
    _citaDesdeApiConFallback(id).then(function (c) {
      if (!c) return;
      var idsServicios = [];
      if (c.servicio && typeof c.servicio === "object" && c.servicio.nombre) {
        var nombresServ = String(c.servicio.nombre || "").split(",").map(function (n) { return n.trim().toLowerCase(); }).filter(Boolean);
        var activos = _servicios.filter(_servicioActivo);
        activos.forEach(function (s) {
          if (nombresServ.indexOf(String(s.nombre_servicio).toLowerCase()) > -1) idsServicios.push(s.id_servicio);
        });
      }
      var body = `
        <div style="display:grid;gap:12px;">
          <div style="font-size:13.5px;color:var(--smoke);">Cambia el barbero asignado a la cita de <strong>${c.servicio.nombre}</strong> del ${c.fecha ? DB.formatFechaLarga(c.fecha) : ""} a las ${c.hora}.</div>
          <div class="field"><label class="field-label">Nuevo barbero <span class="req">*</span></label>
            <select class="select" id="nb-barbero"><option value="">Cargando...</option></select></div>
        </div>`;
      var m = UI.modal({
        titulo: "Cambiar barbero",
        icon: '<i class="fas fa-user-tie"></i>',
        body: body,
        footer:
          `
          <button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>
          <button class="btn btn-primary" data-ok>Confirmar cambio</button>
          `
      });
      var sel = m.overlay.querySelector("#nb-barbero");
      if (idsServicios.length) {
        api.getBarberosDisponibles(idsServicios)
          .then(function (lista) {
            sel.innerHTML = '<option value="">Selecciona</option>' + (lista || []).map(function (b) {
              return `<option value="${b.id_usuario}"${b.id_usuario === c.barbero.id ? " selected" : ""}>${b.nombres} ${b.apellidos}</option>`;
            }).join("");
          })
          .catch(function () {
            sel.innerHTML = '<option value="">Selecciona</option>' + ((c.barbero && c.barbero.id ? c.barbero.nombre : '') + '').split(' ').map(function (n) { return '<option value="">Sin datos</option>'; }).join("");
          });
      } else {
        sel.innerHTML = '<option value="">Selecciona</option>' + ((c.barbero && c.barbero.id ? c.barbero.nombre : '') + '').split(' ').map(function (n) { return '<option value="">Sin datos</option>'; }).join("");
      }
      setTimeout(function () {
        m.overlay.querySelector("[data-ok]").addEventListener("click", async function () {
          var nuevo = m.overlay.querySelector("#nb-barbero").value;
          if (!nuevo) { UI.toast("Campo requerido", "Selecciona un barbero.", "error"); return; }
          var btn = this; btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          try {
            var barberiaId = _barberia && _barberia.id_barberia ? _barberia.id_barberia : null;
            await api.actualizarCita(id, {
              fecha_hora: DateUtils.toApiDateTime(c.fecha, c.hora),
              estado_cita: c.estado.charAt(0).toUpperCase() + c.estado.slice(1),
              id_cliente: c.cliente.id,
              id_barbero: Number(nuevo),
              id_barberia: barberiaId
            });
            UI.toast("Barbero actualizado", "La cita fue reasignada correctamente.", "success");
            m.close();
            App.navigate("citas");
          } catch (err) {
            btn.disabled = false; btn.innerHTML = 'Confirmar cambio';
            UI.toast("Error", err.message || "No se pudo cambiar el barbero.", "error");
          }
        });
        m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
          b.addEventListener("click", async function () { m.close(); });
        });
      }, 30);
    });
  }

  function abrirDetalleCita(id) {
    var c = _cita(id);
    if (!c) return;
    var filas = [
      ["Servicio", c.servicio.nombre],
      ["Barbero", c.barbero.nombre],
      ["Fecha", c.fecha ? DB.formatFechaLargaConAno(c.fecha) : ""],
      ["Hora", c.hora ? c.hora + " hs" : ""],
      ["Estado", UI.estadoBadge(c.estado)]
    ];
    UI.modal({
      titulo: "Detalle de cita #" + id,
      icon: '<i class="fas fa-calendar-check"></i>',
      body:
        `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          ${UI.avatar(c.cliente.nombre, "avatar-lg")}
          <div><div style="font-weight:700;">${c.cliente.nombre}</div><div class='cell-muted'>#${id}</div></div>
          <div style="margin-left:auto;">${UI.estadoBadge(c.estado)}</div>
        </div>
        <div style="display:grid;gap:10px;">
          ${filas.map(function (f) {
          return `<div style="display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--line);"><span class="cell-muted">${f[0]}</span><span style='font-weight:600;'>${f[1]}</span></div>`;
        }).join("")}
        </div>
        `,
      footer:
        `
        <button class="btn btn-ghost" data-cerrar-modal>Cerrar</button>
        <button class="btn btn-primary" data-cerrar-modal>Entendido</button>
        `
    });
    setTimeout(function () {
      document.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", async function () {
          document.querySelectorAll(".modal-overlay").forEach(function (o) { o.remove(); });
          document.body.style.overflow = "";
        });
      });
    }, 30);
  }

  async function abrirFormCita(id) {
    var c = id ? await _citaDesdeApiConFallback(id) : null;
    var d = DB;
    if (!_servicios.length) {
      try { _servicios = (await api.getServicios()) || []; }
      catch (e) { _servicios = []; }
    }
    if (!_clientes.length) {
      try { _clientes = (await _cargarClientes()) || []; }
      catch (e) { _clientes = []; }
    }
    if (!_barberia) {
      try { _barberia = (await api.obtenerBarberia()) || null; }
      catch (e) { _barberia = null; }
    }
    console.log("[citas-admin][abrirFormCita]", c ? "Editar #" + id : "Crear",
      "| servicios:", _servicios.length, "| clientes:", _clientes.length,
      "| _barberia:", _barberia, "| barberos en _barberia:", (_barberia && _barberia.barberos ? _barberia.barberos.length : 0));

    // Servicios que el barbero asignado puede realizar (solo en edición)
    var serviciosPermitidosBarbero = null;
    if (c && c.barbero && c.barbero.id) {
      try {
        var rels = await api.getServiciosDelBarbero(c.barbero.id);
        var permitidos = {};
        (rels || []).forEach(function (x) { permitidos[x.id_servicio] = true; });
        // Incluir los servicios actuales de la cita para no romper el prefill
        if (typeof c.servicio === "object" && c.servicio.nombre) {
          var nombresServ0 = String(c.servicio.nombre || "").split(",").map(function (n) { return n.trim().toLowerCase(); }).filter(Boolean);
          _servicios.forEach(function (s) {
            if (nombresServ0.indexOf(String(s.nombre_servicio).toLowerCase()) > -1) permitidos[s.id_servicio] = true;
          });
        } else if (typeof c.servicio === "number") {
          permitidos[c.servicio] = true;
        }
        serviciosPermitidosBarbero = permitidos;
      } catch (e) { serviciosPermitidosBarbero = null; }
    }

    var activos = _servicios.filter(_servicioActivo);
    var principales = activos.filter(function (s) { return s.tipo_servicio === "PRINCIPAL" && (!serviciosPermitidosBarbero || serviciosPermitidosBarbero[s.id_servicio]); });
    var adicionales = activos.filter(function (s) { return s.tipo_servicio === "ADICIONAL" && (!serviciosPermitidosBarbero || serviciosPermitidosBarbero[s.id_servicio]); });

    _prefillAdicionales = [];
    var servicioPrefill = null;
    var clienteIdPrefill = null;
    var barberoPrefill = null;
    var estadoPrefill = "";
    if (c) {
      estadoPrefill = c.estado;
      barberoPrefill = typeof c.barbero === "object" ? c.barbero.id : c.barbero;
      if (typeof c.servicio === "object") {
        var nombresServ = String(c.servicio.nombre || "").split(",").map(function (n) { return n.trim().toLowerCase(); }).filter(Boolean);
        activos.forEach(function (s) {
          if (nombresServ.indexOf(String(s.nombre_servicio).toLowerCase()) > -1) {
            if (s.tipo_servicio === "PRINCIPAL") servicioPrefill = s.id_servicio;
            else _prefillAdicionales.push(s.id_servicio);
          }
        });
      } else {
        servicioPrefill = c.servicio;
      }
      clienteIdPrefill = typeof c.cliente === "object" ? c.cliente.id : c.cliente;
    }

    var clienteInicial = c ? (function () {
      for (var i = 0; i < _clientes.length; i++) {
        if (_clientes[i].id_usuario == clienteIdPrefill) return _nombreCliente(_clientes[i]);
      }
      return "";
    })() : "";

    var body = `
      <div style="display:grid;gap:12px;">
        <div class="field"><label class="field-label">Cliente <span class="req">*</span></label>
          <div class="autocomplete-wrap">
            <div class="input-wrap"><i class="fas fa-user" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--mist);font-size:13px;"></i>
              <input class="input" id="f-cliente" placeholder="${c ? "Cliente de la cita" : "Escribe para buscar un cliente..."}" style="padding-left:32px;" autocomplete="off" value="${clienteInicial}"${c ? " readonly" : ""}>
            </div>
            ${!c ? `<div class="autocomplete-list" id="f-cliente-results" style="display:none;"></div>` : ""}
          </div>
          <input type="hidden" id="f-cliente-id" value="${clienteIdPrefill || ""}">
          ${c ? '<span class="field-hint">El cliente no se puede cambiar. Para otro cliente, cancele y cree una nueva cita.</span>' : ""}
        </div>
        <div class="field"><label class="field-label">Servicio principal <span class="req">*</span></label>
          <select class="select" id="f-servicio"><option value="">Selecciona</option>
            ${principales.map(function (s) { return `<option value="${s.id_servicio}" data-precio="${s.precio_servicio}"${servicioPrefill === s.id_servicio ? " selected" : ""}>${s.nombre_servicio} · ${d.formatPrecio(_precioServicio(s))}</option>`; }).join("")}
          </select></div>
        <div class="field">
          ${adicionales.length
        ? `<details class="adds" id="f-adds">
                  <summary class="adds-summary"><span>Servicios adicionales <em>(opcional)</em></span><i class="fas fa-chevron-down adds-chevron"></i></summary>
                  <div class="adds-box" id="f-adds-box">
                    ${adicionales.map(function (s) {
          return `<label class="adds-item"><input type="checkbox" class="add-chk" value="${s.nombre_servicio}" data-id-servicio="${s.id_servicio}" data-precio="${s.precio_servicio}"><span class="adds-nombre">${s.nombre_servicio}</span><span class="adds-precio">${d.formatPrecio(_precioServicio(s))}</span></label>`;
        }).join("")}
                  </div>
                </details>`
        : `<div class="adds-summary" style="cursor:default;"><span>Servicios adicionales <em>(no hay disponibles)</em></span></div>`}
          <div class="total-estimado"><span>Total estimado</span><b id="f-total-estimado">${d.formatPrecio(0)}</b></div>
        </div>
        ${!c ? `
        <div class="field">
  <label class="field-label">Barbero <span class="req">*</span></label>
  <select class="select" id="f-barbero">
    <option value="">Selecciona</option>
    ${(() => {
          try {
            return (_barberia && _barberia.barberos || [])
              .filter(function (b) { return b.activo; })
              .map(function (b) {
                return `<option value="${b.id}">${b.nombre}</option>`;
              })
              .join("");
          } catch (e) {
            return "";
          }
        })()}
  </select>
  <div class="field-hint">
    El cliente no se puede cambiar. Para otro cliente, cancele y cree una nueva cita.
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
  <div class="field">
    <label class="field-label">Fecha <span class="req">*</span></label>
    <input
      type="date"
      class="input"
      id="f-fecha"
      value="${d.iso()}"
    >
  </div>

  <div class="field">
    <label class="field-label">Hora <span class="req">*</span></label>
    <input
      type="time"
      class="input"
      id="f-hora"
      value="10:00"
    >
  </div>
</div>
` : ""}

<div class="field">
  <label class="field-label">Estado</label>
  <select class="select" id="f-estado"${c ? "" : " disabled"}>
    ${c
        ? ["Pendiente", "Confirmada", "En Atencion", "Completada"].map(function (e) {
          return `<option value="${e}"${e.toLowerCase() === String(estadoPrefill).toLowerCase()
              ? " selected"
              : ""
            }>${e}</option>`;
        }).join("")
        : `<option value="Pendiente" selected>Pendiente</option>`
      }
  </select>

  ${!c
        ? '<span class="field-hint">Las nuevas citas se crean en estado Pendiente</span>'
        : ""
      }
</div>
</div>

<div style="margin-top:14px;padding:12px;background:var(--sand);border-radius:9px;font-size:12.5px;color:var(--smoke);">
  <i class="fas fa-circle-info" style="color:var(--brass-dim);margin-right:6px;"></i>
  ${c
        ? 'Para cambiar barbero, fecha u hora use los botones "Reprogramar" o "Cambiar barbero" en la tabla.'
        : "El sistema verifica la disponibilidad del barbero al guardar."
      }
</div>`;
    var m = UI.modal({
      titulo: c ? "Editar cita #" + id : "Nueva cita",
      icon: '<i class="fas fa-calendar-check"></i>',
      body: body,
      footer:
        `
        <button class="btn btn-ghost" data-cerrar-modal>Cancelar</button>
        <button class="btn btn-primary" data-guardar-cita="${id || ""}"><i class="fas fa-floppy-disk"></i> Guardar</button>
        `
    });
    setTimeout(function () {
      var guardar = m.overlay.querySelector("[data-guardar-cita]");
      var cerrar = m.overlay.querySelectorAll("[data-cerrar-modal]");
      var mainSel = m.overlay.querySelector("#f-servicio");
      var totalEl = m.overlay.querySelector("#f-total-estimado");
      var cliInput = m.overlay.querySelector("#f-cliente");
      var cliResults = m.overlay.querySelector("#f-cliente-results");
      var cliIdEl = m.overlay.querySelector("#f-cliente-id");

      _autocompletarCliente(cliInput, cliResults, cliIdEl);

      function recalcular() {
        var total = 0;
        var sel = mainSel && mainSel.selectedOptions[0];
        if (sel && sel.value) total += Number(sel.getAttribute("data-precio") || 0);
        m.overlay.querySelectorAll(".add-chk:checked").forEach(function (chk) {
          total += Number(chk.getAttribute("data-precio") || 0);
        });
        if (totalEl) totalEl.textContent = d.formatPrecio(total);
      }
      function idsSeleccionados() {
        var ids = [];
        var sel = mainSel && mainSel.selectedOptions[0];
        if (sel && sel.value) ids.push(Number(sel.value));
        m.overlay.querySelectorAll(".add-chk:checked").forEach(function (chk) {
          ids.push(Number(chk.getAttribute("data-id-servicio") || 0));
        });
        return ids.filter(function (id) { return id > 0; });
      }
      function opcionesBarbero(lista) {
        return '<option value="">Selecciona</option>' + lista.map(function (b) {
          return `<option value="${b.id_usuario}">${((b.nombres || "") + " " + (b.apellidos || "")).trim()}</option>`;
        }).join("");
      }
      function opcionesBarberoMock() {
        return '<option value="">Selecciona</option>' +
          ((_barberia && _barberia.barberos || [])
            .filter(function (b) { return b.activo; })
            .map(function (b) {
              return `<option value="${b.id}">${b.nombre}</option>`;
            })
            .join(""));
      }
      function cargarBarberos() {
        var bSel = m.overlay.querySelector("#f-barbero");
        if (!bSel) return;
        var previo = barberoPrefill || bSel.value;
        var ids = idsSeleccionados();
        if (!ids.length) { bSel.innerHTML = opcionesBarberoMock(); return; }
        bSel.innerHTML = '<option value="">Cargando barberos...</option>';
        api.getBarberosDisponibles(ids)
          .then(function (lista) {
            lista = lista || [];
            bSel.innerHTML = lista.length ? opcionesBarbero(lista) : '<option value="">Sin barberos disponibles</option>';
            if (previo) {
              var opts = bSel.querySelectorAll("option");
              for (var i = 0; i < opts.length; i++) {
                if (opts[i].value === previo) { bSel.value = previo; break; }
              }
            }
          })
          .catch(function () { bSel.innerHTML = '<option value="">Sin barberos disponibles</option>'; });
      }
      if (mainSel) mainSel.addEventListener("change", function () { recalcular(); actualizarAdicionales(); });
      function vincularAdicionales() {
        m.overlay.querySelectorAll(".add-chk").forEach(function (chk) {
          chk.removeEventListener("change", onAddChange);
          chk.addEventListener("change", onAddChange);
        });
      }
      function onAddChange() { recalcular(); cargarBarberos(); }
      function renderAdicionales(idsPermitidos) {
        var box = m.overlay.querySelector("#f-adds-box");
        if (!box) return;
        var lista = adicionales.filter(function (s) { return (!idsPermitidos || idsPermitidos.indexOf(s.id_servicio) > -1) && (!serviciosPermitidosBarbero || serviciosPermitidosBarbero[s.id_servicio]); });
        box.innerHTML = lista.length
          ? lista.map(function (s) {
            return `<label class="adds-item"><input type="checkbox" class="add-chk" value="${s.nombre_servicio}" data-id-servicio="${s.id_servicio}" data-precio="${s.precio_servicio}"><span class="adds-nombre">${s.nombre_servicio}</span><span class="adds-precio">${d.formatPrecio(_precioServicio(s))}</span></label>`;
          }).join("")
          : '<div style="font-size:12.5px;color:var(--smoke);padding:4px 2px;">No hay adicionales compatibles con este servicio.</div>';
        if (_prefillAdicionales.length) {
          m.overlay.querySelectorAll(".add-chk").forEach(function (chk) {
            if (_prefillAdicionales.indexOf(Number(chk.getAttribute("data-id-servicio"))) > -1) chk.checked = true;
          });
          _prefillAdicionales = [];
        }
        vincularAdicionales();
        recalcular();
        cargarBarberos();
      }
      function actualizarAdicionales() {
        var sel = mainSel && mainSel.selectedOptions[0];
        if (!sel || !sel.value) { renderAdicionales(null); return; }
        api.getServiciosAdicionales(Number(sel.value))
          .then(function (ids) { renderAdicionales(ids || []); })
          .catch(function () { renderAdicionales(null); });
      }
      vincularAdicionales();
      recalcular();
      actualizarAdicionales();
      if (guardar) guardar.addEventListener("click", async function () {
        var clId = Number(m.overlay.querySelector("#f-cliente-id").value);
        var sId = Number(m.overlay.querySelector("#f-servicio").value);
        console.log("[citas-admin][guardar] Click. Modo:", c ? "editar #" + id : "crear", "| clId:", clId, "| sId:", sId);
        if (!clId) { UI.toast("Campos incompletos", "Selecciona un cliente.", "error"); return; }
        var idsServicios = [];
        if (sId > 0) idsServicios.push(sId);
        m.overlay.querySelectorAll(".add-chk:checked").forEach(function (chk) {
          idsServicios.push(Number(chk.getAttribute("data-id-servicio") || 0));
        });
        idsServicios = idsServicios.filter(function (id) { return id > 0; });
        if (!idsServicios.length) {
          UI.toast("Campos incompletos", "Selecciona al menos un servicio (principal o adicional).", "error");
          return;
        }
        var estado = m.overlay.querySelector("#f-estado").value;
        var barberiaId = _barberia && _barberia.id_barberia ? _barberia.id_barberia : null;
        console.log("[citas-admin][guardar] estado:", estado, "| ids_servicios:", idsServicios, "| barberiaId:", barberiaId, "| _barberia:", _barberia);

        var payload = null;
        if (c && id) {
          payload = {
            fecha_hora: DateUtils.toApiDateTime(c.fecha, c.hora),
            estado_cita: estado,
            id_cliente: clId,
            id_barbero: c.barbero.id,
            id_barberia: barberiaId,
            ids_servicios: idsServicios
          };
          console.log("[citas-admin][guardar] Payload EDITAR:", payload);
        } else {
          var bSel = m.overlay.querySelector("#f-barbero");
          var fechaEl = m.overlay.querySelector("#f-fecha");
          var horaEl = m.overlay.querySelector("#f-hora");
          var bId = Number(bSel ? bSel.value : NaN);
          var fecha = fechaEl ? fechaEl.value : "";
          var hora = horaEl ? horaEl.value : "";
          console.log("[citas-admin][guardar] Crear | bId:", bId, "| fecha:", fecha, "| hora:", hora, "| options barbero:", bSel ? bSel.options.length : 0, "| selectedIndex:", bSel ? bSel.selectedIndex : -1, "| bSel existe:", !!bSel);
          if (!bSel || !bId) { UI.toast("Campos incompletos", "Selecciona un barbero.", "error"); return; }
          if (!fecha || !hora) { UI.toast("Campos incompletos", "Indica fecha y hora.", "error"); return; }
          if (_barberia && _barberia.id_barberia) {
            try {
              var horario = await api.getHorarioBarberia(_barberia.id_barberia, fecha);
              console.log("[citas-admin][guardar] Horario barberia:", horario);
              if (horario && horario.hora_apertura && horario.hora_cierre) {
                var abre = horario.hora_apertura.substr(0, 5);
                var cierra = horario.hora_cierre.substr(0, 5);
                console.log("[citas-admin][guardar] Rango horario: abre", abre, "| cierra", cierra, "| hora elegida", hora);
                if (hora < abre || hora >= cierra) {
                  UI.toast("Fuera de horario", "La barberia abre a las " + abre + " y cierra a las " + cierra + ".", "error");
                  return;
                }
              }
            } catch (e) {
              console.log("[citas-admin][guardar] Error consultando horario barberia (se continua):", e);
            }
          }
          payload = {
            fecha_hora: DateUtils.toApiDateTime(fecha, hora),
            estado_cita: estado,
            id_cliente: clId,
            id_barbero: bId,
            id_barberia: barberiaId,
            ids_servicios: idsServicios
          };
          console.log("[citas-admin][guardar] Payload a enviar al servidor:", payload);
        }

        guardar.disabled = true;
        guardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        var peticion = c && id ? api.actualizarCita(id, payload) : api.crearCita(payload);
        peticion.then(function () {
          console.log("[citas-admin][guardar] Respuesta OK:", payload);
          UI.toast(c ? "Cita actualizada" : "Cita creada", "La cita fue " + (c ? "modificada" : "registrada") + " correctamente.", "success");
          m.close();
          App.navigate("citas");
        }).catch(function (err) {
          console.error("[citas-admin][guardar] Error al guardar cita:", err, "| payload:", payload);
          guardar.disabled = false;
          guardar.innerHTML = '<i class="fas fa-floppy-disk"></i> Guardar';
          // Extraer mensaje del error del backend (FastAPI ValueError)
          var backendMsg = (err && err.message) ? err.message :
            (err && err.response && err.response.data && err.response.data.detail) ? err.response.data.detail :
              "No se pudo guardar la cita.";
          UI.toast("Error", backendMsg, "error");
        });
      });
      cerrar.forEach(function (b) { b.addEventListener("click", async function () { m.close(); }); });
    }, 30);
  }

  // Función para obtener horarios disponibles para reprogramar una cita
  // Parámetros:
  //   barberoId : ID del barbero (número)
  //   fecha     : string "YYYY-MM-DD" o "DD/MM/YYYY" (la fecha de la cita)
  //   duracion  : duración en minutos (por defecto 60)
  //   citas     : array de objetos cita {fecha, hora, barbero, estado} (opcional)
  // Devuelve un array de strings ["HH:MM", "HH:MM", ...] con los huecos libres.
  // Si no hay datos suficientes, devuelve un array vacío.
  function obtenerHorariosDisponibles(barberoId, fecha, duracion, citas) {
    // 1. Buscar información del barbero
    // Intentar obtener desde _barberos o _barberia
    var b = null;
    if (typeof _barberos !== "undefined" && _barberos) {
      _barberos.forEach(function (x) { if (x.id_usuario === barberoId) b = x; });
    }
    if (!b && _barberia && _barberia.barberos) {
      _barberia.barberos.forEach(function (x) { if (x.id_usuario === barberoId) b = x; });
    }
    if (!b) return [];

    // 2. Parsear horario de trabajo "HH:MM"
    var iH = parseInt(b.horarioIni.split(":")[0]);
    var iM = parseInt(b.horarioIni.split(":")[1]);
    var fH = parseInt(b.horarioFin.split(":")[0]);
    var fM = parseInt(b.horarioFin.split(":")[1]);
    var ini = iH * 60 + iM;   // inicio en minutos desde la madrugada
    var fi = fH * 60 + fM;    // fin   en minutos desde la madrugada

    // 3. Recolectar citas ocupadas para ese barbero en esta fecha (excluir canceladas)
    var oc = [];
    if (citas && citas.length) {
      citas.forEach(function (c) {
        if (c.fecha === fecha && c.barbero && c.barbero.id_usuario === barberoId && c.estado !== "cancelada") {
          var h = parseInt(c.hora.split(":")[0]) * 60 + parseInt(c.hora.split(":")[1]);
          // Usar duración real de la cita si está disponible, sino el parámetro duracion
          var citaDuracion = c.tiempoTotal || duracion || 60;
          oc.push({ ini: h, fin: h + citaDuracion });
        }
      });
    }

    // 3. Ordenar citas ocupadas por hora de inicio
    oc.sort(function (a, b) { return a.ini - b.ini; });

    // 4. Calcular huecos libres
    var libres = [];
    var actual = ini;

    // Huecos entre citas ocupadas
    for (var i = 0; i < oc.length; i++) {
      if (oc[i].ini > actual) {
        // Hueco desde 'actual' hasta 'oci[i].ini'
        for (var t = actual; t + duracion <= oc[i].ini; t += duracion) {
          var h = String(Math.floor(t / 60)).padStart(2, "0");
          var m = String(t % 60).padStart(2, "0");
          libres.push(h + ":" + m);
        }
      }
      actual = Math.max(actual, oc[i].fin);
    }

    // Hueco después de la última cita
    if (fi - actual >= duracion) {
      for (var t = actual; t + duracion <= fi; t += duracion) {
        var hh = String(Math.floor(t / 60)).padStart(2, "0");
        var mm = String(t % 60).padStart(2, "0");
        libres.push(hh + ":" + mm);
      }
    }

    return libres;
  }

  // ============================================================
  // RESTRICCIONES DE CITA NUEVA / EDITAR
  // ============================================================

  async function abrirReprogramarAdmin(id) {
    var c = _cita(id);
    if (!c) return;

    if (!_servicios.length) {
      try { _servicios = (await api.getServicios()) || []; } catch (e) { _servicios = []; }
    }

    var currentFecha = c.fecha ? DB.formatFechaLarga(c.fecha) : "";
    var currentHora = c.hora || "";
    var barberoNombre = (c.barbero && c.barbero.nombre) ? c.barbero.nombre : "—";
    var servicioPrecio = Number(c.servicio.precio) ? DB.formatPrecio(c.servicio.precio) : DB.formatPrecio(_precioCitaServicios(c.servicio.nombre));
    var servicioDuracion = c.tiempoTotal || 40;

    var body = `
      <div class="reprog-modal-body">
        <p class="section-title">Cita actual</p>

        <div class="appointment-info">
          <div class="appointment-main">
            <div class="appointment-service">
              <h4>${c.servicio.nombre}</h4>
              <p>Servicio de barbería</p>
            </div>
            <div class="appointment-price">
              <strong>${servicioPrecio}</strong>
              <span>${servicioDuracion} minutos</span>
            </div>
          </div>
          <div class="appointment-details">
            <div class="detail"><i class="fa-solid fa-user"></i>${c.cliente.nombre}</div>
            <div class="detail"><i class="fa-regular fa-calendar"></i>${currentFecha}</div>
            <div class="detail"><i class="fa-regular fa-clock"></i>${currentHora}</div>
            <div class="detail"><i class="fa-solid fa-user-tie"></i>${barberoNombre}</div>
          </div>
        </div>

        <div class="field required">
          <label class="field-label" for="fecha-reprogramar">Nueva fecha</label>
          <div class="date-input-wrapper">
            <i class="fa-regular fa-calendar"></i>
            <input type="text" class="input" id="fecha-reprogramar" placeholder="Selecciona una fecha" readonly>
          </div>
          <div class="field-hint">Selecciona un día para consultar los horarios disponibles.</div>
        </div>

        <div class="field required">
          <label class="field-label">Horario disponible</label>
          <div id="horarios-container" class="time-section">
            <div class="no-slots">
              <i class="fa-regular fa-calendar"></i>
              Selecciona una fecha para consultar los horarios.
            </div>
          </div>
        </div>

        <div id="new-appointment" class="new-appointment">
          <div class="new-appointment-title">
            <i class="fa-solid fa-circle-check"></i> Nueva programación
          </div>
          <div class="new-appointment-grid">
            <div class="summary-item">
              <span>Fecha:</span>
              <strong id="resumen-fecha">-</strong>
            </div>
            <div class="summary-item">
              <span>Hora:</span>
              <strong id="resumen-hora">-</strong>
            </div>
          </div>
        </div>
      </div>
    `;

    var m = UI.modal({
      titulo: "",
      icon: "",
      body: body,
      footer: `
        <div class="modal-footer">
          <button class="btn btn-ghost" id="btn-cancelar">Cancelar</button>
          <button class="btn btn-primary" id="btn-confirmar" disabled>Confirmar reprogramación</button>
        </div>
      `
    });

    var fechaSeleccionada = null;
    var horaSeleccionada = null;
    var horariosContainer = m.overlay.querySelector("#horarios-container");
    var resumen = m.overlay.querySelector("#new-appointment");
    var resumenFecha = m.overlay.querySelector("#resumen-fecha");
    var resumenHora = m.overlay.querySelector("#resumen-hora");
    var btnConfirmar = m.overlay.querySelector("#btn-confirmar");

    function formatearFecha(fechaStr) {
      return DateUtils.formatLongWithYear(fechaStr);
    }

    async function cargarHorarios(fecha) {
      if (!horariosContainer) return;
      var overlay = m.overlay;
      horariosContainer.innerHTML = `
        <div class="no-slots">
          <i class="fa-regular fa-calendar"></i>
          Cargando horarios...
        </div>
      `;

      try {
        // Refrescar cache de citas desde la API para tener datos actualizados
        var lista = await api.obtenerCitasDetalles();
        _citas = lista || [];
      } catch (e) {
        console.log("No se pudo refrescar citas, usando cache local:", e);
      }

      var barberoId = c.barbero && c.barbero.id ? c.barbero.id : null;
      var slots = [];
      var manana = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30"];
      var tarde = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];
      var ocupados = [];

      if (barberoId) {
        _citas.forEach(function (cita) {
          if (cita.id_cita !== id && (cita.fecha_hora || "").substr(0, 10) === fecha && Number(cita.id_barbero) === Number(barberoId) && String(cita.estado_cita).toLowerCase() !== "cancelada") {
            ocupados.push((cita.fecha_hora || "").substr(11, 5));
          }
        });
      }

      // Obtener horario real de la barbería desde la API
      var horarioBarberia = null;
      if (_barberia && _barberia.id_barberia) {
        try {
          horarioBarberia = await api.getHorarioBarberia(_barberia.id_barberia, fecha);
        } catch (e) {
          console.log("No se pudo obtener horario de barbería:", e);
        }
      }

      // Generar huecos basados en el horario real de la barbería
      if (horarioBarberia && horarioBarberia.hora_apertura && horarioBarberia.hora_cierre) {
        var iniH = parseInt(horarioBarberia.hora_apertura.split(":")[0]);
        var iniM = parseInt(horarioBarberia.hora_apertura.split(":")[1]);
        var fiH = parseInt(horarioBarberia.hora_cierre.split(":")[0]);
        var fiM = parseInt(horarioBarberia.hora_cierre.split(":")[1]);
        var ini = iniH * 60 + iniM;
        var fi = fiH * 60 + fiM;

        // Duración de la cita - obtener del servicio de la cita
        var duracion = c.tiempoTotal || 60;

        for (var t = ini; t + duracion <= fi; t += duracion) {
          var h = String(Math.floor(t / 60)).padStart(2, "0");
          var mm = String(t % 60).padStart(2, "0");
          var horaStr = h + ":" + mm;
          slots.push({ hora: horaStr, periodo: "personalizada", disponible: ocupados.indexOf(horaStr) === -1 });
        }
      } else {
        // Fallback: usar slots de ejemplo si no hay horario disponible
        manana.forEach(function (s) { slots.push({ hora: s, periodo: "mañana", disponible: ocupados.indexOf(s) === -1 }); });
        tarde.forEach(function (s) { slots.push({ hora: s, periodo: "tarde", disponible: ocupados.indexOf(s) === -1 }); });
      }

      if (!slots.some(function (s) { return s.disponible; })) {
        horariosContainer.innerHTML = `
          <div class="no-slots">
            <i class="fa-regular fa-calendar-xmark"></i>
            No hay horarios disponibles para este día.
          </div>
        `;
        return;
      }

      function crearPeriodo(titulo, icono, lista) {
        var wrap = document.createElement("div");
        wrap.className = "time-period";

        var label = document.createElement("div");
        label.className = "time-period-title";
        label.innerHTML = `<i class="fa-solid ${icono}"></i>${titulo}`;
        wrap.appendChild(label);

        var grid = document.createElement("div");
        grid.className = "time-grid";

        lista.forEach(function (slot) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "time-slot" + (!slot.disponible ? " ocupado" : "");
          btn.textContent = slot.hora;
          if (!slot.disponible) {
            btn.disabled = true;
          } else {
            btn.addEventListener("click", function () {
              overlay.querySelectorAll(".time-slot").forEach(function (b) { b.classList.remove("seleccionado"); });
              btn.classList.add("seleccionado");
              horaSeleccionada = slot.hora;
              resumenFecha.textContent = formatearFecha(fechaSeleccionada);
              resumenHora.textContent = slot.hora;
              resumen.classList.add("visible");
              btnConfirmar.disabled = false;
            });
          }
          grid.appendChild(btn);
        });
        wrap.appendChild(grid);
        return wrap;
      }

      var porPeriodo = {};
      slots.forEach(function (s) { (porPeriodo[s.periodo] = porPeriodo[s.periodo] || []).push(s); });
      var tituloPeriodo = { mañana: ["Mañana", "fa-sun"], tarde: ["Tarde", "fa-cloud-sun"], personalizada: ["Horarios disponibles", "fa-clock"] };
      Object.keys(porPeriodo).forEach(function (periodo) {
        var meta = tituloPeriodo[periodo] || [periodo, "fa-clock"];
        horariosContainer.appendChild(crearPeriodo(meta[0], meta[1], porPeriodo[periodo]));
      });
    }

    if (window.flatpickr) {
      var fpOpts = {
        dateFormat: "Y-m-d",
        minDate: "today",
        disableMobile: true,
        defaultDate: c.fecha || null,
        onChange: function (selectedDates, dateStr) {
          if (!selectedDates.length) return;
          seleccionarFecha(dateStr);
        }
      };
      if (window.flatpickr.l10ns && window.flatpickr.l10ns.es) fpOpts.locale = "es";
      flatpickr(m.overlay.querySelector("#fecha-reprogramar"), fpOpts);
    } else {
      var fechaNat = m.overlay.querySelector("#fecha-reprogramar");
      fechaNat.removeAttribute("readonly");
      fechaNat.type = "date";
      fechaNat.addEventListener("change", function () {
        if (fechaNat.value) seleccionarFecha(fechaNat.value);
      });
    }

    function seleccionarFecha(dateStr) {
      fechaSeleccionada = dateStr;
      horaSeleccionada = null;
      resumen.classList.remove("visible");
      btnConfirmar.disabled = true;
      cargarHorarios(dateStr);
    }

    if (c.fecha) {
      fechaSeleccionada = c.fecha;
      cargarHorarios(c.fecha);
    }

    btnConfirmar.addEventListener("click", async function () {
      if (!fechaSeleccionada || !horaSeleccionada) {
        UI.toast("Datos incompletos", "Selecciona fecha y hora.", "error");
        return;
      }
      var btn = this;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      try {
        var barberiaId = _barberia && _barberia.id_barberia ? _barberia.id_barberia : null;
        await api.actualizarCita(id, {
          fecha_hora: DateUtils.toApiDateTime(fechaSeleccionada, horaSeleccionada),
          estado_cita: _estadoApi(c.estado),
          id_cliente: c.cliente.id,
          id_barbero: c.barbero.id,
          id_barberia: barberiaId
        });
        UI.toast("Cita reprogramada", "Se notificó al cliente del nuevo horario.", "success");
        m.close();
        App.navigate("citas");
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = 'Confirmar reprogramación';
        UI.toast("Error", err.message || "No se pudo reprogramar la cita.", "error");
      }
    });

    function cerrarModal() { m.close(); }
    m.overlay.querySelector("#btn-cancelar").addEventListener("click", cerrarModal);
    m.overlay.querySelector(".icon-btn").addEventListener("click", cerrarModal);
  }

  function cancelarCitaAdmin(id) {
    var c = _cita(id);
    if (!c) { console.log("[cancelarCitaAdmin] _cita(" + id + ") devolvió null/falso, saliendo"); return; }
    console.log("[cancelarCitaAdmin] Cita encontrada:", c ? "cliente=" + c.cliente.nombre : "nula");
    UI.confirm({
      titulo: "Cancelar cita #" + id,
      mensaje: `Vas a cancelar la cita de <strong>${c.cliente.nombre}</strong> (${c.servicio.nombre}). Se notificara al cliente.`,
      onConfirm: function () {
        console.log("[cancelarCitaAdmin] onConfirm ejecutado - llamando api.cancelarCita");
        api.cancelarCita(id).then(function () {
          console.log("[cancelarCitaAdmin] API exitosa - mostrando toast");
          UI.toast("Cita cancelada", "El cliente fue notificado del cambio.", "info");
          App.navigate("citas");
        }).catch(function (err) {
          console.log("[cancelarCitaAdmin] API error:", err.message);
          UI.toast("Error", err.message || "No se pudo cancelar la cita.", "error");
        });
      }
    });
    console.log("[cancelarCitaModal] Diálogo mostrado al usuario");
  }

  /* Registro de vistas */
  /* Compartidas con recepcionista */
  App.registerVista("admin", "citas", rCitasAdmin, bindCitasAdmin);
  App.registerVista("recepcion", "citas", rCitasAdmin, bindCitasAdmin);
})();