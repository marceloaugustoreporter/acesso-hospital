const panel = document.getElementById('panel');
const templates = {
  comunicar: document.getElementById('tpl-comunicar'),
  adaptado: document.getElementById('tpl-adaptado'),
  feedback: document.getElementById('tpl-feedback'),
  barreira: document.getElementById('tpl-barreira'),
  informacoes: document.getElementById('tpl-informacoes'),
  acompanhar: document.getElementById('tpl-acompanhar')
};

let fontScale = Number(localStorage.getItem('fontScale') || '1');
let contrast = localStorage.getItem('highContrast') === 'true';
let simpleMode = localStorage.getItem('simpleMode') === 'true';
let selectedProfile = localStorage.getItem('selectedProfile') || 'Usuário ou acompanhante';
let gpsLocation = null;
const sectorMap = {
  'recepcao': 'Recepção',
  'recepcao-principal': 'Recepção',
  'pronto-atendimento': 'Pronto Atendimento',
  'pa': 'Pronto Atendimento',
  'internacao': 'Internação',
  'ambulatorio': 'Ambulatório',
  'exames': 'Exames'
};
const params = new URLSearchParams(window.location.search);
const sectorSlug = (params.get('local') || '').toLowerCase().trim();
const sectorFromQr = sectorMap[sectorSlug] || '';
applyPreferences();
renderLocationContext();


function applyPreferences() {
  document.documentElement.style.setProperty('--font-scale', fontScale.toFixed(2));
  document.body.classList.toggle('high-contrast', contrast);
  document.body.classList.toggle('simple-mode', simpleMode);
  document.getElementById('contrastBtn').setAttribute('aria-pressed', String(contrast));
  document.getElementById('simpleBtn').setAttribute('aria-pressed', String(simpleMode));
  document.querySelectorAll('.profile-btn').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.profile === selectedProfile));
  });
}

function renderLocationContext() {
  const box = document.getElementById('locationContext');
  if (!box || !sectorFromQr) return;
  box.hidden = false;
  box.innerHTML = `<strong>📍 Local identificado pelo QR Code:</strong> ${escapeHtml(sectorFromQr)}. Você pode alterar o local no formulário, se necessário.`;
}

function prefillLocationFields() {
  if (!sectorFromQr) return;
  ['local', 'localAdaptado', 'urgentLocal'].forEach(id => {
    const field = document.getElementById(id);
    if (!field) return;
    const option = [...field.options].find(o => o.text === sectorFromQr || o.value === sectorFromQr);
    if (option) field.value = option.value || option.text;
  });
  const barrier = document.getElementById('localBarreira');
  if (barrier && !barrier.value) barrier.value = sectorFromQr;
}

function openPanel(view) {
  const tpl = templates[view];
  if (!tpl) return;
  panel.replaceChildren(tpl.content.cloneNode(true));
  panel.hidden = false;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  panel.querySelector('h2')?.focus?.();
  wirePanel(view);
  prefillLocationFields();
}

function closePanel() {
  panel.hidden = true;
  panel.replaceChildren();
}

function nextProtocol() {
  const key = 'protocolCounter';
  const n = Number(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, String(n));
  return `AH-2026-${String(n).padStart(4, '0')}`;
}

function routeSector(tipo, recurso = '') {
  const text = (tipo + ' ' + recurso).toLowerCase();
  if (text.includes('acesso físico') || text.includes('barreira física')) return 'Engenharia Predial';
  if (text.includes('tecnologia')) return 'Tecnologia da Informação';
  if (text.includes('libras')) return 'Rede de apoio em Libras / Atendimento';
  if (text.includes('idioma')) return 'Rede de apoio linguístico / Atendimento';
  if (text.includes('adaptado') || text.includes('ruído') || text.includes('luminos') || text.includes('sensorial')) return 'Equipe assistencial / Acolhimento';
  if (text.includes('informação') || text.includes('comunicação')) return 'Comunicação / Atendimento';
  return 'Núcleo de Acessibilidade / setor responsável';
}

function saveRequest(data) {
  const requests = JSON.parse(localStorage.getItem('requests') || '[]');
  requests.push(data);
  localStorage.setItem('requests', JSON.stringify(requests));
}

