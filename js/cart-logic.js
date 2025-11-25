// Sistema de carrinho moderno e completo
window.carrinho = [];
const CLIENTES_KEY = 'clientesCadastrados'; // Chave para salvar os clientes
const PEDIDOS_KEY = 'pedidosAdmin';       // Chave para salvar os pedidos admin

// Função para formatar preço
function formatarPreco(valor) {
  return valor.toFixed(2).replace('.', ',');
}

// Função para extrair preço do texto (lida com promoções)
function extrairPreco(precoTexto) {
  // Pega todos os valores numéricos do texto
  const matches = precoTexto.match(/[\d,]+(?=\s*$)/);
  if (matches && matches.length > 0) {
    // Retorna o último valor encontrado, convertido para float
    return parseFloat(matches[0].replace(',', '.'));
  }
  return 0;
}

// Carregar carrinho do localStorage ao iniciar
function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        window.carrinho = JSON.parse(carrinhoSalvo);
    }
}

// Salvar carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(window.carrinho));
}

// FUNÇÕES DE CADASTRO DE CLIENTE
function getClientes() {
    return JSON.parse(localStorage.getItem(CLIENTES_KEY) || '{}');
}

function salvarCliente(cliente) {
    const clientes = getClientes();
    // Usa o número de telefone limpo como chave única
    const telefoneLimpo = cliente.telefone.replace(/\D/g, ''); 
    
    clientes[telefoneLimpo] = cliente;
    localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientes));
}

function carregarCliente(telefone) {
    const clientes = getClientes();
    const telefoneLimpo = telefone.replace(/\D/g, '');
    return clientes[telefoneLimpo] || null;
}

// Preenche o formulário se o cliente for encontrado
function preencherFormulario(cliente) {
    if (cliente) {
        document.getElementById('nomeCliente').value = cliente.nome || '';
        document.getElementById('regiaoCliente').value = cliente.regiao || '';
        document.getElementById('detalhesEndereco').value = cliente.detalhesEndereco || '';
        
        mostrarNotificacao(`Bem-vindo(a) de volta, ${cliente.nome.split(' ')[0]}! Seu cadastro foi carregado.`, 'info');
    }
}
// FIM FUNÇÕES DE CADASTRO DE CLIENTE

// NOVO: Função para salvar o pedido no localStorage Admin
function salvarPedidoAdmin() {
  const nome = document.getElementById('nomeCliente').value;
  const telefone = document.getElementById('telefoneCliente').value;
  const regiao = document.getElementById('regiaoCliente').value;
  const detalhesEndereco = document.getElementById('detalhesEndereco').value;
  const formaPagamento = document.getElementById('formaPagamento').value;
  const valorTroco = document.getElementById('valorTroco').value;
  
  let total = 0;
  const itensPedido = window.carrinho.map(item => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;
    return {
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.preco,
      subtotal: subtotal
    };
  });

  const pedido = {
    id: Date.now(), // ID único baseado no timestamp
    status: 'PENDENTE', // Status inicial
    dataHora: new Date().toLocaleString('pt-BR'),
    cliente: nome,
    telefone: telefone,
    endereco: {
      regiao: regiao,
      detalhes: detalhesEndereco
    },
    pagamento: formaPagamento,
    troco: formaPagamento === 'dinheiro' ? valorTroco : 'N/A',
    itens: itensPedido,
    total: total
  };

  const pedidosSalvos = JSON.parse(localStorage.getItem(PEDIDOS_KEY) || '[]');
  pedidosSalvos.push(pedido);
  localStorage.setItem(PEDIDOS_KEY, JSON.stringify(pedidosSalvos));
}

