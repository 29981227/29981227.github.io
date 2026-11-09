const products=[
  {id:1,icon:"🎧",name:"Wireless earbuds with charging case",price:5.98,old:19.99,rating:"★ 4.7 · 18k sold",type:"popular"},
  {id:2,icon:"💡",name:"LED motion sensor cabinet light",price:4.79,old:15.99,rating:"★ 4.8 · 31k sold",type:"popular"},
  {id:3,icon:"🧹",name:"Mini desktop vacuum cleaner",price:6.49,old:24.99,rating:"★ 4.6 · 9k sold",type:"popular"},
  {id:4,icon:"👟",name:"Lightweight running shoes",price:9.88,old:38.99,rating:"★ 4.5 · 21k sold",type:"popular"},
  {id:5,icon:"📱",name:"Magnetic phone stand for desk",price:3.48,old:10.99,rating:"★ 4.7 · 12k sold",type:"popular"},
  {id:6,icon:"🍳",name:"Silicone food clips, 6 pcs",price:2.79,old:8.99,rating:"★ 4.8 · 8k sold",type:"popular"},

  {id:7,icon:"🔌",name:"Cable organizer clips",price:1.98,old:6.99,rating:"★ 4.8 · Easy add-on",type:"easy"},
  {id:8,icon:"🧽",name:"Cleaning sponge set",price:2.49,old:7.99,rating:"★ 4.7 · Easy add-on",type:"easy"},
  {id:9,icon:"🪝",name:"Adhesive wall hooks",price:2.19,old:8.99,rating:"★ 4.8 · Easy add-on",type:"easy"},
  {id:10,icon:"🧴",name:"Travel bottle set",price:2.99,old:9.99,rating:"★ 4.6 · Easy add-on",type:"easy"},

  {id:11,icon:"🧼",name:"Lint remover brush",price:1.79,old:5.99,rating:"★ 4.7 · Under $5",type:"under5"},
  {id:12,icon:"📎",name:"Reusable cable ties",price:1.59,old:4.99,rating:"★ 4.8 · Under $5",type:"under5"},
  {id:13,icon:"🧻",name:"Mini tissue packs",price:2.29,old:6.99,rating:"★ 4.5 · Under $5",type:"under5"},
  {id:14,icon:"🧤",name:"Kitchen cleaning gloves",price:3.29,old:9.99,rating:"★ 4.7 · Under $5",type:"under5"},

  {id:15,icon:"🛡️",name:"Screen cleaning cloth",price:1.99,old:5.99,rating:"★ 4.9 · Recommended",type:"related"},
  {id:16,icon:"🔋",name:"Charging cable protector",price:2.59,old:7.99,rating:"★ 4.7 · Recommended",type:"related"},
  {id:17,icon:"📦",name:"Drawer organizer tray",price:3.49,old:11.99,rating:"★ 4.8 · Recommended",type:"related"},
  {id:18,icon:"👜",name:"Small travel pouch",price:3.89,old:12.99,rating:"★ 4.6 · Recommended",type:"related"}
];

let campaign=false;
let selected=[];
let filter="popular";
let spun=false;
let spinTimer=null;
let selectionTimer=null;
let toastTimer=null;

function cancelSpin(){
  clearTimeout(spinTimer);
  spinTimer=null;
}

function cancelSelectionPrompt(){
  clearTimeout(selectionTimer);
  selectionTimer=null;
  ["oneMoreMask","rewardMask"].forEach(id=>document.getElementById(id).classList.remove("show"));
}

function closeCampaignOverlays(){
  cancelSpin();
  cancelSelectionPrompt();
  document.querySelectorAll(".mask").forEach(mask=>mask.classList.remove("show"));
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(screen=>screen.classList.toggle("active",screen.id===id));
  document.getElementById(id).scrollTop=0;
}

