(() => {
    'use strict';

    const form = document.getElementById('courier-login-form');
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    const toggle = document.getElementById('toggle-login-password');
    const emailError = document.getElementById('login-email-error');
    form.noValidate = true;
    const passwordError = document.createElement('p');
    passwordError.id = 'login-password-error';
    passwordError.className = 'field-error';
    passwordError.setAttribute('aria-live', 'polite');
    password.closest('.form-group').append(passwordError);
    password.setAttribute('aria-describedby', [password.getAttribute('aria-describedby'), passwordError.id].filter(Boolean).join(' '));

    email.addEventListener('input', () => {
        emailError.textContent = '';
        email.removeAttribute('aria-invalid');
    });

    toggle.addEventListener('click', () => {
        const visible = password.type === 'password';
        password.type = visible ? 'text' : 'password';
        toggle.setAttribute('aria-pressed', String(visible));
        toggle.setAttribute('aria-label', visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe');
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        const invalid = !email.value.trim() || email.validity.typeMismatch;
        emailError.textContent = invalid ? 'E-mail inválido' : '';
        email.setAttribute('aria-invalid', String(invalid));
        if (invalid) {
            email.focus();
            return;
        }
        // Demo navigation only; authentication will be integrated in a later sprint.
        if (!password.value) {
            passwordError.textContent = 'Este campo \u00e9 obrigat\u00f3rio.';
            password.setAttribute('aria-invalid', 'true');
            password.focus();
            return;
        }
        window.location.href = 'Menu_courierHTML.html';
    });
    password.addEventListener('input', () => {
        passwordError.textContent = '';
        password.removeAttribute('aria-invalid');
    });
})();
