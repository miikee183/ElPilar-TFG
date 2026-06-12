# create_comerciante.py - Script para Crear Cuentas de Comerciante.

import sys
import os
import getpass
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine

# Ajustar el sys.path para localizar el paquete 'backend' desde ScriptsPrueba.
# Subimos 3 niveles: ScriptsPrueba > backend > PescaWEB (raiz del proyecto)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.models import User
from backend.database import DATABASE_URL
# pyrefly: ignore [missing-import]
from argon2 import PasswordHasher

# Crear un motor de conexión independiente y el hasher de contraseñas
engine = create_engine(DATABASE_URL)
ph = PasswordHasher()


def create_comerciante():

    print("=== Crear cuenta de Comerciante ===")
    nombre = input("Nombre: ")
    apellidos = input("Apellidos: ")
    correo = input("Correo electrónico: ")
    password = getpass.getpass("Contraseña: ")

    # Hashear la contraseña con Argon2 para almacenamiento seguro
    hashed_password = ph.hash(password)

    with Session(engine) as session:
        # Verificar si ya existe un usuario con ese correo
        existing_user = session.query(User).filter(User.email == correo).first()
        if existing_user:
            print("El usuario con este correo ya existe.")
            return

        # Crear el nuevo comerciante con rol específico y ya verificado
        nuevo_comerciante = User(
            nombre=nombre,
            apellidos=apellidos,
            email=correo,
            hashed_password=hashed_password,
            rol="comerciante",
            is_verified=True
        )
        session.add(nuevo_comerciante)
        session.commit()
        print(f"Comerciante '{nombre} {apellidos}' creado exitosamente!")


# Punto de entrada del script
if __name__ == "__main__":
    create_comerciante()
