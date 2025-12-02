# Domingo fast – lanchonete Caseira 🍔☕

Este projeto é um site para uma lanchonete/fastfood especializada em **comidas caseiras** e **café da manhã**. O objetivo é apresentar os produtos, facilitar os pedidos e destacar ofertas especiais, tudo em um ambiente digital moderno e **responsivo**.

feito por:

Davi Wendell Ferreira de Lima

Paulo Sérgio Barros Teixeira

Diosne Marlon Furtado dos Santos

Kauan Leandro Gonçalves de Araujo Moreira

acesse o site em: https://domingofast.netlify.app/

---

## Funcionalidades Adicionadas no Site até o Momento 🚀

- **Divulgação do Cardápio** 📜: Apresentação de comidas caseiras, cafés e cafés da manhã.
- **Destaque de Produtos e Promoções** 💥: Áreas de destaque na página inicial com ofertas especiais.
- **Facilidade de Contato e Localização** 📍: Informações rápidas para entrar em contato ou localizar o estabelecimento.
- **Interface Amigável e Responsiva** 📱💻: O site é adaptado para celulares e computadores, oferecendo uma navegação simples e eficiente.
- **Adicionar Produtos ao Pedido** 🛒: O usuário pode adicionar itens ao seu pedido de maneira fácil.
- **Persistência de Pedidos e Clientes (Firestore)** 💾: Os dados de pedidos (com itens, total e pagamento) e os cadastros de clientes (nome, telefone, endereço) são salvos em tempo real na nuvem.
- **Painel Administrador Funcional** 🔧: Interface de login com proteção de rota, que permite ao administrador visualizar, gerenciar status (PENDENTE, CAMINHO, CONCLUÍDO) e excluir pedidos e cadastros de clientes.
- **Autofill de Cliente** 👥: Ao digitar o telefone, os dados do cliente (nome, região, endereço) são carregados automaticamente se já estiver cadastrado.
- **Múltiplas Formas de Pagamento** 💳: O cliente pode escolher entre PIX, Dinheiro (com campo de troco opcional) e Cartão (na entrega).

---

## Funcionalidades Futuras 🔜

- **Integração Completa com WhatsApp** 💬: Gerar o link de pedido final para o WhatsApp com o resumo do pedido e chave PIX para facilitar o pagamento e envio de comprovante. (O envio de aviso "A Caminho" para o cliente já está implementado no Admin).
- **Validação de Área de Entrega** 📍: Implementar lógica para verificar a região informada pelo cliente e alertá-lo caso esteja fora da área de entrega.
- **Controle de Estoque/Disponibilidade** 📦: Adicionar um sistema para marcar produtos como esgotados.

---

## Como Rodar o Código 🖥️

1. **Instale a Extensão "Live Server"**:  
   - No **VS Code**, procure pela extensão "Live Server" e instale-a.
   
2. **Abra o Arquivo `index.html`**:  
   - Clique com o botão direito no arquivo **`index.html`** dentro do seu editor de código.
   - Selecione a opção **"Open with Live Server"**.

3. **Visualize o Site no Navegador** 🌐:  

   - O site será aberto automaticamente no seu navegador. Pronto para usar! 🎉