// Notifications describe actions in this page session; no persistent storage or server delivery.
(() => {
    'use strict';
    const menu=document.getElementById('notifications-menu');
    const toggle=document.getElementById('notifications-toggle');
    const list=document.getElementById('notifications-list');
    const clear=document.getElementById('clear-notifications');
    let items=[],sequence=0;
    function node(tag,className,text) {
        const element=document.createElement(tag);
        element.className=className;if(text!==undefined)element.textContent=text;
        return element;
    }
    function icon(type) {
        const paths={order:'m12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V8M12 13v10',status:'M12 3a9 9 0 1 0 9 9M8 12l3 3 9-10',sos:'m12 3 10 18H2L12 3Zm0 6v5m0 3v1',profile:'M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',close:'M6 6l12 12M18 6 6 18'};
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d',paths[type]||paths.order);svg.append(path);return svg;
    }
    function renderNotifications() {
        const unread=items.filter(item=>!item.read).length;
        const badge=document.getElementById('notifications-badge');
        badge.textContent=unread>9?'9+':String(unread);badge.hidden=unread===0;
        toggle.setAttribute('aria-label',`Notifications, ${unread} unread`);
        document.getElementById('notifications-total').textContent=String(items.length);
        document.getElementById('notifications-empty').hidden=items.length>0;clear.disabled=!items.length;
        const fragment=document.createDocumentFragment();
        for(const item of items) {
            const row=node('li',`notification-item${item.read?'':' is-unread'}`);
            const open=node('button','notification-open');open.type='button';
            const mark=node('span',`notification-icon notification-icon-${item.type}`);mark.append(icon(item.type));
            const body=node('span','notification-body');
            const time=node('time','notification-time',new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(item.date));
            time.dateTime=item.date.toISOString();
            body.append(node('strong','notification-title',item.title),node('span','notification-message',item.message),time);
            if(item.orderId)body.append(node('span','notification-action','View order details'));
            open.append(mark,body);
            open.addEventListener('click',()=>{
                item.read=true;menu.open=false;renderNotifications();
                window.dispatchEvent(new CustomEvent('cms:notification-open',{detail:{target:item.target,orderId:item.orderId}}));
            });
            const remove=node('button','notification-remove');remove.type='button';
            remove.setAttribute('aria-label',`Delete notification: ${item.title}`);remove.title='Delete notification';remove.append(icon('close'));
            remove.addEventListener('click',event=>{
                event.stopPropagation();
                items=items.filter(existing=>existing.id!==item.id);renderNotifications();
                (list.querySelector('button')||toggle).focus();
            });
            row.append(open,remove);fragment.append(row);
        }
        list.replaceChildren(fragment);
    }
    window.addEventListener('cms:notification',event=>{
        const detail=event.detail;
        if(!detail||typeof detail.title!=='string'||typeof detail.message!=='string')return;
        const target=['home','orders','profile','fleet','register-vehicle','sos'].includes(detail.target)?detail.target:'home';
        items.unshift({id:++sequence,title:detail.title,message:detail.message,type:detail.type||'order',target,orderId:detail.orderId||null,date:new Date(),read:menu.open});
        renderNotifications();
        document.getElementById('notification-announcement').textContent=`${detail.title}. ${detail.message}`;
    });
    clear.addEventListener('click',()=>{items=[];renderNotifications();toggle.focus();});
    menu.addEventListener('toggle',()=>{if(menu.open){items.forEach(item=>{item.read=true;});renderNotifications();}});
    document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;toggle.focus();}});
    renderNotifications();
})();

