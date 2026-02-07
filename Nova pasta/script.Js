// ===== GLOBAL STATE =====
let currentUser = null;
let currentPage = 'dashboard';
let selectedDays = [];
let rentals = [];
let expenses = [];
let reserves = [];
let clients = [];
let notes = [];
let currentEditingExpenseId = null;
let currentEditingRentalId = null;
let currentEditingClientId = null;
let currentEditingReserveId = null;
let currentEditingCategory = null;
let currentMonthYear = new Date();
let pdfType = 'geral';

let settings = {
    initialCapital: 5000,
    defaultDailyRate: 200
};

const categories = {
    piscineiro: { name: 'Piscineiro', icon: 'fas fa-swimmer' },
    faxineira: { name: 'Faxineira', icon: 'fas fa-broom' },
    servico: { name: 'Serviço Geral', icon: 'fas fa-wrench' },
    condominio: { name: 'Condomínio', icon: 'fas fa-building' },
    agua: { name: 'Água', icon: 'fas fa-droplet' },
    luz: { name: 'Luz', icon: 'fas fa-lightbulb' },
    fatura: { name: 'Fatura', icon: 'fas fa-file-invoice' },
    outros: { name: 'Outros', icon: 'fas fa-box' }
};

// ===== UTILITIES =====
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

// ===== AUTHENTICATION =====
function initAuth() {
    const stored = localStorage.getItem('kaudan_user');
    if (stored) {
        currentUser = JSON.parse(stored);
        showApp();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('app').classList.remove('show');
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function showApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('app').classList.add('show');
    document.getElementById('topBarUser').textContent = currentUser.username;
    init();
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (user === 'danilo' && pass === '123') {
        currentUser = { username: user, createdAt: new Date().toISOString() };
        localStorage.setItem('kaudan_user', JSON.stringify(currentUser));
        document.getElementById('loginForm').reset();
        errorEl.classList.remove('show');
        showApp();
    } else {
        errorEl.textContent = 'Usuário ou senha incorretos!';
        errorEl.classList.add('show');
    }
}

// Sistema de notificações Toast
const toastContainer = document.getElementById('toast-container') || createToastContainer();

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(container);
    return container;
}

function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    toast.style.cssText = `
        background-color: ${colors[type] || colors.info};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
        min-width: 300px;
    `;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Adicionar animações CSS
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Modal de confirmação
function showConfirmModal(title, message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-out;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background-color: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        box-shadow: 0 20px 25px rgba(0,0,0,0.15);
        animation: slideUp 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #1f2937;">${title}</h2>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="cancel-btn" style="
                background-color: #e5e7eb;
                color: #374151;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            ">Cancelar</button>
            <button id="confirm-btn" style="
                background-color: #ef4444;
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            ">Confirmar</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const confirmBtn = modal.querySelector('#confirm-btn');
    const cancelBtn = modal.querySelector('#cancel-btn');
    
    confirmBtn.onmouseover = () => confirmBtn.style.backgroundColor = '#dc2626';
    confirmBtn.onmouseout = () => confirmBtn.style.backgroundColor = '#ef4444';
    
    cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = '#d1d5db';
    cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = '#e5e7eb';
    
    confirmBtn.addEventListener('click', () => {
        overlay.remove();
        onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
        overlay.remove();
        onCancel && onCancel();
    });
}

// Adicionar animações para modal
if (!document.getElementById('modal-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Função logout modificada
function logout() {
    showConfirmModal(
        'Sair do Sistema',
        'Deseja realmente sair do sistema?',
        () => {
            currentUser = null;
            localStorage.removeItem('kaudan_user');
            showToast('Você saiu do sistema com sucesso!', 'success', 2000);
            setTimeout(() => {
                showLogin();
            }, 500);
        },
        () => {
            showToast('Saída cancelada', 'info', 1500);
        }
    );
}



// ===== INIT =====
function init() {
    loadSettings();
    loadData();
    setupNavigation();
    setupFormHandlers();
    setupModalBackdrop();
    renderPage();
}

// ===== MODAL MANAGEMENT =====
function setupModalBackdrop() {
    const backdrop = document.getElementById('modalBackdrop');
    backdrop.addEventListener('click', () => {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        backdrop.classList.remove('show');
    });
}

function openModal(id) {
    const modal = document.getElementById(id);
    const backdrop = document.getElementById('modalBackdrop');

    modal.classList.add('show');
    backdrop.classList.add('show');

    if (id === 'rentalModal') {
        document.getElementById('dailyRate').value = settings.defaultDailyRate;
        calcRentalTotal();
    } else if (id === 'settingsModal') {
        document.getElementById('initialCapital').value = settings.initialCapital;
        document.getElementById('defaultDailyRate').value = settings.defaultDailyRate;
    } else if (id === 'reserveModal') {
        populateClientSelect();
    }
}

function closeModal(id = 'modal') {
    const modal = document.getElementById(id);
    const backdrop = document.getElementById('modalBackdrop');
    const modalContent = document.getElementById('modalContent');

    if (modal) {
        modal.classList.remove('show');
    }

    // Verifica se ainda existe algum modal aberto
    const anyOpen = document.querySelectorAll('.modal.show').length > 0;

    if (!anyOpen && backdrop) {
        backdrop.classList.remove('show');
    }

    // Limpa conteúdo apenas do modal principal
    if (modalContent && id === 'modal') {
        modalContent.innerHTML = '';
    }
}

// ===== DATA MANAGEMENT =====
function loadSettings() {
    const saved = localStorage.getItem('kaudan_settings');
    if (saved) {
        settings = JSON.parse(saved);
    }
}

function saveSettings() {
    localStorage.setItem('kaudan_settings', JSON.stringify(settings));
}

function loadData() {
    rentals = JSON.parse(localStorage.getItem('kaudan_rentals') || '[]');
    expenses = JSON.parse(localStorage.getItem('kaudan_expenses') || '[]');
    reserves = JSON.parse(localStorage.getItem('kaudan_reserves') || '[]');
    clients = JSON.parse(localStorage.getItem('kaudan_clients') || '[]');
    notes = JSON.parse(localStorage.getItem('kaudan_notes') || '[]');
}

function saveData() {
    localStorage.setItem('kaudan_rentals', JSON.stringify(rentals));
    localStorage.setItem('kaudan_expenses', JSON.stringify(expenses));
    localStorage.setItem('kaudan_reserves', JSON.stringify(reserves));
    localStorage.setItem('kaudan_clients', JSON.stringify(clients));
    localStorage.setItem('kaudan_notes', JSON.stringify(notes));
}

// ===== NAVIGATION =====//

function navigatePage(page) {
    // Update desktop sidebar
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    // Update mobile bottom bar
    document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.bottom-nav-item[data-page="${page}"]`)?.classList.add('active');

    // Update bottom menu items
    document.querySelectorAll('.bottom-menu-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.bottom-menu-item[data-page="${page}"]`)?.classList.add('active');

    currentPage = page;
    selectedDays = [];
    renderPage();
}
function toggleBottomMenu() {
    document.getElementById('bottomMenu').classList.toggle('show');
}

function setupNavigation() {
    // Desktop sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            navigatePage(item.dataset.page);
        });
    });

    // Mobile bottom bar
    document.querySelectorAll('.bottom-nav-item:not(.bottom-nav-more)').forEach(item => {
        item.addEventListener('click', () => {
            navigatePage(item.dataset.page);
        });
    });

    // Bottom menu items - fecha o menu após clicar
    document.querySelectorAll('.bottom-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            navigatePage(item.dataset.page);
            // Fecha o menu após a navegação
            document.getElementById('bottomMenu').classList.remove('show');
        });
    });
}




