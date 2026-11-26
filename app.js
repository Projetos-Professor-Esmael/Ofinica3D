import {createOpenSCAD} from "./vendor/openscad.js";
const $=s=>document.querySelector(s),KEY="oficina3d-v1";
const norm=t=>t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
let MODELS=[],cur=null,vals={},stl="",tri=null,busy=false,again=false,timer=0;
const st=t=>$("#st").textContent=t;
function say(t,u,acts){const d=document.createElement("div");d.className="m"+(u?" u":"");d.textContent=t;(acts||[]).forEach(([l,f])=>{const b=document.createElement("button");b.textContent=l;b.onclick=f;d.append(document.createElement("br"),b)});$("#log").append(d);$("#log").scrollTop=1e9}
function tab(n){document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===n));document.querySelectorAll(".pane").forEach(p=>p.classList.toggle("on",p.id===n))}
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>tab(b.dataset.t));

/* ===== Motor OpenSCAD (WebAssembly). Cada chamada usa uma instância nova. ===== */
async function run(code,fmt){const log=[],o=await createOpenSCAD({print:t=>log.push(t),printErr:t=>log.push(t)}),m=o.getInstance();
 m.FS.writeFile("/in.scad",code);let ok=true;try{ok=m.callMain(["/in.scad","-o","/out."+fmt,"--backend=manifold"])===0}catch(e){ok=false}
 let data=null;if(ok){try{data=m.FS.readFile("/out."+fmt,{encoding:fmt==="stl"||fmt==="obj"||fmt==="off"||fmt==="amf"?"utf8":"binary"})}catch(e){ok=false}}
 return{ok,data,log:log.join("\n")}}
const EXPL=[[/syntax error/i,"Há um erro de sintaxe. Confira se todo parêntese, colchete e chave foi fechado e se cada linha termina com ponto e vírgula."],[/Unknown (module|function)/i,"Usei um nome que o OpenSCAD não conhece. Verifique a grafia (maiúsculas contam) ou se o módulo foi definido."],[/not a valid (object|manifold)|non-manifold|not.*closed/i,"O objeto não ficou sólido e fechado, o que atrapalha a impressão. Evite partes que apenas se tocam em uma aresta: sobreponha as peças em 0,1 mm."],[/Can't open|Cannot open/i,"O arquivo importado não existe aqui. Este site roda sem arquivos externos."],[/empty|no top level|Current top level object is empty/i,"O resultado ficou vazio. Veja se há algum objeto fora de difference/union ou um subtraendo maior que a peça."]];
const explain=l=>{const e=EXPL.find(x=>x[0].test(l));return e?e[1]:"O motor não conseguiu gerar a peça. Veja a mensagem em Código e me conte o que mudou por último."};

/* ===== Visualizador ===== */
const cv=$("#cv"),rd=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});rd.setPixelRatio(Math.min(devicePixelRatio,2));
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,.1,5000);cam.up.set(0,0,1);
const ctl=new THREE.OrbitControls(cam,cv);ctl.enableDamping=true;
sc.add(new THREE.HemisphereLight(0xffffff,0x334455,.9));const dl=new THREE.DirectionalLight(0xffffff,.8);dl.position.set(1,-1,2);sc.add(dl);
const grid=new THREE.GridHelper(400,40,0x4a5b6c,0x2c3b4a);grid.rotation.x=Math.PI/2;sc.add(grid);let mesh=null;
function size(){const v=$("#view"),w=v.clientWidth,h=v.clientHeight;if(!w||!h)return;rd.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
new ResizeObserver(size).observe($("#view"));
(function loop(){requestAnimationFrame(loop);ctl.update();rd.render(sc,cam)})();
function parse(t){const a=[],re=/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g;let m;while(m=re.exec(t))a.push(+m[1],+m[2],+m[3]);return new Float32Array(a)}
function show(t){tri=parse(t);if(mesh){sc.remove(mesh);mesh.geometry.dispose()}if(!tri.length)return;
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(tri,3));g.computeVertexNormals();g.computeBoundingBox();
 mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xffb000,roughness:.55,metalness:.05,side:THREE.DoubleSide}));sc.add(mesh);
 const b=g.boundingBox,s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),r=Math.max(s.x,s.y,s.z)||10;
 if(!show.done){ctl.target.copy(c);cam.position.set(c.x+r*1.6,c.y-r*1.9,c.z+r*1.3);show.done=1}
 $("#info").textContent=`${s.x.toFixed(1)} × ${s.y.toFixed(1)} × ${s.z.toFixed(1)} mm · ${tri.length/9} triângulos`;check(s)}
