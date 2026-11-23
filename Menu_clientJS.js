document.documentElement.style.visibility = 'hidden';
fetch('backend/api/auth.php?action=me')
  .then(response => response.json())
  .then(data => {
    if (!data.ok || data.user.role !== 'client') {
      window.location.replace('Login Client_HTML.html');
      return;
    }
    document.documentElement.style.visibility = '';
  })
  .catch(() => window.location.replace('Login Client_HTML.html'));
(() => {
  'use strict';
  const ORDER_KEY='cms.client.orders.v1';
  const RATING_KEY='cms.client.courier-ratings.v1';
  const PROFILE_KEY='cms.client.profile.v1';
  const SESSION_KEY='cms.client.session.v1';
  const $=id=>document.getElementById(id);
  const readJSON=(key,fallback)=>{try{const data=JSON.parse(localStorage.getItem(key));return data??fallback;}catch{return fallback;}};
  const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  const defaultProfile={name:'Sofia Martins',email:'sofia.martins@example.com',phone:'912345678',type:'Individual',address:'Rua das Flores, 123',postal:'4000-123',city:'Porto',company:'',notifications:true};
  let profile={...defaultProfile,...readJSON(PROFILE_KEY,{})};
  try{const sess=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');if(sess && sess.email && sess.email.toLowerCase()!==profile.email.toLowerCase())profile={...defaultProfile,name:sess.name||sess.email.split('@')[0],email:sess.email};}catch{}
  const allOrders=()=>{const rows=readJSON(ORDER_KEY,[]);return Array.isArray(rows)?rows.filter(o=>o&&typeof o.id==='string'):[];};
  const orderList=()=>[...allOrders().filter(o=>!o.ownerEmail || o.ownerEmail.toLowerCase()===profile.email.toLowerCase()),demoAttemptOrder(),demoCompletedOrder()];
  const toNumber=val=>Number(val);
  const fmt=(x,d=2)=>new Intl.NumberFormat('pt-PT',{maximumFractionDigits:d}).format(Number(x));
  const euro=x=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(Number(x));
  const now=()=>new Date().toISOString();
  const demoAttemptStart=Date.now()-60*60*1000;
  const demoAttemptTimestamp=minutes=>new Date(demoAttemptStart+minutes*60*1000).toISOString();
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
  $('client-logout').addEventListener('click',async()=>{try{await fetch('backend/api/auth.php?action=logout',{method:'POST'});}catch{}try{sessionStorage.removeItem(SESSION_KEY);}catch{}window.location.href='menu_login.html';});
  renderNotifications();
  const statesDone=new Set(['Completed','Cancelled']);
  function clsForStatus(status){if(status==='Completed')return 'client-status-completed';if(status==='Cancelled')return 'client-status-cancelled';if(status==='Initiated')return 'client-status-initiated';return 'client-status-progress';}
  function timelineStatus(event){return ({'Picked up':'Left origin (picked up)','Delivery day':'Out for delivery','Delivery attempt unsuccessful':'Delivery attempt unsuccessful','Completed':'Delivered'})[event.status]||event.status;}
  function courierRating(orderId){const ratings=readJSON(RATING_KEY,{});return ratings&&typeof ratings==='object'&&!Array.isArray(ratings)?ratings[orderId]:null;}
  let ratingOrder=null;
  function openCourierRating(order){ratingOrder=order;const saved=courierRating(order.id);$('client-rating-courier').textContent=order.courier||'Assigned courier';$('client-rating-score').value=saved?.score||'';$('client-rating-comment').value=saved?.comment||'';$('client-rating-feedback').textContent='';$('client-rating-dialog').showModal();}
  function openDetails(order){const dialog=$('client-order-dialog'),area=$('client-dialog-content');area.replaceChildren();area.append(node('h2','',order.id));area.append(node('span',`status-badge ${clsForStatus(order.status)}`,order.status));const dl=node('dl','client-dialog-grid'),gps=(lat,lng)=>Number.isFinite(lat)&&Number.isFinite(lng)?`${lat}, ${lng}`:'—';const fields=[['Pickup',order.pickup],['Destination',order.dropoff],['Requested Date',order.date],['Service',order.service],['Estimated Price',Number.isFinite(order.price)?euro(order.price):'—'],['Payment Method',order.paymentMethod==='mbway'?'MB WAY':order.paymentMethod==='card'?'Card':'—'],['Products',order.products?.map(p=>`${p.quantity} × ${p.description}`).join('; ')||order.cargo],['Total Weight',`${fmt(order.weight,3)} kg`],['Total Volume',`${fmt(order.volume,4)} m³`],['Assigned Vehicle',order.vehicle||'Not assigned'],['Assigned Courier',order.courier||'Not assigned'],['Origin GPS',gps(order.originLat,order.originLng)],['Destination GPS',gps(order.destLat,order.destLng)],['Created',formattedDate(order.createdAt)]];
    for(const [k,v] of fields){const r=node('div'),dt=node('dt','',k),dd=node('dd','',String(v??'—'));r.append(dt,dd);dl.append(r);}area.append(dl);
    const h=node('h3','','Order Timeline');h.style.fontSize='19px';area.append(h);
    const history=node('ol','client-timeline');history.style.padding='10px 0 10px 24px';history.style.fontSize='13px';
    (order.timeline||[]).forEach(event=>{const details=[event.reason,event.pickupPoint?`Left at ${event.pickupPoint}`:''].filter(Boolean).join(' — ');history.append(node('li','',`${timelineStatus(event)}${details?` — ${details}`:''} · ${formattedDate(event.date)}`));});area.append(history);
    if(order.status==='Completed')area.append(node('p','client-note',`Delivery marked completed by ${order.courier||'the courier'}. Electronic proof of delivery is handled in the Courier area.`));
    dialog.showModal();
  }
  $('client-dialog-close').addEventListener('click',()=>$('client-order-dialog').close());
  $('client-rating-close').addEventListener('click',()=>$('client-rating-dialog').close());
  $('client-rating-form').addEventListener('submit',event=>{event.preventDefault();if(!ratingOrder)return;const ratings=readJSON(RATING_KEY,{}),allRatings=ratings&&typeof ratings==='object'&&!Array.isArray(ratings)?ratings:{},score=Number($('client-rating-score').value);allRatings[ratingOrder.id]={score,comment:$('client-rating-comment').value.trim(),createdAt:now()};if(!safeWrite(RATING_KEY,allRatings)){$('client-rating-feedback').textContent='Could not save your rating. Browser storage might be blocked or full.';return;}notify('Courier rated',`Your rating for ${ratingOrder.courier||'the courier'} was saved.`);$('client-rating-dialog').close();ratingOrder=null;renderAll();});
  function orderCard(order){const card=node('article','client-order-card'),top=node('div','client-order-top');top.append(node('span','client-order-id',order.id),node('span',`status-badge ${clsForStatus(order.status)}`,order.status));card.append(top,node('h3','',`${order.origin} → ${order.destination}`));if(order.demoMessage)card.append(node('p','client-demo-context',order.demoMessage));else if(order.demoExample)card.append(node('p','client-demo-context',`No one was home at the delivery attempt; the parcel was left at ${order.pickupPoint}.`));const dl=node('dl','client-order-meta');for(const [label,value] of [['Requested',order.date],['Products',`${order.products?.length||1} item(s)`],['Total weight',`${fmt(order.weight,3)} kg`],['Created',formattedDate(order.createdAt)]]){const r=node('div');r.append(node('dt','',label),node('dd','',value));dl.append(r);}card.append(dl);if(order.status==='Completed'&&order.courier)card.append(node('p','client-courier-assignment',`Courier: ${order.courier}`));const acts=node('div','client-order-actions');const view=node('button','client-text-link','View details →');view.type='button';view.addEventListener('click',()=>openDetails(order));acts.append(view);
    if(order.status==='Completed'){const saved=courierRating(order.id);if(saved)acts.append(node('span','client-rating-saved',`Rated ${saved.score}/5 ★`));const rate=node('button','client-text-link',saved?'Update rating':'Rate courier');rate.type='button';rate.addEventListener('click',()=>openCourierRating(order));acts.append(rate);}
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
  function addProduct(value={}){productNo++;const id=productNo,row=node('fieldset','client-product-row');row.dataset.product=id;const legend=node('legend','sr-only',`Product ${id}`);const top=node('div','client-product-heading'),title=node('strong','',`Product ${id}`),remove=node('button','client-remove-product','Remove');remove.type='button';remove.disabled=products.children.length===0;remove.addEventListener('click',()=>{row.remove();updateProducts();updateOrderPrice();});top.append(title,remove);
    const grid=node('div','form-grid');const definitions=[{label:'Description *',name:'description',tag:'input',attrs:{placeholder:'e.g. Electronic components',required:true,minlength:2},value:value.description||''},{label:'Category *',name:'category',tag:'select',options:['Clothing and textiles','Books and documents','Household goods','Sports and leisure','Components and industrial products','Perishables and food','Other'],value:value.category||'Clothing and textiles'},{label:'Quantity *',name:'quantity',tag:'input',attrs:{type:'number',min:1,step:1,required:true},value:value.quantity||1},{label:'Weight per item (kg) *',name:'weight',tag:'input',attrs:{type:'number',min:0.001,step:'any',required:true},value:value.weight||''},{label:'Volume per item (m³) *',name:'volume',tag:'input',attrs:{type:'number',min:0.000001,step:'any',required:true},value:value.volume||''}];
    for(const def of definitions){const group=node('div','form-group'+(def.name==='description'?' full-width':'')),label=node('label','',def.label),field=document.createElement(def.tag);field.name=def.name;field.id=`prod-${id}-${def.name}`;label.htmlFor=field.id;if(def.options)def.options.forEach(opt=>{const option=node('option','',opt);option.value=opt;field.append(option);});if(def.attrs)Object.entries(def.attrs).forEach(([key,val])=>{if(key==='required')field.required=val;else field.setAttribute(key,String(val));});field.value=def.value;field.addEventListener('input',()=>{updateProducts();updateOrderPrice();});group.append(label,field);grid.append(group);}
    row.append(legend,top,grid);products.append(row);updateProducts();return row;
  }
  function productItems(){return [...products.querySelectorAll('.client-product-row')].map(row=>Object.fromEntries([...row.querySelectorAll('input,select')].map(el=>[el.name,el.value]))).map(o=>({...o,quantity:toNumber(o.quantity),weight:toNumber(o.weight),volume:toNumber(o.volume)}));}
  function updateProducts(){const p=productItems(),weight=p.reduce((sum,x)=>sum+(Number.isFinite(x.weight)&&Number.isFinite(x.quantity)?x.weight*x.quantity:0),0),volume=p.reduce((sum,x)=>sum+(Number.isFinite(x.volume)&&Number.isFinite(x.quantity)?x.volume*x.quantity:0),0);$('client-total-weight').textContent=`${fmt(weight,3)} kg`;$('client-total-volume').textContent=`${fmt(volume,4)} m³`;const children=[...products.children];children.forEach((row,i)=>{row.querySelector('.client-product-heading strong').textContent=`Product ${i+1}`;row.querySelector('.client-remove-product').disabled=children.length===1;});return {weight,volume};}
  $('client-add-product').addEventListener('click',()=>addProduct());addProduct();
  // Interactive Leaflet OpenStreetMap with OSRM road routing.
  let map=null,originMarker=null,destMarker=null,sampleMarker=null,roadRoute=null,routeController=null,routeTimer=null,routeRequestId=0;
  const sampleMapLocation=[41.1779,-8.5981];
  const coordIds=['origin-lat','origin-lng','dest-lat','dest-lng'];
  function coordValues(){const arr=coordIds.map(id=>$(id).value.trim());if(arr.some(v=>v===''))return null;const numbers=arr.map(Number);if(numbers.some(x=>!Number.isFinite(x)))return null;const [a,b,c,d]=numbers;if(Math.abs(a)>90||Math.abs(c)>90||Math.abs(b)>180||Math.abs(d)>180)return null;return {origin:[a,b],dest:[c,d]};}
  const demoRates=Object.freeze({base:5,perKm:0.65,perKg:0.20,perM3:8,priority:1.30});
  function calculateOrderPrice(){const coords=coordValues(),items=productItems();if(!coords||!items.length||items.some(x=>!x.description.trim()||!(x.quantity>=1&&Number.isInteger(x.quantity))||!(x.weight>0&&x.volume>0)))return null;const totals=items.reduce((sum,item)=>({weight:sum.weight+item.weight*item.quantity,volume:sum.volume+item.volume*item.quantity}),{weight:0,volume:0});if(!Number.isFinite(totals.weight)||!Number.isFinite(totals.volume))return null;const radians=value=>value*Math.PI/180,[lat1,lon1]=coords.origin,[lat2,lon2]=coords.dest,dLat=radians(lat2-lat1),dLon=radians(lon2-lon1),rawA=Math.sin(dLat/2)**2+Math.cos(radians(lat1))*Math.cos(radians(lat2))*Math.sin(dLon/2)**2,a=Math.min(1,Math.max(0,rawA)),distance=6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)),multiplier=$('client-order-service').value==='Priority'?demoRates.priority:1,total=(demoRates.base+distance*demoRates.perKm+totals.weight*demoRates.perKg+totals.volume*demoRates.perM3)*multiplier;return Number.isFinite(total)?Number(total.toFixed(2)):null;}
  function updateOrderPrice(){const output=$('client-order-price'),note=$('client-order-price-note'),amount=calculateOrderPrice();output.textContent=amount===null?'—':euro(amount);note.textContent=amount===null?'Complete the GPS points and product details to calculate an estimate.':'Estimate using straight-line GPS distance and the current tariff; final price may differ.';return amount;}
  const pickupPointForProfile=()=>{const city=(profile.city||'').trim(),postal=(profile.postal||'').replace(/\D/g,''),normalized=city.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const points=[{name:'Porto Centro Pickup Point',cities:['porto'],prefixes:['4000','4050','4100','4150']},{name:'Matosinhos Pickup Point',cities:['matosinhos'],prefixes:['4450','4460']},{name:'Maia Pickup Point',cities:['maia'],prefixes:['4470']},{name:'Gaia Central Pickup Point',cities:['gaia','vila nova de gaia'],prefixes:['4400','4410','4430']},{name:'Lisboa Centro Pickup Point',cities:['lisboa','lisbon'],prefixes:['1000','1050','1100','1150','1200','1300']},{name:'Coimbra Centro Pickup Point',cities:['coimbra'],prefixes:['3000','3030']},{name:'Braga Centro Pickup Point',cities:['braga'],prefixes:['4700']}];const point=points.find(item=>item.cities.includes(normalized))||points.find(item=>item.prefixes.some(prefix=>postal.startsWith(prefix)));return point?`${point.name} (nearest pickup point for ${city||postal})`:`Pickup Point near ${city||postal||'your registered area'}`;};
  function demoAttemptOrder(){const pickupPoint=pickupPointForProfile();return {id:'ORD-ATTEMPT-001',demoExample:true,client:profile.name,ownerEmail:profile.email,origin:'Porto',destination:profile.city||'Porto',pickup:'FEUP, Rua Dr. Roberto Frias, Porto',dropoff:[profile.address,profile.postal,profile.city].filter(Boolean).join(', '),products:[{quantity:1,description:'Parcel',category:'Other'}],cargo:'Parcel',weight:1,volume:0.1,vehicle:'Vehicle',date:localDay(),service:'Standard',status:'Delivery attempt unsuccessful',createdAt:demoAttemptTimestamp(0),originLat:null,originLng:null,destLat:null,destLng:null,pickupPoint,timeline:[{status:'Initiated',date:demoAttemptTimestamp(0)},{status:'Accepted',date:demoAttemptTimestamp(10)},{status:'Picked up',date:demoAttemptTimestamp(20)},{status:'In transit',date:demoAttemptTimestamp(40)},{status:'Out for delivery',date:demoAttemptTimestamp(55)},{status:'Delivery attempt unsuccessful',date:demoAttemptTimestamp(60),reason:'No one was home',pickupPoint}]};}
  function demoCompletedOrder(){const start=Date.now()-24*60*60*1000,timestamp=minutes=>new Date(start+minutes*60*1000).toISOString(),dropoff=[profile.address,profile.postal,profile.city].filter(Boolean).join(', ');return {id:'ORD-COMPLETE-001',client:profile.name,ownerEmail:profile.email,origin:'Porto',destination:profile.city||'Porto',pickup:'FEUP, Rua Dr. Roberto Frias, Porto',dropoff,products:[{quantity:1,description:'Parcel',category:'Other'}],cargo:'Parcel',weight:1,volume:0.1,vehicle:'Van 04',courier:'Miguel Santos',date:timestamp(120).slice(0,10),service:'Standard',status:'Completed',createdAt:timestamp(0),originLat:null,originLng:null,destLat:null,destLng:null,timeline:[{status:'Initiated',date:timestamp(0)},{status:'Accepted',date:timestamp(15)},{status:'Picked up',date:timestamp(40)},{status:'In transit',date:timestamp(75)},{status:'Out for delivery',date:timestamp(100)},{status:'Completed',date:timestamp(120)}]};}
  const addressLookupCache=new Map();
  const addressPickers=[
    {input:$('pickup-address'),list:$('pickup-address-suggestions'),status:$('pickup-address-status'),latitude:$('origin-lat'),longitude:$('origin-lng'),timer:null,controller:null,version:0,results:[],selected:null},
    {input:$('dropoff-address'),list:$('dropoff-address-suggestions'),status:$('dropoff-address-status'),latitude:$('dest-lat'),longitude:$('dest-lng'),timer:null,controller:null,version:0,results:[],selected:null}
  ];
  function stopAddressLookup(picker){clearTimeout(picker.timer);picker.controller?.abort();picker.controller=null;picker.version++;}
  function applyAddressSelection(picker,place){stopAddressLookup(picker);picker.selected=place;picker.results=[];picker.list.replaceChildren();picker.input.value=place.label;picker.latitude.value=place.latitude.toFixed(6);picker.longitude.value=place.longitude.toFixed(6);picker.status.textContent=`Coordinates filled: ${picker.latitude.value}, ${picker.longitude.value}.`;refreshMap();updateOrderPrice();}
  function selectAddressSuggestion(picker){if(picker.selected?.label===picker.input.value)return true;const place=picker.results.find(result=>result.label===picker.input.value);if(!place)return false;applyAddressSelection(picker,place);return true;}
  async function searchAddress(picker,query,version){
    const controller=new AbortController();picker.controller=controller;const timeout=setTimeout(()=>controller.abort(),12000);
    try{
      const key=query.toLocaleLowerCase('pt-PT');let places=addressLookupCache.get(key);
      if(!places){const params=new URLSearchParams({q:`${query}, Portugal`,limit:'10',lang:'en'}),response=await fetch(`https://photon.komoot.io/api/?${params}`,{signal:controller.signal});if(!response.ok)throw new Error('Address lookup service unavailable');const data=await response.json(),seen=new Set();places=(data.features||[]).filter(item=>item.properties?.countrycode?.toUpperCase()==='PT'&&item.geometry?.type==='Point'&&item.geometry.coordinates?.length===2&&item.geometry.coordinates.every(Number.isFinite)).map(item=>{const p=item.properties,[longitude,latitude]=item.geometry.coordinates,label=[...new Set([p.name,[p.street,p.housenumber].filter(Boolean).join(' '),p.postcode,p.city||p.town||p.village,p.state].filter(Boolean))].join(', ');return {label,latitude,longitude};}).filter(place=>{const placeKey=place.label+place.latitude+place.longitude;if(!place.label||seen.has(placeKey))return false;seen.add(placeKey);return true;}).slice(0,5);addressLookupCache.set(key,places);}
      if(version!==picker.version)return;picker.results=places;picker.list.replaceChildren(...places.map(place=>{const option=node('option');option.value=place.label;return option;}));picker.status.textContent=places.length?'Select an address suggestion to fill the coordinates.':'No Portuguese addresses found. Try a more complete address or enter GPS coordinates manually.';
    }catch(error){if(version!==picker.version)return;picker.status.textContent='Address lookup failed. Check your connection or enter GPS coordinates manually.';}
    finally{clearTimeout(timeout);if(picker.controller===controller)picker.controller=null;}
  }
  function handleAddressInput(picker){
    if(selectAddressSuggestion(picker))return;
    stopAddressLookup(picker);picker.selected=null;picker.results=[];picker.list.replaceChildren();picker.latitude.value='';picker.longitude.value='';refreshMap();updateOrderPrice();
    const query=picker.input.value.trim();if(query.length<3){picker.status.textContent='Type at least 3 characters and select a suggestion to fill the coordinates.';return;}
    const version=picker.version;picker.status.textContent='Searching Portuguese addresses…';picker.timer=setTimeout(()=>searchAddress(picker,query,version),400);
  }
  function resetAddressLookups(message='Type at least 3 characters and select a suggestion to fill the coordinates.'){
    addressPickers.forEach(picker=>{stopAddressLookup(picker);picker.results=[];picker.selected=null;picker.list.replaceChildren();picker.status.textContent=message;});
  }
  addressPickers.forEach(picker=>{picker.input.addEventListener('input',()=>handleAddressInput(picker));picker.input.addEventListener('change',()=>selectAddressSuggestion(picker));});
  function initializeMap(){if(map||!window.L){if(!window.L)$('client-map-status').textContent='Map library unavailable. Check your Internet connection. GPS inputs still work.';return;}map=L.map('client-order-map').setView(sampleMapLocation,14);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);map.on('click',e=>{const kind=document.querySelector('input[name="map-target"]:checked')?.value||'origin';$(kind==='origin'?'origin-lat':'dest-lat').value=e.latlng.lat.toFixed(6);$(kind==='origin'?'origin-lng':'dest-lng').value=e.latlng.lng.toFixed(6);refreshMap();updateOrderPrice();});refreshMap();}
  function refreshMap(){
    if(!map)return;
    clearTimeout(routeTimer);routeTimer=null;
    if(routeController){routeController.abort();routeController=null;}
    const requestId=++routeRequestId;
    for(const layer of [originMarker,destMarker,sampleMarker,roadRoute])if(layer)map.removeLayer(layer);
    originMarker=destMarker=sampleMarker=roadRoute=null;
    const getPair=(latitudeId,longitudeId)=>{const latitude=$(latitudeId).value.trim(),longitude=$(longitudeId).value.trim();if(!latitude||!longitude)return null;const lat=Number(latitude),lng=Number(longitude);return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180?[lat,lng]:null;};
    const origin=getPair('origin-lat','origin-lng'),dest=getPair('dest-lat','dest-lng'),status=$('client-map-status');
    if(origin)originMarker=L.marker(origin).addTo(map).bindPopup('Pickup / Origin');
    if(dest)destMarker=L.marker(dest).addTo(map).bindPopup('Delivery / Destination');
    if(origin&&dest){
      map.fitBounds(L.latLngBounds([origin,dest]).pad(.28),{maxZoom:14});
      status.textContent='Calculating the road route…';
      routeTimer=setTimeout(()=>drawRoadRoute(origin,dest,requestId),300);
    }else if(origin||dest){
      map.setView(origin||dest,13);
      status.textContent='Enter valid pickup and destination coordinates to display the road route.';
    }else{
      sampleMarker=L.marker(sampleMapLocation).addTo(map).bindPopup('Select pickup and destination points');
      map.setView(sampleMapLocation,14);
      status.textContent='Select both pickup and destination coordinates to display the road route.';
    }
  }
  async function drawRoadRoute(origin,dest,requestId){
    const controller=new AbortController();routeController=controller;
    let timedOut=false;
    const timeout=setTimeout(()=>{timedOut=true;controller.abort();},15000);
    try{
      const points=[origin,dest].map(([lat,lng])=>`${lng},${lat}`).join(';');
      const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson&steps=false`,{signal:controller.signal,credentials:'omit'});
      if(response.status===429)throw new Error('The road route service is busy. Please try again shortly.');
      if(!response.ok)throw new Error('The road route service is temporarily unavailable.');
      const data=await response.json(),route=data.routes?.[0],coordinates=route?.geometry?.coordinates;
      const validCoordinate=point=>Array.isArray(point)&&point.length===2&&point.every(Number.isFinite)&&Math.abs(point[0])<=180&&Math.abs(point[1])<=90;
      if(data.code!=='Ok'||route?.geometry?.type!=='LineString'||!Array.isArray(coordinates)||coordinates.length<2||!coordinates.every(validCoordinate))throw new Error('No road route was found for these locations.');
      if(requestId!==routeRequestId)return;
      roadRoute=L.polyline(coordinates.map(([lng,lat])=>[lat,lng]),{color:'#13866d',weight:5,opacity:.9}).addTo(map);
      map.fitBounds(roadRoute.getBounds().pad(.28),{maxZoom:14});
      $('client-map-status').textContent='';
    }catch(error){
      if(requestId!==routeRequestId)return;
      $('client-map-status').textContent=timedOut?'The road route request timed out. Please try again.':error.message||'Could not load the road route. Check your connection and try again.';
    }finally{
      clearTimeout(timeout);
      if(routeController===controller)routeController=null;
    }
  }
  coordIds.forEach(id=>$(id).addEventListener('input',()=>{refreshMap();updateOrderPrice();}));
  $('client-delivery-date').min=localDay();$('client-delivery-date').value=localDay();
  $('client-order-service').addEventListener('change',updateOrderPrice);
  updateOrderPrice();
  const orderForm=$('client-order-form');
  const paymentGroups=[
    {method:'mbway',section:$('mbway-payment-details'),fields:[$('client-mbway-phone')]},
    {method:'card',section:$('card-payment-details'),fields:[$('client-card-number'),$('client-card-expiry'),$('client-card-cvv')]}
  ];
  function updatePaymentDetails(){const method=orderForm.querySelector('input[name="client-payment-method"]:checked')?.value;paymentGroups.forEach(group=>{const active=group.method===method;group.section.hidden=!active;group.fields.forEach(field=>{field.disabled=!active;field.required=active;if(!active){field.value='';field.removeAttribute('aria-invalid');}});});}
  orderForm.querySelectorAll('input[name="client-payment-method"]').forEach(radio=>radio.addEventListener('change',updatePaymentDetails));
  updatePaymentDetails();
  const currentMonth=new Date();$('client-card-expiry').min=`${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}`;
  function checkControl(field){field.removeAttribute('aria-invalid');if(!field.checkValidity()){field.setAttribute('aria-invalid','true');field.focus();return false;}return true;}
  orderForm.addEventListener('submit',event=>{
    event.preventDefault();const feedback=$('client-order-feedback');feedback.textContent='';
    for(const el of [ ...orderForm.querySelectorAll('input[required],select[required]')])if(!checkControl(el)){feedback.textContent='Please fill out all required fields with valid values.';return;}
    if($('client-delivery-date').value<localDay()){feedback.textContent='The delivery date must not be in the past.';$('client-delivery-date').focus();return;}
    if(!coordValues()){feedback.textContent='Latitude must be between −90 and 90 and longitude between −180 and 180.';$('origin-lat').focus();return;}
    const items=productItems();if(items.length===0||items.some(x=>!x.description.trim()||!(x.quantity>=1&&Number.isInteger(x.quantity))||!(x.weight>0&&x.volume>0))){feedback.textContent='At least one valid product is required. Each product needs a description, quantity, weight and volume.';return;}
    const totals=updateProducts(),price=calculateOrderPrice(),paymentMethod=orderForm.querySelector('input[name="client-payment-method"]:checked')?.value;if(price===null||!paymentMethod){feedback.textContent='Check the price estimate and select MB WAY or Card.';return;}const coords=coordValues(),id=`CL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
    const pickup=$('pickup-address').value.trim(),dropoff=$('dropoff-address').value.trim();const record={id,requestKey:`cms-client-${id}`,client:profile.name,ownerEmail:profile.email,origin:pickup.split(',').slice(-1)[0].trim()||'Origin',destination:dropoff.split(',').slice(-1)[0].trim()||'Destination',pickup,dropoff,originLat:coords.origin[0],originLng:coords.origin[1],destLat:coords.dest[0],destLng:coords.dest[1],products:items,weight:totals.weight,volume:totals.volume,price,paymentMethod,pickupPoint:pickupPointForProfile(),cargo:items.map(x=>`${x.quantity}× ${x.description}`).join(', '),vehicle:'Not assigned',date:$('client-delivery-date').value,service:$('client-order-service').value,notes:$('client-order-notes').value.trim(),status:'Initiated',createdAt:now(),timeline:[{status:'Initiated',date:now()}]};
    const existing=allOrders();existing.unshift(record);if(!safeWrite(ORDER_KEY,existing)){feedback.textContent='Could not save this order. Browser storage might be blocked or full.';return;}
    notify('New order submitted',`${id} is ready for courier selection.`);
    orderForm.reset();products.replaceChildren();productNo=0;addProduct();$('client-delivery-date').value=localDay();refreshMap();updateOrderPrice();renderAll();location.hash='orders';
  });
  orderForm.addEventListener('reset',()=>{setTimeout(()=>{products.replaceChildren();productNo=0;addProduct();$('client-delivery-date').value=localDay();resetAddressLookups();updatePaymentDetails();refreshMap();updateOrderPrice();$('client-order-feedback').textContent='';},0);});
  const profileFields={'profile-name':'name','profile-email':'email','profile-phone':'phone','profile-address':'address','profile-postal':'postal','profile-city':'city'};
  function fillProfile(){Object.entries(profileFields).forEach(([id,key])=>$(id).value=profile[key]||'');}
  fillProfile();
  $('client-profile-form').addEventListener('submit',e=>{e.preventDefault();const feedback=$('profile-feedback');feedback.textContent='';for(const el of $('client-profile-form').querySelectorAll('input')){if(el.required || el.value)if(!checkControl(el)){feedback.textContent='Please check your contact details.';return;}}const updated={...profile};Object.entries(profileFields).forEach(([id,key])=>updated[key]=$(id).value.trim());if(!safeWrite(PROFILE_KEY,updated)){feedback.textContent='Unable to save your profile in this browser.';return;}const oldEmail=profile.email;profile=updated;
    if(oldEmail.toLowerCase()!==updated.email.toLowerCase()){const records=allOrders();records.filter(o=>o.ownerEmail?.toLowerCase()===oldEmail.toLowerCase()).forEach(o=>o.ownerEmail=updated.email);safeWrite(ORDER_KEY,records);}
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({email:updated.email,name:updated.name}));}catch{}
    updateUser();renderAll();feedback.style.color='var(--green)';feedback.textContent='Profile saved in this browser.';notify('Profile updated','Your contact information has been updated.');});
  function onExternalUpdate(){renderAll();}
  addEventListener('storage',event=>{if(event.key===ORDER_KEY)onExternalUpdate();});
  addEventListener('pageshow',onExternalUpdate);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)onExternalUpdate();});
  showView();
})();
