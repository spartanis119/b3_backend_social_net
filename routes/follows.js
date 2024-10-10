import { Router } from "express";
import { testFollow } from "../controllers/follows.js";

const router = Router();

// Definir rutas de follows
router.get('/test-follow', testFollow);

//Exportar el Router
export default router;