function renderPage() {
    const content = document.getElementById('content');
    const headerTitle = document.getElementById('pageTitle');
    const headerSubtitle = document.getElementById('pageSubtitle');

    const pages = {
        dashboard: {
            title: 'Dashboard',
            subtitle: 'Visão geral do seu negócio',
            render: renderDashboard
        },
        calendar: {
            title: 'Agenda',
            subtitle: 'Calendário de locações e reservas',
            render: renderCalendar
        },
        rentals: {
            title: 'Aluguéis',
            subtitle: 'Gerenciar locações confirmadas',
            render: renderRentals
        },
        expenses: {
            title: 'Despesas',
            subtitle: 'Lançar e gerenciar gastos',
            render: renderExpenses
        },
        clients: {
            title: 'Clientes',
            subtitle: 'Gestão de clientes',
            render: renderClients
        },
        reserves: {
            title: 'Reservas',
            subtitle: 'Gerenciar reservas em andamento',
            render: renderReserves
        },
        notes: {
            title: 'Anotações',
            subtitle: 'Suas anotações e lembretes',
            render: renderNotes
        },
        reports: {
            title: 'Relatórios',
            subtitle: 'Exportar dados em PDF',
            render: renderReports
        },
        settings: {
            title: 'Configurações',
            subtitle: 'Ajustes do sistema',
            render: () => { openModal('settingsModal'); return ''; }
        }
    };

    const page = pages[currentPage];
    headerTitle.textContent = page.title;
    headerSubtitle.textContent = page.subtitle;
    content.innerHTML = page.render();
}

// ===== DASHBOARD =====
function formatCurrencyCompact(value) {
    if (value >= 1000000000) {
        return 'R$ ' + (value / 1000000000).toFixed(1).replace('.0', '') + 'B';
    }
    if (value >= 1000000) {
        return 'R$ ' + (value / 1000000).toFixed(1).replace('.0', '') + 'M';
    }
    if (value >= 1000) {
        return 'R$ ' + (value / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return formatCurrency(value);
}

function renderDashboard() {
    const capital = calculateCapital();
    const monthlyRevenue = calculateMonthlyRevenue();
    const monthlyExpenses = calculateMonthlyExpenses();
    const rentedDaysCount = calculateRentedDays();
    const nextRental = getNextRental();

    const html = `
                <div class="stats-grid">
                    <div class="stat-box stat-box-clickable" data-stat="capital" style="cursor: pointer;" title="${formatCurrency(capital)}">
                        <div class="stat-label"><i class="fas fa-wallet"></i> Capital Atual</div>
                        <div class="stat-value" style="word-break: break-word; overflow-wrap: break-word;">${formatCurrencyCompact(capital)}</div>
                        <div class="stat-change" style="word-break: break-word; overflow-wrap: break-word;" title="${formatCurrency(capital - settings.initialCapital)}">${capital >= settings.initialCapital ? '+' : ''}${formatCurrencyCompact(capital - settings.initialCapital)}</div>
                    </div>
                    <div class="stat-box stat-box-clickable" data-stat="revenue" style="cursor: pointer;" title="${formatCurrency(monthlyRevenue)}">
                        <div class="stat-label"><i class="fas fa-arrow-trend-up"></i> Receita (Mês)</div>
                        <div class="stat-value" style="word-break: break-word; overflow-wrap: break-word;">${formatCurrencyCompact(monthlyRevenue)}</div>
                        <div class="stat-change">${rentals.filter(r => r.startDate.startsWith(new Date().toISOString().slice(0, 7))).length} locações</div>
                    </div>
                    <div class="stat-box stat-box-clickable" data-stat="expenses" style="cursor: pointer;" title="${formatCurrency(monthlyExpenses)}">
                        <div class="stat-label"><i class="fas fa-arrow-trend-down"></i> Despesas (Mês)</div>
                        <div class="stat-value" style="word-break: break-word; overflow-wrap: break-word;">${formatCurrencyCompact(monthlyExpenses)}</div>
                        <div class="stat-change">${expenses.filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7))).length} lançamentos</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label"><i class="fas fa-calendar-days"></i> Dias Alugados</div>
                        <div class="stat-value">${rentedDaysCount}</div>
                        <div class="stat-change">este mês</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title"><i class="fas fa-key"></i> Próxima Locação</div>
                    </div>
                    ${nextRental ? `
                        <div style="padding: 0;">
                            <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.5rem;">${nextRental.clientName}</div>
                            <div style="color: var(--cinza-500); margin-bottom: 1rem;">
                                ${formatDate(nextRental.startDate)} a ${formatDate(nextRental.endDate)} (${nextRental.days} dias)
                            </div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--verde-principal); word-break: break-word; overflow-wrap: break-word;" title="${formatCurrency(nextRental.total)}">${formatCurrencyCompact(nextRental.total)}</div>
                        </div>
                    ` : '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhuma locação agendada</p></div>'}
                </div>
            `;

    setTimeout(() => {
        document.querySelectorAll('.stat-box-clickable').forEach(box => {
            box.removeEventListener('click', handleStatBoxClick);
            box.addEventListener('click', handleStatBoxClick);
        });
    }, 0);

    return html;
}

function handleStatBoxClick(e) {
    const statType = this.dataset.stat;
    openEditStatModal(statType);
}

function openEditStatModal(statType) {
    const capital = calculateCapital();
    const monthlyRevenue = calculateMonthlyRevenue();
    const monthlyExpenses = calculateMonthlyExpenses();

    let title = '';
    let currentValue = 0;
    let helpText = '';
    let icon = '';

    if (statType === 'capital') {
        title = 'Editar Capital Atual';
        currentValue = capital;
        helpText = 'Atualize o capital de acordo com sua situação financeira atual';
        icon = 'fa-wallet';
    } 
    else if (statType === 'revenue') {
        title = 'Editar Receita do Mês';
        currentValue = monthlyRevenue;
        helpText = 'A receita é calculada automaticamente pelas locações';
        icon = 'fa-arrow-trend-up';
    } 
    else if (statType === 'expenses') {
        title = 'Editar Despesas do Mês';
        currentValue = monthlyExpenses;
        helpText = 'As despesas são calculadas automaticamente pelos lançamentos';
        icon = 'fa-arrow-trend-down';
    }

    const modalHTML = `
        <div class="modal-header">
            <i class="fas ${icon}"></i>
            <span>${title}</span>
        </div>

        <p class="modal-help">
            ${helpText}
        </p>

        <div class="form-group">
            <label class="form-label">
                Valor Atual: ${formatCurrency(currentValue)}
            </label>

            <input
                type="number"
                id="editStatInput"
                class="form-input"
                step="0.01"
                value="${currentValue}"
                ${statType !== 'capital' ? 'disabled' : ''}
            >
        </div>

        <div class="modal-info">
            <i class="fas fa-info-circle"></i>
            <span>Alterações manuais impactam diretamente o dashboard.</span>
        </div>

        <div class="modal-buttons">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveEditStat('${statType}')" ${statType !== 'capital' ? 'disabled' : ''}>
                Salvar
            </button>
        </div>
    `;

    const modalContent = document.getElementById('modalContent');
    if (!modalContent) {
        console.error('modalContent não encontrado');
        return;
    }

    modalContent.innerHTML = modalHTML;

    document.getElementById('modalBackdrop').classList.add('show');
    document.getElementById('modal').classList.add('show');

    setTimeout(() => {
        const input = document.getElementById('editStatInput');
        if (input && !input.disabled) {
            input.focus();
            input.select();
        }
    }, 150);
}


function saveEditStat(statType) {
    const newValue = parseFloat(document.getElementById('editStatInput').value) || 0;
    
    if (newValue < 0) {
        showToast('❌ Valor não pode ser negativo', 'error');
        return;
    }
    
    if (statType === 'capital') {
        const oldCapital = calculateCapital();
        settings.initialCapital = newValue;
        saveSettings();
        closeModal();
        refreshDashboard();
        showToast(` Capital atualizado de ${formatCurrency(oldCapital)} para ${formatCurrency(newValue)}`, 'success');
    } else if (statType === 'revenue') {
        showToast(' Receita é calculada automaticamente pelas locações', 'warning');
        closeModal();
    } else if (statType === 'expenses') {
        showToast(' Despesas são calculadas automaticamente pelos lançamentos', 'warning');
        closeModal();
    }
}
function refreshDashboard() {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = renderDashboard();
}



// ===== CALENDAR =====
function renderCalendar() {
    const year = currentMonthYear.getFullYear();
    const month = currentMonthYear.getMonth();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    let html = `
                <div class="card">
                    <div class="card-header">
                        <button class="btn btn-secondary btn-small" onclick="prevMonth()"><i class="fas fa-chevron-left"></i></button>
                        <div class="card-title" style="margin-bottom: 0; flex: 1; text-align: center;">
                            <i class="fas fa-calendar-alt"></i> ${monthNames[month]} ${year}
                        </div>
                        <button class="btn btn-secondary btn-small" onclick="nextMonth()"><i class="fas fa-chevron-right"></i></button>
                    </div>

                    <div class="calendar-header">
            `;

    dayNames.forEach(day => {
        html += `<div class="calendar-day-name">${day}</div>`;
    });

    html += `</div><div class="calendar">`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
        html += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentDate = new Date(dateStr + 'T00:00:00');
        const isRented = isDateRented(dateStr);
        const isReserved = isDateReserved(dateStr);
        const isSelected = selectedDays.includes(dateStr);
        const isPast = currentDate < today;

        let classes = 'calendar-day';
        if (isPast) classes += ' disabled';
        else if (isRented) classes += ' rented';
        else if (isReserved) classes += ' reserved';
        else if (isSelected) classes += ' selected';
        else classes += ' available';

        const onclick = isPast || isRented || isReserved ? '' : `onclick="toggleDay('${dateStr}')"`;
        html += `<div class="${classes}" ${onclick}>${day}</div>`;
    }

    html += `</div></div>`;

    if (selectedDays.length > 0) {
        html += `
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title"><i class="fas fa-check-circle"></i> Período Selecionado</div>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-weight: 700; margin-bottom: 0.5rem;">${selectedDays.length} dias selecionados</div>
                            <div style="color: var(--cinza-500);">
                                ${formatDate(selectedDays[0])} a ${formatDate(selectedDays[selectedDays.length - 1])}
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block" onclick="openRentalFlow()">
                            <i class="fas fa-plus"></i> Alugar Período
                        </button>
                        <button class="btn btn-secondary btn-block" style="margin-top: 0.75rem;" onclick="openReserveFlow()">
                            <i class="fas fa-bookmark"></i> Fazer Reserva
                        </button>
                    </div>
                `;
    }

    return html;
}

