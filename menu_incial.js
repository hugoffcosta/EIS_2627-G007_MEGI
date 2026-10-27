const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-navigation');
const dialog = document.querySelector('#section-dialog');
let language = 'en';
let currentSection = null;
const titles = {
  about: { en: 'About us', pt: 'Sobre nós' },
  sustainability: { en: 'Sustainability', pt: 'Sustentabilidade' },
  simulator: { en: 'Simulator', pt: 'Simulador' },
  contact: { en: 'Contact us', pt: 'Contactos' },
  faq: { en: 'FAQs', pt: 'Perguntas frequentes' },
  account: { en: 'Login / Register', pt: 'Entrar / Registar' }
};
function updateDialog() {
  if (!currentSection) return;
  document.querySelector('#dialog-title').textContent = titles[currentSection][language];
  document.querySelector('#dialog-description').textContent = language === 'pt'
    ? 'O acesso de clientes requer a implementação do registo e autenticação. Nesta versão podes simular um intervalo de preços e contactar a equipa para obter uma proposta exata.'
    : 'Customer access requires registration and authentication to be implemented. In this version, you can simulate a price range and contact our team for an exact quote.';
}
function setLanguage(value) {
  language = value;
  document.documentElement.lang = value;
  document.querySelectorAll('[data-en][data-pt]').forEach(element => {
    element.textContent = element.dataset[value];
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === value));
  });
  document.querySelectorAll('[data-alt-en][data-alt-pt]').forEach(image => { image.alt = image.dataset[value === 'pt' ? 'altPt' : 'altEn']; });
  navigation.setAttribute('aria-label', value === 'pt' ? 'Navegação principal' : 'Main navigation');
  document.querySelector('video').setAttribute('aria-label', value === 'pt' ? 'Vídeo de apresentação TrustPort' : 'TrustPort presentation video');
  updateDialog();
  renderQuote();
  renderDistanceStatus();
  renderLocationStatuses();
  renderHomepageMetrics();
  document.querySelector('#contact-status').textContent = '';
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
document.querySelectorAll('[data-language]').forEach(button => {
  button.addEventListener('click', () => setLanguage(button.dataset.language));
});
document.querySelectorAll('[data-section]').forEach(button => {
  button.addEventListener('click', () => {
    currentSection = button.dataset.section;
    updateDialog();
    dialog.showModal();
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});
document.querySelectorAll('.dialog-close, .dialog-back').forEach(button => {
  button.addEventListener('click', () => dialog.close());
});
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
document.querySelector('#year').textContent = new Date().getFullYear();

// Demonstration tariffs: replace with the approved commercial rates.
const demoRates = Object.freeze({ base: 5, perKm: 0.65, perKg: 0.20, perM3: 8, express: 1.30, low: 0.90, high: 1.15 });
let lastQuote = null;
const quoteForm = document.querySelector('#quote-form');
// Public Photon geocoding and OSRM road routing (OpenStreetMap data).
// These public services are suitable for this prototype; production needs a hosted service/SLA.
const originInput = document.querySelector('#origin');
const destinationInput = document.querySelector('#destination');
const distanceInput = document.querySelector('#distance');
const distanceStatus = document.querySelector('#distance-status');
const retryDistance = document.querySelector('#retry-distance');
const quoteButton = quoteForm.querySelector('[type="submit"]');
const locationCache = new Map();
let distanceState = 'idle';
let resolvedRoute = '';
let distanceTimer;
let distanceController;
let distanceVersion = 0;
const distanceMessages = {
  idle: { pt: 'Seleciona a origem e o destino nas sugestões para calcular os km por estrada.', en: 'Select an origin and destination from the suggestions to calculate road distance.' },
  loading: { pt: 'A calcular a distância por estrada…', en: 'Calculating road distance…' },
  success: { pt: 'Distância estimada por estrada: ', en: 'Estimated road distance: ' },
  error: { pt: 'Não foi possível calcular a rota. Confirma as localidades ou indica uma morada mais completa em Portugal e tenta novamente.', en: 'Could not calculate the route. Check the locations or enter a fuller address in Portugal and try again.' }
};
function renderDistanceStatus() {
  distanceStatus.textContent = distanceMessages[distanceState][language] + (distanceState === 'success' ? resolvedRoute : '');
  retryDistance.hidden = distanceState !== 'error';
  quoteButton.disabled = distanceState !== 'success';
  distanceInput.setAttribute('aria-busy', String(distanceState === 'loading'));
}
async function fetchRouteJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Routing service unavailable');
  return response.json();
}
const locationMessages = {
  idle: { pt: 'Escreve pelo menos 3 caracteres e seleciona um local.', en: 'Type at least 3 characters and select a location.' },
  loading: { pt: 'A procurar locais…', en: 'Searching locations…' },
  empty: { pt: 'Não encontrámos esse local. Indica uma localidade ou morada mais completa.', en: 'We could not find that location. Enter a locality or a more complete address.' },
  error: { pt: 'Não foi possível pesquisar locais. Altera o texto para tentar novamente.', en: 'Could not search locations. Edit the text to try again.' },
  selected: { pt: 'Local confirmado.', en: 'Location confirmed.' },
  results: { pt: 'Seleciona um local. Usa as setas e Enter ou clica numa sugestão.', en: 'Select a location. Use the arrow keys and Enter or click a suggestion.' }
};
const locationPickers = [originInput, destinationInput].map(input => {
  const list = document.querySelector(`#${input.id}-suggestions`);
  const status = document.querySelector(`#${input.id}-status`);
  const picker = { input, list, status, selected: null, results: [], active: -1, state: 'idle', version: 0, controller: null, timer: null };
  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    picker.active = -1;
  }
  function activate(index) {
    picker.active = index;
    Array.from(list.children).forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    if (index >= 0) {
      input.setAttribute('aria-activedescendant', list.children[index].id);
      list.children[index].scrollIntoView({ block: 'nearest' });
    }
  }
  function select(index) {
    if (!picker.results[index]) return;
    clearTimeout(picker.timer);
    picker.controller?.abort();
    ++picker.version;
    picker.selected = picker.results[index];
    input.value = picker.selected.label;
    picker.state = 'selected';
    close();
    renderLocationStatuses();
    scheduleDistance();
  }
  function show() {
    if (!picker.results.length || picker.selected) return;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  async function search(version, query) {
    const controller = new AbortController();
    picker.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const key = query.toLocaleLowerCase('pt-PT');
      let results = locationCache.get(key);
      if (!results) {
        const params = new URLSearchParams({ q: query + ', Portugal', limit: '10', lang: 'en' });
        const data = await fetchRouteJson(`https://photon.komoot.io/api/?${params}`, controller.signal);
        const seen = new Set();
        results = (data.features || []).filter(item => item.properties?.countrycode?.toUpperCase() === 'PT' && item.geometry?.type === 'Point' && item.geometry.coordinates?.length === 2 && item.geometry.coordinates.every(Number.isFinite)).map(item => {
          const p = item.properties;
          return { coordinates: item.geometry.coordinates.join(','), label: [...new Set([p.name, [p.street, p.housenumber].filter(Boolean).join(' '), p.postcode, p.city || p.town || p.village, p.state].filter(Boolean))].join(', ') };
        }).filter(place => {
          const key = place.label + place.coordinates;
          if (!place.label || seen.has(key)) return false;
          seen.add(key); return true;
        }).slice(0, 5);
        locationCache.set(key, results);
      }
      if (version !== picker.version) return;
      picker.results = results;
      list.replaceChildren();
      results.forEach((place, index) => {
        const option = document.createElement('span');
        option.id = `${input.id}-option-${index}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.textContent = place.label;
        option.addEventListener('mousedown', event => event.preventDefault());
        option.addEventListener('click', () => select(index));
        list.append(option);
      });
      picker.state = results.length ? 'results' : 'empty';
      if (document.activeElement === input) show();
    } catch (error) {
      if (version !== picker.version) return;
      picker.state = 'error';
      close();
    } finally {
      clearTimeout(timeout);
      if (version === picker.version) renderLocationStatuses();
    }
  }
  input.addEventListener('input', () => {
    clearTimeout(picker.timer);
    picker.controller?.abort();
    const version = ++picker.version;
    picker.selected = null;
    picker.results = [];
    close();
    scheduleDistance();
    const query = input.value.trim();
    picker.state = query.length >= 3 ? 'loading' : 'idle';
    renderLocationStatuses();
    if (query.length >= 3) picker.timer = setTimeout(() => search(version, query), 400);
  });
  input.addEventListener('focus', show);
  input.addEventListener('blur', close);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!picker.results.length || picker.selected) return;
      event.preventDefault(); show();
      activate((picker.active + (event.key === 'ArrowDown' ? 1 : picker.active < 0 ? 0 : -1) + picker.results.length) % picker.results.length);
    } else if (event.key === 'Enter' && !list.hidden) {
      event.preventDefault();
      if (picker.active >= 0) select(picker.active);
    }
  });
  return picker;
});
function renderLocationStatuses() {
  locationPickers.forEach(picker => { picker.status.textContent = locationMessages[picker.state][language]; });
}
async function calculateDistance(version) {
  const controller = new AbortController();
  distanceController = controller;
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const [origin, destination] = locationPickers.map(picker => picker.selected);
    if (!origin || !destination) return;
    const data = await fetchRouteJson(`https://router.project-osrm.org/route/v1/driving/${origin.coordinates};${destination.coordinates}?overview=false&steps=false&radiuses=5000;5000`, controller.signal);
    const metres = data.routes?.[0]?.distance;
    if (data.code !== 'Ok' || !Number.isFinite(metres) || metres <= 0 || metres > 10000000) throw new Error('No road route');
    if (version !== distanceVersion) return;
    distanceInput.value = Math.max(0.1, Math.round(metres / 100) / 10);
    resolvedRoute = `${origin.label} → ${destination.label} · ${distanceInput.value} km`;
    distanceState = 'success';
  } catch (error) {
    if (version !== distanceVersion) return;
    controller.abort();
    distanceState = 'error';
    distanceInput.value = '';
  } finally {
    clearTimeout(timeout);
    if (version === distanceVersion) renderDistanceStatus();
  }
}
function scheduleDistance() {
  clearTimeout(distanceTimer);
  distanceController?.abort();
  const version = ++distanceVersion;
  distanceInput.value = '';
  lastQuote = null;
  document.querySelector('#quote-result').textContent = '—';
  document.querySelector('#quote-detail').textContent = '';
  distanceState = locationPickers.every(picker => picker.selected && picker.input.value === picker.selected.label) ? 'loading' : 'idle';
  renderDistanceStatus();
  if (distanceState === 'loading') distanceTimer = setTimeout(() => calculateDistance(version), 900);
}

retryDistance.addEventListener('click', scheduleDistance);
window.addEventListener('pageshow', scheduleDistance);
function renderQuote() {
  if (!lastQuote) return;
  const money = value => new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(value);
  document.querySelector('#quote-result').textContent = `${money(lastQuote.total * demoRates.low)} – ${money(lastQuote.total * demoRates.high)}`;
  document.querySelector('#quote-detail').textContent = `${lastQuote.origin} → ${lastQuote.destination} · ${lastQuote.distance} km`;
}
quoteForm.addEventListener('submit', event => {
  event.preventDefault();
  if (distanceState !== 'success' || !locationPickers.every(picker => picker.selected && picker.input.value === picker.selected.label) || !distanceInput.value || !quoteForm.reportValidity()) return;
  const data = new FormData(quoteForm);
  const distance = Number(data.get('distance'));
  const weight = Number(data.get('weight'));
  const volume = Number(data.get('volume'));
  if (![distance, weight, volume].every(Number.isFinite)) return;
  const origin = data.get('origin').trim();
  const destination = data.get('destination').trim();
  if (!origin || !destination) {
    document.querySelector('#quote-result').textContent = language === 'pt' ? 'Indica a origem e o destino.' : 'Enter an origin and destination.';
    return;
  }
  lastQuote = { origin, destination, distance, total: (demoRates.base + distance * demoRates.perKm + weight * demoRates.perKg + volume * demoRates.perM3) * (data.get('urgency') === 'express' ? demoRates.express : 1) };
  renderQuote();
});
quoteForm.addEventListener('input', () => {
  lastQuote = null;
  document.querySelector('#quote-result').textContent = '—';
  document.querySelector('#quote-detail').textContent = '';
});
const contactForm = document.querySelector('#contact-form');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const name = data.get('name').trim();
  const question = data.get('question').trim();
  if (!name || question.length < 10) {
    document.querySelector('#contact-status').textContent = language === 'pt' ? 'Indica o nome e uma questão com pelo menos 10 caracteres.' : 'Enter your name and a question of at least 10 characters.';
    return;
  }
  const body = `${name}\n${data.get('email')}\n\n${question}`;
  document.querySelector('#message-preview').value = body;
  document.querySelector('#message-preview-label').hidden = false;
  document.querySelector('#contact-status').textContent = language === 'pt' ? 'Mensagem preparada. Conclui o envio no teu programa de email ou copia o texto abaixo.' : 'Message prepared. Complete sending in your email application or copy the text below.';
  window.location.href = `mailto:info@trustport.com?subject=${encodeURIComponent('TrustPort — Contact')}&body=${encodeURIComponent(body)}`;
});
setLanguage('en');

navigation.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

// Both homepage and admin derive their figures from the same sample records.
function renderHomepageMetrics() {
  if (!window.TrustPortData || !window.TrustPortMetrics) return;
  const metrics = window.TrustPortMetrics.getHomepageMetrics(window.TrustPortData);
  const reference = document.querySelector('#metrics-reference');
  reference.dateTime = window.TrustPortData.meta.referenceDate;
  reference.textContent = new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Lisbon' }).format(new Date(reference.dateTime));
  const formatter = new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-GB');
  document.querySelectorAll('[data-metric]').forEach(element => {
    element.textContent = formatter.format(metrics[element.dataset.metric]);
  });
}
window.addEventListener('trustport:data-updated', renderHomepageMetrics);
