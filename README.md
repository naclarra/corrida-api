# 🏃 LARGADA — Corrida API

> Trabalho Prático Semestral — Arquitetura de Aplicações Web (2026.1)

Aplicação web completa para gestão de **provas de corrida de rua**: cadastro de
corredores, criação de provas (5K, 10K, meia maratona e maratona), inscrições,
autenticação JWT com perfis de acesso, documentação OpenAPI e frontend SPA com
navegação assíncrona.

---

## 🧭 Visão geral

O domínio escolhido foi **gestão de corridas de rua**, modelado em torno de duas
entidades principais com relacionamento:

| Entidade | Campos principais |
|----------|-------------------|
| **Corredor** | `nome`, `email`, `dataNascimento`, `genero`, `cidade` + `idade` e `categoria` computados |
| **Prova** | `nome`, `data`, `local`, `modalidade` (5K/10K/21K/42K), `distanciaKm`, `vagas`, `preço`, `status`, `descricao`, `inscritos[]` |

A **relação** entre as entidades acontece via o array `inscritos` em `Prova`,
onde cada item registra: `corredor` (referência), `numeroPeito`, `dataInscricao`,
`tempoSegundos` e `posicao`. Endpoints dedicados criam e cancelam inscrições.

A categoria do corredor é **computada automaticamente** com base na idade:
- até 17 anos → Juvenil
- 18 a 34 → Adulto
- 35 a 49 → Master
- 50+ → Veterano

---

## 🧱 Stack

| Camada    | Tecnologia                                        |
|-----------|---------------------------------------------------|
| Backend   | Node.js 20+, Express 4, Mongoose 8                |
| Banco     | MongoDB 7 (NoSQL)                                 |
| Auth      | JSON Web Token (`jsonwebtoken`) + `bcryptjs`      |
| Docs      | OpenAPI 3.0 via `swagger-jsdoc` + `swagger-ui-express` |
| Testes    | Jest                                              |
| Frontend  | HTML + CSS + JavaScript (vanilla), `fetch` API    |

---

## 📋 Pré-requisitos

- **Node.js 20 LTS** ou superior (`node --version`)
- **npm 10+** (acompanha o Node.js)
- **MongoDB** acessível na URI configurada — o jeito mais fácil é via Docker:
  - **Docker** + **Docker Compose** (opcional, mas recomendado)

---

## 🚀 Como rodar localmente

### 1. Clone e instale

```bash
git clone <URL_DO_REPOSITORIO>
cd corrida-api
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Conteúdo padrão do `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/corrida
JWT_SECRET=troque-este-segredo-em-producao-use-uma-string-longa-e-aleatoria
JWT_EXPIRES_IN=2h
```

> ⚠️ **Importante:** nenhuma string de conexão ou segredo está hardcoded no
> código. Tudo é lido via `process.env`.

### 3. Suba o MongoDB

```bash
docker compose up -d
```

Verifique que o container está rodando:

```bash
docker ps
```

### 4. Inicie a aplicação

```bash
# Modo desenvolvimento (auto-reload):
npm run dev

