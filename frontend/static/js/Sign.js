
// Sign.js - Lógica del Formulario de Registro de Usuarios (Sign.html).

// Funcionalidades:
// Toggle de visibilidad de contraseña (icono ojo).
// Medidor de seguridad de contraseña en tiempo real:
// - Baja: menos de 8 caracteres o solo letras/números.
// - Media: 8-10 caracteres con letras Y números.
// - Muy Alta: más de 10 caracteres con letras Y números.
// Validación: se requiere seguridad mínima de "Media" para registrarse.
// Envío del formulario al endpoint POST /registro de FastAPI.
// Redirección a Login.html tras registro exitoso.

document.addEventListener('DOMContentLoaded', () => {
    // TOGGLE DE VISIBILIDAD DE CONTRASENA
    const togglePwd = document.getElementById('toggle-pwd');   // Icono del ojo
    const pwdTarget = document.getElementById('password');      // Campo de contraseña
    if (togglePwd && pwdTarget) {
        togglePwd.addEventListener('click', () => {
            // Alternar entre tipo 'password' (oculto) y 'text' (visible)
            const type = pwdTarget.getAttribute('type') === 'password' ? 'text' : 'password';
            pwdTarget.setAttribute('type', type);
            // Cambiar el icono: ojo abierto / ojo tachado
            togglePwd.classList.toggle('fa-eye');
            togglePwd.classList.toggle('fa-eye-slash');
        });
    }
    // MEDIDOR DE SEGURIDAD DE CONTRASENA
    const signForm = document.getElementById('sign-form');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.querySelector('.strength-bar');   // Barra visual de progreso
    const strengthText = document.querySelector('.strength-text'); // Texto descriptivo del nivel
    // Evaluar la seguridad cada vez que el usuario escribe en el campo de contraseña
    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        const hasLetters = /[a-zA-Z]/.test(val); // ¿Contiene al menos una letra?
        const hasNumbers = /\d/.test(val);        // ¿Contiene al menos un número?
        // Limpiar las clases CSS de estado previo
        strengthBar.className = 'strength-bar';
        strengthText.className = 'strength-text';
        // Si el campo está vacío, mostrar el texto por defecto sin barra
        if (val.length === 0) {
            strengthText.innerText = "Seguridad de la contraseña";
            strengthBar.style.width = "0%";
            return;
        }
        // Logica de evaluacion de seguridad
        if (val.length < 8 || (!hasLetters || !hasNumbers)) {
            // BAJA: menos de 8 caracteres, o falta combinar letras con números
            strengthText.innerText = "Seguridad: Baja (Usa letras y números)";
            strengthText.classList.add('low');       // Texto rojo
            strengthBar.classList.add('bar-low');     // Barra roja al 33%
        }
        else if (val.length >= 8 && val.length <= 10 && hasLetters && hasNumbers) {
            // MEDIA: entre 8 y 10 caracteres, combinando letras y números
            strengthText.innerText = "Seguridad: Media";
            strengthText.classList.add('medium');     // Texto amarillo
            strengthBar.classList.add('bar-medium');  // Barra amarilla al 66%
        }
        else if (val.length > 10 && hasLetters && hasNumbers) {
            // MUY ALTA: más de 10 caracteres, combinando letras y números
            strengthText.innerText = "Seguridad: Muy Alta";
            strengthText.classList.add('high');       // Texto verde
            strengthBar.classList.add('bar-high');    // Barra verde al 100%
        }
    });
    // ENVIO DEL FORMULARIO DE REGISTRO
    if (signForm) {
        signForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evitar recarga de la página
            // Validar que la contraseña tenga al menos seguridad "Media" (8+ caracteres)
            if (passwordInput.value.length < 8) {
                alert("Por favor, mejora la seguridad de tu contraseña.");
                return;
            }
            // Capturar los valores del formulario
            const nombre = document.getElementById('nombre').value.trim();
            const apellidos = document.getElementById('apellidos').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = passwordInput.value;
            // Construir el payload con la estructura esperada por el schema UserCreate
            const payload = {
                nombre: nombre,
                apellidos: apellidos,
                email: email,
                password: password
            };
            try {
                // Enviar petición POST al endpoint de registro de FastAPI
                const response = await fetch('/registro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    // Registro exitoso: informar y redirigir a la página de Login
                    alert("Te hemos enviado un correo para verificarte. ¡Por favor, revisa tu bandeja de entrada!");
                    window.location.href = 'Login.html';
                } else {
                    // Error del servidor (ej. email duplicado, HTTP 400)
                    const errorData = await response.json();
                    alert("Atención: " + (errorData.detail || "No se pudo registrar"));
                }
            } catch (err) {
                // Error de conexión: el servidor Uvicorn no está corriendo
                console.error("Error en la petición: ", err);
                alert("Error conectando con el servidor. Revisa si está encendido.");
            }
        });
    }
});
