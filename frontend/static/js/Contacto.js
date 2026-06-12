// Contacto.js - Lógica del Formulario de Contacto (Contacto.html).

// Funcionalidades:
// Menú Móvil: Toggle del menú hamburguesa en pantallas pequeñas.
// Envío de Comentarios: Petición POST /api/contacto a FastAPI para guardar el mensaje del usuario en la base de datos.
// Confirmación previa con diálogo confirm() antes de enviar.
// Feedback visual con spinner de carga en el botón.
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    // MENU MOVIL (Hamburguesa)
    const mobileBtn = document.getElementById('mobile-btn');
    const navLinks = document.getElementById('nav-links');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => navLinks.classList.toggle('active'));
    }
    // Envio de formulario de contacto
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault(); // Evitar recarga de la página
            // Capturar los valores de los campos del formulario
            const fullName = document.getElementById('full-name').value;
            const email = document.getElementById('email').value;
            const comment = document.getElementById('comment').value;
            // Pedir confirmación al usuario antes de enviar
            const confirmar = confirm("¿Estás seguro de que quieres enviar este comentario?");
            if (confirmar) {
                // Mostrar spinner de carga en el botón mientras se envía
                const btn = contactForm.querySelector('.send-btn');
                const originalHtml = btn.innerHTML; // Guardar el contenido original del botón
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                btn.disabled = true;
                try {
                    // Enviar petición POST al endpoint de contacto de FastAPI
                    const res = await fetch('/api/contacto', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nombre_completo: fullName,
                            correo: email,
                            comentario: comment
                        })
                    });
                    if (res.ok) {
                        // Envío exitoso: informar al usuario y limpiar el formulario
                        alert("¡Comentario enviado con éxito! Nos pondremos en contacto contigo pronto.");
                        contactForm.reset();
                    } else {
                        // Error del servidor: mostrar el detalle del error
                        const error = await res.json();
                        alert("Error al enviar el comentario: " + error.detail);
                    }
                } catch (err) {
                    // Error de conexión: el servidor no está disponible
                    console.error("Error contactando al servidor:", err);
                    alert("No se pudo conectar con el servidor para enviar el mensaje.");
                } finally {
                    // Restaurar el botón a su estado original (con o sin error)
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                }
            }
        });
    }
});