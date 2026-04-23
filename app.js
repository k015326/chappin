let data = JSON.parse(localStorage.getItem("chappin") || "{}");
let current = "";

function save(){ localStorage.setItem("chappin", JSON.stringify(data)); }

function addPlayer(){
  const name = newPlayer.value;
  if(!name) return;
  if(!data[name]) data[name] = {history:[], tendency:{in:0,out:0}};
  save(); load();
}

function load(){
  player.innerHTML="";
  Object.keys(data).forEach(n=>{
    const o=document.createElement("option");
    o.textContent=n; player.appendChild(o);
  });
  current = player.value;
}
player.onchange=()=>current=player.value;

function addShot(){
  if(!current) return;

  const s=Number(stand.value);
  const t=Number(target.value);
  const p=pins.value;

  const obj=data[current];
  obj.history.push({s,t,p});

  learn(obj,p);
  const sug = analyze(obj);

  result.innerText =
`推奨
立ち位置:${sug.s}
通過:${sug.t}`;

  save();
}

function learn(obj,p){
  if(p.includes("10")) obj.tendency.out++;
  if(p.includes("4")) obj.tendency.in++;
}

function analyze(obj){
  const last = obj.history[obj.history.length-1];
  let s=last.s, t=last.t;
  const p=last.p;

  // ===== 基本ロジック =====
  if(p.includes("10")||p.includes("6")){
    s-=3; t-=2;
  }
  else if(p.includes("4")||p.includes("7")){
    s+=3; t+=2;
  }
  else if(p.includes("1")&&p.includes("10")){
    s-=5;
  }
  else if(p.includes("2")&&p.includes("4")){
    s+=5;
  }

  // ===== AI補正 =====
  const tend=obj.tendency;
  if(tend.out>tend.in) s-=1;
  if(tend.in>tend.out) s+=1;

  return {s,t};
}

function resetGame(){
  if(!current) return;
  data[current].history=[];
  save();
  location.reload();
}

load();