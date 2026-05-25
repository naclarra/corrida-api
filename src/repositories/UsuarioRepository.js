const Usuario = require('../models/Usuario');

class UsuarioRepository {
  async buscarPorEmail(email) {
    return Usuario.findOne({ email: email.toLowerCase() });
  }
  async buscarPorId(id) {
    return Usuario.findById(id);
  }
  async criar(dados) {
    return Usuario.create(dados);
  }
}

module.exports = UsuarioRepository;