function toggleDay(dateStr) {
    const index = selectedDays.indexOf(dateStr);
    if (index > -1) {
        selectedDays.splice(index, 1);
        showToast('Data removida da seleção', 'info', 1500);
    } else {
        selectedDays.push(dateStr);
        showToast('Data adicionada à seleção', 'success', 1500);
    }
    selectedDays.sort();
    renderPage();
}

function isDateRented(dateStr) {
    return rentals.some(r => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        const current = new Date(dateStr);
        return current >= start && current <= end;
    });
}

function isDateReserved(dateStr) {
    return reserves.some(r => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        const current = new Date(dateStr);
        return current >= start && current <= end;
    });
}

function prevMonth() {
    currentMonthYear.setMonth(currentMonthYear.getMonth() - 1);
    renderPage();
}

function nextMonth() {
    currentMonthYear.setMonth(currentMonthYear.getMonth() + 1);
    renderPage();
}

function openRentalFlow() {
    if (selectedDays.length === 0) {
        showToast('Selecione pelo menos um dia', 'warning', 2000);
        return;
    }
    openModal('rentalModal');
    showToast('Modal de aluguel aberto', 'info', 1500);
}

function openReserveFlow() {
    if (selectedDays.length === 0) {
        showToast('Selecione pelo menos um dia', 'warning', 2000);
        return;
    }
    openModal('reserveModal');
    showToast('Modal de reserva aberto', 'info', 1500);
}
// ===== RENTALS =====
function renderRentals() {
    if (rentals.length === 0) {
        return `<div class="card"><div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhuma locação registrada</p></div></div>`;
    }

    let html = '<div class="card"><div class="table-container"><table><thead><tr><th><i class="fas fa-user"></i> Cliente</th><th><i class="fas fa-calendar"></i> Período</th><th style="text-align: center;"><i class="fas fa-calculator"></i> Dias</th><th style="text-align: right;"><i class="fas fa-tag"></i> Diária</th><th style="text-align: right;"><i class="fas fa-money-bill"></i> Total</th><th style="text-align: center;"><i class="fas fa-cog"></i> Status</th></tr></thead><tbody>';

    [...rentals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(rental => {
        const status = new Date(rental.endDate) < new Date() ? 'Finalizado' : 'Ativo';
        html += `
                    <tr onclick="openEditRentalModal('${rental.id}')">
                        <td><strong>${rental.clientName}</strong></td>
                        <td>${formatDate(rental.startDate)} a ${formatDate(rental.endDate)}</td>
                        <td style="text-align: center; font-weight: 600;">${rental.days}</td>
                        <td style="text-align: right; font-weight: 600;">${formatCurrency(rental.dailyRate)}</td>
                        <td style="text-align: right; font-weight: 800; color: var(--verde-principal);">${formatCurrency(rental.total)}</td>
                        <td style="text-align: center;">
                            <span class="status-badge ${status === 'Ativo' ? 'status-active' : 'status-finished'}">${status}</span>
                        </td>
                    </tr>
                `;
    });

    html += '</tbody></table></div></div>';
    return html;
}

function openEditRentalModal(id) {
    currentEditingRentalId = id;
    const rental = rentals.find(r => r.id === id);
    if (rental) {
        document.getElementById('editRentalClientName').value = rental.clientName;
        document.getElementById('editRentalStartDate').value = rental.startDate;
        document.getElementById('editRentalEndDate').value = rental.endDate;
        document.getElementById('editRentalDailyRate').value = rental.dailyRate;
        calcEditRentalTotal();
        openModal('editRentalModal');
        showToast('Locação aberta para edição', 'info', 1500);
    } else {
        showToast('Erro ao carregar locação', 'error', 2000);
    }
}

function calcEditRentalTotal() {
    const startDate = new Date(document.getElementById('editRentalStartDate').value);
    const endDate = new Date(document.getElementById('editRentalEndDate').value);
    const dailyRate = parseFloat(document.getElementById('editRentalDailyRate').value) || 0;

    if (startDate && endDate && startDate <= endDate) {
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        document.getElementById('editRentalTotal').value = formatCurrency(dailyRate * days);
    } else {
        showToast('Datas inválidas', 'warning', 1500);
    }
}

function deleteCurrentRental() {
    showConfirmModal(
        'Cancelar Locação',
        'Esta ação não pode ser desfeita. Tem certeza que deseja cancelar essa locação?',
        () => {
            rentals = rentals.filter(r => r.id !== currentEditingRentalId);
            saveData();
            closeModal('editRentalModal');
            showToast('Locação cancelada com sucesso!', 'success', 2000);
            renderPage();
        }
    );
}

// ===== EXPENSES =====
function renderExpenses() {
    let html = '<div class="card"><div class="category-grid">';

    Object.keys(categories).forEach(catKey => {
        const cat = categories[catKey];
        const catExpenses = expenses.filter(e => e.category === catKey);
        const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);

        html += `
                    <div class="category-card" onclick="openCategoryHistory('${catKey}')">
                        <button class="category-add-btn" onclick="event.stopPropagation(); openQuickAdd('${catKey}')">
                            <i class="fas fa-plus"></i>
                        </button>
                        <div class="category-icon"><i class="${cat.icon}"></i></div>
                        <div class="category-name">${cat.name}</div>
                        <div class="category-total">${formatCurrency(total)}</div>
                        <div style="color: var(--cinza-500); font-size: 0.8rem;">
                            ${catExpenses.length} lançamento${catExpenses.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                `;
    });

    html += '</div></div>';
    return html;
}

