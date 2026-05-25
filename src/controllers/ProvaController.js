/**
 * Controller de Provas.
 *
 * SOLID — Single Responsibility:
 * Cuida apenas de extrair dados da requisição HTTP, delegar para o service e
 * formatar a resposta. Nenhuma regra de negócio aqui.
 */
class ProvaController {
  constructor(provaService) {
    this.provaService = provaService;
  }

  listar = async (req, res, next) => {
    try {
      const provas = await this.provaService.listar({
        nome: req.query.nome,
        modalidade: req.query.modalidade,
        status: req.query.status,
      });
      res.json(provas);
    } catch (err) { next(err); }
  };

  buscarPorId = async (req, res, next) => {
    try {
      const prova = await this.provaService.buscarPorId(req.params.id);
      res.json(prova);
    } catch (err) { next(err); }
  };

  criar = async (req, res, next) => {
    try {
      const prova = await this.provaService.criar(req.body);
      res.status(201).json(prova);
    } catch (err) { next(err); }
  };

  atualizar = async (req, res, next) => {
    try {
      const prova = await this.provaService.atualizar(req.params.id, req.body);
      res.json(prova);
    } catch (err) { next(err); }
  };

  remover = async (req, res, next) => {
    try {
      await this.provaService.remover(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  };

  inscrever = async (req, res, next) => {
    try {
      const { corredorId } = req.body;
      const prova = await this.provaService.inscreverCorredor(req.params.id, corredorId);
      res.status(201).json(prova);
    } catch (err) { next(err); }
  };

  cancelarInscricao = async (req, res, next) => {
    try {
      const prova = await this.provaService.cancelarInscricao(
        req.params.id,
        req.params.corredorId
      );
      res.json(prova);
    } catch (err) { next(err); }
  };
}

module.exports = ProvaController;
