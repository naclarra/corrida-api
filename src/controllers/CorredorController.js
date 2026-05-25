class CorredorController {
  constructor(corredorService, provaService) {
    this.corredorService = corredorService;
    this.provaService = provaService;
  }

  listar = async (req, res, next) => {
    try {
      const corredores = await this.corredorService.listar({
        nome: req.query.nome,
        cidade: req.query.cidade,
      });
      res.json(corredores);
    } catch (err) { next(err); }
  };

  buscarPorId = async (req, res, next) => {
    try {
      const corredor = await this.corredorService.buscarPorId(req.params.id);
      res.json(corredor);
    } catch (err) { next(err); }
  };

  criar = async (req, res, next) => {
    try {
      const corredor = await this.corredorService.criar(req.body);
      res.status(201).json(corredor);
    } catch (err) { next(err); }
  };

  atualizar = async (req, res, next) => {
    try {
      const corredor = await this.corredorService.atualizar(req.params.id, req.body);
      res.json(corredor);
    } catch (err) { next(err); }
  };

  remover = async (req, res, next) => {
    try {
      await this.corredorService.remover(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  };

  listarProvas = async (req, res, next) => {
    try {
      const provas = await this.provaService.listarProvasDoCorredor(req.params.id);
      res.json(provas);
    } catch (err) { next(err); }
  };
}

module.exports = CorredorController;
