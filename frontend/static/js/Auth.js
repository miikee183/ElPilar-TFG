// Sistema de autenticacion y gestion de sesion del usuario
// Este script se ejecuta en todas las paginas de la aplicacion
// Se encarga de validar la sesion y transformar la barra de navegacion
// Tambien gestiona el cierre de sesion limpiando el almacenamiento local
document.addEventListener('DOMContentLoaded', () => {
    // Intentamos recuperar la sesion actual guardada en el almacenamiento local
    const sessionData = localStorage.getItem('usuarioSesion');
    // Si existe una sesion activa modificar la barra de navegacion
    if (sessionData) {
        try {
            // Parsear los datos del usuario desde formato json
            const user = JSON.parse(sessionData);
            // Obtener la lista de enlaces de navegacion de la pagina
            const navLinks = document.getElementById('nav-links');
            if (navLinks) {
                // Buscar el elemento de la lista que contiene el enlace de ingreso
                const loginItem = Array.from(navLinks.querySelectorAll('li')).find(li => {
                    const a = li.querySelector('a');
                    return a && a.getAttribute('href') && a.getAttribute('href').includes('Login.html');
                });
                // Si encontramos el enlace de iniciar sesion lo reemplazamos
                if (loginItem) {
                    // Crear el nuevo elemento de la lista con el perfil del usuario
                    const profileLi = document.createElement('li');
                    profileLi.className = 'nav-profile';
                    // Reemplazar el enlace de contacto por comentarios si es comerciante
                    if (user.rol === 'comerciante') {
                        const contactoItem = Array.from(navLinks.querySelectorAll('li')).find(li => {
                            const a = li.querySelector('a');
                            return a && a.getAttribute('href') && a.getAttribute('href').includes('Contacto.html');
                        });
                        if (contactoItem) {
                            // Cambiar el enlace para apuntar a la seccion de comentarios del panel
                            contactoItem.innerHTML = `<a href="Comerciante.html?tab=comentarios" style="color:var(--naranja); font-weight:bold;">
<i class="fas fa-inbox"></i> Comentarios
</a>`;
                        }
                    }
                    // Construir la estructura del perfil con foto nombre y menu desplegable
                    profileLi.innerHTML = `
<div class="profile-trigger" id="profile-btn">
<span class="user-greeting" style="color:white; margin-right: 10px; font-weight: bold; text-transform: capitalize;">${user.apodo ? user.apodo : user.nombre}</span>
<img src="${user.imagen}" alt="Perfil" class="profile-icon" onerror="this.src='/static/img/LogoPesca.png'">
</div>
<div class="dropdown-menu" id="user-dropdown">
<a href="Editar.html"><i class="fas fa-user-edit"></i> Editar perfil</a>
<a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</a>
</div>
`;
                    // Reemplazar el enlace de ingreso por el perfil del usuario en la barra
                    navLinks.replaceChild(profileLi, loginItem);
                    // Inyectar un boton dinamico segun el rol del usuario
                    const dynamicLi = document.createElement('li');
                    if (user.rol === 'comerciante') {
                        // Insertar boton de acceso al panel de gestion de pedidos para comerciantes
                        dynamicLi.innerHTML = `<a href="Comerciante.html" style="color:var(--naranja); font-weight:bold; letter-spacing: 0.5px;">
<i class="fas fa-clipboard-list"></i> Pedidos
</a>`;
                    } else {
                        // Insertar boton del carrito con contador de productos para clientes
                        let listCarrito = [];
                        try { listCarrito = JSON.parse(localStorage.getItem('carrito')) || []; } catch (e) { }
                        dynamicLi.innerHTML = `<a href="Carrito.html" style="color:var(--naranja); font-weight:bold; letter-spacing: 0.5px;">
<i class="fas fa-shopping-cart"></i> Carrito
<span id="cart-counter" class="cart-badge">${listCarrito.length > 0 ? listCarrito.length : ''}</span>
</a>`;
                    }
                    // Insertar el boton dinamico justo antes del perfil del usuario
                    navLinks.insertBefore(dynamicLi, profileLi);
                    // Gestionar la apertura y cierre del menu desplegable al hacer clic
                    const profileBtn = document.getElementById('profile-btn');
                    const dropdownMenu = document.getElementById('user-dropdown');
                    // Alternar la visibilidad del menu al presionar la foto de perfil
                    profileBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Evitar que el clic se propague al resto del documento
                        dropdownMenu.classList.toggle('show');
                    });
                    // Cerrar el menu si se hace clic en cualquier otra zona de la pagina
                    document.addEventListener('click', (e) => {
                        if (!profileLi.contains(e.target)) {
                            dropdownMenu.classList.remove('show');
                        }
                    });
                    // Eliminar los datos de sesion y redirigir al inicio al cerrar sesion
                    document.getElementById('logout-btn').addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('usuarioSesion'); // Borrar datos del almacenamiento local
                        window.location.href = "Inicio.html";    // Redirigir a la pagina principal
                    });
                }
            }
        } catch (e) {
            // Limpiar los datos para evitar errores si la sesion esta corrupta
            console.error("Hubo un error con la sesión corrupta, limpiando.");
            localStorage.removeItem('usuarioSesion');
        }
    }
});