# init_db.py - Script de Sincronización No Destructiva de Tablas.

# Crea los nuevos modelos o tablas faltantes en PostgreSQL sin alterar los datos existentes.

import sys
import os

# Ajustar el sys.path para localizar el paquete 'backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import engine, Base
from backend import models


# Función para sincronizar de manera segura los modelos ORM con las tablas de la BD
def init_tables():
    # Ejecuta el create_all para generar únicamente las tablas que no existan todavía
    print("Sincronizando Base de Datos PostgreSQL sin destruir datos antiguos...")
    try:
        # Crear solo las tablas que faltan en el esquema
        Base.metadata.create_all(bind=engine)
        print("¡La base de datos está ahora con su ADN completo!")
    except Exception as e:
        print(f"Error sincronizando tabla: {e}")


# Punto de entrada para la ejecución directa del script
if __name__ == "__main__":
    init_tables()