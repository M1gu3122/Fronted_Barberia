/* ============================================================
   Barberia El Corte Perfecto — Vistas del Cliente
   ============================================================ */
(function () {
  "use strict";

  // ============================================================
  // CACHE DE DATOS DE LA API
  // Evita recargar servicios/barberos en cada paso del wizard
  // ============================================================
  var _cache = {
    servicios: null,
    barberos: null,
    barberosPorServicio: {} // { servicioId: [barberos] }

  };
  var _misCitas = [];

  // Normaliza un servicio de la API al formato que usa la vista

  function _normalizarServicio(s) {
    return {
      id: s.id_servicio ?? s.id,
      nombre: s.nombre_servicio ?? s.nombre ?? "Servicio",
      descripcion: s.descripcion_servicio ?? s.descripcion ?? "",
      duracion: Number(
        s.tiempo_estimado ?? s.duracion ?? 30
      ),
      precio: Number(
        s.precio_servicio ?? s.precio ?? 0
      ),
      activo:
        String(
          s.estado_servicio ??
          s.estado ??
          "Activo"
        ).toLowerCase() === "activo"
    };
  }
  function _normalizarBarbero(b) {
    return {
      id: b.id_usuario ?? b.id_empleado ?? b.id,
      nombre: (
        (b.nombres || "") +
        " " +
        (b.apellidos || "")
      ).trim() || "Barbero",

      especialidad: b.especialidad || "Barbero",
      experiencia: b.experiencia || "",
      horarioIni: b.horario_inicio || "09:00",
      horarioFin: b.horario_fin || "18:00",

      // Este endpoint ya devuelve barberos disponibles,
      // por lo tanto no necesitamos exigir estado/activo.
      activo: true,

      citas: b.citas || 0
    };
  }

  // Carga servicios desde la API con fallback a mock
  async function _cargarServicios() {
    if (_cache.servicios) return _cache.servicios;
    try {
      var data = await api.getServicios();
      var lista = Array.isArray(data) ? data : (data.servicios || data || []);
      _cache.servicios = lista.map(_normalizarServicio).filter(function (s) { return s.activo; });
    } catch (err) {
      console.error("Error cargando servicios desde API, usando mock:", err);
      _cache.servicios = DB.servicios.filter(function (s) { return s.activo; });
    }
    return _cache.servicios;
  }

  // Carga horarios disponibles para una fecha desde la API con fallback a mock
  async function _cargarHorariosDisponibles(fechaStr) {
    try {
      var data = await api.getHorarioBarberia(1, fechaStr);
      if (data && data.length > 0) {
        // Normalizar los datos de la API al formato que espera UI.timeGrid
        // { hora: "HH:MM", libre: true/false }
        return data.map(function (h) {
          return {
            hora: h.hora || h.hora_inicio || h.hora_fin || h.hora_inicio_fin || "",
            libre: h.libre !== false && h.disponible !== false && h.ocupado !== true
          };
        }).filter(function (h) { return h.hora; });
      }
    } catch (err) {
      console.error("Error cargando horarios desde API, usando mock:", err);
    }
    // Fallback a mock: usar DB.horariosLibres con barbero por defecto (1)
    return DB.horariosLibres(1, fechaStr);
  }

  // Carga barberos disponibles para un servicio desde la API con fallback a mock
  async function _cargarBarberos(servicioId) {
    if (servicioId && _cache.barberosPorServicio[servicioId]) {
      return _cache.barberosPorServicio[servicioId];
    }
    try {
      var data = await api.getBarberosDisponibles(servicioId ? [servicioId] : []);
      var lista = Array.isArray(data) ? data : (data.barberos || data || []);
      var barberos = lista.map(_normalizarBarbero).filter(function (b) { return b.activo; });
      if (servicioId) _cache.barberosPorServicio[servicioId] = barberos;
      return barberos;
    } catch (err) {
      console.error("Error cargando barberos desde API, usando mock:", err);
      return DB.barberos.filter(function (b) { return b.activo; });
    }
  }

  // Obtiene el ID del cliente autenticado desde la sesión
  function _clienteId() {
    try {
      var sesion = JSON.parse(sessionStorage.getItem("sesion") || "null");
      return sesion ? (sesion.id_usuario || sesion.id || 1) : 1;
    } catch (e) {
      return 1;
    }
  }

  function buildDashboardHTML(d, clienteId, dataEstados, dataCitas) {
    var completadas = 0;
    var pendientes = 0;
    var confirmadas = 0;
    var canceladas = 0;
    var proxima = null;
    var futuras = [];

    // ============================================================
    // ESTADISTICAS
    // ============================================================

    if (dataEstados) {
      completadas = Number(dataEstados.citas_completadas) || 0;
      pendientes = Number(dataEstados.citas_pendientes) || 0;
      confirmadas = Number(dataEstados.citas_confirmadas) || 0;
    }

    var porVenir = pendientes + confirmadas;

    // ============================================================
    // NORMALIZAR ID DEL CLIENTE
    // ============================================================

    function cidOf(c) {
      if (c.cliente && typeof c.cliente === "object") {
        return Number(c.cliente.id || c.cliente.id_usuario);
      }

      return Number(c.cliente || c.id_cliente || c.id_usuario);
    }

    // ============================================================
    // NORMALIZAR FECHA DE LA CITA
    // ============================================================

    function obtenerFecha(c) {
      if (!c || !c.fecha_hora) return null;

      var fecha = new Date(c.fecha_hora);

      if (isNaN(fecha.getTime())) {
        return null;
      }

      return fecha;
    }

    // ============================================================
    // FORMATEAR FECHA
    // ============================================================

    function formatearFecha(fechaHora) {
      if (!fechaHora) return "";

      return fechaHora.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    }

    // ============================================================
    // FORMATEAR HORA
    // ============================================================

    function formatearHora(fechaHora) {
      if (!fechaHora) return "";

      return fechaHora.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    }

    // ============================================================
    // CITAS CANCELADAS
    // ============================================================

    if (dataCitas && dataCitas.length > 0) {
      canceladas = dataCitas.filter(function (c) {

        var estado = String(c.estado_cita || c.estado || "").toLowerCase();

        return estado === "cancelada";

      }).length;
    }

    // ============================================================
    // PROXIMAS CITAS
    //
    // Ahora los datos vienen de:
    // /usuarios/obtener_info_perfil_usuario/{id_usuario}
    //
    // Campos utilizados:
    // id_cita
    // id_barbero
    // nombres_barbero
    // apellidos_barbero
    // fecha_hora
    // estado_cita
    // servicios
    // ============================================================

    futuras = (dataCitas || [])
      .filter(function (c) {

        var estado = String(
          c.estado_cita || c.estado || ""
        ).toLowerCase();

        var fecha = obtenerFecha(c);

        return (
          (estado === "pendiente" || estado === "confirmada") &&
          fecha !== null &&
          fecha >= new Date()
        );

      })
      .sort(function (a, b) {

        return obtenerFecha(a) - obtenerFecha(b);

      })
      .slice(0, 3);

    // ============================================================
    // PROXIMA CITA
    // ============================================================

    proxima = futuras.length ? futuras[0] : null;

    // ============================================================
    // DATOS DE LA PROXIMA CITA
    // ============================================================

    var proximaFecha = proxima
      ? obtenerFecha(proxima)
      : null;

    var proximaServicio = proxima
      ? proxima.servicios || "Servicio"
      : null;

    var proximoBarbero = proxima
      ? (
        (proxima.nombres_barbero || "") +
        " " +
        (proxima.apellidos_barbero || "")
      ).trim()
      : null;

    var proximoEstado = proxima
      ? String(
        proxima.estado_cita || proxima.estado || ""
      ).toLowerCase()
      : "";

    // ============================================================
    // HTML
    // ============================================================

    return `
    ${proxima
        ? `
          <section class="card hero-cita">

            <div style="
              position:absolute;
              right:-60px;
              top:-60px;
              width:260px;
              height:260px;
              border-radius:50%;
              background:radial-gradient(
                circle,
                rgba(197,160,89,.18),
                transparent 70%
              );
            "></div>

            <div style="
              display:grid;
              gap:6px;
              position:relative;
            ">

              <div
                class="day-pill"
                style="
                  background:rgba(197,160,89,.16);
                  color:var(--brass-light);
                  justify-self:start;
                "
              >
                PROXIMA CITA
              </div>

              <div
                class="font-display"
                style="
                  font-size:26px;
                  font-weight:700;
                  color:#fff;
                  margin-top:4px;
                "
              >
                ${proximaServicio}
              </div>

              <div style="
                color:#cfccc4;
                font-size:14px;
              ">
                ${formatearFecha(proximaFecha)}
                ·
                ${formatearHora(proximaFecha)}
                hs
              </div>

              <div style="
                display:flex;
                gap:14px;
                flex-wrap:wrap;
                margin-top:10px;
                font-size:13px;
                color:#cfccc4;
              ">

                <span>
                  <i
                    class="fas fa-user-tie"
                    style="
                      color:var(--brass-light);
                      margin-right:6px;
                    "
                  ></i>

                  ${proximoBarbero || "Barbero"}
                </span>

                <span>
                  <i
                    class="fas fa-calendar-check"
                    style="
                      color:var(--brass-light);
                      margin-right:6px;
                    "
                  ></i>

                  Cita #${proxima.id_cita}
                </span>

                <span>
                  ${UI.estadoBadge(proximoEstado)}
                </span>

              </div>

              <div style="
                display:flex;
                gap:10px;
                margin-top:18px;
                flex-wrap:wrap;
              ">

                <button
                  class="btn btn-primary"
                  onclick="App.navigate('mis-citas')"
                >
                  <i class="fas fa-calendar-check"></i>
                  Ver mi cita
                </button>

                <button
                  class="btn btn-ghost"
                  style="
                    border-color:rgba(255,255,255,.25);
                    color:#fff;
                  "
                  data-accion="reprogramar"
                  data-cita="${proxima.id_cita}"
                >
                  <i class="fas fa-pen"></i>
                  Reprogramar
                </button>

              </div>

            </div>

          </section>
        `
        : `
          <section
            class="card empty"
            style="border:1px dashed var(--line);"
          >

            <div class="empty-ico">
              <i class="fas fa-calendar-plus"></i>
            </div>

            <div class="empty-title">
              No tienes citas proximas
            </div>

            <div class="empty-text">
              Reserva tu proximo corte y mantente siempre con estilo.
            </div>

            <button
              class="btn btn-primary"
              onclick="App.navigate('reservar')"
            >
              <i class="fas fa-calendar-plus"></i>
              Reservar cita
            </button>

          </section>
        `
      }

    <!-- ========================================================
         ESTADISTICAS
         ======================================================== -->

    <section class="card" style="padding:6px;">

      <div style="
        display:grid;
        grid-template-columns:repeat(
          auto-fit,
          minmax(150px,1fr)
        );
        gap:8px;
        padding:8px;
      ">

        ${[
        [
          completadas,
          "Cortes completados",
          "fa-scissors"
        ],
        [
          porVenir,
          "Citas por venir",
          "fa-calendar-day"
        ],
        [
          canceladas,
          "Cancelaciones",
          "fa-ban"
        ]
      ]
        .map(function (k) {

          return `
                <section class="card kpi">

                  <div class="kpi-top">

                    <span
                      class="kpi-ico"
                      style="
                        background:var(--bone);
                        color:var(--brass-dim);
                      "
                    >
                      <i class="fas ${k[2]}"></i>
                    </span>

                    <span class="kpi-label">
                      ${k[1]}
                    </span>

                  </div>

                  <div class="kpi-value">
                    ${k[0]}
                  </div>

                </section>
              `;

        })
        .join("")
      }

      </div>

    </section>

    <!-- ========================================================
         PROXIMAS CITAS
         ======================================================== -->

    <section class="card">

      <div class="card-header">

        <div>

          <div class="card-title">
            Proximas citas
          </div>

          <div class="card-sub">
            Tus proximos compromisos
          </div>

        </div>

        <button
          class="btn btn-sm btn-ghost"
          style="margin-left:auto;"
          onclick="App.navigate('mis-citas')"
        >
          Ver todas
        </button>

      </div>

      <div style="padding:10px 14px;">

        ${futuras.length

        ? futuras
          .map(function (c) {

            var fechaHora = obtenerFecha(c);

            var servicio =
              c.servicios || "Servicio";

            var barbero = (
              (c.nombres_barbero || "") +
              " " +
              (c.apellidos_barbero || "")
            ).trim() || "Barbero";

            var estado =
              String(
                c.estado_cita ||
                c.estado ||
                ""
              ).toLowerCase();

            return `
                    <div class="appt-tile ${estado}">

                      <div class="appt-time">
                        ${formatearHora(fechaHora)}
                      </div>

                      <div class="appt-main">

                        <div class="appt-title">
                          ${servicio}
                        </div>

                        <div class="appt-sub">
                          ${barbero}
                          ·
                          ${formatearFecha(fechaHora)}
                        </div>

                      </div>

                      <div>
                        ${UI.estadoBadge(estado)}
                      </div>

                    </div>
                  `;

          })
          .join("")

        : `
              <div
                class="empty"
                style="padding:30px;"
              >

                <div
                  class="empty-text"
                  style="margin:0;"
                >
                  Aun no tienes citas programadas.
                </div>

              </div>
            `
      }

      </div>

    </section>
  `;
  }

  function buildFallbackDashboardHTML(d, clienteId) {
    var misCitas = d.citas.filter(function (c) {
      var cid = c.cliente;
      if (cid && typeof cid === "object") cid = cid.id || cid.id_usuario;
      return cid === clienteId;
    });
    return buildDashboardHTML(d, clienteId, {
      citas_completadas: misCitas.filter(function (c) { return c.estado === "completada"; }).length,
      citas_pendientes: misCitas.filter(function (c) { return c.estado === "pendiente"; }).length,
      citas_confirmadas: misCitas.filter(function (c) { return c.estado === "confirmada"; }).length
    }, misCitas);
  }

  // Lee el id del cliente logueado desde la sesión o el token JWT (claim "sub").
  // Devuelve null si no hay sesión ni token válido.
  function getClienteId() {
    try {
      var sesion = JSON.parse(sessionStorage.getItem("sesion") || "null");
      if (sesion && sesion.id_usuario) return Number(sesion.id_usuario);
    } catch (e) { /* ignore */ }
    var payload = _decodificarToken();
    if (payload && payload.sub) {
      var n = parseInt(payload.sub, 10);
      if (!isNaN(n)) return n;
    }
    return null;
  }

  // Carga asíncrona: pinta esqueletos y luego reemplaza con el HTML real
  async function initDashboard() {
    var d = DB;
    var clienteId = getClienteId();

    if (!clienteId) {
      clienteId = 1;
    }

    var region = App.el("view-region");

    if (!region) return;

    try {

      var results = await Promise.all([

        // Estadisticas del cliente
        api.obtenerCitasPorEstado(clienteId),

        // Citas del usuario (con detalle de servicios y barbero)
        api.obtenerCitasPorCliente(clienteId)

      ]);

      var dataEstados = results[0];
      var dataCitas = results[1];
      var d = DB;

      // Obtener citas del usuario - el API devuelve un array de citas
      if (Array.isArray(dataCitas)) {
        _misCitas = dataCitas;
      } else if (dataCitas && dataCitas.citas && Array.isArray(dataCitas.citas)) {
        _misCitas = dataCitas.citas;
      } else {
        _misCitas = [];
      }

      // Normalizar el campo id_cita si viene como 'id'
      _misCitas = _misCitas.map(function (cita) {
        if (cita && cita.id && !cita.id_cita) {
          cita.id_cita = cita.id;
        }
        return cita;
      });

      var mis = _misCitas;

      console.log(
        "Información del perfil/citas:",
        dataCitas
      );

      region.innerHTML = buildDashboardHTML(
        d,
        clienteId,
        dataEstados,
        dataCitas
      );

    } catch (err) {

      console.error(
        "Error fetching dashboard data:",
        err
      );

      region.innerHTML =
        buildFallbackDashboardHTML(
          d,
          clienteId
        );
    }
  }

  // Wrapper síncrono: pinta esqueletos y dispara la carga
  var renderDashboardWrapper = function () {
    var region = App.el("view-region");
    if (!region) return;
    region.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:14px;">
      ${[1, 2, 3].map(function () { return '<section class="card kpi skeleton" style="height:90px;"></section>'; }).join("")}
    </div>
    <section class="card skeleton" style="height:180px;margin-top:16px;"></section>
    <section class="card skeleton" style="height:240px;margin-top:16px;"></section>
  `;
    initDashboard();
  };

  var bindDashboard = function () {
    var region = App.el("view-region");
    if (!region) return;

    if (region._dashboardClick) {
      region.removeEventListener("click", region._dashboardClick);
    }

    region._dashboardClick = function (e) {
      var btn = e.target.closest("[data-accion]");
      if (!btn) return;

      var accion = btn.getAttribute("data-accion");
      var citaId = parseInt(btn.getAttribute("data-cita"), 10);

      if (accion === "reprogramar" && citaId) {
        // Buscar la cita en _misCitas
        var c = _misCitas.find(function (cita) {
          return Number(cita.id_cita) === Number(citaId);
        });

        if (!c) {
          // Si no está en caché, intentar cargar desde la API
          api.obtenerCitasDetalles().then(function (dataCitas) {
            var citas = Array.isArray(dataCitas) ? dataCitas : [];
            _misCitas = citas.map(function (cita) {
              if (cita && cita.id && !cita.id_cita) {
                cita.id_cita = cita.id;
              }
              return cita;
            });

            var citaEncontrada = _misCitas.find(function (cita) {
              return Number(cita.id_cita) === Number(citaId);
            });

            if (!citaEncontrada) {
              UI.toast("Error", "No se encontró la información de esta cita.", "error");
              return;
            }

            App.reservarPara = {
              id: citaId,
              servicio: citaEncontrada.id_servicio || citaEncontrada.servicio || null,
              barbero: citaEncontrada.id_barbero || null
            };

            App.navigate("reprogramar");
          }).catch(function (err) {
            console.error("Error obteniendo citas:", err);
            UI.toast("Error", "No se pudo cargar la información de la cita.", "error");
          });
          return;
        }

        App.reservarPara = {
          id: citaId,
          servicio: c.id_servicio || c.servicio || null,
          barbero: c.id_barbero || null
        };

        App.navigate("reprogramar");
      }
    };

    region.addEventListener("click", region._dashboardClick);
  };
  /* ---------- Reservar cita (5 pasos) ---------- */
  var reserva = { paso: 1, servicio: null, barbero: null, fecha: null, hora: null };

  async function rReservar() {
    var pasos = ["Servicio", "Barbero", "Fecha", "Hora", "Confirmacion"];

    // Pre-cargar servicios si aún no están disponibles
    if (!_cache.servicios) {
      _cache.servicios = await _cargarServicios();
    }

    var html = `
    <section class="card" style="padding:18px 20px;">
      <div class="steps">
        ${pasos.map(function (p, i) {
      var n = i + 1;
      var cls = n === reserva.paso
        ? "active"
        : (n < reserva.paso ? "done" : "");

      return `
            <div class="step ${cls}">
              <span class="step-dot">${n < reserva.paso ? '✓' : n}</span>
              <span class="step-label">${p}</span>
            </div>
            ${n < pasos.length ? '<div class="step-line"></div>' : ""}
          `;
    }).join("")}
      </div>
    </section>

    <div id="reserva-panel" style="margin-top:16px;">
      ${reserva.paso === 1
        ? await pasoServicio()
        : reserva.paso === 2
          ? await pasoBarbero()
          : reserva.paso === 3
            ? await pasoFecha()
            : reserva.paso === 4
              ? await pasoHora()
              : await pasoConfirmacion()
      }
    </div>`;

    return html;
  }

  async function pasoServicio() {
    // Cargar servicios async si no están en caché
    if (!_cache.servicios) {
      _cache.servicios = await _cargarServicios();
    }
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Selecciona el servicio</div><div class="card-sub">Elige el estilo que quieres</div></div></div>
        <div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
          ${(_cache.servicios || DB.servicios.filter(function (s) { return s.activo; })).map(function (s) {
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

  async function pasoBarbero() {
    // Cargar barberos para el servicio seleccionado
    const barberos = reserva.servicio ? await _cargarBarberos(reserva.servicio) : [];
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Elige tu barbero</div><div class="card-sub">Todos son profesionales certificados</div></div></div>
        <div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
          ${(barberos.length ? barberos : (DB.barberos.filter(function (b) { return b.activo; }))).map(function (b) {
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

  async function pasoFecha() {
    var today = new Date();

    // Normalizar la fecha de hoy para comparar solamente año/mes/día
    today.setHours(0, 0, 0, 0);

    var mes = today.getMonth();
    var ano = today.getFullYear();

    var primero = new Date(ano, mes, 1);
    var diaSemanaInicio = primero.getDay();
    var diasEnMes = new Date(ano, mes + 1, 0).getDate();

    var nomMes = primero.toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric"
    });

    var celdas = [];

    // Espacios antes del primer día del mes
    for (var i = 0; i < diaSemanaInicio; i++) {
      celdas.push('<div class="cal-day other"></div>');
    }

    // Generar los días del mes
    for (var dia = 1; dia <= diasEnMes; dia++) {
      var d = new Date(ano, mes, dia);
      d.setHours(0, 0, 0, 0);

      var fechaIso = DateUtils.fromDate(d);

      var cls = "cal-day";

      // Marcar día actual
      if (fechaIso === DB.iso(0)) {
        cls += " today";
      }

      // Marcar fecha seleccionada
      if (fechaIso === reserva.fecha) {
        cls += " selected";
      }

      // Días anteriores
      if (d < today) {
        cls += " other";
      }

      /*
       * IMPORTANTE:
       * Aquí NO hacemos:
       *
       * await _cargarHorariosDisponibles(fechaStr)
       *
       * porque eso provocaba una petición a la API por cada día
       * del calendario apenas se abría la vista.
       */

      var hayCita = DB.citas.filter(function (c) {
        return (
          c.fecha === fechaIso &&
          c.estado !== "cancelada"
        );
      }).length > 0;

      // Por ahora solamente deshabilitamos fechas anteriores a hoy.
      // Los horarios se consultarán cuando el usuario seleccione
      // una fecha concreta.
      var disabled = d < today;

      var dotClass = hayCita
        ? ' class="cdot"'
        : "";

      celdas.push(`
      <button
        type="button"
        class="${cls}"
        data-fecha="${fechaIso}"
        ${disabled ? "disabled" : ""}
      >
        ${dia}
        ${hayCita ? '<span class="cdot"></span>' : ''}
      </button>
    `);
    }

    var html = `
    <section class="card">
      
      <div class="card-header">
        <div>
          <div class="card-title">
            Selecciona la fecha
          </div>

          <div
            class="card-sub"
            style="text-transform:capitalize;"
          >
            ${nomMes}
          </div>
        </div>
      </div>

      <div class="card-body">

        <div class="cal-head">
          ${[
        "Dom",
        "Lun",
        "Mar",
        "Mie",
        "Jue",
        "Vie",
        "Sab"
      ]
        .map(function (d) {
          return `<span>${d}</span>`;
        })
        .join("")}
        </div>

        <div class="cal-grid">
          ${celdas.join("")}
        </div>

      </div>

      <div
        class="card-footer"
        style="
          display:flex;
          justify-content:space-between;
          gap:10px;
        "
      >

        <button
          class="btn btn-ghost"
          onclick="App.goReserva(2)"
        >
          <i class="fas fa-arrow-left"></i>
          Atras
        </button>

        <button
          class="btn btn-primary"
          id="reserva-next"
          ${reserva.fecha ? "" : "disabled"}
        >
          Continuar
          <i class="fas fa-arrow-right"></i>
        </button>

      </div>

    </section>
  `;

    return html;
  }

  async function pasoHora() {
    var fechaSel = reserva.fecha || DateUtils.iso(0);
    var barberoId = reserva.barbero || 1;
    var horarios = await _cargarHorariosDisponibles(fechaSel);
    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Selecciona la hora</div><div class="card-sub">Solo se muestran horarios disponibles</div></div></div>
        <div class="card-body">
          ${UI.timeGrid(horarios, reserva.hora)}
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

  async function pasoConfirmacion() {
    // Buscar el servicio en los datos cargados desde la API
    if (!_cache.servicios) {
      _cache.servicios = await _cargarServicios();
    }

    var s = _cache.servicios.find(function (servicio) {
      return Number(servicio.id) === Number(reserva.servicio);
    });

    // Buscar el barbero asociado al servicio seleccionado
    var barberos = [];

    if (reserva.servicio) {
      barberos = await _cargarBarberos(reserva.servicio);
    }

    var b = barberos.find(function (barbero) {
      return Number(barbero.id) === Number(reserva.barbero);
    });

    // Validación para evitar que la vista reviente
    if (!s) {
      console.error(
        "No se encontró el servicio seleccionado:",
        reserva.servicio
      );

      return `
      <section class="card">
        <div class="empty">
          <div class="empty-ico">
            <i class="fas fa-triangle-exclamation"></i>
          </div>
          <div class="empty-title">Servicio no encontrado</div>
          <div class="empty-text">
            No se pudo encontrar el servicio seleccionado.
          </div>
          <button class="btn btn-primary" onclick="App.goReserva(1)">
            Volver a servicios
          </button>
        </div>
      </section>
    `;
    }

    if (!b) {
      console.error(
        "No se encontró el barbero seleccionado:",
        reserva.barbero
      );

      return `
      <section class="card">
        <div class="empty">
          <div class="empty-ico">
            <i class="fas fa-user-tie"></i>
          </div>
          <div class="empty-title">Barbero no encontrado</div>
          <div class="empty-text">
            No se pudo encontrar el barbero seleccionado.
          </div>
          <button class="btn btn-primary" onclick="App.goReserva(2)">
            Volver a barberos
          </button>
        </div>
      </section>
    `;
    }

    var html = `
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Confirma tu cita</div>
          <div class="card-sub">
            Revisa que todo este en orden
          </div>
        </div>
      </div>

      <div class="card-body">
        <div style="display:grid;gap:14px;">

          ${[
        [
          "Servicio",
          s.nombre + " (" + s.duracion + " min)",
          "fa-scissors"
        ],
        [
          "Barbero",
          b.nombre + " — " + b.especialidad,
          "fa-user-tie"
        ],
        [
          "Fecha",
          DB.formatFechaLargaConAno(reserva.fecha),
          "fa-calendar-day"
        ],
        [
          "Hora",
          reserva.hora + " hs",
          "fa-clock"
        ],
        [
          "Duracion",
          s.duracion + " minutos",
          "fa-hourglass-half"
        ],
        [
          "Precio",
          DB.formatPrecio(s.precio),
          "fa-tag"
        ]
      ]
        .map(function (f) {
          return `
                <div style="
                  display:flex;
                  align-items:center;
                  gap:12px;
                  padding:10px 12px;
                  background:var(--sand);
                  border-radius:9px;
                ">
                  <span
                    class="kpi-ico"
                    style="
                      background:var(--bone);
                      color:var(--brass-dim);
                    "
                  >
                    <i class="fas ${f[2]}"></i>
                  </span>

                  <div style="flex:1;">
                    <div
                      class="cell-muted"
                      style="
                        font-size:11.5px;
                        text-transform:uppercase;
                        letter-spacing:.06em;
                        font-weight:700;
                      "
                    >
                      ${f[0]}
                    </div>

                    <div
                      style="
                        font-weight:600;
                        font-size:14px;
                      "
                    >
                      ${f[1]}
                    </div>
                  </div>
                </div>
              `;
        })
        .join("")}

        </div>
      </div>

      <div
        class="card-footer"
        style="
          display:flex;
          justify-content:space-between;
          gap:10px;
        "
      >
        <button
          class="btn btn-ghost"
          onclick="App.goReserva(4)"
        >
          <i class="fas fa-arrow-left"></i>
          Atras
        </button>

        <button
          class="btn btn-primary"
          id="reserva-confirmar"
        >
          <i class="fas fa-circle-check"></i>
          Confirmar cita
        </button>
      </div>
    </section>
  `;

    return html;
  }

  function bindReserva() {

    var panel = App.el("reserva-panel");

    if (!panel) return;

    panel.addEventListener("click", function (e) {

      // ============================================================
      // SELECCIONAR SERVICIO / BARBERO
      // ============================================================
      var sel = e.target.closest("[data-sel]");

      if (sel) {

        var tipo = sel.getAttribute("data-sel");
        var id = parseInt(sel.getAttribute("data-id"), 10);

        if (tipo === "servicio") {
          reserva.servicio = id;

          // Si cambia el servicio, el barbero seleccionado
          // deja de ser válido.
          reserva.barbero = null;
        }

        if (tipo === "barbero") {
          reserva.barbero = id;
        }

        document
          .querySelectorAll("#reserva-panel [data-sel]")
          .forEach(function (el) {
            el.classList.remove("selected");
          });

        sel.classList.add("selected");

        var next = App.el("reserva-next");

        if (next) {
          next.disabled = false;
        }
      }

      // ============================================================
      // SELECCIONAR FECHA
      // ============================================================
      var fechaBtn = e.target.closest("[data-fecha]");

      if (fechaBtn) {

        reserva.fecha = fechaBtn.getAttribute("data-fecha");

        document
          .querySelectorAll("#reserva-panel [data-fecha]")
          .forEach(function (el) {
            el.classList.remove("selected");
          });

        fechaBtn.classList.add("selected");

        var next2 = App.el("reserva-next");

        if (next2) {
          next2.disabled = false;
        }
      }

      // ============================================================
      // SELECCIONAR HORA
      // ============================================================
      var horaBtn = e.target.closest(".time-slot:not(.taken)");

      if (horaBtn) {

        reserva.hora = horaBtn.getAttribute("data-hora");

        document
          .querySelectorAll("#reserva-panel .time-slot")
          .forEach(function (el) {
            el.classList.remove("selected");
          });

        horaBtn.classList.add("selected");

        var next3 = App.el("reserva-next");

        if (next3) {
          next3.disabled = false;
        }
      }

      // ============================================================
      // BOTON CONTINUAR
      // ============================================================
      var nextBtn = e.target.closest("#reserva-next");

      if (nextBtn) {
        App.goReserva(reserva.paso + 1);
      }

      // ============================================================
      // CONFIRMAR CITA
      // ============================================================
      var confirmar = e.target.closest("#reserva-confirmar");

      if (confirmar) {

        confirmar.classList.add("btn-loading");
        confirmar.disabled = true;

        (async function () {

          try {

            var clienteId = getClienteId() || 1;

            // ======================================================
            // CONSTRUIR FECHA Y HORA PARA EL BACKEND
            //
            // Backend espera:
            // YYYY-MM-DDTHH:MM:SS
            //
            // Ejemplo:
            // 2026-08-26T10:00:00
            // ======================================================

            var fechaHora =
              reserva.fecha +
              "T" +
              reserva.hora +
              ":00";

            // ======================================================
            // OBJETO QUE ESPERA FASTAPI
            // ======================================================

            var datosCita = {


              fecha_hora: fechaHora,

              estado_cita: "Pendiente",

              id_cliente: clienteId,

              id_barbero: reserva.barbero,

              id_barberia: 1,

              ids_servicios: [
                reserva.servicio
              ]

            };

            console.log(
              "Datos enviados para crear cita:",
              datosCita
            );

            // ======================================================
            // CREAR CITA
            // ======================================================

            await api.crearCita(datosCita);

            UI.toast(
              "Cita reservada",
              "Tu cita fue agendada con exito. Te enviamos la confirmacion.",
              "success"
            );

            // Reiniciar wizard
            reserva = {
              paso: 1,
              servicio: null,
              barbero: null,
              fecha: null,
              hora: null
            };

            // Ir a mis citas
            App.navigate("mis-citas");

          } catch (err) {

            console.error(
              "Error creando cita:",
              err
            );

            UI.toast(
              "Error",
              err.message ||
              "No se pudo reservar la cita.",
              "error"
            );

            // Permitir volver a intentar
            confirmar.classList.remove("btn-loading");
            confirmar.disabled = false;
          }

        })();
      }

    });

  }
  /* ---------- Mis citas ---------- */
  async function rMisCitas() {
    var clienteId = getClienteId();
    if (!clienteId) clienteId = 1;
    var results = await Promise.all([
      api.obtenerCitasPorEstado(clienteId),
      api.obtenerCitasPorCliente(clienteId)
    ]);
    var dataEstados = results[0];
    var dataCitas = results[1];
    var d = DB;
    var mis = dataCitas || DB.citas.filter(function (c) { return c.cliente === clienteId; });

    // Guardar en _misCitas para que reprogramar pueda encontrar la cita
    _misCitas = mis.map(function (cita) {
      if (cita && cita.id && !cita.id_cita) {
        cita.id_cita = cita.id;
      }
      return cita;
    });

    function estadoDe(c) {
      return String(c.estado_cita || c.estado || "").toLowerCase();
    }

    var activas = mis.filter(function (c) {
      var e = estadoDe(c);
      return e !== "completada" && e !== "cancelada";
    }).sort(function (a, b) { return new Date(a.fecha_hora) - new Date(b.fecha_hora); });

    var pasadas = mis.filter(function (c) {
      var e = estadoDe(c);
      return e === "completada" || e === "cancelada";
    }).sort(function (a, b) { return new Date(b.fecha_hora) - new Date(a.fecha_hora); });

    function tile(c) {
      var estado = String(c.estado_cita || "").toLowerCase();

      var nombreServicio = c.servicios || "Servicio";
      var nombreBarbero = `${c.nombres_barbero || ""} ${c.apellidos_barbero || ""}`.trim();
      var duracion = Number(c.tiempo_total || 0);

      var fechaHora = new Date(c.fecha_hora);

      var fecha = fechaHora.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });

      var hora = fechaHora.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit"
      });

      var acciones = "";

      if (estado === "pendiente" || estado === "confirmada") {
        acciones = `
      <button class="btn btn-sm btn-ghost"
        data-cita="${c.id_cita}"
        data-accion="ver">
        <i class="fas fa-eye"></i>
      </button>

      <button class="btn btn-sm btn-ghost"
        data-cita="${c.id_cita}"
        data-accion="reprogramar">
        <i class="fas fa-pen"></i> Reprogramar
      </button>

      <button class="btn btn-sm btn-danger"
        data-cita="${c.id_cita}"
        data-accion="cancelar">
        <i class="fas fa-xmark"></i> Cancelar
      </button>`;
      }

      return `
    <div class="appt-tile ${estado}">
      <div class="appt-time">${hora}</div>

      <div class="appt-main">
        <div class="appt-title">${nombreServicio}</div>
        <div class="appt-sub">
          ${nombreBarbero} · ${fecha} · ${duracion} min
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:10px;">
        ${UI.estadoBadge(estado)}
        ${acciones}
      </div>
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

    if (region._misCitasClick) {
      region.removeEventListener(
        "click",
        region._misCitasClick
      );
    }

    region._misCitasClick = function (e) {

      var btn = e.target.closest("[data-accion]");

      if (!btn) return;

      var citaId = parseInt(
        btn.getAttribute("data-cita"),
        10
      );

      var accion = btn.getAttribute("data-accion");

      // =====================================================
      // BUSCAR LA CITA EN LOS DATOS CARGADOS DESDE LA API
      // =====================================================
      console.log("citaId:", citaId);
      console.log("_misCitas:", _misCitas);
      console.log("cantidad:", _misCitas.length);

      var c;

      // Si _misCitas está vacío, intentar obtenerlo desde la API
      if (_misCitas.length === 0) {
        api.obtenerCitasPorCliente(getClienteId() || 1).then(function (dataCitas) {
          // Normalizar formato
          var citas = Array.isArray(dataCitas) ? dataCitas : [];
          // Guardar en _misCitas para futuras búsquedas
          _misCitas = citas;
          // Normalizar campo id_cita si viene como 'id'
          _misCitas = _misCitas.map(function (cita) {
            if (cita && cita.id && !cita.id_cita) {
              cita.id_cita = cita.id;
            }
            return cita;
          });
          // Buscar la cita
          c = _misCitas.find(function (cita) {
            return Number(cita.id_cita) === Number(citaId);
          });

          if (!c) {
            console.error("No se encontró la cita:", citaId, _misCitas);
            UI.toast("Error", "No se encontró la información de esta cita.", "error");
            return;
          }

          // Procesar la acción con la cita encontrada
          procesarAccion(c, citaId, accion);
        }).catch(function (err) {
          console.error("Error obteniendo citas:", err);
          UI.toast("Error", "No se pudo cargar la información de la cita.", "error");
        });
        return;
      }

      // Buscar la cita en _misCitas ya cargado
      c = _misCitas.find(function (cita) {
        return Number(cita.id_cita) === Number(citaId);
      });

      if (!c) {

        console.error(
          "No se encontró la cita:",
          citaId,
          _misCitas
        );

        UI.toast(
          "Error",
          "No se encontró la información de esta cita.",
          "error"
        );

        return;
      }

      // Procesar la acción con la cita encontrada
      procesarAccion(c, citaId, accion);
    };

    // Función que procesa la acción (ver, cancelar, reprogramar)
    function procesarAccion(c, citaId, accion) {
      // =====================================================
      // DATOS DE LA CITA
      // =====================================================

      var barbero = (
        (c.nombres_barbero || "") +
        " " +
        (c.apellidos_barbero || "")
      ).trim();

      if (!barbero) {
        barbero = "Barbero";
      }

      var duracion =
        Number(c.tiempo_total || 0);

      var fechaHora =
        new Date(c.fecha_hora);

      var fecha = !isNaN(fechaHora.getTime())
        ? fechaHora.toLocaleDateString(
          "es-CO",
          {
            day: "2-digit",
            month: "long",
            year: "numeric"
          }
        )
        : "Fecha no disponible";

      var hora = !isNaN(fechaHora.getTime())
        ? fechaHora.toLocaleTimeString(
          "es-CO",
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }
        )
        : "";

      var estado = String(
        c.estado_cita ||
        c.estado ||
        ""
      ).toLowerCase();

      var servicio =
        c.servicios ||
        "Servicio";

      // =====================================================
      // VER
      // =====================================================

      if (accion === "ver") {

        UI.modal({

          titulo: "Detalle de cita",

          icon:
            '<i class="fas fa-calendar-check"></i>',

          body: `
          <div style="display:grid;gap:12px;">

            <div style="
              display:flex;
              justify-content:space-between;
              gap:10px;
              padding-bottom:8px;
              border-bottom:1px solid var(--line);
            ">
              <span class="cell-muted">
                Servicio
              </span>

              <span style="font-weight:600;text-align:right;">
                ${servicio}
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              gap:10px;
              padding-bottom:8px;
              border-bottom:1px solid var(--line);
            ">
              <span class="cell-muted">
                Barbero
              </span>

              <span style="font-weight:600;text-align:right;">
                ${barbero}
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              gap:10px;
              padding-bottom:8px;
              border-bottom:1px solid var(--line);
            ">
              <span class="cell-muted">
                Fecha
              </span>

              <span style="font-weight:600;text-align:right;">
                ${fecha}
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              gap:10px;
              padding-bottom:8px;
              border-bottom:1px solid var(--line);
            ">
              <span class="cell-muted">
                Hora
              </span>

              <span style="font-weight:600;text-align:right;">
                ${hora}
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              gap:10px;
              padding-bottom:8px;
              border-bottom:1px solid var(--line);
            ">
              <span class="cell-muted">
                Duracion
              </span>

              <span style="font-weight:600;text-align:right;">
                ${duracion > 0 ? duracion + " min" : "-"}
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              gap:10px;
            ">
              <span class="cell-muted">
                Estado
              </span>

              <span>
                ${UI.estadoBadge(estado)}
              </span>
            </div>

          </div>
        `,

          footer: `
          <button
            class="btn btn-ghost"
            data-close-modal
          >
            Cerrar
          </button>
        `
        });

        setTimeout(function () {

          var close =
            document.querySelector(
              "[data-close-modal]"
            );

          if (close) {

            close.addEventListener(
              "click",
              function () {

                document
                  .querySelectorAll(".modal-overlay")
                  .forEach(function (o) {
                    o.remove();
                  });

              }
            );

          }

        }, 50);

        return;
      }

      // =====================================================
      // CANCELAR
      // =====================================================

      if (accion === "cancelar") {

        UI.confirm({

          titulo: "Cancelar cita",

          tipo: "danger",

          icono: "fa-xmark",

          mensaje: `
          Vas a cancelar tu cita de
          <strong>${servicio}</strong>
          con ${barbero}
          el ${fecha}
          a las ${hora}.
        `,

          confirmarTexto: "Cancelar cita",

          onConfirm: async function () {

            try {

              await api.cancelarCita(citaId);

              UI.toast(
                "Cita cancelada",
                "Hemos notificado al barbero del cambio.",
                "info"
              );

              App.navigate("mis-citas");

            } catch (err) {

              console.error(
                "Error cancelando cita:",
                err
              );

              UI.toast(
                "Error",
                err.message ||
                "No se pudo cancelar la cita.",
                "error"
              );

            }

          }

        });

        return;
      }

      // =====================================================
      // REPROGRAMAR
      // =====================================================

      if (accion === "reprogramar") {

        App.reservarPara = {

          id: citaId,

          servicio:
            c.id_servicio ||
            c.servicio ||
            null,

          barbero:
            c.id_barbero ||
            null

        };

        console.log(
          "Datos para reprogramar:",
          App.reservarPara
        );

        App.navigate("reprogramar");

        return;
      }

    };

    region.addEventListener(
      "click",
      region._misCitasClick
    );
  }

  /* ---------- Reprogramar cita ---------- */
  async function rReprogramar() {
    var reservaActual = App.reservarPara || {};

    // Buscar la cita original en los datos cargados desde la API
    var orig = _misCitas.find(function (c) {
      return Number(c.id_cita) === Number(reservaActual.id);
    });

    // Si no está en caché, intentar cargar desde la API
    if (!orig) {
      try {
        var dataCitas = await api.obtenerCitasPorCliente(getClienteId() || 1);
        var citas = Array.isArray(dataCitas) ? dataCitas : [];
        _misCitas = citas.map(function (cita) {
          if (cita && cita.id && !cita.id_cita) {
            cita.id_cita = cita.id;
          }
          return cita;
        });
        orig = _misCitas.find(function (c) {
          return Number(c.id_cita) === Number(reservaActual.id);
        });
      } catch (err) {
        console.error("Error cargando citas para reprogramar:", err);
      }
    }

    if (!orig) {
      return '<div class="empty"><div class="empty-text">Cita no encontrada.</div></div>';
    }

    var servicio = orig.servicios || "Servicio";
    var barbero = (
      (orig.nombres_barbero || "") +
      " " +
      (orig.apellidos_barbero || "")
    ).trim() || "Barbero";

    var fechaHoraOrig = new Date(orig.fecha_hora);
    var fechaOrig = !isNaN(fechaHoraOrig.getTime())
      ? fechaHoraOrig.toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        })
      : "Fecha no disponible";

    var horaOrig = !isNaN(fechaHoraOrig.getTime())
      ? fechaHoraOrig.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        })
      : "";

    var estadoOrig = String(orig.estado_cita || orig.estado || "").toLowerCase();

    var fechaSel = reservaActual.nuevaFecha || DB.iso(2);
    var horaSel = reservaActual.nuevaHora || "";

    // Cargar horarios disponibles desde la API
    var slots = await _cargarHorariosDisponibles(fechaSel);

    var html = `
      <section class="card">
        <div class="card-header"><div><div class="card-title">Reprogramar cita</div><div class="card-sub">Selecciona nueva fecha y hora</div></div></div>
        <div class="card-body">
          <div style="display:grid;gap:10px;margin-bottom:20px;">
            <div class="appt-tile ${estadoOrig}">
              <div class="appt-time">${horaOrig}</div>
              <div class="appt-main"><div class="appt-title">${servicio} — Actual</div>
              <div class="appt-sub">${barbero} · ${fechaOrig}</div></div>
              <div>${UI.estadoBadge(estadoOrig)}</div>
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
    if (region._reprogramarChange) region.removeEventListener("change", region._reprogramarChange);

    // Escuchar el cambio de fecha: se dispara solo cuando el usuario
    // selecciona una fecha nueva en el calendario nativo.
    region._reprogramarChange = function (e) {
      var fecha = e.target.closest("#reprogramar-fecha");
      if (fecha) {
        var val = fecha.value;
        if (val && App.reservarPara) {
          App.reservarPara.nuevaFecha = val;
          App.reservarPara.nuevaHora = "";
          App.navigate("reprogramar");
        }
      }
    };

    region._reprogramarClick = function (e) {
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
            // Usar el valor real del input de fecha (funciona aunque el usuario
            // no haya cambiado la fecha por defecto) y la hora del slot elegido.
            var fechaEl = App.el("reprogramar-fecha");
            var fecha = fechaEl ? fechaEl.value : (App.reservarPara.nuevaFecha || "");
            var slotSel = document.querySelector(".time-slot.selected");
            var hora = App.reservarPara.nuevaHora || (slotSel ? slotSel.getAttribute("data-hora") : "") || "";

            if (!fecha || !hora) {
              UI.toast("Datos incompletos", "Selecciona fecha y hora para reprogramar.", "error");
              confirmar.classList.remove("btn-loading");
              confirmar.disabled = false;
              return;
            }

            App.reservarPara.nuevaFecha = fecha;
            App.reservarPara.nuevaHora = hora;

            // Construir fecha_hora en el formato que espera el backend:
            // YYYY-MM-DDTHH:mm:ss-05:00 (con offset de zona horaria)
            var fechaHora = DateUtils.toApiDateTime(fecha, hora);

            await api.actualizarCita(App.reservarPara.id, {
              fecha_hora: fechaHora
            });
            UI.toast("Cita reprogramada", "Tu cita fue movida al " + fecha + " a las " + hora + ".", "success");
          } catch (err) {
            console.error("Error reprogramando cita:", err);
            // Extraer mensaje de error correctamente (422 devuelve array de validación)
            var msg = "";
            if (err && err.detail !== undefined && err.detail !== null) {
              msg = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
            } else if (typeof err === "string") {
              msg = err;
            } else if (err && typeof err.message === "string") {
              msg = err.message;
            } else if (err && err.data) {
              msg = typeof err.data === "string" ? err.data : JSON.stringify(err.data);
            } else {
              msg = "No se pudo reprogramar la cita.";
            }
            UI.toast("Error", msg, "error");
            confirmar.classList.remove("btn-loading");
            confirmar.disabled = false;
            return;
          }
          App.reservarPara = null;
          App.navigate("mis-citas");
        })();
      }
    };
    region.addEventListener("click", region._reprogramarClick);
    region.addEventListener("change", region._reprogramarChange);
  }

  /* ---------- Historial ---------- */
  /* ---------- Historial ---------- */
  async function rHistorial() {
    var clienteId = getClienteId();

    if (!clienteId) {
      clienteId = 1;
    }

    try {
      // Obtener las citas del cliente desde el endpoint dedicado por cliente
      var dataCitas = await api.obtenerCitasPorCliente(clienteId);

      var citas = Array.isArray(dataCitas)
        ? dataCitas
        : [];

      // Normalizar: el historial muestra todas las citas del cliente
      var historial = citas;

      // Ordenar de la más reciente a la más antigua
      historial.sort(function (a, b) {
        var fechaA = new Date(a.fecha_hora);
        var fechaB = new Date(b.fecha_hora);

        return fechaB - fechaA;
      });

      var html = `
      <section class="card">

        <div class="card-header">
          <div>
            <div class="card-title">
              Historial de servicios
            </div>

            <div class="card-sub">
              ${historial.length} citas registradas
            </div>
          </div>
        </div>

        <div class="table-wrap">

          <table class="table table-responsive">

            <thead>
              <tr>
                ${[
          "Fecha",
          "Servicio",
          "Barbero",
          "Duracion",
          "Estado"
        ]
          .map(function (h) {
            return `<th>${h}</th>`;
          })
          .join("")}
              </tr>
            </thead>

            <tbody>

              ${!historial.length
          ? `
                    <tr>
                      <td colspan="5">

                        <div class="empty">

                          <div class="empty-ico">
                            <i class="fas fa-clock-rotate-left"></i>
                          </div>

                          <div class="empty-title">
                            Sin historial aun
                          </div>

                          <div class="empty-text">
                            Cuando completes tu primer servicio aparecera aqui.
                          </div>

                        </div>

                      </td>
                    </tr>
                  `
          : historial
            .map(function (c) {

              var fechaHora = new Date(
                c.fecha_hora
              );

              var fecha = !isNaN(
                fechaHora.getTime()
              )
                ? fechaHora.toLocaleDateString(
                  "es-CO",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  }
                )
                : "Fecha no disponible";

              var hora = !isNaN(
                fechaHora.getTime()
              )
                ? fechaHora.toLocaleTimeString(
                  "es-CO",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                  }
                )
                : "";

              var servicio =
                c.servicios ||
                "Servicio";

              var barbero = (
                (c.nombres_barbero || "") +
                " " +
                (c.apellidos_barbero || "")
              ).trim();

              if (!barbero) {
                barbero = "Barbero";
              }

              var duracion = Number(
                c.tiempo_total || 0
              );

              var estado = String(
                c.estado_cita ||
                c.estado ||
                "completada"
              ).toLowerCase();

              return `
                          <tr>

                            <td data-label="Fecha">
                              <span class="cell-primary">
                                ${fecha}
                                ${hora ? ` · ${hora}` : ""}
                              </span>
                            </td>

                            <td data-label="Servicio">
                              ${servicio}
                            </td>

                            <td data-label="Barbero">
                              ${barbero}
                            </td>

                            <td data-label="Duracion">
                              ${duracion > 0
                  ? duracion + " min"
                  : "-"}
                            </td>

                            <td data-label="Estado">
                              ${UI.estadoBadge(estado)}
                            </td>

                          </tr>
                        `;
            })
            .join("")
        }

            </tbody>

          </table>

        </div>

      </section>
    `;

      return html;

    } catch (err) {

      console.error(
        "Error cargando historial:",
        err
      );

      return `
      <section class="card">

        <div class="empty">

          <div class="empty-ico">
            <i class="fas fa-triangle-exclamation"></i>
          </div>

          <div class="empty-title">
            No se pudo cargar el historial
          </div>

          <div class="empty-text">
            Ocurrio un error al consultar tus servicios realizados.
          </div>

        </div>

      </section>
    `;
    }
  }
  /* ---------- Notificaciones ---------- */
  async function rNotificaciones() {
    try {
      var data = await api.obtenerCitasDetalles();
      var tipos = { cita: ["cita", "fa-calendar-check"], cambio: ["cambio", "fa-arrows-rotate"], cancel: ["cancel", "fa-xmark"], record: ["record", "fa-bell"] };
      var notificaciones = data || DB.notificaciones;
      return `
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
    } catch (err) {
      // Fallback a datos mock si la API falla
      var tipos = { cita: ["cita", "fa-calendar-check"], cambio: ["cambio", "fa-arrows-rotate"], cancel: ["cancel", "fa-xmark"], record: ["record", "fa-bell"] };
      return `
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
    }
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
  function _decodificarToken() {
    try {
      var t = sessionStorage.getItem("token");
      if (!t) return null;
      var payload = t.split(".")[1];
      var base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      var json = decodeURIComponent(Array.prototype.map.call(atob(base64), function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(""));
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  function _datosPerfilToken() {
    var sesion = JSON.parse(sessionStorage.getItem("sesion") || "null");
    var payload = _decodificarToken();
    var id = (sesion && (sesion.id_usuario || sesion.id)) || (payload && parseInt(payload.sub, 10)) || null;
    return {
      id: id,
      nombres: (sesion && sesion.nombres) || "",
      apellidos: (sesion && sesion.apellidos) || "",
      correo: (sesion && sesion.correo) || "",
      telefono: (sesion && sesion.telefono) || "",
      usuario: (sesion && sesion.usuario) || "",
      demo: !id || !sesion
    };
  }

  function _mensajeError(err) {
    if (!err) return "Ocurrio un error inesperado.";
    if (Array.isArray(err.detail)) return "Revise los datos enviados.";
    return err.message || "Ocurrio un error inesperado.";
  }

  async function rPerfilCliente() {
    var p = _datosPerfilToken();
    var clienteId = p.id || getClienteId();
    var citas = [];
    if (!p.demo) {
      try { citas = await api.obtenerCitasPorCliente(clienteId) || []; } catch (e) { citas = []; }
    }
    var total = p.demo ? 12 : citas.length;
    var completadas = p.demo ? 9 : citas.filter(function (c) {
      return String(c.estado_cita || c.estado || "").toLowerCase() === "completada";
    }).length;
    var canceladas = p.demo ? 3 : citas.filter(function (c) {
      return String(c.estado_cita || c.estado || "").toLowerCase() === "cancelada";
    }).length;
    var nombre = ((p.nombres || "") + " " + (p.apellidos || "")).trim() || "Cliente";
    var sub = p.demo ? "Cliente desde 2023" : (p.usuario ? "Usuario: " + p.usuario : "Cliente");

    var html = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
      <section class="card"><div class="card-body" style="text-align:center;">
        <span class="avatar avatar-xl" style="margin:0 auto 14px;display:grid;">${DB.getIniciales(nombre)}</span>
        <div class="font-display" style="font-size:22px;font-weight:700;">${nombre}</div>
        <div class="card-sub">${sub}</div>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:14px;">
          <button class="btn btn-sm btn-ghost"><i class="fas fa-camera"></i> Cambiar foto</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line);">
          ${[[total, "Cortes"], [completadas, "Completados"], [canceladas, "Cancelados"]].map(function (k) {
      return `<div style="text-align:center;"><div style="font-size:18px;font-weight:700;">${k[0]}</div><div class="cell-muted" style="font-size:11px;">${k[1]}</div></div>`;
    }).join("")}
        </div>
      </div></section>
      <section class="card">
        <div class="card-header"><div><div class="card-title">Datos personales</div><div class="card-sub">Informacion de tu cuenta</div></div></div>
        <div class="card-body" style="display:grid;gap:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field"><label class="field-label">Nombre <span class="req">*</span></label><input class="input" id="perf-nombres" value="${p.nombres}"></div>
            <div class="field"><label class="field-label">Apellido <span class="req">*</span></label><input class="input" id="perf-apellidos" value="${p.apellidos}"></div>
          </div>
          <div class="field"><label class="field-label">Correo electronico <span class="req">*</span></label><input class="input" type="email" id="perf-correo" value="${p.correo}"></div>
          <div class="field"><label class="field-label">Telefono <span class="req">*</span></label><input class="input" type="tel" id="perf-telefono" value="${p.telefono}"></div>
        </div>
        <div class="card-footer" style="display:flex;justify-content:flex-end;gap:10px;">
          <button class="btn btn-ghost" id="cancelar-perfil">Cancelar</button>
          <button class="btn btn-primary" id="guardar-perfil"><i class="fas fa-floppy-disk"></i> Guardar cambios</button>
        </div>
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

  function bindPerfil() {
    var region = App.el("view-region");
    if (!region) return;

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

    var cancelar = region.querySelector("#cancelar-perfil");
    if (cancelar) cancelar.addEventListener("click", function () { App.navigate("perfil"); });

    var guardar = region.querySelector("#guardar-perfil");
    if (guardar) guardar.addEventListener("click", async function () {
      var nombres = (region.querySelector("#perf-nombres") || {}).value || "";
      var apellidos = (region.querySelector("#perf-apellidos") || {}).value || "";
      var correo = (region.querySelector("#perf-correo") || {}).value || "";
      var telefono = (region.querySelector("#perf-telefono") || {}).value || "";
      if (!nombres || !apellidos || !correo) {
        UI.toast("Campos incompletos", "Nombre, apellido y correo son obligatorios.", "error");
        return;
      }
      var p = _datosPerfilToken();
      if (p.demo) {
        UI.toast("Modo demo", "Inicia sesion para guardar tus datos.", "info");
        return;
      }
      try {
        await api.actualizarUsuario(p.id, { nombres: nombres, apellidos: apellidos, correo: correo, telefono: telefono });
        var sesion = JSON.parse(sessionStorage.getItem("sesion") || "null");
        if (sesion) {
          sesion.nombres = nombres;
          sesion.apellidos = apellidos;
          sesion.correo = correo;
          sesion.telefono = telefono;
          sessionStorage.setItem("sesion", JSON.stringify(sesion));
        }
        UI.toast("Perfil actualizado", "Tus datos fueron guardados correctamente.", "success");
      } catch (err) {
        console.error("Error guardando perfil:", err);
        UI.toast("Error", _mensajeError(err) || "No se pudo actualizar el perfil.", "error");
      }
    });

    var pass = region.querySelector("#guardar-pass");
    if (pass) pass.addEventListener("click", async function () {
      var actual = (region.querySelector("#perf-pass-actual") || {}).value || "";
      var nueva = (region.querySelector("#perf-pass-nueva") || {}).value || "";
      var confirmar = (region.querySelector("#perf-pass-confirmar") || {}).value || "";
      if (nueva.length < 6) {
        UI.toast("Contrasena corta", "La nueva contrasena debe tener al menos 6 caracteres.", "error");
        return;
      }
      if (nueva !== confirmar) {
        UI.toast("No coinciden", "La confirmacion no coincide con la nueva contrasena.", "error");
        return;
      }
      var p = _datosPerfilToken();
      if (p.demo) {
        UI.toast("Modo demo", "Inicia sesion para cambiar tu contrasena.", "info");
        return;
      }
      try {
        await api.cambiarContrasena(actual, nueva);
        region.querySelectorAll("#perf-pass-actual, #perf-pass-nueva, #perf-pass-confirmar").forEach(function (i) { i.value = ""; });
        UI.toast("Contrasena actualizada", "Tu contrasena fue cambiada con exito.", "success");
      } catch (err) {
        console.error("Error cambiando contrasena:", err);
        UI.toast("Error", _mensajeError(err) || "No se pudo cambiar la contrasena.", "error");
      }
    });
  }

  /* ---------- Registro de vistas ---------- */
  App.registerVista("cliente", "dashboard", renderDashboardWrapper, bindDashboard);
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

})();

