const CorredorService = require('../src/services/CorredorService');
const {
  NotFoundError,
  ValidationError,
  ConflictError,
} = require('../src/utils/errors');

describe('CorredorService', () => {
  let corredorRepo;
  let service;

  beforeEach(() => {
    corredorRepo = {
      listar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn(),
      criar: jest.fn(),
      atualizar: jest.fn(),
      remover: jest.fn(),
    };
    service = new CorredorService(corredorRepo);
  });

  test('criar() deve persistir o corredor com dados válidos', async () => {
    corredorRepo.buscarPorEmail.mockResolvedValue(null);
    const corredor = { id: 'c1', nome: 'Pedro' };
    corredorRepo.criar.mockResolvedValue(corredor);

    const result = await service.criar({
      nome: 'Pedro',
      email: 'pedro@x.com',
      dataNascimento: '1990-05-20',
    });

    expect(result).toEqual(corredor);
    expect(corredorRepo.criar).toHaveBeenCalledTimes(1);
  });

  test('listar() deve repassar os filtros ao repositório', async () => {
    corredorRepo.listar.mockResolvedValue([{ id: '1' }]);

    const result = await service.listar({ nome: 'ana' });

    expect(result).toHaveLength(1);
    expect(corredorRepo.listar).toHaveBeenCalledWith({ nome: 'ana' });
  });

  test('criar() deve lançar ConflictError quando email já existe', async () => {
    corredorRepo.buscarPorEmail.mockResolvedValue({ id: 'existente' });

    await expect(
      service.criar({
        nome: 'Pedro',
        email: 'pedro@x.com',
        dataNascimento: '1990-05-20',
      })
    ).rejects.toThrow(ConflictError);

    expect(corredorRepo.criar).not.toHaveBeenCalled();
  });

  test('criar() deve lançar ValidationError quando email é inválido', async () => {
    await expect(
      service.criar({
        nome: 'Pedro',
        email: 'nao-eh-email',
        dataNascimento: '1990-05-20',
      })
    ).rejects.toThrow(ValidationError);
  });

  test('atualizar() deve lançar NotFoundError quando corredor não existe', async () => {
    corredorRepo.buscarPorId.mockResolvedValue(null);

    await expect(
      service.atualizar('inexistente', { nome: 'Novo' })
    ).rejects.toThrow(NotFoundError);

    expect(corredorRepo.atualizar).not.toHaveBeenCalled();
  });
});
