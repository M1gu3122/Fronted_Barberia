/* ============================================================
   Barberia El Corte Perfecto — Shell, router e interacciones
   Navegacion por rol, hash routing, animaciones GSAP
   ============================================================ */
window.App = (function () {
  "use strict";

  var NAV = {
    cliente: {
      secciones: [
        { grupo: "Menu", items: [
          { id: "dashboard", icono: "fa-house", label: "Dashboard" },
          { id: "reservar", icono: "fa-calendar-plus", label: "Reservar cita", badge: "1" },
          { id: "mis-citas", icono: "fa-calendar-check", label: "Mis citas" },
          { id: "historial", icono: "fa-clock-rotate-left", label: "Historial" },
          { id: "notificaciones", icono: "fa-bell", label: "Notificaciones", badge: "3" }
        ]}
      ],
      perfil: true
    },
    barbero: {
      secciones: [
        { grupo: "Menu", items: [
          { id: "dashboard", icono: "fa-house", label: "Dashboard" },
          { id: "agenda", icono: "fa-calendar-days", label: "Mi agenda" },
          { id: "mis-citas", icono: "fa-calendar-check", label: "Mis citas" },
          { id: "historial", icono: "fa-clock-rotate-left", label: "Historial" }
        ]}
      ],
      perfil: true
    },
    admin: {
      secciones: [
        { grupo: "Gestion", items: [
          { id: "dashboard", icono: "fa-house", label: "Dashboard" },
          { id: "citas", icono: "fa-calendar-check", label: "Citas", badge: "4" },
          { id: "clientes", icono: "fa-users", label: "Clientes" },
          { id: "barberos", icono: "fa-user-tie", label: "Barberos / Empleados" },
          { id: "servicios", icono: "fa-scissors", label: "Servicios" },
          { id: "horarios", icono: "fa-clock", label: "Horarios" },
          { id: "reportes", icono: "fa-chart-column", label: "Reportes" }
        ]}
      ],
      perfil: true
    },
    recepcion: {
      secciones: [
        { grupo: "Gestion", items: [
          { id: "dashboard", icono: "fa-house", label: "Dashboard" },
          { id: "citas", icono: "fa-calendar-check", label: "Citas", badge: "4" },
          { id: "horarios", icono: "fa-clock", label: "Horarios" },
          { id: "clientes", icono: "fa-users", label: "Clientes" },
          { id: "servicios-realizados", icono: "fa-scissors", label: "Servicios realizados" }
        ]}
      ],
      perfil: true
    }
  };

  var BOTTOM_NAV = {
    cliente: [
      { id: "dashboard", icono: "fa-house", label: "Inicio" },
      { id: "reservar", icono: "fa-calendar-plus", label: "Reservar" },
      { id: "mis-citas", icono: "fa-calendar-check", label: "Citas" },
      { id: "notificaciones", icono: "fa-bell", label: "Alertas" }
    ],
    barbero: [
      { id: "dashboard", icono: "fa-house", label: "Inicio" },
      { id: "agenda", icono: "fa-calendar-days", label: "Agenda" },
      { id: "mis-citas", icono: "fa-calendar-check", label: "Citas" },
      { id: "perfil", icono: "fa-user", label: "Perfil" }
    ],
    admin: [
      { id: "dashboard", icono: "fa-house", label: "Inicio" },
      { id: "citas", icono: "fa-calendar-check", label: "Citas" },
      { id: "clientes", icono: "fa-users", label: "Clientes" },
      { id: "reportes", icono: "fa-chart-column", label: "Reportes" }
    ],
    recepcion: [
      { id: "dashboard", icono: "fa-house", label: "Inicio" },
      { id: "citas", icono: "fa-calendar-check", label: "Citas" },
      { id: "horarios", icono: "fa-clock", label: "Horarios" },
      { id: "servicios-realizados", icono: "fa-scissors", label: "Servicios" }
    ]
  };

  var vistasTitulo = {
    dashboard: { t: "Panel principal", c: "Bienvenido de nuevo" },
    reservar: { t: "Reservar cita", c: "Agenda tu proximo corte" },
    "mis-citas": { t: "Mis citas", c: "Consulta y gestiona tus reservas" },
    historial: { t: "Historial de servicios", c: "Todos tus cortes registrados" },
    notificaciones: { t: "Notificaciones", c: "Novedades de tus citas" },
    perfil: { t: "Mi perfil", c: "Informacion personal" },
    agenda: { t: "Mi agenda", c: "Distribucion de tus citas" },
    citas: { t: "Gestion de citas", c: "Administra todas las reservas" },
    clientes: { t: "Gestion de clientes", c: "Base de datos de clientes" },
    barberos: { t: "Barberos y empleados", c: "Equipo de trabajo" },
    servicios: { t: "Gestion de servicios", c: "Carta de servicios y precios" },
    horarios: { t: "Consulta de horarios", c: "Disponibilidad de los barberos" },
    reportes: { t: "Reportes y estadisticas", c: "Rendimiento del negocio" },
    "servicios-realizados": { t: "Servicios realizados", c: "Registro de atenciones del dia" }
  };
  var _ruta = "dashboard";
  var _renderers = {};
  var _afterRender = {};

  function registerVista(rol, id, renderer, after) {
    _renderers[rol + ":" + id] = renderer;
    if (after) _afterRender[rol + ":" + id] = after;
  }

  function el(id) { return document.getElementById(id); }

  /* ---------- Render del sidebar ---------- */
  function buildSidebar() {
    var rol = DB.rol;
    var nav = NAV[rol];
    var cont = el("sidebar-nav");
    var html = "";
    nav.secciones.forEach(function (seccion) {
      html += '<div class="nav-label">' + seccion.grupo + "</div>";
      seccion.items.forEach(function (it) {
        html += '<a class="nav-item" data-vista="' + it.id + '" href="#/' + it.id + '">' +
          '<i class="fas ' + it.icono + '"></i><span>' + it.label + "</span>" +
          (it.badge ? '<span class="nav-badge">' + it.badge + "</span>" : "") +
          "</a>";
      });
    });
    cont.innerHTML = html;

    // footer del sidebar
    var foot = el("sidebar-footer");
    foot.innerHTML =
      '<a class="nav-item" data-vista="perfil" href="#/perfil"><i class="fas fa-user"></i><span>Mi perfil</span></a>' +
      '<a class="nav-item" data-vista="logout" href="#" id="logout-link"><i class="fas fa-sign-out-alt"></i><span>Cerrar sesión</span></a>';

    // bottom nav mobile
    var bn = el("bottom-nav");
    var bnHtml = "";
    BOTTOM_NAV[rol].forEach(function (it) {
      bnHtml += '<a class="bn-item" data-vista="' + it.id + '" href="#/' + it.id + '">' +
        '<i class="fas ' + it.icono + '"></i><span>' + it.label + "</span></a>";
    });
    bn.innerHTML = bnHtml;
  }

  /* ---------- Render del topbar ---------- */
  function buildTopbar() {
    var rol = DB.rol;
    var nombre = DB.usuario.nombre;
    var rolNombre = DB.usuario.rolNombre;
    el("top-user").textContent = nombre;
    el("top-rol").textContent = rolNombre;

    var notifCount = DB.notificaciones.filter(function (n) { return !n.leida; }).length;
    var bell = el("top-bell");
    var dot = bell.querySelector(".dot");
    if (dot) dot.style.display = notifCount > 0 ? "block" : "none";

    var avatar = el("top-avatar");
    avatar.innerHTML = DB.getIniciales(nombre);
  }

  /* ---------- Navegacion ---------- */
  function navigate(vista) {
    var rol = DB.rol;
    var nav = NAV[rol];
    var permitidas = [];
    nav.secciones.forEach(function (s) { s.items.forEach(function (i) { permitidas.push(i.id); }); });
    permitidas.push("perfil");
    if (rol === "cliente") permitidas.push("reprogramar");
    if (rol === "barbero") permitidas.push("detalle-cita");
    if (permitidas.indexOf(vista) === -1) vista = "dashboard";

    _ruta = vista;
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.toggle("active", n.getAttribute("data-vista") === vista);
    });
    document.querySelectorAll(".bn-item").forEach(function (n) {
      n.classList.toggle("active", n.getAttribute("data-vista") === vista);
    });

    var vt = vistasTitulo[vista] || { t: vista, c: "" };
    var pageTitle = el("page-title");
    var pageCrumb = el("page-crumb");
    if (pageTitle) pageTitle.textContent = vt.t;
    if (pageCrumb) pageCrumb.textContent = vt.c;

    var region = el("view-region");
    // animacion de salida
    if (window.gsap && region) {
      gsap.to(region.children, { autoAlpha: 0, y: 8, duration: 0.12, stagger: 0.02, onComplete: function () {
        renderVista(vista);
      } });
    } else {
      renderVista(vista);
    }
    closeSidebarMobile();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderVista(vista) {
    var region = el("view-region");
    var key = DB.rol + ":" + vista;
    var fn = _renderers[key];
    region.innerHTML = fn ? fn() : '<div class="empty"><div class="empty-ico"><i class="fas fa-compass"></i></div><div class="empty-title">Vista no encontrada</div></div>';
    if (_afterRender[key]) _afterRender[key]();
    if (window.gsap) {
      gsap.fromTo(region.children, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.05, ease: "power2.out" });
    }
  }

  /* ---------- Sidebar mobile ---------- */
  function openSidebarMobile() {
    var sb = el("sidebar");
    sb.classList.add("is-open");
    if (!el("sidebar-scrim")) {
      var scrim = document.createElement("div");
      scrim.id = "sidebar-scrim";
      scrim.className = "mobile-scrim";
      scrim.style.zIndex = "44";
      scrim.addEventListener("click", closeSidebarMobile);
      document.body.appendChild(scrim);
    }
  }
  function closeSidebarMobile() {
    var sb = el("sidebar");
    var scrim = el("sidebar-scrim");
    if (window.innerWidth < 1024) {
      sb.classList.remove("is-open");
      if (scrim) scrim.remove();
    } else if (scrim) {
      scrim.remove();
    }
  }

  /* ---------- Inicializacion ---------- */
  function init() {
    buildSidebar();
    buildTopbar();
    bindTopbar();
    bindScroll();
    var inicio = (location.hash.replace("#/", "") || "dashboard");
    navigate(inicio);
    window.addEventListener("hashchange", function () {
      navigate(location.hash.replace("#/", "") || "dashboard");
    });
  }

  function bindTopbar() {
    var menuBtn = el("top-menu");
    if (menuBtn) menuBtn.addEventListener("click", function () {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        document.body.classList.toggle("sidebar-collapsed");
      } else {
        openSidebarMobile();
      }
    });

    var bell = el("top-bell");
    if (bell) bell.addEventListener("click", function () {
      navigate("notificaciones");
    });

    var avatarBtn = el("top-avatar-btn");
    if (avatarBtn) {
      avatarBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        UI.dropdown(avatarBtn, {
          items: [
            { titulo: DB.usuario.nombre },
            { icon: "fa-user", label: "Mi perfil", onClick: function () { navigate("perfil"); } },
            { separador: true },
            { icon: "fa-arrow-right-from-bracket", label: "Cerrar sesion", danger: true, onClick: function () { location.href = "login.html"; } }
          ]
        });
      });
    }

    // Manejador para logout en sidebar footer
    var logoutLink = el("logout-link");
    if (logoutLink) {
      logoutLink.addEventListener("click", function (e) {
        e.preventDefault();
        location.href = "login.html";
      });
    }
  }

  function bindScroll() {
    // Delegacion de eventos para modales/confirmaciones
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-confirm]");
      if (t) {
        e.preventDefault();
        var msg = t.getAttribute("data-confirm") || "Esta accion no se puede deshacer.";
        var onOk = t.__onOk;
        UI.confirm({
          titulo: t.getAttribute("data-confirm-title") || "Confirmar accion",
          mensaje: msg,
          onConfirm: function () { if (onOk) onOk(); }
        });
      }
    });
  }

  /* ---------- Helpers compartidos ---------- */
  function fechaHumana(iso) {
    return DB.formatFechaLarga(iso);
  }

  return {
    init: init,
    navigate: navigate,
    registerVista: registerVista,
    el: el,
    fechaHumana: fechaHumana
  };
})();
