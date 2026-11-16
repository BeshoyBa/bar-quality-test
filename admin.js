import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, ADMIN_UID, isFirebaseConfigured } from "./firebase-config.js";
const $=s=>document.querySelector(s);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let auth,db,menuData=null,dirty=false;
if(!isFirebaseConfigured()){$('#loginPanel').hidden=true;$('#setupPanel').hidden=false;}
else{
 const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
 onAuthStateChanged(auth,async user=>{if(!user){showLogin();return;}if(user.uid!==ADMIN_UID){await signOut(auth);$('#loginError').textContent='Questo account non è autorizzato.';showLogin();return;}try{const snap=await getDoc(doc(db,'menu','current'));if(snap.exists())menuData=snap.data();else{const res=await fetch('./menu.json');menuData=await res.json();}showAdmin();renderSelectors();renderProducts();}catch(e){console.error(e);$('#loginError').textContent='Non riesco a leggere il menù. Controlla le regole Firestore.';showLogin();}});
}
function showLogin(){$('#loginPanel').hidden=false;$('#adminPanel').hidden=true;}
function showAdmin(){$('#loginPanel').hidden=true;$('#adminPanel').hidden=false;}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();$('#loginError').textContent='';try{await signInWithEmailAndPassword(auth,$('#email').value.trim(),$('#password').value);}catch(err){$('#loginError').textContent='Accesso non riuscito. Controlla email e password.';}});
$('#logout').addEventListener('click',()=>signOut(auth));
function currentMenu(){return menuData.menus[Number($('#menuSelect').value)||0];}
function currentCat(){return currentMenu().cats[Number($('#categorySelect').value)||0];}
function renderSelectors(){ $('#menuSelect').innerHTML=menuData.menus.map((m,i)=>`<option value="${i}">${esc(m.title)}</option>`).join('');renderCategories(); }
function renderCategories(){const m=currentMenu();$('#categorySelect').innerHTML=m.cats.map((c,i)=>`<option value="${i}">${esc(c.name)}</option>`).join('');}
$('#menuSelect').addEventListener('change',()=>{renderCategories();renderProducts();});$('#categorySelect').addEventListener('change',renderProducts);$('#filter').addEventListener('input',renderProducts);
function renderProducts(){if(!menuData)return;const cat=currentCat();const q=$('#filter').value.trim().toLocaleLowerCase('it');$('#products').innerHTML=cat.items.map((it,i)=>({it,i})).filter(x=>!q||`${x.it.n} ${x.it.d||''}`.toLocaleLowerCase('it').includes(q)).map(({it,i})=>`<div class="product-row" data-index="${i}"><input class="name" data-field="n" aria-label="Nome" value="${esc(it.n)}"><input class="description" data-field="d" aria-label="Descrizione" value="${esc(it.d||'')}"><input class="price" data-field="p" type="number" min="0" step="0.01" aria-label="Prezzo" value="${Number(it.p)||0}"><label class="toggle"><input data-field="a" type="checkbox" ${it.a===0?'':'checked'}> Disponibile</label><button class="delete" data-delete="${i}">Elimina</button></div>`).join('')||'<p class="muted">Nessun prodotto in questa categoria.</p>';
 $('#products').querySelectorAll('[data-field]').forEach(el=>el.addEventListener('change',()=>{const row=el.closest('.product-row'),item=cat.items[Number(row.dataset.index)];const f=el.dataset.field;if(f==='p')item.p=Math.max(0,Number(el.value)||0);else if(f==='a')item.a=el.checked?1:0;else item[f]=el.value;markDirty();}));
 $('#products').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Eliminare questo prodotto dal menù?'))return;cat.items.splice(Number(b.dataset.delete),1);markDirty();renderProducts();}));
}
function markDirty(){$('#saveStatus').textContent='Modifiche non salvate';dirty=true;}
$('#addProduct').addEventListener('click',()=>{const n=$('#newName').value.trim(),p=Number($('#newPrice').value),d=$('#newDesc').value.trim();if(!n||!Number.isFinite(p)||p<0){alert('Inserisci un nome e un prezzo valido.');return;}currentCat().items.push({n,d,p,a:1});$('#newName').value='';$('#newPrice').value='';$('#newDesc').value='';markDirty();renderProducts();});
$('#save').addEventListener('click',async()=>{if(!auth?.currentUser||auth.currentUser.uid!==ADMIN_UID){alert('Sessione non autorizzata.');return;}const btn=$('#save');btn.disabled=true;btn.textContent='Salvataggio…';try{await setDoc(doc(db,'menu','current'),menuData);dirty=false;$('#saveStatus').textContent='Menù aggiornato. Le modifiche sono online.';btn.textContent='Salvato ✓';setTimeout(()=>{btn.textContent='Salva modifiche';btn.disabled=false;},1600);}catch(e){console.error(e);$('#saveStatus').textContent='Salvataggio non riuscito. Controlla le regole Firestore.';btn.textContent='Riprova';btn.disabled=false;}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
