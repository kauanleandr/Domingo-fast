// O db e auth (referências do Firebase) são esperados ser inicializados em admin.html
const PEDIDOS_COLLECTION = 'pedidos';   
const CLIENTES_COLLECTION = 'clientes'; 

// FUNÇÕES DE AUTENTICAÇÃO E CONTROLE DE ACESSO
function handleLoginState(isLoading) {
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const btnLogin = document.getElementById('btnLogin');

    if (btnText && loadingSpinner && btnLogin) {
        if (isLoading) {
            btnText.style.display = 'none';
            loadingSpinner.style.display = 'inline-block';
            btnLogin.disabled = true;
        } else {
            btnText.style.display = 'inline-block';
            loadingSpinner.style.display = 'none';
            btnLogin.disabled = false;
        }
    }
}

function updateUI(user) {
    const body = document.body;
    
    if (user) {
        // Usuário logado: Adiciona a classe que revela o painel e esconde o login
        body.classList.add('logged-in');
        
        // CORREÇÃO: Inicia o carregamento (agora com as funções estáveis)
        renderizarPedidos();
        renderizarClientes();
        
        console.warn("ADMIN LOGGED IN. FIREBASE RULES SHOULD BE RESTRICTED TO AUTHENTICATED USERS.");
    } else {
        // Usuário deslogado: Remove a classe que esconde o painel
        body.classList.remove('logged-in');
    }
}

async function signInAdmin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const loginError = document.getElementById('loginError');
    
    handleLoginState(true); // INÍCIO: Mostra o spinner
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        loginError.style.display = 'none';
    } catch (error) {
        console.error("Login Error:", error.message);
        loginError.style.display = 'block';
    } finally {
        handleLoginState(false); 
    }
}

async function signOutAdmin() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Logout Error:", error.message);
    }
}
// FIM FUNÇÕES DE AUTENTICAÇÃO

// Função para formatar o preço
function formatarPreco(valor) {
  return valor.toFixed(2).replace('.', ',');
}

// Constrói o HTML para os itens do pedido
function buildItensHtml(itens) {
    if (!itens || itens.length === 0) return '<li>Nenhum item listado.</li>';
    return itens.map(item => {
        const subtotal = item.subtotal ? formatarPreco(item.subtotal) : 'N/A';
        const precoUnitario = item.precoUnitario ? formatarPreco(item.precoUnitario) : 'N/A';
        return `
            <li>${item.quantidade}x ${item.nome} (R$ ${precoUnitario} cada) = R$ ${subtotal}</li>
        `;
    }).join('');
}

