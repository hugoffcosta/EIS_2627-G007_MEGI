// --- BASE DE DADOS SIMULADA DOS 15 FUNCIONÁRIOS ---
const employeesData = [
    { id: 1, empCode: "#EMP-001", name: "Manuel Silva Fernandes", email: "manuel.silva@trustport.pt", phone: "912345678", nif: "123456789", nss: "12009876543", dob: "1984-05-14", role: "Administrador de Operações", salary: 2450.00, iban: "PT50003300001234567890123", contractType: "sem_termo", vacationDays: 22, vacationTaken: 8, vacationDates: "05/05/2026 a 12/05/2026 (5 dias) | 10/08/2026 a 24/08/2026 (9 dias)" },
    { id: 2, empCode: "#EMP-002", name: "Beatriz Maria Santos", email: "beatriz.santos@trustport.pt", phone: "923456789", nif: "214365879", nss: "12009876544", dob: "1990-11-20", role: "Gestora de Logística & Rotas", salary: 1850.00, iban: "PT50003300002345678901234", contractType: "sem_termo", vacationDays: 22, vacationTaken: 4, vacationDates: "01/06/2026 a 05/06/2026 (4 dias)" },
    { id: 3, empCode: "#EMP-003", name: "João Pedro Oliveira", email: "joao.oliveira@trustport.pt", phone: "934567890", nif: "235689147", nss: "12009876545", dob: "1988-03-15", role: "Coordenador de Tráfego e GPS", salary: 1650.00, iban: "PT50003300003456789012345", contractType: "sem_termo", vacationDays: 22, vacationTaken: 12, vacationDates: "01/08/2026 a 15/08/2026 (12 dias)" },
    { id: 4, empCode: "#EMP-004", name: "Carla Sofia Ribeiro", email: "carla.ribeiro@trustport.pt", phone: "965432109", nif: "247896325", nss: "12009876546", dob: "1993-07-22", role: "Especialista de Apoio ao Cliente B2B", salary: 1350.00, iban: "PT50003300004567890123456", contractType: "a_termo_certo", vacationDays: 22, vacationTaken: 0, vacationDates: "Sem períodos marcados" },
    { id: 5, empCode: "#EMP-005", name: "Rui Miguel Costa", email: "rui.costa@trustport.pt", phone: "918765432", nif: "258147369", nss: "12009876547", dob: "1982-09-30", role: "Supervisora de Frota e Manutenção", salary: 1700.00, iban: "PT50003300005678901234567", contractType: "sem_termo", vacationDays: 22, vacationTaken: 10, vacationDates: "10/07/2026 a 24/07/2026 (10 dias)" },
    { id: 6, empCode: "#EMP-006", name: "Sofia Alexandre Martins", email: "sofia.martins@trustport.pt", phone: "929876543", nif: "269358147", nss: "12009876548", dob: "1995-12-05", role: "Gestora de Sustentabilidade & CO₂", salary: 1900.00, iban: "PT50003300006789012345678", contractType: "sem_termo", vacationDays: 22, vacationTaken: 7, vacationDates: "01/09/2026 a 09/09/2026 (7 dias)" },
    { id: 7, empCode: "#EMP-007", name: "Diogo José Pereira", email: "diogo.pereira@trustport.pt", phone: "931234567", nif: "271482935", nss: "12009876549", dob: "1986-04-18", role: "Motorista Pesados de Longo Curso", salary: 1550.00, iban: "PT50003300007890123456789", contractType: "sem_termo", vacationDays: 22, vacationTaken: 14, vacationDates: "01/08/2026 a 18/08/2026 (14 dias)" },
    { id: 8, empCode: "#EMP-008", name: "Inês Filipa Neto", email: "ines.neto@trustport.pt", phone: "962345678", nif: "283917462", nss: "12009876550", dob: "1991-08-25", role: "Analista Financeira & Faturação", salary: 1750.00, iban: "PT50003300008901234567890", contractType: "sem_termo", vacationDays: 22, vacationTaken: 6, vacationDates: "15/06/2026 a 22/06/2026 (6 dias)" },
    { id: 9, empCode: "#EMP-009", name: "Gonçalo André Carvalho", email: "goncalo.carvalho@trustport.pt", phone: "913456789", nif: "294826153", nss: "12009876551", dob: "1998-01-10", role: "Técnico de Armazém & Cargas", salary: 1250.00, iban: "PT50003300009012345678901", contractType: "a_termo_certo", vacationDays: 22, vacationTaken: 2, vacationDates: "02/01/2026 a 03/01/2026 (2 dias)" },
    { id: 10, empCode: "#EMP-010", name: "Mariana Rosa Pinho", email: "mariana.pinho@trustport.pt", phone: "924567890", nif: "215487369", nss: "12009876552", dob: "1992-06-12", role: "Técnica de Recursos Humanos", salary: 1600.00, iban: "PT50003300000123456789012", contractType: "sem_termo", vacationDays: 22, vacationTaken: 11, vacationDates: "10/08/2026 a 23/08/2026 (11 dias)" },
    { id: 11, empCode: "#EMP-011", name: "Tiago Alexandre Lopes", email: "tiago.lopes@trustport.pt", phone: "935678901", nif: "226598471", nss: "12009876553", dob: "1994-10-08", role: "Motorista de Distribuição Urbana", salary: 1300.00, iban: "PT50003300011234567890123", contractType: "sem_termo", vacationDays: 22, vacationTaken: 13, vacationDates: "01/07/2026 a 16/07/2026 (13 dias)" },
    { id: 12, empCode: "#EMP-012", name: "Catarina Isabel Marques", email: "catarina.marques@trustport.pt", phone: "966789012", nif: "237609582", nss: "12009876554", dob: "1989-02-28", role: "Especialista de Qualidade e Processos", salary: 1800.00, iban: "PT50003300021234567890123", contractType: "sem_termo", vacationDays: 22, vacationTaken: 9, vacationDates: "01/09/2026 a 12/09/2026 (9 dias)" },
    { id: 13, empCode: "#EMP-013", name: "Nuno Miguel Henriques", email: "nuno.henriques@trustport.pt", phone: "917890123", nif: "248710693", nss: "12009876555", dob: "1987-07-04", role: "Desenvolvedor de Sistemas / IT", salary: 2100.00, iban: "PT50003300031234567890123", contractType: "sem_termo", vacationDays: 22, vacationTaken: 5, vacationDates: "20/04/2026 a 26/04/2026 (5 dias)" },
    { id: 14, empCode: "#EMP-014", name: "Patricia Alexandra Fonte", email: "patricia.fonte@trustport.pt", phone: "928901234", nif: "259821704", nss: "12009876556", dob: "1996-03-19", role: "Operadora de Dispatching & Expedição", salary: 1400.00, iban: "PT50003300041234567890123", contractType: "a_termo_certo", vacationDays: 22, vacationTaken: 15, vacationDates: "01/08/2026 a 20/08/2026 (15 dias)" },
    { id: 15, empCode: "#EMP-015", name: "Pedro Henrique Almeida", email: "pedro.almeida@trustport.pt", phone: "939012345", nif: "260932815", nss: "12009876557", dob: "1983-09-11", role: "Mecânico e Gestor de Manutenção", salary: 1500.00, iban: "PT50003300051234567890123", contractType: "sem_termo", vacationDays: 22, vacationTaken: 7, vacationDates: "05/10/2026 a 13/10/2026 (7 dias)" }
];

