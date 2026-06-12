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
SECRET_KEY="kgseobndogrnkovmpkgneofaebwf"

y crea la base de datos en postgres con la misma contraseña, user, puerto y nombre de BD
que pongas en DATABASE_URL

con eso debería de funcionarte todo y en el móvil igual.