(() => {
    'use strict';

    // Multi-vehicle forms; requests remain in memory until a backend is connected.
    function mountVehicleBatch(root) {
        const list=root.querySelector('[data-vehicle-list]');
        const template=list.querySelector('.vehicle-batch-card').cloneNode(true);
        const optional=root.hasAttribute('data-optional-vehicles');
        let nextIndex=0;
        const cards=()=>[...list.children];
        function refresh() {
            cards().forEach((card,index)=>{
                card.querySelector('[data-vehicle-heading]').textContent=`Vehicle ${index+1}`;
                card.querySelector('[data-remove-vehicle]').disabled=!optional&&cards().length===1;
            });
            root.querySelector('[data-vehicle-count]').textContent=`${cards().length} vehicle${cards().length===1?'':'s'} in this request`;
        }
        function prepare(card,initial=false) {
            const index=nextIndex++;
            const ids=new Map();
            card.dataset.vehicleIndex=String(index);
            card.querySelectorAll('input[name],select[name]').forEach(field=>{
                const key=field.id||field.name;
                field.dataset.vehicleField=key;
                const name=field.name.replace(/\[\]$/,'');
                field.name=`vehicles[${index}][${name}]${field.multiple?'[]':''}`;
                if(!initial) {
                    if(field.type==='radio'||field.type==='checkbox')field.checked=false;
                    else field.value='';
                }
            });
            card.querySelectorAll('[id]').forEach(node=>{
                const old=node.id;
                const id=index===0?old:`${old}-vehicle-${index}`;
                ids.set(old,id);node.id=id;
            });
            card.querySelectorAll('[for],[aria-labelledby],[aria-describedby],[aria-controls]').forEach(node=>{
                for(const attr of ['for','aria-labelledby','aria-describedby','aria-controls']) {
                    if(node.hasAttribute(attr))node.setAttribute(attr,node.getAttribute(attr).split(/\s+/).map(id=>ids.get(id)||id).join(' '));
                }
            });
            return card;
        }
        prepare(list.firstElementChild,true);
        root.querySelector('[data-add-vehicle]').addEventListener('click',()=>{
            const card=prepare(template.cloneNode(true));
            list.append(card);refresh();
            root.dispatchEvent(new CustomEvent('cms:vehicle-added',{detail:{card},bubbles:true}));
            card.querySelector('input,select').focus();
        });
        root.addEventListener('click',event=>{
            const button=event.target.closest('[data-remove-vehicle]');
            if(!button||button.disabled)return;
            const card=button.closest('.vehicle-batch-card');
            root.dispatchEvent(new CustomEvent('cms:vehicle-removed',{detail:{card},bubbles:true}));
            card.remove();refresh();root.querySelector('[data-add-vehicle]').focus();
        });
        refresh();
        return {root,cards,records(){
            return cards().map(card=>{
                const record={};
                card.querySelectorAll('input[name],select[name]').forEach(field=>{
                    const key=field.dataset.vehicleField;
                    if(field.type==='radio'){if(field.checked)record[key]=field.value;}
                    else if(field.type==='file')record[key]=[...field.files];
                    else record[key]=field.value.trim();
                });
                return record;
            }).filter(record=>Object.values(record).some(value=>Array.isArray(value)?value.length:!!value));
        }};
    }
    function isDuplicateVehiclePlate(field) {
        if(field.dataset.vehicleField!=='license-plate'||!field.value.trim())return false;
        const plate=field.value.trim().toUpperCase();
        return [...field.form.querySelectorAll('[data-vehicle-field="license-plate"]')].some(other=>other!==field&&other.value.trim().toUpperCase()===plate);
    }

    const vehicleIds = new Set(['brand', 'model', 'vehicle-color', 'vehicle-year', 'license-plate', 'fuel', 'max-weight', 'max-volume']);
    const letters = {
        brand: 'The brand may only contain letters and spaces.',
        'vehicle-color': 'The colour may only contain letters and spaces.'
    };
    const lettersPattern = /[^\p{L}\p{M} ]/u;
    const platePattern = /^(?:[A-Z]{2}|[0-9]{2})-(?:[A-Z]{2}|[0-9]{2})-(?:[A-Z]{2}|[0-9]{2})$/i;

    function errorElement(field) {
        const id = `${field.id || field.name}-error`;
        let error = document.getElementById(id);
        if (!error) {
            error = document.createElement('p');
            error.id = id;
            error.className = 'field-error';
            error.setAttribute('aria-live', 'polite');
            const container = field.closest('.form-group, .document-upload-card, .documents-upload-area, .vehicle-type-section') || field.parentElement;
            container.append(error);
        }
        const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
        descriptions.add(id);
        field.setAttribute('aria-describedby', [...descriptions].join(' '));
        return error;
    }

    function showError(field, message) {
        field.setCustomValidity(message);
        field.setAttribute('aria-invalid', String(Boolean(message)));
        errorElement(field).textContent = message;
        if (field.type === 'file') field.form?.querySelector(`label[for="${field.id}"]`)?.classList.toggle('invalid-upload', Boolean(message));
    }

    function latestAdultBirthDate(today = new Date()) {
        const year = today.getFullYear() - 18;
        return new Date(year, today.getMonth(), Math.min(today.getDate(), new Date(year, today.getMonth() + 1, 0).getDate()));
    }

    function fileMessage(field) {
        if (!field.files.length) return field.required ? 'Select the required documents.' : '';
        const photo = field.id === 'profile-photo';
        const extensions = photo ? /\.(jpe?g|png)$/i : /\.(pdf|jpe?g|png)$/i;
        if ([...field.files].some(file => !extensions.test(file.name))) return 'Invalid file format. Use ' + (photo ? 'JPG or PNG.' : 'PDF, JPG or PNG.');
        if (photo && field.files[0].size > 5 * 1024 * 1024) return 'The photo must not exceed 5 MB.';
        return '';
    }

    // null means that this field belongs to another part of the form.
    function vehicleMessage(field) {
        const key=field.dataset.vehicleField||field.id;
        if (field.type === 'file') return fileMessage(field);
        if (key === 'vehicle_type') return !field.required || field.closest('.vehicle-batch-card').querySelector('input[type=radio]:checked') ? '' : 'Select a vehicle type.';
        if (!vehicleIds.has(key)) return null;
        if (!field.value.trim()) return field.required ? 'This field is required.' : '';
        if (isDuplicateVehiclePlate(field)) return 'This license plate is already included in this request.';
        if (letters[key] && lettersPattern.test(field.value)) return letters[key];
        if (key === 'license-plate' && !platePattern.test(field.value)) return 'The licence plate must use the XX-XX-XX format. Each pair must contain two letters or two numbers (e.g. AA-12-BB).';
        if (field.hasAttribute('data-digits') && !/^[0-9]+$/.test(field.value)) return 'Enter digits only (0–9).';
        if (key === 'vehicle-year' && (!/^\d{4}$/.test(field.value) || Number(field.value) < 2000 || Number(field.value) > 2026)) return 'Enter a four-digit year between 2000 and 2026.';
        if (['max-weight', 'max-volume'].includes(key) && Number(field.value) <= 0) return 'Enter a capacity greater than zero.';
        if (field.validity.patternMismatch) return 'Complete this field using the indicated format.';
        return '';
    }

    function formatLicensePlate(value, previous, caret, inputType = '') {
        if (/[^a-z0-9-]/i.test(value)) return null;
        const deleting = inputType.startsWith('delete');
        let characters = value.replace(/-/g, '').toUpperCase();
        let beforeCaret = value.slice(0, caret).replace(/-/g, '').length;
        if (deleting && value !== previous && characters === previous.replace(/-/g, '').toUpperCase()) {
            const index = beforeCaret - (inputType.includes('Backward') ? 1 : 0);
            if (index >= 0 && index < characters.length) {
                characters = characters.slice(0, index) + characters.slice(index + 1);
                if (inputType.includes('Backward')) beforeCaret--;
            }
        }
        characters = characters.slice(0, 6);
        let formatted = characters.match(/.{1,2}/g)?.join('-') || '';
        if (!deleting && (characters.length === 2 || characters.length === 4)) formatted += '-';
        let position = 0, count = 0;
        while (position < formatted.length && count < beforeCaret) {
            if (formatted[position] !== '-') count++;
            position++;
        }
        if (!deleting && formatted[position] === '-') position++;
        return {value: formatted, caret: position};
    }

    function vehicleInput(field, event, previous) {
        const key=field.dataset.vehicleField||field.id;
        if (letters[key] && lettersPattern.test(field.value)) return letters[key];
        if (key === 'license-plate') {
            const formatted = formatLicensePlate(field.value, previous, field.selectionStart ?? field.value.length, event.inputType);
            if (!formatted) return 'Enter letters and numbers only. Hyphens are added automatically.';
            field.value = formatted.value;
            field.setSelectionRange(formatted.caret, formatted.caret);
        }
        if (vehicleIds.has(key) && field.hasAttribute('data-digits') && /[^0-9]/.test(field.value)) return 'Enter digits only (0–9).';
        return '';
    }

    function focusInput(field) {
        if (field.type === 'file') field.form.querySelector(`label[for="${field.id}"]`).focus();
        else if (field.type === 'radio') field.closest('.vehicle-option').focus();
        else field.focus();
    }

    function setupKeyboard(form) {
        form.querySelectorAll('.documents-upload-box, .vehicle-option').forEach(label => {
            label.tabIndex = 0;
            label.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); label.click(); }
            });
        });
    }

    function setupUploads(form) {
        form.querySelectorAll('input[type="file"]').forEach(field => {
            const summary = document.createElement('p');
            summary.className = 'selected-files'; summary.setAttribute('aria-live', 'polite');
            field.after(summary);
            const remove = document.createElement('button');
            remove.type = 'button'; remove.className = 'remove-file-button';
            const photo = field.id === 'profile-photo';
            remove.textContent = photo ? 'Remove photo' : 'Remove file';
            summary.after(remove);
            remove.addEventListener('click', () => { field.value = ''; field.dispatchEvent(new Event('change', {bubbles: true})); });
            const update = () => {
                summary.textContent = field.files.length ? [...field.files].map(file => file.name).join(', ') : (photo ? 'No photo selected.' : 'No file selected.');
                remove.hidden = !field.files.length;
            };
            field.addEventListener('change', update); update();
        });
    }

    function bindFields(fields, {validate, previous = new WeakMap()}) {
        fields.forEach(field => {
            errorElement(field); previous.set(field, field.value);
            field.addEventListener('blur', () => validate(field));
            field.addEventListener('input', event => {
                const error = vehicleInput(field, event, previous.get(field));
                if (error) { field.value = previous.get(field); showError(field, error); return; }
                previous.set(field, field.value); validate(field);
            });
            field.addEventListener('change', () => {
                if (field.type === 'radio') fields.filter(item => item.name === field.name).forEach(validate);
                else validate(field);
            });
        });
    }

    function setupVehicleForm(form) {
        const batch=mountVehicleBatch(form.querySelector('[data-vehicle-batch]'));
        const fields = [...form.querySelectorAll('input[name], select')];
        const validate = field => {
            field.setCustomValidity('');
            const message = vehicleMessage(field) ?? '';
            showError(field, message); return !message;
        };
        bindFields(fields, {validate});
        setupKeyboard(form); setupUploads(form);
        batch.root.addEventListener('cms:vehicle-added',event=>{
            const card=event.detail.card,added=[...card.querySelectorAll('input[name],select')];
            fields.push(...added);bindFields(added,{validate});setupKeyboard(card);setupUploads(card);
        });
        batch.root.addEventListener('cms:vehicle-removed',event=>{
            for(let index=fields.length-1;index>=0;index--)if(event.detail.card.contains(fields[index]))fields.splice(index,1);
        });
        form.addEventListener('submit', event => {
            event.preventDefault();
            const invalid = fields.filter(field => !validate(field));
            if (invalid.length) { focusInput(invalid[0]); return; }
            const vehicles=batch.records();
            form.vehicleRegistrationRequest={vehicles,submittedAt:new Date().toISOString()};
            document.getElementById('courier-vehicle-registration-success').showModal();
            window.dispatchEvent(new CustomEvent('cms:notification',{detail:{type:'vehicle',title:'Vehicle request submitted',message:document.getElementById('courier-vehicle-success-message').textContent,target:'fleet'}}));
        });
    }

    document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
    if (document.getElementById('profile-edit-form')) {
    const editor = document.getElementById('profile-editor');
    const form = document.getElementById('profile-edit-form');
    const birth = form.elements.namedItem('birth');
    const profilePostal=form.elements.namedItem('postal'),profileDistrict=form.elements.namedItem('city');
    const profilePostalStatus=document.getElementById('profile-postal-status'),profilePostalRetry=document.getElementById('profile-postal-retry');
    const profileDistricts=['Aveiro','Beja','Braga','Bragança','Castelo Branco','Coimbra','Évora','Faro','Guarda','Leiria','Lisboa','Portalegre','Porto','Santarém','Setúbal','Viana do Castelo','Vila Real','Viseu'];
    const profilePostalCache=new Map();
    let profilePostalTimer,profilePostalController,profilePostalRequest=0,profilePostalCode=null,profilePostalPending=null;
    function cancelProfilePostalLookup() {
        clearTimeout(profilePostalTimer);profilePostalTimer=null;
        profilePostalController?.abort();profilePostalController=null;
        profilePostalRequest++;profilePostalPending=null;
    }
    async function fetchProfileDistrict(code,request) {
        const controller=new AbortController();profilePostalController=controller;
        let timedOut=false;
        const timeout=setTimeout(()=>{timedOut=true;controller.abort();},12000);
        try {
            const response=await fetch(`https://json.geoapi.pt/cp/${encodeURIComponent(code)}`,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
            if(!response.ok){const error=new Error('Postal lookup failed');error.status=response.status;throw error;}
            const data=await response.json(),name=data.Distrito||data.distrito;
            const normalize=value=>value.normalize('NFD').replace(/\p{M}/gu,'').trim().toLowerCase();
            const district=typeof name==='string'?profileDistricts.find(value=>normalize(value)===normalize(name)):null;
            if(!district)throw new Error('Invalid district response');
            if(request!==profilePostalRequest||profilePostal.value!==code)return;
            profilePostalCache.set(code,district);profileDistrict.value=district;
            profilePostalStatus.textContent=`District filled automatically: ${district}.`;profilePostalRetry.hidden=true;
        } catch(error) {
            if(request!==profilePostalRequest||profilePostal.value!==code)return;
            profileDistrict.value='';profilePostalRetry.hidden=false;
            profilePostalStatus.textContent=error.status===429?'The postal service query limit was reached. Try again later; you can save without a district.':error.status===404?'Postal code not found. Check the code or save without a district.':timedOut?'The postal service took too long to respond. Retry or save without a district.':'Could not obtain a valid district from the postal service. Retry or save without a district.';
        } finally {clearTimeout(timeout);if(profilePostalController===controller)profilePostalController=null;}
    }
    function startProfilePostalLookup() {
        clearTimeout(profilePostalTimer);profilePostalTimer=null;
        if(!profilePostalPending)profilePostalPending=fetchProfileDistrict(profilePostalCode,profilePostalRequest);
        return profilePostalPending;
    }
    function scheduleProfilePostalLookup(force=false) {
        const code=profilePostal.value;
        if(code===profilePostalCode&&!force)return;
        cancelProfilePostalLookup();profilePostalCode=code;
        profileDistrict.value='';profilePostalStatus.textContent='';profilePostalRetry.hidden=true;
        if(!/^\d{4}-\d{3}$/.test(code))return;
        if(profilePostalCache.has(code)) {
            profileDistrict.value=profilePostalCache.get(code);
            profilePostalStatus.textContent=`District filled automatically: ${profileDistrict.value}.`;return;
        }
        profilePostalStatus.textContent='Looking up district…';
        profilePostalTimer=setTimeout(startProfilePostalLookup,350);
    }
    profilePostal.addEventListener('input',()=>scheduleProfilePostalLookup());
    profilePostal.addEventListener('change',()=>scheduleProfilePostalLookup());
    profilePostalRetry.addEventListener('click',()=>{scheduleProfilePostalLookup(true);if(profilePostalTimer)startProfilePostalLookup();});
    editor.addEventListener('close',()=>{cancelProfilePostalLookup();profilePostalCode=null;});
    document.querySelectorAll('[data-open-profile]').forEach(button => button.addEventListener('click', () => {
        form.querySelectorAll('input').forEach(input => {
            const current = document.querySelector(`[data-value="${input.name}"]`).textContent;
            input.value = input.name === 'birth' ? current.split('-').reverse().join('-') : current;
        });
        form.querySelectorAll('input').forEach(input=>{input.setCustomValidity('');input.removeAttribute('aria-invalid');});
        form.querySelectorAll('.field-error').forEach(error=>{error.textContent='';});
        cancelProfilePostalLookup();profilePostalCode=null;
        if(/^\d{4}-\d{3}$/.test(profilePostal.value)&&profileDistrict.value.trim())profilePostalCache.set(profilePostal.value,profileDistrict.value.trim());
        scheduleProfilePostalLookup();editor.showModal();
    }));
    birth.addEventListener('input', () => birth.setCustomValidity(''));
    form.querySelectorAll('input:not([type="date"])').forEach(input => input.addEventListener('input', () => input.setCustomValidity('')));
    function validateProfile() {
        form.querySelectorAll('input:not([type="date"])').forEach(input => {
            input.setCustomValidity(input.required&&!input.readOnly&&!input.value.trim()?'This field is required.':'');
        });
        const cutoff = latestAdultBirthDate();
        const born = new Date(`${birth.value}T00:00:00`);
        birth.setCustomValidity(born > cutoff ? 'You must be at least 18 years old.' : '');
        return form.reportValidity();
    }
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if(!validateProfile())return;
        if(profilePostal.value!==profilePostalCode)scheduleProfilePostalLookup();
        const request=profilePostalRequest,save=form.querySelector('[type="submit"]');
        save.disabled=true;
        try {
            if(profilePostalTimer)startProfilePostalLookup();
            if(profilePostalPending)await profilePostalPending;
            if(!editor.open||request!==profilePostalRequest||!validateProfile())return;
        form.querySelectorAll('input').forEach(input => {
            document.querySelector(`[data-value="${input.name}"]`).textContent = input.name === 'birth' ? input.value.split('-').reverse().join('-') : input.value.trim();
        });
        const name = form.elements.namedItem('name').value.trim();
        document.querySelectorAll('[data-name]').forEach(node => { node.textContent = name; });
        const firstName = document.querySelector('[data-first-name]');
        if (firstName) firstName.textContent = `${name.split(/\s+/)[0]}.`;
        document.querySelectorAll('[data-initials]').forEach(node => { node.textContent = name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase(); });
        editor.close(); document.getElementById('profile-feedback').textContent = 'Profile updated for this demonstration.';
        window.dispatchEvent(new CustomEvent('cms:notification',{detail:{type:'profile',title:'Profile updated',message:'Your profile changes were applied.',target:'profile'}}));
        } finally {save.disabled=false;}
    });
    let photoUrl;
    document.getElementById('profile-photo').addEventListener('change', event => {
        const file = event.target.files[0]; if (!file) return;
        const feedback = document.getElementById('photo-feedback');
        const error = fileMessage(event.target);
        if (error) {
            feedback.textContent = error; event.target.value = ''; return;
        }
        feedback.textContent = '';
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        photoUrl = URL.createObjectURL(file);
        document.querySelectorAll('[data-photo]').forEach(image => { image.src = photoUrl; image.hidden = false; image.previousElementSibling.setAttribute('hidden', ''); });
    });
    window.addEventListener('pagehide', () => { if (photoUrl) URL.revokeObjectURL(photoUrl); });
    }
    setupVehicleForm(document.getElementById('vehicle-registration-form'));
})();