// ID do funcionário atualmente selecionado no formulário
let currentEditingId = 1;

// --- NAVEGAÇÃO ENTRE SEPARADORES (TABS) ---
function switchTab(event, tabId) {
    if (event && event.preventDefault) {
        event.preventDefault(); // Evita que a página salte para o topo com o #
    }

    // 1. Ocultar todas as secções de conteúdo
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none'; // Garante que fica escondido via estilo direto
    });

    // 2. Remover a classe ativa de todos os botões da sidebar
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    // 3. Mostrar a secção pretendida
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block'; // Força a exibição da secção
    } else {
        console.error('Secção não encontrada com o ID:', tabId);
    }

    // 4. Marcar o botão clicado como ativo
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        const activeLink = document.querySelector(`.sidebar-nav a[href="#${tabId}"]`);
        if (activeLink) activeLink.classList.add('active');
    }
}

function loadEmployeeData(empId) {
    const emp = employeesData.find(e => e.id === empId);
    if (!emp) return;

    currentEditingId = empId;

    // Sincronizar o menu suspenso com o funcionário selecionado
    const dropdown = document.getElementById('select-employee-dropdown');
    if (dropdown) dropdown.value = empId;

    // Atualizar o badge do cargo
    const roleBadge = document.getElementById('editing-employee-role');
    if (roleBadge) roleBadge.innerText = emp.role;
    
    // Preencher campos do formulário
    document.getElementById('emp-name').value = emp.name;
    document.getElementById('emp-email').value = emp.email;
    document.getElementById('emp-phone').value = emp.phone;
    document.getElementById('emp-nif').value = emp.nif;
    document.getElementById('emp-nss').value = emp.nss;
    document.getElementById('emp-dob').value = emp.dob;
    
    document.getElementById('emp-role').value = emp.role;
    document.getElementById('emp-salary').value = emp.salary.toFixed(2);
    document.getElementById('emp-iban').value = emp.iban;
    document.getElementById('emp-contract-type').value = emp.contractType;
    
    document.getElementById('emp-vacation-days').value = emp.vacationDays;
    document.getElementById('emp-vacation-taken').value = emp.vacationTaken;
    document.getElementById('emp-vacation-remaining').value = emp.vacationDays - emp.vacationTaken;
    document.getElementById('emp-vacation-dates').value = emp.vacationDates;

    // Limpar avisos antigos ao mudar de funcionário
    clearErrors();
}

