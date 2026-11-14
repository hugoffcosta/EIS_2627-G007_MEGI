// --- 1. SPA NAVIGATION ---
let mapInitialized = false;

function switchMainView(viewId, element) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar .menu-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(viewId).classList.add('active');
    element.classList.add('active');

    const sosBanner = document.getElementById('global-sos-banner');
    if(viewId === 'view-operations') {
        sosBanner.style.display = 'block';
        if(!mapInitialized && typeof L !== 'undefined') {
            setTimeout(() => { initLeafletMap(); mapInitialized = true; }, 100);
        }
    } else {
        sosBanner.style.display = 'none';
    }
}

// --- 2. GLOBAL DRAWER TOGGLE ---
function toggleDetails(id) {
    let row = document.getElementById(id);
    if (row.classList.contains('active')) {
        row.classList.remove('active');
    } else {
        let tbody = row.parentElement;
        let allDetails = tbody.querySelectorAll('.details-row');
        allDetails.forEach(r => r.classList.remove('active'));
        row.classList.add('active');
    }
}

// --- 3. GLOBAL TABLE SEARCH ---
function filterTable(inputId, tbodyId) {
    let input = document.getElementById(inputId);
    if(!input) return;
    let filter = input.value.toLowerCase();
    let tbody = document.getElementById(tbodyId);
    if(!tbody) return;
    
    let mainRows = tbody.querySelectorAll('.main-row');

    mainRows.forEach(row => {
        let detailsRow = row.nextElementSibling;
        let fullText = row.textContent.toLowerCase() + (detailsRow ? detailsRow.textContent.toLowerCase() : "");
        
        if (fullText.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            if (detailsRow) detailsRow.classList.remove('active');
        }
    });
}

// --- 4. ALERTS AND MOCK FUNCTIONS ---
function confirmAction(action, entity) {
    if (confirm("Please confirm you wish to " + action + " " + entity + "?")) { 
        alert("Operation registered in the system. Profile updated."); 
    }
}

function replyTicket(btnElement, rowId) {
    let textarea = btnElement.previousElementSibling;
    if (textarea.value.trim() === "") {
        alert("Error: Please write a reply before sending.");
        return;
    }
    alert("Success! Reply sent to the customer's email and Ticket closed.");
    textarea.value = "";
    toggleDetails(rowId); 
}

function viewDocument(name) { alert("Opening Document: " + name); }
function reallocateOrder(ordId) { alert("Success! Order " + ordId + " has been assigned to the new courier."); }
function exportReport() { alert("Compiling data...\n\nSuccess! The report has been downloaded."); }

// --- 5. TABS LOGIC ---
function switchTab(evt, tabId) {
    let container = evt.currentTarget.closest('.view-section');
    let tabContents = container.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    let tabBtns = container.querySelectorAll('.tabs .tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// Fleet Directory Tab Logic
function filterTableFleet(btnElement, filterValue) {
    let container = btnElement.closest('.controls-section');
    container.querySelectorAll('.tab-btn-pill').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    
    let mainRows = document.querySelectorAll('#tbody-fleet-dir .main-row');
    document.getElementById('search-fleet-dir').value = '';
    
    mainRows.forEach(row => {
        let type = row.getAttribute('data-type');
        let status = row.getAttribute('data-status');
        let detailsRow = row.nextElementSibling;
        
        if (filterValue === 'all' || type === filterValue || status === filterValue) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            if (detailsRow && detailsRow.classList.contains('active')) {
                detailsRow.classList.remove('active');
            }
        }
    });
}

// Payments & Billing Tab Logic (Live)
function filterTablePayments(btnElement, filterValue) {
    let container = btnElement.closest('.controls-section');
    container.querySelectorAll('.tab-btn-pill').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    
    let mainRows = document.querySelectorAll('#tbody-pay-live .main-row');
    
    let thEntity = document.getElementById('th-entity-live');
    let thRelated = document.getElementById('th-related-live');
    
    if (filterValue === 'Inbound') {
        thEntity.innerText = 'Client ID';
        thRelated.innerText = 'Order ID';
    } else if (filterValue === 'Outbound') {
        thEntity.innerText = 'Courier ID';
        thRelated.innerText = 'Total Orders';
    } else if (filterValue === 'Profit') {
        thEntity.innerText = 'Entity';
        thRelated.innerText = 'Details';
    }
    
    document.getElementById('search-pay-live').value = '';
    
    mainRows.forEach(row => {
        let type = row.getAttribute('data-type');
        let detailsRow = row.nextElementSibling;
        
        if (type === filterValue) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            if (detailsRow && detailsRow.classList.contains('active')) {
                detailsRow.classList.remove('active');
            }
        }
    });
}

