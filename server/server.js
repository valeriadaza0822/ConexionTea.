require("dotenv").config({ path: require("node:path").join(__dirname, "..", ".env") });

const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const path = require("node:path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;
const mysqlConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "conexiontea",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
if (isProduction && !sessionSecret) {
  throw new Error("Define SESSION_SECRET antes de ejecutar el servidor en producción.");
}

const database = mysql.createPool(mysqlConfig);
const sessionStore = new MySQLStore({
  ...mysqlConfig,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 604800000
});
let databaseReady = false;

async function initializeDatabase() {
  await database.execute("SELECT id_usuario FROM usuarios LIMIT 0");
  await database.execute("SELECT id_usuario FROM perfiles_accesibilidad LIMIT 0");
  await database.execute("SELECT id_actividad FROM actividades LIMIT 0");
  await database.execute("SELECT id_rutina FROM rutina_diaria LIMIT 0");
  await database.execute("SELECT id_evento FROM eventos_calendario LIMIT 0");
  await database.execute("SELECT id_biblioteca FROM biblioteca_pictogramas LIMIT 0");
  await database.execute("SELECT id_catalogo FROM catalogo_pictogramas LIMIT 0");
  await database.execute("SELECT id_mensaje FROM mensajes_chat LIMIT 0");
  await database.execute("SELECT id_solicitud FROM solicitudes_vinculo LIMIT 0");
}

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_request, response) => {
  if (!databaseReady) {
    return response.status(503).json({ status: "error", database: "disconnected" });
  }
  response.json({ status: "ok", service: "ConexiónTEA API", database: "connected" });
});

app.use("/api", (_request, response, next) => {
  if (!databaseReady) {
    return response.status(503).json({ error: "La base de datos MySQL todavía no está disponible." });
  }
  next();
});

