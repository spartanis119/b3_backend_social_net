import { Router } from "express";
import { testUser, register, login, profile, listUser, updateUser, uploadAvatar, avatar } from "../controllers/users.js";
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

// Definir rutas de user
router.get('/test-user', ensureAuth, testUser);
router.post('/register', register);
router.post('/login', login);
router.get('/profile/:id', ensureAuth, profile);
router.get('/list/:page?', ensureAuth, listUser);
router.put('/update', ensureAuth, updateUser);
router.post('/uploadAvatar', ensureAuth, upload.single("file0"), uploadAvatar);
router.get('/avatar/:id', avatar);

//Exportar el Router
export default router;