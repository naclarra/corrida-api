const {
  NotFoundError,
  ValidationError,
  ConflictError,
} = require('../utils/errors');

const DISTANCIAS_PADRAO = {
  '5K': 5,
  '10K': 10,
  '21K': 21.0975,
  '42K': 42.195,
};

/**
 * Service de Provas — concentra regras de negócio.
 *
 * SOLID — Single Responsibility:
 * Orquestra regras de negócio sobre o agregado Prova. Não conhece HTTP
 * (responsabilidade do controller) nem detalhes do banco (responsabilidade
 * do repositório).
 *
 * SOLID — Dependency Inversion:
 * Recebe repositórios via construtor. Depende de abstrações, o que torna a
 * classe testável com mocks.
 */
class ProvaService {
  constructor(provaRepository, corredorRepository) {
    this.provaRepository = provaRepository;
    this.corredorRepository = corredorRepository;
  }

  async listar(filtros) {
    return this.provaRepository.listar(filtros);
  }

  async buscarPorId(id) {
    const prova = await this.provaRepository.buscarPorId(id);
    if (!prova) {
      throw new NotFoundError(`Prova com id ${id} não encontrada`);
    }
    return prova;
  }

  async criar(dados) {
    this._validar(dados);
    if (!dados.distanciaKm && dados.modalidade) {
      dados.distanciaKm = DISTANCIAS_PADRAO[dados.modalidade];
    }
    return this.provaRepository.criar(dados);
  }

  async atualizar(id, dados) {
    const existente = await this.provaRepository.buscarPorId(id);
    if (!existente) {
      throw new NotFoundError(`Prova com id ${id} não encontrada`);
    }
    return this.provaRepository.atualizar(id, dados);
  }

  async remover(id) {
    const removido = await this.provaRepository.remover(id);
    if (!removido) {
      throw new NotFoundError(`Prova com id ${id} não encontrada`);
    }
  }

  // ----- Inscrições -----

  async inscreverCorredor(provaId, corredorId) {
    const prova = await this.provaRepository.buscarPorId(provaId);
    if (!prova) {
      throw new NotFoundError(`Prova com id ${provaId} não encontrada`);
    }

    if (prova.status !== 'aberta') {
      throw new ValidationError('Inscrições encerradas para esta prova');
    }

    const corredor = await this.corredorRepository.buscarPorId(corredorId);
    if (!corredor) {
      throw new ValidationError(`Corredor com id ${corredorId} não existe`);
    }

    const jaInscrito = prova.inscritos.some(
      (i) => String(i.corredor._id || i.corredor) === String(corredorId)
    );
    if (jaInscrito) {
      throw new ConflictError('Corredor já está inscrito nesta prova');
    }

    if (prova.inscritos.length >= prova.vagas) {
      throw new ConflictError('Não há vagas disponíveis');
    }

    const numeroPeito = prova.inscritos.length + 1;

    return this.provaRepository.inscrever(provaId, {
      corredor: corredorId,
      numeroPeito,
      dataInscricao: new Date(),
    });
  }

  async cancelarInscricao(provaId, corredorId) {
    const prova = await this.provaRepository.buscarPorId(provaId);
    if (!prova) {
      throw new NotFoundError(`Prova com id ${provaId} não encontrada`);
    }
    const inscrito = prova.inscritos.some(
      (i) => String(i.corredor._id || i.corredor) === String(corredorId)
    );
    if (!inscrito) {
      throw new NotFoundError('Corredor não está inscrito nesta prova');
    }
    return this.provaRepository.cancelarInscricao(provaId, corredorId);
  }

  async listarProvasDoCorredor(corredorId) {
    if (typeof this.provaRepository.listarPorCorredor === 'function') {
      return this.provaRepository.listarPorCorredor(corredorId);
    }
    return [];
  }

  _validar(dados) {
    if (!dados.nome || dados.nome.trim() === '') {
      throw new ValidationError('Nome da prova é obrigatório');
    }
    if (!dados.data) {
      throw new ValidationError('Data da prova é obrigatória');
    }
    const data = new Date(dados.data);
    if (Number.isNaN(data.getTime())) {
      throw new ValidationError('Data inválida');
    }
    if (!dados.local || dados.local.trim() === '') {
      throw new ValidationError('Local é obrigatório');
    }
    if (!dados.modalidade || !DISTANCIAS_PADRAO[dados.modalidade]) {
      throw new ValidationError('Modalidade deve ser 5K, 10K, 21K ou 42K');
    }
    if (dados.vagas !== undefined && Number(dados.vagas) < 1) {
      throw new ValidationError('Vagas deve ser pelo menos 1');
    }
    if (dados.preco !== undefined && Number(dados.preco) < 0) {
      throw new ValidationError('Preço não pode ser negativo');
    }
  }
}

module.exports = ProvaService;
