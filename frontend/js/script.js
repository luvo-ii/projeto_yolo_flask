// Arquivo: /Frontend/script.js
// --- COPIE E COLE ESTE CÓDIGO INTEIRO ---
// --- VERSÃO COM LISTENERS DE NAVEGAÇÃO CORRIGIDOS ---

// VisionQ - Sistema de Inspeção Industrial
// JavaScript Vanilla - Versão FINAL e CORRIGIDA

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // impede o recarregamento da página

    const email = document.getElementById("email").value;
    const codigo = document.getElementById("codigo").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: codigo }),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = result.redirect;
      } else {
        alert("Email ou código inválidos!");
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      alert("Erro ao conectar ao servidor.");
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  if (form) {
    form.addEventListener("submit", (event) => {
      // ❌ Impede o comportamento padrão de recarregar a página
      event.preventDefault()
    });
  }
});


// Serviço para se comunicar com a API do Backend
const ApiService = {
    BASE_URL: 'http://localhost:3000',
    async fetchJSON(endpoint) {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`);
            if (!response.ok) throw new Error(`Falha na API: ${endpoint}`);
            return await response.json();
        } catch (error) {
            console.error(`Erro no ApiService (${endpoint}):`, error);
            Utils.showToast(`Erro ao carregar dados da API`, 'error');
            return null;
        }
    },

    // --- FUNÇÃO DE LOGIN ADICIONADA ---
    async login(email, password) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json(); // Pega o corpo da resposta (ex: { message: "..." })
            
            if (!response.ok) {
                // Se não for OK (ex: 400, 404, 500), joga um erro com a mensagem do backend
                throw new Error(data.message || `Falha na API: ${response.status}`);
            }
            
            return data; // Retorna os dados do usuário (ex: { userId: "...", name: "...", cargo: "..." })
        } catch (error) {
            console.error(`Erro no ApiService (login):`, error);
            // Joga o erro para que a função Auth.login possa pegá-lo
            throw error; 
        }
    },
    // --- FIM DA FUNÇÃO DE LOGIN ---

    getAllAlerts() { return this.fetchJSON('/api/alerts'); },
    getAlertsStats() { return this.fetchJSON('/api/alerts/stats'); },
    getUsers() { return this.fetchJSON('/api/users'); },
    getProductionData() { return this.fetchJSON('/api/production'); }
};

// Estado Global da Aplicação
const AppState = {
    currentScreen: 'login',
    userProfile: 'operador',
    employees: [],
    productionData: {},
    alertsData: [],
    config: { alertThreshold: 75, detectionSensitivity: 'high', autoStop: true, emailNotifications: true, cameraResolution: '4k', recordingDuration: 60 },
    productionStopped: true
};

// Sistema de Utilitários
const Utils = {
    navigateToScreen(screenName) {
        // Esconde todas as telas
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        
        // Mostra a tela de destino
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            AppState.currentScreen = screenName;
             // Atualiza badges em todas as telas que têm a navbar
             Dashboard.updateUserBadges(AppState.userProfile); 
        } else {
            console.error(`Tela não encontrada: ${screenName}-screen`);
        }
        
        MobileMenu.close();
        // Não inicializa aqui para evitar chamadas duplicadas
        // this.initializeScreen(screenName); 
    },
    initializeScreen(screenName) {
        // Esta função agora é chamada DENTRO do listener de navegação
        console.log(`Inicializando tela: ${screenName}`) // Log para debug
        switch (screenName) {
            case 'alerts': 
                AlertsScreen.initialize(); 
                break;
            case 'dashboard':
                // Recarrega os dados do dashboard ao navegar para ele
                Dashboard.updateProductionData(); 
                break;
            // Adicione inicialização para outras telas se necessário
            // case 'reports': ReportsScreen.initialize(); break; 
        }
        // Garante que a visibilidade da navegação está correta após carregar a tela
         Dashboard.updateNavigationVisibility(AppState.userProfile);
    },
    showToast(message, type = 'success', description = '') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = description ? `${message}<br><small style="opacity: 0.8">${description}</small>` : message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },
    formatNumber(num) { return new Intl.NumberFormat('pt-BR').format(num || 0); },
    isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
};

// Sistema de Autenticação
const Auth = {
    async login(email, codigo) { 
        if (!email || !codigo || !Utils.isValidEmail(email)) {
            Utils.showToast('Por favor, preencha os campos corretamente', 'error');
            return;
        }

        try {
            const userData = await ApiService.login(email, codigo);
            window.location.href = "index.html"; 
            AppState.userProfile = userData.cargo || 'operador'; 
            Dashboard.updateUserInterface(); // Atualiza badges e visibilidade ANTES de navegar
            Utils.navigateToScreen('dashboard'); // Navega para o dashboard
            Utils.initializeScreen('dashboard'); // Inicializa os dados do dashboard
            Utils.showToast(`Bem-vindo, ${userData.name || 'Usuário'}!`, 'success', `Logado como ${AppState.userProfile}`);

        } catch (error) {
            Utils.showToast(error.message || 'Erro desconhecido no login', 'error', 'Verifique suas credenciais');
        }
    },
    logout() {
        Utils.navigateToScreen('login');
        Utils.showToast('Logout realizado com sucesso', 'success');
        
        const emailInput = document.getElementById('email');
        const codigoInput = document.getElementById('codigo');
        if (emailInput) emailInput.value = '';
        if (codigoInput) codigoInput.value = '';
        // Reseta o perfil para o padrão ao deslogar
        AppState.userProfile = 'operador'; 
    }
};

// Dashboard Principal
const Dashboard = {
    updateUserInterface() {
        // Atualiza elementos visuais baseados no perfil do usuário
        // Esta função é chamada após o login e ao inicializar telas com navbar
        const profile = AppState.userProfile;
        this.updateUserBadges(profile);
        this.updateNavigationVisibility(profile);
        // Os dados de produção são atualizados em updateProductionData()
    },
    updateUserBadges(profile) {
        // Atualiza TODOS os badges que podem existir em diferentes navbars
        const badges = document.querySelectorAll('[id^="user-badge"]'); // Seleciona IDs que começam com "user-badge"
        const profileMap = {
            'operador': { text: 'Operador', classes: 'bg-blue-500/20 text-blue-400' },
            'supervisor': { text: 'Supervisor', classes: 'bg-green-500/20 text-green-400' },
            'gestor': { text: 'Gestor', classes: 'bg-purple-500/20 text-purple-400' }
        };
        const profileData = profileMap[profile] || profileMap.operador;
        badges.forEach(badge => {
             if(badge){ // Verifica se o badge existe na tela atual
                badge.textContent = profileData.text;
                badge.className = `px-2 py-1 rounded-full text-xs font-medium ${profileData.classes}`;
             }
        });
        // Atualiza também o badge no menu mobile, se existir
        const mobileBadge = document.getElementById('mobile-user-badge');
        if (mobileBadge) {
             mobileBadge.textContent = profileData.text;
             mobileBadge.className = `px-2 py-1 rounded-full text-xs font-medium ${profileData.classes}`;
        }
    },
    updateNavigationVisibility(profile) {
        // Atualiza a visibilidade dos botões baseados no perfil
        // Seleciona TODOS os botões de supervisor/manager que podem existir
        const supervisorElements = document.querySelectorAll('[id*="nav-supervisor"], [id*="action-supervisor"]');
        const managerElements = document.querySelectorAll('[id*="nav-manager"], [id*="action-manager"], [id*="mobile-admin-section"]');
        
        supervisorElements.forEach(el => {
            if (profile === 'supervisor' || profile === 'gestor') {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
        managerElements.forEach(el => {
             if (profile === 'gestor') {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    },
    async updateProductionData() { 
        console.log("Atualizando dados de produção..."); // Log para debug
        const data = await ApiService.getProductionData(); 
        if (!data) {
             console.log("Falha ao buscar dados de produção."); // Log para debug
             // Talvez mostrar um erro ou valores padrão
             document.getElementById('total-production').textContent = 'Erro';
             document.getElementById('approved-production').textContent = 'Erro';
             document.getElementById('defective-production').textContent = 'Erro';
             document.getElementById('defect-rate').textContent = 'Erro%';
             return; 
        }
        
        console.log("Dados de produção recebidos:", data); // Log para debug
        AppState.productionData = data; 
        
        const totalEl = document.getElementById('total-production');
        const approvedEl = document.getElementById('approved-production');
        const defectiveEl = document.getElementById('defective-production');
        const defectRateEl = document.getElementById('defect-rate');

        if (totalEl) totalEl.textContent = Utils.formatNumber(data.total); else console.log("Elemento total-production não encontrado");
        if (approvedEl) approvedEl.textContent = Utils.formatNumber(data.approved); else console.log("Elemento approved-production não encontrado");
        if (defectiveEl) defectiveEl.textContent = Utils.formatNumber(data.defective); else console.log("Elemento defective-production não encontrado");
        
        if (defectRateEl) {
            const rate = data.defectRate !== undefined && data.defectRate !== null ? data.defectRate : 0; // Calcula a taxa se existir
            defectRateEl.textContent = `${Number(rate).toFixed(1)}%`; // Garante que é número
            // Lógica de cor baseada na taxa
            let colorClass = 'text-green-400'; // Default green
             if (rate > 10 && rate <= 25) {
                 colorClass = 'text-yellow-400';
             } else if (rate > 25) {
                 colorClass = 'text-red-400';
             }
             defectRateEl.className = `text-xl sm:text-2xl lg:text-3xl font-bold mt-1 stat-value ${colorClass}`;
        } else {
             console.log("Elemento defect-rate não encontrado");
        }
    }
};

// Sistema de Menu Mobile
const MobileMenu = {
    open() { document.getElementById('mobile-menu')?.classList.add('active'); },
    close() { document.getElementById('mobile-menu')?.classList.remove('active'); }
};

// Sistema de Tela de Alertas
const AlertsScreen = {
    async initialize() {
        console.log("Inicializando tela de Alertas..."); // Log para debug
        const alertsList = await ApiService.getAllAlerts();
        // const alertsStats = await ApiService.getAlertsStats(); 
        this.populateAlertsTable(alertsList || []);
        // this.initializeCharts(alertsStats || { byLocation: [], byPriority: [], byHour: [] });
    },
    populateAlertsTable(alertsData) {
        const tableBody = document.getElementById('alerts-table-body');
        if (!tableBody) {
             console.error("Elemento alerts-table-body não encontrado");
             return;
        }
        tableBody.innerHTML = ''; // Limpa a tabela
        if (!alertsData || alertsData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-gray-400">Nenhum alerta encontrado.</td></tr>`;
            return;
        }
        alertsData.forEach((alert, index) => {
            const row = document.createElement('tr');
            row.className = `border-b border-slate-600 hover:bg-slate-600 transition-colors`;
            // Define prioridade e classe de cor
            const isManutencao = alert.descricao && alert.descricao.toUpperCase().includes('MANUTENÇÃO');
            const prioridadeText = isManutencao ? 'alta' : 'crítica';
            const priorityClass = prioridadeText === 'crítica' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400';
            
            // Formata data e hora
            const dataFormatada = alert.data ? new Date(alert.data).toLocaleDateString('pt-BR') : 'N/A';
            const horaFormatada = alert.horario || (alert.data ? new Date(alert.data).toLocaleTimeString('pt-BR') : 'N/A');

            row.innerHTML = `
                <td class="text-gray-100 p-3 text-sm">${index + 1}</td>
                <td class="text-gray-100 p-3 text-sm">${dataFormatada}</td>
                <td class="text-gray-100 p-3 text-sm">${horaFormatada}</td>
                <td class="text-gray-100 p-3 text-sm">${alert.local || 'N/A'}</td>
                <td class="text-gray-100 p-3 text-sm">${alert.descricao || 'N/A'}</td>
                <td class="p-3"><span class="px-2 py-1 rounded-full text-xs font-medium ${priorityClass}">${prioridadeText.toUpperCase()}</span></td>`;
            tableBody.appendChild(row);
        });
    },
    initializeCharts(stats) {
        // Lógica dos gráficos (se/quando implementada)
        if (window.alertsLocationChart) window.alertsLocationChart.destroy();
        console.log("Stats para gráficos:", stats);
    }
};

