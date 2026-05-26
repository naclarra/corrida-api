/* ============================================================
   LARGADA SPA — navegação assíncrona, sem reload
   ============================================================ */

const App = (() => {
  const root = document.getElementById('app');
  let currentUser = null;

  // ---------------- Helpers ----------------
  function $(sel, parent = document) { return parent.querySelector(sel); }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatTime(seconds) {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function toast(message, type = 'info') {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function setLoading() {
    root.innerHTML = '<div class="loading">Carregando</div>';
  }

  function setActiveNav(viewName) {
    document.querySelectorAll('.nav-link').forEach((a) => {
      a.classList.toggle('active', a.dataset.view === viewName);
    });
  }

  // ---------------- Autenticação ----------------
  async function refreshAuthState() {
    if (!API.getToken()) {
      currentUser = null;
      updateAuthUI();
      return;
    }
    try {
      currentUser = await API.me();
    } catch {
      API.setToken(null);
      currentUser = null;
    }
    updateAuthUI();
  }

  function updateAuthUI() {
    const userInfo = $('#user-info');
    const btnLogin = $('#btn-login');
    const btnLogout = $('#btn-logout');
    if (currentUser) {
      userInfo.innerHTML = `<strong>${escapeHtml(currentUser.nome)}</strong> · ${escapeHtml(currentUser.perfil)}`;
      userInfo.classList.remove('hidden');
      btnLogin.classList.add('hidden');
      btnLogout.classList.remove('hidden');
    } else {
      userInfo.classList.add('hidden');
      btnLogin.classList.remove('hidden');
      btnLogout.classList.add('hidden');
    }
  }

  function requireAuth() {
    if (!currentUser) {
      toast('Faça login para esta ação', 'error');
      openAuthModal();
      return false;
    }
    return true;
  }
  function requireAdmin() {
    if (!currentUser) {
      toast('Faça login como admin', 'error');
      openAuthModal();
      return false;
    }
    if (currentUser.perfil !== 'admin') {
      toast('Apenas administradores podem realizar esta ação', 'error');
      return false;
    }
    return true;
  }

  function openAuthModal() { $('#auth-modal').classList.remove('hidden'); }
  function closeAuthModal() { $('#auth-modal').classList.add('hidden'); }

  // ============================================================
  // VIEW: Lista de Provas
  // ============================================================
  async function viewProvas(filtros = {}) {
    setActiveNav('provas');
    setLoading();
    try {
      const qs = new URLSearchParams();
      if (filtros.nome) qs.set('nome', filtros.nome);
      if (filtros.modalidade) qs.set('modalidade', filtros.modalidade);
      if (filtros.status) qs.set('status', filtros.status);
      const query = qs.toString() ? `?${qs}` : '';
      const provas = await API.listarProvas(query);

      root.innerHTML = `
        <header class="view-header">
          <div>
            <h2 class="view-title">Provas</h2>
            <p class="view-subtitle">${provas.length} ${provas.length === 1 ? 'evento cadastrado' : 'eventos cadastrados'}</p>
          </div>
          <button class="btn btn-primary" id="btn-nova-prova">+ Nova prova</button>
        </header>

        <div class="toolbar">
          <input type="text" id="search-provas" placeholder="Buscar por nome..." value="${escapeHtml(filtros.nome || '')}" />
          <select id="filter-modalidade">
            <option value="">Todas as modalidades</option>
            <option value="5K" ${filtros.modalidade === '5K' ? 'selected' : ''}>5K</option>
            <option value="10K" ${filtros.modalidade === '10K' ? 'selected' : ''}>10K</option>
            <option value="21K" ${filtros.modalidade === '21K' ? 'selected' : ''}>Meia maratona</option>
            <option value="42K" ${filtros.modalidade === '42K' ? 'selected' : ''}>Maratona</option>
          </select>
          <select id="filter-status">
            <option value="">Todos os status</option>
            <option value="aberta" ${filtros.status === 'aberta' ? 'selected' : ''}>Inscrições abertas</option>
            <option value="encerrada" ${filtros.status === 'encerrada' ? 'selected' : ''}>Encerradas</option>
            <option value="finalizada" ${filtros.status === 'finalizada' ? 'selected' : ''}>Finalizadas</option>
          </select>
        </div>

        <div class="list" id="lista-provas"></div>
      `;

      $('#btn-nova-prova').addEventListener('click', () => {
        if (!requireAuth()) return;
        viewProvaForm();
      });

      let debounce;
      $('#search-provas').addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => viewProvas({ ...filtros, nome: e.target.value }), 300);
      });
      $('#filter-modalidade').addEventListener('change', (e) => {
        viewProvas({ ...filtros, modalidade: e.target.value });
      });
      $('#filter-status').addEventListener('change', (e) => {
        viewProvas({ ...filtros, status: e.target.value });
      });

      const lista = $('#lista-provas');
      if (provas.length === 0) {
        lista.outerHTML = '<div class="empty">Nenhuma prova encontrada</div>';
        return;
      }

      provas.forEach((p) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
          <div>
            <div class="card-title">${escapeHtml(p.nome)}</div>
            <div class="card-meta">
              <span class="meta-strong">${formatDate(p.data)}</span>
              <span class="sep">·</span>
              <span>${escapeHtml(p.local)}</span>
              <span class="sep">·</span>
              <span>${(p.inscritos || []).length}/${p.vagas} inscritos</span>
            </div>
          </div>
          <div class="card-stats">
            <div class="modalidade-tag">${p.modalidade}</div>
            <span class="status-pill ${p.status}">${p.status}</span>
          </div>
        `;
        card.addEventListener('click', () => viewProvaDetail(p.id));
        lista.appendChild(card);
      });
    } catch (err) {
      root.innerHTML = `<div class="empty">Erro: ${escapeHtml(err.message)}</div>`;
    }
  }

  // ============================================================
  // VIEW: Detalhe de Prova (com inscrições)
  // ============================================================
  async function viewProvaDetail(id) {
    setLoading();
    try {
      const [prova, corredores] = await Promise.all([
        API.buscarProva(id),
        API.listarCorredores(),
      ]);

      const inscritosIds = new Set(
        (prova.inscritos || []).map((i) => (i.corredor && i.corredor.id) || i.corredor)
      );
      const corredoresDisponiveis = corredores.filter((c) => !inscritosIds.has(c.id));

      root.innerHTML = `
        <a href="#" id="back-provas" class="back-link">← Voltar para provas</a>
        <article class="detail">
          <header class="detail-header">
            <div class="detail-header-top">
              <h2 class="detail-title">${escapeHtml(prova.nome)}</h2>
              <div class="detail-modalidade">${prova.modalidade}</div>
            </div>
            <div class="detail-meta">
              <span><strong>${formatDate(prova.data)}</strong></span>
              <span>${escapeHtml(prova.local)}</span>
              <span class="status-pill ${prova.status}">${prova.status}</span>
            </div>
          </header>

          ${prova.descricao ? `<p class="detail-text">${escapeHtml(prova.descricao)}</p>` : ''}

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">${prova.distanciaKm}</div>
              <div class="stat-label">km</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${(prova.inscritos || []).length}</div>
              <div class="stat-label">inscritos</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${prova.vagasRestantes !== undefined ? prova.vagasRestantes : (prova.vagas - (prova.inscritos || []).length)}</div>
              <div class="stat-label">vagas livres</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">R$ ${(prova.preco || 0).toFixed(0)}</div>
              <div class="stat-label">inscrição</div>
            </div>
          </div>

          ${prova.status === 'aberta' ? `
            <div class="inscricao-box">
              <h4>Inscrever corredor</h4>
              <div class="form-row">
                <div>
                  <select id="select-corredor">
                    <option value="">— selecione um corredor —</option>
                    ${corredoresDisponiveis.map((c) =>
                      `<option value="${c.id}">${escapeHtml(c.nome)} (${escapeHtml(c.email)})</option>`
                    ).join('')}
                  </select>
                </div>
                <button class="btn btn-primary" id="btn-inscrever">Inscrever</button>
              </div>
            </div>
          ` : ''}

          <div class="detail-section">
            <h3>Inscritos</h3>
            ${renderInscritos(prova.inscritos, prova.id)}
          </div>

          <div class="detail-actions">
            <button class="btn btn-secondary" id="btn-editar-prova">Editar prova</button>
            <button class="btn btn-danger" id="btn-remover-prova">Remover prova</button>
          </div>
        </article>
      `;

      $('#back-provas').addEventListener('click', (e) => {
        e.preventDefault();
        viewProvas();
      });

      $('#btn-editar-prova').addEventListener('click', () => {
        if (!requireAuth()) return;
        viewProvaForm(prova);
      });

      $('#btn-remover-prova').addEventListener('click', async () => {
        if (!requireAdmin()) return;
        if (!confirm(`Remover a prova "${prova.nome}"?`)) return;
        try {
          await API.removerProva(prova.id);
          toast('Prova removida', 'success');
          viewProvas();
        } catch (err) {
          toast(err.message, 'error');
        }
      });

      if (prova.status === 'aberta') {
        $('#btn-inscrever').addEventListener('click', async () => {
          if (!requireAuth()) return;
          const corredorId = $('#select-corredor').value;
          if (!corredorId) {
            toast('Selecione um corredor', 'error');
            return;
          }
          try {
            await API.inscrever(prova.id, corredorId);
            toast('Inscrição confirmada', 'success');
            viewProvaDetail(prova.id);
          } catch (err) {
            toast(err.message, 'error');
          }
        });
      }

      // Bind dos botões de cancelar inscrição
      document.querySelectorAll('[data-cancelar-corredor]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!requireAuth()) return;
          const corredorId = btn.dataset.cancelarCorredor;
          if (!confirm('Cancelar esta inscrição?')) return;
          try {
            await API.cancelarInscricao(prova.id, corredorId);
            toast('Inscrição cancelada', 'success');
            viewProvaDetail(prova.id);
          } catch (err) {
            toast(err.message, 'error');
          }
        });
      });

      // Click em um inscrito → detalhe do corredor
      document.querySelectorAll('[data-corredor-id]').forEach((row) => {
        row.addEventListener('click', () => {
          viewCorredorDetail(row.dataset.corredorId);
        });
      });
    } catch (err) {
      root.innerHTML = `<div class="empty">Prova não encontrada: ${escapeHtml(err.message)}</div>`;
    }
  }

  function renderInscritos(inscritos, provaId) {
    if (!inscritos || inscritos.length === 0) {
      return '<div class="empty" style="padding: 2rem; font-size: 1rem;">Nenhum corredor inscrito</div>';
    }
    return `
      <div class="inscritos-list">
        <div class="inscritos-row header">
          <span>Peito</span>
          <span>Corredor</span>
          <span>Ações</span>
        </div>
        ${inscritos.map((i) => {
          const c = i.corredor || {};
          const corredorId = c.id || c._id || i.corredor;
          return `
            <div class="inscritos-row" data-corredor-id="${corredorId}" style="cursor: pointer;">
              <span class="peito-num">#${String(i.numeroPeito || '').padStart(3, '0')}</span>
              <div>
                <div class="inscrito-nome">${escapeHtml(c.nome || 'Corredor #' + corredorId)}</div>
                ${c.cidade ? `<div class="inscrito-cidade">${escapeHtml(c.cidade)}</div>` : ''}
              </div>
              <button class="btn btn-danger btn-sm" data-cancelar-corredor="${corredorId}">Cancelar</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ============================================================
  // VIEW: Formulário de Prova
  // ============================================================
  function viewProvaForm(prova = null) {
    const editando = !!prova;
    const dataIso = prova && prova.data ? new Date(prova.data).toISOString().split('T')[0] : '';

    root.innerHTML = `
      <header class="view-header">
        <div>
          <h2 class="view-title">${editando ? 'Editar' : 'Nova'} prova</h2>
          <p class="view-subtitle">${editando ? 'Atualize as informações do evento' : 'Cadastre um novo evento'}</p>
        </div>
      </header>

      <form class="form" id="form-prova">
        <div>
          <label>Nome do evento
            <input type="text" name="nome" required value="${escapeHtml(prova?.nome || '')}" />
          </label>
        </div>

        <div class="form-row">
          <div>
            <label>Data
              <input type="date" name="data" required value="${dataIso}" />
            </label>
          </div>
          <div>
            <label>Local (cidade)
              <input type="text" name="local" required value="${escapeHtml(prova?.local || '')}" />
            </label>
          </div>
        </div>

        <div class="form-row">
          <div>
            <label>Modalidade
              <select name="modalidade" required>
                <option value="">— escolha —</option>
                <option value="5K" ${prova?.modalidade === '5K' ? 'selected' : ''}>5 km</option>
                <option value="10K" ${prova?.modalidade === '10K' ? 'selected' : ''}>10 km</option>
                <option value="21K" ${prova?.modalidade === '21K' ? 'selected' : ''}>Meia maratona (21K)</option>
                <option value="42K" ${prova?.modalidade === '42K' ? 'selected' : ''}>Maratona (42K)</option>
              </select>
            </label>
          </div>
          <div>
            <label>Status
              <select name="status">
                <option value="aberta" ${(prova?.status || 'aberta') === 'aberta' ? 'selected' : ''}>Inscrições abertas</option>
                <option value="encerrada" ${prova?.status === 'encerrada' ? 'selected' : ''}>Encerrada</option>
                <option value="finalizada" ${prova?.status === 'finalizada' ? 'selected' : ''}>Finalizada</option>
              </select>
            </label>
          </div>
        </div>

        <div class="form-row">
          <div>
            <label>Vagas
              <input type="number" name="vagas" min="1" value="${prova?.vagas || 100}" />
            </label>
          </div>
          <div>
            <label>Preço (R$)
              <input type="number" name="preco" min="0" step="0.01" value="${prova?.preco ?? 0}" />
            </label>
          </div>
        </div>

        <div>
          <label>Descrição
            <textarea name="descricao" rows="3">${escapeHtml(prova?.descricao || '')}</textarea>
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${editando ? 'Salvar' : 'Criar prova'}</button>
          <button type="button" class="btn btn-secondary" id="btn-cancelar">Cancelar</button>
        </div>
      </form>
    `;

    $('#btn-cancelar').addEventListener('click', () => {
      editando ? viewProvaDetail(prova.id) : viewProvas();
    });

    $('#form-prova').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const dados = {
        nome: fd.get('nome'),
        data: fd.get('data'),
        local: fd.get('local'),
        modalidade: fd.get('modalidade'),
        status: fd.get('status'),
        vagas: Number(fd.get('vagas')),
        preco: Number(fd.get('preco')),
        descricao: fd.get('descricao') || undefined,
      };
      try {
        if (editando) {
          const atualizada = await API.atualizarProva(prova.id, dados);
          toast('Prova atualizada', 'success');
          viewProvaDetail(atualizada.id);
        } else {
          const criada = await API.criarProva(dados);
          toast('Prova criada', 'success');
          viewProvaDetail(criada.id);
        }
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // ============================================================
  // VIEW: Lista de Corredores
  // ============================================================
  async function viewCorredores(filtroBusca = '') {
    setActiveNav('corredores');
    setLoading();
    try {
      const qs = filtroBusca ? `?nome=${encodeURIComponent(filtroBusca)}` : '';
      const corredores = await API.listarCorredores(qs);

      root.innerHTML = `
        <header class="view-header">
          <div>
            <h2 class="view-title">Corredores</h2>
            <p class="view-subtitle">${corredores.length} ${corredores.length === 1 ? 'corredor cadastrado' : 'corredores cadastrados'}</p>
          </div>
          <button class="btn btn-primary" id="btn-novo-corredor">+ Novo corredor</button>
        </header>
        <div class="toolbar">
          <input type="text" id="search-corredores" placeholder="Buscar por nome..." value="${escapeHtml(filtroBusca)}" />
        </div>
        <div class="list" id="lista-corredores"></div>
      `;

      $('#btn-novo-corredor').addEventListener('click', () => {
        if (!requireAuth()) return;
        viewCorredorForm();
      });

      let debounce;
      $('#search-corredores').addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => viewCorredores(e.target.value), 300);
      });

      const lista = $('#lista-corredores');
      if (corredores.length === 0) {
        lista.outerHTML = '<div class="empty">Nenhum corredor encontrado</div>';
        return;
      }
      corredores.forEach((c) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
          <div>
            <div class="card-title">${escapeHtml(c.nome)}</div>
            <div class="card-meta">
              <span>${escapeHtml(c.email)}</span>
              ${c.cidade ? `<span class="sep">·</span><span>${escapeHtml(c.cidade)}</span>` : ''}
              ${c.categoria ? `<span class="sep">·</span><span class="meta-strong">${escapeHtml(c.categoria)}</span>` : ''}
            </div>
          </div>
          <div class="card-stats">
            ${c.idade !== null && c.idade !== undefined ? `<div class="modalidade-tag" style="font-size: 1.8rem;">${c.idade}</div><div style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-soft);">anos</div>` : ''}
          </div>
        `;
        card.addEventListener('click', () => viewCorredorDetail(c.id));
        lista.appendChild(card);
      });
    } catch (err) {
      root.innerHTML = `<div class="empty">Erro: ${escapeHtml(err.message)}</div>`;
    }
  }

  // ============================================================
  // VIEW: Detalhe de Corredor (com provas que participou)
  // ============================================================
  async function viewCorredorDetail(id) {
    setLoading();
    try {
      const [corredor, provas] = await Promise.all([
        API.buscarCorredor(id),
        API.listarProvasDoCorredor(id),
      ]);

      root.innerHTML = `
        <a href="#" id="back-corredores" class="back-link">← Voltar para corredores</a>
        <article class="detail">
          <header class="detail-header">
            <div class="detail-header-top">
              <h2 class="detail-title">${escapeHtml(corredor.nome)}</h2>
              ${corredor.idade !== null && corredor.idade !== undefined ? `<div class="detail-modalidade">${corredor.idade}</div>` : ''}
            </div>
            <div class="detail-meta">
              <span>${escapeHtml(corredor.email)}</span>
              ${corredor.cidade ? `<span>${escapeHtml(corredor.cidade)}</span>` : ''}
              ${corredor.categoria ? `<span><strong>${escapeHtml(corredor.categoria)}</strong></span>` : ''}
            </div>
          </header>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">${provas.length}</div>
              <div class="stat-label">Provas inscritas</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${corredor.genero || '—'}</div>
              <div class="stat-label">Gênero</div>
            </div>
            <div class="stat-box">
              <div class="stat-value mono" style="font-size: 1rem;">${formatDate(corredor.dataNascimento)}</div>
              <div class="stat-label">Nascimento</div>
            </div>
          </div>

          ${provas.length > 0 ? `
            <div class="detail-section">
              <h3>Histórico de provas</h3>
              <div class="list">
                ${provas.map((p) => `
                  <article class="card" data-prova-id="${p.id}">
                    <div>
                      <div class="card-title">${escapeHtml(p.nome)}</div>
                      <div class="card-meta">
                        <span class="meta-strong">${formatDate(p.data)}</span>
                        <span class="sep">·</span>
                        <span>${escapeHtml(p.local)}</span>
                      </div>
                    </div>
                    <div class="card-stats">
                      <div class="modalidade-tag">${p.modalidade}</div>
                      <span class="status-pill ${p.status}">${p.status}</span>
                    </div>
                  </article>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="detail-actions">
            <button class="btn btn-secondary" id="btn-editar-corredor">Editar</button>
            <button class="btn btn-danger" id="btn-remover-corredor">Remover</button>
          </div>
        </article>
      `;

      $('#back-corredores').addEventListener('click', (e) => {
        e.preventDefault();
        viewCorredores();
      });
      $('#btn-editar-corredor').addEventListener('click', () => {
        if (!requireAuth()) return;
        viewCorredorForm(corredor);
      });
      $('#btn-remover-corredor').addEventListener('click', async () => {
        if (!requireAdmin()) return;
        if (!confirm(`Remover ${corredor.nome}?`)) return;
        try {
          await API.removerCorredor(corredor.id);
          toast('Corredor removido', 'success');
          viewCorredores();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
      document.querySelectorAll('[data-prova-id]').forEach((el) => {
        el.addEventListener('click', () => viewProvaDetail(el.dataset.provaId));
      });
    } catch (err) {
      root.innerHTML = `<div class="empty">Corredor não encontrado: ${escapeHtml(err.message)}</div>`;
    }
  }

  // ============================================================
  // VIEW: Formulário de Corredor
  // ============================================================
  function viewCorredorForm(corredor = null) {
    const editando = !!corredor;
    const dataIso = corredor && corredor.dataNascimento
      ? new Date(corredor.dataNascimento).toISOString().split('T')[0]
      : '';
    root.innerHTML = `
      <header class="view-header">
        <div>
          <h2 class="view-title">${editando ? 'Editar' : 'Novo'} corredor</h2>
          <p class="view-subtitle">${editando ? 'Atualize as informações' : 'Cadastre um novo corredor'}</p>
        </div>
      </header>

      <form class="form" id="form-corredor">
        <div>
          <label>Nome completo
            <input type="text" name="nome" required value="${escapeHtml(corredor?.nome || '')}" />
          </label>
        </div>

        <div class="form-row">
          <div>
            <label>Email
              <input type="email" name="email" required value="${escapeHtml(corredor?.email || '')}" />
            </label>
          </div>
          <div>
            <label>Data de nascimento
              <input type="date" name="dataNascimento" required value="${dataIso}" />
            </label>
          </div>
        </div>

        <div class="form-row">
          <div>
            <label>Gênero
              <select name="genero">
                <option value="Outro" ${(corredor?.genero || 'Outro') === 'Outro' ? 'selected' : ''}>Outro / prefiro não dizer</option>
                <option value="F" ${corredor?.genero === 'F' ? 'selected' : ''}>Feminino</option>
                <option value="M" ${corredor?.genero === 'M' ? 'selected' : ''}>Masculino</option>
              </select>
            </label>
          </div>
          <div>
            <label>Cidade
              <input type="text" name="cidade" value="${escapeHtml(corredor?.cidade || '')}" />
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${editando ? 'Salvar' : 'Cadastrar'}</button>
          <button type="button" class="btn btn-secondary" id="btn-cancelar">Cancelar</button>
        </div>
      </form>
    `;
    $('#btn-cancelar').addEventListener('click', () => {
      editando ? viewCorredorDetail(corredor.id) : viewCorredores();
    });
    $('#form-corredor').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const dados = {
        nome: fd.get('nome'),
        email: fd.get('email'),
        dataNascimento: fd.get('dataNascimento'),
        genero: fd.get('genero'),
        cidade: fd.get('cidade') || undefined,
      };
      try {
        if (editando) {
          const atualizado = await API.atualizarCorredor(corredor.id, dados);
          toast('Corredor atualizado', 'success');
          viewCorredorDetail(atualizado.id);
        } else {
          const criado = await API.criarCorredor(dados);
          toast('Corredor cadastrado', 'success');
          viewCorredorDetail(criado.id);
        }
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // ============================================================
  // Inicialização
  // ============================================================
  function setupNav() {
    document.querySelectorAll('.nav-link').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const view = a.dataset.view;
        if (view === 'provas') viewProvas();
        else if (view === 'corredores') viewCorredores();
      });
    });

    $('#btn-login').addEventListener('click', openAuthModal);
    $('#btn-logout').addEventListener('click', () => {
      API.setToken(null);
      currentUser = null;
      updateAuthUI();
      toast('Você saiu', 'success');
    });
    $('#modal-close').addEventListener('click', closeAuthModal);
    $('#auth-modal').addEventListener('click', (e) => {
      if (e.target.id === 'auth-modal') closeAuthModal();
    });

    document.querySelectorAll('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        if (tab.dataset.tab === 'login') {
          $('#form-login').classList.remove('hidden');
          $('#form-register').classList.add('hidden');
        } else {
          $('#form-login').classList.add('hidden');
          $('#form-register').classList.remove('hidden');
        }
      });
    });

    $('#form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const { token } = await API.login({
          email: fd.get('email'),
          senha: fd.get('senha'),
        });
        API.setToken(token);
        await refreshAuthState();
        toast(`Bem-vindo, ${currentUser.nome}!`, 'success');
        closeAuthModal();
        e.target.reset();
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    $('#form-register').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await API.register({
          nome: fd.get('nome'),
          email: fd.get('email'),
          senha: fd.get('senha'),
          perfil: fd.get('perfil'),
        });
        const { token } = await API.login({
          email: fd.get('email'),
          senha: fd.get('senha'),
        });
        API.setToken(token);
        await refreshAuthState();
        toast(`Conta criada. Bem-vindo, ${currentUser.nome}!`, 'success');
        closeAuthModal();
        e.target.reset();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  async function init() {
    setupNav();
    await refreshAuthState();
    await viewProvas();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
