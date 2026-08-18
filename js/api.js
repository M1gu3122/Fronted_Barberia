/**
 * Cliente HTTP para la API de FastAPI.
 * Organizado por dominios: auth, usuarios, empleados, citas, servicios, barberos, servicios-adicionales, horarios, barberias.
 * Mantiene window.api para compatibilidad global.
 */
(function () {
    "use strict";

    // ============================================================
    // NÚCLEO HTTP
    // ============================================================
    const API_BASE = "http://127.0.0.1:8000";

    function _headers(auth) {
        const h = { "Content-Type": "application/json" };
        if (auth !== false) {
            const t = sessionStorage.getItem("token");
            if (t) h["Authorization"] = "Bearer " + t;
        }
        return h;
    }
async function _handleResponse(res) {
        const contentType = res.headers.get("content-type") || "";
        let data = null;
        try {
            if (contentType.includes("application/json")) {
                data = await res.json();
            } else {
                data = await res.text().catch(() => null);
            }
        } catch (e) {
            data = null;
        }
        if (!res.ok) {
            // Intentar obtener mensaje del backend
            let msg = null;
            if (data && typeof data === "object") {
                msg = data.detail || data.message || data.texto || null;
            }
            if (data && typeof data === "string") {
                msg = data;
            }
            // Si el backend devolvió JSON con error, usamos ese mensaje
            // Si no, usamos una descripción basada en el código de estado
            const statusText = res.statusText || "Error de red";
            const errorMsg = msg || (res.status === 500 ? "Error interno del servidor" : statusText);
            
            // Loguear detalle completo para debugging en consola
            console.error("Error API:", { status: res.status, statusText, contentType, data });
            
            const err = new Error(errorMsg);
            err.status = res.status;
            err.detail = data;
            throw err;
        }

        return data;
    }

    // ============================================================
    // AUTH
    // ============================================================
    async function login(correo, contraseña) {
        const r = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: _headers(false),
            body: JSON.stringify({ correo, contraseña })
        });
        return _handleResponse(r);
    }

    // ============================================================
    // USUARIOS / CLIENTES
    // ============================================================
    async function getCliente(id) {
        const r = await fetch(`${API_BASE}/usuarios/obtener_usuario/${id}`, { headers: _headers() });
        return _handleResponse(r);
    }
    async function getClientes() {
        const r = await fetch(`${API_BASE}/usuarios/obtener_usuarios`, { headers: _headers() });
        return _handleResponse(r);
    }
    async function crearUsuario(data) {
        const r = await fetch(`${API_BASE}/usuarios/crear_usuario`, {
            method: "POST", headers: _headers(), body: JSON.stringify(data)
        });
        return _handleResponse(r);
    }
    async function actualizarUsuario(id, data) {
        const r = await fetch(`${API_BASE}/usuarios/actualizar_usuario/${id}`, {
            method: "PUT", headers: _headers(), body: JSON.stringify(data)
        });
        return _handleResponse(r);
    }
    async function getUsuariosPanelAdmin() {
        const r = await fetch(`${API_BASE}/usuarios/obtener_clientes_panelAdmin`, { headers: _headers() });
        return _handleResponse(r);
    }
    async function getInfoPerfilUsuario(id) {
        const r = await fetch(`${API_BASE}/usuarios/obtener_info_perfil_usuario/${id}`, { headers: _headers() });
        return _handleResponse(r);
    }

    // ============================================================
    // EMPLEADOS / BARBEROS
    // ============================================================
    async function getEmpleados() {
        const r = await fetch(`${API_BASE}/empleados/obtener_empleados`, { headers: _headers() });
        return _handleResponse(r);
    }
    async function crearEmpleado(data) {
        const r = await fetch(`${API_BASE}/empleados/crear_empleado`, {
            method: "POST", headers: _headers(), body: JSON.stringify(data)
        });
        return _handleResponse(r);
    }
    async function actualizarEmpleado(id, data) {
        const r = await fetch(`${API_BASE}/empleados/actualizar_empleado/${id}`, {
            method: "PUT", headers: _headers(), body: JSON.stringify(data)
        });
        return _handleResponse(r);
    }

    // ============================================================
    // CITAS
    // ============================================================
    async function obtenerCitasDetalles() {
        const r = await fetch(`${API_BASE}/citas/obtener_citas_detalle`, { headers: _headers() });
        return _handleResponse(r);
    }
    async function crearCita(data) {
        const r = await fetch(`${API_BASE}/citas/crear_cita/`, {
            method: "POST", headers: _headers(), body: JSON.stringify(data)
        });
        return _handleResponse(r);
    }
    async function actualizarCita(id, data) {
        const r = await fetch(`${API_BASE}/citas/actualizar_cita/${id}`, {
            method: "PUT", headers: _headers(), body: JSON.stringify(data)
        });
        return _handleResponse(r);
    }

    // ============================================================
    // SERVICIOS
    // ============================================================
    async function getServicios() {
        const r = await fetch(`${API_BASE}/servicios/obtener_servicios/`, { headers: _headers() });
        return _handleResponse(r);
    }
    async function crearServicio(data) {
        const r = await fetch(`${API_BASE}/servicios/crear_servicio/`, {
            method: "POST", headers: _headers(), body: JSON.stringify(data)
        });
        return _handleResponse(r);
    }
    async function actualizarServicio(id, data) {
        const r = await fetch(`${API_BASE}/servicios/actualizar_servicio/${id}`, {
            method: "PUT", headers: _headers(), body: JSON.stringify(data)
        });
        return _handleResponse(r);
    }
    async function eliminarServicio(id) {
        const r = await fetch(`${API_BASE}/servicios/eliminar_servicio/${id}`, {
            method: "DELETE", headers: _headers()
        });
        return _handleResponse(r);
    }

