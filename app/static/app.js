const $ = (id) => document.getElementById(id);
const chatLog = $("chatLog"), hero = $("hero"), toolPanel = $("toolPanel");
let activeModule = "chat";

function addMessage(role, text) {
  hero.classList.add("hidden");
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const who = document.createElement("div");
  who.className = "who";
  who.textContent = role === "user" ? "YOU" : "JARVIS";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  if (role === "user") row.append(bubble, who); else row.append(who, bubble);
  chatLog.appendChild(row);
  row.scrollIntoView({behavior:"smooth", block:"end"});
}
function showPanel(title, placeholder, action, buttonText="RUN") {
  toolPanel.innerHTML = "";
  toolPanel.classList.remove("hidden");
  const h = document.createElement("h2"); h.textContent = title;
  const input = document.createElement("input"); input.placeholder = placeholder;
  const button = document.createElement("button"); button.textContent = buttonText;
  const output = document.createElement("div");
  button.onclick = async () => {
    if (!input.value.trim()) return;
    output.textContent = "Processing...";
    try { await action(input.value.trim(), output); }
    catch { output.textContent = "Service unavailable. Check your connection and server configuration."; }
  };
  toolPanel.append(h,input,button,output);
  input.focus();
}
async function post(url, query) {
  const res = await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query})});
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}
function renderResults(items, output, mode) {
  output.innerHTML = "";
  if (!items.length) { output.textContent = "No results found."; return; }
  items.forEach(item => {
    const div = document.createElement("div"); div.className="result";
    const title = document.createElement("strong"); title.textContent = item.title || "Result";
    div.append(title);
    const desc = document.createElement("p"); desc.textContent = item.snippet || item.description || "";
    div.append(desc);
    if(item.url){const a=document.createElement("a");a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Open source ↗";div.append(a);}
    output.append(div);
  });
}
async function selectModule(module) {
  activeModule = module;
  document.querySelectorAll(".module").forEach(b=>b.classList.toggle("active",b.dataset.module===module));
  const names={chat:"AI Assistant",search:"Web Search",weather:"Weather",news:"News Feed",calculator:"Calculator"};
  $("moduleTitle").textContent=names[module];
  toolPanel.classList.add("hidden");
  $("composerWrap").classList.toggle("hidden",module!=="chat");
  if(module==="chat"){hero.classList.toggle("hidden",chatLog.children.length>0);return;}
  hero.classList.add("hidden");
  if(module==="search") showPanel("WEB SEARCH","Search the web...",async(q,out)=>renderResults((await post("/api/search",q)).results,out));
  if(module==="weather") showPanel("WEATHER INTELLIGENCE","Enter a city...",async(q,out)=>{const d=await post("/api/weather",q);out.textContent=`${d.place}, ${d.country}\nTemperature: ${d.current.temperature_2m}°C\nFeels like: ${d.current.apparent_temperature}°C\nHumidity: ${d.current.relative_humidity_2m}%\nWind: ${d.current.wind_speed_10m} km/h`;});
  if(module==="news") showPanel("NEWS FEED","Topic, e.g. technology...",async(q,out)=>{const d=await post("/api/news",q);if(!d.configured){out.textContent=d.message;return;}renderResults(d.articles.map(a=>({...a,url:a.url,snippet:`${a.source||""} • ${a.publishedAt||""} • ${a.description||""}`})),out);});
  if(module==="calculator") showPanel("CALCULATOR","Example: (25 * 4) / 2",async(q,out)=>{const d=await post("/api/calculate",q);out.textContent=`${d.expression} = ${d.result}`;},"CALCULATE");
}
async function sendMessage(text) {
  if(!text.trim()) return;
  addMessage("user",text);
  $("messageInput").value="";
  const waiting = document.createElement("div"); waiting.className="message"; waiting.textContent="JARVIS is thinking..."; chatLog.append(waiting);
  try {
    const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,use_memory:$("memoryToggle").checked})});
    const data=await res.json(); waiting.remove();
    if(!res.ok) throw new Error(data.detail||"Request failed");
    addMessage("assistant",data.reply);
  } catch(e) { waiting.remove(); addMessage("assistant",e.message||"Connection error."); }
}
$("chatForm").addEventListener("submit",e=>{e.preventDefault();sendMessage($("messageInput").value);});
$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("chatForm").requestSubmit();}});
document.querySelectorAll(".module").forEach(b=>b.addEventListener("click",()=>{selectModule(b.dataset.module);$("sidebar").classList.remove("open");}));
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>sendMessage(b.dataset.prompt)));
$("newChat").onclick=()=>{chatLog.innerHTML="";hero.classList.remove("hidden");selectModule("chat");};
$("clearHistory").onclick=async()=>{if(!confirm("Delete saved conversation history from this server?"))return;await fetch("/api/history",{method:"DELETE"});chatLog.innerHTML="";hero.classList.remove("hidden");};
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
async function init(){
  try{
    const s=await fetch("/api/status").then(r=>r.json());
    $("connectionText").textContent=s.ai_configured?`AI READY • ${s.model}`:"AI KEY NOT CONFIGURED";
    $("connectionText").previousElementSibling.style.background=s.ai_configured?"#42e4b5":"#e6aa48";
    const h=await fetch("/api/history").then(r=>r.json());
    h.messages.forEach(m=>addMessage(m.role,m.content));
  }catch{$("connectionText").textContent="SERVER OFFLINE";}
  if("serviceWorker" in navigator) navigator.serviceWorker.register("/static/sw.js").catch(()=>{});
}
init();