// Atualizar interface do carrinho
window.atualizarCarrinho = function() {
  const carrinhoDiv = document.getElementById('carrinhoProdutos');
  const itemCountDesktop = document.getElementById('itemCountDesktop');
  const itemCountMobile = document.getElementById('itemCountMobile');
  const totalPreco = document.getElementById('totalPreco');
  const continuarBtn = document.getElementById('continuarPedido');

  if (!carrinhoDiv || !totalPreco) return;

  carrinhoDiv.innerHTML = '';
  let total = 0;

  if (window.carrinho.length === 0) {
    carrinhoDiv.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-bag text-muted" style="font-size: 3rem;"></i>
        <p class="text-muted mt-2 mb-0">Seu carrinho está vazio</p>
        <small class="text-muted">Adicione alguns produtos deliciosos!</small>
      </div>
    `;
  } else {
    window.carrinho.forEach((item, index) => {
      const produtoDiv = document.createElement('div');
      produtoDiv.className = 'card mb-3';
      produtoDiv.innerHTML = `
        <div class="card-body p-3">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h6 class="card-title mb-1">${item.nome}</h6>
              <p class="text-primary fw-bold mb-2">R$ ${formatarPreco(item.preco)}</p>
              <div class="d-flex align-items-center gap-2">
                <button class="btn btn-outline-secondary btn-sm" onclick="alterarQuantidade(${index}, -1)">
                  <i class="bi bi-dash"></i>
                </button>
                <span class="fw-bold">${item.quantidade}</span>
                <button class="btn btn-outline-secondary btn-sm" onclick="alterarQuantidade(${index}, 1)">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>
            <div class="text-end">
              <button class="btn btn-outline-danger btn-sm" onclick="removerProduto(${index})" title="Remover item">
                <i class="bi bi-trash"></i>
              </button>
              <div class="mt-2">
                <small class="text-muted">Subtotal:</small><br>
                <strong class="text-primary">R$ ${formatarPreco(item.preco * item.quantidade)}</strong>
              </div>
            </div>
          </div>
        </div>
      `;
      carrinhoDiv.appendChild(produtoDiv);
      total += item.preco * item.quantidade;
    });
  }

  const totalItens = window.carrinho.reduce((sum, item) => sum + item.quantidade, 0);
  if (itemCountDesktop) itemCountDesktop.textContent = totalItens;
  if (itemCountMobile) itemCountMobile.textContent = totalItens;

  totalPreco.textContent = formatarPreco(total);
  
  if (continuarBtn) {
    continuarBtn.disabled = window.carrinho.length === 0;
  }
  
  salvarCarrinho();
};

// Adicionar produto ao carrinho
window.adicionarProduto = function(nome, preco) {
  const itemExistente = window.carrinho.find(item => item.nome === nome);
  
  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    window.carrinho.push({
      nome: nome,
      preco: preco,
      quantidade: 1
    });
  }
  
  window.atualizarCarrinho();
  
  // Feedback visual
  mostrarNotificacao(`${nome} adicionado ao carrinho!`, 'success');
};

// Alterar quantidade
window.alterarQuantidade = function(index, delta) {
  if (window.carrinho[index]) {
    window.carrinho[index].quantidade += delta;
    
    if (window.carrinho[index].quantidade <= 0) {
      window.carrinho.splice(index, 1);
    }
    
    window.atualizarCarrinho();
  }
};

// Remover produto
window.removerProduto = function(index) {
  if (window.carrinho[index]) {
    const nomeItem = window.carrinho[index].nome;
    window.carrinho.splice(index, 1);
    window.atualizarCarrinho();
    mostrarNotificacao(`${nomeItem} removido do carrinho`, 'info');
  }
};

// Função para limpar todo o carrinho
window.limparCarrinho = function() {
  if (window.carrinho.length > 0) {
    window.carrinho = [];
    window.atualizarCarrinho();
    mostrarNotificacao('Carrinho limpo com sucesso!', 'info');
    
    // Esconder o formulário de cliente, se estiver visível, e voltar aos botões iniciais
    const formCliente = document.getElementById('formCliente');
    const botoesCarrinho = document.getElementById('botoesCarrinho');
    if (formCliente && botoesCarrinho) {
        formCliente.style.display = 'none';
        botoesCarrinho.style.display = 'block';
    }
  } else {
    mostrarNotificacao('O carrinho já está vazio.', 'warning');
  }
};

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
  const existente = document.querySelector('.toast-notification');
  if (existente) existente.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification alert alert-${tipo === 'success' ? 'success' : tipo === 'danger' ? 'danger' : 'info'} position-fixed`;
  toast.style.cssText = `
    top: 100px; 
    right: 20px; 
    z-index: 9999; 
    min-width: 300px;
    animation: slideIn 0.3s ease;
  `;
  toast.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi bi-${tipo === 'success' ? 'check-circle' : tipo === 'danger' ? 'x-circle' : 'info-circle'} me-2"></i>
      ${mensagem}
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 100);
  }, 800);
}

