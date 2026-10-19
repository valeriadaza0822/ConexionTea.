CREATE DATABASE IF NOT EXISTS conexiontea
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE conexiontea;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
  rol ENUM('usuario_final', 'cuidador', 'terapeuta', 'administrador') DEFAULT 'usuario_final',
  ultimo_acceso TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_rol (rol),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comunicaciones (
  id_comunicacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pictogramas_usados JSON,
  frase_texto TEXT,
  contexto VARCHAR(100),
  duracion_segundos INT,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_comunicaciones_usuario (id_usuario),
  INDEX idx_comunicaciones_fecha (fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pictogramas (
  id_pictograma INT AUTO_INCREMENT PRIMARY KEY,
  codigo_arasaac VARCHAR(50) UNIQUE,
  categoria VARCHAR(50) NOT NULL,
  etiquetas TEXT,
  ruta_imagen VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  veces_usado INT DEFAULT 0,
  INDEX idx_pictogramas_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS progreso (
  id_progreso INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  total_comunicaciones INT DEFAULT 0,
  nivel_autonomia VARCHAR(50) DEFAULT 'inicial',
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_progreso_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL,
  tipo_evento VARCHAR(50) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resultado ENUM('exito', 'fallo') DEFAULT 'exito',
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_auditoria_fecha (fecha_hora),
  INDEX idx_auditoria_tipo (tipo_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS perfiles_accesibilidad (
  id_perfil INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL UNIQUE,
  esquema_colores VARCHAR(50) DEFAULT 'claro',
  tamaño_fuente INT DEFAULT 16,
  nivel_contraste VARCHAR(20) DEFAULT 'normal',
  animaciones_activas BOOLEAN DEFAULT TRUE,
  sonidos_activos BOOLEAN DEFAULT TRUE,
  tiempo_espera_ms INT DEFAULT 3000,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_perfiles_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS frases_frecuentes (
  id_frase INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre_frase VARCHAR(100) NOT NULL,
  pictogramas_secuencia JSON,
  texto_asociado TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  frecuencia_uso INT DEFAULT 0,
  ultima_utilizacion TIMESTAMP NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_frases_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reportes_terapeuta (
  id_reporte INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_terapeuta INT NOT NULL,
  fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metricas_incluidas JSON,
  observaciones TEXT,
  recomendaciones TEXT,
  ruta_pdf VARCHAR(255) NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_terapeuta) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  INDEX idx_reportes_usuario (id_usuario),
  INDEX idx_reportes_terapeuta (id_terapeuta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cuidadores_vinculos (
  id_vinculo INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario_principal INT NOT NULL,
  id_usuario_cuidador INT NOT NULL,
  tipo_relacion VARCHAR(50) NOT NULL,
  permisos JSON,
  fecha_vinculacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  FOREIGN KEY (id_usuario_principal) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario_cuidador) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_vinculos_principal (id_usuario_principal),
  INDEX idx_vinculos_cuidador (id_usuario_cuidador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mensajes_chat (
  id_mensaje BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario_remitente INT NOT NULL,
  id_usuario_destinatario INT NOT NULL,
  contenido VARCHAR(2000) NOT NULL,
  fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leido_en TIMESTAMP NULL,
  FOREIGN KEY (id_usuario_remitente) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario_destinatario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_mensajes_conversacion (id_usuario_remitente, id_usuario_destinatario, id_mensaje),
  INDEX idx_mensajes_destino_lectura (id_usuario_destinatario, leido_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS solicitudes_vinculo (
  id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
  id_solicitante INT NOT NULL,
  id_destinatario INT NOT NULL,
  tipo_relacion ENUM('familiar', 'profesional') NOT NULL,
  estado ENUM('pendiente', 'aceptada', 'rechazada') NOT NULL DEFAULT 'pendiente',
  fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta TIMESTAMP NULL,
  FOREIGN KEY (id_solicitante) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_solicitudes_destinatario (id_destinatario, estado),
  INDEX idx_solicitudes_solicitante (id_solicitante, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sesiones (
  id_sesion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TIMESTAMP NULL,
  duracion_segundos INT NULL,
  dispositivo VARCHAR(100) NULL,
  ip_address VARCHAR(45) NULL,
  acciones_realizadas INT DEFAULT 0,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_sesiones_usuario (id_usuario),
  INDEX idx_sesiones_inicio (fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tokens_recuperacion (
  id_token INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  fecha_expiracion TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_tokens_hash (token_hash),
  INDEX idx_tokens_expiracion (fecha_expiracion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS actividades (
  id_actividad INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  descripcion VARCHAR(500) NOT NULL DEFAULT '',
  estado ENUM('pendiente', 'completada') NOT NULL DEFAULT 'pendiente',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_actividades_usuario (id_usuario),
  INDEX idx_actividades_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rutina_diaria (
  id_rutina INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NULL,
  titulo VARCHAR(120) NOT NULL,
  completada BOOLEAN NOT NULL DEFAULT FALSE,
  orden INT NOT NULL DEFAULT 0,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_rutina_usuario_fecha (id_usuario, fecha, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS eventos_calendario (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  descripcion VARCHAR(500) NOT NULL DEFAULT '',
  fecha DATE NOT NULL,
  hora TIME NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_eventos_usuario_fecha (id_usuario, fecha, hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biblioteca_pictogramas (
  id_biblioteca INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  termino_busqueda VARCHAR(100) NOT NULL,
  texto VARCHAR(120) NOT NULL,
  favorito BOOLEAN NOT NULL DEFAULT FALSE,
  guardado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_biblioteca_usuario_termino (id_usuario, termino_busqueda),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_biblioteca_favoritos (id_usuario, favorito),
  INDEX idx_biblioteca_guardados (id_usuario, guardado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS catalogo_pictogramas (
  id_catalogo INT AUTO_INCREMENT PRIMARY KEY,
  termino_busqueda VARCHAR(100) NOT NULL UNIQUE,
  texto VARCHAR(120) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_catalogo_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO catalogo_pictogramas (termino_busqueda, texto, categoria) VALUES
  ('comer', 'Comer', 'Necesidades'),
  ('beber', 'Beber', 'Necesidades'),
  ('baño', 'Ir al baño', 'Necesidades'),
  ('ayuda', 'Pedir ayuda', 'Necesidades'),
  ('descansar', 'Descansar', 'Necesidades'),
  ('dolor', 'Me duele', 'Necesidades'),
  ('frío', 'Tengo frío', 'Necesidades'),
  ('calor', 'Tengo calor', 'Necesidades'),
  ('feliz', 'Feliz', 'Emociones'),
  ('triste', 'Triste', 'Emociones'),
  ('enfadado', 'Enfadado', 'Emociones'),
  ('miedo', 'Tengo miedo', 'Emociones'),
  ('tranquilo', 'Tranquilo', 'Emociones'),
  ('cansado', 'Cansado', 'Emociones'),
  ('sorprendido', 'Sorprendido', 'Emociones'),
  ('nervioso', 'Nervioso', 'Emociones'),
  ('jugar', 'Jugar', 'Acciones'),
  ('leer', 'Leer', 'Acciones'),
  ('caminar', 'Caminar', 'Acciones'),
  ('sentarse', 'Sentarse', 'Acciones'),
  ('escuchar', 'Escuchar', 'Acciones'),
  ('esperar', 'Esperar', 'Acciones'),
  ('escribir', 'Escribir', 'Acciones'),
  ('abrir', 'Abrir', 'Acciones'),
  ('madre', 'Mamá', 'Personas'),
  ('padre', 'Papá', 'Personas'),
  ('hermano', 'Hermano', 'Personas'),
  ('hermana', 'Hermana', 'Personas'),
  ('niño', 'Niño', 'Personas'),
  ('niña', 'Niña', 'Personas'),
  ('profesor', 'Profesor', 'Personas'),
  ('amigo', 'Amigo', 'Personas'),
  ('casa', 'Casa', 'Lugares'),
  ('escuela', 'Escuela', 'Lugares'),
  ('parque', 'Parque', 'Lugares'),
  ('hospital', 'Hospital', 'Lugares'),
  ('supermercado', 'Supermercado', 'Lugares'),
  ('comedor', 'Comedor', 'Lugares'),
  ('patio', 'Patio', 'Lugares'),
  ('biblioteca', 'Biblioteca', 'Lugares'),
  ('pelota', 'Pelota', 'Objetos'),
  ('libro', 'Libro', 'Objetos'),
  ('agua', 'Agua', 'Objetos'),
  ('manzana', 'Manzana', 'Objetos'),
  ('teléfono', 'Teléfono', 'Objetos'),
  ('mochila', 'Mochila', 'Objetos'),
  ('lápiz', 'Lápiz', 'Objetos'),
  ('silla', 'Silla', 'Objetos');

-- Datos de demostración. No reemplazan cuentas ni duplican registros existentes.
INSERT IGNORE INTO usuarios (email, password_hash, nombre, rol, estado) VALUES
  ('demo@conexiontea.com', '$2a$10$TmtAJLxrysIfWgNQ8.JaDeSqdxP9YQdDOXt.8p3XmxUpAkYNSo5r2', 'Usuario Demo', 'usuario_final', 'activo'),
  ('cuidador@conexiontea.com', '$2a$10$TmtAJLxrysIfWgNQ8.JaDeSqdxP9YQdDOXt.8p3XmxUpAkYNSo5r2', 'Cuidador Demo', 'cuidador', 'activo'),
  ('terapeuta@conexiontea.com', '$2a$10$TmtAJLxrysIfWgNQ8.JaDeSqdxP9YQdDOXt.8p3XmxUpAkYNSo5r2', 'Terapeuta Demo', 'terapeuta', 'activo'),
  ('admin@conexiontea.com', '$2a$10$TmtAJLxrysIfWgNQ8.JaDeSqdxP9YQdDOXt.8p3XmxUpAkYNSo5r2', 'Administrador', 'administrador', 'activo');

INSERT IGNORE INTO pictogramas (codigo_arasaac, categoria, etiquetas, ruta_imagen) VALUES
  ('ARA-001', 'emociones', 'feliz, alegria, sonriente', '/img/pictogramas/001.png'),
  ('ARA-002', 'emociones', 'triste, llorando', '/img/pictogramas/002.png'),
  ('ARA-003', 'acciones', 'comer, alimento, hambre', '/img/pictogramas/003.png'),
  ('ARA-004', 'acciones', 'beber, agua, sed', '/img/pictogramas/004.png'),
  ('ARA-005', 'personas', 'familia, madre, padre', '/img/pictogramas/005.png'),
  ('ARA-006', 'lugares', 'casa, hogar, dormitorio', '/img/pictogramas/006.png'),
  ('ARA-007', 'objetos', 'juguete, pelota, juego', '/img/pictogramas/007.png'),
  ('ARA-008', 'acciones', 'dormir, cama, descanso', '/img/pictogramas/008.png'),
  ('ARA-009', 'emociones', 'enojo, furia, molesto', '/img/pictogramas/009.png'),
  ('ARA-010', 'acciones', 'jugar, diversion', '/img/pictogramas/010.png');

INSERT INTO comunicaciones (id_usuario, frase_texto, contexto, duracion_segundos)
SELECT u.id_usuario, demo.frase_texto, demo.contexto, demo.duracion_segundos
FROM (
  SELECT 'demo@conexiontea.com' AS email, 'Tengo hambre' AS frase_texto, 'hogar' AS contexto, 30 AS duracion_segundos
  UNION ALL SELECT 'demo@conexiontea.com', 'Quiero jugar', 'escuela', 45
  UNION ALL SELECT 'demo@conexiontea.com', 'Estoy feliz', 'hogar', 20
  UNION ALL SELECT 'cuidador@conexiontea.com', 'Necesito ayuda', 'terapia', 60
  UNION ALL SELECT 'demo@conexiontea.com', 'Quiero dormir', 'hogar', 25
) AS demo
JOIN usuarios u ON u.email = demo.email
WHERE NOT EXISTS (
  SELECT 1 FROM comunicaciones c
  WHERE c.id_usuario = u.id_usuario
    AND c.frase_texto = demo.frase_texto
    AND c.contexto = demo.contexto
);

INSERT INTO progreso (id_usuario, fecha_inicio, fecha_fin, total_comunicaciones, nivel_autonomia)
SELECT u.id_usuario, demo.fecha_inicio, demo.fecha_fin, demo.total_comunicaciones, demo.nivel_autonomia
FROM (
  SELECT 'demo@conexiontea.com' AS email, '2026-01-01' AS fecha_inicio, '2026-01-31' AS fecha_fin, 15 AS total_comunicaciones, 'intermedio' AS nivel_autonomia
  UNION ALL SELECT 'demo@conexiontea.com', '2026-02-01', '2026-02-28', 25, 'avanzado'
  UNION ALL SELECT 'cuidador@conexiontea.com', '2026-01-01', '2026-01-31', 8, 'inicial'
) AS demo
JOIN usuarios u ON u.email = demo.email
WHERE NOT EXISTS (
  SELECT 1 FROM progreso p
  WHERE p.id_usuario = u.id_usuario
    AND p.fecha_inicio = demo.fecha_inicio
    AND p.fecha_fin = demo.fecha_fin
);

INSERT IGNORE INTO perfiles_accesibilidad (id_usuario, esquema_colores, tamaño_fuente, nivel_contraste)
SELECT u.id_usuario, demo.esquema_colores, demo.tamaño_fuente, demo.nivel_contraste
FROM (
  SELECT 'demo@conexiontea.com' AS email, 'claro' AS esquema_colores, 18 AS tamaño_fuente, 'alto' AS nivel_contraste
  UNION ALL SELECT 'cuidador@conexiontea.com', 'oscuro', 20, 'muy-alto'
  UNION ALL SELECT 'terapeuta@conexiontea.com', 'claro', 16, 'normal'
) AS demo
JOIN usuarios u ON u.email = demo.email;

INSERT INTO frases_frecuentes (id_usuario, nombre_frase, texto_asociado, frecuencia_uso)
SELECT u.id_usuario, demo.nombre_frase, demo.texto_asociado, demo.frecuencia_uso
FROM (
  SELECT 'demo@conexiontea.com' AS email, 'Saludo' AS nombre_frase, 'Hola, buenos días' AS texto_asociado, 10 AS frecuencia_uso
  UNION ALL SELECT 'demo@conexiontea.com', 'Necesidad', 'Tengo hambre', 25
  UNION ALL SELECT 'cuidador@conexiontea.com', 'Ayuda', 'Necesito ayuda por favor', 15
) AS demo
JOIN usuarios u ON u.email = demo.email
WHERE NOT EXISTS (
  SELECT 1 FROM frases_frecuentes f
  WHERE f.id_usuario = u.id_usuario
    AND f.nombre_frase = demo.nombre_frase
    AND f.texto_asociado = demo.texto_asociado
);

INSERT INTO cuidadores_vinculos (id_usuario_principal, id_usuario_cuidador, tipo_relacion, permisos)
SELECT principal.id_usuario, cuidador.id_usuario, vinculo.tipo_relacion, vinculo.permisos
FROM (
  SELECT 'cuidador@conexiontea.com' AS email_cuidador, 'demo@conexiontea.com' AS email_principal, 'padre' AS tipo_relacion,
    JSON_OBJECT('ver_progreso', TRUE, 'editar_configuracion', TRUE) AS permisos
  UNION ALL SELECT 'terapeuta@conexiontea.com', 'demo@conexiontea.com', 'terapeuta',
    JSON_OBJECT('ver_progreso', TRUE, 'editar_configuracion', FALSE)
) AS vinculo
JOIN usuarios principal ON principal.email = vinculo.email_principal
JOIN usuarios cuidador ON cuidador.email = vinculo.email_cuidador
WHERE NOT EXISTS (
  SELECT 1 FROM cuidadores_vinculos cv
  WHERE cv.id_usuario_principal = principal.id_usuario
    AND cv.id_usuario_cuidador = cuidador.id_usuario
);

INSERT INTO actividades (id_usuario, titulo, descripcion, estado)
SELECT u.id_usuario, demo.titulo, demo.descripcion, demo.estado
FROM (
  SELECT 'Lectura' AS titulo, 'Realizar actividad de lectura.' AS descripcion, 'pendiente' AS estado
  UNION ALL SELECT 'Matemáticas', 'Resolver ejercicios.', 'pendiente'
  UNION ALL SELECT 'Descanso', 'Tomar un momento de descanso.', 'completada'
) AS demo
JOIN usuarios u ON u.email = 'demo@conexiontea.com'
WHERE NOT EXISTS (
  SELECT 1 FROM actividades a
  WHERE a.id_usuario = u.id_usuario AND a.titulo = demo.titulo
);

INSERT INTO rutina_diaria (id_usuario, fecha, hora, titulo, orden)
SELECT u.id_usuario, CURRENT_DATE, demo.hora, demo.titulo, demo.orden
FROM (
  SELECT '07:00:00' AS hora, 'Levantarse' AS titulo, 1 AS orden
  UNION ALL SELECT '08:00:00', 'Desayunar', 2
  UNION ALL SELECT '08:30:00', 'Prepararse', 3
  UNION ALL SELECT '09:00:00', 'Ir a la escuela', 4
  UNION ALL SELECT '12:00:00', 'Realizar actividades', 5
  UNION ALL SELECT '13:00:00', 'Almorzar', 6
  UNION ALL SELECT '15:00:00', 'Descansar', 7
  UNION ALL SELECT '16:00:00', 'Regresar a casa', 8
) AS demo
JOIN usuarios u ON u.email = 'demo@conexiontea.com'
WHERE NOT EXISTS (
  SELECT 1 FROM rutina_diaria r
  WHERE r.id_usuario = u.id_usuario
    AND r.fecha = CURRENT_DATE
    AND r.titulo = demo.titulo
);

INSERT INTO eventos_calendario (id_usuario, titulo, descripcion, fecha)
SELECT u.id_usuario, demo.titulo, demo.descripcion, DATE_ADD(CURRENT_DATE, INTERVAL demo.dias DAY)
FROM (
  SELECT 'Actividad académica' AS titulo, 'Actividad de aprendizaje.' AS descripcion, 0 AS dias
  UNION ALL SELECT 'Sesión de comunicación', 'Práctica de comunicación.', 1
  UNION ALL SELECT 'Actividad de rutina', 'Revisar la rutina diaria.', 5
) AS demo
JOIN usuarios u ON u.email = 'demo@conexiontea.com'
WHERE NOT EXISTS (
  SELECT 1 FROM eventos_calendario e
  WHERE e.id_usuario = u.id_usuario
    AND e.titulo = demo.titulo
    AND e.fecha = DATE_ADD(CURRENT_DATE, INTERVAL demo.dias DAY)
);