// Gera a URL do WhatsApp para "Pedido a caminho"
function gerarLinkAviso(telefone) {
    const numeroLimpo = telefone.replace(/\D/g, ''); 
    const numeroWhatsApp = `55${numeroLimpo}`; 
    const mensagem = `Olá, seu pedido no Domingo Fast está a caminho! 🛵💨\n\nTempo estimado: [ADICIONE O TEMPO AQUI] minutos.\nObrigado pela preferência!`;
    return `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
}

// Função principal de renderização de PEDIDOS (Firestore)
async function renderizarPedidos() {
    if (!auth.currentUser || typeof db === 'undefined') return;
    
    const listaPedidosDiv = document.getElementById('listaPedidos');
    const listaHistoricoDiv = document.getElementById('listaHistorico');
    const countPedidosSpan = document.getElementById('countPedidos');
    const semPedidosDiv = document.getElementById('semPedidos');
    const semHistoricoDiv = document.getElementById('semHistorico');

    if (!listaPedidosDiv || !listaHistoricoDiv || !countPedidosSpan) return;

    listaPedidosDiv.innerHTML = '';
    listaHistoricoDiv.innerHTML = '';
    let countPendentes = 0;
    const pedidos = [];

    try {
        // Ordena por ID (mais recente primeiro)
        const snapshot = await db.collection(PEDIDOS_COLLECTION).orderBy('id', 'desc').get();
        snapshot.forEach(doc => {
            // CORREÇÃO CRÍTICA: Passa o doc.id (ID do Firestore) como 'docId' para as funções de ação
            pedidos.push({ docId: doc.id, ...doc.data() }); 
        });
    } catch(e) {
        console.error("ERRO: Falha ao carregar pedidos do Firestore.", e);
        listaPedidosDiv.innerHTML = `<div class="col-12 text-center text-danger py-5">Erro ao conectar com o banco de dados. Verifique o Console e as Regras de Segurança do Firebase.</div>`;
        return;
    }

    pedidos.forEach(pedido => {
        const cardHtml = criarCardPedido(pedido);
        
        if (pedido.status === 'CONCLUIDO' || pedido.status === 'ENTREGUE' || pedido.status === 'CAMINHO') {
            listaHistoricoDiv.insertAdjacentHTML('beforeend', cardHtml);
        } else {
            listaPedidosDiv.insertAdjacentHTML('beforeend', cardHtml);
            countPendentes++;
        }
    });
    
    countPedidosSpan.textContent = countPendentes;
    
    if (semPedidosDiv) semPedidosDiv.style.display = countPendentes === 0 ? 'block' : 'none';
    if (semHistoricoDiv) semHistoricoDiv.style.display = (pedidos.length - countPendentes === 0) ? 'block' : 'none';

    adicionarEventListeners();
}

// Função principal de renderização de CLIENTES (Firestore)
async function renderizarClientes() {
    if (!auth.currentUser || typeof db === 'undefined') return;
    
    const listaClientesDiv = document.getElementById('listaClientes');
    const countClientesSpan = document.getElementById('countClientesTotal');
    const semClientesDiv = document.getElementById('semClientes');
    
    if (!listaClientesDiv || !countClientesSpan) return;

    listaClientesDiv.innerHTML = '';
    const clientes = [];

    try {
        const snapshot = await db.collection(CLIENTES_COLLECTION).get();
        snapshot.forEach(doc => {
            // CORREÇÃO CRÍTICA: Passa o doc.id (ID do Firestore) como 'docId' para as funções de ação
            clientes.push({ docId: doc.id, ...doc.data() });
        });
    } catch(e) {
        console.error("ERRO: Falha ao carregar clientes do Firestore.", e);
        listaClientesDiv.innerHTML = `<div class="col-12 text-center text-danger py-5">Erro ao conectar com o banco de dados.</div>`;
        return;
    }
    
    clientes.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')); 

    clientes.forEach(cliente => {
        listaClientesDiv.insertAdjacentHTML('beforeend', criarCardCliente(cliente));
    });

    countClientesSpan.textContent = clientes.length;
    
    if (semClientesDiv) semClientesDiv.style.display = clientes.length === 0 ? 'block' : 'none';
}


// Constrói o template HTML para um único pedido
function criarCardPedido(pedido) {
    let statusBadge = '';
    let buttonHtml = '';
    
    // O ID que será passado para as funções de ação (Excluir/Mudar Status) é o docId
    const docId = pedido.docId; 

    if (pedido.status === 'PENDENTE') {
        statusBadge = '<span class="badge text-bg-warning"><i class="bi bi-clock me-1"></i> Aguardando</span>';
        buttonHtml = `
            <button class="btn btn-sm btn-action btn-primary status-action" data-id="${docId}" data-status="CAMINHO" title="Marcar como 'A Caminho'">
                <i class="bi bi-truck"></i> A Caminho
            </button>
            <a href="${gerarLinkAviso(pedido.telefone)}" target="_blank" class="btn btn-sm btn-action btn-success">
                <i class="bi bi-whatsapp"></i> Avisar Cliente
            </a>
            <button class="btn btn-sm btn-action btn-danger delete-action" data-id="${docId}" title="Excluir pedido">
                <i class="bi bi-trash"></i> Excluir
            </button>
        `;
    } else if (pedido.status === 'CAMINHO') {
        statusBadge = '<span class="badge text-bg-info"><i class="bi bi-truck me-1"></i> A Caminho</span>';
        buttonHtml = `
            <button class="btn btn-sm btn-action btn-success status-action" data-id="${docId}" data-status="CONCLUIDO" title="Marcar como 'Entregue'">
                <i class="bi bi-check-circle"></i> Entregue
            </button>
             <button class="btn btn-sm btn-action btn-danger delete-action" data-id="${docId}" title="Excluir pedido">
                <i class="bi bi-trash"></i> Excluir
            </button>
        `;
    } else if (pedido.status === 'CONCLUIDO' || pedido.status === 'ENTREGUE') {
        statusBadge = '<span class="badge text-bg-success"><i class="bi bi-check-circle me-1"></i> Concluído</span>';
        buttonHtml = `
            <button class="btn btn-sm btn-action btn-outline-danger delete-action" data-id="${docId}" title="Excluir permanentemente">
                <i class="bi bi-trash"></i> Excluir
            </button>
        `;
    }
    
    const telefoneLimpoParaLink = pedido.telefone.replace(/\D/g, ''); 

    return `
        <div class="col-12">
            <div class="card shadow-sm pedido-card ${pedido.status}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title mb-1">Pedido #${pedido.id}</h5>
                            <small class="text-muted">${pedido.dataHora}</small>
                        </div>
                        <div>
                            ${statusBadge}
                        </div>
                    </div>
                    <hr>
                    <p class="mb-1"><strong>Cliente:</strong> ${pedido.cliente} - <a href="https://wa.me/55${telefoneLimpoParaLink}" target="_blank" class="text-decoration-none">${pedido.telefone}</a></p>
                    <p class="mb-1"><strong>Endereço:</strong> ${pedido.endereco.regiao} - ${pedido.endereco.detalhes}</p>
                    <p class="mb-1"><strong>Total:</strong> R$ ${pedido.total ? formatarPreco(pedido.total) : 'N/A'} (${pedido.pagamento ? pedido.pagamento.toUpperCase() : 'N/A'})</p>
                    ${pedido.pagamento === 'dinheiro' && pedido.troco && pedido.troco.trim() ? `<p class="mb-1"><strong>Troco para:</strong> R$ ${pedido.troco}</p>` : ''}
                    
                    <h6 class="mt-3 mb-1">Itens:</h6>
                    <ul class="list-unstyled small ps-3">
                        ${buildItensHtml(pedido.itens)}
                    </ul>

                    <div class="mt-3 text-end">
                        ${buttonHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Constrói o template HTML para um único cliente
function criarCardCliente(cliente) {
    const telefoneLimpo = cliente.telefone.replace(/\D/g, '');
    const docId = cliente.docId; 
    
    return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card shadow-sm cliente-card h-100">
                <div class="card-body">
                    <h5 class="card-title mb-1">${cliente.nome}</h5>
                    <p class="card-text text-muted mb-1 small">Telefone: <a href="https://wa.me/55${telefoneLimpo}" target="_blank">${cliente.telefone}</a></p>
                    <p class="card-text mb-1 small">Região: ${cliente.regiao}</p>
                    <p class="card-text mb-3 small">Endereço: ${cliente.detalhesEndereco}</p>
                    <button class="btn btn-sm btn-danger delete-client-action" data-id="${docId}" title="Excluir cadastro">
                        <i class="bi bi-trash"></i> Excluir Cadastro
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Funções de Ação (Firestore)
async function alterarStatus(docId, novoStatus) {
    if (typeof db === 'undefined' || !auth.currentUser) return;
    try {
        await db.collection(PEDIDOS_COLLECTION).doc(docId).update({ status: novoStatus });
        renderizarPedidos();
    } catch (e) {
        console.error("Erro ao alterar status do pedido. O ID do documento pode estar incorreto ou permissão negada:", e);
    }
}

async function excluirPedido(docId) {
    if (typeof db === 'undefined' || !auth.currentUser) return;
    if (confirm("Tem certeza que deseja excluir este pedido permanentemente?")) {
        try {
            await db.collection(PEDIDOS_COLLECTION).doc(docId).delete();
            renderizarPedidos();
        } catch (e) {
            console.error("Erro ao excluir pedido. O ID do documento pode estar incorreto ou permissão negada:", e);
        }
    }
}

async function excluirCliente(docId) {
    if (typeof db === 'undefined' || !auth.currentUser) return;
    if (confirm("Tem certeza que deseja excluir este cadastro de cliente permanentemente?")) {
        try {
            await db.collection(CLIENTES_COLLECTION).doc(docId).delete();
            renderizarClientes();
        } catch (e) {
            console.error("Erro ao excluir cliente. O ID do documento pode estar incorreto ou permissão negada:", e);
        }
    }
}

function adicionarEventListeners() {
    document.querySelectorAll('.status-action').forEach(btn => {
        btn.removeEventListener('click', handleStatusChange);
        btn.addEventListener('click', handleStatusChange);
    });

    document.querySelectorAll('.delete-action').forEach(btn => {
        btn.removeEventListener('click', handleDelete);
        btn.addEventListener('click', handleDelete);
    });
    
    document.querySelectorAll('.delete-client-action').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClient);
        btn.addEventListener('click', handleDeleteClient);
    });
}

function handleStatusChange(e) {
    const docId = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;
    alterarStatus(docId, status);
}

function handleDelete(e) {
    const docId = e.currentTarget.dataset.id;
    excluirPedido(docId);
}

function handleDeleteClient(e) {
    const docId = e.currentTarget.dataset.id;
    excluirCliente(docId);
}


// Inicializa o Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Escuta mudanças no estado de autenticação
    auth.onAuthStateChanged(user => {
        updateUI(user);
    });
    
    // Configura listeners para a tela de login
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogin) btnLogin.addEventListener('click', signInAdmin);
    if (btnLogout) btnLogout.addEventListener('click', signOutAdmin);
});