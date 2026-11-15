// Translation changes text nodes and presentation attributes, never form values.
(() => {
  const messages = {
  "How would you like to": "Como pretendes",
  "log in?": "entrar?",
  "register?": "registar-te?",
  "login": "iniciar sess\u00e3o",
  "Courier": "Transportador",
  "Company": "Empresa",
  "Client": "Cliente",
  "Staff": "Equipa operacional",
  "Admin": "Administrador",
  "Administrative": "Acesso",
  "Access": "administrativo",
  "Choose your account type to log in.": "Escolhe o tipo de conta para iniciar sess\u00e3o.",
  "Account types": "Tipos de conta",
  "Administrative account types": "Tipos de conta administrativa",
  "Log in": "Entrar",
  "Log in as Courier": "Entrar como transportador",
  "Log in as Company": "Entrar como empresa",
  "Log in as Client": "Entrar como cliente",
  "Log in as Staff": "Entrar como Staff",
  "Log in as Admin": "Entrar como administrador",
  "Register as Courier": "Registar como transportador",
  "Register as Company": "Registar como empresa",
  "Register as Client": "Registar como cliente",
  "Don't have an account?": "Ainda n\u00e3o tens conta?",
  "Don't have a company account?": "Ainda n\u00e3o tens uma conta de empresa?",
  "Email": "Email",
  "Email *": "Email *",
  "Password": "Palavra-passe",
  "Password *": "Palavra-passe *",
  "Confirm Password *": "Confirmar palavra-passe *",
  "Confirm password *": "Confirmar palavra-passe *",
  "Show password": "Mostrar palavra-passe",
  "Hide password": "Ocultar palavra-passe",
  "Show password confirmation": "Mostrar confirma\u00e7\u00e3o da palavra-passe",
  "Hide password confirmation": "Ocultar confirma\u00e7\u00e3o da palavra-passe",
  "COMPANY REGISTRATION": "REGISTO DE EMPRESA",
  "COURIER REGISTRATION": "REGISTO DE TRANSPORTADOR",
  "Register your company and": "Regista a tua empresa e",
  "fleet.": "frota.",
  "Create your courier profile and register your fleet.": "Cria o teu perfil de transportador e regista a tua frota.",
  "Submit your company details and add as many vehicles as needed in one registration request. Your account will become available after staff approval.": "Envia os dados da empresa e adiciona os ve\u00edculos necess\u00e1rios num \u00fanico pedido de registo. A conta ficar\u00e1 dispon\u00edvel ap\u00f3s aprova\u00e7\u00e3o pela equipa.",
  "Personal Information": "Informa\u00e7\u00f5es pessoais",
  "Your details": "Os teus dados",
  "Vehicle": "Ve\u00edculo",
  "Vehicle Information": "Informa\u00e7\u00f5es do ve\u00edculo",
  "Documents": "Documentos",
  "Review": "Revis\u00e3o",
  "Review Registration": "Rever registo",
  "Review Your Registration": "Rev\u00ea o teu registo",
  "Tell us a little about yourself. Fields marked with * are required.": "Conta-nos um pouco sobre ti. Os campos assinalados com * s\u00e3o obrigat\u00f3rios.",
  "Fields marked with * are required.": "Os campos assinalados com * s\u00e3o obrigat\u00f3rios.",
  "Full Name *": "Nome completo *",
  "Phone Number *": "N\u00famero de telefone *",
  "Address *": "Morada *",
  "Postal Code *": "C\u00f3digo postal *",
  "District": "Distrito",
  "IBAN *": "IBAN *",
  "NIF *": "NIF *",
  "Profile Photo": "Fotografia de perfil",
  "Upload a clear photo of yourself.": "Carrega uma fotografia tua n\u00edtida.",
  "Upload profile photo": "Carregar fotografia de perfil",
  "Upload files": "Carregar ficheiros",
  "Choose file": "Escolher ficheiro",
  "Remove file": "Remover ficheiro",
  "Remove photo": "Remover fotografia",
  "No file selected.": "Nenhum ficheiro selecionado.",
  "No file uploaded.": "Nenhum ficheiro carregado.",
  "No document selected.": "Nenhum documento selecionado.",
  "Without photo.": "Sem fotografia.",
  "JPG or PNG \u00b7 Max. 5 MB": "JPG ou PNG \u00b7 M\u00e1x. 5 MB",
  "PDF, JPG or PNG": "PDF, JPG ou PNG",
  "PDF, JPG or PNG.": "PDF, JPG ou PNG.",
  "At least 8 characters, including one uppercase letter and one number.": "Pelo menos 8 caracteres, incluindo uma letra mai\u00fascula e um n\u00famero.",
  "Start with two uppercase letters, followed by numbers only. Do not use spaces.": "Come\u00e7a com duas letras mai\u00fasculas, seguidas apenas de n\u00fameros. N\u00e3o uses espa\u00e7os.",
  "Enter letters and spaces only.": "Introduz apenas letras e espa\u00e7os.",
  "Enter your IBAN without spaces": "Introduz o teu IBAN sem espa\u00e7os",
  "Enter your Company ID": "Introduz o identificador da empresa",
  "Are you affiliated with a company?": "Est\u00e1s associado a uma empresa?",
  "If yes, enter your Company ID and upload your company affiliation certificate below.": "Se sim, indica o identificador da empresa e carrega o comprovativo de v\u00ednculo \u00e0 empresa abaixo.",
  "Yes": "Sim",
  "No": "N\u00e3o",
  "Company ID *": "Identificador da empresa *",
  "Enter the ID assigned to your company on this platform. Access to its registered fleet requires approval of your company affiliation.": "Introduz o identificador atribu\u00eddo \u00e0 empresa nesta plataforma. O acesso \u00e0 frota registada depende da aprova\u00e7\u00e3o do teu v\u00ednculo \u00e0 empresa.",
  "Company Information": "Informa\u00e7\u00f5es da empresa",
  "Company Name *": "Nome da empresa *",
  "Company Tax Number (NIF) *": "NIF da empresa *",
  "Registered Office Address *": "Morada da sede *",
  "Company Fleet": "Frota da empresa",
  "Street, number, postal code and city": "Rua, n\u00famero, c\u00f3digo postal e localidade",
  "e.g. Jo\u00e3o Silva": "Ex.: Jo\u00e3o Silva",
  "e.g. Porto Express Logistics": "Ex.: Porto Express Logistics",
  "e.g. Mercedes Benz": "Ex.: Mercedes Benz",
  "e.g. Sprinter": "Ex.: Sprinter",
  "e.g. White": "Ex.: Branco",
  "Next: Vehicle": "Seguinte: Ve\u00edculo",
  "Next: Documents": "Seguinte: Documentos",
  "\u2190 Back": "\u2190 Voltar",
  "\u2190 Back to home": "\u2190 Voltar ao in\u00edcio",
  "Back to registration menu": "Voltar ao menu de registo",
  "+ Add another vehicle": "+ Adicionar outro ve\u00edculo",
  "Remove vehicle": "Remover ve\u00edculo",
  "Vehicle Type": "Tipo de ve\u00edculo",
  "Vehicle details": "Dados do ve\u00edculo",
  "Motorcycle": "Motociclo",
  "Car": "Autom\u00f3vel",
  "Van": "Carrinha",
  "Truck": "Cami\u00e3o",
  "Brand": "Marca",
  "Model": "Modelo",
  "Color": "Cor",
  "Year": "Ano",
  "License Plate": "Matr\u00edcula",
  "Fuel Type": "Tipo de combust\u00edvel",
  "Select fuel type": "Seleciona o combust\u00edvel",
  "Gasoline": "Gasolina",
  "Electric": "El\u00e9trico",
  "Gas": "G\u00e1s",
  "Maximum Weight (kg)": "Peso m\u00e1ximo (kg)",
  "Maximum Volume (m\u00b3)": "Volume m\u00e1ximo (m\u00b3)",
  "Enter a year between 2000 and 2026.": "Introduz um ano entre 2000 e 2026.",
  "Each pair must contain two letters or two numbers. Hyphens are inserted automatically.": "Cada par deve conter duas letras ou dois n\u00fameros. Os h\u00edfenes s\u00e3o inseridos automaticamente.",
  "Why do we need capacity information?": "Porque precisamos da informa\u00e7\u00e3o de capacidade?",
  "Weight and volume information will later help determine whether your vehicle is suitable for a specific delivery.": "Os dados de peso e volume permitir\u00e3o determinar se o teu ve\u00edculo \u00e9 adequado a cada entrega.",
  "All vehicle fields are optional. You can register a vehicle later or, if you belong to a company, use its fleet already registered on the platform.": "Todos os campos do ve\u00edculo s\u00e3o opcionais. Podes registar um ve\u00edculo mais tarde ou, se pertenceres a uma empresa, utilizar a frota j\u00e1 registada na plataforma.",
  "Add one or more vehicles to this registration, or continue without a vehicle. Each vehicle has its own documents.": "Adiciona um ou mais ve\u00edculos ao registo ou continua sem ve\u00edculo. Cada ve\u00edculo tem os seus pr\u00f3prios documentos.",
  "Add the details and documents for each vehicle. Leave the first vehicle empty if you do not want to register a fleet now.": "Adiciona os dados e documentos de cada ve\u00edculo. Deixa o primeiro ve\u00edculo vazio se n\u00e3o quiseres registar uma frota agora.",
  "Register several vehicles in the same request. Vehicle registration is optional and can also be completed later.": "Regista v\u00e1rios ve\u00edculos no mesmo pedido. O registo de ve\u00edculos \u00e9 opcional e pode ser feito mais tarde.",
  "Upload Documentation": "Carregar documenta\u00e7\u00e3o",
  "Citizen Card / Identification Document": "Cart\u00e3o de cidad\u00e3o / Documento de identifica\u00e7\u00e3o",
  "Criminal Record Certificate": "Certificado de registo criminal",
  "Driving Licence": "Carta de condu\u00e7\u00e3o",
  "Company Affiliation Certificate": "Comprovativo de v\u00ednculo \u00e0 empresa",
  "IBAN Proof": "Comprovativo de IBAN",
  "Vehicle Inspection Certificate": "Certificado de inspe\u00e7\u00e3o do ve\u00edculo",
  "Vehicle Insurance Certificate": "Certificado de seguro do ve\u00edculo",
  "Vehicle Registration Certificate": "Certificado de matr\u00edcula do ve\u00edculo",
  "Upload Citizen Card / Identification Document": "Carregar cart\u00e3o de cidad\u00e3o / documento de identifica\u00e7\u00e3o",
  "Upload Criminal Record Certificate": "Carregar certificado de registo criminal",
  "Upload Driving Licence": "Carregar carta de condu\u00e7\u00e3o",
  "Upload Company Affiliation Certificate": "Carregar comprovativo de v\u00ednculo \u00e0 empresa",
  "Upload IBAN proof": "Carregar comprovativo de IBAN",
  "Upload Vehicle Inspection Certificate": "Carregar certificado de inspe\u00e7\u00e3o do ve\u00edculo",
  "Upload Vehicle Insurance Certificate": "Carregar certificado de seguro do ve\u00edculo",
  "Upload Vehicle Registration Certificate": "Carregar certificado de matr\u00edcula do ve\u00edculo",
  "Almost done!": "Quase pronto!",
  "Review your information below. Click the pencil to edit a section, then save your changes.": "Rev\u00ea os teus dados abaixo. Clica no l\u00e1pis para editar uma sec\u00e7\u00e3o e guarda as altera\u00e7\u00f5es.",
  "Check your details. To make corrections, click the pencil on the section and save before submitting.": "Confirma os teus dados. Para corrigir, clica no l\u00e1pis da sec\u00e7\u00e3o e guarda antes de submeter.",
  "Edit": "Editar",
  "Save": "Guardar",
  "Edit personal information": "Editar informa\u00e7\u00f5es pessoais",
  "Edit vehicle information": "Editar informa\u00e7\u00f5es do ve\u00edculo",
  "Edit documents": "Editar documentos",
  "Submit Registration": "Submeter registo",
  "Submit Company Registration": "Submeter registo da empresa",
  "Confirm & submit": "Confirmar e submeter",
  "I confirm that the information and documents provided are correct and up to date. *": "Confirmo que os dados e documentos fornecidos est\u00e3o corretos e atualizados. *",
  "After submission, your account and any vehicle you register will remain": "Ap\u00f3s a submiss\u00e3o, a tua conta e os ve\u00edculos registados ficar\u00e3o",
  "Pending Approval": "A aguardar aprova\u00e7\u00e3o",
  "Pending approval": "A aguardar aprova\u00e7\u00e3o",
  "until reviewed by Staff.": "at\u00e9 serem analisados pela equipa.",
  "Registration request submitted successfully!": "Pedido de registo submetido com sucesso!",
  "Company registration submitted!": "Registo da empresa submetido!",
  "Your request has been submited and is waiting for staff approval": "O teu pedido foi submetido e aguarda aprova\u00e7\u00e3o pela equipa",
  "Keep this ID. Couriers can use it to request access to your company fleet after your registration is approved.": "Guarda este identificador. Os transportadores podem us\u00e1-lo para pedir acesso \u00e0 frota ap\u00f3s a aprova\u00e7\u00e3o do registo da empresa.",
  "Retry lookup": "Tentar novamente",
  "Looking up the district...": "A procurar o distrito...",
  "The postal code service is taking longer than expected. Retrying...": "O servi\u00e7o de c\u00f3digos postais est\u00e1 a demorar. A tentar novamente...",
  "This field is required.": "Este campo \u00e9 obrigat\u00f3rio.",
  "Enter a valid email address.": "Introduz um endere\u00e7o de email v\u00e1lido.",
  "Use at least 8 characters.": "Usa pelo menos 8 caracteres.",
  "Include at least one uppercase letter.": "Inclui pelo menos uma letra mai\u00fascula.",
  "Include at least one number.": "Inclui pelo menos um n\u00famero.",
  "The passwords do not match.": "As palavras-passe n\u00e3o coincidem.",
  "The company tax number must contain exactly 9 digits.": "O NIF da empresa deve conter exatamente 9 d\u00edgitos.",
  "Enter a four-digit year between 2000 and 2026.": "Introduz um ano com quatro d\u00edgitos entre 2000 e 2026.",
  "Enter digits only (0-9).": "Introduz apenas d\u00edgitos (0-9).",
  "Enter letters and numbers only. Hyphens are inserted automatically.": "Introduz apenas letras e n\u00fameros. Os h\u00edfenes s\u00e3o inseridos automaticamente.",
  "Enter this field in the required format.": "Preenche este campo no formato indicado.",
  "Enter two uppercase letters followed by numbers only, without spaces.": "Introduz duas letras mai\u00fasculas seguidas apenas de n\u00fameros, sem espa\u00e7os.",
  "Select a vehicle type.": "Seleciona um tipo de ve\u00edculo.",
  "Select the required documents.": "Seleciona os documentos obrigat\u00f3rios.",
  "Complete this field for the vehicle.": "Preenche este campo do ve\u00edculo.",
  "The brand must contain only letters and spaces.": "A marca deve conter apenas letras e espa\u00e7os.",
  "The color must contain only letters and spaces.": "A cor deve conter apenas letras e espa\u00e7os.",
  "The full name must contain only letters and spaces.": "O nome completo deve conter apenas letras e espa\u00e7os.",
  "The photo cannot exceed 5 MB.": "A fotografia n\u00e3o pode exceder 5 MB.",
  "Use a PDF, JPG or PNG file.": "Usa um ficheiro PDF, JPG ou PNG.",
  "This license plate is already included in this request.": "Esta matr\u00edcula j\u00e1 est\u00e1 inclu\u00edda neste pedido.",
  "This licence plate is already included in the request.": "Esta matr\u00edcula j\u00e1 est\u00e1 inclu\u00edda no pedido.",
  "Use the license plate format XX-XX-XX. Each pair must contain two letters or two numbers (e.g. AA-12-BB).": "Usa o formato de matr\u00edcula XX-XX-XX. Cada par deve conter duas letras ou dois n\u00fameros (ex.: AA-12-BB).",
  "Use the licence plate format XX-XX-XX (e.g. AA-12-BB).": "Usa o formato de matr\u00edcula XX-XX-XX (ex.: AA-12-BB).",
  "Use digits and hyphens only, in the required format.": "Usa apenas d\u00edgitos e h\u00edfenes, no formato indicado.",
  "Confirm that the information and documents are correct.": "Confirma que os dados e documentos est\u00e3o corretos.",
  "Review the highlighted fields before submitting the registration.": "Rev\u00ea os campos assinalados antes de submeter o registo.",
  "Click Save to save changes to this section.": "Clica em Guardar para guardar as altera\u00e7\u00f5es desta sec\u00e7\u00e3o.",
  "Editing. Save your changes when finished.": "Em edi\u00e7\u00e3o. Guarda as altera\u00e7\u00f5es quando terminares.",
  "Correct the highlighted fields before saving.": "Corrige os campos assinalados antes de guardar.",
  "Changes saved.": "Altera\u00e7\u00f5es guardadas.",
  "Postal code not found. Check the code entered.": "C\u00f3digo postal n\u00e3o encontrado. Confirma o c\u00f3digo introduzido.",
  "The postal code service did not return a valid response. You can continue without a district or try again.": "O servi\u00e7o de c\u00f3digos postais n\u00e3o devolveu uma resposta v\u00e1lida. Podes continuar sem distrito ou tentar novamente.",
  "The postal code service has reached its request limit. Wait a moment and try again.": "O servi\u00e7o de c\u00f3digos postais atingiu o limite de pedidos. Aguarda um momento e tenta novamente.",
  "The postal code service timed out. You can continue without a district or try again.": "O servi\u00e7o de c\u00f3digos postais excedeu o tempo de resposta. Podes continuar sem distrito ou tentar novamente.",
  "This postal code does not match any of the 18 available districts. Check the postal code.": "Este c\u00f3digo postal n\u00e3o corresponde a nenhum dos 18 distritos dispon\u00edveis. Confirma o c\u00f3digo postal.",
  "Keep moving. Deliver with confidence.": "Sempre em movimento. Entrega com confian\u00e7a.",
  "Courier Management System": "Sistema de Gest\u00e3o de Transportadores",
  "Enterprise Information Systems \u00b7 FEUP": "Sistemas de Informa\u00e7\u00e3o Empresariais \u00b7 FEUP",
  "Main navigation": "Navega\u00e7\u00e3o principal",
  "TrustPort \u2014 Home": "TrustPort \u2014 In\u00edcio",
  "Join our": "Junta-te \u00e0 nossa",
  "courier network": "rede de transportadores",
  "Courier Login | CMS": "Login de transportador | CMS",
  "Company Login | CMS": "Login de empresa | CMS",
  "Courier Registration | CMS": "Registo de transportador | CMS",
  "Company Registration | CMS": "Registo de empresa | CMS",
  "Choose Your Login | CMS": "Escolhe o tipo de login | CMS",
  "Choose Your Registration | CMS": "Escolhe o tipo de registo | CMS",
  "Administrative Access | TrustPort": "Acesso administrativo | TrustPort",
  "Staff Login | TrustPort": "Login de Staff | TrustPort",
  "Admin Login | TrustPort": "Login de administrador | TrustPort",
  "Enter a capacity greater than zero.": "Introduz uma capacidade superior a zero.",
  "The phone number must contain exactly 9 digits.": "O n\u00famero de telefone deve conter exatamente 9 d\u00edgitos.",
  "The tax number must contain exactly 9 digits.": "O NIF deve conter exatamente 9 d\u00edgitos.",
  "Enter the postal code in XXXX-XXX format (e.g. 4000-123).": "Introduz o c\u00f3digo postal no formato XXXX-XXX (ex.: 4000-123).",
  "Invalid file format. Use JPG or PNG.": "Formato de ficheiro inv\u00e1lido. Usa JPG ou PNG.",
  "Invalid file format. Use PDF, JPG or PNG.": "Formato de ficheiro inv\u00e1lido. Usa PDF, JPG ou PNG.",
  "Invalid email address": "E-mail inv\u00e1lido",
  "Personal information": "Informa\u00e7\u00f5es pessoais",
  "Vehicle information": "Informa\u00e7\u00f5es do ve\u00edculo",
  "Team 7 | TrustPort": "Equipa 7 | TrustPort",
  "Gon\u00e7alo Marques (Team Leader)": "Gon\u00e7alo Marques (L\u00edder de equipa)",
  "TrustPort presentation video": "V\u00eddeo de apresenta\u00e7\u00e3o TrustPort",
  "How it works": "Como funciona",
  "Timeline": "Cronologia",
  "e.g. Driver, Logistics, Customer Support, Technology...": "Ex.: Motorista, Log\u00edstica, Apoio ao Cliente, Tecnologia...",
  "Optional documents": "Documentos opcionais",
  "Filled automatically.": "Preenchido automaticamente."
};
  const reverse = new Map(Object.entries(messages).map(([en, pt]) => [pt, en]));
  const textState = new WeakMap();
  const attributeState = new WeakMap();
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  let language = 'en';
  try { language = localStorage.getItem('trustport-language') === 'pt' ? 'pt' : 'en'; } catch (_) {}
  document.documentElement.lang = language;

  function translate(value, target = language) {
    const text = normalize(value);
    const en = Object.hasOwn(messages, text) ? text : reverse.get(text);
    if (en) return target === 'pt' ? messages[en] : en;
    let match = /^(?:Vehicle|Veículo) (\d+)$/.exec(text);
    if (match) return `${target === 'pt' ? 'Veículo' : 'Vehicle'} ${match[1]}`;
    match = /^(\d+) (?:vehicles? in this request|veículos? neste pedido)$/.exec(text);
    if (match) return target === 'pt' ? `${match[1]} ${match[1] === '1' ? 'veículo' : 'veículos'} neste pedido` : `${match[1]} vehicle${match[1] === '1' ? '' : 's'} in this request`;
    match = /^(?:District filled automatically:|Distrito preenchido automaticamente:) (.+)$/.exec(text);
    if (match) return `${target === 'pt' ? 'Distrito preenchido automaticamente:' : 'District filled automatically:'} ${match[1]}`;
    return value;
  }

  const excluded = 'script, style, textarea, code, pre, [contenteditable], [translate="no"]';
  function translateNode(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(excluded) || parent.closest('[data-en][data-pt]')) return;
    const value = node.nodeValue;
    if (!value.trim()) return;
    let state = textState.get(node);
    if (!state || value !== state.last) state = { source: value, last: value };
    const translated = translate(state.source);
    // Options without an explicit value derive their submitted value from text.
    if (translated !== state.source && parent.tagName === 'OPTION' && !parent.hasAttribute('value')) parent.setAttribute('value', parent.value);
    const next = translated === state.source ? state.source : state.source.replace(/\S[\s\S]*\S|\S/, translated.trim());
    if (value !== next) node.nodeValue = next;
    state.last = next;
    textState.set(node, state);
  }

  function translateElement(element) {
    if (element.closest(excluded)) return;
    if (element.dataset.en !== undefined && element.dataset.pt !== undefined) {
      const next = element.dataset[language];
      if (element.textContent !== next) element.textContent = next;
    }
    let state = attributeState.get(element);
    if (!state) { state = {}; attributeState.set(element, state); }
    for (const attr of ['placeholder', 'aria-label', 'title', 'alt']) {
      if (!element.hasAttribute(attr)) continue;
      const value = element.getAttribute(attr);
      if (!state[attr] || state[attr].last !== value) state[attr] = { source: value, last: value };
      const explicit = element.getAttribute(`data-${attr}-${language}`);
      const next = explicit ?? translate(state[attr].source);
      if (value !== next) element.setAttribute(attr, next);
      state[attr].last = next;
    }
  }

  function translateTree(root) {
    if (root.nodeType === Node.TEXT_NODE) { translateNode(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    translateElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) translateNode(node);
      else translateElement(node);
    }
  }

  function setLanguage(value) {
    language = value === 'pt' ? 'pt' : 'en';
    document.documentElement.lang = language;
    try { localStorage.setItem('trustport-language', language); } catch (_) {}
    translateTree(document.documentElement);
    document.querySelectorAll('input, select, textarea').forEach(field => {
      if (field.validity.customError) field.setCustomValidity(translate(field.validationMessage));
    });
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    document.dispatchEvent(new CustomEvent('site-language-change', { detail: language }));
  }
  window.TrustPortLanguage = { translate, setLanguage, get language() { return language; } };
  document.addEventListener('DOMContentLoaded', () => {
    setLanguage(language);
    const observer = new MutationObserver(records => {
      // Only visit changed subtrees, not the entire document on each keystroke.
      const roots = new Set();
      for (const record of records) {
        if (record.type === 'childList') record.addedNodes.forEach(node => roots.add(node));
        else roots.add(record.target);
      }
      roots.forEach(translateTree);
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title', 'alt'] });
  }, { once: true });
})();

// Shared navigation behavior for the homepage, login and registration menus.
(() => {
  const header = document.querySelector('.site-header');
  const toggle = header.querySelector('.menu-toggle');
  const navigation = header.querySelector('#main-navigation');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navigation.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => window.TrustPortLanguage.setLanguage(button.dataset.language));
  });
})();