function check(s){const w=[],M=Math.max(s.x,s.y,s.z),n=Math.min(s.x,s.y,s.z);if(M>220)w.push("A peça passa de 220 mm, maior que a mesa de muitas impressoras. Reduza a escala ou divida em partes.");
 if(M<8)w.push("A peça tem menos de 8 mm: pode sair sem detalhes.");if(n<1.2)w.push("Há uma dimensão abaixo de 1,2 mm. Paredes assim costumam quebrar ou falhar na impressão.");
 if(w.join()!==check.last){check.last=w.join();w.forEach(x=>say("Revisão: "+x))}}

/* ===== Renderização com debounce ===== */
function queue(){clearTimeout(timer);timer=setTimeout(render,700)}
async function render(){if(busy){again=true;return}busy=true;st("Gerando…");const code=$("#src").value;try{localStorage.setItem(KEY,code)}catch(e){}
 const r=await run(code,"stl");busy=false;
 if(r.ok&&r.data){stl=r.data;$("#err").textContent="";show(stl);st("Pronto")}else{$("#err").textContent=r.log.split("\n").filter(l=>/ERROR|WARNING/i.test(l)).join("\n")||r.log;st("Erro no código");const k=explain(r.log);if(k!==render.k){render.k=k;say("Revisão: "+k,0,[["Ver código",()=>tab("code")]])}}
 if(again){again=false;render()}}
$("#src").oninput=queue;

/* ===== Exportação ===== */
function save(name,data,type){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([data],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)}
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=b=>{let c=~0;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return~c>>>0};
function zip(files){const E=new TextEncoder(),parts=[],cd=[];let off=0;for(const[n,txt]of files){const nb=E.encode(n),d=E.encode(txt),c=crc(d),h=new DataView(new ArrayBuffer(30));
 h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nb.length,true);parts.push(h.buffer,nb,d);
 const g=new DataView(new ArrayBuffer(46));g.setUint32(0,0x02014b50,true);g.setUint16(4,20,true);g.setUint16(6,20,true);g.setUint32(16,c,true);g.setUint32(20,d.length,true);g.setUint32(24,d.length,true);g.setUint16(28,nb.length,true);g.setUint32(42,off,true);cd.push(g.buffer,nb);off+=30+nb.length+d.length}
 const cs=cd.reduce((a,b)=>a+b.byteLength,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);return new Blob([...parts,...cd,e.buffer],{type:"application/zip"})}
