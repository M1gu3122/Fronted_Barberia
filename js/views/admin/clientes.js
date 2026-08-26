/* ============================================================
   Barberia El Corte Perfecto - Vistas de Administracion - Clientes
   ============================================================ */
(function () {
  "use strict";

  function rClientesAdmin() {
    var html = `
      <section class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:12px;">
          <div><div class="card-title">Clientes</div><div class="card-sub" id="clientes-count">Cargando clientes...</div></div>
          <div style="margin-left:auto;" class="filters">
            <div class="input-wrap"><i class="fas fa-magnifying-glass" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--mist);font-size:13px;"></i>
            <input class="input" id="buscar-cliente" placeholder="Buscar por nombre, telefono..." style="padding-left:32px;min-width:230px;"></div>
            <button class="btn btn-primary btn-sm" id="nuevo-cliente"><i class="fas fa-plus"></i> Nuevo cliente</button>
          </div>
        </div>
        <div class="table-wrap"><table class="table table-responsive"><thead><tr>
          ${["Cliente", "Identificacion", "Telefono", "Correo", "Citas", "Acciones"].map(function (h) { return `<th>${h}</th>`; }).join("")}
        </tr></thead><tbody id="clientes-tbody"><tr><td colspan="6" class="cell-muted" style="text-align:center;padding:20px;">Cargando clientes...</td></tr></tbody></table></div>
      </section>`;

    api.getUsuariosPanelAdmin()
      .then(function (lista) {
        var tbody = document.getElementById("clientes-tbody");
        if (!tbody) return;
        var count = document.getElementById("clientes-count");
        lista = lista || [];
        if (count) count.textContent = lista.length + " registrados";
        if (!lista.length) {
          tbody.innerHTML = `<tr><td colspan="6" class="cell-muted" style="text-align:center;padding:20px;">Sin clientes registrados</td></tr>`;
          return;
        }
        tbody.innerHTML = lista.map(function (cl) {
          return `
            <tr>
              <td data-label="Cliente"><div style="display:flex;align-items:center;gap:10px;">${UI.avatar(cl.nombres)}
                <span class="cell-primary">${cl.nombres}</span></div></td>
              <td data-label="Identificacion">${cl.id_usuario}</td>
              <td data-label="Telefono">${cl.telefono}</td>
              <td data-label="Correo" class="cell-muted">${cl.correo}</td>
              <td data-label="Citas">${cl.cantidad_citas}</td>
              <td data-label="Acciones"><div class="actions">
                <button class="btn btn-icon btn-ghost" data-perfil-cliente="${cl.id_usuario}" title="Ver perfil"><i class="fas fa-user"></i></button>
                <button class="btn btn-icon btn-ghost" data-editar-cliente="${cl.id_usuario}" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn btn-icon btn-ghost" data-historial-cliente="${cl.id_usuario}" title="Historial"><i class="fas fa-clock-rotate-left"></i></button>
                <button class="btn btn-icon btn-ghost" data-cambiar-pass="${cl.id_usuario}" title="Cambiar contraseña"><i class="fas fa-key"></i></button>
              </div></td>
            </tr>`;
        }).join("");
      })
      .catch(function (err) {
        var tbody = document.getElementById("clientes-tbody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="cell-muted" style="text-align:center;padding:20px;">Error al cargar clientes</td></tr>`;
        var count = document.getElementById("clientes-count");
        if (count) count.textContent = "Error al cargar";
        console.error("Backend error:", err);
      });

    return html;
  }

  function bindClientesAdmin() {
    var region = App.el("view-region");
    if (!region) return;

    var buscar = region.querySelector("#buscar-cliente");
    if (buscar) buscar.addEventListener("input", function () {
      var q = buscar.value.toLowerCase();
      region.querySelectorAll("tbody tr").forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().indexOf(q) > -1 ? "" : "none";
      });
    });

    var nuevo = region.querySelector("#nuevo-cliente");
    if (nuevo) nuevo.addEventListener("click", async function () { abrirFormCliente(null); });

    if (region._clientesClick) region.removeEventListener("click", region._clientesClick);
region._clientesClick = function (e) {
      var perfil = e.target.closest("[data-perfil-cliente]");
      if (perfil) abrirPerfilCliente(+perfil.getAttribute("data-perfil-cliente"));
      var editar = e.target.closest("[data-editar-cliente]");
      if (editar) abrirFormCliente(+editar.getAttribute("data-editar-cliente"));
      var hist = e.target.closest("[data-historial-cliente]");
      if (hist) abrirHistorialCliente(+hist.getAttribute("data-historial-cliente"));
      var pass = e.target.closest("[data-cambiar-pass]");
      if (pass) {
        var idUsuario = +pass.getAttribute("data-cambiar-pass");
        var m = UI.modal({
          titulo: "Restablecer contraseña",
          icon: '<i class="fas fa-key"></i>',
          body: `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field"><label class="field-label">Nueva contraseña <span class="req">*</span></label><input class="input" type="password" id="nueva-pass" placeholder="Min. 6 caracteres"></div>
              <div class="field"><label class="field-label">Confirmar <span class="req">*</span></label><input class="input" type="password" id="confirm-pass" placeholder="••••••••"></div>
            </div>`,
          footer: `
            <button class="btn btn-ghost" data-cerrar-modal>Cerrar</button>
            <button class="btn btn-primary" id="confirm-pass-btn">Restablecer</button>`
        });
        // Directly add event listener to the buttons in the modal
        setTimeout(function () {
          document.querySelector("#confirm-pass-btn").addEventListener("click", async function () {
            var nueva = document.querySelector("#nueva-pass").value;
            var confirm = document.querySelector("#confirm-pass").value;
            if (!nueva || !confirm) {
              UI.toast("Campos vacíos", "Complete ambos campos.", "error");
              return;
            }
            if (nueva.length < 6) {
              UI.toast("Contraseña corta", "La nueva contraseña debe tener al menos 6 caracteres.", "error");
              return;
            }
            if (nueva !== confirm) {
              UI.toast("Error", "Las contraseñas no coinciden.", "error");
              return;
            }
            var btn = document.querySelector("#confirm-pass-btn");
            btn.classList.add("btn-loading");
            btn.disabled = true;
            try {
              await api.resetPasswordAdmin(idUsuario, nueva);
              m.close();
              UI.toast("Éxito", "La contraseña fue restablecida correctamente.", "success");
            } catch (err) {
              console.error("Error restableciendo contraseña:", err);
              var msg = (Array.isArray(err && err.detail) ? "Revise los datos enviados." : (err && err.message)) || "No se pudo restablecer la contraseña.";
              UI.toast("Error", msg, "error");
            } finally {
              btn.classList.remove("btn-loading");
              btn.disabled = false;
            }
          });
        }, 30);
      }
    };
    region.addEventListener("click", region._clientesClick);
  }

  function abrirPerfilCliente(id) {
    var modal = UI.modal({
      titulo: "Perfil del cliente",
      icon: '<i class="fas fa-user"></i>',
      body: `<div class="cell-muted" style="text-align:center;padding:20px;">Cargando perfil...</div>`,
      footer:
        `
        <button class="btn btn-ghost" data-cerrar-modal>Cerrar</button>
        <button class="btn btn-primary" data-cerrar-modal>Entendido</button>
        `
    });

    setTimeout(function () {
      modal.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", function () {
          document.querySelectorAll(".modal-overlay").forEach(function (o) { o.remove(); });
          document.body.style.overflow = "";
        });
      });
    }, 30);

    api.getInfoPerfilUsuario(id)
      .then(function (arr) {

        var c = modal.overlay.querySelector(".modal-body");
        if (!c) return;
        if (!arr || !arr.length) {
          c.innerHTML = `<div class="cell-muted" style="text-align:center;padding:20px;">Sin informacion del cliente.</div>`;
          return;
        }
        var u = arr[0];
        var nombreBarbero = arr[0].nombres_barbero + " " + arr[0].apellidos_barbero

        var citas = arr.filter(function (x) { return x.id_cita != null; });
        var completadas = citas.filter(function (x) { return x.estado_cita === "completada"; }).length;
        var canceladas = citas.filter(function (x) { return x.estado_cita === "cancelada"; }).length;
        var completas = citas.filter(function (x) { return x.estado_cita === "completada"; });
        var ultimo = completas.sort(function (a, b) { return a.fecha_hora < b.fecha_hora ? 1 : -1; })[0];
        var ultimoS = ultimo ? ultimo.tipo_servicio : "—";

        var html = `
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
            ${UI.avatar(u.nombres, "avatar-lg")}
            <div><div style="font-size:16px;font-weight:700;">${u.nombres} ${u.apellidos || ""}</div>
            <div class="cell-muted">${u.telefono} · ${u.correo}</div></div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;">
            ${[[citas.length, "Total citas"], [completadas, "Completadas"], [canceladas, "Canceladas"]].map(function (k) {
              return `
                <div style="text-align:center;padding:10px 4px;background:var(--sand);border-radius:9px;"><div style="font-size:16px;font-weight:700;">${k[0]}</div>
                  <div class="cell-muted" style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;">${k[1]}</div></div>`;
            }).join("")}
          </div>
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--smoke);margin-bottom:10px;">Historial de citas</div>
          <div style="display:grid;gap:8px;">
            ${citas.length ? citas.slice(0, 5).map(function (x) {
              return `
                <div class="appt-tile ${x.estado_cita.toLowerCase()}">
                  <div class="appt-time">${x.fecha_hora ? x.fecha_hora.substr(11, 5) : ""}</div>
                  <div class="appt-main"><div class="appt-title">${x.servicios}</div>
                  <div class="appt-sub">Barbero #${nombreBarbero} · ${DB.formatFechaLarga(x.fecha_hora ? x.fecha_hora.substr(0, 10) : "")}</div></div>
                  ${UI.estadoBadge(x.estado_cita.toLowerCase())}
                </div>`;
            }).join("") : `<div class="cell-muted" style="text-align:center;padding:20px;">Sin citas registradas.</div>`}
          </div>`;

        c.innerHTML = html;
      })
      .catch(function (err) {
        var c = modal.overlay.querySelector(".modal-body");
        if (c) c.innerHTML = `<div class="cell-muted" style="text-align:center;padding:20px;">Error al cargar el perfil.</div>`;
        console.error("Backend error:", err);
      });

    return modal;
  }

  async function abrirFormCliente(id) {
    var cl = null;
    if (id) {
      try { cl = await api.getCliente(id); } catch (e) { UI.toast("Error", e.message || "No se pudo cargar el cliente.", "error"); }
    }
    var m = UI.modal({
      titulo: cl ? "Editar cliente" : "Nuevo cliente",
      icon: '<i class="fas fa-user-plus"></i>',
      body:
        `
        <div style="display:grid;gap:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field"><label class="field-label">Identificacion <span class="req">*</span></label><input class="input" id="cl-id_usuario" value="${cl ? cl.id_usuario : ""}"></div>
            <div class="field"><label class="field-label">Nombres <span class="req">*</span></label><input class="input" id="cl-nombres" value="${cl ? cl.nombres : ""}"></div>
            <div class="field"><label class="field-label">Apellidos <span class="req">*</span></label><input class="input" id="cl-apellidos" value="${cl ? cl.apellidos : ""}"></div>
            <div class="field"><label class="field-label">Telefono <span class="req">*</span></label><input class="input" id="cl-telefono" value="${cl ? cl.telefono : ""}"></div>
          </div>
          <div class="field" style="margin-bottom:12px;"><label class="field-label">Correo <span class="req">*</span></label><input class="input" type="email" id="cl-correo" value="${cl ? cl.correo : ""}"></div>
        </div>
        `,


      footer:
        `
        <button class="btn btn-ghost " data-cerrar-modal>Cancelar</button>
        <button class="btn btn-primary" data-guardar>Guardar</button>
        `
    });
    setTimeout(function () {
      m.overlay.querySelector("[data-guardar]").addEventListener("click", async function () {
        // crear nombre usuario
        var n = m.overlay.querySelector("#cl-nombres").value.trim().toLowerCase();
        var a = m.overlay.querySelector("#cl-apellidos").value.trim().toLowerCase();

        var usuario = n.split(" ")[0] + "." + a.split(" ")[0];

        console.log(usuario);

        var nombreUsuario = n + a


        var data = {
          id_usuario: m.overlay.querySelector("#cl-id_usuario").value,
          nombres: m.overlay.querySelector("#cl-nombres").value,
          apellidos: m.overlay.querySelector("#cl-apellidos").value,
          usuario: nombreUsuario,
          contraseña: m.overlay.querySelector("#cl-id_usuario").value,
          correo: m.overlay.querySelector("#cl-correo").value,
          telefono: m.overlay.querySelector("#cl-telefono").value


        }

        if (!data.nombres || !data.telefono || !data.correo || !data.apellidos || !data.id_usuario) {
          UI.toast("Datos incompletos", "Todos los campos son obligatorios.", "error");
          return;
        }
        console.log(data);

        try {
          if (cl) {
            await api.actualizarUsuario(cl.id_usuario, data);
          } else {
            await api.crearUsuario(data,);
          }
          UI.toast(cl ? "Cliente actualizado" : "Cliente creado", "Los datos fueron guardados.", "success");
          m.close();
          App.navigate("clientes");
        } catch (err) {
          UI.toast("Error", err.message || "No se pudo guardar el cliente.", "error");
          console.error("Backend error:", err);
        }
      });
      m.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", async function () { m.close(); });
      });
    }, 30);
  }

  function abrirHistorialCliente(id) {
    var modal = UI.modal({
      titulo: "Historial de citas",
      icon: '<i class="fas fa-clock-rotate-left"></i>',
      body: `<div class="cell-muted" style="text-align:center;padding:20px;">Cargando historial...</div>`,
      footer: `<button class="btn btn-ghost" data-cerrar-modal>Cerrar</button>`
    });

    setTimeout(function () {
      modal.overlay.querySelectorAll("[data-cerrar-modal]").forEach(function (b) {
        b.addEventListener("click", function () {
          document.querySelectorAll(".modal-overlay").forEach(function (o) { o.remove(); });
          document.body.style.overflow = "";
        });
      });
    }, 2);

    api.getInfoPerfilUsuario(id)
      .then(function (arr) {
        var nombreBarbero = arr[0].nombres + " " + arr[0].apellidos
        var c = modal.overlay.querySelector(".modal-body");
        if (!c) return;
        if (!arr || !arr.length) {
          c.innerHTML = `<div class="cell-muted" style="text-align:center;padding:20px;">Sin informacion del cliente.</div>`;
          return;
        }
        var u = arr[0];
        var citas = arr.filter(function (x) { return x.id_cita != null; })
          .sort(function (a, b) { return a.fecha_hora < b.fecha_hora ? 1 : -1; });

        var html = `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            ${UI.avatar(u.nombres)}
            <div><div style="font-weight:700;">${u.nombres} ${u.apellidos || ""}</div>
            <div class="cell-muted">${citas.length} citas registradas</div></div>
          </div>
          <div style="display:grid;gap:8px;">
            ${citas.length ? citas.map(function (x) {
              return `
                <div class="appt-tile ${x.estado_cita.toLowerCase()}">
                  <div class="appt-time">${x.fecha_hora ? x.fecha_hora.substr(11, 5) : ""}</div>
                  <div class="appt-main"><div class="appt-title">${x.servicios}</div>
                  <div class="appt-sub">Barbero : ${nombreBarbero} · ${DB.formatFechaLarga(x.fecha_hora ? x.fecha_hora.substr(0, 10) : "")}</div></div>
                  ${UI.estadoBadge(x.estado_cita.toLowerCase())}
                </div>`;
            }).join("") : `<div class="cell-muted" style="text-align:center;padding:20px;">Sin historial.</div>`}
          </div>`;

        c.innerHTML = html;
      })
      .catch(function (err) {
        var c = modal.overlay.querySelector(".modal-body");
        if (c) c.innerHTML = `<div class="cell-muted" style="text-align:center;padding:20px;">Error al cargar el historial.</div>`;
        console.error("Backend error:", err);
      });

    return modal;
  }

  /* Registro de vistas */
  /* Compartidas con recepcionista */
  App.registerVista("admin", "clientes", rClientesAdmin, bindClientesAdmin);
  App.registerVista("recepcion", "clientes", rClientesAdmin, bindClientesAdmin);
})();