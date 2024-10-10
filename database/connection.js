import { connect } from "mongoose";
import dotenv from "dotenv";

// Configurar el dotenv para usar varibles de entorno

dotenv.config();

const connection = async () => {
    try {
        await connect(process.env.MONGODB_URI);
        console.log("Conectado correctamente con: DB_Social_Network")
    } catch (error) {
        console.log(`Error al conectar con la base de datos ${error}`);
        throw new Error("!No se ha podido conectar con la base de datos!");
    }
};

export default connection;

