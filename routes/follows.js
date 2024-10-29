import { Router } from "express";
import { saveFollow, testFollow, unfollow, following, followers } from "../controllers/follows.js";
import { ensureAuth } from "../middlewares/auth.js";

const router = Router();

// Definir rutas de follows
router.get('/test-follow', testFollow);
router.post('/follow', ensureAuth, saveFollow);
router.delete("/unfollow/:id", ensureAuth, unfollow);
router.get("/following/:id?/:page?", ensureAuth, following);
router.get("/followers/:id?/:page?", ensureAuth, followers);

//Exportar el Router
export default router;