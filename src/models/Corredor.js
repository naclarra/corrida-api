const mongoose = require('mongoose');

const corredorSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    dataNascimento: { type: Date, required: true },
    genero: {
      type: String,
      enum: ['M', 'F', 'Outro'],
      default: 'Outro',
    },
    cidade: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Categoria computada com base na idade
corredorSchema.virtual('idade').get(function () {
  if (!this.dataNascimento) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - this.dataNascimento.getFullYear();
  const m = hoje.getMonth() - this.dataNascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < this.dataNascimento.getDate())) {
    idade--;
  }
  return idade;
});

corredorSchema.virtual('categoria').get(function () {
  const idade = this.idade;
  if (idade === null) return null;
  if (idade < 18) return 'Juvenil';
  if (idade < 35) return 'Adulto';
  if (idade < 50) return 'Master';
  return 'Veterano';
});

corredorSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

module.exports = mongoose.model('Corredor', corredorSchema);
