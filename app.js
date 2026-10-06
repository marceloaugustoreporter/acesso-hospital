const panel = document.getElementById('panel');
const templates = {
  comunicar: document.getElementById('tpl-comunicar'),
  barreira: document.getElementById('tpl-barreira'),
  informacoes: document.getElementById('tpl-informacoes'),
  acompanhar: document.getElementById('tpl-acompanhar')
};

let fontScale = Number(localStorage.getItem('fontScale') || '1');
let contrast = localStorage.getItem('highContrast') === 'true';
applyPreferences();

function applyPreferences() {
  document.documentElement.style.setProperty('--font-scale', fontScale.toFixed(2));
  document.body.classList.toggle('high-contrast', contrast);
  document.getElementById('contrastBtn').setAttribute('aria-pressed', String(contrast));
}

function openPanel(view) {
  const tpl = templates[view];
  if (!tpl) return;
  panel.replaceChildren(tpl.content.cloneNode(true));
  panel.hidden = false;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  panel.querySelector('h2')?.focus?.();
  wirePanel(view);
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
      const protocolo = nextProtocol();
      const item = {
        protocolo,
        tipo: 'Apoio de comunicação',
        recurso: fd.get('recurso'),
        local: fd.get('local'),
        observacao: fd.get('observacao') || '',
        status: 'Profissional/setor responsável acionado',
        criadoEm: new Date().toLocaleString('pt-BR')
      };
      saveRequest(item);
      panel.innerHTML = successMarkup(item, 'Solicitação realizada');
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
        observacao: fd.get('relato'),
        status: 'Encaminhada ao setor responsável para avaliação',
        criadoEm: new Date().toLocaleString('pt-BR')
      };
      saveRequest(item);
      panel.innerHTML = successMarkup(item, 'Relato enviado');
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
        ? `<div class="status-card"><h3>${item.protocolo}</h3><p><strong>Solicitação:</strong> ${escapeHtml(item.tipo)}</p><p><strong>Necessidade:</strong> ${escapeHtml(item.recurso)}</p><p><strong>Local:</strong> ${escapeHtml(item.local)}</p><p><strong>Status:</strong> 🟡 ${escapeHtml(item.status)}</p></div>`
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
