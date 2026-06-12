// Editar.js - Lógica de la Página de Edición de Perfil (Editar.html).

// Funcionalidades:
// Protección de Ruta: Redirige a Login si no hay sesión activa.
// Precarga de Datos: Rellena el formulario con el apodo actual del usuario.
// Subida de Imagen: Convierte la imagen seleccionada a Base64 comprimido (máximo 400x400px, calidad JPEG 80%) para almacenarla como string en la BD.
// Envío de Cambios: Petición PUT /editar_perfil a FastAPI.
// Actualización Local: Sincroniza los cambios en localStorage para que Auth.js refleje los nuevos datos en la navbar sin necesidad de re-login.
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-form');
    const fileInput = document.getElementById('imagen_file');
    const fileStatus = document.getElementById('file-status');
    // Protección de ruta y precarga de datos.
    // Leer la sesión actual del usuario desde localStorage
    const sessionData = localStorage.getItem('usuarioSesion');
    let emailSession = ""; // Email usado como identificador en el backend
    if (sessionData) {
        const user = JSON.parse(sessionData);
        emailSession = user.email;
        // Si el usuario ya tiene un apodo configurado, mostrarlo en el campo
        if (user.apodo) {
            document.getElementById('apodo_nuevo').value = user.apodo;
        }
    } else {
        // Si no hay sesión activa, bloquear acceso y redirigir a Login
        alert("Atención: Debes Iniciar Sesión para editar tu perfil.");
        window.location.href = "Login.html";
        return;
    }
    // Feedback visual de seleccion de archivo
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                // Mostrar el nombre del archivo seleccionado con estilo positivo
                fileStatus.textContent = "Seleccionado: " + e.target.files[0].name;
                fileStatus.style.color = "var(--azul-oscuro)";
                fileStatus.style.fontWeight = "bold";
            } else {
                // Restaurar texto por defecto si no hay archivo
                fileStatus.textContent = "Ninguna imagen seleccionada orgánicamente...";
                fileStatus.style.color = "#888";
                fileStatus.style.fontWeight = "normal";
            }
        });
    }
    // Envido de formulario de edición
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newApodo = document.getElementById('apodo_nuevo').value.trim();
            // Convierte un archivo de imagen a cadena Base64 comprimida.
            
            // Flujo:
            // Leer el archivo con FileReader como Data URL.
            // Crear un elemento Image para obtener las dimensiones originales.
            // Redimensionar a un máximo de 400x400px usando Canvas.
            // Exportar como JPEG con calidad del 80% para reducir tamaño.
            
            // @param {File} file Archivo de imagen seleccionado por el usuario.
            // @returns {Promise<string>} Cadena Base64 de la imagen comprimida.
            const getBase64Image = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            // Limitar dimensiones a 400px para evitar strings SQL muy largos
                            const MAX_WIDTH = 400;
                            const MAX_HEIGHT = 400;
                            let width = img.width;
                            let height = img.height;
                            // Calcular las nuevas dimensiones manteniendo la proporción
                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            // Dibujar la imagen redimensionada en el canvas
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            // Exportar como JPEG al 80% de calidad para optimizar tamaño
                            resolve(canvas.toDataURL('image/jpeg', 0.8));
                        };
                        img.src = event.target.result;
                    };
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
            };
            // Procesar la imagen si el usuario seleccionó un archivo
            let finalImageBase64 = null;
            if (fileInput.files.length > 0) {
                try {
                    finalImageBase64 = await getBase64Image(fileInput.files[0]);
                } catch (e) {
                    alert('La encriptación local falló: Archivo corrompido.');
                    return;
                }
            }
            // Construir el payload con los datos del formulario
            const payload = {
                email: emailSession,              // Identificador del usuario en la BD
                apodo: newApodo !== "" ? newApodo : null,  // Nuevo apodo (null si vacío)
                imagen: finalImageBase64           // Nueva imagen Base64 (null si no se subió)
            };
            try {
                // Enviar petición PUT al endpoint de edición de perfil
                const response = await fetch('/editar_perfil', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const data = await response.json();
                    // Actualizar la sesión en localStorage con los nuevos datos
                    // para que Auth.js muestre los cambios en la navbar inmediatamente
                    const currentUser = JSON.parse(localStorage.getItem('usuarioSesion'));
                    currentUser.apodo = data.apodo;
                    if (data.imagen) currentUser.imagen = data.imagen;
                    localStorage.setItem('usuarioSesion', JSON.stringify(currentUser));
                    alert("¡" + data.message + "!");
                    window.location.reload(); // Recargar para aplicar los cambios visualmente
                } else {
                    const err = await response.json();
                    alert("Aviso: " + (err.detail || "Error al actualizar la base de datos"));
                }
            } catch (error) {
                console.error("Fallo por parte del Servidor FastAPI:", error);
                alert("Servidor desconectado. Revisa tu consola.");
            }
        });
    }
});