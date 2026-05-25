const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

class CorredorService {
  constructor(corredorRepository) {
    this.corredorRepository = corredorRepository;
  }

  async listar(filtros) {
    return this.corredorRepository.listar(filtros);
  }

  async buscarPorId(id) {
    const corredor = await this.corredorRepository.buscarPorId(id);
    if (!corredor) {
      throw new NotFoundError(`Corredor com id ${id} não encontrado`);
    }
    return corredor;
  }

  async criar(dados) {
    this._validar(dados);

    const existente = await this.corredorRepository.buscarPorEmail(dados.email);
    if (existente) {
      throw new ConflictError(`Já existe um corredor com o email ${dados.email}`);
    }

    return this.corredorRepository.criar(dados);
  }

  async atualizar(id, dados) {
    const existente = await this.corredorRepository.buscarPorId(id);
    if (!existente) {
      throw new NotFoundError(`Corredor com id ${id} não encontrado`);
    }
    return this.corredorRepository.atualizar(id, dados);
  }

  async remover(id) {
    const removido = await this.corredorRepository.remover(id);
    if (!removido) {
      throw new NotFoundError(`Corredor com id ${id} não encontrado`);
    }
  }

  _validar(dados) {
    if (!dados.nome || dados.nome.trim() === '') {
      throw new ValidationError('Nome é obrigatório');
    }
    if (!dados.email || !/^\S+@\S+\.\S+$/.test(dados.email)) {
      throw new ValidationError('Email inválido');
    }
    if (!dados.dataNascimento) {
      throw new ValidationError('Data de nascimento é obrigatória');
    }
    const data = new Date(dados.dataNascimento);
    if (Number.isNaN(data.getTime())) {
      throw new ValidationError('Data de nascimento inválida');
    }
    if (data > new Date()) {
      throw new ValidationError('Data de nascimento não pode estar no futuro');
    }
  }
}

module.exports = CorredorService;
