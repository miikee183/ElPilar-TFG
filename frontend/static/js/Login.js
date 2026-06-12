// Login.js - Lógica del Formulario de Inicio de Sesión (Login.html).

// Funcionalidades:
// Toggle de visibilidad de contraseña (icono ojo).
// Envío del formulario al endpoint POST /login de FastAPI.
// Almacenamiento de la sesión del usuario en localStorage tras login exitoso.
// Redirección automática a la página de inicio tras autenticarse.

document.addEventListener('DOMContentLoaded', () => {

    // TOGGLE DE VISIBILIDAD DE CONTRASENA

    const togglePwd = document.getElementById('toggle-pwd');
    const pwdTarget = document.getElementById('password');

    if (togglePwd && pwdTarget) {
        togglePwd.addEventListener('click', () => {
            const type = pwdTarget.getAttribute('type') === 'password' ? 'text' : 'password';
            pwdTarget.setAttribute('type', type);
            togglePwd.classList.toggle('fa-eye');
            togglePwd.classList.toggle('fa-eye-slash');
        });
    }

    // ENVIO DEL FORMULARIO DE LOGIN

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('usuarioSesion', JSON.stringify({
                        nombre: data.nombre,
                        apellidos: data.apellidos,
                        apodo: data.apodo,
                        imagen: data.imagen,
                        email: data.email,
                        rol: data.rol
                    }));
                    window.location.href = 'Inicio.html';
                } else {
                    const err = await response.json();
                    alert("Aviso: " + (err.detail || "Error en inicio de sesión"));
                }
            } catch (error) {
                console.error("Server down", error);
                alert("Servidor desconectado. Revisa tu consola Uvicorn.");
            }
        });
    }
});