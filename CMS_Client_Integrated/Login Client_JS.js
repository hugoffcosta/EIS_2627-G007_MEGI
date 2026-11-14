(() => {
  'use strict';
  const form=document.getElementById('client-login-form');
  const email=document.getElementById('client-login-email'),password=document.getElementById('client-login-password');
  const msg=document.getElementById('client-login-feedback');
  document.getElementById('client-toggle-password').addEventListener('click',event=>{const showing=password.type==='password';password.type=showing?'text':'password';event.currentTarget.setAttribute('aria-pressed',String(showing));event.currentTarget.setAttribute('aria-label',showing?'Hide password':'Show password');});
  [email,password].forEach(el=>el.addEventListener('input',()=>{msg.textContent='';el.removeAttribute('aria-invalid');}));
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!email.value.trim()||!email.checkValidity()){msg.textContent='Enter a valid email address.';email.setAttribute('aria-invalid','true');email.focus();return;}
    if(!password.value){msg.textContent='Password is required for this demo form.';password.setAttribute('aria-invalid','true');password.focus();return;}
    try{const p=JSON.parse(localStorage.getItem('cms.client.profile.v1')||'null');sessionStorage.setItem('cms.client.session.v1',JSON.stringify({email:email.value.trim(),name:p?.email?.toLowerCase()===email.value.toLowerCase()?p.name:email.value.split('@')[0]}));}
    catch(e){msg.textContent='Unable to open demo session. Check browser storage settings.';return;}
    // Prototype only: no server, password verification, or real login.
    window.location.assign('Menu_clientHTML.html');
  });
})();
