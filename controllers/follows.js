// Método de prueba del controlador user
export const testFollow = (req, res) => {
    return res.status(200).send({
      message: "Mensaje enviado desde el controlador de Follows"
    });
  };