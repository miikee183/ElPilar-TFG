# main.py - Servidor Principal de la API REST con FastAPI.

# Configura el servidor FastAPI, monta los archivos estáticos del frontend,
# define las plantillas HTML y expone todos los endpoints de la API.

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException, status, Request
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles
# pyrefly: ignore [missing-import]
from fastapi.templating import Jinja2Templates
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from datetime import datetime
# pyrefly: ignore [missing-import]
from argon2 import PasswordHasher
# pyrefly: ignore [missing-import]
from argon2.exceptions import VerifyMismatchError

from backend import models, schemas
from backend.database import engine, get_db
from backend import correos

# Inicializar el hasher de contraseñas Argon2
ph = PasswordHasher()

# Crear las tablas en la BD automáticamente si no existen
models.Base.metadata.create_all(bind=engine)

# Instancia principal de la aplicación FastAPI
app = FastAPI(title="PescaWEB API")

# Montar la carpeta de archivos estáticos para el frontend
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# Montar la carpeta de imágenes para la App Android
app.mount("/img", StaticFiles(directory="frontend/static/img"), name="img")

# Configurar la ubicación de las plantillas HTML (Jinja2)
templates = Jinja2Templates(directory="frontend/templates/html")


# Endpoints de paginas HTML

# Endpoint para servir la pagina de inicio del sitio web
@app.get("/")
def sirve_inicio(request: Request):
    # Sirve la página principal (Inicio.html)
    return templates.TemplateResponse(request=request, name="Inicio.html")


# Endpoint para renderizar de manera dinamica cualquier pagina HTML solicitada
@app.get("/{page_name}.html")
def render_page(request: Request, page_name: str):
    # Sirve cualquier página HTML del frontend por su nombre
    return templates.TemplateResponse(request=request, name=f"{page_name}.html")


# Endpoints de productos

# Endpoint para obtener el catalogo completo de productos agrupados por categoria
@app.get("/api/productos")
def get_productos(db: Session = Depends(get_db)):
    # Obtener el catálogo de productos agrupado por categoría
    productos_db = db.query(models.Producto).all()
    
    respuesta = {
        "pescados": [],
        "mariscos": [],
        "cefalopodos": []
    }
    
    for prod in productos_db:
        categoria_limpia = prod.tipo.lower() if prod.tipo else "pescados"
        
        prod_dict = {
            "id": prod.id,
            "nombre": prod.nombre,
            "descripcion": prod.descripcion if prod.descripcion else "",
            "precio": prod.precio if prod.precio else 0.0,
            "imagen": prod.imagen,
            "tipo": categoria_limpia
        }
        
        if categoria_limpia in respuesta:
            respuesta[categoria_limpia].append(prod_dict)
        else:
            respuesta["pescados"].append(prod_dict)
            
    return respuesta


# Endpoint para actualizar la informacion de un producto especifico por su ID
@app.put("/api/productos/{producto_id}")
def update_producto(producto_id: int, producto_update: schemas.ProductoUpdate, db: Session = Depends(get_db)):
    # Actualizar los datos de un producto (solo comerciantes)
    db_prod = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    if producto_update.precio is not None:
        db_prod.precio = producto_update.precio
    if producto_update.descripcion is not None:
        db_prod.descripcion = producto_update.descripcion
    if producto_update.imagen is not None and producto_update.imagen.strip() != "":
        db_prod.imagen = producto_update.imagen
        
    db.commit()
    db.refresh(db_prod)
    
    return {"message": "Producto actualizado exitosamente"}


# Endpoints de autenticacion

