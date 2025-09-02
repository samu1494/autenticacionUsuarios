-- crear base de datos "prueba" en postgresql
CREATE DATABASE prueba;

-- usar la base de datos creada
\c prueba;

-- mostrar tablas actuales
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- creacion tablas
-- tipos de usuarios
CREATE TABLE tipos (
    id_tipo SERIAL PRIMARY KEY,      -- id autoincremental
    nombre VARCHAR(50) NOT NULL      -- nombre del tipo
);

-- tabla users:
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL,   -- nombre de usuario
    password VARCHAR(255) NOT NULL,  -- contraseña (guardar hash)
    tipo INT NOT NULL,               -- referencia al tipo de usuario
    CONSTRAINT fk_tipo
        FOREIGN KEY(tipo)
        REFERENCES tipos(id_tipo)
        ON DELETE RESTRICT          -- si borras tipo, no permite borrar si hay usuarios
        ON UPDATE CASCADE           -- si cambias id_tipo, se actualiza en users
);

-- asegurar que username sea unico y no repetir usernames
ALTER TABLE users ADD CONSTRAINT users_username_uk UNIQUE (username);

-- activar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- insertar tipos
INSERT INTO tipos (nombre) VALUES 
('admin'),
('adminController'),
('controller');

select * from tipos;

-- insertar un par de usuarios
-- INSERT INTO users (username, password, tipo) values
-- ('carlitos2zarate', md5(random()::text), 2),
-- ('alvin14', md5(random()::text), 1),
-- ('elnumero1', md5(random()::text), 3);

SELECT * FROM users;

-- ver relacion
SELECT 
    u.username,
    t.nombre AS tipo_usuario
FROM users u
JOIN tipos t ON u.tipo = t.id_tipo;