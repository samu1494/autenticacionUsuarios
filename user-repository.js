import { Pool } from "pg";
import dotenv from "dotenv";
//escriptar contraseña instalar: npm install pg bcrypt
import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "./config.js";
import { isValidBase64 } from "zod/v4/core";

dotenv.config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Probar la conexión
// export const testConnection = async () => {
//   try {
//     const client = await pool.connect();
//     console.log("Conexión exitosa a PostgreSQL");
//     client.release();
//   } catch (err) {
//     console.error("Error al conectar a PostgreSQL:", err.stack);
//   }
// };

export class UserRepository {
  // Modelo para crear un usuario
  static async create({ input }) {
    const { name, password, tipo } = input;
    // obtiene un ID para el nuevo usuario
    const {
      rows: [{ uuid }],
    } = await pool.query("SELECT uuid_generate_v4() AS uuid");

    //insertando al usuario en la tabla users de la BD
    try {
      const passNew = await bcrypt.hash(password, SALT_ROUNDS); // encriptado de contraseñas
      await pool.query(
        "INSERT INTO users (id, username, password, tipo) VALUES ($1, $2, $3, $4)",
        [uuid, name, passNew, tipo]
      );
    } catch (e) {
      throw new Error("Error al crear un usuario", e);
    }

    // Obteniendo al usuario recien creado desde la BD
    const { rows: userRows } = await pool.query(
      `
        SELECT u.id, u.username, t.nombre AS tipo_usuario
        FROM users u
        JOIN tipos t ON u.tipo = t.id_tipo
        WHERE u.id = $1;
      `,
      [uuid]
    );
    // sino existe el usuario recien creado retorna null
    if (userRows.length > 0) {
      const { id, username, tipo_usuario } = userRows[0];
      return { id, username, tipo_usuario };
    } else {
      return null;
    }
  }

  // Modelo para validar un usuario
  static async validate({ input }) {
    const { name, password } = input;
    const { rows: userRows } = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [name]
    );
    if (userRows.length === 0) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404; // Código de estado para "No encontrado"
      throw error;
    }

    const user = userRows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const error = new Error("Contraseña Incorrecta");
      error.statusCode = 401; // Código de estado para "No autorizado"
      throw error;
    }

    const { rows } = await pool.query(
      "SELECT nombre FROM tipos WHERE id_tipo = $1",
      [user.tipo]
    );

    const { nombre } = rows[0];
    const userModf = { ...user, tipo: nombre };

    // quitarle el password, enviar el resto: id, username, tipo
    const { password: _, ...publicUser } = userModf;
    return publicUser;
  }
}
