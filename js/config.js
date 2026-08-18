/* ============================================================
   Barberia El Corte Perfecto — Configuracion de navegacion
   Menus por rol, bottom nav movil y titulos de cada vista
   ============================================================ */
window.CONFIG = {
  NAV: {
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
  },

  BOTTOM_NAV: {
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
  },

  vistasTitulo: {
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
  }
};