# models.py - Definición de los Modelos ORM de la Base de Datos.

# Mapea las estructuras de las tablas de PostgreSQL a clases de Python.

# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Float, JSON, Boolean
from backend.database import Base


# Modelo ORM para la tabla 'usuarios' que gestiona clientes y comerciantes
class User(Base):
    # Representa la tabla usuarios y define sus campos de credenciales y perfil
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    apellidos = Column(String, nullable=False)
    apodo = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    imagen = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    rol = Column(String, nullable=False, default="cliente")
    is_verified = Column(Boolean, nullable=False, default=False)


# Modelo ORM para la tabla 'productos' que define el catalogo de la pescaderia
class Producto(Base):
    # Representa la tabla productos con su precio, descripcion y categoria
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    descripcion = Column(String, nullable=False)
    precio = Column(Float, nullable=False)
    imagen = Column(String, nullable=True)
    tipo = Column(String, nullable=False)


# Modelo ORM para la tabla 'pedidos' que procesa las compras de los clientes
class Pedido(Base):
    # Representa la tabla pedidos, almacena productos en formato JSON y el estado
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    numero_telefono = Column(String, nullable=False)
    domicilio = Column(String, nullable=False)
    precio_total = Column(Float, nullable=False)
    lista_productos = Column(JSON, nullable=False)
    estado = Column(String, nullable=False, default="pendiente")
    comentario = Column(String, nullable=True)


# Modelo ORM para la tabla 'comentarios' que registra el formulario de contacto
class Comentario(Base):
    # Representa la tabla comentarios con los mensajes recibidos y su fecha
    __tablename__ = "comentarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    comentario = Column(String, nullable=False)
    fecha = Column(String, nullable=False)