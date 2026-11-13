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
        if (photo && field.files[0].size > 5 * 1024 * 1024) return 'The photo cannot exceed 5 MB.';
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
        form.querySelectorAll('.photo-upload, .documents-upload-box, .vehicle-option').forEach(label => {
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


    const form = document.querySelector('.registration-form');
    const steps = [...form.querySelectorAll('.form-step')];
    const fields = [...form.querySelectorAll('input[name]:not(.step-radio):not([type="hidden"]), select')];
    const previousValues = new WeakMap();
    const lettersOnlyMessages = {
        'full-name': 'O nome completo deve conter apenas letras e espaços.',
    };

    // Validate hidden steps ourselves before the browser attempts to focus them.
    form.noValidate = true;


    function validationMessage(field) {
        const vehicleError = vehicleMessage(field, form);
        if (vehicleError !== null) return vehicleError;
        if (field.type === 'checkbox') return field.checked ? '' : 'Confirme que as informações e os documentos estão corretos.';
        if (!field.value.trim()) return field.required ? 'Este campo é obrigatório.' : '';
        if (lettersOnlyMessages[field.id] && /[^\p{L}\p{M} ]/u.test(field.value)) return lettersOnlyMessages[field.id];
        if (field.hasAttribute('data-digits') && !/^[0-9]+$/.test(field.value)) return 'Introduza apenas dígitos (0–9).';
        if (field.id === 'phone' && !/^[0-9]{9}$/.test(field.value)) return 'O número de telefone deve conter exatamente 9 dígitos.';
        if (field.id === 'nif' && !/^[0-9]{9}$/.test(field.value)) return 'O NIF deve conter exatamente 9 dígitos.';
        if (field.id === 'cc-number' && !/^[0-9]{8}$/.test(field.value)) return 'O cartão de cidadão deve conter exatamente 8 dígitos.';
        if (field.id === 'birth-date') {
            const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(field.value);
            if (!match) return 'Introduza a data no formato DD-MM-AAAA.';
            const [, day, month, year] = match.map(Number);
            const date = new Date(year, month - 1, day);
            if (year < 1000 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return 'Introduza uma data válida no formato DD-MM-AAAA.';
            if (date > new Date()) return 'A data de nascimento não pode ser futura.';
            if (date > latestAdultBirthDate()) return 'Tem de ter pelo menos 18 anos para se registar como courier.';
        }
        if (field.id === 'postal-code' && !/^\d{4}-\d{3}$/.test(field.value)) return 'Introduza o código postal no formato XXXX-XXX (ex.: 4000-123).';
        if (field.validity.typeMismatch) return 'Introduza um endereço de email válido.';
        if (field.validity.patternMismatch) return 'Preencha este campo no formato indicado.';
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
            const formatted = ['birth-date', 'postal-code'].includes(field.id);
            if ((digitsOnly && /[^0-9]/.test(field.value)) || (formatted && /[^0-9-]/.test(field.value))) {
                return digitsOnly ? 'Introduza apenas d\u00edgitos (0\u20139).' : 'Utilize apenas d\u00edgitos e h\u00edfen no formato indicado.';
            }
            return '';
        }
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
                        postalLookupFailed('Código postal não encontrado. Verifique o código introduzido.');
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
                postalLookupFailed('Este código postal não corresponde a um dos 18 distritos disponíveis. Verifique o código postal.');
                postalState = 'unsupported';
                return;
            }
            postalCache.set(code, name);
            district.value = option.value;
            districtValue.value = option.value;
            validate(district);
            postalState = 'success';
            postalRetry.hidden = true;
            postalStatus.textContent = `Distrito preenchido automaticamente: ${option.textContent}.`;
        } catch (error) {
            if (request !== postalRequest || postalCode.value !== code) return;
            // Network/CORS errors, slow responses and server errors can happen
            // even with a working Internet connection. Retry transient failures once.
            const retryable = !error.status || error.status >= 500 || error.status === 408;
            if (retryable && attempt === 0) {
                postalStatus.textContent = 'O serviço de códigos postais está a demorar. A tentar novamente…';
                postalTimer = setTimeout(() => lookupDistrict(code, request, attempt + 1), 800);
                return;
            }
            const message = error.status === 429
                ? 'O serviço de códigos postais atingiu o limite de consultas. Aguarde um pouco e volte a consultar.'
                : timedOut
                    ? 'O serviço de códigos postais demorou demasiado a responder. Pode continuar sem distrito ou voltar a consultar.'
                    : 'Não foi possível obter uma resposta válida do serviço de códigos postais. Pode continuar sem distrito ou voltar a consultar.';
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
        postalStatus.textContent = 'A procurar o distrito…';
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

    const birthDate = document.getElementById('birth-date');
    const datePicker = document.getElementById('birth-date-picker');
    function updateBirthDateLimit() {
        const latest = new Date();
        datePicker.max = `${latest.getFullYear()}-${String(latest.getMonth() + 1).padStart(2, '0')}-${String(latest.getDate()).padStart(2, '0')}`;
    }
    updateBirthDateLimit();

    function syncDatePicker() {
        datePicker.value = birthDate.value && !validationMessage(birthDate)
            ? birthDate.value.split('-').reverse().join('-') : '';
    }

    birthDate.addEventListener('input', syncDatePicker);
    syncDatePicker();
    datePicker.addEventListener('click', () => {
        updateBirthDateLimit();
        syncDatePicker();
        if (typeof datePicker.showPicker === 'function') datePicker.showPicker();
    });
    datePicker.addEventListener('change', () => {
        birthDate.value = datePicker.value.split('-').reverse().join('-');
        previousValues.set(birthDate, birthDate.value);
        validate(birthDate);
    });

    setupKeyboard(form);

    // Reuse the original controls in review: values, files, listeners and rules
    // stay attached to a single field, including the postal lookup and calendar.
    const reviewSections = [
        ['.fields-area .form-grid', 'review-personal-fields'],
        ['.profile-photo-area', 'review-photo-fields'],
        ['.vehicle-type-section', 'review-vehicle-fields'],
        ['.vehicle-grid', 'review-vehicle-fields'],
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
        card.querySelector('.review-block-status').textContent = 'Clique em Gravar para guardar as alterações deste bloco.';
        card.querySelector('[data-review-save]').focus();
    }

    reviewCards.forEach(card => {
        card.querySelector('[data-review-edit]').addEventListener('click', () => {
            setBlockEditing(card, true);
            card.querySelector('.review-block-status').textContent = 'A editar. Grave as alterações quando terminar.';
            const first = fields.find(field => card.contains(field) && !field.disabled);
            if (first) focusField(first);
        });
        card.querySelector('[data-review-save]').addEventListener('click', () => {
            if (!validateFields(fields.filter(field => card.contains(field)))) {
                card.querySelector('.review-block-status').textContent = 'Corrija os campos assinalados antes de gravar.';
                return;
            }
            setBlockEditing(card, false);
            card.querySelector('.review-block-status').textContent = 'Alterações guardadas.';
            card.querySelector('[data-review-edit]').focus();
        });
    });

    function mountReview() {
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

    const companyAffiliation = document.getElementById('company-affiliation');
    const companyCertificate = document.getElementById('company-certificate');
    function syncCompanyCertificate() {
        const affiliated = companyAffiliation.value === 'yes';
        document.getElementById('company-certificate-section').hidden = !affiliated;
        companyCertificate.disabled = !affiliated;
        if (!affiliated) {
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
        window.location.href = 'menu registration.html';
    });

    form.addEventListener('submit', event => {
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
        reviewCards.forEach(card => setBlockEditing(card, false));
        // Frontend confirmation only; replace this with the server's success response
        // when a registration endpoint is connected.
        if (!registrationSuccess.open) registrationSuccess.showModal();
    });
})();
