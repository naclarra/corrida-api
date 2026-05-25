const express = require('express');

const UsuarioRepository = require('../repositories/UsuarioRepository');
const AuthService = require('../services/AuthService');
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const authService = new AuthService(new UsuarioRepository(), {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
});
const controller = new AuthController(authService);

const auth = authMiddleware(process.env.JWT_SECRET);

/**
 * @openapi
 * tags:
 *   - name: Autenticação
 *     description: Registro, login e perfil do usuário (Bônus A e B)
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha]
 *             properties:
 *               nome: { type: string }
 *               email: { type: string, format: email }
 *               senha: { type: string, minLength: 6 }
 *               perfil:
 *                 type: string
 *                 enum: [admin, usuario]
 *           example:
 *             nome: "Maria"
 *             email: "maria@exemplo.com"
 *             senha: "senha123"
 *             perfil: "usuario"
 *     responses:
 *       201: { description: Usuário criado }
 *       400: { description: Dados inválidos }
 */
router.post('/register', controller.registrar);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Autentica e retorna um JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email: { type: string }
 *               senha: { type: string }
 *           example:
 *             email: "maria@exemplo.com"
 *             senha: "senha123"
 *     responses:
 *       200:
 *         description: Token JWT emitido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 usuario: { $ref: '#/components/schemas/Usuario' }
 *       401: { description: Credenciais inválidas }
 */
router.post('/login', controller.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Usuário autenticado }
 *       401: { description: Não autenticado }
 */
router.get('/me', auth, controller.perfil);

module.exports = router;
