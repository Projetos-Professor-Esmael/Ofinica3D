// Renderiza cada modelo com os parâmetros padrão usando o mesmo motor do site. Falha (exit 1) se algum quebrar.
import {createOpenSCAD} from "../vendor/openscad.js";
import {readFileSync} from "fs";
const models=JSON.parse(readFileSync(new URL("../models.json",import.meta.url)));
let bad=0;
for(const m of models){
  const head=m.params.map(p=>`${p[0]}=${typeof p[1]==="string"?JSON.stringify(p[1]):p[1]};`).join("\n");
  const log=[];const o=await createOpenSCAD({print:t=>log.push(t),printErr:t=>log.push(t)}),f=o.getInstance();
  f.FS.writeFile("/in.scad",head+"\n"+m.scad);let ok=true;
  try{ok=f.callMain(["/in.scad","-o","/o.stl","--backend=manifold"])===0}catch(e){ok=false}
  let n=0;try{n=(f.FS.readFile("/o.stl",{encoding:"utf8"}).match(/facet normal/g)||[]).length}catch(e){ok=false}
  const warn=log.filter(l=>/WARNING|ERROR/.test(l));
  console.log(ok&&n>0?"OK  ":"FALHA",m.id,n,"triângulos",warn.join(" | "));
  if(!(ok&&n>0))bad++;
}
process.exit(bad?1:0);
