class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  registrar = async (req, res, next) => {
    try {
      const usuario = await this.authService.registrar(req.body);
      res.status(201).json(usuario);
    } catch (err) { next(err); }
  };

  login = async (req, res, next) => {
    try {
      const { token, usuario } = await this.authService.login(req.body);
      res.json({ token, usuario });
    } catch (err) { next(err); }
  };

  perfil = async (req, res) => {
    res.json({
      id: req.user.sub,
      nome: req.user.nome,
      perfil: req.user.perfil,
    });
  };
}

module.exports = AuthController;