function openQuickAdd(category) {
    currentEditingCategory = category;
    document.getElementById('quickAddTitle').textContent = `Lançar - ${categories[category].name}`;
    document.getElementById('quickAmount').value = '';
    document.getElementById('quickDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('quickNote').value = '';
    document.getElementById('quickAddForm').onsubmit = (e) => submitQuickAdd(e, category);
    openModal('quickAddModal');
    showToast('Modal de lançamento aberto', 'info', 1500);
}

function submitQuickAdd(e, category) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('quickAmount').value);
    const date = document.getElementById('quickDate').value;

    if (!amount || amount <= 0) {
        showToast('Digite um valor válido', 'warning', 2000);
        return;
    }

    if (!date) {
        showToast('Selecione uma data', 'warning', 2000);
        return;
    }

    const expense = {
        id: Date.now().toString(),
        category,
        amount: amount,
        date: date,
        note: document.getElementById('quickNote').value,
        createdAt: new Date().toISOString()
    };

    expenses.push(expense);
    saveData();
    closeModal('quickAddModal');
    showToast(`Gasto de ${formatCurrency(expense.amount)} lançado com sucesso!`, 'success', 2000);
    renderPage();
}

function openCategoryHistory(category) {
    currentEditingCategory = category;
    const cat = categories[category];
    const catExpenses = expenses.filter(e => e.category === category).sort((a, b) => new Date(b.date) - new Date(a.date));

    document.getElementById('historyTitle').textContent = cat.name;
    let historyHtml = '';

    if (catExpenses.length === 0) {
        historyHtml = '<div class="empty-state"><i class="fas fa-history"></i><p>Nenhum lançamento</p></div>';
    } else {
        historyHtml = '<div class="table-container"><table><thead><tr><th><i class="fas fa-calendar"></i> Data</th><th><i class="fas fa-file-alt"></i> Observação</th><th style="text-align: right;"><i class="fas fa-money-bill"></i> Valor</th></tr></thead><tbody>';
        catExpenses.forEach(exp => {
            historyHtml += `
                        <tr onclick="openEditExpense('${exp.id}')">
                            <td style="font-weight: 700; color: var(--verde-principal);">${formatDate(exp.date)}</td>
                            <td>${exp.note || '-'}</td>
                            <td style="text-align: right; font-weight: 800; color: var(--verde-principal);">${formatCurrency(exp.amount)}</td>
                        </tr>
                    `;
        });
        historyHtml += '</tbody></table></div>';
    }

    document.getElementById('historyList').innerHTML = historyHtml;
    openModal('historyModal');
    showToast(`Histórico de ${cat.name} carregado`, 'info', 1500);
}

function openEditExpense(id) {
    currentEditingExpenseId = id;
    const exp = expenses.find(e => e.id === id);
    if (exp) {
        document.getElementById('editAmount').value = exp.amount;
        document.getElementById('editDate').value = exp.date;
        document.getElementById('editNote').value = exp.note;
        closeModal('historyModal');
        openModal('editExpenseModal');
        showToast('Lançamento aberto para edição', 'info', 1500);
    } else {
        showToast('Erro ao carregar lançamento', 'error', 2000);
    }
}

function deleteCurrentExpense() {
    showConfirmModal(
        'Excluir Lançamento',
        'Esta ação não pode ser desfeita. Tem certeza que deseja excluir esse lançamento?',
        () => {
            expenses = expenses.filter(e => e.id !== currentEditingExpenseId);
            saveData();
            closeModal('editExpenseModal');
            showToast('Lançamento excluído com sucesso!', 'success', 2000);
            renderPage();
        }
    );
}
// ===== CLIENTS =====
function renderClients() {
    let html = `<button class="btn btn-primary" onclick="openNewClientFlow()" style="margin-bottom: 1.5rem;">
                <i class="fas fa-user-plus"></i> Novo Cliente
            </button>`;

    if (clients.length === 0) {
        html += `<div class="card"><div class="empty-state"><i class="fas fa-users"></i><p>Nenhum cliente registrado</p></div></div>`;
    } else {
        html += '<div class="card"><div class="table-container"><table><thead><tr><th><i class="fas fa-user"></i> Nome</th><th><i class="fas fa-envelope"></i> Email</th><th><i class="fas fa-id-card"></i> CPF</th><th><i class="fas fa-phone"></i> Telefone</th></tr></thead><tbody>';
        clients.forEach(client => {
            html += `
                        <tr onclick="openEditClientModal('${client.id}')">
                            <td><strong>${client.name}</strong></td>
                            <td>${client.email || '-'}</td>
                            <td>${client.cpf || '-'}</td>
                            <td>${client.phone || '-'}</td>
                        </tr>
                    `;
        });
        html += '</tbody></table></div></div>';
    }

    return html;
}

function openNewClientFlow() {
    document.getElementById('editClientName').value = '';
    document.getElementById('editClientEmail').value = '';
    document.getElementById('editClientCPF').value = '';
    document.getElementById('editClientPhone').value = '';
    currentEditingClientId = null;
    openModal('clientModal');
    showToast('Modal de novo cliente aberto', 'info', 1500);
}

function openEditClientModal(id) {
    currentEditingClientId = id;
    const client = clients.find(c => c.id === id);
    if (client) {
        document.getElementById('editClientName').value = client.name;
        document.getElementById('editClientEmail').value = client.email;
        document.getElementById('editClientCPF').value = client.cpf;
        document.getElementById('editClientPhone').value = client.phone;
        openModal('editClientModal');
        showToast('Cliente carregado para edição', 'info', 1500);
    } else {
        showToast('Erro ao carregar cliente', 'error', 2000);
    }
}

function deleteCurrentClient() {
    showConfirmModal(
        'Excluir Cliente',
        'Esta ação não pode ser desfeita. Tem certeza que deseja excluir esse cliente? Todas as suas locações e reservas serão mantidas no histórico.',
        () => {
            const clientToDelete = clients.find(c => c.id === currentEditingClientId);
            const clientName = clientToDelete?.name || 'Cliente';
            
            clients = clients.filter(c => c.id !== currentEditingClientId);
            saveData();
            closeModal('editClientModal');
            showToast(`Cliente "${clientName}" excluído com sucesso!`, 'success', 2000);
            renderPage();
        }
    );
}

function populateClientSelect() {
    const select = document.getElementById('reserveClient');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um cliente...</option>';
    
    if (clients.length === 0) {
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = 'Nenhum cliente cadastrado';
        select.appendChild(option);
        showToast('Cadastre um cliente primeiro', 'warning', 2000);
        return;
    }
    
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        select.appendChild(option);
    });
}

// ===== RESERVES =====
function renderReserves() {
    if (reserves.length === 0) {
        return `<div class="card"><div class="empty-state"><i class="fas fa-bookmark"></i><p>Nenhuma reserva registrada</p></div></div>`;
    }

    let html = '<div class="card"><div class="table-container"><table><thead><tr><th><i class="fas fa-user"></i> Cliente</th><th><i class="fas fa-calendar"></i> Período</th><th style="text-align: center;"><i class="fas fa-calculator"></i> Dias</th><th style="text-align: right;"><i class="fas fa-tag"></i> Diária</th><th style="text-align: center;"><i class="fas fa-cog"></i> Ação</th></tr></thead><tbody>';

    reserves.forEach(reserve => {
        html += `
                    <tr>
                        <td><strong>${reserve.clientName}</strong></td>
                        <td>${formatDate(reserve.startDate)} a ${formatDate(reserve.endDate)}</td>
                        <td style="text-align: center; font-weight: 600;">${reserve.days}</td>
                        <td style="text-align: right; font-weight: 600;">${formatCurrency(reserve.dailyRate)}</td>
                        <td style="text-align: center;">
                            <button class="btn btn-primary btn-small" onclick="confirmReserveFlow('${reserve.id}')">
                                <i class="fas fa-check"></i> Confirmar
                            </button>
                        </td>
                    </tr>
                `;
    });

    html += '</tbody></table></div></div>';
    return html;
}

