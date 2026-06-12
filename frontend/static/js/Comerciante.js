// Comerciante.js - Lógica del Panel de Gestión del Comerciante (Comerciante.html).

// Funcionalidades:
// Protección de Ruta: Solo accesible para usuarios con rol 'comerciante'.
// Pestañas de Pedidos: Filtrado por estado (Pendientes/Vistos, Entregados, Cancelados).
// Tarjetas de Pedido: Visualización detallada con datos del cliente, productos y acciones.
// Gestion de Estados: Cambiar estado de pedidos (pendiente, visto, entregado, cancelado).
// Modificación de Precios: Ajustar el precio total de un pedido.
// Sección de Comentarios: Visualización de mensajes del formulario de contacto.
// Navegación por URL: Auto-selección de sección/pestaña según parámetros de query string.

document.addEventListener('DOMContentLoaded', () => {


    // Verificar que el usuario tiene sesión activa
    const sessionData = localStorage.getItem('usuarioSesion');
    if (!sessionData) {
        window.location.href = "Login.html";
        return;
    }

    // Verificar que el rol del usuario es 'comerciante'
    const user = JSON.parse(sessionData);
    if (user.rol !== 'comerciante') {
        alert("Acceso denegado. Esta sección es solo para comerciantes.");
        window.location.href = "Inicio.html";
        return;
    }

    // Sistema de pestañas de pedidos

    const tabBtns = document.querySelectorAll('.tab-btn');       // Botones de pestaña
    const tabContents = document.querySelectorAll('.tab-content'); // Contenidos de cada pestaña

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Desactivar todas las pestañas y contenidos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            // Activar la pestaña clicada y su contenido asociado
            btn.classList.add('active');
            const targetId = `tab-${btn.dataset.tab}`;
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // Referencias a las secciones principales del panel
    const secPedidos = document.getElementById('section-pedidos');       // Sección de pedidos
    const secComentarios = document.getElementById('section-comentarios'); // Sección de comentarios

    // carga de pedidos desde la api

    // Obtiene todos los pedidos del servidor y los distribuye en las pestañas.
    async function fetchPedidos() {
        try {
            const resp = await fetch('/api/pedidos');
            if (!resp.ok) throw new Error("Error fetching pedals");
            const pedidos = await resp.json();
            renderPedidos(pedidos);
        } catch (error) {
            console.error("Error al obtener pedidos:", error);
            alert("No se pudieron cargar los pedidos.");
        }
    }

    // Renderizado en pestañas de pedidos

    // Distribuye los pedidos en las pestañas correctas según su estado
    // y crea una tarjeta visual para cada uno.
    //
    // @param {Array} pedidos Lista de objetos pedido del servidor.
    function renderPedidos(pedidos) {
        // Referencias a los contenedores de cada pestaña
        const pendientesContainer = document.getElementById('tab-pendientes');
        const entregadosContainer = document.getElementById('tab-entregados');
        const canceladosContainer = document.getElementById('tab-cancelados');

        // Limpiar contenido previo de las tres pestañas
        pendientesContainer.innerHTML = '';
        entregadosContainer.innerHTML = '';
        canceladosContainer.innerHTML = '';

        if (pedidos.length === 0) {
            pendientesContainer.innerHTML = "<p>No hay pedidos pendientes.</p>";
            return;
        }

        // Clasificar cada pedido en su pestaña correspondiente
        pedidos.forEach(p => {
            const card = createPedidoCard(p);

            if (p.estado === 'pendiente' || p.estado === 'visto') {
                pendientesContainer.appendChild(card);  // Pendientes y vistos van juntos
            } else if (p.estado === 'entregado') {
                entregadosContainer.appendChild(card);
            } else if (p.estado === 'cancelado') {
                canceladosContainer.appendChild(card);
            }
        });
    }

    // Crea el elemento DOM de una tarjeta de pedido con toda su información y botones de acción.
    //
    // La tarjeta incluye:
    // Cabecera: ID del pedido, nombre del cliente y badge de estado.
    // Cuerpo: Datos de contacto (teléfono, email, dirección) y lista de productos.
    // Comentario: Instrucciones especiales del cliente (si las hay).
    // Pie: Precio total y botones de acción según el estado actual.
    //
    // @param {Object} pedido Objeto con los datos completos del pedido.
    // @returns {HTMLElement} Elemento <div> con la tarjeta del pedido.
    function createPedidoCard(pedido) {
        const div = document.createElement('div');
        div.className = 'order-card';

        // Lista de productos
        let prodHtml = "";
        let productosParsed = [];
        try {
            // La lista puede venir como string JSON o como array directo
            productosParsed = typeof pedido.lista_productos === 'string' ? JSON.parse(pedido.lista_productos) : pedido.lista_productos;
        } catch (e) {
            productosParsed = [];
        }

        // Crear un <li> por cada producto con nombre y precio/cantidad
        productosParsed.forEach(pr => {
            let infoExtra = "";
            if (pr.precio !== undefined) {
                infoExtra = `<span style="color:var(--naranja);font-weight:bold;">${parseFloat(pr.precio).toFixed(2)}€</span>`;
            } else if (pr.cantidad !== undefined) {
                infoExtra = `<span style="color:var(--naranja);font-weight:bold;">x${pr.cantidad}</span>`;
            }
            prodHtml += `<li><span>${pr.nombre}</span> ${infoExtra}</li>`;
        });

        // Badge de estado
        const statusClass = `status-${pedido.estado}`; // Clase CSS para colorear el badge
        let statusLabel = pedido.estado;

        // Bloque de comentario (si existe)
        const commentHtml = pedido.comentario
            ? `<div class="order-comment"><i class="fas fa-comment-alt"></i> <strong>Comentario:</strong> ${pedido.comentario}</div>`
            : '';

        // Botones de accion dinamicos segun estado
        let buttonsHtml = '';

        // Botón "Cambiar Precio" disponible en todos los estados excepto cancelado
        if (pedido.estado !== 'cancelado') {
            buttonsHtml += `<button class="btn-action btn-change-price" onclick="changePrice(${pedido.id}, ${pedido.precio_total})">
                                <i class="fas fa-edit"></i> Cambiar P. Final
                            </button>`;
        }

        // Botones específicos según el estado actual del pedido
        if (pedido.estado === 'pendiente') {
            // Estado PENDIENTE: puede aceptar (a visto) o cancelar
            buttonsHtml += `<button class="btn-action btn-accept" onclick="changeStatus(${pedido.id}, 'visto')">
                                <i class="fas fa-eye"></i> Aceptar (Visto)
                            </button>`;
            buttonsHtml += `<button class="btn-action btn-cancel" onclick="changeStatus(${pedido.id}, 'cancelado')">
                                <i class="fas fa-times"></i> Cancelar
                            </button>`;
        } else if (pedido.estado === 'visto') {
            // Estado VISTO: puede entregar, volver a pendiente o cancelar
            buttonsHtml += `<button class="btn-action btn-deliver" onclick="changeStatus(${pedido.id}, 'entregado')">
                                <i class="fas fa-box-open"></i> Pedido Entregado
                            </button>`;
            buttonsHtml += `<button class="btn-action btn-revert" onclick="changeStatus(${pedido.id}, 'pendiente')">
                                <i class="fas fa-undo"></i> Volver a Pendiente
                            </button>`;
            buttonsHtml += `<button class="btn-action btn-cancel" onclick="changeStatus(${pedido.id}, 'cancelado')">
                                <i class="fas fa-times"></i> Cancelar
                            </button>`;
        } else if (pedido.estado === 'entregado') {
            // Estado ENTREGADO: solo puede volver a visto
            buttonsHtml += `<button class="btn-action btn-revert" onclick="changeStatus(${pedido.id}, 'visto')">
                                <i class="fas fa-undo"></i> Volver a Visto
                            </button>`;
        } else if (pedido.estado === 'cancelado') {
            // Estado CANCELADO: puede restaurar a pendiente
            buttonsHtml += `<button class="btn-action btn-revert" onclick="changeStatus(${pedido.id}, 'pendiente')">
                                <i class="fas fa-undo"></i> Restaurar Pedido
                             </button>`;
        }

        // Construir el HTML completo de la tarjeta del pedido
        div.innerHTML = `
            <div class="order-header">
                <div class="order-title">
                    <span class="order-id">#${pedido.id}</span>
                    ${pedido.nombre} ${pedido.apellidos}
                </div>
                <div class="order-status ${statusClass}">${statusLabel}</div>
            </div>
            
            <div class="order-body">
                <div class="order-info">
                    <p><i class="fas fa-phone"></i> ${pedido.numero_telefono}</p>
                    <p><i class="fas fa-envelope"></i> ${pedido.correo}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${pedido.domicilio}</p>
                </div>
                <div class="order-products">
                    <strong>Productos (${pedido.lista_productos.length}):</strong>
                    <ul>${prodHtml}</ul>
                </div>
            </div>
            
            ${commentHtml}

            <div class="order-footer">
                <div class="order-total">${pedido.precio_total.toFixed(2)} €</div>
                <div class="order-actions">
                    ${buttonsHtml}
                </div>
            </div>
        `;

        return div;
    }

    // Funciones globales de gestion

    // Cambiar el estado de un pedido (con confirmación del comerciante).
    //
    // @param {number} id ID del pedido.
    // @param {string} nuevoEstado Nuevo estado a aplicar ('visto', 'entregado', 'cancelado', 'pendiente').
    window.changeStatus = async (id, nuevoEstado) => {
        if (!confirm(`¿Estás seguro de cambiar el estado a '${nuevoEstado}'?`)) return;

        try {
            const resp = await fetch(`/api/pedidos/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (resp.ok) {
                fetchPedidos(); // Recargar todos los pedidos para reflejar el cambio
            } else {
                const data = await resp.json();
                alert(data.detail || "Hubo un error al cambiar el estado.");
            }
        } catch (e) {
            alert("Error de conexión con el servidor.");
        }
    };

    // Modificar el precio total de un pedido mediante un diálogo prompt().
    //
    // @param {number} id ID del pedido.
    // @param {number} currentPrice Precio actual del pedido (se muestra como valor por defecto).
    window.changePrice = async (id, currentPrice) => {
        let newPrice = prompt("Introduce el nuevo precio total:", currentPrice);
        if (newPrice === null) return; // El usuario canceló el diálogo
        newPrice = parseFloat(newPrice);
        if (isNaN(newPrice)) {
            alert("Precio inválido.");
            return;
        }

        try {
            const resp = await fetch(`/api/pedidos/${id}/precio`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ precio_total: newPrice })
            });
            if (resp.ok) {
                fetchPedidos(); // Recargar pedidos para mostrar el nuevo precio
            } else {
                alert("Error al cambiar el precio.");
            }
        } catch (e) {
            alert("Error de conexión con el servidor.");
        }
    }

    // Sección de comentarios de contacto

    // Obtiene todos los comentarios del servidor y los renderiza.
    async function fetchComentarios() {
        try {
            const resp = await fetch('/api/comentarios');
            if (resp.ok) {
                const comentarios = await resp.json();
                renderComentarios(comentarios);
            }
        } catch (error) {
            console.error("Error al obtener comentarios:", error);
        }
    }

    // Renderiza los comentarios de contacto como tarjetas reutilizando
    // los estilos de las tarjetas de pedido para mantener consistencia visual.
    //
    // @param {Array} comentarios Lista de objetos comentario del servidor.
    function renderComentarios(comentarios) {
        const container = document.getElementById('comentarios-container');
        if (!container) return;

        container.innerHTML = '';
        if (comentarios.length === 0) {
            container.innerHTML = "<p>El buzón está vacío. No hay sugerencias.</p>";
            return;
        }

        // Crear una tarjeta por cada comentario con nombre, email, fecha y mensaje
        comentarios.forEach(c => {
            const div = document.createElement('div');
            // Usar un diseño de tarjeta premium con hover effect
            div.className = 'comment-card';
            div.style.cssText = "background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eaeaea; transition: transform 0.3s ease, box-shadow 0.3s ease;";

            // Hover events simulados por JS para una mejor experiencia interactiva
            div.onmouseover = () => { div.style.transform = "translateY(-5px)"; div.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)"; };
            div.onmouseout = () => { div.style.transform = "translateY(0)"; div.style.boxShadow = "0 4px 15px rgba(0,0,0,0.05)"; };

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--azul-oscuro) 0%, var(--azul-claro) 100%); display: flex; justify-content: center; align-items: center; color: white; font-size: 1.5rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: var(--azul-oscuro); font-size: 1.2rem; font-weight: 700;">${c.nombre_completo}</h3>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9rem; display: flex; align-items: center; gap: 5px;">
                                <i class="fas fa-envelope" style="color: var(--naranja);"></i> ${c.correo}
                            </p>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; color: #555; display: flex; align-items: center; gap: 6px; border: 1px solid #eee;">
                        <i class="far fa-clock"></i> ${c.fecha}
                    </div>
                </div>
                <div style="position: relative; padding: 20px; background: #f8fbff; border-radius: 10px; border-left: 4px solid var(--azul-claro);">
                    <i class="fas fa-quote-left" style="position: absolute; top: 10px; left: 10px; font-size: 2.5rem; color: rgba(0,0,0,0.03);"></i>
                    <p style="margin: 0; white-space: pre-wrap; font-size: 1.05rem; line-height: 1.6; color: #333; position: relative; z-index: 1; font-style: italic;">${c.comentario}</p>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // Inicializacion y globalización de url

    // Cargar pedidos y comentarios al iniciar la página
    fetchPedidos();
    fetchComentarios();

    // Leer parámetros de la URL para auto-navegar a la sección correcta
    // Ejemplo: Comerciante.html?tab=comentarios abre la seccion de comentarios
    const urlParams = new URLSearchParams(window.location.search);
    const tabQuery = urlParams.get('tab');

    if (tabQuery === 'comentarios') {
        // Mostrar sección de comentarios y ocultar pedidos
        if (secPedidos) secPedidos.style.display = 'none';
        if (secComentarios) secComentarios.style.display = 'block';
    } else {
        // Mostrar sección de pedidos (por defecto)
        if (secPedidos) secPedidos.style.display = 'block';
        if (secComentarios) secComentarios.style.display = 'none';

        // Auto-seleccionar la sub-pestaña de pedidos si se indica en la URL
        // Ejemplo: ?tab=entregados activa la pestana de entregados
        if (tabQuery) {
            const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabQuery}"]`);
            if (targetBtn) {
                setTimeout(() => targetBtn.click(), 50); // Pequeño delay para que el DOM esté listo
            }
        }
    }
});