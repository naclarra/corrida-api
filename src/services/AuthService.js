const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ValidationError, UnauthorizedError } = require('../utils/errors');

class AuthService {
  constructor(usuarioRepository, { jwtSecret, jwtExpiresIn }) {
    this.usuarioRepository = usuarioRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  async registrar({ nome, email, senha, perfil }) {
    if (!nome || !email || !senha) {
      throw new ValidationError('Nome, email e senha são obrigatórios');
    }
    if (senha.length < 6) {
      throw new ValidationError('Senha deve ter pelo menos 6 caracteres');
    }

    const existente = await this.usuarioRepository.buscarPorEmail(email);
    if (existente) {
      throw new ValidationError('Já existe um usuário com este email');
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    return this.usuarioRepository.criar({
      nome,
      email,
      senhaHash,
      perfil: perfil === 'admin' ? 'admin' : 'usuario',
    });
  }

  async login({ email, senha }) {
    if (!email || !senha) {
      throw new ValidationError('Email e senha são obrigatórios');
    }

    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) throw new UnauthorizedError('Credenciais inválidas');

    const ok = await bcrypt.compare(senha, usuario.senhaHash);
    if (!ok) throw new UnauthorizedError('Credenciais inválidas');

    const token = jwt.sign(
      { sub: usuario.id, perfil: usuario.perfil, nome: usuario.nome },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    return { token, usuario };
  }
}

module.exports = AuthService;
