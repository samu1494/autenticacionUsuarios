import z from "zod"; //usual para validaciones rapidas
const userScheme = z.object({
  name: z
    .string({
      invalid_type_error: "El nombre debe ser una cadena de texto",
      required_error: "El nombre es obligatorio",
    })
    .min(3, {
      message: "El nombre debe tener minimamente 3 caracteres",
    })
    .trim()
    .regex(/^\S+$/, {
      message: "El nombre no debe contener espacios en blanco",
    }),
  password: z
    .string({
      invalid_type_error: "La contraseña debe ser una cadena de texto",
      required_error: "La contraseña es obligatoria",
    })
    .min(6, {
      message: "La contraseña debe tener minimamente 6 caracteres",
    })
    .max(10, {
      message: "La contraseña debe tener como maximo 6 caracteres",
    })
    .trim()
    .regex(/[0-9]/, {
      message: "La contraseña debe tener contener al menos un numero",
    }),
  tipo: z
    .number({
      invalid_type_error: "El tipo debe ser un numero",
      required_error: "El tipo es obligatorio",
    })
    .min(1, { message: "El valor minimo de tipo es 1" })
    .max(3, { message: "El valor maximo de tipo es 3" })
    .default(3),
});

export function validateUser(input) {
  return userScheme.safeParse(input);
}

export function validatePartialUser(input) {
  return userScheme.partial().safeParse(input);
}
