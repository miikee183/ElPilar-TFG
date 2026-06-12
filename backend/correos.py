# correos.py - Utilidades para el envío de correos y generación de tokens de seguridad.

# Este archivo contiene toda la lógica necesaria para:
# Generar enlaces seguros (tokens JWT) con fecha de caducidad.
# Conectarse al servidor SMTP (ej. Gmail) configurado en el archivo .env.
# Diseñar el HTML de los correos que reciben los usuarios.

import os
import smtplib
from email.message import EmailMessage
import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Carga las variables de entorno desde el archivo .env (y sobrescribe si ya existían)
load_dotenv(override=True)

# SECRET_KEY es una contraseña maestra que solo el servidor conoce. Se usa para firmar.
# los enlaces y evitar que alguien pueda inventarse un enlace de verificación falso.
SECRET_KEY = os.getenv("SECRET_KEY", "dnidsonbsdiogndogrnd")
ALGORITHM = "HS256" # Algoritmo criptográfico usado para generar el token

# Estos valores se obtienen del archivo .env. Si no están ahí, se usan valores por defecto.
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))  # 465 es el puerto estándar para conexiones seguras SSL
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "") 
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USERNAME) # Quién envía el correo (normalmente tu misma dirección)


def create_verification_token(email: str) -> str:
    
    # Genera un token JWT (un texto encriptado) que servirá como enlace de verificación.
    # Contiene el correo del usuario y caduca automáticamente a las 24 horas.
    
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    # Payload: La información que queremos ocultar dentro del token
    to_encode = {"exp": expire, "sub": email, "type": "verify_email"}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_password_reset_token(email: str) -> str:
    
    # Genera un token JWT para que el usuario pueda restablecer su contraseña.
    # Por seguridad, este enlace es más estricto y caduca en solo 1 hora.
    
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = {"exp": expire, "sub": email, "type": "reset_password"}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str) -> str | None:
    
    # Recibe un token (que viene en la URL cuando el usuario hace clic en el correo).
    # Lo desencripta usando la SECRET_KEY. Si es válido y no ha caducado, devuelve el correo.
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        tipo: str = payload.get("type")
        # Verificamos que el token sea del tipo esperado (para no usar un token de email para cambiar contraseñas)
        if email is None or tipo != token_type:
            return None
        return email
    except jwt.PyJWTError:
        # Si el token fue modificado por un hacker o ya ha caducado, devuelve None (Error)
        return None


def send_email_async(to_email: str, subject: str, html_content: str):
    
    # Función base que se encarga de la conexión real con Gmail (o el proveedor que sea).
    # Construye el mensaje y lo envía.
    
    # Si no hay credenciales en el .env, avisa por consola pero no rompe el programa
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print(f"⚠️ AVISO: No se enviará correo a {to_email} porque no hay credenciales SMTP configuradas.")
        print(f"Simulando envío de correo:\nAsunto: {subject}\nContenido:\n{html_content}")
        return

    # Prepara la estructura del correo
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = EMAIL_FROM
    msg['To'] = to_email
    # Mensaje alternativo por si el correo del cliente es tan antiguo que no lee HTML
    msg.set_content("Tu cliente de correo no soporta HTML.") 
    msg.add_alternative(html_content, subtype='html')

    try:
        # Abre una conexión segura y envía el correo
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"✅ Correo enviado con éxito a {to_email}")
    except Exception as e:
        print(f"❌ Error enviando correo a {to_email}: {e}")


def send_verification_email(email: str, token: str, base_url: str, is_app: bool = False):
    
    # Diseña el HTML específico para el correo de "Bienvenida y Verificación".
    # Usa la función base send_email_async para enviarlo.
    
    # Construimos la URL completa a la que el usuario debe hacer clic
    if is_app:
        verify_url = f"{base_url}/api/auth/redirect-app?path=verify-email&token={token}"
    else:
        verify_url = f"{base_url}/api/auth/verify-email?token={token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 30px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #0d6efd;">¡Bienvenido a El Pilar! 🐟</h2>
            <p style="color: #333333; font-size: 16px;">Gracias por registrarte. Para poder iniciar sesión y hacer pedidos, necesitamos que verifiques tu correo electrónico.</p>
            <br>
            <a href="{verify_url}" style="display: inline-block; background-color: #0d6efd; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Verificar Mi Cuenta
            </a>
        </div>
    </body>
    </html>
    """
    send_email_async(email, "🐟 Verifica tu cuenta en El Pilar", html)


def send_password_reset_email(email: str, token: str, base_url: str, is_app: bool = False):
    
    # Diseña el HTML específico para el correo de "Recuperar Contraseña".
    # Usa la función base send_email_async para enviarlo.
    
    # El enlace enviará al usuario a la vista HTML del frontend para cambiar la contraseña
    if is_app:
        reset_url = f"{base_url}/api/auth/redirect-app?path=reset-password&token={token}"
    else:
        reset_url = f"{base_url}/RestablecerContrasena.html?token={token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 30px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #dc3545;">Recuperación de Contraseña 🔐</h2>
            <p style="color: #333333; font-size: 16px;">Hemos recibido una solicitud para cambiar la contraseña de tu cuenta en El Pilar.</p>
            <p style="color: #333333; font-size: 16px;">Haz clic en el botón de abajo para establecer una nueva contraseña. Este enlace caducará en 1 hora.</p>
            <br>
            <a href="{reset_url}" style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Restablecer Contraseña
            </a>
        </div>
    </body>
    </html>
    """
    send_email_async(email, "🔐 Recupera tu contraseña en El Pilar", html)
