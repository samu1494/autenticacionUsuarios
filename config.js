// SALT_ROUNDS, 10-12 está bien en la práctica
export const {
  PORT = 3000,
  SALT_ROUNDS = 10,
  SECRET_KEY = "esta_es_mi_clave_secreta_para_JWT",
} = process.env;
