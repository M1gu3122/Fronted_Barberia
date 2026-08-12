/* ============================================================
   Barberia El Corte Perfecto — Libreria de componentes UI
   Badges, toasts, modales, confirmaciones, dropdowns, skeletons
   ============================================================ */
window.UI = (function () {
  "use strict";

  var ESTADOS = {
    pendiente:   { label: "Pendiente",   cls: "badge-pendiente" },
    confirmada:  { label: "Confirmada",  cls: "badge-confirmada" },
    espera:      { label: "En espera",   cls: "badge-espera" },
    atencion:    { label: "En atencion", cls: "badge-atencion" },
    completada:  { label: "Completada",  cls: "badge-completada" },
    cancelada:   { label: "Cancelada",   cls: "badge-cancelada" },
    activo:      { label: "Activo",      cls: "badge-activo" },
    inactivo:    { label: "Inactivo",    cls: "badge-inactivo" }
  };

  function badge(estado) {
    var e = ESTADOS[estado] || { label: estado, cls: "badge-neutral" };
    return '<span class="badge ' + e.cls + '">' + e.label + "</span>";
  }

  function avatar(nombre, extra) {
    var cls = extra || "";
    return '<span class="avatar ' + cls + '">' + DB.getIniciales(nombre) + "</span>";
  }

  /* ---------- Toasts ---------- */
  var toastWrap = null;
  function ensureWrap() {
    if (!toastWrap) {
      toastWrap = document.createElement("div");
      toastWrap.className = "toast-wrap";
      document.body.appendChild(toastWrap);
    }
    return toastWrap;
  }

  function toast(titulo, mensaje, tipo) {
    tipo = tipo || "info";
    var iconos = { success: "\u2713", error: "\u21BB", info: "\u24D8" };
    var el = document.createElement("div");
    el.className = "toast " + tipo;
    el.innerHTML =
      '<div class="toast-icon">' + (iconos[tipo] || "\u24D8") + "</div>" +
      '<div class="toast-body"><div class="toast-title">' + titulo + "</div>" +
      '<div class="toast-msg">' + mensaje + "</div></div>" +
      '<button class="toast-close" aria-label="Cerrar">&times;</button>';
    ensureWrap().appendChild(el);
    el.querySelector(".toast-close").addEventListener("click", function () { dismiss(el); });
    if (window.gsap) {
      gsap.fromTo(el, { autoAlpha: 0, y: -12, x: 20 }, { autoAlpha: 1, y: 0, x: 0, duration: 0.3, ease: "power2.out" });
    }
    setTimeout(function () { dismiss(el); }, 4200);
    return el;
  }

  function dismiss(el) {
    if (window.gsap) {
      gsap.to(el, { autoAlpha: 0, y: -8, x: 12, duration: 0.25, onComplete: function () { el.remove(); } });
    } else {
      el.remove();
    }
  }

  /* ---------- Modal ---------- */
  var openModals = 0;
  function modal(opciones) {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal-header">' +
      (opciones.icon ? '<span class="kpi-ico" style="background:var(--bone);color:var(--brass-dim);">' + opciones.icon + "</span>" : "") +
      '<div><div class="modal-title">' + (opciones.titulo || "") + "</div>" +
      (opciones.subtitulo ? '<div class="card-sub">' + opciones.subtitulo + "</div>" : "") +
      "</div>" +
      '<button class="icon-btn modal-close" aria-label="Cerrar"><i class="fas fa-times"></i></button>' +
      "</div>" +
      '<div class="modal-body">' + (opciones.body || "") + "</div>" +
      (opciones.footer ? '<div class="modal-footer">' + opciones.footer + "</div>" : "") +
      "</div>";
    document.body.appendChild(overlay);
    openModals++;
    document.body.style.overflow = "hidden";
    if (window.gsap) {
      gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, ease: "power1.out" });
      gsap.fromTo(overlay.querySelector(".modal"), { autoAlpha: 0, y: 16, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "power2.out" });
    }
    function close() {
      openModals = Math.max(0, openModals - 1);
      if (openModals === 0) document.body.style.overflow = "";
      if (window.gsap) {
        gsap.to(overlay, { autoAlpha: 0, duration: 0.15, onComplete: function () { overlay.remove(); } });
      } else { overlay.remove(); }
      if (opciones.onClose) opciones.onClose();
    }
    overlay.querySelector(".modal-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay && !opciones.cerrarFuera === false) close();
      if (e.target === overlay) close();
    });
    return { overlay: overlay, close: close, body: overlay.querySelector(".modal-body") };
  }

  /* ---------- Confirm dialog ---------- */
  function confirm(opciones) {
    return modal({
      icon: '<i class="fas ' + (opciones.icon || "fa-triangle-exclamation") + '"></i>',
      titulo: opciones.titulo || "Confirmar accion",
      subtitulo: opciones.subtitulo,
      body:
        '<div class="confirm-ico ' + (opciones.tipo || "warn") + '">' +
        '<i class="fas ' + (opciones.icono || "fa-triangle-exclamation") + '"></i></div>' +
        '<div style="font-size:14px;color:var(--smoke);">' + (opciones.mensaje || "Esta accion no se puede deshacer.") + "</div>",
      footer:
        '<button class="btn btn-ghost" data-accion="cancelar">Cancelar</button>' +
        '<button class="btn btn-primary" data-accion="aceptar" style="background:var(--st-cancelada);color:#fff;">' +
        (opciones.confirmarTexto || "Confirmar") + "</button>",
      onClose: opciones.onClose,
      cerrarFuera: true
    });
    // enlace de botones
    var m = document.body.lastElementChild;
    setTimeout(function () {
      var btns = m.querySelectorAll("[data-accion]");
      var okBtn = m.querySelector('[data-accion="aceptar"]');
      var cancelBtn = m.querySelector('[data-accion="cancelar"]');
      function done(accion) {
        m.remove();
        openModals = Math.max(0, openModals - 1);
        if (openModals === 0) document.body.style.overflow = "";
        if (accion === "aceptar" && opciones.onConfirm) opciones.onConfirm();
        if (accion === "cancelar" && opciones.onCancel) opciones.onCancel();
        if (opciones.onClose) opciones.onClose();
      }
      if (okBtn) okBtn.addEventListener("click", function () { done("aceptar"); });
      if (cancelBtn) cancelBtn.addEventListener("click", function () { done("cancelar"); });
      m.addEventListener("click", function (e) { if (e.target === m) done("cancelar"); });
    }, 10);
    return m;
  }

  /* ---------- Dropdown ---------- */
  function dropdown(triggerEl, opciones) {
    var menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = opciones.items.map(function (it) {
      if (it.separador) return '<div class="dropdown-sep"></div>';
      if (it.titulo) return '<div class="dropdown-head">' + it.titulo + "</div>";
      var danger = it.danger ? " danger" : "";
      return '<button class="dropdown-item' + danger + '" data-idx="' + (opciones.items.indexOf(it)) + '">' +
        (it.icon ? '<i class="fas ' + it.icon + '"></i>' : "") + it.label + "</button>";
    }).join("");
    document.body.appendChild(menu);
    var rect = triggerEl.getBoundingClientRect();
    var ancho = menu.offsetWidth || 200;
    var top = rect.bottom + 6;
    var left = rect.right - ancho;
    if (left < 8) left = 8;
    if (top + menu.offsetHeight > window.innerHeight - 8) top = rect.top - menu.offsetHeight - 6;
    menu.style.position = "fixed";
    menu.style.top = top + "px";
    menu.style.left = left + "px";
    if (window.gsap) {
      gsap.fromTo(menu, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.16, ease: "power1.out" });
    }
    function close() { menu.remove(); document.removeEventListener("click", onClickDoc); }
    function onClickDoc(e) { if (!menu.contains(e.target)) close(); }
    setTimeout(function () { document.addEventListener("click", onClickDoc); }, 0);
    menu.querySelectorAll("[data-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-idx"), 10);
        close();
        if (opciones.items[idx] && opciones.items[idx].onClick) opciones.items[idx].onClick();
      });
    });
    return { menu: menu, close: close };
  }

  /* ---------- Paginacion ---------- */
  function paginacion(total, pagina, porPagina, onPage) {
    var paginas = Math.ceil(total / porPagina) || 1;
    var html = '<div class="table-pagination">' +
      '<button class="page-btn" data-p="' + Math.max(1, pagina - 1) + '" ' + (pagina <= 1 ? "disabled" : "") + '><i class="fas fa-chevron-left"></i></button>';
    for (var i = 1; i <= paginas; i++) {
      html += '<button class="page-btn' + (i === pagina ? " active" : "") + '" data-p="' + i + '">' + i + "</button>";
    }
    html += '<button class="page-btn" data-p="' + Math.min(paginas, pagina + 1) + '" ' + (pagina >= paginas ? "disabled" : "") + '><i class="fas fa-chevron-right"></i></button>' +
      '<span class="cell-muted" style="margin-left:8px;">' + total + " registros</span></div>";
    setTimeout(function () {
      var cont = document.querySelector('[data-pagina-region="' + (onPage.region || "") + '"]');
    }, 0);
    return html;
  }

  /* ---------- Skeleton ---------- */
  function skeleton(alto, ancho) {
    return '<div class="skeleton" style="height:' + (alto || 14) + "px;" + (ancho ? "width:" + ancho + "px;" : "") + '"></div>';
  }

  /* ---------- Selector de hora ---------- */
  function timeGrid(slots, seleccionada) {
    return '<div class="time-grid">' + slots.map(function (s) {
      var cls = "time-slot";
      if (!s.libre) cls += " taken";
      else if (s.hora === seleccionada) cls += " selected";
      return '<button type="button" class="' + cls + '" data-hora="' + s.hora + '"' + (s.libre ? "" : " disabled") + ">" + s.hora + "</button>";
    }).join("") + "</div>";
  }

  function estadoBadge(estado) { return badge(estado); }

  return {
    ESTADOS: ESTADOS,
    badge: badge,
    avatar: avatar,
    toast: toast,
    modal: modal,
    confirm: confirm,
    dropdown: dropdown,
    paginacion: paginacion,
    skeleton: skeleton,
    timeGrid: timeGrid,
    estadoBadge: estadoBadge
  };
})();