// Initialize homepage features only where their markup exists.
(() => {
  if (!document.querySelector('#quote-form')) return;
const navigation = document.querySelector('#main-navigation');
let language = document.documentElement.lang === 'pt' ? 'pt' : 'en';
const homepageSampleMetrics = Object.freeze({
  completedDeliveries: 12480,
  approvedCarriers: 186,
  registeredClients: 3420
});
function setLanguage(value) {
  language = value;
  document.documentElement.lang = value;
  document.querySelectorAll('[data-en][data-pt]').forEach(element => {
    element.textContent = element.dataset[value];
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === value));
  });
  document.querySelectorAll('[data-alt-en][data-alt-pt]').forEach(image => { image.alt = image.dataset[value === 'pt' ? 'altPt' : 'altEn']; });
  navigation.setAttribute('aria-label', value === 'pt' ? 'Navegação principal' : 'Main navigation');
  document.querySelector('video').setAttribute('aria-label', value === 'pt' ? 'Vídeo de apresentação TrustPort' : 'TrustPort presentation video');
  renderQuote();
  renderDistanceStatus();
  renderLocationStatuses();
  renderHomepageMetrics();
  document.querySelector('#contact-status').textContent = '';
}
document.addEventListener('site-language-change', event => setLanguage(event.detail));