(() => {
    'use strict';
    const key = 'cms.demo.CR-00284.delivery-state.v2';
    const catalogKey = 'cms.demo.available-orders.v2';
    const orderStatuses = new Map([
        ['initiated', 'Initiated'], ['picked_up', 'Picked up'],
        ['in_transit', 'In transit'], ['delivery_day', 'Delivery day'],
        ['completed', 'Completed'], ['cancelled', 'Cancelled']
    ]);
    const cancellationReasons = new Map([
        ['customer_request', 'Customer requested cancellation'],
        ['customer_unavailable', 'Unable to contact or reach the customer'],
        ['pickup_unavailable', 'Pickup unavailable or parcel not ready'],
        ['incorrect_address', 'Incorrect or inaccessible delivery address'],
        ['vehicle_issue', 'Vehicle breakdown or accident'],
        ['unsafe_conditions', 'Unsafe delivery conditions'],
        ['personal_emergency', 'Personal emergency'],
        ['other', 'Other']
    ]);
    const $ = id => document.getElementById(id);
    const notify=detail=>window.dispatchEvent(new CustomEvent('cms:notification',{detail}));
    // Orders survive page navigation within this tab, just like work mode and availability.
    const memory = new Map();
    function read(name) {
        if(memory.has(name))return memory.get(name);
        try {
            const value=JSON.parse(sessionStorage.getItem(name)||'null');
            if(value!==null)memory.set(name,value);
            return value;
        } catch {return null;}
    }
    function write(name, value) {
        memory.set(name, value);
        try {sessionStorage.setItem(name,JSON.stringify(value));} catch {}
    }
    const testRunId=Date.now().toString(36).slice(-5).toUpperCase()+Math.random().toString(36).slice(2,4).toUpperCase();
    const validProposal = o => o && ['client', 'origin', 'destination', 'pickup', 'dropoff', 'date', 'vehicle', 'cargo'].every(k => typeof o[k] === 'string');
    const valid = o => validProposal(o) && typeof o.id === 'string';
    let acceptedOrderNumber = 0;
    const hours=value=>value*60*60*1000;
    const localDateKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const serviceType=order=>order.serviceType==='express'?'express':'standard';
    const serviceName=order=>serviceType(order)==='express'?'Express':'Standard';
    const dateTime=value=>{
        const date=new Date(value);
        return Number.isNaN(date.getTime())?'Not scheduled':new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(date);
    };
    function serviceBadge(order) {return el('span',`service-badge service-${serviceType(order)}`,serviceName(order));}
    function timingText(order) {return `Pickup: ${dateTime(order.pickupAt)} | Expected delivery: ${dateTime(order.expectedDeliveryAt)}`;}
    // Keep choices across logout/login in this tab; closing it ends the frontend session.
    const courierSessionKey='cms.demo.CR-00284.session.v1';
    let savedCourierSession={};
    try {
        const saved=JSON.parse(sessionStorage.getItem(courierSessionKey)||'{}');
        if(saved&&typeof saved==='object'&&!Array.isArray(saved))savedCourierSession=saved;
    } catch {}
    let workPreference=['express','standard'].includes(savedCourierSession.mode)?savedCourierSession.mode:null;
    let pendingAvailability=false;
    const workModeDialog=$('work-mode-dialog');
    const currentWorkMode=()=>workPreference;
    function renderWorkMode() {
        const mode=currentWorkMode();
        const badge=$('work-mode-badge');badge.className=`service-badge${mode?' service-'+mode:''}`;
        badge.textContent=mode?mode==='express'?'Express':'Standard':'Selection required';
        $('work-mode-description').textContent=mode==='express'?'Accept Express orders for any future day, with delivery within 24 hours of pickup.':mode==='standard'?'You can accept Standard pickups at least 24 hours ahead.':'Choose Express or Standard before accepting new orders.';
        $('choose-work-mode').hidden=!!mode;
    }
    function openWorkMode() {
        if(currentWorkMode())return;
        if(document.querySelector('dialog[open]'))return;
        $('work-mode-form').reset();$('work-mode-feedback').textContent='';workModeDialog.showModal();
    }
    function maybePromptWorkMode() {
        if(!currentWorkMode()&&!document.hidden)openWorkMode();
    }
    $('choose-work-mode').addEventListener('click',openWorkMode);
    $('work-mode-form').addEventListener('submit',event=>{
        event.preventDefault();
        if(currentWorkMode())return;
        const mode=$('work-mode-form').querySelector('input[name="work_mode"]:checked')?.value;
        if(!['express','standard'].includes(mode)){$('work-mode-feedback').textContent='Choose Express or Standard.';return;}
        workPreference=mode;saveCourierSession();
        const resumeAvailability=pendingAvailability;pendingAvailability=false;
        workModeDialog.close();render();
        if(resumeAvailability)openVehiclePicker();
    });
    workModeDialog.addEventListener('cancel',event=>{if(!currentWorkMode())event.preventDefault();});
    workModeDialog.addEventListener('close',()=>{if(!currentWorkMode())pendingAvailability=false;});
    function orderEligibilityReason(order) {
        const mode=currentWorkMode();
        if(!mode)return 'Choose your work mode before accepting orders.';
        if(!['express','standard'].includes(order.serviceType))return 'This offer has no valid service type.';
        if(order.serviceType!==mode)return `Your work mode is ${mode==='express'?'Express':'Standard'}. Only matching orders can be accepted.`;
        const pickup=new Date(order.pickupAt).getTime(),delivery=new Date(order.expectedDeliveryAt).getTime(),now=Date.now();
        if(!Number.isFinite(pickup)||!Number.isFinite(delivery)||delivery<=pickup)return 'Valid pickup and expected delivery times are required.';
        if(pickup<=now)return 'The pickup time has already passed.';
        if(mode==='standard'&&pickup-now<hours(24))return 'Standard pickups require at least 24 hours of notice.';
        if(mode==='express'&&delivery-pickup>hours(24))return 'Express delivery must be within 24 hours of pickup.';
        return '';
    }
    function weekStart(date) {const result=new Date(date);result.setHours(0,0,0,0);result.setDate(result.getDate()-((result.getDay()+6)%7));return result;}
    function addDays(date,days) {const result=new Date(date);result.setDate(result.getDate()+days);return result;}
    let scheduleWeek=weekStart(new Date());
    const scheduleColors=new Map();
    function scheduleColor(id) {
        if(!scheduleColors.has(id))scheduleColors.set(id,Math.round(scheduleColors.size*137.508)%360);
        return scheduleColors.get(id);
    }
    function renderSchedule(s) {
        const start=new Date(scheduleWeek),end=addDays(start,7),filter=$('schedule-filter').value;
        $('schedule-week-label').textContent=`${start.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} - ${addDays(end,-1).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`;
        const records=[...s.activeOrders.map(item=>({order:item.order,status:orderStatuses.get(item.phase)})),...s.history.filter(item=>item.status==='Completed')];
        const events=[],seen=new Set();
        for(const item of records) {
            if(seen.has(item.order.id))continue;seen.add(item.order.id);
            if(filter!=='all'&&serviceType(item.order)!==filter)continue;
            for(const [kind,value]of [['Pickup',item.order.pickupAt],['Expected delivery',item.order.expectedDeliveryAt]]) {
                const date=new Date(value);
                if(date>=start&&date<end)events.push({item,kind,date});
            }
        }
        events.sort((a,b)=>a.date-b.date||a.item.order.id.localeCompare(b.item.order.id));
        const fragment=document.createDocumentFragment();
        for(let index=0;index<7;index++) {
            const day=addDays(start,index),dateKey=localDateKey(day),section=el('section','schedule-day'),heading=el('h3','',day.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}));
            section.dataset.date=dateKey;
            if(dateKey===localDateKey(new Date())){section.classList.add('is-today');heading.append(el('small','','Today'));}
            const content=el('div','schedule-events'),dayEvents=events.filter(event=>localDateKey(event.date)===dateKey);
            if(!dayEvents.length)content.append(el('p','schedule-day-empty','No stops scheduled'));
            for(const event of dayEvents) {
                const {order}=event.item,hue=scheduleColor(order.id),button=el('button','schedule-event'),time=el('time','',event.date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}));
                button.type='button';button.dataset.orderId=order.id;button.dataset.eventKind=event.kind;
                button.style.setProperty('--event-color',`hsl(${hue} 60% 35%)`);button.style.setProperty('--event-fill',`hsl(${hue} 60% 94%)`);
                time.dateTime=event.date.toISOString();
                button.setAttribute('aria-label',`${event.kind}, ${dateTime(event.date)}, ${order.id}, ${serviceName(order)}, ${order.origin} to ${order.destination}`);
                button.append(serviceBadge(order),time,el('strong','',event.kind),el('span','',order.id),el('span','',event.kind==='Pickup'?order.pickup:order.dropoff),el('span','',event.item.status));
                button.addEventListener('click',()=>showOrderDetails(order,event.item.status));content.append(button);
            }
            section.append(heading,content);fragment.append(section);
        }
        $('schedule-grid').replaceChildren(fragment);
        const orderCount=new Set(events.map(event=>event.item.order.id)).size;
        $('schedule-summary').textContent=`${orderCount} order${orderCount===1?'':'s'} / ${events.length} scheduled stop${events.length===1?'':'s'}`;
        $('schedule-empty').hidden=events.length>0;
    }
    for(const [id,offset]of [['schedule-prev',-7],['schedule-next',7]])$(id).addEventListener('click',()=>{scheduleWeek=addDays(scheduleWeek,offset);renderSchedule(state());});
    $('schedule-today').addEventListener('click',()=>{scheduleWeek=weekStart(new Date());renderSchedule(state());});
    $('schedule-filter').addEventListener('change',()=>renderSchedule(state()));
    const samples = [
        {client:'Sofia Martins',origin:'Porto',destination:'Matosinhos',pickup:'Rua de Cedofeita, Porto',dropoff:'Avenida da Rep\u00fablica, Matosinhos',vehicle:'Not assigned',cargo:'4 parcels',weight:48,volume:2.4,earnings:24},
        {client:'Miguel Lopes',origin:'Porto',destination:'Vila Nova de Gaia',pickup:'Rua de Santa Catarina, Porto',dropoff:'Avenida da Rep\u00fablica, Vila Nova de Gaia',vehicle:'Not assigned',cargo:'1 parcel',weight:3,volume:0.03,earnings:16.5},
        {client:'Beatriz Sousa',origin:'Maia',destination:'Porto',pickup:'Centro da Maia',dropoff:'Rua de J\u00falio Dinis, Porto',vehicle:'Not assigned',cargo:'Pallets',weight:3000,volume:10,earnings:65}
    ].flatMap((order,index)=>['express','standard'].map(type=>{
        const pickup=type==='express'?new Date(Date.now()+hours(2+index*5)):new Date();
        if(type==='standard'){pickup.setDate(pickup.getDate()+2+index*2);pickup.setHours(9+index,0,0,0);}
        if(type==='express'&&index>0){pickup.setDate(new Date().getDate()+index*2);pickup.setHours(index===2?23:14,0,0,0);}
        const expectedDelivery=new Date(pickup.getTime()+hours(type==='express'?2:3));
        return {...order,requestKey:`proposal-${index+1}-${type}`,serviceType:type,earnings:type==='express'?Math.round(order.earnings*1.25*100)/100:order.earnings,pickupAt:pickup.toISOString(),expectedDeliveryAt:expectedDelivery.toISOString(),date:localDateKey(expectedDelivery)};
    }));
    function catalog() {
        const value = read(catalogKey), seen = new Set();
        return (Array.isArray(value) ? value : samples).filter(o => {
            if (!validProposal(o) || typeof o.requestKey !== 'string' || seen.has(o.requestKey)) return false;
            seen.add(o.requestKey); return true;
        });
    }
    function initialState() {
        return {activeOrders:[],selectedOrderId:null,handled:{},history:[]};
    }
    function restoreOrderSession() {
        const saved=read(key);
        if(!saved||!Array.isArray(saved.activeOrders)||!Array.isArray(saved.history)||!saved.handled||typeof saved.handled!=='object') {
            write(key,initialState());
        }
        if(!Array.isArray(read(catalogKey)))write(catalogKey,samples);
    }
    function state() {
        return read(key);
    }
    function selectedOrder(s) {
        return s.activeOrders.find(item=>item.order.id===s.selectedOrderId)||null;
    }
    const available=$('availability-toggle');
    const feedback=$('available-orders-feedback');
    function el(tag, cls, text) {
        const node=document.createElement(tag); if(cls) node.className=cls;
        if(text!==undefined) node.textContent=text; return node;
    }
    function details(order, availableSummary = false, inline = false) {
        const dl=el(inline?'span':'dl','order-details');
        const quantity=(value,unit)=>Number.isFinite(value)?`${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:3}).format(value)} ${unit}`:'\u2014';
        const cargoDetails=[['Weight',quantity(order.weight,'kg')],['Volume',quantity(order.volume,'m\u00b3')],['Earnings',euros(order.earnings)]];
        const entries=availableSummary
            ? [cargoDetails[0],cargoDetails[1],['Origin',order.pickup],['Destination',order.dropoff],cargoDetails[2]]
            : [['Client',order.client],['Pickup',order.pickup],['Destination',order.dropoff],['Delivery Date',order.date],['Vehicle',order.vehicle],['Cargo',order.cargo],...cargoDetails];
        entries.push(['Service',serviceName(order)],['Pickup time',dateTime(order.pickupAt)],['Expected delivery',dateTime(order.expectedDeliveryAt)]);
        for(const [title,value] of entries) {
            const div=el(inline?'span':'div');div.dataset.detail=title;
            div.append(el(inline?'span':'dt',inline?'order-detail-label':'',title),el(inline?'span':'dd',inline?'order-detail-value':'',value));
            dl.append(div);
        } return dl;
    }
    function fleetVehicles() {
        return [...document.querySelectorAll('.fleet-vehicle[data-vehicle-id]')].map(card=>({
            id:card.dataset.vehicleId,plate:card.querySelector('.plate').textContent.trim(),
            name:card.querySelector('h3').textContent.trim(),approved:card.dataset.approved==='true',
            maxWeight:Number(card.dataset.maxWeight),maxVolume:Number(card.dataset.maxVolume)
        }));
    }
    const amount=(value,unit)=>Number.isFinite(value)?`${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:3}).format(value)} ${unit}`:'—';
    function vehicleCapacity(vehicle,order,s) {
        const assigned=s.activeOrders.filter(item=>item.order.vehicleId===vehicle.id||(!item.order.vehicleId&&item.order.vehicle.includes(vehicle.plate)));
        const known=assigned.every(item=>Number.isFinite(item.order.weight)&&item.order.weight>=0&&Number.isFinite(item.order.volume)&&item.order.volume>=0);
        const usedWeight=assigned.reduce((sum,item)=>sum+(item.order.weight||0),0);
        const usedVolume=assigned.reduce((sum,item)=>sum+(item.order.volume||0),0);
        const remainingWeight=Math.max(0,vehicle.maxWeight-usedWeight),remainingVolume=Math.max(0,vehicle.maxVolume-usedVolume);
        let reason='';
        if(!vehicle.approved)reason='Waiting for staff approval.';
        else if(!(vehicle.maxWeight>0&&vehicle.maxVolume>0))reason='Vehicle capacity is unavailable.';
        else if(!known)reason='Capacity cannot be verified: an active order has missing cargo data.';
        else if(!Number.isFinite(order.weight)||order.weight<0||!Number.isFinite(order.volume)||order.volume<0)reason='Order weight and volume are required to check capacity.';
        else {
            const errors=[];
            if(order.weight>remainingWeight+1e-8)errors.push(`Weight exceeds available capacity (${amount(remainingWeight,'kg')}).`);
            if(order.volume>remainingVolume+1e-8)errors.push(`Volume exceeds available capacity (${amount(remainingVolume,'m³')}).`);
            reason=errors.join(' ');
        }
        return {eligible:!reason,reason,remainingWeight,remainingVolume,usedWeight,usedVolume};
    }
    let activeVehicleId=null,vehicleSelection=null,acceptingOrder=null,orderAccepting=false;
    const vehicleDialog=$('order-vehicle-dialog'),acceptDialog=$('order-accept-dialog');
    const activeVehicle=()=>fleetVehicles().find(vehicle=>vehicle.id===activeVehicleId)||null;
    const isAvailable=()=>Boolean(available.checked&&activeVehicleId);
    function saveCourierSession() {
        try {
            sessionStorage.setItem(courierSessionKey,JSON.stringify({mode:workPreference,available:isAvailable(),vehicleId:activeVehicleId}));
        } catch {}
    }
    function sessionVehicleCapacity(vehicle,s) {
        const capacity=vehicleCapacity(vehicle,{weight:0,volume:0},s);
        if(capacity.eligible&&s.activeOrders.some(item=>item.order.vehicleId!==vehicle.id&&!(item.order.vehicleId==null&&item.order.vehicle.includes(vehicle.plate)))) {
            capacity.eligible=false;capacity.reason='Complete or cancel your active orders before switching to another vehicle.';
        }
        return capacity;
    }
    function renderVehicleChoices() {
        const s=state(),vehicles=fleetVehicles(),fragment=document.createDocumentFragment();
        for(const vehicle of vehicles) {
            const capacity=sessionVehicleCapacity(vehicle,s),label=el('label','vehicle-picker-option');
            if(!capacity.eligible)label.classList.add('vehicle-picker-unavailable');
            const radio=el('input');radio.type='radio';radio.name='order_vehicle';radio.value=vehicle.id;radio.disabled=!capacity.eligible;
            radio.checked=vehicleSelection===vehicle.id&&capacity.eligible;
            radio.addEventListener('change',()=>{vehicleSelection=vehicle.id;$('order-vehicle-confirm').disabled=false;});
            const info=el('span','vehicle-picker-info');
            info.append(el('strong','',`${vehicle.name} \u00b7 ${vehicle.plate}`),el('span','',`Maximum: ${amount(vehicle.maxWeight,'kg')} / ${amount(vehicle.maxVolume,'m\u00b3')}`),el('span','',`Remaining: ${amount(capacity.remainingWeight,'kg')} / ${amount(capacity.remainingVolume,'m\u00b3')}`));
            if(capacity.reason)info.append(el('span','vehicle-capacity-error',capacity.reason));
            label.append(radio,info);fragment.append(label);
        }
        $('order-vehicle-options').replaceChildren(fragment);
        const selected=vehicles.find(vehicle=>vehicle.id===vehicleSelection);
        const eligible=selected&&sessionVehicleCapacity(selected,s).eligible;
        if(!eligible)vehicleSelection=null;
        $('order-vehicle-confirm').disabled=!eligible;
    }
    function openVehiclePicker() {
        if(!currentWorkMode()){available.checked=false;pendingAvailability=true;render();openWorkMode();return;}
        available.checked=false;activeVehicleId=null;vehicleSelection=null;
        $('order-vehicle-summary').textContent='Choose the vehicle you will use for this availability session.';
        $('order-vehicle-feedback').textContent='';render();renderVehicleChoices();
        if(!fleetVehicles().some(vehicle=>sessionVehicleCapacity(vehicle,state()).eligible))$('order-vehicle-feedback').textContent='No approved vehicle can be selected for your current active orders.';
        if(!vehicleDialog.open)vehicleDialog.showModal();
    }
    vehicleDialog.addEventListener('close',()=>{vehicleSelection=null;if(!activeVehicleId)available.checked=false;saveCourierSession();render();});
    $('order-vehicle-form').addEventListener('submit',event=>{
        event.preventDefault();
        if(!currentWorkMode()){pendingAvailability=true;available.checked=false;vehicleDialog.close();render();setTimeout(openWorkMode,0);return;}
        const selected=fleetVehicles().find(vehicle=>vehicle.id===vehicleSelection);
        if(!selected||!sessionVehicleCapacity(selected,state()).eligible){$('order-vehicle-feedback').textContent='Choose an eligible approved vehicle.';renderVehicleChoices();return;}
        activeVehicleId=selected.id;available.checked=true;saveCourierSession();vehicleDialog.close();render();notifyNewOffers();
    });
    function renderAcceptance() {
        if(!acceptingOrder)return;
        const vehicle=activeVehicle(),s=state();
        const current=catalog().find(order=>order.requestKey===acceptingOrder.requestKey&&!s.handled[order.requestKey]);
        if(!isAvailable()||!vehicle){acceptDialog.close();return;}
        const capacity=vehicleCapacity(vehicle,current||acceptingOrder,s);
        $('order-accept-summary').textContent=`${serviceName(acceptingOrder)} | ${acceptingOrder.origin} \u2192 ${acceptingOrder.destination} | ${timingText(acceptingOrder)}`;
        $('order-accept-vehicle').textContent=`${vehicle.name} \u00b7 ${vehicle.plate}`;
        $('order-accept-cargo').textContent=`Order: ${amount(acceptingOrder.weight,'kg')} / ${amount(acceptingOrder.volume,'m\u00b3')}`;
        $('order-accept-weight').textContent=amount(capacity.remainingWeight,'kg');
        $('order-accept-volume').textContent=amount(capacity.remainingVolume,'m\u00b3');
        $('order-accept-weight-after').textContent=capacity.eligible?amount(Math.max(0,capacity.remainingWeight-acceptingOrder.weight),'kg'):'\u2014';
        $('order-accept-volume-after').textContent=capacity.eligible?amount(Math.max(0,capacity.remainingVolume-acceptingOrder.volume),'m\u00b3'):'\u2014';
        $('order-accept-feedback').textContent=!current?'This offer is no longer available.':orderEligibilityReason(current)||capacity.reason;
        $('order-accept-confirm').disabled=orderAccepting||!current||!!orderEligibilityReason(current)||!capacity.eligible;
    }
    function openOrderConfirmation(order) {
        if(!isAvailable()){feedback.textContent='Go available and select your active vehicle first.';return;}
        const reason=orderEligibilityReason(order);
        if(reason){feedback.textContent=reason;if(!currentWorkMode())openWorkMode();return;}
        acceptingOrder=order;renderAcceptance();
        if(!acceptDialog.open)acceptDialog.showModal();
    }
    acceptDialog.addEventListener('close',()=>{acceptingOrder=null;});
    $('order-accept-form').addEventListener('submit',async event=>{
        event.preventDefault();if(orderAccepting||!acceptingOrder||!isAvailable())return;
        const order=acceptingOrder,vehicleId=activeVehicleId;
        orderAccepting=true;$('order-accept-confirm').disabled=true;
        try {if(await change('accept',order,null,vehicleId))acceptDialog.close();}
        catch {$('order-accept-feedback').textContent='Could not accept this order. Please try again.';}
        finally {orderAccepting=false;if(acceptDialog.open)renderAcceptance();}
    });
    function goOffline() {
        available.checked=false;activeVehicleId=null;vehicleSelection=null;
        saveCourierSession();
        if(vehicleDialog.open)vehicleDialog.close();
        if(acceptDialog.open)acceptDialog.close();
        render();
    }

    const podRecords = new Map();
    async function podRecord(orderId, record) {
        if (record) podRecords.set(orderId, record);
        return podRecords.get(orderId);
    }
    const podDialog=$('pod-submit-dialog'),podCanvas=$('pod-signature'),podContext=podCanvas.getContext('2d');
    let podTarget=null,podPickupPoint=false,podSaving=false,podInk=false,podPointer=null,podPhotoURL,podSignatureURL;
    let podViewURLs=[],podViewVersion=0;
    const imageError=file=>!file?'Choose an image.':!['image/jpeg','image/png','image/webp'].includes(file.type)?'Use a JPG, PNG or WebP image.':file.size>5*1024*1024?'Each image must be 5 MB or smaller.':'';
    function verifyPodImage(blob) {
        return new Promise((resolve,reject)=>{
            const image=new Image(),url=URL.createObjectURL(blob);
            image.onload=()=>{URL.revokeObjectURL(url);resolve();};
            image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('One of the images could not be opened. Choose a valid photo or signature image.'));};
            image.src=url;
        });
    }
    function releasePodPreviews() {
        if(podPhotoURL)URL.revokeObjectURL(podPhotoURL);
        if(podSignatureURL)URL.revokeObjectURL(podSignatureURL);
        podPhotoURL=podSignatureURL=null;
    }
    function clearPodSignature() {
        podContext?.clearRect(0,0,podCanvas.width,podCanvas.height);
        podInk=false;podPointer=null;$('pod-signature-file').value='';
        $('pod-signature-preview').hidden=true;$('pod-signature-preview').removeAttribute('src');
        if(podSignatureURL)URL.revokeObjectURL(podSignatureURL);podSignatureURL=null;
    }
    function canSubmitPod(order) {
        return state().activeOrders.some(item=>item.order.id===order.id) && !podRecords.has(order.id);
    }
    function openPodSubmission(order,pickupPoint=false) {
        if(podSaving || !canSubmitPod(order))return;
        podTarget=order;podPickupPoint=pickupPoint;$('pod-submit-form').reset();releasePodPreviews();clearPodSignature();
        $('pod-pickup-fields').hidden=!pickupPoint;$('pod-pickup-fields').disabled=!pickupPoint;
        $('pod-submit-title').textContent=pickupPoint?'Pickup point delivery':'Proof of delivery';
        $('pod-introduction').textContent=pickupPoint?'Enter the reason and pickup point name, then add an order photo or the signature of the person responsible for the pickup point. At least one is required; you can provide both.':"Add a delivery photo or the client's signature to complete this order. At least one is required; you can provide both.";
        $('pod-photo-title').textContent=pickupPoint?'Order photo':'Delivery photo';
        $('pod-signature-title').textContent=pickupPoint?'Pickup point representative signature':'Client signature';
        $('pod-signature-instructions').textContent=pickupPoint?'Ask the person responsible for the pickup point to sign below, or upload their signature.':"Draw the client's signature below, or upload a signature image.";
        podCanvas.setAttribute('aria-label',pickupPoint?'Pickup point representative signature drawing area':'Client signature drawing area');
        $('pod-photo-preview').hidden=true;$('pod-photo-preview').removeAttribute('src');
        $('pod-submit-order').textContent=order.id;
        $('pod-client-name').textContent=pickupPoint?'Signature of the person responsible for the pickup point.':`Client: ${order.client}`;
        $('pod-submit-feedback').textContent='';
        $('pod-save').textContent=pickupPoint?'Complete at pickup point':'Save POD & complete order';
        $('order-details-dialog').close();
        if(!podDialog.open)podDialog.showModal();
    }
    $('pod-photo').addEventListener('change',()=>{
        const file=$('pod-photo').files[0];
        $('pod-submit-feedback').textContent=file?imageError(file):'';
        if(podPhotoURL)URL.revokeObjectURL(podPhotoURL);podPhotoURL=null;
        $('pod-photo-preview').hidden=true;
        if(file&&!imageError(file)){podPhotoURL=URL.createObjectURL(file);$('pod-photo-preview').src=podPhotoURL;$('pod-photo-preview').hidden=false;}
    });
    $('pod-signature-file').addEventListener('change',()=>{
        const file=$('pod-signature-file').files[0];
        $('pod-submit-feedback').textContent=file?imageError(file):'';
        if(podSignatureURL)URL.revokeObjectURL(podSignatureURL);podSignatureURL=null;
        $('pod-signature-preview').hidden=true;
        if(file&&!imageError(file)){
            podContext?.clearRect(0,0,podCanvas.width,podCanvas.height);podInk=false;
            podSignatureURL=URL.createObjectURL(file);$('pod-signature-preview').src=podSignatureURL;$('pod-signature-preview').hidden=false;
        }
    });
    $('pod-clear-signature').addEventListener('click',clearPodSignature);
    function signaturePoint(event) {
        const rect=podCanvas.getBoundingClientRect();
        return [(event.clientX-rect.left)*podCanvas.width/rect.width,(event.clientY-rect.top)*podCanvas.height/rect.height];
    }
    podCanvas.addEventListener('pointerdown',event=>{
        if(podSaving||!podContext||!event.isPrimary||event.button!==0)return;
        event.preventDefault();
        if($('pod-signature-file').files.length)clearPodSignature();
        podPointer=event.pointerId;podCanvas.setPointerCapture(event.pointerId);
        const [x,y]=signaturePoint(event);podContext.strokeStyle='#10291a';podContext.fillStyle='#10291a';
        podContext.lineWidth=4;podContext.lineCap='round';podContext.lineJoin='round';
        podContext.beginPath();podContext.arc(x,y,2,0,Math.PI*2);podContext.fill();
        podContext.beginPath();podContext.moveTo(x,y);podInk=true;
    });
    podCanvas.addEventListener('pointermove',event=>{
        if(podPointer!==event.pointerId||podSaving)return;
        const [x,y]=signaturePoint(event);podContext.lineTo(x,y);podContext.stroke();
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])podCanvas.addEventListener(type,()=>{podPointer=null;});
    podDialog.addEventListener('cancel',event=>{if(podSaving)event.preventDefault();});
    podDialog.addEventListener('close',()=>{releasePodPreviews();podTarget=null;});
    $('pod-submit-form').addEventListener('submit',async event=>{
        event.preventDefault();if(podSaving||!podTarget)return;
        const order=podTarget;
        if(!canSubmitPod(order)) { $('pod-submit-feedback').textContent='POD submission is only available when completing an active order.';return; }
        const photo=$('pod-photo').files[0],signatureFile=$('pod-signature-file').files[0];
        const pickupPoint=podPickupPoint?{reason:$('pod-pickup-reason').value.trim(),name:$('pod-pickup-name').value.trim()}:null;
        const pickupError=pickupPoint&&(!pickupPoint.reason||pickupPoint.reason.length>1000)?'Enter the reason for delivery to the pickup point (up to 1,000 characters).':pickupPoint&&(!pickupPoint.name||pickupPoint.name.length>160)?'Enter the pickup point name (up to 160 characters).':'';
        const error=pickupError||(!photo&&!signatureFile&&!podInk?'Add a delivery photo or a signature to complete this order.':'')
            ||(photo?imageError(photo):'')||(signatureFile?imageError(signatureFile):'');
        if(error){$('pod-submit-feedback').textContent=error;return;}
        podSaving=true;
        const controls=[...podDialog.querySelectorAll('button,input,textarea')];controls.forEach(control=>{control.disabled=true;});
        $('pod-submit-feedback').textContent='Completing order…';
        try {
            const signature=signatureFile||(podInk?await new Promise((resolve,reject)=>podCanvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not capture the signature. Please try again.')),'image/png')):null);
            await Promise.all([photo,signature].filter(Boolean).map(verifyPodImage));
            if(!canSubmitPod(order))throw new Error('This order is no longer available for POD submission.');
            const savedAt=new Date().toISOString();
            await podRecord(order.id,{orderId:order.id,photo,signature,client:order.client,savedAt});
            const metadata={savedAt,client:order.client,...(pickupPoint?{pickupPoint}:{})};
            if(!await change('completed',order,metadata)) {
                podRecords.delete(order.id);
                throw new Error('The order is no longer active. Reopen its details to check the POD.');
            }
            podDialog.close();showOrderDetails(order,'Completed');
        } catch(error){$('pod-submit-feedback').textContent=error.message||'Could not save the POD. Please try again.';}
        finally {podSaving=false;controls.forEach(control=>{control.disabled=false;});}
    });
    function releasePodView() {podViewVersion++;podViewURLs.forEach(url=>URL.revokeObjectURL(url));podViewURLs=[];}
    $('order-details-dialog').addEventListener('close',releasePodView);
    async function renderPod(order,container) {
        const version=podViewVersion;
        const section=el('section','pod-record');section.append(el('h3','','Proof of delivery'));
        const loading=el('p','pod-hint','Loading POD…');section.append(loading);container.append(section);
        try {
            const record=await podRecord(order.id);
            if(version!==podViewVersion)return;
            loading.remove();
            if(!record?.photo&&!record?.signature){
                section.append(el('p','pod-hint','No POD is available for this order during this page session.'));
                return;
            }
            const parts=el('div','pod-parts');
            for(const [title,blob] of [['Delivery photo',record.photo],[order.pickupPoint?'Pickup point representative signature':'Client signature',record.signature]]) {
                if(!blob)continue;
                const part=el('section','pod-part'),url=URL.createObjectURL(blob);podViewURLs.push(url);
                const image=el('img','pod-preview');image.src=url;image.alt=`${title} for order ${order.id}`;
                const link=el('a','','Open full image');link.href=url;link.target='_blank';link.rel='noopener';
                part.append(el('h3','',title),image,link);parts.append(part);
            }
            section.append(parts,el('p','pod-hint',`${order.pickupPoint?'Pickup point: '+order.pickupPoint.name:'Client: '+record.client} · Saved: ${new Date(record.savedAt).toLocaleString()}`));
        } catch(error){if(version===podViewVersion)loading.textContent=error.message;}
    }

    async function change(action,order,pod = null,vehicleId = null,cancellation = null) {

        if(action==='accept'&&!vehicleId) {
            if(!isAvailable()){feedback.textContent='Go available and choose your active vehicle first.';return false;}
            openOrderConfirmation(order);return false;
        }
        if(action==='completed') {
            const evidence=podRecords.get(order.id);
            if(!pod||(!evidence?.photo&&!evidence?.signature)) {
                if(evidence&&!evidence.photo&&!evidence.signature)podRecords.delete(order.id);
                const item=state().activeOrders.find(item=>item.order.id===order.id);
                if(item)openPodSubmission(item.order,Boolean(pod?.pickupPoint));
                return false;
            }
        }
        if(action==='cancelled'&&(!cancellationReasons.has(cancellation?.reason)||typeof cancellation?.note!=='string'||cancellation.note.length>1000))return false;
        const commit=()=>{
            const s=state();
            if(action==='accept' || action==='reject') {
                if(s.handled[order.requestKey] || !catalog().some(item=>item.requestKey===order.requestKey)) {
                    $('order-accept-feedback').textContent='This order has already been handled.';return false;
                }
                if(action==='accept' && (!isAvailable()||vehicleId!==activeVehicleId)) {
                    feedback.textContent='Set your availability to Available to accept orders.';
                    $('order-accept-feedback').textContent=feedback.textContent;render();return false;
                }
                let assignedVehicle;
                if(action==='accept') {
                    const currentOrder=catalog().find(item=>item.requestKey===order.requestKey);
                    const modeError=currentOrder&&orderEligibilityReason(currentOrder);
                    if(modeError){$('order-accept-feedback').textContent=modeError;renderAcceptance();return false;}
                    assignedVehicle=activeVehicle();
                    const capacity=currentOrder&&assignedVehicle?vehicleCapacity(assignedVehicle,currentOrder,s):null;
                    if(!capacity?.eligible) {
                        $('order-accept-feedback').textContent=capacity?.reason||'This order or vehicle is no longer available.';
                        renderAcceptance();return false;
                    }
                    order=currentOrder;
                }
                s.handled[order.requestKey]=action==='accept'?'accepted':'rejected';
                if(action==='accept'){
                    const {requestKey, ...proposal}=order;
                    order={...proposal,id:`ORD-${testRunId}-${String(++acceptedOrderNumber).padStart(2,'0')}`};
                    s.activeOrders.push({order:{...order,vehicleId:assignedVehicle.id,vehicle:`${assignedVehicle.name} \u00b7 ${assignedVehicle.plate}`,startedAt:new Date().toISOString()},phase:'initiated'});
                    if(!s.selectedOrderId)s.selectedOrderId=order.id;
                }
                feedback.textContent='';
            } else {
                const item=s.activeOrders.find(item=>item.order.id===order.id);
                if(!item || !orderStatuses.has(action) || item.phase===action) return;
                item.phase=action;
                item.order.statusUpdatedAt=new Date().toISOString();
                if(action==='completed'&&pod.pickupPoint)item.order.pickupPoint={...pod.pickupPoint};
                if(action==='completed'||action==='cancelled') {
                    const closedAt=new Date().toISOString();
                    if(action==='cancelled') {
                        item.order.earnings=0;
                        item.order.cancellation={reason:cancellation.reason,reasonLabel:cancellationReasons.get(cancellation.reason),note:cancellation.note.trim(),cancelledAt:closedAt};
                    }
                    s.history.unshift({order:item.order,status:orderStatuses.get(action),...(action==='completed'?{completedAt:closedAt,pod}:{cancelledAt:closedAt})});
                    s.activeOrders=s.activeOrders.filter(active=>active.order.id!==order.id);
                    if(s.selectedOrderId===order.id)s.selectedOrderId=s.activeOrders[0]?.order.id||null;
                }
            }
            write(key,s);render();
            if(action==='accept')notify({type:'order',title:'Delivery accepted',message:`${order.id} is assigned to your selected vehicle.`,target:'orders',orderId:order.id});
            else if(orderStatuses.has(action))notify({type:'status',title:action==='completed'?'Delivery completed':action==='cancelled'?'Delivery cancelled':'Delivery status updated',message:action==='completed'?(pod.pickupPoint?`${order.id}: completed at ${pod.pickupPoint.name}.`:`${order.id}: proof of delivery submitted.`):`${order.id}: ${orderStatuses.get(action)}.`,target:'orders',orderId:order.id});
            return true;
        };
        return commit();
    }
    const recentSamples = [
        ['ORD-2026-0417','Pedro Costa','Porto','Matosinhos',12.3,24,'2026-10-21'],
        ['ORD-2026-0416','Ana Ferreira','Maia','Porto',8.1,16.5,'2026-10-20'],
        ['ORD-2026-0415','Carlos Mendes','Vila Nova de Gaia','Porto',14.7,27.3,'2026-10-19'],
        ['ORD-2026-0414','Sofia Almeida','Porto','Gondomar',11.2,21,'2026-10-18'],
        ['ORD-2026-0413','Miguel Rocha','Matosinhos','Porto',9.5,18.2,'2026-10-17']
    ].map(([id,client,origin,destination,distance,earnings,date])=>({status:'Completed',order:{id,client,origin,destination,distance,earnings,date,pickup:origin,dropoff:destination,vehicle:'Demo vehicle',cargo:'Parcels',serviceType:'standard',pickupAt:new Date(`${date}T10:00:00`).toISOString(),expectedDeliveryAt:new Date(`${date}T12:00:00`).toISOString()}}));
    const euros = value => Number.isFinite(value) ? `€ ${new Intl.NumberFormat('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)}` : '—';
    const historyDate = item => new Date(item.cancelledAt || item.completedAt || `${item.order.date}T12:00:00`);
    function showOrderDetails(order,status) {
        releasePodView();
        $('order-details-title').textContent=order.id;
        const content=$('order-details-content');
        content.replaceChildren(el('p','order-route',`${order.origin} → ${order.destination}`),details(order),el('p','',`Status: ${order.pickupPoint?'Completed in a pickup point':status}`));
        $('order-details-dialog').showModal();
        if(order.pickupPoint) {
            const section=el('section','order-pickup-details'),data=el('dl','order-details');
            section.append(el('h3','','Pickup point delivery'));
            for(const [label,value]of [['Pickup point',order.pickupPoint.name],['Reason',order.pickupPoint.reason]]) {
                const part=el('div');part.append(el('dt','',label),el('dd','',value));data.append(part);
            }
            section.append(data);content.append(section);
        }
        if(status==='Completed')renderPod(order,content);
        if(status==='Cancelled'&&order.cancellation) {
            const cancellation=order.cancellation,section=el('section','order-cancellation-details');
            section.append(el('h3','','Cancellation details'));
            const data=el('dl','order-details');
            for(const [label,value]of [['Reason',cancellation.reasonLabel],['Additional note',cancellation.note||'No additional note.'],['Cancelled on',new Date(cancellation.cancelledAt).toLocaleString('en-GB')]]) {
                const part=el('div');part.append(el('dt','',label),el('dd','',value));data.append(part);
            }
            section.append(data);content.append(section);
        }
    }
    function renderHistory() {
        const s=state(),unique=new Map(recentSamples.map(item=>[item.order.id,item]));
        for(const item of s.history) if(valid(item.order)) unique.set(item.order.id,item);
        const period=$('orders-period').value;
        const normalize=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
        const search=normalize($('orders-search').value.trim());
        const cutoff=new Date();cutoff.setHours(0,0,0,0);cutoff.setDate(cutoff.getDate()-Number(period));
        const rows=[...unique.values()].filter(item=>{
            if(period!=='all' && !(historyDate(item)>=cutoff)) return false;
            return normalize(`${item.order.id} ${item.order.client} ${item.order.origin} ${item.order.destination} ${item.status} ${serviceName(item.order)}`).includes(search);
        }).sort((a,b)=>(historyDate(b).getTime()||0)-(historyDate(a).getTime()||0));
        const fragment=document.createDocumentFragment();
        for(const item of rows) {
            const o=item.order,tr=el('tr');
            const date=historyDate(item);
            for(const value of [o.id,o.client,`${o.origin} → ${o.destination}`,Number.isFinite(o.distance)?`${o.distance.toFixed(1)} km`:'—',euros(o.earnings),Number.isNaN(date.getTime())?'—':date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})]) tr.append(el('td','',value));
            const typeBadge=serviceBadge(o);typeBadge.classList.add('history-service-badge');tr.firstElementChild.append(typeBadge);
            if(item.status==='Cancelled')tr.firstElementChild.append(el('span','history-cancelled-badge','Cancelled'));
            if(o.pickupPoint)tr.firstElementChild.append(el('span','history-pickup-badge','Completed in a pickup point'));
            const action=el('td'),button=el('button','history-view','View Details');button.type='button';button.setAttribute('aria-label',`View details for order ${o.id}`);
            button.addEventListener('click',()=>showOrderDetails(o,item.status));action.append(button);tr.append(action);fragment.append(tr);
        }
        $('orders-history-body').replaceChildren(fragment);
        $('orders-history-empty').hidden=rows.length>0;
        $('orders-history-all').hidden=period==='all';
    }
    $('orders-search').addEventListener('input',renderHistory);
    $('orders-period').addEventListener('change',renderHistory);
    $('orders-history-all').addEventListener('click',()=>{
        $('orders-period').value='all';$('orders-search').value='';renderHistory();
        $('history-title').tabIndex=-1;$('history-title').focus({preventScroll:true});
    });
    $('order-client-button').addEventListener('click',()=>{const item=selectedOrder(state());if(item)showOrderDetails(item.order,orderStatuses.get(item.phase));});
    const statusDialog=$('order-status-dialog'),statusForm=$('order-status-form');
    let statusOrderId=null,statusSaving=false;
    const statusChoices=[...orderStatuses];
    statusChoices.splice(statusChoices.findIndex(([value])=>value==='cancelled'),0,['completed_pickup','Completed in a pickup point']);
    for(const [value,label]of statusChoices) {
        const option=el('label','order-status-option'),radio=el('input');
        radio.type='radio';radio.name='order_status';radio.value=value;radio.required=true;
        if(value==='cancelled')option.classList.add('order-status-option-cancel');
        if(value==='completed_pickup')radio.addEventListener('change',()=>{
            const item=state().activeOrders.find(item=>item.order.id===statusOrderId);
            if(item){statusDialog.close();openPodSubmission(item.order,true);}
        });
        option.append(radio,el('span','',value==='cancelled'?'Cancel order':label));$('order-status-options').append(option);
    }
    $('open-order-status').addEventListener('click',()=>{
        const item=selectedOrder(state());if(!item)return;
        statusOrderId=item.order.id;
        $('order-status-current').textContent=`${item.order.id} | Current status: ${orderStatuses.get(item.phase)}`;
        statusForm.querySelectorAll('[name="order_status"]').forEach(radio=>{radio.checked=radio.value===item.phase;});
        $('order-status-error').textContent='';
        if(!statusDialog.open)statusDialog.showModal();
    });
    statusDialog.addEventListener('close',()=>{statusOrderId=null;});
    statusForm.addEventListener('submit',async event=>{
        event.preventDefault();if(statusSaving)return;
        const item=state().activeOrders.find(item=>item.order.id===statusOrderId);
        if(!item) { $('order-status-error').textContent='This order is no longer active.';return; }
        const value=statusForm.querySelector('[name="order_status"]:checked')?.value;
        if(!orderStatuses.has(value)&&value!=='completed_pickup') { $('order-status-error').textContent='Select a status.';return; }
        if(value===item.phase) {statusDialog.close();return;}
        statusSaving=true;$('save-order-status').disabled=true;
        try {
            // Both completion flows move the order into history after the delivery form is saved.
            if(value==='cancelled')openCancellation(item.order);
            else if(value==='completed_pickup'){statusDialog.close();openPodSubmission(item.order,true);}
            else if(value==='completed') {statusDialog.close();await change(value,item.order);}
            else if(await change(value,item.order))statusDialog.close();
            else $('order-status-error').textContent='Could not update this order. Please try again.';
        } catch { $('order-status-error').textContent='Could not update this order. Please try again.'; }
        finally {statusSaving=false;$('save-order-status').disabled=false;}
    });

    const cancellationDialog=$('order-cancel-dialog'),cancellationForm=$('order-cancel-form');
    let cancellationOrderId=null,cancellationSaving=false;
    for(const [value,label]of cancellationReasons) {
        const option=el('option','',label);option.value=value;$('order-cancel-reason').append(option);
    }
    function openCancellation(order) {
        cancellationOrderId=order.id;cancellationForm.reset();
        for(const id of ['order-cancel-reason','order-cancel-note'])$(id).removeAttribute('aria-invalid');
        for(const id of ['order-cancel-reason-error','order-cancel-note-error','order-cancel-error'])$(id).textContent='';
        $('order-cancel-id').textContent=order.id;
        statusDialog.close();cancellationDialog.showModal();
    }
    statusForm.addEventListener('change',event=>{
        if(event.target.name!=='order_status'||event.target.value!=='cancelled')return;
        const item=state().activeOrders.find(item=>item.order.id===statusOrderId);
        if(item)openCancellation(item.order);
    });
    cancellationDialog.addEventListener('cancel',event=>{if(cancellationSaving)event.preventDefault();});
    cancellationDialog.addEventListener('close',()=>{cancellationOrderId=null;});
    for(const id of ['order-cancel-reason','order-cancel-note'])$(id).addEventListener('input',()=>{
        $(id).removeAttribute('aria-invalid');$(`${id}-error`).textContent='';
    });
    cancellationForm.addEventListener('submit',async event=>{
        event.preventDefault();if(cancellationSaving)return;
        const item=state().activeOrders.find(item=>item.order.id===cancellationOrderId);
        if(!item){$('order-cancel-error').textContent='This order is no longer active.';return;}
        const reason=$('order-cancel-reason').value,note=$('order-cancel-note').value.trim();
        const reasonError=!cancellationReasons.has(reason),noteError=note.length>1000;
        $('order-cancel-reason-error').textContent=reasonError?'Select a cancellation reason.':'';
        $('order-cancel-note-error').textContent=noteError?'Use no more than 1,000 characters.':'';
        $('order-cancel-reason').setAttribute('aria-invalid',String(reasonError));
        $('order-cancel-note').setAttribute('aria-invalid',String(noteError));
        if(reasonError||noteError){$(reasonError?'order-cancel-reason':'order-cancel-note').focus();return;}
        cancellationSaving=true;
        const controls=[...cancellationDialog.querySelectorAll('button,input,select,textarea')];controls.forEach(control=>{control.disabled=true;});
        try {
            if(!await change('cancelled',item.order,null,null,{reason,note}))throw new Error('This order could not be cancelled. Please try again.');
            $('orders-search').value='';renderHistory();cancellationDialog.close();
            $('history-title').tabIndex=-1;$('history-title').focus({preventScroll:true});
            $('completed-orders').scrollIntoView({behavior:'smooth',block:'start'});
        } catch(error){$('order-cancel-error').textContent=error.message;}
        finally {cancellationSaving=false;controls.forEach(control=>{control.disabled=false;});}
    });

    function renderHomeActiveOrders(s) {
        const fragment=document.createDocumentFragment();
        for(const item of s.activeOrders) {
            const order=item.order,card=el('a','active-delivery-link'),heading=el('div','home-order-heading');
            card.href='#orders';heading.append(el('strong','',order.id),serviceBadge(order));
            const timing=el('dl','home-order-timing');
            for(const [label,value]of [['Pickup',order.pickupAt],['Expected delivery',order.expectedDeliveryAt]]) {
                const part=el('div'),time=el('time','',dateTime(value)),date=new Date(value);
                if(Number.isFinite(date.getTime()))time.dateTime=date.toISOString();
                const detail=el('dd');detail.append(time);part.append(el('dt','',label),detail);timing.append(part);
            }
            const footer=el('div','home-order-footer');
            footer.append(el('span','status-badge status-live',orderStatuses.get(item.phase)),el('span','hero-delivery-action','View delivery \u2192'));
            card.append(heading,el('span','home-active-destination',`Destination: ${order.dropoff || order.destination}`),timing,footer);
            card.addEventListener('click',()=>{
                const current=state();
                if(!current.activeOrders.some(active=>active.order.id===order.id))return;
                current.selectedOrderId=order.id;write(key,current);render();
            });
            fragment.append(card);
        }
        $('home-active-orders-list').replaceChildren(fragment);
        $('home-active-orders-empty').hidden=s.activeOrders.length>0;
        $('home-active-orders-count').textContent=String(s.activeOrders.length);
        $('home-active-orders-all').hidden=!s.activeOrders.length;
    }
    function renderActiveOrders(s) {
        const fragment=document.createDocumentFragment();
        for(const item of s.activeOrders) {
            const order=item.order,button=el('button','active-order-choice');
            button.type='button';button.dataset.orderId=order.id;
            button.setAttribute('aria-pressed',String(order.id===s.selectedOrderId));
            button.setAttribute('aria-controls','active-orders');
            button.append(el('strong','',order.id),el('span','active-choice-route',`${order.origin} \u2192 ${order.destination}`),el('span','active-choice-status',orderStatuses.get(item.phase)));
            button.append(el('span','active-choice-vehicle',order.vehicle),details(order,true,true));
            button.addEventListener('click',()=>{
                const current=state();
                if(!current.activeOrders.some(item=>item.order.id===order.id))return;
                current.selectedOrderId=order.id;write(key,current);
                render();
                $('active-order-id').tabIndex=-1;$('active-order-id').focus({preventScroll:true});
            });
            fragment.append(button);
        }
        $('active-orders-list').replaceChildren(fragment);
        $('active-orders-count').textContent=String(s.activeOrders.length);
        $('active-orders-list-empty').hidden=s.activeOrders.length>0;
    }
    const incidentForm=$('incident-form'),incidentOrder=$('incident-order');
    function renderIncidentOrders(s) {
        const previous=incidentOrder.value;
        const fragment=document.createDocumentFragment();
        const placeholder=el('option','',s.activeOrders.length?'Select an active order':'No active orders available');
        placeholder.value='';fragment.append(placeholder);
        for(const item of s.activeOrders) {
            const order=item.order,option=el('option','',`${order.id} · ${order.origin} → ${order.destination}`);
            option.value=order.id;fragment.append(option);
        }
        incidentOrder.replaceChildren(fragment);
        const stillActive=s.activeOrders.some(item=>item.order.id===previous);
        incidentOrder.value=stillActive?previous:'';
        incidentOrder.setCustomValidity('');
        $('incident-order-hint').textContent=!s.activeOrders.length?'You need an active order to submit an incident.':previous&&!stillActive?'The previously selected order is no longer active. Choose another order.':'';
        incidentForm.querySelector('[type="submit"]').disabled=!s.activeOrders.length;
    }
    incidentOrder.addEventListener('change',()=>{
        incidentOrder.setCustomValidity('');$('incident-order-hint').textContent='';
        incidentForm.querySelector('[role="status"]').textContent='';

    });
    const sosNotification=$('sos-success-notification');
    $('close-sos-notification').addEventListener('click',()=>{
        sosNotification.hidden=true;
        $('sos-success-message').textContent='';
        const heading=document.querySelector('[data-courier-view]:not([hidden]) h1');
        if(heading) { heading.tabIndex=-1;heading.focus({preventScroll:true}); }
    });
    incidentForm.noValidate=true;
    incidentForm.addEventListener('submit',event=>{
        event.preventDefault();
        for(const field of incidentForm.querySelectorAll('[required]')) {
            field.setCustomValidity(!field.value.trim()?'This field is required.':'');
        }
        const active=state().activeOrders.some(item=>item.order.id===incidentOrder.value);
        if(incidentOrder.value && !active)incidentOrder.setCustomValidity('Select an active order.');
        if(!incidentForm.reportValidity())return;
        incidentForm.incidentRequest={
            orderId:incidentOrder.value,
            category:$('incident-category').value,
            address:$('incident-address').value.trim(),
            description:$('incident-description').value.trim(),
            submittedAt:new Date().toISOString()
        };
        incidentForm.querySelector('[role="status"]').textContent='';
        sosNotification.hidden=false;
        $('sos-success-message').textContent='Your SOS request has been submitted successfully.';
        notify({type:'sos',title:'SOS request submitted',message:`Incident reported for ${incidentOrder.value}.`,target:'orders',orderId:incidentOrder.value});
        location.hash='home';
    });
    const deliveryRoute=createDeliveryRoute();
    function createDeliveryRoute() {
        const services={geocode:'https://photon.komoot.io/api/',route:'https://router.project-osrm.org/route/v1/driving/',tiles:'https://tile.openstreetmap.org/{z}/{x}/{y}.png'};
        const container=$('delivery-map'),status=$('delivery-map-status'),retry=$('retry-delivery-route');
        const geocodes=new Map(),routes=new Map();
        const localFile=location.protocol==='file:';
        let order=null,routeKey='',loadedKey='',busyKey='',failedKey='',version=0,map,layers,tiles,library,mapBounds=null,backgroundError=false;
        let geocodeQueue=Promise.resolve(),lastGeocode=0;
        const validCoordinates=point=>Array.isArray(point)&&point.length===2&&point.every(Number.isFinite)&&Math.abs(point[0])<=180&&Math.abs(point[1])<=90;
        const latLng=point=>[point[1],point[0]];
        function cached(cache,key,load) {
            if(!cache.has(key)) {
                const promise=load().catch(error=>{if(cache.get(key)===promise)cache.delete(key);throw error;});
                cache.set(key,promise);
            }
            return cache.get(key);
        }
        function loadMapAsset(type,url,integrity) {
            return new Promise((resolve,reject)=>{
                const element=document.createElement(type);
                if(type==='link'){element.rel='stylesheet';element.href=url;}else element.src=url;
                element.integrity=integrity;element.crossOrigin='anonymous';
                const timer=setTimeout(()=>{element.remove();reject(new Error('Leaflet took too long to load. Please try again.'));},15000);
                element.onload=()=>{clearTimeout(timer);resolve();};
                element.onerror=()=>{clearTimeout(timer);element.remove();reject(new Error('Leaflet could not be loaded. Please try again.'));};
                document.head.append(element);
            });
        }
        function mapLibrary() {
            if(!library)library=Promise.all([
                loadMapAsset('link','https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='),
                loadMapAsset('script','https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=')
            ]).then(()=>{if(!window.L)throw new Error('Leaflet is unavailable.');return window.L;}).catch(error=>{library=null;throw error;});
            return library;
        }
        function prepareMap(L) {
            if(map)return;
            map=L.map(container,{scrollWheelZoom:false,zoomAnimation:false});
            layers=L.layerGroup().addTo(map);
            // OSM documents X-Requested-With for file:// applications without an HTTP Referer.
            // https://wiki.openstreetmap.org/wiki/Referer#Leaflet
            // Keep browser caching and the real browser identity; never spoof a Referer.
            const options={maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',updateWhenIdle:true,updateWhenZooming:false,keepBuffer:1,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'};
            if(localFile) {
                const IdentifiedTiles=L.TileLayer.extend({
                    createTile(coords,done) {
                        const image=document.createElement('img');image.alt='';image.setAttribute('role','presentation');
                        const controller=new AbortController();
                        let objectURL=null,removed=false;
                        const timeout=setTimeout(()=>controller.abort(),15000);
                        const release=()=>{if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}};
                        image.cmsRelease=()=>{removed=true;controller.abort();clearTimeout(timeout);image.onload=image.onerror=null;release();};
                        image.onload=()=>{release();if(!removed)done(null,image);};
                        image.onerror=()=>{release();if(!removed)done(new Error('The map tile could not be displayed.'),image);};
                        fetch(this.getTileUrl(coords),{signal:controller.signal,credentials:'omit',headers:{'X-Requested-With':'CMS-Courier/EIS-2627-G007'}})
                            .then(response=>{if(!response.ok)throw new Error('The map tile is unavailable.');return response.blob();})
                            .then(blob=>{if(removed)return;objectURL=URL.createObjectURL(blob);image.src=objectURL;})
                            .catch(error=>{if(!removed)done(error,image);})
                            .finally(()=>clearTimeout(timeout));
                        return image;
                    }
                });
                tiles=new IdentifiedTiles(services.tiles,options);
                tiles.on('tileunload',event=>event.tile.cmsRelease?.());
            } else tiles=L.tileLayer(services.tiles,options);
            let tileErrors=0;
            tiles.on('loading',()=>{tileErrors=0;});
            tiles.on('tileerror',()=>{tileErrors++;backgroundError=true;status.textContent='OpenStreetMap tiles could not be loaded. Please try again later.';retry.hidden=false;});
            tiles.on('load',()=>{
                backgroundError=tileErrors>0;
                if(!backgroundError&&loadedKey===routeKey){status.textContent='Road route from pickup to destination. Driving time excludes live traffic.';retry.hidden=true;}
            });
            tiles.addTo(map);
        }

        async function mapRequest(url) {
            const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
            try {
                const response=await fetch(url,{signal:controller.signal,credentials:'omit'});
                if(response.status===429)throw new Error('The route service is busy. Please try again shortly.');
                if(!response.ok)throw new Error('The route service is temporarily unavailable.');
                return await response.json();
            } catch(error) {
                if(error.name==='AbortError')throw new Error('The route request timed out. Please try again.');
                throw error;
            } finally {clearTimeout(timer);}
        }
        function address(street,city) {
            const value=String(street||city||'').trim();
            if(!value)throw new Error('A pickup and destination address are required.');
            return value+(city&&!value.toLowerCase().includes(city.toLowerCase())?`, ${city}`:'')+', Portugal';
        }
        function geocode(query) {
            return cached(geocodes,query,()=>{
                const task=geocodeQueue.then(async()=>{
                    const pause=Math.max(0,1100-(Date.now()-lastGeocode));
                    if(pause)await new Promise(resolve=>setTimeout(resolve,pause));
                    lastGeocode=Date.now();
                    const url=new URL(services.geocode);
                    url.search=new URLSearchParams({q:query,limit:'3',countrycode:'PT',lang:'en'}).toString();
                    const result=await mapRequest(url);
                    const feature=result.features?.find(feature=>feature.geometry?.type==='Point'&&validCoordinates(feature.geometry.coordinates)&&(!feature.properties?.countrycode||feature.properties.countrycode.toUpperCase()==='PT'));
                    if(!feature)throw new Error(`Address not found: ${query}.`);
                    return feature.geometry.coordinates;
                });
                geocodeQueue=task.catch(()=>{});return task;
            });
        }
        function clear() {
            layers?.clearLayers();mapBounds=null;loadedKey='';
            $('tracking-distance').textContent='\u2014';
        }
        function addMarker(L,point,label,street,destination=false) {
            const popup=document.createElement('div');
            const title=document.createElement('strong');title.textContent=label;
            const text=document.createElement('p');text.textContent=street;popup.append(title,text);
            const icon=L.divIcon({className:`delivery-map-marker${destination?' delivery-map-destination':''}`,html:`<span aria-hidden="true">${destination?'D':'P'}</span>`,iconSize:[30,30],iconAnchor:[15,15]});
            L.marker(latLng(point),{icon,title:label,alt:label,keyboard:true}).bindPopup(popup).bindTooltip(label,{direction:'top'}).addTo(layers);
        }
        async function refresh() {
            if(!order||container.closest('[data-courier-view]').hidden)return;
            map?.invalidateSize({pan:false});
            if(loadedKey===routeKey||busyKey===routeKey||failedKey===routeKey)return;
            const selected=order,key=routeKey,token=version;busyKey=key;retry.hidden=true;
            status.textContent='Loading OpenStreetMap\u2026';container.setAttribute('aria-busy','true');
            try {
                const L=await mapLibrary();if(token!==version)return;
                prepareMap(L);layers.clearLayers();
                status.textContent='Locating pickup and destination\u2026';
                // Reuse the order-creation marker when GeoJSON [longitude, latitude] coordinates are supplied.
                const start=validCoordinates(selected.pickupCoordinates)?selected.pickupCoordinates:await geocode(address(selected.pickup,selected.origin));
                if(token!==version)return;
                addMarker(L,start,'Pickup',selected.pickup);map.setView(latLng(start),14,{animate:false});
                const end=validCoordinates(selected.dropoffCoordinates)?selected.dropoffCoordinates:await geocode(address(selected.dropoff,selected.destination));
                if(token!==version)return;
                addMarker(L,end,'Destination',selected.dropoff,true);
                mapBounds=L.latLngBounds([latLng(start),latLng(end)]);
                resizeMap(true);
                status.textContent='Calculating the road route\u2026';
                const route=await cached(routes,key,async()=>{
                    const data=await mapRequest(`${services.route}${start.join(',')};${end.join(',')}?overview=full&geometries=geojson&steps=false`),value=data.routes?.[0];
                    if(data.code!=='Ok'||value?.geometry?.type!=='LineString'||value.geometry.coordinates?.length<2||!Array.isArray(value?.geometry?.coordinates)||!value.geometry.coordinates.every(validCoordinates)||!Number.isFinite(value.distance)||value.distance<0||!Number.isFinite(value.duration)||value.duration<0)throw new Error('No road route was found between these addresses.');
                    return value;
                });
                if(token!==version)return;
                selected.distance=route.distance/1000;
                const line=L.polyline(route.geometry.coordinates.map(latLng),{color:'#13866d',weight:5,opacity:.9}).addTo(layers);
                mapBounds=line.getBounds();resizeMap(true);
                $('tracking-distance').textContent=`${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:1}).format(route.distance/1000)} km`;
                status.textContent=backgroundError?'The route is ready, but OpenStreetMap tiles could not be loaded. Please try again later.':'Road route from pickup to destination. Driving time excludes live traffic.';
                retry.hidden=!backgroundError;loadedKey=key;
            } catch(error) {
                if(token!==version)return;
                // Retain any located markers if routing fails: the order location still remains visible.
                status.textContent=error instanceof TypeError?'Could not contact the route service. Located markers remain available. Please try again.':error.message;
                failedKey=key;retry.hidden=false;
            } finally {
                if(busyKey===key)busyKey='';
                if(token===version)container.setAttribute('aria-busy','false');
            }
        }
        retry.addEventListener('click',()=>{if(backgroundError)tiles?.redraw();loadedKey='';failedKey='';refresh();});
        function resizeMap(fit=false) {
            if(!map||container.closest('[data-courier-view]').hidden)return;
            map.invalidateSize({pan:false});
            if(fit&&mapBounds)map.fitBounds(mapBounds,{padding:[35,35],maxZoom:16,animate:false});
        }
        window.addEventListener('hashchange',()=>requestAnimationFrame(()=>{resizeMap(true);refresh();}));
        if(window.ResizeObserver)new ResizeObserver(()=>resizeMap(true)).observe(container);
        return {update(next) {
            const key=next?JSON.stringify([next.id,next.pickup,next.origin,next.dropoff,next.destination,next.pickupCoordinates,next.dropoffCoordinates]):'';
            if(key!==routeKey){version++;routeKey=key;order=next;failedKey='';clear();retry.hidden=true;container.setAttribute('aria-busy','false');}
            refresh();
        }};
    }
    function render() {
        const s=state(),selection=selectedOrder(s),active=selection?.order,phase=selection?.phase;
        const online=isAvailable(),sessionVehicle=activeVehicle();
        const pending=online ? catalog().filter(o=>!s.handled[o.requestKey]) : [];
        const fragment=document.createDocumentFragment();
        for(const order of pending) {
            const card=el('article','available-order');
            const heading=el('div','available-order-heading');
            heading.append(el('span','new-order-badge','New delivery'),serviceBadge(order));
            card.append(heading,el('h3','order-route',`${order.origin} → ${order.destination}`),details(order, true));
            const actions=el('div','available-order-actions');
            const offerCapacity=sessionVehicle?vehicleCapacity(sessionVehicle,order,s):null;
            const modeReason=orderEligibilityReason(order);
            for(const action of ['accept','reject']) {
                const button=el('button',action==='accept'?'next-button accept-order':'back-button reject-order',action==='accept'?'Accept Order':'');
                if(action==='reject') {
                    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
                    icon.setAttribute('viewBox','0 0 24 24');
                    icon.setAttribute('aria-hidden','true');
                    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
                    path.setAttribute('d','M6 6L18 18M18 6L6 18');
                    icon.append(path);button.append(icon);
                }
                button.type='button';button.disabled=action==='accept' && (!online||!!modeReason||!offerCapacity?.eligible);
                if(action==='accept'&&modeReason)button.textContent=order.serviceType!==currentWorkMode()?'Different work mode':'Unavailable';
                else if(action==='accept'&&!offerCapacity?.eligible)button.textContent='Insufficient capacity';
                button.setAttribute('aria-label',`${action==='accept'?'Accept':'Reject'} delivery from ${order.origin} to ${order.destination}`);
                button.addEventListener('click',()=>change(action,order));actions.append(button);
            } card.append(actions);
            if(modeReason||offerCapacity?.reason)card.append(el('p','available-order-capacity-error',modeReason||offerCapacity.reason));
            fragment.append(card);
        }
        $('available-orders-list').replaceChildren(fragment);
        $('available-orders-list').hidden=!online;
        $('available-orders-count').textContent=String(pending.length);
        $('available-orders-count').hidden=false;
        $('available-orders-empty').hidden=pending.length>0;
        if(!online){feedback.textContent='';if(acceptDialog.open)acceptDialog.close();}

        $('active-order-empty').hidden=!!active;
        $('active-orders').hidden=!active;
        $('header-availability').textContent=online?'Available':'Unavailable';
        $('availability-state').textContent=online?'Available':'Unavailable';
        $('availability-description').textContent=online?'You are available to receive orders with your active vehicle.':'Go available and choose a vehicle to receive new orders.';
        available.closest('.availability-panel').classList.toggle('is-unavailable',!online);
        $('active-session-vehicle').hidden=!online;
        if(online&&sessionVehicle){
            const capacity=vehicleCapacity(sessionVehicle,{weight:0,volume:0},s);
            $('active-session-vehicle-name').textContent=`${sessionVehicle.name} \u00b7 ${sessionVehicle.plate}`;
            $('active-session-vehicle-capacity').textContent=`Remaining: ${amount(capacity.remainingWeight,'kg')} / ${amount(capacity.remainingVolume,'m\u00b3')}`;
        }
        renderHomeActiveOrders(s);
        renderWorkMode();renderSchedule(s);

        if(active) {
            const order=active;
            $('active-order-id').textContent=order.id;
            $('active-order-status').textContent=orderStatuses.get(phase).toUpperCase();
            $('order-current-status').textContent=`Current status: ${orderStatuses.get(phase)}`;
            $('active-order-pickup').textContent=order.pickup;
            $('active-order-origin').textContent=order.pickupPostal?`${order.origin}, ${order.pickupPostal}`:order.origin;
            $('active-order-dropoff').textContent=order.dropoff;
            $('active-order-destination').textContent=order.dropoffPostal?`${order.destination}, ${order.dropoffPostal}`:order.destination;
            $('active-order-client').textContent=order.client;
            $('active-order-vehicle').textContent=order.vehicle;
            $('active-order-service').replaceChildren(serviceBadge(order),el('p','order-timing',timingText(order)));
            $('order-earnings').textContent=euros(order.earnings);

        }
        renderActiveOrders(s);
        renderIncidentOrders(s);
        renderHistory();
        // Count every active delivery assigned to each vehicle.
        document.querySelectorAll('.fleet-vehicle').forEach(card=>{
            const metric=[...card.querySelectorAll('.vehicle-metrics > div')].find(div=>div.querySelector('dt')?.textContent.trim()==='Current Active Orders');
            if(metric) metric.querySelector('dd').textContent=String(s.activeOrders.filter(item=>item.order.vehicle.includes(card.querySelector('.plate').textContent.trim())).length);
        });
        $('order-tracking').hidden=!active;
        deliveryRoute.update(active || null);
        if(vehicleDialog.open)renderVehicleChoices();
        if(acceptDialog.open)renderAcceptance();
    }

    window.addEventListener('cms:notification-open',event=>{
        const {target,orderId}=event.detail;
        const current=state();
        if(orderId) {
            const active=current.activeOrders.find(item=>item.order.id===orderId);
            if(active) {current.selectedOrderId=orderId;write(key,current);render();}
            location.hash='orders';
            if(!active) {
                const completed=current.history.find(item=>item.order.id===orderId);
                if(completed)showOrderDetails(completed.order,completed.status);
            }
        } else {
            location.hash=target;
            if(target==='home')requestAnimationFrame(()=>{
                $('available-orders-title').focus({preventScroll:true});$('available-orders-title').scrollIntoView({behavior:'smooth',block:'start'});
            });
        }
    });

    restoreOrderSession();
    available.checked=false;
    if(currentWorkMode()&&savedCourierSession.available===true) {
        const vehicle=fleetVehicles().find(item=>item.id===savedCourierSession.vehicleId);
        if(vehicle&&sessionVehicleCapacity(vehicle,state()).eligible) {
            activeVehicleId=vehicle.id;available.checked=true;
        }
    }
    saveCourierSession();
    available.addEventListener('change',()=>{if(available.checked)openVehiclePicker();else goOffline();});
    const notifiedOfferKeys=new Set();
    function notifyNewOffers() {
        if(!isAvailable())return;
        const current=state();
        for(const offer of catalog()) {
            if(current.handled[offer.requestKey]||notifiedOfferKeys.has(offer.requestKey))continue;
            notifiedOfferKeys.add(offer.requestKey);
            notify({type:'order',title:'New delivery offer',message:`${offer.origin} \u2192 ${offer.destination} | ${serviceName(offer)} | ${euros(offer.earnings)}`,target:'home'});
        }
    }
    window.addEventListener('cms:orders-updated',()=>{render();notifyNewOffers();});
    window.addEventListener('pageshow',render);
    render();
    notifyNewOffers();
    setTimeout(maybePromptWorkMode,0);
    setInterval(maybePromptWorkMode,30000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();maybePromptWorkMode();}});
    window.addEventListener('focus',()=>{render();maybePromptWorkMode();});
})();


