import User from "../models/users.js";

// Método de prueba del controlador user
export const testUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador de Usuarios"
  });
};

// Método Registro de Usuarios
export const register = async (req, res) => {
  try {
    //Obtener los dats de la peticion

    let params = req.body;

    //Validar los datos obtenidos (que los datos obligatorios exitan)
    if (!params.name || !params.last_name || !params.nick || !params.email || !params.password) {
      return res.status(400).json({
        status: "error",
        message: "Faltan datos por enviar"
      });
    }

    // Crear objeto del usuario con los datos que validamos
    let user_to_save = new User(params);

    //Control de usuarios duplicados

    // Cifrar el password

    // Guardar el usuario en la base datos
    await user_to_save.save()

    // Devolver el usuario registrado
    return res.status(200).json({
      message: "Registro de usuarios exitoso",
      params,
      user_to_save
    });

  } catch (error) {
    console.log(`Error en el registro de usuario: ${error}`);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error en el registro de usuario"
    });
  }
};