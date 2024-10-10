import { Router } from "express";
import { testPublications } from "../controllers/publications.js";

const router = Router();

// Definir rutas de publications
router.get('/test-follow', testPublications);

//Exportar el Router
export default router;