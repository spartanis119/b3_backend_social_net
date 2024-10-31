import { Router } from "express";
import { testPublications, savePublication, showPublication, deletePublication, publicationsUser, uploadMedia , showMedia, feed } from "../controllers/publications.js";
import { ensureAuth } from "../middlewares/auth.js";
import multer from 'multer';
import { CloudinaryStorage } from "multer-storage-cloudinary";
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;


// Configuracion de la subida de archivos en Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        allowFormats: ['jpg', 'jpeg', 'png', 'gif'],
        public_id: (req, file) => 'avatar' + Date.now()
    }
});

// Configurar multer con limites de tamano de archivos
const upload = multer({
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024 } // Limitar el tamano a 1 MB
});


const router = Router();

// Definir rutas de publications
router.get('/test-publication', ensureAuth, testPublications);
router.post('/newPublication', ensureAuth, savePublication);
router.get('/posts/:id', ensureAuth, showPublication);
router.delete('/delete/:id', ensureAuth, deletePublication);
router.get('/publicationUser/:id', ensureAuth, publicationsUser);
router.post('/uploadMedia/:id', [ensureAuth, upload.single("file0")], uploadMedia);
router.get('/media/:id', showMedia);
router.get('/feed/:page?', ensureAuth, feed);

//Exportar el Router
export default router;