function filterTableSearchFin(inputId, tbodyId) {
    let input = document.getElementById(inputId);
    let filter = input.value.toLowerCase();
    let tbody = document.getElementById(tbodyId);
    let mainRows = tbody.querySelectorAll('.main-row');

    // Find active tab inside Payments
    let activeTabBtn = document.querySelector('#view-payments .tab-btn-pill.active');
    let currentFilter = activeTabBtn ? activeTabBtn.getAttribute('data-filter') : 'Inbound';

    mainRows.forEach(row => {
        let detailsRow = row.nextElementSibling;
        let fullText = row.textContent.toLowerCase() + (detailsRow ? detailsRow.textContent.toLowerCase() : "");
        let type = row.getAttribute('data-type');
        
        if (type === currentFilter && fullText.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            if (detailsRow) detailsRow.classList.remove('active');
        }
    });
}

// Archive Payments Tab Logic
function filterTableArchivePayments(btnElement, filterValue) {
    let container = btnElement.closest('.controls-section');
    container.querySelectorAll('.tab-btn-fin').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    
    let mainRows = document.querySelectorAll('#tbody-payments-archive .main-row');
    
    let thEntity = document.getElementById('th-entity-archive');
    if (filterValue === 'Inbound') {
        thEntity.innerText = 'Client ID';
    } else if (filterValue === 'Outbound') {
        thEntity.innerText = 'Courier ID';
    }
    
    document.getElementById('search-payments-arch').value = '';
    
    mainRows.forEach(row => {
        let type = row.getAttribute('data-type');
        let detailsRow = row.nextElementSibling;
        
        if (type === filterValue) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            if (detailsRow && detailsRow.classList.contains('active')) {
                detailsRow.classList.remove('active');
            }
        }
    });
}

function filterTableSearchFinArch(inputId, tbodyId) {
    let input = document.getElementById(inputId);
    let filter = input.value.toLowerCase();
    let tbody = document.getElementById(tbodyId);
    let mainRows = tbody.querySelectorAll('.main-row');

    let activeTabBtn = document.querySelector('#view-archive .tab-btn-fin.active');
    let currentFilter = activeTabBtn ? activeTabBtn.getAttribute('data-filter') : 'Inbound';

    mainRows.forEach(row => {
        let detailsRow = row.nextElementSibling;
        let fullText = row.textContent.toLowerCase() + (detailsRow ? detailsRow.textContent.toLowerCase() : "");
        let type = row.getAttribute('data-type');
        
        if (type === currentFilter && fullText.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            if (detailsRow) detailsRow.classList.remove('active');
        }
    });
}

// --- 6. LEAFLET MAP LOGIC ---
let map;
let routeLayer; 
function initLeafletMap() {
    if(!document.getElementById('leaflet-map')) return;
    
    map = L.map('leaflet-map').setView([41.15, -8.61], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function toggleDetailsMap(id, lat1, lon1, lat2, lon2, originName, destName) {
    let row = document.getElementById(id);
    if (row.classList.contains('active')) {
        row.classList.remove('active');
        if (routeLayer) { map.removeLayer(routeLayer); }
        map.setView([41.15, -8.61], 12); 
    } else {
        let tbody = row.parentElement;
        let allDetails = tbody.querySelectorAll('.details-row');
        allDetails.forEach(r => r.classList.remove('active'));
        row.classList.add('active');

        if (routeLayer) { map.removeLayer(routeLayer); } 

        let originMarker = L.marker([lat1, lon1]).bindPopup("<b>Pickup Address:</b> " + originName);
        let destMarker = L.marker([lat2, lon2]).bindPopup("<b>Delivery Address:</b> " + destName);
        routeLayer = L.featureGroup([originMarker, destMarker]).addTo(map);

        let osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

        fetch(osrmUrl)
        .then(response => response.json())
        .then(data => {
            if(data.routes && data.routes.length > 0) {
                let coords = data.routes[0].geometry.coordinates;
                let latLngs = coords.map(c => [c[1], c[0]]);
                let pathLine = L.polyline(latLngs, {
                    color: id === 'details-ord-sos' ? '#ef4444' : '#3b82f6', 
                    weight: 5
                }).addTo(routeLayer);
                map.fitBounds(routeLayer.getBounds(), {padding: [50, 50]});
            }
        }).catch(err => {
            let pathLine = L.polyline([[lat1, lon1], [lat2, lon2]], {
                color: id === 'details-ord-sos' ? '#ef4444' : '#3b82f6', weight: 5, dashArray: '10, 10' 
            }).addTo(routeLayer);
            map.fitBounds(routeLayer.getBounds(), {padding: [50, 50]});
        });
    }
}