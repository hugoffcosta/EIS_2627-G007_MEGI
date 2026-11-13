(() => {
  'use strict';
  const form=document.getElementById('client-registration');
  const panels=[...document.querySelectorAll('[data-reg-step]')];
  const steps=[...document.querySelectorAll('.client-stepper .step')];
  const next=document.getElementById('reg-next'),back=document.getElementById('reg-back'),submit=document.getElementById('reg-submit');
  const feedback=document.getElementById('reg-feedback');
  let current=0;
  const $=id=>document.getElementById(id);
  function show(index){current=index;panels.forEach((p,i)=>p.hidden=i!==index);steps.forEach((s,i)=>{s.classList.toggle('current',i===index);s.classList.toggle('done',i<index);s.setAttribute('aria-current',i===index?'step':'false');});back.hidden=index===0;next.hidden=index===3;submit.hidden=index!==3;$('reg-step-hint').textContent=`Step ${index+1} of 4`;feedback.textContent='';if(index===3)summary();if(index>0)form.scrollIntoView({block:'start',behavior:'smooth'});}
  function validateFields(index){
    const controls=[...panels[index].querySelectorAll('input,select')].filter(el=>el.required || (el.value && !['checkbox','radio'].includes(el.type)));
    for(const field of controls){field.setCustomValidity('');if(!field.checkValidity()){field.setAttribute('aria-invalid','true');feedback.textContent=field.validity.valueMissing?'Please complete all required fields.':`Please check the format of ${field.closest('.form-group')?.querySelector('label')?.textContent||'this field'}.`;field.focus();return false;}field.removeAttribute('aria-invalid');}
    if(index===2 && $('reg-password').value!==$('reg-confirm').value){$('reg-confirm').setAttribute('aria-invalid','true');feedback.textContent='The passwords do not match.';$('reg-confirm').focus();return false;}
    return true;
  }
  document.querySelectorAll('#client-registration input,#client-registration select').forEach(el=>el.addEventListener('input',()=>{el.removeAttribute('aria-invalid');feedback.textContent='';}));
  function summary(){const entries=[['Full Name',$('reg-name').value],['Email',$('reg-email').value],['Phone',$('reg-phone').value],['Client Type',$('reg-type').value],['Default Address',$('reg-address').value],['Postal Code',$('reg-postal').value],['City',$('reg-city').value],['Company',$('reg-company').value||'—']];const dl=$('reg-summary');dl.replaceChildren();entries.forEach(([label,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);dl.append(row);});}
  next.addEventListener('click',()=>{if(validateFields(current))show(current+1);});back.addEventListener('click',()=>show(current-1));
  form.addEventListener('submit',event=>{event.preventDefault();for(let i=0;i<3;i++)if(!validateFields(i)){show(i);feedback.textContent='Please correct the highlighted fields before submitting.';return;}
    if(!$('reg-terms').checked){feedback.textContent='Please confirm the demonstration terms.';$('reg-terms').focus();return;}
    const profile={name:$('reg-name').value.trim(),email:$('reg-email').value.trim(),phone:$('reg-phone').value.trim(),type:$('reg-type').value,address:$('reg-address').value.trim(),postal:$('reg-postal').value.trim(),city:$('reg-city').value.trim(),company:$('reg-company').value.trim(),notifications:$('reg-notify').checked};
    try{localStorage.setItem('cms.client.profile.v1',JSON.stringify(profile));sessionStorage.setItem('cms.client.session.v1',JSON.stringify({email:profile.email,name:profile.name}));}
    catch(e){feedback.textContent='Browser storage is unavailable. Please enable storage for this local demo.';return;}
    const dlg=$('reg-success');dlg.showModal();
  });
  show(0);
})();
