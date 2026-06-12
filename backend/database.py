# database.py - Módulo de Configuración y Conexión a Base de Datos PostgreSQL.

# Carga variables de entorno, configura el motor SQLAlchemy y maneja sesiones de BD.

import os
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# Obtener la URL de conexión a PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

# Validación obligatoria de la variable de entorno
if not DATABASE_URL:
    raise ValueError("No se ha encontrado DATABASE_URL en el archivo .env")

# Crear el motor de conexión a PostgreSQL
engine = create_engine(DATABASE_URL)

# Fábrica de sesiones para interactuar con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarativa para heredar todos los modelos ORM
Base = declarative_base()


# Función generadora que gestiona la apertura y cierre de sesiones de base de datos
def get_db():
    # Proporciona una sesión activa de base de datos y asegura su cierre al terminar
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()