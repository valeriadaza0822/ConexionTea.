# ConexiónTEA

## Estructura

```text
conexiontea/
	public/          páginas HTML, estilos, scripts e imágenes
	server/          API y servidor Node.js
	database/        esquema MySQL y datos de prueba
	package.json     comandos y dependencias
	.env.example     plantilla de configuración
	.env             configuración local; no compartir
```

## Ejecutar el prototipo

Necesitas Node.js 20.19 o superior. Desde esta carpeta, ejecuta:

```powershell
npm install
npm start
```

Abre <http://localhost:3000>. Las páginas están en `public/`; no abras sus HTML directamente ni uses Live Server, porque el acceso y el registro necesitan que la API esté activa.

ConexiónTEA es una plataforma web accesible que facilita la comunicación de personas con Trastorno del Espectro Autista (TEA) mediante pictogramas interactivos.

🛠️ Tecnologías
Frontend: React.js + Vite
Backend: Node.js + Express
Base de Datos: MySQL 8.0
## API y base de datos MySQL

La API es la parte del servidor que recibe solicitudes del sitio y responde con datos. Por ejemplo, el formulario envía el correo y la contraseña a `POST /api/auth/login`; el servidor verifica la cuenta en MySQL y devuelve el perfil sin enviar la contraseña.

Instala e inicia MySQL, abre `database/database.sql` en MySQL Workbench y ejecútalo para crear las 18 tablas del proyecto. Si ya ejecutaste una versión anterior del script, ejecútalo otra vez para añadir tablas de planificación, catálogo, mensajes y solicitudes de vínculo. El script usa `CREATE IF NOT EXISTS` y evita duplicar los datos demo; no elimina la base ni los datos existentes. Copia `.env.example` como `.env` y escribe ahí tu usuario, puerto y contraseña de MySQL. Después ejecuta `npm install` y `npm start` desde la raíz de esta carpeta. La tabla de sesiones técnicas se crea automáticamente al iniciar el servidor; `sesiones` conserva el propósito de seguimiento definido en el esquema del proyecto.

El acceso usa `usuarios`: el formulario transforma `persona` a `usuario_final`, `familiar` a `cuidador` y `profesional` a `terapeuta`. Cada cuenta nueva recibe también un registro inicial en `perfiles_accesibilidad`.

Las actividades, los pasos de la rutina diaria y los eventos del calendario se guardan asociados al usuario que inició sesión. Desde el panel puedes agregarlos, cambiar el estado de las actividades y los pasos de rutina, y eliminar entradas. Cada día tiene su propia rutina.

La biblioteca tiene seis categorías de ocho pictogramas cada una: Necesidades, Emociones, Acciones, Personas, Lugares y Objetos. La búsqueda y los filtros de favoritos/guardados usan ese catálogo; las preferencias se guardan por usuario en MySQL.

El panel cambia según el rol de la cuenta: persona, educador/cuidador o profesional. Para conectar cuentas reales, una persona solicita el vínculo usando el correo del educador o profesional; el destinatario acepta la invitación desde su bandeja. Educadores y profesionales pueden solicitar vínculo con una persona. Solo después de aceptar aparece el chat. Los mensajes y estados de lectura se guardan en MySQL.

El SQL también incluye los datos de demostración del proyecto. Puedes entrar con `demo@conexiontea.com` y la contraseña `123456`. Esa cuenta es solo para pruebas locales; no uses estas credenciales al publicar el sitio.

También hay perfiles de prueba para `cuidador@conexiontea.com` y `terapeuta@conexiontea.com`, ambos con contraseña `123456`. En el formulario, el rol `familiar` corresponde al panel de educador/cuidador y `profesional` al panel profesional.

No publiques ni compartas el archivo `.env`: contiene la contraseña de tu base de datos. `.env.example` es solo una plantilla sin secretos. Las contraseñas de los usuarios se guardan cifradas con bcrypt.

Rutas incluidas: `GET /api/health`, endpoints de registro/login, `GET /api/pictograms/categories`, rutas de biblioteca y chat, `GET/POST /api/chat/requests`, `PATCH /api/chat/requests/:id`, `GET /api/chat/contacts`, `GET /api/chat/:contactId/messages`, `POST /api/chat/messages` y rutas protegidas de actividades, rutina diaria y calendario.

Este prototipo es para desarrollo local, no para publicar con datos reales. Antes de producción hay que configurar un secreto de sesión seguro, HTTPS, protección contra intentos repetidos de acceso, copias de seguridad y una política de privacidad adecuada.