function renderGrid(){
  const grid=document.getElementById("grid");
  grid.innerHTML="";
  let list;

  if(campaign && selected.length>=2){
    list=selected;
  }else{
    list=products.filter(p=>p.type===filter);
  }

  list.forEach(p=>{
    const added=selected.some(x=>x.id===p.id);
    const card=document.createElement("div");
    card.className="card";
    const btnText = campaign
      ? (added ? "Added" : selected.length===0 ? "Buy & get $300" : "Add 1 more")
      : "Add";
    card.innerHTML=`
      <div class="badge">${campaign ? "Eligible" : "Deal"}</div>
      <div class="img">${p.icon}</div>
      <div class="card-body">
        <div class="name">${p.name}</div>
        <div class="meta">${p.rating}</div>
        <div class="price-row">
          <div>
            <div class="price">$${p.price.toFixed(2)}</div>
            <div class="old">$${p.old.toFixed(2)}</div>
          </div>
          <button class="buy-btn ${added?'added':''}" onclick="addProduct(${p.id})">${btnText}</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateCampaignUI(){
  const count=selected.length;
  document.getElementById("activityBar").classList.toggle("show",campaign);
  document.getElementById("stickyCta").classList.toggle("show",campaign);
  document.getElementById("filters").classList.toggle("show",campaign && count===1);

  document.getElementById("progressCount").textContent=`${Math.min(count,2)} / 2`;
  document.getElementById("fill").style.width=count===0?"0%":count===1?"50%":"100%";

  const feedTitle=document.getElementById("feedTitle");
  const feedDesc=document.getElementById("feedDesc");
  const msg=document.getElementById("activityMsg");
  const sticky=document.getElementById("stickyText");
  const btn=document.getElementById("stickyBtn");

  if(!campaign){
    feedTitle.textContent="Recommended deals";
    feedDesc.textContent="Best sellers with free shipping";
    filter="popular";
    return;
  }

  if(count===0){
    filter="popular";
    feedTitle.textContent="Choose your first item";
    feedDesc.textContent="Buy any 2 eligible items to get your coupon bundle";
    msg.textContent="Select 2 items from this feed. Coupons are issued after successful payment.";
    sticky.innerHTML="<b>0 / 2 selected</b><br/>Buy 2 items to get your $300 coupon bundle.";
    btn.textContent="Choose 2 items";
    btn.className="primary disabled";
  }else if(count===1){
    if(filter==="popular") filter="easy";
    feedTitle.textContent="Pick your second item";
    feedDesc.textContent="Low-price add-ons to complete your offer faster";
    msg.textContent="Almost there. Add 1 more eligible item to unlock your $300 coupon bundle.";
    sticky.innerHTML="<b>1 / 2 selected</b><br/>Add 1 more item to unlock $300 coupons.";
    btn.textContent="Add 1 more item";
    btn.className="primary disabled";
  }else{
    feedTitle.textContent="Your selected items";
    feedDesc.textContent="Requirement complete. Continue to checkout.";
    msg.textContent="$300 coupon bundle unlocked. Complete payment to receive your coupons.";
    sticky.innerHTML="<b>2 / 2 selected</b><br/>$300 coupon bundle unlocked.";
    btn.textContent="Continue to checkout";
    btn.className="primary";
  }

  renderGrid();
}

function addProduct(id){
  if(!campaign){
    toast("Start the coupon event first");
    document.getElementById("spinMask").classList.add("show");
    return;
  }
  if(selected.length>=2){
    toast("Offer already qualified");
    return;
  }
  const p=products.find(x=>x.id===id);
  if(!p || selected.some(x=>x.id===id)) return;
  cancelSelectionPrompt();
  selected.push(p);
  const count=selected.length;
  toast(count===1?"Item 1 selected":"$300 coupon bundle unlocked");
  updateCampaignUI();
  selectionTimer=setTimeout(()=>{
    selectionTimer=null;
    if(!campaign || selected.length!==count || !document.getElementById("home").classList.contains("active")) return;
    if(document.querySelector(".mask.show")) return;
    document.getElementById(count===1?"oneMoreMask":"rewardMask").classList.add("show");
  },350);
}

function setFilter(next,el){
  filter=next;
  document.querySelectorAll(".filter").forEach(f=>f.classList.remove("active"));
  el.classList.add("active");
  renderGrid();
}

function spin(){
  if(spun)return;
  spun=true;
  document.getElementById("wheel").style.transform="rotate(1120deg)";
  document.getElementById("spinBtn").textContent="Claiming...";
  spinTimer=setTimeout(()=>{
    spinTimer=null;
    if(!document.getElementById("spinMask").classList.contains("show") || campaign) return;
    document.getElementById("spinMask").classList.remove("show");
    document.getElementById("taskMask").classList.add("show");
  },1050);
}

function skipSpin(){
  cancelSpin();
  spun=true;
  document.getElementById("spinMask").classList.remove("show");
  document.getElementById("taskMask").classList.add("show");
}

function startCampaign(){
  closeCampaignOverlays();
  campaign=true;
  document.getElementById("taskMask").classList.remove("show");
  updateCampaignUI();
  toast("Coupon task started");
}

function closeOneMore(){
  document.getElementById("oneMoreMask").classList.remove("show");
  updateCampaignUI();
}

function closeReward(){
  document.getElementById("rewardMask").classList.remove("show");
}

function stickyAction(){
  if(selected.length<2){
    toast(selected.length===0?"Choose your first item":"Add 1 more item");
    return;
  }
  goCheckout();
}

function goCheckout(){
  if(!campaign || selected.length<2){
    toast("Choose 2 eligible items first");
    return;
  }
  closeCampaignOverlays();
  showScreen("checkout");
  document.getElementById("stickyCta").style.display="none";
  document.getElementById("bottomNav").style.display="none";
  renderCheckout();
}

function goHome(){
  closeCampaignOverlays();
  document.querySelectorAll(".checkout-sticky").forEach(sticky=>sticky.remove());
  showScreen("home");
  document.getElementById("bottomNav").style.display="grid";
  document.getElementById("stickyCta").style.display="";
  updateCampaignUI();
}

function renderCheckout(){
  const box=document.getElementById("summaryItems");
  box.innerHTML="";
  selected.forEach(p=>{
    const row=document.createElement("div");
    row.className="row";
    row.innerHTML=`<span>${p.name}</span><strong>$${p.price.toFixed(2)}</strong>`;
    box.appendChild(row);
  });

  const subtotal=selected.reduce((s,p)=>s+p.price,0);
  const tax=subtotal*0.08;
  const total=subtotal+tax;
  document.getElementById("tax").textContent=`$${tax.toFixed(2)}`;
  document.getElementById("total").textContent=`$${total.toFixed(2)}`;

  const sticky=document.querySelector(".checkout-sticky");
  if(sticky) sticky.remove();

  const div=document.createElement("div");
  div.className="checkout-sticky";
  div.innerHTML=`
    <div class="pay-note">
      <span>Demo only: no charge or real coupons</span>
      <strong>$${total.toFixed(2)}</strong>
    </div>
    <button class="primary" onclick="placeOrder()">Complete demo order · $${total.toFixed(2)}</button>
  `;
  document.querySelector(".phone").appendChild(div);
}

function placeOrder(){
  closeCampaignOverlays();
  document.querySelectorAll(".checkout-sticky").forEach(sticky=>sticky.remove());
  document.getElementById("stickyCta").style.display="none";
  document.getElementById("bottomNav").style.display="none";
  showScreen("success");
}

function togglePay(){
  document.getElementById("morePay").classList.toggle("show");
}

function openRules(){
  cancelSelectionPrompt();
  document.getElementById("rulesMask").classList.add("show");
}

function closeRules(){
  document.getElementById("rulesMask").classList.remove("show");
}

function toast(text){
  const t=document.getElementById("toast");
  t.textContent=text;
  t.style.display="block";
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.style.display="none",1600);
}

renderGrid();
