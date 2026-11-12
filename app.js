const KEY="volaconnect_mvp_v1";
function loadDB(){
  try{const saved=JSON.parse(
    localStorage.getItem(KEY)||"{}");
    const base=emptyDB();
    return {
      ...base,
      ...saved,
      farm:{
        ...base.farm,
        ...(saved.farm||{})},
      settings:{
        ...base.settings,
        ...(saved.settings||{})}};}catch(e){
    return emptyDB();}}
let db=loadDB(), watchId=null;
function updateNotificationCount(){
  const notifications=Array.isArray(db.notifications)
    ?db.notifications:[];
  const unread=notifications.filter(n=>!n.read).length;
  const badge=document.getElementById("notificationCount");
  if(!badge)return;
  badge.textContent=unread>99?"99+":String(unread);
  badge.style.display=unread>0?"inline-block":"none";}
function markNotificationRead(id){
  if(!Array.isArray(db.notifications))return;
  const notification=db.notifications.find(n=>n.id===id);
  if(!notification)return;
  notification.read=true;
  persist("Notification marquée comme lue");
  toast("Notification marquée comme lue.");}
function markAllNotificationsRead(){
  (db.notifications||[]).forEach(n=>{
    n.read=true;});
  persist("Toutes les notifications marquées comme lues");
  toast("Toutes les notifications sont maintenant lues.");}
function emptyDB(){
  return {
    farm:{},
    animals:[],
    livestock:[],
    equipment:[],
    incubator:[],
    clients:[],
    orders:[],
    finance:[],
    products:[],
    reviews:[],
    messages:[],
    notifications:[],
    audit:[],
    queue:[],
    boundary:[],
    gps:null,
    settings:{language:"fr"}};}
function generateHealthNotifications(){
  if(!Array.isArray(db.notifications)) db.notifications=[];
  if(!Array.isArray(db.animals)) db.animals=[];
  const today=new Date();
  today.setHours(0,0,0,0);
  const limit=new Date(today);
  limit.setDate(limit.getDate()+7);
  db.animals.forEach((animal,index)=>{
    if(!animal.nextDate)return;
    const next=new Date(animal.nextDate+"T00:00:00");
    if(isNaN(next.getTime()))return;
    if(next<new Date(today.getTime()-7*86400000))return;
    if(next>limit)return;
    const animalId=animal.id||index;
    const notificationId="health-"+animalId+"-"+animal.nextDate;
    const exists=db.notifications.some(
      n=>n.id===notificationId
    );
    if(!exists){
      db.notifications.unshift({
        id:notificationId,
        type:"Santé",
        title:animal.nextDate<today.toISOString().slice(0,10)
          ?"Intervention sanitaire en retard"
          :"Intervention sanitaire à venir",
        message:(animal.kind||"Intervention")+" — "+animal.nextDate,
        date:animal.nextDate,
        read:false,
        createdAt:new Date().toISOString()
      });}
  });}
function persist(action="Mise à jour"){
  if(!Array.isArray(db.queue))db.queue=[];
  if(!Array.isArray(db.audit))db.audit=[];
  db.queue.push({
    action,
    at:new Date().toISOString()
  });
  db.audit.unshift({
    action,
    at:new Date().toLocaleString("fr-FR")
  });
  db.audit=db.audit.slice(0,80);
  localStorage.setItem(KEY,JSON.stringify(db));
  localStorage.setItem("vc_dirty","1");
  render();
  updateStatus();}
function toast(s){let t=document.getElementById("toast");t.textContent=s;t.style.display="block";setTimeout(()=>t.style.display="none",2400)}
function showPage(p){document.querySelectorAll(".section").forEach(x=>x.classList.remove("active"));document.getElementById(p).classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===p));}
function val(id){return document.getElementById(id).value.trim()}
function saveFarm(){
  db.farm={
    ...db.farm,
    name:val("farmName").trim(),
    owner:val("farmOwner").trim(),
    manager:val("farmManager").trim(),
    phone:val("farmPhone").trim(),
    email:val("farmEmail").trim(),
    type:val("farmType"),
    province:val("farmProvince").trim(),
    city:val("farmCity").trim(),
    commune:val("farmCommune").trim(),
    neighborhood:val("farmNeighborhood").trim(),
    address:val("farmAddress").trim(),
    area:Number(val("farmArea")||0),
    capacity:Number(val("farmCapacity")||0),
    count:Number(val("farmCount")||0),
    buildings:Number(val("farmBuildings")||0),
    creationDate:val("farmCreationDate"),
    description:val("farmDescription").trim()};
  persist("Informations de la ferme enregistrées");
  toast("Informations de la ferme enregistrées avec succès.");}
function addAnimal(){
  const qty=Number(val("animalQty"));
  const kind=val("animalKind");
  const nextDate=val("animalNextDate");
  if(!Number.isInteger(qty)||qty<0){
    return toast("Indiquez un effectif valide.");}
  if(!db.animals) db.animals=[];
  db.animals.unshift({
    id:Date.now(),
    kind:kind,
    date:val("animalDate")||new Date().toISOString().slice(0,10),
    nextDate:nextDate,
    qty:qty,
    batch:val("animalBatch"),
    product:val("animalProduct"),
    note:val("animalNote")});
  persist("Opération sanitaire enregistrée");
  ["animalQty","animalBatch","animalProduct","animalNote","animalNextDate"].forEach(id=>{
    document.getElementById(id).value="";});
  toast("Suivi sanitaire enregistré avec succès.");}
