(() => {
    'use strict';
    const form=document.getElementById('administrative-login-form');
    const email=document.getElementById('login-email');
    const password=document.getElementById('login-password');
    const emailError=document.getElementById('login-email-error');
    const passwordError=document.getElementById('login-password-error');
    const toggle=document.getElementById('toggle-login-password');
    toggle.addEventListener('click',()=>{
        const visible=password.type==='password';
        password.type=visible?'text':'password';
        toggle.setAttribute('aria-pressed',String(visible));
        toggle.setAttribute('aria-label',visible?'Hide password':'Show password');
    });
    email.addEventListener('input',()=>{emailError.textContent='';email.removeAttribute('aria-invalid');});
    password.addEventListener('input',()=>{passwordError.textContent='';password.removeAttribute('aria-invalid');});
    form.addEventListener('submit',event=>{
        event.preventDefault();
        const invalidEmail=!email.value.trim()||email.validity.typeMismatch;
        const invalidPassword=!password.value;
        emailError.textContent=invalidEmail?'Enter a valid email address.':'';
        passwordError.textContent=invalidPassword?'This field is required.':'';
        email.setAttribute('aria-invalid',String(invalidEmail));
        password.setAttribute('aria-invalid',String(invalidPassword));
        if(invalidEmail){email.focus();return;}
        if(invalidPassword){password.focus();return;}
        // Prototype navigation, matching the existing role logins; no server authentication yet.
        const destinations = { staff: 'interface_staff.html', admin: 'admin_1stpage.html' };
        const destination = destinations[form.dataset.role];
        if (destination) window.location.href = destination;
    });
})();
