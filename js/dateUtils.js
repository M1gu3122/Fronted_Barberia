/* ============================================================
   Barberia El Corte Perfecto - Utilidades de fecha y hora
   Zona horaria del negocio: America/Bogota (UTC-05:00)

   Convenciones:
     Fecha      -> YYYY-MM-DD
     Hora       -> HH:mm
     Fecha+hora -> YYYY-MM-DDTHH:mm:ss-05:00
   ============================================================ */
window.DateUtils = (function () {
  "use strict";

  var OFFSET_SUFFIX = "-05:00";

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /* Convertir un objeto Date a YYYY-MM-DD usando componentes LOCALES
     (nunca toISOString: evitaria convertir a UTC y cambiar el dia). */
  function fromDate(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "";
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  /* Fecha local actual -> YYYY-MM-DD */
  function today() {
    return fromDate(new Date());
  }

  /* Fecha local actual + offset en dias -> YYYY-MM-DD */
  function addDays(offsetDays) {
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (offsetDays || 0));
    return fromDate(d);
  }

  /* Combinar fecha (YYYY-MM-DD) + hora (HH:mm o HH:mm:ss) en
     YYYY-MM-DDTHH:mm:ss-05:00 para enviar al backend. */
  function toApiDateTime(fecha, hora) {
    var f = String(fecha || "").substr(0, 10);
    var h = String(hora || "").trim();
    if (!f || !h) return "";
    if (h.length === 5) h = h + ":00";
    return f + "T" + h + OFFSET_SUFFIX;
  }

  /* Formato corto para mostrar: 18/08/2026 */
  function formatDate(fecha) {
    var f = String(fecha || "").substr(0, 10);
    var p = f.split("-");
    if (p.length !== 3) return fecha || "";
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  function _fechaLarga(fecha, conAno) {
    var f = String(fecha || "").substr(0, 10);
    if (!f) return "";
    var d = new Date(f + "T00:00:00");
    if (isNaN(d.getTime())) return fecha || "";
    var opts = { weekday: "long", day: "numeric", month: "long" };
    if (conAno) opts.year = "numeric";
    return d.toLocaleDateString("es-CO", opts);
  }

  /* Formato largo: martes, 18 de agosto de 2026 */
  function formatLong(fecha) {
    return _fechaLarga(fecha, false);
  }

  /* Formato largo con anio: martes, 18 de agosto de 2026 */
  function formatLongWithYear(fecha) {
    return _fechaLarga(fecha, true);
  }

  /* Formatear hora: 10:30 */
  function formatHour(hora) {
    return String(hora || "").substr(0, 5);
  }

  /* Extraer HH:mm de un datetime YYYY-MM-DDTHH:mm:ss-05:00
     sin conversiones de zona horaria. */
  function timeFromDateTime(dt) {
    return String(dt || "").substr(11, 5);
  }

  /* Extraer YYYY-MM-DD de un datetime YYYY-MM-DDTHH:mm:ss-05:00 */
  function dateFromDateTime(dt) {
    return String(dt || "").substr(0, 10);
  }

  return {
    fromDate: fromDate,
    today: today,
    addDays: addDays,
    toApiDateTime: toApiDateTime,
    formatDate: formatDate,
    formatLong: formatLong,
    formatLongWithYear: formatLongWithYear,
    formatHour: formatHour,
    timeFromDateTime: timeFromDateTime,
    dateFromDateTime: dateFromDateTime
  };
})();