// Função para gerar mensagem do WhatsApp
function gerarMensagemWhatsApp() {
  const nome = document.getElementById('nomeCliente').value;
  const telefone = document.getElementById('telefoneCliente').value;
  const regiao = document.getElementById('regiaoCliente').value;
  const detalhesEndereco = document.getElementById('detalhesEndereco').value;
  const formaPagamento = document.getElementById('formaPagamento').value;
  const valorTroco = document.getElementById('valorTroco').value;

  // Combina Região e Detalhes
  const enderecoCompleto = `${regiao} - ${detalhesEndereco}`;

  let mensagem = `🍔 *PEDIDO - Domingo FAST* 🍔\n\n`;
  mensagem += `👤 *Cliente:* ${nome}\n`;
  mensagem += `📱 *Telefone:* ${telefone}\n`;
  mensagem += `📍 *Endereço:* ${enderecoCompleto}\n\n`;
  
  mensagem += `🛍️ *ITENS DO PEDIDO:*\n`;
  let total = 0;
  
  window.carrinho.forEach(item => {
    const subtotal = item.preco * item.quantidade;
    mensagem += `• ${item.quantidade}x ${item.nome} - R$ ${formatarPreco(subtotal)}\n`;
    total += subtotal;
  });
  
  mensagem += `\n💰 *TOTAL: R$ ${formatarPreco(total)}*\n`;
  mensagem += `🛵 *Frete:* Grátis (Sem taxa de entrega) 🎁\n\n`; 
  
  mensagem += `💳 *Forma de pagamento:* `;
  switch(formaPagamento) {
    case 'pix':
      mensagem += `PIX\n\n🔑 *Chave PIX:* (91) 9 8165-4787\n📱 *Nome:* Domingo Fast`;
      break;
    case 'dinheiro':
      mensagem += `Dinheiro`;
      if (valorTroco) {
        mensagem += ` (Troco para R$ ${valorTroco})`;
      }
      break;
    case 'cartao':
      mensagem += `Cartão (na entrega)`;
      break;
  }
  
  mensagem += `\n\n✅ Pedido confirmado! Aguarde nosso contato para confirmar o tempo de entrega.`;
  
  return encodeURIComponent(mensagem);
}

// Validar formulário
function validarFormulario() {
  const nome = document.getElementById('nomeCliente').value.trim();
  const telefone = document.getElementById('telefoneCliente').value.trim();
  const regiao = document.getElementById('regiaoCliente').value;
  const detalhesEndereco = document.getElementById('detalhesEndereco').value.trim();
  const formaPagamento = document.getElementById('formaPagamento').value;

  if (!nome || !telefone || !regiao || !detalhesEndereco || !formaPagamento) {
    mostrarNotificacao('Por favor, preencha todos os campos e selecione sua Região.', 'warning');
    return false;
  }

  // Validação específica para o formato (+55) (91) 9 XXXX-XXXX
  const telefoneLimpo = telefone.replace(/\D/g, '');
  if (!/^(91)9\d{8}$/.test(telefoneLimpo) || telefoneLimpo.length !== 11) {
    mostrarNotificacao('🚫 Por favor, insira um número de telefone válido do Pará: (91) 9 XXXX-XXXX.', 'danger');
    return false;
  }

  if (regiao === "") {
      mostrarNotificacao('🚫 Por favor, selecione sua Região para entrega.', 'danger');
      return false;
  }
  
  return true;
}

// Configurar eventos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Carregar o carrinho ao carregar a página
  carregarCarrinho();
  
  // Configurar botões dos produtos
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.card-produto');
      const nome = card.dataset.nome || card.querySelector('h3').textContent.trim();
      const precoTexto = card.querySelector('.preco').textContent;
      const preco = extrairPreco(precoTexto);
      
      window.adicionarProduto(nome, preco);
    });
  });
  
  // Configurar botão de oferta principal
  const btnAddHero = document.querySelector('.btn-add-hero');
  if (btnAddHero) {
    btnAddHero.addEventListener('click', () => {
      const nome = document.querySelector('.hero-titulo').textContent;
      const precoTexto = document.querySelector('.hero-preco').textContent;
      const preco = extrairPreco(precoTexto);
      
      window.adicionarProduto(nome, preco);
    });
  }

  // Atualizar carrinho inicial
  window.atualizarCarrinho();
});

