const $=id=>document.getElementById(id);
const key="turni-pwa-v1";
let data=JSON.parse(localStorage.getItem(key)||'{"commitments":[],"breaks":[]}');
let selected=new Date("2026-10-16T00:00:00");
const cycleStartKey="cycleStart";
const labels=["Giorno","Notte","Smonto","Riposo","Riposo"];
const times=["07:00–19:50","19:15–07:15","","",""];
const credited=[740,720,0,0,0];

function iso(d){return d.toISOString().slice(0,10)}
function localDate(s){let [y,m,day]=s.split("-").map(Number);return new Date(y,m-1,day)}
function save(){localStorage.setItem(key,JSON.stringify(data))}
function start(){return localDate($(cycleStartKey).value||"2026-10-16")}
function paused(d){let x=iso(d);return data.breaks.some(b=>x>=b.start&&x<=b.end)}
function shiftIndex(d){
  const s=start();
  let cur=new Date(s), dir=d>=s?1:-1, count=0;
  while(iso(cur)!==iso(d)){
    cur.setDate(cur.getDate()+dir);
    if(!paused(cur)) count+=dir;
  }
  return ((count%5)+5)%5;
}
function shift(d){if(paused(d))return null;return shiftIndex(d)}
function fmtDate(d){return d.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}
function renderDay(){
  $("selectedDate").value=iso(selected);
  $("pageTitle").textContent=selected.toDateString()===new Date().toDateString()?"Oggi":fmtDate(selected);
  const i=shift(selected), c=$("shiftCard");
  if(i===null){c.innerHTML='<div class="shift-name">Ferie / pausa</div><div class="shift-time">Il ciclo è sospeso in questa data.</div>'; }
  else c.innerHTML=`<div class="shift-name">${labels[i]}</div><div class="shift-time">${times[i]||"Nessun turno"}</div><div class="credited">Ore conteggiate: ${fmtMin(credited[i])}</div>`;
  const arr=data.commitments.filter(x=>x.date===iso(selected)).sort((a,b)=>a.start.localeCompare(b.start));
  $("commitments").innerHTML=arr.length?arr.map((x,n)=>`<div class="commitment"><b>${esc(x.title)}</b><div>${x.start}–${x.end} · ${esc(x.type)}</div>${x.location?`<div class="muted">📍 ${esc(x.location)}</div>`:""}${x.notes?`<div class="muted">${esc(x.notes)}</div>`:""}<button onclick="delCommit(${n})" style="float:right;color:#b91c1c">Elimina</button></div>`).join(""):'<div class="card muted">Nessun impegno.</div>';
}
function fmtMin(m){return `${Math.floor(m/60)}h ${String(m%60).padStart(2,"0")}m`}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function delCommit(n){let arr=data.commitments.filter(x=>x.date===iso(selected)).sort((a,b)=>a.start.localeCompare(b.start));data.commitments.splice(data.commitments.indexOf(arr[n]),1);save();renderDay()}
function openModal(){ $("cDate").value=iso(selected);$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden")}
$("addBtn").onclick=openModal;$("addCommitment2").onclick=openModal;$("closeModal").onclick=closeModal;
$("saveCommitment").onclick=()=>{if(!$("cTitle").value.trim())return alert("Inserisci un titolo.");data.commitments.push({title:$("cTitle").value,date:$("cDate").value,type:$("cType").value,start:$("cStart").value,end:$("cEnd").value,location:$("cLocation").value,notes:$("cNotes").value});save();closeModal();renderDay()}
$("prevDay").onclick=()=>{selected.setDate(selected.getDate()-1);renderDay()}
$("nextDay").onclick=()=>{selected.setDate(selected.getDate()+1);renderDay()}
$("selectedDate").onchange=e=>{selected=localDate(e.target.value);renderDay()}
function renderMonth(){
 let v=$("monthPicker").value||iso(selected).slice(0,7);let [y,m]=v.split("-").map(Number), first=new Date(y,m-1,1), last=new Date(y,m,0);
 let html="";for(let i=0;i<first.getDay();i++)html+="<div></div>";
 for(let d=1;d<=last.getDate();d++){let dt=new Date(y,m-1,d),i=shift(dt);html+=`<button class="day ${i!==null?"shift":""} ${iso(dt)===iso(selected)?"selected":""}" onclick="selectMonthDay('${iso(dt)}')">${d}${i!==null?`<small>${labels[i]}</small>`:""}</button>`}
 $("monthGrid").innerHTML=html
}
function selectMonthDay(s){selected=localDate(s);$("monthPicker").value=s.slice(0,7);show("home");renderDay()}
$("monthPicker").onchange=renderMonth;
function monthMinutes(v){let [y,m]=v.split("-").map(Number),days=new Date(y,m,0).getDate(),total=0,c=[0,0,0,0,0];for(let d=1;d<=days;d++){let dt=new Date(y,m-1,d),i=shift(dt);if(i!==null){total+=credited[i];c[i]++}}return [total,c]}
function renderHours(){let v=$("hoursMonth").value||"2026-10";$("hoursMonth").value=v;let [total,c]=monthMinutes(v);$("totalHours").textContent=fmtMin(total);$("counts").innerHTML=labels.map((x,i)=>`<div class="stat"><span>${x}</span><b>${c[i]}</b><small>${fmtMin(c[i]*credited[i])}</small></div>`).join("")}
$("hoursMonth").onchange=renderHours;
$("cycleStart").onchange=()=>{localStorage.setItem(cycleStartKey,$("cycleStart").value);renderAll()}
function renderBreaks(){ $("breakList").innerHTML=data.breaks.map((b,i)=>`<div class="commitment"><b>${b.start} → ${b.end}</b><div class="muted">${esc(b.reason||"Pausa ciclo")}</div><button onclick="removeBreak(${i})" style="color:#b91c1c">Elimina</button></div>`).join("")}
$("saveBreak").onclick=()=>{let a=$("breakStart").value,b=$("breakEnd").value;if(!a||!b||a>b)return alert("Controlla le date.");data.breaks.push({start:a,end:b,reason:"Ferie"});save();renderBreaks();renderAll()}
function removeBreak(i){data.breaks.splice(i,1);save();renderBreaks();renderAll()}
function show(id){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===id));document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.page===id));if(id==="calendar")renderMonth();if(id==="hours")renderHours()}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>show(b.dataset.page));
function renderAll(){renderDay();renderMonth();renderHours();renderBreaks()}
$("cycleStart").value=localStorage.getItem(cycleStartKey)||"2026-10-16";
renderAll();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
