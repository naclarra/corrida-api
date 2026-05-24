const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    senhaHash: { type: String, required: true },
    perfil: {
      type: String,
      enum: ['admin', 'usuario'],
      default: 'usuario',
    },
  },
  { timestamps: true }
);

usuarioSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.senhaHash;
  },
});

module.exports = mongoose.model('Usuario', usuarioSchema);