(() => {
    'use strict';
    const views = [...document.querySelectorAll('[data-courier-view]')];
    const names = new Set(views.map(view => view.dataset.courierView));
    function navigate(moveFocus = false) {
        const hash = location.hash.slice(1) || 'home';
        const name = hash.startsWith('order-') ? 'orders' : hash;
        if (!names.has(name)) return;
        views.forEach(view => { view.hidden = view.dataset.courierView !== name; });
        document.querySelectorAll('.navbar a').forEach(link => {
            const target = new URL(link.href, location.href);
            if (target.pathname === location.pathname && (target.hash.slice(1) || 'home') === name) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
        document.querySelectorAll('.nav-dropdown').forEach(menu => { menu.open = false; });
        const view = views.find(item => !item.hidden);
        const heading = view.querySelector('h1, h2');
        document.title = `${heading.textContent.trim().replace(/\s+/g, ' ')} | CMS`;
        document.body.classList.toggle('orders-view',name==='orders');
        if (moveFocus) {
            heading.tabIndex = -1;
            heading.focus({preventScroll: true});
            const destination = document.getElementById(hash);
            if (hash.startsWith('order-') && destination) destination.scrollIntoView();
            else window.scrollTo({top: 0});
        }
    }
    window.addEventListener('hashchange', () => navigate(true));
    navigate();
})();

// Statistics use explicit sample data, independently of the operational demo orders.
(() => {
    'use strict';
    const root=document.querySelector('[data-courier-view="statistics"]');
    const host=document.getElementById('statistics-chart');
    const periodButtons=[...root.querySelectorAll('[data-statistics-period]')];
    const periods={
        '7D':{days:7,scale:.23,points:7},'30D':{days:30,scale:1,points:30},
        '3M':{days:90,scale:3,points:13},'6M':{days:180,scale:6,points:6},
        '1Y':{days:365,scale:12.2,points:12},'ALL':{days:540,scale:18,points:18}
    };
    const sample={trips:248,earnings:3842,distance:7420,vehicleTrips:126,ratings:186};
    const shape=[7,9,8,10,8,6,9,12,11,10,12,10,8,13,14,11,10,9,12,10,11,15,12,11,13,12,16,13,14,17];
    const number=new Intl.NumberFormat('en-GB',{maximumFractionDigits:0});
    const money=new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR',maximumFractionDigits:0});
    let period='30D';
    const set=(id,text)=>{document.getElementById(id).textContent=text;};
    const svgNode=(tag,attributes={},text)=>{
        const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
        for(const [key,value]of Object.entries(attributes))node.setAttribute(key,String(value));
        if(text!==undefined)node.textContent=text;
        return node;
    };
    function values() {
        const scale=periods[period].scale;
        return Object.fromEntries(Object.entries(sample).map(([name,value])=>[name,Math.round(value*scale)]));
    }
    function sampleSeries(total,count) {
        const weights=Array.from({length:count},(_,i)=>shape[Math.floor(i*shape.length/count)]);
        const sum=weights.reduce((a,b)=>a+b,0),raw=weights.map(weight=>total*weight/sum);
        const result=raw.map(Math.floor),remaining=total-result.reduce((a,b)=>a+b,0);
        const ranked=raw.map((value,index)=>({index,remainder:value-result[index]})).sort((a,b)=>b.remainder-a.remainder);
        for(let i=0;i<remaining;i++)result[ranked[i].index]++;
        return result;
    }
    function renderChart() {
        const config=periods[period],totals=values(),series=sampleSeries(totals.earnings,config.points);
        const width=Math.max(240,Math.round(host.getBoundingClientRect().width||900));
        const height=width<500?260:320,left=58,right=16,top=18,bottom=height-40;
        const maximum=Math.max(...series),power=10**Math.floor(Math.log10(Math.max(1,maximum/4)));
        const step=[1,2,5,10].find(value=>value*power>=maximum/4)*power,ceiling=step*4;
        const label=value=>money.format(value);
        const svg=svgNode('svg',{viewBox:`0 0 ${width} ${height}`,role:'img','aria-labelledby':'statistics-svg-title statistics-svg-description'});
        const end=new Date();end.setHours(12,0,0,0);
        const start=new Date(end);start.setDate(end.getDate()-config.days+1);
        const dateLabel=date=>new Intl.DateTimeFormat('en-GB',config.days>180?{month:'short',year:'2-digit'}:{day:'numeric',month:'short'}).format(date);
        svg.append(svgNode('title',{id:'statistics-svg-title'},'Earnings over time'),svgNode('desc',{id:'statistics-svg-description'},`Sample earnings across ${config.days} days. Total ${money.format(totals.earnings)}. Use the arrow keys to explore earnings for each point.`));
        for(let tick=0;tick<=4;tick++) {
            const y=bottom-(bottom-top)*tick/4;
            svg.append(svgNode('line',{x1:left,y1:y,x2:width-right,y2:y,class:'statistics-grid-line'}),svgNode('text',{x:left-12,y:y+4,'text-anchor':'end'},label(tick*step)));
        }
        const points=series.map((value,index)=>({x:left+(width-left-right)*index/(series.length-1),y:bottom-(bottom-top)*value/ceiling}));
        let path=`M${points[0].x},${points[0].y}`;
        for(let i=1;i<points.length;i++) {
            const mid=(points[i-1].x+points[i].x)/2;
            path+=` C${mid},${points[i-1].y} ${mid},${points[i].y} ${points[i].x},${points[i].y}`;
        }
        const average=totals.earnings/series.length;
        const averageY=bottom-(bottom-top)*average/ceiling;
        const defs=svgNode('defs'),gradient=svgNode('linearGradient',{id:'statistics-area-gradient',x1:0,y1:0,x2:0,y2:1});
        gradient.append(svgNode('stop',{offset:'0%','stop-color':'#b9e6d2','stop-opacity':.3}),svgNode('stop',{offset:'100%','stop-color':'#b9e6d2','stop-opacity':0}));defs.append(gradient);svg.append(defs);
        const last=points[points.length-1];
        svg.append(svgNode('path',{d:`${path} L${last.x},${bottom} L${points[0].x},${bottom} Z`,class:'statistics-chart-area'}),svgNode('line',{x1:left,y1:averageY,x2:width-right,y2:averageY,class:'statistics-average-line'}),svgNode('path',{d:path,class:'statistics-chart-line'}));
        points.forEach(point=>svg.append(svgNode('circle',{cx:point.x,cy:point.y,r:width<500?2:3,class:'statistics-data-point'})));
        const crosshair=svgNode('line',{y1:top,y2:bottom,class:'statistics-chart-crosshair'});
        const marker=svgNode('circle',{r:6,class:'statistics-selected-point'});
        svg.append(crosshair,marker);
        const formatValue=value=>money.format(value);
        const interval=period==='7D'||period==='30D'?'Daily':period==='3M'?'Weekly':'Monthly';
        const dates=series.map((_,index)=>{const date=new Date(start);date.setDate(start.getDate()+Math.round((config.days-1)*index/(series.length-1)));return date;});
        const fullDate=date=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(date);
        let selected=series.length-1;
        const selectPoint=index=>{
            selected=Math.max(0,Math.min(series.length-1,index));const point=points[selected];
            crosshair.setAttribute('x1',point.x);crosshair.setAttribute('x2',point.x);marker.setAttribute('cx',point.x);marker.setAttribute('cy',point.y);
            set('statistics-point-date',`${interval==='Daily'?'':interval==='Weekly'?'Week ending ':'Month ending '}${fullDate(dates[selected])}`);
            set('statistics-point-value',formatValue(series[selected]));
        };
        const hitArea=svgNode('rect',{x:left,y:top,width:width-left-right,height:bottom-top,fill:'transparent',class:'statistics-chart-hit-area'});
        const selectAt=event=>{const rect=svg.getBoundingClientRect();const x=(event.clientX-rect.left)*width/rect.width;selectPoint(Math.round((x-left)/(width-left-right)*(series.length-1)));};
        hitArea.addEventListener('pointermove',event=>{if(event.pointerType!=='touch')selectAt(event);});
        hitArea.addEventListener('pointerdown',selectAt);svg.append(hitArea);
        const panel=document.getElementById('statistics-chart-panel');
        panel.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();selectPoint(event.key==='Home'?0:event.key==='End'?series.length-1:selected+(event.key==='ArrowRight'?1:-1));};
        selectPoint(selected);
        set('statistics-chart-total',formatValue(totals.earnings));
        set('statistics-chart-series-label',`${interval} earnings`);
        const tickCount=width<500?3:5;
        for(let i=0;i<tickCount;i++) {
            const index=Math.round((series.length-1)*i/(tickCount-1));
            const date=new Date(start);date.setDate(start.getDate()+Math.round((config.days-1)*index/(series.length-1)));
            svg.append(svgNode('text',{x:points[index].x,y:height-10,'text-anchor':i===0?'start':i===tickCount-1?'end':'middle'},dateLabel(date)));
        }
        host.replaceChildren(svg);
    }
    function renderStatistics() {
        const total=values();
        set('statistics-trips',number.format(total.trips));set('statistics-earnings',money.format(total.earnings));set('statistics-distance',number.format(total.distance));
        set('statistics-earnings-per-km',new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(total.earnings/total.distance));
        set('statistics-vehicle-trips',number.format(total.vehicleTrips));set('statistics-rating-count',number.format(total.ratings));
        periodButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.statisticsPeriod===period)));
        renderChart();
    }
    periodButtons.forEach(button=>button.addEventListener('click',()=>{period=button.dataset.statisticsPeriod;renderStatistics();}));
    if(window.ResizeObserver)new ResizeObserver(()=>{if(!root.hidden)renderChart();}).observe(host);
    window.addEventListener('hashchange',()=>requestAnimationFrame(()=>{if(!root.hidden)renderChart();}));
    window.addEventListener('resize',()=>{if(!root.hidden)renderChart();});
    renderStatistics();
})();