// ==================================================
// --- FUNÇÃO DE EVENTOS (TOTALMENTE ATUALIZADA) ---
// ==================================================
function setupEventListeners() {
    
    // --- Formulário de Login ---
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const codigo = document.getElementById('codigo').value; 
        Auth.login(email, codigo); 
    });

    // --- Botões de Logout (Procura por todos os possíveis) ---
    document.querySelectorAll('[id^="logout-button"]').forEach(btn => {
         btn?.addEventListener('click', Auth.logout);
    });
   
    // --- Botões de Navegação (GERAL) ---
    document.querySelectorAll('[data-navigate]').forEach(button => {
        button.addEventListener('click', () => {
            const screenName = button.getAttribute('data-navigate');
             if(screenName){
                Utils.navigateToScreen(screenName);
                // Chama a inicialização APÓS navegar
                Utils.initializeScreen(screenName); 
             } else {
                 console.error("Botão de navegação sem valor em data-navigate:", button);
             }
        });
    });
    
    // --- Botões do Menu Mobile (Procura por todos os possíveis) ---
     document.querySelectorAll('[id^="mobile-menu-btn"]').forEach(btn => {
         btn?.addEventListener('click', MobileMenu.open);
     });
    document.getElementById('close-mobile-menu')?.addEventListener('click', MobileMenu.close);
    document.querySelector('.mobile-menu-backdrop')?.addEventListener('click', MobileMenu.close);

    // --- Navegação "Esqueci a Senha" ---
    document.getElementById('forgot-password-btn')?.addEventListener('click', () => {
        Utils.navigateToScreen('forgot-password');
    });
    document.getElementById('back-to-login')?.addEventListener('click', () => {
        Utils.navigateToScreen('login');
    });
    document.getElementById('forgot-password-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        // Aqui você adicionaria a lógica para REALMENTE enviar o pedido de recuperação
        Utils.showToast('Instruções enviadas!', 'success', 'Verifique seu email e contato do RH.');
        Utils.navigateToScreen('login');
    });


    // --- Listeners do Modal de Configuração ---
    const configModal = document.getElementById('config-modal');
    if (configModal) {
        // Abrir Modal (Procura por todos os botões de config)
         document.querySelectorAll('[id*="nav-config"]').forEach(btn => {
             btn?.addEventListener('click', () => {
                configModal.classList.add('active');
                MobileMenu.close(); // Fecha o menu mobile se estiver aberto
            });
         });
         // Adiciona listener ao botão principal de config também
         document.getElementById('nav-config-main')?.addEventListener('click', () => {
              configModal.classList.add('active');
         });


        // Fechar Modal
        document.getElementById('close-config-modal')?.addEventListener('click', () => {
            configModal.classList.remove('active');
        });
        document.getElementById('cancel-config')?.addEventListener('click', () => {
            configModal.classList.remove('active');
        });
        document.querySelector('#config-modal .modal-backdrop')?.addEventListener('click', () => {
            configModal.classList.remove('active');
        });

        // Salvar Config
        document.getElementById('save-config')?.addEventListener('click', () => {
            // Lógica para pegar os valores e salvar (exemplo)
            const threshold = document.getElementById('alert-threshold').value;
            // ... pegar outros valores
            console.log("Salvando configurações:", { threshold /*, ...*/ }); 
            // Aqui você chamaria uma função para salvar no backend ou localmente
            Utils.showToast('Configurações salvas com sucesso!', 'success');
            configModal.classList.remove('active');
        });
    } else {
         console.error("Modal de configuração não encontrado (ID: config-modal)");
    }
}
['action-alerts','action-reports','action-supervisor','action-manager','action-config'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', () => {
        const mapping = {
            'action-alerts': 'alerts',
            'action-reports': 'reports',
            'action-supervisor': 'supervisor',
            'action-manager': 'manager',
            'action-config': 'config'
        };
        const screen = mapping[id];
        if(screen){
            Utils.navigateToScreen(screen);
            Utils.initializeScreen(screen);
        }
    });
});
document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
        // Aqui você decide para onde ele deve ir
        // Exemplo: voltar para o dashboard
        Utils.navigateToScreen('dashboard');
        Utils.initializeScreen('dashboard');
    });
});

// --- FIM DA FUNÇÃO DE EVENTOS ---


// Função principal de inicialização da aplicação
async function initializeApp() {
    console.log("Inicializando Aplicação..."); // Log para debug
    
    // Configura todos os cliques e eventos PRIMEIRO
    setupEventListeners(); 

    // Busca os dados iniciais necessários para o dashboard (se aplicável)
    // await Dashboard.updateProductionData(); // Movido para Utils.initializeScreen

    // Inicia na tela de login
    Utils.navigateToScreen('login');
    
    console.log('🚀 Sistema VisionQ inicializado com sucesso!');
}

// Evento que dispara a aplicação
document.addEventListener('DOMContentLoaded', initializeApp);