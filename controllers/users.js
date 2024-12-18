import User from '../models/users.js';
import Follow from '../models/publications.js';
import Publication from '../models/publications.js';
import bcrypt from 'bcrypt';
import { createToken } from '../services/jwt.js';
import { followThisUser, followUserIds } from '../services/followServices.js'

// Método de prueba del controlador user
export const testUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador de Usuarios"
  });
};

// Método Registro de Usuarios
export const register = async (req, res) => {
  try {
    // Obtener los datos de la petición
    let params = req.body;

    // Validar los datos obtenidos (que los datos obligatorios existan)
    if (!params.name || !params.last_name || !params.nick || !params.email || !params.password) {
      return res.status(400).json({
        status: "error",
        message: "Faltan datos por enviar"
      });
    }

    // Crear el objeto del usuario con los datos que validamos
    let user_to_save = new User(params);

    // Control de usuarios duplicados
    const existingUser = await User.findOne({
      $or: [
        { email: user_to_save.email.toLowerCase() },
        { nick: user_to_save.nick.toLowerCase() }
      ]
    });

    // Validar el existingUser
    if (existingUser) {
      return res.status(409).send({
        status: "error",
        message: "¡El usuario ya existe en la BD!"
      });
    }

    // Cifrar la contraseña
    // Genera los saltos para encriptar
    const salt = await bcrypt.genSalt(10);

    // Encriptar la contraseña y guardarla en hashedPassword
    const hashedPassword = await bcrypt.hash(user_to_save.password, salt);

    // Asignar la contraseña encriptada al objeto del usauario
    user_to_save.password = hashedPassword;

    // Guardar el usuario en la base de datos
    await user_to_save.save();

    // Devolver el usuario registrado
    return res.status(201).json({
      status: "created",
      message: "Registro de usuario exitoso",
      user_to_save
    });

  } catch (error) {
    console.log("Error en el registro de usuario: ", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error en el registro de usuario"
    });
  }
};


// Método de Login (usar JWT)
export const login = async (req, res) => {
  try {

    // Obtener los parámetros del body (enviados en la petición)
    let params = req.body;

    // Validar que si recibimos el email y el password
    if (!params.email || !params.password) {
      return res.status(400).send({
        status: "error",
        message: "Faltan datos por enviar"
      });
    }

    // Buscar en la BD si existe el email registrado
    const userBD = await User.findOne({ email: params.email.toLowerCase() });

    // Si no existe el usuario buscado
    if (!userBD) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    // Comprobar su contraseña
    const validPassword = await bcrypt.compare(params.password, userBD.password);

    // Si la contraseña es incorrecta (false)
    if (!validPassword) {
      return res.status(401).send({
        status: "error",
        message: "Contraseña incorrecta"
      });
    }

    // Generar token de autenticación (JWT)
    const token = createToken(userBD);

    // Devolver respuesta de login exitoso
    return res.status(200).json({
      status: "success",
      message: "Autenticación exitosa",
      token,
      userBD: {
        id: userBD._id,
        name: userBD.name,
        last_name: userBD.last_name,
        email: userBD.email,
        nick: userBD.nick,
        image: userBD.image
      }
    });

  } catch (error) {
    console.log("Error en la autenticación del usuario: ", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error en la autenticación del usuario"
    });
  }
};

// Metodo par mostrara el perfil de un usuario

export const profile = async (req, res) => {
  try {
    // Obtener el Id de usuario desde los parametros de la url
    const userId = req.params.id;

    // Validar si el id del usuario autenticado esta disponible
    if (!req.user || !req.user.userId) {
      return res.status(401).send({
        status: "Error",
        message: "Usuario no autenticado"
      });
    }
    // Buscar el usuario en la BD y exclisvo los datos que no queremos mostrar
    const userProfile = await User.findById(userId).select('-password -role -email -__v');
    // Verificar si el usuario buscado no existe
    if (!userProfile) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    // Informacion  de seguimiento: id del usuario identificado (req.user.userId) y el id del usuario del perfil que queremos consultar (userId=req.params.id)
    const followInfo = await followThisUser(req.user.userId, userId);

    // Devolver la informacion del perfil de usuario solicitado
    return res.status(200).json({
      status: 'success',
      user: userProfile,
      followInfo
    });

  } catch (error) {
    console.log("Error al obtener el perfil de usuario: ", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error al obtener el perfil de usuario"
    });
  }
};

// Metodo para listar los usuarios
export const listUser = async (req, res) => {
  try {
    // Controlar la pagina actual
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    // Configurar los items  por pagina a mostrar
    let itemsPerPage = req.query.limit ? parseInt(req.params.page, 10) : 2;

    // realizar consulta pagina
    const options = {
      page: page,
      limit: itemsPerPage,
      select: "-password -email -role -__v"
    };

    const users = await User.paginate({}, options);
    // Si no existen usuarios de la base de datos
    if (!users || users.docs.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "No existen usuarios disponibles"
      });
    }

    let followUser = await followUserIds(req);

    // Devolver usuarios paginados
    res.status(200).json({
      status: "success",
      users: users.docs,
      totalDocs: users.totalDocs,
      totalPage: users.totalPages,
      currentPage: users.page,
      user_following: followUser.following,
      user_follow_me: followUser.followers
    });

  } catch (error) {
    console.log("Error al listar el perfil de los usuarios: ", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error al listar el perfil de los usuarios"
    });
  }
};

