import Express from "express";
import { PORT, SECRET_KEY } from "./config.js"; // Carga las variables de entorno automáticamente
import { UserRepository } from "./user-repository.js";
import { validateUser, validatePartialUser } from "./schemas/user.js";
// importando JWT
import jwt from "jsonwebtoken";
// para garantizar la seguridad de las rutas protegidas
import cookieParser from "cookie-parser";

const app = Express();

//uso de ejs
app.set("view engine", "ejs");

app.use(Express.json());
app.use(cookieParser()); // para garantizar la seguridad de las rutas protegidas

// midleware, para sesiones de usuario
app.use((req, res, next) => {
  const token = req.cookies.access_token;

  req.session = { user: null };
  try {
    const data = jwt.verify(token, SECRET_KEY);
    req.session.user = data;
  } catch {}

  next();
});

// raíz
app.get("/", (req, res) => {
  /*
  // codigo usual, sin middleware para validar una session abierta
  const token = req.cookies.access_token;
  if (!token) return res.render("index");

  try {
    const data = jwt.verify(token, SECRET_KEY);
    res.render("index", data); // -> data = {id, name, tipo}
  } catch (err) {
    res.render("index");
  }
    */
  // codigo usando un middleware
  const { user } = req.session;
  res.render("index", user);
});

// Usuario se valida en el sistema
app.post("/login", async (req, res) => {
  //console.log("-> ", req.body);
  const result = validatePartialUser(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  try {
    const user = await UserRepository.validate({ input: result.data });
    // creando mi token para hacer inicion de sesion con JWT
    const token = jwt.sign(
      { id: user.id, name: user.username, tipo: user.tipo },
      SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    // res.status(200).json({ user: user.name });
    res
      .cookie("access_token", token, {
        httpOnly: true, // la cookie solo se puede acceder en el Servidor, no desde javascript "lado cliente"
        secure: process.env.NODE_ENV === "production", // solo se envia por HTTPS
        sameSite: "strict", // la cookie solo puede acceder desde el mismo dominio
        maxAge: 1000 * 60 * 60, // la cookie solo tiene validez una hora
      })
      .send({ user, token }); // enviando el token al cliente
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
});

// Crear un usuario
app.post("/register", async (req, res) => {
  const result = validateUser(req.body);
  //si los datos del usuarios no son validos
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  try {
    const user = await UserRepository.create({ input: result.data });
    if (!user)
      return res.status(409).json({ error: "No se pudo crear el usuario" });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Usuario cierra su sesion
app.post("/logout", (req, res) => {
  res.clearCookie("access_token").json({ message: "Sesion Cerrada con Exito" }); // usual redireccionar
});

// Ruta protegida
app.get("/protected", (req, res) => {
  /*
  // codigo usual, sin middleware para validar una session abierta
  const token = req.cookies.access_token;
  if (!token)
    return res.status(401).send("Acceso denegado. No tienes un token valido");

  try {
    const data = jwt.verify(token, SECRET_KEY);
    res.render("protected", data); // -> data = {id, name, tipo}
  } catch (err) {
    res.status(401).send("Acceso denegado. Token invalido");
  }
  */
  // codigo usando un middleware
  const { user } = req.session;
  if (!user)
    return res.status(401).send("Acceso denegado. No tienes un token valido");

  res.render("protected", user);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