app.use(session({
  store: sessionStore,
  secret: sessionSecret || "solo-desarrollo-cambia-este-secreto",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

const databaseRoleByFormRole = {
  persona: "usuario_final",
  familiar: "cuidador",
  profesional: "terapeuta"
};

const formRoleByDatabaseRole = {
  usuario_final: "persona",
  cuidador: "familiar",
  terapeuta: "profesional",
  administrador: "administrador"
};

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: formRoleByDatabaseRole[row.role] || row.role
  };
}

function startSession(request, user) {
  return new Promise((resolve, reject) => {
    request.session.regenerate(error => {
      if (error) return reject(error);
      request.session.userId = user.id;
      request.session.save(saveError => saveError ? reject(saveError) : resolve());
    });
  });
}

async function seedPlannerData(connection, userId) {
  const activities = [
    ["Lectura", "Realizar actividad de lectura."],
    ["Matemáticas", "Resolver ejercicios."],
    ["Descanso", "Tomar un momento de descanso."]
  ];
  for (const [title, description] of activities) {
    await connection.execute(
      "INSERT INTO actividades (id_usuario, titulo, descripcion, estado) VALUES (?, ?, ?, ?)",
      [userId, title, description, title === "Descanso" ? "completada" : "pendiente"]
    );
  }

  const routine = [
    ["07:00", "Levantarse"],
    ["08:00", "Desayunar"],
    ["08:30", "Prepararse"],
    ["09:00", "Ir a la escuela"],
    ["12:00", "Realizar actividades"],
    ["13:00", "Almorzar"],
    ["15:00", "Descansar"],
    ["16:00", "Regresar a casa"]
  ];
  for (const [index, [time, title]] of routine.entries()) {
    await connection.execute(
      "INSERT INTO rutina_diaria (id_usuario, fecha, hora, titulo, orden) VALUES (?, CURRENT_DATE, ?, ?, ?)",
      [userId, time, title, index + 1]
    );
  }

  const events = [
    ["Actividad académica", "Actividad de aprendizaje."],
    ["Sesión de comunicación", "Práctica de comunicación."],
    ["Actividad de rutina", "Revisar la rutina diaria."]
  ];
  for (const [index, [title, description]] of events.entries()) {
    await connection.execute(
      `INSERT INTO eventos_calendario (id_usuario, titulo, descripcion, fecha)
       VALUES (?, ?, ?, DATE_ADD(CURRENT_DATE, INTERVAL ${index} DAY))`,
      [userId, title, description]
    );
  }
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function requireUser(request, response, next) {
  if (!request.session.userId) {
    return response.status(401).json({ error: "Inicia sesión para continuar." });
  }
  next();
}

async function usersCanChat(firstUserId, secondUserId) {
  if (!Number.isInteger(secondUserId) || firstUserId === secondUserId) return false;
  const [rows] = await database.execute(
    `SELECT 1
     FROM cuidadores_vinculos v
     JOIN usuarios principal ON principal.id_usuario = v.id_usuario_principal AND principal.estado = 'activo'
     JOIN usuarios relacionado ON relacionado.id_usuario = v.id_usuario_cuidador AND relacionado.estado = 'activo'
     WHERE v.estado = 'activo'
       AND ((v.id_usuario_principal = ? AND v.id_usuario_cuidador = ?)
         OR (v.id_usuario_principal = ? AND v.id_usuario_cuidador = ?))
     LIMIT 1`,
    [firstUserId, secondUserId, secondUserId, firstUserId]
  );
  return rows.length > 0;
}

app.post("/api/auth/register", async (request, response, next) => {
  const name = typeof request.body.name === "string" ? request.body.name.trim() : "";
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body.password === "string" ? request.body.password : "";
  const role = request.body.role;

  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    return response.status(400).json({ error: "Escribe un nombre y un correo válidos." });
  }
  if (password.length < 8 || password.length > 200) {
    return response.status(400).json({ error: "La contraseña debe tener entre 8 y 200 caracteres." });
  }
  if (!["persona", "familiar", "profesional"].includes(role)) {
    return response.status(400).json({ error: "Selecciona un rol válido." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const connection = await database.getConnection();
    let user;
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)",
        [name, email, passwordHash, databaseRoleByFormRole[role]]
      );
      await connection.execute(
        "INSERT INTO perfiles_accesibilidad (id_usuario) VALUES (?)",
        [result.insertId]
      );
      await seedPlannerData(connection, result.insertId);
      await connection.commit();
      user = publicUser({
        id: result.insertId,
        name,
        email,
        role: databaseRoleByFormRole[role]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    await startSession(request, user);
    response.status(201).json({ user });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({ error: "Ya existe una cuenta con ese correo. Inicia sesión." });
    }
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body.password === "string" ? request.body.password : "";
  try {
    const [rows] = await database.execute(
      "SELECT id_usuario AS id, nombre AS name, email, password_hash, rol AS role FROM usuarios WHERE email = ? AND estado = 'activo' LIMIT 1",
      [email]
    );
    const row = rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return response.status(401).json({ error: "Correo o contraseña incorrectos." });
    }
    await database.execute(
      "UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id_usuario = ?",
      [row.id]
    );
    const user = publicUser(row);
    await startSession(request, user);
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/demo", async (request, response, next) => {
  try {
    const [rows] = await database.execute(
      "SELECT id_usuario AS id, nombre AS name, email, rol AS role FROM usuarios WHERE email = ? AND estado = 'activo' LIMIT 1",
      ["demo@conexiontea.com"]
    );
    if (!rows[0]) {
      return response.status(404).json({ error: "Ejecuta database.sql para crear la cuenta de demostración." });
    }
    const user = publicUser(rows[0]);
    await startSession(request, user);
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", async (request, response, next) => {
  if (!request.session.userId) return response.status(401).json({ error: "No has iniciado sesión." });
  try {
    const [rows] = await database.execute(
      "SELECT id_usuario AS id, nombre AS name, email, rol AS role FROM usuarios WHERE id_usuario = ? AND estado = 'activo' LIMIT 1",
      [request.session.userId]
    );
    if (!rows[0]) return response.status(401).json({ error: "No has iniciado sesión." });
    response.json({ user: publicUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", (request, response, next) => {
  request.session.destroy(error => {
    if (error) return next(error);
    response.clearCookie("connect.sid", { httpOnly: true, sameSite: "lax", secure: isProduction });
    response.status(204).end();
  });
});

app.get("/api/chat/contacts", requireUser, async (request, response, next) => {
  try {
    const [rows] = await database.execute(
      `SELECT DISTINCT u.id_usuario AS id, u.nombre AS name, u.rol AS role,
              v.tipo_relacion AS relationship
       FROM cuidadores_vinculos v
       JOIN usuarios u
         ON u.id_usuario = CASE
           WHEN v.id_usuario_principal = ? THEN v.id_usuario_cuidador
           ELSE v.id_usuario_principal
         END
       WHERE (v.id_usuario_principal = ? OR v.id_usuario_cuidador = ?)
         AND v.estado = 'activo' AND u.estado = 'activo' AND u.id_usuario <> ?
       ORDER BY u.nombre`,
      [request.session.userId, request.session.userId, request.session.userId, request.session.userId]
    );
    response.json({ contacts: rows.map(publicUser) });
  } catch (error) { next(error); }
});

app.get("/api/chat/requests", requireUser, async (request, response, next) => {
  try {
    const [rows] = await database.execute(
      `SELECT s.id_solicitud AS id, s.tipo_relacion AS relationship,
              u.id_usuario AS requesterId, u.nombre AS requesterName, u.email AS requesterEmail
       FROM solicitudes_vinculo s
       JOIN usuarios u ON u.id_usuario = s.id_solicitante
       WHERE s.id_destinatario = ? AND s.estado = 'pendiente'
       ORDER BY s.fecha_solicitud DESC`,
      [request.session.userId]
    );
    response.json({ requests: rows });
  } catch (error) { next(error); }
});

app.post("/api/chat/requests", requireUser, async (request, response, next) => {
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const requestedRelationship = request.body.relationship;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return response.status(400).json({ error: "Escribe un correo válido." });
  }

  try {
    const [requesterRows] = await database.execute(
      "SELECT id_usuario AS id, rol AS role FROM usuarios WHERE id_usuario = ? AND estado = 'activo' LIMIT 1",
      [request.session.userId]
    );
    const [targetRows] = await database.execute(
      "SELECT id_usuario AS id, rol AS role FROM usuarios WHERE email = ? AND estado = 'activo' LIMIT 1",
      [email]
    );
    const requester = requesterRows[0];
    const target = targetRows[0];
    if (!target) return response.status(404).json({ error: "No hay una cuenta activa con ese correo." });
    if (target.id === requester.id) return response.status(400).json({ error: "No puedes vincular tu cuenta contigo mismo." });

    let relationship = requestedRelationship;
    if (requester.role === "usuario_final") {
      if (!["familiar", "profesional"].includes(relationship)) {
        return response.status(400).json({ error: "Elige si quieres vincular un educador/cuidador o un profesional." });
      }
      const expectedRole = relationship === "familiar" ? "cuidador" : "terapeuta";
      if (target.role !== expectedRole) {
        return response.status(400).json({ error: "El rol de esa cuenta no coincide con el tipo de vínculo." });
      }
    } else if (["cuidador", "terapeuta"].includes(requester.role)) {
      relationship = requester.role === "cuidador" ? "familiar" : "profesional";
      if (target.role !== "usuario_final") {
        return response.status(400).json({ error: "Educadores y profesionales deben vincularse con una cuenta de persona." });
      }
    } else {
      return response.status(403).json({ error: "Este rol no puede crear vínculos de chat." });
    }

    if (await usersCanChat(requester.id, target.id)) {
      return response.status(409).json({ error: "Ya existe un vínculo activo con esa cuenta." });
    }
    const [pendingRows] = await database.execute(
      `SELECT id_solicitud FROM solicitudes_vinculo
       WHERE estado = 'pendiente' AND tipo_relacion = ?
         AND ((id_solicitante = ? AND id_destinatario = ?) OR (id_solicitante = ? AND id_destinatario = ?))
       LIMIT 1`,
      [relationship, requester.id, target.id, target.id, requester.id]
    );
    if (pendingRows.length) return response.status(409).json({ error: "Ya hay una solicitud pendiente entre esas cuentas." });

    const [result] = await database.execute(
      "INSERT INTO solicitudes_vinculo (id_solicitante, id_destinatario, tipo_relacion) VALUES (?, ?, ?)",
      [requester.id, target.id, relationship]
    );
    response.status(201).json({ id: result.insertId, status: "pendiente" });
  } catch (error) { next(error); }
});

app.patch("/api/chat/requests/:id", requireUser, async (request, response, next) => {
  const decision = request.body.decision;
  if (!["aceptar", "rechazar"].includes(decision)) {
    return response.status(400).json({ error: "Selecciona aceptar o rechazar." });
  }

  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT s.id_solicitante AS requesterId, s.id_destinatario AS recipientId,
              s.tipo_relacion AS relationship, u.rol AS requesterRole, d.rol AS recipientRole
       FROM solicitudes_vinculo s
       JOIN usuarios u ON u.id_usuario = s.id_solicitante
       JOIN usuarios d ON d.id_usuario = s.id_destinatario
       WHERE s.id_solicitud = ? AND s.id_destinatario = ? AND s.estado = 'pendiente'
       FOR UPDATE`,
      [request.params.id, request.session.userId]
    );
    const invite = rows[0];
    if (!invite) {
      await connection.rollback();
      return response.status(404).json({ error: "La solicitud ya no está disponible." });
    }

    if (decision === "aceptar") {
      const roles = [invite.requesterRole, invite.recipientRole];
      const validPair = invite.relationship === "familiar"
        ? roles.includes("usuario_final") && roles.includes("cuidador")
        : roles.includes("usuario_final") && roles.includes("terapeuta");
      if (!validPair) {
        await connection.rollback();
        return response.status(400).json({ error: "Los roles de la solicitud ya no coinciden." });
      }
      const personId = invite.requesterRole === "usuario_final" ? invite.requesterId : invite.recipientId;
      const linkedId = invite.requesterRole === "usuario_final" ? invite.recipientId : invite.requesterId;
      const relationName = invite.relationship === "familiar" ? "cuidador" : "terapeuta";
      const [existingLinks] = await connection.execute(
        "SELECT id_vinculo FROM cuidadores_vinculos WHERE id_usuario_principal = ? AND id_usuario_cuidador = ? AND estado = 'activo' LIMIT 1",
        [personId, linkedId]
      );
      if (!existingLinks.length) {
        await connection.execute(
          `INSERT INTO cuidadores_vinculos (id_usuario_principal, id_usuario_cuidador, tipo_relacion, permisos)
           VALUES (?, ?, ?, JSON_OBJECT('ver_progreso', TRUE, 'editar_configuracion', FALSE))`,
          [personId, linkedId, relationName]
        );
      }
    }

    await connection.execute(
      "UPDATE solicitudes_vinculo SET estado = ?, fecha_respuesta = CURRENT_TIMESTAMP WHERE id_solicitud = ?",
      [decision === "aceptar" ? "aceptada" : "rechazada", request.params.id]
    );
    await connection.commit();
    response.json({ status: decision === "aceptar" ? "aceptada" : "rechazada" });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.get("/api/chat/:contactId/messages", requireUser, async (request, response, next) => {
  const contactId = Number(request.params.contactId);
  try {
    if (!await usersCanChat(request.session.userId, contactId)) {
      return response.status(403).json({ error: "Solo puedes conversar con personas vinculadas a tu cuenta." });
    }
    await database.execute(
      "UPDATE mensajes_chat SET leido_en = CURRENT_TIMESTAMP WHERE id_usuario_remitente = ? AND id_usuario_destinatario = ? AND leido_en IS NULL",
      [contactId, request.session.userId]
    );
    const [rows] = await database.execute(
      `SELECT id_mensaje AS id, id_usuario_remitente AS senderId,
              id_usuario_destinatario AS recipientId, contenido AS text,
              DATE_FORMAT(fecha_envio, '%Y-%m-%d %H:%i:%s') AS sentAt,
              leido_en IS NOT NULL AS isRead
       FROM (
         SELECT * FROM mensajes_chat
         WHERE (id_usuario_remitente = ? AND id_usuario_destinatario = ?)
            OR (id_usuario_remitente = ? AND id_usuario_destinatario = ?)
         ORDER BY id_mensaje DESC LIMIT 100
       ) AS conversation
       ORDER BY id_mensaje ASC`,
      [request.session.userId, contactId, contactId, request.session.userId]
    );
    response.json({ messages: rows });
  } catch (error) { next(error); }
});

app.post("/api/chat/messages", requireUser, async (request, response, next) => {
  const recipientId = Number(request.body.recipientId);
  const text = typeof request.body.text === "string" ? request.body.text.trim() : "";
  if (!Number.isInteger(recipientId) || !text || text.length > 2000) {
    return response.status(400).json({ error: "Escribe un mensaje de hasta 2000 caracteres." });
  }
  try {
    if (!await usersCanChat(request.session.userId, recipientId)) {
      return response.status(403).json({ error: "Solo puedes escribir a personas vinculadas a tu cuenta." });
    }
    const [result] = await database.execute(
      "INSERT INTO mensajes_chat (id_usuario_remitente, id_usuario_destinatario, contenido) VALUES (?, ?, ?)",
      [request.session.userId, recipientId, text]
    );
    response.status(201).json({ id: result.insertId });
  } catch (error) { next(error); }
});

app.get("/api/pictograms/categories", requireUser, async (_request, response, next) => {
  try {
    const [rows] = await database.execute(
      "SELECT DISTINCT categoria AS category FROM catalogo_pictogramas ORDER BY FIELD(categoria, 'Necesidades', 'Emociones', 'Acciones', 'Personas', 'Lugares', 'Objetos')"
    );
    response.json({ categories: rows.map(row => row.category) });
  } catch (error) { next(error); }
});

app.get("/api/pictograms", requireUser, async (request, response, next) => {
  const view = request.query.view || "explorar";
  if (!["explorar", "favoritos", "guardados"].includes(view)) {
    return response.status(400).json({ error: "La vista de biblioteca no es válida." });
  }
  try {
    const [categoryRows] = await database.execute(
      "SELECT DISTINCT categoria AS category FROM catalogo_pictogramas ORDER BY FIELD(categoria, 'Necesidades', 'Emociones', 'Acciones', 'Personas', 'Lugares', 'Objetos')"
    );
    const categories = categoryRows.map(row => row.category);
    const category = request.query.category || categories[0];
    if (category !== "Todas" && !categories.includes(category)) {
      return response.status(400).json({ error: "La categoría seleccionada no existe." });
    }

    const filters = [];
    const params = [request.session.userId];
    if (category !== "Todas") {
      filters.push("c.categoria = ?");
      params.push(category);
    }
    if (view === "favoritos") filters.push("b.favorito = TRUE");
    if (view === "guardados") filters.push("b.guardado = TRUE");

    const [rows] = await database.execute(
      `SELECT c.termino_busqueda AS search, c.texto AS text, c.categoria AS category,
              COALESCE(b.favorito, FALSE) AS favorite, COALESCE(b.guardado, FALSE) AS saved
       FROM catalogo_pictogramas c
       LEFT JOIN biblioteca_pictogramas b
         ON b.termino_busqueda = c.termino_busqueda AND b.id_usuario = ?
       WHERE ${filters.join(" AND ") || "1 = 1"}
       ORDER BY c.id_catalogo`,
      [request.session.userId, ...params.slice(1)]
    );
    let items = rows.map(row => ({
      ...row,
      favorite: Boolean(row.favorite),
      saved: Boolean(row.saved)
    }));
    if (view === "favoritos") items = items.filter(item => item.favorite);
    if (view === "guardados") items = items.filter(item => item.saved);
    response.json({ pictograms: items, categories });
  } catch (error) { next(error); }
});

app.put("/api/pictograms/:search", requireUser, async (request, response, next) => {
  const { favorite, saved } = request.body;
  if (typeof favorite !== "boolean" || typeof saved !== "boolean") {
    return response.status(400).json({ error: "El pictograma o sus opciones no son válidos." });
  }
  try {
    const [rows] = await database.execute(
      "SELECT termino_busqueda AS search, texto AS text FROM catalogo_pictogramas WHERE termino_busqueda = ? LIMIT 1",
      [request.params.search]
    );
    const pictogram = rows[0];
    if (!pictogram) return response.status(404).json({ error: "No se encontró ese pictograma." });
    if (!favorite && !saved) {
      await database.execute(
        "DELETE FROM biblioteca_pictogramas WHERE id_usuario = ? AND termino_busqueda = ?",
        [request.session.userId, pictogram.search]
      );
    } else {
      await database.execute(
        `INSERT INTO biblioteca_pictogramas (id_usuario, termino_busqueda, texto, favorito, guardado)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE favorito = VALUES(favorito), guardado = VALUES(guardado), texto = VALUES(texto)`,
        [request.session.userId, pictogram.search, pictogram.text, favorite, saved]
      );
    }
    response.json({ search: pictogram.search, favorite, saved });
  } catch (error) { next(error); }
});

app.get("/api/activities", requireUser, async (request, response, next) => {
  try {
    const [rows] = await database.execute(
      "SELECT id_actividad AS id, titulo AS title, descripcion AS description, estado AS status FROM actividades WHERE id_usuario = ? ORDER BY fecha_creacion, id_actividad",
      [request.session.userId]
    );
    response.json({ activities: rows });
  } catch (error) { next(error); }
});

app.post("/api/activities", requireUser, async (request, response, next) => {
  const title = typeof request.body.title === "string" ? request.body.title.trim() : "";
  const description = typeof request.body.description === "string" ? request.body.description.trim() : "";
  if (!title || title.length > 120 || description.length > 500) {
    return response.status(400).json({ error: "Escribe un título de hasta 120 caracteres y una descripción de hasta 500." });
  }
  try {
    const [result] = await database.execute(
      "INSERT INTO actividades (id_usuario, titulo, descripcion) VALUES (?, ?, ?)",
      [request.session.userId, title, description]
    );
    response.status(201).json({ activity: { id: result.insertId, title, description, status: "pendiente" } });
  } catch (error) { next(error); }
});

app.patch("/api/activities/:id", requireUser, async (request, response, next) => {
  const status = request.body.status;
  if (!["pendiente", "completada"].includes(status)) {
    return response.status(400).json({ error: "Selecciona un estado válido." });
  }
  try {
    const [result] = await database.execute(
      "UPDATE actividades SET estado = ? WHERE id_actividad = ? AND id_usuario = ?",
      [status, request.params.id, request.session.userId]
    );
    if (!result.affectedRows) return response.status(404).json({ error: "No se encontró esa actividad." });
    response.json({ status });
  } catch (error) { next(error); }
});

app.delete("/api/activities/:id", requireUser, async (request, response, next) => {
  try {
    const [result] = await database.execute(
      "DELETE FROM actividades WHERE id_actividad = ? AND id_usuario = ?",
      [request.params.id, request.session.userId]
    );
    if (!result.affectedRows) return response.status(404).json({ error: "No se encontró esa actividad." });
    response.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/routine", requireUser, async (request, response, next) => {
  try {
    const [rows] = await database.execute(
      "SELECT id_rutina AS id, TIME_FORMAT(hora, '%H:%i') AS time, titulo AS title, completada AS completed FROM rutina_diaria WHERE id_usuario = ? AND fecha = CURRENT_DATE ORDER BY orden, hora, id_rutina",
      [request.session.userId]
    );
    response.json({ routine: rows });
  } catch (error) { next(error); }
});

app.post("/api/routine", requireUser, async (request, response, next) => {
  const title = typeof request.body.title === "string" ? request.body.title.trim() : "";
  const time = request.body.time || null;
  if (!title || title.length > 120 || (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
    return response.status(400).json({ error: "Escribe una actividad y una hora válida." });
  }
  try {
    const [orderRows] = await database.execute(
      "SELECT COALESCE(MAX(orden), 0) + 1 AS nextOrder FROM rutina_diaria WHERE id_usuario = ? AND fecha = CURRENT_DATE",
      [request.session.userId]
    );
    const [result] = await database.execute(
      "INSERT INTO rutina_diaria (id_usuario, fecha, hora, titulo, orden) VALUES (?, CURRENT_DATE, ?, ?, ?)",
      [request.session.userId, time, title, orderRows[0].nextOrder]
    );
    response.status(201).json({ routineItem: { id: result.insertId, time, title, completed: 0 } });
  } catch (error) { next(error); }
});

app.patch("/api/routine/:id", requireUser, async (request, response, next) => {
  if (typeof request.body.completed !== "boolean") {
    return response.status(400).json({ error: "El estado de la rutina no es válido." });
  }
  try {
    const [result] = await database.execute(
      "UPDATE rutina_diaria SET completada = ? WHERE id_rutina = ? AND id_usuario = ? AND fecha = CURRENT_DATE",
      [request.body.completed, request.params.id, request.session.userId]
    );
    if (!result.affectedRows) return response.status(404).json({ error: "No se encontró ese paso de rutina." });
    response.json({ completed: request.body.completed });
  } catch (error) { next(error); }
});

app.delete("/api/routine/:id", requireUser, async (request, response, next) => {
  try {
    const [result] = await database.execute(
      "DELETE FROM rutina_diaria WHERE id_rutina = ? AND id_usuario = ? AND fecha = CURRENT_DATE",
      [request.params.id, request.session.userId]
    );
    if (!result.affectedRows) return response.status(404).json({ error: "No se encontró ese paso de rutina." });
    response.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/calendar", requireUser, async (request, response, next) => {
  try {
    const [rows] = await database.execute(
      "SELECT id_evento AS id, titulo AS title, descripcion AS description, DATE_FORMAT(fecha, '%Y-%m-%d') AS date, TIME_FORMAT(hora, '%H:%i') AS time FROM eventos_calendario WHERE id_usuario = ? ORDER BY fecha, hora, id_evento",
      [request.session.userId]
    );
    response.json({ events: rows });
  } catch (error) { next(error); }
});

app.post("/api/calendar", requireUser, async (request, response, next) => {
  const title = typeof request.body.title === "string" ? request.body.title.trim() : "";
  const description = typeof request.body.description === "string" ? request.body.description.trim() : "";
  const date = request.body.date;
  const time = request.body.time || null;
  if (!title || title.length > 120 || description.length > 500 || !isValidDate(date) || (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
    return response.status(400).json({ error: "Revisa el título, la fecha y la hora del evento." });
  }
  try {
    const [result] = await database.execute(
      "INSERT INTO eventos_calendario (id_usuario, titulo, descripcion, fecha, hora) VALUES (?, ?, ?, ?, ?)",
      [request.session.userId, title, description, date, time]
    );
    response.status(201).json({ event: { id: result.insertId, title, description, date, time } });
  } catch (error) { next(error); }
});

app.delete("/api/calendar/:id", requireUser, async (request, response, next) => {
  try {
    const [result] = await database.execute(
      "DELETE FROM eventos_calendario WHERE id_evento = ? AND id_usuario = ?",
      [request.params.id, request.session.userId]
    );
    if (!result.affectedRows) return response.status(404).json({ error: "No se encontró ese evento." });
    response.status(204).end();
  } catch (error) { next(error); }
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "Ruta de API no encontrada." });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Ocurrió un error. Inténtalo de nuevo." });
});

app.listen(port, () => {
  console.log(`ConexiónTEA está disponible en http://localhost:${port}`);
});

initializeDatabase()
  .then(() => {
    databaseReady = true;
    console.log("Conexión con MySQL establecida.");
  })
  .catch(error => {
    console.error("MySQL no está disponible. La web abre, pero la API necesita una conexión válida:", error.code || error.message);
  });