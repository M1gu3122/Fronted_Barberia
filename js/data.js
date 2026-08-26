/* ============================================================
   Barberia El Corte Perfecto — Store de datos (mock)
   Esta capa emula la API FastAPI/MySQL: se reemplaza por fetch()
   al conectar el backend real.
   ============================================================ */
window.DB = (function () {
  "use strict";

function iso(offsetDays) {
    return DateUtils.addDays(offsetDays || 0);
  }
  function formatFechaLarga(isoStr) {
    return DateUtils.formatLong(isoStr);
  }
  function formatFechaLargaConAno(isoStr) {
    return DateUtils.formatLongWithYear(isoStr);
  }

var servicios = [
    { id: 1, nombre: "Corte clasico", descripcion: "Corte tradicional a tijera y maquina, terminado con navaja", duracion: 30, precio: 15000, activo: true },
    { id: 2, nombre: "Low Fade", descripcion: "Desvanecido bajo con contorno definido", duracion: 40, precio: 18000, activo: true },
    { id: 3, nombre: "Mid Fade", descripcion: "Desvanecido medio, el clasico de la casa", duracion: 40, precio: 18000, activo: true },
    { id: 4, nombre: "High Fade", descripcion: "Desvanecido alto con acabado limpio", duracion: 40, precio: 20000, activo: true },
    { id: 5, nombre: "Taper Fade", descripcion: "Desvanecido suave que se funde con el cabello", duracion: 35, precio: 18000, activo: true },
    { id: 6, nombre: "Burst Fade", descripcion: "Desvanecido radial alrededor de las orejas", duracion: 40, precio: 20000, activo: true },
    { id: 7, nombre: "Mullet", descripcion: "Corte mullet contemporaneo", duracion: 45, precio: 20000, activo: true },
    { id: 8, nombre: "French Crop", descripcion: "Corte crop con flequillo texturizado", duracion: 40, precio: 20000, activo: true },
    { id: 9, nombre: "Corte militar", descripcion: "Corte rapido, corto y practico", duracion: 25, precio: 12000, activo: true },
    { id: 10, nombre: "Afeitado con navaja", descripcion: "Afeitado clasico con toalla caliente", duracion: 25, precio: 15000, activo: true },
    { id: 11, nombre: "Ritual de barba", descripcion: "Perfilado, mascarilla y aceite para barba", duracion: 30, precio: 16000, activo: true },
    { id: 12, nombre: "Corte + barba", descripcion: "Combo de corte y ritual de barba", duracion: 60, precio: 30000, activo: false }
  ];

  var barberos = [
    { id: 1, nombre: "Andres Duarte", especialidad: "Fades y cortes clasicos", experiencia: "8 anos", horarioIni: "09:00", horarioFin: "18:00", activo: true, citas: 14 },
    { id: 2, nombre: "Camilo Restrepo", especialidad: "Degradados y textura", experiencia: "5 anos", horarioIni: "10:00", horarioFin: "19:00", activo: true, citas: 11 },
    { id: 3, nombre: "Jose Arango", especialidad: "Barba y afeitado clasico", experiencia: "12 anos", horarioIni: "08:00", horarioFin: "16:00", activo: true, citas: 9 },
    { id: 4, nombre: "Santiago Mejia", especialidad: "Estilos modernos y mullets", experiencia: "3 anos", horarioIni: "11:00", horarioFin: "20:00", activo: true, citas: 7 },
    { id: 5, nombre: "Luis Fernando Gomez", especialidad: "Cortes militares y clasicos", experiencia: "15 anos", horarioIni: "09:00", horarioFin: "17:00", activo: false, citas: 2 }
  ];

  var clientes = [
    { id: 1, nombre: "Carlos Lopez", telefono: "300 123 4567", correo: "carlos.lopez@mail.com", citas: 12, ultima: iso(-6), estado: "activo" },
    { id: 2, nombre: "Miguel Angel Ruiz", telefono: "310 555 0198", correo: "miguel.ruiz@mail.com", citas: 8, ultima: iso(-3), estado: "activo" },
    { id: 3, nombre: "Felipe Torres", telefono: "301 888 2345", correo: "felipe.torres@mail.com", citas: 5, ultima: iso(-9), estado: "activo" },
    { id: 4, nombre: "Jorge Castaneda", telefono: "315 222 8841", correo: "jorge.castaneda@mail.com", citas: 3, ultima: iso(-15), estado: "activo" },
    { id: 5, nombre: "Daniel Moreno", telefono: "304 777 6632", correo: "daniel.moreno@mail.com", citas: 1, ultima: iso(-22), estado: "activo" },
    { id: 6, nombre: "Ricardo Pineda", telefono: "311 909 4477", correo: "ricardo.pineda@mail.com", citas: 6, ultima: iso(-2), estado: "activo" },
    { id: 7, nombre: "Andres Herrera", telefono: "317 444 1122", correo: "andres.herrera@mail.com", citas: 0, ultima: null, estado: "inactivo" },
    { id: 8, nombre: "Sebastian Ochoa", telefono: "302 111 9090", correo: "sebastian.ochoa@mail.com", citas: 4, ultima: iso(-12), estado: "activo" }
  ];

  /* Citas: id, cliente, barbero, servicio, fecha (iso), hora, estado */
  var citas = [
    { id: 1001, cliente: 1, barbero: 1, servicio: 2, fecha: iso(0), hora: "09:00", estado: "confirmada" },
    { id: 1002, cliente: 3, barbero: 2, servicio: 3, fecha: iso(0), hora: "10:00", estado: "atencion" },
    { id: 1003, cliente: 5, barbero: 3, servicio: 9, fecha: iso(0), hora: "10:30", estado: "espera" },
    { id: 1004, cliente: 2, barbero: 1, servicio: 4, fecha: iso(0), hora: "11:00", estado: "completada" },
    { id: 1005, cliente: 6, barbero: 2, servicio: 1, fecha: iso(0), hora: "11:30", estado: "pendiente" },
    { id: 1006, cliente: 4, barbero: 4, servicio: 7, fecha: iso(0), hora: "12:00", estado: "pendiente" },
    { id: 1007, cliente: 8, barbero: 1, servicio: 3, fecha: iso(0), hora: "13:00", estado: "confirmada" },
    { id: 1008, cliente: 1, barbero: 2, servicio: 1, fecha: iso(0), hora: "14:00", estado: "pendiente" },
    { id: 1009, cliente: 3, barbero: 4, servicio: 5, fecha: iso(1), hora: "10:00", estado: "confirmada" },
    { id: 1010, cliente: 6, barbero: 1, servicio: 2, fecha: iso(1), hora: "11:00", estado: "confirmada" },
    { id: 1011, cliente: 2, barbero: 3, servicio: 10, fecha: iso(2), hora: "09:30", estado: "confirmada" },
    { id: 1012, cliente: 8, barbero: 2, servicio: 8, fecha: iso(3), hora: "16:00", estado: "pendiente" },
    { id: 1013, cliente: 1, barbero: 1, servicio: 11, fecha: iso(4), hora: "15:00", estado: "confirmada" },
    { id: 1014, cliente: 5, barbero: 4, servicio: 6, fecha: iso(-7), hora: "12:30", estado: "cancelada" },
    { id: 1015, cliente: 2, barbero: 2, servicio: 3, fecha: iso(-10), hora: "11:00", estado: "completada" },
    { id: 1016, cliente: 1, barbero: 3, servicio: 10, fecha: iso(-14), hora: "10:00", estado: "completada" },
    { id: 1017, cliente: 3, barbero: 1, servicio: 4, fecha: iso(-20), hora: "17:00", estado: "completada" },
    { id: 1018, cliente: 6, barbero: 2, servicio: 1, fecha: iso(-25), hora: "13:00", estado: "completada" },
    { id: 1019, cliente: 2, barbero: 4, servicio: 7, fecha: iso(-30), hora: "12:00", estado: "completada" },
    { id: 1020, cliente: 8, barbero: 1, servicio: 9, fecha: iso(-35), hora: "09:00", estado: "completada" },
    { id: 1021, cliente: 4, barbero: 3, servicio: 2, fecha: iso(-40), hora: "11:00", estado: "cancelada" },
    { id: 1022, cliente: 1, barbero: 2, servicio: 5, fecha: iso(-45), hora: "15:00", estado: "completada" },
    { id: 1023, cliente: 6, barbero: 1, servicio: 3, fecha: iso(-50), hora: "10:00", estado: "completada" },
    { id: 1024, cliente: 5, barbero: 4, servicio: 4, fecha: iso(-55), hora: "14:00", estado: "completada" }
  ];

  var notificaciones = [
    { id: 1, tipo: "cita", titulo: "Cita confirmada", cuerpo: "Tu cita para el Low Fade con Andres Duarte fue confirmada.", fecha: "Hace 2 horas", leida: false },
    { id: 2, tipo: "record", titulo: "Recordatorio", cuerpo: "Tienes una cita manana a las 11:00 con Camilo Restrepo.", fecha: "Hace 5 horas", leida: false },
    { id: 3, tipo: "cambio", titulo: "Cambio de horario", cuerpo: "Tu cita del viernes se movio a las 15:00 por solicitud del barbero.", fecha: "Ayer", leida: false },
    { id: 4, tipo: "cancel", titulo: "Cita cancelada", cuerpo: "La cita con Santiago Mejia fue cancelada. Te esperamos pronto.", fecha: "Hace 3 dias", leida: true },
    { id: 5, tipo: "cita", titulo: "Servicio completado", cuerpo: "Gracias por tu visita. Tu corte quedara listo para recalcar.", fecha: "Hace 6 dias", leida: true },
    { id: 6, tipo: "record", titulo: "Recordatorio", cuerpo: "Es hora de renovar tu estilo. Reserva tu proximo corte.", fecha: "Hace 8 dias", leida: true }
  ];

  /* Utilidades de consulta */
  function servicio(id) { return servicios.find(function (s) { return s.id === id; }); }
  function barbero(id) { return barberos.find(function (b) { return b.id === id; }); }
  function cliente(id) { return clientes.find(function (c) { return c.id === id; }); }
  function cita(id) { return citas.find(function (c) { return c.id === id; }); }
  function citasDe(filtro) {
    return citas.filter(function (c) {
      return Object.keys(filtro).every(function (k) { return c[k] === filtro[k]; });
    }).sort(function (a, b) { return (a.fecha + a.hora) < (b.fecha + b.hora) ? -1 : 1; });
  }
  function horariosLibres(barberoId, fecha) {
    var b = barbero(barberoId);
    if (!b || !b.activo) return [];
    var tomadas = citasDe({ barbero: barberoId, fecha: fecha })
      .filter(function (c) { return c.estado !== "cancelada"; });
    var slots = [];
    var ini = parseInt(b.horarioIni, 10) * 60;
    var fin = parseInt(b.horarioFin, 10) * 60;
    for (var t = ini; t + 30 <= fin; t += 30) {
      var hh = String(Math.floor(t / 60)).padStart(2, "0");
      var mm = String(t % 60).padStart(2, "0");
      var slot = hh + ":" + mm;
      var ocupado = tomadas.some(function (c) { return c.hora === slot; });
      slots.push({ hora: slot, libre: !ocupado });
    }
    return slots;
  }

  function estadoCita(id) { var c = cita(id); return c ? c.estado : null; }
  function actualizarEstadoCita(id, estado) {
    var c = cita(id);
    if (c) c.estado = estado;
  }

  return {
    iso: iso,
    formatFechaLarga: formatFechaLarga,
    formatFechaLargaConAno: formatFechaLargaConAno,
    servicios: servicios,
    barberos: barberos,
    clientes: clientes,
    citas: citas,
    notificaciones: notificaciones,
    servicio: servicio,
    barbero: barbero,
    cliente: cliente,
    cita: cita,
    citasDe: citasDe,
    horariosLibres: horariosLibres,
    estadoCita: estadoCita,
    actualizarEstadoCita: actualizarEstadoCita,
    formatPrecio: function (p) { return "$" + p.toLocaleString("es-CO"); },
    getIniciales: function (nombre) {
      return nombre.split(" ").map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
    },
    // Rol activo en sesion (demo): cliente | barbero | admin | recepcion
    rol: "cliente",
    usuario: { nombre: "Carlos Lopez", rolNombre: "Cliente" },
    setSesion: function (rol, nombre, rolNombre) {
      this.rol = rol; this.usuario.nombre = nombre; this.usuario.rolNombre = rolNombre;
    }
  };
})();
