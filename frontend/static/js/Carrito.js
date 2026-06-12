// Logica de la pagina del carrito de compras y gestion de pedidos
// Controla la proteccion de rutas el renderizado de productos y el historial
document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('cart-items-container'); // Contenedor para los productos de la cesta
    const totalPriceEl = document.getElementById('cart-total-price');      // Elemento para mostrar el precio total
    const orderForm = document.getElementById('order-form');               // Formulario para procesar el pedido
    // Validacion de la sesion activa para permitir el acceso a la ruta
    const sessionData = localStorage.getItem('usuarioSesion');
    let currentUser = null;
    if (sessionData) {
        currentUser = JSON.parse(sessionData);
        // Autocompletar el campo de correo electronico con el valor de la sesion
        document.getElementById('correo_order').value = currentUser.email;
    } else {
        // Bloquear el acceso y redirigir a la pagina de ingreso si no hay sesion
        alert("Acceso denegado. Para comprar y ver la cesta, por favor inicia sesión.");
        window.location.href = "Login.html";
        return;
    }
    // Obtener los productos guardados en el carrito del almacenamiento local
    let carrito = [];
    try { carrito = JSON.parse(localStorage.getItem('carrito')) || []; } catch (e) { }
    // Control del sistema de pestañas de navegacion
    const tabBtns = document.querySelectorAll('.tab-btn');       // Botones de las pestañas
    const tabContents = document.querySelectorAll('.tab-content'); // Contenidos de las pestañas
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Desactivar todos los botones y contenidos de las pestañas
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            // Activar la pestaña seleccionada y su respectivo bloque de contenido
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });
    // Renderizado visual de la tabla de productos del carrito
    const drawCart = () => {
        if (carrito.length === 0) {
            // Mostrar mensaje de aviso y boton al catalogo si la cesta esta vacia
            listContainer.innerHTML = `
<div class="empty-cart">
<i class="fas fa-box-open" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
<h2 style="color:var(--azul-oscuro); font-size:1.6rem; margin-bottom:10px;">Tu cesta está vacía</h2>
<p style="color:#666;">¡Visita el catálogo de productos y llena tu mesa de frescura cantábrica!</p>
<a href="Productos.html" class="btn btn-carrito" style="margin-top:20px; display:inline-block; max-width:200px;">Ver Catálogo</a>
</div>`;
            totalPriceEl.textContent = "0.00 €";
            return;
        }
        // Construir la estructura de la tabla con los elementos del carrito
        let html = '<table class="cart-table" style="width: 100%; border-collapse: collapse;"><thead><tr style="border-bottom: 2px solid #eee;"><th style="width:50%; text-align:left; padding: 10px;">Producto Oficial</th><th style="text-align:center; padding: 10px;">Cantidad</th><th style="text-align:right; padding: 10px;">Precio Total</th><th style="text-align:center; padding: 10px;">Eliminar</th></tr></thead><tbody>';
        let total = 0;
        // Agregar una fila detallada por cada producto de la lista
        carrito.forEach((p, index) => {
            let cant = p.cantidad || 1;
            let precioKilo = parseFloat(p.precio);
            let subtotal = precioKilo * cant;
            total += subtotal;
            html += `
<tr style="border-bottom: 1px solid #f5f5f5;">
<td style="padding: 15px 10px;">
<strong style="color:var(--azul-oscuro); display:block; font-size:1.1rem;">${p.nombre}</strong>
<small style="color:#888;">${precioKilo.toFixed(2)} €/ud</small>
</td>
<td style="text-align:center; padding: 15px 10px;">
<div style="display:inline-flex; align-items:center; gap:8px; background: #f9f9f9; padding: 4px 8px; border-radius: 20px; border: 1px solid #eaeaea;">
<button type="button" class="btn-qty" onclick="updateQty(${index}, -1)" style="width: 25px; height: 25px; border-radius: 50%; border: none; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer; color: var(--azul-oscuro); font-weight:bold; display:flex; align-items:center; justify-content:center;">-</button>
<span style="font-weight:bold; min-width:25px; text-align:center; color: var(--azul-oscuro);">${cant}</span>
<button type="button" class="btn-qty" onclick="updateQty(${index}, 1)" style="width: 25px; height: 25px; border-radius: 50%; border: none; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer; color: var(--azul-oscuro); font-weight:bold; display:flex; align-items:center; justify-content:center;">+</button>
</div>
</td>
<td style="text-align:right; color:var(--naranja); font-weight:bold; font-size:1.1rem; padding: 15px 10px;">${subtotal.toFixed(2)} €</td>
<td style="text-align:center; padding: 15px 10px;"><button type="button" class="btn-remove" onclick="removeCartItem(${index})" style="background:none; border:none; color:#dc2626; cursor:pointer; font-size:1.2rem; transition: transform 0.2s;"><i class="fas fa-trash"></i></button></td>
</tr>
`;
        });
        html += '</tbody></table>';
        listContainer.innerHTML = html;
        totalPriceEl.textContent = total.toFixed(2) + " €";
    }
    // Modificar la cantidad de un producto sin permitir valores menores a uno
    window.updateQty = (index, delta) => {
        let cant = carrito[index].cantidad || 1;
        cant += delta;
        if (cant < 1) cant = 1;
        carrito[index].cantidad = cant;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        drawCart(); // Actualizar la vista para recalcular los importes totales
    }
    // Quitar un producto de la cesta utilizando su posicion en el arreglo
    window.removeCartItem = (index) => {
        carrito.splice(index, 1); // Quitar el elemento del arreglo por su indice
        localStorage.setItem('carrito', JSON.stringify(carrito)); // Guardar los cambios
        // Sincronizar el indicador numerico de la barra de navegacion
        const badge = document.getElementById('cart-counter');
        if (badge) badge.textContent = carrito.length > 0 ? carrito.length : '';
        drawCart(); // Reconstruir la tabla del carrito con los datos actualizados
    }
    // Invocar la funcion para mostrar los productos al cargar inicialmente
    drawCart();
    // Procesamiento y envio del formulario de pedido
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Validar que existan productos en la cesta antes del envio
            if (carrito.length === 0) {
                alert("Error: No se puede procesar un pedido vacio. Anade productos al carrito.");
                return;
            }
            // Obtener la sumatoria total del coste de todos los articulos
            let total = 0;
            carrito.forEach(p => {
                let cant = p.cantidad || 1;
                total += parseFloat(p.precio) * cant;
            });
            // Armar el objeto de datos con la informacion requerida para el servicio
            const payload = {
                nombre: currentUser.nombre || "Desconocido",
                apellidos: currentUser.apellidos || "Desconocido",
                correo: document.getElementById('correo_order').value,
                numero_telefono: document.getElementById('telefono_order').value.trim(),
                domicilio: document.getElementById('domicilio_order').value.trim(),
                precio_total: total,
                lista_productos: carrito,
                comentario: document.getElementById('comentario_order') ? document.getElementById('comentario_order').value.trim() : ""
            };
            // Modificar el estado del boton y mostrar animacion de carga de procesamiento
            const btnSubmit = document.getElementById('btn-submit-order');
            btnSubmit.disabled = true;
            btnSubmit.style.background = "#ccc";
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando Pedido...';
            try {
                // Realizar la solicitud de envio de datos al servicio correspondiente
                const response = await fetch('/hacer_pedido', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const data = await response.json();
                    alert(data.message);
                    // Vaciar los productos almacenados en local tras completar la operacion
                    localStorage.removeItem('carrito');
                    // Redireccionar al usuario a la pagina principal como confirmacion
                    window.location.href = "Inicio.html";
                } else {
                    // Restaurar el estado del boton original si ocurre un error del servidor
                    const errorBackend = await response.json();
                    alert("Interrupción Transaccional: " + errorBackend.detail);
                    btnSubmit.disabled = false;
                    btnSubmit.style.background = "var(--azul-oscuro)";
                    btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Solicitar Pedido';
                }
            } catch (err) {
                // Restaurar el boton si ocurre un problema de conexion con la red
                alert("Los servidores de transacciones no están localizables ahora mismo.");
                btnSubmit.disabled = false;
                btnSubmit.style.background = "var(--azul-oscuro)";
                btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Solicitar Pedido';
            }
        });
    }
    // Gestion y renderizado del historial de compras del usuario logueado
    const ordersContainer = document.getElementById('user-orders-container');
    if (ordersContainer && currentUser && currentUser.email) {
        // Obtener el registro de compras previas consultando el servicio web
        const loadUserOrders = async () => {
            try {
                // Realizar una consulta de lectura filtrando por la direccion de correo
                const req = await fetch(`/api/mis_pedidos/${encodeURIComponent(currentUser.email)}`);
                if (!req.ok) return;
                const historial = await req.json();
                if (historial.length === 0) {
                    ordersContainer.innerHTML = '<p style="color:#666;">Aún no tienes pedidos registrados en tu historial.</p>';
                } else {
                    let htmlList = '';
                    historial.forEach(ped => {
                        // Determinar los estilos visuales dependiendo del estado de la compra
                        let badgeColor = '#999';
                        let bgBadge = '#eee';
                        if (ped.estado === 'pendiente') { badgeColor = '#d97706'; bgBadge = '#fffbeb'; }
                        if (ped.estado === 'visto') { badgeColor = '#2563eb'; bgBadge = '#eff6ff'; }
                        if (ped.estado === 'entregado') { badgeColor = '#059669'; bgBadge = '#ecfdf5'; }
                        if (ped.estado === 'cancelado') { badgeColor = '#dc2626'; bgBadge = '#fef2f2'; }
                        // Procesar la informacion de los productos que puede llegar serializada
                        let productosParsed = [];
                        try {
                            productosParsed = typeof ped.lista_productos === 'string' ? JSON.parse(ped.lista_productos) : ped.lista_productos;
                        } catch (e) {
                            productosParsed = [];
                        }
                        // Generar una lista estructurada de los elementos comprados con sus cantidades
                        let prodsHtml = '<ul style="margin: 5px 0 0 5px; padding: 0; list-style-type: none;">';
                        productosParsed.forEach(pr => {
                            let cantStr = pr.cantidad ? `<span style="color:var(--naranja); font-weight:bold; font-size:0.9em; margin-left:5px;">x${pr.cantidad}</span>` : '';
                            prodsHtml += `<li style="margin-bottom: 4px;">• <b>${pr.nombre}</b>${cantStr}</li>`;
                        });
                        prodsHtml += '</ul>';
                        // Ensamblar el bloque de contenido para cada tarjeta de compra
                        htmlList += `
<div style="background: white; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap:10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid var(--naranja);">
<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">
<strong style="color:var(--azul-oscuro); font-size:1.1rem;">Pedido #${ped.id}</strong>
<span style="background-color:${bgBadge}; color:${badgeColor}; font-weight:bold; padding:4px 10px; border-radius:15px; font-size:0.85rem; text-transform:uppercase;">${ped.estado}</span>
</div>
<div style="color:#555; font-size:0.95rem;">
<div style="display: flex; align-items: flex-start;">
<i class="fas fa-boxes" style="width:20px; color:var(--azul-claro); margin-top:4px;"></i>
<div style="flex: 1;">${prodsHtml}</div>
</div>
<div style="margin-top: 5px;"><i class="fas fa-money-bill-wave" style="width:20px; color:var(--azul-claro);"></i> Precio Final: <b>${ped.precio_total.toFixed(2)} €</b></div>
${ped.comentario ? `<div style="margin-top: 5px; font-style:italic;"><i class="fas fa-comment-dots" style="width:20px; color:var(--azul-claro);"></i> ${ped.comentario}</div>` : ''}
</div>
</div>
`;
                    });
                    ordersContainer.innerHTML = htmlList;
                }
            } catch (err) {
                console.error("Error cargando el historial", err);
            }
        };
        // Ejecutar de forma automatica la carga de compras al iniciar la vista
        loadUserOrders();
    }
});