function addLivestock(){
  const qty=Number(val("livestockQty"));
  const species=val("livestockSpecies");
  const category=val("livestockCategory");
  if(!Number.isInteger(qty)||qty<1){
    return toast("Indiquez un nombre entier d'animaux supérieur à zéro.");}
  if(!db.livestock) db.livestock=[];
  db.livestock.unshift({
    id:Date.now(),
    species:species,
    category:category,
    qty:qty,
    batch:val("livestockBatch"),
    origin:val("livestockOrigin"),
    date:val("livestockDate")||new Date().toISOString().slice(0,10),
    note:val("livestockNote")});
  persist("Animaux enregistrés");
  ["livestockQty","livestockBatch","livestockOrigin","livestockNote"].forEach(id=>{
    document.getElementById(id).value="";});
  toast("Animaux enregistrés avec succès.");}
function addEquipment(){
  const qty=Number(val("equipmentQty"));
  const name=val("equipmentName").trim();
  if(!name){
    return toast("Indiquez le nom du matériel.");}
  if(!Number.isInteger(qty)||qty<1){
    return toast("Indiquez une quantité entière supérieure à zéro.");}
  if(!db.equipment) db.equipment=[];
  db.equipment.unshift({
    category:val("equipmentCategory"),
    name:name,
    qty:qty,
    state:val("equipmentState"),
    date:val("equipmentDate")||new Date().toISOString().slice(0,10),
    note:val("equipmentNote")
  });
  persist("Matériel enregistré");
  ["equipmentName","equipmentQty","equipmentNote"].forEach(id=>{
    document.getElementById(id).value="";});
  toast("Matériel enregistré avec succès.");}
function addFinance(){let amount=+val("finAmount");if(!(amount>0))return toast("Montant invalide.");db.finance.unshift({type:val("finType"),category:val("finCategory"),amount,date:val("finDate")||new Date().toISOString().slice(0,10),note:val("finNote")});persist("Opération financière ajoutée");toast("Opération enregistrée.");}
function addProduct(){if(!val("prodName")||!(+val("prodPrice")>=0))return toast("Complétez le nom et le prix.");db.products.unshift({name:val("prodName"),price:+val("prodPrice"),qty:+val("prodQty"),seller:val("prodSeller"),desc:val("prodDesc"),at:new Date().toLocaleString("fr-FR")});persist("Produit publié");toast("Produit publié dans le catalogue local.");}
function addClient(){
  const name=val("clientName").trim();
  const phone=val("clientPhone").trim();
  if(!name){
    return toast("Veuillez saisir le nom du client.");}
  if(!db.clients) db.clients=[];
  db.clients.unshift({
    id:Date.now(),
    name:name,
    phone:phone,
    address:val("clientAddress").trim(),
    date:new Date().toISOString().slice(0,10)});
  persist("Nouveau client enregistré");
  ["clientName","clientPhone","clientAddress"].forEach(id=>{
    document.getElementById(id).value="";});
  toast("Client enregistré avec succès.");}
function addOrder(){
  const client=val("orderClient").trim();
  const product=val("orderProduct").trim();
  const qty=Number(val("orderQty"));
  const price=Number(val("orderPrice"));
  if(!client){
    return toast("Veuillez indiquer le nom du client.");}
  if(!product){
    return toast("Veuillez indiquer le produit commandé.");}
  if(!Number.isInteger(qty)||qty<1){
    return toast("Indiquez une quantité entière supérieure à zéro.");}
  if(!Number.isFinite(price)||price<=0){
    return toast("Indiquez un prix unitaire supérieur à zéro.");}
  if(!db.orders) db.orders=[];
  db.orders.unshift({
    id:Date.now(),
    client:client,
    product:product,
    qty:qty,
    price:price,
    total:qty*price,
    date:val("orderDate")||new Date().toISOString().slice(0,10),
    status:val("orderStatus")
  });
  persist("Nouvelle commande enregistrée");
  ["orderClient","orderProduct","orderQty","orderPrice","orderDate"]
    .forEach(id=>document.getElementById(id).value="");
  toast("Commande enregistrée avec succès.");
    }
