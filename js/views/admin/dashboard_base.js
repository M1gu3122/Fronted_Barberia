/* ============================================================
   Barberia El Corte Perfecto - Vistas del Administrador - Dashboard
   Conectado a API real
   ============================================================ */
(function () {
  "use strict";

  // Estado local para datos del dashboard
  var _dashboardData = {
    kpis: {},
    estados: {},
    proximasCitas: [],
    citasPorDia: [],
    topServicios: [],
    barberosRendimiento: [],
    ingresosComparativo: {},
    cancelaciones: {},
    clientesNuevos: {}
  };

  // Cargar todos los datos del dashboard
  async function cargarDashboardData() {
    try {
      var today = DB.iso(0);
      var mesActual = today.substr(0, 7); // YYYY-MM

      // Cargar en paralelo
      var [
        summary,
        proximasCitas,
        citasPorDia,
        topServicios,
        barberosRendimiento,
        ingresosComparativo,
        cancelaciones,
        clientesNuevos
      ] = await Promise.all([
        api.getDashboardSummary(DB.iso(0)),
        console.log("DEBUG: getProximasCitas called"), api.getProximasCitas(),
        api.getCitasPorDia(30),
        api.getTopServicios(),
        api.getBarberosRendimiento(),
        api.getIngresosComparativo(),
        api.getCancelaciones(),
        api.getClientesNuevos()
      ]);

      console.log("DEBUG: summary", summary);
      console.log("DEBUG: proximasCitas", proximasCitas);
      console.log("DEBUG: citasPorDia", citasPorDia);
      console.log("DEBUG: topServicios", topServicios);
      console.log("DEBUG: barberosRendimiento", barberosRendimiento);
      console.log("DEBUG: ingresosComparativo", ingresosComparativo);
      console.log("DEBUG: cancelaciones", cancelaciones);
      console.log("DEBUG: clientesNuevos", clientesNuevos);

      _dashboardData.kpis = summary?.kpis || {};
      _dashboardData.estados = summary?.estados_hoy || {};
      // Transform API response to match template expectations
      // getProximasCitas puede retornar undefined si endpoint no estÃ¡ implementado
      var proximasCitasArray = (proximasCitas && Array.isArray(proximasCitas)) ? proximasCitas : (proximasCitas?.citas || []);
      console.log("DEBUG: proximasCitasArray raw - length:", proximasCitasArray.length, "firstItem:", proximasCitasArray[0]);
      if (proximasCitasArray.length === 0) {
        console.log("DEBUG: No hay items en proximasCitasArray - revisar si endpoint retorna datos correctos");
      }
      _dashboardData.proximasCitas = proximasCitasArray.map(function (c) {
        var fechaHora = new Date(c.fecha_hora);
        var hora = fechaHora.toTimeString().slice(0, 5); // HH:MM
        var estado = (c.estado_cita || "").toLowerCase();
        console.log("DEBUG: transforming cita", c.id_cita, "->", {hora, estado, nombres: c.nombres});
        return {
          ...c,
          hora: hora,
          estado: estado,
          estado_cita: estado,
          nombres: c.nombres || "Cliente",
          apellidos: c.apellidos || "",
          servicios: [{ nombre: c.servicios?.[0]?.nombre || "Servicio" }],
          barbero: { nombre: c.barbero?.nombre || "Barbero" }
        };
      });
      console.log("DEBUG: _dashboardData.proximasCitas transformed", _dashboardData.proximasCitas);
      console.log("DEBUG: proximasCitas length", _dashboardData.proximasCitas.length);
      _dashboardData.citasPorDia = citasPorDia?.datos || [];
      console.log("DEBUG: _dashboardData.citasPorDia", _dashboardData.citasPorDia);
      _dashboardData.topServicios = topServicios?.servicios || [];
      _dashboardData.barberosRendimiento = barberosRendimiento?.barberos || [];
      _dashboardData.ingresosComparativo = ingresosComparativo || {};
      _dashboardData.cancelaciones = cancelaciones || {};
      _dashboardData.clientesNuevos = clientesNuevos || {};

      console.log("DEBUG: final _dashboardData", _dashboardData);

      return true;
    } catch (err) {
      console.error("Error cargando dashboard:", err);
      UI.toast("Error", "No se pudo cargar el dashboard: " + err.message, "error");
      return false;
    }
  }

  function rDashboardAdmin() {
    var d = DB;
    var k = _dashboardData.kpis || {};
    var e = _dashboardData.estados || {};
    var proximas = _dashboardData.proximasCitas || [];
    var top = _dashboardData.topServicios || [];
    var barberos = _dashboardData.barberosRendimiento || [];
    var ic = _dashboardData.ingresosComparativo || {};
    var cancel = _dashboardData.cancelaciones || {};
    var cn = _dashboardData.clientesNuevos || {};

    // KPIs

    // KPIs
    var kpis = [
      [k.citas_hoy || 0, "Citas de hoy", "fa-calendar-day", "var(--st-atencion-bg)", "var(--st-atencion)"],
      [k.citas_pendientes || 0, "Citas pendientes", "fa-clock", "var(--st-pendiente-bg)", "var(--st-pendiente)"],
      [k.citas_completadas || 0, "Completadas hoy", "fa-circle-check", "var(--st-completada-bg)", "var(--st-completada)"],
      [k.ingresos_hoy || 0, "Ingresos hoy (COP)", "fa-coins", "var(--st-completada-bg)", "var(--st-completada)"],
      [k.barberos_activos || 0, "Barberos activos", "fa-user-tie", "var(--bone)", "var(--brass-dim)"],
      [k.clientes_totales || 0, "Clientes registrados", "fa-users", "var(--bone)", "var(--brass-dim)"]
    ];

    // Donut estados
    var donut = donutChart([
      ["Confirmadas", e.confirmada || 0, "#0E7A5F"],
      ["Pendientes", e.pendiente || 0, "#B45309"],
      ["En Atencion", e.en_atencion || 0, "#1D6FA8"],
      ["Completadas", e.completada || 0, "#2E7D32"],
      ["Canceladas", e.cancelada || 0, "#C0392B"]
    ]);

    // Top servicios (calcular max para barras)
    var max = top.length ? Math.max(...top.map(function(t) { return t.total_citas; })) : 1;

    // Ingresos comparativo
    var icActual = ic.mes_actual || {};
    var icAnterior = ic.mes_anterior || {};
    var icVar = ic.variacion || {};

    // Cancelaciones
    var cancelRate = cancel.tasa_cancelacion || 0;

    // Barbero del mes (top 1)
    var topBarbero = barberos[0] || {};

    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:14px;">
        ${kpis.map(function (k) {
          var val = typeof k[0] === "number" && k[1] === "Ingresos hoy (COP)" ? d.formatPrecio(k[0]) : k[0];
          return `
            <section class="card kpi">
              <div class="kpi-top">
                <span class="kpi-ico" style="background:${k[3]};color:${k[4]};"><i class="fas ${k[2]}"></i></span>
                <span class="kpi-label">${k[1]}</span>
              </div>
              <div class="kpi-value">${val}</div>
            </section>`;
        }).join("")}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;">
        
        <!-- Agenda de hoy -->
        <section class="card">
          <div class="card-header">
            <div><div class="card-title">Agenda de hoy</div><div class="card-sub">${d.formatFechaLarga(d.iso(0))}</div></div>
            <button class="btn btn-sm btn-ghost" style="margin-left:auto;" onclick="App.navigate('citas')">Ver todas</button>
          </div>
          <div style="padding:12px;display:grid;gap:8px;">
            ${_dashboardData.proximasCitas.slice(0, 5).map(function (c) {
              return `
                <div class="appt-tile ${c.estado}">
                  <div class="appt-time">${c.hora}</div>
                  <div class="appt-main">
                    <div class="appt-title">${c.nombres || "Cliente"}</div>
                    <div class="appt-sub">${c.servicios.nombre || "Servicio"} Â· ${c.barbero?.nombre || "Barbero"}</div>
                  </div>
                  ${UI.estadoBadge(c.estado)}
                </div>`;
            }).join("") || '<div class="cell-muted" style="text-align:center;padding:20px;">Sin citas programadas</div>'}
          </div>
        </section>

        <!-- DistribuciÃ³n estados -->
        <section class="card">
          <div class="card-header"><div><div class="card-title">Distribucion de estados</div><div class="card-sub">Citas de hoy</div></div></div>
          <div class="card-body"><div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;justify-content:center;">
            ${donut.html}
            <div class="legend">${donut.leyenda}</div>
          </div></div>
        </section>

        <!-- Top servicios -->
        <section class="card">
          <div class="card-header"><div><div class="card-title">Servicios mas solicitados</div><div class="card-sub">Este mes</div></div></div>
          <div class="card-body">
            ${top.map(function (t) {
              var pct = Math.round((t.total_citas / (top[0]?.total_citas || 1)) * 100);
              return `
                <div style="margin-bottom:14px;">
                  <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:6px;">
                    <span>${t.nombre}</span><span class="text-brass">${t.total_citas} reservas</span>
                  </div>
                  <div style="height:8px;background:var(--bone);border-radius:999px;overflow:hidden;">
                    <div class="barra" data-w="${pct}" style="height:100%;width:0;background:linear-gradient(90deg,var(--brass-light),var(--brass));border-radius:999px;"></div>
                  </div>
                </div>`;
            }).join("") || '<div class="cell-muted" style="text-align:center;padding:20px;">Sin datos</div>'}
          </div>
        </section>

        <!-- Ingresos comparativo -->
        <section class="card">
          <div class="card-header"><div><div class="card-title">Ingresos: mes actual vs anterior</div><div class="card-sub">${icActual.mes || ""} vs ${icAnterior.mes || ""}</div></div></div>
          <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="kpi" style="background:var(--st-completada-bg);border:1px solid #c8e4ca;">
              <div class="kpi-top"><span class="kpi-ico" style="background:var(--st-completada);"><i class="fas fa-coins"></i></span><span class="kpi-label">Mes actual</span></div>
              <div class="kpi-value">${icActual.ingresos_totales ? d.formatPrecio(icActual.ingresos_totales) : "$0"}</div>
              <div style="font-size:12px;color:var(--smoke);margin-top:8px;">${icActual.citas_completadas || 0} citas Â· Ticket: ${icActual.ticket_promedio ? d.formatPrecio(icActual.ticket_promedio) : "$0"}</div>
            </div>
            <div class="kpi" style="background:var(--st-atencion-bg);border:1px solid #f4d9b4;">
              <div class="kpi-top"><span class="kpi-ico" style="background:var(--st-atencion);"><i class="fas fa-chart-line"></i></span><span class="kpi-label">VariaciÃ³n</span></div>
              <div class="kpi-value" style="color:${(icVar.ingresos_pct || 0) >= 0 ? "var(--st-completada)" : "var(--st-cancelada)"};">${(icVar.ingresos_pct || 0) >= 0 ? "+" : ""}${icVar.ingresos_pct || 0}%</div>
              <div style="font-size:12px;color:var(--smoke);margin-top:8px;">Citas: ${icVar.citas_pct || 0}% Â· Ticket: ${icVar.ticket_pct || 0}%</div>
            </div>
          </div>
        </section>

        <!-- Rendimiento barberos -->
        <section class="card">
          <div class="card-header"><div><div class="card-title">Rendimiento barberos</div><div class="card-sub">Este mes</div></div></div>
          <div class="card-body">
            <div style="overflow-x:auto;">
              <table class="table">
                <thead><tr><th>Barbero</th><th>Citas</th><th>Completadas</th><th>Canceladas</th><th>Ingresos</th><th>OcupaciÃ³n</th></tr></thead>
                <tbody>
                  ${_dashboardData.barberosRendimiento.map(function (b) {
                    return `<tr>
                      <td data-label="Barbero"><div style="font-weight:600;">${b.nombre}</div></td>
                      <td data-label="Citas">${b.total_citas}</td>
                      <td data-label="Completadas"><span class="badge badge-completada">${b.completadas}</span></td>
                      <td data-label="Canceladas">${b.canceladas}</td>
                      <td data-label="Ingresos">${b.ingresos ? d.formatPrecio(b.ingresos) : "$0"}</td>
                      <td data-label="OcupaciÃ³n"><div class="barra" data-w="${Math.min(b.ocupacion_promedio || 0, 100)}" style="height:8px;width:0;background:linear-gradient(90deg,var(--brass-light),var(--brass));border-radius:999px;"></div><span style="font-size:11px;color:var(--smoke);">${b.ocupacion_promedio || 0}%</span></td>
                    </tr>`;
                  }).join("") || '<tr><td colspan="6" class="cell-muted" style="text-align:center;padding:20px;">Sin datos</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Cancelaciones -->
        <section class="card">
          <div class="card-header"><div><div class="card-title">Cancelaciones</div><div class="card-sub">Tasa</div></div></div>
          <div class="card-body" style="display:flex; justify-content:center;">
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
              <div class="kpi" style="background:var(--st-cancelada-bg);border:1px solid #f0cdc9;">
                <div class="kpi-top"><span class="kpi-ico" style="background:var(--st-cancelada);"><i class="fas fa-ban"></i></span><span class="kpi-label">Tasa cancelaciÃ³n</span></div>
                <div class="kpi-value" style="color:var(--st-cancelada);">${cancel.tasa_cancelacion || 0}%</div>
              </div>
      
            </div>

          </div>
        </section>
      </div>`;
    return html;
  }

  function donutChart(datos) {
    var total = datos.reduce(function (a, b) { return a + b[1]; }, 0) || 1;
    var acc = 0;
    var grad = datos.filter(function (d) { return d[1] > 0; }).map(function (d) {
      var pct = (d[1] / total) * 360;
      var seg = acc + "deg " + (acc + pct) + "deg";
      acc += pct;
      return d[2] + " " + seg;
    }).join(", ");
    var html = `
      <div class="donut" style="background:conic-gradient(${grad || "#E2DCD0 0 360deg"});">
        <div class="donut-center">
          <div style="font-size:22px;font-weight:700;">${total}</div>
          <div class="cell-muted" style="font-size:11px;">citas</div>
        </div>
      </div>`;
    var leyenda = datos.map(function (d) {
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${d[2]};"></span><span>${d[0]}</span>
          <span class="legend-val">${d[1]}</span>
        </div>`;
    }).join("");
    return { html: html, leyenda: leyenda };
  }

  function bindBarras() {
    var region = App.el("view-region");
    if (!region) return;

    // Animar barras de top servicios
    setTimeout(function () {
      if (window.gsap) {
        gsap.to(region.querySelectorAll(".barra"), {
          width: function () { return this.dataset.w + "%"; },
          duration: 0.8, ease: "power2.out", stagger: 0.06
        });
      }
    }, 60);
  }

  // Registro de vista con carga asÃ­ncrona
  async function initDashboard() {
    var ok = await cargarDashboardData();
    if (!ok) return;

    // Re-renderizar la vista con datos cargados
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = rDashboardAdmin();
      bindBarras();
    }
  }

  // Wrapper para registro en App
  var renderWrapper = function() {
    // Mostrar skeleton mientras carga
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:14px;">
          ${[1,2,3,4,5,6].map(function() { return '<section class="card kpi skeleton" style="height:100px;"></section>'; }).join("")}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;">
          ${[1,2,3,4,4].map(function() { return '<section class="card skeleton" style="height:300px;"></section>'; }).join("")}
        </div>
      `;
    }
    initDashboard();
  };

  var bindWrapper = function() {
    // bindBarras se llama dentro de initDashboard tras renderizar
  };

  App.registerVista("admin", "dashboard", renderWrapper, bindWrapper);
})();
