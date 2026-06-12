// Productos.js - Lógica de la Página de Catálogo de Productos (Productos.html).

// Funcionalidades:
// Menú Móvil: Toggle del menú en pantallas pequeñas.
// Carga del Catálogo: Petición GET /api/productos a FastAPI y renderizado dinámico de tarjetas de producto agrupadas por categoría.
// Carrito de Compra: Función global addCarrito() que añade productos al localStorage y actualiza el badge contador de la navbar.
// Edición de Productos (solo comerciantes): Modal para modificar precio, descripción e imagen de un producto via PUT /api/productos/{id}.

document.addEventListener('DOMContentLoaded', () => {

    // MENU MOVIL

    const mobileBtn = document.getElementById('mobile-btn');
    const navLinks = document.getElementById('nav-links');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // CARGA DEL CATALOGO DESDE LA API

    const cargarCatalogo = async () => {
        try {
            const response = await fetch('/api/productos');
            if (!response.ok) {
                throw new Error(`No se pudo cargar el JSON. Status: ${response.status}`);
            }
            const data = await response.json();
            const contenedores = {
                pescados: document.getElementById('grid-pescados'),
                mariscos: document.getElementById('grid-mariscos'),
                cefalopodos: document.getElementById('grid-cefalopodos')
            };

            if (data.pescados) renderizarSeccion(data.pescados, contenedores.pescados);
            if (data.mariscos) renderizarSeccion(data.mariscos, contenedores.mariscos);
            if (data.cefalopodos) renderizarSeccion(data.cefalopodos, contenedores.cefalopodos);
        } catch (error) {
            console.error("Error cargando el catálogo:", error);
            const mainContainer = document.querySelector('main');
            if (mainContainer) {
                mainContainer.insertAdjacentHTML('afterbegin', `
                    <div style="background: #fff3cd; color: #856404; padding: 20px; border: 1px solid #ffeeba; margin: 20px; text-align: center;">
                        <p><strong>Aviso:</strong> No se pudo conectar con el catálogo de productos.</p>
                        <small>Consulta la consola (F12) para más detalles.</small>
                    </div>
                `);
            }
        }
    };

    const renderizarSeccion = (productos, contenedor) => {
        if (!contenedor || !productos) return;
        contenedor.innerHTML = '';
        let isLogged = false;
        let isComerciante = false;
        const sessionData = localStorage.getItem('usuarioSesion');

        if (sessionData) {
            isLogged = true;
            const currentUser = JSON.parse(sessionData);
            if (currentUser.rol === 'comerciante') {
                isComerciante = true;
            }
        }

        productos.forEach(p => {
            const article = document.createElement('article');
            article.className = 'product-card';
            let imgSrc = p.imagen && p.imagen !== "../img/" ? p.imagen : '/static/img/LogoPesca.png';
            if (imgSrc.startsWith('../img/')) {
                imgSrc = imgSrc.replace('../img/', '/static/img/');
            }

            article.innerHTML = `
                <img src="${imgSrc}" alt="${p.nombre}" class="product-img" onerror="this.src='/static/img/LogoPesca.png'">
                <div class="product-info">
                    <h3 class="product-name">${p.nombre}</h3>
                    <p class="product-desc" id="desc-${p.id}">${p.descripcion}</p>
                    <p class="product-price" id="precio-${p.id}">${Number(p.precio).toFixed(2)} € / kg</p>
                    ${isComerciante ?
                    `<button class="btn btn-carrito" onclick="openEditProductModal(${p.id}, '${p.nombre.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${p.precio}, '${p.descripcion.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, "\\n")}', '${p.imagen ? p.imagen.replace(/'/g, "\\'").replace(/"/g, '&quot;') : ""}')"><i class="fas fa-edit"></i> Editar producto</button>` :
                    (isLogged ? `<button class="btn btn-carrito" onclick="addCarrito(${p.id}, '${p.nombre.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${p.precio})"><i class="fas fa-cart-plus"></i> Añadir al carrito</button>` : '')
                }
                </div>
            `;
            contenedor.appendChild(article);
        });
    };

    // FUNCION GLOBAL: ANADIR AL CARRITO

    window.addCarrito = function (id, nombre, precio) {
        let carrito = [];
        try { carrito = JSON.parse(localStorage.getItem('carrito')) || []; } catch (e) { }
        const precioReal = parseFloat(precio);
        const index = carrito.findIndex(p => p.id === id);

        if (index !== -1) {
            carrito[index].cantidad = (carrito[index].cantidad || 1) + 1;
        } else {
            carrito.push({ id, nombre, precio: precioReal, cantidad: 1 });
        }

        localStorage.setItem('carrito', JSON.stringify(carrito));
        const badge = document.getElementById('cart-counter');
        if (badge) {
            badge.textContent = carrito.length;
            badge.style.transform = 'scale(1.5)';
            setTimeout(() => badge.style.transform = 'scale(1)', 200);
        }
        alert(`"${nombre}" se ha sumado a tu cesta.`);
    };

    // MODAL DE EDICION DE PRODUCTOS (COMERCIANTES)

    const modalEdit = document.getElementById('modal-edit-product');
    const formEdit = document.getElementById('form-edit-product');

    window.openEditProductModal = function (id, nombre, precio, descripcion, imagen) {
        if (!modalEdit) return;
        document.getElementById('edit_prod_id').value = id;
        document.getElementById('edit_prod_precio').value = precio;
        document.getElementById('edit_prod_desc').value = descripcion;
        document.getElementById('edit_prod_img_file').value = "";
        modalEdit.querySelector('h2').innerHTML = `<i class="fas fa-edit" style="color:var(--azul-claro);"></i> Editar <b>${nombre}</b>`;
        modalEdit.style.display = 'flex';
    };

    window.closeEditProductModal = function () {
        if (modalEdit) modalEdit.style.display = 'none';
        if (formEdit) formEdit.reset();
        document.getElementById('product-file-status').textContent = "";
    };

    if (formEdit) {
        const fileInput = document.getElementById('edit_prod_img_file');
        const fileStatus = document.getElementById('product-file-status');

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                fileStatus.innerHTML = `<b>Archivo seleccionado:</b> ${e.target.files[0].name}`;
                fileStatus.style.color = "var(--azul-oscuro)";
            } else {
                fileStatus.textContent = "";
            }
        });

        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formEdit.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            const id = document.getElementById('edit_prod_id').value;
            const precio = document.getElementById('edit_prod_precio').value;
            const desc = document.getElementById('edit_prod_desc').value;
            const fileInput = document.getElementById('edit_prod_img_file');

            const payload = {
                precio: parseFloat(precio),
                descripcion: desc.trim() || null
            };

            const sendRequest = async () => {
                try {
                    const res = await fetch(`/api/productos/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        alert('Producto actualizado con exito.');
                        closeEditProductModal();
                        cargarCatalogo();
                    } else {
                        const error = await res.json();
                        alert('Error: ' + error.detail);
                    }
                } catch (err) {
                    console.error(err);
                    alert('No se pudo conectar con el servidor.');
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-save" style="margin-right:8px;"></i> Guardar Cambios';
                }
            };

            if (fileInput.files && fileInput.files.length > 0) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    payload.imagen = evt.target.result;
                    sendRequest();
                };
                reader.onerror = function () {
                    alert("No se pudo leer la imagen seleccionada.");
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-save" style="margin-right:8px;"></i> Guardar Cambios';
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                sendRequest();
            }
        });
    }

    cargarCatalogo();
});