function confirmReserveFlow(id) {
    const reserve = reserves.find(r => r.id === id);
    if (!reserve) {
        showToast('Erro ao confirmar reserva', 'error', 2000);
        return;
    }

    showConfirmModal(
        'Confirmar Reserva',
        `Deseja converter a reserva de ${reserve.clientName} (${formatDate(reserve.startDate)} a ${formatDate(reserve.endDate)}) em uma locação?`,
        () => {
            const rental = {
                id: Date.now().toString(),
                clientName: reserve.clientName,
                startDate: reserve.startDate,
                endDate: reserve.endDate,
                days: reserve.days,
                dailyRate: reserve.dailyRate,
                total: reserve.dailyRate * reserve.days,
                createdAt: new Date().toISOString()
            };
            rentals.push(rental);
            reserves = reserves.filter(r => r.id !== id);
            saveData();
            showToast(`Reserva de ${reserve.clientName} confirmada como locação!`, 'success', 2000);
            renderPage();
        }
    );
}

// ===== NOTES =====
function renderNotes() {
   let html = `<button class="btn btn-primary" onclick="openNewNoteFlow()" style="margin-bottom: 1.5rem;">
                <i class="fas fa-plus"></i> Nova Anotação
            </button>`;

    if (notes.length === 0) {
        html += `<div class="card"><div class="empty-state"><i class="fas fa-sticky-note"></i><p>Nenhuma anotação criada</p></div></div>`;
    } else {
        html += '<div class="notes-grid">';
        [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(note => {
            html += `
                        <div class="note-card">
                            <div class="note-header">
                                <div class="note-title">${note.title}</div>
                                <button class="note-delete" onclick="deleteNoteFlow('${note.id}')" title="Deletar anotação">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="note-content">${note.content}</div>
                            <div class="note-date">${formatDate(note.createdAt.split('T')[0])}</div>
                        </div>
                    `;
        });
        html += '</div>';
    }

    return html;
}function renderNotes() {
   let html = `<button class="btn btn-primary" onclick="openNewNoteFlow()" style="margin-bottom: 1.5rem;">
                <i class="fas fa-plus"></i> Nova Anotação
            </button>`;

    if (notes.length === 0) {
        html += `<div class="card"><div class="empty-state"><i class="fas fa-sticky-note"></i><p>Nenhuma anotação criada</p></div></div>`;
    } else {
        html += '<div class="notes-grid">';
        [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(note => {
            html += `
                        <div class="note-card">
                            <div class="note-header">
                                <div class="note-title">${note.title}</div>
                                <button class="note-delete" onclick="deleteNoteFlow('${note.id}')" type="button" title="Deletar anotação">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="note-content">${note.content}</div>
                            <div class="note-date">${formatDate(note.createdAt.split('T')[0])}</div>
                        </div>
                    `;
        });
        html += '</div>';
    }

    return html;
}
function openNewNoteFlow() {
    openModal('addNoteModal');
}

function deleteNoteFlow(id) {
    const note = notes.find(n => n.id === id);
    if (!note) {
        showToast('Erro ao carregar anotação', 'error', 2000);
        return;
    }

    showConfirmModal(
        'Excluir Anotação',
        `Deseja excluir a anotação "${note.title}"? Esta ação não pode ser desfeita.`,
        () => {
            notes = notes.filter(n => n.id !== id);
            saveData();
            showToast('Anotação excluída com sucesso!', 'success', 2000);
            renderPage();
        }
    );
}



// ===== REPORTS =====
function renderReports() {
    return `
                <div class="pdf-selector">
                    <label class="pdf-selector-label"><i class="fas fa-file-pdf"></i> Tipo de Relatório:</label>
                    <select class="pdf-selector-select" id="pdfTypeSelect" onchange="pdfType = this.value">
                        <option value="geral">Relatório Geral (Completo)</option>
                        <option value="receitas">Receitas (Aluguéis)</option>
                        <option value="despesas">Despesas Detalhadas</option>
                        <option value="clientes">Clientes e Locações</option>
                    </select>
                    <button class="export-btn" onclick="exportReportPDF()">
                        <i class="fas fa-download"></i> Exportar PDF
                    </button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title"><i class="fas fa-chart-bar"></i> Resumo do Negócio</div>
                    </div>
                    <div class="stats-grid" style="margin: 0;">
                        <div class="stat-box">
                            <div class="stat-label">Capital Atual</div>
                            <div class="stat-value">${formatCurrency(calculateCapital())}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Receita Total</div>
                            <div class="stat-value">${formatCurrency(calculateTotalRevenue())}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Despesa Total</div>
                            <div class="stat-value">${formatCurrency(calculateTotalExpenses())}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Lucro Líquido</div>
                            <div class="stat-value">${formatCurrency(calculateTotalRevenue() - calculateTotalExpenses())}</div>
                        </div>
                    </div>
                </div>
            `;
}

async function exportReportPDF() {
    const pdfType = document.getElementById('pdfTypeSelect').value;
    const { jsPDF } = window.jspdf;
    const exportBtn = event.target.closest('.export-btn');
    const originalHTML = exportBtn.innerHTML;

    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
    exportBtn.disabled = true;

    const pdfContainer = document.createElement('div');
    pdfContainer.style.cssText = 'position:absolute;left:-9999px;top:0;background:white;';

    let pdfHTML = '';

    if (pdfType === 'geral' || pdfType === 'receitas') {
        pdfHTML += generateReceitasPageHTML();
    }

    if (pdfType === 'geral' || pdfType === 'despesas') {
        pdfHTML += generateDespesasPageHTML();
    }

    if (pdfType === 'geral' || pdfType === 'clientes') {
        pdfHTML += generateClientesPageHTML();
    }

    pdfContainer.innerHTML = pdfHTML;
    document.body.appendChild(pdfContainer);

    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const pages = pdfContainer.querySelectorAll('.pdf-page');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;

        for (let i = 0; i < pages.length; i++) {
            const canvas = await html2canvas(pages[i], {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 793,
                windowWidth: 793
            });

            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            if (i > 0) {
                pdf.addPage();
            }

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        }

        pdf.save(`relatorio-kaudan-${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('PDF exportado com sucesso!', 'success');
        exportBtn.innerHTML = originalHTML;
        exportBtn.disabled = false;
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showAlert('Erro ao gerar PDF. Tente novamente!', 'error');
        exportBtn.innerHTML = originalHTML;
        exportBtn.disabled = false;
    } finally {
        document.body.removeChild(pdfContainer);
    }
}

    function generateReceitasPageHTML() {
        const totalReceita = calculateTotalRevenue();
        const monthlyRevenue = calculateMonthlyRevenue();
        const sortedRentals = [...rentals].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        let pagesHTML = '';
        let currentPage = [];
        let rowsPerPage = 12;

        sortedRentals.forEach((rental, idx) => {
            currentPage.push(rental);
            if (currentPage.length === rowsPerPage || idx === sortedRentals.length - 1) {
                pagesHTML += `
                            <div class="pdf-page" style="width: 210mm; background: white; color: #111827; font-family: 'Inter', sans-serif; padding: 0; margin-bottom: 20px; min-height: 297mm; display: flex; flex-direction: column;">
                                <style>
                                    .pdf-header { background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 30px 40px; width: 100%; }
                                    .pdf-title { font-size: 32px; font-weight: 900; margin-bottom: 5px; display: flex; align-items: center; gap: 15px; font-family: 'Poppins', sans-serif; }
                                    .pdf-month { font-size: 20px; font-weight: 700; margin-bottom: 8px; opacity: 0.95; font-family: 'Poppins', sans-serif; }
                                    .pdf-subtitle { font-size: 13px; opacity: 0.9; margin-bottom: 3px; }
                                    .pdf-date { font-size: 10px; opacity: 0.8; margin-top: 8px; }
                                    .pdf-content { padding: 25px 40px; flex: 1; display: flex; flex-direction: column; }
                                    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
                                    .stat-card { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 10px; padding: 12px; text-align: center; }
                                    .stat-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 18px; }
                                    .stat-label { color: #64748b; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; }
                                    .stat-value { color: #0f172a; font-size: 18px; font-weight: 800; font-family: 'Poppins', sans-serif; }
                                    .stat-unit { font-size: 10px; color: #64748b; font-weight: 600; }
                                    .section-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 18px 0 10px; padding-bottom: 6px; border-bottom: 2.5px solid #10b981; display: flex; align-items: center; gap: 8px; font-family: 'Poppins', sans-serif; }
                                    .pdf-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; flex: 1; }
                                    .pdf-table thead { background: #10b981; color: white; position: sticky; top: 0; }
                                    .pdf-table th, .pdf-table td { padding: 8px 10px; text-align: left; border: 1px solid #d1d5db; font-size: 9px; }
                                    .pdf-table th { font-weight: 700; text-transform: uppercase; font-size: 8px; letter-spacing: 0.3px; }
                                    .pdf-table tbody tr:nth-child(even) { background: #f0fdf4; }
                                    .pdf-footer { margin-top: auto; padding-top: 20px; border-top: 2px solid #10b981; text-align: right; font-size: 9px; color: #64748b; }
                                    .pdf-total { background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 15px; border-radius: 6px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; }
                                    .pdf-total-label { font-size: 16px; font-weight: 700; font-family: 'Poppins', sans-serif; }
                                    .pdf-total-value { font-size: 24px; font-weight: 800; font-family: 'Poppins', sans-serif; }
                                    .text-right { text-align: right; font-weight: 600; color: #10b981; }
                                    .text-center { text-align: center; }
                                </style>
                                <div class="pdf-header">
                                    <div class="pdf-title"><i class="fas fa-key"></i> ALUGUÉIS</div>
                                    <div class="pdf-month">Relatório de Receitas</div>
                                    <div class="pdf-subtitle">Recanto KauDan - Controle de Locações</div>
                                    <div class="pdf-date">Gerado em: ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                </div>
                                <div class="pdf-content">
                                    ${idx === 0 ? `
                                        <div class="stats-grid">
                                            <div class="stat-card">
                                                <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                                                <div class="stat-label">Total de Receita</div>
                                                <div class="stat-value">${formatCurrency(totalReceita).replace('R$', '').trim()}</div>
                                                <div class="stat-unit">Período Completo</div>
                                            </div>
                                            <div class="stat-card">
                                                <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                                                <div class="stat-label">Este Mês</div>
                                                <div class="stat-value">${formatCurrency(monthlyRevenue).replace('R$', '').trim()}</div>
                                                <div class="stat-unit">Fevereiro 2025</div>
                                            </div>
                                            <div class="stat-card">
                                                <div class="stat-icon"><i class="fas fa-home"></i></div>
                                                <div class="stat-label">Total de Locações</div>
                                                <div class="stat-value">${rentals.length}</div>
                                                <div class="stat-unit">Registros</div>
                                            </div>
                                            <div class="stat-card">
                                                <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                                                <div class="stat-label">Ticket Médio</div>
                                                <div class="stat-value">${formatCurrency(rentals.length > 0 ? totalReceita / rentals.length : 0).replace('R$', '').trim()}</div>
                                                <div class="stat-unit">Por Locação</div>
                                            </div>
                                        </div>
                                    ` : ''}
                                    <div class="section-title"><i class="fas fa-table"></i> Detalhamento de Aluguéis</div>
                                    <table class="pdf-table">
                                        <thead>
                                            <tr>
                                                <th><i class="fas fa-user"></i> Cliente</th>
                                                <th><i class="fas fa-calendar-check"></i> Início</th>
                                                <th><i class="fas fa-calendar-check"></i> Fim</th>
                                                <th class="text-center"><i class="fas fa-calculator"></i> Dias</th>
                                                <th class="text-right"><i class="fas fa-coins"></i> Diária</th>
                                                <th class="text-right"><i class="fas fa-money-bill"></i> Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${currentPage.map(r => `
                                                <tr>
                                                    <td><strong>${r.clientName}</strong></td>
                                                    <td>${formatDate(r.startDate)}</td>
                                                    <td>${formatDate(r.endDate)}</td>
                                                    <td class="text-center">${r.days}</td>
                                                    <td class="text-right">${formatCurrency(r.dailyRate)}</td>
                                                    <td class="text-right"><strong>${formatCurrency(r.total)}</strong></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                    <div class="pdf-footer">
                                        Página ${Math.floor(idx / rowsPerPage) + 1}
                                    </div>
                                </div>
                            </div>
                        `;
                currentPage = [];
            }
        });

        return pagesHTML;
    }

    function generateDespesasPageHTML() {
        const totalDespesas = calculateTotalExpenses();
        const categoryTotals = {};

        expenses.forEach(exp => {
            if (!categoryTotals[exp.category]) {
                categoryTotals[exp.category] = 0;
            }
            categoryTotals[exp.category] += exp.amount;
        });

        return `
                    <div class="pdf-page" style="width: 210mm; background: white; color: #111827; font-family: 'Inter', sans-serif; padding: 0; margin-bottom: 20px;">
                        <style>
                            .pdf-header { background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 30px 40px; width: 100%; }
                            .pdf-title { font-size: 36px; font-weight: 900; margin-bottom: 5px; display: flex; align-items: center; gap: 15px; font-family: 'Poppins', sans-serif; }
                            .pdf-month { font-size: 22px; font-weight: 700; margin-bottom: 8px; opacity: 0.95; font-family: 'Poppins', sans-serif; }
                            .pdf-subtitle { font-size: 14px; opacity: 0.9; margin-bottom: 3px; }
                            .pdf-date { font-size: 11px; opacity: 0.8; margin-top: 8px; }
                            .pdf-content { padding: 25px 40px; position: relative; }
                            .category-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
                            .cat-card { background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
                            .cat-label { font-weight: 700; margin-bottom: 5px; font-size: 11px; }
                            .cat-value { font-size: 20px; font-weight: 800; color: #10b981; font-family: 'Poppins', sans-serif; }
                            .section-title { font-size: 14px; font-weight: 800; color: #0f172a; margin: 20px 0 12px; padding-bottom: 6px; border-bottom: 2.5px solid #10b981; display: flex; align-items: center; gap: 8px; font-family: 'Poppins', sans-serif; }
                            .pdf-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            .pdf-table thead { background: #10b981; color: white; }
                            .pdf-table th, .pdf-table td { padding: 12px; text-align: left; border: 1px solid #d1d5db; font-size: 10px; }
                            .pdf-table th { font-weight: 700; text-transform: uppercase; }
                            .pdf-table tbody tr:nth-child(even) { background: #f0fdf4; }
                            .pdf-total { background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 20px; border-radius: 8px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
                            .pdf-total-label { font-size: 18px; font-weight: 700; font-family: 'Poppins', sans-serif; }
                            .pdf-total-value { font-size: 28px; font-weight: 800; font-family: 'Poppins', sans-serif; }
                        </style>
                        <div class="pdf-header">
                            <div class="pdf-title"><i class="fas fa-receipt"></i> RELATÓRIO DE DESPESAS</div>
                            <div class="pdf-month">Período Completo</div>
                            <div class="pdf-subtitle">Análise Detalhada de Gastos - Recanto KauDan</div>
                            <div class="pdf-date">Gerado em: ${new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</div>
                        </div>
                        <div class="pdf-content">
                            <div class="section-title"><i class="fas fa-layer-group"></i> Resumo por Categoria</div>
                            <div class="category-grid">
                                ${Object.keys(categoryTotals).map(catKey => `
                                    <div class="cat-card">
                                        <div class="cat-label"><i class="${categories[catKey].icon}"></i> ${categories[catKey].name}</div>
                                        <div class="cat-value">${formatCurrency(categoryTotals[catKey])}</div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="section-title"><i class="fas fa-list"></i> Detalhamento Completo</div>
                            <table class="pdf-table">
                                <thead>
                                    <tr>
                                        <th><i class="fas fa-folder"></i> Categoria</th>
                                        <th><i class="fas fa-calendar-alt"></i> Data</th>
                                        <th><i class="fas fa-note-sticky"></i> Observação</th>
                                        <th style="text-align: right;"><i class="fas fa-dollar-sign"></i> Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${[...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => `
                                        <tr>
                                            <td><strong>${categories[e.category].name}</strong></td>
                                            <td>${formatDate(e.date)}</td>
                                            <td>${e.note || '-'}</td>
                                            <td style="text-align: right; font-weight: 800; color: #10b981;">${formatCurrency(e.amount)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            <div class="pdf-total">
                                <span class="pdf-total-label"><i class="fas fa-sum"></i> Total de Despesas</span>
                                <span class="pdf-total-value">${formatCurrency(totalDespesas)}</span>
                            </div>
                        </div>
                    </div>
                `;
    }

    function generateClientesPageHTML() {
        const clientRentals = {};

        rentals.forEach(r => {
            clientRentals[r.clientName] = (clientRentals[r.clientName] || 0) + r.total;
        });

        return `
                    <div class="pdf-page" style="width: 210mm; background: white; color: #111827; font-family: 'Inter', sans-serif; padding: 0; margin-bottom: 20px;">
                        <style>
                            .pdf-header { background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 30px 40px; width: 100%; }
                            .pdf-title { font-size: 36px; font-weight: 900; margin-bottom: 5px; display: flex; align-items: center; gap: 15px; font-family: 'Poppins', sans-serif; }
                            .pdf-month { font-size: 22px; font-weight: 700; margin-bottom: 8px; opacity: 0.95; font-family: 'Poppins', sans-serif; }
                            .pdf-subtitle { font-size: 14px; opacity: 0.9; margin-bottom: 3px; }
                            .pdf-date { font-size: 11px; opacity: 0.8; margin-top: 8px; }
                            .pdf-content { padding: 25px 40px; position: relative; }
                            .section-title { font-size: 14px; font-weight: 800; color: #0f172a; margin: 20px 0 12px; padding-bottom: 6px; border-bottom: 2.5px solid #10b981; display: flex; align-items: center; gap: 8px; font-family: 'Poppins', sans-serif; }
                            .pdf-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            .pdf-table thead { background: #10b981; color: white; }
                            .pdf-table th, .pdf-table td { padding: 12px; text-align: left; border: 1px solid #d1d5db; font-size: 10px; }
                            .pdf-table th { font-weight: 700; text-transform: uppercase; }
                            .pdf-table tbody tr:nth-child(even) { background: #f0fdf4; }
                        </style>
                        <div class="pdf-header">
                            <div class="pdf-title"><i class="fas fa-address-book"></i> RELATÓRIO DE CLIENTES</div>
                            <div class="pdf-month">Carteira Ativa</div>
                            <div class="pdf-subtitle">Gestão de Clientes - Recanto KauDan</div>
                            <div class="pdf-date">Gerado em: ${new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</div>
                        </div>
                        <div class="pdf-content">
                            <div class="section-title"><i class="fas fa-users"></i> Lista Completa de Clientes</div>
                            <table class="pdf-table">
                                <thead>
                                    <tr>
                                        <th><i class="fas fa-user"></i> Nome</th>
                                        <th><i class="fas fa-envelope"></i> Email</th>
                                        <th><i class="fas fa-id-card"></i> CPF</th>
                                        <th><i class="fas fa-phone"></i> Telefone</th>
                                        <th style="text-align: right;"><i class="fas fa-wallet"></i> Total Gasto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${clients.map(c => `
                                        <tr>
                                            <td><strong>${c.name}</strong></td>
                                            <td>${c.email || '-'}</td>
                                            <td>${c.cpf || '-'}</td>
                                            <td>${c.phone || '-'}</td>
                                            <td style="text-align: right; font-weight: 800; color: #10b981;">${formatCurrency(clientRentals[c.name] || 0)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
    }


// ===== FORM HANDLERS =====
function setupFormHandlers() {
    document.getElementById('rentalForm').addEventListener('submit', submitRental);
    document.getElementById('editRentalForm').addEventListener('submit', submitEditRental);
    document.getElementById('editExpenseForm').addEventListener('submit', submitEditExpense);
    document.getElementById('settingsForm').addEventListener('submit', submitSettings);
    document.getElementById('clientForm').addEventListener('submit', submitClient);
    document.getElementById('editClientForm').addEventListener('submit', submitEditClient);
    document.getElementById('reserveForm').addEventListener('submit', submitReserve);
    document.getElementById('editReserveForm').addEventListener('submit', submitEditReserve);
    document.getElementById('addNoteForm').addEventListener('submit', submitAddNote);
}

function submitRental(e) {
    e.preventDefault();

    if (selectedDays.length === 0) {
        showToast('Selecione pelo menos um dia', 'warning', 2000);
        return;
    }

    const clientName = document.getElementById('clientName').value;
    const dailyRate = parseFloat(document.getElementById('dailyRate').value);

    if (!clientName || !dailyRate) {
        showToast('Preencha todos os campos obrigatórios', 'warning', 2000);
        return;
    }

    const rental = {
        id: Date.now().toString(),
        clientName,
        startDate: selectedDays[0],
        endDate: selectedDays[selectedDays.length - 1],
        days: selectedDays.length,
        dailyRate,
        total: dailyRate * selectedDays.length,
        createdAt: new Date().toISOString()
    };

    rentals.push(rental);
    saveData();
    document.getElementById('rentalForm').reset();
    selectedDays = [];
    closeModal('rentalModal');
    showToast(`Locação de ${rental.days} dias registrada com sucesso!`, 'success', 2000);
    renderPage();
}

function submitEditRental(e) {
    e.preventDefault();

    const rental = rentals.find(r => r.id === currentEditingRentalId);
    if (!rental) {
        showToast('Erro ao atualizar locação', 'error', 2000);
        return;
    }

    const clientName = document.getElementById('editRentalClientName').value;
    const startDate = document.getElementById('editRentalStartDate').value;
    const endDate = document.getElementById('editRentalEndDate').value;
    const dailyRate = parseFloat(document.getElementById('editRentalDailyRate').value);

    if (!clientName || !startDate || !endDate || !dailyRate) {
        showToast('Preencha todos os campos obrigatórios', 'warning', 2000);
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showToast('Data inicial deve ser anterior à data final', 'warning', 2000);
        return;
    }

    rental.clientName = clientName;
    rental.startDate = startDate;
    rental.endDate = endDate;
    rental.dailyRate = dailyRate;

    const start = new Date(startDate);
    const end = new Date(endDate);
    rental.days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    rental.total = rental.dailyRate * rental.days;

    saveData();
    closeModal('editRentalModal');
    showToast('Locação atualizada com sucesso!', 'success', 2000);
    renderPage();
}

function submitEditExpense(e) {
    e.preventDefault();

    const exp = expenses.find(e => e.id === currentEditingExpenseId);
    if (!exp) {
        showToast('Erro ao atualizar lançamento', 'error', 2000);
        return;
    }

    const amount = parseFloat(document.getElementById('editAmount').value);
    const date = document.getElementById('editDate').value;

    if (!amount || amount <= 0) {
        showToast('Digite um valor válido e maior que zero', 'warning', 2000);
        return;
    }

    if (!date) {
        showToast('Selecione uma data', 'warning', 2000);
        return;
    }

    exp.amount = amount;
    exp.date = date;
    exp.note = document.getElementById('editNote').value;
    saveData();
    closeModal('editExpenseModal');
    showToast('Lançamento atualizado com sucesso!', 'success', 2000);
    renderPage();
}

function submitSettings(e) {
    e.preventDefault();

    const initialCapital = parseFloat(document.getElementById('initialCapital').value);
    const defaultDailyRate = parseFloat(document.getElementById('defaultDailyRate').value);

    if (!initialCapital || initialCapital <= 0 || !defaultDailyRate || defaultDailyRate <= 0) {
        showToast('Digite valores válidos e maiores que zero', 'warning', 2000);
        return;
    }

    settings.initialCapital = initialCapital;
    settings.defaultDailyRate = defaultDailyRate;

    saveSettings();
    closeModal('settingsModal');
    showToast('Configurações salvas com sucesso!', 'success', 2000);
    renderPage();
}

function submitClient(e) {
    e.preventDefault();

    const name = document.getElementById('clientFullName').value;
    const email = document.getElementById('clientEmail').value;
    const cpf = document.getElementById('clientCPF').value;
    const phone = document.getElementById('clientPhone').value;

    if (!name) {
        showToast('Digite o nome do cliente', 'warning', 2000);
        return;
    }

    const client = {
        id: Date.now().toString(),
        name,
        email,
        cpf,
        phone,
        createdAt: new Date().toISOString()
    };

    clients.push(client);
    saveData();
    document.getElementById('clientForm').reset();
    closeModal('clientModal');
    showToast(`Cliente "${name}" adicionado com sucesso!`, 'success', 2000);
    renderPage();
}

function submitEditClient(e) {
    e.preventDefault();

    const client = clients.find(c => c.id === currentEditingClientId);
    if (!client) {
        showToast('Erro ao atualizar cliente', 'error', 2000);
        return;
    }

    const name = document.getElementById('editClientName').value;
    if (!name) {
        showToast('Digite o nome do cliente', 'warning', 2000);
        return;
    }

    client.name = name;
    client.email = document.getElementById('editClientEmail').value;
    client.cpf = document.getElementById('editClientCPF').value;
    client.phone = document.getElementById('editClientPhone').value;
    saveData();
    closeModal('editClientModal');
    showToast(`Cliente "${name}" atualizado com sucesso!`, 'success', 2000);
    renderPage();
}

function submitReserve(e) {
    e.preventDefault();

    if (selectedDays.length === 0) {
        showToast('Selecione um período', 'warning', 2000);
        return;
    }

    const clientId = document.getElementById('reserveClient').value;
    const rate = parseFloat(document.getElementById('reserveRate').value);

    if (!clientId || !rate || rate <= 0) {
        showToast('Preencha todos os campos obrigatórios', 'warning', 2000);
        return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) {
        showToast('Cliente não encontrado', 'error', 2000);
        return;
    }

    const reserve = {
        id: Date.now().toString(),
        clientName: client.name,
        clientId,
        startDate: selectedDays[0],
        endDate: selectedDays[selectedDays.length - 1],
        days: selectedDays.length,
        dailyRate: rate,
        createdAt: new Date().toISOString()
    };

    reserves.push(reserve);
    saveData();
    document.getElementById('reserveForm').reset();
    selectedDays = [];
    closeModal('reserveModal');
    showToast(`Reserva de ${reserve.days} dias criada com sucesso!`, 'success', 2000);
    renderPage();
}

function submitEditReserve(e) {
    e.preventDefault();

    const reserve = reserves.find(r => r.id === currentEditingReserveId);
    if (!reserve) {
        showToast('Erro ao atualizar reserva', 'error', 2000);
        return;
    }

    const startDate = document.getElementById('editReserveStartDate').value;
    const endDate = document.getElementById('editReserveEndDate').value;
    const dailyRate = parseFloat(document.getElementById('editReserveDailyRate').value);

    if (!startDate || !endDate || !dailyRate || dailyRate <= 0) {
        showToast('Preencha todos os campos obrigatórios', 'warning', 2000);
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showToast('Data inicial deve ser anterior à data final', 'warning', 2000);
        return;
    }

    reserve.startDate = startDate;
    reserve.endDate = endDate;
    reserve.dailyRate = dailyRate;

    const start = new Date(startDate);
    const end = new Date(endDate);
    reserve.days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    saveData();
    closeModal('editReserveModal');
    showToast('Reserva atualizada com sucesso!', 'success', 2000);
    renderPage();
}

function submitAddNote(e) {
    e.preventDefault();

    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    if (!title || !content) {
        showToast('Preencha título e conteúdo', 'warning', 2000);
        return;
    }

    const note = {
        id: Date.now().toString(),
        title,
        content,
        createdAt: new Date().toISOString()
    };

    notes.push(note);
    saveData();
    document.getElementById('addNoteForm').reset();
    closeModal('addNoteModal');
    showToast('Anotação salva com sucesso!', 'success', 2000);
    renderPage();
}

function calcRentalTotal() {
    const dailyRate = parseFloat(document.getElementById('dailyRate').value) || 0;
    const total = dailyRate * selectedDays.length;
    document.getElementById('rentalTotal').value = total > 0 ? formatCurrency(total) : '';
    document.getElementById('daysCount').value = selectedDays.length;
    document.getElementById('periodSelected').value = selectedDays.length > 0
        ? `${formatDate(selectedDays[0])} a ${formatDate(selectedDays[selectedDays.length - 1])}`
        : '';
}

function calcEditReserveTotal() {
    const startDate = new Date(document.getElementById('editReserveStartDate').value);
    const endDate = new Date(document.getElementById('editReserveEndDate').value);
    const dailyRate = parseFloat(document.getElementById('editReserveDailyRate').value) || 0;

    if (startDate && endDate && startDate <= endDate) {
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        document.getElementById('editReserveTotal').value = formatCurrency(dailyRate * days);
    }
}

// ===== CALCULATIONS =====
function calculateCapital() {
    let capital = settings.initialCapital;
    rentals.forEach(r => capital += r.total);
    expenses.forEach(e => capital -= e.amount);
    return capital;
}

function calculateMonthlyRevenue() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return rentals
        .filter(r => r.startDate.startsWith(currentMonth))
        .reduce((sum, r) => sum + r.total, 0);
}

function calculateMonthlyExpenses() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return expenses
        .filter(e => e.date.startsWith(currentMonth))
        .reduce((sum, e) => sum + e.amount, 0);
}

function calculateRentedDays() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return rentals
        .filter(r => r.startDate.startsWith(currentMonth))
        .reduce((sum, r) => sum + r.days, 0);
}

function calculateTotalRevenue() {
    return rentals.reduce((sum, r) => sum + r.total, 0);
}

function calculateTotalExpenses() {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getNextRental() {
    const sorted = rentals.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    return sorted.find(r => new Date(r.endDate) >= new Date());
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-size: 14px;
        font-weight: 500;
        max-width: 90%;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}






// ===== CONFIRM MODAL =====
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    const confirmBtn = document.getElementById('confirmButton');
    confirmBtn.onclick = () => {
        closeModal('confirmModal');
        onConfirm();
    };
    
    openModal('confirmModal');
}





// ===== RESET DATA =====
function resetAllData() {
    closeModal('settingsModal');
    
    setTimeout(() => {
        showConfirmModal(
            'Resetar Todos os Dados',
            'Deseja resetar TODOS os dados? Locações, despesas, reservas, clientes e anotações serão removidos. Esta ação não pode ser desfeita!',
            () => {
                rentals = [];
                expenses = [];
                reserves = [];
                clients = [];
                notes = [];
                settings = {
                    initialCapital: 5000,
                    defaultDailyRate: 200
                };
                saveData();
                saveSettings();
                showToast('Todos os dados foram resetados com sucesso!', 'success', 2000);
                renderPage();
            }
        );
    }, 300);
}



// ===== START =====
initAuth();