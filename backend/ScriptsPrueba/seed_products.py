# seed_productos.py - Script de Volcado de Productos desde JSON a PostgreSQL.
#
# Lee el catálogo en JSON y lo migra a la base de datos convirtiendo los precios a FLOAT.

import sys
import os
import json

# Ajustar el sys.path para localizar el paquete 'backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal, engine
from backend import models


# Función principal que ejecuta la migración de productos JSON a PostgreSQL
def seed_db():
    # Valida la existencia de tablas, lee el JSON y añade los productos si la BD está vacía
    print("Iniciando conexión y validación de tablas...")

    # Asegurar la existencia de las tablas en la BD
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Evitar duplicados comprobando si ya existen registros
        if db.query(models.Producto).first():
            print("INFO: La base de datos ya tiene productos, el volcado no es necesario.")
            return

        # Ruta al archivo JSON de origen
        json_path = os.path.join("frontend", "static", "data", "Productos.json")
        print(f"Leyendo datos originales desde: {json_path}")
        
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        productos_agregados = 0

        # Iterar por las categorías del JSON para procesar cada artículo
        for tipo, lista_productos in data.items():
            print(f"-> Insertando {len(lista_productos)} productos en la categoría '{tipo}'...")

            for p in lista_productos:
                # Formatear el precio de texto a numérico flotante
                precio_raw = str(p.get("precio", "0")).replace("€", "").replace("/kg", "").replace(",", ".").strip()
                precio_float = float(precio_raw) if precio_raw else 0.0

                # Crear instancia del modelo ORM
                nuevo_prod = models.Producto(
                    nombre=p["nombre"],
                    descripcion=p.get("descripcion", ""),
                    precio=precio_float,
                    imagen=p.get("imagen", ""),
                    tipo=tipo
                )
                db.add(nuevo_prod)
                productos_agregados += 1
                
        # Guardar todos los cambios en la BD
        db.commit()
        print(f"\n[OK] Se han migrado correctamente {productos_agregados} productos a la base de datos PostgreSQL.")
        
    except FileNotFoundError:
        print(f"[ERROR] No se ha encontrado el archivo JSON en {json_path}")
    except Exception as e:
        print(f"[ERROR] Error inesperado durante la migracion: {e}")
        db.rollback()
    finally:
        db.close()


# Punto de entrada para la ejecución directa del script
if __name__ == "__main__":
    seed_db()