// Match the registration form's inline validation on the profile and accident forms.
(() => {
    const forms = new Set(['profile-edit-form', 'incident-form']);
    let firstInvalid = null;
    function message(field) {
        if (field.required && !field.value.trim()) return 'This field is required.';
        if (field.validity.typeMismatch) return 'Enter a valid email address.';
        if (field.validity.patternMismatch) return 'Complete this field using the indicated format.';
        return field.validationMessage;
    }
    function show(field, text) {
        const id = `${field.id}-error`;
        let error = document.getElementById(id);
        if (!error) {
            error = document.createElement('p');
            error.id = id;
            error.className = 'field-error';
            error.setAttribute('aria-live', 'polite');
            (field.closest('.form-group') || field.parentElement).append(error);
        }
        const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
        descriptions.add(id);
        field.setAttribute('aria-describedby', [...descriptions].join(' '));
        field.setAttribute('aria-invalid', String(Boolean(text)));
        error.textContent = text;
    }
    document.addEventListener('invalid', event => {
        const field = event.target;
        if (!forms.has(field.form?.id)) return;
        event.preventDefault();
        show(field, message(field));
        if (!firstInvalid) {
            firstInvalid = field;
            queueMicrotask(() => { firstInvalid.focus(); firstInvalid = null; });
        }
    }, true);
    function update(event) {
        const field = event.target;
        if (!forms.has(field.form?.id) || field.getAttribute('aria-invalid') !== 'true') return;
        field.setCustomValidity('');
        show(field, message(field));
    }
    document.addEventListener('input', update);
    document.addEventListener('change', update);
})();
