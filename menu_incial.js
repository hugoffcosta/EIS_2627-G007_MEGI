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
  document.querySelectorAll('[data-aria-en][data-aria-pt]').forEach(element => {
    element.setAttribute('aria-label', element.dataset[value === 'pt' ? 'ariaPt' : 'ariaEn']);
  });
  navigation.setAttribute('aria-label', value === 'pt' ? 'Navegação principal' : 'Main navigation');
  document.querySelector('video').setAttribute('aria-label', value === 'pt' ? 'Vídeo de apresentação TrustPort' : 'TrustPort presentation video');
  updateDialog();
  renderQuote();
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
function renderQuote() {
  if (!lastQuote) return;
  const money = value => new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(value);
  document.querySelector('#quote-result').textContent = `${money(lastQuote.total * demoRates.low)} – ${money(lastQuote.total * demoRates.high)}`;
  document.querySelector('#quote-detail').textContent = `${lastQuote.origin} → ${lastQuote.destination} · ${lastQuote.distance} km`;
}
quoteForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!quoteForm.reportValidity()) return;
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
