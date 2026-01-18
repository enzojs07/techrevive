/* app.js - lógica do site Tech Revive (local simulation) */

/* ---------- Utilitários ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const money = v => 'R$ ' + v.toFixed(2).replace('.', ',');
const uid = () => 'TR-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000);

/* ---------- Dados iniciais ---------- */
const sampleProducts = [
    { id: 'p1', title: 'Capa Silicone Universal', price: 49.90, stock: 12, desc: 'Capa protetora flexível' },
    { id: 'p2', title: 'Película Temperada 9H', price: 29.90, stock: 30, desc: 'Proteção resistente para tela' },
    { id: 'p3', title: 'Carregador USB-C 20W', price: 79.90, stock: 15, desc: 'Carregador rápido 20W' },
    { id: 'p4', title: 'Cabo USB-C Nylon 1m', price: 24.90, stock: 50, desc: 'Cabo reforçado e durável' }
];

/* ---------- Persistência ---------- */
const DB = {
    getProducts() { return JSON.parse(localStorage.getItem('tr_products') || 'null') || sampleProducts; },
    saveProducts(p) { localStorage.setItem('tr_products', JSON.stringify(p)); },
    getOrders() { return JSON.parse(localStorage.getItem('tr_orders') || '[]'); },
    saveOrders(o) { localStorage.setItem('tr_orders', JSON.stringify(o)); }
};

/* ---------- Navegação de views ---------- */
$$('.nav-btn').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
$$('[data-view-target]')?.forEach(b => b.addEventListener('click', e => showView(e.target.dataset.viewTarget)));
$$('.link')?.forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));

function showView(id) {
    $$('.view').forEach(v => v.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Formulário de orçamento ---------- */
const fotosInput = $('#fotos');
const previewFotos = $('#previewFotos');
let fotosData = [];

fotosInput?.addEventListener('change', (e) => {
    previewFotos.innerHTML = '';
    fotosData = [];
    const files = Array.from(e.target.files).slice(0, 3);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
            const img = document.createElement('img');
            img.src = ev.target.result;
            img.style.width = '72px';
            img.style.height = '72px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            previewFotos.appendChild(img);
            fotosData.push(ev.target.result);
        };
        reader.readAsDataURL(file);
    });
});

$('#formOrcamento')?.addEventListener('submit', e => {
    e.preventDefault();
    const pedido = {
        id: uid(),
        criadoEm: new Date().toISOString(),
        tipo: $('#tipoEquip').value,
        marcaModelo: $('#marcaModelo').value,
        problema: $('#problemaRapido').value,
        descricao: $('#descricao').value,
        fotos: fotosData,
        contatoPref: $('#contatoPref').value,
        nome: $('#nomeCliente').value,
        cep: $('#cep').value,
        cidade: $('#cidade').value,
        status: 'Pedido recebido',
        history: [{ when: new Date().toISOString(), status: 'Pedido recebido' }]
    };
    const orders = DB.getOrders();
    orders.push(pedido);
    DB.saveOrders(orders);
    $('#orcamentoMsg').innerHTML = `<div class="card"><strong>Pedido enviado</strong><p class="small">Código: <strong>${pedido.id}</strong></p><p class="small">Você receberá confirmação por ${pedido.contatoPref}.</p></div>`;
    $('#formOrcamento').reset();
    previewFotos.innerHTML = '';
    fotosData = [];
    refreshAdmin();
    showView('acompanhamento');
});

/* limpar form */
$('#limparForm')?.addEventListener('click', () => {
    $('#formOrcamento').reset();
    previewFotos.innerHTML = '';
    fotosData = [];
});

/* ---------- Acompanhar ---------- */
$('#btnBuscar')?.addEventListener('click', () => {
    const code = $('#codigoBusca').value.trim();
    const orders = DB.getOrders();
    const found = orders.find(o => o.id === code);
    const out = $('#resultadoBusca');
    out.innerHTML = '';
    if (!found) {
        out.innerHTML = `<div class="card"><p class="small">Pedido não encontrado. Verifique o código.</p></div>`;
        return;
    }
    const hist = (found.history || []).map(h => `<li class="small">${new Date(h.when).toLocaleString()} — ${h.status}</li>`).join('');
    out.innerHTML = `
    <div class="card">
      <h3>${found.id} <span class="small" style="color:var(--accent);margin-left:8px">${found.status}</span></h3>
      <p class="small"><strong>Cliente:</strong> ${found.nome || '—'} • <strong>Equip:</strong> ${found.tipo} — ${found.marcaModelo || '—'}</p>
      <p class="small"><strong>Problema:</strong> ${found.descricao || found.problema}</p>
      <div style="display:flex;gap:8px;margin-top:8px">${(found.fotos || []).map(src => `<img src="${src}" style="width:84px;height:84px;object-fit:cover;border-radius:8px">`).join('')}</div>
      <h4 style="margin-top:12px">Histórico</h4>
      <ul>${hist}</ul>
    </div>
  `;
});