function wirePanel(view) {
  panel.querySelector('.close-panel')?.addEventListener('click', closePanel);

  if (view === 'comunicar') {
    document.getElementById('communicationForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const recurso = fd.get('recurso');
      const idioma = fd.get('idioma') || '';
      if (recurso === 'Outro idioma' && !idioma) {
        alert('Informe o idioma necessário.');
        return;
      }
      const protocolo = nextProtocol();
      const item = {
        protocolo,
        tipo: 'Apoio de comunicação',
        recurso: recurso === 'Outro idioma' ? 'Outro idioma: ' + idioma : recurso,
        local: fd.get('local'),
        perfil: selectedProfile,
        setor: routeSector('Apoio de comunicação', recurso),
        observacao: fd.get('observacao') || '',
        status: 'Profissional/setor responsável acionado',
        criadoEm: new Date().toLocaleString('pt-BR')
      };
      saveRequest(item);
      panel.innerHTML = successMarkup(item, 'Solicitação realizada');
      panel.querySelector('.close-panel')?.addEventListener('click', closePanel);
    });
  }

  if (view === 'adaptado') {
    document.getElementById('adaptedForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const necessidades = fd.getAll('necessidade');
      if (!necessidades.length) {
        alert('Selecione ao menos uma necessidade.');
        return;
      }
      const protocolo = nextProtocol();
      const item = {
        protocolo,
        tipo: 'Atendimento adaptado',
        recurso: necessidades.join(', '),
        local: fd.get('local'),
        perfil: selectedProfile,
        setor: routeSector('Atendimento adaptado', necessidades.join(' ')),
        observacao: fd.get('observacao') || '',
        status: 'Necessidade registrada e equipe responsável acionada',
        criadoEm: new Date().toLocaleString('pt-BR')
      };
      saveRequest(item);
      panel.innerHTML = successMarkup(item, 'Necessidade registrada');
      panel.querySelector('.close-panel')?.addEventListener('click', closePanel);
    });
  }

  if (view === 'barreira') {
    document.getElementById('voiceDemo').addEventListener('click', () => {
      alert('No protótipo, este botão representa o envio de um relato por áudio.');
    });
    document.getElementById('barrierForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const protocolo = nextProtocol();
      const item = {
        protocolo,
        tipo: 'Relato de barreira',
        recurso: fd.get('tipo'),
        local: fd.get('local'),
        perfil: selectedProfile,
        setor: routeSector('Relato de barreira', fd.get('tipo')),
        observacao: fd.get('relato'),
        status: 'Encaminhada ao setor responsável para avaliação',
        criadoEm: new Date().toLocaleString('pt-BR')
      };
      saveRequest(item);
      panel.innerHTML = successMarkup(item, 'Relato enviado');
      panel.querySelector('.close-panel')?.addEventListener('click', closePanel);
    });
  }

  if (view === 'feedback') {
    document.getElementById('feedbackForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const key = 'feedbackCounter';
      const n = Number(localStorage.getItem(key) || '0') + 1;
      localStorage.setItem(key, String(n));
      const protocolo = `FB-2026-${String(n).padStart(4, '0')}`;
      const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      feedbacks.push({
        protocolo,
        tipo: fd.get('tipo'),
        relato: fd.get('relato'),
        perfil: selectedProfile,
        local: sectorFromQr || 'Não informado',
        criadoEm: new Date().toLocaleString('pt-BR')
      });
      localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
      panel.innerHTML = `<div class="panel-header"><div><p class="eyebrow">Obrigado</p><h2>Contribuição registrada</h2></div><button class="close-panel" type="button">Fechar</button></div>
        <div class="status-card"><h3>${protocolo}</h3><p>Sua sugestão foi registrada neste protótipo. Em uma implantação real, ela seria encaminhada à equipe responsável pela melhoria do serviço.</p></div>`;
      panel.querySelector('.close-panel')?.addEventListener('click', closePanel);
    });
  }

  if (view === 'acompanhar') {
    document.getElementById('trackingForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const protocol = new FormData(e.currentTarget).get('protocolo').trim().toUpperCase();
      const requests = JSON.parse(localStorage.getItem('requests') || '[]');
      const item = requests.find(x => x.protocolo === protocol);
      const result = document.getElementById('trackingResult');
      result.innerHTML = item
        ? `<div class="status-card"><h3>${item.protocolo}</h3><p><strong>Solicitação:</strong> ${escapeHtml(item.tipo)}</p><p><strong>Necessidade:</strong> ${escapeHtml(item.recurso)}</p><p><strong>Local:</strong> ${escapeHtml(item.local)}</p><p><strong>Setor responsável:</strong> ${escapeHtml(item.setor || 'Setor responsável')}</p><p><strong>Status:</strong> 🟡 ${escapeHtml(item.status)}</p></div>`
        : `<div class="status-card"><h3>Protocolo não localizado</h3><p>Confira o número informado. Para demonstração, crie primeiro uma solicitação neste dispositivo.</p></div>`;
    });
  }
}

