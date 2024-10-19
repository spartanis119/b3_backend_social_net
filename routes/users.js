import { Router } from "express";
import { testUser, register, login } from "../controllers/users.js";

const router = Router();

// Definir rutas de user
router.get('/test-user', testUser);
router.post('/register', register);
router.post('/login', login);

//Exportar el Router
export default router;