// --- CÁLCULO DINÂMICO DE FÉRIAS ---
function calculateRemainingVacation() {
    const totalDays = parseInt(document.getElementById('emp-vacation-days').value) || 22;
    let takenInput = document.getElementById('emp-vacation-taken');
    let takenDays = parseInt(takenInput.value) || 0;

    if (takenDays < 0) takenDays = 0;
    if (takenDays > totalDays) takenDays = totalDays;
    takenInput.value = takenDays;

    document.getElementById('emp-vacation-remaining').value = totalDays - takenDays;
}

// --- PESQUISA E FILTRAGEM DE FUNCIONÁRIOS ---
function filterEmployees() {
    const query = document.getElementById('employee-search').value.toLowerCase();
    const rows = document.querySelectorAll('#employees-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// --- GESTÃO E APROVAÇÃO DE STAFF PENDENTE ---
let pendingStaffCount = 2;

function approveStaff(rowId, name) {
    if (confirm(`Tem a certeza que deseja APROVAR o registo de "${name}"?`)) {
        removeStaffRow(rowId);
        alert(`O membro Staff "${name}" foi aprovado com sucesso!`);
    }
}

function rejectStaff(rowId, name) {
    if (confirm(`Tem a certeza que deseja REJEITAR o registo de "${name}"?`)) {
        removeStaffRow(rowId);
        alert(`O registo de "${name}" foi rejeitado.`);
    }
}

function removeStaffRow(rowId) {
    const row = document.getElementById(`staff-row-${rowId}`);
    if (row) {
        row.remove();
        pendingStaffCount--;
        
        const badge = document.getElementById('pending-count');
        if (badge) badge.innerText = pendingStaffCount;
        
        if (pendingStaffCount === 0) {
            if (badge) badge.style.display = 'none';
            document.getElementById('staff-table').style.display = 'none';
            document.getElementById('no-staff-msg').style.display = 'block';
        }
    }
}

// --- VALIDAÇÃO E COMUNICADO DE GUARDAR FUNCIONÁRIO ---
function validateAndSubmitEmployee(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('emp-name');
    const emailInput = document.getElementById('emp-email');
    const phoneInput = document.getElementById('emp-phone');
    const nifInput = document.getElementById('emp-nif');
    const salaryInput = document.getElementById('emp-salary');
    const alertBox = document.getElementById('alert-box');

    clearErrors();
    let isValid = true;

    // 1. Nome
    if (nameInput.value.trim() === '') {
        showFieldError(nameInput, 'error-name', 'O nome é obrigatório.');
        isValid = false;
    }

    // 2. Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput.value.trim())) {
        showFieldError(emailInput, 'error-email', 'Introduza um email válido.');
        isValid = false;
    }

    // 3. Telefone
    const phonePattern = /^[0-9]{9}$/;
    if (!phonePattern.test(phoneInput.value.trim())) {
        showFieldError(phoneInput, 'error-phone', 'Deve conter 9 dígitos.');
        isValid = false;
    }

    // 4. NIF
    const nifPattern = /^[0-9]{9}$/;
    if (!nifPattern.test(nifInput.value.trim())) {
        showFieldError(nifInput, 'error-nif', 'NIF deve ter 9 dígitos.');
        isValid = false;
    }

    // 5. Vencimento
    if (parseFloat(salaryInput.value) < 820) {
        showFieldError(salaryInput, 'error-salary', 'O vencimento não pode ser inferior ao Salário Mínimo.');
        isValid = false;
    }

    if (!isValid) {
        alertBox.className = 'alert-box error';
        alertBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Por favor, corrija os erros no formulário antes de guardar.';
        alertBox.style.display = 'block';
    } else {
        // Atualizar os dados do objeto em memória
        const emp = employeesData.find(e => e.id === currentEditingId);
        if (emp) {
            emp.name = nameInput.value.trim();
            emp.email = emailInput.value.trim();
            emp.phone = phoneInput.value.trim();
            emp.nif = nifInput.value.trim();
            emp.salary = parseFloat(salaryInput.value);
            emp.vacationTaken = parseInt(document.getElementById('emp-vacation-taken').value) || 0;
        }

        alertBox.className = 'alert-box success';
        alertBox.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ficha do funcionário ${nameInput.value} atualizada com sucesso!`;
        alertBox.style.display = 'block';
        alert(`Dados de ${nameInput.value} atualizados com sucesso no sistema!`);
    }
}

function showFieldError(inputElem, errorSpanId, message) {
    inputElem.classList.add('input-error');
    const span = document.getElementById(errorSpanId);
    if (span) span.innerText = message;
}

function clearErrors() {
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => input.classList.remove('input-error'));

    const errorSpans = document.querySelectorAll('.error-text');
    errorSpans.forEach(span => span.innerText = '');

    const alertBox = document.getElementById('alert-box');
    if (alertBox) alertBox.style.display = 'none';
}

// --- LÓGICA DO MÓDULO DE CONVERSAS ---
function sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    const messageText = input.value.trim();

    if (messageText === '') return;

    const chatBody = document.getElementById('chat-messages-body');
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Criar a mensagem enviada
    const newMsg = document.createElement('div');
    newMsg.className = 'message outgoing';
    newMsg.innerHTML = `<p>${messageText}</p><span class="msg-time">${timeString}</span>`;

    chatBody.appendChild(newMsg);
    input.value = '';

    // Scroll automático para a última mensagem
    chatBody.scrollTop = chatBody.scrollHeight;
}

function selectChat(chatId) {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => item.classList.remove('active'));

    // Exemplo simplificado de troca de utilizador
    const names = ["Beatriz Santos", "Diogo Pereira", "Carla Ribeiro"];
    const roles = ["Gestora de Logística & Rotas", "Motorista Pesados", "Apoio ao Cliente B2B"];

    if (chatId >= 1 && chatId <= 3) {
        document.getElementById('chat-active-name').innerText = names[chatId - 1];
        document.getElementById('chat-active-role').innerText = roles[chatId - 1];
    }
}