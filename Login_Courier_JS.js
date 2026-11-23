(() => {
    'use strict';

    const form = document.getElementById('courier-login-form');
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    const toggle = document.getElementById('toggle-login-password');
    const emailError = document.getElementById('login-email-error');
    const passwordError = document.getElementById('login-password-error');

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

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const invalid = !email.value.trim() || email.validity.typeMismatch;
        emailError.textContent = invalid ? 'E-mail inválido' : '';
        email.setAttribute('aria-invalid', String(invalid));
        if (invalid) {
            email.focus();
            return;
        }
        if (!password.value) {
            passwordError.textContent = 'Este campo \u00e9 obrigat\u00f3rio.';
            password.setAttribute('aria-invalid', 'true');
            password.focus();
            return;
        }
        try {
            const response = await fetch('backend/api/auth.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'courier', email: email.value.trim(), password: password.value })
            });
            const data = await response.json();
            if (!response.ok || !data.ok) {
                passwordError.textContent = data.error || 'Login failed.';
                password.value = '';
                password.focus();
                return;
            }
            window.location.href = 'Menu_courierHTML.html';
        } catch (error) {
            passwordError.textContent = 'Could not reach the server. Check that Apache and MySQL are running in XAMPP.';
        }    });
    password.addEventListener('input', () => {
        passwordError.textContent = '';
        password.removeAttribute('aria-invalid');
    });
})();
