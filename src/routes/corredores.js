const express = require('express');

const CorredorRepository = require('../repositories/CorredorRepository');
const ProvaRepository = require('../repositories/ProvaRepository');
const CorredorService = require('../services/CorredorService');
const ProvaService = require('../services/ProvaService');
const CorredorController = require('../controllers/CorredorController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Composition root local: monta dependências para esta rota
const corredorRepo = new CorredorRepository();
const provaRepo = new ProvaRepository();
const corredorService = new CorredorService(corredorRepo);
const provaService = new ProvaService(provaRepo, corredorRepo);
const controller = new CorredorController(corredorService, provaService);

const auth = authMiddleware(process.env.JWT_SECRET);

/**
 * @openapi
 * tags:
 *   - name: Corredores
 *     description: Operações sobre corredores cadastrados
 */

/**
 * @openapi
 * /api/corredores:
 *   get:
 *     summary: Lista corredores
 *     tags: [Corredores]
 *     parameters:
 *       - in: query
 *         name: nome
 *         schema: { type: string }
 *       - in: query
 *         name: cidade
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de corredores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Corredor' }
 */
router.get('/', controller.listar);

/**
 * @openapi
 * /api/corredores/{id}:
 *   get:
 *     summary: Busca um corredor pelo ID
 *     tags: [Corredores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Corredor encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Corredor' }
 *       404: { description: Não encontrado }
 */
router.get('/:id', controller.buscarPorId);

/**
 * @openapi
 * /api/corredores/{id}/provas:
 *   get:
 *     summary: Lista as provas em que o corredor está inscrito
 *     tags: [Corredores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de provas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Prova' }
 */
router.get('/:id/provas', controller.listarProvas);

/**
 * @openapi
 * /api/corredores:
 *   post:
 *     summary: Cadastra um novo corredor
 *     tags: [Corredores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CorredorInput' }
 *           example:
 *             nome: "Ana Silva"
 *             email: "ana@exemplo.com"
 *             dataNascimento: "1995-03-12"
 *             genero: "F"
 *             cidade: "Belo Horizonte"
 *     responses:
 *       201: { description: Criado }
 *       400: { description: Dados inválidos }
 *       401: { description: Não autenticado }
 *       409: { description: Email já cadastrado }
 */
router.post('/', auth, controller.criar);

/**
 * @openapi
 * /api/corredores/{id}:
 *   put:
 *     summary: Atualiza um corredor
 *     tags: [Corredores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CorredorInput' }
 *     responses:
 *       200: { description: Atualizado }
 *       401: { description: Não autenticado }
 *       404: { description: Não encontrado }
 */
router.put('/:id', auth, controller.atualizar);

/**
 * @openapi
 * /api/corredores/{id}:
 *   delete:
 *     summary: Remove um corredor (apenas admin)
 *     tags: [Corredores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Removido }
 *       401: { description: Não autenticado }
 *       403: { description: Acesso negado (requer admin) }
 *       404: { description: Não encontrado }
 */
router.delete('/:id', auth, requireRole('admin'), controller.remover);

module.exports = router;
