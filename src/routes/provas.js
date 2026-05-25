const express = require('express');

const ProvaRepository = require('../repositories/ProvaRepository');
const CorredorRepository = require('../repositories/CorredorRepository');
const ProvaService = require('../services/ProvaService');
const ProvaController = require('../controllers/ProvaController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

const provaService = new ProvaService(new ProvaRepository(), new CorredorRepository());
const controller = new ProvaController(provaService);

const auth = authMiddleware(process.env.JWT_SECRET);

/**
 * @openapi
 * tags:
 *   - name: Provas
 *     description: Operações sobre provas de corrida e suas inscrições
 */

/**
 * @openapi
 * /api/provas:
 *   get:
 *     summary: Lista provas
 *     tags: [Provas]
 *     parameters:
 *       - in: query
 *         name: nome
 *         schema: { type: string }
 *       - in: query
 *         name: modalidade
 *         schema: { type: string, enum: [5K, 10K, 21K, 42K] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [aberta, encerrada, finalizada] }
 *     responses:
 *       200:
 *         description: Lista de provas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Prova' }
 */
router.get('/', controller.listar);

/**
 * @openapi
 * /api/provas/{id}:
 *   get:
 *     summary: Detalha uma prova (com lista de inscritos)
 *     tags: [Provas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Prova encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Prova' }
 *       404: { description: Não encontrada }
 */
router.get('/:id', controller.buscarPorId);

/**
 * @openapi
 * /api/provas:
 *   post:
 *     summary: Cria uma nova prova
 *     tags: [Provas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProvaInput' }
 *           example:
 *             nome: "Corrida de São Silvestre"
 *             data: "2026-12-31"
 *             local: "São Paulo"
 *             modalidade: "10K"
 *             vagas: 30000
 *             preco: 120
 *             descricao: "Tradicional corrida de fim de ano"
 *     responses:
 *       201: { description: Criada }
 *       400: { description: Dados inválidos }
 *       401: { description: Não autenticado }
 */
router.post('/', auth, controller.criar);

/**
 * @openapi
 * /api/provas/{id}:
 *   put:
 *     summary: Atualiza uma prova
 *     tags: [Provas]
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
 *           schema: { $ref: '#/components/schemas/ProvaInput' }
 *     responses:
 *       200: { description: Atualizada }
 *       401: { description: Não autenticado }
 *       404: { description: Não encontrada }
 */
router.put('/:id', auth, controller.atualizar);

/**
 * @openapi
 * /api/provas/{id}:
 *   delete:
 *     summary: Remove uma prova (apenas admin)
 *     tags: [Provas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Removida }
 *       401: { description: Não autenticado }
 *       403: { description: Acesso negado (requer admin) }
 *       404: { description: Não encontrada }
 */
router.delete('/:id', auth, requireRole('admin'), controller.remover);

/**
 * @openapi
 * /api/provas/{id}/inscricoes:
 *   post:
 *     summary: Inscreve um corredor na prova
 *     tags: [Provas]
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
 *           schema:
 *             type: object
 *             required: [corredorId]
 *             properties:
 *               corredorId: { type: string }
 *           example:
 *             corredorId: "65f0c8a1b2d3e4f5a6b7c8d9"
 *     responses:
 *       201: { description: Inscrição criada }
 *       400: { description: Inscrições encerradas ou dados inválidos }
 *       401: { description: Não autenticado }
 *       404: { description: Prova ou corredor não encontrados }
 *       409: { description: Já inscrito ou sem vagas }
 */
router.post('/:id/inscricoes', auth, controller.inscrever);

/**
 * @openapi
 * /api/provas/{id}/inscricoes/{corredorId}:
 *   delete:
 *     summary: Cancela a inscrição de um corredor na prova
 *     tags: [Provas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: corredorId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Inscrição cancelada }
 *       401: { description: Não autenticado }
 *       404: { description: Inscrição não encontrada }
 */
router.delete('/:id/inscricoes/:corredorId', auth, controller.cancelarInscricao);

module.exports = router;
