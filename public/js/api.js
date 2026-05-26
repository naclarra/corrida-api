/**
 * Cliente HTTP para a API. Encapsula fetch + tratamento de token JWT.
 */
const API = (() => {
  const BASE = '/api';
  const TOKEN_KEY = 'corrida:token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return null;

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (data && data.error) || `Erro ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    getToken,
    setToken,
    // Auth
    register: (dados) => request('POST', '/auth/register', dados),
    login: (dados) => request('POST', '/auth/login', dados),
    me: () => request('GET', '/auth/me'),
    // Provas
    listarProvas: (q = '') => request('GET', `/provas${q}`),
    buscarProva: (id) => request('GET', `/provas/${id}`),
    criarProva: (dados) => request('POST', '/provas', dados),
    atualizarProva: (id, dados) => request('PUT', `/provas/${id}`, dados),
    removerProva: (id) => request('DELETE', `/provas/${id}`),
    inscrever: (provaId, corredorId) =>
      request('POST', `/provas/${provaId}/inscricoes`, { corredorId }),
    cancelarInscricao: (provaId, corredorId) =>
      request('DELETE', `/provas/${provaId}/inscricoes/${corredorId}`),
    // Corredores
    listarCorredores: (q = '') => request('GET', `/corredores${q}`),
    buscarCorredor: (id) => request('GET', `/corredores/${id}`),
    listarProvasDoCorredor: (id) => request('GET', `/corredores/${id}/provas`),
    criarCorredor: (dados) => request('POST', '/corredores', dados),
    atualizarCorredor: (id, dados) => request('PUT', `/corredores/${id}`, dados),
    removerCorredor: (id) => request('DELETE', `/corredores/${id}`),
  };
})();