/* ---------- Loja e carrinho ---------- */
let cart = [];

function renderProducts() {
    const prods = DB.getProducts();
    const container = $('#produtosList');
    container.innerHTML = '';
    prods.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
      <img src="" alt="${p.title}">
      <div style="flex:1">
        <strong>${p.title}</strong>
        <div class="small">${p.desc}</div>
        <div style="margin-top:8px" class="price">${money(p.price)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <button class="btn" data-add="${p.id}">Adicionar</button>
        <div class="small">Estoque: ${p.stock}</div>
      </div>
    `;
        container.appendChild(div);
    });
    $$('[data-add]').forEach(b => b.addEventListener('click', () => addToCart(b.dataset.add)));
}

function addToCart(id) {
    const prods = DB.getProducts();
    const p = prods.find(x => x.id === id);
    if (!p) return;
    const item = cart.find(i => i.id === id);
    if (item) {
        if (item.qty < p.stock) item.qty++;
    } else cart.push({ id: p.id, title: p.title, price: p.price, qty: 1 });
    renderCart();
}

function renderCart() {
    const list = $('#cartList');
    list.innerHTML = '';
    cart.forEach(it => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `<div>${it.title} <div class="small">x${it.qty}</div></div><div>${money(it.price * it.qty)} <button data-remove="${it.id}" class="btn ghost" style="margin-left:8px">Remover</button></div>`;
        list.appendChild(div);
    });
    $$('[data-remove]').forEach(b => b.addEventListener('click', () => {
        cart = cart.filter(i => i.id !== b.dataset.remove);
        renderCart();
    }));
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    $('#cartTotal').textContent = money(total);
}

$('#checkoutBtn')?.addEventListener('click', () => {
    if (cart.length === 0) { alert('Carrinho vazio'); return; }
    const order = {
        id: uid(),
        criadoEm: new Date().toISOString(),
        tipo: 'Compra loja',
        itens: cart,
        total: cart.reduce((s, i) => s + i.price * i.qty, 0),
        status: 'Pagamento confirmado',
        history: [{ when: new Date().toISOString(), status: 'Pagamento confirmado' }]
    };
    const orders = DB.getOrders();
    orders.push(order);
    DB.saveOrders(orders);
    cart = [];
    renderCart();
    alert('Compra finalizada. Código do pedido: ' + order.id);
    refreshAdmin();
});

/* ---------- Contato rápido ---------- */
$('#enviarMsg')?.addEventListener('click', () => {
    const msg = $('#msgContato').value.trim();
    if (!msg) { alert('Escreva uma mensagem'); return; }
    $('#msgContato').value = '';
    alert('Mensagem enviada. Responderemos em breve.');
});

/* ---------- Admin simples ---------- */
function refreshAdmin() {
    const orders = DB.getOrders().slice().reverse();
    const container = $('#adminList');
    container.innerHTML = '';
    if (orders.length === 0) container.innerHTML = '<p class="small">Nenhum pedido ainda</p>';
    orders.forEach(o => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.marginBottom = '8px';
        div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong>${o.id}</strong><div class="small">${o.tipo} • ${o.nome || '—'}</div></div>
        <div><span class="small">${o.status}</span></div>
      </div>
      <div style="margin-top:8px" class="small">Criado: ${new Date(o.criadoEm).toLocaleString()}</div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <select data-status="${o.id}">
          <option>Pedido recebido</option>
          <option>Em diagnóstico</option>
          <option>Aguardando aprovação do orçamento</option>
          <option>Em reparo</option>
          <option>Aguardando retirada / Enviado</option>
          <option>Concluído</option>
        </select>
        <button data-update="${o.id}" class="btn">Atualizar</button>
      </div>
    `;
        container.appendChild(div);
        const sel = container.querySelector(`[data-status="${o.id}"]`);
        sel.value = o.status;
        container.querySelector(`[data-update="${o.id}"]`).addEventListener('click', () => {
            const newStatus = sel.value;
            o.status = newStatus;
            o.history = o.history || [];
            o.history.push({ when: new Date().toISOString(), status: newStatus });
            DB.saveOrders(DB.getOrders().map(x => x.id === o.id ? o : x));
            refreshAdmin();
            alert('Status atualizado: ' + newStatus);
        });
    });
}

/* ---------- Inicialização ---------- */
(function init() {
    DB.saveProducts(DB.getProducts());
    renderProducts();
    renderCart();
    refreshAdmin();
    showView('home');
})();
