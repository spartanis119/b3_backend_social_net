// Importar dependencias (configurar en package.json)
import express from "express";
import connection from "./database/connection.js";
import cors from "cors";
import bodyParser from "body-parser";
import UserRoutes from './routes/users.js';
import PublicationRoutes from './routes/publications.js';
import FollowRoutes from './routes/follows.js';


// Mensaje de bienvenida para verificar que ejecuto la API de node

console.log("API Node en ejecucion");

// Conexión a la Base de Datos

connection();

// Crear el servidor node

const app = express();
const port = process.env.PORT || 3900;

// Configurar cors para que acepte peticiones del frontend
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Decodificar los datos desde los formularios para convertirlos en objetos javascript

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar rutas del aplicativo (modulos)

app.use('/api/user', UserRoutes);
app.use('/api/publication', PublicationRoutes);
app.use('/api/follow', FollowRoutes);

// Configurar el servidor de node

app.listen(port, () => {
    console.log(`Servidor de node ejecutandose en el puerto ${port}`);
});

export default app;
