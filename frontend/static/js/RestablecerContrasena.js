// RestablecerContrasena.js - Lógica para enviar la nueva contraseña con el token

document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const btn = e.target.querySelector('button');
            const msgDiv = document.getElementById('status-message');
            
            // Obtener el token de la URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                msgDiv.textContent = "❌ Falta el token de seguridad en la URL.";
                msgDiv.style.color = "red";
                return;
            }

            btn.disabled = true;
            btn.innerHTML = 'Actualizando... <i class="fas fa-spinner fa-spin"></i>';
            msgDiv.textContent = '';

            try {
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token, new_password: password })
                });

                const data = await response.json();
                if (response.ok) {
                    msgDiv.textContent = "✅ " + data.message;
                    msgDiv.style.color = "green";
                    setTimeout(() => {
                        window.location.href = "Login.html";
                    }, 3000);
                } else {
                    msgDiv.textContent = "❌ " + (data.detail || "Error al actualizar contraseña");
                    msgDiv.style.color = "red";
                }
            } catch (error) {
                msgDiv.textContent = "❌ Error de conexión";
                msgDiv.style.color = "red";
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Actualizar Contraseña <i class="fas fa-save"></i>';
            }
        });
    }
});
