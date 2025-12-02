// O db (referência do Firestore) é esperado ser inicializado no index.html
// Coleções a serem usadas no Firestore:
const PEDIDOS_COLLECTION = 'pedidos';   
const CLIENTES_COLLECTION = 'clientes'; 

window.carrinho = [];

// Função para formatar preço
function formatarPreco(valor) {
  return valor.toFixed(2).replace('.', ',');
}

// Função para extrair preço do texto (lida com promoções)
function extrairPreco(precoTexto) {
  const matches = precoTexto.match(/[\d,]+(?=\s*$)/);
  if (matches && matches.length > 0) {
    return parseFloat(matches[0].replace(',', '.'));
  }
  return 0;
}

// Carregar carrinho (continua local, para ser rápido)
function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        window.carrinho = JSON.parse(carrinhoSalvo);
    }
}

// Salvar carrinho (continua local)
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(window.carrinho));
}

// FUNÇÕES DE CADASTRO DE CLIENTE (AGORA USAM FIRESTORE)

async function salvarCliente(cliente) {
    const telefoneLimpo = cliente.telefone.replace(/\D/g, '');
    try {
        const clientesRef = db.collection(CLIENTES_COLLECTION);
        // Busca o cliente pelo telefone limpo
        const snapshot = await clientesRef.where('telefoneLimpo', '==', telefoneLimpo).limit(1).get();

        if (!snapshot.empty) {
            // Cliente encontrado: Atualiza o registro existente (Update)
            const docId = snapshot.docs[0].id;
            await clientesRef.doc(docId).update({
                nome: cliente.nome,
                regiao: cliente.regiao,
                detalhesEndereco: cliente.detalhesEndereco,
                telefoneLimpo: telefoneLimpo, 
                dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Cliente existente atualizado:", docId);
        } else {
            // Cliente não encontrado: Cria um novo registro (Create)
            const docRef = await clientesRef.add({
                ...cliente,
                telefoneLimpo: telefoneLimpo,
                dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Novo cliente criado:", docRef.id);
        }
    } catch (e) {
        console.error("Erro ao salvar cliente no Firestore. Possível erro de Permissão:", e);
        mostrarNotificacao('Erro ao salvar cadastro do cliente na nuvem. (Verifique as Regras do Firebase)', 'danger');
    }
}

async function carregarCliente(telefone) {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length !== 11) return null; // Não tenta buscar se o telefone for inválido
    
    try {
        const clientesRef = db.collection(CLIENTES_COLLECTION);
        // Busca o cliente pelo telefone limpo
        const snapshot = await clientesRef.where('telefoneLimpo', '==', telefoneLimpo).limit(1).get();

        if (!snapshot.empty) {
            console.log("Cliente encontrado no Firestore.");
            return snapshot.docs[0].data();
        }
        return null;
    } catch (e) {
        console.error("Erro ao buscar cliente no Firestore. Possível erro de Permissão:", e);
        // Se houver Permission Denied, retorna null e o autofill não ocorre
        return null;
    }
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

// Função para salvar o pedido na Nuvem
async function salvarPedidoAdmin() {
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
    id: Date.now(), // ID único (para ordenação)
    status: 'PENDENTE',
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

  try {
      // Envia o pedido para a Nuvem
      await db.collection(PEDIDOS_COLLECTION).add({
          ...pedido,
          dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Pedido salvo com sucesso!");
  } catch(e) {
      console.error("Erro ao salvar pedido no Firestore:", e);
      mostrarNotificacao('Erro ao finalizar pedido na nuvem.', 'danger');
  }
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

// REMOVIDA A FUNÇÃO gerarMensagemWhatsApp()

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
    btnAddHero.addEventListener('click', () => { // Mudança para btnAddHero
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
    // FUNÇÃO PRINCIPAL: ASYNC para interagir com a Nuvem
    finalizarBtn.addEventListener('click', async () => {
      // 1. O formulário só é enviado/salvo se a validação for bem-sucedida.
      if (!validarFormulario()) return;

      // 2. SALVA/ATUALIZA o cadastro do cliente na Nuvem
      const novoCadastro = {
          nome: document.getElementById('nomeCliente').value,
          telefone: document.getElementById('telefoneCliente').value,
          regiao: document.getElementById('regiaoCliente').value,
          detalhesEndereco: document.getElementById('detalhesEndereco').value,
      };
      // Esta chamada deve funcionar após a correção das Regras de Segurança
      await salvarCliente(novoCadastro); 

      // 3. Salva o pedido na Nuvem
      await salvarPedidoAdmin(); 
      
      // REMOVIDA A LÓGICA DE GERAÇÃO E REDIRECIONAMENTO DO WHATSAPP

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
        
        // MENSAGEM ATUALIZADA
        mostrarNotificacao('Pedido salvo com sucesso! Aguarde a confirmação de contato.', 'success');
      }, 1000);
    });
  }

  // Máscara e Lógica de Cadastro para telefone
  if (telefoneInput) {
    
    // Adiciona o prefixo (91) no início
    if (telefoneInput.value.replace(/\D/g, '').length < 3) {
      telefoneInput.value = '(91)';
    }

    telefoneInput.addEventListener('input', async (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      // Garante que o DDD seja 91 e limita o tamanho para 11 dígitos
      if (value.length >= 2 && value.substring(0, 2) !== '91') {
          value = '91' + value.substring(2);
      } else if (value.length > 11) {
          value = value.substring(0, 11);
      }
      
      // Lógica de Autofill (busca na Nuvem)
      if (value.length === 11 && /^(91)9\d{8}$/.test(value)) {
          // Esta chamada deve funcionar após a correção das Regras de Segurança
          const cliente = await carregarCliente(value);
          if (cliente) {
              preencherFormulario(cliente);
          } else {
              mostrarNotificacao('Novo cliente! Complete o cadastro.', 'info');
          }
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