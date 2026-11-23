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
        brand: 'The brand must contain only letters and spaces.',
        'vehicle-color': 'The color must contain only letters and spaces.'
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
            const container = field.closest('.form-group, .profile-photo-area, .document-upload-card, .documents-upload-area, .vehicle-type-section, .terms-checkbox') || field.parentElement;
            if (container.matches('.terms-checkbox')) container.after(error);
            else container.append(error);
        }
        const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
        descriptions.add(id);
        field.setAttribute('aria-describedby', [...descriptions].join(' '));
        return error;
    }

    function showError(field, message) {
        message = window.TrustPortLanguage?.translate(message) ?? message;
        field.setCustomValidity(message);
        field.setAttribute('aria-invalid', String(Boolean(message)));
        errorElement(field).textContent = message;
        if (field.type === 'file') field.form?.querySelector(`label[for="${field.id}"]`)?.classList.toggle('invalid-upload', Boolean(message));
    }

    function fileMessage(field) {
        if (!field.files.length) return field.required ? 'Select the required documents.' : '';
        const photo = field.id === 'profile-photo';
        const extensions = photo ? /\.(jpe?g|png)$/i : /\.(pdf|jpe?g|png)$/i;
        if ([...field.files].some(file => !extensions.test(file.name))) return 'Invalid file format. Use ' + (photo ? 'JPG or PNG.' : 'PDF, JPG or PNG.');
        if (photo && field.files[0].size > 5 * 1024 * 1024) return 'The photo cannot exceed 5 MB.';
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
        if (key === 'license-plate' && !platePattern.test(field.value)) return 'Use the license plate format XX-XX-XX. Each pair must contain two letters or two numbers (e.g. AA-12-BB).';
        if (field.hasAttribute('data-digits') && !/^[0-9]+$/.test(field.value)) return 'Enter digits only (0-9).';
        if (key === 'vehicle-year' && (!/^\d{4}$/.test(field.value) || Number(field.value) < 2000 || Number(field.value) > 2026)) return 'Enter a four-digit year between 2000 and 2026.';
        if (['max-weight', 'max-volume'].includes(key) && Number(field.value) <= 0) return 'Enter a capacity greater than zero.';
        if (field.validity.patternMismatch) return 'Enter this field in the required format.';
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
            if (!formatted) return 'Enter letters and numbers only. Hyphens are inserted automatically.';
            field.value = formatted.value;
            field.setSelectionRange(formatted.caret, formatted.caret);
        }
        if (vehicleIds.has(key) && field.hasAttribute('data-digits') && /[^0-9]/.test(field.value)) return 'Enter digits only (0-9).';
        return '';
    }

    function focusInput(field) {
        if (field.type === 'file') field.form.querySelector(`label[for="${field.id}"]`).focus();
        else if (field.type === 'radio') field.closest('.vehicle-option').focus();
        else field.focus();
    }

    function setupKeyboard(form) {
        form.querySelectorAll('.photo-upload, .documents-upload-box, .vehicle-option').forEach(label => {
            label.tabIndex = 0;
            label.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); label.click(); }
            });
        });
    }

    const uploadUpdates=new WeakMap();

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
                const locked=field.closest('.review-card')?.classList.contains('is-locked');
                summary.textContent = field.files.length ? [...field.files].map(file => file.name).join(', ') : (locked ? 'No file uploaded.' : (photo ? 'Without photo.' : 'No document selected.'));
                remove.hidden = !field.files.length;
            };
            uploadUpdates.set(field,update);
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


    const form = document.querySelector('.registration-form');
    const vehicleBatch=mountVehicleBatch(form.querySelector('[data-vehicle-batch]'));
    const steps = [...form.querySelectorAll('.form-step')];
    const fields = [...form.querySelectorAll('input[name]:not(.step-radio):not([type="hidden"]), select')];
    const previousValues = new WeakMap();
    const lettersOnlyMessages = {
        'full-name': 'The full name must contain only letters and spaces.',
    };

    // Validate hidden steps ourselves before the browser attempts to focus them.
    form.noValidate = true;


    function validationMessage(field) {
        const vehicleError = vehicleMessage(field);
        if (vehicleError !== null) return vehicleError;
        if (field.type === 'checkbox') return field.checked ? '' : 'Confirm that the information and documents are correct.';
        if (!field.value.trim()) return field.required ? 'This field is required.' : '';
        if (field.id === 'courier-iban' && !/^[A-Z]{2}[0-9]+$/.test(field.value)) return 'Enter two uppercase letters followed by numbers only, without spaces.';
        if (field.id === 'registration-password') {
            if (field.value.length < 8) return 'Use at least 8 characters.';
            if (!/\p{Lu}/u.test(field.value)) return 'Include at least one uppercase letter.';
            if (!/[0-9]/.test(field.value)) return 'Include at least one number.';
        }
        if (field.id === 'registration-password-confirm' && field.value !== document.getElementById('registration-password').value) return 'The passwords do not match.';
        if (lettersOnlyMessages[field.id] && /[^\p{L}\p{M} ]/u.test(field.value)) return lettersOnlyMessages[field.id];
        if (field.hasAttribute('data-digits') && !/^[0-9]+$/.test(field.value)) return 'Enter digits only (0-9).';
        if (field.id === 'phone' && !/^[0-9]{9}$/.test(field.value)) return 'The phone number must contain exactly 9 digits.';
        if (field.id === 'nif' && !/^[0-9]{9}$/.test(field.value)) return 'The tax number must contain exactly 9 digits.';
        if (field.id === 'postal-code' && !/^\d{4}-\d{3}$/.test(field.value)) return 'Enter the postal code in XXXX-XXX format (e.g. 4000-123).';
        if (field.validity.typeMismatch) return 'Enter a valid email address.';
        if (field.validity.patternMismatch) return 'Enter this field in the required format.';
        return '';
    }

    function validate(field) {
        field.setCustomValidity('');
        const message = validationMessage(field);
        showError(field, message);
        return !message;
    }

    function focusField(field) {
        if (field.id === 'city') document.getElementById('postal-code').focus();
        else focusInput(field);
    }

    function validateFields(list) {
        let firstInvalid;
        list.forEach(field => {
            if (!validate(field) && !firstInvalid) firstInvalid = field;
        });
        if (firstInvalid) {
            const card = firstInvalid.closest('.review-card');
            if (card) setBlockEditing(card, true);
            focusField(firstInvalid);
        }
        return !firstInvalid;
    }

    function validateStep(step) {
        return validateFields(fields.filter(field => step.contains(field)));
    }

    bindFields(fields, {
        validate,
        previous: previousValues,
        onInput(field) {
            if (lettersOnlyMessages[field.id] && /[^\p{L}\p{M} ]/u.test(field.value)) return lettersOnlyMessages[field.id];
            const digitsOnly = field.hasAttribute('data-digits') && !field.closest('.vehicle-grid');
            const formatted = field.id === 'postal-code';
            if ((digitsOnly && /[^0-9]/.test(field.value)) || (formatted && /[^0-9-]/.test(field.value))) {
                return digitsOnly ? 'Enter digits only (0-9).' : 'Use digits and hyphens only, in the required format.';
            }
            return '';
        }
    });

    function setPasswordVisibility(button,visible) {
        document.getElementById(button.dataset.passwordToggle).type=visible?'text':'password';
        button.setAttribute('aria-pressed',String(visible));
        const label=button.dataset.passwordToggle==='registration-password'?'password':'password confirmation';
        button.setAttribute('aria-label',`${visible?'Hide':'Show'} ${label}`);
    }
    const passwordToggles=[...form.querySelectorAll('[data-password-toggle]')];
    passwordToggles.forEach(button=>button.addEventListener('click',()=>{
        setPasswordVisibility(button,button.getAttribute('aria-pressed')!=='true');
    }));

    const registrationPassword=document.getElementById('registration-password');
    const passwordConfirmation=document.getElementById('registration-password-confirm');
    registrationPassword.addEventListener('input',()=>{
        if(passwordConfirmation.value || passwordConfirmation.hasAttribute('aria-invalid')) validate(passwordConfirmation);
    });

    const postalCode = document.getElementById('postal-code');
    const district = document.getElementById('city');
    const districtValue = document.getElementById('district-value');
    const postalStatus = document.getElementById('postal-code-status');
    const postalRetry = document.getElementById('retry-postal-lookup');
    const postalCache = new Map();
    let postalTimer;
    let postalController;
    let postalRequest = 0;
    let lastPostalCode;
    let postalState = 'idle';

    function postalLookupFailed(message) {
        postalState = 'failed';
        postalStatus.textContent = message;
        postalRetry.hidden = false;
        showError(district, '');
    }

    function cancelPostalLookup() {
        clearTimeout(postalTimer);
        if (postalController) postalController.abort();
        postalController = null;
        postalRequest++;
    }

    async function lookupDistrict(code, request, attempt = 0) {
        if (request !== postalRequest || postalCode.value !== code) return;
        const controller = new AbortController();
        postalController = controller;
        let timedOut = false;
        const timeout = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, 12000);
        try {
            let name = postalCache.get(code);
            if (!name) {
                // GEO API PT: https://geoapi.pt/docs/ — complete CP4-CP3 lookup.
                const response = await fetch(`https://json.geoapi.pt/cp/${encodeURIComponent(code)}`, {
                    signal: controller.signal,
                    credentials: 'omit',
                    referrerPolicy: 'no-referrer'
                });
                if (response.status === 404) {
                    if (request === postalRequest) {
                        postalLookupFailed('Postal code not found. Check the code entered.');
                        postalState = 'not-found';
                    }
                    return;
                }
                if (!response.ok) {
                    const error = new Error('Postal lookup failed');
                    error.status = response.status;
                    throw error;
                }
                const data = await response.json();
                name = data.Distrito || data.distrito;
                if (typeof name !== 'string' || !name.trim()) throw new Error('Missing district');
            }
            // Ignore replies for an older code or a cancelled request.
            if (request !== postalRequest || postalCode.value !== code) return;
            const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();
            const option = [...district.options].find(item => item.value && normalize(item.value) === normalize(name));
            if (!option) {
                postalLookupFailed('This postal code does not match any of the 18 available districts. Check the postal code.');
                postalState = 'unsupported';
                return;
            }
            postalCache.set(code, name);
            district.value = option.value;
            districtValue.value = option.value;
            validate(district);
            postalState = 'success';
            postalRetry.hidden = true;
            postalStatus.textContent = `District filled automatically: ${option.textContent}.`;
        } catch (error) {
            if (request !== postalRequest || postalCode.value !== code) return;
            // Network/CORS errors, slow responses and server errors can happen
            // even with a working Internet connection. Retry transient failures once.
            const retryable = !error.status || error.status >= 500 || error.status === 408;
            if (retryable && attempt === 0) {
                postalStatus.textContent = 'The postal code service is taking longer than expected. Retrying...';
                postalTimer = setTimeout(() => lookupDistrict(code, request, attempt + 1), 800);
                return;
            }
            const message = error.status === 429
                ? 'The postal code service has reached its request limit. Wait a moment and try again.'
                : timedOut
                    ? 'The postal code service timed out. You can continue without a district or try again.'
                    : 'The postal code service did not return a valid response. You can continue without a district or try again.';
            postalLookupFailed(message);
        } finally {
            clearTimeout(timeout);
            if (postalController === controller) postalController = null;
        }
    }

    function schedulePostalLookup(force = false) {
        const code = postalCode.value;
        if (code === lastPostalCode && !force && postalState !== 'failed') return;
        lastPostalCode = code;
        cancelPostalLookup();
        district.value = '';
        districtValue.value = '';
        showError(district, '');
        postalRetry.hidden = true;
        postalStatus.textContent = '';
        postalState = 'idle';
        if (!/^\d{4}-\d{3}$/.test(code)) return;
        postalState = 'pending';
        postalStatus.textContent = 'Looking up the district...';
        const request = postalRequest;
        postalTimer = setTimeout(() => lookupDistrict(code, request), 350);
    }

    postalCode.addEventListener('input', () => schedulePostalLookup());
    postalCode.addEventListener('change', () => schedulePostalLookup());
    postalCode.addEventListener('blur', () => schedulePostalLookup());
    postalRetry.addEventListener('click', () => {
        schedulePostalLookup(true);
    });
    schedulePostalLookup();

    setupKeyboard(form);

    // Reuse the original controls in review: values, files, listeners and rules
    // stay attached to a single field, including the postal lookup.
    const reviewSections = [
        ['.fields-area .form-grid', 'review-personal-fields'],
        ['.profile-photo-area', 'review-photo-fields'],
        ['.vehicle-batch', 'review-vehicle-fields'],
        ['.documents-upload-area', 'review-document-fields']
    ].map(([selector, destination]) => {
        const node = form.querySelector(selector);
        const home = document.createComment('Original position of review fields');
        node.before(home);
        return { node, home, destination: document.getElementById(destination) };
    });

    const reviewCards = [...form.querySelectorAll('.review-card')];

    function setBlockEditing(card, editing) {
        card.querySelector('.review-block-fields').disabled = !editing;
        card.classList.toggle('is-editing', editing);
        card.classList.toggle('is-locked', !editing);
        card.querySelectorAll('select').forEach(field=>field.classList.toggle('review-empty-value',!editing&&!field.value));
        card.querySelectorAll('input[type="file"]').forEach(field=>uploadUpdates.get(field)?.());
        card.querySelector('[data-review-edit]').hidden = editing;
        card.querySelector('[data-review-save]').hidden = !editing;
        card.querySelectorAll('.photo-upload, .documents-upload-box, .vehicle-option').forEach(label => {
            label.tabIndex = editing ? 0 : -1;
        });
    }

    function openReviewCard() {
        return reviewCards.find(card => card.classList.contains('is-editing'));
    }

    function requestBlockSave(card) {
        card.querySelector('.review-block-status').textContent = 'Click Save to save changes to this section.';
        card.querySelector('[data-review-save]').focus();
    }

    reviewCards.forEach(card => {
        card.querySelector('[data-review-edit]').addEventListener('click', () => {
            setBlockEditing(card, true);
            card.querySelector('.review-block-status').textContent = 'Editing. Save your changes when finished.';
            const first = fields.find(field => card.contains(field) && !field.disabled);
            if (first) focusField(first);
        });
        card.querySelector('[data-review-save]').addEventListener('click', () => {
            if (!validateFields(fields.filter(field => card.contains(field)))) {
                card.querySelector('.review-block-status').textContent = 'Correct the highlighted fields before saving.';
                return;
            }
            setBlockEditing(card, false);
            card.querySelector('.review-block-status').textContent = 'Changes saved.';
            card.querySelector('[data-review-edit]').focus();
        });
    });

    function mountReview() {
        passwordToggles.forEach(button=>setPasswordVisibility(button,false));
        reviewSections.forEach(({ node, destination }) => destination.append(node));
        reviewCards.forEach(card => {
            setBlockEditing(card, false);
            card.querySelector('.review-block-status').textContent = '';
        });
    }

    function restoreSteps() {
        reviewCards.forEach(card => setBlockEditing(card, true));
        reviewSections.forEach(({ node, home }) => home.after(node));
        reviewCards.forEach(card => setBlockEditing(card, false));
    }

    setupUploads(form);
    vehicleBatch.root.addEventListener('cms:vehicle-added',event=>{
        const card=event.detail.card,added=[...card.querySelectorAll('input[name],select')];
        fields.push(...added);bindFields(added,{validate,previous:previousValues});setupKeyboard(card);setupUploads(card);
    });
    vehicleBatch.root.addEventListener('cms:vehicle-removed',event=>{
        for(let index=fields.length-1;index>=0;index--)if(event.detail.card.contains(fields[index]))fields.splice(index,1);
    });

    const companyAffiliation = document.getElementById('company-affiliation');
    const companyCertificate = document.getElementById('company-certificate');
    const companyId = document.getElementById('company-id');
    function syncCompanyCertificate() {
        const affiliated = companyAffiliation.value === 'yes';
        document.getElementById('company-id-section').hidden = !affiliated;
        companyId.disabled = !affiliated;
        companyId.required = affiliated;
        document.getElementById('company-certificate-section').hidden = !affiliated;
        companyCertificate.disabled = !affiliated;
        if (!affiliated) {
            companyId.value = '';
            showError(companyId, '');
            companyCertificate.value = '';
            showError(companyCertificate, '');
            companyCertificate.dispatchEvent(new Event('change', {bubbles: true}));
        }
    }
    companyAffiliation.addEventListener('change', syncCompanyCertificate);
    syncCompanyCertificate();

    function navigateStep(target) {
        const current = Number(form.querySelector('.step-radio:checked').id.slice(-1)) - 1;
        if (current === 3 && openReviewCard()) {
            requestBlockSave(openReviewCard());
            return;
        }
        if (current === 3 && target < 3) restoreSteps();
        if (target > current) {
            for (let index = 0; index < target; index++) {
                document.getElementById(`step${index + 1}`).checked = true;
                if (!validateStep(steps[index])) return;
            }
        }
        if (target === 3) mountReview();
        document.getElementById(`step${target + 1}`).checked = true;
    }

    form.querySelectorAll('[data-step]').forEach(button => {
        button.addEventListener('click', () => {
            navigateStep(Number(button.dataset.step.slice(-1)) - 1);
        });
    });

    if (document.getElementById('step4').checked) mountReview();

    const registrationSuccess = document.getElementById('registration-success');
    document.getElementById('close-registration-success').addEventListener('click', () => {
        window.location.href = 'menu_registration.html';
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const current = Number(form.querySelector('.step-radio:checked').id.slice(-1)) - 1;
        if (current < 3) {
            navigateStep(current + 1);
            return;
        }
        const editing = openReviewCard();
        if (editing) {
            requestBlockSave(editing);
            return;
        }
        // Enable saved fields for validation and inclusion in the submitted form.
        reviewCards.forEach(card => { card.querySelector('.review-block-fields').disabled = false; });
        if (!validateFields(fields)) {
            reviewCards.forEach(card => {
                card.querySelector('.review-block-fields').disabled = !card.classList.contains('is-editing');
            });
            return;
        }
        const data = new FormData(form);   // criado antes de voltar a bloquear os cartões da revisão
        data.append('role', 'courier');
        reviewCards.forEach(card => setBlockEditing(card, false));
        let status = document.getElementById('courier-form-status');
        if (!status) {
            status = document.createElement('p');
            status.id = 'courier-form-status';
            status.className = 'field-error';
            status.setAttribute('role', 'alert');
            form.querySelector('.final-navigation').before(status);
        }
        status.textContent = '';
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        try {
            const response = await fetch('backend/api/auth.php?action=register', { method: 'POST', body: data });
            const result = await response.json();
            if (!response.ok || !result.ok) {
                status.textContent = result.error || 'Registration failed.';
                return;
            }
            if (!registrationSuccess.open) registrationSuccess.showModal();
        } catch (error) {
            status.textContent = 'Could not reach the server. Check that Apache and MySQL are running in XAMPP.';
        } finally {
            submitButton.disabled = false;
        }    });
})();
