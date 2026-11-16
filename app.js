import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const $ = (s, root=document) => root.querySelector(s);
const money = n => new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data=null, activeMenu=0, cart=[], searchTerm='';
const categoryNames = m => (m?.cats||[]).map(c=>c.name);

async function loadMenu(){
  try {
    if(isFirebaseConfigured()){
      const app=initializeApp(firebaseConfig); const db=getFirestore(app);
      const snap=await getDoc(doc(db,'menu','current'));
      if(snap.exists()) return snap.data();
    }
  } catch(err){ console.warn('Menu online non raggiungibile, uso la copia pubblica.',err); }
  const res=await fetch('./menu.json',{cache:'no-store'});
  if(!res.ok) throw new Error('Impossibile caricare il menu');
  return await res.json();
}

function renderTabs(){
  $('#menuTabs').innerHTML=(data.menus||[]).map((m,i)=>`<button role="tab" aria-selected="${i===activeMenu}" class="${i===activeMenu?'active':''}" data-menu="${i}">${esc(m.title)}</button>`).join('');
  $('#menuTabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{activeMenu=Number(b.dataset.menu);renderTabs();renderMenu();}));
}
function renderMenu(){
  const menu=data.menus?.[activeMenu]; if(!menu){$('#menuContent').innerHTML='<p class="empty-state">Menù non disponibile.</p>';return;}
  const q=searchTerm.trim().toLocaleLowerCase('it'); let total=0;
  const html=(menu.cats||[]).map((cat,ci)=>{
    const items=(cat.items||[]).filter(it=>it.a!==0 && (!q || `${it.n} ${it.d||''}`.toLocaleLowerCase('it').includes(q)));
    if(!items.length)return ''; total+=items.length;
    return `<section class="category-block"><div class="category-title"><h3>${esc(cat.name)}</h3><span>${String(items.length).padStart(2,'0')} PRODOTTI</span></div><div class="product-grid">${items.map((it,ii)=>`<article class="product"><div class="product-main"><h4 class="product-name">${esc(it.n)}</h4>${it.d?`<p class="product-desc">${esc(it.d)}</p>`:''}</div><strong class="product-price">${money(it.p)}</strong><button class="add-product" aria-label="Aggiungi ${esc(it.n)} al carrello" data-add="${ci}:${(cat.items||[]).indexOf(it)}">+</button></article>`).join('')}</div></section>`;
  }).join('');
  $('#menuContent').innerHTML=html||'<p class="empty-state">Nessun prodotto trovato. Prova un altro termine.</p>';
  $('#menuCount').textContent=q?`${total} risultati`:`${menu.title} · ${total} proposte`;
  $('#menuContent').querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{const [ci,ii]=b.dataset.add.split(':').map(Number);addToCart(menu.cats[ci].items[ii]);}));
}
function addToCart(item){const found=cart.find(x=>x.n===item.n&&x.d===item.d&&x.p===item.p);if(found)found.q++;else cart.push({n:item.n,d:item.d||'',p:Number(item.p)||0,q:1});updateCart();toast(`${item.n} aggiunto`);}
function subtotal(){return cart.reduce((s,x)=>s+x.p*x.q,0)}
function discountAmount(){return $('#studentDiscount')?.checked ? Math.round(subtotal()*Number(data.info?.stud_pct||10))/100 : 0}
function giftEligible(){const threshold=Number(data.info?.cons_omaggio||40);return threshold>0 && subtotal()>=threshold}
function deliveryFee(){const freeFrom=Number(data.info?.cons_gratis||30);return $('#fulfilment').value==='consegna' && !(freeFrom>0 && subtotal()>=freeFrom) ? Number(data.info?.cons_costo||1):0}
function updateCart(){const count=cart.reduce((s,x)=>s+x.q,0);$('#cartFloat').hidden=count===0;$('#cartItems').textContent=`${count} ${count===1?'prodotto':'prodotti'}`;$('#cartTotal').textContent=money(subtotal()-discountAmount()+deliveryFee());$('#subtotal').textContent=money(subtotal());$('#finalTotal').textContent=money(subtotal()-discountAmount()+deliveryFee());$('#promoLines').innerHTML=[discountAmount()?`Sconto studenti (${Number(data.info?.stud_pct||10)}%): −${money(discountAmount())}`:'',giftEligible()?'🎁 Hai diritto a una Margherita in omaggio!':'',($('#fulfilment').value==='consegna'&&deliveryFee()===0)?'Consegna gratuita raggiunta.':''].filter(Boolean).join('<br>');$('#cartLines').innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-line"><div><h4>${esc(x.n)}</h4><small>${money(x.p)} cad.</small></div><div class="line-actions"><button data-dec="${i}" aria-label="Diminuisci">−</button><b>${x.q}</b><button data-inc="${i}" aria-label="Aumenta">+</button></div></div>`).join('')+(giftEligible()?'<div class="cart-line"><div><h4>Margherita in omaggio 🎁</h4><small>Promozione Bar Quality</small></div><strong>Gratis</strong></div>':''):'<p class="empty-state">Il carrello è vuoto.</p>'; 
  $('#cartLines').querySelectorAll('[data-dec]').forEach(b=>b.addEventListener('click',()=>{const x=cart[+b.dataset.dec];x.q--;if(x.q<=0)cart.splice(+b.dataset.dec,1);updateCart();}));
  $('#cartLines').querySelectorAll('[data-inc]').forEach(b=>b.addEventListener('click',()=>{cart[+b.dataset.inc].q++;updateCart();}));
}
function openCart(){if(!cart.length)return;$('#drawerBackdrop').hidden=false;$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function closeCart(){$('#drawerBackdrop').hidden=true;$('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');document.body.style.overflow='';}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1900);}
function sendOrder(){
  if(!cart.length){toast('Il carrello è vuoto');return;}
  const name=$('#customerName').value.trim(), time=$('#customerTime').value.trim(), mode=$('#fulfilment').value, addr=$('#customerAddress').value.trim(), phone=$('#customerPhone').value.trim();
  if(!name){toast('Inserisci il tuo nome');$('#customerName').focus();return;}
  if(mode==='consegna'&&(!addr||!phone)){toast('Inserisci indirizzo e telefono');return;}
  const lines=cart.map(x=>`• ${x.q} × ${x.n} — ${money(x.p*x.q)}`);
  const fee=deliveryFee();
  const discount=discountAmount(),gift=giftEligible(),payment=mode==='consegna'?($('#paymentMethod').value==='carta'?'Carta / POS alla consegna':`Contanti alla consegna${$('#cashChange').value.trim()?` (pago con ${$('#cashChange').value.trim()})`:''}`):'Pagamento in negozio al ritiro';
  const msg=[`Ciao Bar Quality! Vorrei effettuare questo ordine:`,``,...lines,gift?'• 1 × Margherita (OMAGGIO) — Gratis':'',``,`Modalità: ${mode==='ritiro'?'Ritiro in negozio':'Consegna a domicilio'}`,`Nome: ${name}`,time?`Orario richiesto: ${time}`:'',mode==='consegna'?`Indirizzo: ${addr}`:'',mode==='consegna'?`Telefono: ${phone}`:'',`Pagamento: ${payment}`,$('#studentDiscount').checked?`Sconto studenti (${Number(data.info?.stud_pct||10)}%): −${money(discount)}`:'',$('#customerNotes').value.trim()?`Note: ${$('#customerNotes').value.trim()}`:'',``,`Prodotti: ${money(subtotal())}`,discount?`Sconto: −${money(discount)}`:'',mode==='consegna'?`Consegna: ${fee?money(fee):'Gratis'}`:'',`TOTALE STIMATO: ${money(subtotal()-discount+fee)}`,``,`Attendo conferma, grazie!`].filter(Boolean).join('\n');
  const number=String(data.wa||'393481626519').replace(/\D/g,'');window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
}
function bindUI(){
  $('#search').addEventListener('input',e=>{searchTerm=e.target.value;renderMenu();});
  $('#openCart').addEventListener('click',openCart);$('#closeCart').addEventListener('click',closeCart);$('#drawerBackdrop').addEventListener('click',closeCart);
  $('#fulfilment').addEventListener('change',()=>{$('#deliveryFields').hidden=$('#fulfilment').value!=='consegna';updateCart();});
  $('#studentDiscount').addEventListener('change',updateCart);
  $('#sendOrder').addEventListener('click',sendOrder);
  $('#privacyLink').addEventListener('click',e=>{e.preventDefault();$('#privacyModal').hidden=false;});$('#privacyClose').addEventListener('click',()=>$('#privacyModal').hidden=true);$('#privacyOk').addEventListener('click',()=>$('#privacyModal').hidden=true);$('#privacyModal').addEventListener('click',e=>{if(e.target.id==='privacyModal')$('#privacyModal').hidden=true;});
  $('#mobileMenu').addEventListener('click',()=>{const n=$('.desktop-nav');const open=n.style.display==='flex';n.style.display=open?'none':'flex';n.style.position='absolute';n.style.top='72px';n.style.left='0';n.style.right='0';n.style.padding='22px';n.style.background='var(--paper)';n.style.flexDirection='column';n.style.boxShadow='0 10px 20px rgba(0,0,0,.08)';$('#mobileMenu').setAttribute('aria-expanded',String(!open));});
  $('#year').textContent=new Date().getFullYear();
}
(async()=>{bindUI();try{data=await loadMenu();renderTabs();renderMenu();}catch(e){console.error(e);$('#menuContent').innerHTML='<p class="empty-state">Il menù non è al momento disponibile. Contattaci al 348 162 6519.</p>';}})();
