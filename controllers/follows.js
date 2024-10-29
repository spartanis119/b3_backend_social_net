import Follow from '../models/follows.js';
import User from '../models/users.js';

// Método de prueba del controlador user
export const testFollow = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador de Follows"
  });
};

// Metodo para seguir a un usuario
export const saveFollow = async (req, res) => {
  try {

    //Obtener datos desde el body del usuario que se quiere seguir
    const { followed_user } = req.body;
    console.log(followed_user);
    // Obtener id del usuario autenticado
    const authenticatedUser = req.user;

    // Validar si existe un usuario autenticado
    if (!authenticatedUser || !authenticatedUser.userId) {
      return res.status(400).json({
        status: 'error',
        message: 'No se ha proporcinado usuario para realizar el follow'
      });
    }

    // Validar que no se quiera seguir a si mismo
    if (authenticatedUser === followed_user) {
      return res.status(400).json({
        status: 'error',
        message: 'No puedes seguirte a ti mismo'
      });
    }

    // Verificar que el usuario que quiero seguir si existe
    const existFollowedUser = await User.findById(followed_user);

    if (!existFollowedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'El usuario que intentas seguir no existe'
      });
    }

    // Verificar si ya existe un seguimiento con los mismo usuarios

    const existingFollow = await Follow.findOne({
      following_user: authenticatedUser.userId,
      followed_user: followed_user
    });

    if (existingFollow) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya estas siguiendo a este usuario'
      });
    }

    // Crear el objeto con el modelo follow

    const newFollow = new Follow({
      following_user: authenticatedUser.userId,
      followed_user: followed_user
    });

    const followStored = await newFollow.save();

    // Verificar si se guardo correctamente en la base de datos
    if (!followStored) {
      return res.status(500).json({
        status: 'error',
        message: 'Error en el follow del user'
      });
    }

    // Obtener el nombre y apellido seguido
    const followedUserDetail = await User.findById(followed_user).select('name last_name');

    if (!followedUserDetail) {
      return res.status(404).json({
        status: 'error',
        message: 'Error, usuario no encontrado'
      });
    }

    // Combinar datos de follow y followedUser

    const combinedFollowData = {
      ...followStored.toObject(),
      followedUser: {
        name: followedUserDetail.name,
        last_name: followedUserDetail.last_name
      }
    }
    // Devolver respuesta
    return res.status(200).json({
      status: 'error',
      user: req.user,
      follow: combinedFollowData
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Error, ya estas siguiendo al usuario'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Error, al seguir usuario'
    });
  }
}
// Método para eliminar un follow (dejar de seguir)
export const unfollow = async (req, res) => {
  try {
    // Obtener el Id del usuario indentificado
    const userId = req.user.userId;
    // Obtener el Id del usuario que sigo y quiero dejar de seguir
    const followedId = req.params.id;
    // Búsqueda de las coincidencias de ambos usuarios y elimina
    const followDeleted = await Follow.findOneAndDelete({
      following_user: userId, // quien realiza el seguimiento
      followed_user: followedId // a quien se quiere dejar de seguir
    });
    // Verificar si se encontró el documento y lo eliminó
    if (!followDeleted) {
      return res.status(404).send({
        status: "error",
        message: "No se encontró el seguimiento a eliminar."
      });
    }
    // Devolver respuesta
    return res.status(200).send({
      status: "success",
      message: "Dejaste de seguir al usuario correctamente."
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al dejar de seguir al usuario."
    });
  }
}
// Método para listar usuarios que estoy siguiendo
export const following = async (req, res) => {
  try {
    // Obtener el ID del usuario identificado
    let userId = req.user && req.user.userId ? req.user.userId : undefined;
    console.log(userId);
    // Comprobar si llega el ID por parámetro en la url (este tiene prioridad)
    if (req.params.id) userId = req.params.id;
    console.log(userId);
    // Asignar el número de página
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;
    // Número de usuarios que queremos mostrar por página
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;
    // Configurar las opciones de la consulta
    const options = {
      page: page,
      limit: itemsPerPage,
      populate: {
        path: 'followed_user',
        select: '-password -role -__v -email'
      },
      lean: true
    }

    // Buscar en la BD los seguidores y popular los datos de los usuarios
    const follows = await Follow.paginate({ following_user: userId }, options);
    // Listar los seguidores de un usuario, obtener el array de IDs de los usuarios que sigo
    let followUsers = await followUserIds(req);
    // Devolver respuesta
    return res.status(200).send({
      status: "success",
      message: "Listado de usuarios que estoy siguiendo",
      follows: follows.docs,
      total: follows.totalDocs,
      pages: follows.totalPages,
      page: follows.page,
      limit: follows.limit,
      users_following: followUsers.following,
      user_follow_me: followUsers.followers
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al listar los usuarios que estás siguiendo."
    });
  }
}
// Método para listar los usuarios que me siguen
export const followers = async (req, res) => {
  try {
    // Obtener el ID del usuario identificado
    let userId = req.user && req.user.userId ? req.user.userId : undefined;
    // Comprobar si llega el ID por parámetro en la url (este tiene prioridad)
    if (req.params.id) userId = req.params.id;
    // Asignar el número de página
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;
    // Número de usuarios que queremos mostrar por página
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;
    // Configurar las opciones de la consulta
    const options = {
      page: page,
      limit: itemsPerPage,
      populate: {
        path: 'following_user',
        select: '-password -role -__v -email'
      },
      lean: true
    }

    // Buscar en la BD los seguidores y popular los datos de los usuarios
    const follows = await Follow.paginate({ followed_user: userId }, options);
    // Listar los seguidores de un usuario, obtener el array de IDs de los usuarios que sigo
    let followUsers = await followUserIds(req);
    // Devolver respuesta
    return res.status(200).send({
      status: "success",
      message: "Listado de usuarios que me siguen",
      follows: follows.docs,
      total: follows.totalDocs,
      pages: follows.totalPages,
      page: follows.page,
      limit: follows.limit,
      users_following: followUsers.following,
      user_follow_me: followUsers.followers
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al listar los usuarios que me siguen."
    });
  }
}