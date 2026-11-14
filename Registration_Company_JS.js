(() => {
    'use strict';

    const form = document.getElementById('company-registration-form');
    const batchRoot = form.querySelector('[data-vehicle-batch]');
    const list = batchRoot.querySelector('[data-vehicle-list]');
    const template = list.querySelector('.vehicle-batch-card').cloneNode(true);
    const companyFields = [...form.querySelectorAll('#company-name,#company-nif,#company-email,#company-address,#company-password,#company-password-confirm')];
    const vehicleKeys = ['vehicle_type','brand','model','vehicle-color','vehicle-year','license-plate','fuel','max-weight','max-volume'];
    const platePattern = /^(?:[A-Z]{2}|[0-9]{2})-(?:[A-Z]{2}|[0-9]{2})-(?:[A-Z]{2}|[0-9]{2})$/;
    let nextVehicleIndex = 0;

    function errorElement(field) {
        const id = `${field.id || field.name}-error`;
        let error = document.getElementById(id);
        if (!error) {
            error = document.createElement('p');
            error.id = id;
            error.className = 'field-error';
            error.setAttribute('aria-live','polite');
            const container = field.closest('.form-group,.vehicle-type-section,.document-upload-card') || field.parentElement;
            container.append(error);
        }
        const describedBy = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        describedBy.add(id);
        field.setAttribute('aria-describedby',[...describedBy].join(' '));
        return error;
    }

    function showError(field,message) {
        field.setCustomValidity(message);
        field.setAttribute('aria-invalid',String(Boolean(message)));
        errorElement(field).textContent = message;
        if (field.type === 'file') form.querySelector(`label[for="${field.id}"]`)?.classList.toggle('invalid-upload',Boolean(message));
    }

    function companyMessage(field) {
        const value = field.value.trim();
        if (!value) return 'This field is required.';
        if (field.id === 'company-nif' && !/^\d{9}$/.test(value)) return 'The company tax number must contain exactly 9 digits.';
        if (field.id === 'company-email' && field.validity.typeMismatch) return 'Enter a valid email address.';
        if (field.id === 'company-password') {
            if (value.length < 8) return 'Use at least 8 characters.';
            if (!/\p{Lu}/u.test(value)) return 'Include at least one uppercase letter.';
            if (!/\d/.test(value)) return 'Include at least one number.';
        }
        if (field.id === 'company-password-confirm' && value !== document.getElementById('company-password').value) return 'The passwords do not match.';
        return '';
    }

    function validateCompanyField(field) {
        const message = companyMessage(field);
        showError(field,message);
        return !message;
    }

    function formatPlate(field) {
        const characters = field.value.replace(/[^a-z0-9]/gi,'').toUpperCase().slice(0,6);
        field.value = characters.match(/.{1,2}/g)?.join('-') || '';
    }

    function cardHasData(card) {
        return [...card.querySelectorAll('input,select')].some(field => field.type === 'radio' ? field.checked : field.type === 'file' ? field.files.length : field.value.trim());
    }

    function vehicleFieldKey(field) {
        return field.dataset.vehicleField || field.id;
    }

    function duplicatePlate(field) {
        if (vehicleFieldKey(field) !== 'license-plate' || !field.value.trim()) return false;
        const plate = field.value.trim().toUpperCase();
        return [...form.querySelectorAll('[data-vehicle-field="license-plate"]')].some(other => other !== field && other.value.trim().toUpperCase() === plate);
    }

    function vehicleMessage(field) {
        const card = field.closest('.vehicle-batch-card');
        if (!cardHasData(card)) return '';
        const key = vehicleFieldKey(field);
        if (field.type === 'file') {
            if (!field.files.length) return '';
            return [...field.files].some(file => !/\.(pdf|jpe?g|png)$/i.test(file.name)) ? 'Use a PDF, JPG or PNG file.' : '';
        }
        if (key === 'vehicle_type') return card.querySelector('input[type="radio"]:checked') ? '' : 'Select a vehicle type.';
        const value = field.value.trim();
        if (vehicleKeys.includes(key) && !value) return 'Complete this field for the vehicle.';
        if (['brand','vehicle-color'].includes(key) && /[^\p{L}\p{M} .'-]/u.test(value)) return 'Use letters, spaces, apostrophes, dots or hyphens only.';
        if (key === 'vehicle-year' && (!/^\d{4}$/.test(value) || Number(value) < 2000 || Number(value) > 2026)) return 'Enter a four-digit year between 2000 and 2026.';
        if (key === 'license-plate' && !platePattern.test(value.toUpperCase())) return 'Use the licence plate format XX-XX-XX (e.g. AA-12-BB).';
        if (duplicatePlate(field)) return 'This licence plate is already included in the request.';
        if (key === 'max-weight' && (!/^\d+$/.test(value) || Number(value) <= 0)) return 'Enter a weight greater than zero using digits only.';
        if (key === 'max-volume' && (!/^\d+(?:[.,]\d+)?$/.test(value) || Number(value.replace(',','.')) <= 0)) return 'Enter a volume greater than zero.';
        return '';
    }

    function validateVehicleField(field) {
        const message = vehicleMessage(field);
        showError(field,message);
        return !message;
    }

    function setupUpload(field) {
        const summary = document.createElement('p');
        summary.className = 'selected-files';
        summary.setAttribute('aria-live','polite');
        field.after(summary);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-file-button';
        remove.textContent = 'Remove file';
        summary.after(remove);
        const update = () => {
            summary.textContent = field.files.length ? [...field.files].map(file => file.name).join(', ') : 'No file selected.';
            remove.hidden = !field.files.length;
        };
        remove.addEventListener('click',() => {
            field.value = '';
            update();
            validateVehicleCard(field.closest('.vehicle-batch-card'));
        });
        field.addEventListener('change',() => {
            update();
            validateVehicleField(field);
        });
        update();
    }

    function prepareCard(card) {
        const index = nextVehicleIndex++;
        const ids = new Map();
        card.dataset.vehicleIndex = String(index);
        card.querySelectorAll('input[name],select[name]').forEach(field => {
            const originalId = field.id || field.name;
            field.dataset.vehicleField = originalId;
            field.name = `vehicles[${index}][${field.name}]`;
            if (index) {
                if (field.type === 'radio' || field.type === 'checkbox') field.checked = false;
                else field.value = '';
            }
        });
        card.querySelectorAll('[id]').forEach(node => {
            const original = node.id;
            const next = index ? `${original}-vehicle-${index}` : original;
            ids.set(original,next);
            node.id = next;
        });
        card.querySelectorAll('[for],[aria-labelledby],[aria-describedby]').forEach(node => {
            for (const attribute of ['for','aria-labelledby','aria-describedby']) {
                if (!node.hasAttribute(attribute)) continue;
                node.setAttribute(attribute,node.getAttribute(attribute).split(/\s+/).map(id => ids.get(id) || id).join(' '));
            }
        });
        setupCard(card);
        return card;
    }

    function setupCard(card) {
        card.querySelectorAll('.documents-upload-box,.vehicle-option').forEach(label => {
            label.tabIndex = 0;
            label.addEventListener('keydown',event => {
                if (!['Enter',' '].includes(event.key)) return;
                event.preventDefault();
                label.click();
            });
        });
        card.querySelectorAll('input[name],select[name]').forEach(field => {
            if (field.type === 'file') setupUpload(field);
            field.addEventListener('input',() => {
                const key = vehicleFieldKey(field);
                if (key === 'license-plate') formatPlate(field);
                if (['vehicle-year','max-weight'].includes(key)) field.value = field.value.replace(/\D/g,'');
                validateVehicleField(field);
            });
            field.addEventListener('change',() => validateVehicleCard(card));
            errorElement(field);
        });
    }

    function validateVehicleCard(card) {
        let valid = true;
        card.querySelectorAll('input[name],select[name]').forEach(field => {
            if (!validateVehicleField(field)) valid = false;
        });
        return valid;
    }

    function refreshCards() {
        const cards = [...list.querySelectorAll('.vehicle-batch-card')];
        cards.forEach((card,index) => {
            card.querySelector('[data-vehicle-heading]').textContent = `Vehicle ${index + 1}`;
            card.querySelector('[data-remove-vehicle]').disabled = cards.length === 1;
        });
        batchRoot.querySelector('[data-vehicle-count]').textContent = `${cards.length} vehicle${cards.length === 1 ? '' : 's'} in this request`;
    }

    function vehicleRecords() {
        return [...list.querySelectorAll('.vehicle-batch-card')].filter(cardHasData).map(card => {
            const record = {};
            card.querySelectorAll('input[name],select[name]').forEach(field => {
                const key = vehicleFieldKey(field);
                if (field.type === 'radio') { if (field.checked) record[key] = field.value; }
                else if (field.type === 'file') record[key] = [...field.files].map(file => file.name);
                else record[key] = field.value.trim();
            });
            return record;
        });
    }

    prepareCard(list.firstElementChild);
    refreshCards();
    batchRoot.querySelector('[data-add-vehicle]').addEventListener('click',() => {
        const card = prepareCard(template.cloneNode(true));
        list.append(card);
        refreshCards();
        card.querySelector('input,select').focus();
    });
    batchRoot.addEventListener('click',event => {
        const button = event.target.closest('[data-remove-vehicle]');
        if (!button || button.disabled) return;
        button.closest('.vehicle-batch-card').remove();
        refreshCards();
        batchRoot.querySelector('[data-add-vehicle]').focus();
    });

    companyFields.forEach(field => {
        errorElement(field);
        field.addEventListener('input',() => {
            if (field.id === 'company-nif') field.value = field.value.replace(/\D/g,'').slice(0,9);
            validateCompanyField(field);
            if (field.id === 'company-password' && document.getElementById('company-password-confirm').value) validateCompanyField(document.getElementById('company-password-confirm'));
        });
        field.addEventListener('blur',() => validateCompanyField(field));
    });

    form.querySelectorAll('[data-password-toggle]').forEach(button => button.addEventListener('click',() => {
        const field = document.getElementById(button.dataset.passwordToggle);
        const visible = field.type === 'password';
        field.type = visible ? 'text' : 'password';
        button.setAttribute('aria-pressed',String(visible));
        button.setAttribute('aria-label',`${visible ? 'Hide' : 'Show'} ${field.id.endsWith('confirm') ? 'password confirmation' : 'password'}`);
    }));

    function generateCompanyId() {
        const values = new Uint32Array(2);
        if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(values);
        else { values[0] = Date.now(); values[1] = Math.floor(Math.random() * 0xffffffff); }
        const code = `${values[0].toString(36)}${values[1].toString(36)}`.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8).padEnd(8,'0');
        return `COMP-${new Date().getFullYear()}-${code}`;
    }

    form.addEventListener('submit',event => {
        event.preventDefault();
        let firstInvalid = null;
        companyFields.forEach(field => { if (!validateCompanyField(field) && !firstInvalid) firstInvalid = field; });
        [...list.querySelectorAll('.vehicle-batch-card')].forEach(card => {
            if (!validateVehicleCard(card) && !firstInvalid) firstInvalid = card.querySelector('[aria-invalid="true"]');
        });
        if (firstInvalid) {
            document.getElementById('company-form-status').textContent = 'Review the highlighted fields before submitting the registration.';
            firstInvalid.focus();
            firstInvalid.scrollIntoView({behavior:'smooth',block:'center'});
            return;
        }
        document.getElementById('company-form-status').textContent = '';
        const companyId = generateCompanyId();
        const vehicles = vehicleRecords();
        const request = {
            companyId,
            companyName: document.getElementById('company-name').value.trim(),
            nif: document.getElementById('company-nif').value.trim(),
            address: document.getElementById('company-address').value.trim(),
            email: document.getElementById('company-email').value.trim(),
            vehicleCount: vehicles.length,
            vehicles,
            status: 'pending_approval',
            submittedAt: new Date().toISOString()
        };
        form.companyRegistrationRequest = request;
        document.getElementById('generated-company-id').textContent = companyId;
        const dialog = document.getElementById('company-registration-success');
        if (!dialog.open) dialog.showModal();
    });

    document.getElementById('close-company-success').addEventListener('click',() => {
        window.location.href = 'menu_registration.html';
    });
})();
