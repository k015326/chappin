let data = JSON.parse(localStorage.getItem("chappin") || "{}");
let current = "";

function save(){
  localStorage.setItem("chappin", JSON.stringify(data));
}

function addPlayer(){
  const name = newPlayer.value;
  if(!name) return;

  if(!data[name]){
    data[name] = {tendency:{in:0,out:0}};
  }

  save();
  load();
}

function load(){
  player.innerHTML="";

  Object.keys(data).forEach(n=>{
    const o=document.createElement("option");
    o.value=n;
    o.textContent=n;
    player.appendChild(o);
  });

  current = player.value;
}

player.onchange=()=>current=player.value;

function addShot(){
  if(!current){
    alert("プレイヤー選択");
    return;
  }

  const s=Number(stand.value);
  const t=Number(target.value);
  const p=pins.value || "0";

  const obj=data[current];

  // 学習だけする（履歴は持たない）
  learn(obj,p);

  const sug = analyze(obj,s,t,p);

  result.innerText = `推奨：立ち位置${sug.s} / 通過${sug.t}`;

  save();
}

function learn(obj,p){
  if(p.includes("10")) obj.tendency.out++;
  if(p.includes("4")) obj.tendency.in++;
}

function analyze(obj,s,t,p){

  // ストライク
  if(p==="0") return {s,t};

  // 外ミス（強め）
  if(p.includes("10") || p.includes("6")){
    s -= 4;
    t -= 3;
  }

  // 内ミス（弱め）
  if(p.includes("4") || p.includes("7")){
    s += 2;
    t += 1;
  }

  // ワッシャー
  if(p.includes("1") && p.includes("10")){
    t -= 4;
  }

  // ブルックリン
  if(p.includes("2") && p.includes("4")){
    s += 3;
  }

  // AI補正
  const tend=obj.tendency;

  if(tend.out > tend.in) s -= 2;
  if(tend.in > tend.out) s += 1;

  return {s,t};
}

function resetGame(){
  if(!current) return;

  data[current].tendency={in:0,out:0};

  save();
  location.reload();
}

load();