/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Reportes
   Implementado con API real (resumen/barberos/citas-por-dia)
   ============================================================ */
(function () {
  "use strict";

  var filtroReporte = "semana";

  var _reporteData = {
    kpis: { total: 0, completadas: 0, canceladas: 0, ingresos: 0 },
    citasDia: [],
    barberos: [],
    clientes: []
  };

  /* Semana ISO actual: { anio, semana } */
  function semanaISO(d) {
    var date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = date.getDay() || 7;
    date.setDate(date.getDate() + 4 - day);
    var yearStart = new Date(date.getFullYear(), 0, 1);
    return {
      anio: date.getFullYear(),
      semana: Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
    };
  }

  async function cargarReporteData() {
    try {
      var hoy = DB.iso(0);
      var iso = semanaISO(new Date());
      var anyoActual = new Date().getFullYear();
      var mesActual = new Date().getMonth() + 1;
      var dias = filtroReporte === "mes" ? 30 : 7;

      var resumen, barberos;
      if (filtroReporte === "dia") {
        resumen = await api.getResumenPorDia(hoy);
        barberos = await api.getBarberosPorDia(hoy);
      } else if (filtroReporte === "semana") {
        resumen = await api.getResumenPorSemana(iso.anio, iso.semana);
        barberos = await api.getBarberosPorSemana(iso.anio, iso.semana);
      } else {
        resumen = await api.getResumenPorMes(anyoActual, mesActual);
        barberos = await api.getBarberosPorMes(anyoActual, mesActual);
      }

      var citasDia = await api.getCitasPorDia(dias);
      var clientes = await api.getUsuariosPanelAdmin().catch(function () { return []; });

      var r = (resumen && resumen.datos && resumen.datos[0]) || {};
      _reporteData.kpis = {
        total: r.total_citas || 0,
        completadas: r.citas_completadas || 0,
        canceladas: r.citas_canceladas || 0,
        ingresos: r.ingresos_estimados || 0
      };

      _reporteData.citasDia = (citasDia && citasDia.datos) || [];
      _reporteData.barberos = (barberos && barberos.datos) || [];

      _reporteData.clientes = (clientes || [])
        .filter(function (u) { return u && (u.cantidad_citas || 0) > 0; })
        .map(function (u) {
          return {
            nombre: ((u.nombres || "") + " " + (u.apellidos || "")).trim() || "Cliente",
            visitas: u.cantidad_citas || 0
          };
        })
        .sort(function (a, b) { return b.visitas - a.visitas; })
        .slice(0, 5);

      return true;
    } catch (err) {
      console.error("Error cargando reportes:", err);
      UI.toast("Error", "No se pudo cargar los reportes: " + err.message, "error");
      return false;
    }
  }

  function rReportes() {
    var d = DB;
    var k = _reporteData.kpis;

    var kpis = [
      [k.total, "Citas en el periodo", "fa-calendar-day", "var(--st-atencion-bg)", "var(--st-atencion)"],
      [k.completadas, "Completadas", "fa-circle-check", "var(--st-completada-bg)", "var(--st-completada)"],
      [k.canceladas, "Canceladas", "fa-xmark", "var(--st-cancelada-bg)", "var(--st-cancelada)"],
      [d.formatPrecio(k.ingresos), "Ingresos estimados", "fa-sack-dollar", "var(--bone)", "var(--brass-dim)"]
    ];

    // Grafico de citas por dia (ultimos N dias segun periodo)
    var diasSemana = _reporteData.citasDia;
    var maxD = Math.max.apply(null, diasSemana.map(function (x) { return x.total; })) || 1;

    // Barberos con mas citas (top 5)
    var topB = _reporteData.barberos.slice(0, 5);
    var maxB = topB[0] ? topB[0].total_citas : 1;

    // Clientes frecuentes
    var topC = _reporteData.clientes;

    var tituloBarras = filtroReporte === "mes" ? "Ultimos 30 dias" : "Ultimos 7 dias";
    var etiquetaPeriodo = filtroReporte === "dia" ? "Hoy" : (filtroReporte === "semana" ? "Semana actual" : "Mes actual");

    // En vista mes se usan los numeros de dia (1..31) como etiqueta; en dia/semana, el dia de la semana
    var esMes = filtroReporte === "mes";
    var hoy = d.iso(0);

    var html = `
      <section class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:12px;">
          <div><div class="card-title">Reportes y estadisticas</div><div class="card-sub">Rendimiento del negocio</div></div>
          <div style="margin-left:auto;display:flex;gap:6px;">
            ${["dia", "semana", "mes"].map(function (p) {
              return `<button class="btn btn-sm ${filtroReporte === p ? "btn-dark" : "btn-ghost"}" data-reporte="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</button>`;
            }).join("")}
          </div>
        </div>
        <div style="padding:18px 20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;">
          ${kpis.map(function (k) {
            return `
              <div class="kpi" style="border:1px solid var(--line);border-radius:10px;">
                <div class="kpi-top"><span class="kpi-ico" style="background:${k[3]};color:${k[4]};"><i class="fas ${k[2]}"></i></span><span class="kpi-label">${k[1]}</span></div>
                <div class="kpi-value" style="font-size:22px;">${k[0]}</div>
              </div>`;
          }).join("")}
        </div>
      </section>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;margin-top:16px;">
        <section class="card">
          <div class="card-header"><div><div class="card-title">Citas por dia</div><div class="card-sub">${tituloBarras} - ${etiquetaPeriodo}</div></div></div>
          <div class="card-body"><div class="bar-chart" ${esMes ? 'style="overflow-x:auto;"' : ""} id="chart-dias">
            ${diasSemana.map(function (dd) {
              var pct = dd.total > 0 ? Math.max(8, Math.round((dd.total / maxD) * 100)) : 3;
              var dObj = new Date(dd.fecha + "T00:00:00");
              var lbl = esMes
                ? dObj.getDate()
                : dObj.toLocaleDateString("es-CO", { weekday: "short" }).slice(0, 2);
              var esHoy = dd.fecha === hoy;
              var clase = "bar-track" + (esHoy ? " hoy" : "");
              return `
                <div class="bar-col"><div class="${clase}" style="height:${pct}%;" data-alto="${pct}"${esHoy ? ' data-hoy="1"' : ""}><span class="bar-val">${dd.total}</span></div>
                  <div class="bar-label">${lbl}</div></div>`;
            }).join("") || '<div class="cell-muted" style="text-align:center;padding:20px;">Sin datos</div>'}
          </div></div>
        </section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Barberos con mas citas</div><div class="card-sub">${etiquetaPeriodo}</div></div></div>
          <div class="card-body">
            ${topB.map(function (t) {
              var pct = Math.round((t.total_citas / maxB) * 100);
              return `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                  ${UI.avatar(t.barbero || "Barbero", "avatar-sm")}
                  <div style="flex:1;"><div style="font-size:13px;font-weight:600;margin-bottom:4px;">${t.barbero || "Barbero"}</div>
                  <div style="height:7px;background:var(--bone);border-radius:999px;overflow:hidden;"><div class="barra" data-w="${pct}" style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--brass-light),var(--brass));border-radius:999px;"></div></div></div>
                  <span style="font-weight:700;font-size:13px;">${t.total_citas}</span>
                </div>`;
            }).join("") || '<div class="cell-muted" style="text-align:center;padding:20px;">Sin datos</div>'}
          </div>
        </section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Clientes frecuentes</div><div class="card-sub">Top visitas</div></div></div>
          <div class="card-body">
            ${topC.map(function (t, idx) {
              return `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);">
                  <span style="font-weight:700;color:var(--brass-dim);width:18px;">${idx + 1}</span>
                  ${UI.avatar(t.nombre, "avatar-sm")}
                  <div style="flex:1;font-weight:600;font-size:13.5px;">${t.nombre}</div>
                  <span class="badge badge-brass badge-dotless">${t.visitas} visitas</span>
                </div>`;
            }).join("") || '<div class="cell-muted" style="text-align:center;padding:20px;">Sin datos</div>'}
          </div>
        </section>
      </div>`;
    return html;
  }

  function bindBarras() {
    var region = App.el("view-region");
    if (!region) return;
    setTimeout(function () {
      if (window.gsap) {
        gsap.fromTo(region.querySelectorAll(".bar-track"),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.04 });
        gsap.fromTo(region.querySelectorAll(".barra"),
          { width: "0%" },
          { width: function (i, target) { return target.dataset.w + "%"; },
            duration: 0.8, ease: "power2.out", stagger: 0.06 });
      }
    }, 60);
  }

  function bindReportes() {
    var region = App.el("view-region");
    if (!region) return;
    if (region._reportesClick) region.removeEventListener("click", region._reportesClick);
    region._reportesClick = function (e) {
      var btn = e.target.closest("[data-reporte]");
      if (btn) {
        filtroReporte = btn.getAttribute("data-reporte");
        initReportes();
      }
    };
    region.addEventListener("click", region._reportesClick);
  }

  async function initReportes() {
    var region = App.el("view-region");
    var ok = await cargarReporteData();
    if (!ok) return;
    if (region) {
      region.innerHTML = rReportes();
      bindBarras();
    }
  }

  var renderWrapper = function () {
    var region = App.el("view-region");
    if (region) {
      region.innerHTML = `
        <section class="card skeleton" style="height:120px;"></section>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;margin-top:16px;">
          ${[1, 2, 3].map(function () { return '<section class="card skeleton" style="height:280px;"></section>'; }).join("")}
        </div>
      `;
    }
    initReportes();
  };

  /* Registro de vistas */
  App.registerVista("admin", "reportes", renderWrapper, bindReportes);
})();