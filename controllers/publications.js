import User from "../models/users.js";
import Publication from "../models/publications.js"
import { followUserIds } from '../services/followServices.js'
// Método de prueba del controlador publications
export const testPublications = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador de Publications"
  });
};
// Metodo realizar una publicacion (guardar en base de datos)
export const savePublication = async (req, res) => {
  try {
    // Obtenemos los datos de body
    const params = req.body;
    // Validamos que llegue el campo text
    if (!params || !params.text) {
      return res.status(400).json({
        status: 'error',
        message: 'Debes enviar texto en a publicación'
      });
    }

    // Crear el objeto
    const newPublication = new Publication(params);

    // Agregar al objeto de la publicacion la informacion del usuario autenticado quien creo la publicacion
    newPublication.user_id = req.user.userId;

    const publicationSaved = await newPublication.save();

    if (!publicationSaved) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al realizar la publicacion'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Publicacion realizada exitosamente',
      publication: publicationSaved
    });

  } catch (error) {
    console.log(`Error al crear la publicacion: ${error}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error al crear la publicación'
    });
  }
}

// Metodo para motrar la publicacion
export const showPublication = async (req, res) => {
  try {
    // Obtener el Id de la publicacion desde la url (parámetros)
    const publicationId = req.params.id;

    // Buscar la publicacion en la base de datos
    const publicationStored = await Publication.findById(publicationId).populate('user_id', 'name last_name');

    // Validar que si exista la publicacion
    if (!publicationStored) {
      return res.status(404).json({
        status: 'error',
        message: 'Publicacion no encontrada'
      });
    }

    // Devolver publicacion
    return res.status(200).json({
      status: 'success',
      message: 'Publicacion encotrada',
      publication: publicationStored
    });

  } catch (error) {
    console.log(`Error al mostrar la publicacion: ${error}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error al mostrar la publicación'
    });
  }
}

// Metodo para eliminar publicacion
export const deletePublication = async (req, res) => {
  try {
    // Obtener el Id de la publicacion desde la url (parámetros)
    const publicationId = req.params.id;

    // Buscar la publicacion en la base de datos y la eliminamos
    const publicationDeleted = await Publication.findOneAndDelete({ user_id: req.user.userId, _id: publicationId }).populate('user_id', 'name last_name');

    // Validar que si exista la publicacion
    if (!publicationDeleted) {
      return res.status(404).json({
        status: 'error',
        message: 'No se ha encontrado o no tienes permiso para eliminar esta publicacion'
      });
    }

    // Devolver publicacion
    return res.status(200).json({
      status: 'success',
      message: 'Publicacion eliminada exitosamente',
      publication: publicationDeleted
    });

  } catch (error) {
    console.log(`Error al eliminar la publicacion: ${error}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error al eliminar la publicación'
    });
  }
}

// Metodo para lista publicaciones de un usuario especifico, enviandole el id del usuario en lo parametros
export const publicationsUser = async (req, res) => {
  try {
    // Obtener id de usuario
    const userId = req.params.id;

    // Asignar el numero de pagina a mostrar inicialmente
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    // Numero de publicaciones a motrar por paginas
    let itemsPerPage = req.query.limit ? parseInt(req.params.page, 10) : 2;

    // Opciones de la consulta
    const options = {
      page: page,
      limit: itemsPerPage,
      sort: { created_at: -1 },
      populate: {
        path: 'user_id',
        select: '-password -role -email -__v'
      },
      lean: true
    };

    // Buscar publicaciones del usuario
    const publications = await Publication.paginate({ user_id: userId }, options);

    if (!publications.docs || publications.docs.length <= 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No hay publicaciones para mostrar'
      });
    }

    // Devolver respueta
    return res.status(200).json({
      status: 'success',
      message: 'Publicaciones del usuario: ',
      publication: publications.docs,
      total: publications.totalDocs,
      pages: publications.page,
      limit_items_per_page: publications.limits
    });

  } catch (error) {
    console.log(`Error al mostrar las publicaciones: ${error}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error al mostrar la publicaciones'
    });
  }
}

export const uploadMedia = async (req, res) => {
  try {
    // Obtener id de la publicacion
    const publicationId = req.params.id;

    // Verificar si la publicacion existe en base de datos
    const publicationExists = await Publication.findById(publicationId);

    if (!publicationExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Error, publicacion no encontrada'
      });
    }

    // Verificar si se recibio la peticion del archivo
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'La peticion no incluye imagen'
      });
    }

    // Obtener la url de cloudinary
    const mediaUrl = req.file.path;

    // Actualizar la publicacion con la url de la imagen
    const publicationUpdated = await Publication.findByIdAndUpdate(publicationId, { file: mediaUrl }, { new: true });

    if (!publicationUpdated) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al subir la imagen'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Archivo subido con exito',
      publication: publicationUpdated,
      file: mediaUrl
    });

  } catch (error) {
    console.log(`Error al mostrar las publicaciones: ${error}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error al mostrar la publicaciones'
    });
  }
}