function successMarkup(item, title) {
  return `<div class="panel-header"><div><p class="eyebrow">Concluído</p><h2>${title}</h2></div><button class="close-panel" type="button">Fechar</button></div>
    <div class="status-card">
      <h3>${item.protocolo}</h3>
      <p>Sua solicitação foi registrada.</p>
      <p><strong>Local:</strong> ${escapeHtml(item.local)}</p>
      <p><strong>Setor responsável:</strong> ${escapeHtml(item.setor || 'Setor responsável')}</p>
      <p><strong>Status:</strong> 🟡 ${escapeHtml(item.status)}</p>
      <p>Guarde este protocolo para acompanhar a solicitação.</p>
    </div>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => openPanel(btn.dataset.view));
});

document.querySelectorAll('[data-quick]').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.quick;
    if (val === 'Barreira física') {
      openPanel('barreira');
      setTimeout(() => { const s = document.getElementById('tipoBarreira'); if (s) s.value = 'Acesso físico'; }, 0);
    } else if (val === 'Baixa visão') {
      openPanel('informacoes');
    } else if (val === 'Leitura simples') {
      simpleMode = true;
      localStorage.setItem('simpleMode', 'true');
      applyPreferences();
      document.getElementById('conteudo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (val === 'Atendimento adaptado' || val === 'Outra necessidade') {
      openPanel('adaptado');
    } else {
      openPanel('comunicar');
      setTimeout(() => {
        const radio = [...document.querySelectorAll('input[name="recurso"]')].find(r => r.value === val);
        if (radio) radio.checked = true;
      }, 0);
    }
  });
});

document.getElementById('fontUp').addEventListener('click', () => {
  fontScale = Math.min(1.35, fontScale + 0.1);
  localStorage.setItem('fontScale', String(fontScale));
  applyPreferences();
});

document.getElementById('fontDown').addEventListener('click', () => {
  fontScale = Math.max(.9, fontScale - 0.1);
  localStorage.setItem('fontScale', String(fontScale));
  applyPreferences();
});

document.getElementById('contrastBtn').addEventListener('click', () => {
  contrast = !contrast;
  localStorage.setItem('highContrast', String(contrast));
  applyPreferences();
});

document.getElementById('simpleBtn').addEventListener('click', () => {
  simpleMode = !simpleMode;
  localStorage.setItem('simpleMode', String(simpleMode));
  applyPreferences();
});

document.querySelectorAll('.profile-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedProfile = btn.dataset.profile;
    localStorage.setItem('selectedProfile', selectedProfile);
    applyPreferences();
  });
});

document.getElementById('speakBtn').addEventListener('click', () => {
  if (!('speechSynthesis' in window)) {
    alert('Leitura em voz alta não está disponível neste navegador.');
    return;
  }
  speechSynthesis.cancel();
  const text = document.getElementById('conteudo').innerText.slice(0, 4500);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  speechSynthesis.speak(utterance);
});

const librasDialog = document.getElementById('librasDialog');
document.getElementById('librasBtn').addEventListener('click', () => librasDialog.showModal());
document.getElementById('closeLibras').addEventListener('click', () => librasDialog.close());
document.getElementById('requestInterpreter').addEventListener('click', () => {
  librasDialog.close();
  openPanel('comunicar');
  setTimeout(() => {
    const radio = [...document.querySelectorAll('input[name="recurso"]')].find(r => r.value === 'Libras');
    if (radio) radio.checked = true;
  }, 0);
});

const welcomeDialog = document.getElementById('welcomeDialog');
const privacyDialog = document.getElementById('privacyDialog');
const urgentDialog = document.getElementById('urgentDialog');
const canonicalUrl = window.location.origin + window.location.pathname;

function openWelcome() {
  welcomeDialog.showModal();
}

document.getElementById('aboutBtn').addEventListener('click', openWelcome);
document.getElementById('closeWelcome').addEventListener('click', () => welcomeDialog.close());
document.getElementById('privacyBtn')?.addEventListener('click', () => privacyDialog?.showModal());
document.getElementById('closePrivacy')?.addEventListener('click', () => privacyDialog?.close());
document.getElementById('startAppBtn').addEventListener('click', () => {
  localStorage.setItem('onboardingSeen', 'true');
  welcomeDialog.close();
});

if (localStorage.getItem('onboardingSeen') !== 'true') {
  window.addEventListener('load', () => setTimeout(openWelcome, 250), { once: true });
}

document.getElementById('shareBtn').addEventListener('click', async () => {
  const data = {
    title: 'Acesso+ Hospital',
    text: 'Conheça o Acesso+ Hospital, protótipo de comunicação inclusiva e acessibilidade.',
    url: canonicalUrl
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(canonicalUrl);
      alert('Link copiado. Agora você pode compartilhá-lo.');
    } else {
      prompt('Copie o link para compartilhar:', canonicalUrl);
    }
  } catch (err) {
    if (err && err.name !== 'AbortError') alert('Não foi possível compartilhar neste navegador.');
  }
});

document.getElementById('urgentHelpBtn').addEventListener('click', () => {
  gpsLocation = null;
  document.getElementById('geoStatus').textContent = 'Dentro de prédios, a localização pode ser imprecisa. O QR Code do setor é a referência preferencial.';
  urgentDialog.showModal();
  prefillLocationFields();
});
document.getElementById('closeUrgent').addEventListener('click', () => urgentDialog.close());

document.getElementById('geoBtn').addEventListener('click', () => {
  const status = document.getElementById('geoStatus');
  if (!navigator.geolocation) {
    status.textContent = 'Este navegador não oferece geolocalização.';
    return;
  }
  status.textContent = 'Solicitando sua permissão de localização…';
  navigator.geolocation.getCurrentPosition(
    pos => {
      gpsLocation = {
        lat: Number(pos.coords.latitude.toFixed(5)),
        lon: Number(pos.coords.longitude.toFixed(5)),
        accuracy: Math.round(pos.coords.accuracy)
      };
      status.textContent = `Localização aproximada registrada (precisão informada pelo dispositivo: ±${gpsLocation.accuracy} m).`;
    },
    () => { status.textContent = 'Localização não autorizada ou indisponível. Você pode continuar sem ela.'; },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
  );
});

document.getElementById('urgentForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const protocolo = nextProtocol();
  const item = {
    protocolo,
    tipo: 'Pedido prioritário de ajuda',
    recurso: fd.get('tipo'),
    local: fd.get('local'),
    perfil: selectedProfile,
    setor: 'Atendimento / Acolhimento',
    prioridade: 'Imediata',
    gps: gpsLocation,
    observacao: fd.get('observacao') || '',
    status: 'Solicitação prioritária registrada no protótipo',
    criadoEm: new Date().toLocaleString('pt-BR')
  };
  saveRequest(item);
  urgentDialog.close();
  panel.hidden = false;
  panel.innerHTML = `<div class="panel-header"><div><p class="eyebrow danger-eyebrow">Prioridade imediata</p><h2>Pedido registrado</h2></div><button class="close-panel" type="button">Fechar</button></div>
    <div class="status-card urgent-status"><h3>${item.protocolo}</h3><p><strong>Local:</strong> ${escapeHtml(item.local)}</p><p><strong>Prioridade:</strong> 🔴 Imediata</p><p><strong>Setor demonstrativo:</strong> ${escapeHtml(item.setor)}</p><p><strong>Atenção:</strong> este protótipo não envia a solicitação para uma equipe real.</p></div>`;
  panel.querySelector('.close-panel')?.addEventListener('click', closePanel);
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(registration => registration.update());
  });
}
