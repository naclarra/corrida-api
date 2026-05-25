const Prova = require('../models/Prova');
const IProvaRepository = require('./IProvaRepository');

/**
 * Implementação concreta usando Mongoose / MongoDB.
 *
 * SOLID — Liskov Substitution Principle (LSP):
 * Pode substituir qualquer IProvaRepository sem alterar o comportamento
 * esperado pelos consumidores.
 */
class ProvaRepository extends IProvaRepository {
  async listar(filtros = {}) {
    const query = {};
    if (filtros.nome) query.nome = new RegExp(filtros.nome, 'i');
    if (filtros.modalidade) query.modalidade = filtros.modalidade;
    if (filtros.status) query.status = filtros.status;
    return Prova.find(query).sort({ data: 1 });
  }

  async buscarPorId(id) {
    return Prova.findById(id).populate('inscritos.corredor', 'nome email cidade');
  }

  async criar(dados) {
    return Prova.create(dados);
  }

  async atualizar(id, dados) {
    return Prova.findByIdAndUpdate(id, dados, { new: true, runValidators: true });
  }

  async remover(id) {
    return Prova.findByIdAndDelete(id);
  }

  async inscrever(provaId, dadosInscricao) {
    return Prova.findByIdAndUpdate(
      provaId,
      { $push: { inscritos: dadosInscricao } },
      { new: true }
    ).populate('inscritos.corredor', 'nome email cidade');
  }

  async cancelarInscricao(provaId, corredorId) {
    return Prova.findByIdAndUpdate(
      provaId,
      { $pull: { inscritos: { corredor: corredorId } } },
      { new: true }
    );
  }

  async listarPorCorredor(corredorId) {
    return Prova.find({ 'inscritos.corredor': corredorId }).sort({ data: -1 });
  }
}

module.exports = ProvaRepository;
