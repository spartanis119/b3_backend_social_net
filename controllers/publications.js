// Método de prueba del controlador publications
export const testPublications = (req, res) => {
    return res.status(200).send({
      message: "Mensaje enviado desde el controlador de Publications"
    });
  };