function addReview(){if(!val("reviewName")||!val("reviewText"))return toast("Nom et témoignage requis.");db.reviews.unshift({name:val("reviewName"),product:val("reviewProduct"),text:val("reviewText"),at:new Date().toLocaleString("fr-FR")});persist("Témoignage ajouté");toast("Témoignage enregistré.");}
function sendMessage(){if(!val("chatText"))return;db.messages.push({text:val("chatText"),at:new Date().toLocaleString("fr-FR"),from:"Moi"});document.getElementById("chatText").value="";persist("Message local enregistré");}
function callInfo(kind){toast("Appel "+kind+" : serveur WebRTC non encore configuré.");}
function sums(){let inc=db.finance.filter(x=>x.type==="income").reduce((a,x)=>a+x.amount,0),exp=db.finance.filter(x=>x.type==="expense").reduce((a,x)=>a+x.amount,0);return {inc,exp,bal:inc-exp};}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){let s=sums();document.getElementById("dashAnimals").textContent=Number(db.farm.count||0).toLocaleString();document.getElementById("dashRecords").textContent=db.animals.length.toLocaleString();["dashExpenses","expenseTotal"].forEach(id=>document.getElementById(id).textContent=s.exp.toFixed(2)+" $");["dashIncome","incomeTotal"].forEach(id=>document.getElementById(id).textContent=s.inc.toFixed(2)+" $");document.getElementById("balanceTotal").textContent=s.bal.toFixed(2)+" $";
const farm=db.farm||{};
document.getElementById("farmSaved").textContent=
  farm.name
  ?`Ferme active : ${farm.name} — ${farm.address||"adresse non précisée"}`
  :"Aucune ferme configurée.";
if(!document.activeElement.closest("#farm")){
  const farmFields={
    farmName:farm.name,
    farmOwner:farm.owner,
    farmManager:farm.manager,
    farmPhone:farm.phone,
    farmEmail:farm.email,
    farmType:farm.type,
    farmProvince:farm.province,
    farmCity:farm.city,
    farmCommune:farm.commune,
    farmNeighborhood:farm.neighborhood,
    farmAddress:farm.address,
    farmArea:farm.area,
    farmCapacity:farm.capacity,
    farmCount:farm.count,
    farmBuildings:farm.buildings,
    farmCreationDate:farm.creationDate,
    farmDescription:farm.description
  };
  Object.entries(farmFields).forEach(([id,value])=>{
    const field=document.getElementById(id);
    if(field && value!==undefined && value!==null){
      field.value=value;
    }
  });
}
document.getElementById("recentActivity").innerHTML=db.audit.length?db.audit.slice(0,5).map(x=>`<p>• ${esc(x.action)} <span class="muted">— ${esc(x.at)}</span></p>`).join(""):"Aucune activité enregistrée.";
document.getElementById("financeList").innerHTML=db.finance.length?`<table><tr><th>Date</th><th>Nature</th><th>Catégorie</th><th>Montant</th><th>Note</th></tr>${db.finance.map(x=>`<tr><td>${esc(x.date)}</td><td>${x.type==="income"?"Revenu":"Dépense"}</td><td>${esc(x.category)}</td><td>${x.amount.toFixed(2)} $</td><td>${esc(x.note)}</td></tr>`).join("")}</table>`:"Aucune opération.";
document.getElementById("productList").innerHTML=db.products.length?db.products.map((x,i)=>`<div class="product"><div><b>${esc(x.name)}</b><div class="small muted">${esc(x.seller)} · ${x.qty} disponible(s)<br>${esc(x.desc)}</div><div class="small">💬 <button class="secondary" onclick="commentProduct(${i})">Commenter / commander</button></div></div><b>${x.price.toFixed(2)} $</b></div>`).join(""):"Aucun produit publié.";
const clientsTotal=(db.clients||[]).length;
document.getElementById("clientTotal").textContent=
  clientsTotal.toLocaleString("fr-FR")+
  (clientsTotal<=1?" client":" clients");
document.getElementById("clientList").innerHTML=
  db.clients&&db.clients.length
  ?db.clients.map(x=>`
    <div style="padding:10px 0;border-bottom:1px solid #ddd">
      <b>${esc(x.name)}</b>
      <br>Téléphone : ${esc(x.phone||"Non renseigné")}
      <br>Adresse : ${esc(x.address||"Non renseignée")}
      <br>Date d'inscription : ${esc(x.date)}
    </div>
  `).join("")
  :"Aucun client enregistré.";
const ordersTotal=(db.orders||[]).length;
document.getElementById("orderTotal").textContent=
  ordersTotal.toLocaleString("fr-FR")+
  (ordersTotal<=1?" commande":" commandes");
document.gdocument.getElementById("orderList").innerHTML=
  db.orders&&db.orders.length
  ?db.orders.map(x=>`
    <div style="padding:10px 0;border-bottom:1px solid #ddd">
      <b>${esc(x.client)}</b>
      <br>Produit : ${esc(x.product)}
      <br>Quantité : ${Number(x.qty||0)}
      <br>Prix unitaire : ${Number(x.price||0).toFixed(2)} $
      <br>Montant total : <b>${Number(x.total||0).toFixed(2)} $</b>
      <br>Date : ${esc(x.date)}
      <br>Statut : ${esc(x.status)}
    </div>
  `).join("")
  :"Aucune commande enregistrée.";
document.getElementById("animalList").innerHTML=
  db.animals&&db.animals.length
  ?db.animals.map(x=>`
    <div class="card" style="margin-bottom:10px">
      <p>
        <span class="tag">${esc(x.kind||"Opération sanitaire")}</span>
        <strong>${esc(x.date||"Date non précisée")}</strong>
      </p>
      <p><strong>Effectif concerné :</strong> ${Number(x.qty||0)} animal(aux)</p>
      <p><strong>Prochaine intervention :</strong>
        ${x.nextDate?esc(x.nextDate):"Aucune date programmée"}
        ${x.nextDate&&x.nextDate<new Date().toISOString().slice(0,10)
          ?'<span class="tag">En retard</span>'
          :''}
      </p>
      <p><strong>Bande / bâtiment :</strong> ${esc(x.batch||"Non précisé")}</p>
      <p><strong>Vaccin / médicament / produit :</strong> ${esc(x.product||"Non précisé")}</p>
      <p><strong>Observations :</strong> ${esc(x.note||"Aucune observation")}</p>
    </div>
  `).join("")
  :"Aucun suivi sanitaire enregistré.";
document.getElementById("reviewList").innerHTML=db.reviews.length?db.reviews.map(x=>`<p><b>${esc(x.name)}</b> <span class="muted small">· ${esc(x.product)} · ${esc(x.at)}</span><br>${esc(x.text)}</p>`).join(""):"Aucun avis.";
document.getElementById("chatList").innerHTML=db.messages.length?db.messages.map(x=>`<p><b>${esc(x.from)}</b> <span class="muted">${esc(x.at)}</span><br>${esc(x.text)}</p>`).join(""):"Aucun message.";
document.getElementById("auditList").innerHTML=db.audit.length?db.audit.slice(0,30).map(x=>`<p>• ${esc(x.at)} — ${esc(x.action)}</p>`).join(""):"Aucune activité.";
document.getElementById("aiFinance").innerHTML=`Revenus : <b>${s.inc.toFixed(2)} $</b> · Dépenses : <b>${s.exp.toFixed(2)} $</b> · Solde : <b>${s.bal.toFixed(2)} $</b><p class="small muted">${s.bal<0?"Attention : les dépenses dépassent les revenus saisis.":"Surveillez régulièrement le coût des aliments, de l’eau, des soins et les pertes de votre exploitation."}</p>`;
const livestockTotal=(db.livestock||[]).reduce((sum,x)=>sum+Number(x.qty||0),0);
document.getElementById("livestockTotal").textContent=
  livestockTotal.toLocaleString("fr-FR")+" animal(aux)";
document.getElementById("livestockList").innerHTML=
  db.livestock&&db.livestock.length
  ?db.livestock.map(x=>`
    <p>
      <b>${esc(x.species)}</b> — ${esc(x.category)}
      <br>Effectif : ${Number(x.qty).toLocaleString("fr-FR")}
      <br>Bande : ${esc(x.batch||"Non précisée")}
      <br>Date : ${esc(x.date)}
      <br>${esc(x.note||"")}
    </p>
  `).join("")
  :"Aucun animal enregistré.";
const equipmentTotal=(db.equipment||[]).reduce(
  (sum,x)=>sum+Number(x.qty||0),0
);
document.getElementById("equipmentTotal").textContent=
  equipmentTotal.toLocaleString("fr-FR")+
  (equipmentTotal<=1?" matériel":" matériels");
document.getElementById("equipmentList").innerHTML=
  db.equipment&&db.equipment.length
  ?db.equipment.map(x=>`
    <p>
      <b>${esc(x.name)}</b>
      <br>Catégorie : ${esc(x.category)}
      <br>Quantité : ${Number(x.qty).toLocaleString("fr-FR")}
      <br>État : ${esc(x.state)}
      <br>Date d'acquisition : ${esc(x.date)}
      <br>Observations : ${esc(x.note||"Aucune")}
    </p>
  `).join("")
  :"Aucun équipement enregistré.";
 document.getElementById("queueCount").textContent=
  db.queue.length+" opération(s) en attente";
generateHealthNotifications();
const healthNotifications=document.getElementById("healthNotifications");
const notificationHistory=document.getElementById("notificationHistory");
const healthAlerts=(db.notifications||[])
  .filter(n=>n.type==="Santé");
if(healthNotifications){
  healthNotifications.innerHTML=healthAlerts.length
    ?healthAlerts.map(n=>`
      <div class="card" style="margin-bottom:10px">
        <strong>${esc(n.title)}</strong>
        <p>${esc(n.message)}</p>
        <small>${esc(n.date||"Date non précisée")}</small>
      </div>
    `).join("")
    :"Aucune alerte sanitaire pour le moment.";
}
if(notificationHistory){
  const unreadCount=(db.notifications||[])
    .filter(n=>!n.read).length;
  notificationHistory.innerHTML=(db.notifications||[]).length
    ?`
      ${unreadCount>0?`
        <button class="secondary"
          onclick="markAllNotificationsRead()">
          Tout marquer comme lu
        </button>
      `:""}
      ${(db.notifications||[]).map(n=>`
        <div class="card" style="margin-bottom:10px">
          <strong>${esc(n.title)}</strong>
          <p>${esc(n.message)}</p>
          <small>${esc(n.createdAt||"Date non précisée")}</small>
          <p><span class="tag">${n.read?"Lue":"Non lue"}</span></p>
          ${!n.read?`
            <button class="secondary"
              onclick="markNotificationRead('${esc(n.id)}')">
              Marquer comme lue
            </button>
          `:""}
        </div>
      `).join("")}
    `
    :"Aucune notification enregistrée.";}
updateNotificationCount();}
function commentProduct(i){
  let p=db.products[i];
  if(!p)return toast("Produit introuvable.");
  let c=prompt("Votre commentaire ou demande de commande pour "+p.name);
  if(c){
    if(!Array.isArray(db.reviews))db.reviews=[];
    db.reviews.unshift({
      name:"Visiteur local",
      product:p.name,
      text:c,
      at:new Date().toLocaleString("fr-FR")});
    persist("Commentaire sur produit");
    toast("Commentaire enregistré.");}}