// Função chamada quando o offcanvas é carregado
window.attachFinalizeHandler = function() {
  const continuarBtn = document.getElementById('continuarPedido');
  const voltarBtn = document.getElementById('voltarCarrinho');
  const finalizarBtn = document.getElementById('finalizarPedido');
  const formaPagamentoSelect = document.getElementById('formaPagamento');
  const trocoDiv = document.getElementById('trocoDiv');
  const formCliente = document.getElementById('formCliente');
  const botoesCarrinho = document.getElementById('botoesCarrinho');
  const telefoneInput = document.getElementById('telefoneCliente');

  // Botão limpar carrinho
  const limparTudoBtn = document.getElementById('limparTudo');
  if (limparTudoBtn) {
    // Remoção de listener antigo e adição do novo (boas práticas)
    const novoLimparTudoBtn = limparTudoBtn.cloneNode(true);
    limparTudoBtn.parentNode.replaceChild(novoLimparTudoBtn, limparTudoBtn);
    novoLimparTudoBtn.addEventListener('click', window.limparCarrinho);
  }

  if (!continuarBtn) return;
  
  // Remoção de listener antigo e adição do novo (boas práticas)
  const novoContinuarBtn = continuarBtn.cloneNode(true);
  continuarBtn.parentNode.replaceChild(novoContinuarBtn, continuarBtn);

  // Evento para continuar pedido
  novoContinuarBtn.addEventListener('click', () => {
    if (window.carrinho.length === 0) {
      mostrarNotificacao('Adicione itens ao carrinho primeiro!', 'warning');
      return;
    }
    
    formCliente.style.display = 'block';
    botoesCarrinho.style.display = 'none';
  });

  // Evento para voltar ao carrinho
  if (voltarBtn) {
    voltarBtn.addEventListener('click', () => {
      formCliente.style.display = 'none';
      botoesCarrinho.style.display = 'block';
    });
  }

  // Evento para mostrar/ocultar campo de troco
  if (formaPagamentoSelect) {
    formaPagamentoSelect.addEventListener('change', (e) => {
      if (e.target.value === 'dinheiro') {
        trocoDiv.style.display = 'block';
      } else {
        trocoDiv.style.display = 'none';
      }
    });
  }

  // Evento para finalizar pedido
  if (finalizarBtn) {
    finalizarBtn.addEventListener('click', () => {
      // 1. O formulário só é enviado/salvo se a validação for bem-sucedida.
      if (!validarFormulario()) return;

      // 2. SALVA/ATUALIZA o cadastro do cliente
      const novoCadastro = {
          nome: document.getElementById('nomeCliente').value,
          telefone: document.getElementById('telefoneCliente').value,
          regiao: document.getElementById('regiaoCliente').value,
          detalhesEndereco: document.getElementById('detalhesEndereco').value,
      };
      salvarCliente(novoCadastro);

      // 3. Salva o pedido no dashboard
      salvarPedidoAdmin(); 
      
      const mensagem = gerarMensagemWhatsApp();
      const numeroWhatsApp = '5591981654787';
      const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;
      
      // Abrir WhatsApp
      window.open(urlWhatsApp, '_blank');
      
      // Limpar carrinho após envio
      setTimeout(() => {
        window.carrinho = [];
        window.atualizarCarrinho();
        
        // Limpa apenas os campos de pedido/pagamento, mantendo o nome/endereço para o próximo pedido
        document.getElementById('formaPagamento').value = '';
        document.getElementById('valorTroco').value = '';
        
        // Voltar para tela inicial do carrinho
        formCliente.style.display = 'none';
        botoesCarrinho.style.display = 'block';
        
        mostrarNotificacao('Pedido enviado! Aguarde nosso contato.', 'success');
      }, 1000);
    });
  }

  // Máscara e Lógica de Cadastro para telefone
  if (telefoneInput) {
    
    // NOVO: Adiciona o prefixo (91) no início e no blur para guiar o usuário
    telefoneInput.value = '(91)';

    telefoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      // Garante que o DDD seja 91 e limita o tamanho para 11 dígitos
      if (value.length >= 2 && value.substring(0, 2) !== '91') {
          value = '91' + value.substring(2);
      } else if (value.length > 11) {
          value = value.substring(0, 11);
      }
      
      // Valida o telefone com o DDD 91 e 9 dígitos (11 total)
      if (value.length === 11 && /^(91)9\d{8}$/.test(value)) {
          const cliente = carregarCliente(value);
          if (cliente) {
              preencherFormulario(cliente);
          } else {
              // Se o número estiver no formato correto, mas for novo, limpa a notificação.
              mostrarNotificacao('Novo cliente! Complete o cadastro.', 'info');
          }
      } else if (value.length === 11 && value.substring(0, 2) === '91') {
           // Se tiver 11 dígitos mas o formato não for 919xxxx-xxxx, exibe um aviso (ex: 918xxxx-xxxx).
           mostrarNotificacao('O número deve ser 9XXXXXXXX (9 dígitos após o DDD).', 'warning');
      }
      
      // Aplica a máscara de exibição final
      let displayValue = '';
      if (value.length >= 11) {
          displayValue = `(${value.substring(0, 2)}) 9 ${value.substring(3, 7)}-${value.substring(7, 11)}`;
      } else if (value.length >= 7) {
          displayValue = `(${value.substring(0, 2)}) 9 ${value.substring(3, 7)}-${value.substring(7)}`;
      } else if (value.length >= 3) {
          displayValue = `(${value.substring(0, 2)}) 9 ${value.substring(3)}`;
      } else if (value.length > 0) {
          displayValue = `(${value}`;
      } else {
          displayValue = '(91)'; // Mantém o prefixo
      }
      e.target.value = displayValue;
    });

    // Limpa a máscara no foco para facilitar a digitação
    telefoneInput.addEventListener('focus', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
    // Adiciona o prefixo (91) ao sair do campo se estiver vazio
    telefoneInput.addEventListener('blur', (e) => {
        if (e.target.value.replace(/\D/g, '').length < 3) {
            e.target.value = '(91)';
        }
    });
  }
  
  // Atualizar carrinho
  window.atualizarCarrinho();
};

// Adicionar estilos para animações
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .toast-notification {
    border-left: 4px solid currentColor;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;
document.head.appendChild(style);