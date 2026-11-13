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

    const vehicleIds = new Set(['brand', 'model', 'vehicle-color', 'vehicle-year', 'license-plate', 'fuel', 'max-weight', 'max-volume']);
    const letters = {
        brand: 'A marca deve conter apenas letras e espaços.',
        'vehicle-color': 'A cor deve conter apenas letras e espaços.'
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
            const container = field.closest('.form-group, .documents-upload-area, .vehicle-type-section') || field.parentElement;
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
        if (!field.files.length) return field.required ? 'Selecione os documentos obrigatórios.' : '';
        const photo = field.id === 'profile-photo';
        const extensions = photo ? /\.(jpe?g|png)$/i : /\.(pdf|jpe?g|png)$/i;
        if ([...field.files].some(file => !extensions.test(file.name))) return 'Formato de ficheiro inválido. Utilize ' + (photo ? 'JPG ou PNG.' : 'PDF, JPG ou PNG.');
        if (photo && field.files[0].size > 5 * 1024 * 1024) return 'A fotografia não pode exceder 5 MB.';
        return '';
    }

    // null means that this field belongs to another part of the form.
    function vehicleMessage(field, form) {
        if (field.type === 'file') return fileMessage(field);
        if (field.name === 'vehicle_type') return form.querySelector('input[name="vehicle_type"]:checked') ? '' : 'Selecione o tipo de veículo.';
        if (!vehicleIds.has(field.id)) return null;
        if (!field.value.trim()) return field.required ? 'Este campo é obrigatório.' : '';
        if (letters[field.id] && lettersPattern.test(field.value)) return letters[field.id];
        if (field.id === 'license-plate' && !platePattern.test(field.value)) return 'A matrícula deve seguir o formato XX-XX-XX. Cada par deve conter duas letras ou dois números (ex.: AA-12-BB).';
        if (field.hasAttribute('data-digits') && !/^[0-9]+$/.test(field.value)) return 'Introduza apenas dígitos (0–9).';
        if (field.id === 'vehicle-year' && (!/^\d{4}$/.test(field.value) || Number(field.value) < 1900 || Number(field.value) > 2100)) return 'Introduza um ano entre 1900 e 2100, com 4 dígitos.';
        if (['max-weight', 'max-volume'].includes(field.id) && Number(field.value) <= 0) return 'Introduza uma capacidade superior a zero.';
        if (field.validity.patternMismatch) return 'Preencha este campo no formato indicado.';
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
        if (letters[field.id] && lettersPattern.test(field.value)) return letters[field.id];
        if (field.id === 'license-plate') {
            const formatted = formatLicensePlate(field.value, previous, field.selectionStart ?? field.value.length, event.inputType);
            if (!formatted) return 'Introduza apenas letras e números. Os hífenes são inseridos automaticamente.';
            field.value = formatted.value;
            field.setSelectionRange(formatted.caret, formatted.caret);
        }
        if (vehicleIds.has(field.id) && field.hasAttribute('data-digits') && /[^0-9]/.test(field.value)) return 'Introduza apenas dígitos (0–9).';
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
                summary.textContent = field.files.length ? [...field.files].map(file => file.name).join(', ') : (photo ? 'Without photo.' : 'No document selected.');
                remove.hidden = !field.files.length;
            };
            field.addEventListener('change', update); update();
        });
    }

    function bindFields(fields, {validate, previous = new WeakMap(), onInput = () => ''}) {
        fields.forEach(field => {
            errorElement(field); previous.set(field, field.value);
            field.addEventListener('blur', () => validate(field));
            field.addEventListener('input', event => {
                const error = vehicleInput(field, event, previous.get(field)) || onInput(field, event);
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
        form.noValidate = true;
        const fields = [...form.querySelectorAll('input[name], select')];
        const validate = field => {
            field.setCustomValidity('');
            const message = vehicleMessage(field, form) ?? '';
            showError(field, message); return !message;
        };
        bindFields(fields, {validate});
        setupKeyboard(form); setupUploads(form);
        form.addEventListener('submit', event => {
            event.preventDefault();
            const invalid = fields.filter(field => !validate(field));
            const status = form.querySelector('[role="status"]');
            if (invalid.length) { status.textContent = ''; focusInput(invalid[0]); return; }
            status.textContent = 'Dados do veículo validados. Demonstração: o pedido ainda não foi enviado ao staff.';
            window.dispatchEvent(new CustomEvent('cms:notification',{detail:{type:'vehicle',title:'Vehicle details validated',message:'Your vehicle form passed validation in this session.',target:'register-vehicle'}}));
        });
    }

    const availability = document.getElementById('availability-toggle');
    if (availability) availability.addEventListener('change', () => {
        document.getElementById('availability-state').textContent = availability.checked ? 'Available' : 'Unavailable';
        document.getElementById('availability-description').textContent = availability.checked ? 'You are available to receive new orders.' : 'You are currently not receiving new orders.';
        availability.closest('.availability-panel').classList.toggle('is-unavailable', !availability.checked);
    });
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
            input.setCustomValidity(input.required&&!input.readOnly&&!input.value.trim()?'Este campo \u00e9 obrigat\u00f3rio.':'');
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
    // Integration with the CLIENT demo pages (same localhost origin).
    const clientOrdersKey = 'cms.client.orders.v1';
    function clientRecords() {
        try { const rows=JSON.parse(localStorage.getItem(clientOrdersKey)||'[]'); return Array.isArray(rows)?rows:[]; }
        catch { return []; }
    }
    function clientProposals() {
        return clientRecords().filter(order => order.status==='Initiated' && typeof order.requestKey==='string').map(order => ({
            requestKey:order.requestKey,client:order.client||'Client',origin:order.origin||'Origin',destination:order.destination||'Destination',
            pickup:order.pickup||'Pickup',dropoff:order.dropoff||'Destination',date:String(order.date||''),vehicle:'Not assigned',
            cargo:order.cargo||'Parcel',weight:Number(order.weight),volume:Number(order.volume),earnings:0
        }));
    }
    function syncClientOrder(order,status,vehicle) {
        if(!order?.clientOrderKey)return;
        try {
            const rows=clientRecords(),target=rows.find(row=>row.id===order.clientOrderKey);
            if(!target)return;
            if(target.status===status)return;
            target.status=status;
            if(vehicle)target.vehicle=vehicle;
            target.timeline=[...(target.timeline||[]),{status,date:new Date().toISOString()}];
            localStorage.setItem(clientOrdersKey,JSON.stringify(rows));
        } catch(error) { console.warn('Could not synchronize client demo order',error); }
    }
    const orderStatuses = new Map([
        ['initiated', 'Initiated'], ['picked_up', 'Picked up'],
        ['in_transit', 'In transit'], ['delivery_day', 'Delivery day'],
        ['completed', 'Completed']
    ]);
    const $ = id => document.getElementById(id);
    const notify=detail=>window.dispatchEvent(new CustomEvent('cms:notification',{detail}));
    // Demo state exists only in this page's memory and resets on reload.
    const memory = new Map();
    function read(name) {
        return memory.get(name) ?? null;
    }
    function write(name, value) {
        memory.set(name, value);
    }
    const testRunId=Date.now().toString(36).slice(-5).toUpperCase()+Math.random().toString(36).slice(2,4).toUpperCase();
    const validProposal = o => o && ['client', 'origin', 'destination', 'pickup', 'dropoff', 'date', 'vehicle', 'cargo'].every(k => typeof o[k] === 'string');
    const valid = o => validProposal(o) && typeof o.id === 'string';
    let acceptedOrderNumber = 0;
    const samples = [
        {client:'Sofia Martins',origin:'Porto',destination:'Matosinhos',pickup:'Rua de Cedofeita, Porto',dropoff:'Avenida da Rep\u00fablica, Matosinhos',vehicle:'Not assigned',cargo:'4 parcels',weight:48,volume:2.4,earnings:24},
        {client:'Miguel Lopes',origin:'Porto',destination:'Vila Nova de Gaia',pickup:'Rua de Santa Catarina, Porto',dropoff:'Avenida da Rep\u00fablica, Vila Nova de Gaia',vehicle:'Not assigned',cargo:'1 parcel',weight:3,volume:0.03,earnings:16.5},
        {client:'Beatriz Sousa',origin:'Maia',destination:'Porto',pickup:'Centro da Maia',dropoff:'Rua de J\u00falio Dinis, Porto',vehicle:'Not assigned',cargo:'Pallets',weight:3000,volume:10,earnings:65}
    ].map((o,index)=>({...o,requestKey:`proposal-${index+1}`,date:new Date().toLocaleDateString('en-CA')}));
    function catalog() {
        const value = read(catalogKey), seen = new Set();
        return [...(Array.isArray(value) ? value : samples),...clientProposals()].filter(o => {
            if (!validProposal(o) || typeof o.requestKey !== 'string' || seen.has(o.requestKey)) return false;
            seen.add(o.requestKey); return true;
        });
    }
    function initialState() {
        const order={
            id:`ORD-${testRunId}-00`,client:'Maria Santos',origin:'Porto',destination:'Porto',
            pickup:'Rua da Universidade, Porto',pickupPostal:'4050-123',
            dropoff:'Avenida dos Aliados',dropoffPostal:'4000-067',
            date:new Date().toLocaleDateString('en-CA'),
            vehicle:'Mercedes-Benz Sprinter \u00b7 AA-12-BB',vehicleId:'AA-12-BB',
            cargo:'Parcels',weight:32,volume:1.2,earnings:18.5,startedAt:new Date().toISOString()
        };
        return {activeOrders:[{order,phase:'in_transit'}],selectedOrderId:order.id,handled:{},history:[]};
    }
    function resetTestRun() {
        write(key,initialState());
        write(catalogKey,samples);
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
        for(const [title,value] of entries) {
            const div=el(inline?'span':'div');
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
    let vehicleOrder=null,vehicleSelection=null,vehicleAccepting=false;
    const vehicleDialog=$('order-vehicle-dialog');
    function renderVehicleChoices() {
        if(!vehicleOrder)return;
        const s=state(),vehicles=fleetVehicles(),fragment=document.createDocumentFragment();
        for(const vehicle of vehicles) {
            const capacity=vehicleCapacity(vehicle,vehicleOrder,s),label=el('label','vehicle-picker-option');
            if(!capacity.eligible)label.classList.add('vehicle-picker-unavailable');
            const radio=el('input');radio.type='radio';radio.name='order_vehicle';radio.value=vehicle.id;radio.disabled=!capacity.eligible;
            radio.checked=vehicleSelection===vehicle.id&&capacity.eligible;
            radio.addEventListener('change',()=>{vehicleSelection=vehicle.id;$('order-vehicle-confirm').disabled=vehicleAccepting;});
            const info=el('span','vehicle-picker-info');
            info.append(el('strong','',`${vehicle.name} · ${vehicle.plate}`),el('span','',`Maximum: ${amount(vehicle.maxWeight,'kg')} / ${amount(vehicle.maxVolume,'m³')}`),el('span','',`Available: ${amount(capacity.remainingWeight,'kg')} / ${amount(capacity.remainingVolume,'m³')}`));
            if(capacity.reason)info.append(el('span','vehicle-capacity-error',capacity.reason));
            label.append(radio,info);fragment.append(label);
        }
        $('order-vehicle-options').replaceChildren(fragment);
        const selected=vehicles.find(vehicle=>vehicle.id===vehicleSelection);
        const eligible=selected&&vehicleCapacity(selected,vehicleOrder,s).eligible;
        if(!eligible)vehicleSelection=null;
        $('order-vehicle-confirm').disabled=!eligible||vehicleAccepting;
    }
    function openVehiclePicker(order) {
        vehicleOrder=order;vehicleSelection=null;
        $('order-vehicle-summary').textContent=`${order.origin} \u2192 ${order.destination} | ${amount(order.weight,'kg')} | ${amount(order.volume,'m\u00b3')}`;
        $('order-vehicle-feedback').textContent='';renderVehicleChoices();
        if(!fleetVehicles().some(vehicle=>vehicleCapacity(vehicle,order,state()).eligible))$('order-vehicle-feedback').textContent='No approved vehicle has enough available capacity for this order.';
        if(!vehicleDialog.open)vehicleDialog.showModal();
    }
    vehicleDialog.addEventListener('close',()=>{vehicleOrder=null;vehicleSelection=null;});
    $('order-vehicle-form').addEventListener('submit',async event=>{
        event.preventDefault();if(vehicleAccepting||!vehicleOrder||!vehicleSelection)return;
        vehicleAccepting=true;$('order-vehicle-confirm').disabled=true;
        try {
            if(await change('accept',vehicleOrder,null,vehicleSelection))vehicleDialog.close();
        } catch { $('order-vehicle-feedback').textContent='Could not accept this order. Please try again.'; }
        finally {vehicleAccepting=false;if(vehicleDialog.open)renderVehicleChoices();}
    });

    const podRecords = new Map();
    async function podRecord(orderId, record) {
        if (record) podRecords.set(orderId, record);
        return podRecords.get(orderId);
    }
    const podDialog=$('pod-submit-dialog'),podCanvas=$('pod-signature'),podContext=podCanvas.getContext('2d');
    let podTarget=null,podSaving=false,podInk=false,podPointer=null,podPhotoURL,podSignatureURL;
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
    function openPodSubmission(order) {
        if(podSaving || !canSubmitPod(order))return;
        podTarget=order;$('pod-submit-form').reset();releasePodPreviews();clearPodSignature();
        $('pod-photo-preview').hidden=true;$('pod-photo-preview').removeAttribute('src');
        $('pod-submit-order').textContent=order.id;
        $('pod-client-name').textContent=`Client: ${order.client}`;
        $('pod-submit-feedback').textContent='';
        $('pod-save').textContent='Save POD & complete order';
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
        const error=imageError(photo)||(signatureFile?imageError(signatureFile):!podInk?'The client signature is required. Draw it or upload an image.':'');
        if(error){$('pod-submit-feedback').textContent=error;return;}
        podSaving=true;
        const controls=[...podDialog.querySelectorAll('button,input')];controls.forEach(control=>{control.disabled=true;});
        $('pod-submit-feedback').textContent='Saving proof of delivery…';
        try {
            const signature=signatureFile||await new Promise((resolve,reject)=>podCanvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not capture the signature. Please try again.')),'image/png'));
            await Promise.all([verifyPodImage(photo),verifyPodImage(signature)]);
            if(!canSubmitPod(order))throw new Error('This order is no longer available for POD submission.');
            const savedAt=new Date().toISOString();
            await podRecord(order.id,{orderId:order.id,photo,signature,client:order.client,savedAt});
            const metadata={savedAt,client:order.client};
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
            if(!record?.photo||!record?.signature){
                section.append(el('p','pod-hint','No POD has been submitted for this order during this page session.'));
                return;
            }
            const parts=el('div','pod-parts');
            for(const [title,blob] of [['Delivery photo',record.photo],['Client signature',record.signature]]) {
                const part=el('section','pod-part'),url=URL.createObjectURL(blob);podViewURLs.push(url);
                const image=el('img','pod-preview');image.src=url;image.alt=`${title} for order ${order.id}`;
                const link=el('a','','Open full image');link.href=url;link.target='_blank';link.rel='noopener';
                part.append(el('h3','',title),image,link);parts.append(part);
            }
            section.append(parts,el('p','pod-hint',`Client: ${record.client} · Saved: ${new Date(record.savedAt).toLocaleString()}`));
        } catch(error){if(version===podViewVersion)loading.textContent=error.message;}
    }

    async function change(action,order,pod = null,vehicleId = null) {
        if(action==='accept'&&!vehicleId) {
            if(!available.checked){feedback.textContent='Set your availability to Available to accept orders.';return false;}
            openVehiclePicker(order);return false;
        }
        if(action==='completed'&&!pod) {
            const item=state().activeOrders.find(item=>item.order.id===order.id);
            if(item)openPodSubmission(item.order);
            return false;
        }
        const commit=()=>{
            const s=state();
            if(action==='accept' || action==='reject') {
                if(s.handled[order.requestKey] || !catalog().some(item=>item.requestKey===order.requestKey)) {
                    $('order-vehicle-feedback').textContent='This order has already been handled.';return false;
                }
                if(action==='accept' && !available.checked) {
                    feedback.textContent='Set your availability to Available to accept orders.';
                    $('order-vehicle-feedback').textContent=feedback.textContent;render();return false;
                }
                let assignedVehicle;
                if(action==='accept') {
                    const currentOrder=catalog().find(item=>item.requestKey===order.requestKey);
                    assignedVehicle=fleetVehicles().find(vehicle=>vehicle.id===vehicleId);
                    const capacity=currentOrder&&assignedVehicle?vehicleCapacity(assignedVehicle,currentOrder,s):null;
                    if(!capacity?.eligible) {
                        $('order-vehicle-feedback').textContent=capacity?.reason||'This order or vehicle is no longer available.';
                        renderVehicleChoices();return false;
                    }
                    order=currentOrder;
                }
                s.handled[order.requestKey]=action==='accept'?'accepted':'rejected';
                if(action==='accept'){
                    const {requestKey, ...proposal}=order;
                    order={...proposal,id:`ORD-${testRunId}-${String(++acceptedOrderNumber).padStart(2,'0')}`,...(requestKey.startsWith('cms-client-')?{clientOrderKey:requestKey.slice('cms-client-'.length)}:{})};
                    s.activeOrders.push({order:{...order,vehicleId:assignedVehicle.id,vehicle:`${assignedVehicle.name} \u00b7 ${assignedVehicle.plate}`,startedAt:new Date().toISOString()},phase:'initiated'});
                    if(!s.selectedOrderId)s.selectedOrderId=order.id;
                }
                feedback.textContent=action==='accept'?`${order.id} accepted. View it in My Orders.`:'';
            } else {
                const item=s.activeOrders.find(item=>item.order.id===order.id);
                if(!item || !orderStatuses.has(action) || item.phase===action) return;
                item.phase=action;
                item.order.statusUpdatedAt=new Date().toISOString();
                if(action==='completed') {
                    s.history.unshift({order:item.order,status:'Completed',completedAt:new Date().toISOString(),pod});
                    s.activeOrders=s.activeOrders.filter(active=>active.order.id!==order.id);
                    if(s.selectedOrderId===order.id)s.selectedOrderId=s.activeOrders[0]?.order.id||null;
                }
            }
            write(key,s);
            if(action==='accept')syncClientOrder(order,'Accepted',order.vehicle);
            else if(orderStatuses.has(action))syncClientOrder(order,{
                initiated:'Accepted',picked_up:'Picked up',in_transit:'In transit',delivery_day:'Out for delivery',completed:'Completed'
            }[action]);
            render();
            if(action==='accept')notify({type:'order',title:'Delivery accepted',message:`${order.id} is assigned to your selected vehicle.`,target:'orders',orderId:order.id});
            else if(orderStatuses.has(action))notify({type:'status',title:action==='completed'?'Delivery completed':'Delivery status updated',message:action==='completed'?`${order.id}: proof of delivery submitted.`:`${order.id}: ${orderStatuses.get(action)}.`,target:'orders',orderId:order.id});
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
    ].map(([id,client,origin,destination,distance,earnings,date])=>({status:'Completed',order:{id,client,origin,destination,distance,earnings,date,pickup:origin,dropoff:destination,vehicle:'Demo vehicle',cargo:'Parcels'}}));
    const euros = value => Number.isFinite(value) ? `€ ${new Intl.NumberFormat('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)}` : '—';
    const historyDate = item => new Date(item.completedAt || `${item.order.date}T12:00:00`);
    function showOrderDetails(order,status) {
        releasePodView();
        $('order-details-title').textContent=order.id;
        const content=$('order-details-content');
        content.replaceChildren(el('p','order-route',`${order.origin} → ${order.destination}`),details(order),el('p','',`Status: ${status}`));
        $('order-details-dialog').showModal();
        if(status==='Completed')renderPod(order,content);
    }
    function renderHistory() {
        const s=state(),unique=new Map(recentSamples.map(item=>[item.order.id,item]));
        for(const item of s.history) if(valid(item.order)) unique.set(item.order.id,item);
        const period=$('orders-period').value;
        const normalize=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
        const search=normalize($('orders-search').value.trim());
        const cutoff=new Date();cutoff.setHours(0,0,0,0);cutoff.setDate(cutoff.getDate()-Number(period));
        const rows=[...unique.values()].filter(item=>{
            if(period!=='all' && (item.status!=='Completed' || !(historyDate(item)>=cutoff))) return false;
            return normalize(`${item.order.id} ${item.order.client} ${item.order.origin} ${item.order.destination} ${item.status}`).includes(search);
        }).sort((a,b)=>(historyDate(b).getTime()||0)-(historyDate(a).getTime()||0));
        const fragment=document.createDocumentFragment();
        for(const item of rows) {
            const o=item.order,tr=el('tr');
            const date=historyDate(item);
            for(const value of [o.id,o.client,`${o.origin} → ${o.destination}`,Number.isFinite(o.distance)?`${o.distance.toFixed(1)} km`:'—',euros(o.earnings),Number.isNaN(date.getTime())?'—':date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})]) tr.append(el('td','',value));
            const action=el('td'),button=el('button','history-view','View Details');button.type='button';button.setAttribute('aria-label',`View details for order ${o.id}`);
            button.addEventListener('click',()=>showOrderDetails(o,item.status));action.append(button);tr.append(action);fragment.append(tr);
        }
        $('orders-history-body').replaceChildren(fragment);
        $('orders-history-empty').hidden=rows.length>0;
        $('history-title').textContent=period==='all'?'Order history.':'Recent deliveries.';
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
    for(const [value,label]of orderStatuses) {
        const option=el('label','order-status-option'),radio=el('input');
        radio.type='radio';radio.name='order_status';radio.value=value;radio.required=true;
        option.append(radio,el('span','',label));$('order-status-options').append(option);
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
        if(!orderStatuses.has(value)) { $('order-status-error').textContent='Select a status.';return; }
        if(value===item.phase) {statusDialog.close();return;}
        statusSaving=true;$('save-order-status').disabled=true;
        try {
            // Completion keeps the existing mandatory POD flow before moving into history.
            if(value==='completed') {statusDialog.close();await change(value,item.order);}
            else if(await change(value,item.order))statusDialog.close();
            else $('order-status-error').textContent='Could not update this order. Please try again.';
        } catch { $('order-status-error').textContent='Could not update this order. Please try again.'; }
        finally {statusSaving=false;$('save-order-status').disabled=false;}
    });

    function renderHomeActiveOrders(s) {
        const fragment=document.createDocumentFragment();
        for(const item of s.activeOrders) {
            const order=item.order,card=el('a','active-delivery-link');
            card.href='#orders';
            card.append(el('strong','',order.id),el('span','home-active-destination',`Destination: ${order.dropoff || order.destination}`),el('span','status-badge status-live',orderStatuses.get(item.phase)),el('span','hero-delivery-action','View delivery \u2192'));
            card.addEventListener('click',()=>{
                const current=state();
                if(!current.activeOrders.some(active=>active.order.id===order.id))return;
                current.selectedOrderId=order.id;write(key,current);render();
            });
            fragment.append(card);
        }
        $('home-active-orders-list').replaceChildren(fragment);
        $('home-active-orders-empty').hidden=s.activeOrders.length>0;
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
            field.setCustomValidity(!field.value.trim()?'Este campo \u00e9 obrigat\u00f3rio.':'');
        }
        const active=state().activeOrders.some(item=>item.order.id===incidentOrder.value);
        if(incidentOrder.value && !active)incidentOrder.setCustomValidity('Selecione uma encomenda ativa.');
        if(!incidentForm.reportValidity())return;
        incidentForm.querySelector('[role="status"]').textContent='';
        sosNotification.hidden=false;
        $('sos-success-message').textContent='O pedido de SOS foi submetido com sucesso.';
        notify({type:'sos',title:'SOS request submitted',message:`Incident reported for ${incidentOrder.value}.`,target:'orders',orderId:incidentOrder.value});
        location.hash='home';
    });
    const deliveryRoute=createDeliveryRoute();
    function createDeliveryRoute() {
        const services={geocode:'https://photon.komoot.io/api/',route:'https://router.project-osrm.org/route/v1/driving/',style:'https://tiles.openfreemap.org/styles/positron'};
        const container=$('delivery-map'),status=$('delivery-map-status'),retry=$('retry-delivery-route');
        const geocodes=new Map(),routes=new Map();
        let order=null,routeKey='',loadedKey='',busyKey='',failedKey='',version=0,map,mapReady,library,workerURL,backgroundError=false;
        let markers=[];
        let geocodeQueue=Promise.resolve(),lastGeocode=0;
        function cached(cache,key,load) {
            if(!cache.has(key)) {
                const promise=load().catch(error=>{if(cache.get(key)===promise)cache.delete(key);throw error;});
                cache.set(key,promise);
            }
            return cache.get(key);
        }
        function mapRuntimeSource(source) {
            // Keep executable code and licence notices; exclude debug mappings absent from this app.
            return source.replace(/^\s*\/\/[#@]\s*sourceMappingURL=.*$/gm,'');
        }
        async function loadMapAsset(type,url) {
            const runtimeURL=type==='script'?URL.createObjectURL(new Blob([mapRuntimeSource(await mapRequest(url,'text'))],{type:'application/javascript'})):null;
            return new Promise((resolve,reject)=>{
                const element=document.createElement(type);
                if(type==='link') {element.rel='stylesheet';element.href=url;} else element.src=runtimeURL;
                element.crossOrigin='anonymous';
                const release=()=>{if(runtimeURL)URL.revokeObjectURL(runtimeURL);};
                const timer=setTimeout(()=>{element.remove();release();reject(new Error('The map library took too long to load.'));},15000);
                element.onload=()=>{clearTimeout(timer);release();resolve();};
                element.onerror=()=>{clearTimeout(timer);element.remove();release();reject(new Error('The map library could not be loaded.'));};
                document.head.append(element);
            });
        }
        function mapLibrary() {
            if(!library) {
                // The classic bundle uses classic workers, which also work from file:// pages.
                library=Promise.all([
                    loadMapAsset('link','https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.css'),
                    loadMapAsset('script','https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl-csp.js'),
                    mapRequest('https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl-csp-worker.js','text')
                ]).then(([, ,workerSource])=>{
                    const M=window.maplibregl;
                    if(!M)throw new Error('The map library is unavailable.');
                    // The explicit classic worker works from file://; omit its unavailable debug-only map.
                    const source=mapRuntimeSource(workerSource);
                    workerURL=URL.createObjectURL(new Blob([source],{type:'application/javascript'}));
                    M.setWorkerUrl(workerURL);
                    return M;
                }).catch(error=>{library=null;throw error;});
            }
            return library;
        }
        function safeNumericFilters(expression) {
            if(!Array.isArray(expression))return expression;
            const result=expression.map(value=>Array.isArray(value)?safeNumericFilters(value):value);
            const [operator,property,bound]=result;
            if(['<','<=','>','>='].includes(operator)&&Array.isArray(property)&&property[0]==='get'&&Number.isFinite(bound)) {
                // Missing/non-numeric attributes must fail the comparison rather than emit worker warnings.
                const fallback=operator.startsWith('<')?bound+1:bound-1;
                result[1]=['to-number',['coalesce',property,fallback],fallback];
            }
            return result;
        }
        function prepareMap(M) {
            if(mapReady)return mapReady;
            mapReady=(async()=>{
                const style=await mapRequest(services.style);
                for(const layer of style.layers||[])if(layer.filter)layer.filter=safeNumericFilters(layer.filter);
                const view=new M.Map({container,style,center:[-8.6291,41.1579],zoom:12,attributionControl:true});
                map=view;backgroundError=false;
                view.scrollZoom.disable();view.addControl(new M.NavigationControl({showCompass:false}),'top-left');
                await new Promise((resolve,reject)=>{
                    const timer=setTimeout(()=>reject(new Error('The map background took too long to load.')),20000);
                    view.once('style.load',()=>{clearTimeout(timer);resolve();});
                    view.on('error',()=>{
                        if(map!==view)return;
                        backgroundError=true;
                        status.textContent='Could not load the map background. Please try again.';
                        retry.hidden=false;
                        if(!view.isStyleLoaded()) {clearTimeout(timer);reject(new Error('Could not load the map background. Please try again.'));}
                    });
                });
            })().catch(error=>{map?.remove();map=null;mapReady=null;throw error;});
            return mapReady;
        }
        async function mapRequest(url,responseType='json') {
            const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
            try {
                const response=await fetch(url,{signal:controller.signal,credentials:'omit'});
                if(response.status===429)throw new Error('The map service is busy. Please try again shortly.');
                if(!response.ok)throw new Error('The map service is temporarily unavailable.');
                return await (responseType==='text'?response.text():response.json());
            } catch(error) {
                if(error.name==='AbortError')throw new Error('The map request timed out. Please try again.');
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
                    const feature=result.features?.find(feature=>feature.geometry?.type==='Point'&&feature.geometry.coordinates?.length===2&&feature.geometry.coordinates.every(Number.isFinite)&&(!feature.properties?.countrycode||feature.properties.countrycode.toUpperCase()==='PT'));
                    if(!feature)throw new Error(`Address not found: ${query}.`);
                    return feature.geometry.coordinates;
                });
                geocodeQueue=task.catch(()=>{});return task;
            });
        }
        function clear() {
            if(map?.getSource('delivery-route'))map.getSource('delivery-route').setData({type:'FeatureCollection',features:[]});
            markers.forEach(marker=>marker.remove());markers=[];loadedKey='';
            $('tracking-distance').textContent='\u2014';$('tracking-eta').textContent='\u2014';
        }
        async function refresh() {
            if(!order||container.closest('[data-courier-view]').hidden)return;
            if(map)map.resize();
            if(loadedKey===routeKey||busyKey===routeKey||failedKey===routeKey)return;
            const selected=order,key=routeKey,token=version;busyKey=key;retry.hidden=true;
            status.textContent='Loading map\u2026';container.setAttribute('aria-busy','true');
            try {
                const M=await mapLibrary();if(token!==version)return;
                await prepareMap(M);if(token!==version)return;
                status.textContent='Locating pickup and destination\u2026';
                const result=await cached(routes,key,async()=>{
                    const start=await geocode(address(selected.pickup,selected.origin));
                    const end=await geocode(address(selected.dropoff,selected.destination));
                    if(token===version)status.textContent='Calculating the road route\u2026';
                    const data=await mapRequest(`${services.route}${start.join(',')};${end.join(',')}?overview=full&geometries=geojson&steps=false`);
                    const route=data.routes?.[0];
                    if(data.code!=='Ok'||route?.geometry?.type!=='LineString'||route.geometry.coordinates.length<2||!route.geometry.coordinates.every(point=>point.length>=2&&point.every(Number.isFinite))||!Number.isFinite(route.distance)||!Number.isFinite(route.duration))throw new Error('No road route was found between these addresses.');
                    return {start,end,route};
                });
                if(token!==version)return;
                selected.distance=result.route.distance/1000;
                const data={type:'Feature',properties:{},geometry:result.route.geometry};
                if(map.getSource('delivery-route'))map.getSource('delivery-route').setData(data);
                else {
                    map.addSource('delivery-route',{type:'geojson',data});
                    map.addLayer({id:'delivery-route-line',type:'line',source:'delivery-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#13866d','line-width':6}});
                }
                markers.forEach(marker=>marker.remove());markers=[];
                for(const [point,label,color]of [[result.start,'Pickup','#13866d'],[result.end,'Destination','#083e43']]) {
                    const marker=new M.Marker({color}).setLngLat(point).setPopup(new M.Popup({offset:25}).setText(label)).addTo(map);
                    marker.getElement().setAttribute('aria-label',label);marker.getElement().title=label;markers.push(marker);
                }
                const bounds=new M.LngLatBounds();result.route.geometry.coordinates.forEach(point=>bounds.extend(point));
                map.resize();map.fitBounds(bounds,{padding:40,maxZoom:16,duration:0});
                $('tracking-distance').textContent=`${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:1}).format(result.route.distance/1000)} km`;
                $('tracking-eta').textContent=`${Math.max(1,Math.ceil(result.route.duration/60))} min`;
                status.textContent=backgroundError?'The route is ready, but the map background could not be loaded. Please try again.':'Road route from pickup to destination. Driving time excludes live traffic.';
                retry.hidden=!backgroundError;
                loadedKey=key;
            } catch(error) {
                if(token!==version)return;
                clear();status.textContent=error instanceof TypeError?'Could not contact the map service. Please try again.':error.message;
                failedKey=key;retry.hidden=false;
            } finally {
                if(busyKey===key)busyKey='';
                if(token===version)container.setAttribute('aria-busy','false');
            }
        }
        retry.addEventListener('click',()=>{
            if(backgroundError&&map) {markers.forEach(marker=>marker.remove());markers=[];map.remove();map=null;mapReady=null;}
            loadedKey='';failedKey='';refresh();
        });
        window.addEventListener('hashchange',()=>requestAnimationFrame(refresh));
        window.addEventListener('pagehide',event=>{if(!event.persisted&&workerURL)URL.revokeObjectURL(workerURL);});
        if(window.ResizeObserver)new ResizeObserver(()=>{if(map)map.resize();}).observe(container);
        return {update(next) {
            const key=next?JSON.stringify([next.id,next.pickup,next.origin,next.dropoff,next.destination]):'';
            if(key!==routeKey) {version++;routeKey=key;order=next;failedKey='';clear();retry.hidden=true;container.setAttribute('aria-busy','false');}
            refresh();
        }};
    }
    function render() {
        const s=state(),selection=selectedOrder(s),active=selection?.order,phase=selection?.phase;
        const pending=available.checked ? catalog().filter(o=>!s.handled[o.requestKey]) : [];
        const fragment=document.createDocumentFragment();
        for(const order of pending) {
            const card=el('article','available-order');
            const heading=el('div','available-order-heading');
            heading.append(el('span','new-order-badge','New delivery'));
            card.append(heading,el('h3','order-route',`${order.origin} → ${order.destination}`),details(order, true));
            const actions=el('div','available-order-actions');
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
                button.type='button';button.disabled=action==='accept' && !available.checked;
                button.setAttribute('aria-label',`${action==='accept'?'Accept':'Reject'} delivery from ${order.origin} to ${order.destination}`);
                button.addEventListener('click',()=>change(action,order));actions.append(button);
            } card.append(actions);fragment.append(card);
        }
        $('available-orders-list').replaceChildren(fragment);
        $('available-orders-list').hidden=!available.checked;
        $('available-orders-count').textContent=String(pending.length);
        $('available-orders-count').hidden=false;
        $('available-orders-empty').hidden=pending.length>0;
        if(!available.checked) {
            feedback.textContent='';
            if(vehicleDialog.open)vehicleDialog.close();
        }

        $('active-order-empty').hidden=!!active;
        $('active-orders').hidden=!active;
        $('header-availability').textContent=available.checked?'Available':'Unavailable';
        renderHomeActiveOrders(s);

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
            $('active-order-started').textContent=`Started at ${new Date(order.startedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
            $('order-earnings').textContent=euros(order.earnings);
            const vehicle=fleetVehicles().find(vehicle=>order.vehicleId===vehicle.id||order.vehicle.includes(vehicle.plate));
            const load=vehicle?vehicleCapacity(vehicle,{weight:0,volume:0},s):null;
            const capacity=load?Math.round(Math.max(load.usedWeight/vehicle.maxWeight,load.usedVolume/vehicle.maxVolume)*100):undefined;
            $('order-capacity').textContent=Number.isFinite(capacity)?`${capacity}%`:'\u2014';
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

    resetTestRun();
    available.checked=true;available.dispatchEvent(new Event('change'));
    available.addEventListener('change',render);
    const notifiedOfferKeys=new Set();
    function notifyNewOffers() {
        const current=state();
        for(const offer of catalog()) {
            if(current.handled[offer.requestKey]||notifiedOfferKeys.has(offer.requestKey))continue;
            notifiedOfferKeys.add(offer.requestKey);
            notify({type:'order',title:'New delivery offer',message:`${offer.origin} \u2192 ${offer.destination} | ${euros(offer.earnings)}`,target:'home'});
        }
    }
    window.addEventListener('cms:orders-updated',()=>{render();notifyNewOffers();});
    window.addEventListener('pageshow',render);
    window.addEventListener('storage',event=>{if(event.key===clientOrdersKey)render();});
    render();
    notifyNewOffers();
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
    const vehicleSelect=document.getElementById('statistics-vehicle');
    const periodButtons=[...root.querySelectorAll('[data-statistics-period]')];
    const periods={
        '7D':{days:7,scale:.23,points:7},'30D':{days:30,scale:1,points:30},
        '3M':{days:90,scale:3,points:13},'6M':{days:180,scale:6,points:6},
        '1Y':{days:365,scale:12.2,points:12},'ALL':{days:540,scale:18,points:18}
    };
    const sample={trips:248,earnings:3842,distance:7420,vehicleTrips:126,vehicleDistance:4820,ratings:186};
    const shape=[7,9,8,10,8,6,9,12,11,10,12,10,8,13,14,11,10,9,12,10,11,15,12,11,13,12,16,13,14,17];
    const number=new Intl.NumberFormat('en-GB',{maximumFractionDigits:0});
    const money=new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR',maximumFractionDigits:0});
    let period='30D';
    const metric='earnings';
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
        const config=periods[period],totals=values(),series=sampleSeries(totals[metric],config.points);
        const width=Math.max(240,Math.round(host.getBoundingClientRect().width||900));
        const height=width<500?260:320,left=58,right=16,top=18,bottom=height-40;
        const maximum=Math.max(...series),power=10**Math.floor(Math.log10(Math.max(1,maximum/4)));
        const step=[1,2,5,10].find(value=>value*power>=maximum/4)*power,ceiling=step*4;
        const label=value=>money.format(value);
        const svg=svgNode('svg',{viewBox:`0 0 ${width} ${height}`,role:'img','aria-labelledby':'statistics-svg-title statistics-svg-description'});
        const title=metric.charAt(0).toUpperCase()+metric.slice(1);
        const end=new Date();end.setHours(12,0,0,0);
        const start=new Date(end);start.setDate(end.getDate()-config.days+1);
        const dateLabel=date=>new Intl.DateTimeFormat('en-GB',config.days>180?{month:'short',year:'2-digit'}:{day:'numeric',month:'short'}).format(date);
        const range=`${new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(start)} – ${new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(end)}`;
        svg.append(svgNode('title',{id:'statistics-svg-title'},`${title} over time`),svgNode('desc',{id:'statistics-svg-description'},`Sample ${metric} across ${config.days} days. Total ${money.format(totals.earnings)}. Use the arrow keys to explore earnings for each point.`));
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
        const average=totals[metric]/series.length;
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
        const peakIndex=series.indexOf(maximum);
        set('statistics-chart-total-label',`Total ${metric}`);set('statistics-chart-total',formatValue(totals[metric]));
        set('statistics-chart-insight',`${interval} average: ${formatValue(average)} \u00b7 Best ${interval==='Daily'?'day':interval==='Weekly'?'week':'month'}: ${formatValue(maximum)} (${dateLabel(dates[peakIndex])})`);
        set('statistics-chart-series-label',`${interval} ${metric}`);
        const tickCount=width<500?3:5;
        for(let i=0;i<tickCount;i++) {
            const index=Math.round((series.length-1)*i/(tickCount-1));
            const date=new Date(start);date.setDate(start.getDate()+Math.round((config.days-1)*index/(series.length-1)));
            svg.append(svgNode('text',{x:points[index].x,y:height-10,'text-anchor':i===0?'start':i===tickCount-1?'end':'middle'},dateLabel(date)));
        }
        host.replaceChildren(svg);
        set('statistics-chart-range',range);
    }
    function renderStatistics() {
        const total=values();
        set('statistics-trips',number.format(total.trips));set('statistics-earnings',money.format(total.earnings));set('statistics-distance',number.format(total.distance));
        set('statistics-earnings-per-km',new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(total.earnings/total.distance));
        const share=Math.round(total.vehicleTrips/total.trips*100);
        const progress=document.getElementById('statistics-vehicle-share');progress.value=share;progress.textContent=`${share}%`;
        root.querySelector('label[for="statistics-vehicle-share"]').textContent=`${share}% of all trips`;
        set('statistics-vehicle-trips',number.format(total.vehicleTrips));set('statistics-vehicle-distance',number.format(total.vehicleDistance));set('statistics-rating-count',number.format(total.ratings));
        periodButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.statisticsPeriod===period)));
        renderChart();
    }
    periodButtons.forEach(button=>button.addEventListener('click',()=>{period=button.dataset.statisticsPeriod;renderStatistics();}));
    document.querySelectorAll('.fleet-vehicle[data-vehicle-id]').forEach(card=>{
        const option=document.createElement('option');option.value=card.dataset.vehicleId;
        option.textContent=`${card.querySelector('h3').textContent.trim()} · ${card.querySelector('.plate').textContent.trim()}`;
        vehicleSelect.append(option);
    });
    vehicleSelect.addEventListener('change',()=>set('statistics-data-note',vehicleSelect.value==='all'?'Sample data · All vehicles':'Sample data · Vehicle filtering is a preview; totals include all vehicles.'));
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
        if (field.required && !field.value.trim()) return 'Este campo \u00e9 obrigat\u00f3rio.';
        if (field.validity.typeMismatch) return 'Introduza um endere\u00e7o de e-mail v\u00e1lido.';
        if (field.validity.patternMismatch) return 'Preencha este campo no formato indicado.';
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
