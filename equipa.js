const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-navigation');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});

navigation.addEventListener('click', event => {
  if (!event.target.closest('a')) return;
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
});

document.querySelectorAll('[data-language]').forEach(button => {
  button.addEventListener('click', () => {
    const language = button.dataset.language;
    document.documentElement.lang = language;
    document.querySelectorAll('[data-en][data-pt]').forEach(element => {
      element.textContent = element.dataset[language];
    });
    document.querySelectorAll('[data-language]').forEach(languageButton => {
      languageButton.setAttribute('aria-pressed', String(languageButton === button));
    });
    navigation.setAttribute('aria-label', language === 'pt' ? 'Navegação principal' : 'Main navigation');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();
