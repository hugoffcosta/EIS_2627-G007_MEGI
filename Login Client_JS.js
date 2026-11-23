(() => {
  'use strict';
  const form=document.getElementById('client-login-form');
  const email=document.getElementById('client-login-email'),password=document.getElementById('client-login-password');
  const msg=document.getElementById('client-login-feedback');
  document.getElementById('client-toggle-password').addEventListener('click',event=>{const showing=password.type==='password';password.type=showing?'text':'password';event.currentTarget.setAttribute('aria-pressed',String(showing));event.currentTarget.setAttribute('aria-label',showing?'Hide password':'Show password');});
  [email,password].forEach(el=>el.addEventListener('input',()=>{msg.textContent='';el.removeAttribute('aria-invalid');}));
  form.addEventListener('submit', async event=>{
    event.preventDefault();
    if(!email.value.trim()||!email.checkValidity()){msg.textContent='Enter a valid email address.';email.setAttribute('aria-invalid','true');email.focus();return;}
    if(!password.value){msg.textContent='Password is required for this demo form.';password.setAttribute('aria-invalid','true');password.focus();return;}
        // Sprint 2: o login é verificado no servidor (PHP + base de dados)
    try {
      const response = await fetch('backend/api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'client', email: email.value.trim(), password: password.value })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        msg.textContent = data.error || 'Login failed.';
        password.value = '';
        password.focus();
        return;
      }
      try { sessionStorage.setItem('cms.client.session.v1', JSON.stringify({ email: data.user.email, name: data.user.name })); } catch (e) {}
      window.location.assign('Menu_clientHTML.html');
    } catch (error) {
      msg.textContent = 'Could not reach the server. Check that Apache and MySQL are running in XAMPP.';
    }
  });
})();
