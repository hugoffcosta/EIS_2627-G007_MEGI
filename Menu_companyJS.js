(() => {
    'use strict';

    const $=id=>document.getElementById(id);
    const addDays=(date,days)=>new Date(date.getTime()+days*86400000);
    const addMinutes=(date,minutes)=>new Date(date.getTime()+minutes*60000);
    const isoDate=date=>date.toISOString().slice(0,10);
    const now=new Date();
    const dateFormat=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const dateTimeFormat=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

    const company={companyName:'Porto Express Logistics',companyId:'COMP-2026-7A4K92QX'};
    document.querySelectorAll('[data-company-name]').forEach(node=>node.textContent=company.companyName);
    document.querySelectorAll('[data-company-id]').forEach(node=>node.textContent=company.companyId);
    document.querySelectorAll('[data-company-initials]').forEach(node=>node.textContent=company.companyName.split(/\s+/).map(word=>word[0]).slice(0,2).join('').toUpperCase());

    const vehicles=[
        {id:'VEH-001',type:'Van',brand:'Mercedes-Benz',model:'Sprinter',plate:'AA-12-BB',year:2024,color:'White',fuel:'Diesel',status:'in_use',courierId:'CR-00284',orderId:'ORD-CM-2601',approval:'approved',docs:[['Registration certificate',120],['Inspection certificate',190],['Insurance certificate',12]]},
        {id:'VEH-002',type:'Van',brand:'Renault',model:'Kangoo',plate:'34-CD-56',year:2023,color:'Silver',fuel:'Diesel',status:'parked',courierId:null,orderId:null,approval:'approved',docs:[['Registration certificate',280],['Inspection certificate',75],['Insurance certificate',160]]},
        {id:'VEH-003',type:'Van',brand:'Ford',model:'Transit',plate:'78-EF-90',year:2022,color:'Blue',fuel:'Diesel',status:'in_use',courierId:'CR-00319',orderId:'ORD-CM-2602',approval:'approved',docs:[['Registration certificate',330],['Inspection certificate',28],['Insurance certificate',220]]},
        {id:'VEH-004',type:'Van',brand:'Toyota',model:'Proace',plate:'GH-12-IJ',year:2021,color:'White',fuel:'Diesel',status:'parked',courierId:null,orderId:null,approval:'approved',docs:[['Registration certificate',145],['Inspection certificate',92],['Insurance certificate',-7]]},
        {id:'VEH-005',type:'Van',brand:'Peugeot',model:'e-Partner',plate:'KL-34-MN',year:2026,color:'Green',fuel:'Electric',status:'pending',courierId:null,orderId:null,approval:'pending',docs:[['Registration certificate',null],['Inspection certificate',null],['Insurance certificate',null]]},
        {id:'VEH-006',type:'Motorcycle',brand:'Honda',model:'PCX',plate:'OP-56-QR',year:2024,color:'Black',fuel:'Gasoline',status:'in_use',courierId:'CR-00407',orderId:'ORD-CM-2603',approval:'approved',docs:[['Registration certificate',215],['Inspection certificate',null,'Not required'],['Insurance certificate',21]]}
    ].map(vehicle=>({...vehicle,docs:vehicle.docs.map(([name,days,note])=>({name,expiry:Number.isFinite(days)?isoDate(addDays(now,days)):null,note:note||''}))}));
    const couriers=[
        {id:'CR-00284',name:'João Silva',email:'joao.silva@example.com',phone:'912 345 678',status:'on_delivery',mode:'express',vehicleId:'VEH-001',orderId:'ORD-CM-2601',rating:4.9,deliveries:248},
        {id:'CR-00319',name:'Maria Fernandes',email:'maria.fernandes@example.com',phone:'913 480 221',status:'on_delivery',mode:'standard',vehicleId:'VEH-003',orderId:'ORD-CM-2602',rating:4.8,deliveries:194},
        {id:'CR-00407',name:'Tiago Costa',email:'tiago.costa@example.com',phone:'916 229 430',status:'on_delivery',mode:'express',vehicleId:'VEH-006',orderId:'ORD-CM-2603',rating:4.7,deliveries:121},
        {id:'CR-00438',name:'Ana Martins',email:'ana.martins@example.com',phone:'919 885 106',status:'available',mode:'standard',vehicleId:null,orderId:null,rating:4.9,deliveries:87},
        {id:'CR-00452',name:'Rui Oliveira',email:'rui.oliveira@example.com',phone:'914 113 762',status:'offline',mode:'express',vehicleId:null,orderId:null,rating:4.6,deliveries:74}
    ];

    const liveOrders=[
        {id:'ORD-CM-2601',client:'Sofia Almeida',origin:'Rua da Universidade, Porto',destination:'Avenida dos Aliados, Porto',courierId:'CR-00284',vehicleId:'VEH-001',service:'express',status:'in_transit',expectedAt:addMinutes(now,42),distance:8.4,cargo:'4 parcels · 48 kg'},
        {id:'ORD-CM-2602',client:'Norte Office, Lda.',origin:'Matosinhos',destination:'Vila Nova de Gaia',courierId:'CR-00319',vehicleId:'VEH-003',service:'standard',status:'picked_up',expectedAt:addMinutes(now,71),distance:17.6,cargo:'12 parcels · 210 kg'},
        {id:'ORD-CM-2603',client:'Miguel Lopes',origin:'Boavista, Porto',destination:'Foz do Douro, Porto',courierId:'CR-00407',vehicleId:'VEH-006',service:'express',status:'delivery_day',expectedAt:addMinutes(now,29),distance:6.2,cargo:'1 parcel · 3 kg'}
    ];

    const historySeed=[
        ['ORD-CM-2598','Clínica Central','Porto','Maia','CR-00284','VEH-001','express','completed',-1],
        ['ORD-CM-2597','Rita Sousa','Matosinhos','Porto','CR-00319','VEH-003','standard','completed',-2],
        ['ORD-CM-2596','Tech Norte','Porto','Braga','CR-00284','VEH-001','standard','completed',-3],
        ['ORD-CM-2595','Paulo Rocha','Gaia','Porto','CR-00407','VEH-006','express','cancelled',-4],
        ['ORD-CM-2594','Farmácia Nova','Maia','Gondomar','CR-00319','VEH-003','express','completed',-5],
        ['ORD-CM-2593','Inês Dias','Porto','Matosinhos','CR-00438','VEH-002','standard','completed',-7],
        ['ORD-CM-2592','ACME Portugal','Gaia','Aveiro','CR-00284','VEH-001','standard','completed',-9],
        ['ORD-CM-2591','Carlos Pinto','Porto','Gaia','CR-00407','VEH-006','express','completed',-12]
    ];
    const history=historySeed.map(([id,client,origin,destination,courierId,vehicleId,service,status,days])=>({id,client,origin,destination,courierId,vehicleId,service,status,date:addDays(now,days),cancellation:status==='cancelled'?'Customer unavailable at the delivery address.':''}));

    const vehicle=id=>vehicles.find(item=>item.id===id);
    const courier=id=>couriers.find(item=>item.id===id);
    const liveOrder=id=>liveOrders.find(item=>item.id===id);
    const statusLabel=value=>({in_use:'In use',parked:'Parked',pending:'Pending approval',on_delivery:'On delivery',available:'Available',offline:'Offline',in_transit:'In transit',picked_up:'Picked up',delivery_day:'Delivery day',completed:'Completed',cancelled:'Cancelled'}[value]||value);
    const statusClass=value=>`status-${value.replaceAll('_','-')}`;

    function documentState(doc) {
        if(!doc.expiry)return doc.note==='Not required'?{level:'valid',label:'Not required',days:null}:{level:'pending',label:'Pending review',days:null};
        const days=Math.ceil((new Date(`${doc.expiry}T23:59:59`).getTime()-Date.now())/86400000);
        if(days<0)return {level:'expired',label:`Expired ${Math.abs(days)} day${Math.abs(days)===1?'':'s'} ago`,days};
        if(days<=30)return {level:'warning',label:`Expires in ${days} day${days===1?'':'s'}`,days};
        return {level:'valid',label:`Valid until ${dateFormat.format(new Date(`${doc.expiry}T12:00:00`))}`,days};
    }
    function documentHealth(item) {
        if(item.approval==='pending')return {level:'pending',label:'Pending review'};
        const states=item.docs.map(documentState);
        if(states.some(state=>state.level==='expired'))return {level:'expired',label:'Expired document'};
        if(states.some(state=>state.level==='warning'))return {level:'warning',label:'Expiring soon'};
        return {level:'valid',label:'All valid'};
    }
    function renderOperationalSummary() {
        $('overview-vehicle-count').textContent=vehicles.length;
        $('overview-courier-count').textContent=couriers.length;
        $('overview-vehicle-list').innerHTML=vehicles.map(item=>{const person=courier(item.courierId);return `<li class="overview-list-row"><div class="overview-list-primary"><span class="overview-list-icon" aria-hidden="true">${item.type==='Motorcycle'?'MC':'VAN'}</span><div><strong>${esc(item.brand)} ${esc(item.model)}</strong><small>${esc(item.plate)} · ${esc(item.id)}</small></div></div><span class="overview-list-detail"><small>Status</small><span class="company-status-pill ${statusClass(item.status)}">${esc(statusLabel(item.status))}</span></span><span class="overview-list-detail"><small>Assigned courier</small><strong>${person?esc(person.name):'Not assigned'}</strong></span></li>`;}).join('');
        $('overview-courier-list').innerHTML=couriers.map(person=>{const initials=person.name.split(/\s+/).map(part=>part[0]).slice(0,2).join('');return `<li class="overview-list-row"><div class="overview-list-primary"><span class="overview-list-icon" aria-hidden="true">${esc(initials)}</span><div><strong>${esc(person.name)}</strong><small>${esc(person.id)}</small></div></div><span class="overview-list-detail"><small>Status</small><span class="company-status-pill ${statusClass(person.status)}">${esc(statusLabel(person.status))}</span></span><span class="overview-list-detail"><small>Work mode</small><span class="work-mode-pill work-mode-${esc(person.mode)}">${esc(person.mode)}</span></span></li>`;}).join('');
        $('company-current-date').dateTime=isoDate(now);
        $('company-current-date').textContent=dateFormat.format(now);
    }

    function warnings() {
        return vehicles.flatMap(item=>item.docs.map(doc=>({vehicle:item,doc,state:documentState(doc)}))).filter(item=>['warning','expired'].includes(item.state.level)).sort((a,b)=>(a.state.days??999)-(b.state.days??999));
    }
    function renderWarnings() {
        const rows=warnings();
        $('document-warning-list').innerHTML=rows.length?rows.map(({vehicle:item,doc,state})=>`<article class="document-warning${state.level==='expired'?' is-expired':''}"><div><strong>${esc(item.brand)} ${esc(item.model)}</strong><small>${esc(item.plate)} · ${esc(item.id)}</small></div><div><strong>${esc(doc.name)}</strong><small>${doc.expiry?`Expiry date: ${esc(dateFormat.format(new Date(`${doc.expiry}T12:00:00`)))}`:'No expiry date'}</small></div><span class="company-status-pill status-${state.level}">${esc(state.label)}</span></article>`).join(''):'<div class="company-empty-state"><strong>All documents are valid</strong><span>No vehicle documents require attention.</span></div>';
    }

    function renderOverviewOperations() {
        $('overview-live-orders').innerHTML=liveOrders.map(order=>{const person=courier(order.courierId),item=vehicle(order.vehicleId);return `<article class="overview-live-card"><p class="company-eyebrow">${esc(order.service)} · ${esc(order.id)}</p><h3>${esc(order.origin)} → ${esc(order.destination)}</h3><p>${esc(person.name)} · ${esc(item.plate)}</p></article>`;}).join('');
    }

    function fleetRows() {
        const query=$('fleet-search').value.trim().toLowerCase(),status=$('fleet-status-filter').value,docs=$('fleet-document-filter').value;
        return vehicles.filter(item=>{
            const person=courier(item.courierId),health=documentHealth(item);
            const haystack=`${item.id} ${item.brand} ${item.model} ${item.plate} ${person?.name||''}`.toLowerCase();
            return (!query||haystack.includes(query))&&(status==='all'||item.status===status)&&(docs==='all'||(docs==='attention'&&['warning','expired'].includes(health.level))||(docs==='valid'&&health.level==='valid'));
        });
    }
    function renderFleet() {
        const rows=fleetRows();
        $('fleet-table-body').innerHTML=rows.map(item=>{const person=courier(item.courierId),health=documentHealth(item);return `<tr><td><strong>${esc(item.brand)} ${esc(item.model)}</strong><small>${esc(item.plate)} · ${esc(item.type)}</small></td><td><span class="company-status-pill ${statusClass(item.status)}">${esc(statusLabel(item.status))}</span></td><td>${person?`<strong>${esc(person.name)}</strong><small>${esc(person.id)}</small>`:'<span>—</span>'}</td><td><span class="document-health is-${health.level}"><i class="document-health-dot"></i>${esc(health.label)}</span></td><td>${item.orderId?`<strong>${esc(item.orderId)}</strong><small>${esc(liveOrder(item.orderId)?.destination||'')}</small>`:'—'}</td><td><button class="table-action" type="button" data-vehicle-details="${esc(item.id)}">View details</button></td></tr>`;}).join('');
        $('fleet-empty').hidden=rows.length>0;
    }

    function renderOperations() {
        const service=$('operations-filter').value;
        const rows=liveOrders.filter(order=>service==='all'||order.service===service);
        $('live-operations-list').innerHTML=rows.map(order=>{const person=courier(order.courierId),item=vehicle(order.vehicleId);return `<article class="live-operation-card"><div><div class="operation-card-heading"><div><p class="company-eyebrow">${esc(order.service)} order</p><h2>${esc(order.id)}</h2></div><span class="company-status-pill status-in-use">${esc(statusLabel(order.status))}</span></div><div class="operation-route"><div class="operation-route-line"><span></span></div><div class="operation-route-points"><div><small>Pickup</small><strong>${esc(order.origin)}</strong></div><div><small>Destination</small><strong>${esc(order.destination)}</strong></div></div></div></div><div><div class="operation-meta"><div><span>Courier</span><strong>${esc(person.name)}</strong></div><div><span>Vehicle</span><strong>${esc(item.brand)} ${esc(item.model)} · ${esc(item.plate)}</strong></div><div><span>Expected delivery</span><strong>${esc(dateTimeFormat.format(order.expectedAt))}</strong></div><div><span>Distance</span><strong>${order.distance.toLocaleString('en-GB')} km</strong></div></div><button class="table-action" type="button" data-order-details="${esc(order.id)}">View order details →</button></div></article>`;}).join('');
    }

    function populateHistoryFilters() {
        $('history-vehicle-filter').insertAdjacentHTML('beforeend',vehicles.map(item=>`<option value="${esc(item.id)}">${esc(item.plate)} · ${esc(item.brand)} ${esc(item.model)}</option>`).join(''));
        $('history-courier-filter').insertAdjacentHTML('beforeend',couriers.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join(''));
    }
    function historyRows() {
        const query=$('history-search').value.trim().toLowerCase(),vehicleId=$('history-vehicle-filter').value,courierId=$('history-courier-filter').value,status=$('history-status-filter').value;
        return history.filter(order=>{const person=courier(order.courierId),item=vehicle(order.vehicleId),haystack=`${order.id} ${order.client} ${order.origin} ${order.destination} ${person.name} ${item.plate}`.toLowerCase();return(!query||haystack.includes(query))&&(vehicleId==='all'||order.vehicleId===vehicleId)&&(courierId==='all'||order.courierId===courierId)&&(status==='all'||order.status===status);});
    }
    function renderHistory() {
        const rows=historyRows();
        $('company-history-body').innerHTML=rows.map(order=>{const person=courier(order.courierId),item=vehicle(order.vehicleId);return `<tr><td><strong>${esc(order.id)}</strong><small>${esc(order.client)}</small></td><td><strong>${esc(order.origin)} → ${esc(order.destination)}</strong></td><td>${esc(person.name)}</td><td><strong>${esc(item.plate)}</strong><small>${esc(item.brand)} ${esc(item.model)}</small></td><td><span class="company-status-pill ${order.service==='express'?'status-warning':'status-parked'}">${esc(order.service)}</span></td><td><span class="company-status-pill ${statusClass(order.status)}">${esc(statusLabel(order.status))}</span></td><td>${esc(dateFormat.format(order.date))}</td><td><button class="table-action" type="button" data-order-details="${esc(order.id)}">View details</button></td></tr>`;}).join('');
        $('company-history-empty').hidden=rows.length>0;
    }

    function renderCouriers() {
        const query=$('courier-search').value.trim().toLowerCase(),status=$('courier-status-filter').value;
        const rows=couriers.filter(person=>{const item=vehicle(person.vehicleId),haystack=`${person.name} ${person.id} ${person.email} ${item?.plate||''} ${item?.brand||''}`.toLowerCase();return(!query||haystack.includes(query))&&(status==='all'||person.status===status);});
        $('courier-summary').innerHTML=`<span><strong>${couriers.length}</strong> approved couriers</span><span><strong>${couriers.filter(item=>item.status==='on_delivery').length}</strong> on delivery</span><span><strong>${couriers.filter(item=>item.status==='available').length}</strong> available</span>`;
        $('courier-list').innerHTML=rows.map(person=>{const item=vehicle(person.vehicleId),initials=person.name.split(/\s+/).map(part=>part[0]).slice(0,2).join('');return `<article class="courier-card"><div class="courier-card-heading"><span class="courier-photo">${esc(initials)}</span><div><h2>${esc(person.name)}</h2><p>${esc(person.id)} · ${esc(person.email)}</p></div></div><span class="company-status-pill ${statusClass(person.status)}">${esc(statusLabel(person.status))}</span><div class="courier-details"><div><span>Current vehicle</span><strong>${item?`${esc(item.brand)} ${esc(item.model)} · ${esc(item.plate)}`:'No vehicle assigned'}</strong></div><div><span>Current order</span><strong>${esc(person.orderId||'No active order')}</strong></div><div><span>Performance</span><strong>★ ${person.rating.toFixed(1)} · ${person.deliveries} deliveries</strong></div></div></article>`;}).join('');
        $('courier-empty').hidden=rows.length>0;
    }

    function showVehicleDetails(id) {
        const item=vehicle(id);if(!item)return;
        const person=courier(item.courierId);
        $('vehicle-dialog-title').textContent=`${item.brand} ${item.model} · ${item.plate}`;
        $('vehicle-dialog-content').innerHTML=`<div class="dialog-detail-grid"><div><span>Vehicle ID</span><strong>${esc(item.id)}</strong></div><div><span>Operational status</span><strong>${esc(statusLabel(item.status))}</strong></div><div><span>Type and fuel</span><strong>${esc(item.type)} · ${esc(item.fuel)}</strong></div><div><span>Year and colour</span><strong>${item.year} · ${esc(item.color)}</strong></div><div><span>Current courier</span><strong>${esc(person?.name||'Not assigned')}</strong></div><div><span>Current order</span><strong>${esc(item.orderId||'No active order')}</strong></div></div><div class="dialog-documents"><h3>Document status</h3>${item.docs.map(doc=>{const state=documentState(doc);return `<div class="dialog-document-row"><span>${esc(doc.name)}</span><span class="company-status-pill status-${state.level}">${esc(state.label)}</span></div>`;}).join('')}</div>`;
        $('vehicle-details-dialog').showModal();
    }
    function showOrderDetails(id) {
        const order=liveOrders.find(item=>item.id===id)||history.find(item=>item.id===id);if(!order)return;
        const person=courier(order.courierId),item=vehicle(order.vehicleId),isLive=liveOrders.includes(order);
        $('order-dialog-title').textContent=order.id;
        $('order-dialog-content').innerHTML=`<div class="dialog-detail-grid"><div><span>Client</span><strong>${esc(order.client)}</strong></div><div><span>Status</span><strong>${esc(statusLabel(order.status))}</strong></div><div><span>Pickup</span><strong>${esc(order.origin)}</strong></div><div><span>Destination</span><strong>${esc(order.destination)}</strong></div><div><span>Courier</span><strong>${esc(person.name)} · ${esc(person.id)}</strong></div><div><span>Vehicle</span><strong>${esc(item.brand)} ${esc(item.model)} · ${esc(item.plate)}</strong></div><div><span>Service</span><strong>${esc(order.service)}</strong></div><div><span>${isLive?'Expected delivery':'Order date'}</span><strong>${esc(isLive?dateTimeFormat.format(order.expectedAt):dateFormat.format(order.date))}</strong></div>${isLive?`<div><span>Distance</span><strong>${order.distance.toLocaleString('en-GB')} km</strong></div><div><span>Cargo</span><strong>${esc(order.cargo)}</strong></div>`:''}${order.cancellation?`<div><span>Cancellation reason</span><strong>${esc(order.cancellation)}</strong></div>`:''}</div>`;
        $('order-details-dialog').showModal();
    }

    let notifications=warnings().map(({vehicle:item,doc,state},index)=>({id:index+1,title:state.level==='expired'?'Document expired':'Document expiring soon',message:`${item.plate}: ${doc.name.toLowerCase()} — ${state.label}.`,vehicleId:item.id}));
    function renderNotifications() {
        const list=$('company-notification-list'),count=$('company-notification-count');
        count.textContent=String(notifications.length);count.hidden=!notifications.length;
        $('company-notification-empty').hidden=notifications.length>0;
        $('clear-company-notifications').disabled=!notifications.length;
        list.innerHTML=notifications.map(note=>`<li class="company-notification-item"><span class="company-notification-icon">!</span><button class="company-notification-body table-action" type="button" data-notification-vehicle="${esc(note.vehicleId)}"><strong>${esc(note.title)}</strong><span>${esc(note.message)}</span></button><button class="company-notification-remove" type="button" data-remove-notification="${note.id}" aria-label="Delete notification">×</button></li>`).join('');
    }

    let companyVehicleFormIndex=0;
    function companyVehicleCard() {
        const index=companyVehicleFormIndex++;
        return `<section class="company-vehicle-form-card" data-company-vehicle-card="${index}"><div class="company-vehicle-card-heading"><h3>Vehicle</h3><button type="button" class="company-vehicle-remove" data-remove-company-vehicle>Remove vehicle</button></div><div class="company-vehicle-type-group"><span>Vehicle Type *</span><div class="company-vehicle-types">${[['motorcycle','Motorcycle'],['car','Car'],['van','Van'],['truck','Truck']].map(([value,label],optionIndex)=>`<label><input type="radio" name="company-vehicle-type-${index}" value="${value}"${optionIndex===0?' required':''}><span>${label}</span></label>`).join('')}</div></div><div class="company-vehicle-fields"><label class="company-vehicle-field"><span>Brand *</span><input name="brand" type="text" maxlength="80" placeholder="e.g. Mercedes-Benz" required></label><label class="company-vehicle-field"><span>Model *</span><input name="model" type="text" maxlength="80" placeholder="e.g. Sprinter" required></label><label class="company-vehicle-field"><span>Color *</span><input name="color" type="text" maxlength="50" placeholder="e.g. White" required></label><label class="company-vehicle-field"><span>Year *</span><input name="year" type="text" inputmode="numeric" maxlength="4" pattern="20(?:[01][0-9]|2[0-6])" title="Enter a year between 2000 and 2026." placeholder="2026" required></label><label class="company-vehicle-field"><span>License Plate *</span><input name="plate" type="text" maxlength="8" placeholder="AA-12-BB" required></label><label class="company-vehicle-field"><span>Fuel Type *</span><select name="fuel" required><option value="">Select fuel type</option><option value="Diesel">Diesel</option><option value="Gasoline">Gasoline</option><option value="Gas">Gas</option><option value="Electric">Electric</option><option value="Hybrid">Hybrid</option></select></label><label class="company-vehicle-field"><span>Maximum Weight (kg) *</span><input name="maxWeight" type="text" inputmode="numeric" placeholder="3500" required></label><label class="company-vehicle-field"><span>Maximum Volume (m³) *</span><input name="maxVolume" type="text" inputmode="decimal" placeholder="12" required></label></div><div class="company-vehicle-documents">${[['registration','Vehicle Registration Certificate'],['inspection','Vehicle Inspection Certificate'],['insurance','Vehicle Insurance Certificate']].map(([name,label])=>`<label class="company-vehicle-upload"><span>${label}</span><input name="${name}" type="file" accept=".pdf,.jpg,.jpeg,.png"><span class="company-vehicle-upload-button">Choose file</span><span class="company-vehicle-file-name">No file selected.</span></label>`).join('')}</div></section>`;
    }
    function refreshCompanyVehicleCards() {
        const cards=[...$('company-vehicle-form-list').querySelectorAll('[data-company-vehicle-card]')];
        cards.forEach((card,index)=>{card.querySelector('h3').textContent=`Vehicle ${index+1}`;card.querySelector('[data-remove-company-vehicle]').disabled=cards.length===1;});
        $('company-vehicle-form-count').textContent=`${cards.length} vehicle${cards.length===1?'':'s'} in this request`;
    }
    function addCompanyVehicleCard() {
        $('company-vehicle-form-list').insertAdjacentHTML('beforeend',companyVehicleCard());
        refreshCompanyVehicleCards();
    }
    function companyVehicleErrorElement(field) {
        const card=field.closest('[data-company-vehicle-card]');
        const key=field.type==='radio'?'vehicle-type':field.name;
        const id=`company-vehicle-error-${card.dataset.companyVehicleCard}-${key}`;
        let error=card.querySelector(`#${id}`);
        if(!error){
            error=document.createElement('p');error.id=id;error.className='company-field-error';error.setAttribute('aria-live','polite');
            const container=field.type==='radio'?field.closest('.company-vehicle-type-group'):field.type==='file'?field.closest('.company-vehicle-upload'):field.closest('.company-vehicle-field');
            container.append(error);
        }
        field.setAttribute('aria-describedby',id);
        return error;
    }
    function showCompanyVehicleError(field,message) {
        field.setCustomValidity(message);
        field.setAttribute('aria-invalid',String(Boolean(message)));
        companyVehicleErrorElement(field).textContent=message;
        if(field.type==='radio')field.closest('.company-vehicle-types').classList.toggle('is-invalid',Boolean(message));
        if(field.type==='file')field.closest('.company-vehicle-upload').classList.toggle('is-invalid',Boolean(message));
    }
    function validateCompanyVehicleForm() {
        const cards=[...$('company-vehicle-form-list').querySelectorAll('[data-company-vehicle-card]')];
        const batchPlates=[];
        let firstInvalid=null;
        cards.forEach(card=>{
            const fields=[...card.querySelectorAll('input,select')];
            fields.forEach(field=>showCompanyVehicleError(field,''));
            const type=card.querySelector('input[type="radio"]:checked');
            const firstType=card.querySelector('input[type="radio"]');
            if(!type){showCompanyVehicleError(firstType,'Select a vehicle type.');firstInvalid??=firstType;}
            fields.filter(field=>field.required&&field.type!=='radio').forEach(field=>{if(!field.value.trim()){showCompanyVehicleError(field,'Complete this field for the vehicle.');firstInvalid??=field;}});
            const year=card.querySelector('[name="year"]');
            if(year.value&&(!/^\d{4}$/.test(year.value)||Number(year.value)<2000||Number(year.value)>2026)){showCompanyVehicleError(year,'Enter a four-digit year between 2000 and 2026.');firstInvalid??=year;}
            const plate=card.querySelector('[name="plate"]');
            if(plate.value&&!/^(?:[A-Z]{2}|\d{2})-(?:[A-Z]{2}|\d{2})-(?:[A-Z]{2}|\d{2})$/.test(plate.value)){showCompanyVehicleError(plate,'Use the licence plate format XX-XX-XX.');firstInvalid??=plate;}
            if(plate.value&&(vehicles.some(item=>item.plate===plate.value)||batchPlates.includes(plate.value))){showCompanyVehicleError(plate,'This licence plate is already registered or included in this request.');firstInvalid??=plate;}
            if(plate.value)batchPlates.push(plate.value);
            ['maxWeight','maxVolume'].forEach(name=>{const field=card.querySelector(`[name="${name}"]`);if(field.value&&(!/^\d+(?:[.,]\d+)?$/.test(field.value)||Number(field.value.replace(',','.'))<=0)){showCompanyVehicleError(field,'Enter a value greater than zero.');firstInvalid??=field;}});
            fields.filter(field=>field.type==='file'&&field.files.length).forEach(field=>{if(!/\.(pdf|jpe?g|png)$/i.test(field.files[0].name)){showCompanyVehicleError(field,'Use a PDF, JPG or PNG file.');firstInvalid??=field;}});
        });
        if(firstInvalid){firstInvalid.focus({preventScroll:true});firstInvalid.closest('[data-company-vehicle-card]').scrollIntoView({behavior:'smooth',block:'center'});return false;}
        return true;
    }
    function submitCompanyVehicles(event) {
        event.preventDefault();
        $('company-vehicle-form-error').textContent='';
        if(!validateCompanyVehicleForm()){$('company-vehicle-form-error').textContent='Review the highlighted vehicle information before submitting.';return;}
        $('company-vehicle-registration-dialog').close();
        $('company-vehicle-registration-success').showModal();
        $('company-vehicle-registration-form').reset();
        $('company-vehicle-form-list').innerHTML='';companyVehicleFormIndex=0;addCompanyVehicleCard();
    }

    function showView(name) {
        const valid=['overview','fleet','operations','history','couriers'];
        if(!valid.includes(name))name='overview';
        document.querySelectorAll('[data-company-view]').forEach(view=>view.hidden=view.dataset.companyView!==name);
        document.querySelectorAll('.company-navbar .nav-links a').forEach(link=>link.setAttribute('aria-current',link.hash===`#${name}`?'page':'false'));
        document.querySelectorAll('.company-dropdown').forEach(menu=>menu.open=false);
        const heading=document.querySelector(`[data-company-view="${name}"] h1`);if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
        if(name==='fleet')renderFleet();
        if(name==='operations')renderOperations();
        if(name==='history')renderHistory();
        if(name==='couriers')renderCouriers();
        window.scrollTo({top:0,behavior:'smooth'});
    }

    populateHistoryFilters();renderOperationalSummary();renderWarnings();renderOverviewOperations();renderFleet();renderOperations();renderHistory();renderCouriers();renderNotifications();addCompanyVehicleCard();
    ['fleet-search','fleet-status-filter','fleet-document-filter'].forEach(id=>$(id).addEventListener('input',renderFleet));
    $('operations-filter').addEventListener('change',renderOperations);
    ['history-search','history-vehicle-filter','history-courier-filter','history-status-filter'].forEach(id=>$(id).addEventListener('input',renderHistory));
    ['courier-search','courier-status-filter'].forEach(id=>$(id).addEventListener('input',renderCouriers));
    $('open-company-vehicle-registration').addEventListener('click',()=>{$('company-vehicle-form-error').textContent='';$('company-vehicle-registration-dialog').showModal();});
    $('add-company-vehicle').addEventListener('click',addCompanyVehicleCard);
    $('company-vehicle-registration-form').addEventListener('submit',submitCompanyVehicles);
    $('company-vehicle-form-list').addEventListener('click',event=>{const button=event.target.closest('[data-remove-company-vehicle]');if(!button||button.disabled)return;button.closest('[data-company-vehicle-card]').remove();refreshCompanyVehicleCards();});
    $('company-vehicle-form-list').addEventListener('input',event=>{const field=event.target;if(!(field instanceof HTMLInputElement))return;if(field.type==='radio'){field.closest('[data-company-vehicle-card]').querySelectorAll('input[type="radio"]').forEach(option=>showCompanyVehicleError(option,''));return;}showCompanyVehicleError(field,'');if(field.name==='plate'){const characters=field.value.replace(/[^a-z0-9]/gi,'').toUpperCase().slice(0,6);field.value=characters.match(/.{1,2}/g)?.join('-')||'';}if(['year','maxWeight'].includes(field.name))field.value=field.value.replace(/\D/g,'');});
    $('company-vehicle-form-list').addEventListener('change',event=>{const field=event.target;if(!(field instanceof HTMLInputElement||field instanceof HTMLSelectElement))return;showCompanyVehicleError(field,'');if(field instanceof HTMLInputElement&&field.type==='file')field.closest('.company-vehicle-upload').querySelector('.company-vehicle-file-name').textContent=field.files.length?field.files[0].name:'No file selected.';});
    document.addEventListener('click',event=>{
        const vehicleButton=event.target.closest('[data-vehicle-details]');if(vehicleButton)showVehicleDetails(vehicleButton.dataset.vehicleDetails);
        const orderButton=event.target.closest('[data-order-details]');if(orderButton)showOrderDetails(orderButton.dataset.orderDetails);
        const removeButton=event.target.closest('[data-remove-notification]');if(removeButton){notifications=notifications.filter(note=>String(note.id)!==removeButton.dataset.removeNotification);renderNotifications();}
        const noteButton=event.target.closest('[data-notification-vehicle]');if(noteButton){location.hash='fleet';setTimeout(()=>showVehicleDetails(noteButton.dataset.notificationVehicle),0);}
    });
    document.querySelectorAll('[data-close-company-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
    $('clear-company-notifications').addEventListener('click',()=>{notifications=[];renderNotifications();});
    window.addEventListener('hashchange',()=>showView(location.hash.slice(1)));
    showView(location.hash.slice(1)||'overview');
})();
