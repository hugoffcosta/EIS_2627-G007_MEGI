(() => {
  'use strict';
  const ORDER_KEY='cms.client.orders.v1';
  const PROFILE_KEY='cms.client.profile.v1';
  const SESSION_KEY='cms.client.session.v1';
  const $=id=>document.getElementById(id);
  const readJSON=(key,fallback)=>{try{const data=JSON.parse(localStorage.getItem(key));return data??fallback;}catch{return fallback;}};
  const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  const defaultProfile={name:'Sofia Martins',email:'sofia.martins@example.com',phone:'912345678',type:'Individual',address:'Rua das Flores, 123',postal:'4000-123',city:'Porto',company:'',notifications:true};
  let profile={...defaultProfile,...readJSON(PROFILE_KEY,{})};
  try{const sess=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');if(sess && sess.email && sess.email.toLowerCase()!==profile.email.toLowerCase())profile={...defaultProfile,name:sess.name||sess.email.split('@')[0],email:sess.email};}catch{}
  const allOrders=()=>{const rows=readJSON(ORDER_KEY,[]);return Array.isArray(rows)?rows.filter(o=>o&&typeof o.id==='string'):[];};
  const orderList=()=>allOrders().filter(o=>!o.ownerEmail || o.ownerEmail.toLowerCase()===profile.email.toLowerCase());
  const toNumber=val=>Number(val);
  const fmt=(x,d=2)=>new Intl.NumberFormat('pt-PT',{maximumFractionDigits:d}).format(Number(x));
  const now=()=>new Date().toISOString();
  const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const formattedDate=x=>{if(!x)return '—';const d=new Date(x);return Number.isNaN(d.getTime())?String(x):d.toLocaleString('en-GB',{dateStyle:'medium',timeStyle:x.includes('T')?'short':undefined});};
  const initials=name=>(name.trim().split(/\s+/).slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('')||'CL');
  function node(tag,cls='',text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
  function updateUser(){const first=profile.name.split(/\s+/)[0]||'Client';$('client-first-name').textContent=first+'.';$('client-header-name').textContent=profile.name;$('client-hero-fullname').textContent=profile.name;$('client-initials').textContent=initials(profile.name);$('client-hero-avatar').textContent=initials(profile.name);}
  updateUser();
  const notifications=[];
  function notify(title,message){notifications.unshift({title,message,time:now()});renderNotifications();}
  function renderNotifications(){const list=$('client-notification-list');list.replaceChildren();for(const item of notifications){const li=node('li','client-notification-item'),strong=node('strong','',item.title),p=node('p','',item.message);li.append(strong,p);list.append(li);}const badge=$('client-notification-count');badge.hidden=notifications.length===0;badge.textContent=String(notifications.length);$('client-notifications-empty').hidden=notifications.length>0;}
  $('client-clear-notifications').addEventListener('click',()=>{notifications.length=0;renderNotifications();});
  $('client-logout').addEventListener('click',()=>{try{sessionStorage.removeItem(SESSION_KEY);}catch{}window.location.href='menu login.html';});
  renderNotifications();
  const statesDone=new Set(['Completed','Cancelled']);
  function clsForStatus(status){if(status==='Completed')return 'client-status-completed';if(status==='Cancelled')return 'client-status-cancelled';if(status==='Initiated')return 'client-status-initiated';return 'client-status-progress';}
  function openDetails(order){const dialog=$('client-order-dialog'),area=$('client-dialog-content');area.replaceChildren();area.append(node('h2','',order.id));area.append(node('span',`status-badge ${clsForStatus(order.status)}`,order.status));const dl=node('dl','client-dialog-grid');const fields=[['Pickup',order.pickup],['Destination',order.dropoff],['Requested Date',order.date],['Service',order.service],['Products',order.products?.map(p=>`${p.quantity} × ${p.description}`).join('; ')||order.cargo],['Total Weight',`${fmt(order.weight,3)} kg`],['Total Volume',`${fmt(order.volume,4)} m³`],['Assigned Vehicle',order.vehicle||'Not assigned'],['Origin GPS',`${order.originLat}, ${order.originLng}`],['Destination GPS',`${order.destLat}, ${order.destLng}`],['Created',formattedDate(order.createdAt)]];
    for(const [k,v] of fields){const r=node('div'),dt=node('dt','',k),dd=node('dd','',String(v??'—'));r.append(dt,dd);dl.append(r);}area.append(dl);
    const h=node('h3','','Order Timeline');h.style.fontSize='19px';area.append(h);
    const history=node('ol','client-timeline');history.style.padding='10px 0 10px 24px';history.style.fontSize='13px';
    (order.timeline||[]).forEach(event=>history.append(node('li','',`${event.status} · ${formattedDate(event.date)}`)));area.append(history);
    if(order.status==='Completed')area.append(node('p','client-note','Delivery marked completed by the courier. Electronic proof of delivery is handled in the Courier demo.'));
    dialog.showModal();
  }
  $('client-dialog-close').addEventListener('click',()=>$('client-order-dialog').close());
  function orderCard(order){const card=node('article','client-order-card'),top=node('div','client-order-top');top.append(node('span','client-order-id',order.id),node('span',`status-badge ${clsForStatus(order.status)}`,order.status));card.append(top,node('h3','',`${order.origin} → ${order.destination}`));const dl=node('dl','client-order-meta');for(const [label,value] of [['Requested',order.date],['Products',`${order.products?.length||1} item(s)`],['Total weight',`${fmt(order.weight,3)} kg`],['Created',formattedDate(order.createdAt)]]){const r=node('div');r.append(node('dt','',label),node('dd','',value));dl.append(r);}card.append(dl);const acts=node('div','client-order-actions');const view=node('button','client-text-link','View details →');view.type='button';view.addEventListener('click',()=>openDetails(order));acts.append(view);
    if(order.status==='Initiated'){const cancel=node('button','client-cancel-button','Cancel Order');cancel.type='button';cancel.setAttribute('aria-label',`Cancel ${order.id}`);cancel.addEventListener('click',()=>{if(!confirm(`Cancel order ${order.id}?`))return;const orders=allOrders(),target=orders.find(x=>x.id===order.id);if(!target||target.status!=='Initiated'){renderAll();return;}target.status='Cancelled';target.timeline=[...(target.timeline||[]),{status:'Cancelled',date:now()}];if(safeWrite(ORDER_KEY,orders)){notify('Order cancelled',`${order.id} was cancelled.`);renderAll();}});acts.append(cancel);}
    card.append(acts);return card;
  }
  function emptyMessage(title,desc,withButton=false){const el=node('div','client-order-empty');el.append(node('h3','',title),node('p','',desc));if(withButton){const a=node('a','next-button','Create Order →');a.href='#book';el.append(a);}return el;}
  function renderInto(id,orders,title,desc,link){const box=$(id);box.replaceChildren();if(!orders.length){box.append(emptyMessage(title,desc,link));return;}orders.forEach(o=>box.append(orderCard(o)));}
  function renderAll(){const orders=orderList().slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));const active=orders.filter(o=>!statesDone.has(o.status));const history=orders.filter(o=>statesDone.has(o.status));$('metric-total').textContent=String(orders.length);$('metric-active').textContent=String(active.length);$('metric-completed').textContent=String(history.filter(o=>o.status==='Completed').length);renderInto('client-recent-orders',orders.slice(0,3),'No orders yet','Your most recent deliveries will appear here.',true);
    const q=$('client-order-search').value.trim().toLowerCase(),filter=$('client-order-filter').value;renderInto('client-active-orders',active.filter(o=>(filter==='all'||o.status===filter)&&(!q||(o.id+' '+o.pickup+' '+o.dropoff).toLowerCase().includes(q))),'No active orders','Create your first delivery to start tracking.',true);
    renderInto('client-history-orders',history,'No history yet','Completed or cancelled orders will appear here.',false);
  }
  $('client-order-search').addEventListener('input',renderAll);$('client-order-filter').addEventListener('change',renderAll);
  function showView(){const name=location.hash.slice(1)||'home';const allowed=new Set(['home','book','orders','history','profile']);const selected=allowed.has(name)?name:'home';document.querySelectorAll('[data-client-view]').forEach(p=>p.hidden=p.dataset.clientView!==selected);document.querySelectorAll('a[data-route]').forEach(a=>{if(a.dataset.route===selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.querySelectorAll('.nav-dropdown').forEach(d=>d.open=false);if(selected==='book')setTimeout(()=>{initializeMap();if(map)map.invalidateSize();refreshMap();},35);renderAll();}
  addEventListener('hashchange',()=>{showView();window.scrollTo(0,0);});
  // Product rows: quantity, per-item weight and volume support multi-product bookings.
  const products=$('client-products');let productNo=0;
  function addProduct(value={}){productNo++;const id=productNo,row=node('fieldset','client-product-row');row.dataset.product=id;const legend=node('legend','sr-only',`Product ${id}`);const top=node('div','client-product-heading'),title=node('strong','',`Product ${id}`),remove=node('button','client-remove-product','Remove');remove.type='button';remove.disabled=products.children.length===0;remove.addEventListener('click',()=>{row.remove();updateProducts();});top.append(title,remove);
    const grid=node('div','form-grid');const definitions=[{label:'Description *',name:'description',tag:'input',attrs:{placeholder:'e.g. Electronic components',required:true,minlength:2},value:value.description||''},{label:'Category *',name:'category',tag:'select',options:['Electronics','Documents','Clothing','Food (non-perishable)','Other'],value:value.category||'Electronics'},{label:'Quantity *',name:'quantity',tag:'input',attrs:{type:'number',min:1,step:1,required:true},value:value.quantity||1},{label:'Weight per item (kg) *',name:'weight',tag:'input',attrs:{type:'number',min:0.001,step:'any',required:true},value:value.weight||''},{label:'Volume per item (m³) *',name:'volume',tag:'input',attrs:{type:'number',min:0.000001,step:'any',required:true},value:value.volume||''}];
    for(const def of definitions){const group=node('div','form-group'+(def.name==='description'?' full-width':'')),label=node('label','',def.label),field=document.createElement(def.tag);field.name=def.name;field.id=`prod-${id}-${def.name}`;label.htmlFor=field.id;if(def.options)def.options.forEach(opt=>{const option=node('option','',opt);option.value=opt;field.append(option);});if(def.attrs)Object.entries(def.attrs).forEach(([key,val])=>{if(key==='required')field.required=val;else field.setAttribute(key,String(val));});field.value=def.value;field.addEventListener('input',updateProducts);group.append(label,field);grid.append(group);}
    row.append(legend,top,grid);products.append(row);updateProducts();return row;
  }
  function productItems(){return [...products.querySelectorAll('.client-product-row')].map(row=>Object.fromEntries([...row.querySelectorAll('input,select')].map(el=>[el.name,el.value]))).map(o=>({...o,quantity:toNumber(o.quantity),weight:toNumber(o.weight),volume:toNumber(o.volume)}));}
  function updateProducts(){const p=productItems(),weight=p.reduce((sum,x)=>sum+(Number.isFinite(x.weight)&&Number.isFinite(x.quantity)?x.weight*x.quantity:0),0),volume=p.reduce((sum,x)=>sum+(Number.isFinite(x.volume)&&Number.isFinite(x.quantity)?x.volume*x.quantity:0),0);$('client-total-weight').textContent=`${fmt(weight,3)} kg`;$('client-total-volume').textContent=`${fmt(volume,4)} m³`;const children=[...products.children];children.forEach((row,i)=>{row.querySelector('.client-product-heading strong').textContent=`Product ${i+1}`;row.querySelector('.client-remove-product').disabled=children.length===1;});return {weight,volume};}
  $('client-add-product').addEventListener('click',()=>addProduct());addProduct();
  // Interactive Leaflet OpenStreetMap — only a straight illustrative line, not road routing.
  let map=null,originMarker=null,destMarker=null,line=null;
  const coordIds=['origin-lat','origin-lng','dest-lat','dest-lng'];
  function coordValues(){const arr=coordIds.map(id=>$(id).value.trim());if(arr.some(v=>v===''))return null;const numbers=arr.map(Number);if(numbers.some(x=>!Number.isFinite(x)))return null;const [a,b,c,d]=numbers;if(Math.abs(a)>90||Math.abs(c)>90||Math.abs(b)>180||Math.abs(d)>180)return null;return {origin:[a,b],dest:[c,d]};}
  function initializeMap(){if(map||!window.L){if(!window.L)$('client-map-status').textContent='Map library unavailable. Check your Internet connection. GPS inputs still work.';return;}map=L.map('client-order-map').setView([41.1779,-8.5981],12);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);map.on('click',e=>{const kind=document.querySelector('input[name="map-target"]:checked')?.value||'origin';$(kind==='origin'?'origin-lat':'dest-lat').value=e.latlng.lat.toFixed(6);$(kind==='origin'?'origin-lng':'dest-lng').value=e.latlng.lng.toFixed(6);refreshMap();});refreshMap();}
  function refreshMap(){if(!map)return;for(const obj of [originMarker,destMarker,line])if(obj)map.removeLayer(obj);originMarker=destMarker=line=null;const getPair=(a,b)=>{const v=$(a).value,w=$(b).value;if(!v||!w)return null;const lat=Number(v),lng=Number(w);return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180?[lat,lng]:null;};const origin=getPair('origin-lat','origin-lng'),dest=getPair('dest-lat','dest-lng');if(origin)originMarker=L.marker(origin).addTo(map).bindPopup('Pickup / Origin');if(dest)destMarker=L.marker(dest).addTo(map).bindPopup('Delivery / Destination');if(origin&&dest){line=L.polyline([origin,dest],{color:'#13866d',weight:4,dashArray:'8,7'}).addTo(map);map.fitBounds(line.getBounds().pad(.28),{maxZoom:14});}else if(origin||dest)map.setView(origin||dest,13);}
  coordIds.forEach(id=>$(id).addEventListener('input',refreshMap));
  function sampleCoordinates(){$('origin-lat').value='41.178000';$('origin-lng').value='-8.598000';$('dest-lat').value='41.149600';$('dest-lng').value='-8.610900';$('pickup-address').value='FEUP, Rua Dr. Roberto Frias, Porto';$('dropoff-address').value='Avenida dos Aliados, Porto';refreshMap();}
  $('client-map-sample').addEventListener('click',sampleCoordinates);
  $('client-delivery-date').min=localDay();$('client-delivery-date').value=localDay();
  const orderForm=$('client-order-form');
  function checkControl(field){field.removeAttribute('aria-invalid');if(!field.checkValidity()){field.setAttribute('aria-invalid','true');field.focus();return false;}return true;}
  orderForm.addEventListener('submit',event=>{
    event.preventDefault();const feedback=$('client-order-feedback');feedback.textContent='';
    for(const el of [ ...orderForm.querySelectorAll('input[required],select[required]')])if(!checkControl(el)){feedback.textContent='Please fill out all required fields with valid values.';return;}
    if($('client-delivery-date').value<localDay()){feedback.textContent='The delivery date must not be in the past.';$('client-delivery-date').focus();return;}
    if(!coordValues()){feedback.textContent='Latitude must be between −90 and 90 and longitude between −180 and 180.';$('origin-lat').focus();return;}
    const items=productItems();if(items.length===0||items.some(x=>!x.description.trim()||!(x.quantity>=1&&Number.isInteger(x.quantity))||!(x.weight>0&&x.volume>0))){feedback.textContent='At least one valid product is required. Each product needs a description, quantity, weight and volume.';return;}
    const totals=updateProducts();const coords=coordValues(),id=`CL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
    const pickup=$('pickup-address').value.trim(),dropoff=$('dropoff-address').value.trim();const record={id,requestKey:`cms-client-${id}`,client:profile.name,ownerEmail:profile.email,origin:pickup.split(',').slice(-1)[0].trim()||'Origin',destination:dropoff.split(',').slice(-1)[0].trim()||'Destination',pickup,dropoff,originLat:coords.origin[0],originLng:coords.origin[1],destLat:coords.dest[0],destLng:coords.dest[1],products:items,weight:totals.weight,volume:totals.volume,cargo:items.map(x=>`${x.quantity}× ${x.description}`).join(', '),vehicle:'Not assigned',date:$('client-delivery-date').value,service:$('client-order-service').value,notes:$('client-order-notes').value.trim(),status:'Initiated',createdAt:now(),timeline:[{status:'Initiated',date:now()}]};
    const existing=allOrders();existing.unshift(record);if(!safeWrite(ORDER_KEY,existing)){feedback.textContent='Could not save this demo order. Browser storage might be blocked or full.';return;}
    notify('New order submitted',`${id} is ready for courier selection.`);
    orderForm.reset();products.replaceChildren();productNo=0;addProduct();$('client-delivery-date').value=localDay();refreshMap();renderAll();location.hash='orders';
  });
  orderForm.addEventListener('reset',()=>{setTimeout(()=>{products.replaceChildren();productNo=0;addProduct();$('client-delivery-date').value=localDay();refreshMap();$('client-order-feedback').textContent='';},0);});
  const profileFields={'profile-name':'name','profile-email':'email','profile-phone':'phone','profile-address':'address','profile-postal':'postal','profile-city':'city'};
  function fillProfile(){Object.entries(profileFields).forEach(([id,key])=>$(id).value=profile[key]||'');}
  fillProfile();
  $('client-profile-form').addEventListener('submit',e=>{e.preventDefault();const feedback=$('profile-feedback');feedback.textContent='';for(const el of $('client-profile-form').querySelectorAll('input')){if(el.required || el.value)if(!checkControl(el)){feedback.textContent='Please check your contact details.';return;}}const updated={...profile};Object.entries(profileFields).forEach(([id,key])=>updated[key]=$(id).value.trim());if(!safeWrite(PROFILE_KEY,updated)){feedback.textContent='Unable to save your profile in this browser.';return;}const oldEmail=profile.email;profile=updated;
    if(oldEmail.toLowerCase()!==updated.email.toLowerCase()){const records=allOrders();records.filter(o=>o.ownerEmail?.toLowerCase()===oldEmail.toLowerCase()).forEach(o=>o.ownerEmail=updated.email);safeWrite(ORDER_KEY,records);}
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({email:updated.email,name:updated.name}));}catch{}
    updateUser();renderAll();feedback.style.color='var(--green)';feedback.textContent='Profile saved in this browser for the demo.';notify('Profile updated','Your contact information has been updated.');});
  function onExternalUpdate(){renderAll();}
  addEventListener('storage',event=>{if(event.key===ORDER_KEY)onExternalUpdate();});
  addEventListener('pageshow',onExternalUpdate);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)onExternalUpdate();});
  showView();
})();
