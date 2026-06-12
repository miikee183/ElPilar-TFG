// OlvidoContrasena.js - Lógica para solicitar restablecimiento de contraseña

document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const btn = e.target.querySelector('button');
            const msgDiv = document.getElementById('status-message');
            
            btn.disabled = true;
            btn.innerHTML = 'Enviando... <i class="fas fa-spinner fa-spin"></i>';
            msgDiv.textContent = '';

            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();
                if (response.ok) {
                    msgDiv.textContent = "✅ " + data.message;
                    msgDiv.style.color = "green";
                } else {
                    msgDiv.textContent = "❌ " + (data.detail || "Error al enviar correo");
                    msgDiv.style.color = "red";
                }
            } catch (error) {
                msgDiv.textContent = "❌ Error de conexión";
                msgDiv.style.color = "red";
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Enviar Enlace <i class="fas fa-paper-plane"></i>';
            }
        });
    }
});
