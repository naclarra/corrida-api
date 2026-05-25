const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Corrida API',
      version: '1.0.0',
      description:
        'API REST para gestão de **provas de corrida de rua**. Permite gerenciar '
        + 'corredores, provas (5K, 10K, meia-maratona e maratona) e inscrições, '
        + 'com autenticação JWT e controle de acesso por perfis (admin / usuario).',
      contact: { name: 'Trabalho Prático Semestral - Arquitetura de Aplicações Web' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Servidor local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Corredor: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '65f0c8a1b2d3e4f5a6b7c8d9' },
            nome: { type: 'string', example: 'Ana Silva' },
            email: { type: 'string', example: 'ana@exemplo.com' },
            dataNascimento: { type: 'string', format: 'date', example: '1995-03-12' },
            genero: { type: 'string', enum: ['M', 'F', 'Outro'] },
            cidade: { type: 'string' },
            idade: { type: 'integer', readOnly: true },
            categoria: {
              type: 'string',
              enum: ['Juvenil', 'Adulto', 'Master', 'Veterano'],
              readOnly: true,
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CorredorInput: {
          type: 'object',
          required: ['nome', 'email', 'dataNascimento'],
          properties: {
            nome: { type: 'string' },
            email: { type: 'string', format: 'email' },
            dataNascimento: { type: 'string', format: 'date' },
            genero: { type: 'string', enum: ['M', 'F', 'Outro'] },
            cidade: { type: 'string' },
          },
        },
        Inscricao: {
          type: 'object',
          properties: {
            corredor: {
              oneOf: [
                { type: 'string' },
                { $ref: '#/components/schemas/Corredor' },
              ],
            },
            numeroPeito: { type: 'integer', example: 42 },
            dataInscricao: { type: 'string', format: 'date-time' },
            tempoSegundos: { type: 'integer', nullable: true, example: 2730 },
            posicao: { type: 'integer', nullable: true, example: 5 },
          },
        },
        Prova: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nome: { type: 'string', example: 'Maratona de Belo Horizonte' },
            data: { type: 'string', format: 'date-time' },
            local: { type: 'string', example: 'Belo Horizonte' },
            modalidade: { type: 'string', enum: ['5K', '10K', '21K', '42K'] },
            distanciaKm: { type: 'number', example: 42.195 },
            vagas: { type: 'integer', example: 5000 },
            preco: { type: 'number', example: 150 },
            descricao: { type: 'string' },
            status: { type: 'string', enum: ['aberta', 'encerrada', 'finalizada'] },
            inscritos: {
              type: 'array',
              items: { $ref: '#/components/schemas/Inscricao' },
            },
            vagasRestantes: { type: 'integer', readOnly: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ProvaInput: {
          type: 'object',
          required: ['nome', 'data', 'local', 'modalidade'],
          properties: {
            nome: { type: 'string' },
            data: { type: 'string', format: 'date' },
            local: { type: 'string' },
            modalidade: { type: 'string', enum: ['5K', '10K', '21K', '42K'] },
            vagas: { type: 'integer' },
            preco: { type: 'number' },
            descricao: { type: 'string' },
            status: { type: 'string', enum: ['aberta', 'encerrada', 'finalizada'] },
          },
        },
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nome: { type: 'string' },
            email: { type: 'string' },
            perfil: { type: 'string', enum: ['admin', 'usuario'] },
          },
        },
        Erro: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, '..', 'routes', '*.js')],
};

module.exports = swaggerJSDoc(options);
