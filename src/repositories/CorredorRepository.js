const Corredor = require('../models/Corredor');

class CorredorRepository {
  async listar(filtros = {}) {
    const query = {};
    if (filtros.nome) query.nome = new RegExp(filtros.nome, 'i');
    if (filtros.cidade) query.cidade = new RegExp(filtros.cidade, 'i');
    return Corredor.find(query).sort({ nome: 1 });
  }

  async buscarPorId(id) {
    return Corredor.findById(id);
  }

  async buscarPorEmail(email) {
    return Corredor.findOne({ email: email.toLowerCase() });
  }

  async criar(dados) {
    return Corredor.create(dados);
  }

  async atualizar(id, dados) {
    return Corredor.findByIdAndUpdate(id, dados, { new: true, runValidators: true });
  }

  async remover(id) {
    return Corredor.findByIdAndDelete(id);
  }
}

module.exports = CorredorRepository;