# Endpoint para registrar un nuevo usuario en el sistema con contrasena cifrada
@app.post("/registro", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Registrar un nuevo usuario en la base de datos
    db_user_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user_email:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
        
    hashed_password = ph.hash(user.password)
    default_imagen = "https://img.freepik.com/vector-premium/icono-membresia-plateado-icono-perfil-avatar-defecto-icono-miembros-imagen-usuario-redes-sociales-ilustracion-vectorial_561158-4215.jpg"

    new_user = models.User(
        nombre=user.nombre,
        apellidos=user.apellidos,
        email=user.email,
        imagen=default_imagen,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generar token y enviar correo de verificación
    token = correos.create_verification_token(new_user.email)
    base_url = str(request.base_url).rstrip("/")
    correos.send_verification_email(new_user.email, token, base_url, is_app=user.is_app)
    
    return new_user


# Endpoint para validar las credenciales del usuario e iniciar sesion
@app.post("/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    # Iniciar sesión verificando credenciales en la base de datos
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
        
    try:
        if not ph.verify(db_user.hashed_password, user.password):
            raise HTTPException(status_code=400, detail="Credenciales inválidas")
    except VerifyMismatchError:
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
        
    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Por favor, verifica tu correo electrónico antes de iniciar sesión.")
        
    return {
        "message": "Login exitoso", 
        "nombre": db_user.nombre, 
        "apellidos": db_user.apellidos,
        "apodo": db_user.apodo,
        "imagen": db_user.imagen,
        "email": db_user.email,
        "rol": db_user.rol
    }


# Endpoints adicionales de verificación y recuperación
from fastapi.responses import HTMLResponse, RedirectResponse

# Endpoint redireccion web aplicacion movil
@app.get("/api/auth/redirect-app", response_class=HTMLResponse)
def redirect_to_app(request: Request, path: str, token: str, db: Session = Depends(get_db)):
    # Si es verificación, verificamos directamente la cuenta en la BBDD
    # Así, si lo abren desde un PC, quedan verificados aunque no se abra la app.
    if path == "verify-email":
        email = correos.verify_token(token, "verify_email")
        if email:
            db_user = db.query(models.User).filter(models.User.email == email).first()
            if db_user and not db_user.is_verified:
                db_user.is_verified = True
                db.commit()
        mensaje = "<h1 style='color: #004B8D; font-size: 24px; margin-bottom: 15px;'>¡Cuenta Verificada!</h1><p style='color: #666; font-size: 1.1rem; margin-bottom: 20px;'>Ya puedes abrir la app en tu dispositivo móvil.</p>"
    elif path == "reset-password":
        base_url = str(request.base_url).rstrip("/")
        fallback_url = f"{base_url}/RestablecerContrasena.html?token={token}"
        mensaje = f"<h1 style='color: #004B8D; font-size: 20px; margin-bottom: 15px;'>Redirigiendo a la aplicación...</h1><p style='color: #666; font-size: 1.1rem;'>Para restablecer tu contraseña.</p><div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;'><p style='font-size:0.9rem; color:#999; margin-bottom: 15px;'>¿Estás en un ordenador y no se abre la app?</p><a href='{fallback_url}' style='color: white; background-color: #dc3545; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; box-shadow: 0 4px 6px rgba(220,53,69,0.2);'>Hazlo desde la Web</a></div>"
    else:
        mensaje = "<h1 style='color: #004B8D; font-size: 20px; margin-bottom: 15px;'>Redirigiendo...</h1><p style='color: #666; font-size: 1.1rem;'>Abriendo la aplicación.</p>"

    # Renderiza la plantilla HTML externa, inyectándole las variables necesarias
    return templates.TemplateResponse(
        request=request, 
        name="VerificadoMovil.html", 
        context={"path": path, "token": token, "mensaje": mensaje}
    )

# Endpoint validacion cuenta correo electronico
@app.get("/api/auth/verify-email", response_class=HTMLResponse)
def verify_email(request: Request, token: str, db: Session = Depends(get_db)):
    email = correos.verify_token(token, "verify_email")
    if not email:
        return templates.TemplateResponse(request=request, name="Verificado.html", context={"status": "error", "title": "Enlace inválido", "message": "El enlace de verificación no es válido o ya ha expirado."})
        
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        return templates.TemplateResponse(request=request, name="Verificado.html", context={"status": "error", "title": "Usuario no encontrado", "message": "El usuario asociado a este enlace ya no existe."})
        
    db_user.is_verified = True
    db.commit()
    
    return templates.TemplateResponse(request=request, name="Verificado.html", context={"status": "success", "title": "¡Cuenta verificada!", "message": "Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión."})

# Endpoint solicitud recuperacion contrasena cuenta
@app.post("/api/auth/forgot-password")
def forgot_password(request: Request, body: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == body.email).first()
    if db_user:
        token = correos.create_password_reset_token(db_user.email)
        base_url = str(request.base_url).rstrip("/")
        correos.send_password_reset_email(db_user.email, token, base_url, is_app=body.is_app)
    
    # Siempre devolver éxito por seguridad para no revelar si el correo existe
    return {"message": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."}

# Endpoint actualizacion nueva contrasena seguridad
@app.post("/api/auth/reset-password")
def reset_password(body: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    email = correos.verify_token(body.token, "reset_password")
    if not email:
        raise HTTPException(status_code=400, detail="Enlace inválido o caducado")
        
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    hashed_password = ph.hash(body.new_password)
    db_user.hashed_password = hashed_password
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión."}

# Endpoint validacion cuenta desde app movil
@app.get("/api/auth/verify-email-app")
def verify_email_app(token: str, db: Session = Depends(get_db)):
    email = correos.verify_token(token, "verify_email")
    if not email:
        raise HTTPException(status_code=400, detail="El enlace de verificación no es válido o ya ha expirado.")
        
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="El usuario asociado a este enlace ya no existe.")
        
    db_user.is_verified = True
    db.commit()
    
    return {"message": "Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión."}


# Endpoint de perfil

# Endpoint para modificar los datos del perfil del usuario autenticado
@app.put("/editar_perfil")
def update_profile(user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    # Actualizar el perfil del usuario (apodo y/o imagen)
    db_user = db.query(models.User).filter(models.User.email == user_update.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado en la base de datos")
        
    if user_update.apodo is not None:
        db_user.apodo = user_update.apodo
        
    if user_update.imagen is not None and user_update.imagen.strip() != "":
        db_user.imagen = user_update.imagen

    db.commit()
    db.refresh(db_user)
    
    return {
        "message": "Perfil actualizado exitosamente", 
        "apodo": db_user.apodo, 
        "imagen": db_user.imagen
    }


# Endpoints de pedidos

# Endpoint para procesar y almacenar un nuevo pedido realizado por un cliente
@app.post("/hacer_pedido")
def create_pedido(pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    # Crear un nuevo pedido en la base de datos
    try:
        nuevo_pedido = models.Pedido(
            nombre=pedido.nombre,
            apellidos=pedido.apellidos,
            correo=pedido.correo,
            numero_telefono=pedido.numero_telefono,
            domicilio=pedido.domicilio,
            precio_total=pedido.precio_total,
            lista_productos=pedido.lista_productos,
            comentario=pedido.comentario
        )
        db.add(nuevo_pedido)
        db.commit()
        return {"message": "¡Tu pedido ha sido procesado y recibido en la Central Pescadera!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error BBDD: {str(e)}")


# Endpoint para obtener el listado global de todos los pedidos registrados
@app.get("/api/pedidos")
def get_pedidos(db: Session = Depends(get_db)):
    # Obtener todos los pedidos (vista del comerciante)
    pedidos_db = db.query(models.Pedido).order_by(models.Pedido.id.desc()).all()
    
    pedidos_lista = []
    for p in pedidos_db:
        pedidos_lista.append({
            "id": p.id,
            "nombre": p.nombre,
            "apellidos": p.apellidos,
            "correo": p.correo,
            "numero_telefono": p.numero_telefono,
            "domicilio": p.domicilio,
            "precio_total": p.precio_total,
            "lista_productos": p.lista_productos,
            "estado": p.estado,
            "comentario": p.comentario
        })
    return pedidos_lista


# Endpoint para actualizar el estado de preparacion o entrega de un pedido
@app.put("/api/pedidos/{pedido_id}/estado")
def update_pedido_estado(pedido_id: int, status_update: schemas.PedidoUpdateEstado, db: Session = Depends(get_db)):
    # Cambiar el estado de un pedido (acción del comerciante)
    db_pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not db_pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
    db_pedido.estado = status_update.estado
    db.commit()
    
    return {"message": "Estado de pedido actualizado", "estado_nuevo": db_pedido.estado}


# Endpoint para modificar el importe total facturado de un pedido existente
@app.put("/api/pedidos/{pedido_id}/precio")
def update_pedido_precio(pedido_id: int, price_update: schemas.PedidoUpdatePrecio, db: Session = Depends(get_db)):
    # Modificar el precio total de un pedido (ajuste del comerciante)
    db_pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not db_pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
    db_pedido.precio_total = price_update.precio_total
    db.commit()
    
    return {"message": "Precio modificado correctamente", "precio_nuevo": db_pedido.precio_total}


# Endpoint para recuperar el historial de pedidos asociados a un correo de cliente
@app.get("/api/mis_pedidos/{correo}")
def get_mis_pedidos(correo: str, db: Session = Depends(get_db)):
    # Obtener el historial de pedidos de un cliente específico
    try:
        mis_pedidos_db = db.query(models.Pedido).filter(models.Pedido.correo == correo).order_by(models.Pedido.id.desc()).all()
        
        pedidos_lista = []
        for p in mis_pedidos_db:
            pedidos_lista.append({
                "id": p.id,
                "nombre": p.nombre,
                "apellidos": p.apellidos,
                "correo": p.correo,
                "numero_telefono": p.numero_telefono,
                "domicilio": p.domicilio,
                "precio_total": p.precio_total,
                "lista_productos": p.lista_productos,
                "estado": p.estado,
                "comentario": p.comentario
            })
        return pedidos_lista
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al leer pedidos: {str(e)}")


# Endpoints de comentarios

# Endpoint para registrar un nuevo mensaje o comentario desde el formulario de contacto
@app.post("/api/contacto", response_model=schemas.ComentarioResponse)
def crear_comentario(comentario: schemas.ComentarioCreate, db: Session = Depends(get_db)):
    # Guardar un comentario enviado desde el formulario de contacto
    try:
        nuevo_comentario = models.Comentario(
            nombre_completo=comentario.nombre_completo,
            correo=comentario.correo,
            comentario=comentario.comentario,
            fecha=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(nuevo_comentario)
        db.commit()
        db.refresh(nuevo_comentario)
        return nuevo_comentario
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error BBDD guardando comentario: {str(e)}")


# Endpoint para obtener el listado de todos los comentarios recibidos
@app.get("/api/comentarios", response_model=list[schemas.ComentarioResponse])
def get_comentarios(db: Session = Depends(get_db)):
    # Obtener todos los comentarios de contacto (vista del comerciante)
    try:
        comentarios_db = db.query(models.Comentario).order_by(models.Comentario.id.desc()).all()
        return comentarios_db
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error BBDD cargando comentarios: {str(e)}")