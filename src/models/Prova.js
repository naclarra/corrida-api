const mongoose = require('mongoose');

const inscricaoSchema = new mongoose.Schema(
  {
    corredor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Corredor',
      required: true,
    },
    numeroPeito: { type: Number, required: true },
    dataInscricao: { type: Date, default: Date.now },
    tempoSegundos: { type: Number, default: null }, // tempo final em segundos
    posicao: { type: Number, default: null },
  },
  { _id: false }
);

const provaSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    data: { type: Date, required: true },
    local: { type: String, required: true, trim: true },
    modalidade: {
      type: String,
      enum: ['5K', '10K', '21K', '42K'],
      required: true,
    },
    distanciaKm: { type: Number, required: true, min: 0 },
    vagas: { type: Number, default: 100, min: 1 },
    preco: { type: Number, default: 0, min: 0 },
    descricao: { type: String, default: '' },
    status: {
      type: String,
      enum: ['aberta', 'encerrada', 'finalizada'],
      default: 'aberta',
    },
    inscritos: [inscricaoSchema],
  },
  { timestamps: true }
);

// Total de vagas disponíveis (computed)
provaSchema.virtual('vagasRestantes').get(function () {
  return Math.max(0, this.vagas - (this.inscritos?.length || 0));
});

provaSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

module.exports = mongoose.model('Prova', provaSchema);