document.querySelector('#year').textContent = new Date().getFullYear();

// Demonstration tariffs: replace with the approved commercial rates.
const demoRates = Object.freeze({ base: 5, perKm: 0.65, perKg: 0.20, perM3: 8, express: 1.30, low: 0.90, high: 1.15 });
let lastQuote = null;
const quoteForm = document.querySelector('#quote-form');
// Public Photon geocoding and OSRM road routing (OpenStreetMap data).
// These public services are suitable for this prototype; production needs a hosted service/SLA.
const originInput = document.querySelector('#origin');
const destinationInput = document.querySelector('#destination');
const distanceInput = document.querySelector('#distance');
const distanceStatus = document.querySelector('#distance-status');
const retryDistance = document.querySelector('#retry-distance');
const quoteButton = quoteForm.querySelector('[type="submit"]');
const locationCache = new Map();
let distanceState = 'idle';
let resolvedRoute = '';
let distanceTimer;
let distanceController;
let distanceVersion = 0;
const distanceMessages = {
  idle: { pt: 'Seleciona a origem e o destino nas sugestões para calcular os km por estrada.', en: 'Select an origin and destination from the suggestions to calculate road distance.' },
  loading: { pt: 'A calcular a distância por estrada…', en: 'Calculating road distance…' },
  success: { pt: 'Distância estimada por estrada: ', en: 'Estimated road distance: ' },
  error: { pt: 'Não foi possível calcular a rota. Confirma as localidades ou indica uma morada mais completa em Portugal e tenta novamente.', en: 'Could not calculate the route. Check the locations or enter a fuller address in Portugal and try again.' }
};
function renderDistanceStatus() {
  distanceStatus.textContent = distanceMessages[distanceState][language] + (distanceState === 'success' ? resolvedRoute : '');
  retryDistance.hidden = distanceState !== 'error';
  quoteButton.disabled = distanceState !== 'success';
  distanceInput.setAttribute('aria-busy', String(distanceState === 'loading'));
}
async function fetchRouteJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Routing service unavailable');
  return response.json();
}
const locationMessages = {
  idle: { pt: 'Escreve pelo menos 3 caracteres e seleciona um local.', en: 'Type at least 3 characters and select a location.' },
  loading: { pt: 'A procurar locais…', en: 'Searching locations…' },
  empty: { pt: 'Não encontrámos esse local. Indica uma localidade ou morada mais completa.', en: 'We could not find that location. Enter a locality or a more complete address.' },
  error: { pt: 'Não foi possível pesquisar locais. Altera o texto para tentar novamente.', en: 'Could not search locations. Edit the text to try again.' },
  selected: { pt: 'Local confirmado.', en: 'Location confirmed.' },
  results: { pt: 'Seleciona um local. Usa as setas e Enter ou clica numa sugestão.', en: 'Select a location. Use the arrow keys and Enter or click a suggestion.' }
};
const locationPickers = [originInput, destinationInput].map(input => {
  const list = document.querySelector(`#${input.id}-suggestions`);
  const status = document.querySelector(`#${input.id}-status`);
  const picker = { input, list, status, selected: null, results: [], active: -1, state: 'idle', version: 0, controller: null, timer: null };
  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    picker.active = -1;
  }
  function activate(index) {
    picker.active = index;
    Array.from(list.children).forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    if (index >= 0) {
      input.setAttribute('aria-activedescendant', list.children[index].id);
      list.children[index].scrollIntoView({ block: 'nearest' });
    }
  }
  function select(index) {
    if (!picker.results[index]) return;
    clearTimeout(picker.timer);
    picker.controller?.abort();
    ++picker.version;
    picker.selected = picker.results[index];
    input.value = picker.selected.label;
    picker.state = 'selected';
    close();
    renderLocationStatuses();
    scheduleDistance();
  }
  function show() {
    if (!picker.results.length || picker.selected) return;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  async function search(version, query) {
    const controller = new AbortController();
    picker.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const key = query.toLocaleLowerCase('pt-PT');
      let results = locationCache.get(key);
      if (!results) {
        const params = new URLSearchParams({ q: query + ', Portugal', limit: '10', lang: 'en' });
        const data = await fetchRouteJson(`https://photon.komoot.io/api/?${params}`, controller.signal);
        const seen = new Set();
        results = (data.features || []).filter(item => item.properties?.countrycode?.toUpperCase() === 'PT' && item.geometry?.type === 'Point' && item.geometry.coordinates?.length === 2 && item.geometry.coordinates.every(Number.isFinite)).map(item => {
          const p = item.properties;
          return { coordinates: item.geometry.coordinates.join(','), label: [...new Set([p.name, [p.street, p.housenumber].filter(Boolean).join(' '), p.postcode, p.city || p.town || p.village, p.state].filter(Boolean))].join(', ') };
        }).filter(place => {
          const key = place.label + place.coordinates;
          if (!place.label || seen.has(key)) return false;
          seen.add(key); return true;
        }).slice(0, 5);
        locationCache.set(key, results);
      }
      if (version !== picker.version) return;
      picker.results = results;
      list.replaceChildren();
      results.forEach((place, index) => {
        const option = document.createElement('span');
        option.id = `${input.id}-option-${index}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.textContent = place.label;
        option.addEventListener('mousedown', event => event.preventDefault());
        option.addEventListener('click', () => select(index));
        list.append(option);
      });
      picker.state = results.length ? 'results' : 'empty';
      if (document.activeElement === input) show();
    } catch (error) {
      if (version !== picker.version) return;
      picker.state = 'error';
      close();
    } finally {
      clearTimeout(timeout);
      if (version === picker.version) renderLocationStatuses();
    }
  }
  input.addEventListener('input', () => {
    clearTimeout(picker.timer);
    picker.controller?.abort();
    const version = ++picker.version;
    picker.selected = null;
    picker.results = [];
    close();
    scheduleDistance();
    const query = input.value.trim();
    picker.state = query.length >= 3 ? 'loading' : 'idle';
    renderLocationStatuses();
    if (query.length >= 3) picker.timer = setTimeout(() => search(version, query), 400);
  });
  input.addEventListener('focus', show);
  input.addEventListener('blur', close);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!picker.results.length || picker.selected) return;
      event.preventDefault(); show();
      activate((picker.active + (event.key === 'ArrowDown' ? 1 : picker.active < 0 ? 0 : -1) + picker.results.length) % picker.results.length);
    } else if (event.key === 'Enter' && !list.hidden) {
      event.preventDefault();
      if (picker.active >= 0) select(picker.active);
    }
  });
  return picker;
});
function renderLocationStatuses() {
  locationPickers.forEach(picker => { picker.status.textContent = locationMessages[picker.state][language]; });
}
async function calculateDistance(version) {
  const controller = new AbortController();
  distanceController = controller;
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const [origin, destination] = locationPickers.map(picker => picker.selected);
    if (!origin || !destination) return;
    const data = await fetchRouteJson(`https://router.project-osrm.org/route/v1/driving/${origin.coordinates};${destination.coordinates}?overview=false&steps=false&radiuses=5000;5000`, controller.signal);
    const metres = data.routes?.[0]?.distance;
    if (data.code !== 'Ok' || !Number.isFinite(metres) || metres <= 0 || metres > 10000000) throw new Error('No road route');
    if (version !== distanceVersion) return;
    distanceInput.value = Math.max(0.1, Math.round(metres / 100) / 10);
    resolvedRoute = `${origin.label} → ${destination.label} · ${distanceInput.value} km`;
    distanceState = 'success';
  } catch (error) {
    if (version !== distanceVersion) return;
    controller.abort();
    distanceState = 'error';
    distanceInput.value = '';
  } finally {
    clearTimeout(timeout);
    if (version === distanceVersion) renderDistanceStatus();
  }
}
function scheduleDistance() {
  clearTimeout(distanceTimer);
  distanceController?.abort();
  const version = ++distanceVersion;
  distanceInput.value = '';
  lastQuote = null;
  document.querySelector('#quote-result').textContent = '—';
  document.querySelector('#quote-detail').textContent = '';
  distanceState = locationPickers.every(picker => picker.selected && picker.input.value === picker.selected.label) ? 'loading' : 'idle';
  renderDistanceStatus();
  if (distanceState === 'loading') distanceTimer = setTimeout(() => calculateDistance(version), 900);
}

retryDistance.addEventListener('click', scheduleDistance);
window.addEventListener('pageshow', scheduleDistance);
function renderQuote() {
  if (!lastQuote) return;
  const money = value => new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(value);
  document.querySelector('#quote-result').textContent = `${money(lastQuote.total * demoRates.low)} – ${money(lastQuote.total * demoRates.high)}`;
  document.querySelector('#quote-detail').textContent = `${lastQuote.origin} → ${lastQuote.destination} · ${lastQuote.distance} km`;
}
quoteForm.addEventListener('submit', event => {
  event.preventDefault();
  if (distanceState !== 'success' || !locationPickers.every(picker => picker.selected && picker.input.value === picker.selected.label) || !distanceInput.value || !quoteForm.reportValidity()) return;
  const data = new FormData(quoteForm);
  const distance = Number(data.get('distance'));
  const weight = Number(data.get('weight'));
  const volume = Number(data.get('volume'));
  if (![distance, weight, volume].every(Number.isFinite)) return;
  const origin = data.get('origin').trim();
  const destination = data.get('destination').trim();
  if (!origin || !destination) {
    document.querySelector('#quote-result').textContent = language === 'pt' ? 'Indica a origem e o destino.' : 'Enter an origin and destination.';
    return;
  }
  lastQuote = { origin, destination, distance, total: (demoRates.base + distance * demoRates.perKm + weight * demoRates.perKg + volume * demoRates.perM3) * (data.get('urgency') === 'express' ? demoRates.express : 1) };
  renderQuote();
});
quoteForm.addEventListener('input', () => {
  lastQuote = null;
  document.querySelector('#quote-result').textContent = '—';
  document.querySelector('#quote-detail').textContent = '';
});
const contactForm = document.querySelector('#contact-form');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const name = data.get('name').trim();
  const question = data.get('question').trim();
  if (!name || question.length < 10) {
    document.querySelector('#contact-status').textContent = language === 'pt' ? 'Indica o nome e uma questão com pelo menos 10 caracteres.' : 'Enter your name and a question of at least 10 characters.';
    return;
  }
  const body = `${name}\n${data.get('email')}\n\n${question}`;
  document.querySelector('#message-preview').value = body;
  document.querySelector('#message-preview-label').hidden = false;
  document.querySelector('#contact-status').textContent = language === 'pt' ? 'Mensagem preparada. Conclui o envio no teu programa de email ou copia o texto abaixo.' : 'Message prepared. Complete sending in your email application or copy the text below.';
  window.location.href = `mailto:info@trustport.com?subject=${encodeURIComponent('TrustPort — Contact')}&body=${encodeURIComponent(body)}`;
});
setLanguage(document.documentElement.lang);


function renderHomepageMetrics() {
  const formatter = new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-GB');
  document.querySelectorAll('[data-metric]').forEach(element => {
    element.textContent = formatter.format(homepageSampleMetrics[element.dataset.metric]);
  });
}

})();