# Ou em modo produção:
npm start
```

Endereços disponíveis:

- **Frontend (SPA):** http://localhost:5000/
- **API:** http://localhost:5000/api
- **Swagger:** http://localhost:5000/swagger

---

## 📖 Documentação OpenAPI / Swagger

Toda a API está documentada com **OpenAPI 3.0**, gerada via anotações nos
arquivos de rota (`src/routes/*.js`).

Acesse: **http://localhost:5000/swagger**

A UI do Swagger permite visualizar todos os endpoints organizados por *tag*
(Provas, Corredores, Autenticação), ver schemas, e testar requisições direto
da interface (incluindo envio do token JWT no botão **Authorize**).

---

## 🧪 Como rodar os testes (Bônus C)

```bash
npm test
```

Os testes unitários estão em `tests/` e cobrem:

- `ProvaService` — 2 cenários de sucesso, 3 de erro (incluindo inscrição com prova encerrada, sem vagas, modalidade inválida).
- `CorredorService` — 2 cenários de sucesso, 3 de erro (email duplicado, email inválido, atualização de inexistente).

Os testes usam **repositórios mockados** (sem tocar no MongoDB), provando que a
camada de serviço é desacoplada da persistência graças à injeção de dependência.

---

## 🔐 Autenticação e perfis (Bônus A e B)

A aplicação implementa autenticação via **JWT** e controle de acesso baseado em
papéis (RBAC).

### Endpoints públicos (leitura)

| Método | Rota                            | O que faz                              |
|--------|---------------------------------|----------------------------------------|
| `POST` | `/api/auth/register`            | Cria um novo usuário                   |
| `POST` | `/api/auth/login`               | Autentica e retorna o JWT              |
| `GET`  | `/api/provas`                   | Lista provas                           |
| `GET`  | `/api/provas/:id`               | Detalha uma prova                      |
| `GET`  | `/api/corredores`               | Lista corredores                       |
| `GET`  | `/api/corredores/:id`           | Detalha um corredor                    |
| `GET`  | `/api/corredores/:id/provas`    | Lista provas em que o corredor está inscrito |

### Endpoints autenticados (qualquer usuário logado)

| Método | Rota                                          |
|--------|-----------------------------------------------|
| `POST` | `/api/provas`                                 |
| `PUT`  | `/api/provas/:id`                             |
| `POST` | `/api/provas/:id/inscricoes`                  |
| `DELETE` | `/api/provas/:id/inscricoes/:corredorId`    |
| `POST` | `/api/corredores`                             |
| `PUT`  | `/api/corredores/:id`                         |
| `GET`  | `/api/auth/me`                                |

Header obrigatório: `Authorization: Bearer <token>`

### Endpoints restritos a admin (RBAC)

| Método   | Rota                  |
|----------|-----------------------|
| `DELETE` | `/api/provas/:id`     |
| `DELETE` | `/api/corredores/:id` |

O perfil do usuário está embutido no payload do JWT (`payload.perfil`) e é
validado pelo middleware `requireRole` em `src/middleware/auth.js`.

### Como criar o primeiro admin

Pelo frontend: aba "Criar conta" → escolha perfil **Administrador**.

Via curl:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Admin","email":"admin@largada.com","senha":"senha123","perfil":"admin"}'
```

---

## 🧩 SOLID (Bônus D)

Os princípios SOLID aplicados estão detalhados em [`SOLID.md`](./SOLID.md).

---

## 🌐 Frontend com navegação assíncrona

O frontend está em `public/` e é uma **SPA** em HTML + JavaScript vanilla.

Características:

- **Sem reload** entre views — toda navegação atualiza apenas o conteúdo de `<main id="app">`.
- **Chamadas assíncronas** ao backend usando `fetch` (`public/js/api.js`).
- **Múltiplas views**: lista de provas, detalhe de prova (com inscritos),
  formulário de prova; lista de corredores, detalhe do corredor (com histórico
  de provas), formulário de corredor; modal de login/registro.
- **Filtros assíncronos** na lista de provas (por nome, modalidade, status).
- **Inscrições gerenciadas inline** no detalhe da prova.

Acesse **http://localhost:5000/** após iniciar o servidor.

---

## 📂 Estrutura do projeto

```
corrida-api/
├── README.md
├── SOLID.md
├── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
├── src/
│   ├── server.js              # Entrypoint
│   ├── app.js                 # Express + middlewares + rotas
│   ├── config/database.js     # Conexão MongoDB
│   ├── models/                # Schemas Mongoose
│   │   ├── Corredor.js
│   │   ├── Prova.js
│   │   └── Usuario.js
│   ├── repositories/          # Camada de persistência (DIP)
│   │   ├── IProvaRepository.js
│   │   ├── ProvaRepository.js
│   │   ├── CorredorRepository.js
│   │   └── UsuarioRepository.js
│   ├── services/              # Regras de negócio (SRP)
│   │   ├── ProvaService.js
│   │   ├── CorredorService.js
│   │   └── AuthService.js
│   ├── controllers/           # Adaptadores HTTP
│   ├── routes/                # Rotas + anotações Swagger
│   ├── middleware/            # auth, errorHandler
│   ├── docs/swagger.js        # Especificação OpenAPI
│   └── utils/errors.js        # Erros de domínio
├── tests/                     # Testes Jest
│   ├── ProvaService.test.js
│   └── CorredorService.test.js
└── public/                    # Frontend SPA
    ├── index.html
    ├── css/style.css
    └── js/{api.js, app.js}
```

---

## 🛠 Comandos úteis

| Comando            | O que faz                              |
|--------------------|----------------------------------------|
| `npm install`      | Instala dependências                   |
| `npm run dev`      | Inicia com auto-reload (nodemon)       |
| `npm start`        | Inicia em modo produção                |
| `npm test`         | Executa os testes unitários            |
| `docker compose up -d`   | Sobe o MongoDB                   |
| `docker compose down`    | Derruba o MongoDB                |

---

## 📝 Roteiro de demonstração

Sugestão para a apresentação:

1. **Subir o ambiente** — `docker compose up -d` + `npm run dev`.
2. **Abrir o Swagger** (`/swagger`) e mostrar a documentação dos endpoints.
3. **Abrir o frontend** (`/`) — mostrar a navegação assíncrona entre views.
4. **Tentar criar prova sem login** → observar o redirecionamento ao modal.
5. **Registrar e logar** como `admin`.
6. **Cadastrar 2-3 corredores** com idades diferentes (mostrar categoria computada).
7. **Cadastrar uma prova** (ex.: "Maratona BH", 42K).
8. **Entrar no detalhe da prova** e inscrever os corredores via dropdown.
9. **Mostrar o número de peito** sendo gerado automaticamente.
10. **Tentar inscrever o mesmo corredor 2x** → ver o erro 409 (ConflictError).
11. **Tentar deletar como usuário comum** vs **deletar como admin** (RBAC).
12. **Rodar os testes** com `npm test`.
13. **Explicar SOLID** seguindo o `SOLID.md`.
