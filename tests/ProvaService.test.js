const ProvaService = require('../src/services/ProvaService');
const {
  NotFoundError,
  ValidationError,
  ConflictError,
} = require('../src/utils/errors');

/**
 * Testes unitários do ProvaService usando repositórios falsos (mocks).
 *
 * Não tocam no MongoDB — provam que a regra de negócio funciona isoladamente
 * graças ao princípio DIP (injeção de dependência).
 */
describe('ProvaService', () => {
  let provaRepo;
  let corredorRepo;
  let service;

  beforeEach(() => {
    provaRepo = {
      listar: jest.fn(),
      buscarPorId: jest.fn(),
      criar: jest.fn(),
      atualizar: jest.fn(),
      remover: jest.fn(),
      inscrever: jest.fn(),
      cancelarInscricao: jest.fn(),
      listarPorCorredor: jest.fn(),
    };
    corredorRepo = { buscarPorId: jest.fn() };
    service = new ProvaService(provaRepo, corredorRepo);
  });

  // --- Cenários de sucesso ---

  test('criar() deve persistir uma prova válida e preencher distanciaKm pela modalidade', async () => {
    const provaCriada = { id: 'prova1', nome: 'Maratona BH', modalidade: '42K', distanciaKm: 42.195 };
    provaRepo.criar.mockResolvedValue(provaCriada);

    const result = await service.criar({
      nome: 'Maratona BH',
      data: '2026-09-15',
      local: 'Belo Horizonte',
      modalidade: '42K',
    });

    expect(result).toEqual(provaCriada);
    expect(provaRepo.criar).toHaveBeenCalledWith(
      expect.objectContaining({ modalidade: '42K', distanciaKm: 42.195 })
    );
  });

  test('inscreverCorredor() deve inscrever quando há vagas e prova está aberta', async () => {
    provaRepo.buscarPorId.mockResolvedValue({
      id: 'prova1',
      status: 'aberta',
      vagas: 100,
      inscritos: [],
    });
    corredorRepo.buscarPorId.mockResolvedValue({ id: 'corredor1', nome: 'Ana' });
    provaRepo.inscrever.mockResolvedValue({ id: 'prova1', inscritos: [{ corredor: 'corredor1' }] });

    const result = await service.inscreverCorredor('prova1', 'corredor1');

    expect(result.inscritos).toHaveLength(1);
    expect(provaRepo.inscrever).toHaveBeenCalledWith(
      'prova1',
      expect.objectContaining({ corredor: 'corredor1', numeroPeito: 1 })
    );
  });

  // --- Cenários de erro ---

  test('criar() deve lançar ValidationError quando modalidade é inválida', async () => {
    await expect(
      service.criar({
        nome: 'Prova X',
        data: '2026-09-15',
        local: 'BH',
        modalidade: '100K',
      })
    ).rejects.toThrow(ValidationError);

    expect(provaRepo.criar).not.toHaveBeenCalled();
  });

  test('buscarPorId() deve lançar NotFoundError quando a prova não existe', async () => {
    provaRepo.buscarPorId.mockResolvedValue(null);

    await expect(service.buscarPorId('inexistente')).rejects.toThrow(NotFoundError);
  });

  test('inscreverCorredor() deve lançar ConflictError quando não há vagas', async () => {
    provaRepo.buscarPorId.mockResolvedValue({
      id: 'prova1',
      status: 'aberta',
      vagas: 1,
      inscritos: [{ corredor: 'outro' }],
    });
    corredorRepo.buscarPorId.mockResolvedValue({ id: 'corredor1' });

    await expect(
      service.inscreverCorredor('prova1', 'corredor1')
    ).rejects.toThrow(ConflictError);

    expect(provaRepo.inscrever).not.toHaveBeenCalled();
  });

  test('inscreverCorredor() deve lançar ValidationError quando a prova está encerrada', async () => {
    provaRepo.buscarPorId.mockResolvedValue({
      id: 'prova1',
      status: 'encerrada',
      vagas: 100,
      inscritos: [],
    });

    await expect(
      service.inscreverCorredor('prova1', 'corredor1')
    ).rejects.toThrow(ValidationError);
  });
});