function to3mf(){const map=new Map(),V=[],T=[];for(let i=0;i<tri.length;i+=3){const k=tri[i].toFixed(4)+","+tri[i+1].toFixed(4)+","+tri[i+2].toFixed(4);if(!map.has(k)){map.set(k,V.length);V.push(k)}T.push(map.get(k))}
 const vx=V.map(k=>{const p=k.split(",");return`<vertex x="${p[0]}" y="${p[1]}" z="${p[2]}"/>`}).join(""),tx=[];for(let i=0;i<T.length;i+=3)tx.push(`<triangle v1="${T[i]}" v2="${T[i+1]}" v3="${T[i+2]}"/>`);
 return zip([["[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'],
 ["_rels/.rels",'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'],
 ["3D/3dmodel.model",`<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="pt-BR" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><object id="1" type="model"><mesh><vertices>${vx}</vertices><triangles>${tx.join("")}</triangles></mesh></object></resources><build><item objectid="1"/></build></model>`]])}
$("#exp").onclick=async()=>{if(!stl||!tri)return say("Ainda não há peça para baixar. Escolha um modelo ou escreva um código.");const f=$("#fmt").value,n=(cur?cur.id:"peca")+"."+f;
 if(f==="stl")return save(n,stl,"model/stl");if(f==="3mf")return save(n,to3mf(),"model/3mf");
 st("Convertendo…");const r=await run($("#src").value,f);st("Pronto");r.ok?save(n,r.data,"application/octet-stream"):say("Não consegui converter para "+f.toUpperCase()+".")};

/* ===== Modelos e parâmetros ===== */
const hdr=()=>cur.params.map(p=>`${p[0]} = ${typeof vals[p[0]]==="string"?JSON.stringify(vals[p[0]]):vals[p[0]]}; // ${p[2]}`).join("\n");
const build=()=>{$("#src").value=`// ${cur.nome}\n${hdr()}\n\n${cur.scad.replace(/;(?=[a-z])/gi,";\n")}`;queue()};
function load(m,over){cur=m;vals={};m.params.forEach(p=>vals[p[0]]=p[1]);Object.assign(vals,over||{});build();pars();show.done=0}
function pars(){const b=$("#pars");b.replaceChildren();if(!cur)return;const t=document.createElement("p");t.style.color="var(--mut)";t.textContent="Dica: "+cur.dica;b.append(t);
 cur.params.forEach(p=>{const l=document.createElement("label");l.textContent=p[2]+(typeof p[1]==="number"?": "+vals[p[0]]:"");const i=document.createElement("input");
 if(typeof p[1]==="string"){i.type="text";i.value=vals[p[0]];i.oninput=()=>{vals[p[0]]=i.value.toUpperCase().replace(/[^A-Z0-9 ]/g,"");build()}}else{i.type="range";i.min=p[3];i.max=p[4];i.step=p[4]>50?1:.5;i.value=vals[p[0]];i.oninput=()=>{vals[p[0]]=+i.value;l.firstChild.nodeValue=p[2]+": "+i.value;build()}}l.append(i);b.append(l)})}
function cards(){const c=$("#cards");MODELS.forEach(m=>{const b=document.createElement("button");b.textContent=m.nome;b.onclick=()=>load(m);c.append(b)})}

/* ===== Assistente (busca na base de modelos, sem servidor) ===== */
const FAQ=[[/3mf/,"O 3MF guarda as medidas em milímetros e é aceito pelos fatiadores atuais. Para impressoras mais antigas, use STL."],[/(imprim|fatiad|suporte de impress)/,"Antes de imprimir, confira a revisão do assistente: peça com menos de 1,2 mm de parede costuma falhar. Prefira apoiar a maior face plana na mesa."],[/(como|comeco|iniciar|aprender|ajuda)/,"O caminho é: 1) escolha um modelo, 2) ajuste as medidas, 3) confira o tamanho no canto da tela, 4) baixe. Para criar do zero, abra a aba Código: formas simples (cube, cylinder, sphere) combinadas com difference() (subtrai) e union() (soma) formam quase tudo."],[/(furo|buraco|subtrair|difference)/,"Para fazer um furo, subtraia um cilindro com difference(){ peça; cylinder(...); }. Faça o cilindro 1 mm maior que a peça para o corte sair limpo."],[/(medida|mm|escala|tamanho)/,"Todas as medidas estão em milímetros. Diga, por exemplo, 'vaso com 120 altura' e eu ajusto o parâmetro."]];
function reply(t){const q=norm(t),words=q.split(/\W+/);let best=null,sc=0;MODELS.forEach(m=>{const s=m.palavras.filter(w=>q.includes(norm(w))).length;if(s>sc){sc=s;best=m}});
 if(best){const over={},num=/(\d+(?:[.,]\d+)?)\s*(?:mm|cm)?\s*(?:de\s+|em\s+)?([a-z]+)/g;let m;while(m=num.exec(q)){const v=parseFloat(m[1].replace(",","."))*(/cm/.test(m[0])?10:1);const p=best.params.find(p=>typeof p[1]==="number"&&norm(p[0]).startsWith(norm(m[2]).slice(0,5)));if(p)over[p[0]]=Math.min(p[4],Math.max(p[3],v))}
  const tx=best.params.find(p=>typeof p[1]==="string"),qm=t.match(/["“']([^"”']{1,24})["”']/);if(tx&&qm)over[tx[0]]=qm[1].toUpperCase().replace(/[^A-Z0-9 ]/g,"");
  load(best,over);const ch=Object.keys(over).map(k=>`${k} = ${over[k]}`).join(", ");return say(`Montei "${best.nome}"${ch?" com "+ch:""}. ${best.dica} Ajuste as medidas na aba Modelos ou peça mudanças aqui.`,0,[["Ajustar medidas",()=>tab("mod")],["Baixar",()=>$("#exp").click()]])}
 const f=FAQ.find(x=>x[0].test(q));if(f)return say(f[1]);
 say("Ainda não tenho um modelo para isso. Posso montar: "+MODELS.map(m=>m.nome.toLowerCase()).join(", ")+". Para algo novo, abra a aba Código e use cube, cylinder e difference.",0,[["Ver modelos",()=>tab("mod")]])}
const send=()=>{const v=$("#msg").value.trim();if(!v)return;$("#msg").value="";say(v,1);reply(v)};$("#go").onclick=send;$("#msg").onkeydown=e=>{if(e.key==="Enter")send()};

/* ===== Início ===== */
try{MODELS=await (await fetch("models.json")).json()}catch(e){say("Não consegui carregar a biblioteca de modelos.")}
cards();
say("Olá! Descreva o objeto que você quer, com medidas se souber (ex.: 'caixa de 80 mm de largura') ou escolha um modelo. O motor roda inteiro no seu aparelho, sem enviar nada para servidores.",0,MODELS.slice(0,3).map(m=>[m.nome,()=>load(m)]));
let saved="";try{saved=localStorage.getItem(KEY)||""}catch(e){}
if(saved){$("#src").value=saved;queue()}else load(MODELS[0]||{params:[],scad:"cube(20);",nome:"Cubo",dica:"",id:"cubo"});
addEventListener("resize",size);size();