function updateStatus(){
  let online=navigator.onLine;
  const status=document.getElementById("syncStatus");
  if(!status)return;
  status.textContent=online
    ?"● Connecté (mode local)"
    :"● Hors connexion";
  status.style.background=online
    ?"#ffffff20"
    :"#7b4a1b";}
function getLocation(){if(!navigator.geolocation)return toast("GPS non disponible.");navigator.geolocation.getCurrentPosition(pos=>{db.gps={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy,at:new Date().toISOString()};document.getElementById("gpsOutput").textContent=`Latitude : ${db.gps.lat.toFixed(6)} · Longitude : ${db.gps.lon.toFixed(6)} · précision ±${Math.round(db.gps.accuracy)} m`;document.getElementById("mapBox").innerHTML=`📍 Position obtenue<br>${db.gps.lat.toFixed(5)}, ${db.gps.lon.toFixed(5)}<br><span class="small">Carte à connecter au déploiement.</span>`;persist("Position GPS enregistrée");},e=>toast("GPS refusé ou indisponible : "+e.message),{enableHighAccuracy:true,timeout:12000});}
function startTracking(){if(!navigator.geolocation)return toast("GPS non disponible.");if(watchId!==null)return toast("Suivi déjà actif.");watchId=navigator.geolocation.watchPosition(p=>{db.gps={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,at:new Date().toISOString()};document.getElementById("gpsOutput").textContent=`Suivi actif · ${db.gps.lat.toFixed(6)}, ${db.gps.lon.toFixed(6)} · précision ±${Math.round(db.gps.accuracy)} m`;localStorage.setItem(KEY,JSON.stringify(db));},e=>toast(e.message),{enableHighAccuracy:true,maximumAge:5000});toast("Suivi GPS activé pour cette session.");}
function stopTracking(){if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;}toast("Suivi GPS arrêté.");}
function addBoundaryPoint(){if(!navigator.geolocation)return toast("GPS non disponible.");navigator.geolocation.getCurrentPosition(p=>{db.boundary.push({lat:p.coords.latitude,lon:p.coords.longitude});persist("Point de limite terrain ajouté");document.getElementById("areaOutput").textContent=db.boundary.length+" point(s) de limite enregistré(s).";toast("Point GPS ajouté.");},e=>toast(e.message),{enableHighAccuracy:true});}
function calculateArea(){if(db.boundary.length<3)return toast("Ajoutez au moins 3 points GPS.");let pts=db.boundary,lat0=pts.reduce((a,p)=>a+p.lat,0)/pts.length*Math.PI/180,xy=pts.map(p=>[p.lon*Math.PI/180*6378137*Math.cos(lat0),p.lat*Math.PI/180*6378137]);let area=0;for(let i=0;i<xy.length;i++){let j=(i+1)%xy.length;area+=xy[i][0]*xy[j][1]-xy[j][0]*xy[i][1]}area=Math.abs(area/2);document.getElementById("areaOutput").textContent=`${pts.length} points · superficie estimée : ${area.toFixed(1)} m² (${(area/10000).toFixed(4)} ha). Résultat indicatif, à vérifier par un géomètre.`;}
function analyzeImage(){let f=document.getElementById("aiImage").files[0],ctx=val("aiContext");if(!f&&!ctx)return toast("Ajoutez une image ou une observation.");document.getElementById("aiResult").innerHTML=`<div class="notice">Dossier d'analyse préparé : ${f?esc(f.name):"aucune image"}<br>Observation : ${esc(ctx||"non précisée")}<br><br>Résultat IA non disponible dans cette version hors ligne. Une analyse fiable nécessite l'envoi sécurisé au service IA, l'identification du contexte (âge, espèce, symptômes) et une validation par un vétérinaire. Ne prenez pas de décision thérapeutique sur cette démonstration.</div>`;persist("Demande d'analyse IA préparée");}
function exportData(){let blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="volaconnect-sauvegarde.json";a.click();URL.revokeObjectURL(a.href);}
function importDataPrompt(){let inp=document.createElement("input");inp.type="file";inp.accept="application/json";inp.onchange=()=>{let r=new FileReader();r.onload=()=>{try{db={...emptyDB(),...JSON.parse(r.result)};localStorage.setItem(KEY,JSON.stringify(db));render();toast("Sauvegarde importée.");}catch(e){toast("Fichier JSON invalide.");}};r.readAsText(inp.files[0]);};inp.click();}
function clearData(){if(confirm("Effacer toutes les données enregistrées sur cet appareil ?")){db=emptyDB();localStorage.setItem(KEY,JSON.stringify(db));render();toast("Données locales effacées.");}}
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
if(db.farm.name){farmName.value=db.farm.name;farmOwner.value=db.farm.owner||"";farmType.value=db.farm.type||farmType.value;farmCount.value=db.farm.count||"";farmAddress.value=db.farm.address||"";}
render();updateStatus();document.getElementById("animalDate").value=new Date().toISOString().slice(0,10);document.getElementById("finDate").value=new Date().toISOString().slice(0,10);
/* VolaConnect: langues, compte cloud et synchronisation versionnée. */
const LANGS={
 fr:{nav:['Tableau de bord','Ma ferme','Cheptel & santé','Finances','Marché','Clients & avis','Localisation','Messages','Assistant IA','Administration'],h1:'Bienvenue sur VolaConnect',h2:['Espace ferme','Cheptel, bandes et santé','Comptabilité de la ferme','Marché des produits avicoles','Espace clients, commentaires et témoignages','Géolocalisation et terrain d’élevage','Communication','Assistant IA agricole','Administration et sécurité'],labels:['Nom de la ferme','Responsable','Type d’élevage','Effectif actuel','Adresse / quartier','Type d’opération','Date','Effectif concerné / quantité','Bande / bâtiment','Produit, observation ou commentaire','Nature','Catégorie','Montant (USD)','Note / référence','Produit','Prix (USD)','Quantité disponible','Vendeur / ferme','Description','Nom du client','Produit / ferme concerné','Témoignage ou commentaire','Votre message'],buttons:{saveFarm:'Enregistrer la ferme',addAnimal:'Enregistrer le suivi',addFinance:'Ajouter à l’historique',addProduct:'Publier le produit',addReview:'Publier le témoignage',sendMessage:'Envoyer',getLocation:'Obtenir ma position GPS',startTracking:'Activer le suivi pendant cette session',stopTracking:'Arrêter le suivi',analyzeImage:'Préparer l’analyse'}},
 en:{nav:['Dashboard','My farm','Livestock & health','Finances','Marketplace','Customers & reviews','Location','Messages','AI assistant','Administration'],h1:'Welcome to VolaConnect',h2:['Farm space','Livestock, batches & health','Farm accounting','Poultry products marketplace','Customer space, comments & testimonials','Geolocation & farm plot','Communication','Agricultural AI assistant','Administration & security'],labels:['Farm name','Manager','Type of livestock','Current headcount','Address / area','Operation type','Date','Affected animals / quantity','Batch / building','Product, observation or comment','Type','Category','Amount (USD)','Note / reference','Product','Price (USD)','Available quantity','Seller / farm','Description','Customer name','Related product / farm','Testimonial or comment','Your message'],buttons:{saveFarm:'Save farm',addAnimal:'Save record',addFinance:'Add to history',addProduct:'Publish product',addReview:'Publish testimonial',sendMessage:'Send',getLocation:'Get my GPS position',startTracking:'Enable tracking for this session',stopTracking:'Stop tracking',analyzeImage:'Prepare analysis'}},
 sw:{nav:['Dashibodi','Shamba langu','Mifugo na afya','Fedha','Soko','Wateja na maoni','Mahali','Ujumbe','Msaidizi wa AI','Usimamizi'],h1:'Karibu VolaConnect',h2:['Sehemu ya shamba','Mifugo, makundi na afya','Hesabu za shamba','Soko la bidhaa za kuku','Wateja, maoni na ushuhuda','Mahali na eneo la shamba','Mawasiliano','Msaidizi wa AI wa kilimo','Usimamizi na usalama'],labels:['Jina la shamba','Msimamizi','Aina ya ufugaji','Idadi ya sasa','Anwani / eneo','Aina ya shughuli','Tarehe','Idadi / kiasi','Kundi / banda','Bidhaa, uchunguzi au maoni','Aina','Kategoria','Kiasi (USD)','Dokezo / rejea','Bidhaa','Bei (USD)','Kiasi kilichopo','Muuzaji / shamba','Maelezo','Jina la mteja','Bidhaa / shamba husika','Ushuhuda au maoni','Ujumbe wako'],buttons:{saveFarm:'Hifadhi shamba',addAnimal:'Hifadhi taarifa',addFinance:'Ongeza kwenye historia',addProduct:'Chapisha bidhaa',addReview:'Chapisha ushuhuda',sendMessage:'Tuma',getLocation:'Pata eneo langu la GPS',startTracking:'Washa ufuatiliaji kwa kipindi hiki',stopTracking:'Simamisha ufuatiliaji',analyzeImage:'Andaa uchambuzi'}},
 ln:{nav:['Etando ya mosala','Ferme na ngai','Bitumba mpe bokolɔngɔnɔ','Mbongo','Zando','Bakiliya mpe makanisi','Esika','Bansango','Mosungi IA','Boyangeli'],h1:'Boyei malamu na VolaConnect',h2:['Esika ya ferme','Bitumba, bituluku mpe bokolɔngɔnɔ','Mikanda ya mbongo ya ferme','Zando ya biloko ya nsoso','Bakiliya, makanisi mpe litatoli','Esika mpe mabele ya bokóli','Kosolola','Mosungi IA ya bilanga','Boyangeli mpe bokengi'],labels:['Kombo ya ferme','Mokambi','Lolenge ya bokóli','Motango ya sikoyo','Adresɛ / quartier','Lolenge ya mosala','Mokolo','Motango / bonene','Etuluku / ndako','Eloko, botali to makanisi','Lolenge','Etuluku','Motango (USD)','Liyebisi / référence','Eloko','Ntalo (USD)','Motango oyo etikali','Motɛki / ferme','Ndimbola','Kombo ya client','Eloko / ferme oyo etali','Litatoli to makanisi','Nsango na yo'],buttons:{saveFarm:'Bomba ferme',addAnimal:'Bomba bolandi',addFinance:'Bakisa na lisolo',addProduct:'Tinda eloko na zando',addReview:'Tinda litatoli',sendMessage:'Tinda',getLocation:'Luka esika na GPS',startTracking:'Fungola bolandi mpo na session oyo',stopTracking:'Kanga bolandi',analyzeImage:'Bongisa botali'}},
 bem:{nav:['Ichibukisho','Ifamu yandi','Imfuyo na bumi','Indalama','Icitolo','Abakashi na amashiwi','Ukufika','Amashiwi','Umwafwilishi wa AI','Imilimo'],h1:'Mwaiseni ku VolaConnect',h2:['Umulimo wa ifamu','Imfuyo, imitundu na bumi','Amabuku ya ndalama ya ifamu','Icitolo ca fipasho fya nkoko','Abakashi, amashiwi na ubunte','Ukufika na icifulo ca ifamu','Ukulanshanya','Umwafwilishi wa AI wa bulimi','Imilimo na ukupususha'],labels:['Ishina lya ifamu','Umupashi wa milimo','Ubushiku bwa mfuyo','Umubala wa ino nshita','Aderesi / icifulo','Ubushiku bwa mulimo','Ubushiku','Umubala / ubunono','Umulwi / inanda','Icipasho, ukulolesha nangu amashiwi','Ubushiku','Umulungu','Indalama (USD)','Ilyashi / reference','Icipasho','Umulilo (USD)','Umubala uuli','Umushitishi / ifamu','Ukulondolola','Ishina lya mukashitisha','Icipasho / ifamu','Ubufumya nangu amashiwi','Ubutumwa bwenu'],buttons:{saveFarm:'Sungila ifamu',addAnimal:'Sungila ukulondolola',addFinance:'Bika mu malembelo',addProduct:'Langa icipasho',addReview:'Langa ubunte',sendMessage:'Tumina',getLocation:'Sanga GPS yandi',startTracking:'Tendeka ukulondolola muli iyi nshita',stopTracking:'Imya ukulondolola',analyzeImage:'Lungika ukupima'}}
};
function applyLanguage(lang){lang=LANGS[lang]?lang:'fr';localStorage.setItem('vc_language',lang);document.documentElement.lang=lang;const t=LANGS[lang];document.querySelectorAll('#nav button').forEach((b,i)=>{if(t.nav[i])b.textContent=b.textContent.replace(/^.*?(?=\s)/,'')?b.textContent.replace(/(?<=\s).*/,t.nav[i]):t.nav[i]});const h1=document.querySelector('#dashboard h1');if(h1)h1.textContent=t.h1;document.querySelectorAll('section.section > h2').forEach((el,i)=>{if(t.h2[i])el.textContent=el.textContent.replace(/^[^A-Za-zÀ-ÿ]+/,'')?el.textContent.replace(/(?<=\s).*/,t.h2[i]):t.h2[i]});let labelIndex=0;document.querySelectorAll('label').forEach(el=>{if(el.closest('#admin')||el.closest('header'))return;if(t.labels[labelIndex])el.textContent=t.labels[labelIndex];labelIndex++});const fnMap={saveFarm:'saveFarm',addAnimal:'addAnimal',addFinance:'addFinance',addProduct:'addProduct',addReview:'addReview',sendMessage:'sendMessage',getLocation:'getLocation',startTracking:'startTracking',stopTracking:'stopTracking',analyzeImage:'analyzeImage'};for(const [key,fn] of Object.entries(fnMap)){const el=document.querySelector(`[onclick^="${fn}("]`);if(el&&t.buttons[key])el.textContent=t.buttons[key]} }
const languageSelect=document.getElementById('languageSelect');languageSelect.value=localStorage.getItem('vc_language')||'fr';languageSelect.addEventListener('change',()=>applyLanguage(languageSelect.value));applyLanguage(languageSelect.value);
const API_DEFAULT='https://volaconnect-api.onrender.com';
function apiRoot(){
 const field=document.getElementById('apiBase');
 return ((field?.value || localStorage.getItem('vc_api_base') || API_DEFAULT).trim()).replace(/\/+$/,'');
}
function cloudMessage(s){const el=document.getElementById('cloudStatus');if(el)el.textContent=s}
function cloudHeaders(){return {'Content-Type':'application/json','Authorization':'Bearer '+sessionStorage.getItem('vc_token')}}
async function cloudRequest(path,options={}){const base=apiRoot();if(!base)throw new Error('Configurez d’abord l’adresse HTTPS de votre API.');localStorage.setItem('vc_api_base',base);const r=await fetch(base+path,{...options,headers:{...cloudHeaders(),...(options.headers||{})}});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||('Erreur serveur '+r.status));return d}
async function createCloudAccount(){try{const name=document.getElementById('accountName').value.trim(),email=document.getElementById('accountEmail').value.trim(),password=document.getElementById('accountPassword').value;if(!name||!email||password.length<12)throw new Error('Nom, e-mail et mot de passe de 12 caractères minimum requis.');localStorage.setItem('vc_api_base',apiRoot());const r=await fetch(apiRoot()+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName:name,email,password,role:'farmer'})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Inscription impossible');sessionStorage.setItem('vc_token',d.token);cloudMessage('Compte créé et connecté : '+d.user.email);toast('Compte VolaConnect créé.');await syncCloudNow()}catch(e){cloudMessage(e.message);toast(e.message)}}
async function loginCloudAccount(){try{const email=document.getElementById('accountEmail').value.trim(),password=document.getElementById('accountPassword').value;if(!email||!password)throw new Error('Saisissez votre e-mail et votre mot de passe.');localStorage.setItem('vc_api_base',apiRoot());const r=await fetch(apiRoot()+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Connexion impossible');sessionStorage.setItem('vc_token',d.token);cloudMessage('Connecté : '+d.user.email);toast('Connexion réussie.');await syncCloudNow()}catch(e){cloudMessage(e.message);toast(e.message)}}
async function syncCloudNow(){
  try {
    if(!sessionStorage.getItem('vc_token'))
      throw new Error('Connectez-vous à votre compte avant la synchronisation.');
    if(!navigator.onLine)
      throw new Error('Internet est indisponible.');
    cloudMessage('Synchronisation en cours…');
    const remote = await cloudRequest('/api/sync/snapshot');
    const dirty = localStorage.getItem('vc_dirty') === '1';
    const knownVersion = Number(localStorage.getItem('vc_cloud_version') || 0);
    const remoteVersion = Number(remote.version || 0);
    const localHasData = !!(
  db.farm?.name ||
  (db.animals||[]).length ||
  (db.livestock||[]).length ||
  (db.equipment||[]).length ||
  (db.clients||[]).length ||
  (db.orders||[]).length ||
  (db.finance||[]).length ||
  (db.products||[]).length ||
  (db.reviews||[]).length ||
  (db.messages||[]).length ||
  (db.notifications||[]).length);
    // Cas 1 : les données locales sont déjà synchronisées.
    if(!dirty && remoteVersion > 0 && remoteVersion === knownVersion){
      cloudMessage('Vos données sont déjà synchronisées. Version cloud ' + remoteVersion + '.');
      return;
    }
    // Cas 2 : le cloud possède une version plus récente.
    if(remoteVersion > 0 && remote.data && !dirty && remoteVersion !== knownVersion){
      if(localHasData && !confirm('Une nouvelle sauvegarde cloud existe. Télécharger cette version ?')){
        cloudMessage('Synchronisation annulée. Vos données locales sont conservées.');
        return;
      }
      db = {...emptyDB(), ...remote.data};
      localStorage.setItem(KEY, JSON.stringify(db));
      localStorage.setItem('vc_cloud_version', String(remoteVersion));
      localStorage.removeItem('vc_dirty');
      render();
      cloudMessage('Sauvegarde cloud téléchargée. Version ' + remoteVersion + '.');
      return;
    }
    // Cas 3 : aucune donnée locale, mais une sauvegarde cloud existe.
    if(remoteVersion > 0 && remote.data && dirty && !localHasData){
      db = {...emptyDB(), ...remote.data};
      localStorage.setItem(KEY, JSON.stringify(db));
      localStorage.setItem('vc_cloud_version', String(remoteVersion));
      localStorage.removeItem('vc_dirty');
      render();
      cloudMessage('Sauvegarde cloud téléchargée.');
      return;
    }
    // Cas 4 : conflit entre les modifications locales et le cloud.
    if(dirty && remoteVersion !== knownVersion && localHasData){
      if(remoteVersion > 0 && remote.data && confirm('Le cloud a changé. Télécharger la dernière sauvegarde ?')){
        db = {...emptyDB(), ...remote.data};
        localStorage.setItem(KEY, JSON.stringify(db));
        localStorage.setItem('vc_cloud_version', String(remoteVersion));
        localStorage.removeItem('vc_dirty');
        render();
        cloudMessage('Sauvegarde cloud téléchargée.');
        return;
      }
      throw new Error('Conflit de synchronisation. Vos données locales sont conservées.');
    }
    // Cas 5 : envoyer les modifications locales vers le cloud.
    const result = await cloudRequest('/api/sync/snapshot',{
      method:'PUT',
      body:JSON.stringify({
        baseVersion:remoteVersion,
        data:db
      })
    });
    localStorage.setItem('vc_cloud_version', String(result.version));
    localStorage.removeItem('vc_dirty');
    db.queue = [];
    localStorage.setItem(KEY, JSON.stringify(db));
    render();
    cloudMessage('Synchronisation terminée. Version cloud ' + result.version + '.');
    toast('Données synchronisées.');
  } catch(e) {
    cloudMessage(e.message);
    toast(e.message);
  }
  }
function logoutCloudAccount(){sessionStorage.removeItem('vc_token');cloudMessage('Compte déconnecté. Les données locales ne sont pas effacées.');toast('Déconnexion effectuée.')}
const apiField=document.getElementById('apiBase');
if(apiField) apiField.value=localStorage.getItem('vc_api_base')||API_DEFAULT;
function diagnosticSync(){
  const total=(db.livestock||[]).reduce(
    (s,x)=>s+Number(x.qty||0),0
  );
  alert(
    "ÉTAT DE SYNCHRONISATION\n"+
    "Données modifiées : "+localStorage.getItem("vc_dirty")+"\n"+
    "Version cloud locale : "+localStorage.getItem("vc_cloud_version")+"\n"+
    "Enregistrements animaux : "+(db.livestock||[]).length+"\n"+
    "Effectif total : "+total
  );}
document.addEventListener("DOMContentLoaded",function(){
  document.querySelectorAll("nav button").forEach(b=>{
    b.addEventListener("click",()=>showPage(b.dataset.page));
  });
});
