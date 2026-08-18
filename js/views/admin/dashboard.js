/* ============================================================
   Barberia El Corte Perfecto - Vistas del Administrador - Dashboard
   ============================================================ */
(function () {
  "use strict";

  function rDashboardAdmin() {
    var d = DB;
    var hoy = d.citasDe({ fecha: d.iso(0) }).filter(function (c) { return c.estado !== "cancelada"; });
    var completadas = hoy.filter(function (c) { return c.estado === "completada"; }).length;
    var pendientes = hoy.filter(function (c) { return c.estado === "pendiente" || c.estado === "confirmada"; }).length;
    var activos = d.barberos.filter(function (b) { return b.activo; }).length;
    var clientesActivos = d.clientes.filter(function (c) { return c.estado === "activo"; }).length;

    var kpis = [
      [hoy.length, "Citas de hoy", "fa-calendar-day", "var(--st-atencion-bg)", "var(--st-atencion)"],
      [pendientes, "Citas pendientes", "fa-clock", "var(--st-pendiente-bg)", "var(--st-pendiente)"],
      [completadas, "Completadas hoy", "fa-circle-check", "var(--st-completada-bg)", "var(--st-completada)"],
      [clientesActivos, "Clientes registrados", "fa-users", "var(--bone)", "var(--brass-dim)"],
      [activos, "Barberos activos", "fa-user-tie", "var(--bone)", "var(--brass-dim)"]
    ];

    var donut = donutChart([
      ["Confirmadas", hoy.filter(function (c) { return c.estado === "confirmada"; }).length, "#0E7A5F"],
      ["Pendientes", hoy.filter(function (c) { return c.estado === "pendiente"; }).length, "#B45309"],
      ["En atencion", hoy.filter(function (c) { return c.estado === "atencion"; }).length, "#1D6FA8"],
      ["Completadas", completadas, "#2E7D32"],
      ["Canceladas", d.citasDe({ fecha: d.iso(0) }).filter(function (c) { return c.estado === "cancelada"; }).length, "#C0392B"]
    ]);

    var conteo = {};
    d.citas.forEach(function (c) {
      if (c.estado === "cancelada") return;
      conteo[c.servicio] = (conteo[c.servicio] || 0) + 1;
    });
    var top = Object.keys(conteo).map(function (k) { return { id: +k, n: conteo[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
    var max = top[0] ? top[0].n : 1;

    var html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:14px;">
        ${kpis.map(function (k) {
          return `
            <section class="card kpi">
              <div class="kpi-top">
                <span class="kpi-ico" style="background:${k[3]};color:${k[4]};"><i class="fas ${k[2]}"></i></span>
                <span class="kpi-label">${k[1]}</span>
              </div>
              <div class="kpi-value">${k[0]}</div>
            </section>`;
        }).join("")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;">
        <section class="card">
          <div class="card-header">
            <div><div class="card-title">Agenda de hoy</div><div class="card-sub">${d.formatFechaLarga(d.iso(0))}</div></div>
            <button class="btn btn-sm btn-ghost" style="margin-left:auto;" onclick="App.navigate('citas')">Ver todas</button>
          </div>
          <div style="padding:12px;display:grid;gap:8px;">
            ${hoy.slice(0, 5).map(function (c) {
              var cl = d.cliente(c.cliente), s = d.servicio(c.servicio), b = d.barbero(c.barbero);
              return `
                <div class="appt-tile ${c.estado}">
                  <div class="appt-time">${c.hora}</div>
                  <div class="appt-main">
                    <div class="appt-title">${cl.nombre}</div>
                    <div class="appt-sub">${s.nombre} · ${b.nombre}</div>
                  </div>
                  ${UI.estadoBadge(c.estado)}
                </div>`;
            }).join("")}
          </div>
        </section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Distribucion de estados</div><div class="card-sub">Citas de hoy</div></div></div>
          <div class="card-body"><div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;justify-content:center;">
            ${donut.html}
            <div class="legend">${donut.leyenda}</div>
          </div></div>
        </section>
        <section class="card">
          <div class="card-header"><div><div class="card-title">Servicios mas solicitados</div><div class="card-sub">Este mes</div></div></div>
          <div class="card-body">
            ${top.map(function (t) {
              var s = d.servicio(t.id);
              var pct = Math.round((t.n / max) * 100);
              return `
                <div style="margin-bottom:14px;">
                  <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:6px;">
                    <span>${s.nombre}</span><span class="text-brass">${t.n} reservas</span>
                  </div>
                  <div style="height:8px;background:var(--bone);border-radius:999px;overflow:hidden;">
                    <div class="barra" data-w="${pct}" style="height:100%;width:0;background:linear-gradient(90deg,var(--brass-light),var(--brass));border-radius:999px;"></div>
                  </div>
                </div>`;
            }).join("")}
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

  /* Registro de vistas */
  App.registerVista("admin", "dashboard", rDashboardAdmin, bindBarras);
})();