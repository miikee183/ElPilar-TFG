# El Pilar TFG
Este fue el TFG que presente para obtener el título del grado superior "Desarrollo de aplicaciones multiplataforma".

<img src="frontend/static/img/FondoInicio.png" alt="Inicio" width="350">

# Idea
La idea del proyecto es digitalizar el negocio de mi familia, mi padre lleva trabajando en una pescadería toda su vida junto a un compañero suyo, actualmente no disponen ni de WEB ni de APP, además de que hacen pedidos a domicilio a través de llamadas que requieren tiempo en momentos trágicos con mucha afluencia en el mercado.
Este proyecto les ayuda en la gestión de sus pedidos, además de poder promocionar el negocio.

# Tecnologías
La WEB está formada por HTML, CSS y JS con un backend hecho en Python, un entorno virtual con todas las librerías implementadas en el proyecto.
Se tvo uso de AIs como Claude y Gemini para ayuda y refuerzo del proyecto, además de usar el famoso VS Code.

# Manual de uso
Para que puedas usar la web al completo ejecuta en la terminal del vs code estos comandos en orden:

Puede que tengas que crear antes el entorno virtual ejecuta: "python -m venv venv" para crearlo para que tenga tu ruta de archivos.

Para activar el entorno virtual: ".\venv\Scripts\Activate"

Para instalar las dependencias/librerias: "pip install -r requirements.txt"

Para iniciar el servidor y que pueda conectarse la app al servidor:

"uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

Para ver la web tienes que buscar el link en google como: http://localhost:8000/Inicio.html

Para la base de datos crea un archivo llamado .env si no esta creado y añadele esto:

DATABASE_URL="postgresql://USER:PASSWORD@localhost:PORT/NombreDB?client_encoding=utf8"   <-- TU DATOS DE BD

SMTP_SERVER="smtp.gmail.com"

SMTP_PORT="465"

SMTP_USERNAME="ElpilarFresco@gmail.com"

SMTP_PASSWORD="mbdr wzcu mwqs svea"

SECRET_KEY="una aleatoria"

y crea la base de datos en postgres con la misma contraseña, user, puerto y nombre de BD

que pongas en DATABASE_URL



con eso debería de funcionarte todo y en el móvil igual.