// Metodo para actulizar datos del usuario
export const updateUser = async (req, res) => {
  try {

    let userIdentity = req.user;
    let userToUpdate = req.body;

    // Eliminar campos que sobran porque no lo vamos a actualizar

    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;

    // Comobamos si el usuario ya existe en la base de datos
    const users = await User.find({
      $or: [
        { email: userToUpdate.email },
        { nick: userToUpdate.nick }
      ]
    }).exec();

    // Vericar si el usuario esta duplicado para evitar conflictos
    const isDuplicateUser = users.some(user => {
      return user && user._id.toString() !== userIdentity.userId
    })

    if (isDuplicateUser) {
      return res.status(400).send({
        status: "error",
        message: "Error solo se puede actulizar datos del usuario autenticado"
      });
    }

    // Cifrar la contrasena en caso que la envien en la peticion
    if (userToUpdate.password) {
      try {
        let password = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = password;
      } catch (hashError) {
        return res.status(500).send({
          status: "error",
          message: "Error al encriptar la contrasena"
        });
      }
    } else {
      delete userToUpdate.password;
    }

    // Buscar y actualizar el usuario en Mongo
    let userUpdated = await User.findByIdAndUpdate(userIdentity.userId, userToUpdate, { new: true });


    if (!userUpdated) {
      return res.status(500).send({
        status: "error",
        message: "Error al actulializar al usuario"
      });
    }
    // Devolver la respuesta exitosa
    return res.status(200).json({
      status: "success",
      message: "Usuario actualizado",
      user: userUpdated
    });


  } catch (error) {
    console.log("Error al actulizar datos del usuario", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error al actulizar datos del usuario"
    });
  }
}

// Metodo subir avatar (Imagen de perfil) y actualizamos el campo image
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        status: "error",
        message: "Error, la peticion no incluye la imagen"
      });
    }
    // Obtener la Url del archivo subido en Cloudinary
    const avatarUrl = req.file.path;

    // Guardar la imagen en la base de datos
    const userUpdated = await User.findByIdAndUpdate(req.user.userId, { image: avatarUrl }, { new: true });

    // Validar que si se halla actualizado
    if (!userUpdated) {
      return res.status(500).send({
        status: "error",
        message: "Error al subir el archivo del avatar"
      });
    }

    // Mensaje de exito
    return res.status(200).json({
      status: "success",
      message: "Avatar subido exitosamente",
      user: userUpdated,
      file: avatarUrl
    });

  } catch (error) {
    console.log("Error al subir el archivo del avatar", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error al subir el archivo del avatar"
    });
  }
}

// Metodo para mostrar el Avatar (Imagen del perfil)
export const avatar = async (req, res) => {
  try {
    // Obtener el Id desde el parametro del archivo
    const userId = req.params.id;

    // Buscar usuario en la base de datos para obtener la url de Cloudinary

    const user = await User.findById(userId).select('image');

    // Verificar si el usuario existe y ademas tiene una imagen
    if (!user || !user.image) {
      res.status(404).json({
        status: "error",
        message: "No existe usuario o imagen  ",
      })
    }

    // Devolver url de la imagen de cloudinary
    return res.redirect(user.image);

  } catch (error) {
    console.log("Error al mostrar el archivo del avatar", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar el archivo del avatar"
    });
  }
}

// Método para mostrar contador de seguidores y publicaciones
export const counters = async (req, res) => {
  try {
    // Obtener el Id del usuario autenticado (token)
    let userId = req.user.userId;
    console.log("ID del usuario autenticado:", userId);
    // Si llega el id a través de los parámetros en la URL tiene prioridad
    if (req.params.id) {
      userId = req.params.id;
    }
    // Obtener el nombre y apellido del usuario
    const user = await User.findById(userId, { name: 1, last_name: 1 });
    console.log("Usuario encontrado:", user);
    // Vericar el user
    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }
    // Contador de usuarios que yo sigo (o que sigue el usuario autenticado)
    const followingCount = await Follow.countDocuments({ "following_user": userId });
    // Contador de usuarios que me siguen a mi (que siguen al usuario autenticado)
    const followedCount = await Follow.countDocuments({ "followed_user": userId });
    // Contador de publicaciones del usuario autenticado
    const publicationsCount = await Publication.countDocuments({ "user_id": userId });
    console.log("Contadores:", { followingCount, followedCount, publicationsCount });
    // Devolver los contadores
    return res.status(200).json({
      status: "success",
      userId,
      name: user.name,
      last_name: user.last_name,
      followingCount: followingCount,
      followedCount: followedCount,
      publicationsCount: publicationsCount
    });
  } catch (error) {
    console.log("Error en los contadores", error)
    return res.status(500).send({
      status: "error",
      message: "Error en los contadores"
    });
  }
}