# schemas.py - Esquemas de Validación Pydantic para la API REST.

# Define los esquemas para validar y serializar los datos de entrada y salida de los endpoints.

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict


# Esquemas de usuario

# Esquema de entrada para registrar un nuevo usuario en el sistema
class UserCreate(BaseModel):
    # Contiene los datos requeridos para el registro de una cuenta
    nombre: str
    apellidos: str
    email: str
    password: str
    is_app: bool = False


# Esquema de entrada para el proceso de inicio de sesion
class UserLogin(BaseModel):
    # Contiene las credenciales necesarias para autenticar al usuario
    email: str
    password: str


# Esquema de respuesta para devolver los datos publicos del usuario
class UserResponse(BaseModel):
    # Retorna el perfil del usuario omitiendo la contrasena cifrada
    id: int
    nombre: str
    apellidos: str
    apodo: str | None = None
    email: str
    imagen: str | None = None
    rol: str

    model_config = ConfigDict(from_attributes=True)


# Esquema de entrada para la actualizacion del perfil de usuario
class UserUpdate(BaseModel):
    # Permite modificar de forma opcional el apodo y la foto de perfil
    email: str
    apodo: str | None = None
    imagen: str | None = None


# Esquemas de producto

# Esquema de respuesta para representar los datos de un producto
class ProductoResponse(BaseModel):
    # Devuelve la informacion completa de un articulo del catalogo
    id: int
    nombre: str
    descripcion: str
    precio: float
    imagen: str | None = None
    tipo: str

    model_config = ConfigDict(from_attributes=True)


# Esquema de entrada para actualizar los datos de un producto
class ProductoUpdate(BaseModel):
    # Contiene los campos modificables de un articulo por el comerciante
    precio: float | None = None
    descripcion: str | None = None
    imagen: str | None = None


# Esquemas de pedido

# Esquema de entrada para la creacion de un nuevo pedido
class PedidoCreate(BaseModel):
    # Define la estructura de datos del cliente, entrega y carrito de compras
    nombre: str
    apellidos: str
    correo: str
    numero_telefono: str
    domicilio: str
    precio_total: float
    lista_productos: list[dict]
    comentario: str | None = None


# Esquema de respuesta con los datos detallados de un pedido
class PedidoResponse(BaseModel):
    # Devuelve el resumen del pedido junto con su ID y estado actual
    id: int
    nombre: str
    apellidos: str
    correo: str
    numero_telefono: str
    domicilio: str
    precio_total: float
    lista_productos: list[dict]
    estado: str
    comentario: str | None = None

    model_config = ConfigDict(from_attributes=True)


# Esquema de entrada para modificar el estado de gestion de un pedido
class PedidoUpdateEstado(BaseModel):
    # Permite cambiar la situacion del pedido en el flujo de entrega
    estado: str


# Esquema de entrada para reajustar el importe total de un pedido
class PedidoUpdatePrecio(BaseModel):
    # Permite alterar el precio final calculado para un pedido facturado
    precio_total: float


# Esquemas de comentario

# Esquema de entrada para enviar un mensaje desde el formulario de contacto
class ComentarioCreate(BaseModel):
    # Estructura el mensaje, nombre y correo remitente de la consulta
    nombre_completo: str
    correo: str
    comentario: str


# Esquema de respuesta que devuelve un comentario registrado en el sistema
class ComentarioResponse(BaseModel):
    # Retorna el mensaje almacenado junto con su ID y marca de tiempo
    id: int
    nombre_completo: str
    correo: str
    comentario: str
    model_config = ConfigDict(from_attributes=True)

# Esquemas de Autenticación y Verificación

# Esquema para solicitar restablecimiento de contraseña
class ForgotPasswordRequest(BaseModel):
    email: str
    is_app: bool = False

# Esquema para enviar la nueva contraseña con el token
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str