/**
 * Contrato (interface) que define operações de persistência de Provas.
 *
 * SOLID — Dependency Inversion Principle (DIP):
 * Os serviços dependem desta abstração, não da implementação concreta com Mongoose.
 * Isso permite trocar o backend de persistência (ex.: repositório em memória nos
 * testes) sem alterar a camada de serviço.
 *
 * SOLID — Interface Segregation Principle (ISP):
 * Define apenas as operações estritamente necessárias ao agregado Prova, sem
 * forçar implementações a depender de métodos que não usam.
 */
class IProvaRepository {
  // eslint-disable-next-line no-unused-vars
  async listar(filtros = {}) { throw new Error('Not implemented'); }
  // eslint-disable-next-line no-unused-vars
  async buscarPorId(id) { throw new Error('Not implemented'); }
  // eslint-disable-next-line no-unused-vars
  async criar(dados) { throw new Error('Not implemented'); }
  // eslint-disable-next-line no-unused-vars
  async atualizar(id, dados) { throw new Error('Not implemented'); }
  // eslint-disable-next-line no-unused-vars
  async remover(id) { throw new Error('Not implemented'); }
  // eslint-disable-next-line no-unused-vars
  async inscrever(provaId, dadosInscricao) { throw new Error('Not implemented'); }
  // eslint-disable-next-line no-unused-vars
  async cancelarInscricao(provaId, corredorId) { throw new Error('Not implemented'); }
}

module.exports = IProvaRepository;
