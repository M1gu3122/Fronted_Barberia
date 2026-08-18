/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Reportes
   ============================================================ */
(function () {
  "use strict";

  var filtroReporte = "semana";

  function rReportes() {
    var d = DB;

    var rango = filtroReporte === "dia" ? 1 : (filtroReporte === "semana" ? 7 : 30);
    var enRango = d.citas.filter(function (c) {
      var f = new Date(c.fecha + "T00:00:00");
      var lim = new Date(); lim.setDate(lim.getDate() - rango);
      return f >= lim;
    });
    var complet = enRango.filter(function (c) { return c.estado === "completada"; });
    var canc = enRango.filter(function (c) { return c.estado === "cancelada"; });
    var ingreso = complet.reduce(function (a, c) { return a + d.servicio(c.servicio).precio; }, 0);

    var kpis = [
      [enRango.length, "Citas en el periodo", "fa-calendar-day", "var(--st-atencion-bg)", "var(--st-atencion)"],
      [complet.length, "Completadas", "fa-circle-check", "var(--st-completada-bg)", "var(--st-completada)"],
      [canc.length, "Canceladas", "fa-xmark", "var(--st-cancelada-bg)", "var(--st-cancelada)"],
      [d.formatPrecio(ingreso), "Ingresos estimados", "fa-sack-dollar", "var(--bone)", "var(--brass-dim)"]
    ];

    var diasSemana = [];
    for (var i = 6; i >= 0; i--) {
      var f = d.iso(-i);
      diasSemana.push({ fecha: f, n: d.citas.filter(function (c) { return c.fecha === f && c.estado !== "cancelada"; }).length });
    }
    var maxD = Math.max.apply(null, diasSemana.map(function (x) { return x.n; })) || 1;

    var conteoB = {};
    enRango.forEach(function (c) {
      if (c.estado === "cancelada") return;
      conteoB[c.barbero] = (conteoB[c.barbero] || 0) + 1;
    });
    var topB = Object.keys(conteoB).map(function (k) { return { id: +k, n: conteoB[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
    var maxB = topB[0] ? topB[0].n : 1;

    var conteoC = {};
    enRango.forEach(function (c) {
      if (c.estado === "cancelada") return;
      conteoC[c.cliente] = (conteoC[c.cliente] || 0) + 1;
    });
    var topC = Object.keys(conteoC).map(function (k) { return { id: +k, n: conteoC[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 5);

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
          <div class="card-header"><div><div class="card-title">Citas por dia</div><div class="card-sub">Ultimos 7 dias</div></div></div>
          <div class="card-body"><div class="bar-chart" id="chart-dias">
            ${diasSemana.map(function (dd) {
              var pct = Math.round((dd.n / maxD) * 100);
              var lbl = new Date(dd.fecha + "T00:00:00").toLocaleDateString("es-CO", { weekday: "short" }).slice(0, 2);
              return `
                <div class="bar-col"><div class="bar-track" style="height:0;" data-alto="${pct}"><span class="bar-val">${dd.n}</span></div>
                  <div class="bar-label">${lbl}</div></div>`;
            }).join("")}
          </div></div>
        </section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Barberos con mas citas</div><div class="card-sub">Todo el periodo</div></div></div>
          <div class="card-body">
            ${topB.map(function (t) {
              var bb = d.barbero(t.id);
              var pct = Math.round((t.n / maxB) * 100);
              return `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                  ${UI.avatar(bb.nombre, "avatar-sm")}
                  <div style="flex:1;"><div style="font-size:13px;font-weight:600;margin-bottom:4px;">${bb.nombre}</div>
                  <div style="height:7px;background:var(--bone);border-radius:999px;overflow:hidden;"><div class="barra" data-w="${pct}" style="height:100%;width:0;background:linear-gradient(90deg,var(--brass-light),var(--brass));border-radius:999px;"></div></div></div>
                  <span style="font-weight:700;font-size:13px;">${t.n}</span>
                </div>`;
            }).join("")}
          </div>
        </section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Clientes frecuentes</div><div class="card-sub">Top visitas</div></div></div>
          <div class="card-body">
            ${topC.map(function (t, idx) {
              var cl = d.cliente(t.id);
              return `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);">
                  <span style="font-weight:700;color:var(--brass-dim);width:18px;">${idx + 1}</span>
                  ${UI.avatar(cl.nombre, "avatar-sm")}
                  <div style="flex:1;font-weight:600;font-size:13.5px;">${cl.nombre}</div>
                  <span class="badge badge-brass badge-dotless">${t.n} visitas</span>
                </div>`;
            }).join("")}
          </div>
        </section>
      </div>`;
    return html;
  }

  function bindReportes() {
    var region = App.el("view-region");
    if (!region) return;
    if (region._reportesClick) region.removeEventListener("click", region._reportesClick);
    region._reportesClick = function (e) {
      var btn = e.target.closest("[data-reporte]");
      if (btn) {
        filtroReporte = btn.getAttribute("data-reporte");
        App.navigate("reportes");
      }
    };
    region.addEventListener("click", region._reportesClick);
  }

  /* Registro de vistas */
  App.registerVista("admin", "reportes", rReportes, bindReportes);
})();