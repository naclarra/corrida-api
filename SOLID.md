# 🧩 Princípios SOLID aplicados (Bônus D)

Este documento descreve **quatro dos cinco princípios SOLID** aplicados no
backend, com referência ao arquivo/classe e justificativa.

---

## S — Single Responsibility Principle

> Cada classe deve ter uma única razão para mudar.

A arquitetura está dividida em camadas, cada uma com **uma responsabilidade clara**:

| Camada      | Responsabilidade | Arquivos |
|-------------|------------------|----------|
| Controller  | Receber HTTP, extrair body/params, devolver JSON | `src/controllers/*.js` |
| Service     | Regras de negócio e validações de domínio | `src/services/*.js` |
| Repository  | Acesso ao banco (MongoDB via Mongoose) | `src/repositories/*.js` |
| Model       | Schema e validações estruturais | `src/models/*.js` |

**Exemplo concreto:** `src/services/ProvaService.js`

A classe `ProvaService` **só** orquestra regras de negócio sobre provas:
validações, verificação de vagas, controle de status (`aberta`/`encerrada`),
geração do número de peito. Ela **não conhece HTTP** (esse trabalho é do
controller) nem **detalhes do MongoDB** (esse trabalho é do repository).

```js
// src/services/ProvaService.js
async inscreverCorredor(provaId, corredorId) {
  const prova = await this.provaRepository.buscarPorId(provaId);
  if (!prova) throw new NotFoundError(...);
  if (prova.status !== 'aberta') throw new ValidationError('Inscrições encerradas');
  // ... resto da regra de negócio
}
```

Se mudarmos a forma de retornar a resposta HTTP (ex.: para GraphQL), o service
permanece intacto. Se trocarmos o banco para PostgreSQL, o service também permanece intacto.

---

## O — Open/Closed Principle

> Aberto para extensão, fechado para modificação.

**Onde aparece:** `src/middleware/auth.js → requireRole(...perfisPermitidos)`

A função `requireRole` é uma **factory** que recebe os perfis permitidos como
argumento variável. Para adicionar um novo perfil (ex.: `organizador`,
`fiscal`), basta **estender o uso** sem **modificar** o middleware:

```js
// Uso atual
router.delete('/:id', auth, requireRole('admin'), controller.remover);

// Para um novo cenário, sem mudar o middleware:
router.put('/:id', auth, requireRole('admin', 'organizador'), controller.atualizar);
```

A mesma ideia se aplica à hierarquia de erros em `src/utils/errors.js`:
`AppError → NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError`.
Para adicionar `RateLimitError`, basta criar uma nova subclasse sem alterar o
middleware de tratamento de erros — ele já trata qualquer `AppError`
genericamente.

---

## L — Liskov Substitution Principle

> Subtipos devem ser substituíveis pelos seus tipos base sem alterar o comportamento.

**Onde aparece:** `src/repositories/IProvaRepository.js` + `ProvaRepository.js`

`IProvaRepository` define o contrato (interface). `ProvaRepository` herda dele e
o implementa concretamente usando Mongoose. **Qualquer outra implementação**
(ex.: um `InMemoryProvaRepository` para testes, ou um `RedisProvaRepository`)
pode substituir a original **sem que o `ProvaService` precise saber da troca**,
desde que respeite o mesmo contrato.

Isso é exatamente o que os testes fazem: substituem o repositório real por um
mock que implementa o mesmo contrato:

```js
// tests/ProvaService.test.js
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
service = new ProvaService(provaRepo, corredorRepo);
```

Os testes passam porque o `ProvaService` trata abstração e implementação como
intercambiáveis.

---

## D — Dependency Inversion Principle

> Módulos de alto nível não devem depender de módulos de baixo nível; ambos
> devem depender de abstrações.

**Onde aparece:** `src/services/ProvaService.js` (construtor) e
`src/routes/provas.js` (composição).

O `ProvaService` **não importa** `Prova` (Mongoose model) nem `ProvaRepository`
diretamente — ele recebe os repositórios por **injeção de dependência** no
construtor:

```js
// src/services/ProvaService.js
class ProvaService {
  constructor(provaRepository, corredorRepository) {
    this.provaRepository = provaRepository;
    this.corredorRepository = corredorRepository;
  }
  // ...
}
```

A montagem (composition root) acontece em `src/routes/provas.js`:

```js
// src/routes/provas.js
const provaService = new ProvaService(
  new ProvaRepository(),
  new CorredorRepository()
);
const controller = new ProvaController(provaService);
```

Isso permite:

1. **Testar o service sem MongoDB** (demonstrado em `tests/`).
2. **Trocar a tecnologia de persistência** sem alterar a regra de negócio.
3. **Reusar o service em outros contextos** (jobs, CLI, GraphQL) com diferentes
   implementações de repositório.

---

## Resumo

| Princípio | Local | Justificativa |
|-----------|-------|---------------|
| **SRP** | `services/`, `controllers/`, `repositories/` | Separação clara de camadas; cada classe tem uma razão para mudar |
| **OCP** | `middleware/auth.js → requireRole` e `utils/errors.js` | Factory + hierarquia de erros permitem extensão sem modificação |
| **LSP** | `repositories/IProvaRepository.js` + `ProvaRepository.js` | Subclasses respeitam o contrato e são intercambiáveis (provado pelos mocks dos testes) |
| **DIP** | `services/ProvaService.js` (construtor) + `routes/provas.js` (composition root) | Service depende da abstração; concretudes injetadas |

> **Sobre o ISP (não enumerado acima):** ele aparece de forma sutil no
> `UsuarioRepository`, que expõe **apenas** as operações necessárias ao
> `AuthService` (`buscarPorEmail`, `buscarPorId`, `criar`) — sem listar,
> remover ou atualizar, que não fazem sentido para o fluxo de autenticação
> atual.
