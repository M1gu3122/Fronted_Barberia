// registro.js completo:
/**
 * Módulo de autenticación para clientes.
 * @module api/auth
 */

(function () {
    "use strict";

    // ============================================================
    // NÚCLEO HTTP (ya existe en api.js, solo necesitamos adaptar su uso)
    // ============================================================

    const API_BASE = "http://127.0.0.1:8000";
    let token = sessionStorage.getItem("token");

    function _headers() {
        const h = { "Content-Type": "application/json" };
        if (token) h["Authorization"] = `Bearer ${token}`;
        
        // Si el login falla, intentamos actualizar token
        return h;
    }

    async function crearUsuario(data) {
        try {
            console.log("Enviando datos de usuario:", data);
            
            const response = await fetch(`${API_BASE}/usuarios/crear_usuario`, {
                method: "POST",
                headers: _headers(),
                body: JSON.stringify({
                    nombre: data.nombre,
                    apellido: data.apellido,
                    email: data.correo,
                    telefono: data.telefono,
                    contraseña: data.contrasena
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error en la API. Código de estado ${response.status}`);
            }
            
            const result = await response.json();
            
            // Verificamos si el backend nos devuelve un token
            if (result.token && typeof result.token === 'string') {
                sessionStorage.setItem('token', result.token);
                return true;
            } else {
                throw new Error("Formato de respuesta incorrecto del servidor");
            }
        } catch (error) {
            console.error("Error en registro:", error);
            
            // Guardamos el token actual antes de limpiarlo
            const currentToken = token || sessionStorage.getItem('token');
            if (!currentToken) {
                throw new Error("No hay token para autenticar");
            }
        }
    }

    // ============================================================
    // INTERFAZ DE USUARIO (UI)
    // ============================================================

    /**
     * Función para registrar un nuevo usuario.
     */
    async function registrarUsuario() {
        const nombre = document.getElementById('r-nombre').value.trim();
        const apellido = document.getElementById('r-apellido').value.trim();
        const correo = document.getElementById('r-correo').value;
        const telefono = document.getElementById('r-tel').value.trim();
        
        // Validación básica
        if (!nombre || !apellido || !correo || !telefono) {
            UI.toast("Error", "Por favor complete todos los campos.", "error");
            return false;
        }
        
        try {
            // Prevenir acción predeterminada del formulario
            event.preventDefault();
            
            const usuario = {
                nombre,
                apellido,
                email: correo,  // Renombramos para consistencia con el backend
                telefono,
                contraseña: document.getElementById('r-pass').value
            };
            
            UI.toggleCargando(true);
            await crearUsuario(usuario);
            
            if (token) {  // Si el servidor devuelve un token válido
                UI.toast("Éxito", "¡Registro completado! Ahora puede iniciar sesión.", "success");
                
                setTimeout(() => {
                    // Redirigir al usuario después de confirmar registro exitoso
                    location.href = "login.html";
                    
                    // Limpiar campos del formulario
                    document.getElementById('r-nombre').value = '';
                    document.getElementById('r-apellido').value = '';
                    document.getElementById('r-correo').value = '';
                    document.getElementById('r-tel').value = '';
                    document.getElementById('r-pass').value = '';
                }, 500);
            } else {
                UI.toast("Error", "No se pudo registrar. Intente nuevamente.", "error");
            }
            
        } catch (error) {
            console.error("Registro fallido:", error);
            UI.toast("Error", "El correo electrónico ya está registrado en el sistema.", "error"); // Mensaje genérico para evitar ataques
        } finally {
            UI.toggleCargando(false);  // Desactivamos el estado de carga independientemente del resultado
        }
        
        return false;
    }

    // ============================================================
    // EVENTOS DOM Y CONFIGURACIÓN
    // ============================================================

    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('registro-form');
        
        // Configuramos los toggles para mostrar/ocultar contraseñas
        document.querySelectorAll('.toggle-eye').forEach(function(toggle) {
            toggle.addEventListener('click', UI.toggleContrasena);
        });
        
        // Validación del formulario al enviarlo
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!UI.validarFormularioRegistro()) {
                UI.toast("Error", "Por favor corrija los campos incorrectos.", "error");
                return;
            }
            
            registrarUsuario();
        });
    });

    // ============================================================
    // EXPORTACIÓN DEL MÓDULO
    // ============================================================

    window.registro = {
        crearUsuario,
        registrarUsuario
    };
})();

// Exportamos globalmente para mantener la compatibilidad con el sistema existente
if (typeof window.api === 'undefined') {
    window.window.api = {};
}
window.window.api.registro = registro;
