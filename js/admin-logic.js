// Chave usada para armazenar os pedidos (Deve corresponder ao PEDIDOS_KEY em cart-logic.js)
const STORAGE_KEY = 'pedidosAdmin';

// Função para carregar todos os pedidos do localStorage
function carregarPedidos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

// Função para salvar o array de pedidos de volta no localStorage
function salvarPedidos(pedidos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
}

// Função para formatar o preço (copiada de cart-logic.js para consistência)
function formatarPreco(valor) {
  return valor.toFixed(2).replace('.', ',');
}

// Constrói o HTML para os itens do pedido
function buildItensHtml(itens) {
    return itens.map(item => `
        <li>${item.quantidade}x ${item.nome} (R$ ${formatarPreco(item.precoUnitario)} cada) = R$ ${formatarPreco(item.subtotal)}</li>
    `).join('');
}

// Gera a URL do WhatsApp para "Pedido a caminho"
function gerarLinkAviso(telefone) {
    // Limpa e formata o telefone para o padrão internacional (5591981654787)
    const numeroLimpo = telefone.replace(/\D/g, ''); 
    const numeroWhatsApp = `55${numeroLimpo}`; 

    const mensagem = `Olá, seu pedido no Domingo Fast está a caminho! 🛵💨\n\nTempo estimado: [ADICIONE O TEMPO AQUI] minutos.\nObrigado pela preferência!`;
    return `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
}

// Função principal de renderização
function renderizarPedidos() {
    const pedidos = carregarPedidos();
    const listaPedidosDiv = document.getElementById('listaPedidos');
    const listaHistoricoDiv = document.getElementById('listaHistorico');
    const countPedidosSpan = document.getElementById('countPedidos');
    const semPedidosDiv = document.getElementById('semPedidos');
    const semHistoricoDiv = document.getElementById('semHistorico');

    if (!listaPedidosDiv || !listaHistoricoDiv || !countPedidosSpan) return;

    listaPedidosDiv.innerHTML = '';
    listaHistoricoDiv.innerHTML = '';
    let countPendentes = 0;

    pedidos.sort((a, b) => b.id - a.id); // Ordena pelo mais recente

    pedidos.forEach(pedido => {
        const cardHtml = criarCardPedido(pedido);
        
        if (pedido.status === 'CONCLUIDO' || pedido.status === 'ENTREGUE') {
            listaHistoricoDiv.insertAdjacentHTML('beforeend', cardHtml);
        } else {
            listaPedidosDiv.insertAdjacentHTML('beforeend', cardHtml);
            countPendentes++;
        }
    });
    
    countPedidosSpan.textContent = countPendentes;
    
    // Mostra mensagens de "Sem pedidos" se necessário
    if (semPedidosDiv) semPedidosDiv.style.display = countPendentes === 0 ? 'block' : 'none';

    if (semHistoricoDiv) semHistoricoDiv.style.display = (pedidos.length - countPendentes === 0) ? 'block' : 'none';

    // Adiciona event listeners dinamicamente
    adicionarEventListeners();
}

// Constrói o template HTML para um único pedido
function criarCardPedido(pedido) {
    let statusBadge = '';
    let buttonHtml = '';

    if (pedido.status === 'PENDENTE') {
        statusBadge = '<span class="badge text-bg-warning"><i class="bi bi-clock me-1"></i> Aguardando</span>';
        buttonHtml = `
            <button class="btn btn-sm btn-action btn-primary status-action" data-id="${pedido.id}" data-status="CAMINHO" title="Marcar como 'A Caminho'">
                <i class="bi bi-truck"></i> A Caminho
            </button>
            <a href="${gerarLinkAviso(pedido.telefone)}" target="_blank" class="btn btn-sm btn-action btn-success">
                <i class="bi bi-whatsapp"></i> Avisar Cliente
            </a>
            <button class="btn btn-sm btn-action btn-danger delete-action" data-id="${pedido.id}" title="Excluir pedido">
                <i class="bi bi-trash"></i> Excluir
            </button>
        `;
    } else if (pedido.status === 'CAMINHO') {
        statusBadge = '<span class="badge text-bg-info"><i class="bi bi-truck me-1"></i> A Caminho</span>';
        buttonHtml = `
            <button class="btn btn-sm btn-action btn-success status-action" data-id="${pedido.id}" data-status="CONCLUIDO" title="Marcar como 'Entregue'">
                <i class="bi bi-check-circle"></i> Entregue
            </button>
             <button class="btn btn-sm btn-action btn-danger delete-action" data-id="${pedido.id}" title="Excluir pedido">
                <i class="bi bi-trash"></i> Excluir
            </button>
        `;
    } else if (pedido.status === 'CONCLUIDO' || pedido.status === 'ENTREGUE') {
        statusBadge = '<span class="badge text-bg-success"><i class="bi bi-check-circle me-1"></i> Concluído</span>';
        buttonHtml = `
            <button class="btn btn-sm btn-action btn-outline-danger delete-action" data-id="${pedido.id}" title="Excluir permanentemente">
                <i class="bi bi-trash"></i> Excluir
            </button>
        `;
    }
    
    // Certifique-se de que o telefone está no formato correto para o link do WhatsApp
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
                    <p class="mb-1"><strong>Total:</strong> R$ ${formatarPreco(pedido.total)} (${pedido.pagamento.toUpperCase()})</p>
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

// Funções de Ação
function alterarStatus(id, novoStatus) {
    let pedidos = carregarPedidos();
    const index = pedidos.findIndex(p => p.id == id);
    if (index !== -1) {
        pedidos[index].status = novoStatus;
        salvarPedidos(pedidos);
        renderizarPedidos();
    }
}

function excluirPedido(id) {
    let pedidos = carregarPedidos();
    pedidos = pedidos.filter(p => p.id != id);
    if (confirm("Tem certeza que deseja excluir este pedido?")) {
        salvarPedidos(pedidos);
        renderizarPedidos();
    }
}

function adicionarEventListeners() {
    // Event Listeners para Alterar Status
    document.querySelectorAll('.status-action').forEach(btn => {
        // Remove listeners duplicados antes de adicionar (necessário após render)
        btn.removeEventListener('click', handleStatusChange);
        btn.addEventListener('click', handleStatusChange);
    });

    // Event Listeners para Excluir
    document.querySelectorAll('.delete-action').forEach(btn => {
        // Remove listeners duplicados antes de adicionar
        btn.removeEventListener('click', handleDelete);
        btn.addEventListener('click', handleDelete);
    });
}

function handleStatusChange(e) {
    const id = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;
    alterarStatus(id, status);
}

function handleDelete(e) {
    const id = e.currentTarget.dataset.id;
    excluirPedido(id);
}


// Inicializa o Dashboard
document.addEventListener('DOMContentLoaded', () => {
    renderizarPedidos();
});