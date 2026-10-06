(() => {
  const cfg = window.ACESSO_LIVE || {};
  const params = new URLSearchParams(window.location.search);
  const sessionCode = (params.get('sessao') || cfg.defaultSessionCode || 'PUCMG-06102026').slice(0, 40);
  const sessionLabel = cfg.defaultSessionLabel || sessionCode;
  const liveEnabled = Boolean(cfg.enabled && cfg.supabaseUrl && cfg.supabaseAnonKey && !String(cfg.supabaseUrl).includes('COLE_AQUI'));
  const apiBase = liveEnabled ? `${String(cfg.supabaseUrl).replace(/\/$/, '')}/rest/v1/acesso_events` : '';
  const commonHeaders = liveEnabled ? {
    apikey: cfg.supabaseAnonKey,
    Authorization: `Bearer ${cfg.supabaseAnonKey}`,
    'Content-Type': 'application/json'
  } : {};

  const dashboardDialog = document.getElementById('dashboardDialog');
  const ratingDialog = document.getElementById('ratingDialog');
  const dashboardContent = document.getElementById('dashboardContent');
  const dashboardStatus = document.getElementById('dashboardStatus');
  const dashboardSession = document.getElementById('dashboardSession');
  let dashboardTimer = null;
  let exampleMode = false;
  let pendingRatingSource = '';

  if (dashboardSession) dashboardSession.textContent = `${sessionLabel} · sessão ${sessionCode}`;

  async function postEvent(data) {
    if (!liveEnabled) return false;
    const payload = {
      session_code: sessionCode,
      event_type: clean(data.event_type, 80),
      profile: clean(data.profile, 80),
      resource: clean(data.resource, 120),
      location: clean(data.location, 80),
      priority: clean(data.priority, 30),
      rating: Number.isFinite(Number(data.rating)) ? Number(data.rating) : null,
      outcome: clean(data.outcome, 30)
    };
    try {
      const response = await fetch(apiBase, {
        method: 'POST',
        headers: { ...commonHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (_) {
      return false;
    }
  }

  function clean(value, max) {
    if (value === undefined || value === null || value === '') return null;
    return String(value).slice(0, max);
  }

  // Mantém o armazenamento local da versão anterior e envia apenas categorias anonimizadas ao painel.
  const originalSaveRequest = window.saveRequest;
  if (typeof originalSaveRequest === 'function') {
    window.saveRequest = function(data) {
      originalSaveRequest(data);
      const safe = {
        event_type: data.tipo || 'Solicitação',
        profile: data.perfil || localStorage.getItem('selectedProfile') || 'Não informado',
        resource: data.recurso || '',
        location: data.local || '',
        priority: data.prioridade || 'Normal'
      };
      postEvent(safe);
      pendingRatingSource = safe.event_type;
      setTimeout(() => {
        if (ratingDialog && !ratingDialog.open) ratingDialog.showModal();
      }, 900);
    };
  }

  // Sugestões colaborativas: registra somente a categoria, nunca o texto livre.
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form || form.id !== 'feedbackForm') return;
    const fd = new FormData(form);
    postEvent({
      event_type: 'Sugestão colaborativa',
      profile: localStorage.getItem('selectedProfile') || 'Não informado',
      resource: fd.get('tipo') || 'Sugestão',
      location: params.get('local') || 'Não informado',
      priority: 'Normal'
    });
  }, true);

  // Uso de recursos de acessibilidade: contabiliza a ativação sem identificar a pessoa.
  const resourceButtons = {
    fontUp: 'Ampliação de fonte',
    fontDown: 'Redução de fonte',
    contrastBtn: 'Alto contraste',
    simpleBtn: 'Modo simples',
    speakBtn: 'Leitura em voz alta',
    librasBtn: 'Conteúdo / atendimento em Libras'
  };
  Object.entries(resourceButtons).forEach(([id, label]) => {
    document.getElementById(id)?.addEventListener('click', () => {
      postEvent({
        event_type: 'Recurso de acessibilidade',
        profile: localStorage.getItem('selectedProfile') || 'Não informado',
        resource: label,
        location: params.get('local') || 'Não informado',
        priority: 'Normal'
      });
    });
  });

  document.getElementById('closeRating')?.addEventListener('click', () => ratingDialog.close());
  document.getElementById('ratingForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    await postEvent({
      event_type: 'Avaliação',
      profile: localStorage.getItem('selectedProfile') || 'Não informado',
      resource: pendingRatingSource || 'Experiência no aplicativo',
      rating: Number(fd.get('rating')),
      outcome: fd.get('outcome') || ''
    });
    ratingDialog.close();
    event.currentTarget.reset();
  });

  document.getElementById('dashboardBtn')?.addEventListener('click', () => {
    exampleMode = false;
    dashboardDialog.showModal();
    loadDashboard();
    clearInterval(dashboardTimer);
    dashboardTimer = setInterval(() => {
      if (dashboardDialog.open && !exampleMode) loadDashboard(false);
    }, 5000);
  });
  document.getElementById('closeDashboard')?.addEventListener('click', () => {
    clearInterval(dashboardTimer);
    dashboardDialog.close();
  });
  document.getElementById('refreshDashboard')?.addEventListener('click', () => {
    exampleMode = false;
    loadDashboard();
  });
  document.getElementById('showExampleData')?.addEventListener('click', () => {
    exampleMode = true;
    renderDashboard(exampleEvents(), 'Dados ilustrativos — contingência para a apresentação');
  });

  async function fetchEvents() {
    if (!liveEnabled) return null;
    const filter = `?session_code=eq.${encodeURIComponent(sessionCode)}&select=created_at,event_type,profile,resource,location,priority,rating,outcome&order=created_at.asc&limit=500`;
    const response = await fetch(apiBase + filter, { headers: commonHeaders, cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao consultar o painel');
    return response.json();
  }

  async function loadDashboard(showLoading = true) {
    if (showLoading) {
      dashboardStatus.textContent = liveEnabled ? 'Atualizando dados ao vivo…' : 'Banco compartilhado ainda não configurado';
      dashboardContent.innerHTML = '<p class="dashboard-loading">Carregando painel…</p>';
    }
    if (!liveEnabled) {
      renderDashboard([], 'Modo local — configure o Supabase para receber os celulares da turma');
      return;
    }
    try {
      const events = await fetchEvents();
      renderDashboard(events, '● Dados ao vivo da demonstração · atualização automática a cada 5 segundos');
    } catch (_) {
      renderDashboard([], 'Sem conexão com o banco. Use “Exibir exemplo” como plano B.');
    }
  }

  function renderDashboard(events, statusText) {
    dashboardStatus.textContent = statusText;
    const requests = events.filter(e => !['Avaliação', 'Recurso de acessibilidade'].includes(e.event_type));
    const evaluations = events.filter(e => e.event_type === 'Avaliação' && Number(e.rating));
    const accessibility = events.filter(e => e.event_type === 'Recurso de acessibilidade');
    const avg = evaluations.length ? evaluations.reduce((a, e) => a + Number(e.rating), 0) / evaluations.length : 0;
    const positive = evaluations.length ? Math.round(100 * evaluations.filter(e => Number(e.rating) >= 4).length / evaluations.length) : 0;
    const yes = evaluations.length ? Math.round(100 * evaluations.filter(e => e.outcome === 'Sim').length / evaluations.length) : 0;
    const urgent = requests.filter(e => e.priority === 'Imediata' || /priorit/i.test(e.event_type)).length;

    const typeCounts = countBy(requests, 'event_type');
    const profileCounts = countBy(requests, 'profile');
    const accessCounts = countBy(accessibility, 'resource');

    dashboardContent.innerHTML = `
      <section class="metric-grid" aria-label="Indicadores principais">
        ${metric('Interações registradas', requests.length)}
        ${metric('Pedidos prioritários', urgent)}
        ${metric('Avaliações recebidas', evaluations.length)}
        ${metric('Nota média', evaluations.length ? avg.toFixed(1) + '/5' : '—')}
        ${metric('Avaliações positivas', evaluations.length ? positive + '%' : '—')}
        ${metric('Conseguiu registrar', evaluations.length ? yes + '%' : '—')}
      </section>
      <section class="dashboard-section">
        <h3>Tipos de interação</h3>
        ${bars(typeCounts, requests.length)}
      </section>
      <section class="dashboard-split">
        <div class="dashboard-section"><h3>Perfis</h3>${bars(profileCounts, requests.length)}</div>
        <div class="dashboard-section"><h3>Recursos de acessibilidade ativados</h3>${bars(accessCounts, accessibility.length)}</div>
      </section>
      <section class="dashboard-section goals-box">
        <h3>Metas propostas no trabalho</h3>
        <div class="goal-grid">
          <div><strong>80%</strong><span>adesão dos colaboradores</span></div>
          <div><strong>até 48h</strong><span>primeira resposta</span></div>
          <div><strong>70%</strong><span>relatos resolvidos em até 60 dias</span></div>
          <div><strong>85%</strong><span>avaliações positivas</span></div>
          <div><strong>70%</strong><span>colaboradores capacitados</span></div>
        </div>
      </section>
      <section class="dashboard-section">
        <h3>Últimas interações</h3>
        ${recent(events)}
      </section>`;
  }

  function countBy(events, key) {
    return events.reduce((acc, event) => {
      const name = event[key] || 'Não informado';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
  }

  function bars(counts, total) {
    const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    if (!entries.length) return '<p class="empty-state">Ainda não há registros nesta categoria.</p>';
    return '<div class="bar-list">' + entries.map(([name, count]) => {
      const pct = total ? Math.max(4, Math.round(100 * count / total)) : 0;
      return `<div class="bar-item"><div><span>${escapeText(name)}</span><strong>${count}</strong></div><div class="bar-track"><span style="width:${pct}%"></span></div></div>`;
    }).join('') + '</div>';
  }

  function metric(label, value) {
    return `<article class="metric-card"><strong>${escapeText(value)}</strong><span>${escapeText(label)}</span></article>`;
  }

  function recent(events) {
    const rows = events.slice(-8).reverse();
    if (!rows.length) return '<p class="empty-state">A turma ainda não registrou interações.</p>';
    return '<div class="recent-list">' + rows.map(e => {
      const time = e.created_at ? new Date(e.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '—';
      const detail = e.event_type === 'Avaliação' ? `Nota ${e.rating || '—'}/5 · ${e.outcome || ''}` : (e.resource || e.location || '');
      return `<div><time>${escapeText(time)}</time><span><strong>${escapeText(e.event_type)}</strong><small>${escapeText(detail)}</small></span></div>`;
    }).join('') + '</div>';
  }

  function escapeText(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function exampleEvents() {
    const now = Date.now();
    const rows = [
      ['Apoio de comunicação','Usuário ou acompanhante','Libras','Recepção','Normal'],
      ['Atendimento adaptado','Usuário ou acompanhante','Ambiente com menos ruído','Ambulatório','Normal'],
      ['Relato de barreira','Colaborador ou profissional','Acesso físico','Exames','Normal'],
      ['Apoio de comunicação','Usuário ou acompanhante','Outro idioma: Espanhol','Pronto Atendimento','Normal'],
      ['Pedido prioritário de ajuda','Usuário ou acompanhante','Dificuldade para me comunicar','Internação','Imediata'],
      ['Sugestão colaborativa','Colaborador ou profissional','Sugestão para o aplicativo','Não informado','Normal'],
      ['Atendimento adaptado','Usuário ou acompanhante','Comunicação objetiva e direta','Recepção','Normal'],
      ['Relato de barreira','Usuário ou acompanhante','Tecnologia','Ambulatório','Normal'],
      ['Apoio de comunicação','Colaborador ou profissional','Comunicação por texto','Exames','Normal'],
      ['Atendimento adaptado','Usuário ou acompanhante','Mais tempo para responder','Pronto Atendimento','Normal'],
      ['Recurso de acessibilidade','Usuário ou acompanhante','Alto contraste','Não informado','Normal'],
      ['Recurso de acessibilidade','Usuário ou acompanhante','Leitura em voz alta','Não informado','Normal'],
      ['Recurso de acessibilidade','Colaborador ou profissional','Modo simples','Não informado','Normal'],
      ['Avaliação','Usuário ou acompanhante','Apoio de comunicação','','',5,'Sim'],
      ['Avaliação','Usuário ou acompanhante','Atendimento adaptado','','',4,'Sim'],
      ['Avaliação','Colaborador ou profissional','Relato de barreira','','',5,'Sim'],
      ['Avaliação','Usuário ou acompanhante','Apoio de comunicação','','',4,'Parcialmente'],
      ['Avaliação','Usuário ou acompanhante','Atendimento adaptado','','',5,'Sim']
    ];
    return rows.map((r, i) => ({
      created_at: new Date(now - (rows.length-i)*45000).toISOString(),
      event_type:r[0], profile:r[1], resource:r[2], location:r[3], priority:r[4], rating:r[5] || null, outcome:r[6] || null
    }));
  }
})();