// ============================================================
    // BARBEROS DISPONIBLES
    // ============================================================
    async function getBarberosDisponibles(ids_servicio) {
        const q = (ids_servicio || []).map(id => "ids_servicio=" + id).join("&");
        const r = await fetch(`${API_BASE}/barberos-servicios/barberos-disponibles?${q}`, { headers: _headers() });
        return _handleResponse(r);
    }
    async function getServiciosDelBarbero(id_usuario) {
        const r = await fetch(`${API_BASE}/barberos-servicios/obtener_servicios_por_barbero/${id_usuario}`, { headers: _headers() });
        return _handleResponse(r);
      }
    async function asignarServicioBarbero(id_usuario, id_servicio) {
        const r = await fetch(`${API_BASE}/barberos-servicios/asignar_servicio/${id_usuario}/${id_servicio} `, {
            method: "POST", headers: _headers(), body: JSON.stringify({ id_usuario, id_servicio })
        });
        return _handleResponse(r);
    }
    async function desasignarServicioBarbero(id_usuario, id_servicio) {
        const r = await fetch(`${API_BASE}/barberos-servicios/desasignar/${id_usuario}/${id_servicio}`, {
            method: "DELETE", headers: _headers()
        });
        return _handleResponse(r);
    }
      async function cancelarCita(id_cita) {
        const r = await fetch(`${API_BASE}/citas/${id_cita}/cancelar`, {
          method: "PUT",
          headers: _headers()
        });
        return _handleResponse(r);
      }

    // ============================================================
    // SERVICIOS ADICIONALES
    // ============================================================
    async function getServiciosAdicionales(id_servicio) {
        const r = await fetch(`${API_BASE}/servicios-adicionales/servicio/${id_servicio}/ids`, { headers: _headers() });
        return _handleResponse(r);
    }

    // ============================================================
    // HORARIOS
    // ============================================================
    async function getHorarioBarberia(id_barberia, fecha) {
        const r = await fetch(`${API_BASE}/horarios-barberia/barberia/${id_barberia}/fecha/${fecha}`, { headers: _headers() });
        return _handleResponse(r);
    }
    async function getHorariosSemanales(id_barberia) {
        const r = await fetch(`${API_BASE}/horarios-barberia/barberia/${id_barberia}`, { headers: _headers() });
        return _handleResponse(r);
    }

    // ============================================================
    // BARBERÍAS
    // ============================================================
    async function obtenerBarberia() {
        const r = await fetch(`${API_BASE}/barberias/obtener_barberia/`, { headers: _headers() });
        return _handleResponse(r);
    }

    // ============================================================
    // EXPORT GLOBAL
    // ============================================================
    window.api = {
        base: API_BASE,
        _headers,
        _handleResponse,
        // auth
        login,
        // usuarios
        getCliente,
        getClientes,
        crearUsuario,
        actualizarUsuario,
        getUsuariosPanelAdmin,
        getInfoPerfilUsuario,
        // empleados
        getEmpleados,
        crearEmpleado,
        actualizarEmpleado,
        // citas
        obtenerCitasDetalles,
        crearCita,
        actualizarCita,
        // servicios
        getServicios,
        crearServicio,
        actualizarServicio,
        eliminarServicio,
// barberos
    getBarberosDisponibles,
    getServiciosDelBarbero,
    asignarServicioBarbero,
    desasignarServicioBarbero,
    cancelarCita,
        // servicios adicionales
        getServiciosAdicionales,
        // horarios
        getHorarioBarberia,
        getHorariosSemanales,
        // barberías
        obtenerBarberia
    };
})();