import jwt from "jwt-simple";
import moment from "moment";
// Importar clave secreta desde el servicio (jwt)
import { secret } from "../services/jwt.js";


// Metodo de autenticacion
export const ensureAuth = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "Error",
            message: "La peticion no contiene la cabecera de autenticacion"
        });
    }

    // Limpiar el token y quitar comillas si las hay
    const token = req.headers.authorization.replace(/['"]+/g, '').replace('Bearer ', '');

    try {
        // Decodificar el tocken
        let payload = jwt.decode(token, secret);
        // Comprobar si el toquen ha expirado (si la fecha de expiracion es mas antiguia que la fecha actual)
        if (payload.exp <= moment.unix()) {
            return res.status(401).send({
                status: "Error",
                message: "El token ha expirado"
            });
        }

        // Agregar datos del usuario a la request
        req.user = payload

    } catch (error) {
        return res.status(404).send({
            status: "Error",
            message: "El token no es valido"
        });
    }
    // Paso a ejecucion al siguiente metodo
    next();
}

