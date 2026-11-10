/* Stockage : si localStorage est bloqué (navigation privée, iframe, cookies refusés), on passe en mémoire au lieu de planter le jeu */
(function(){ try{ localStorage.setItem("__c3d","1"); localStorage.removeItem("__c3d"); }catch(e){ var m={}; try{ Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null;},setItem:function(k,v){m[k]=String(v);},removeItem:function(k){delete m[k];},clear:function(){m={};},key:function(i){return Object.keys(m)[i]||null;},get length(){return Object.keys(m).length;}}}); }catch(_){} } })();

window.GFX=(()=>{
 const PRE={min:{n:"Très bas",pr:.6,sh:0,shs:512,aa:0,fx:60,trail:0,dist:50,tone:0,clouds:0,far:0,flash:0},
  low:{n:"Bas",pr:.8,sh:0,shs:512,aa:0,fx:110,trail:0,dist:70,tone:0,clouds:0,far:1,flash:0},
  med:{n:"Moyen",pr:1,sh:1,shs:1024,aa:0,fx:180,trail:1,dist:100,tone:0,clouds:1,far:1,flash:1},
  high:{n:"Élevé",pr:1.5,sh:2,shs:2048,aa:1,fx:280,trail:1,dist:140,tone:1,clouds:1,far:1,flash:1},
  ultra:{n:"Ultra",pr:2,sh:3,shs:2048,aa:1,fx:360,trail:1,dist:220,tone:1,clouds:1,far:1,flash:1}};
 let s={}; try{ s=JSON.parse(localStorage.getItem("c3d_gfx")||"{}")||{}; }catch(e){}
 const G={PRE,ORDER:["min","low","med","high","ultra"],q:s.q||"auto",cur:PRE[s.cur]?s.cur:"low",scale:1,ov:s.ov||{},showFps:s.showFps!==false,fov:s.fov||75,sens:s.sens||1,vol:s.vol==null?.55:s.vol};
 G.P=()=>Object.assign({},PRE[G.cur],G.ov);
 G.pr=()=>Math.max(.3,Math.min(window.devicePixelRatio||1,G.P().pr)*G.scale);
 Object.defineProperty(G,"fx",{get:()=>G.P().fx}); Object.defineProperty(G,"trail",{get:()=>!!G.P().trail});
 G.save=()=>{ try{ localStorage.setItem("c3d_gfx",JSON.stringify({q:G.q,cur:G.cur,ov:G.ov,showFps:G.showFps,fov:G.fov,sens:G.sens,vol:G.vol})); }catch(e){} };
 return G;
})();

window.Tm=(()=>{ let base=Date.now(),t0=performance.now(),ok=false; const now=()=>base+(performance.now()-t0);
async function sync(){ try{ const t=performance.now(); const r=await fetch(location.href.split("#")[0],{method:"HEAD",cache:"no-store"}); const d=r.headers.get("date"); if(d){ base=new Date(d).getTime()+(performance.now()-t)/2; t0=performance.now(); ok=true; return; } }catch(e){}
 try{ const t=performance.now(); const r=await fetch("https://worldtimeapi.org/api/timezone/Etc/UTC",{cache:"no-store"}); const j=await r.json(); base=new Date(j.utc_datetime).getTime()+(performance.now()-t)/2; t0=performance.now(); ok=true; }catch(e){} }
sync(); setInterval(sync,600000); return {now,set(ms){base=ms;t0=performance.now();ok=true},get ok(){return ok}}; })();

console.log("%cCombat 3D — v10","color:#ffb703;font-weight:bold");

/* ===== MODÈLES 3D (chargés depuis le dossier models/) ===== */
/* ===== CHARGEUR DES MODÈLES 3D — fichiers models/*.json (compatibles éditeur three.js) ===== */
window.C3M=(()=>{
const NAMES=["fighter", "boss", "hand", "tree", "bush", "bench", "crate", "chest", "lamp", "fountain", "pillar", "brazier", "knife", "glock", "deagle", "revolver", "smg", "ak", "shotgun", "sniper", "hammer", "immeuble_beige", "immeuble_bleu", "immeuble_haut", "sapin", "feu_tricolore", "routes_croisement", "borne_incendie", "poubelle"], MERGE=["routes_croisement","immeuble_beige","immeuble_bleu","immeuble_haut"];
const T={}, loader=new THREE.ObjectLoader();
function parse(json){
    let o;
    if(json.scene&&json.scene.object){            // « Save » de l'éditeur (projet)
        const sc=loader.parse(json.scene), k=sc.children.slice();
        if(k.length===1) o=k[0]; else { o=new THREE.Group(); k.forEach(c=>o.add(c)); }
    } else { o=loader.parse(json); if(o.isScene&&o.children.length===1) o=o.children[0]; }
    if(o.parent) o.parent.remove(o); o.position.set(0,0,0); o.rotation.set(0,0,0); return o;
}
function mergeStatic(o){
    o.updateMatrixWorld(true); const by=new Map();
    o.traverse(m=>{ if(!m.isMesh) return; const k=m.material.uuid; if(!by.has(k)) by.set(k,{mat:m.material,list:[]}); by.get(k).list.push(m); });
    const out=new THREE.Group(); out.name=o.name;
    by.forEach(({mat,list})=>{ const pos=[],nor=[],uv=[],idx=[]; let off=0;
        list.forEach(m=>{ const g=m.geometry.clone(); g.applyMatrix4(m.matrixWorld); const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;
            for(let i=0;i<p.count;i++){ pos.push(p.getX(i),p.getY(i),p.getZ(i)); nor.push(n.getX(i),n.getY(i),n.getZ(i)); uv.push(u?u.getX(i):0,u?u.getY(i):0); }
            if(g.index) for(let i=0;i<g.index.count;i++) idx.push(g.index.getX(i)+off); else for(let i=0;i<p.count;i++) idx.push(i+off);
            off+=p.count; });
        const G=new THREE.BufferGeometry(); G.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); G.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3)); G.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); G.setIndex(idx);
        const me=new THREE.Mesh(G,mat); me.castShadow=true; me.receiveShadow=true; out.add(me); });
    return out;
}
async function load(){
    const D={}, src={};
    await Promise.all(NAMES.map(async n=>{
        let o=null;
        try{ const r=await fetch("models/"+n+".json",{cache:"no-cache"}); if(r.ok){ o=parse(await r.json()); src[n]="fichier"; } }catch(e){}
        if(!o){ try{ o=parse({scene:D[n]}); src[n]="intégré"; }catch(e){ console.error("[modèles] "+n+" :",e); return; } }
        T[n]=MERGE.includes(n)?mergeStatic(o):o;
    }));
    const f=NAMES.filter(n=>src[n]==="fichier"), i=NAMES.filter(n=>src[n]==="intégré");
    console.log("[modèles] depuis models/ ("+f.length+") :",f.join(", ")||"aucun"); console.log("[modèles] version intégrée ("+i.length+") :",i.join(", ")||"aucun");
}
function make(n){
    const t=T[n]; if(!t) return null; const c=t.clone(true), map=new Map();
    c.traverse(o=>{ if(o.isMesh){ let m=map.get(o.material); if(!m){ m=o.material.clone(); map.set(o.material,m); } o.material=m; o.castShadow=true; o.receiveShadow=true; } });
    return c;
}
function tint(o,matName,color){ o.traverse(x=>{ if(x.isMesh&&x.material.name===matName) x.material.color.setHex(color); }); }
function weapon(key,sk){
    const m=make(key); if(!m) return null;
    if(sk&&sk.id!=="std") m.traverse(o=>{
        if(!o.isMesh||!/^[bsam]_/.test(o.name)) return;
        const s=o.name[0], col=s==="b"?sk.b:s==="a"?sk.a:sk.s; if(col==null) return; const mt=o.material;
        mt.color.setHex(col); if(s==="a"&&sk.e){ mt.emissive.setHex(col); mt.emissiveIntensity=.35; } if(sk.m){ mt.metalness=.9; mt.roughness=.25; }
    });
    const mag=m.getObjectByName("mag"); m.userData.mag=mag||null; m.userData.mag0=mag?mag.position.y:0; return m;
}
function syncSpec(SPEC){          // ancres (mains, bouche, chargeur) lues dans les modèles
    for(const k in SPEC){
        const t=T[k]; if(!t) continue; const sp=SPEC[k];
        const p=n=>{ const o=t.getObjectByName(n); return o?[o.position.x,o.position.y,o.position.z]:null; };
        const rh=p("hand_r"), lh=p("hand_l"), mz=p("muzzle"), mg=p("mag");
        if(rh) sp.rh=rh; if(lh) sp.lh=lh; else delete sp.lh; if(mz) sp.mz=mz; else delete sp.mz; if(mg) sp.mag=[0,0,0,mg[0],mg[1],mg[2]]; else delete sp.mag;
    }
}
function prop(n){ const m=make(n); if(!m) throw new Error("modèle manquant : "+n); return m; }
function chest(){ const m=make("chest"); if(m){ const lid=m.getObjectByName("lid"), beam=m.getObjectByName("beam"); if(lid&&beam) return {g:m,lid,beam}; } throw new Error("modèle manquant : chest"); }
return {load,make,tint,weapon,syncSpec,prop,chest,has:n=>!!T[n],T};
})();

async function demarrer(){
    try{ await C3M.load(); }catch(e){ console.warn(e); }
    try{ startGame(); }catch(e){ console.error("Erreur au démarrage du jeu :",e); if(window.c3dBootFail) c3dBootFail("Le jeu n'a pas pu démarrer : "+((e&&e.message)||e)); return; }
    const b=document.getElementById("boot"); if(b) b.remove();
}

function startGame(){

/* ----- Personnage / ennemis / boss : modèles fighter.json et boss.json ----- */
function createFighter(color,opts={}){
    const g=C3M.make(opts.boss?"boss":"fighter"); 
    const P={}; g.traverse(o=>{ if(o.name) P[o.name]=o; });
    const col=(n,fn)=>{ if(P[n]&&P[n].material) fn(P[n].material); };
    col("body",m=>m.color.setHex(color)); col("backpack",m=>m.color.setHex(opts.backColor||0x1f2937)); col("head",m=>m.color.setHex(opts.headColor||0xffc49a));
    col("leg_mesh",m=>m.color.setHex(opts.legColor||0x20242b));
    col("eyeL",m=>{ m.color.setHex(opts.eyeColor||0x111111); m.emissive.setHex(opts.eyeGlow||0); m.emissiveIntensity=opts.eyeGlow?2:0; });
    if(opts.headSize&&P.head_group) P.head_group.scale.setScalar(opts.headSize/.43);
    const main=P.body.material;
    g.userData.limbs={armL:P.armL,armR:P.armR,legL:P.legL,legR:P.legR}; g.userData.walkPhase=Math.random()*10; g.userData.mainMaterial=main; g.userData.parts=P;
    if(opts.boss){ main.emissive.setHex(0xff0000); main.emissiveIntensity=0; if(P.weakPoint){ P.weakPoint.visible=false; g.userData.weakPointMesh=P.weakPoint; } }
    return g;
}
/* ----- Décors : tree.json, bush.json, bench.json, crate.json ----- */
function createTree(x,z){ const m=C3M.make("tree"); m.scale.setScalar(.85+Math.random()*.5); m.rotation.y=Math.random()*6.28; m.position.set(x,getGroundHeight(x,z),z); levelGroup.add(m); obstacles.push({x,z,width:.8,depth:.8,h:4.5}); }
function createBush(x,z){ const m=C3M.make("bush"); m.scale.setScalar(.8+Math.random()*.5); m.rotation.y=Math.random()*6.28; m.position.set(x,getGroundHeight(x,z),z); levelGroup.add(m); }
function createBench(x,z,rotY){ const m=C3M.make("bench"); m.position.set(x,getGroundHeight(x,z),z); m.rotation.y=rotY; levelGroup.add(m); obstacles.push({x,z,width:2,depth:.8,h:1}); }
function createBuilding(x,z,w,h,d,col){
    const H0={immeuble_bleu:14,immeuble_beige:18,immeuble_haut:26}, tn=(c,k)=>new THREE.Color(c).multiplyScalar(k).getHex();
    const nm=h<12?"immeuble_bleu":h<20?"immeuble_beige":"immeuble_haut";
    const door=Math.abs(x)>Math.abs(z)?(x>0?"W":"E"):(z>0?"N":"S"), n={N:[0,-1],S:[0,1],W:[-1,0],E:[1,0]}[door];
    const m=C3M.make(nm); C3M.tint(m,"mat_mur",col); C3M.tint(m,"mat_corniche",tn(col,1.22)); C3M.tint(m,"mat_socle",tn(col,.55));
    const sc=(w+d)/18; m.scale.set(sc,h/H0[nm],sc); m.rotation.y=Math.atan2(-n[0],-n[1]); m.position.set(x,getGroundHeight(x,z),z); levelGroup.add(m);
    obstacles.push({x,z,width:w,depth:d,h:h+2});
}
function createCrate(x,z){ const m=C3M.make("crate"); m.position.set(x,getGroundHeight(x,z),z); levelGroup.add(m); obstacles.push({x,z,width:1.2,depth:1.2,h:1.4}); }


/* ===== jeu-01 ===== */
// PWA installable : manifest + service worker minimal.
// Remarque : le bug de caméra penchée au premier lancement ne venait pas du
// service worker (il vient d'un souci de rotation caméra, corrigé plus bas) —
// on peut donc le remettre en toute sécurité.
// À noter : les navigateurs n'autorisent l'installation d'une PWA que si la
// page est servie en http(s) ou localhost. Ouvrir ce fichier directement en
// double-cliquant dessus (file://) ne proposera pas d'installation ; il faut
// l'héberger (serveur local, GitHub Pages, etc.).

const manifest = {
    name: "Combat 3D FPS", short_name: "Combat3D", display: "standalone",
    background_color: "#111827", theme_color: "#111827", start_url: location.href.split("#")[0],
    icons: [{ src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" fill="#ffb703"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/></svg>`), sizes: "512x512", type: "image/svg+xml" }]
};
const manifestBlob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
const manifestLink = document.createElement("link");
manifestLink.rel = "manifest";
manifestLink.href = URL.createObjectURL(manifestBlob);
document.head.appendChild(manifestLink);

if("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){
    const swCode = `self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => self.clients.claim());
self.addEventListener("fetch", e => { e.respondWith(fetch(e.request).catch(() => new Response("Hors-ligne"))); });`;
    const swBlob = new Blob([swCode], { type: "application/javascript" });
    navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(() => {});
}

const SVGs = {
    sword: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffb703" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/></svg>`,
    city: `<svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M13 21V11l6-3v13M9 9h2M9 13h2M9 17h2"/></svg>`,
    wave: `<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M2 12c2 0 3-3 5-3s3 3 5 3 3-3 5-3 3 3 5 3"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="#ef4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    fist: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 9V5a2 2 0 0 1 4 0v4M14 9a2 2 0 0 1 4 0v5l-2.5 4.5H9L6 14v-3a2 2 0 0 1 4 0"/></svg>`,
    hammer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6l-9 9-6-6 9-9zM10.5 13.5l-6 6a2.12 2.12 0 0 0 3 3l6-6"/></svg>`,
    magic: `<svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2"/></svg>`,
    gun: `<svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M4 10h16v4H4zM4 14v5h4v-5M16 10V6h4v4"/></svg>`,
    rapidgun: `<svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M2 10h20v4H2zM2 14v5h4v-5M14 10V6h6v4M22 10l2 2"/></svg>`,
    enemy: `<svg viewBox="0 0 24 24" fill="#ef4444"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.5" fill="#000"/><circle cx="15" cy="10" r="1.5" fill="#000"/><path d="M9 16 Q12 18 15 16" stroke="#000" stroke-width="2" fill="none"/></svg>`,
    boss: `<svg viewBox="0 0 24 24" fill="#7c0a02"><circle cx="12" cy="12" r="10"/><path d="M6 8l3 2 3-4 3 4 3-2" stroke="#000" stroke-width="2"/><circle cx="9" cy="12" r="1.5" fill="#000"/><circle cx="15" cy="12" r="1.5" fill="#000"/></svg>`,
    trophy: `<svg viewBox="0 0 24 24" fill="#ffd166"><path d="M19 3H5c-1.1 0-2 .9-2 2v2c0 2.21 1.79 4 4 4h1.53c1.17 2.15 3.32 3.63 5.97 3.94V19h-3v2h8v-2h-3v-4.06c2.65-.31 4.8-1.79 5.97-3.94H17c2.21 0 4-1.79 4-4V5c0-1.1-.9-2-2-2zm-2 4h-2V5h2v2zM7 7H5V5h2v2zM12 13c-1.65 0-3-1.35-3-3V5h6v5c0 1.65-1.35 3-3 3z"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/></svg>`,
    replay: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v6h6M21 12A9 9 0 0 0 6 5.3L3 8M21 22v-6h-6M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>`,
    skull: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2C7.58 2 4 5.58 4 10c0 1.9.65 3.65 1.74 5.03l-.47 4.14c-.11.96.65 1.83 1.62 1.83h10.22c.97 0 1.73-.87 1.62-1.83l-.47-4.14C19.35 13.65 20 11.9 20 10c0-4.42-3.58-8-8-8zm-2 9c-.83 0-1.5-.67-1.5-1.5S9.17 8 10 8s1.5.67 1.5 1.5S10.83 11 10 11z"/></svg>`,
    mouse: `<svg viewBox="0 0 24 24"><path d="M13 2v8h7.2c-.3-4.1-3.3-7.5-7.2-8zM11 2C7.1 2.5 4.1 5.9 3.8 10H11V2zM3.8 12c.3 4.1 3.3 7.5 7.2 8v-8H3.8zm9.2 8c3.9-.5 6.9-3.9 7.2-8H13v8z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>`,
    play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3l-1.5 2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L15 3H9zm3 6a4 4 0 110 8 4 4 0 010-8z"/></svg>`,
    coin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9" fill="#ffd166"/><circle cx="12" cy="12" r="6" stroke="#b8860b"/><text x="12" y="16" font-size="9" text-anchor="middle" fill="#b8860b" stroke="none">€</text></svg>`
};

document.getElementById('iconLogo').innerHTML = SVGs.sword;
document.getElementById('iconHealth').innerHTML = SVGs.heart;
document.getElementById('iconTrophy1').innerHTML = SVGs.trophy;
document.getElementById('iconEnemy1').innerHTML = SVGs.enemy;
document.getElementById('iconCoin1').innerHTML = SVGs.coin;
document.getElementById('iconCoin2').innerHTML = SVGs.coin;
document.getElementById('iconWave1').innerHTML = SVGs.wave;
document.getElementById('iconEnemy2').innerHTML = SVGs.enemy;
document.getElementById('iconMouse').innerHTML = SVGs.mouse;
document.getElementById('iconReplay').innerHTML = SVGs.replay;
document.getElementById('iconHome').innerHTML = SVGs.home;
document.getElementById('btnWeapon').innerHTML = SVGs.gun;
document.getElementById('btnShoot').innerHTML = SVGs.rapidgun;
document.getElementById('btnAim').innerHTML = SVGs.target;
document.getElementById('btnView').innerHTML = SVGs.camera;
document.getElementById('iconPause').innerHTML = SVGs.pause;
document.getElementById('iconResume').innerHTML = SVGs.play;
document.getElementById('iconHome2').innerHTML = SVGs.home;
document.getElementById('pauseIcon').innerHTML = SVGs.pause;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6aa9d8);
scene.fog = new THREE.Fog(0x6aa9d8, 30, 140);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 300);
let cameraYaw = 0, cameraPitch = 0;
const PLAYER_EYE_HEIGHT = 1.55;

const renderer = new THREE.WebGLRenderer({ antialias: !!GFX.P().aa, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(GFX.pr());
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = [THREE.PCFShadowMap,THREE.PCFShadowMap,THREE.PCFShadowMap,THREE.PCFSoftShadowMap][GFX.P().sh];
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2));
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(25, 40, 20);
sun.castShadow = GFX.P().sh > 0;
sun.shadow.mapSize.set(GFX.P().shs, GFX.P().shs);
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
scene.add(sun);

const levelGroup = new THREE.Group(); scene.add(levelGroup);
const projectiles = new THREE.Group(); scene.add(projectiles);
const enemyProjectiles = new THREE.Group(); scene.add(enemyProjectiles);

const obstacles = [];
let activePowerups = [];
let speedMult = 1, attackSpeedMult = 1;
let currentBumpiness = 0;

function tileDraw(ctx, s, fn) {
    for(let dx=-1; dx<=1; dx++){
        for(let dy=-1; dy<=1; dy++){
            ctx.save(); ctx.translate(dx*s, dy*s); fn(); ctx.restore();
        }
    }
}

function makeTexture(size, draw){
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    draw(ctx, size);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

const asphaltTexture = makeTexture(256, (ctx, s) => {
    ctx.fillStyle = "#34363c"; ctx.fillRect(0, 0, s, s);
    tileDraw(ctx, s, () => {
        for(let i=0;i<600;i++){
            const shade = 15 + Math.random()*35;
            ctx.fillStyle = `rgba(${shade},${shade},${shade+6},${0.12+Math.random()*0.2})`;
            ctx.fillRect(Math.random()*s, Math.random()*s, 1.4, 1.4);
        }
    });
});

const arenaFloorTexture = makeTexture(256, (ctx, s) => {
    ctx.fillStyle = "#4a4d52"; ctx.fillRect(0, 0, s, s);
    tileDraw(ctx, s, () => {
        for(let i=0;i<800;i++){
            const shade = 30 + Math.random()*40;
            ctx.fillStyle = `rgba(${shade},${shade},${shade+8},${0.15+Math.random()*0.2})`;
            ctx.fillRect(Math.random()*s, Math.random()*s, 1.8, 1.8);
        }
    });
});

const lobbyFloorTexture = makeTexture(256, (ctx, s) => {
    ctx.fillStyle = "#14161c"; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,183,3,.35)"; ctx.lineWidth = 2;
    for(let i=0;i<=s;i+=32){
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(s,i); ctx.stroke();
    }
});

function getGroundHeight(x, z) {
    if(currentBumpiness === 0) return 0;
    let dist = Math.sqrt(x*x + z*z);
    if (dist <= 12) return 0;
    let bump = Math.sin(x*0.18)*Math.cos(z*0.18)*currentBumpiness + Math.sin(x*0.06 + z*0.08)*(currentBumpiness*1.5);
    return bump > 0 ? bump : bump*0.3;
}

function createTerrain(size, texture, repeat) {
    const tex = texture.clone(); tex.needsUpdate = true;
    tex.repeat.set(repeat, repeat);
    const geo = new THREE.PlaneGeometry(size, size, Math.min(200,Math.round(size/1.4)), Math.min(200,Math.round(size/1.4)));
    geo.rotateX(-Math.PI / 2);
    
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), z = pos.getZ(i);
        pos.setY(i, getGroundHeight(x, z));
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map:tex, roughness:.95 }));
    mesh.receiveShadow = true;
    levelGroup.add(mesh);
}





/* =========================================================
   PAYSAGE LOINTAIN (effet "monde ouvert")
   Ajouté une seule fois directement à la scène (pas à levelGroup) :
   il n'est donc jamais supprimé par clearScene() et reste visible
   en permanence, dans le salon comme dans toutes les parties.
========================================================= */

function createDistantScenery(){
    const group = new THREE.Group();
    const baseRadius = 95;

    for(let i=0;i<26;i++){
        const a = (i/26)*Math.PI*2 + Math.random()*.12;
        const r = baseRadius + Math.random()*30;
        const h = 7 + Math.random()*16;
        const hill = new THREE.Mesh(
            new THREE.ConeGeometry(9+Math.random()*10, h, 6),
            new THREE.MeshBasicMaterial({ color:0x5b7a9e, transparent:true, opacity:.4 })
        );
        hill.position.set(Math.cos(a)*r, h/2 - 3, Math.sin(a)*r);
        hill.rotation.y = Math.random()*Math.PI;
        group.add(hill);
    }

    for(let i=0;i<18;i++){
        const a = (i/18)*Math.PI*2 + Math.random()*.15;
        const r = baseRadius - 15 + Math.random()*18;
        const h = 10 + Math.random()*24;
        const bld = new THREE.Mesh(
            new THREE.BoxGeometry(4+Math.random()*4, h, 4+Math.random()*4),
            new THREE.MeshBasicMaterial({ color:0x3d4a5c, transparent:true, opacity:.32 })
        );
        bld.position.set(Math.cos(a)*r, h/2 - 3, Math.sin(a)*r);
        group.add(bld);
    }

    group.renderOrder = -1;
    scene.add(group);
    return group;
}


/* =========================================================
   SYSTÈME DE PIÈCES (monnaie persistante entre les parties)
========================================================= */

let coins = parseInt(localStorage.getItem("combat3d_coins") || "0", 10) || 0;
const activeCoins = [];

function saveCoins(){ localStorage.setItem("combat3d_coins", String(coins)); }

function addCoins(n){
    coins += n;
    saveCoins();
    const hud = document.getElementById("coinsHUD"); if(hud) hud.textContent = coins;
    const lobbyHud = document.getElementById("lobbyCoinsCount"); if(lobbyHud) lobbyHud.textContent = coins;
}

function spawnCoins(x, z, count){
    for(let i=0;i<count;i++){
        const angle = Math.random()*Math.PI*2, radius = Math.random()*1.4;
        const cx = x + Math.cos(angle)*radius, cz = z + Math.sin(angle)*radius;

        const coin = new THREE.Mesh(
            new THREE.CylinderGeometry(.2,.2,.06,16),
            new THREE.MeshStandardMaterial({ color:0xffd166, emissive:0xb8860b, emissiveIntensity:.6, metalness:.6, roughness:.3 })
        );
        coin.rotation.x = Math.PI/2;
        coin.position.set(cx, getGroundHeight(cx,cz) + .5, cz);
        levelGroup.add(coin);
        activeCoins.push(coin);
    }
}

function updateCoins(delta){
    for(let i = activeCoins.length - 1; i >= 0; i--){
        const c = activeCoins[i];
        c.rotation.z += delta * 3;
        c.position.y = getGroundHeight(c.position.x, c.position.z) + .5 + Math.sin(Date.now()*.004)*.15;

        if(c.position.distanceTo(player.position) < 1.6){
            addCoins(1);
            levelGroup.remove(c);
            activeCoins.splice(i,1);
        }
    }
}

function spawnPowerup(x, z) {
    const typeId = window.pickPU ? pickPU() : Math.floor(Math.random() * 3);
    const types = [ { color: 0x22c55e }, { color: 0x3b82f6 }, { color: 0xeab308 } ];
    
    const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.4),
        new THREE.MeshStandardMaterial({ color: types[typeId].color, emissive: types[typeId].color, emissiveIntensity: 0.6 })
    );
    mesh.position.set(x, getGroundHeight(x,z) + 1, z);
    mesh.userData = { type: typeId };
    levelGroup.add(mesh);
    activePowerups.push(mesh);
}

function updatePowerups(delta) {
    for(let i = activePowerups.length -1; i >= 0; i--){
        let p = activePowerups[i];
        p.rotation.y += delta * 2;
        p.position.y = getGroundHeight(p.position.x, p.position.z) + 1 + Math.sin(Date.now()*0.003) * 0.2;
        
        if(p.position.distanceTo(player.position) < 1.8){
            if(p.userData.type === 0) { playerHP = Math.min(100, playerHP + 40); updatePlayerBar(); }
            if(p.userData.type === 1) { speedMult = 1.6; setTimeout(()=> speedMult = 1, 6000); }
            if(p.userData.type === 2) { attackSpeedMult = 0.4; setTimeout(()=> attackSpeedMult = 1, 6000); }
            
            weaponEffect();
            levelGroup.remove(p);
            activePowerups.splice(i, 1);
        }
    }
}


function animateLimbs(character, delta, isMoving){
    const limbs = character.userData.limbs;
    if(!limbs) return;
    if(isMoving){
        character.userData.walkPhase += delta * 8;
        const swing = Math.sin(character.userData.walkPhase) * .5;
        limbs.armL.rotation.x = swing; limbs.armR.rotation.x = -swing;
        limbs.legL.rotation.x = -swing; limbs.legR.rotation.x = swing;
    } else {
        const settle = .12;
        limbs.armL.rotation.x *= (1-settle); limbs.armR.rotation.x *= (1-settle);
        limbs.legL.rotation.x *= (1-settle); limbs.legR.rotation.x *= (1-settle);
    }
}

const player = createFighter(0x168cff); scene.add(player); player.visible = true;
const enemies = [];

function collidesWithBuilding(x, z, radius=.65){
    for(const o of obstacles){
        const cX = Math.max(o.x-o.width/2, Math.min(x, o.x+o.width/2));
        const cZ = Math.max(o.z-o.depth/2, Math.min(z, o.z+o.depth/2));
        if((x-cX)**2 + (z-cZ)**2 < radius*radius) return true;
    }
    return false;
}

function findSafeSpawn(x,z,minRadius=2){ 
    if(!collidesWithBuilding(x,z,.9)) return {x,z}; 
    for(let r=minRadius;r<=12;r+=1){ 
        for(let i=0;i<24;i++){
            const a=i*Math.PI*2/24, sx=x+Math.cos(a)*r, sz=z+Math.sin(a)*r;
            if(!collidesWithBuilding(sx,sz,.9)) return {x:sx,z:sz};
        }
    } 
    return {x:0,z:0}; 
}

function createEnemy(x, z, opts={}){
    const safe=findSafeSpawn(x,z,2); x=safe.x; z=safe.z;
    const enemy = createFighter(opts.boss ? 0x7c0a02 : 0xef233c, {
        boss: !!opts.boss,
        backColor: opts.boss ? 0x450a0a : 0x3f0d0d,
        legColor: opts.boss ? 0x1a0505 : 0x2b0b0b,
        eyeColor: 0xff2222, eyeGlow: 0xff0000,
        headSize: opts.boss ? .52 : .43
    });
    enemy.position.set(x, getGroundHeight(x,z), z);

    enemy.userData.hp = (100 + (level - 1) * 35) * (opts.hpMult || 1);
    enemy.userData.maxHP = enemy.userData.hp;
    enemy.userData.shootCooldown = Math.random() * 2;
    enemy.userData.attackCooldown = Math.random();
    enemy.userData.alive = true; enemy.userData.deathTimer = 0; enemy.userData.boss = !!opts.boss;
    enemy.userData.originalScale = (1 + level * .08) * (opts.scaleMult || 1);
    enemy.userData.patrolTarget = null;
    enemy.scale.setScalar(enemy.userData.originalScale);

    if(opts.boss){
        enemy.userData.bState = "chase";
        enemy.userData.bTimer = 0;
        enemy.userData.bCooldown = 1.4;
        enemy.userData.vulnerable = false;
        enemy.userData.chargeTarget = null;
        enemy.userData.ringMesh = null;
        enemy.userData.barrageLeft = 0;
    }

    scene.add(enemy); enemies.push(enemy);
    return enemy;
}

/* =========================================================
   BOSS : attaques télégraphiées + point faible
   (le joueur voit venir l'attaque, peut l'esquiver, puis
   profiter d'une brève fenêtre de vulnérabilité pour riposter)
========================================================= */

const BOSS_ATTACKS = [
    { name:"slam",    windup:1.1, radius:5.5, damage:38, color:0xff3333 },
    { name:"charge",  windup:.9,  radius:1.7, damage:34, color:0xffaa00 },
    { name:"barrage", windup:.8,  radius:2.2, damage:14, color:0x8b5cf6, count:3 }
];

function createWarningRing(radius, color){
    const geo = new THREE.RingGeometry(radius*0.82, radius, 40);
    const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.35, side:THREE.DoubleSide, depthWrite:false });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI/2;
    levelGroup.add(ring);
    return ring;
}

function hurtPlayer(damage){
    playerHP = Math.max(0, playerHP - damage);
    updatePlayerBar();
    const flash = document.getElementById("damageFlash");
    flash.classList.remove("active"); void flash.offsetWidth; flash.classList.add("active");
    if(playerHP <= 0) endGame(false);
}

function startBossAttack(enemy){
    const ud = enemy.userData;
    const attack = BOSS_ATTACKS[Math.floor(Math.random()*BOSS_ATTACKS.length)];
    ud.attack = attack;
    ud.bState = "telegraph";
    ud.bTimer = attack.windup;
    ud.chargeHit = false;

    if(attack.name === "charge") ud.chargeTarget = player.position.clone();

    ud.ringMesh = createWarningRing(attack.radius, attack.color);
    ud.ringMesh.position.set(enemy.position.x, .05, enemy.position.z);
}

function executeBossAttack(enemy){
    const ud = enemy.userData;
    const attack = ud.attack;

    if(ud.ringMesh){ levelGroup.remove(ud.ringMesh); ud.ringMesh = null; }

    if(attack.name === "slam"){
        if(Math.hypot(camera.position.x-enemy.position.x, camera.position.z-enemy.position.z) <= attack.radius){
            hurtPlayer(attack.damage);
        }
        enterVulnerable(enemy);
    } else if(attack.name === "charge"){
        ud.bState = "attacking";
    } else if(attack.name === "barrage"){
        ud.bState = "attacking";
        ud.barrageLeft = attack.count;
        ud.bTimer = 0;
    }
}

function fireBossProjectile(enemy){
    const proj = new THREE.Mesh(
        new THREE.SphereGeometry(.15,10,10),
        new THREE.MeshStandardMaterial({ color:0xff2222, emissive:0xff0000, emissiveIntensity:4 })
    );
    proj.position.copy(enemy.position); proj.position.y += 1.2;
    const dir = new THREE.Vector3().subVectors(camera.position, proj.position).normalize();
    proj.userData = { velocity: dir.multiplyScalar(20 + level), life:4, damage: enemy.userData.attack.damage };
    enemyProjectiles.add(proj);
}

function enterVulnerable(enemy){
    const ud = enemy.userData;
    ud.bState = "vulnerable";
    ud.bTimer = 2.4;
    ud.vulnerable = true;
    if(ud.weakPointMesh) ud.weakPointMesh.visible = true;
}

function updateBossAI(enemy, delta){
    const ud = enemy.userData;
    const toPlayer = new THREE.Vector3().subVectors(player.position, enemy.position); toPlayer.y = 0;
    const dist = toPlayer.length();
    const dir = dist > .01 ? toPlayer.clone().normalize() : new THREE.Vector3(0,0,1);

    if(ud.bState !== "attacking" || ud.attack.name !== "charge"){
        enemy.rotation.y = Math.atan2(dir.x, dir.z);
    }

    if(ud.bState === "chase"){
        animateLimbs(enemy, delta, dist > 3);
        if(dist > 3) moveCharacter(enemy, dir.x*(2.2+level*.15)*delta, dir.z*(2.2+level*.15)*delta);
        ud.bCooldown -= delta;
        if(dist < 13 && ud.bCooldown <= 0) startBossAttack(enemy);
        return;
    }

    if(ud.bState === "telegraph"){
        animateLimbs(enemy, delta, false);
        ud.bTimer -= delta;
        if(ud.ringMesh) ud.ringMesh.material.opacity = .3 + Math.sin(Date.now()*.02)*.15;
        ud.mainMaterial.emissiveIntensity = 1.2 + Math.sin(Date.now()*.02)*.6;
        if(ud.bTimer <= 0) executeBossAttack(enemy);
        return;
    }

    if(ud.bState === "attacking"){
        if(ud.attack.name === "charge"){
            const toTarget = new THREE.Vector3().subVectors(ud.chargeTarget, enemy.position); toTarget.y = 0;
            const d = toTarget.length();
            if(d > .6){
                const step = Math.min(d, 24*delta);
                const dirC = toTarget.normalize();
                const nx = enemy.position.x + dirC.x*step, nz = enemy.position.z + dirC.z*step;
                if(!collidesWithBuilding(nx, nz, .6)){ enemy.position.x = nx; enemy.position.z = nz; }
                clampToBoundary(enemy);
                if(!ud.chargeHit && Math.hypot(camera.position.x-enemy.position.x, camera.position.z-enemy.position.z) < 1.9){
                    ud.chargeHit = true;
                    hurtPlayer(ud.attack.damage);
                }
            } else {
                enterVulnerable(enemy);
            }
        } else if(ud.attack.name === "barrage"){
            ud.bTimer -= delta;
            if(ud.bTimer <= 0 && ud.barrageLeft > 0){
                fireBossProjectile(enemy);
                ud.barrageLeft--;
                ud.bTimer = .25;
            } else if(ud.barrageLeft <= 0){
                enterVulnerable(enemy);
            }
        }
        return;
    }

    if(ud.bState === "vulnerable"){
        animateLimbs(enemy, delta, dist > 2.5);
        ud.bTimer -= delta;
        if(ud.weakPointMesh) ud.weakPointMesh.scale.setScalar(1 + Math.sin(Date.now()*.012)*.18);
        if(dist > 2.5) moveCharacter(enemy, dir.x*1.1*delta, dir.z*1.1*delta);
        if(ud.bTimer <= 0){
            ud.vulnerable = false;
            if(ud.weakPointMesh) ud.weakPointMesh.visible = false;
            ud.mainMaterial.emissiveIntensity = 0;
            ud.bState = "chase";
            ud.bCooldown = 1.1 + Math.random()*.8;
        }
    }
}

let playerHP = 100, level = 1, wave = 1, score = 0, gameFinished = false;
let velocityY = 0, grounded = true;
const GRAVITY = -28, JUMP = 11, SPEED = 8;
let state = "lobby", currentModeKey = null, lobbyAngle = 0;
let paused = false;
let aiming = false;
let thirdPerson = false;
let ignoreNextMouseDelta = false;
let BASE_FOV = GFX.fov, AIM_FOV = 45;

const KNIFE_SVG=`<svg viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" stroke-width="2"><path d="M4 20l9-9 5-7 2 2-7 5-9 9z"/></svg>`;
const weapons = {
    knife:{ name:"Couteau", icon:KNIFE_SVG, damage:35, range:2.7, cooldown:.38, ammo:Infinity, type:"melee", snd:"knife" },
    glock:{ name:"Glock 19", icon:SVGs.gun, damage:18, range:70, cooldown:.15, ammo:15, maxAmmo:15, type:"gun", snd:"pistol", rt:1.3 },
    deagle:{ name:"Desert Eagle", icon:SVGs.gun, damage:48, range:80, cooldown:.5, ammo:7, maxAmmo:7, type:"gun", snd:"deagle", rt:1.6 },
    revolver:{ name:"Revolver", icon:SVGs.gun, damage:60, range:75, cooldown:.7, ammo:6, maxAmmo:6, type:"gun", snd:"revolver", rt:2.1 },
    smg:{ name:"SMG", icon:SVGs.rapidgun, damage:11, range:60, cooldown:.075, ammo:30, maxAmmo:30, type:"gun", snd:"rapid", auto:true, rt:1.5 },
    ak:{ name:"Fusil d'assaut", icon:SVGs.rapidgun, damage:20, range:85, cooldown:.1, ammo:30, maxAmmo:30, type:"gun", snd:"rifle", auto:true, rt:1.9 },
    shotgun:{ name:"Fusil à pompe", icon:SVGs.rapidgun, damage:80, range:16, cooldown:.9, ammo:6, maxAmmo:6, type:"gun", snd:"shotgun", rt:2.2 },
    sniper:{ name:"Sniper", icon:SVGs.rapidgun, damage:110, range:160, cooldown:1.2, ammo:5, maxAmmo:5, type:"gun", snd:"sniper", rt:2.4 },
    hammer:{ name:"Marteau", icon:SVGs.hammer, damage:40, range:2.8, cooldown:.9, ammo:Infinity, type:"melee", snd:"hammer" }
};
const weaponOrder = ["knife","glock","deagle","revolver","smg","ak","shotgun","sniper","hammer"];
let currentWeapon = weapons.glock;
let attackCooldown = 0;

function clearScene(){
    for(const e of enemies) scene.remove(e); enemies.length = 0;
    for(const p of activePowerups) scene.remove(p); activePowerups.length = 0;
    activeCoins.length = 0;
    while(enemyProjectiles.children.length) enemyProjectiles.remove(enemyProjectiles.children[0]);
    while(projectiles.children.length) projectiles.remove(projectiles.children[0]);
    while(levelGroup.children.length) levelGroup.remove(levelGroup.children[0]);
    obstacles.length = 0;
}

const MODES = {
    ville:{
        label:"Ville", icon:SVGs.city, desc:"Éliminez les ennemis en pleine métropole avec ses parcs.",
        infinite:false, startLevel:3, boundary:38,
        build(){
            currentBumpiness = 0;
            createTerrain(80, asphaltTexture, 18);
            
            [[-16,-15],[-31,-15],[-16,-32],[-31,-32],[16,-15],[31,-15],[16,-32],[31,-32],[-16,15],[-31,15],[-16,32],[-31,32]].forEach((p,i)=>{ createBuilding(p[0],p[1],8+Math.random()*2,12+Math.random()*13,8+Math.random()*2,[0xb9a98a,0x9aa9b8,0xa89c86,0xb3bcc4,0x8f9aa8][i%5]); });

            
            createBench(9.5,-9,Math.PI/2); createBench(-9.5,9,-Math.PI/2);
            createCrate(12,9); createCrate(13,10);

            player.position.set(0,0,32);
        },
        spawn(){
            [[-3,-28],[3,-20],[-24,0],[26,0],[22,18],[-3,28]].forEach(p => createEnemy(p[0],p[1]));
        }
    },
    survie:{
        label:"Vallée Survie", icon:SVGs.wave, desc:"Des vagues d'ennemis sur un terrain très valonné !",
        infinite:true, startLevel:1, boundary:43,
        build(){
            currentBumpiness = 1.8;
            createTerrain(260, arenaFloorTexture, 43);
            
            for(let i=0; i<45; i++) {
                let r = 12 + Math.random()*30; let ang = Math.random() * Math.PI * 2;
                createTree(Math.cos(ang)*r, Math.sin(ang)*r);
                if(Math.random()<0.5) createBush(Math.cos(ang)*r + 2, Math.sin(ang)*r - 2);
            }
            player.position.set(0,0,0);
        },
        spawn(){
            const count = Math.min(2 + wave, 12);
            for(let i=0;i<count;i++){
                const angle = (i / count) * Math.PI * 2, radius = 25;
                createEnemy(Math.sin(angle)*radius, Math.cos(angle)*radius);
            }
        }
    }
};

const modeCardsEl = document.getElementById("modeCards");
Object.keys(MODES).forEach(key => {
    const mode = MODES[key];
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<span class="icon">${mode.icon}</span><div class="name">${mode.label}</div><div class="desc">${mode.desc}</div><div class="play">▶ Jouer</div>`;
    card.addEventListener("click", () => startMode(key));
    modeCardsEl.appendChild(card);
});

const hotbarEl = document.getElementById("hotbar");
const slotEls = {};
weaponOrder.forEach((key) => {
    const w = weapons[key];
    const slot = document.createElement("div"); slot.className = "slot";
    slot.innerHTML = `${w.icon}<span class="badge" id="badge_${key}"></span>`;
    slot.addEventListener("click", () => { currentWeapon = w; updateWeaponHUD(); });
    hotbarEl.appendChild(slot); slotEls[key] = slot;
});

function updateWeaponHUD(){
    weaponOrder.forEach(key => {
        slotEls[key].classList.toggle("active", currentWeapon === weapons[key]);
        document.getElementById("badge_" + key).textContent = weapons[key].ammo === Infinity ? "" : weapons[key].ammo;
    });
    if(isMobile) document.getElementById('btnWeapon').innerHTML = currentWeapon.icon;
}

function updateEnemyCount(){ document.getElementById("enemyCount").textContent = enemies.filter(e => e.userData.alive).length; }
function updatePlayerBar(){
    document.getElementById("playerHealth").style.width = Math.max(0, playerHP) + "%";
    document.getElementById("playerHealthNum").textContent = Math.ceil(Math.max(0, playerHP));
}

document.addEventListener("keydown", e => {
    const idx = parseInt(e.key) - 1;
    if(idx >= 0 && idx < weaponOrder.length){ currentWeapon = weapons[weaponOrder[idx]]; updateWeaponHUD(); }
    if(e.key.toLowerCase() === "r" && currentWeapon.ammo !== Infinity) reload();
});

const keys = {};
document.addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; if(e.key === " " && !e.repeat) jump(); if(e.key.toLowerCase() === "f" && !e.repeat) attack(); });
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let touchMove = {x:0, y:0};
let lastTouchX=0, lastTouchY=0;

if(isMobile) {
    document.getElementById("weaponView").classList.add("mobile");
    
    const joyBase = document.getElementById('joyBase');
    const joyKnob = document.getElementById('joyKnob');
    let jBX=0, jBY=0, joyActive = false;
    
    joyBase.addEventListener('touchstart', e=>{
        e.preventDefault();
        const r = joyBase.getBoundingClientRect(); jBX = r.left + r.width/2; jBY = r.top + r.height/2;
        joyActive = true; handleJoy(e);
    });
    joyBase.addEventListener('touchmove', e=>{ e.preventDefault(); if(joyActive) handleJoy(e); });
    joyBase.addEventListener('touchend', e=>{ e.preventDefault(); joyActive=false; touchMove={x:0,y:0}; joyKnob.style.transform=`translate(-50%, -50%)`; });
    
    function handleJoy(e) {
        let t = null; for(let i=0; i<e.touches.length; i++){ if(e.touches[i].target === joyBase || e.touches[i].target === joyKnob){ t=e.touches[i]; break; } }
        if(!t) return;
        let dx = t.clientX - jBX, dy = t.clientY - jBY;
        let dist = Math.hypot(dx, dy); const max = 40;
        if(dist > max) { dx=(dx/dist)*max; dy=(dy/dist)*max; }
        joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        touchMove.x = dx / max; touchMove.y = dy / max;
    }

    const aimArea = document.getElementById('touchAimArea');
    aimArea.addEventListener('touchstart', e=>{
        e.preventDefault(); lastTouchX = e.targetTouches[0].clientX; lastTouchY = e.targetTouches[0].clientY;
    });
    aimArea.addEventListener('touchmove', e=>{
        e.preventDefault();
        const t = e.targetTouches[0];
        let dx = t.clientX - lastTouchX, dy = t.clientY - lastTouchY;
        const sens = aiming ? 0.0022 : 0.005;
        cameraYaw -= dx * sens; cameraPitch -= dy * sens;
        cameraPitch = Math.max(-Math.PI/2 + .1, Math.min(Math.PI/2 - .1, cameraPitch));
        lastTouchX = t.clientX; lastTouchY = t.clientY;
    });

    document.getElementById('btnJump').addEventListener('touchstart', e=>{ e.preventDefault(); jump(); });
    document.getElementById('btnShoot').addEventListener('touchstart', e=>{ e.preventDefault(); attack(); });
    document.getElementById('btnWeapon').addEventListener('touchstart', e=>{ 
        e.preventDefault();
        let idx = weaponOrder.indexOf(Object.keys(weapons).find(k => weapons[k] === currentWeapon));
        currentWeapon = weapons[weaponOrder[window.nextW ? nextW(idx) : (idx + 1) % weaponOrder.length]]; updateWeaponHUD();
    });
} else {
    renderer.domElement.addEventListener("click", () => {
        if(state !== "playing" || paused) return;
        if(document.pointerLockElement !== renderer.domElement){ renderer.domElement.requestPointerLock(); return; }
        attack();
    });

    renderer.domElement.addEventListener("contextmenu", e => e.preventDefault());
    renderer.domElement.addEventListener("mousedown", e => { if(e.button === 2 && state === "playing" && !paused) setAiming(true); });
    document.addEventListener("mouseup", e => { if(e.button === 2) setAiming(false); });

    document.addEventListener("pointerlockchange", () => {
        const locked = document.pointerLockElement === renderer.domElement;
        document.getElementById("lockMessage").style.display = (locked || state !== "playing" || paused) ? "none" : "flex";
        // Le tout premier mouvement de souris juste après le verrouillage du
        // pointeur est souvent énorme et faussé par le navigateur : on l'ignore
        // pour éviter que la caméra ne parte brutalement dans tous les sens.
        if(locked) ignoreNextMouseDelta = true;
    });

    document.addEventListener("mousemove", e => {
        if(document.pointerLockElement !== renderer.domElement || paused) return;
        if(ignoreNextMouseDelta){ ignoreNextMouseDelta = false; return; }
        const sens = aiming ? .0011 : .0025;
        cameraYaw -= e.movementX * sens * GFX.sens; cameraPitch -= e.movementY * sens * GFX.sens;
        cameraPitch = Math.max(-Math.PI/2 + .1, Math.min(Math.PI/2 - .1, cameraPitch));
    });
}

function setAiming(v){
    aiming = v;
    camera.fov = v ? AIM_FOV : BASE_FOV;
    camera.updateProjectionMatrix();
    document.getElementById("crosshair").classList.toggle("aiming", v);
    const btn = document.getElementById("btnAim");
    if(btn) btn.classList.toggle("aiming", v);
}

if(isMobile){
    const btnAim = document.getElementById("btnAim");
    btnAim.addEventListener("touchstart", e => {
        e.preventDefault();
        if(state !== "playing" || paused) return;
        setAiming(!aiming);
    });

    document.getElementById("btnView").addEventListener("touchstart", e => { e.preventDefault(); toggleThirdPerson(); });
}

function jump(){
    if(grounded && state === "playing" && !gameFinished){ velocityY = JUMP; grounded = false; }
}

function moveCharacter(character, dx, dz){
    const newX = character.position.x + dx;
    if(!collidesWithBuilding(newX, character.position.z)) character.position.x = newX;
    const newZ = character.position.z + dz;
    if(!collidesWithBuilding(character.position.x, newZ)) character.position.z = newZ;
    clampToBoundary(character);
}

// Barrière invisible carrée : ni le joueur ni les ennemis ne peuvent sortir de la carte.
function clampToBoundary(character){
    const mode = MODES[currentModeKey];
    if(!mode || !mode.boundary) return;
    const b = mode.boundary;
    character.position.x = Math.max(-b, Math.min(b, character.position.x));
    character.position.z = Math.max(-b, Math.min(b, character.position.z));
}

function startMode(key){
    const mode = MODES[key]; if(!mode) return;
    currentModeKey = key; score = 0; wave = 1; level = mode.startLevel; gameFinished = false; playerHP = 100;
    speedMult = 1; attackSpeedMult = 1; thirdPerson = false;

    for(const k in weapons) if(weapons[k].maxAmmo) weapons[k].ammo = weapons[k].maxAmmo;
    currentWeapon = weapons.glock;

    clearScene();
    try{ mode.build(); mode.spawn(); }
    catch(err){ console.error("Erreur lors de la construction du mode :", err); }
    player.visible = false;

    document.getElementById("wavePanel").style.display = mode.infinite ? "flex" : "none";
    document.getElementById("wave").textContent = wave;

    updatePlayerBar(); updateWeaponHUD(); document.getElementById("score").textContent = score; updateEnemyCount();
    cameraYaw = Math.PI; cameraPitch = 0;

    document.getElementById("lobby").style.display = "none";
    document.getElementById("hud").style.display = "block";
    document.getElementById("topRight").style.display = "block";
    document.getElementById("crosshair").style.display = "block";
    if(isMobile) document.getElementById('mobileUI').style.display = 'block';
    if(!isMobile) { document.getElementById("hotbar").style.display = "flex"; document.getElementById("lockMessage").style.display = "flex"; }
    document.getElementById("weaponView").style.display = "block";
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("btnPause").style.display = "flex";
    document.getElementById("pauseMenu").style.display = "none";
    paused = false;
    setAiming(false);
    state = "playing";
}

function buildLobbyScene(){
    currentBumpiness = 0;
    // Le sol fait maintenant 50 unités de large : les immeubles (jusqu'à ±18)
    // tiennent largement dedans et ne dépassent plus dans le vide.
    createTerrain(50, lobbyFloorTexture, 10);

    createBuilding(-16,-14, 6,9,6, 0x334155);
    createBuilding(16,-16, 6,12,6, 0x475569);
    createBuilding(-18,11, 5,7,5, 0x52525b);
    createBuilding(18,13, 5,10,5, 0x475569);

    createBench(4,5,0); createBench(-4,5,Math.PI);
    createCrate(0,7); createCrate(1,7.6);
    createTree(-9,-3); createTree(9,-3);

    player.position.set(0,0,0); player.visible = true;
}

function goToLobby(){
    gameFinished = true; state = "lobby"; paused = false;
    setAiming(false);
    if(document.pointerLockElement) document.exitPointerLock();
    clearScene(); buildLobbyScene();

    document.getElementById("lobby").style.display = "flex";
    if(isMobile) document.getElementById('mobileUI').style.display = 'none';
    document.getElementById("hud").style.display = "none"; document.getElementById("topRight").style.display = "none";
    document.getElementById("targetPanel").style.display = "none"; document.getElementById("crosshair").style.display = "none";
    document.getElementById("hotbar").style.display = "none"; document.getElementById("weaponView").style.display = "none";
    document.getElementById("lockMessage").style.display = "none"; document.getElementById("gameOver").style.display = "none";
    document.getElementById("btnPause").style.display = "none"; document.getElementById("pauseMenu").style.display = "none";
}

document.getElementById("btnRestart").addEventListener("click", ()=> {if(currentModeKey) startMode(currentModeKey);});
document.getElementById("btnLobby").addEventListener("click", () => goToLobby());

function pauseGame(){
    if(state !== "playing" || paused) return;
    paused = true;
    setAiming(false);
    if(document.pointerLockElement) document.exitPointerLock();
    document.getElementById("pauseMenu").style.display = "flex";
    document.getElementById("lockMessage").style.display = "none";
}

function resumeGame(){
    if(!paused) return;
    paused = false;
    document.getElementById("pauseMenu").style.display = "none";
    if(!isMobile) document.getElementById("lockMessage").style.display = "flex";
}

function togglePause(){ paused ? resumeGame() : pauseGame(); }

document.getElementById("btnPause").addEventListener("click", () => togglePause());
document.getElementById("btnResume").addEventListener("click", () => resumeGame());
document.getElementById("btnPauseLobby").addEventListener("click", () => {
    paused = false;
    document.getElementById("pauseMenu").style.display = "none";
    goToLobby();
});

document.addEventListener("keydown", e => { if(e.key === "Escape") togglePause(); });

function toggleThirdPerson(){
    if(state !== "playing") return;
    thirdPerson = !thirdPerson;
    document.getElementById("weaponView").style.display = thirdPerson ? "none" : "block";
    document.getElementById("btnView")?.classList.toggle("active", thirdPerson);
}

document.addEventListener("keydown", e => { if(e.key.toLowerCase() === "v" && !e.repeat) toggleThirdPerson(); });

function endGame(winFlag){
    if(gameFinished) return; gameFinished = true;
    document.getElementById("resultIcon").innerHTML = winFlag ? SVGs.trophy : SVGs.skull;
    document.getElementById("statLine").textContent = MODES[currentModeKey].infinite ? ("Vague " + wave + " — Score : " + score) : ("Score : " + score);
    document.getElementById("gameOver").style.display = "flex";
    document.getElementById("btnPause").style.display = "none";
    if(document.pointerLockElement) document.exitPointerLock();
}

function damageEnemy(enemy, damage){
    if(!enemy || !enemy.userData.alive) return;

    if(enemy.userData.boss){
        damage *= enemy.userData.vulnerable ? 2.4 : .35;
    }

    enemy.userData.hp -= damage; enemy.userData.hp = Math.max(0, enemy.userData.hp);
    document.getElementById("crosshair").classList.add("hit"); setTimeout(() => document.getElementById("crosshair").classList.remove("hit"), 130);

    if(enemy.userData.hp <= 0){
        enemy.userData.alive = false; score += enemy.userData.boss ? 5 : 1;
        document.getElementById("score").textContent = score; updateEnemyCount();
        if(enemy.userData.ringMesh){ levelGroup.remove(enemy.userData.ringMesh); enemy.userData.ringMesh = null; }
        spawnCoins(enemy.position.x, enemy.position.z, enemy.userData.boss ? 10 : (1 + Math.floor(Math.random()*3)));
        if(Math.random() < 0.42) spawnPowerup(enemy.position.x, enemy.position.z);
    }
    const target = getTargetUnderCrosshair();
    if(target) {
        document.getElementById("enemyHealth").style.width = (target.userData.hp / target.userData.maxHP * 100) + "%";
        document.getElementById("enemyHealthNum").textContent = Math.ceil(target.userData.hp);
        document.getElementById("targetPanel").style.display = "block";
    }

    if(enemies.every(e => !e.userData.alive)) setTimeout(()=>{
        if(!MODES[currentModeKey].infinite){ endGame(true); return; }
        wave++; level=wave; document.getElementById("wave").textContent = wave;
        playerHP = Math.min(100, playerHP + 8); updatePlayerBar();
        const wf = document.getElementById("waveFlash"); wf.innerHTML = SVGs.wave + " " + wave; wf.classList.add("show"); setTimeout(() => wf.classList.remove("show"), 900);
        setTimeout(() => { if(!gameFinished){ MODES[currentModeKey].spawn(); updateEnemyCount(); } }, 1200);
    }, 600);
}

const raycaster = new THREE.Raycaster();
function getTargetUnderCrosshair(){
    raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
    let best = null, bestDist = Infinity;
    for(const enemy of enemies){
        if(!enemy.userData.alive) continue;
        const hits = raycaster.intersectObjects(enemy.children, true);
        if(hits.length > 0){
            const dist = raycaster.ray.origin.distanceTo(hits[0].point);
            if(dist < bestDist){ bestDist = dist; best = enemy; }
        }
    }
    return best;
}

function weaponEffect(){
    const view = document.getElementById("weaponView");
    view.classList.remove("flash","recoil"); void view.offsetWidth; view.classList.add("flash","recoil");
    setTimeout(() => view.classList.remove("flash","recoil"), 100);
    document.getElementById("crosshair").classList.add("shoot"); setTimeout(() => document.getElementById("crosshair").classList.remove("shoot"), 80);
}

function reload(){ weaponEffect(); setTimeout(() => { currentWeapon.ammo = currentWeapon.maxAmmo; updateWeaponHUD(); }, 550); }

function attack(){
    if(state !== "playing" || attackCooldown > 0 || gameFinished) return;
    if(!isMobile && !window.PAD_ON && document.pointerLockElement !== renderer.domElement) return;

    attackCooldown = currentWeapon.cooldown * attackSpeedMult;

    if(currentWeapon.type === "gun"){
        if(currentWeapon.ammo <= 0){ reload(); return; }
        currentWeapon.ammo--; updateWeaponHUD(); weaponEffect();
        const closest = getTargetUnderCrosshair();
        if(closest && camera.position.distanceTo(closest.position) <= currentWeapon.range){
            damageEnemy(closest, currentWeapon.damage);
            const push = raycaster.ray.direction.clone(); push.y = 0; if(push.lengthSq()>0) moveCharacter(closest, push.x*.7, push.z*.7);
        }
        return;
    }
    if(currentWeapon.type === "energy"){
        const bullet = new THREE.Mesh(new THREE.SphereGeometry(.28,16,16), new THREE.MeshStandardMaterial({ color:0x8b5cf6, emissive:0x6d28d9, emissiveIntensity:2 }));
        bullet.position.copy(camera.position); raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
        bullet.userData = { velocity: raycaster.ray.direction.clone().multiplyScalar(30), life: 2, damage: currentWeapon.damage };
        projectiles.add(bullet); weaponEffect(); return;
    }
    const target = getTargetUnderCrosshair();
    if(target && camera.position.distanceTo(target.position) <= currentWeapon.range) damageEnemy(target, currentWeapon.damage);
}

const clock = new THREE.Clock();

function animate(){
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), .04);

    if(paused){
        renderer.render(scene, camera);
        return;
    }

    if(state === "playing"){
        let forward = 0, strafe = 0;
        if(!isMobile) {
            if(keys["z"] || keys["w"] || keys["arrowup"]) forward++;
            if(keys["s"] || keys["arrowdown"]) forward--;
            if(keys["q"] || keys["a"] || keys["arrowleft"]) strafe--;
            if(keys["d"] || keys["arrowright"]) strafe++;
        } else {
            forward -= touchMove.y; strafe += touchMove.x;
        }

        if(forward !== 0 || strafe !== 0){
            const fV = new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw)).multiplyScalar(-1);
            const rV = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
            const dir = new THREE.Vector3().addScaledVector(fV, forward).addScaledVector(rV, strafe).normalize();
            moveCharacter(player, dir.x*SPEED*speedMult*delta, dir.z*SPEED*speedMult*delta);
            animateLimbs(player, delta, true);
        } else {
            animateLimbs(player, delta, false);
        }

        velocityY += GRAVITY*delta; player.position.y += velocityY*delta;
        const groundY = getGroundHeight(player.position.x, player.position.z);
        if(player.position.y <= groundY){ player.position.y = groundY; velocityY = 0; grounded = true; }

        if(attackCooldown > 0) attackCooldown -= delta;

        for(const enemy of enemies){
            if(!enemy.userData.alive){
                enemy.userData.deathTimer += delta; enemy.rotation.z += delta*5; enemy.position.y -= delta*1.5;
                enemy.scale.multiplyScalar(Math.max(0, 1 - delta*1.5)); if(enemy.userData.deathTimer > 1) enemy.visible = false;
                continue;
            }

            if(enemy.userData.boss){
                updateBossAI(enemy, delta);
                enemy.position.y = getGroundHeight(enemy.position.x, enemy.position.z);
                continue;
            }
            if(window.BOT && BOT.pre(enemy, delta)) continue;   // v9 : fuite / saut des bots

            let moved = false;
            const dir = new THREE.Vector3().subVectors(player.position, enemy.position); dir.y = 0; const dist = dir.length();
            
            let canSeePlayer = false;
            if (dist <= 35) {
                const toPlayer = dir.clone().normalize();
                const forward = new THREE.Vector3(Math.sin(enemy.rotation.y), 0, Math.cos(enemy.rotation.y));
                if (forward.angleTo(toPlayer) < Math.PI / 2.5) { 
                    if (window.fastLOS) { if (window.fastLOS(enemy, dist)) canSeePlayer = true; } else { raycaster.set(enemy.position, toPlayer);
                    const hits = raycaster.intersectObjects(levelGroup.children, true);
                    let obstacle = false;
                    for (const h of hits) {
                        if (h.distance < dist) { obstacle = true; break; }
                    }
                    if (!obstacle) canSeePlayer = true; }
                }
            }

            if (canSeePlayer || dist < 3) {
                enemy.userData.patrolTarget = null;
                dir.normalize(); enemy.rotation.y = Math.atan2(dir.x, dir.z);
                if(dist > 11){ 
                    moveCharacter(enemy, dir.x*(2.5+level*.3)*delta, dir.z*(2.5+level*.3)*delta); 
                    moved = true;
                }
                
                enemy.userData.shootCooldown -= delta;
                if(dist <= 35 && dist > 5 && enemy.userData.shootCooldown <= 0){
                    const proj = new THREE.Mesh(new THREE.SphereGeometry(.13,10,10), new THREE.MeshStandardMaterial({ color:0xff2222, emissive:0xff0000, emissiveIntensity:4 }));
                    proj.position.copy(enemy.position); proj.position.y += 1.15;
                    proj.userData = { velocity: new THREE.Vector3().subVectors(camera.position, proj.position).normalize().multiplyScalar(18 + level*1.5), life: 4, damage: 7 + level*2 };
                    enemyProjectiles.add(proj);
                    enemy.userData.shootCooldown = Math.max(.7, 2.2 - level*.18);
                }
                enemy.userData.attackCooldown -= delta;
                if(dist <= 2.3 && enemy.userData.attackCooldown <= 0){
                    enemy.userData.attackCooldown = Math.max(.45, 1.1 - level*.1);
                    playerHP -= 8 + level*2; playerHP = Math.max(0, playerHP); updatePlayerBar();
                    document.getElementById("damageFlash").classList.remove("active"); void document.getElementById("damageFlash").offsetWidth; document.getElementById("damageFlash").classList.add("active");
                    if(playerHP <= 0) endGame(false);
                }
            } else {
                if (!enemy.userData.patrolTarget || enemy.position.distanceTo(enemy.userData.patrolTarget) < 1.5) {
                    const a = Math.random() * Math.PI * 2;
                    const r = 6 + Math.random() * 8;
                    const px = enemy.position.x + Math.cos(a) * r;
                    const pz = enemy.position.z + Math.sin(a) * r;
                    if (!collidesWithBuilding(px, pz, 1.2)) {
                        enemy.userData.patrolTarget = new THREE.Vector3(px, getGroundHeight(px, pz), pz);
                    }
                }
                if (enemy.userData.patrolTarget) {
                    const pDir = new THREE.Vector3().subVectors(enemy.userData.patrolTarget, enemy.position);
                    pDir.y = 0; pDir.normalize();
                    enemy.rotation.y = Math.atan2(pDir.x, pDir.z);
                    moveCharacter(enemy, pDir.x*1.5*delta, pDir.z*1.5*delta);
                    moved = true;
                }
            }
            animateLimbs(enemy, delta, moved);
            enemy.position.y = getGroundHeight(enemy.position.x, enemy.position.z) + (enemy.userData.jumpH||0);
        }

        for(let i = projectiles.children.length - 1; i >= 0; i--){
            const p = projectiles.children[i]; p.position.addScaledVector(p.userData.velocity, delta); p.userData.life -= delta;
            if(p.userData.life <= 0 || collidesWithBuilding(p.position.x, p.position.z, .2)) { projectiles.remove(p); continue; }
            for(const enemy of enemies){
                if(enemy.userData.alive && p.position.distanceTo(enemy.position) < 1.5){ damageEnemy(enemy, p.userData.damage); projectiles.remove(p); break; }
            }
        }
        for(let i = enemyProjectiles.children.length - 1; i >= 0; i--){
            const p = enemyProjectiles.children[i]; p.position.addScaledVector(p.userData.velocity, delta); p.userData.life -= delta;
            if(p.userData.life <= 0 || collidesWithBuilding(p.position.x, p.position.z, .15)){ enemyProjectiles.remove(p); continue; }
            if(p.position.distanceTo(camera.position) < .8){
                playerHP = Math.max(0, playerHP - p.userData.damage); updatePlayerBar();
                document.getElementById("damageFlash").classList.remove("active"); void document.getElementById("damageFlash").offsetWidth; document.getElementById("damageFlash").classList.add("active");
                enemyProjectiles.remove(p); if(playerHP <= 0) endGame(false);
            }
        }
        
        updatePowerups(delta);
        updateCoins(delta);
        if(!getTargetUnderCrosshair()) document.getElementById("targetPanel").style.display = "none";
        
        camera.position.set(player.position.x, player.position.y + PLAYER_EYE_HEIGHT, player.position.z);
        // On fixe x, y, z ET l'ordre en un seul appel : ça évite qu'un ancien
        // angle de "roulis" (z) laissé par le camera.lookAt() du salon soit
        // réinterprété sous un ordre différent, ce qui donnait une caméra penchée.
        camera.rotation.set(cameraPitch, cameraYaw, 0, "YXZ");

        if(thirdPerson){
            const dist = 4.2;
            const desiredX = player.position.x + Math.sin(cameraYaw) * dist;
            const desiredZ = player.position.z + Math.cos(cameraYaw) * dist;
            const desiredY = player.position.y + PLAYER_EYE_HEIGHT + 1.1 + Math.sin(cameraPitch) * 1.6;
            if(!collidesWithBuilding(desiredX, desiredZ, .35)){
                camera.position.set(desiredX, desiredY, desiredZ);
            }
            const lookTarget = new THREE.Vector3(
                player.position.x - Math.sin(cameraYaw) * 5,
                player.position.y + PLAYER_EYE_HEIGHT - Math.sin(cameraPitch) * 3,
                player.position.z - Math.cos(cameraYaw) * 5
            );
            camera.up.set(0,1,0);
            camera.lookAt(lookTarget);
            player.rotation.y = cameraYaw;
            player.visible = true;
        } else {
            player.visible = false;
        }
    } else {
        lobbyAngle += delta * .35; player.rotation.y += delta * .3;
        camera.up.set(0,1,0);
        camera.position.set(player.position.x + Math.sin(lobbyAngle)*4.2, player.position.y + 2.1, player.position.z + Math.cos(lobbyAngle)*4.2);
        camera.lookAt(player.position.x, player.position.y + 1.1, player.position.z);
    }
    renderer.render(scene, camera);
}

window.FARGROUP = createDistantScenery();
buildLobbyScene();
updateWeaponHUD();
addCoins(0);
animate();

window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

/* ===== jeu-02 ===== */
/* ===== COMBAT 3D — COUCHE AMÉLIORÉE : SFX + VFX + IA des bots ===== */
(()=>{
const V=THREE.Vector3, $=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* ---------- AUDIO (100 % procédural, aucun fichier) ---------- */
let AC=null, master, noiseBuf, muted=localStorage.getItem("c3d_mute")==="1";
function ac(){
    if(!AC){ try{
        AC=new (window.AudioContext||window.webkitAudioContext)();
        master=AC.createGain(); master.gain.value=muted?0:GFX.vol;
        const comp=AC.createDynamicsCompressor(); master.connect(comp); comp.connect(AC.destination);
        noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);
        const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
        ambient(); loadSamples();
    }catch(e){ AC=null; return null; } }
    if(AC.state==="suspended") AC.resume();
    return AC;
}
const on3d=()=>!(window.C3V9&&C3V9.snd3d===false)&&!!AC.createPanner;
function sp(pos){
    if(!pos) return [0,1];
    const dx=pos.x-camera.position.x, dz=pos.z-camera.position.z, d=Math.hypot(dx,dz)||1;
    // en mode 3D c'est le PannerNode qui règle le volume selon la distance
    return [clamp((dx*Math.cos(cameraYaw)-dz*Math.sin(cameraYaw))/d,-1,1), on3d()?1:Math.min(1.3,1.3/(1+d*.07))];
}
function route(g,p,pos){
    if(pos&&on3d()){   // son 3D à 360° (devant / derrière / côtés / distance)
        const pn=AC.createPanner(); pn.panningModel="HRTF"; pn.distanceModel="inverse"; pn.refDistance=3; pn.maxDistance=140; pn.rolloffFactor=1.25;
        if(pn.positionX){ pn.positionX.value=pos.x; pn.positionY.value=(pos.y||0)+1.2; pn.positionZ.value=pos.z; } else pn.setPosition(pos.x,(pos.y||0)+1.2,pos.z);
        g.connect(pn); pn.connect(master); return;
    }
    if(p && AC.createStereoPanner){ const s=AC.createStereoPanner(); s.pan.value=p; g.connect(s); s.connect(master); }
    else g.connect(master);
}
function setListener(){   // les « oreilles » du joueur = la caméra
    if(!AC||!AC.listener||!on3d()) return; const L=AC.listener, c=camera, f=new V(0,0,-1).applyQuaternion(c.quaternion), u=new V(0,1,0).applyQuaternion(c.quaternion);
    if(L.positionX){ L.positionX.value=c.position.x; L.positionY.value=c.position.y; L.positionZ.value=c.position.z; L.forwardX.value=f.x; L.forwardY.value=f.y; L.forwardZ.value=f.z; L.upX.value=u.x; L.upY.value=u.y; L.upZ.value=u.z; }
    else{ L.setPosition(c.position.x,c.position.y,c.position.z); L.setOrientation(f.x,f.y,f.z,u.x,u.y,u.z); }
}
function T(f,f2,t,type,v,o={}){
    if(!ac()) return; const [p,k]=sp(o.pos), n=AC.currentTime+(o.d||0);
    const os=AC.createOscillator(), g=AC.createGain(); os.type=type;
    os.frequency.setValueAtTime(f,n); if(f2) os.frequency.exponentialRampToValueAtTime(f2,n+t);
    g.gain.setValueAtTime(v*k,n); g.gain.exponentialRampToValueAtTime(.0008,n+t);
    os.connect(g); route(g,p,o.pos); os.start(n); os.stop(n+t+.05);
}
function N(t,v,f,f2,type,o={}){
    if(!ac()) return; const [p,k]=sp(o.pos), n=AC.currentTime+(o.d||0);
    const s=AC.createBufferSource(); s.buffer=noiseBuf;
    const fl=AC.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,n);
    if(f2) fl.frequency.exponentialRampToValueAtTime(f2,n+t);
    const g=AC.createGain(); g.gain.setValueAtTime(v*k,n); g.gain.exponentialRampToValueAtTime(.0008,n+t);
    s.connect(fl); fl.connect(g); route(g,p,o.pos); s.start(n,Math.random()*.5); s.stop(n+t+.05);
}
function ambient(){
    const s=AC.createBufferSource(); s.buffer=noiseBuf; s.loop=true;
    const f=AC.createBiquadFilter(); f.type="bandpass"; f.frequency.value=450; f.Q.value=.6;
    const g=AC.createGain(); g.gain.value=.05;
    const l=AC.createOscillator(); l.frequency.value=.12; const lg=AC.createGain(); lg.gain.value=.03;
    l.connect(lg); lg.connect(g.gain); s.connect(f); f.connect(g); g.connect(master); s.start(); l.start();
    [55,82.4].forEach(fr=>{ const o=AC.createOscillator(), gg=AC.createGain(); o.frequency.value=fr; gg.gain.value=.022; o.connect(gg); gg.connect(master); o.start(); });
}
const S={
    rifle(){ N(.14,.5,3500,250,"lowpass"); T(220,45,.14,"sawtooth",.35); },
    rapid(){ N(.07,.35,4500,500,"lowpass"); T(300,80,.07,"square",.2); },
    energy(){ T(1100,180,.3,"sawtooth",.2); T(550,1400,.12,"sine",.25); },
    fist(){ N(.14,.3,500,1800,"bandpass"); },
    hammer(){ N(.25,.45,300,900,"bandpass"); T(90,50,.25,"sine",.3,{d:.08}); },
    hit(){ T(1300,600,.06,"triangle",.3); N(.05,.25,2500,800,"highpass"); },
    kill(){ T(500,1200,.16,"triangle",.3); T(110,45,.3,"sine",.5); N(.25,.3,1800,200,"lowpass"); },
    bossKill(){ T(80,25,1.2,"sawtooth",.5); N(1,.6,2000,80,"lowpass"); T(300,900,.5,"triangle",.3,{d:.2}); },
    hurt(){ N(.22,.5,500,120,"lowpass"); T(130,55,.22,"sine",.5); },
    coin(){ T(988,988,.09,"square",.12); T(1319,1319,.16,"square",.12,{d:.07}); },
    power(){ [523,659,784,1047].forEach((f,i)=>T(f,f,.14,"triangle",.22,{d:i*.06})); },
    reload(){ N(.04,.4,3000,1500,"highpass"); T(200,150,.06,"square",.2,{d:.02}); T(260,200,.07,"square",.22,{d:.45}); N(.05,.4,2500,1200,"highpass",{d:.45}); },
    click(){ T(1800,900,.03,"square",.15); },
    step(){ N(.07,.14,350,150,"lowpass"); },
    land(){ N(.14,.3,300,90,"lowpass"); T(90,45,.12,"sine",.25); },
    jump(){ N(.12,.12,500,1200,"bandpass"); },
    enemyShot(p){ T(520,140,.16,"sawtooth",.2,{pos:p}); N(.1,.2,2500,400,"lowpass",{pos:p}); },
    whoosh(p){ N(.25,.2,2500,500,"bandpass",{pos:p}); },
    warn(p){ T(95,70,.7,"sawtooth",.3,{pos:p}); T(190,380,.7,"triangle",.14,{pos:p}); },
    slam(p){ N(.8,.8,1500,60,"lowpass",{pos:p}); T(70,28,.7,"sine",.7,{pos:p}); },
    charge(p){ N(.6,.35,300,1800,"bandpass",{pos:p}); },
    bossShot(p){ T(300,70,.25,"sawtooth",.3,{pos:p}); },
    wave(){ [392,523,659].forEach((f,i)=>T(f,f,.2,"square",.15,{d:i*.11})); },
    win(){ [523,659,784,1047,1319].forEach((f,i)=>T(f,f,.3,"triangle",.25,{d:i*.13})); },
    lose(){ [400,330,262,196].forEach((f,i)=>T(f,f*.9,.4,"sawtooth",.2,{d:i*.2})); },
    start(){ T(220,880,.35,"sawtooth",.15); N(.3,.2,300,3000,"bandpass"); },
    beat(){ T(60,40,.12,"sine",.5); T(55,38,.14,"sine",.4,{d:.18}); }
};
let glockBuf=null; const GLOCK_B64="AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAABUCW1kYXQhEUUAFFABRv/xClpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWl37IhS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vCERRQAUUAFG//EKWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaXfsiFLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8IRFFABRQAUb/8QpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpd+yIUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLwhIUUAFFABRv/xClpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWl37IhS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vCFM2TsHt56BvxDfr/HrjNYiv/7P+338yVI3z//d/5/nxla58v590KaZcmlM0tnAAsQnx/TkmIAIzerV3RBOKADTKlHyUAMxvzvtwAUGK+EAAAsADxnXFk6sAOx+Jr6gB8fyc3XgAff8jr9bm4gAHl4ep/s/Y5YAHUaGO5FFNH/VSiGui3ZAuq0QwE4nA0RPKxiGSpkmyCebw5AJCYRE3zSSIXKtY0CE5pA18hkVWrRmdFQ1iWKqE4EwjSmXTbIRYRCPGIsok5AiL5+3azFRJYwg772HlO9Lux7hqZNGkqWFIaO+QiYTO8ImugSEWpikEScBjY/kVAkhk5E7KtEU7Q1sg6jUMCXnELGQI4DG5CiEHoILiENNlftlruIMnEJRM2k29CJ+i9MQu6whwjmJDpHBSF8eO1x5KvAAaw9AzgKsCBtQ211kJBkXjTVRX8frIqEr/+r/6/r75zx6/2QpR1TGNpbOEZ/yPvwT6oHJoI0wC+J4PzABpdbpWABPl2OrYAFPlPd/gADtidxMZuC6h0CDGufbu2uN8anbJXZi2LO5sNLMQPXhqOZHwkEAAccmBWqiZIBOrBx1iGjIwlWULv9OXO/2UhvKhClpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWl4IUzTR1+Kb9v2/HK7vSZXGn6LmjNXL/S98cZzpuN4qSBtpTIBLF/VBOGYhPmkvIk+7n5MDtEnTtkJQSQwfiZnBWgKEHU1jXWfZdBk8BHDJJnB0Rkv6V1BkK/PtixT+fNXChZbJzsS1GkqJJZV2TPFsZOFEuq9N6syGSiDE0iyEjoPP13i5Iwy8uUq1FnUus6xGSXLsp2fU7UH1RsboWLl/GLEzolWNmbh13q/32L+lxwrfaP+v2nZOrIfArFi2cKUFcLHohFRr8HM499MwY/2TxP6VofsPvKH/8iQg/P5Bg0MJ4tYVLcHtEF7ukAxWKsf06okCHjPkJEkYj7zrEY4snC/A+xdr/5rRDd5Kd+jscD+wIPd3VGQgfLfh8dcOsuVCSqebpgxzx/RY479p+JzoYhENV31znT0yQYgwkAg83lsHYdLyV8zYgsENh/5L/81gy/JWeDZvwP64ip5KCUk8xBK6wRQZ6CBlyoS9qa7j4gIVmvJRlycXOp6yT46pphRgAKBW5E4g4ABHzXUJV2kJlMhehVGWUAkJ0giOkT1tchlNHO+NJ5inO1HJ9wm1GQBkxNJBAREUnBMQKKTU/XPe/ZyEB9SmrpHCQyYl1ED3HY5AiIxl4EyAukzfIEFM4zAAAACPFMRP0UlwgRLIyyEA0aY9XamFqFc7xiK1kVCJhdreUH1ErBQzKMkyBZ0G7A4Acgo/qxJEOgj8m3QHxnj7dGipZLh9vAlUXP0xfXuMMEKklsU7N2yWg1wQgk3iFiAn4BIQiQDYKOh1Y/fgkKtAaKysnIQe9yLqXveqZZlYOi1Ckhh19hVZFw724hCCTPEIDDUwfOchD/SzA5pAlxMEiHRoOw9D15imlMgEqUbv1LVsPBojymHByF6lM39BhASm5Ft8GVdWqKgiVKikdglvOaTTO1klbASpKx9HUfpPFnlRNgiIBkFwLFgE6OtJKx5DI58nda78r0yQJcnXMnwyOHdL5cfQCUXMEpaCOFs/HEaNInJlkAEyoT6hYgK5Bz/P4Ytk1WQRZVYSrI+rco+yS02Z19mEWQ8HNlVX8Eko0uEyCAkGGRWXJxP1HyGopDzf+AJFbzuTQKiFSiwhEVg8nlDKhJWXlZOAA8V0fKYbsV4lkVrm7g/vdgVXidohaSQEkjBoNNTt620XHnh/6iAdmcO++fe6FBTRAaniwM8YZfH8YyUwSiWMMo/jXl/v0ydzTdK+t/h+xrTESMiMJrQQLuHTcLyoHHoiIRfNY8GZvLyT1mjKUpWKaj19hVYG5Q3N8/UAKDTKKv3vp9fd5eo52ERCTQd/UXAYdqVmQiA/gnP/6GxfsldFlh0N0x40pYfxf9m6EnNABwQPZtAt4yH9ewIGaCawcG9YzuCXU8wS+21QaP6dlUngfASIgWqXrfbVGdQ0EDtHJos91I7AyZFIjfnQuWqBJDPs/dmVnT8aUgS5GyGGlZ3LgLJYSSSkkEVEQqnBl3t/sylPuGfaTpX0CQGxlH6+6t+/KkipoYKxzH0l0u6ZH6KzBKju0JJ++6W+7ywHpj1mvui8mg849i5eQ9Z8e1CG4OcMDH9L7G7D0N3VpH5j8XxR85RQlO6gY6d3pN8atlQfZmt6V617zE+5YAYgfWOIRqUxf0CEBO5lpJviqUaoXVxiRUXMv0CM3t5GLhpGyADkrOo7UBHN0hrIX1H2bIc27oOAQSMqwQwlElLn2gC0mEshAJS4pKw0kuPRNOsaRGS3BB5XJzvaovpNZrwEXRvUke7egeCG1Z10hokvT/gC1P4iBD/ViQiYMjIIiaxwD1H+BXRM7A5h0h9yvTEeaZcIpkUiloHG+l86plcdNIp4+CodGzZbBdIIJ7D/G5x1ZeG4a6DwKr62C2fiv+X3akNGS8PF/o/+bl/B5glQXiu7KBDYoOGtxtZBNxb3F2X+0zH87yr6JXAezsmBzf5ke5p6X/A8yy6CsAymLASZ57l43tnwC3QdCzKGjvBYZZwc52uCM7Lj3cHrddk8LuqyPUKlD6PhVwc+ezqzu7eoMMmjozV3a91gznxZ8NY5OcumOFB9vugLC6qTynZF0gq3we6gWcP5vVGis9cr5iTbx0rsRdk8P0vIIMJi248T4hkEPRZEJsFB/k7kzXVUS0L9ltnPef4jWANy+i9B1Xu3le4PluFFJgPWu7rqFragQTIT6R6ZwRy21S28JbBUwZsqEMwfWvR6KA15S882ziqRfamiY/ge570njJXy3btQin8Hi+yedKyRtPjWtxbC/rU5eH/7Kovdnr07UN8wbX32fu3i2ZQeu7h+u1IPi3OwIe3Oqmp2evencxbu4d928P9gDED6xwhGpTF/Q4QE54yqTHmtypVytb0mRIqXUVPAIY7qBK5P2BRAOwJSB+n4l8X9xqQ8qi+xYM0kpMmK6Wlos+A3DXSCOLhEduwjuq5DGUSFaITbHyEqgA1yL6GebmyYQg4doDyeKTQZjmHIAP7Fim4rUbIzZLJP+FQiwQU+E6S4+1111WgJOBq60w5bosPWPPMk/HdXYluWizdpZc/jcgarvDC8vdxObjHrX7j7TTu/dAx+HDVHAARGkZdP9J7iaHR+ZlYe8Vp1XztfmOuwf55/Nm/I3J7S02VbD47cl4LoroC1uTedz8X6O7D5T+39V4MTIBfhv1sfU/h+rtqWYLaMY+hXrw77hzhLgbbsj57mf/+6DgfdfUv3P1/rqkv5cR01Fel+Vsfo+7/3m1mLxjrrnT2LRstF6if+fNY0WDKwKS9LooGvv/LwK88ua9kDKVt4p+L+lWICZA0zwfmjj7Jx6NoFOj4y1vk8u+db8OYu/Y77K99B6hC+vDfuFjhzjsjqzeOXfyuOtykwA+g3NAcudUzDxnmPjfI32tYs9XQ/7a+qGJxOHyPXQ+8JbFLQOy/6XYuhNJwu2vHtXd58FkXMdPzuHznbu8exqiBdI6IN1L6bW4O7cv54nvIIsQrsPP/pn1AiEH86XNPimUafm+lSBiVbqnmf81+bkdXaXPMZ7e+X3XkwfB+/zAAKIDqQPgGheg/D0Q4IRqUzf0GEBIy91KcNoSSpM0yLq1RVzwCeH3hFwLrDNtAhgm7PHvLnNmIi6LXpGIQm51Qgut2/vmKlWTwEojWnyzSk2sRyhSCIRCsi141+zETeHh/WVSA82pT8haoSQS/U+iLoITCip4XTfInNtjwpWBdrrfDLQq1Ddg6wF4p4nzbFPTMpeg9/Zp75mUjt9J8+lEGtvf81fYLUDVPFPT30Eni8s8GrYnnm6tJUGGeu7obcFhTmy50FgxuNqOzN8NMW37TD8LmbqBskBA8L8l4nytLgex+et1dqd1cAwQEdZ7f8afWoPf8hg9p7NlwWI2RVeaHZpnzaUg9r3SDzXpvcuaZkEky1P4NLRLPM6j/08WQC8lP935G4+PvZ+47ENsy6R+OT4CsQcWVRvHvPFLau4G7+09NTdbWzXTCNwaMnYVnC8h9W+erFG2w6lH6Vmixw9KSaTmzDUuUk/Qsyi2B+H0jHWUvTOYfXyYg3r3LHSr+r3J0n1L/F6hR7+6291zTL47I4yc/lv8HgO5p8F3vboZH9Ugeub9G9FClwPDpXBmvRBEIbA4Bu/ymTRc5zHX25/7/KjE5dGxJaL7Blg9CB2DqlixL9TrVtfdfuLsNt0Pn36b33075znrbnCBqmM/OdibGjPLXqPMt42mLS3sX/L99B9Jcpwv2jr9TB4H/egFCB4IIQ8kvsKFbiQxOBGHlxcAhGpTV/QYQElW2Vd0yF5pUXmlRGiSvAIU7+PlavIsN7RnDu/p7B0VGCsjEBq++EIx8mwSAHZBPJxiUUxJk4kx5PCYciWtUgyKYJGDHwWDdRSRoZIUH9ORKXy3SF3EvbOwZmi1kHZJEBZRfw6ziExh4ITMybSKBkYkImAFahu83DOUOyde5htQfnXtOidaywD75wgOgIR+U/CbU4F97t0MuA1fq7Nf1HGbEXzsDwOP8qj+gvrmaphWkDQ/YsqilcHdfqGf8cZ53hjjh/Dp3F5FgxOC1V3IsOPePN2k7SBaZdF88xP0+dQ8t2xxn3DaI8wdHfAary91NZhO/s8Zq484r+6fgfjbeB0c3fC9B9rSYX/bh9P4r05m7mX2DLt2huem5HnQHHC69+kWoCog/UuPcu6RuXD98ODaUY6r0xM4qKBYwfM86h1X3N3/9g+7dnXjs2gQZXXaoGzH2XssZ61tGWjHgoeNf5OyLAqIOYL/jiwuM6xJHPcubqCPy/17ojoL93mvBz7n0V7bdg+SNsynqr9d+hvTaWh6jJxpw/96/tGaz9h5Z0/fHG10C0GdxJM/f1OWMIkV8S6CiQUAA7iU6h5Ty7UQOubuBd4bGBztIuv9HzduCA8694IuIn/D+dPpmefuvqOzq/6crAXdv8XSOyIfjmv/WaPje29a30SEfx5pjr7/YXH1hfoAFCJ4KaGCFRwN06xQHQHzDuaicV/2pH1/8YoPAPP7gZ+foNraJ49IAFwchGpTd/QoQE1rfKVLTetpxuKavC4hIl+gTgQ+rPu3c/Sfsuhv6NcjJiD0P/rrahQEChYOTAXQMjJYTw2AJ04hOcUnbVPs7CSIqBGUAjTjkaNjuVnRIMFDLQ/Rsx6wzlaJZ1M6erq3L9EerAXlTLYBAJfAPvvbvNricdQF43c/fOXrkxTmnKoKxB3VKINzcbcf28Hi2Nco4tyv/tcX+8pn4wyL1879nzd9YysH2LbnNjR61KYMiUSL+5lQPGX6z7lUgKJEVUY/B9e8wQv5O7SzbjnLka/x9l8SpT65+CKtAFWeG5lzD+A+imYGvvE/zvrm2yoCsR7j2J39JM6g3ZUAbC0n5hzrYpe0ox1ZZwHTi+g5igdYB2Dypsay9+aR91yEHen1jyA8njuoS806QtnKwZQBqPWmz5UK2JZBSibrD9L+5bTTdIe9fNOwuWereeKxB43xh72tQ+KaYhXDI6vmeoXvmcecfGUpyLLguDygHye0Q7dcXnNik50jSkune1NiWcWNaN7JprunsDmfplYspscbUWPkvWU/B2XZeJ1V/CyCPkjwL/z+9fLedmQXoT5v8Zb7w5twEfWN4avtMODE87+bxd9+K52HcuarKW8WhOYe4n1KYMfgvuYsBAoZyg9bg7Bm7D/r246p/P+3TqP1DYOnSyLMf3iWy+jboqAGxfpAAFGZ4KpaCIwqeZ6TWTVZ16T68ICXxODOxmOKZIoYs4Rqo/YYG/n7PdIASPA7NoUEnhl8QxeFwIRqU7f0AN8d3XfMrj1xq6RfG9VWlTWS8uLyx+4X7x72+Z5TylLwONvMfWPbNc/v4n+7qEGWf6utaCJ+R7I0280WLaP5P/pzX2F3r3dX1RBz7MoOWd077tmsgTOHjPx2kruByj4dFPsf7X9Cy6mFKAdhby2cxXF3bydqX/lCH7+ttEn1yY/hsU9F0jB7cHiXo3pXzvgXf9z6usYlXfM766R0zPWK7gcVBDqENYggloAycDcW/fhZBvGTgcrTuBy2oLuHvDaeSpIWtu947+5LqYH1+VQP0rWvV/FvsHF23Pv1U7gpTvim++p/LxT7R5N2p9fz1mjTetN9SyLQn4a9+XfPrSHmPjHtrScZ/Ze3ZZKOp1CCgQYXYHcN5ifJclVa9bmvT8LZMmA7Lx6aI8nee9hbx65jNFufqEYvWnW38HMdYA15Q4/pFDBiHxXYMHWUb/6Y+GjX+Lnlqtiuw/eqzBvToL4uXRwBb/K/hOSNmaMUWKS+dfETvznQ+G6k1d+mkrCvB+0ehOZ1XlrR8vh0Dgng07h5l8V0XP48IgmlO7V1Fi7d5sjCef/G6AXrius9j+NtrCsl+NdXOSFzHXkmj/q49HPEXjvv6Pn8t6FxXsT7U0ac1H3DhGNznRQumuY5lFiX1upRqtERrLA1QFDqV3d46ylM454qAA9321JkVNQ0GtOm0TGv23uL7+ICuhhyIaww1xvcgV1f+UAaA2+3k3OqkHCEalPX81BsIDe1Vz6478+tfHOpu5xVaq8uq1ZaDQooE04l8THX4b/speqau2b9++++AyeGlvzvGDblsH5uK91W6Hnbp7j//VmKVxatXRGynBdwpUFfrw1Pn/QvWtFjokXamjGC7SZfoUF42Vvd3VAKiRTxE4BjqPtE/1uJXUF2fc9WyqDHPeU+glQE463+Mtl08XSiHybYfXe8fBbA2b5R4HmD5rY/5C8NRc+/XJ6whJS7v4JrKTTsuMdLW6DTLtjDEcwRgjyj6T++488H9Q514z1k+PFd5VkH2kWR+bbcDont2YvrP0/VzxPPg/xGf+83D0dcXtVO/8ft3MMQnwF9yVHNRD5i48kDVfmWKu+afcXM7OPeCdP6SpXiHXWAgp7NtKbktnguYldwxnLokFO64l4GiIPzh4TqK/dr3wmZ3zfKKgwHYTv/Lnx24ZhZUf4BSUuhi3cPJMh6auDsLaPzv1C1gNP8SqvBdFSP6xmnOVRF/LcVcatl8Zz6B5i0QcgME4jovErkuoWmi+1Tu0ny741/NzbpLe19/G9a+TYtn3R2L5tfEd8gh/6XNOzUS08EERK4+mAPJlx+H+wTf0cpdU8XNEGkb6cL4LjX7FFK5odQqWjsQBKJhKIDCEFnTtKOKoaqWmAHdEvMsalJAXO5pgfwrLvGjTRrUuSpc99VAzGyLRynVuZDXd+iT7wp4/aQQKAUAHXe/6/xJAOAhGpTd/QAzVdzuUnC5knWNUhF3vVJdwdQ0b/38a5TfXG3TTa+xaq/j7+ugH+aDS6CNfJdY/qPg4d6D6R11lcNUfY/l+dWncvb3b2VBVGKQol17jgEvMb62Z571rC8U2nQg6Rq+9s+/D0SDzL4d6zRrmRqql0XW3cP+8oBccMYZhnr1GoweuYfmTZfbGM8E3Mm3C/sjcb0vi31Dif4pxd2dC44jGbuNXrf9UZ5lAH5L6lzPzRBGHoawvSPatFn+POKJTBPgNbdO+FafisTyTI/mUcLF8dm7jlkcwPUiaG137zY3a3R0UXsQ1IcN811ZkEHeXY8j+N9pcXWcH+ixOTW9POxrb0jaTkt07ubEg3JK5OAMUGiWJRfsE905jtK6M+/lfofqOl/JMTzHvin+ZknekPz4qurGyqG5+X7kOOTFLDd7tWvmeP+oNO0X9c+958jCJOKDc3/7NDW/ohorwO7QD5+WGPqe8vh4JnrCTubekvv/NL6xOPIFjkVeNkafSzA58ued+QYd2l5dovp6OHG55Ewls5eTH3tHlpgU57pt1++wv7hT85r2+uSdVV/mF1Tbt/3W5o8HQqqI8alaWk7RialuOBKIDOEFjp3peaomXnnNTc6AinKjU71XeOB2XnM5im7uTuDuvku6FYyXrF8Qi8+IV1MMvC3Uzkcvb8rRBxdLmHTysZGxJG5ZHIr2O7YBvr9ddOU6/qOGAA4hGpS9/QA3j4rx3e5eTzl1cukmqy4uQiwdJbr6mzDcuJwzxKj+5JG+nY4/13QDhnl2/fn/QHdx0P8mxNV9vWeGkTn4JLPNlema7qcPsmfOldL/g+iv2+ytYN/h3Zjp9o75dsFxJtT6Dsv69eLTyqyhv/jRjlUvbZh0v9hqzgW0e237xb8XBuhv++lKXbGyamAo0bLgoLIVf+DfkOtW3pDY+rqqpnrv+xiXF+z9X9hKEjnTtfRvyfVfo0yjw7ZcaNeY/w33O6w3LZPX6bxm/PR/Db2h0mhh3RDZjjKU281Z/bvotKRpoSHO1w7BRM68IgFIEgdBf0Vq28Td3R+vdyY5f6LbtDA5vvrcOMRYb9vwrl7SGur13pw6hQcNylevSfNPb3FvwU21T0A4qNkV322z4y4e++bOG6zY+i+98wYlTximc7JbdMuSRu/u6dA+v9YzblrQq3D960u2d6W02rlq7pT6Uvic2PicboYrb5m07t18Zu5sqviXIP97xiPYvUNKDZ91roMZZe1o5cKkrx7jDKMjyFy2oecZ88Gy+yz5yW4tMaqg8w5w07caq+tCYc6JihGKmDIEgrG1rZ8AmAHb2MIlEDnvUvd6q+db4kpa/Diw30AMmbw41ajebFZe2LJf9fdq9R5nuYayMYoRROgHeBGppB2AnZJH/jUw2ZGFMnVxP9lTsMQTMrORW9c1VHwn+c1ZU5V1XImY3eXEKWAASNQANa0AXXX3x9kX0NjgIRqUxfKFY6MAyZzUrGkvJLhwqkloiRA2ZPGaMv/Zphv+6cv/9rC+w5H/Q/OzfxbaYZkBx947rP/TmHP8oB/dfUubegJdDAKV7GzPypmLznP+wvhJH6S0c+swTD1pmbSfLNfbXzZmp83P9oz3ypjuB/mc5aRg0A7xvHZlze9YdQLWXdMzxVUTQoMN6zVss5y7Ap+P6tjHZWrd97Rwz5PWkbwLvPnCjJhYaqhueMUbmYOM5g3m5fh8UnuY98N6Rab0h1R/7Gf1zXPi3jCfoN/vuLafS63+Y5EcIFnrJ7d7tePKzVct438/hshCb9jeIfrDP9x/l4DmucX1rSbzWrZcLVf8YfsG8NF8lRo6oV9Ip92SXTNfnJiUfsVMZzmyIKj4GgUiuG24nsj+Vbw5/zjPT1DKYRP65qVakuVvf7Iw4bT8HXENTgEsOktnGsT9LNVfVpbm8toatqPQGdaj5fLBE/V0154Krxxmc5+MzfcFzmSr17tNDVEA9mzKcBsD6iTQ9HzSdFZ8Ex2k4Y0jpZkwGXndhY6BtwEQdEpqPCjEwzCBHCAjEBD4nvXWVnncm9S0dVykutWAW6flRtW7Eat3og/bfA2TjBEKwLpnkW/vJjJGos0bMuKwp8pj06PjtUjTHMqyQEJhnkcdAlsGNoNnnUsz77MTV6BQa5yFvN9U9GfmAAe/XqQNvoSpCkD2MTsA2bLfqiMxO7kAHzj/D4oAC9PxPeQD+P/MHQOQByEalNWyk2GmQUBrld7vvUTqqlaXVyUiWSpEDzhx8bUzeUx01ZNWbB6Di9SgyM9/Y7dA2cOmUG0isEBsTk/4UaNtwy/s3gabpHnVpX99+l5v/BqvMaP633j933ae1ZL8qNC2zcPRS+Ww03zfdIPjOhdRwu+eENPWoDPNMTF0fxY6nXo7q8v3tl4JxV1GmfcihekYjq9x4Tb+/0LKtcu+mTqPg/vD5Lyq1ULOta10nB2fafVNAXSPBdyxdT4PB/wsNT5+O9LqXDzwoo1Yja3pDrau9URrYhaPZpdrzrLPK8JxvF5ATc9FB0rfKpbveMfSwGrQgdNI7PWU+jqOKLq7ofYa7kW1nUt4DPp7JZjIU9VzgGhlZG02/jTmih9M1LnWK4PNeDT4mda1wzRj5WRBirLN7BmVE/ZRL/cSW/hj2c4QPBmCa79di4xCSMCm5u3CeRnVhU66WWhSxtq1OKqaGAFxFsWcKyE27fExwiVAp5GaFy6IzQhkwFiKIyAJRAQ/G+2VcjjKm+q0XMLzjCdYD5jDmKitFYlpMstbVbv3ZZs3ysTdY2wKIxSYmw36hHSBtX5Uks7+y/IQYD7y7r7Ov0nHu//4aojK5CX16QDzekSumoZzgmTzmYBb/7iIctf1ITMGTbqQAXkYAvFWo7GYOwi6Esk1lfAABWPPs/0quv/vQN4Df4wMZj0BknEBP/tf0VOv49NDPD+3/mCvhqYAByEalMW+l2GGANUv1U8XqpcqXK1UqyrkirqVAmG8JtRviBU7Bolzdjnedx3l5fsT6v2X8RsXzv43XvtkPp7g/aNZh7Vibusl+8VRSaTf6LjOs5D/N4OxZlyBN6+41HGNdEr90+nleGVyXwUPqmuZcPZgo3mZmy6s7yrF7xHz/21B3gdcw4Q42KhfXsEMTgJloFwmz2W24pQ91zC3WoM4GjwO0nxtFOXNUxnDqtRNmarm3yjC5D1/Zf7+hvn/1tN0vw/Rntnj4GrLFYkW2abho8nI+bb9LeuWyPzhwjal06ryMShu/X20ZGv0EuulIP4HiF0rT09cH401NJNSJ810cTNsYohu23LwDzpNxJiFREVEZYGC+Ig8aXvHTwujpymNAnx0aNCvFFuCAuqS8DEQFEikCNQgCOOinIpvz54KMfYPAWZUaJdEZI6cSGIFxmICYJCcMdqdxUamh7FELBU4BUIFPwe+vE0squr54F1O/KZpQAmPZgc7aYvDGt+bU+tY0vQx9b1aq7q2ou+0QaTPJKW0JWzZnWdvZpdvIC+YKmH4aNSFCIvVx7RV/QcL2eHel2Fd1z7lYCs8uvpfsl+lq24E8+b1x4dViqpGqj5pYXW5WSpMrUaG8f6UCo6eHSr5T7Ozw6/XWtg7sgZyABv+H4i/L93Rvz+f0Tv49Ou/cAAB1PVAL+rlIBfbX3YkAOAhGpTNsqcIAbSvUbiuGqiayJCRIIA6QkZ237SFgNiF0lpZo6Rx1yJ/caab60QdT/ruLdg/P9+42wM+/T6zafgMhcug5t+R0rD+U7v1bw9e2rYM8UVVTu+FJZs6hIWdn119z6D7Ro5DGb/HR2lW+j3CKyYDKd7NeUJFXFEK35PMTGNNSdTss1NZWywxelCNYl7yTeaxA2qN5DRUd/RGLlpTHasB66ejLfAiZwlpcrAskZeOlcIW5o6ilAM69Znu6B0wsAgzTxatfJMjAtd0yFwo5QlMaYZXWx1IEc87isIMjtzMYtNLqUmLh0+flxt8QiSm990SlTbvlNeC0LBLYny+OtiTqYGSdvG8+6PVT7MdcLaSsSbVju6I2b0NABf44gv0v2zTRNGGnfmJNx8MZCA6kTFlORQnMYByQFMlWELkp7+nl1ayA29lNEwZzN5ic1QGWjQ1jKMyAU/HLlgTW5epiS1LJG+OdA++O3OWC2Tr/5qOWssLJwc2OwP0DJGIR0dK+wBqAY1GDZmBR6VthuftlvWil1seM/EATCq8umm5pRrUkMkZBKYaR3ZY+AjAeoEiwvGijyzgUqRbjzAFhHd7uqAAAjTVKpU6mYGR3EuunGK5hAAKf6DhfVZ10E9vCaoAA2qj9nluPsgACt1nP6eQfPDMdvKuzXTX6OQASxM///re/osWIE4DtfvXCDghGpS1wp0JAZU8ZQ4quEzUI1RIiCAzloqvMpx6t5j5LSbc6m7f8O906Y6I/O031pTvHnanyHjPMVkRxZPWGOacxbTWXLbzzhvdMXvcNm4THoeheHT/q8q13C4M+2vGO6tquFa4Xq63ZjeD5fLpM0UZljh+q7zvmSguRQqWs415dxp1if3zONFvtZyxlabeZ9FeaWih1+Kp7NJTjHRttmkozS7VXGNtzGVC4eRh9rrybXujYd+rMjd11oEnBskFZHT9qqpRIt6DOoLEVWEwTBkRfkoUOTS0y1oXDw5zMS4zebQrawmcBx6peVbDnXXG/CuVigqzhlkbaXUqhYVBqoIZoUmyK+uenRz44L1mWgRGSfj7cIn6VJ9ZEhKaTewy4Wd4TiILQLKcgMNTRZbSymlWUhCrGYRTUykXVqQijOgAVOPEKqGkkXlDC5FmjUhlwExKNEHGYgSrntdXp46XWgvWEVqrB9QKuTi5KpZYSyg3z6fD9r8+r5upABWt1RHGFO8IbeEl95Kbj671Il3iyoJ02Xhu6YTQkwuaJJRJNV31mglLro8dQKCQmo2BVDx9fFJRUQGyjHhvppjyaER8xhwVFhGpRjHM5ysvqtqk26DjFsATHDHGMF4V1vV43u0dsgAAMOz+Xry1+PlJlaMBobj/wOwiOCEalLW6nQsBst6m056Tpu7jNIlXJV1KlQIzx1r+vYYLTx+jtceRuO2ehODec4T3R/01Fqz2DNWb9xwzjDEvqEQhs8wvOSXsJ91yP43l/IrpHSM4Z41n2xhYvS95fPp/hz2tZ0/bg9AaG+hOGjg/N6Nc7fHjQF72972YmotV1QMzuKxFhkavCzFlWzQzaZrk1Yai0sk5Wo+tpnnDbgy61Ks7/L0yaOK5Oe7NPHYOyVWT05GSrSpuBXaQQMywxpu/Lg5QZpBP/PWxNt1QS4+JWZs1GoqaO60Z9bze5JaoynohECGjfoEoClTMSnHhXSmRKzBNDDNi5NPod7adWtTjLyyK23lrqY8+WseeCm0ZenzBHanDfW00+uiITJLLyMtIqLJ26anjOW6C5Wki61BAieSUbVmIjVoQhDvUEkGxrokkTzJvQnc5y4HqJTU2DsNSCIDn05vat9TPNVNUl1DNXlqyALnuc8f1uMfLNjoYSYn3ez/lKKbMDcOEsKNaYifwsNQnHKzLy+xo7J7sNxpKJXIOAtG3h6tKhfBCrDteLYn+1vSKwlc3NlFwLKjUERAXChXKplzp5IGjnOG5mtLokmQeUjOUwGAtnMAQipA7pDt/j0hihcPIYAHZhl5Nn381sBJ3RADqiumXV3dLX0eH3fCHfUABeor7fsm+7TPy5Y59oADSaGYOIRqU1b6jBWEA2eXvMlNTVVLXESlyEpJQNeXQD+xGHMegt6OGekkmcszd1aG2bv7N9ecxZL8Us8PTnXcI5ituKdI9vH8zwVUib50vZomn0Wr3R4+Jvt30DjOrNdasjHpHFWOqYq+x1Ju+gUun3zhWUIahG8lNndaCappGlaz06C0iXV1vUrbCEZjoF3GvTS/8KdMnK7jsVybwN4u6l2FNFRyBpsHO5rGSKZiZCrStoMtqUDhl9WHM1OEh1Q1IwVUOoFpS3RbKY3eLK+GiFU7opZksFG+ZiO8LOtVxl5iTJlLRSmMzAT0c5FUkdisyuQuUtgUsVvzSmih1zNonUzWUpehZwIHnLaNIaMEy4sUUEklKM6SRhmwHpVRUi5oKYMIodSEy0GDZwRATimXKKVJk7cteu4Z0C71cqgYAO7+fGaKEZQKO6qfUtSYcBYbiMYHH08blTS6Lq40pWpBkgA/3wOb5XDh1xoE8KMb6XtnX6Z6Epe+TqavlJc2Tz8TtOe8CaKvkkvnhwJD8E5UwStwycsnZC80lRCWp0YDWpRlU85TXHEA/lVERsbTVRDYV1fnrAoVY5x/rKqjENCF5PdojtUa+KWbYkrIN/+WJ1e47LrBtAbqLsZfz6YopzzlihTlnWLBfhue0NXHVni+B6pK85rZK9PC88K6z4VV77E8u/UAH5g/8/Gy+n7SX0dwhGpT9QhbHMLDUIDa9nFd1Rd1CrlXZFSQVqpQov6PysqvCOHSTqu1dN1gXlugufAMbe8WrqHcPV3nb63Zse/3LH8nU4WpbBTRtEHd9gYuuVsKcTBL4NqyO/DNi1lltqZTD1gI4ccE92i2zPb9e5pv6iuz6bW3Ysmr8qnWoC471Kp7Z/RV9ynoKBGFHhbxc6PUoTwOoX3lh6EhJHVpkbAAblYWVp7H8JLqDApdOalk1joW/Jpa8f0Dlv3asuxLrtbU3fZ1a6XRCE9fXNTu1HZz/P40eSorLqpWYAArgss81iSqDHRUAeVp0rEB2F2p2rowsxzle65wPRhXfothABMHkLB3r1SUzHjiwAvp1Lm6OKvqgmxHT4axBIAzzrjvnnU51qroslquVIVGJQN8M8Yr7+nreF9i1fs+1UX9nqnn3UV+4a5wk84n6LS61VXGFuOv/UK8xzK3SEBz9hHtH25PPqnJP3u0Rkart6OK8Wx+0fLVsMf+LKX4t6eZS2VzFpk51vU9XJDEq9vuJegHHE0HiajhoFQZNFGRpcaokhFJHLan8b9i6GZ5U6725KRV8qMTU8SbsjoFz59fEKqd4oQpMyMK9WFLk3QpR6SyJ8LN+prWDZWM4pzrGtLcDGvtXq/NqFgKXRc0zAPOoTVRCtjAbr6Ka9EpIIX+Hm4mIXL3KIAB4zIAfKIABoWiOYcAhGpTVtosKYyFAa/xu/W64ypN6XTjeoQhIqAb9pEDdZReImYzcSaegjrXVMYKDVafEblnNO8lbOcuJQqjZ7p5MudoJ9gky79OMZmpsSxM9OsIc5Z5CojAwDSabplZWuPqOO5m4vN7eyoZAdq+BHA+hMqm9pbW2zPcZ2KhbydvN4UigFAuPEzYg7ZMkzQiIanfSrwVJAaaSd68TbRapUCe1QqZpWCgqIne357fDO17Ymyn5UN+JcZJoTkkkPLPLNITu0sgKKyZ0Aokct3jv0XfUrov36fGVAszzE/ft2WlVLXXeNIsgWh7u8BiDWXz9cEn4L9bBw94KXWaXTtv952jmDHWiM7q34rIp2Y8BWelQxhqUBq3m64zJdSTL1l3SFgpICKSXtywpBz53fumSNG5w/LeE3Dw/Md79y33nWqwGPfrGy3qtu/ME3B1FO8h1nR8HwBtaAY2lQaPRnQtaYUi5vhE6GDMm+z93JJmofJxzT0ark5jDGVRp2NQUXFt7baY+TR6jW+UQ9IPLJIdBrTxypV2yFBGK0usjG78fFMntbnTCrQKfmRhvpV9G5Luo3FeHc05lviUrAJ2X6QDV5OqvTlUGIor+1eQuQBZxR2RSFFhTpyVrEUALd9kOgxxoIclkeIARCvAwJ3DCQjHFq5yAFwAL+vFsgARtipYYXmObHRFRF6BmMbgOIRqUzWWQpQIv6ysrxwql1cq5KuohElEDrqMR3n9kxEzZOmbZn8hoFTsdx+Is31XwOU9x3mOTfe2S+XNTb2HU7DBQa9y9Ttqs0/r5GF0k6vSNK9SZ9ls9gLS4swrEBY3CtT0dA4oK+TVyN0VP35aYTtrU/kwZTEJzX2sUizTNGp66HWjK3y+jtDSuAcstGcw9nuz71IZuzPDAd7b5OX1p8epU1d/UUmf7AWAhFpZa7hZXkH/JJDX5e6bVQlut8zjb+BTBY3dMcWIod/OpbqDjR37N03rVUTGqQX34wuQW+PdBnkv5dHhIJzD09/jAYqBS/hjHhGMS+/s49s37PUM93q90oAqnCGIZQI67p44yJdLS6qy5UJVSAdoZ7Ziw1PtvQN0jv2u6e+leDz/5HbpD9t958Xy/e8uM0NokvOMkH1Kv75IDZYiIVW8V16Nt1c0OQMVGrZOCNWLEGE97uMMyzxaiuvB7CIPNno1lN+wjPEZJVYjV3UEQ40QGCaUqdWvjozMlaE1qReQv9pMj8UaJhSxBBosTaC7HE9sMVTiSjcWQmjftTDpzyd6fr52fbtOyEa7nwEne08sp+upd7Z2pTME27tjvjBu+2ELmOp0MgIDp0kQMc6AZ+w5Z3/5bNGXLY+9iAAzfS9GPRf5nwCEalI1CGMUQsIxgNq1c53LzOKSZxSRqkEVapg7trmv2LlOSwvLZ39vwWo4f8zR8Ts3f7d/G1bRfstuSE8PxnhayRD0DsCNbJXmNUlXKSt7aitKXRgzJKTyVljaEvyZDL1uCNhQpI84I97V7L5o+EV9qPckk0RX5ysWixqE8FiRoI1ZJtMGPeIRbE6fQTrE77YB0HsU7hrBWV86QRoMLDCF/Fkb97hwq81J4S1ABD/o3bzDmlN1keHGtavdezVEPdlJcdtRETbvDIQN7FztTVQi4APVVwRwB3EQH3j+JslCuosHdxAFUTUDiT8fjYxVAZ+35XJP8z07S/xfydPqos4E0IrTSYOxVMBHnVuc7vW84SK4pWq1UEVeQCxSZ1QKyNax/uNPGkG+JqzD2v3WYcWvPxO4f0YecvyLsk+vc9wGP2nnuR7awecdHLGle9LIpPHqg9pwT6U1x1GyWjsuu59hLV5Othj6ulNheIybOZRYV23qxXLxX62bOD08OIqrteDlNUcwrnqSZkxH5qWphGGYXJrsSdjkwk05+S65eV11NOu7TrW/ut8s/0cVrTRRgFlNUkugjcLLPzU1PUfnKVOunySavCPV26MF8EWLzTyXVABXf3wRv7pvq6NVI11ajpm9QrZnYBWYX2w7oOPBPYDMyABXhEBmOIRqUjTYm5DGAzrc3m1ZczSVqlrlEgmXSh6Ksu5Tx1SpEvfMc786aejwXxuV9q0Dz2XeOzdZ7etznQcPBXdO8Txr+DTssRdm1cfjWFS8phyOryJnlvbTnSVR96ebXXmdYndVcjsA0LHv42anTasnxPujrk0iPILtKNJmOS3rrnbXFBOHs79RW1zD8AanVVKMt8hh6nvjTl7wosgS8t5G3v4pK3T4cJMAVkYQydVaXI4wVoIW9e0zLk3QxYBFJVq8benEigLwTHhVJkjucNrTpXKBxMcHS1tu7SiNfkUKfIlVcC8xWHH5oOSABPNGQVKpqBobnm5FzYh7NkqlEoJhB2enwZTGIBvitOd5V5IWriquSZESoJWBzGjYZNdLTl7kbQ+t9yUdqCmuNP1vkvgMszvT64hrndrbgbZ3KwWipQypzKV5Pjftj5dk7lyQcTTHvs7UI7J8/POW7RJAVNvQOI/HpHhICHXcOAqRxV5amAyHoVKqjGMA1VQro+HHphnl+NKr+qtVrOBZ1GBBMlJosYUn95MVzFrSwglFEwN34sKY6ejTQwvqFFjHTtXJUa55AgamA0guLWCEMnUU7SXdjCa4lsxq7ePQK76qycz1/H7NdPGf0dmwb5dkb4DGPAMjombmZqABnWxYL7HHp33d8r6JDWdR8EFRwIRqUba6LElIBGa8cb3u8NVJmirsRCJUUNlw9I909sF6Lyzc9wurDtF6UsnN1tSJPE17o6l0VBKNStNhraXtFDWZdRhck/RXpLwN5bgkLN587naCu2pO62U6oS3km4jb3160Wxh3PT3CBFrv6WKzNreOjDOnArUalnluHcW0K5Q2AlJJYha5FeyZM5ehKkqKk4ZsVmcWvFZCATpbpHijBuRDDKMsOGEd+qaytyhXjG4UL0FE/CACTeOIaUm8bxmYE4QsNUFFst9QThYjWISHqErRCEdwRAVJecsbsEY9uOk3ZX3OcMxwIfHf1AXQt046NswZ9lZjpEfH45HGI1GtFWAzwEug7RSYOxFOBH1zrMzLqpYkTJoXSEVdQProcoyInbbm2vSHXsL5sbMZc+Z+uONbl+CdZzvvgE9fz+wKeS8ujGTBKWeDzWRvJu2a9cADFdq2UTNDRS7bmo1llVF/yVGdWacLHQkJ37V0m48dxXF5jSTM4e+1Ud/fo1CK85g7EL0TPruDwI5y5x0DKLOzQjiPqmy6VHc3Ky22+l5Dy39zX6AxdXt4I7rRygx33eSpu18LvbczN5in9+z7UduczzdXOrLWPP7p0FnH4R3df3al9XZ/bvwDu+HBmEc/ReZkKAakAfDoMd0Yrewvs79UT8e0AxhqojgchGpRdWhLDUoDb141nPd1JIq10suFgKaHWbk+FznfHBwPONzYeu1WRYdC9vNclBce/Y9U7rXeEZvmxVd1l7Rdbz2bzHNUnJOXPjZlUcyFU6O4CwScl7WCN4cyhfshFF1VkkfcJ9aM0jHwVrtCg03kC5joGqFrClCKQGXqMM+rGvA0kMmIC4JfU1dAOeQTc1YWx4km3mFolmGzJrMgbjBCZUWeZdKLnIHJgaLYAPLSKUmLjwS5gyZK4NVfJJewPQRCpm93bvJeEyIm5kNALs70kkKdQykzwFBnS7sUAKvCoWznPHR+n2wC54/69AHeYwVGO3ewAVkBIWjffnlmdx3o5JoRVdiQFhKcBvPx3K751EgurFpCQqZaUFI3JnG4P1ETrLTe9k+7Af8X+0a/5MtrHE850Ke2wrEyBNewNztOdiAwVpS1M1ks1kaY2Auk9jll02UQtacMKu+pOh0/AY1orH07NvNTEsn2yqFs4YhFcnfH2cBVOy41NAx9VCGEElDno2XX6m6cwuXp9uou6hN83dArJdtp+STMvdjy5qtrgbIUikekiiziupecImO5u6v4DA3VN3z0+yVgMbtLU07AZiuyzNQieVM56uMld3TAsn+Pf8XPr6vC8cNcgWBxsJ4SxHAszm8eiu/heJBqV9j4wzsXiQDOAYisHIRqUXaqVCGKoxEQQG7u32471UyNZecKstKiAqWNtgqqNI347d2tXygC/EtIbpP+u7odXInSNw+Wf+xzpTG3YvrypRNOvpPJMOS2x/QQLUi0YicObVXjV5Mwpxx4ywRmJQzFX1hxZOTdPV/d3FSzJDrLTFTmVp0IUMrkPWzGRaZB6LPLO1guJuJb1EJQbeDCsZ5e8+JcD6L1z04D2BaIGkXOEoXXslCa7qo1OTltkvfIgIFvxM2xmux8xx7n8vHLhdoxm19joTgbIBPu6Ft0gFcnDYrIEaTx6+7wZgwOHHfDZUNOzsoBnPYA6LOqIgHzJ/7El8fGezOUyIqtBGGgzKA304rxXfCsvV86rRCLVdElSgUAJ45gG3U1GkfH2O77v4qp51+v8w+hncp5FD+omNcWqJPiuPVDB8X4LJ9NPPvYuBVPsWypNTvOOGGkg6sA2n70lbzJenjpKDXWy1Y8zEwnMGevW0ckPLW1A+0Dvai5qzmTp9NbnQFVCN+wrhLZASIoQsxwU8B32sbngjEsVY40XF39OkQKJIjTAAAe4HzCYu/t2CPU3Z0EZO2QUcXrwklo9sSvP1xevEM38nag7U/grhGCEiDd39g5n8IKt/VfVm+4OgB4cXO6RT0BvfsdF4WiP6gBtaCLgIRqUXVIOoWGpDIA2+KnivWlS5VVdwuBdRCXlCdeAhePz+6u+ZZRl7Xv/NuTj4f4/mug1q8pv8Xn1YY43+ju8hG0azvZvQ5yYO0sslBAROCvOwoCz6E/HPJUJla+hv2b/dL2rPKwPiLsqPUxuQUfW/f7yMnhfhJubXWKhIt0OeakNLEMsyMYq6eSpHXIvSBcNKRROmdRmnjLdTy4Rne9gAthJtk8vfnZh/u5rpvNbeIIQgAPsz6O8d062h2eGgBDo+joD07sfNjAr6ukXfp+zNfL7gvjdt9O+/F8eRmK8ugD83uOQSxe2iA3/nx+x6s3kQ4SaEVqpMHYpmAb8TGb785UmqqVxV1JKuVCUkqBkTHHo2DsWkNf4srQjg2UtyOvzhx558gcHejvp1SpiKgvtTrscA1AzWwv7y89A3hi7qbCPujJd/MU5ws+A2w0WaigKZtZ+KrWzThdHl5BL4bpURBJfFLfReJRgfZq2MNfkWbRLsCZkVElgMaE+9WKiayYTr1WcSOi6XJi1ezobORSi3njKgYKLp0K7bZWF2gIwVvLr25b22mADtk56thRrMupmBGj3eIoAGGUTIAlaAAC4Kz94o7gAdH6f2nqy3nNAot+DlE3YQ1GRn5sJcFZM/Dhn7JwhGpRdYgjCULBUwEL7ve8rK4q86rLlXdSSoq6kpYbLLS44z54rX2L+D1D0HgOv+49Zzb9UmYJXkD4mNFvTV5rt40TQwosgUCWw6v07j2AYsqCvaUYdCYIVUQrmvc0zKFxuFhUqzRLYV8jUy1AgypKr1S0BXMTUqlVpijTM05nHy7yKlKoM5xnKRrHDnSqVKOSmw1VDSAuwSQFUIbksR54peFTnOGOH1gjY3dqaevjM5hf+JHDNZXgC3K7R2fTl3ZgVy8cjA/8llAa9hgDp6ZFxN75+PxwAz2dw4/bsO7O99UXmsqyFxexMbipAC8Y+YVzi89JNCK0UmEsKAsFTgN99OXcVz7ZbTLVotCAkqBJYWpjXsZ+PNMHdYePaqh+hd+U9uSHnFVrH3r9jJ7GclUdVbMLxOZLd6xyik/hyvl+S2BI56LaChkszMINJt9M81oEKfTP/0uoSH/y5xb1jWJ5cOlaqL1SEImEYSSM9vJTo4rIIsB3CKfub4XI1EkLmiR19fXpHFpA4Cb8PPLMOWTJKGZwmolTIAdf27dDs5UkHVXh2yV4S5Q0yq984kLHYXK3GciWN8VnJH407YAApmF8dZ7X7oXXVRC4L6u34Zzwhcq5RGIKNQpPd19wupK7JiYktevoDIbkiYgVujBDpuXAhGpSFpo0RUJmAa6TdZkq7rWTfF5qVcEqBFDXn9CsAdJ7Dzcot2YeN4mnwv4fY+vvRM86pgIf2v/fkuSUNzNgwYtcMX6avyGwUi7maD8TWo9nw6tBLfdDZX47Xvz67VdpiXOLDtxXC/F2ky9T0eTcbGxwNZZWvqbraYKb9C04thxUKBWPpRoVFRiQ5dbarPhwlKRChViWwi2lKxMvU4Lgo5gWskDgAc4LVLOEdAhbnOGWd47AKIFqusakU6B4nNYAgtOghEZiuWNznORrAuDCIo4ECi8HAjdd9Df1lfeH0TkE/orV/uo+z/EgT9S1931gyY9A+0X3ToufmgJcR2ikwRxMZTgM89Zm6qb1a6Vd1IrSCBAGpwderzXWL8P0vfdXsFM7z1VlCSeUKOy3zHQ69C7zAK7bH6asZTibuv6T641x3SgeSZZL6mFsNLXS06+ZGUTffZhpvBVof0eBS3kj0dM7YWAmyloQskGeuXW/vN+Gnk9I46nYF9RXfWz6PRGpstl3arDO6QGJ6b9urn/jTWeOkYsso/yoASuhQAJzAqWlnUVFc1LLHGgLE+GNskHp8I6uqj4Khd0mAgAAQLxwn7oiiwvv7S/nKILnsvoxFDEsSAGMYKmpANsmOWyNAqr3OQQyzDXAhGpTVpp8EYhnAaddbobqaq0qXV3lxKhKWbDrlIP/XV3KfAPoPmtr5phyaY+VegvSt0Zggv+Zr2Pn9xt9Ik7Z2juPR7PwVZIPsKVQz5fynvDDq+17zrqvSrBrthCXIXWQPe36P//71Rxk/xpltpxNq7/7LkZzJQWkwnGqpjzHONsrUfwCHK/czVpkGUAzqWUqvixRzrTh9mTsJFR9DBhjg0b7tLtZjXi7xdntMa0jimhGOVc6wg7lz9oAH3lEAtlQ29sqhZmpRCGBe3yb/MR4LYQA8wABTQIBaqaKBXB89v/4GN3v3vSfPenf22wiLvJ9xPrHPfTOS+KDXpfQycnD7gnABJAO00pRAFggFiKQSANrGM3q0U0q6rqJUBAQrUkWVlDFqbsmJevdr6P/dOjOMxdiaj9H8JTbR6vweE4GrWz73JUZ+aWBvkfzGr6qZYbhiHKZ1CLI+6TFP2gJrBXXx3j0q6rx5FGrgJKTgoQVn2Slga7Z12uf3DbboQAAqfJgBx5JBACpn3lvq8GeAAAt9qqOEBFFg0kaSA3ZfJx4gtjBkAHhkFdd/8Oj1a1ADWgYzeltmoHPs5BQDOUcwABAKwPDDEGIZDfwhGpSl3orFQSiQIhAbL1rN1uouWpxVXdXJEgipg0rkXerm4yf2b6NvftIbi2y6s5573/UZthPOFlSVt3h3X0Ed/bdoIZKsuM0TZSaRWa8cVeevb+9ZpEU7bGaG54s8JmdsZf2e7eusowub1nT6VsF+3N2gcyXItDCxXMNyYZ11B574HpGRMThbjwmr23oK1tN4/ZaFkLaF0XVh+9C55PBYGgtuhWXXWhlZp9Bo1sM0xXDERKA6lHhvZrnaWvMFojzApuTENoHtr1EY37qgAABbHnrO7nc/NIMA2Fq9eXlky+27gAABJrozqAHro4rp8j5IHcvppyQAty8qgGnSQjN3w7uDaRHt3v4n22+/Pveo5558e2a7AUoAQQCIauc4eIgLiOAdRAMBEQDMLDUpjAZW8YS1SuKVntxCopcD9QvPpug/veW9U1Xrfn1c4Dom/6F6P2atqcSDrur0LzqrLrWVPN6fXKyM1qpS8TX9ueuSRGbLFedV2sPm4vjWbJ1RlkohA1VVU6L/ASuHhcfJw9P1KsAAA9dLO4nJ/aSCABZKGrg+niM302H4MBsxmE9v09dTCvj6vTAGO6C/bfD4QO/tBmAGcCev5WvAAXsADQWzmfrxl+A0uCEalIWuk2GjuFiqEyANm9XXNTZ5rW9UulzURKi6VAUcJmHY3bvJOzH9074Z4N2H0Z3FwxfkEFL5q58/PZQ4N8BLGP6tr/8as8Gs2bHT266Fd0Y0e8eWb1tOaeUXPNVXP/V+kUNDyr2rm/R8xwvB/G1S8OTnv6bTMi0562+i4Bt5TjL9RsnDY3DZfH7/pKNrxffMVkt+zORtNQh9/ecNlDKXo4827awOScOrLI5XseSXPU7G7PBK70bpLAmwdKzMTqqjbwTfFlGMNb7Lw4BeZzLT5uIBHCNGGDgA6pk7bJ4hFEEAPI9M7gADwsb0iF7AbR/GgAIvJPWIdnQQximgAA7Khmjvr7uzBiwLfQTLAZ/uWAaW4G+a0A60kgHT2MAzCwoCwTOAycyq3fDW7qrpJxxdNy4ApKcLpy5d7wth8u/ra933WdIiyJf6rj88rg6hn2/rd3sHXuP6dhXRYTKY2ucaCzltkX9+BM6ozWi75UD0x02e/VXp7YnQF8ZgA5Rr1oaqAAdZlS6NA+mcATcu1gNRC+alyaz9fTwIoJt3amUh8jHJDI0cQgznDgbMIKSU0buc2WaCZAe9wylADfo5q+KiUOk+pvvDShfW0yzffchbpQbRwCEalG3Kj2GBKGCGYBjM3Vcb51qWVFrSaqRJSGxpKks96+VG3sLRl7pNWRPzrFNxRV+0EDMUWOfcNHaZ8j7Bplyc1dJ4RlvmnKWJ80aOyeO2qYdOZvR45mBg0b9a+oRW9n3tyKmFrCy4r/cd7ZQD/H9Q431TxGzPdlym47FA//Fan1axZarYS43HjLOh5Z5VXEf4dapYYn19VuY0BGcVxnjUec5yFElQ8ypxabEWQVdRcfdbi67FqpvteH6CiIbX2jXfhH2NYal0frz4cAen0LpXaNITk2zotGc5WRZ0yqEsi8+9HpWMB3OQmPeQkSUS1c6HBoQOWCRaCRSmGn6o7gqUP/x4DN/x8bLhS8kS/r+5L4Jl+73396hgb887qa/i96ACNAVopjiAbBcTBUhjAg73XGeOpLqVEkz2uMXaoHKzTRgyzA7scq0KWua4v1o8cXqUgZdN9NvoeXWD7fJxmv8cvegm53lCLZjHzW1jt8lnimwZezcpo9U3KeqxFD3lZgny8mg2+BrLc3TNXsuO49/BhXy98AAKFk75wszrwcHTqDybMZK8fsK9vs+vxzvtJL5HOPaqXabsdyAT6fUFsi99K8SAAAr19V4ABOo7msT2SC/QfwPK/ziI9lwwBr/G4ZP2NI4hGpRdwpcFYSkAjvqud5xuc8Ehd1WrSSQkVNiKOpsb/3BclMuTa9NZj2V+cmDs/5P5ToWlOw972DGWrP+XzFGuSmJulUHdWOdJRvuC4+kOsZ6606WzbmuULZ+j55ho5PzjunRveKFtW8jxfVtPVPcbd7jAeQ6Hr/Jec6NLzDinOB5B+z/goa9lUJSpPNvzdFlNhym5ehsPQ/qYzmPAXPotzYZGH9K7JzJeqrjW0vIoagEXPcRjqw51FrLyGP4tRPuBhDa0iQuUB0k/bOcMZwSrlpRKNpWmUjxluc5x1zrGli1z7ZzqcCkcDnKbiRuOJqSHOStornMJjseP/8N3wlcAAj7rjK/lsFZxG2lgR07uPjNs8tyDHaV7JC+7y38s+7r+HLsFyDiABGAKqKIBwFwwJSgFQgRlc1eN3eSXV3lW+FlSIHZJbgaOqTaqcB0PyestCqjZP4esbVatZe1mR4L5q8cmuwsLPMXbKGXVqqcZfdn02bugJstq4vnlrGwEQlcsVW0jRoIkpc6UnosQiZR+qHd2+j+H00AcFPol6GcdLZVk87lip91y8lBpKfe8cV9AggBjJCVBXZQBM6gpo7jJGpzPo1x+xe/19rZfV8oL6/RM+HIB3+3YBqrV8N6+qYAGM5509+tgHl7yueKiQcAhGpRlypcCcSBYJjAiZW65471vU1hJqq4rS1rolTA1cgbUwVQxexd8/Yad0psXjPWGzfsnEunfYfEuY7m6p8ed+/Nict6PxxzNlzmD05C1Rx+BxN8U/Rnk3dWi7Z44B5vb/x+C5mz26+EIqH52So/u2UPhsd2GpbP0D5Tw4LpNWdde81ylLL5AxotdzfVNb8RdJ4yv6h99lXBbD/BljJtV40fnPaq/DcX95n6HA5V3+NZPjvF8rV5QrI1jnpecQ1ihbnxpiOWe+jwT2dFFPUJ1eRiHrA5S4MsY1VP5BiYwVNHc5yIBOgyfmhlVuiAwQbeCQDCK8Hl/zaWQYx2H3vCnGMPe8quD21gK7FEv4Vb8JWAEZqRaUafF1GWjASNf4n6p75vv6iXugTAipkIEIEYcCUTCQQEfUzc513reprmravI+NLqrSoEhljkM4ePPnlmN9JvnvDelvKc0+OdG/JdJYPAnJeGzSljgu2HQE06Up0SdWok1dw7R1lf3sHHkXcomMsZzyG3SbqsjCSjn7AtwdDKAbFoievtlszFL7BCEjUvDwjb7OPs2yAATTZFzYIo0Z2sUCALJsNUzGOlUy1iEqmQsE7MkQrchfx9Gfv+z9X4yGHbwCdevk2YIRsBmpncZQxziAHZup619MrBn8V4ZLIyIGw/AIRqUVaadYYGwUZYkx4m5upfnnXPXNtSRLJKupaRxjWmAIZkQgAAJ5VNtkN9b/9BzzbD+29mn5LeO6vGbx9F+y5g54FEttLXVopHKqtsXeaQV3ASdJHqBz1tmmwWL5J7jFcakXCXcJDSl77XmbCrTqabgsPWKOMpoq83hF9lgI+8r1jmvX7rI/qCABegTxIjoYVlKgLYjxRgGFysOLSkmJaTi1UKspuwzgmKuYuVOa3SCFNAHMaGRkyeX6WytbLCJGdVmj6mUpsmuvnU5oqlgpYy3crlIsdVurSSlnKRuzTUsZSMMzkoquWiZufNg32W7N5SbGW7CcrdbKBkamiCw6UDEnAy8bRkRMwYONgehdR603HrjLOLZt2HozX+lMo5e95qu2KXr6eaqpDC7ko+Rr8AAARFTYjhAaEMaCEQCYJBZfPdZfdtcZr153KvUu7q8tar1jWmAIZkQgAAJ5VpJFyw2RI5IafhWx4pOGxfRU7ozUm7Sr1mGxtiYhV6o0VdTDL65P7lPjO4iVR7WvBFCqXoMpxLWJ4SDwpBgOaRKvNMUSTVuz0VXWXa/T/5/f56+aB6wVZWca0FQxfCoati7KzwvW+FEktX9Vd+F5qZNf1LKzb0YvTeUQCoq8VMxJSrOZMkt7F/AFBSNHiTVT2XXvRLPZbTJRL+tnH9vGA4hGpOdQRAQISIgwUUKDGtLBcjLxEPE8oKgliTTF6edNX8Rc9J4b0XwXcfEdj9w4RaqYpk7BWshlLZLMZmJa00ZTDmC3BRnmplESDOihPimURKtMVuyor1aYrd/UDGTu85FzT0fR5EU4oADnCkWIwkJUqTKqJQoY1pYLkZeIh4nlBUWIzAmQ/FqqOCXUT4kabO+n+8+AMmK1UXOhn3b+k/SeR8Z0MSDEoTdMoiV6ZLdyAPiG8lEKWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWl4AAAEN21vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAANtAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAALKdHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAAAAAAANtAAAAAAAAAAAAAAABAQAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAJGVkdHMAAAAcZWxzdAAAAAAAAAABAAADQgAACAAAAQAAAAACQm1kaWEAAAAgbWRoZAAAAAAAAAAAAAAAAAAAu4AAAKRNVcQAAAAAAC1oZGxyAAAAAAAAAABzb3VuAAAAAAAAAAAAAAAAU291bmRIYW5kbGVyAAAAAe1taW5mAAAAEHNtaGQAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAbFzdGJsAAAAZ3N0c2QAAAAAAAAAAQAAAFdtcDRhAAAAAAAAAAEAAAAAAAAAAAACABAAAAAAu4AAAAAAADNlc2RzAAAAAAOAgIAiAAEABICAgBRAFQAAAAAC/usAAv7rBYCAgAIRkAaAgIABAgAAACBzdHRzAAAAAAAAAAIAAAApAAAEAAAAAAEAAABNAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAAqAAAAAQAAALxzdHN6AAAAAAAAAAAAAAAqAAACAAAAAgAAAAIAAAACAAAAAgAAAAKYAAACLQAAAhIAAAIUAAACEgAAAjQAAAI4AAACIwAAAh0AAAIcAAACLwAAAiwAAAIfAAACDgAAAg0AAAH0AAACBgAAAgwAAAINAAACCAAAAe0AAAH3AAAB+AAAAfcAAAH5AAAB6QAAAeIAAAHvAAAB5gAAAcgAAAHWAAAB1AAAAeQAAAHvAAAB9gAAAf0AAADoAAAAFHN0Y28AAAAAAAAAAQAAACwAAAAac2dwZAEAAAByb2xsAAAAAgAAAAH//wAAABxzYmdwAAAAAHJvbGwAAAABAAAAKgAAAAEAAAD5dWR0YQAAAPFtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAMRpbHN0AAAALal0b28AAAAlZGF0YQAAAAEAAAAAaHR0cHM6Ly9jbGlwY2hhbXAuY29tAAAAj6ljbXQAAACHZGF0YQAAAAEAAAAAQ3JlYXRlIHZpZGVvcyB3aXRoIGh0dHBzOi8vY2xpcGNoYW1wLmNvbS9lbi92aWRlby1lZGl0b3IgLSBmcmVlIG9ubGluZSB2aWRlbyBlZGl0b3IsIHZpZGVvIGNvbXByZXNzb3IsIHZpZGVvIGNvbnZlcnRlci4=";
function loadSamples(){ try{ const bin=atob(GLOCK_B64), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); AC.decodeAudioData(u.buffer,b=>{glockBuf=b;},()=>{}); }catch(e){} }
function sample(buf,rate,v,lp){
    if(!ac()||!buf) return false; const s=AC.createBufferSource(); s.buffer=buf; s.playbackRate.value=rate;
    const g=AC.createGain(); g.gain.value=v; let n=s;
    if(lp){ const f=AC.createBiquadFilter(); f.type="lowpass"; f.frequency.value=lp; s.connect(f); n=f; }
    n.connect(g); g.connect(master); s.start(); return true;
}
S.pistol=()=>{ sample(glockBuf,1,.95)||S.rifle(); };
S.deagle=()=>{ sample(glockBuf,.78,1,3000)||S.rifle(); T(110,38,.22,"sine",.45); };
S.revolver=()=>{ sample(glockBuf,.64,1,2200)||S.rifle(); T(90,32,.28,"sine",.5); };
S.knife=()=>N(.12,.3,800,3200,"bandpass");
S.shotgun=()=>{ N(.3,.9,2600,110,"lowpass"); T(120,32,.32,"sawtooth",.5); };
S.sniper=()=>{ N(.4,.8,5200,140,"lowpass"); T(160,28,.5,"sawtooth",.5); T(900,300,.5,"sine",.1,{d:.05}); };
const WKEY={fist:"fist",hammer:"hammer",magic:"energy",rifle:"rifle",rapidRifle:"rapid"};

/* ---------- PARTICULES / VFX ---------- */
const FX=[], RG=[], TR=[], BARS=[];
const pg=new THREE.BoxGeometry(1,1,1), pm={}, gm={};
const pmat=c=>pm[c]||(pm[c]=new THREE.MeshBasicMaterial({color:c}));
function burst(pos,col,n,spd,size,life,grav=9){
    for(let i=0;i<n&&FX.length<GFX.fx;i++){
        const m=new THREE.Mesh(pg,pmat(col)); m.position.copy(pos);
        const s=size*(.5+Math.random()); m.scale.setScalar(s);
        const l=life*(.6+Math.random()*.6);
        m.userData={v:new V(Math.random()-.5,Math.random()*.9+.1,Math.random()-.5).normalize().multiplyScalar(spd*(.4+Math.random())),l,max:l,s,g:grav};
        scene.add(m); FX.push(m);
    }
}
const rgeo=new THREE.RingGeometry(.85,1,40); rgeo.rotateX(-Math.PI/2);
function ring(pos,r,col,life=.5){
    const m=new THREE.Mesh(rgeo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
    m.position.set(pos.x,(pos.y||0)+.1,pos.z); m.scale.setScalar(.1); m.userData={r,l:life,max:life};
    scene.add(m); RG.push(m);
}
const flashLight=new THREE.PointLight(0xffc266,0,18); scene.add(flashLight);
let shake=0;

function tracer(col,spr=0){
    raycaster.setFromCamera(new THREE.Vector2((Math.random()-.5)*spr,(Math.random()-.5)*spr),camera);
    const o=raycaster.ray.origin.clone(), d=raycaster.ray.direction.clone();
    const right=new V(Math.cos(cameraYaw),0,-Math.sin(cameraYaw));
    const a=o.clone().addScaledVector(d,.9).addScaledVector(right,.28); a.y-=.22;
    let end=o.clone().addScaledVector(d,70);
    const h=raycaster.intersectObjects([...levelGroup.children,...enemies.filter(e=>e.userData.alive)],true);
    if(h.length){
        end=h[0].point.clone(); let ob=h[0].object; while(ob.parent&&!enemies.includes(ob)) ob=ob.parent;
        if(!enemies.includes(ob)){ burst(end,0xffe08a,6,5,.05,.3); burst(end,0x8a8f98,5,3,.09,.5); }
    }
    const len=a.distanceTo(end);
    const m=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:col,transparent:true}));
    m.scale.set(.03,.03,len); m.position.copy(a).add(end).multiplyScalar(.5); m.lookAt(end);
    scene.add(m); TR.push({m,l:.07});
}
function dmgNum(pos,txt,col){
    const p=pos.clone().project(camera); if(p.z>1) return;
    const e=document.createElement("div"); e.className="dn"; e.textContent=txt; e.style.color=col;
    e.style.left=((p.x*.5+.5)*innerWidth+(Math.random()*30-15))+"px"; e.style.top=((-p.y*.5+.5)*innerHeight)+"px";
    document.body.appendChild(e); setTimeout(()=>e.remove(),800);
}
let msgT=0;
function killMsg(t,c){ const e=$("killMsg"); e.textContent=t; e.style.color=c||"#ff4d4d"; e.classList.remove("show"); void e.offsetWidth; e.classList.add("show"); }
function clearFX(){
    [FX,RG].forEach(a=>{ a.forEach(m=>scene.remove(m)); a.length=0; });
    TR.forEach(t=>scene.remove(t.m)); TR.length=0;
    BARS.forEach(b=>scene.remove(b.g)); BARS.length=0;
}

/* ---------- Nuages (décor) ---------- */
const clouds=new THREE.Group(); scene.add(clouds);
const cmat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.75,fog:false});
for(let i=0;i<16;i++){
    const g=new THREE.Group(), a=Math.random()*6.28, r=60+Math.random()*80;
    for(let j=0;j<4;j++){ const s=new THREE.Mesh(new THREE.SphereGeometry(5+Math.random()*5,10,8),cmat); s.position.set(j*7-10,Math.random()*3,Math.random()*5); s.scale.y=.5; g.add(s); }
    g.position.set(Math.cos(a)*r,50+Math.random()*25,Math.sin(a)*r); clouds.add(g);
}

/* ---------- Types d'ennemis ---------- */
const TYPES={
    grunt :{strafe:2.2,keep:14,adv:0,back:2.5,pv:1,lead:.5,spread:.07,dm:1,ps:1,col:0xff4422,cd:1,hp:1,sc:1,color:0},
    runner:{strafe:3.2,keep:3,adv:3.2,back:0,pv:1.15,lead:0,spread:.14,dm:.8,ps:.8,col:0xffaa22,cd:.8,hp:.6,sc:.85,color:0xff8a00},
    tank  :{strafe:.8,keep:6,adv:1.2,back:0,pv:.65,lead:.2,spread:.05,dm:1.6,ps:1.7,col:0xb455ff,cd:1.2,hp:2.2,sc:1.25,color:0x7e22ce},
    sniper:{strafe:.8,keep:24,adv:0,back:6,pv:1.8,lead:1,spread:.008,dm:2,ps:.8,col:0x38bdf8,cd:1.6,hp:.8,sc:1,color:0x0369a1}
};
const _ce=createEnemy;
createEnemy=function(x,z,o={}){
    const e=_ce(x,z,o), u=e.userData; let t="grunt";
    if(!u.boss){
        const r=Math.random();
        if(level>=2&&r<.25) t="runner"; else if(level>=3&&r<.45) t="tank"; else if(level>=4&&r<.6) t="sniper";
        const T=TYPES[t]; u.hp*=T.hp; u.maxHP=u.hp; e.scale.multiplyScalar(T.sc); u.originalScale*=T.sc;
        if(T.color){ u.mainMaterial.color.setHex(T.color); }
        u.mainMaterial.emissive.setRGB(1,.25,.1); u.mainMaterial.emissiveIntensity=0;
    }
    u.type=t; u.flash=0;
    const g=new THREE.Group(), bg=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.7})), fg=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0x22c55e}));
    fg.position.z=.002; g.add(bg,g.fg=fg); g.bg=bg; scene.add(g); BARS.push({g,e});
    return e;
};

/* ---------- Hooks sur le jeu existant ---------- */
const _atk=attack;
attack=function(){
    const b=attackCooldown, w=currentWeapon, am=w.ammo, k=Object.keys(weapons).find(x=>weapons[x]===w);
    _atk();
    if(!(b<=0&&attackCooldown>0)) return;
    if(w.type==="gun"&&w.ammo>=am){ S.click(); return; }
    (S[w.snd]||S.rifle)(); ac(); if(window.C3x) C3x.fire(w,k);
    if(w.type==="gun"){
        const rapid=w.cooldown<.2, np=w.snd==="shotgun"?6:1;
        shake+=rapid?.02:.04; cameraPitch+=rapid?.004:.011;
        flashLight.intensity=5; for(let q=0;q<np;q++) tracer(rapid?0xffd27a:0xfff2a8,np>1?.14:0);
    } else if(w.type==="energy"){ shake+=.03; flashLight.color.setHex(0x8b5cf6); flashLight.intensity=4; }
};
const _rl=reload; reload=function(){ S.reload(); _rl(); };
const _jp=jump; jump=function(){ const g=grounded&&state==="playing"&&!gameFinished; _jp(); if(g) S.jump(); };
const _ad=addCoins; addCoins=function(n){ _ad(n); if(n>0) S.coin(); };

const _de=damageEnemy;
damageEnemy=function(e,dmg){
    if(!e||!e.userData.alive) return _de(e,dmg);
    const u=e.userData, h0=u.hp; _de(e,dmg);
    const dd=h0-u.hp; if(dd<=0) return;
    const p=e.position.clone(); p.y+=1.2*e.scale.y;
    burst(p,0xff3b2f,u.boss?6:10,5,.09,.5); burst(p,0xffd27a,4,7,.05,.3);
    dmgNum(p,Math.round(dd),u.boss&&!u.vulnerable?"#cbd5e1":"#ffd166");
    u.flash=1; S.hit();
    for(const o of enemies){
        if(!o.userData.alive||o.userData.boss) continue;
        if(o===e||o.position.distanceTo(e.position)<25){
            o.rotation.y=Math.atan2(player.position.x-o.position.x,player.position.z-o.position.z); o.userData.patrolTarget=null;
        }
    }
    if(!u.alive){
        const big=u.boss; burst(p,0xff2a1a,big?70:26,big?11:8,.14,.9); burst(p,0xffb347,big?30:12,6,.08,.5,3);
        ring(e.position,big?9:3.2,0xff5533,.6); shake+=big?.6:.15;
        big?S.bossKill():S.kill();
        const c=$("crosshair"); c.classList.add("kill"); setTimeout(()=>c.classList.remove("kill"),220);
        combo++; comboT=3.2; killMsg(big?"BOSS VAINCU !":(combo>1?"COMBO x"+combo:"ÉLIMINÉ"),big?"#ffd166":"#ff4d4d");
    }
};
const _sba=startBossAttack; startBossAttack=function(e){ _sba(e); S.warn(e.position); };
const _eba=executeBossAttack;
executeBossAttack=function(e){
    const a=e.userData.attack; _eba(e); if(!a) return;
    if(a.name==="slam"){ ring(e.position,a.radius,0xff3333,.7); ring(e.position,a.radius*.6,0xffaa33,.5); burst(e.position.clone().setY(.3),0x8a7f70,40,9,.2,.8); shake+=.9; S.slam(e.position); }
    else if(a.name==="charge") S.charge(e.position);
};
const _fbp=fireBossProjectile; fireBossProjectile=function(e){ _fbp(e); S.bossShot(e.position); };

const _sm=startMode;
startMode=function(k){ ac(); clearFX(); _sm(k); prevHP=playerHP; prevWave=1; combo=0; prevPU=0; S.start(); };
const _gl=goToLobby; goToLobby=function(){ clearFX(); _gl(); };
const _eg=endGame; endGame=function(w){ if(gameFinished) return _eg(w); _eg(w); w?S.win():S.lose(); };

/* ---------- Boucle d'effets (branchée sur le rendu) ---------- */
const clk=new THREE.Clock(), pPrev=new V(), pVel=new V();
let prevHP=100, prevWave=1, prevPU=0, prevGround=true, stepT=0, hbT=0, bobT=0, combo=0, comboT=0, lastSh=null, lastShT=0;
const vig=$("vig"), dirEl=$("dmgDir"), wv=$("weaponView");
const glow=c=>gm[c]||(gm[c]=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.3,depthWrite:false}));
const sph=new THREE.SphereGeometry(.35,8,8);

function tagProj(p){
    let sh=null, bd=9;
    for(const e of enemies){ if(!e.userData.alive) continue; const d=Math.hypot(e.position.x-p.position.x,e.position.z-p.position.z); if(d<bd){bd=d;sh=e;} }
    const u=p.userData; u.col=0xff4422;
    if(sh){
        lastSh=sh; lastShT=2; const su=sh.userData;
        if(!su.boss){
            const T=TYPES[su.type]||TYPES.grunt, sp0=u.velocity.length()*T.pv, d=p.position.distanceTo(camera.position);
            const tg=camera.position.clone().addScaledVector(pVel,(d/sp0)*T.lead*(window.BOT?BOT.lead():1));
            const dir=tg.sub(p.position).normalize();
            const SPR=T.spread*(window.BOT?BOT.spread():1); dir.x+=(Math.random()-.5)*SPR; dir.y+=(Math.random()-.5)*SPR; dir.z+=(Math.random()-.5)*SPR;
            u.velocity.copy(dir.normalize().multiplyScalar(sp0)); u.damage*=T.dm*(window.BOT?BOT.dmg():1); p.scale.setScalar(T.ps); u.col=T.col;
            su.shootCooldown*=T.cd; if(window.BOT) su.shootCooldown=BOT.nextCd(su,su.shootCooldown); S.enemyShot(p.position); burst(p.position,0xffb347,5,4,.07,.2,0);
        } else u.col=0xff5533;
    }
    p.add(new THREE.Mesh(sph,glow(u.col)));
}

function upd(dt){
    setListener(); const px=player.position;
    pVel.set((px.x-pPrev.x)/dt,0,(px.z-pPrev.z)/dt); if(pVel.length()>40) pVel.set(0,0,0); pPrev.copy(px);
    const spd=pVel.length();

    if(grounded&&spd>2){ stepT-=dt; if(stepT<=0){ S.step(); stepT=.38/(speedMult>1?1.4:1); } }
    if(grounded&&!prevGround){ S.land(); burst(px.clone().setY(px.y+.1),0x9a8f80,8,3,.12,.5,2); }
    prevGround=grounded;

    if(playerHP<prevHP-.5){
        const drop=prevHP-playerHP; S.hurt(); shake+=clamp(drop/30,.1,.7);
        let at=lastShT>0?lastSh:null, bd=99;
        if(!at) for(const e of enemies){ if(!e.userData.alive) continue; const d=e.position.distanceTo(px); if(d<bd){bd=d;at=e;} }
        if(at){
            const rx=at.position.x-camera.position.x, rz=at.position.z-camera.position.z;
            const fw=rx*-Math.sin(cameraYaw)+rz*-Math.cos(cameraYaw), rt=rx*Math.cos(cameraYaw)-rz*Math.sin(cameraYaw);
            dirEl.style.transform="rotate("+Math.atan2(rt,fw)+"rad)";
            dirEl.style.animation="none"; void dirEl.offsetWidth; dirEl.style.animation="dd .9s ease-out forwards";
        }
    }
    prevHP=playerHP;
    const low=playerHP<40; vig.style.boxShadow="inset 0 0 160px 40px rgba(220,0,0,"+(low?(40-playerHP)/40*.75:0)+")";
    if(playerHP<30&&playerHP>0){ hbT-=dt; if(hbT<=0){ S.beat(); hbT=.9; } }

    if(wave!==prevWave){ prevWave=wave; S.wave(); }
    prevPU=activePowerups.length;
    if(comboT>0){ comboT-=dt; if(comboT<=0) combo=0; }
    lastShT-=dt;

    for(const e of enemies){
        const u=e.userData; if(!u.alive||u.boss) continue;
        u.flash=Math.max(0,(u.flash||0)-dt*5); u.mainMaterial.emissiveIntensity=u.flash*1.6;
        const dx=px.x-e.position.x, dz=px.z-e.position.z, d=Math.hypot(dx,dz)||1;
        let a=e.rotation.y-Math.atan2(dx,dz); a=Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));
        if(a<.03&&d<=35){
            const T=TYPES[u.type]||TYPES.grunt;
            u.sT=(u.sT||0)-dt; if(u.sT<=0){ u.sD=Math.random()<.5?-1:1; u.sT=1+Math.random()*1.8; }
            let fwd=0; if(d>T.keep+3) fwd=T.adv; else if(d<T.keep-3) fwd=-T.back;
            if(u.hp<u.maxHP*.25&&u.type!=="tank") fwd=-3.2;
            const mx=(-dz/d)*u.sD*T.strafe+(dx/d)*fwd, mz=(dx/d)*u.sD*T.strafe+(dz/d)*fwd;
            moveCharacter(e,mx*dt,mz*dt); animateLimbs(e,dt,true);
            e.position.y=getGroundHeight(e.position.x,e.position.z)+(u.jumpH||0);
        }
    }

    for(const p of enemyProjectiles.children){
        const u=p.userData; if(!u.fx){ u.fx=1; tagProj(p); }
        if(GFX.trail) burst(p.position,u.col,1,.3,.09,.3,0);
        if(!u.wh&&p.position.distanceTo(camera.position)<7){ u.wh=1; S.whoosh(p.position); }
    }
    for(const p of projectiles.children){
        if(!p.userData.fx){ p.userData.fx=1; p.add(new THREE.Mesh(sph,glow(0x8b5cf6))); }
        burst(p.position,0xa78bfa,1,.4,.12,.35,0);
    }

    const mv=spd>2; bobT+=dt*(mv?9:2);
    const SW=window.C3V9?C3V9.sway:1; wv.style.translate=Math.sin(bobT*.5)*(mv?6:1.5)*SW+"px "+Math.abs(Math.sin(bobT))*(mv?5:1)*SW+"px";
}

const _render=renderer.render.bind(renderer);
renderer.render=function(s,c){
    const dt=Math.min(clk.getDelta(),.05);
    if(!paused){
        if(state==="playing"&&!gameFinished) upd(dt);
        for(let i=FX.length-1;i>=0;i--){
            const m=FX[i], u=m.userData; u.l-=dt;
            if(u.l<=0){ scene.remove(m); FX.splice(i,1); continue; }
            u.v.y-=u.g*dt; m.position.addScaledVector(u.v,dt);
            const gy=getGroundHeight(m.position.x,m.position.z); if(m.position.y<gy){ m.position.y=gy; u.v.multiplyScalar(.3); u.v.y=Math.abs(u.v.y)*.3; }
            m.scale.setScalar(u.s*u.l/u.max);
        }
        for(let i=RG.length-1;i>=0;i--){
            const m=RG[i], u=m.userData; u.l-=dt; const t=1-u.l/u.max;
            if(u.l<=0){ scene.remove(m); m.material.dispose(); RG.splice(i,1); continue; }
            m.scale.setScalar(u.r*(1-Math.pow(1-t,3))+.1); m.material.opacity=.8*(1-t);
        }
        for(let i=TR.length-1;i>=0;i--){
            const t=TR[i]; t.l-=dt; t.m.material.opacity=Math.max(0,t.l/.07);
            if(t.l<=0){ scene.remove(t.m); t.m.material.dispose(); TR.splice(i,1); }
        }
        flashLight.position.copy(camera.position); flashLight.intensity*=Math.pow(.0005,dt);
        if(flashLight.intensity<.05){ flashLight.intensity=0; flashLight.color.setHex(0xffc266); }
        clouds.children.forEach((g,i)=>{ g.position.x+=dt*(.6+i%3*.3); if(g.position.x>150) g.position.x=-150; });
        for(let i=BARS.length-1;i>=0;i--){
            const b=BARS[i], u=b.e.userData;
            if(!enemies.includes(b.e)){ scene.remove(b.g); BARS.splice(i,1); continue; }
            const dist=b.e.position.distanceTo(camera.position), r=Math.max(0,u.hp/u.maxHP), w=u.boss?1.8:1;
            b.g.visible=u.alive&&dist<32&&(r<1||dist<20);
            if(!b.g.visible) continue;
            b.g.position.set(b.e.position.x,b.e.position.y+(u.boss?3.4:2.6)*u.originalScale/(u.boss?1.35:1),b.e.position.z);
            b.g.quaternion.copy(camera.quaternion);
            b.g.bg.scale.set(w+.06,.17,1); b.g.fg.scale.set(Math.max(.001,w*r),.11,1); b.g.fg.position.x=-w/2+w*r/2;
            b.g.fg.material.color.setHSL(r*.33,.9,.5);
        }
    }
    const x=c.position.x, y=c.position.y, z=c.position.z, rz=c.rotation.z;
    const SK=(window.C3V9&&C3V9.shake!=null)?C3V9.shake:1; if(shake>.002){ c.position.x+=(Math.random()-.5)*shake*SK; c.position.y+=(Math.random()-.5)*shake*SK; c.rotation.z+=(Math.random()-.5)*shake*.05*SK; }
    shake*=Math.pow(.02,dt);
    _render(s,c);
    c.position.set(x,y,z); c.rotation.z=rz;
};

/* ---------- Interface ---------- */
["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,()=>ac(),{passive:true}));
const mb=$("muteBtn");
function setMute(m){ muted=m; localStorage.setItem("c3d_mute",m?"1":"0"); if(master) master.gain.value=m?0:GFX.vol; mb.textContent=m?"🔇":"🔊"; }
mb.addEventListener("click",e=>{ e.stopPropagation(); ac(); setMute(!muted); });
document.addEventListener("keydown",e=>{ if(e.key.toLowerCase()==="m"&&!e.repeat) setMute(!muted); });
setMute(muted);
function resetFX(){
    clearFX(); shake=0; flashLight.intensity=0; combo=0; comboT=0; lastShT=0;
    vig.style.boxShadow="inset 0 0 160px 40px rgba(220,0,0,0)"; dirEl.style.animation="none"; dirEl.style.opacity=0;
    document.querySelectorAll(".dn").forEach(e=>e.remove()); $("killMsg").classList.remove("show");
}
window.C3={T,N,S,burst,ring,ac,clouds,reset:resetFX,shake:v=>{shake+=v;},flash:flashLight,setVol:()=>{ if(master&&!muted) master.gain.value=GFX.vol; }};
})();

/* ===== jeu-03 ===== */
/* ===== COMBAT 3D — ARMES, MAINS, SKINS, BOUTIQUE, SALON ===== */
(()=>{
const {S,burst,ring,ac,clouds}=C3, V=THREE.Vector3, $=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), BX=new THREE.BoxGeometry(1,1,1);

/* ---------- Skins ---------- */
const SKINS=[
 {id:"std",n:"Standard",p:0},
 {id:"for",n:"Forêt",p:60,b:0x2f4a2a,s:0x1d2b1a,a:0xa3b18a},
 {id:"oce",n:"Océan",p:80,b:0x0b4f8a,s:0x072b4d,a:0x4fd1ff},
 {id:"mag",n:"Magma",p:100,b:0x3b0d0d,s:0x1a0505,a:0xff5a00,e:1},
 {id:"gla",n:"Glace",p:120,b:0x9be7ff,s:0x4fb5d6,a:0xffffff},
 {id:"spe",n:"Spectre",p:140,b:0x3b1a6b,s:0x1c0b38,a:0xd946ef,e:1},
 {id:"or",n:"Or Royal",p:250,b:0xd4a017,s:0x8a6508,a:0xfff2a8,m:1}
];
const own=new Set(JSON.parse(localStorage.getItem("c3d_own")||"[]")), eq=JSON.parse(localStorage.getItem("c3d_eq")||"{}");
const saveSk=()=>{ localStorage.setItem("c3d_own",JSON.stringify([...own])); localStorage.setItem("c3d_eq",JSON.stringify(eq)); }; window.C3own=own; window.C3saveSk=saveSk;
const owned=(k,s)=>s==="std"||own.has(k+":"+s);
const CSK=[{id:"std",n:"Recrue",p:0,body:0x168cff,back:0x1f2937,leg:0x20242b},{id:"c_com",n:"Commando",p:80,body:0x4d7c0f,back:0x1a2e05,leg:0x2a3a1a},{id:"c_nin",n:"Ninja",p:120,body:0x18181b,back:0xdc2626,leg:0x0a0a0a},{id:"c_rou",n:"Pyro",p:140,body:0xdc2626,back:0xfbbf24,leg:0x450a0a},{id:"c_gla",n:"Givre",p:160,body:0x7dd3fc,back:0xffffff,leg:0x0369a1},{id:"c_neo",n:"Néon",p:200,body:0xec4899,back:0x22d3ee,leg:0x3b0764},{id:"c_gal",n:"Galaxie",p:260,body:0x5b21b6,back:0xfacc15,leg:0x1e1b4b},{id:"c_or",n:"Roi d'or",p:400,body:0xd4a017,back:0x7c2d12,leg:0x78350f}];
const charSk=id=>CSK.find(x=>x.id===id)||CSK[0];
const skinOf=id=>SKINS.find(x=>x.id===id)||CSK.find(x=>x.id===id)||SKINS[0];
const wKey=w=>Object.keys(weapons).find(k=>weapons[k]===w);

/* ---------- Modèles 3D des armes (pointent vers -Z, origine = poignée) ---------- */
const DEF=[0x353a42,0x1a1c20,0xb0b6c0];
const SPEC={
 knife:{c:[0x555a63,0xcfd4dc,0x8a8f98],rh:[0,-.01,.03]},
 hammer:{c:[0x6b4a2b,0x8a8f98,0x3a3f47],rh:[0,0,.04]},
 glock:{mag:[.026,.06,.034,0,-.1,0],rh:[0,-.045,0],lh:[-.036,-.058,-.016],mz:[0,.03,-.21]},
 deagle:{c:[0x4b4f57,0x23262b,0xc9ced6],mag:[.03,.07,.04,0,-.12,.015],rh:[0,-.05,0],lh:[-.04,-.065,-.015],mz:[0,.04,-.29]},
 revolver:{c:[0x6b6f77,0x2a2d33,0xb08d57],rh:[0,-.045,.03],lh:[-.038,-.056,.005],mz:[0,.035,-.33]},
 smg:{mag:[.03,.13,.04,0,-.09,-.13],rh:[0,-.05,.01],lh:[0,-.03,-.22],mz:[0,.02,-.42]},
 ak:{c:[0x4a3a2a,0x1a1c20,0x8a8f98],mag:[.034,.15,.06,0,-.1,-.17],rh:[0,-.05,.01],lh:[0,-.035,-.4],mz:[0,.02,-.77]},
 shotgun:{c:[0x5a3f2a,0x2a2d33,0xb0b6c0],rh:[0,-.05,.01],lh:[0,-.035,-.33],mz:[0,.025,-.72]},
 sniper:{c:[0x3d4a3a,0x1a1c20,0x4fd1ff],mag:[.03,.07,.05,0,-.07,-.12],rh:[0,-.05,.01],lh:[0,-.03,-.4],mz:[0,.02,-.97]}
};
C3M.syncSpec(SPEC);
function build(key,skinId){
    if(key==="char"){ const cs=charSk(skinId); return createFighter(cs.body,{backColor:cs.back,legColor:cs.leg}); }
    const wm=C3M.weapon(key,skinOf(skinId)); if(wm) return wm;
    throw new Error("modèle d'arme manquant : "+key);
}

/* ---------- Vue première personne : arme + mains ---------- */
scene.add(camera);
const vm=new THREE.Group(), gunG=new THREE.Group(); vm.add(gunG); camera.add(vm);
const mzM=new THREE.Mesh(new THREE.SphereGeometry(1,8,8),new THREE.MeshBasicMaterial({color:0xffe9a0,transparent:true,opacity:.9})); mzM.visible=false; gunG.add(mzM);
const skinMat=new THREE.MeshStandardMaterial({color:0xf0b48a,roughness:.8}), sleeveMat=new THREE.MeshStandardMaterial({color:0x1d3557,roughness:.9});
let vmKey=null, vmSkin=null, vmMag=null, vmMag0=0, H={}, rl={on:false,t:0,d:1,id:0}, kick=0, swing=0, mzT=0, aimK=0, draw=1, holding=false, tAcc=0, worldGun=null;

function mkHand(p,side){
    const hm=C3M.make("hand"); if(hm){ if(side<0) hm.scale.x=-1; hm.position.set(...p); gunG.add(hm); return hm; }
    const h=new THREE.Group(), a=new THREE.Mesh(BX,skinMat), b=new THREE.Mesh(BX,sleeveMat);
    a.scale.set(.06,.07,.1); b.scale.set(.08,.08,.55); b.position.set(side*.012,-.03,.33); b.rotation.x=-.12;
    h.add(a,b); h.position.set(...p); gunG.add(h); return h;
}
function setVM(key,skinId){
    while(gunG.children.length>1) gunG.remove(gunG.children[1]);
    const sp=SPEC[key], m=build(key,skinId); gunG.add(m);
    vmMag=m.userData.mag||null; vmMag0=m.userData.mag0||0;
    H.r=mkHand(sp.rh,1); H.l=sp.lh?mkHand(sp.lh,-1):null; H.lb=sp.lh||null;
    if(sp.mz) mzM.position.set(...sp.mz);
    draw=1;
    if(worldGun) worldGun.parent&&worldGun.parent.remove(worldGun);
    worldGun=build(key,skinId); worldGun.scale.setScalar(1.5); worldGun.rotation.x=-Math.PI/2; { const ha=player.userData.limbs.armR.getObjectByName("hand_anchor"); worldGun.position.copy(ha?ha.position:new THREE.Vector3(0,-.48,0)); }
    player.userData.limbs.armR.add(worldGun);
}
const wName=document.createElement("div"); wName.id="wName"; document.body.appendChild(wName);

function vmUpdate(dt){
    const w=currentWeapon, key=wKey(w), skin=eq[key]||"std";
    if(key!==vmKey||skin!==vmSkin){ if(key!==vmKey&&rl.on){ rl.on=false; attackCooldown=0; } vmKey=key; vmSkin=skin; setVM(key,skin); }
    tAcc+=dt; draw=Math.max(0,draw-dt*4); kick*=Math.pow(.0005,dt); swing=Math.max(0,swing-dt*3.2); mzT-=dt;
    aimK+=((aiming?1:0)-aimK)*Math.min(1,dt*12);
    const scope=key==="sniper"&&aimK>.8;
    vm.visible=!thirdPerson&&!scope; $("scope").style.display=(scope&&!thirdPerson)?"block":"none";
    if(holding&&w.auto&&!rl.on) attack();
    const walking=!isMobile&&(keys.z||keys.w||keys.q||keys.a||keys.s||keys.d);
    vm.position.set(.17*(1-aimK*.95), -.24+.09*aimK-.35*draw*draw, -.45+.05*aimK);
    let rx=kick*.12, ry=0, rz=0, py=Math.sin(tAcc*1.6)*.002+(walking?Math.sin(tAcc*10)*.007:0), pz=kick*.06, px=walking?Math.cos(tAcc*5)*.005:0;
    if(w.type==="melee"){ const a=Math.sin(Math.PI*(1-swing))*(swing>0?1:0); rx-=1.0*a; ry-=.7*a; rz+=.9*a; pz-=.15*a; }
    let lx=0,ly=0,lz=0;
    if(rl.on){
        rl.t+=dt; const p=Math.min(1,rl.t/rl.d), tl=Math.sin(Math.PI*p);
        rx-=.35*tl; rz+=.75*tl; ry+=.25*tl; py-=.08*tl;
        if(vmMag){
            const dr=clamp((p-.28)/.15,0,1), up=clamp((p-.55)/.18,0,1);
            vmMag.visible=!(p>.43&&p<.55); vmMag.position.y=vmMag0-(p<.5?.3*dr:.3*(1-up));
        }
        if(H.l){
            const sp=SPEC[key], t=vmMag?[sp.mag[3],sp.mag[4]-.02,sp.mag[5]]:[sp.lh[0]+.03,sp.lh[1]+.02,sp.lh[2]-.05], b=Math.sin(Math.PI*clamp(p/.95,0,1));
            lx=(t[0]-H.lb[0])*b; ly=(t[1]-H.lb[1])*b-.1*Math.sin(Math.PI*clamp((p-.25)/.5,0,1)); lz=(t[2]-H.lb[2])*b;
        }
    } else if(vmMag){ vmMag.visible=true; vmMag.position.y=vmMag0; }
    gunG.rotation.set(rx,ry,rz); gunG.position.set(px,py,pz);
    if(H.l) H.l.position.set(H.lb[0]+lx,H.lb[1]+ly,H.lb[2]+lz);
    mzM.visible=mzT>0; if(mzM.visible) mzM.scale.setScalar(.03+Math.random()*.04);
    const lab=w.name+" | "+skinOf(skin).n+"  "+(w.ammo===Infinity?"∞":w.ammo+"/"+w.maxAmmo+(C3x.res?" · "+C3x.res(w):""))+(rl.on?"  ⟳":"");
    if(wName.textContent!==lab) wName.textContent=lab; wName.style.display="block";
}
window.C3x={fire(w){ kick=1; if(w.type==="melee") swing=1; else mzT=.05; }};

/* ---------- Rechargement, tir auto, zoom sniper ---------- */
let rid=0;
reload=function(){
    const w=currentWeapon; if(rl.on||w.ammo===Infinity||w.ammo>=w.maxAmmo) return;
    const id=++rid; rl={on:true,t:0,d:w.rt||1.5,id}; attackCooldown=rl.d; S.reload();
    setTimeout(()=>{ if(rl.on&&rl.id===id){ w.ammo=(C3x.fill?C3x.fill(w):w.maxAmmo); rl.on=false; attackCooldown=0; updateWeaponHUD(); } },rl.d*1000);
};
const _atk2=attack; attack=function(){ if(rl.on) return; _atk2(); };
const _sa=setAiming; setAiming=function(v){ _sa(v); if(v&&currentWeapon===weapons.sniper){ camera.fov=18; camera.updateProjectionMatrix(); } };
document.addEventListener("mousedown",e=>{ if(e.button===0) holding=true; });
document.addEventListener("mouseup",e=>{ if(e.button===0) holding=false; });

/* ---------- Correctif : visée qui reste bloquée ---------- */
if(!isMobile){
    const sync=e=>{ if(aiming&&!(e.buttons&2)) setAiming(false); if(holding&&!(e.buttons&1)) holding=false; };
    ["mousemove","mouseup","pointerup","pointermove","pointerdown"].forEach(t=>window.addEventListener(t,sync,true));
    window.addEventListener("blur",()=>{ setAiming(false); holding=false; });
    document.addEventListener("visibilitychange",()=>{ setAiming(false); holding=false; });
    document.addEventListener("pointerlockchange",()=>{ if(document.pointerLockElement!==renderer.domElement){ setAiming(false); holding=false; } });
}

/* ---------- Salon : décor ---------- */
let lob=null, lobKey="glock";
function decorate(){
    const grp=new THREE.Group(), bm=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}));
    const pod=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.9,.25,48),new THREE.MeshStandardMaterial({color:0x1b1f2a,metalness:.6,roughness:.4})); pod.position.y=-.115; pod.receiveShadow=true; grp.add(pod);
    const r1=new THREE.Mesh(new THREE.TorusGeometry(1.75,.05,8,64),bm(0xffb703)); r1.rotation.x=Math.PI/2; r1.position.y=.02; grp.add(r1);
    const r2=new THREE.Mesh(new THREE.TorusGeometry(2.4,.025,8,64),bm(0x38bdf8)); r2.rotation.x=Math.PI/2; r2.position.y=.02; grp.add(r2);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,9,32,1,true),bm(0xffb703,{transparent:true,opacity:.09,side:THREE.DoubleSide,depthWrite:false})); beam.position.y=4.5; grp.add(beam);
    const N=140, pos=new Float32Array(N*3);
    for(let i=0;i<N;i++){ const a=Math.random()*6.28, r=1+Math.random()*4.5; pos.set([Math.cos(a)*r,Math.random()*9,Math.sin(a)*r],i*3); }
    const pg=new THREE.BufferGeometry(); pg.setAttribute("position",new THREE.BufferAttribute(pos,3));
    const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xffd166,size:.09,transparent:true,opacity:.8,fog:false})); grp.add(pts);
    levelGroup.add(grp); lob={grp,r1,r2,pts};
    sky(0x131a35,false);
}
function sky(c,day){ scene.background.setHex(c); scene.fog.color.setHex(c); clouds.visible=day; }
const _bl=buildLobbyScene; buildLobbyScene=function(){ _bl(); decorate(); };
decorate();
const _sm2=startMode; startMode=function(k){ lob=null; sky(0x6aa9d8,true); rl.on=false; holding=false; _sm2(k); vmKey=null; };
const _gl2=goToLobby; goToLobby=function(){ _gl2(); wName.style.display="none"; $("scope").style.display="none"; vm.visible=false; rl.on=false; holding=false; };
function lobbyUpdate(dt){
    if(!lob) return; const t=performance.now()/1000;
    lob.r1.scale.setScalar(1+.03*Math.sin(t*3)); lob.r2.rotation.z=t*.3;
    const a=lob.pts.geometry.attributes.position; for(let i=0;i<a.count;i++){ let y=a.getY(i)+dt*.45; if(y>9) y=0; a.setY(i,y); } a.needsUpdate=true;
}

/* ---------- Boucle (avant addon 1 et le rendu) ---------- */
const clk=new THREE.Clock(), _r=renderer.render;
renderer.render=function(s,c){
    const dt=Math.min(clk.getDelta(),.05);
    if(!paused){
        if(state==="playing"&&!gameFinished) vmUpdate(dt);
        if(state==="playing"&&thirdPerson){
            player.rotation.y=cameraYaw+Math.PI; // vu de dos
            const L=player.userData.limbs; L.armR.rotation.x=-(Math.PI/2+cameraPitch*.9);
            if(SPEC[wKey(currentWeapon)].lh){ L.armL.rotation.x=-(Math.PI/2+cameraPitch*.9)+.1; L.armL.rotation.y=.4; }
        } else if(player.userData.limbs){ const L=player.userData.limbs; L.armL.rotation.y=0; if(state!=="playing"){ L.armR.rotation.x=0; L.armL.rotation.x=0; } }
        if(worldGun) worldGun.visible=(state==="playing"&&thirdPerson);
        if(state==="lobby") lobbyUpdate(dt);
    }
    _r.call(this,s,c);
};

/* ---------- Boutique style « item shop » ---------- */
const RAR={std:["COMMUN","#9ca3af","#374151"],for:["PEU COMMUN","#4ade80","#14532d"],oce:["RARE","#38bdf8","#0c4a6e"],gla:["RARE","#7dd3fc","#075985"],mag:["ÉPIQUE","#d8b4fe","#581c87"],spe:["ÉPIQUE","#e879f9","#701a75"],or:["LÉGENDAIRE","#fcd34d","#b45309"],c_com:["PEU COMMUN","#4ade80","#14532d"],c_nin:["RARE","#38bdf8","#0c4a6e"],c_rou:["ÉPIQUE","#d8b4fe","#581c87"],c_gla:["RARE","#7dd3fc","#075985"],c_neo:["ÉPIQUE","#e879f9","#701a75"],c_gal:["ÉPIQUE","#a78bfa","#4c1d95"],c_or:["LÉGENDAIRE","#fcd34d","#b45309"]};
const nm=k=>k==="char"?"Personnage":weapons[k].name, skl=k=>k==="char"?CSK:SKINS;
const sh=document.createElement("div"); sh.id="shop";
sh.innerHTML=`<div class="shTop"><div class="shTitle">BOUTIQUE</div><div class="shTimer" id="shTimer"></div><div class="hudPanel" style="margin:0">🪙 <span id="shCoinsN">0</span></div><button class="actionBtn secondary" id="shClose" style="min-width:90px;padding:10px 16px">← Salon</button></div>
<div class="shBody"><div class="shStage"><canvas id="shCv" width="440" height="300"></canvas><div id="shName"></div><div id="shSub"></div><button class="actionBtn" id="shBuy" style="width:100%"></button></div>
<div class="shRight"><div class="shSec">À LA UNE</div><div id="shFeat"></div><div class="shSec">ARMES</div><div id="shTabs"></div><div id="shGrid"></div></div></div>`;
document.body.appendChild(sh);
const pr=new THREE.WebGLRenderer({canvas:$("shCv"),antialias:false,alpha:true}); pr.setSize(440,300,false);
const ps=new THREE.Scene(), pcam=new THREE.PerspectiveCamera(30,440/300,.1,20); pcam.position.set(0,.15,3.4); pcam.lookAt(0,0,0);
ps.add(new THREE.HemisphereLight(0xffffff,0x445566,2.2)); const dl=new THREE.DirectionalLight(0xffffff,3); dl.position.set(2,3,4); ps.add(dl);
const stage=new THREE.Group(); ps.add(stage); let cur=null, shKey="glock", shSkin="std", shOn=false, spin=0, tmr=null;
function showModel(key,skin){
    if(cur) stage.remove(cur);
    const m=build(key,skin), box=new THREE.Box3().setFromObject(m), ctr=box.getCenter(new V()), sz=box.getSize(new V());
    m.position.sub(ctr); cur=new THREE.Group(); cur.add(m); cur.scale.setScalar(1.55/Math.max(sz.x,sz.y,sz.z)); stage.add(cur);
}
const TH={};
function thumb(key,skin){
    const id=key+":"+skin; if(TH[id]) return TH[id];
    showModel(key,skin); stage.rotation.y=key==="char"?.45:-Math.PI/2+.55; pr.render(ps,pcam);
    const c=document.createElement("canvas"); c.width=330; c.height=225; c.getContext("2d").drawImage(pr.domElement,0,0,330,225);
    return TH[id]=c.toDataURL();
}
function daily(){
    let seed=(Math.floor(Tm.now()/864e5)*2654435761)%2147483647||1; const rnd=()=>(seed=seed*48271%2147483647)/2147483647, all=[], out=[];
    weaponOrder.forEach(k=>SKINS.slice(1).forEach(s=>all.push([k,s.id])));
    while(out.length<3) out.push(all.splice(Math.floor(rnd()*all.length),1)[0]);
    return out;
}
let FEAT=daily();
const isFeat=(k,s)=>FEAT.some(a=>a[0]===k&&a[1]===s);
const price=(k,s)=>Math.round(skinOf(s).p*(isFeat(k,s)?.8:1));
const status=(k,s)=>owned(k,s)?((eq[k]||"std")===s?"✓ ÉQUIPÉ":"POSSÉDÉ"):"🪙 "+price(k,s)+(isFeat(k,s)?"<i>-20%</i>":"");
function mkCard(k,s){
    const r=RAR[s], c=document.createElement("div"); c.className="skCard"; c.dataset.k=k; c.dataset.s=s;
    c.style.background="linear-gradient(165deg,"+r[1]+"55,"+r[2]+")"; c.style.borderColor=r[1];
    c.innerHTML=`<div class="skR" style="color:${r[1]}">${r[0]}</div><img src="${thumb(k,s)}"><div class="skB"><div class="skN">${nm(k)} | ${(k==="char"?charSk(s):skinOf(s)).n}</div><div class="skS"></div></div>`;
    c.onclick=()=>{ if(k!==shKey){ shKey=k; buildTabs(); buildGrid(); } shSkin=s; showModel(shKey,shSkin); refreshShop(); };
    return c;
}
function refreshShop(){
    const s=shKey==="char"?charSk(shSkin):skinOf(shSkin), isEq=(eq[shKey]||"std")===shSkin, b=$("shBuy"), p=price(shKey,shSkin);
    $("shCoinsN").textContent=coins; $("lobbyCoinsCount").textContent=coins;
    $("shName").textContent=nm(shKey)+" | "+s.n; $("shSub").textContent=RAR[shSkin][0]+(owned(shKey,shSkin)?" · "+(isEq?"Équipé":"Possédé"):" · "+p+" 🪙");
    if(owned(shKey,shSkin)){ if(window.SHOPMODE==="locker"){ b.textContent=isEq?"✓ ÉQUIPÉ":"ÉQUIPER"; b.disabled=isEq; } else { b.textContent="✓ POSSÉDÉ — équipe-le au vestiaire"; b.disabled=true; } } else { b.textContent="ACHETER — "+p+" 🪙"; b.disabled=coins<p; }
    b.style.opacity=b.disabled?.55:1;
    sh.querySelectorAll(".skCard").forEach(c=>{ c.classList.toggle("sel",c.dataset.k===shKey&&c.dataset.s===shSkin); c.querySelector(".skS").innerHTML=status(c.dataset.k,c.dataset.s); });
}
function buildGrid(){
    const g=$("shGrid"); g.innerHTML=""; skl(shKey).forEach(s=>{ if(window.SHOPMODE==="locker"&&!owned(shKey,s.id)) return; g.appendChild(mkCard(shKey,s.id)); }); showModel(shKey,shSkin);
}
function buildFeat(){ const f=$("shFeat"); f.innerHTML=""; const sec=f.parentNode.querySelector(".shSec"); if(window.SHOPMODE==="locker"){ sec.style.display="none"; f.style.display="none"; return; } sec.style.display=""; f.style.display=""; FEAT.forEach(a=>f.appendChild(mkCard(a[0],a[1]))); }
function buildTabs(){
    const t=$("shTabs"); t.innerHTML="";
    [...weaponOrder,"char"].forEach(k=>{ const b=document.createElement("button"); b.textContent=nm(k); b.className=k===shKey?"on":"";
        b.onclick=()=>{ shKey=k; shSkin=eq[k]||"std"; buildTabs(); buildGrid(); refreshShop(); }; t.appendChild(b); });
}
$("shBuy").onclick=()=>{
    const p=price(shKey,shSkin), lock=window.SHOPMODE==="locker";
    if(!owned(shKey,shSkin)){ if(lock||coins<p) return; addCoins(-p); own.add(shKey+":"+shSkin); S.power(); saveSk(); refreshShop(); return; }
    if(!lock) return;
    eq[shKey]=shSkin; saveSk(); refreshShop(); if(shKey==="char"&&window.applyChar) applyChar();
};
function tick(){ const n=new Date(Tm.now()), e=new Date(n); e.setUTCHours(24,0,0,0); const d=Math.floor((e-n)/1000), p=x=>String(x).padStart(2,"0"); $("shTimer").textContent=(Tm.ok?"🕒 Heure serveur · ":"")+"Renouvellement dans "+p(Math.floor(d/3600))+":"+p(Math.floor(d%3600/60))+":"+p(d%60); }
function shopLoop(){ if(!shOn) return; requestAnimationFrame(shopLoop); spin+=.012; stage.rotation.y=shKey==="char"?spin*.6:-Math.PI/2+.4+Math.sin(spin)*.9; pr.render(ps,pcam); }
function openShop(){
    ac(); shOn=true; FEAT=daily(); sh.style.display="flex"; shSkin=eq[shKey]||"std"; sh.querySelector(".shTitle").textContent=window.SHOPMODE==="locker"?"VESTIAIRE":"BOUTIQUE";
    buildTabs(); buildFeat(); buildGrid(); refreshShop(); tick(); tmr=setInterval(tick,1000); shopLoop();
}
$("shClose").onclick=()=>{ shOn=false; sh.style.display="none"; clearInterval(tmr); };
C3x.char=()=>charSk(eq.char||"std"); C3x.build=build; C3x.two=k=>!!SPEC[k].lh;
const sc=document.createElement("div"); sc.id="scope"; document.body.appendChild(sc);

/* ---------- Salon style Fortnite : barre en haut + modes + gros bouton JOUER ---------- */
const lb=$("lobby"), bar=document.createElement("div"); bar.id="lbBar";
bar.innerHTML='<div class="lbLogo">COMBAT <b>3D</b></div><div class="lbTabs"><button class="on">JOUER</button><button id="tbShop">BOUTIQUE</button></div><div id="lbRight"></div>';
lb.insertBefore(bar,lb.firstChild); $("lbRight").appendChild($("lobbyCoins")); window.openShop=openShop; window.SHOPMODE="shop"; $("tbShop").onclick=()=>{ window.SHOPMODE="shop"; openShop(); };
const mc=$("modeCards"); mc.innerHTML=""; let selMode=Object.keys(MODES)[0];
const lbl=document.createElement("div"); lbl.id="modeLbl";
const setLbl=()=>{ lbl.textContent="MODE : "+MODES[selMode].label.toUpperCase(); };
Object.keys(MODES).forEach(k=>{
    const m=MODES[k], t=document.createElement("div"); t.className="tile"+(k===selMode?" on":""); t.dataset.k=k;
    t.innerHTML='<span class="icon">'+m.icon+'</span><div><div class="name">'+m.label+'</div><div class="desc">'+m.desc+'</div></div>';
    t.onclick=()=>{ selMode=k; [...mc.children].forEach(c=>c.classList.toggle("on",c.dataset.k===k)); setLbl(); ac(); S.click(); };
    t.ondblclick=()=>startMode(k); mc.appendChild(t);
});
const pb=document.createElement("button"); pb.id="playBtn"; pb.textContent="JOUER"; pb.onclick=()=>startMode(selMode);
lb.appendChild(lbl); lb.appendChild(pb); setLbl();
})();

/* ===== jeu-04 ===== */
/* ===== COMBAT 3D — GEMMES, MOLETTE, PNJ, BALLES, NETTOYAGE DU SALON ===== */
(()=>{
const {S,burst,ring}=C3, $=id=>document.getElementById(id), V=THREE.Vector3;

/* ---------- Gemmes : effets, inventaire de soin ---------- */
const FXT=[
 {l:"Soin",c:0x22c55e,css:"#22c55e"},
 {l:"⚡ Vitesse ×1.6",c:0x3b82f6,css:"#3b82f6",d:6},
 {l:"🔥 Cadence ×2.5",c:0xeab308,css:"#eab308",d:6}
];
const eff={}; let heals=0, sig="";
const fxP=document.createElement("div"); fxP.id="fxPanel"; document.body.appendChild(fxP);
const pk=document.createElement("div"); pk.id="pkFlash"; document.body.appendChild(pk);
function floatText(t,col){
    const e=document.createElement("div"); e.className="dn big"; e.textContent=t; e.style.color=col;
    document.body.appendChild(e); setTimeout(()=>e.remove(),900);
}
function flash(css){ pk.style.setProperty("--c",css); pk.classList.remove("on"); void pk.offsetWidth; pk.classList.add("on"); }

const heal=document.createElement("div"); heal.id="healSlot"; heal.className="slot dim";
heal.innerHTML='<svg viewBox="0 0 24 24" fill="#22c55e" stroke="#bbf7d0" stroke-width="1.5"><path d="M12 2l7 7-7 13L5 9z"/></svg><i class="key">H</i><span class="badge" id="healN" style="color:#86efac">0</span>';
hotbarEl.appendChild(heal);
let hm=null; if(isMobile){ hm=document.createElement("div"); hm.id="btnHealM"; hm.innerHTML=heal.innerHTML; document.body.appendChild(hm); }
function renderHeal(){ $("healN").textContent=heals; heal.classList.toggle("dim",heals===0); if(hm){ hm.querySelector(".badge").textContent=heals; hm.style.opacity=heals?1:.45; } }
function useHeal(){
    if(state!=="playing"||paused||gameFinished) return;
    if(heals<=0||playerHP>=100){ heal.classList.remove("bad"); void heal.offsetWidth; heal.classList.add("bad"); S.click(); return; }
    heals--; playerHP=Math.min(100,playerHP+25); updatePlayerBar(); renderHeal();
    S.power(); ring(player.position,2,0x22c55e,.6); burst(player.position.clone().setY(player.position.y+.3),0x86efac,26,3,.12,.9,-4);
    floatText("+25 PV","#4ade80"); flash("#22c55e");
}
heal.addEventListener("click",useHeal); if(hm) hm.addEventListener("touchstart",e=>{ e.preventDefault(); useHeal(); });
document.addEventListener("keydown",e=>{ if(e.key.toLowerCase()==="h"&&!e.repeat) useHeal(); });

updatePowerups=function(dt){
    for(let i=activePowerups.length-1;i>=0;i--){
        const p=activePowerups[i], ty=p.userData.type, T=FXT[ty];
        p.rotation.y+=dt*2; p.position.y=getGroundHeight(p.position.x,p.position.z)+1+Math.sin(Date.now()*.003)*.2;
        if(!p.userData.fx){
            p.userData.fx=1;
            const b=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,6,12,1,true),new THREE.MeshBasicMaterial({color:T.c,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide}));
            b.position.y=2; p.add(b);
        }
        if(Math.random()<dt*9) burst(p.position.clone().add(new V(Math.random()-.5,Math.random()-.5,Math.random()-.5)),T.c,1,.6,.08,.9,-1.5);
        if(p.position.distanceTo(player.position)<1.8){
            if(ty===0&&heals>=3) continue;
            if(ty===0){ heals++; renderHeal(); floatText("Gemme de soin +1  (H)",T.css); }
            else{ eff[ty]={t:T.d,max:T.d}; floatText(T.l+" · "+T.d+"s",T.css); }
            if(window.G&&G.ev) G.ev("gem"); S.power(); ring(p.position,2.6,T.c,.6); ring(player.position,1.2,0xffffff,.4);
            burst(p.position,T.c,30,6,.13,.8,-3); burst(p.position,0xffffff,10,8,.07,.5,2); flash(T.css);
            levelGroup.remove(p); activePowerups.splice(i,1);
        }
    }
};
function renderFx(){
    const ks=Object.keys(eff).join(",");
    if(ks!==sig){ sig=ks; fxP.innerHTML=ks?ks.split(",").map(k=>'<div class="fxChip" data-k="'+k+'" style="--c:'+FXT[k].css+'"><span>'+FXT[k].l+'</span><b></b><u></u></div>').join(""):""; }
    fxP.style.display=ks?"flex":"none";
    fxP.querySelectorAll(".fxChip").forEach(c=>{ const e=eff[c.dataset.k]; c.querySelector("b").textContent=e.t.toFixed(1)+"s"; c.querySelector("u").style.width=(e.t/e.max*100)+"%"; });
}

/* ---------- Molette : changer d'arme ---------- */
let wheelT=0;
document.addEventListener("wheel",e=>{
    if(isMobile||state!=="playing"||paused||gameFinished||document.pointerLockElement!==renderer.domElement) return;
    e.preventDefault(); const n=performance.now(); if(n-wheelT<110) return; wheelT=n;
    const k=Object.keys(weapons).find(x=>weapons[x]===currentWeapon), L=weaponOrder.length;
    let j=weaponOrder.indexOf(k), sg=e.deltaY>0?1:-1; for(let q=0;q<L;q++){ j=(j+sg+L)%L; if(!window.G||!G.ok||G.ok(weaponOrder[j])) break; } currentWeapon=weapons[weaponOrder[j]]; updateWeaponHUD(); S.click();
},{passive:false});

/* ---------- Collisions des balles (immeubles, bosses du terrain, barrière invisible) ---------- */
function ptBlocked(x,y,z,r){
    const m=MODES[currentModeKey];
    if(m&&m.boundary&&(Math.abs(x)>m.boundary+.5||Math.abs(z)>m.boundary+.5)) return true;
    if(y<getGroundHeight(x,z)) return true;
    for(const o of obstacles){
        if(y>getGroundHeight(o.x,o.z)+(o.h||99)+.1) continue;
        const cx=Math.max(o.x-o.width/2,Math.min(x,o.x+o.width/2)), cz=Math.max(o.z-o.depth/2,Math.min(z,o.z+o.depth/2));
        if((x-cx)**2+(z-cz)**2<r*r) return true;
    }
    return false;
}
function segBlocked(a,b,r,skip=0){
    const d=a.distanceTo(b), n=Math.max(1,Math.ceil(d/.3)), end=skip>0&&d>skip?1-skip/d:1;
    for(let i=1;i<=n;i++){ const t=i/n; if(t>end) break; if(ptBlocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t,r)) return true; }
    return false;
}
const _gt=getTargetUnderCrosshair;
getTargetUnderCrosshair=function(){
    const e=_gt(); if(!e) return e;
    const o=raycaster.ray.origin.clone(), t=e.position.clone(); t.y+=1.1*e.scale.y;
    return segBlocked(o,t,.08,.7)?null:e;
};
function checkBullets(g,r,dt){
    for(const p of g.children.slice()){
        const u=p.userData, prev=u.pp||(u.pp=p.position.clone().addScaledVector(u.velocity,-dt));
        if(segBlocked(prev,p.position,r)){ burst(p.position,0xffe08a,5,4,.06,.3); burst(p.position,0x8a8f98,3,2,.08,.4); g.remove(p); }
        else prev.copy(p.position);
    }
}

/* ---------- PNJ : ne marchent plus dans les murs ---------- */
function lineFree(ax,az,bx,bz,r){
    const d=Math.hypot(bx-ax,bz-az), n=Math.ceil(d/.7);
    for(let i=1;i<=n;i++){ const t=i/n; if(collidesWithBuilding(ax+(bx-ax)*t,az+(bz-az)*t,r)) return false; }
    return true;
}
const bnd=()=>((MODES[currentModeKey]||{}).boundary||40)-2;
function pickTarget(e){
    const b=bnd();
    for(let k=0;k<14;k++){
        const a=Math.random()*6.283, r=6+Math.random()*8, px=e.position.x+Math.cos(a)*r, pz=e.position.z+Math.sin(a)*r;
        if(Math.abs(px)>b||Math.abs(pz)>b||collidesWithBuilding(px,pz,1.4)||!lineFree(e.position.x,e.position.z,px,pz,.85)) continue;
        return new V(px,getGroundHeight(px,pz),pz);
    }
    return null;
}
function fixNpc(e,dt){
    const u=e.userData, st=u._st||(u._st={x:e.position.x,z:e.position.z,t:0,c:0});
    const moved=Math.hypot(e.position.x-st.x,e.position.z-st.z); st.x=e.position.x; st.z=e.position.z;
    const pt=u.patrolTarget;
    if(!pt){ st.t=0; return; }
    st.c-=dt;
    if(st.c<=0){ st.c=.3; if(Math.abs(pt.x)>bnd()||Math.abs(pt.z)>bnd()||!lineFree(e.position.x,e.position.z,pt.x,pt.z,.85)){ u.patrolTarget=pickTarget(e); st.t=0; return; } }
    if(moved<.5*dt) st.t+=dt; else st.t=0;      // vitesse neutre : on change de trajectoire
    if(st.t>.25){ u.patrolTarget=pickTarget(e); st.t=0; }
}

/* ---------- Boucle ---------- */
function frame(dt){
    let ch=false; for(const k in eff){ eff[k].t-=dt; if(eff[k].t<=0){ delete eff[k]; ch=true; } }
    speedMult=(eff[1]?1.6:1)*(window.G&&G.mv||1); attackSpeedMult=eff[2]?.4:1;
    renderFx(); if(hm) hm.style.display="flex";
    for(const e of enemies) if(e.userData.alive&&!e.userData.boss) fixNpc(e,dt);
    checkBullets(projectiles,.2,dt); checkBullets(enemyProjectiles,.15,dt);
}
const clk=new THREE.Clock(), _r=renderer.render;
renderer.render=function(s,c){
    const dt=Math.min(clk.getDelta(),.05);
    if(!paused){
        if(state==="playing"&&!gameFinished) frame(dt);
        else if(state!=="playing"&&(aiming||camera.fov!==BASE_FOV)) setAiming(false);
    }
    _r.call(this,s,c);
};

/* ---------- Nettoyage : rien ne reste dans le salon ---------- */
function clean(){
    heals=0; for(const k in eff) delete eff[k]; speedMult=1; attackSpeedMult=1; sig=""; renderHeal(); fxP.style.display="none"; if(hm) hm.style.display="none";
    setAiming(false); camera.fov=BASE_FOV; camera.updateProjectionMatrix(); C3.reset();
    $("damageFlash").classList.remove("active"); pk.classList.remove("on");
    const cr=$("crosshair"); ["shoot","aiming","hit","kill"].forEach(c=>cr.classList.remove(c));
}
const _sm3=startMode; startMode=function(k){ clean(); _sm3(k); };
const _gl3=goToLobby; goToLobby=function(){ _gl3(); clean(); };
const _eg3=endGame; endGame=function(w){ _eg3(w); setAiming(false); };
renderHeal();
window.C3.pt=ptBlocked; window.C3.seg=segBlocked; window.C3.setHeals=n=>{ heals=Math.min(3,n); renderHeal(); };
})();

/* ===== jeu-05 ===== */
/* ===== COMBAT 3D — MONDE, COFFRES, SPRINT, CAMÉRA, BOSS ===== */
(()=>{
const V=THREE.Vector3, $=id=>document.getElementById(id), C=window.C3, S=C.S, burst=C.burst, ring=C.ring;
const BXG=new THREE.BoxGeometry(1,1,1), rnd=(a,b)=>a+Math.random()*(b-a), wk=w=>Object.keys(weapons).find(k=>weapons[k]===w);
const mk=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85},o||{}));
const G=window.G={adm:Object.assign({god:false,inf:false,all:false,stam:false,spd:1,dmg:1,ehp:1,take:1,heals:0},JSON.parse(localStorage.getItem("c3d_admin")||"{}")),stats:{},mv:1};
const ev=(t,k,n)=>{ if(G.ev) G.ev(t,k,n); };
const kd=typeof keys!=="undefined"?keys:{};



/* ---------- Soin réduit : tirage des gemmes ---------- */
window.pickPU=()=>{ if(G.forceHeal) return 0; const r=Math.random(); return r<.18?0:r<.6?1:2; };

/* ---------- Bâtiments explorables ---------- */
const BLD=[];
function corner(bd,sg){
    const dv={N:[0,1],S:[0,-1],W:[1,0],E:[-1,0]}[bd.door], sv=[-dv[1],dv[0]], hx=bd.w/2-.4, hz=bd.d/2-.4;
    const eb=Math.abs(dv[0])*hx+Math.abs(dv[1])*hz, es=Math.abs(sv[0])*hx+Math.abs(sv[1])*hz;
    return {x:bd.x+dv[0]*(eb-.9)+sv[0]*sg*(es-1.2), z:bd.z+dv[1]*(eb-.9)+sv[1]*sg*(es-1.2), dv};
}
/* ---------- Armes progressives, munitions, coffres ---------- */
const BASE={}; for(const k in weapons) BASE[k]={d:weapons[k].damage,m:weapons[k].maxAmmo};
let unl=new Set(["glock"]), reserve={}, lvl={}, lastOk="glock", nOpen=0, lw=1; const chests=[];
function slots(){ weaponOrder.forEach(k=>{ slotEls[k].style.display=unl.has(k)?"":"none"; }); updateWeaponHUD(); }
window.nextW=idx=>{ for(let i=1;i<=weaponOrder.length;i++){ const j=(idx+i)%weaponOrder.length; if(unl.has(weaponOrder[j])) return j; } return idx; };
G.ok=k=>unl.has(k);
C3x.res=w=>{ const k=wk(w); return reserve[k]||0; };
C3x.fill=w=>{ const k=wk(w), need=w.maxAmmo-w.ammo, t=G.adm.inf?need:Math.min(need,reserve[k]||0); if(!G.adm.inf) reserve[k]-=t; return w.ammo+t; };
const _rl=reload;
reload=function(){ const w=currentWeapon; if(w.ammo===Infinity||w.ammo>=w.maxAmmo) return; if(!G.adm.inf&&(reserve[wk(w)]||0)<=0){ announce("Plus de munitions !","#fca5a5"); S.click(); return; } _rl(); };
const _f=C3x.fire; C3x.fire=function(w){ _f(w); if(w.type==="gun") G.stats.shots++; };

function runStart(){
    for(const k in weapons){ weapons[k].damage=BASE[k].d; if(BASE[k].m) weapons[k].maxAmmo=BASE[k].m; }
    unl=new Set(G.adm.all?weaponOrder:["glock"]); reserve={}; lvl={}; nOpen=0; lastOk="glock"; lw=1; chests.length=0; BLD.length=0; bfx.length=0; lavaM=null; phase=1; fightT=0; pend=null;
    weaponOrder.forEach(k=>{ reserve[k]=G.adm.all&&BASE[k].m?BASE[k].m*2:0; });
    G.stats={t:0,kills:0,shots:0,hits:0,dmg:0,chests:0,gems:0,waveT:[],lw:0,sprintT:0};
    stam=100; exh=false; slots();
}
function mkChest(x,z){
    const {g,lid,beam}=C3M.chest(); g.position.set(x,getGroundHeight(x,z),z); g.rotation.y=Math.round(rnd(0,3))*Math.PI/2; levelGroup.add(g);
    obstacles.push({x,z,width:1.1,depth:1.1,h:.65}); chests.push({g,lid,beam,x,z,open:false,lt:0});
}
function spawnChests(n,inner=true){
    if(inner&&currentModeKey!=="ville") BLD.forEach(bd=>{ if(chests.length<13){ const c=corner(bd,-1); mkChest(c.x,c.z); } });
    const b=MODES[currentModeKey].boundary-3; let t=0;
    while(n>0&&t++<300){ const x=rnd(-b,b), z=rnd(-b,b); if(collidesWithBuilding(x,z,1.8)||Math.hypot(x-player.position.x,z-player.position.z)<7) continue; mkChest(x,z); n--; }
}
G.spawnChests=spawnChests; const loot=document.createElement("div"); loot.id="loot"; document.body.appendChild(loot);
const ann=document.createElement("div"); ann.id="ann"; document.body.appendChild(ann);
const cp=document.createElement("div"); cp.id="chestPrompt"; cp.textContent="E — Ouvrir le coffre"; document.body.appendChild(cp);
function announce(t,c){ ann.textContent=t; ann.style.color=c||"#fff"; ann.classList.remove("on"); void ann.offsetWidth; ann.classList.add("on"); }
function banner(h,t,c){ loot.innerHTML='<small>'+h+'</small><b style="color:'+c+'">'+t+'</b>'; loot.classList.remove("on"); void loot.offsetWidth; loot.classList.add("on"); }
function openChest(c){
    if(c.open||state!=="playing"||paused||gameFinished) return; c.open=true; nOpen++; G.stats.chests++; ev("chest"); c.g.remove(c.beam);
    const p=new V(c.x,c.g.position.y+.6,c.z); S.power(); ring(p,2.4,0xfbbf24,.6); burst(p,0xfbbf24,40,6,.12,.9,-2); burst(p,0xffffff,12,8,.07,.5,2); C.shake(.12);
    const locked=weaponOrder.filter(k=>!unl.has(k)), up=[...unl].filter(k=>(lvl[k]||0)<3), r=Math.random();
    if(locked.length&&(nOpen<=3?r<.75:r<.42)){
        const k=locked[Math.floor(Math.random()*locked.length)]; unl.add(k); const w=weapons[k]; if(w.maxAmmo){ w.ammo=w.maxAmmo; reserve[k]=w.maxAmmo; } slots();
        banner("NOUVELLE ARME",w.name,"#ffd166"); S.wave();
    } else if(r<.74||!up.length){
        weaponOrder.forEach(k=>{ const w=weapons[k]; if(unl.has(k)&&w.maxAmmo) reserve[k]=Math.min((reserve[k]||0)+Math.ceil(w.maxAmmo*1.5),w.maxAmmo*6); });
        banner("MUNITIONS","Toutes tes armes à feu","#7dd3fc");
    } else {
        const k=up[Math.floor(Math.random()*up.length)], w=weapons[k]; lvl[k]=(lvl[k]||0)+1;
        w.damage=Math.round(BASE[k].d*(1+.18*lvl[k])); if(BASE[k].m){ w.maxAmmo=Math.round(BASE[k].m*(1+.25*lvl[k])); w.ammo=w.maxAmmo; }
        updateWeaponHUD(); banner("AMÉLIORATION",w.name+" · niveau "+lvl[k],"#c084fc");
    }
    const n=3+Math.floor(Math.random()*10); addCoins(n);
}
document.addEventListener("keydown",e=>{ if(e.key.toLowerCase()==="e"&&!e.repeat&&G.near) openChest(G.near); });

/* ---------- Sprint (jauge) + accroupi ---------- */
const held={}; addEventListener("keydown",e=>{ held[e.code]=true; }); addEventListener("keyup",e=>{ held[e.code]=false; }); addEventListener("blur",()=>{ for(const k in held) held[k]=false; });
const sb=document.createElement("div"); sb.id="stam"; sb.innerHTML="<i></i>"; document.body.appendChild(sb);
let stam=100, exh=false, stD=0, crK=0;
function moveState(dt){
    const walking=!isMobile&&(kd.z||kd.w||kd.q||kd.a||kd.s||kd.d||kd.arrowup||kd.arrowdown), crouch=!!(held.KeyC||held.ControlLeft||held.ControlRight);
    const sprint=!!((held.ShiftLeft||held.ShiftRight)&&walking&&!crouch&&!exh&&stam>0);
    if(sprint){ if(!G.adm.stam) stam=Math.max(0,stam-24*dt); stD=.9; G.stats.sprintT+=dt; ev("sprint",null,dt); if(stam<=0) exh=true; }
    else { stD-=dt; if(stD<=0) stam=Math.min(100,stam+(exh?14:22)*dt); if(exh&&stam>=35) exh=false; }
    crK+=((crouch?1:0)-crK)*Math.min(1,dt*10);
    G.mv=G.adm.spd*(sprint?1.6:1)*(crouch?.5:1)*(window.MP&&(MP.dead||MP.over)?0:1);
    const i=sb.firstChild; i.style.width=stam+"%"; i.style.background=exh?"#ef4444":(stam<35?"#f59e0b":"#22d3ee"); sb.style.opacity=(stam>=100&&!sprint)?.0:1; sb.style.display="block";
}

/* ---------- Caméra 3e personne corrigée (derrière le joueur, mêmes contrôles qu'en 1re personne) ---------- */
function tpCam(){
    const yaw=cameraYaw, pit=cameraPitch, cp=Math.cos(pit);
    const f=new V(-Math.sin(yaw)*cp,Math.sin(pit),-Math.cos(yaw)*cp), r=new V(Math.cos(yaw),0,-Math.sin(yaw));
    const eye=new V(player.position.x,player.position.y+PLAYER_EYE_HEIGHT-.7*crK,player.position.z);
    const want=eye.clone().addScaledVector(f,-3.8).addScaledVector(r,.55); want.y+=.35;
    let t=1; for(let i=1;i<=14;i++){ const p=eye.clone().lerp(want,i/14); if(C.pt(p.x,p.y,p.z,.3)){ t=(i-1)/14; break; } }
    camera.position.copy(eye.clone().lerp(want,Math.max(.1,t))); camera.rotation.set(pit,yaw,0,"YXZ"); camera.up.set(0,1,0);
    player.rotation.y=yaw+Math.PI; player.visible=true;
}

/* ---------- Départ sans clic, pause avec Échap ---------- */
const _rg=resumeGame; resumeGame=function(){ _rg(); if(!isMobile&&state==="playing") try{ renderer.domElement.requestPointerLock(); }catch(e){} };
document.addEventListener("pointerlockchange",()=>{
    if(isMobile) return;
    if(document.pointerLockElement!==renderer.domElement&&state==="playing"&&!paused&&!gameFinished&&!(window.MP&&(MP.dead||MP.over))) pauseGame();
});

/* ---------- Mode boss : arène, phases, attaques visibles ---------- */
const bfx=[]; let phase=1, fightT=0, pend=null, lavaM=null, lavaR=14.6, lavaT=0, bsT=5, furie=false, healT=10;
function arena(){
    scene.background.setHex(0x1a0710); scene.fog.color.setHex(0x1a0710); C.clouds.visible=false;
    const bm=o=>new THREE.MeshBasicMaterial(Object.assign({side:THREE.DoubleSide,transparent:true},o));
    const add=m=>{ levelGroup.add(m); return m; };
    const r1=add(new THREE.Mesh(new THREE.RingGeometry(12.6,14.4,72),bm({color:0xff3b1f,opacity:.85}))); r1.rotation.x=-Math.PI/2; r1.position.y=.04;
    const r2=add(new THREE.Mesh(new THREE.RingGeometry(5.6,6,64),bm({color:0xff7a00,opacity:.5}))); r2.rotation.x=-Math.PI/2; r2.position.y=.04;
    for(let i=0;i<3;i++){ const b=add(new THREE.Mesh(BXG,bm({color:0xff3b1f,opacity:.3}))); b.scale.set(.25,.02,26); b.position.y=.035; b.rotation.y=i*Math.PI/3; }
    for(let i=0;i<6;i++){
        const a=i*Math.PI/3+Math.PI/6, x=Math.cos(a)*9.5, z=Math.sin(a)*9.5, p=new THREE.Group();
        p.add(C3M.prop("pillar"));
        p.position.set(x,getGroundHeight(x,z),z); add(p); obstacles.push({x,z,width:1.9,depth:1.9,h:6});
    }
    for(let i=0;i<8;i++){ const a=i*Math.PI/4, f=C3M.prop("brazier"); f.position.set(Math.cos(a)*14,0,Math.sin(a)*14); add(f); }
}
function shock(pos,max,sp,dmg){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.8,64,1,true),new THREE.MeshBasicMaterial({color:0xff5a1f,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));
    m.position.set(pos.x,getGroundHeight(pos.x,pos.z)+.4,pos.z); m.scale.set(.1,1,.1); levelGroup.add(m);
    ring(pos,max,0xff5a1f,max/sp); bfx.push({k:"shock",m,r:.1,sp,max,dmg,hit:false,x:pos.x,z:pos.z}); S.slam(pos); C.shake(.4);
}
function lasers(){
    const n=phase+1, base=Math.random()*6.28, ws=Math.random()<.5?1:-1;
    for(let i=0;i<n;i++){ const m=new THREE.Mesh(BXG,new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.35,depthWrite:false})); m.scale.set(17,.06,.12); levelGroup.add(m); bfx.push({k:"laser",m,a:base+i*6.2832/n,t:0,ws,tick:0}); }
}
function meteors(){
    const n=5+phase*2;
    for(let i=0;i<n;i++){
        let tx=i%2?player.position.x+rnd(-5,5):rnd(-11,11), tz=i%2?player.position.z+rnd(-5,5):rnd(-11,11);
        const d=Math.hypot(tx,tz); if(d>13){ tx*=13/d; tz*=13/d; }
        bfx.push({k:"met",tx,tz,t:-i*.28,dur:1.5,disc:null,ball:null});
    }
}
function special(boss){
    const opts=[["ONDE DE CHOC — SAUTE !","#ff7a3d",()=>shock(boss.position,17,9,24)],["PLUIE DE MÉTÉORES !","#ffaa33",meteors]];
    if(phase>=2) opts.push(["LASERS — SAUTE ET ESQUIVE !","#ff5555",lasers]);
    const o=opts[Math.floor(Math.random()*opts.length)]; announce(o[0],o[1]); pend={t:1.1,fn:o[2]};
}
function bossFrame(dt){
    const boss=enemies.find(e=>e.userData.boss&&e.userData.alive); if(!boss) return;
    const u=boss.userData, hp=u.hp/u.maxHP, ph=hp>.66?1:hp>.33?2:3, px=player.position.x, pz=player.position.z, gy=getGroundHeight(px,pz), low=player.position.y<gy+1;
    fightT+=dt;
    if(ph!==phase){
        phase=ph; announce("PHASE "+ph+" — LE BOSS S'ENRAGE !","#ff4d4d"); shock(boss.position,16,10,18); C.shake(.7);
        G.forceHeal=true; spawnPowerup(px+rnd(-3,3),pz+rnd(-3,3)); G.forceHeal=false; banner("SOIN","Une gemme verte est apparue !","#4ade80");
    }
    if(u.bState==="chase"){
        u.bCooldown=Math.min(u.bCooldown,1.3/phase);
        const dx=px-boss.position.x, dz=pz-boss.position.z, d=Math.hypot(dx,dz)||1; if(d>3) moveCharacter(boss,dx/d*(phase-1)*1.4*dt,dz/d*(phase-1)*1.4*dt);
    }
    if(fightT>60&&!furie){ furie=true; announce("FURIE — FINIS-LE VITE !","#ff2222"); }
    bsT-=dt; if(bsT<=0&&u.bState==="chase"&&!pend){ bsT=(8.5-phase*1.7)*(furie?.6:1); special(boss); }
    if(pend){ pend.t-=dt; u.mainMaterial.emissiveIntensity=1.4+Math.sin(Date.now()*.03)*.8; if(pend.t<=0){ pend.fn(); pend=null; u.mainMaterial.emissiveIntensity=0; } }
    if(Math.random()<dt*14) burst(boss.position.clone().add(new V(rnd(-.8,.8),rnd(0,2),rnd(-.8,.8))),phase>2?0xff2200:0xff7a1a,1,1.2,.12,.8,-2);
    healT-=dt; if(healT<=0){ healT=14; if(playerHP<45&&Math.random()<.7){ G.forceHeal=true; spawnPowerup(px+rnd(-4,4),pz+rnd(-4,4)); G.forceHeal=false; banner("SOIN","Le boss a lâché une gemme verte !","#4ade80"); } }
    if(fightT>70){
        if(!lavaM){ lavaM=new THREE.Mesh(new THREE.RingGeometry(1,60,64),new THREE.MeshBasicMaterial({color:0xff3300,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false})); lavaM.rotation.x=-Math.PI/2; lavaM.position.y=.1; levelGroup.add(lavaM); announce("LA LAVE MONTE !","#ff5522"); lavaR=14.6; }
        lavaR=Math.max(4.5,lavaR-.11*dt); lavaM.scale.set(lavaR,lavaR,1); lavaM.material.opacity=.6+.2*Math.sin(Date.now()*.006);
        lavaT+=dt; if(lavaT>.5){ lavaT=0; if(Math.hypot(px,pz)>lavaR&&low){ hurtPlayer(5); } }
    }
    for(let i=bfx.length-1;i>=0;i--){
        const o=bfx[i];
        if(o.k==="shock"){
            o.r+=o.sp*dt; o.m.scale.set(o.r,1,o.r); o.m.material.opacity=.65*(1-o.r/o.max);
            if(!o.hit&&Math.abs(Math.hypot(px-o.x,pz-o.z)-o.r)<1.2&&low){ o.hit=true; hurtPlayer(o.dmg); }
            if(o.r>=o.max){ levelGroup.remove(o.m); bfx.splice(i,1); }
        } else if(o.k==="laser"){
            o.t+=dt; const act=o.t>1.4; if(act){ o.a+=o.ws*(.5+.15*phase)*dt; o.m.scale.set(17,.55,.5); o.m.material.opacity=.85; }
            const dx=Math.cos(o.a), dz=Math.sin(o.a); o.m.position.set(boss.position.x+dx*8.5,gy+.55,boss.position.z+dz*8.5); o.m.rotation.y=-o.a;
            if(act){ o.tick-=dt; const rx=px-boss.position.x, rz=pz-boss.position.z, t=rx*dx+rz*dz, pp=Math.abs(rx*dz-rz*dx);
                if(o.tick<=0&&t>0&&t<17&&pp<.9&&player.position.y<gy+1){ o.tick=.4; hurtPlayer(13); } }
            if(o.t>5.8){ levelGroup.remove(o.m); bfx.splice(i,1); }
        } else if(o.k==="met"){
            o.t+=dt; if(o.t<0) continue;
            if(!o.disc){
                o.disc=new THREE.Mesh(new THREE.CircleGeometry(2.7,32),new THREE.MeshBasicMaterial({color:0xff2200,transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide})); o.disc.rotation.x=-Math.PI/2;
                o.ball=new THREE.Mesh(new THREE.SphereGeometry(.8,12,12),new THREE.MeshBasicMaterial({color:0xff8a1f})); levelGroup.add(o.disc,o.ball);
            }
            const k=Math.min(1,o.t/o.dur), g0=getGroundHeight(o.tx,o.tz); o.disc.position.set(o.tx,g0+.07,o.tz); o.disc.scale.setScalar(.2+.8*k); o.disc.material.opacity=.2+.4*k;
            o.ball.position.set(o.tx,g0+.8+24*(1-k)*(1-k),o.tz);
            if(o.t>=o.dur){
                const p=new V(o.tx,g0+.3,o.tz); ring(p,3,0xff6a00,.5); burst(p,0xff8a1f,30,9,.2,.8); burst(p,0x555555,10,5,.25,1); S.slam(p); C.shake(.3);
                if(Math.hypot(px-o.tx,pz-o.tz)<2.8&&low) hurtPlayer(24);
                levelGroup.remove(o.disc,o.ball); bfx.splice(i,1);
            }
        }
    }
}

/* ---------- Décors des cartes ---------- */
function decor(){ // ville
    const wm=mk(0x94a3b8), wt=mk(0x38bdf8,{emissive:0x0369a1,emissiveIntensity:.6,roughness:.2});
    const f=C3M.prop("fountain"); f.position.set(22,0,22); levelGroup.add(f); obstacles.push({x:22,z:22,width:4.8,depth:4.8,h:.7});
    const lamp=(x,z)=>{ if(collidesWithBuilding(x,z,1)) return; const l=C3M.prop("lamp"); l.position.set(x,0,z); levelGroup.add(l); obstacles.push({x,z,width:.3,depth:.3,h:4.2}); };
    for(let i=-3;i<=3;i++){ lamp(-8,i*10+4); lamp(8,i*10+4); }
    for(let z=-34;z<30;z+=5){ if(Math.abs(z-2)<4) continue; const s=new THREE.Mesh(new THREE.PlaneGeometry(.3,2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7})); s.rotation.x=-Math.PI/2; s.position.set(0,.03,z); levelGroup.add(s); }
    [].forEach(([x,z],i)=>{
        if(collidesWithBuilding(x,z,2)) return; const c=C3M.prop("car"), col=[0xdc2626,0x2563eb,0xf59e0b,0x16a34a,0x7c3aed,0xe5e7eb][i]; C3M.tint(c,"mat_carbody",col); c.position.set(x,0,z); c.rotation.y=(i%2)*Math.PI; levelGroup.add(c); obstacles.push({x,z,width:2.2,depth:1.1,h:1.3});
    });
}
function huts(){
    let n=0,t=0; while(n<5&&t++<120){
        const x=rnd(-34,34), z=rnd(-34,34), g=getGroundHeight(x,z);
        if(Math.hypot(x,z)<12||collidesWithBuilding(x,z,5)||Math.abs(getGroundHeight(x+3,z+3)-g)>.6||Math.abs(getGroundHeight(x-3,z-3)-g)>.6) continue;
        createBuilding(x,z,5.4,5.6,5.4,[0x78716c,0x6b5b4b,0x57534e][n%3]); n++;
    }
}
{ const vb=MODES.ville.build; MODES.ville.build=function(){ vb(); decor(); };
  const sb2=MODES.survie.build; MODES.survie.build=function(){ sb2(); huts(); }; }

/* ---------- Boucle ---------- */
let php=100;
function frame(dt){
    const A=G.adm, st=G.stats; st.t+=dt;
    if(!unl.has(wk(currentWeapon))){ currentWeapon=weapons[lastOk]; updateWeaponHUD(); } else lastOk=wk(currentWeapon);
    if(A.inf) for(const k of weaponOrder){ const w=weapons[k]; if(w.maxAmmo) w.ammo=w.maxAmmo; }
    if(wave!==lw){ st.waveT.push(+(st.t-st.lw).toFixed(1)); st.lw=st.t; lw=wave; ev("wave",wave); if(MODES[currentModeKey].infinite) spawnChests(2,false); }
    if(playerHP<php){ const d=php-playerHP; if(A.god||A.take<=0){ playerHP=php; updatePlayerBar(); } else if(A.take!==1&&A.take>0){ playerHP=Math.max(0,php-d*A.take); updatePlayerBar(); if(playerHP<=0) endGame(false); } }
    php=playerHP;
    moveState(dt);
    let near=null, nd=2.4;
    for(const c of chests){
        if(c.open){ if(c.lt<1){ c.lt=Math.min(1,c.lt+dt*2.2); c.lid.rotation.x=-1.9*c.lt; } continue; }
        c.beam.rotation.y+=dt; const d=Math.hypot(c.x-player.position.x,c.z-player.position.z); if(d<nd){ nd=d; near=c; }
    }
    G.near=near; cp.style.display=near&&!isMobile?"block":"none"; if(near&&isMobile&&nd<1.9) openChest(near);
    if(currentModeKey==="duel") bossFrame(dt);
}
const _de=damageEnemy;
damageEnemy=function(e,dmg){
    if(!e||!e.userData.alive) return _de(e,dmg);
    const u=e.userData, h0=u.hp, k=wk(currentWeapon); _de(e,dmg*G.adm.dmg); const dd=h0-u.hp;
    if(dd>0){ G.stats.dmg+=dd; if(currentWeapon.type==="gun") G.stats.hits++; if(!u.alive){ G.stats.kills++; ev("kill",k); if(u.boss) ev("boss"); } }
};
const _ce=createEnemy; createEnemy=function(x,z,o){ const e=_ce(x,z,o); e.userData.hp*=G.adm.ehp; e.userData.maxHP=e.userData.hp; return e; };
const _eg=endGame; endGame=function(w){ if(!w&&(G.adm.god||G.adm.take<=0)&&!gameFinished){ playerHP=100; updatePlayerBar(); return; } _eg(w); sb.style.display="none"; };

const clk=new THREE.Clock(), _r=renderer.render;
renderer.render=function(s,c){
    const dt=Math.min(clk.getDelta(),.05);
    if(state==="playing"&&!gameFinished&&!paused) frame(dt);
    if(state==="playing"){ if(thirdPerson) tpCam(); else if(crK>.001) camera.position.y-=.7*crK; }
    else { sb.style.display="none"; cp.style.display="none"; }
    _r.call(this,s,c);
};

/* ---------- Démarrage / retour salon ---------- */
const _sm=startMode;
startMode=function(k){
    runStart(); furie=false; php=100; bsT=5; healT=10; lavaT=0; arena.f=null; _sm(k);
    if(k==="duel") arena();
    if(!(window.MP&&MP.active)) spawnChests({duel:3,ville:5,survie:8}[k]||4); if(C.setHeals) C.setHeals(G.adm.heals); if(isMobile) $("hotbar").style.display="flex";
    if(!isMobile) try{ renderer.domElement.requestPointerLock(); }catch(e){}
};
const _gl=goToLobby; goToLobby=function(){ _gl(); sb.style.display="none"; cp.style.display="none"; loot.classList.remove("on"); ann.classList.remove("on"); };
slots();
if(isMobile){ hotbarEl.classList.add("m"); hotbarEl.addEventListener("touchstart",e=>e.stopPropagation(),{passive:true}); }
})();

/* ===== jeu-06 ===== */
/* ===== COMBAT 3D — ADMIN, MISSIONS, CLASSEMENT, SKIN DU PERSONNAGE ===== */
(()=>{
const $=id=>document.getElementById(id), G=window.G, C=window.C3, S=C.S, A=G.adm;
const ls=(k,d)=>{ try{ return JSON.parse(localStorage.getItem(k))||d; }catch(e){ return d; } }, sv=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const fmt=s=>{ s=Math.round(s); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };
const WN=k=>weapons[k].name;

/* ---------- Skin du personnage ---------- */
window.applyChar=()=>{
    const s=C3x.char(), u=player.userData;
    u.mainMaterial.color.setHex(s.body); const pa=u.parts; if(pa&&pa.backpack){ pa.backpack.material.color.setHex(s.back); pa.leg_mesh.material.color.setHex(s.leg); } else { player.children[1].material.color.setHex(s.back); u.limbs.legL.material.color.setHex(s.leg); }
};
applyChar();

/* ---------- Missions ---------- */
const POOL=[
 {t:"kill",n:[15,25,40],r:[40,70,120]},
 {t:"killw",w:["knife","glock","deagle","revolver","smg","ak","shotgun","sniper","hammer"],n:[5,8,12],r:[50,80,120]},
 {t:"chest",n:[2,4,6],r:[40,70,100]},
 {t:"gem",n:[3,5,8],r:[30,50,80]},
 {t:"wave",n:[4,6,9],r:[60,100,160]},
 {t:"win",n:[1,2,3],r:[50,100,150]},

 {t:"sprint",n:[20,40,60],r:[30,50,80]},
 {t:"combo",n:[3,4,5],r:[40,70,100]}
];
const txt=m=>({kill:()=>"Éliminer "+m.n+" ennemis",killw:()=>"Éliminer "+m.n+" ennemis avec "+WN(m.k),chest:()=>"Ouvrir "+m.n+" coffres",gem:()=>"Ramasser "+m.n+" gemmes",
  wave:()=>"Atteindre la vague "+m.n+" en Survie",win:()=>"Gagner "+m.n+" partie"+(m.n>1?"s":""),boss:()=>"Vaincre le boss",sprint:()=>"Sprinter pendant "+m.n+" secondes",combo:()=>"Faire un combo x"+m.n})[m.t]();
let M=ls("c3d_missions",[]);
function gen(){
    const have=M.map(m=>m.t+(m.k||""));
    for(let t=0;t<40;t++){
        const p=POOL[Math.floor(Math.random()*POOL.length)], i=Math.floor(Math.random()*p.n.length), k=p.w?p.w[Math.floor(Math.random()*p.w.length)]:null;
        if(have.includes(p.t+(k||""))) continue; return {t:p.t,k,n:p.n[i],r:p.r[i],p:0};
    }
    return {t:"kill",k:null,n:20,r:50,p:0};
}
while(M.length<3) M.push(gen());
const mp=document.createElement("div"); mp.id="missions"; $("lobby").appendChild(mp);
function renderM(){
    sv("c3d_missions",M);
    mp.innerHTML='<div class="mH">MISSIONS</div>'+M.map(m=>'<div class="mR"><div class="mT">'+txt(m)+'<span>🪙 '+m.r+'</span></div><div class="mB"><i style="width:'+Math.min(100,m.p/m.n*100)+'%"></i></div><small>'+Math.floor(Math.min(m.p,m.n))+' / '+m.n+'</small></div>').join("");
}
function toast(t,c){ const e=document.createElement("div"); e.className="dn big"; e.textContent=t; e.style.color=c; e.style.top="40%"; document.body.appendChild(e); setTimeout(()=>e.remove(),900); }
function check(){
    M.forEach((m,i)=>{ if(m.p>=m.n){ addCoins(m.r); REC.g.coinsE=(REC.g.coinsE||0)+m.r; toast("Mission accomplie ! +"+m.r+" 🪙","#ffd166"); S.win(); M[i]=gen(); } });
    renderM();
}
let REC=ls("c3d_rec",null)||{g:{kills:0,games:0,wins:0,shots:0,hits:0,chests:0,gems:0,time:0,combo:0,coinsE:0},survie:{games:0,bestWave:0,bestScore:0,time:0,waves:[],kills:0},ville:{games:0,wins:0,best:null,kills:0},duel:{games:0,wins:0,best:null,kills:0}};
let cmb=0, lastK=0;
G.ev=(t,k,n)=>{
    let ch=false;
    if(t==="gem") G.stats.gems++;
    if(t==="kill"){ const now=performance.now(); cmb=now-lastK<3200?cmb+1:1; lastK=now; if(cmb>REC.g.combo) REC.g.combo=cmb; }
    M.forEach(m=>{
        let a=0;
        if(t==="kill"){ if(m.t==="kill") a=1; else if(m.t==="killw"&&m.k===k) a=1; else if(m.t==="combo") a=Math.max(0,cmb-m.p); }
        else if(t==="chest"&&m.t==="chest") a=1; else if(t==="gem"&&m.t==="gem") a=1; else if(t==="boss"&&m.t==="boss") a=1;
        else if(t==="sprint"&&m.t==="sprint") a=n; else if(t==="win"&&m.t==="win") a=1;
        else if(t==="wave"&&m.t==="wave"&&currentModeKey==="survie") a=Math.max(0,k-m.p);
        if(a>0){ m.p+=a; ch=true; }
    });
    if(ch) check();
};
renderM();

/* ---------- Records ---------- */
const _eg=endGame;
endGame=function(w){
    const was=gameFinished; _eg(w); if(was||!gameFinished) return;
    const st=G.stats, g=REC.g, mk=currentModeKey, r=REC[mk];
    g.games++; g.kills+=st.kills; g.shots+=st.shots; g.hits+=st.hits; g.chests+=st.chests; g.gems+=st.gems; g.time+=st.t; r.games++; r.kills+=st.kills;
    if(mk==="survie"){ if(wave>r.bestWave||(wave===r.bestWave&&st.t>r.time)){ r.bestWave=wave; r.time=st.t; r.waves=st.waveT.slice(); } r.bestScore=Math.max(r.bestScore,score); }
    else if(w){ r.wins++; if(r.best==null||st.t<r.best) r.best=st.t; }
    if(w){ g.wins++; G.ev("win"); }
    sv("c3d_rec",REC);
    let rs=$("runStats"); if(!rs){ rs=document.createElement("div"); rs.id="runStats"; $("statLine").after(rs); }
    const acc=st.shots?Math.round(st.hits/st.shots*100)+"%":"—";
    rs.innerHTML='<div>⏱ '+fmt(st.t)+'</div><div>☠ '+st.kills+' éliminations</div><div>🎯 '+acc+'</div><div>💥 '+Math.round(st.dmg)+' dégâts</div><div>📦 '+st.chests+' coffres</div><div>💎 '+st.gems+' gemmes</div>'+
        (st.waveT.length?'<div class="wide">Temps par vague : '+st.waveT.map((t,i)=>"V"+(i+1)+" "+fmt(t)).join(" · ")+'</div>':"");
};

/* ---------- Écran Classement ---------- */
const rk=document.createElement("div"); rk.id="rank"; rk.className="ovl";
rk.innerHTML='<div class="shTop"><div class="shTitle">🏆 CLASSEMENT</div><button class="actionBtn secondary" id="rkClose" style="min-width:90px;padding:10px 16px">← Salon</button></div><div class="rkNote">Classement local : tes meilleurs scores sur cet appareil (un classement mondial demande un serveur).</div><div id="rkBody"></div>';
document.body.appendChild(rk);
function renderRank(){
    const g=REC.g, s=REC.survie, v=REC.ville, d=REC.duel, acc=g.shots?Math.round(g.hits/g.shots*100)+"%":"—";
    const row=(a,b)=>'<div class="rkRow"><span>'+a+'</span><b>'+b+'</b></div>', card=(t,c,rows)=>'<div class="rkCard" style="--c:'+c+'"><h3>'+t+'</h3>'+rows+'</div>';
    $("rkBody").innerHTML=
      card("🌊 Vallée Survie","#38bdf8",row("Meilleure vague",s.bestWave||"—")+row("Meilleur score",s.bestScore||"—")+row("Durée du meilleur run",s.time?fmt(s.time):"—")+row("Éliminations totales",s.kills)+row("Parties",s.games)+
        '<div class="rkW">Temps par vague (meilleur run)<br>'+(s.waves.length?s.waves.map((t,i)=>"<em>V"+(i+1)+"</em> "+fmt(t)).join(" · "):"—")+'</div>')+
      card("🏙 Ville","#4ade80",row("Meilleur temps",v.best!=null?fmt(v.best):"—")+row("Victoires / parties",v.wins+" / "+v.games)+row("Éliminations totales",v.kills))+
      card("📊 Global","#fbbf24",row("Éliminations",g.kills)+row("Précision",acc)+row("Meilleur combo","x"+g.combo)+row("Coffres ouverts",g.chests)+row("Gemmes ramassées",g.gems)+row("Temps de jeu",fmt(g.time))+row("Parties / victoires",g.games+" / "+g.wins)+row("Pièces de missions",g.coinsE||0));
}
const tabs=document.querySelector(".lbTabs"), tb=document.createElement("button"); tb.textContent="CLASSEMENT"; tabs.appendChild(tb);
tb.onclick=()=>{ renderRank(); rk.style.display="flex"; };
$("rkClose").onclick=()=>{ rk.style.display="none"; };

/* ---------- Panneau admin (3 × A dans le salon) ---------- */
const ad=document.createElement("div"); ad.id="admin";
ad.innerHTML=`<div class="adT"><b>⚙ PANNEAU ADMIN</b><button data-a="close">✕</button></div><div class="adB">
<h4>Pièces : <span id="adCoins"></span></h4><div class="r"><input id="adN" type="number" value="1000"><button data-a="cadd">Ajouter</button><button data-a="csub">Retirer</button><button data-a="cset">Définir</button></div>
<h4>Déblocages</h4><div class="r"><button data-a="allw">Tous les skins d'armes</button><button data-a="allc">Tous les skins perso</button><button data-a="lock">Tout reverrouiller</button></div>
<h4>Options de partie</h4>
<label><input type="checkbox" data-t="god"> Invincible</label><label><input type="checkbox" data-t="inf"> Munitions infinies</label>
<label><input type="checkbox" data-t="all"> Toutes les armes dès le départ</label><label><input type="checkbox" data-t="stam"> Sprint illimité</label>
<label>Vitesse ×<input type="range" data-s="spd" min=".5" max="3" step=".1"><span></span></label>
<label>Dégâts infligés ×<input type="range" data-s="dmg" min=".5" max="25" step=".5"><span></span></label>
<label>PV des ennemis ×<input type="range" data-s="ehp" min=".1" max="5" step=".1"><span></span></label>
<label>Dégâts reçus ×<input type="range" data-s="take" min="0" max="3" step=".1"><span></span></label>
<label>Gemmes de soin au départ<input type="range" data-s="heals" min="0" max="3" step="1"><span></span></label>
<h4>Missions</h4><div class="r"><button data-a="mnew">Régénérer</button><button data-a="m0">Finir #1</button><button data-a="m1">Finir #2</button><button data-a="m2">Finir #3</button></div>
<h4>Données</h4><div class="r"><button data-a="rrec">Reset classement</button><button data-a="rall">TOUT effacer</button><button data-a="exp">Exporter</button><button data-a="imp">Importer</button></div>
<textarea id="adTA" placeholder="Export / import JSON"></textarea></div>`;
document.body.appendChild(ad);
const saveA=()=>localStorage.setItem("c3d_admin",JSON.stringify(A)), keysLS=()=>Object.keys(localStorage).filter(k=>k.startsWith("c3d_")||k==="combat3d_coins");
ad.querySelectorAll("[data-t]").forEach(el=>{ el.checked=!!A[el.dataset.t]; el.onchange=()=>{ A[el.dataset.t]=el.checked; saveA(); }; });
ad.querySelectorAll("[data-s]").forEach(el=>{ const k=el.dataset.s, sp=el.nextElementSibling; el.value=A[k]; sp.textContent=A[k]; el.oninput=()=>{ A[k]=+el.value; sp.textContent=el.value; saveA(); }; });
const SK=["for","oce","mag","gla","spe","or"], CK=["c_com","c_nin","c_rou","c_gla","c_neo","c_gal","c_or"], coinsTxt=()=>{ $("adCoins").textContent=coins; };
const own=add=>{ const o=new Set(ls("c3d_own",[])); add.forEach(x=>o.add(x)); sv("c3d_own",[...o]); location.reload(); };
const act={
    close:()=>{ ad.style.display="none"; },
    cadd:()=>{ addCoins(+$("adN").value||0); coinsTxt(); }, csub:()=>{ addCoins(-(+$("adN").value||0)); coinsTxt(); }, cset:()=>{ addCoins((+$("adN").value||0)-coins); coinsTxt(); },
    allw:()=>own(weaponOrder.flatMap(k=>SK.map(s=>k+":"+s))), allc:()=>own(CK.map(s=>"char:"+s)),
    lock:()=>{ sv("c3d_own",[]); sv("c3d_eq",{}); location.reload(); },
    mnew:()=>{ M=[]; while(M.length<3) M.push(gen()); renderM(); },
    m0:()=>{ M[0].p=M[0].n; check(); }, m1:()=>{ M[1].p=M[1].n; check(); }, m2:()=>{ M[2].p=M[2].n; check(); },
    rrec:()=>{ if(confirm("Effacer tout le classement ?")){ localStorage.removeItem("c3d_rec"); location.reload(); } },
    rall:()=>{ if(confirm("Effacer TOUTES les données du jeu (pièces, skins, records...) ?")){ keysLS().forEach(k=>localStorage.removeItem(k)); location.reload(); } },
    exp:()=>{ const o={}; keysLS().forEach(k=>o[k]=localStorage.getItem(k)); $("adTA").value=JSON.stringify(o); },
    imp:()=>{ try{ const o=JSON.parse($("adTA").value); Object.keys(o).forEach(k=>{ if(k.startsWith("c3d_")||k==="combat3d_coins") localStorage.setItem(k,o[k]); }); location.reload(); }catch(e){ alert("JSON invalide"); } }
};
ad.addEventListener("click",e=>{ const a=e.target.dataset&&e.target.dataset.a; if(a&&act[a]) act[a](); });
let aN=0, aT=0;
document.addEventListener("keydown",e=>{
    if(state!=="lobby"||e.repeat||/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if(e.key.toLowerCase()==="a"){ const n=performance.now(); aN=(n-aT<900)?aN+1:1; aT=n; if(aN>=1){ aN=0; window.askAdmin&&askAdmin(); } } else aN=0;
});
const _gl=goToLobby; goToLobby=function(){ _gl(); renderM(); };
})();

/* ===== jeu-07 ===== */
/* ===== COMBAT 3D — MULTIJOUEUR (PeerJS) : combat à mort en ligne ===== */
(()=>{
const $=id=>document.getElementById(id), V=THREE.Vector3, C=window.C3, S=C.S, G=window.G;
const MP=window.MP={active:false,dead:false,inv:0,host:false,id:0,players:{},scores:{},conns:[],hc:null,peer:null,limit:15,nextId:1,over:false};
const SPAWNS=[[0,40],[0,-40],[40,0],[-40,0],[30,30],[-30,30],[30,-30],[-30,-30],[42,-14],[-42,14]], AV={};
const rng=seed=>{ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; };
const wkey=()=>Object.keys(weapons).find(k=>weapons[k]===currentWeapon);
const myName=()=>{ const n=($("mpName").value||"").trim().slice(0,14)||"Joueur"; localStorage.setItem("c3d_name",n); return n; };
const mySkin=()=>{ const s=C3x.char(); return {body:s.body,back:s.back,leg:s.leg}; };

/* ---------- Interface ---------- */
const pn=document.createElement("div"); pn.id="mpPanel"; pn.className="ovl";
pn.innerHTML=`<div class="shTop"><div class="shTitle">🌐 MULTIJOUEUR</div><button class="actionBtn secondary" id="mpClose" style="min-width:90px;padding:10px 16px">← Salon</button></div>
<div class="mpBox"><div class="mpNote">Combat à mort en ligne (jusqu'à 10 joueurs, premier à 15 éliminations) sur la carte Ville. Un joueur crée la partie et donne le code aux autres.</div>
<label>Ton pseudo <input id="mpName" maxlength="14"></label>
<div class="mpRow"><button class="actionBtn" id="mpCreate">Créer une partie</button><span>ou</span><input id="mpCode" placeholder="CODE" maxlength="5"><button class="actionBtn secondary" id="mpJoin">Rejoindre</button></div>
<label>Mode <select id="mpMode"><option value="dm">Combat à mort (15 éliminations)</option><option value="tdm">Combat par équipes (Bleu / Rouge)</option><option value="br">Battle Royale (dernier en vie)</option></select></label><div id="mpStatus"></div>
<div id="mpRoom" style="display:none"><div class="mpCode">Code de la partie : <b id="mpCodeShow"></b></div><div id="mpList"></div>
<div class="mpRow"><button class="actionBtn" id="mpStart">LANCER LA PARTIE</button><button class="actionBtn secondary" id="mpLeave">Quitter</button></div></div></div>`;
document.body.appendChild(pn);
const hud=document.createElement("div"); hud.id="mpHud"; document.body.appendChild(hud);
const feed=document.createElement("div"); feed.id="mpFeed"; document.body.appendChild(feed);
const dth=document.createElement("div"); dth.id="mpDeath"; document.body.appendChild(dth);
$("mpName").value=localStorage.getItem("c3d_name")||"Joueur"+Math.floor(Math.random()*900+100);
const tabs=document.querySelector(".lbTabs"), tb=document.createElement("button"); tb.textContent="MULTIJOUEUR"; tabs.appendChild(tb);
tb.onclick=()=>{ pn.style.display="flex"; };
$("mpClose").onclick=()=>{ pn.style.display="none"; };
const status=(t,c)=>{ $("mpStatus").textContent=t; $("mpStatus").style.color=c||"#cbd5e1"; };
function refreshList(){
    const ids=Object.keys(MP.players);
    $("mpList").innerHTML=ids.map(i=>'<div class="mpP"><i style="background:#'+(MP.players[i].skin.body||0x168cff).toString(16).padStart(6,"0")+'"></i>'+MP.players[i].name.replace(/</g,"&lt;")+(Number(i)===0?" 👑":"")+'</div>').join("");
    $("mpStart").style.display=MP.host?"":"none";
}
function showRoom(){ $("mpRoom").style.display="block"; $("mpCodeShow").textContent=MP.code; status(MP.host?"Partage ce code, puis lance la partie.":"Connecté. En attente que l'hôte lance la partie…","#86efac"); refreshList(); }
function teamHdr(){ const t=[0,0]; Object.keys(MP.players).forEach(i=>{ t[i%2]+=(MP.scores[i]||{k:0}).k; }); return '<div class="me">🔵 '+t[0]+' · 🔴 '+t[1]+' / '+MP.limit+'</div>'; }
function renderScore(){
    const ids=Object.keys(MP.players).sort((a,b)=>((MP.scores[b]||{k:0}).k)-((MP.scores[a]||{k:0}).k));
    hud.innerHTML=(MP.mode==="tdm"?teamHdr():"")+(MP.mode==="br"&&MP.alive?'<div class="me">🧍 '+MP.alive.size+' en vie</div>':"")+ids.map(i=>{ const s=MP.scores[i]||{k:0,d:0}; return '<div class="'+(Number(i)===MP.id?"me":"")+'"><b>'+s.k+'</b> / '+s.d+' · '+MP.players[i].name.replace(/</g,"&lt;")+'</div>'; }).join("");
}
function news(t){ const e=document.createElement("div"); e.textContent=t; feed.appendChild(e); setTimeout(()=>e.remove(),4500); }

/* ---------- Réseau ---------- */
const send=(m)=>{ if(MP.host) bcast(m); else if(MP.hc&&MP.hc.open) MP.hc.send(m); };
const bcast=(m,except)=>MP.conns.forEach(c=>{ if(c!==except&&c.open) c.send(m); });
function toPlayer(id,m){ if(id>=100){ botHit(m); return; } if(id===MP.id){ onHit(m); return; } const c=MP.conns.find(x=>x._pid===id); if(c&&c.open) c.send(m); }
function leave(){
    clearInterval(MP.iv); const pp=MP.peer; MP.peer=null; MP.conns=[]; MP.hc=null; try{ pp&&pp.destroy(); }catch(e){}
    MP.players={}; MP.scores={}; MP.host=false; MP.nextId=1; MP.id=0; MP.over=false; MP.dead=false; MP.botS={}; MP.cfg=null;
    $("mpRoom").style.display="none"; clearAvatars(); hud.style.display="none"; dth.style.display="none"; feed.innerHTML="";
    if(MP.saved){ G.adm.all=MP.saved.all; G.adm.inf=MP.saved.inf; G.adm.spd=MP.saved.spd; MP.saved=null; }
    MP.active=false;
}
function create(fix){
    if(typeof Peer==="undefined") return status("PeerJS n'a pas pu être chargé (vérifie ta connexion internet).","#fca5a5");
    leave(); const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", code=fix||Array.from({length:5},()=>A[Math.floor(Math.random()*A.length)]).join("");
    status("Création de la partie…"); const p=new Peer("c3d-"+code); MP.peer=p; MP.host=true; MP.id=0;
    p.on("open",()=>{ MP.code=code; MP.players={0:{id:0,name:myName(),skin:mySkin()}}; showRoom(); });
    p.on("error",e=>{ if(e.type==="unavailable-id"){ if(fix) status("Le serveur public est déjà ouvert : rejoins-le.","#fca5a5"); else create(); } else status("Erreur réseau : "+e.type,"#fca5a5"); });
    p.on("connection",c=>{
        c.on("data",m=>hostRecv(c,m));
        c.on("close",()=>{ if(c._pid===undefined) return; const id=c._pid; MP.conns=MP.conns.filter(x=>x!==c); delete MP.players[id]; removeAvatar(id); bcast({t:"leave",id}); if(MP.alive&&MP.alive.has(id)&&MP.active) registerDeath({id,by:undefined}); refreshList(); if(MP.active){ news("Un joueur a quitté la partie."); renderScore(); } });
    });
}
function hostRecv(c,m){
    if(m.t==="hi"){
        if(MP.active||MP.conns.length>=9){ c.send({t:"busy"}); setTimeout(()=>c.close(),400); return; }
        const id=MP.nextId++; c._pid=id; MP.players[id]={id,name:String(m.name).slice(0,14),skin:m.skin||{}}; MP.conns.push(c);
        c.send({t:"welcome",id,players:MP.players}); if(MP.cfg) c.send({t:"cfg",cfg:MP.cfg}); bcast({t:"join",p:MP.players[id]},c); refreshList(); return;
    }
    if(m.t==="s"||m.t==="f"){ apply(m); bcast(m,c); }
    else if(m.t==="h") toPlayer(m.to,m);
    else if(m.t==="d") registerDeath(m);
}
function join(){
    const code=($("mpCode").value||"").trim().toUpperCase(); if(code.length<5) return status("Entre le code à 5 caractères.","#fca5a5");
    if(typeof Peer==="undefined") return status("PeerJS n'a pas pu être chargé (vérifie ta connexion internet).","#fca5a5");
    leave(); status("Connexion…"); const p=new Peer(); MP.peer=p;
    p.on("error",e=>status(e.type==="peer-unavailable"?"Code introuvable : vérifie-le.":"Erreur réseau : "+e.type,"#fca5a5"));
    p.on("open",()=>{
        const c=p.connect("c3d-"+code,{reliable:true,serialization:"json"}); MP.hc=c; MP.code=code;
        c.on("open",()=>c.send({t:"hi",name:myName(),skin:mySkin()})); c.on("data",guestRecv);
        c.on("close",()=>{ if(MP.peer){ const was=MP.active; leave(); status("Connexion à l'hôte perdue.","#fca5a5"); if(was) goToLobby(); } });
    });
}
function guestRecv(m){
    switch(m.t){
        case "welcome": MP.id=m.id; MP.players=m.players; showRoom(); break;
        case "join": MP.players[m.p.id]=m.p; refreshList(); break;
        case "leave": delete MP.players[m.id]; removeAvatar(m.id); refreshList(); if(MP.active) renderScore(); break;
        case "cfg": MP.cfg=m.cfg; break;
        case "start": begin(m.seed,m.limit,m.mode,m.set,m.map); break;
        case "s": case "f": apply(m); break;
        case "h": onHit(m); break;
        case "sc": MP.scores=m.s; if(m.al) MP.alive=new Set(m.al); if(m.feed) news(m.feed); renderScore(); break;
        case "end": endMatch(m.winner,m.team); break;
        case "busy": leave(); status("Partie déjà commencée ou pleine.","#fca5a5"); break;
    }
}
$("mpCreate").onclick=()=>create(); window.mpCreatePublic=()=>create("PUBLC"); $("mpJoin").onclick=join; $("mpLeave").onclick=()=>{ leave(); status(""); };
$("mpStart").onclick=()=>{ if(!MP.host) return; const seed=Math.floor(Math.random()*1e9), set=window.mpSettings?mpSettings():{}, limit=set.limit||15, mode=($("mpMode")||{}).value||"dm", map=set.map||"ville"; addBots(set.bots||0,set.bl); bcast({t:"start",seed,limit,mode,set,map}); begin(seed,limit,mode,set,map); };

/* ---------- Partie ---------- */
function spawnMe(first){
    let best=null, bd=-1; const ids=Object.keys(MP.players).map(Number).sort((a,b)=>a-b);
    SPAWNS.forEach((p,i)=>{ const d=first?(i===ids.indexOf(MP.id)?1e9:0):Object.values(AV).reduce((m,a)=>Math.min(m,Math.hypot(a.position.x-p[0],a.position.z-p[1])),1e9); if(d>bd){ bd=d; best=p; } });
    if(first&&MP.mode==="tdm"){ const TL=MP.id%2===0?[0,4,5,2,8]:[1,6,7,3,9], mates=ids.filter(q=>q%2===MP.id%2); best=SPAWNS[TL[Math.max(0,mates.indexOf(MP.id))%TL.length]]; }   // chaque équipe d'un côté
    const scl=(MODES[MP.map||"ville"].boundary-4)/44; let x=best[0]*scl, z=best[1]*scl; for(let i=0;i<8&&collidesWithBuilding(x,z,1.4);i++){ x-=Math.sign(x)*3; z-=Math.sign(z)*3; }
    player.position.set(x,getGroundHeight(x,z),z); cameraYaw=Math.atan2(x,z); cameraPitch=0; velocityY=0;
    playerHP=(MP.set&&MP.set.hp)||100; updatePlayerBar(); for(const k in weapons) if(weapons[k].maxAmmo) weapons[k].ammo=weapons[k].maxAmmo; updateWeaponHUD(); MP.inv=2;
}
function begin(seed,limit,mode,set,map){ MP.seed=seed; MP.set=set||{}; MP.map=map||"ville"; MP.t0=performance.now(); MP.mode=mode||"dm"; MP.alive=new Set(Object.keys(MP.players).map(Number));
    MP.active=true; MP.dead=false; MP.over=false; MP.inv=0; MP.limit=limit||15; MP.scores={}; Object.keys(MP.players).forEach(i=>MP.scores[i]={k:0,d:0});
    if(!MP.saved) MP.saved={all:G.adm.all,inf:G.adm.inf,spd:G.adm.spd}; G.adm.all=MP.set.all!==false; G.adm.inf=MP.set.inf!==false; G.adm.spd=MP.set.speed||1;
    pn.style.display="none"; clearAvatars();
    const R=Math.random; Math.random=rng(seed); try{ startMode(MP.map); } finally{ Math.random=R; }
    enemies.forEach(e=>{ if(e.parent) e.parent.remove(e); }); enemies.length=0; updateEnemyCount();
    Object.keys(MP.players).forEach(i=>{ if(Number(i)!==MP.id) makeAvatar(MP.players[i]); });
    if(MP.host) initBots();
    spawnMe(true); hud.style.display="block"; renderScore(); dth.style.display="none";
    clearInterval(MP.iv); MP.iv=setInterval(tick,66);
}
function tick(){
    if(!MP.active) return; MP.inv=Math.max(0,MP.inv-.066); if(MP.host) botTick();
    send({t:"s",id:MP.id,p:[+player.position.x.toFixed(2),+player.position.y.toFixed(2),+player.position.z.toFixed(2)],yw:+cameraYaw.toFixed(3),pt:+cameraPitch.toFixed(3),w:wkey(),hp:Math.max(0,Math.round(playerHP)),d:MP.dead?1:0});
}
function onHit(m){
    if(!MP.active||MP.dead||MP.over||MP.inv>0) return;
    MP.lastBy=m.from; MP.lastW=m.w; hurtPlayer(m.dmg);
}
function onDeath(){
    if(MP.dead||MP.over) return; MP.dead=true; const by=MP.lastBy, m={t:"d",id:MP.id,by,w:MP.lastW};
    if(MP.host) registerDeath(m); else send(m);
    const b=MP.players[by]; dth.innerHTML="ÉLIMINÉ"+(b?" PAR <b>"+b.name.replace(/</g,"&lt;")+"</b>":"")+"<small>"+(MP.mode==="br"?"Tu es éliminé. Attends la fin du match.":"Retour dans 3 secondes…")+"</small>"; dth.style.display="flex";
    if(document.pointerLockElement) document.exitPointerLock();
    if(MP.mode!=="br") setTimeout(()=>{ if(!MP.active||MP.over) return; MP.dead=false; dth.style.display="none"; spawnMe(false); if(!isMobile) try{ renderer.domElement.requestPointerLock(); }catch(e){} },((MP.set&&MP.set.resp)||3)*1000);
}
function registerDeath(m){      // hôte : compte les points
    const s=MP.scores; if(!s[m.id]) return; s[m.id].d++; const k=m.by!==undefined&&m.by!==m.id?s[m.by]:null; if(k) k.k++;
    const nm=i=>(MP.players[i]||{name:"?"}).name, txt=k?nm(m.by)+" a éliminé "+nm(m.id):nm(m.id)+" s'est éliminé";
    if(MP.alive) MP.alive.delete(m.id); bcast({t:"sc",s,feed:txt,al:MP.alive?[...MP.alive]:undefined}); news(txt); renderScore(); if(MP.mode==="br"&&MP.alive&&MP.alive.size<=1&&!MP.over){ const w=[...MP.alive][0]; const ww=w===undefined?m.by:w; bcast({t:"end",winner:ww}); endMatch(ww); return; }
    if(MP.mode==="tdm"){ const tk=[0,0]; Object.keys(MP.players).forEach(i=>{ tk[i%2]+=(s[i]||{k:0}).k; }); if(k&&tk[m.by%2]>=MP.limit){ bcast({t:"end",winner:m.by,team:m.by%2}); endMatch(m.by,m.by%2); } }
    else if(MP.mode!=="br"&&k&&k.k>=MP.limit){ bcast({t:"end",winner:m.by}); endMatch(m.by); }
}
function endMatch(w,tm){
    if(MP.over) return; MP.over=true; MP.dead=true; dth.style.display="none";
    const ids=Object.keys(MP.players).sort((a,b)=>((MP.scores[b]||{k:0}).k)-((MP.scores[a]||{k:0}).k));
    dth.innerHTML="🏆 "+(tm!==undefined?"ÉQUIPE "+(tm===0?"BLEUE":"ROUGE"):(MP.players[w]?MP.players[w].name.replace(/</g,"&lt;"):"?"))+" GAGNE !<small>"+ids.map(i=>MP.players[i].name.replace(/</g,"&lt;")+" : "+(MP.scores[i]?MP.scores[i].k:0)+" éliminations").join("<br>")+"</small><button class=\"actionBtn\" id=\"mpBack\">Retour au salon</button>";
    dth.style.display="flex"; if(document.pointerLockElement) document.exitPointerLock();
    window.mpReward&&mpReward(tm!==undefined&&MP.id%2===tm?MP.id:w); $("mpBack").onclick=()=>{ leave(); goToLobby(); };
}

/* ---------- BOTS du multijoueur (simulés par l'hôte, vus par tous comme des joueurs) ---------- */
const BL={facile:{acc:.35,spd:3.2,cd:1.1,hp:80,dmg:7},normal:{acc:.5,spd:3.8,cd:.8,hp:100,dmg:9},difficile:{acc:.68,spd:4.4,cd:.6,hp:110,dmg:10},expert:{acc:.85,spd:5,cd:.45,hp:120,dmg:12}};
function addBots(n,lvl){
    Object.keys(MP.players).map(Number).filter(i=>i>=100).forEach(i=>{ delete MP.players[i]; bcast({t:"leave",id:i}); });
    MP.botLvl=lvl||"normal"; MP.botS={};
    for(let i=0;i<n;i++){ const id=100+i, p={id,name:"Bot "+(i+1),skin:{body:0x7c3aed,back:0x2e1065,leg:0x1e1b4b},bot:true}; MP.players[id]=p; bcast({t:"join",p}); }
    refreshList();
}
function botSpawn(){   // point d'apparition le plus éloigné des joueurs
    const scl=(MODES[MP.map||"ville"].boundary-4)/44; let best=[0,0], bd=-1;
    SPAWNS.forEach(p=>{ const x=p[0]*scl, z=p[1]*scl; let d=Math.hypot(x-player.position.x,z-player.position.z); for(const k in AV) d=Math.min(d,Math.hypot(x-AV[k].position.x,z-AV[k].position.z)); d+=Math.random()*12; if(d>bd){ bd=d; best=[x,z]; } });
    let [x,z]=best; for(let i=0;i<8&&collidesWithBuilding(x,z,1.4);i++){ x-=Math.sign(x)*3; z-=Math.sign(z)*3; } return [x,z];
}
function initBots(){
    MP.botS={}; const c=BL[MP.botLvl||"normal"];
    Object.keys(MP.players).map(Number).filter(i=>i>=100).forEach(id=>{ const [x,z]=botSpawn(); MP.botS[id]={id,position:{x,y:getGroundHeight(x,z),z},hp:c.hp,max:c.hp,yaw:0,cd:1+Math.random()*2,dead:false,resp:0,flee:0,fcd:0,hurt:0,jy:0,jv:0,jc:1+Math.random()*3,sd:1,st:0,burst:0}; });
    MP._bt=performance.now();
}
function sendBot(b){
    const m={t:"s",id:b.id,p:[+b.position.x.toFixed(2),+(b.position.y+b.jy).toFixed(2),+b.position.z.toFixed(2)],yw:+b.yaw.toFixed(3),pt:0,w:"ak",hp:Math.max(0,Math.round(b.hp)),d:b.dead?1:0};
    bcast(m); apply(m);
}
function botTick(){
    if(MP.over||!MP.botS) return; const now=performance.now(), dt=Math.min(.15,(now-(MP._bt||now))/1000); MP._bt=now; const c=BL[MP.botLvl||"normal"];
    for(const id in MP.botS){
        const b=MP.botS[id];
        if(b.dead){ b.resp-=dt; if(b.resp<=0&&MP.mode!=="br"){ const [x,z]=botSpawn(); b.position.x=x; b.position.z=z; b.hp=b.max; b.dead=false; b.hurt=0; b.fcd=0; b.flee=0; if(MP.alive) MP.alive.add(b.id); } sendBot(b); continue; }
        // cibles possibles : joueurs vivants (en équipes : seulement l'équipe adverse)
        const cand=[]; if(!MP.dead) cand.push({id:MP.id,x:player.position.x,y:player.position.y,z:player.position.z});
        for(const k in AV){ const u=AV[k].userData; if(Number(k)<100&&u.alive) cand.push({id:Number(k),x:AV[k].position.x,y:AV[k].position.y,z:AV[k].position.z}); }
        let tg=null, td=1e9; for(const t of cand){ if(MP.mode==="tdm"&&t.id%2===b.id%2) continue; const d=Math.hypot(t.x-b.position.x,t.z-b.position.z); if(d<td){ td=d; tg=t; } }
        b.fcd=Math.max(0,b.fcd-dt); b.hurt=Math.max(0,b.hurt-dt*b.max*.1);
        if(b.jy>0){ b.jv-=24*dt; b.jy+=b.jv*dt; if(b.jy<=0){ b.jy=0; b.jv=0; } }
        b.jc-=dt; if(b.jc<=0){ if(!b.jy&&tg&&td<35&&Math.random()<.4){ b.jv=6.8; b.jy=.01; } b.jc=1.5+Math.random()*2.5; }   // saute
        if(tg){
            const dx=tg.x-b.position.x, dz=tg.z-b.position.z, d=Math.hypot(dx,dz)||1, fl=b.flee>0; b.yaw=Math.atan2(-dx,-dz);
            let mx, mz;
            if(fl){ b.flee-=dt; mx=-dx/d-dz/d*b.sd*.6; mz=-dz/d+dx/d*b.sd*.6; }                                  // fuit en zigzag
            else{ const fw=d>17?1:(d<10?-.7:0); b.st-=dt; if(b.st<=0){ b.sd=Math.random()<.5?-1:1; b.st=1+Math.random()*1.6; } mx=dx/d*fw-dz/d*b.sd*.8; mz=dz/d*fw+dx/d*b.sd*.8; }
            const l=Math.hypot(mx,mz)||1, sp=c.spd*(fl?1.5:1); moveCharacter(b,mx/l*sp*dt,mz/l*sp*dt); b.position.y=getGroundHeight(b.position.x,b.position.z);
            b.cd-=dt;
            if(!fl&&b.cd<=0&&d<50){
                const o=new V(b.position.x,b.position.y+1.4,b.position.z), to=new V(tg.x,tg.y+1.2,tg.z);
                if(!C.seg(o.clone(),to.clone(),.1,.7)){
                    const hit=Math.random()<clampN(c.acc*(1-d/70),.08,.9), dir=to.clone().sub(o).normalize();
                    if(!hit){ dir.x+=(Math.random()-.5)*.12; dir.y+=(Math.random()-.5)*.08; dir.z+=(Math.random()-.5)*.12; dir.normalize(); }
                    const f={t:"f",id:b.id,o:[o.x,o.y,o.z],d:[dir.x,dir.y,dir.z]}; bcast(f); remoteFire(f);
                    if(hit) toPlayer(tg.id,{t:"h",to:tg.id,from:b.id,dmg:Math.round(c.dmg*((MP.set&&MP.set.dmg)||1)),w:"ak"});
                    b.burst=(b.burst+1)%3; b.cd=b.burst?.15:c.cd*(.9+Math.random()*.5);
                } else b.cd=.3;
            }
        }
        sendBot(b);
    }
}
const clampN=(x,a,b)=>Math.max(a,Math.min(b,x));
function botHit(m){   // un joueur touche un bot (traité par l'hôte)
    const b=MP.botS&&MP.botS[m.to]; if(!b||b.dead||MP.over) return;
    b.hp-=m.dmg; b.hurt+=m.dmg;
    if(b.hp<=0){ b.dead=true; b.resp=(MP.set&&MP.set.resp)||3; registerDeath({id:b.id,by:m.from}); sendBot(b); return; }
    if(!b.fcd&&(b.hurt>b.max*.45||b.hp<b.max*.25)){ b.flee=2.2+Math.random()*2; b.fcd=7; b.hurt=0; b.sd=Math.random()<.5?-1:1; }   // trop attaqué : il fuit
}

/* ---------- Avatars des autres joueurs ---------- */
function drawTag(a){
    const u=a.userData, cv=u.cv, x=cv.getContext("2d"); x.clearRect(0,0,256,64);
    x.fillStyle=MP.mode==="tdm"?(u.pid%2?"rgba(170,30,30,.8)":"rgba(30,80,200,.8)"):"rgba(0,0,0,.55)"; x.fillRect(0,0,256,64); x.fillStyle="#fff"; x.font="bold 26px Arial"; x.textAlign="center"; x.fillText(u.name,128,28);
    x.fillStyle="#333"; x.fillRect(16,40,224,12); const r=Math.max(0,Math.min(1,u.hp/100)); x.fillStyle=r>.5?"#22c55e":r>.25?"#f59e0b":"#ef4444"; x.fillRect(16,40,224*r,12);
    u.tex.needsUpdate=true; u.shownHp=u.hp;
}
function makeAvatar(p){
    const sk=p.skin||{}, a=createFighter(MP.mode==="tdm"?(p.id%2===0?0x2563eb:0xdc2626):(sk.body||0x168cff),{backColor:sk.back,legColor:sk.leg});
    const cv=document.createElement("canvas"); cv.width=256; cv.height=64; const tex=new THREE.CanvasTexture(cv);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true})); sp.scale.set(1.8,.45,1); sp.position.y=2.7; sp.raycast=()=>{}; sp.renderOrder=10; a.add(sp);
    a.userData=Object.assign(a.userData,{remote:true,pid:p.id,name:p.name,alive:true,hp:100,maxHP:100,cv,tex,pitch:0,yaw:0,tp:null,init:false,w:null,moving:false});
    a.position.set(0,-80,0); scene.add(a); AV[p.id]=a; drawTag(a);
}
function removeAvatar(id){ const a=AV[id]; if(a){ scene.remove(a); delete AV[id]; } }
function clearAvatars(){ Object.keys(AV).forEach(removeAvatar); }
function setGun(a,key){
    const u=a.userData; if(u.gun){ u.gun.parent&&u.gun.parent.remove(u.gun); u.gun=null; } if(!key||!C3x.build) return;
    const g=C3x.build(key,"std"), armR=u.limbs.armR, ha=armR.getObjectByName("hand_anchor"); g.scale.setScalar(1.5); g.rotation.x=-Math.PI/2;
    g.position.copy(ha?ha.position:new V(0,-.48,0)); armR.add(g); u.gun=g; u.two=C3x.two?C3x.two(key):false;
}
function apply(m){
    if(m.t==="f"){ remoteFire(m); return; }
    const a=AV[m.id]; if(!a) return; const u=a.userData;
    u.tp=m.p; u.yaw=m.yw; u.pitch=m.pt; u.hp=m.hp; u.alive=!m.d; if(m.w!==u.w){ u.w=m.w; setGun(a,m.w); }
    if(!u.init){ a.position.set(m.p[0],m.p[1],m.p[2]); u.init=true; }
}
function remoteFire(m){
    const o=new V(...m.o), d=new V(...m.d).normalize(); S.enemyShot(o); C.burst(o.clone().addScaledVector(d,.5),0xffd27a,5,3,.06,.15,0);
    let len=70; for(let t=1;t<=70;t+=.7){ if(C.pt(o.x+d.x*t,o.y+d.y*t,o.z+d.z*t,.1)){ len=t; break; } }
    const end=o.clone().addScaledVector(d,len), mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffe9a0,transparent:true,opacity:.8}));
    mesh.scale.set(.03,.03,len); mesh.position.copy(o).add(end).multiplyScalar(.5); mesh.lookAt(end); scene.add(mesh); setTimeout(()=>{ scene.remove(mesh); mesh.material.dispose(); },80);
}
MP.api={bcast,endMatch}; const _fire=C3x.fire; C3x.fire=function(w){ _fire(w); if(MP.active&&!MP.dead){ const d=new V(); camera.getWorldDirection(d); send({t:"f",id:MP.id,o:[camera.position.x,camera.position.y,camera.position.z],d:[d.x,d.y,d.z]}); } };

/* ---------- Hooks ---------- */
const _gt=getTargetUnderCrosshair;
getTargetUnderCrosshair=function(){
    const best=_gt(); if(!MP.active) return best;
    let bd=Infinity, ba=null;
    for(const id in AV){ const a=AV[id]; if(!a.userData.alive) continue; const h=raycaster.intersectObjects(a.children,true); if(h.length){ const d=raycaster.ray.origin.distanceTo(h[0].point); if(d<bd){ bd=d; ba=a; } } }
    if(!ba) return best;
    const t=ba.position.clone(); t.y+=1.1; if(C.seg(raycaster.ray.origin.clone(),t,.08,.7)) return best;
    if(best&&raycaster.ray.origin.distanceTo(best.position)<bd) return best;
    return ba;
};
const _de=damageEnemy;
damageEnemy=function(e,dmg){
    if(e&&e.userData&&e.userData.remote){
        if(MP.dead||MP.over||!e.userData.alive) return;
        if(MP.mode==="tdm"&&e.userData.pid%2===MP.id%2) return;   // pas de tir allié
        const m={t:"h",to:e.userData.pid,from:MP.id,dmg:Math.round(dmg*((MP.set&&MP.set.dmg)||1)),w:wkey()};
        if(MP.host) toPlayer(m.to,m); else send(m);
        const p=e.position.clone(); p.y+=1.2; C.burst(p,0xff3b2f,8,5,.09,.45); S.hit();
        const cr=$("crosshair"); cr.classList.add("hit"); setTimeout(()=>cr.classList.remove("hit"),130); return;
    }
    return _de(e,dmg);
};
const _eg=endGame; endGame=function(w){ if(MP.active){ if(!w) onDeath(); return; } _eg(w); };
const _at=attack; attack=function(){ if(MP.active&&(MP.dead||MP.over)) return; _at(); };
const _gl=goToLobby; goToLobby=function(){ if(MP.active||MP.peer) leave(); _gl(); };

const clk=new THREE.Clock(), _r=renderer.render;
renderer.render=function(s,c){
    const dt=Math.min(clk.getDelta(),.05);
    if(MP.active&&!paused){
        for(const id in AV){
            const a=AV[id], u=a.userData; if(!u.tp) continue;
            const k=1-Math.exp(-14*dt), dx=u.tp[0]-a.position.x, dz=u.tp[2]-a.position.z;
            u.moving=Math.hypot(dx,dz)>.03; a.position.x+=dx*k; a.position.y+=(u.tp[1]-a.position.y)*k; a.position.z+=dz*k;
            let dy=(u.yaw+Math.PI)-a.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); a.rotation.y+=dy*k;
            a.visible=u.alive; animateLimbs(a,dt,u.moving);
            const L=u.limbs; if(u.gun){ L.armR.rotation.x=-(Math.PI/2+u.pitch*.9); if(u.two){ L.armL.rotation.x=-(Math.PI/2+u.pitch*.9)+.1; L.armL.rotation.y=.4; } else L.armL.rotation.y=0; }
            if(u.shownHp!==u.hp) drawTag(a);
        }
    }
    _r.call(this,s,c);
};
})();

/* ===== jeu-08 ===== */
/* ===== COMBAT 3D — MODES GRAPHIQUES, PARAMÈTRES, PERFORMANCES ===== */
(()=>{
const $=id=>document.getElementById(id), C=window.C3, S=C.S, G=window.GFX, V=THREE.Vector3;
const SH=[THREE.PCFShadowMap,THREE.PCFShadowMap,THREE.PCFShadowMap,THREE.PCFSoftShadowMap];
const fpsEl=document.createElement("div"); fpsEl.id="fps"; document.body.appendChild(fpsEl);

/* ---------- Application des réglages (en direct) ---------- */
function apply(){
    const P=G.P();
    renderer.setPixelRatio(G.pr());
    sun.castShadow=P.sh>0; sun.shadow.mapSize.set(P.shs,P.shs); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; }
    if(renderer.shadowMap.type!==SH[P.sh]){ renderer.shadowMap.type=SH[P.sh]; scene.traverse(o=>{ if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ m.needsUpdate=true; }); }); }
    renderer.toneMapping=P.tone?THREE.ACESFilmicToneMapping:THREE.NoToneMapping; renderer.toneMappingExposure=1.05;
    scene.fog.far=Math.max(60,Math.min(140,P.dist+15));
    C.flash.visible=!!P.flash; if(window.FARGROUP) FARGROUP.visible=!!P.far;
    BASE_FOV=G.fov; if(!aiming){ camera.fov=BASE_FOV; camera.updateProjectionMatrix(); }
    C.setVol(); fpsEl.style.display=G.showFps?"block":"none";
}

/* ---------- Test de vision des ennemis, sans lancer de rayons sur tous les objets ---------- */
window.fastLOS=function(e,dist){
    const u=e.userData, now=performance.now(); if(u._lt&&now<u._lt) return u._lv; u._lt=now+180+Math.random()*120;
    const ex=e.position.x, ey=e.position.y+1.1, ez=e.position.z, px=player.position.x, py=player.position.y+1.3, pz=player.position.z, n=Math.max(2,Math.ceil(dist/1.2));
    for(let i=1;i<n;i++){ const t=i/n; if(C.pt(ex+(px-ex)*t,ey+(py-ey)*t,ez+(pz-ez)*t,.12)) return u._lv=false; }
    return u._lv=true;
};

/* ---------- Affichage limité à la distance choisie + ombres des objets proches uniquement ---------- */
let ct=0;
function cull(dt){
    ct-=dt; if(ct>0) return; ct=.3;
    const P=G.P(), D2=P.dist*P.dist, cx=camera.position.x, cz=camera.position.z;
    for(const o of levelGroup.children){
        if(o.userData&&o.userData.keep) continue; if(o.isMesh&&o.geometry&&o.geometry.parameters&&(o.geometry.parameters.width||0)>=30) continue;     // terrain
        const dx=o.position.x-cx, dz=o.position.z-cz, d2=dx*dx+dz*dz, vis=d2<D2;
        if(o.visible!==vis) o.visible=vis;
        if(P.sh>0&&vis){ const near=d2<2500; if(o.userData._near!==near){ o.userData._near=near; o.traverse(m=>{ if(m.isMesh&&m.userData._cs!==false){ if(m.userData._cs===undefined) m.userData._cs=m.castShadow; m.castShadow=near&&m.userData._cs; } }); } }
    }
}

/* ---------- Qualité automatique + compteur de FPS ---------- */
let last=performance.now(), acc=0, n=0, good=0, sa=0, sn=0, grace=3;
const idx=()=>G.ORDER.indexOf(G.cur);
function note(t){ const e=document.createElement("div"); e.className="dn big"; e.textContent=t; e.style.top="12%"; e.style.color="#7dd3fc"; document.body.appendChild(e); setTimeout(()=>e.remove(),1500); }
function autoStep(fps){
    if(fps<30){
        good=0;
        if(G.scale>.6){ G.scale=Math.max(.55,+(G.scale*.8).toFixed(2)); note("Résolution réduite ("+Math.round(G.pr()*100)+"%)"); }
        else if(idx()>0){ G.cur=G.ORDER[idx()-1]; G.scale=1; note("Qualité réduite : "+G.P().n); }
        else return;
    } else if(fps>58){
        if(++good<4) return; good=0;
        if(G.scale<1) G.scale=Math.min(1,+(G.scale*1.15).toFixed(2)); else if(idx()<G.ORDER.indexOf("high")){ G.cur=G.ORDER[idx()+1]; note("Qualité augmentée : "+G.P().n); } else return;
    } else { good=0; return; }
    apply(); G.save(); sync();
}
const _r=renderer.render;
renderer.render=function(s,c){
    const now=performance.now(), dt=(now-last)/1000; last=now;
    if(dt<2&&!document.hidden){ sa+=dt; sn++; if(grace>0){ grace-=dt; acc=0; n=0; } else { acc+=dt; n++; } }
    if(sa>=.5){ fpsEl.textContent="FPS "+Math.round(sn/sa)+" · "+G.P().n+(G.q==="auto"?" (auto)":"")+" · "+Math.round(G.pr()*100)+"%"; sa=0; sn=0; }
    if(acc>=1.2){ const fps=n/acc; acc=0; n=0; if(G.q==="auto"&&!paused&&$("gfxPanel").style.display!=="flex") autoStep(fps); }
    if(!paused) cull(dt);
    if(!G.P().clouds) C.clouds.visible=false;
    _r.call(this,s,c);
};
const _sm=startMode; startMode=function(k){ _sm(k); grace=3; ct=0; };
const _gl=goToLobby; goToLobby=function(){ _gl(); grace=3; ct=0; };

/* ---------- Panneau Paramètres ---------- */
const pn=document.createElement("div"); pn.id="gfxPanel"; pn.className="ovl";
pn.innerHTML=`<div class="shTop"><div class="shTitle">⚙ PARAMÈTRES</div><button class="actionBtn secondary" id="gxClose" style="min-width:90px;padding:10px 16px">Fermer</button></div>
<div class="gxBox"><h4>Graphismes</h4>
<label>Mode graphique<select id="gxQ"><option value="auto">Auto (recommandé)</option><option value="min">Très bas</option><option value="low">Bas</option><option value="med">Moyen</option><option value="high">Élevé</option><option value="ultra">Ultra</option></select></label>
<div class="gxNote" id="gxInfo"></div>
<details><summary>Réglages avancés</summary>
<label>Résolution du rendu <input type="range" id="gxRes" min="40" max="100" step="5"><span id="gxResV"></span></label>
<label>Ombres<select id="gxSh"><option value="0">Désactivées</option><option value="1">Moyennes</option><option value="2">Hautes</option><option value="3">Très hautes (douces)</option></select></label>
<label>Distance d'affichage <input type="range" id="gxDist" min="50" max="220" step="10"><span id="gxDistV"></span></label>
<label>Particules <input type="range" id="gxFx" min="0" max="400" step="20"><span id="gxFxV"></span></label>
<label><input type="checkbox" id="gxAA"> Anti-crénelage (après rechargement de la page)</label>
<label><input type="checkbox" id="gxTone"> Couleurs « cinéma »</label>
<label><input type="checkbox" id="gxCl"> Nuages</label><label><input type="checkbox" id="gxFar"> Décor lointain</label></details>
<h4>Jeu</h4>
<label>Champ de vision <input type="range" id="gxFov" min="60" max="110" step="1"><span id="gxFovV"></span></label>
<label>Sensibilité de la souris <input type="range" id="gxSens" min="0.3" max="2.5" step="0.05"><span id="gxSensV"></span></label>
<label>Volume <input type="range" id="gxVol" min="0" max="100" step="5"><span id="gxVolV"></span></label>
<label><input type="checkbox" id="gxFps"> Afficher les FPS (touche F3)</label>
<div class="gxNote">Astuce : en mode Auto, le jeu baisse tout seul la résolution puis la qualité si ça rame, et la remonte si ton ordinateur est assez puissant.</div></div>`;
document.body.appendChild(pn);
const bind=(id,ev,fn)=>{ $(id).addEventListener(ev,fn); };
function sync(){
    const P=G.P(); $("gxQ").value=G.q; $("gxInfo").textContent="Qualité actuelle : "+P.n+" · résolution "+Math.round(G.pr()*100)+"%";
    $("gxRes").value=Math.round(G.scale*100); $("gxResV").textContent=Math.round(G.scale*100)+"%"; $("gxSh").value=P.sh;
    $("gxDist").value=P.dist; $("gxDistV").textContent=P.dist+" m"; $("gxFx").value=P.fx; $("gxFxV").textContent=P.fx;
    $("gxAA").checked=!!P.aa; $("gxTone").checked=!!P.tone; $("gxCl").checked=!!P.clouds; $("gxFar").checked=!!P.far;
    $("gxFov").value=G.fov; $("gxFovV").textContent=G.fov+"°"; $("gxSens").value=G.sens; $("gxSensV").textContent="×"+(+G.sens).toFixed(2);
    $("gxVol").value=Math.round(G.vol*100); $("gxVolV").textContent=Math.round(G.vol*100)+"%"; $("gxFps").checked=G.showFps;
}
function manual(){ if(G.q==="auto") G.q=G.cur; }
bind("gxQ","change",e=>{ const v=e.target.value; G.q=v; G.ov={}; G.scale=1; if(v!=="auto") G.cur=v; apply(); G.save(); sync(); });
bind("gxRes","input",e=>{ manual(); G.scale=e.target.value/100; apply(); G.save(); sync(); });
bind("gxSh","change",e=>{ manual(); const v=+e.target.value; G.ov.sh=v; G.ov.shs=[512,1024,2048,2048][v]; apply(); G.save(); sync(); });
bind("gxDist","input",e=>{ manual(); G.ov.dist=+e.target.value; apply(); G.save(); sync(); });
bind("gxFx","input",e=>{ manual(); G.ov.fx=+e.target.value; G.ov.trail=+e.target.value>=150?1:0; apply(); G.save(); sync(); });
bind("gxAA","change",e=>{ G.ov.aa=e.target.checked?1:0; G.save(); note("Recharge la page pour appliquer"); });
bind("gxTone","change",e=>{ manual(); G.ov.tone=e.target.checked?1:0; apply(); G.save(); });
bind("gxCl","change",e=>{ G.ov.clouds=e.target.checked?1:0; apply(); G.save(); });
bind("gxFar","change",e=>{ G.ov.far=e.target.checked?1:0; apply(); G.save(); });
bind("gxFov","input",e=>{ G.fov=+e.target.value; apply(); G.save(); sync(); });
bind("gxSens","input",e=>{ G.sens=+e.target.value; G.save(); sync(); });
bind("gxVol","input",e=>{ G.vol=e.target.value/100; C.setVol(); G.save(); sync(); });
bind("gxFps","change",e=>{ G.showFps=e.target.checked; apply(); G.save(); });
function open(){ if(state==="playing"&&!paused&&!gameFinished) pauseGame(); sync(); pn.style.display="flex"; }
$("gxClose").onclick=()=>{ pn.style.display="none"; };
const tabs=document.querySelector(".lbTabs"), tb=document.createElement("button"); tb.textContent="PARAMÈTRES"; tabs.appendChild(tb); tb.onclick=open;
const pa=document.querySelector("#pauseMenu .actions"); if(pa){ const b=document.createElement("button"); b.className="actionBtn secondary"; b.textContent="⚙ Paramètres"; b.onclick=open; pa.appendChild(b); }
document.addEventListener("keydown",e=>{
    if(e.key==="F2"){ e.preventDefault(); open(); }
    if(e.key==="F3"){ e.preventDefault(); G.showFps=!G.showFps; apply(); G.save(); }
});
apply();
})();

/* ===== jeu-09 ===== */
/* ===== COMBAT 3D v2 : manette, admin à code, décor étendu, Battle Royale, style jeu de combat ===== */
(()=>{
const $=id=>document.getElementById(id), S=C3.S, rnd=(a,b)=>a+Math.random()*(b-a);
const ADMIN_CODE="1234"; // <<< CHANGE TON CODE ADMIN ICI

/* ---------- CSS : habillage « jeu de combat » ---------- */
const st=document.createElement("style");
st.textContent=`
body,button,input,select{font-family:Impact,"Arial Black",Arial,sans-serif}
#lobby::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(115deg,rgba(255,40,40,.22),transparent 38%,transparent 62%,rgba(40,120,255,.22)),radial-gradient(ellipse at 50% 120%,rgba(0,0,0,.85),transparent 60%)}
#lbBar{background:linear-gradient(180deg,#05060f,rgba(5,6,15,.55));border-bottom:3px solid #ffb703;box-shadow:0 4px 0 #b91c1c}
.lbLogo{font-style:italic;text-shadow:3px 3px 0 #b91c1c,0 0 18px #ffb703}
.lbTabs button{font-style:italic;clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);border-bottom:0;background:rgba(255,255,255,.06);margin-right:-6px}
.lbTabs button.on,.lbTabs button:hover{background:linear-gradient(#ffe45c,#ff9f0a);color:#14100a}
.tile{border:0;border-left:7px solid #ef4444;border-radius:0;transform:none;clip-path:polygon(0 0,100% 0,calc(100% - 16px) 100%,0 100%);background:linear-gradient(110deg,#1c2036,#090b16);transition:.15s;position:relative;overflow:hidden}
.tile>*{transform:none}.tile:hover{transform:translateX(6px);border-left-color:#ffd166}
.tile::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.18),transparent);transform:skewX(-20deg);transition:.5s}.tile:hover::after{left:130%}
.tile.on{background:linear-gradient(110deg,#ffd23f,#ff7a00);border-left-color:#fff;color:#14100a;transform:translateX(10px)}
#playBtn{clip-path:polygon(22px 0,100% 0,calc(100% - 22px) 100%,0 100%);border-radius:0;transform:none;background:linear-gradient(#ff5a3c,#b91c1c);color:#fff;font-style:italic;text-shadow:2px 2px 0 #000;box-shadow:none;animation:pb 1.4s ease-in-out infinite}
#playBtn:hover{filter:brightness(1.2);transform:scale(1.05)}#playBtn:active{transform:scale(.97)}
@keyframes pb{50%{filter:drop-shadow(0 0 14px #ff5a3c)}}
.hudPanel{border-radius:0;clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%);border-left:4px solid #ffb703;background:linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.5))}
.bar{border-radius:0;transform:skewX(-18deg);border:1px solid #fff4}.bar div{border-radius:0}
.actionBtn{border-radius:0;clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);font-style:italic;letter-spacing:1px}
#pauseMenu,#gameOver{background:radial-gradient(circle,rgba(20,0,0,.7),rgba(0,0,0,.92))}
.statLine{font-style:italic;font-size:30px!important;text-shadow:3px 3px 0 #b91c1c}
.slot{border-radius:0;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)}
#missions{left:auto;right:26px;top:92px;width:270px;border-radius:0;border:0;border-right:5px solid #ffb703;clip-path:polygon(0 0,100% 0,100% 100%,14px 100%);background:linear-gradient(270deg,rgba(0,0,0,.85),rgba(8,10,28,.6))}
#pauseMissions{margin-top:22px;width:min(330px,90vw);text-align:left;background:rgba(0,0,0,.55);border-right:5px solid #ffb703;padding:10px 14px}
@media(max-width:900px){#missions{display:none}}
#adminGate{display:none;position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.75);align-items:center;justify-content:center}
.agBox{background:#10131f;border:2px solid #ef4444;padding:22px 28px;display:flex;flex-direction:column;gap:12px;color:#fff;text-align:center}
.agBox input{font:900 24px Arial;text-align:center;letter-spacing:8px;background:#05060f;color:#ffd166;border:1px solid #444;padding:8px}#agMsg{color:#fca5a5;min-height:18px;font:14px Arial}
body.pad #lockMessage{display:none!important}
#padPanel{z-index:96}#padPanel .gxBox{max-width:640px;margin:8px auto;background:rgba(10,12,30,.85);border:2px solid #ffffff22;padding:16px 20px;display:flex;flex-direction:column;gap:8px;width:100%}
.pdRow{display:flex;justify-content:space-between;align-items:center;font-weight:bold}.pdRow button{min-width:120px;background:#1f2547;color:#ffd166;border:1px solid #3b4270;padding:7px;cursor:pointer}.pdRow button.on{background:#ffd166;color:#000}
`;
document.head.appendChild(st);

/* ---------- Panneau admin protégé par code (touche A) ---------- */
const am=document.createElement("div"); am.id="adminGate";
am.innerHTML='<div class="agBox"><b>ACCÈS ADMIN</b><input id="agIn" type="password" inputmode="numeric" autocomplete="off" placeholder="Code"><div id="agMsg"></div></div>';
document.body.appendChild(am);
const agIn=$("agIn");
agIn.addEventListener("keydown",e=>{
    e.stopPropagation();
    if(e.key==="Escape") am.style.display="none";
    if(e.key==="Enter"){
        if(agIn.value===ADMIN_CODE){ am.style.display="none"; $("adCoins").textContent=coins; $("admin").style.display="block"; }
        else $("agMsg").textContent="Code incorrect";
        agIn.value="";
    }
});
am.addEventListener("click",e=>{ if(e.target===am) am.style.display="none"; });
window.askAdmin=()=>{ am.style.display="flex"; $("agMsg").textContent=""; agIn.value=""; setTimeout(()=>agIn.focus(),30); };

/* ---------- Missions visibles en pause ---------- */
const pm=document.createElement("div"); pm.id="pauseMissions"; $("pauseMenu").appendChild(pm);
const _pg=pauseGame; pauseGame=function(){ _pg(); pm.innerHTML=$("missions").innerHTML; };

/* ---------- Duel : plus de blocage au départ + anti-coincé ---------- */
const _sm=startMode; startMode=function(k){ _sm(k); if(k==="duel") player.position.set(0,0,12.5); };
function unstick(){
    const p=player.position; if(!collidesWithBuilding(p.x,p.z,.65)) return;
    for(let r=.4;r<6;r+=.4) for(let i=0;i<16;i++){ const a=i*Math.PI/8,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r; if(!collidesWithBuilding(x,z,.65)){ p.x=x; p.z=z; return; } }
}

/* ---------- Décor étendu derrière la barrière invisible ---------- */
function plane(g,size,col,y){ const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshStandardMaterial({color:col,roughness:1})); m.rotation.x=-Math.PI/2; m.position.y=y; m.receiveShadow=true; g.add(m); return m; }
function flat(o){ o.traverse(m=>{ if(m.isMesh) m.castShadow=false; }); return o; }
function place(g,o,x,y,z,ry,sc){ if(!o) return null; o.position.set(x,y,z); o.rotation.y=ry||0; if(sc) o.scale.setScalar(sc); g.add(flat(o)); return o; }
function skyline(g,r0,r1,n){
    const N=["immeuble_bleu","immeuble_beige","immeuble_haut"];
    for(let i=0;i<n;i++){ const a=Math.random()*6.283,r=rnd(r0,r1),m=C3M.make(N[i%3]); C3M.tint(m,"mat_mur",[0x9aa9b8,0xb9a98a,0x8f9aa8][i%3]); m.position.set(Math.cos(a)*r,0,Math.sin(a)*r); m.rotation.y=rnd(0,6.28); m.scale.set(rnd(1,1.5),rnd(1,1.6),rnd(1,1.5)); g.add(m); }
}
function box(c,w,h,d,x,y,z,em){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),em?new THREE.MeshBasicMaterial({color:c}):new THREE.MeshStandardMaterial({color:c,roughness:.9})); m.position.set(x,y,z); return m; }
function outer(k){
    const g=new THREE.Group(); levelGroup.add(g), g.userData.keep=true, B=MODES[k].boundary;
    if(k==="ville"){
        plane(g,360,0x3a4a2e,-.08); plane(g,2*B+4,0x34363c,-.03);
        [-1,1].forEach(s=>{
            const R=B+7;
            const h=box(0x24262b,2*R+120,.04,8,0,.02,s*R), v=box(0x24262b,8,.04,2*R+120,s*R,.02,0); g.add(h,v);
            for(let t=-R-55;t<R+55;t+=6){ g.add(box(0xf5f5f5,2.4,.05,.25,t,.05,s*R),box(0xf5f5f5,.25,.05,2.4,s*R,.05,t)); }
            for(let t=-R-50;t<=R+50;t+=14){ place(g,C3M.prop("lamp"),t,0,s*(R-5)); place(g,C3M.prop("lamp"),s*(R-5),0,t,Math.PI/2); }
            for(let i=0;i<0;i++){ const c=C3M.prop("car"); C3M.tint(c,"mat_carbody",[0xdc2626,0x2563eb,0xf59e0b,0x16a34a][i]); place(g,c,rnd(-R,R),0,s*(R+2.2),0); }
        });
        for(let i=0;i<10;i++){ const a=rnd(0,6.283), r=rnd(B-9,B-2), x=Math.cos(a)*r, z=Math.sin(a)*r; if(Math.max(Math.abs(x),Math.abs(z))<39) continue; [createCrate,()=>createBench(x,z,Math.floor(rnd(0,4))*Math.PI/2),()=>createTree(x,z)][i%3](x,z); }
        for(let i=0;i<40;i++){ const a=rnd(0,6.283), r=rnd(75,130); place(g,C3M.make("tree"),Math.cos(a)*r,-.08,Math.sin(a)*r,rnd(0,6.28),rnd(.9,1.5)); }
        skyline(g,65,115,28);
    } else if(k==="survie"){
        
        for(let i=0;i<70;i++){ const a=rnd(0,6.283), r=rnd(B+6,122), x=Math.cos(a)*r, z=Math.sin(a)*r; place(g,C3M.make(i%4?"tree":"bush"),x,getGroundHeight(x,z),z,rnd(0,6.28),rnd(.9,1.6)); }
        for(let i=0;i<8;i++){ const a=i*Math.PI/4, r=B+3; place(g,C3M.prop("brazier"),Math.cos(a)*r,getGroundHeight(Math.cos(a)*r,Math.sin(a)*r),Math.sin(a)*r); }
        for(let i=0;i<6;i++){ const x=rnd(-30,30), z=rnd(-30,30); if(Math.hypot(x,z)<14||collidesWithBuilding(x,z,2)) continue; i%2?createCrate(x,z):createBench(x,z,Math.floor(rnd(0,4))*Math.PI/2); }
    } else if(k==="duel"){
        plane(g,260,0x140609,-.06);
        for(let i=0;i<12;i++){ const a=i*Math.PI/6+.26; place(g,C3M.prop("pillar"),Math.cos(a)*27,0,Math.sin(a)*27,0,1.1); }
        for(let i=0;i<16;i++){ const a=i*Math.PI/8; place(g,C3M.prop("brazier"),Math.cos(a)*20,0,Math.sin(a)*20); }
    }
}
let B=0;
MODES.ville.boundary=48;
["ville","survie"].forEach(k=>{ const b=MODES[k].build; MODES[k].build=function(){ b.call(this); outer(k); }; });

/* ---------- Battle Royale : zone qui rétrécit + récompenses ---------- */
let zone=null, zt=0, zd=0, wasA=false;
function brFrame(dt){
    const on=window.MP&&MP.active&&MP.mode==="br"&&!MP.over;
    if(on&&!wasA){ zt=0; zone=new THREE.Mesh(new THREE.CylinderGeometry(1,1,40,64,1,true),new THREE.MeshBasicMaterial({color:0x7c3aed,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false})); zone.position.y=15; levelGroup.add(zone); }
    if(!on&&wasA) zone=null;
    wasA=!!on; if(!on||!zone) return;
    zt+=dt; const R0=MODES[MP.map||"ville"].boundary*1.3, R=Math.max(7,R0-zt*(R0-7)/((MP.set&&MP.set.zdur)||150)); zone.scale.set(R,1,R);
    if(!MP.dead&&Math.hypot(player.position.x,player.position.z)>R){ zd-=dt; if(zd<=0){ zd=1; MP.lastBy=undefined; hurtPlayer(5+zt/30); } }
}
window.mpReward=w=>{
    const me=(MP.scores[MP.id]||{k:0}).k, c=me*10+(w==MP.id?(MP.mode==="br"?150:75):15); addCoins(c);
    const s=document.querySelector("#mpDeath small"); if(s) s.insertAdjacentHTML("beforeend","<br><b>+"+c+" 🪙</b>");
    if(w==MP.id&&window.G&&G.ev) G.ev("win");
};

/* ---------- Manette ---------- */
const ACT=[["shoot","Tirer"],["aim","Viser"],["jump","Sauter"],["reload","Recharger"],["next","Arme suivante"],["prev","Arme précédente"],["heal","Gemme de soin"],["use","Ouvrir un coffre"],["sprint","Sprinter"],["crouch","S'accroupir"],["view","Changer de vue"],["pause","Pause"]];
const DEF={shoot:7,aim:6,jump:0,reload:2,next:5,prev:4,heal:3,use:1,sprint:10,crouch:11,view:8,pause:9};
const BN=["A","B","X","Y","LB","RB","LT","RT","Select","Start","L3 (clic stick G)","R3 (clic stick D)","Haut","Bas","Gauche","Droite"];
let cfg=Object.assign({sens:2.6,dead:.15,inv:false},JSON.parse(localStorage.getItem("c3d_pad")||"{}")); cfg.bind=Object.assign({},DEF,cfg.bind||{}); cfg.ax=Object.assign({lx:0,ly:1,rx:2,ry:3},cfg.ax||{});
const savePad=()=>localStorage.setItem("c3d_pad",JSON.stringify(cfg)); window.PADCFG=cfg; window.PADSAVE=()=>savePad();
let prev=[], padOn=false, learn=null, aimP=false, hpP=100; const pk={}, hs={};
const gp=()=>{ for(const p of (navigator.getGamepads?navigator.getGamepads():[])) if(p&&p.connected) return p; return null; };
const dz=v=>Math.abs(v)<cfg.dead?0:(v-Math.sign(v)*cfg.dead)/(1-cfg.dead);
const setK=(k,v)=>{ if(pk[k]!==v){ pk[k]=v; keys[k]=v; } };
const hold=(code,on)=>{ if(hs[code]!==on){ hs[code]=on; window.dispatchEvent(new KeyboardEvent(on?"keydown":"keyup",{code})); } };
const tap=key=>document.dispatchEvent(new KeyboardEvent("keydown",{key}));
function cycle(d){ const L=weaponOrder.length; let j=weaponOrder.findIndex(k=>weapons[k]===currentWeapon); for(let q=0;q<L;q++){ j=(j+d+L)%L; if(!window.G||!G.ok||G.ok(weaponOrder[j])) break; } currentWeapon=weapons[weaponOrder[j]]; updateWeaponHUD(); S.click(); }
function rumble(p,ms,s,w){ try{ p.vibrationActuator&&p.vibrationActuator.playEffect("dual-rumble",{duration:ms,strongMagnitude:s,weakMagnitude:w}); }catch(e){} }
function poll(dt){
    const p=gp();
    if(!p){ if(padOn){ padOn=false; window.PAD_ON=false; document.body.classList.remove("pad"); } return; }
    const now=p.buttons.map(b=>b.pressed);
    if(learn){ const i=now.findIndex((v,j)=>v&&!prev[j]); if(i>=0){ cfg.bind[learn]=i; learn=null; savePad(); renderPad(); } prev=now; return; }
    const act=a=>now[cfg.bind[a]], edge=a=>now[cfg.bind[a]]&&!prev[cfg.bind[a]], raw=i=>now[i]&&!prev[i];
    if(!padOn){ if(now.some(Boolean)||p.axes.some(a=>Math.abs(a)>.6)){ padOn=true; window.PAD_ON=true; document.body.classList.add("pad"); } prev=now; return; }
    const sw=/nintendo|057e|pro controller|joy-con/i.test(p.id), CF=sw?1:0, BK=sw?0:1; window.PADSW=sw;
    if(window.padMenu&&padMenu(raw,CF,BK)){}
    else if(state==="playing"&&!gameFinished&&!(window.MP&&(MP.dead||MP.over))){
        const AX=cfg.ax, lx=dz(p.axes[AX.lx]||0),ly=dz(p.axes[AX.ly]||0),rx=dz(p.axes[AX.rx]||0),ry=dz(p.axes[AX.ry]||0), sn=cfg.sens*(aiming?.45:1);
        setK("z",ly<-.3); setK("s",ly>.3); setK("q",lx<-.3); setK("d",lx>.3);
        cameraYaw-=rx*sn*dt*1.3; cameraPitch=Math.max(-1.45,Math.min(1.45,cameraPitch-(cfg.inv?-1:1)*ry*sn*dt));
        if(act("shoot")&&(currentWeapon.auto||edge("shoot"))){ const a0=currentWeapon.ammo; attack(); if(currentWeapon.ammo<a0) rumble(p,60,.3,.6); }
        const a=!!act("aim"); if(a!==aimP){ aimP=a; setAiming(a); }
        if(edge("jump")) jump(); if(edge("reload")) reload(); if(edge("next")) cycle(1); if(edge("prev")) cycle(-1);
        if(edge("heal")) tap("h"); if(edge("use")) tap("e"); if(edge("view")) toggleThirdPerson(); if(edge("pause")) pauseGame();
        hold("ShiftLeft",!!act("sprint")); hold("KeyC",!!act("crouch"));
        if(playerHP<hpP-.5) rumble(p,250,.9,.5);
    } else if(state==="playing"&&paused===false&&edge("pause")) pauseGame();
    hpP=playerHP; prev=now;
}
const pp=document.createElement("div"); pp.id="padPanel"; pp.className="ovl";
pp.innerHTML='<div class="shTop"><div class="shTitle">🎮 MANETTE</div><button class="actionBtn secondary" id="pdClose" style="min-width:90px;padding:10px 16px">Fermer</button></div><div class="gxBox"><div class="gxNote" id="pdInfo"></div><div id="pdList"></div><label>Sensibilité<input type="range" id="pdSens" min="1" max="6" step=".1"><span id="pdSensV"></span></label><label>Zone morte des sticks<input type="range" id="pdDz" min=".05" max=".4" step=".01"><span id="pdDzV"></span></label><label><input type="checkbox" id="pdInv"> Inverser l\'axe vertical</label><button class="actionBtn secondary" id="pdReset">Réinitialiser les touches</button><div class="gxNote">Stick gauche : déplacement · Stick droit : caméra. Dans le salon : ←/→ choisir le mode, A jouer, X boutique, Start paramètres.</div></div>';
document.body.appendChild(pp);
function renderPad(){
    const p=gp(); $("pdInfo").textContent=p?"Manette détectée : "+p.id:"Aucune manette détectée. Branche-la puis appuie sur un bouton.";
    $("pdList").innerHTML=ACT.map(([k,n])=>'<div class="pdRow"><span>'+n+'</span><button data-k="'+k+'" class="'+(learn===k?"on":"")+'">'+(learn===k?"Appuie sur un bouton…":BN[cfg.bind[k]]||"Bouton "+cfg.bind[k])+'</button></div>').join("");
    $("pdSens").value=cfg.sens; $("pdSensV").textContent=cfg.sens; $("pdDz").value=cfg.dead; $("pdDzV").textContent=cfg.dead; $("pdInv").checked=cfg.inv;
}
$("pdList").addEventListener("click",e=>{ const k=e.target.dataset&&e.target.dataset.k; if(k){ learn=k; renderPad(); } });
$("pdSens").oninput=e=>{ cfg.sens=+e.target.value; savePad(); renderPad(); }; $("pdDz").oninput=e=>{ cfg.dead=+e.target.value; savePad(); renderPad(); };
$("pdInv").onchange=e=>{ cfg.inv=e.target.checked; savePad(); }; $("pdReset").onclick=()=>{ cfg.bind=Object.assign({},DEF); savePad(); renderPad(); };
const openPad=()=>{ if(state==="playing"&&!paused) pauseGame(); renderPad(); pp.style.display="flex"; };
$("pdClose").onclick=()=>{ learn=null; pp.style.display="none"; };
const tb=document.createElement("button"); tb.textContent="MANETTE"; tb.onclick=openPad; document.querySelector(".lbTabs").appendChild(tb);
const pa=document.querySelector("#pauseMenu .actions"); if(pa){ const b=document.createElement("button"); b.className="actionBtn secondary"; b.textContent="🎮 Manette"; b.onclick=openPad; pa.appendChild(b); }
addEventListener("gamepadconnected",()=>{ if(pp.style.display==="flex") renderPad(); });

/* ---------- Boucle ---------- */
const clk=new THREE.Clock(), _r=renderer.render;
renderer.render=function(s,c){
    const dt=Math.min(clk.getDelta(),.05);
    poll(dt);
    if(state==="playing"&&!paused&&!gameFinished){ unstick(); brFrame(dt); }
    _r.call(this,s,c);
};
})();

/* ===== jeu-10 ===== */
/* ===== v5 : ville (modèles intégrés), immeubles pleins, terrain Survie, pseudos ===== */
(()=>{
const rnd=(a,b)=>a+Math.random()*(b-a), tint=(c,k)=>new THREE.Color(c).multiplyScalar(k).getHex();
const glowTex=makeTexture(64,(c,s)=>{ const r=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2); r.addColorStop(0,"rgba(255,225,150,.9)"); r.addColorStop(1,"rgba(255,225,150,0)"); c.fillStyle=r; c.fillRect(0,0,s,s); });
const _pp=C3M.prop; C3M.prop=n=>{ const o=_pp(n); if(n==="lamp") o.userData.lamp=1; return o; };


/* ----- ville : routes, parc, feux, sapins, mobilier (tous des modèles intégrés) ----- */
function city(){
    const g=new THREE.Group(); g.userData.keep=true; levelGroup.add(g);
    levelGroup.children.slice().forEach(o=>{ if(o.isMesh&&o.geometry.parameters&&o.geometry.parameters.width===.3&&o.geometry.parameters.height===2) levelGroup.remove(o); });
    g.add(C3M.make("routes_croisement"));
    [[12,12],[32,12],[40,14],[12,32],[32,32],[40,34],[14,42],[32,42],[44,28]].forEach(p=>createTree(p[0],p[1]));
    [[16,26],[28,16],[27,38],[42,24]].forEach(([x,z])=>{ const p=C3M.make("sapin"); p.position.set(x,.12,z); p.rotation.y=rnd(0,6.28); g.add(p); obstacles.push({x,z,width:.8,depth:.8,h:4}); });
    [[-8,-7,0],[8,7,Math.PI],[8,-7,-Math.PI/2],[-8,7,Math.PI/2]].forEach(([x,z,r])=>{ const t=C3M.make("feu_tricolore"); t.position.set(x,.12,z); t.rotation.y=r; g.add(t); });
const BINS=[[9.3,-12],[-9.3,-26],[9.3,-40],[-9.3,26],[14,-8.5],[-28,8.5],[-9.3,40]], HYD=[[-9.3,-14],[9.3,-30],[-9.3,14],[28,-8.5],[-14,8.5],[9.3,-44]];
    BINS.forEach(([x,z])=>{ const o=C3M.make("poubelle"); o.position.set(x,.12,z); g.add(o); }); HYD.forEach(([x,z])=>{ const o=C3M.make("borne_incendie"); o.position.set(x,.12,z); g.add(o); });
    levelGroup.children.filter(o=>o.userData.lamp).forEach(l=>{
        const d=new THREE.Mesh(new THREE.CircleGeometry(3.4,24),new THREE.MeshBasicMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.4})); d.rotation.x=-Math.PI/2; d.position.set(l.position.x,.15,l.position.z); levelGroup.add(d);
        const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); sp.scale.setScalar(1.8); sp.position.y=4.2; l.add(sp);
    });
}
const _b=MODES.ville.build; MODES.ville.build=function(){ _b.call(this); city(); };

/* ----- Survie : herbe par plaques sur le terrain à bosses ----- */
function grassify(m){
    const geo=m.geometry, pos=geo.attributes.position, col=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){
        const x=pos.getX(i), z=pos.getZ(i), n=Math.sin(x*.11+1.3)*Math.cos(z*.09)+Math.sin((x+z)*.05)*.8+Math.sin(x*.23)*Math.cos(z*.21)*.4, t=Math.min(1,Math.max(0,(n-.2)*2.2));
        col.set([1-.25*t,1+t,1-.3*t],i*3);
    }
    geo.setAttribute("color",new THREE.BufferAttribute(col,3)); m.material.vertexColors=true; m.material.needsUpdate=true;
}
const _sb=MODES.survie.build; MODES.survie.build=function(){ _sb.call(this); grassify(levelGroup.children[0]); };

/* ----- pseudos : visibles de près, jamais à travers un mur ni quand on est dans le dos du joueur ----- */
function tags(){
    if(!(window.MP&&MP.active)) return; const hv=new THREE.Vector3();
    for(const a of scene.children){
        if(!a.userData||!a.userData.remote) continue; const sp=a.children.find(c=>c.isSprite); if(!sp) continue;
        const dx=camera.position.x-a.position.x, dz=camera.position.z-a.position.z, d=Math.hypot(dx,dz)||1, front=(Math.sin(a.rotation.y)*dx+Math.cos(a.rotation.y)*dz)/d;
        hv.set(a.position.x,a.position.y+1.6,a.position.z);
        const ok=a.userData.alive&&d<24&&front>-.25&&!C3.seg(camera.position,hv,.08,.5);
        sp.material.depthTest=true; sp.material.opacity=ok?Math.min(1,(24-d)/8):0; sp.visible=sp.material.opacity>.02;
    }
}
const _r=renderer.render; renderer.render=function(s,c){ tags(); _r.call(this,s,c); };
})();

/* ===== jeu-11 ===== */
/* ===== v7 : barre d'onglets fixe, manette dans les menus (+ pastilles), axes réglables, paramètres hôte, comptes ===== */
(()=>{
const $=id=>document.getElementById(id);
/* ---------- ⚙ COMPTES : config à remplir ---------- */
const PLAYFAB_TITLE_ID="116F31";  // ← colle ici ton Title ID PlayFab (ex : "A1B2C")

/* ---------- Barre d'onglets toujours visible dans le salon ---------- */
const bar=$("lbBar"); document.body.appendChild(bar);
const st=document.createElement("style"); st.textContent=`
#lbBar{position:fixed!important;top:0;left:0;right:0;z-index:100}
.ovl,#shop{padding-top:84px!important}
#modeCards{margin-top:84px}#missions{top:104px!important}
.pbg{display:none;vertical-align:middle;margin:0 6px;flex:none}body.pad .pbg{display:inline-block}
#mpOpts{background:rgba(255,255,255,.05);padding:8px 12px}#mpOpts summary{cursor:pointer;font-weight:bold;color:#ffd166}#mpOpts select{background:#0b0e1c;color:#fff;border:1px solid #3b4270;padding:6px;font:bold 14px Arial}
#acPanel .gxBox{max-width:520px;margin:8px auto;background:rgba(10,12,30,.85);border:2px solid #ffffff22;padding:16px 20px;display:flex;flex-direction:column;gap:10px;width:100%}
#acPanel input{background:#0b0e1c;color:#fff;border:1px solid #3b4270;padding:9px;font:16px Arial}
`;
document.head.appendChild(st);
const tabs=()=>[...bar.querySelectorAll(".lbTabs button")];
function closeAll(){ if($("shop").style.display==="flex") $("shClose").onclick(); document.querySelectorAll(".ovl").forEach(e=>{ e.style.display="none"; }); }
bar.addEventListener("click",e=>{ const b=e.target.closest(".lbTabs button"); if(!b) return; closeAll(); tabs().forEach(x=>x.classList.toggle("on",x===b)); },true);
const cycleTab=d=>{ const t=tabs(), i=Math.max(0,t.findIndex(b=>b.classList.contains("on"))); t[(i+d+t.length)%t.length].click(); };

/* ---------- Pastilles SVG des boutons de manette ---------- */
const badge=t=>{ const w=t.length>1?30:22; return '<svg class="pbg" width="'+w+'" height="22" viewBox="0 0 '+w+' 22"><rect x="1" y="1" width="'+(w-2)+'" height="20" rx="'+(t.length>1?6:10)+'" fill="#ffd166" stroke="#000" stroke-opacity=".5"/><text x="'+w/2+'" y="15.5" text-anchor="middle" font-family="Arial" font-weight="900" font-size="12" fill="#111">'+t+'</text></svg>'; };
const hint=(el,t,first)=>{ if(el) el.insertAdjacentHTML(first?"afterbegin":"beforeend",badge(t)); };
const tb0=bar.querySelector(".lbTabs"); tb0.insertAdjacentHTML("afterbegin",badge("L")); tb0.insertAdjacentHTML("beforeend",badge("R"));
hint($("playBtn"),"A",1); hint($("modeLbl"),"✚"); hint($("btnResume"),"A",1); hint($("btnPauseLobby"),"B",1); hint($("btnRestart"),"A",1); hint($("btnLobby"),"B",1);
hint($("shBuy"),"A",1); hint($("mpStart"),"A",1); hint($("mpCreate"),"▲",1);
document.querySelectorAll(".shTop button").forEach(b=>hint(b,"B",1));

/* ---------- Navigation manette dans les menus (appelée par la boucle manette) ---------- */
window.padMenu=(raw,CF,BK)=>{
    const mse=$("modeSelect"); if(mse&&mse.style.display!=="none"){ const c=[...mse.querySelectorAll(".msCard")], i=c.findIndex(x=>x.classList.contains("on")); if(raw(14)||raw(15)||raw(4)||raw(5)) c.forEach((x,j)=>x.classList.toggle("on",j!==i)); if(raw(CF)) c.find(x=>x.classList.contains("on")).click(); return true; }
    const ovs=[...document.querySelectorAll(".ovl")].some(e=>e.style.display==="flex")||$("shop").style.display==="flex";
    if(state==="lobby"){
        if(raw(4)) cycleTab(-1); if(raw(5)) cycleTab(1);
        if(ovs){
            if(raw(BK)) tabs()[0].click();
            if($("shop").style.display==="flex"){ const c=[...document.querySelectorAll("#shop .skCard")], i=c.findIndex(x=>x.classList.contains("sel")); if(c.length){ if(raw(14)||raw(12)) c[(i+c.length-1)%c.length].click(); if(raw(15)||raw(13)) c[(i+1)%c.length].click(); } if(raw(CF)) $("shBuy").click(); }
            if($("mpPanel").style.display==="flex"){ if(raw(3)) $("mpCreate").click(); if(raw(CF)&&$("mpStart").offsetParent) $("mpStart").click(); }
            return true;
        }
        const t=[...$("modeCards").children], i=t.findIndex(x=>x.classList.contains("on"));
        if(raw(14)) t[(i+t.length-1)%t.length].click(); if(raw(15)) t[(i+1)%t.length].click(); if(raw(CF)) $("playBtn").click();
        return true;
    }
    if(state==="playing"&&paused){ if(ovs){ if(raw(BK)) closeAll(); } else { if(raw(CF)||raw(9)) $("btnResume").click(); if(raw(BK)) $("btnPauseLobby").click(); } return true; }
    if($("gameOver").style.display==="flex"){ if(raw(CF)) $("btnRestart").click(); if(raw(BK)) $("btnLobby").click(); return true; }
    return false;
};

/* ---------- Manette : réglage des axes des sticks (corrige « caméra haut/bas ») ---------- */
const pbox=$("padPanel").querySelector(".gxBox");
const AXN={lx:"Stick gauche ↔",ly:"Stick gauche ↕",rx:"Stick droit ↔ (caméra)",ry:"Stick droit ↕ (caméra haut/bas)"};
const axd=document.createElement("div");
axd.innerHTML='<div class="gxNote">Si la caméra ne monte/descend pas : clique « Détecter » sur la ligne du stick droit ↕ puis pousse ce stick vers le haut.</div><div id="axList"></div><div class="gxNote" id="axLive"></div>';
pbox.insertBefore(axd,$("pdList")); let learnAx=null, rest=null;
function drawAx(){ $("axList").innerHTML=Object.keys(AXN).map(k=>'<div class="pdRow"><span>'+AXN[k]+'</span><button data-ax="'+k+'" class="'+(learnAx===k?"on":"")+'">'+(learnAx===k?"Pousse le stick…":"Axe "+PADCFG.ax[k]+" · Détecter")+'</button></div>').join(""); }
$("axList").addEventListener("click",e=>{ const k=e.target.dataset&&e.target.dataset.ax; if(!k) return; const p=[...(navigator.getGamepads()||[])].find(x=>x&&x.connected); if(!p) return; learnAx=k; rest=[...p.axes]; drawAx(); });
setInterval(()=>{
    if($("padPanel").style.display!=="flex") return; const p=[...(navigator.getGamepads()||[])].find(x=>x&&x.connected); if(!p) return;
    if(learnAx){ const i=p.axes.findIndex((v,j)=>Math.abs(v-rest[j])>.6); if(i>=0){ PADCFG.ax[learnAx]=i; PADSAVE(); learnAx=null; } }
    drawAx(); $("axLive").textContent="Axes en direct : "+p.axes.map((v,i)=>i+":"+v.toFixed(2)).join("  ");
},120);
const lbl=document.createElement("div"); lbl.className="gxNote"; lbl.id="padStyle"; pbox.insertBefore(lbl,pbox.firstChild);
setInterval(()=>{ lbl.textContent=window.PADSW?"Manette Nintendo détectée : A confirme (bouton de droite), B retour. L/R = changer d'onglet.":"Manette standard : A confirme, B retour. LB/RB = changer d'onglet."; },500);

/* ---------- Multijoueur : paramètres de l'hôte ---------- */
const sel=(id,l,o)=>'<label>'+l+'<select id="'+id+'">'+o.map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join("")+'</select></label>';
const mo=document.createElement("div"); mo.id="mpOpts";
mo.innerHTML='<details open><summary>Paramètres de la partie (hôte)</summary>'+
 sel("moMap","Carte",[["ville","Ville"],["survie","Vallée (terrain à bosses)"]])+
 sel("moLim","Éliminations pour gagner",[[5,"5"],[10,"10"],[15,"15"],[25,"25"],[50,"50"]]).replace('value="5"','value="5"')+
 sel("moHp","Points de vie",[[100,"100"],[50,"50 (fragile)"],[150,"150"],[200,"200"]])+
 sel("moSp","Vitesse des joueurs",[[1,"Normale"],[.8,"Lente"],[1.3,"Rapide"],[1.6,"Très rapide"]])+
 sel("moDm","Dégâts infligés",[[1,"Normaux ×1"],[.5,"Réduits ×0.5"],[1.5,"×1.5"],[2,"×2"]])+
 sel("moW","Armes",[["all","Toutes les armes"],["glock","Pistolet seulement"]])+
 sel("moAm","Munitions",[["inf","Infinies"],["lim","Limitées"]])+
 sel("moRe","Réapparition (combat à mort)",[[3,"3 s"],[1,"1 s"],[5,"5 s"],[8,"8 s"]])+
 sel("moTm","Durée max du match",[[0,"Illimitée"],[3,"3 min"],[5,"5 min"],[10,"10 min"]])+
 sel("moCh","Coffres par minute",[[0,"Aucun"],[1,"1"],[2,"2"],[4,"4"],[6,"6"]])+
 sel("moZ","Zone du Battle Royale",[[150,"Normale"],[220,"Lente"],[90,"Rapide"]])+'</details>';
$("mpStatus").parentNode.insertBefore(mo,$("mpStatus")); $("moLim").value=15;
window.mpSettings=()=>({map:$("moMap").value,limit:+$("moLim").value,hp:+$("moHp").value,speed:+$("moSp").value,dmg:+$("moDm").value,all:$("moW").value==="all",inf:$("moAm").value==="inf",resp:+$("moRe").value,time:+$("moTm").value,zdur:+$("moZ").value,chests:+$("moCh").value,bots:+(($("moBots")||{}).value||0),bl:($("moBl")||{value:"normal"}).value});
setInterval(()=>{ mo.style.display=(!window.MP||MP.host||!MP.peer)?"block":"none"; },300);

/* ---------- Comptes + sauvegarde + classement mondial (PlayFab, via l'API REST) ---------- */
const ap=document.createElement("div"); ap.id="acPanel"; ap.className="ovl";
ap.innerHTML='<div class="shTop"><div class="shTitle">👤 COMPTE</div><button class="actionBtn secondary" id="acClose" style="min-width:90px;padding:10px 16px">Fermer</button></div><div class="gxBox"><div id="acInfo" class="gxNote"></div><input id="acMail" type="email" placeholder="E-mail"><input id="acPass" type="password" placeholder="Mot de passe (6 caractères min.)"><div class="mpRow"><button class="actionBtn" id="acIn">Se connecter</button><button class="actionBtn secondary" id="acUp">Créer un compte</button></div><div class="mpRow"><button class="actionBtn secondary" id="acSave">Sauvegarder maintenant</button><button class="actionBtn secondary" id="acLb">Classement mondial</button><button class="actionBtn secondary" id="acOut" style="display:none">Se déconnecter</button></div><div id="acBoard" class="gxNote"></div></div>';
document.body.appendChild(ap); hint($("acClose"),"B",1);
const acb=document.createElement("button"); acb.textContent="COMPTE"; acb.onclick=()=>{ ap.style.display="flex"; upd(); }; tabs()[0].parentNode.insertBefore(acb,tabs()[0].parentNode.lastElementChild);
$("acClose").onclick=()=>{ ap.style.display="none"; };
window.USER=null; let sess=null, last="", fresh=false;
const KEYS=["combat3d_coins","c3d_own","c3d_eq","c3d_rec","c3d_missions","c3d_name","c3d_gift"];
const snap=()=>JSON.stringify(KEYS.reduce((o,k)=>{ const v=localStorage.getItem(k); if(v!=null) o[k]=v; return o; },{}));
const say=t=>{ $("acInfo").textContent=t; };
const PF=(ep,body,tk)=>fetch("https://"+PLAYFAB_TITLE_ID+".playfabapi.com"+ep,{method:"POST",headers:Object.assign({"Content-Type":"application/json"},tk?{"X-Authorization":tk}:{}),body:JSON.stringify(body)}).then(r=>r.json()).then(j=>{ if(j.code!==200) throw new Error(j.errorMessage||j.error||"Erreur PlayFab"); return j.data; });
const INFO={GetUserData:true,GetUserReadOnlyData:true,UserDataKeys:["save"],UserReadOnlyDataKeys:["admin"]};
function upd(){
    const u=window.USER; $("acOut").style.display=u?"inline-block":"none";
    if(!PLAYFAB_TITLE_ID) say("Comptes non configurés : colle ton Title ID PlayFab dans le code (const PLAYFAB_TITLE_ID).");
    else say(u?"Connecté ("+(u.email||u.id)+")"+(u.admin?" · ADMIN":"")+" · sauvegarde automatique activée":"Non connecté : tes données restent sur cet appareil.");
}
function afterLogin(d){
    sess={ticket:d.SessionTicket,id:d.PlayFabId,email:$("acMail").value||(sess&&sess.email)||""}; localStorage.setItem("c3d_pf",JSON.stringify(sess));
    const ip=d.InfoResultPayload||{}, ud=ip.UserData||{}, ro=ip.UserReadOnlyData||{};
    window.USER={id:sess.id,email:sess.email,admin:!!(ro.admin&&ro.admin.Value==="1")};
    PF("/Client/GetTime",{},sess.ticket).then(t=>{ if(window.Tm&&Tm.set) Tm.set(new Date(t.Time).getTime()); }).catch(()=>{});
    if(fresh&&ud.save){ try{ const o=JSON.parse(ud.save.Value); if(ud.save.Value!==snap()){ KEYS.forEach(k=>{ if(o[k]!=null) localStorage.setItem(k,o[k]); }); say("Sauvegarde chargée, rechargement…"); setTimeout(()=>location.reload(),600); return; } }catch(e){} }
    else if(fresh) save();
    fresh=false; last=snap(); upd();
}
const save=()=>sess?PF("/Client/UpdateUserData",{Data:{save:snap()}},sess.ticket):Promise.resolve();
const need=f=>()=>{ if(!PLAYFAB_TITLE_ID) return upd(); say("Patiente…"); f().catch(e=>{ say(e.message); }); };
$("acIn").onclick=need(()=>{ fresh=true; return PF("/Client/LoginWithEmailAddress",{TitleId:PLAYFAB_TITLE_ID,Email:$("acMail").value,Password:$("acPass").value,InfoRequestParameters:INFO}).then(afterLogin); });
$("acUp").onclick=need(()=>PF("/Client/RegisterPlayFabUser",{TitleId:PLAYFAB_TITLE_ID,Email:$("acMail").value,Password:$("acPass").value,RequireBothUsernameAndEmail:false}).then(()=>{ fresh=true; return PF("/Client/LoginWithEmailAddress",{TitleId:PLAYFAB_TITLE_ID,Email:$("acMail").value,Password:$("acPass").value,InfoRequestParameters:INFO}); }).then(d=>{ afterLogin(d); const n=(localStorage.getItem("c3d_name")||"").slice(0,25); if(n.length>=3) PF("/Client/UpdateUserTitleDisplayName",{DisplayName:n},d.SessionTicket).catch(()=>{}); }));
$("acOut").onclick=()=>{ sess=null; window.USER=null; localStorage.removeItem("c3d_pf"); upd(); };
$("acSave").onclick=need(()=>save().then(()=>{ last=snap(); say("Sauvegardé ✔"); }));
$("acLb").onclick=need(async()=>{
    if(!sess) throw new Error("Connecte-toi pour voir le classement.");
    const box=[]; for(const [n,t] of [["best_wave","Meilleure vague (Survie)"],["total_kills","Éliminations totales"]]){
        const d=await PF("/Client/GetLeaderboard",{StatisticName:n,StartPosition:0,MaxResultsCount:10},sess.ticket);
        box.push(t+" :\n"+(d.Leaderboard.map(e=>(e.Position+1)+". "+(e.DisplayName||e.PlayFabId.slice(0,6))+" — "+e.StatValue).join("\n")||"(vide)"));
    }
    $("acBoard").style.whiteSpace="pre-line"; $("acBoard").textContent=box.join("\n\n"); upd();
});
setInterval(()=>{ if(!sess) return; const s=snap(); if(s!==last){ last=s; save().catch(()=>{}); } },15000);
const _egp=endGame; endGame=function(w){ _egp(w); setTimeout(()=>{ if(!sess) return; try{ const r=JSON.parse(localStorage.getItem("c3d_rec")||"{}"); PF("/Client/UpdatePlayerStatistics",{Statistics:[{StatisticName:"best_wave",Value:(r.survie||{}).bestWave||0},{StatisticName:"total_kills",Value:(r.g||{}).kills||0}]},sess.ticket).catch(()=>{}); }catch(e){} },800); };
try{ const o=JSON.parse(localStorage.getItem("c3d_pf")||"null"); if(o&&o.ticket&&PLAYFAB_TITLE_ID){ sess=o; PF("/Client/GetUserReadOnlyData",{Keys:["admin"]},o.ticket).then(d=>{ window.USER={id:o.id,email:o.email,admin:!!(d.Data.admin&&d.Data.admin.Value==="1")}; last=snap(); upd(); PF("/Client/GetTime",{},o.ticket).then(t=>{ if(window.Tm&&Tm.set) Tm.set(new Date(t.Time).getTime()); }).catch(()=>{}); }).catch(()=>{ sess=null; localStorage.removeItem("c3d_pf"); }); } }catch(e){}


/* ---------- Boucle : barre visible dans le salon + durée max du match ---------- */
const _r=renderer.render;
renderer.render=function(s,c){
    bar.style.display=state==="lobby"?"flex":"none";
    if(window.MP&&MP.active&&MP.host&&!MP.over&&MP.set&&MP.set.time>0&&MP.api&&(performance.now()-MP.t0)/1000>MP.set.time*60){
        let w=0,b=-1; for(const i in MP.scores) if(MP.scores[i].k>b){ b=MP.scores[i].k; w=Number(i); }
        MP.api.bcast({t:"end",winner:w}); MP.api.endMatch(w);
    }
    _r.call(this,s,c);
};
})();

/* ===== jeu-12 ===== */
/* ===== v8 : choix Solo/Multi, salons séparés, icônes, vestiaire, cadeaux quotidiens, caméra vivante, serveur public ===== */
(()=>{
const $=id=>document.getElementById(id), W=window.G, GF=window.GFX;
const toast=(t,c)=>{ const e=document.createElement("div"); e.className="dn big"; e.textContent=t; e.style.color=c||"#ffd166"; e.style.top="40%"; document.body.appendChild(e); setTimeout(()=>e.remove(),2200); };
const css=document.createElement("style"); css.textContent=`
body.lb-multi #modeCards,body.lb-multi #playBtn,body.lb-multi #modeLbl,body.lb-multi #missions{display:none!important}
#lbRight{display:flex;align-items:center;gap:8px}
.ibtn{position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,#1c2036,#090b16);border:0;border-bottom:3px solid #ffb703;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);cursor:pointer;transition:.15s}.ibtn:hover{color:#ffd166;transform:translateY(-2px)}
.ibtn.dot::after{content:"";position:absolute;top:6px;right:8px;width:9px;height:9px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444}
#modeSelect{position:fixed;inset:0;z-index:110;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;background:radial-gradient(circle at 50% 30%,rgba(60,20,20,.85),rgba(4,5,12,.96))}
.msLogo{font:900 52px Impact,Arial;font-style:italic;letter-spacing:6px;color:#fff;text-shadow:4px 4px 0 #b91c1c,0 0 24px #ffb703}.msLogo b{color:#ffb703}
.msRow{display:flex;gap:26px;flex-wrap:wrap;justify-content:center}
.msCard{width:290px;padding:34px 20px;text-align:center;color:#fff;cursor:pointer;background:linear-gradient(135deg,#1c2036,#090b16);border-left:8px solid #ef4444;clip-path:polygon(0 0,100% 0,calc(100% - 22px) 100%,0 100%);transition:.15s}
.msCard h2{margin:0 0 8px;font:900 34px Impact,Arial;font-style:italic;letter-spacing:3px}.msCard p{margin:0;opacity:.8;font:14px Arial}
.msCard:hover,.msCard.on{background:linear-gradient(135deg,#ffd23f,#ff7a00);color:#14100a;border-left-color:#fff;transform:translateX(8px) scale(1.03)}
#joinBox{position:fixed;right:24px;bottom:24px;z-index:64;width:300px;padding:14px;color:#fff;display:none;flex-direction:column;gap:8px;background:linear-gradient(135deg,rgba(15,18,36,.94),rgba(5,6,15,.94));border-left:5px solid #ffb703}
#joinBox input{background:#0b0e1c;color:#fff;border:1px solid #3b4270;padding:9px;font:bold 16px Arial;text-transform:uppercase;letter-spacing:3px;text-align:center}
#joinBox button{padding:9px;border:0;cursor:pointer;font:900 14px Impact,Arial;letter-spacing:1px;background:#1f2547;color:#ffd166}#joinBox button.pri{background:linear-gradient(#ff5a3c,#b91c1c);color:#fff}
#jbSt{min-height:18px;font:bold 13px Arial;color:#cbd5e1}.jbT{font:900 16px Impact,Arial;letter-spacing:3px;color:#ffd166}
#giftBox{display:none;position:fixed;inset:0;z-index:105;align-items:center;justify-content:center;background:rgba(0,0,0,.8)}
.gfIn{background:linear-gradient(135deg,#1c2036,#090b16);border-top:5px solid #ffb703;padding:24px;color:#fff;text-align:center;max-width:94vw}
.gfRow{display:flex;gap:8px;margin:16px 0;flex-wrap:wrap;justify-content:center}.gfD{width:74px;padding:10px 4px;background:#0b0e1c;border:2px solid #333;font:bold 12px Arial}.gfD b{display:block;font:900 18px Impact,Arial;color:#ffd166}
.gfD.cur{border-color:#ffd166;background:#3b2a0a}.gfD.done{opacity:.45}
`; document.head.appendChild(css);

/* ---------- onglets : COMPTE / PARAMÈTRES en icônes, VESTIAIRE à part ---------- */
const find=n=>[...document.querySelectorAll(".lbTabs button")].find(b=>b.textContent===n);
const O={acc:find("COMPTE"),set:find("PARAMÈTRES"),mp:find("MULTIJOUEUR")};
const store=document.createElement("div"); store.style.display="none"; document.body.appendChild(store); Object.values(O).forEach(b=>store.appendChild(b));
const vs=document.createElement("button"); vs.textContent="VESTIAIRE"; vs.onclick=()=>{ window.SHOPMODE="locker"; window.openShop(); }; find("BOUTIQUE").after(vs);
const closeAll=()=>{ if($("shop").style.display==="flex") $("shClose").onclick(); document.querySelectorAll(".ovl").forEach(e=>e.style.display="none"); };
const ico=(p,t,fn)=>{ const b=document.createElement("button"); b.className="ibtn"; b.title=t; b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'; b.onclick=fn; $("lbRight").appendChild(b); return b; };
const giftB=ico('<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8c-3-5-7-2-4 0M12 8c3-5 7-2 4 0"/>',"Cadeau du jour",()=>{ closeAll(); openGift(); });
ico('<path d="M4 8h14l-3-3M20 16H6l3 3"/>',"Changer de mode (Solo / Multi)",()=>{ closeAll(); ms.style.display="flex"; });
ico('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',"Compte",()=>{ closeAll(); O.acc.click(); });
ico('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',"Paramètres",()=>{ closeAll(); O.set.click(); });

/* ---------- écran de départ : Solo ou Multijoueur ---------- */
const ms=document.createElement("div"); ms.id="modeSelect";
ms.innerHTML='<div class="msLogo">COMBAT <b>3D</b></div><div class="msRow"><div class="msCard on" data-m="solo"><h2>SOLO</h2><p>Ville · Vallée Survie · Boutique · Missions</p></div><div class="msCard" data-m="multi"><h2>MULTIJOUEUR</h2><p>Combat à mort · Battle Royale · Serveur public</p></div></div>';
document.body.appendChild(ms);
function setLobby(m){ window.LOBBY=m; document.body.classList.toggle("lb-solo",m==="solo"); document.body.classList.toggle("lb-multi",m==="multi"); ms.style.display="none"; tabs0().click(); if(canGift()) setTimeout(openGift,300); }
const tabs0=()=>find("JOUER");
ms.querySelectorAll(".msCard").forEach(c=>{ c.onclick=()=>setLobby(c.dataset.m); c.onmouseenter=()=>{ ms.querySelectorAll(".msCard").forEach(x=>x.classList.toggle("on",x===c)); }; });
document.body.classList.add("lb-solo");

/* ---------- Multijoueur : petite boîte en bas à droite ---------- */
const jb=document.createElement("div"); jb.id="joinBox";
jb.innerHTML='<div class="jbT">🌐 MULTIJOUEUR</div><input id="jbName" maxlength="14" placeholder="TON PSEUDO" style="text-transform:none;letter-spacing:0"><input id="jbCode" maxlength="5" placeholder="CODE DE PARTIE"><button class="pri" id="jbJoin">REJOINDRE</button><button id="jbCreate">CRÉER UNE PARTIE</button><button id="jbPub">🌍 SERVEUR PUBLIC</button><button id="jbPubHost" style="display:none">HÉBERGER LE SERVEUR PUBLIC (admin)</button><button id="jbLeave" style="display:none">QUITTER LA PARTIE</button><div id="jbSt"></div>';
document.body.appendChild(jb); $("jbName").value=$("mpName").value; $("jbName").oninput=()=>{ $("mpName").value=$("jbName").value; };
const joinCode=c=>{ $("mpName").value=$("jbName").value||$("mpName").value; $("mpCode").value=c; $("mpJoin").click(); };
$("jbJoin").onclick=()=>joinCode($("jbCode").value); $("jbPub").onclick=()=>joinCode("PUBLC");
$("jbCreate").onclick=()=>{ $("mpName").value=$("jbName").value||$("mpName").value; window.__wantRoom=true; $("mpCreate").click(); };
$("jbPubHost").onclick=()=>{ if(!(window.USER&&USER.admin)) return toast("Réservé à l'admin","#fca5a5"); window.__wantRoom=true; window.mpCreatePublic(); };
$("jbLeave").onclick=()=>$("mpLeave").click();
setInterval(()=>{
    $("jbSt").textContent=$("mpStatus").textContent; $("jbPubHost").style.display=(window.USER&&USER.admin)?"block":"none"; $("jbLeave").style.display=(window.MP&&MP.peer)?"block":"none";
    if(window.__wantRoom&&window.MP&&MP.host&&MP.code){ window.__wantRoom=false; }
},300);

/* ---------- Cadeau quotidien ---------- */
const REW=[30,40,50,60,80,100,150], SKW=["for","oce","mag","gla","spe"], SKC=["c_com","c_nin","c_rou","c_gla","c_neo","c_gal"];
const NM={for:"Forêt",oce:"Océan",mag:"Magma",gla:"Glace",spe:"Spectre",c_com:"Commando",c_nin:"Ninja",c_rou:"Pyro",c_gla:"Givre",c_neo:"Néon",c_gal:"Galaxie"};
const day=()=>Math.floor(Tm.now()/864e5), gst=()=>{ try{ return JSON.parse(localStorage.getItem("c3d_gift"))||{d:-9,s:0}; }catch(e){ return {d:-9,s:0}; } };
const canGift=()=>gst().d!==day();
const gb=document.createElement("div"); gb.id="giftBox"; document.body.appendChild(gb);
function openGift(){
    const st=gst(), nxt=st.d===day()?st.s:(st.d===day()-1?st.s+1:1), idx=(nxt-1)%7, ok=st.d!==day();
    gb.innerHTML='<div class="gfIn"><h2 style="margin:0;font:900 30px Impact,Arial;font-style:italic">🎁 CADEAU DU JOUR</h2><div class="gfRow">'+REW.map((c,i)=>'<div class="gfD '+(i===idx?"cur":(i<idx||(!ok&&i===idx)?"done":""))+'">Jour '+(i+1)+'<b>🪙 '+c+'</b>'+(i===6?"+ skin":"")+'</div>').join("")+'</div><div>Série : '+nxt+' jour'+(nxt>1?"s":"")+'</div><br><button class="actionBtn" id="gfGo" '+(ok?"":"disabled")+'>'+(ok?"RÉCLAMER":"Déjà réclamé · reviens demain")+'</button> <button class="actionBtn secondary" id="gfX">Fermer</button></div>';
    gb.style.display="flex"; $("gfX").onclick=()=>{ gb.style.display="none"; };
    $("gfGo").onclick=()=>{ if(!canGift()) return; const c=REW[idx]; addCoins(c); let t="+"+c+" 🪙";
        if(idx===6||(nxt%3===0)){ const pool=[]; weaponOrder.forEach(k=>SKW.forEach(s=>{ if(!C3own.has(k+":"+s)) pool.push([k+":"+s,weapons[k].name+" | "+NM[s]]); })); SKC.forEach(s=>{ if(!C3own.has("char:"+s)) pool.push(["char:"+s,"Personnage | "+NM[s]]); });
            if(pool.length){ const p=pool[Math.floor(Math.random()*pool.length)]; C3own.add(p[0]); C3saveSk(); t+="  +  Skin : "+p[1]; } }
        localStorage.setItem("c3d_gift",JSON.stringify({d:day(),s:nxt})); toast(t); gb.style.display="none"; giftB.classList.remove("dot"); };
}
setInterval(()=>{ giftB.classList.toggle("dot",canGift()); },2000);

/* ---------- Résolution : 100 % au départ, puis l'auto la baisse si besoin ---------- */
const _sm=startMode;
startMode=function(k){ if(GF.q==="auto"){ GF.scale=1; GF.ov.pr=Math.max(1,GF.PRE[GF.cur].pr); } else delete GF.ov.pr; renderer.setPixelRatio(GF.pr()); _sm(k); };

/* ---------- Admin : accessible uniquement avec un compte admin ---------- */
window.askAdmin=()=>{ if(window.USER&&USER.admin){ $("adCoins").textContent=coins; $("admin").style.display="block"; } else toast("Panel réservé à l'admin : connecte-toi avec ton compte admin","#fca5a5"); };

/* ---------- Caméra vivante + coffres du multijoueur ---------- */
const rng=seed=>{ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; };
let bobT=0, roll=0, dip=0, pg=true, fovK=0, chN=0, lastT0=0;
const kd=keys;
function juice(dt){
    if(state!=="playing"||paused||thirdPerson||gameFinished) return;
    const mv=!!(kd.z||kd.w||kd.s||kd.q||kd.a||kd.d||kd.arrowup||kd.arrowdown||kd.arrowleft||kd.arrowright)&&grounded, spr=mv&&W.mv>1.25*(W.adm.spd||1);
    const K=window.C3V9||{}; bobT+=dt*(mv?(spr?13:9):0); const amp=(mv?(spr?.055:.032):0)*(K.bob??1);
    const st=((kd.d||kd.arrowright)?1:0)-((kd.q||kd.a||kd.arrowleft)?1:0);
    roll+=(-st*.03*(K.roll??1)-roll)*Math.min(1,dt*8);
    if(grounded&&!pg) dip=.2*(K.bob??1); pg=grounded; dip*=Math.pow(.002,dt);
    camera.position.y+=Math.sin(bobT*2)*amp-dip; camera.position.x+=Math.cos(cameraYaw)*Math.cos(bobT)*amp*.7; camera.position.z-=Math.sin(cameraYaw)*Math.cos(bobT)*amp*.7;
    camera.rotation.z+=roll+Math.sin(bobT)*(spr?.007:.003)*(K.roll??1);
    fovK+=((spr?7*(K.fov??1):0)-fovK)*Math.min(1,dt*6);
    if(!aiming){ camera.fov=BASE_FOV+fovK; camera.updateProjectionMatrix(); }
}
function chests(){
    if(!(window.MP&&MP.active&&!MP.over&&MP.set&&MP.set.chests>0&&MP.t0&&W.spawnChests)){ return; }
    if(MP.t0!==lastT0){ lastT0=MP.t0; chN=0; }
    const due=Math.floor((performance.now()-MP.t0)/1000*MP.set.chests/60);
    while(chN<due){ chN++; const R=Math.random; Math.random=rng((MP.seed||1)*7919+chN); try{ W.spawnChests(1,false); } finally{ Math.random=R; } }
}
const clk=new THREE.Clock(), _r=renderer.render;
renderer.render=function(s,c){
    const dt=Math.min(clk.getDelta(),.05);
    jb.style.display=(state==="lobby"&&window.LOBBY==="multi"&&ms.style.display==="none")?"flex":"none";
    if(!paused&&state==="playing"&&!gameFinished){ chests(); juice(dt); }
    _r.call(this,s,c);
};
})();

/* ===== jeu-13 ===== */
/* ===== v9 (partie A) : RÉGLAGES, FOND DU SALON, INERTIE, BOTS, HEADSHOTS, MINI-CARTE, MÉTÉO, PAS 3D ===== */
(()=>{
const $=id=>document.getElementById(id), C=window.C3, S=C.S;
const clampf=(x,a,b)=>Math.max(a,Math.min(b,x));

/* =========================================================
   1. RÉGLAGES v9 (sauvegardés dans le navigateur)
   Tout est modifiable dans  Salon > ⚙ Paramètres  (ou en pause).
========================================================= */
const DEF={
    bob:1.7, shake:1.7, roll:1.6, fov:1.5, sway:1.5, inertia:.4,   // caméra & mouvements (1 = ancien réglage)
    hs:2.5, dmg:1,                                                   // headshot ×2.5 · dégâts des armes ×1
    bots:6, lvl:"normal",                                            // nombre de bots · niveau des bots
    mini:true, weather:"auto", snd3d:true                            // mini-carte · météo · sons 3D
};
let saved={}; try{ saved=JSON.parse(localStorage.getItem("c3d_v9"))||{}; }catch(e){}
const V9=window.C3V9=Object.assign({},DEF,saved);
const save=()=>{ try{ localStorage.setItem("c3d_v9",JSON.stringify(V9)); }catch(e){} };

/* ----- interface dans le panneau Paramètres existant ----- */
(function buildSettings(){
    const box=document.querySelector("#gfxPanel .gxBox"); if(!box) return;
    const SL=(k,l,mn,mx,st)=>'<label>'+l+'<input type="range" data-k="'+k+'" min="'+mn+'" max="'+mx+'" step="'+st+'"><span data-v="'+k+'"></span></label>';
    const sec=document.createElement("div"); sec.id="v9Set";
    sec.innerHTML=
    '<h4>Caméra &amp; mouvements</h4>'+
    SL("bob","Balancement de la caméra (marche)",0,3,.1)+SL("shake","Tremblements (tirs, dégâts, explosions)",0,3,.1)+
    SL("roll","Inclinaison de la caméra",0,3,.1)+SL("fov","Effet de vitesse (zoom en sprint)",0,3,.1)+
    SL("sway","Balancement de l'arme",0,3,.1)+SL("inertia","Fluidité du déplacement (inertie)",0,1,.05)+
    '<h4>Combat</h4>'+
    SL("hs","Dégâts d'un headshot (×)",1,5,.1)+SL("dmg","Dégâts de mes armes (×)",.5,3,.1)+
    SL("bots","Nombre de bots (solo)",1,30,1)+
    '<label>Niveau des bots<select data-k="lvl"><option value="facile">Facile</option><option value="normal">Normal</option><option value="difficile">Difficile</option><option value="expert">Expert</option></select></label>'+
    '<h4>Affichage &amp; son</h4>'+
    '<label><input type="checkbox" data-k="mini"> Mini-carte</label>'+
    '<label>Météo<select data-k="weather"><option value="auto">Auto (au hasard)</option><option value="none">Aucune</option><option value="rain">Pluie légère</option><option value="snow">Neige légère</option></select></label>'+
    '<label><input type="checkbox" data-k="snd3d"> Sons 3D (360° : pas, tirs)</label>'+
    '<div class="r"><button class="actionBtn secondary" id="v9Reset" style="min-width:0;padding:8px 14px">Réinitialiser ces réglages</button></div>';
    const note=box.querySelector(".gxNote:last-child"); note?box.insertBefore(sec,note):box.appendChild(sec);
    const fmt=(k,v)=>k==="inertia"?Math.round(v*100)+"%":(k==="bots"?v:"×"+(+v).toFixed(1));
    function sync(){ sec.querySelectorAll("[data-k]").forEach(el=>{ const k=el.dataset.k; if(el.type==="checkbox") el.checked=!!V9[k]; else el.value=V9[k]; const sp=sec.querySelector('[data-v="'+k+'"]'); if(sp) sp.textContent=fmt(k,V9[k]); }); }
    const onCh=e=>{ const el=e.target, k=el.dataset&&el.dataset.k; if(!k) return; V9[k]=el.type==="checkbox"?el.checked:(el.tagName==="SELECT"?el.value:+el.value); save(); sync(); if(k==="weather") applyWeather(); if(k==="mini") drawMini(); };
    sec.addEventListener("input",onCh); sec.addEventListener("change",onCh);
    $("v9Reset").onclick=()=>{ Object.assign(V9,DEF); save(); sync(); applyWeather(); };
    sync();
})();

/* =========================================================
   2. FOND DU SALON = UNE IMAGE (plus de modèle 3D qui tourne)
   ➜ mets ton image dans le même dossier que index.html et écris son nom ici.
========================================================= */
const LOBBY_BG="lobby.jpg";
const bg=document.createElement("div"); bg.id="lobbyBg";
bg.style.backgroundImage='linear-gradient(180deg,rgba(4,8,18,.25),rgba(4,8,18,.7)),url("'+LOBBY_BG+'")';
document.body.appendChild(bg);

/* =========================================================
   3. DÉPLACEMENT FLUIDE (inertie) : le joueur accélère / freine en douceur
========================================================= */
let lastDt=.016; const pv={x:0,z:0}; let moved=false;
const _mc=moveCharacter;
const tc=()=>.04+V9.inertia*.22;                // constante de temps (s) : plus grand = plus de glisse
moveCharacter=function(ch,dx,dz){
    if(ch!==player||state!=="playing"||V9.inertia<=0) return _mc(ch,dx,dz);
    const dt=clampf(lastDt,.004,.05), k=1-Math.exp(-dt/tc());
    pv.x+=(dx/dt-pv.x)*k; pv.z+=(dz/dt-pv.z)*k; moved=true;
    return _mc(ch,pv.x*dt,pv.z*dt);
};
function inertiaTail(dt){                       // plus de touche appuyée : on finit de glisser
    if(!moved&&(pv.x||pv.z)){ const f=Math.exp(-dt/(tc()*.8)); pv.x*=f; pv.z*=f; if(Math.hypot(pv.x,pv.z)<.05){ pv.x=pv.z=0; } else _mc(player,pv.x*dt,pv.z*dt); }
    moved=false;
}

/* =========================================================
   4. BOTS : nombre au choix, niveau, saut, fuite, rafales, visée anticipée
========================================================= */
const LVL={
    facile   :{spread:1.9,lead:.5 ,dmg:.8 ,spd:.85,cd:1.3,jump:.15,flee:.2 },
    normal   :{spread:1  ,lead:1  ,dmg:1  ,spd:1  ,cd:1  ,jump:.35,flee:.28},
    difficile:{spread:.55,lead:1.15,dmg:1.15,spd:1.12,cd:.8,jump:.55,flee:.28},
    expert   :{spread:.25,lead:1.3,dmg:1.3,spd:1.25,cd:.6,jump:.8 ,flee:.22}
};
const L=()=>LVL[V9.lvl]||LVL.normal;
window.BOT={
    spread:()=>L().spread, lead:()=>L().lead, dmg:()=>L().dmg,
    /* cadence : rafales de 3 tirs puis une pause (les snipers tirent coup par coup) */
    nextCd(u,cd){ if(u.type==="sniper") return cd*L().cd; u.burst=(u.burst||0)+1; if(u.burst<3) return .17; u.burst=0; return cd*L().cd*(.85+Math.random()*.5); },
    /* appelé à chaque image pour chaque bot (hors boss). Renvoie true si le bot est en fuite (l'IA de base est alors ignorée). */
    pre(e,dt){
        const u=e.userData, l=L(); u.seed=u.seed||Math.random()*9;
        // saut
        if(u.jumpH>0){ u.jumpV-=24*dt; u.jumpH+=u.jumpV*dt; if(u.jumpH<=0){ u.jumpH=0; u.jumpV=0; } }
        const d=Math.hypot(player.position.x-e.position.x,player.position.z-e.position.z);
        u.jumpCd=(u.jumpCd==null?1+Math.random()*2:u.jumpCd)-dt;
        if(u.jumpCd<=0){ if(!u.jumpH&&d<32&&Math.random()<l.jump){ u.jumpV=6.8; u.jumpH=.01; } u.jumpCd=1.5+Math.random()*2.5; }
        // peur : retombe doucement
        u.hurt=Math.max(0,(u.hurt||0)-dt*u.maxHP*.1); u.fleeCd=Math.max(0,(u.fleeCd||0)-dt);
        if(!(u.fleeT>0)) return false;
        // ----- fuite : s'éloigne du joueur en zigzag et contourne les obstacles
        u.fleeT-=dt; u.shootCooldown=Math.max(u.shootCooldown||0,.5);
        const dx=e.position.x-player.position.x, dz=e.position.z-player.position.z;
        let ang=Math.atan2(dx,dz)+Math.sin(performance.now()/380+u.seed)*.55, vx=Math.sin(ang), vz=Math.cos(ang);
        if(collidesWithBuilding(e.position.x+vx*1.6,e.position.z+vz*1.6,1)){ ang+=(Math.PI/2)*(u.sd||1); vx=Math.sin(ang); vz=Math.cos(ang); }
        const sp=(4.2+level*.25)*l.spd; moveCharacter(e,vx*sp*dt,vz*sp*dt);
        e.rotation.y=Math.atan2(vx,vz); animateLimbs(e,dt,true);
        e.position.y=getGroundHeight(e.position.x,e.position.z)+(u.jumpH||0);
        return true;
    }
};
/* un bot blessé / trop attaqué prend la fuite (quelques secondes) */
function scare(e,dd){
    const u=e.userData; if(u.boss||u.type==="tank"||!u.alive) return;
    u.hurt=(u.hurt||0)+dd;
    if(!(u.fleeT>0)&&!u.fleeCd&&(u.hurt>u.maxHP*.45||u.hp<u.maxHP*L().flee)){ u.fleeT=2.2+Math.random()*2; u.fleeCd=7; u.hurt=0; u.sd=Math.random()<.5?-1:1; }
}
/* nombre de bots choisi */
function spawnN(n,dmin,dmax){
    const b=((MODES[currentModeKey]||{}).boundary||40)-5;
    for(let i=0;i<n;i++){
        let x=0,z=0,t=0;
        do{ const a=Math.random()*Math.PI*2, r=dmin+Math.random()*(dmax-dmin); x=clampf(player.position.x+Math.sin(a)*r,-b,b); z=clampf(player.position.z+Math.cos(a)*r,-b,b); t++; }
        while(t<14&&Math.hypot(x-player.position.x,z-player.position.z)<12);
        createEnemy(x,z);
    }
}
MODES.ville.spawn=function(){ spawnN(V9.bots,14,32); };
MODES.survie.spawn=function(){ spawnN(Math.min(V9.bots+wave-1,40),16,32); };

/* =========================================================
   5. HEADSHOTS + dégâts réglables
========================================================= */
let inShot=false;
const _at=attack; attack=function(){ inShot=!!(currentWeapon&&currentWeapon.type==="gun"); try{ _at(); } finally{ inShot=false; } };
const hsEl=document.createElement("div"); hsEl.id="hsMsg"; document.body.appendChild(hsEl);
function hsFx(kill){
    const cr=$("crosshair"); cr.classList.add("hs"); setTimeout(()=>cr.classList.remove("hs"),170);
    hsEl.textContent=kill?"HEADSHOT !":"TÊTE"; hsEl.className=kill?"kill":""; void hsEl.offsetWidth; hsEl.classList.add("show");
    if(C.T) C.T(1900,1100,.11,"triangle",.3);
}
const _de=damageEnemy;
damageEnemy=function(e,dmg){
    if(!e||!e.userData||e.userData.alive===false) return _de(e,dmg);
    let hs=false;
    if(inShot&&!e.userData.boss){                           // la balle touche-t-elle la tête ?
        const h=raycaster.intersectObjects(e.children,true)[0];
        for(let o=h&&h.object;o&&o!==e;o=o.parent){ if(/^head/i.test(o.name||"")){ hs=true; break; } }
    }
    dmg*=V9.dmg; if(hs) dmg*=V9.hs;
    const h0=e.userData.hp; _de(e,dmg);
    if(!e.userData.remote) scare(e,h0-e.userData.hp);
    if(hs) hsFx(e.userData.alive===false);
};

/* =========================================================
   6. MINI-CARTE (rond, tourne avec la caméra)
========================================================= */
const mini=document.createElement("canvas"); mini.id="mini"; mini.width=mini.height=300; document.body.appendChild(mini);
const mx=mini.getContext("2d"); let mapC=null, mapB=40; const VIEW=34;   // rayon visible en mètres
function buildMap(){
    mapB=(MODES[currentModeKey]||{}).boundary||40; const n=Math.ceil(mapB*2);
    mapC=document.createElement("canvas"); mapC.width=mapC.height=n; const c=mapC.getContext("2d"); c.fillStyle="rgba(130,170,225,.6)";
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){ try{ if(collidesWithBuilding(-mapB+i+.5,-mapB+j+.5,.5)) c.fillRect(i,j,1,1); }catch(e){} }
}
const team=id=>id%2;
function drawMini(){
    const on=V9.mini&&state==="playing"&&!paused; mini.style.display=on?"block":"none"; if(!on||!mapC) return;
    const sc=150/VIEW, cs=Math.cos(cameraYaw), sn=Math.sin(cameraYaw), px=player.position.x, pz=player.position.z;
    const P=(x,z)=>{ const dx=x-px, dz=z-pz; return [150+(dx*cs-dz*sn)*sc,150+(dx*sn+dz*cs)*sc]; };
    mx.clearRect(0,0,300,300); mx.save(); mx.beginPath(); mx.arc(150,150,148,0,6.2832); mx.clip();
    mx.fillStyle="rgba(8,15,30,.78)"; mx.fillRect(0,0,300,300);
    const o=P(0,0); mx.save(); mx.transform(cs*sc,sn*sc,-sn*sc,cs*sc,o[0],o[1]);
    mx.drawImage(mapC,-mapB,-mapB,mapB*2,mapB*2); mx.strokeStyle="rgba(90,170,255,.8)"; mx.lineWidth=2.5/sc; mx.strokeRect(-mapB,-mapB,mapB*2,mapB*2); mx.restore();
    const dot=(x,z,r,col)=>{ const p=P(x,z); mx.fillStyle=col; mx.beginPath(); mx.arc(p[0],p[1],r,0,6.2832); mx.fill(); };
    for(const e of enemies){ if(e.userData.alive) dot(e.position.x,e.position.z,e.userData.boss?7:4,"#ff4d4d"); }
    const M=window.MP; if(M&&M.active){ for(const a of scene.children){ const u=a.userData; if(u&&u.remote&&u.alive) dot(a.position.x,a.position.z,4.5,(M.mode==="tdm"&&team(u.pid)===team(M.id))?"#4da3ff":"#ff4d4d"); } }
    mx.fillStyle="#fff"; mx.beginPath(); mx.moveTo(150,138); mx.lineTo(158,158); mx.lineTo(150,153); mx.lineTo(142,158); mx.closePath(); mx.fill();
    mx.restore(); mx.strokeStyle="rgba(90,170,255,.55)"; mx.lineWidth=3; mx.beginPath(); mx.arc(150,150,148,0,6.2832); mx.stroke();
    mx.fillStyle="#fff"; mx.font="bold 22px Arial"; mx.textAlign="center"; mx.textBaseline="middle"; mx.fillText("N",150+sn*128,150-cs*128);
}

/* =========================================================
   7. MÉTÉO LÉGÈRE (pluie / neige) : ne assombrit pas la scène
========================================================= */
const WX={mode:"none",obj:null,rt:0};
function wxClear(){ if(WX.obj){ scene.remove(WX.obj); WX.obj.geometry.dispose(); WX.obj.material.dispose(); WX.obj=null; } WX.mode="none"; }
function wxSet(m){
    wxClear(); if(m==="none") return;
    const n=m==="rain"?450:380, g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.BufferAttribute(new Float32Array(n*(m==="rain"?6:3)),3));
    const o=m==="rain"?new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xcfe3ff,transparent:true,opacity:.3,fog:false,depthWrite:false}))
                      :new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:.13,transparent:true,opacity:.85,fog:false,depthWrite:false}));
    o.frustumCulled=false; o.userData.d=Float32Array.from({length:n*3},(_,i)=>i%3===1?Math.random()*20:(Math.random()-.5)*44);
    scene.add(o); WX.obj=o; WX.mode=m;
}
function wxUpdate(dt){
    const o=WX.obj; if(!o) return; const d=o.userData.d, p=o.geometry.attributes.position.array, n=d.length/3, cp=camera.position, rain=WX.mode==="rain", sp=rain?24:2.2, t=performance.now()/1000;
    for(let i=0;i<n;i++){
        let y=d[i*3+1]-sp*dt; if(y<0) y+=20; d[i*3+1]=y;
        const x=cp.x+d[i*3]+(rain?0:Math.sin(t+i)*.6), z=cp.z+d[i*3+2], yy=cp.y-8+y;
        if(rain){ const k=i*6; p[k]=x; p[k+1]=yy; p[k+2]=z; p[k+3]=x+.1; p[k+4]=yy+.9; p[k+5]=z; } else { p[i*3]=x; p[i*3+1]=yy; p[i*3+2]=z; }
    }
    o.geometry.attributes.position.needsUpdate=true;
    if(rain&&C.N){ WX.rt-=dt; if(WX.rt<=0){ WX.rt=.22; C.N(.3,.016,2600,2000,"bandpass"); } }      // petit bruit de pluie
}
function pickWeather(){
    if(V9.weather!=="auto") return V9.weather;
    const M=window.MP, r=(M&&M.active)?(((M.seed||0)%100)/100):Math.random();   // en multi : même météo pour tous
    return r<.5?"none":(r<.75?"rain":"snow");
}
function applyWeather(){ if(state==="playing") wxSet(pickWeather()); else wxClear(); }

/* =========================================================
   8. SONS 3D : bruits de pas des ennemis / joueurs (positionnés dans l'espace)
========================================================= */
function stepSnd(pos){ if(!C.N) return; C.N(.07,.22,700,250,"lowpass",{pos}); if(C.T) C.T(95,60,.07,"sine",.16,{pos}); }
function steps(dt){
    for(const e of enemies){
        const u=e.userData; if(!u.alive||u.boss) continue;
        const lp=u._lp||(u._lp=e.position.clone()), v=Math.hypot(e.position.x-lp.x,e.position.z-lp.z)/dt; lp.copy(e.position);
        if(v<1||e.position.distanceTo(camera.position)>38) continue;
        u._st=(u._st||0)-dt; if(u._st<=0){ u._st=.46*(3/Math.max(2.5,v)); stepSnd(e.position); }
    }
    const M=window.MP; if(M&&M.active){ for(const a of scene.children){ const u=a.userData; if(!u||!u.remote||!u.alive||!u.moving) continue; if(a.position.distanceTo(camera.position)>38) continue; u._st=(u._st||0)-dt; if(u._st<=0){ u._st=.4; stepSnd(a.position); } } }
}

/* =========================================================
   9. BRANCHEMENTS (démarrage de partie + boucle de rendu)
========================================================= */
const _sm=startMode;
startMode=function(k){ _sm(k); pv.x=pv.z=0; buildMap(); applyWeather(); };
const _gl=goToLobby; goToLobby=function(){ _gl(); wxClear(); pv.x=pv.z=0; mini.style.display="none"; };

const clk=new THREE.Clock(), _r=renderer.render; let mmT=0;
renderer.render=function(s,c){
    const dt=Math.min(clk.getDelta(),.05)||.016; lastDt=dt;
    if(state==="lobby"){
        bg.style.display="block";
        const sv=scene.visible; scene.visible=false;         // salon = image : on ne dessine plus la 3D (économise le GPU)
        try{ _r.call(this,s,c); } finally{ scene.visible=sv; }
        return;
    }
    bg.style.display="none";
    if(state==="playing"&&!paused&&!gameFinished){
        inertiaTail(dt); wxUpdate(dt); steps(dt);
        mmT-=dt; if(mmT<=0){ mmT=.05; drawMini(); }
        $("hud").classList.toggle("low",playerHP<30);
    } else if(paused) drawMini();
    _r.call(this,s,c);
};
})();

/* ===== jeu-13b ===== */
/* ===== v9 (partie B) : MANETTE PARTOUT — navigation dans TOUS les menus + clavier virtuel ===== */
/*  Croix directionnelle / stick gauche : changer de bouton      A : valider      B : retour / fermer
    ◄ ► sur un curseur ou une liste : changer la valeur          LB / RB : changer d'onglet
    Y : paramètres      X : cadeau du jour      Select : Solo / Multi      Start : jouer / reprendre      */
(()=>{
const $=id=>document.getElementById(id);
const clampf=(x,a,b)=>Math.max(a,Math.min(b,x));
const shown=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=="hidden";
let cur=null;

/* ---------- Quelle « couche » d'interface est au premier plan ? (null = on joue) ---------- */
function layerRoots(){
    const q=s=>document.querySelector(s);
    for(const s of ["#padOsk","#giftBox","#modeSelect","#hostPanel","#adminGate","#admin","#shop"]){ const el=q(s); if(shown(el)) return [el]; }
    const ov=[...document.querySelectorAll(".ovl")].filter(shown); if(ov.length) return [ov[ov.length-1]];
    if(shown($("gameOver"))) return [$("gameOver")];
    const dth=$("mpDeath"); if(shown(dth)&&dth.querySelector("button")) return [dth];
    if(shown($("pauseMenu"))) return [$("pauseMenu")];
    if(state==="lobby") return ["lbBar","modeCards","playBtn","joinBox","missions"].map($).filter(shown);
    return null;
}
const SEL='button,input,select,textarea,summary,.tile,.msCard,.skCard,.card';
function cands(){
    const out=[]; (layerRoots()||[]).forEach(r=>{ if(r.matches&&r.matches(SEL)) out.push(r); r.querySelectorAll(SEL).forEach(e=>out.push(e)); });
    return out.filter(e=>shown(e)&&!e.disabled&&!e.classList.contains("pbg")&&e.type!=="hidden"&&e.type!=="file"&&!e.closest("svg"));
}
const pickDefault=c=>c.find(e=>e.matches("#gfGo,.msCard.on,#btnResume,#btnRestart,#playBtn,#mpBack,#oskOk"))||c[0];

/* ---------- Focus visuel ---------- */
function focus(el){ if(cur) cur.classList.remove("padFocus"); cur=el; if(el){ el.classList.add("padFocus"); try{ el.scrollIntoView({block:"nearest",inline:"nearest"}); }catch(e){} } }
document.addEventListener("mousemove",()=>{ if(cur){ cur.classList.remove("padFocus"); } },{passive:true});

/* ---------- Déplacement spatial : on va vers le bouton le plus proche dans la direction ---------- */
function move(dir){
    const c=cands(); if(!c.length) return;
    if(!cur||!c.includes(cur)){ focus(pickDefault(c)); return; }
    const r=cur.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2; let best=null, bs=1e9;
    for(const el of c){
        if(el===cur) continue; const q=el.getBoundingClientRect(), dx=q.left+q.width/2-cx, dy=q.top+q.height/2-cy;
        const along=dir==="right"?dx:dir==="left"?-dx:dir==="down"?dy:-dy, across=(dir==="left"||dir==="right")?dy:dx;
        if(along<4) continue; const s=along+Math.abs(across)*2.2; if(s<bs){ bs=s; best=el; }
    }
    if(best) focus(best);
}
const isRange=el=>el&&el.tagName==="INPUT"&&(el.type==="range"||el.type==="number");
function fire(el){ el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); }
function stepRange(el,d){ const st=+el.step||1, mn=el.min!==""?+el.min:-1e9, mx=el.max!==""?+el.max:1e9; el.value=+(clampf((+el.value||0)+d*st,mn,mx)).toFixed(4); fire(el); }
function stepSelect(el,d){ const n=el.options.length; el.selectedIndex=(el.selectedIndex+d+n)%n; fire(el); }
function horiz(d){ // ◄ ► : change la valeur si on est sur un curseur / une liste, sinon se déplace
    if(isRange(cur)){ stepRange(cur,d); return; } if(cur&&cur.tagName==="SELECT"){ stepSelect(cur,d); return; } move(d>0?"right":"left");
}

/* ---------- Clavier virtuel (pour pseudo, code de partie, e-mail…) ---------- */
let osk=null, oskT=null, maj=true;
const ROWS=["1234567890","AZERTYUIOP","QSDFGHJKLM","WXCVBN@._-"];
function buildOsk(){
    osk=document.createElement("div"); osk.id="padOsk";
    osk.innerHTML='<div class="oskBox"><div id="oskText"></div>'+ROWS.map(r=>'<div class="oskRow">'+[...r].map(ch=>'<button data-ch="'+ch+'">'+ch+'</button>').join("")+'</div>').join("")+
    '<div class="oskRow"><button data-a="maj">Aa</button><button data-a="space" class="wide">ESPACE</button><button data-a="del">⌫</button><button data-a="no">✕</button><button data-a="ok" id="oskOk">✓ OK</button></div></div>';
    document.body.appendChild(osk);
    osk.addEventListener("click",e=>{
        const b=e.target.closest("button"); if(!b||!oskT) return; const a=b.dataset.a;
        if(a==="ok"||a==="no"){ closeOsk(); return; }
        if(a==="maj"){ maj=!maj; paintOsk(); return; }
        if(a==="del") oskT.value=oskT.value.slice(0,-1);
        else{ const ch=a==="space"?" ":(maj?b.dataset.ch:b.dataset.ch.toLowerCase()); if(!(oskT.maxLength>0&&oskT.value.length>=oskT.maxLength)) oskT.value+=ch; }
        fire(oskT); $("oskText").textContent=(oskT.type==="password"?"•".repeat(oskT.value.length):oskT.value)+"▏";
    });
}
function paintOsk(){ osk.querySelectorAll("[data-ch]").forEach(b=>{ b.textContent=maj?b.dataset.ch:b.dataset.ch.toLowerCase(); }); }
function openOsk(el){ if(!osk) buildOsk(); oskT=el; osk.style.display="flex"; paintOsk(); $("oskText").textContent=(el.type==="password"?"•".repeat(el.value.length):el.value)+"▏"; focus(null); }
function closeOsk(){ if(!osk) return; osk.style.display="none"; const t=oskT; oskT=null; focus(null); if(t){ cur=null; setTimeout(()=>{ if(shown(t)) focus(t); },0); } }

function activate(el){
    const t=el.tagName, ty=(el.type||"").toLowerCase();
    if(t==="TEXTAREA"||(t==="INPUT"&&["","text","password","email","search","tel"].includes(ty))){ openOsk(el); return; }
    if(t==="INPUT"&&ty==="number"){ openOsk(el); return; }
    if(t==="SELECT"){ stepSelect(el,1); return; }
    if(t==="INPUT"&&ty==="range") return;
    el.click();
}
const CLOSE='#shClose,#mpClose,#pdClose,#gxClose,#gfX,#hpClose,#acClose,#lbClose,[data-a="close"],.shTop button';
function back(){
    if(osk&&shown(osk)){ closeOsk(); return true; }
    const roots=layerRoots()||[]; for(const r of roots){ const b=[...r.querySelectorAll(CLOSE)].find(shown); if(b){ b.click(); focus(null); return true; } }
    return false;
}
function cycleTab(d){
    const t=[...document.querySelectorAll("#lbBar .lbTabs button")].filter(shown); if(!t.length) return;
    const i=Math.max(0,t.findIndex(b=>b.classList.contains("on"))); t[(i+d+t.length)%t.length].click(); focus(null);
}
const hit=sel=>{ const b=document.querySelector(sel); if(b&&shown(b)){ b.click(); focus(null); } };

/* ---------- Répétition des directions (stick / croix) ---------- */
const held={};
function dirEdges(p){
    const AX=window.PADCFG?PADCFG.ax:{lx:0,ly:1}, lx=p.axes[AX.lx]||0, ly=p.axes[AX.ly]||0, b=i=>p.buttons[i]&&p.buttons[i].pressed, now=performance.now();
    const d={up:b(12)||ly<-.6,down:b(13)||ly>.6,left:b(14)||lx<-.6,right:b(15)||lx>.6}, out=[];
    for(const k in d){ if(!d[k]){ delete held[k]; continue; } const h=held[k]; if(!h){ held[k]={next:now+380}; out.push(k); } else if(now>=h.next){ h.next=now+110; out.push(k); } }
    return out;
}

/* ---------- Point d'entrée appelé par la boucle manette (remplace l'ancienne navigation) ---------- */
window.padMenu=(raw,CF,BK)=>{
    const roots=layerRoots(); if(!roots){ if(cur){ focus(null); } return false; }
    const p=[...(navigator.getGamepads?navigator.getGamepads():[])].find(x=>x&&x.connected); if(!p) return true;
    const base=state==="lobby"&&roots.includes($("lbBar"));
    // directions
    for(const d of dirEdges(p)){ if(d==="left") horiz(-1); else if(d==="right") horiz(1); else move(d); }
    if(!cur||!cands().includes(cur)){ const c=cands(); if(c.length&&(p.buttons.some(b=>b.pressed)||p.axes.some(a=>Math.abs(a)>.6))) focus(pickDefault(c)); }
    // valider / retour
    if(raw(CF)&&cur&&cands().includes(cur)) activate(cur);
    if(raw(BK)){ if(!back()){ if(shown($("pauseMenu"))) $("btnResume").click(); } }
    // raccourcis
    const ovl=!!roots.length&&(base||roots[0].classList.contains("ovl")||roots[0].id==="shop");
    if(ovl){ if(raw(4)) cycleTab(-1); if(raw(5)) cycleTab(1); }
    if(base){ if(raw(9)) hit("#playBtn"); if(raw(3)) hit('.ibtn[title="Paramètres"]'); if(raw(2)) hit('.ibtn[title="Cadeau du jour"]'); if(raw(8)) hit('.ibtn[title^="Changer de mode"]'); }
    else if(shown($("pauseMenu"))&&raw(9)) $("btnResume").click();
    return true;
};
})();

/* ===== jeu-13c ===== */
/* ===== v9 (partie C) : MULTIJOUEUR — même boîte pour l'hôte et l'invité + petit panneau « Paramètres » (hôte seulement) ===== */
(()=>{
const $=id=>document.getElementById(id), jb=$("joinBox");
const esc=s=>String(s).replace(/</g,"&lt;");

/* ---------- Nouvelles options dans le panneau de l'hôte : bots + niveau ---------- */
const mo=$("mpOpts"), det=mo.querySelector("details");
const sel=(id,l,o)=>'<label>'+l+'<select id="'+id+'">'+o.map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join("")+'</select></label>';
det.insertAdjacentHTML("beforeend",
    sel("moBots","Nombre de bots",[[0,"Aucun"],[1,"1"],[2,"2"],[3,"3"],[4,"4"],[6,"6"],[8,"8"],[10,"10"],[15,"15"],[20,"20"]])+
    sel("moBl","Niveau des bots",[["normal","Normal"],["facile","Facile"],["difficile","Difficile"],["expert","Expert"]]));

/* ---------- Petit panneau flottant (comme le panneau admin) : ✕ pour fermer ---------- */
const hp=document.createElement("div"); hp.id="hostPanel";
hp.innerHTML='<div class="hpT"><b>⚙ PARAMÈTRES DE LA PARTIE</b><button id="hpClose" title="Fermer">✕</button></div><div class="hpB" id="hpBody"></div>';
document.body.appendChild(hp);
const body=$("hpBody");
const modeLbl=$("mpMode").parentNode; body.appendChild(modeLbl); body.appendChild(mo);   // on déplace les vrais champs : tout continue de fonctionner
$("hpClose").onclick=()=>{ hp.style.display="none"; };

/* ---------- Boîte de salle : identique pour l'hôte et pour celui qui a rejoint ---------- */
const room=document.createElement("div"); room.id="jbRoom";
room.innerHTML='<div class="jbCode">CODE DE LA PARTIE<b id="jbCodeShow"></b></div><div id="jbList"></div><div id="jbCfg"></div>'+
    '<button id="jbSet">⚙ PARAMÈTRES</button><button class="pri" id="jbGo">▶ LANCER LA PARTIE</button>';
jb.insertBefore(room,$("jbSt"));
$("jbSet").onclick=()=>{ hp.style.display=hp.style.display==="flex"?"none":"flex"; };
$("jbGo").onclick=()=>$("mpStart").click();

const MODE={dm:"Combat à mort",tdm:"Équipes (Bleu / Rouge)",br:"Battle Royale"}, MAP={ville:"Ville",survie:"Vallée"};
const curCfg=()=>({mode:$("mpMode").value,map:$("moMap").value,limit:+$("moLim").value,bots:+$("moBots").value,bl:$("moBl").value});
function pushCfg(){ if(!window.MP||!MP.host) return; MP.cfg=curCfg(); if(MP.api) MP.api.bcast({t:"cfg",cfg:MP.cfg}); }
hp.addEventListener("input",pushCfg); hp.addEventListener("change",pushCfg);

setInterval(()=>{
    const M=window.MP, inRoom=!!(M&&M.peer&&M.code&&M.players&&Object.keys(M.players).length);
    room.style.display=inRoom?"flex":"none";
    ["jbName","jbCode","jbJoin","jbCreate","jbPub"].forEach(id=>{ $(id).style.display=inRoom?"none":""; });
    if(inRoom){
        $("jbCodeShow").textContent=M.code;
        $("jbList").innerHTML=Object.values(M.players).map(p=>'<div class="jbP"><i style="background:#'+(((p.skin||{}).body)||0x168cff).toString(16).padStart(6,"0")+'"></i>'+esc(p.name)+(p.id===0?" 👑":"")+(p.bot?" 🤖":"")+'</div>').join("");
        if(M.host&&!M.cfg) pushCfg();
        const c=M.host?curCfg():(M.cfg||{}); 
        $("jbCfg").innerHTML=c.mode?('<b>'+(MODE[c.mode]||c.mode)+'</b> · '+(MAP[c.map]||c.map)+(c.mode==="br"?"":' · '+c.limit+' éliminations')+(c.bots?' · '+c.bots+' bot'+(c.bots>1?'s':''):''))
                                    :"En attente des paramètres de l'hôte…";
        $("jbSet").style.display=M.host?"block":"none"; $("jbGo").style.display=M.host?"block":"none";
    }
    if(!M||!M.host||!inRoom) hp.style.display="none";
},300);
})();

/* ===== jeu-13d ===== */
/* ===== v9 (partie D) : THÈME VISUEL (style des images : bleu nuit, verre, texte fin) + TÉLÉPHONE ===== */
/* Ce bloc ne change AUCUNE fonction : il ne fait que repeindre ce qui existe déjà.
   Pour changer une couleur, modifie les variables au tout début (--blue, --blue2, --glass…). */
(()=>{
const st=document.createElement("style"); st.id="v9Theme";
st.textContent=`
:root{--ui:"Rajdhani","Barlow Condensed","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
 --glass:rgba(9,17,33,.78);--glass2:rgba(13,25,47,.9);--line:rgba(130,175,255,.16);--line2:rgba(130,175,255,.34);
 --blue:#2f8cff;--blue2:#5db4ff;--txt:#e9f1ff;--dim:#90a4c6;--red:#ff4d4d}
body,button,input,select,textarea{font-family:var(--ui)!important}
body{color:var(--txt)}

/* ----- fond du salon (image) ----- */
#lobbyBg{display:none;position:fixed;inset:0;z-index:55;background:#08101f center/cover no-repeat}
#lobby::before{background:linear-gradient(90deg,rgba(4,8,18,.5),transparent 55%)!important}

/* ----- barre du haut : taille FIXE (les pastilles de manette ne la déforment plus) ----- */
#lbBar{height:64px;padding:0 28px;display:flex;align-items:center;gap:28px;background:linear-gradient(180deg,rgba(4,8,18,.9),rgba(4,8,18,0))!important;border:0!important;box-shadow:none!important;overflow:hidden}
.lbLogo{font:700 28px/1 var(--ui)!important;font-style:normal!important;letter-spacing:2px;text-shadow:none!important;color:#fff;white-space:nowrap;flex:none}
.lbLogo b{color:var(--blue2);text-shadow:0 0 14px rgba(47,140,255,.75)}
.lbTabs{display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none;min-width:0;flex:1}
.lbTabs::-webkit-scrollbar{display:none}
.lbTabs button{flex:none;height:36px;padding:0 16px;margin:0!important;border:0!important;border-left:3px solid transparent!important;border-radius:0;clip-path:none!important;background:transparent!important;color:var(--dim);font:600 14px var(--ui)!important;font-style:normal!important;letter-spacing:2px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;cursor:pointer;transition:.15s}
.lbTabs button:hover{color:#fff;background:rgba(255,255,255,.06)!important}
.lbTabs button.on{color:#fff;background:linear-gradient(90deg,rgba(47,140,255,.5),rgba(47,140,255,.04))!important;border-left-color:var(--blue2)!important}
.pbg{width:auto!important;height:16px!important;flex:none;margin:0 3px!important}
#lbRight{flex:none}
.ibtn{width:36px;height:36px;border:1px solid var(--line)!important;border-radius:4px;clip-path:none!important;background:rgba(255,255,255,.05)!important;color:var(--txt)}
.ibtn:hover{border-color:var(--blue2)!important;background:rgba(47,140,255,.2)!important;color:#fff;transform:none}

/* ----- panneaux, pièces, boutons ----- */
.hudPanel{background:var(--glass)!important;border:1px solid var(--line)!important;border-radius:4px!important;clip-path:none!important;backdrop-filter:blur(8px);font:600 15px var(--ui);letter-spacing:1px;color:var(--txt)}
.actionBtn{background:var(--glass2)!important;color:var(--txt)!important;border:1px solid var(--line2)!important;border-radius:4px!important;clip-path:none!important;font:600 15px var(--ui)!important;font-style:normal!important;letter-spacing:2px;text-transform:uppercase;flex-direction:row;gap:10px;padding:12px 22px;min-width:0}
.actionBtn:not(.secondary){background:linear-gradient(90deg,rgba(47,140,255,.9),rgba(28,95,207,.9))!important;border-color:var(--blue2)!important;color:#fff!important}
.actionBtn:hover{filter:brightness(1.15)}.actionBtn:disabled{opacity:.45}.actionBtn svg{width:20px;height:20px}
.tile,#modeCards .tile{background:var(--glass)!important;border:1px solid var(--line)!important;border-left:3px solid var(--line2)!important;border-radius:4px;clip-path:none!important;color:var(--txt);transform:none!important}
.tile::after{display:none}.tile>*{transform:none}
.tile:hover{border-color:var(--blue2)!important;background:rgba(20,40,75,.88)!important}
.tile.on{background:linear-gradient(90deg,rgba(47,140,255,.5),rgba(47,140,255,.08))!important;border-left-color:var(--blue2)!important;color:#fff}
.tile .name{font:700 18px var(--ui);letter-spacing:2px;text-transform:uppercase;font-style:normal}.tile .desc{color:var(--dim)}
#playBtn{background:linear-gradient(90deg,#2f8cff,#1c5fcf)!important;clip-path:none!important;border-radius:4px!important;animation:none!important;text-shadow:none!important;font:700 22px var(--ui)!important;font-style:normal!important;letter-spacing:7px;box-shadow:0 8px 30px rgba(47,140,255,.35)}
#playBtn:hover{transform:none;filter:brightness(1.15)}
#modeLbl{font:600 14px var(--ui);letter-spacing:3px;color:var(--dim)}
#missions{background:var(--glass)!important;border:1px solid var(--line)!important;border-radius:4px;clip-path:none!important;color:var(--txt)}
#pauseMissions{background:var(--glass);border:1px solid var(--line);border-radius:4px}

/* ----- écrans : pause / fin de partie = liste à gauche, comme sur les images ----- */
#pauseMenu,#gameOver{background:radial-gradient(ellipse at 15% 50%,rgba(15,35,70,.93),rgba(4,8,18,.97))!important;align-items:flex-start;padding-left:clamp(22px,9vw,150px);text-align:left}
#pauseMenu .actions,#gameOver .actions{flex-direction:column;gap:4px;width:min(380px,100%)}
#pauseMenu .actionBtn,#gameOver .actionBtn{width:100%;justify-content:flex-start;background:transparent!important;border:0!important;border-left:3px solid transparent!important;padding:13px 18px;color:var(--txt)!important}
#pauseMenu .actionBtn:first-child,#gameOver .actionBtn:first-child{background:linear-gradient(90deg,rgba(47,140,255,.55),rgba(47,140,255,.04))!important;border-left-color:var(--blue2)!important}
#pauseMenu .actionBtn:hover,#gameOver .actionBtn:hover{background:rgba(255,255,255,.08)!important}
.statLine{font:700 clamp(26px,4vw,42px)/1.1 var(--ui)!important;font-style:normal!important;letter-spacing:5px;color:#fff!important;text-shadow:none!important;text-transform:uppercase}
.resultIcon svg{width:32px!important;height:32px!important;opacity:.9}

/* ----- HUD en jeu : vie « + 100 » avec barre fine ----- */
#hud .hudPanel{background:transparent!important;border:0!important;padding:0;backdrop-filter:none;gap:10px}
#hud #iconHealth svg{display:none}
#hud #iconHealth::before{content:"+";font:300 36px/1 var(--ui);color:#fff}
.bar{height:6px!important;border-radius:0!important;transform:none!important;background:rgba(255,255,255,.18)!important;border:0!important}
.bar div{border-radius:0!important}
#hud .bar{width:150px;height:4px!important}
#hud .bar div{background:#fff!important}
#hud.low .bar div{background:var(--red)!important}
#playerHealthNum{font:600 30px var(--ui);color:#fff}
#enemyBar div{background:var(--red)!important}
#topRight .hudPanel{font-size:15px}
.slot{background:var(--glass)!important;border:1px solid var(--line)!important;border-radius:4px!important;clip-path:none!important;backdrop-filter:blur(6px)}
.slot.active{border-color:var(--blue2)!important;background:rgba(47,140,255,.28)!important;box-shadow:0 0 16px rgba(47,140,255,.45)!important}
.slot .badge{color:#fff;font:600 12px var(--ui)}
#mpHud,#mpFeed,#mpDeath,#killMsg,#fps,#waveFlash{font-family:var(--ui)!important}
#mpHud div,#mpFeed div{background:var(--glass)!important;border-radius:3px;border-left:2px solid var(--blue2)}
#killMsg{letter-spacing:5px;text-transform:uppercase}

/* ----- menus plein écran, réglages, boutique ----- */
.ovl,#shop{background:linear-gradient(135deg,rgba(5,10,22,.97),rgba(9,20,40,.97))!important}
.shTop{border-bottom:1px solid var(--line)}
.shTitle{font:700 26px var(--ui)!important;font-style:normal!important;letter-spacing:5px;text-shadow:none!important;color:#fff}
.gxBox,#mpOpts{background:var(--glass)!important;border:1px solid var(--line)!important;border-radius:4px}
.gxBox h4{color:var(--blue2);font:700 14px var(--ui);letter-spacing:3px;text-transform:uppercase;border-bottom:1px solid var(--line);padding-bottom:6px;margin:14px 0 6px}
.gxBox label{color:var(--txt);font:600 15px var(--ui)}
input:not([type=checkbox]):not([type=range]),select,textarea{background:rgba(6,12,26,.92)!important;color:var(--txt)!important;border:1px solid var(--line2)!important;border-radius:4px}
input[type=range],input[type=checkbox]{accent-color:var(--blue2)}
.skCard{border-radius:4px!important;clip-path:none!important}
.pdRow button{background:var(--glass)!important;color:var(--txt)!important;border:1px solid var(--line2)!important;border-radius:4px}
.pdRow button.on{background:var(--blue)!important;color:#fff!important}

/* ----- petites fenêtres : multijoueur, admin, cadeau, code admin, paramètres hôte ----- */
#joinBox,#admin,#hostPanel,.gfIn,.agBox{background:var(--glass2)!important;border:1px solid var(--line2)!important;border-left:3px solid var(--blue2)!important;border-radius:6px!important;clip-path:none!important;backdrop-filter:blur(10px);color:var(--txt)}
#joinBox{width:min(310px,calc(100vw - 24px))}
#joinBox input{background:rgba(6,12,26,.92)!important;color:#fff!important;border:1px solid var(--line2)!important;border-radius:4px;font:600 16px var(--ui)}
#joinBox button{padding:10px;border:1px solid var(--line2);background:var(--glass);color:var(--txt);font:600 14px var(--ui)!important;letter-spacing:2px;border-radius:4px;cursor:pointer;transition:.15s}
#joinBox button:hover{border-color:var(--blue2)}
#joinBox button.pri,#jbGo{background:linear-gradient(90deg,#2f8cff,#1c5fcf)!important;border-color:var(--blue2)!important;color:#fff!important}
.jbT{font:700 16px var(--ui)!important;letter-spacing:3px;color:#fff!important}
#jbSt{font:600 13px var(--ui);color:var(--dim)}
#jbRoom{display:none;flex-direction:column;gap:8px}
.jbCode{font:600 12px var(--ui);letter-spacing:2px;color:var(--dim);display:flex;flex-direction:column;gap:2px}
.jbCode b{font:700 32px var(--ui);letter-spacing:9px;color:#fff}
#jbList{display:flex;flex-direction:column;gap:4px;max-height:150px;overflow:auto}
.jbP{display:flex;align-items:center;gap:8px;font:600 14px var(--ui)}.jbP i{width:10px;height:10px;border-radius:50%;flex:none}
#jbCfg{font:500 13px var(--ui);color:var(--dim)}#jbCfg b{color:var(--blue2)}
#hostPanel{display:none;position:fixed;top:80px;right:24px;z-index:130;width:min(360px,calc(100vw - 24px));max-height:calc(100vh - 100px);flex-direction:column;padding:0;overflow:hidden}
.hpT{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--line);font:700 14px var(--ui);letter-spacing:2px}
.hpT button{width:30px;height:30px;border:1px solid var(--line2);background:var(--glass);color:#fff;border-radius:4px;cursor:pointer;font-size:15px}
.hpT button:hover{background:rgba(255,77,77,.3)}
.hpB{overflow:auto;padding:10px 14px;display:flex;flex-direction:column;gap:8px}
.hpB label{display:flex;justify-content:space-between;align-items:center;gap:10px;font:600 14px var(--ui);color:var(--txt)}
.hpB select{max-width:180px}
#mpOpts{background:none!important;border:0!important;padding:0!important}#mpOpts summary{color:var(--blue2);font:700 13px var(--ui);letter-spacing:2px}
#modeSelect{background:radial-gradient(ellipse at 50% 30%,rgba(15,40,85,.92),rgba(4,8,18,.97))!important}
.msLogo{font:700 58px var(--ui)!important;font-style:normal!important;letter-spacing:6px;text-shadow:none!important}.msLogo b{color:var(--blue2);text-shadow:0 0 22px rgba(47,140,255,.8)}
.msCard{clip-path:none!important;border-radius:6px;border:1px solid var(--line2)!important;border-left:3px solid var(--blue2)!important;background:var(--glass)!important;color:var(--txt)!important}
.msCard h2{font:700 30px var(--ui)!important;font-style:normal!important;letter-spacing:4px}
.msCard.on,.msCard:hover{background:linear-gradient(90deg,rgba(47,140,255,.5),rgba(47,140,255,.08))!important;color:#fff!important;transform:none;border-left-color:#fff!important}
.gfD{border-radius:4px;border-color:var(--line2)}.gfD.cur{border-color:var(--blue2);background:rgba(47,140,255,.25)}

/* ----- viseur, headshot, mini-carte ----- */
#crosshair.hs:before,#crosshair.hs:after{background:#ff2a2a!important;box-shadow:0 0 8px #f00}
#hsMsg{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%) scale(.6);z-index:36;pointer-events:none;opacity:0;font:700 22px var(--ui);letter-spacing:6px;color:#ffd5d5;text-shadow:0 0 14px rgba(255,60,60,.9)}
#hsMsg.kill{font-size:32px;color:#fff}
#hsMsg.show{animation:hsPop .75s ease-out forwards}
@keyframes hsPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}100%{opacity:0;transform:translate(-50%,-95%) scale(1)}}
#mini{display:none;position:fixed;top:74px;left:14px;width:150px;height:150px;z-index:21;pointer-events:none;filter:drop-shadow(0 4px 14px rgba(0,0,0,.55))}

/* ----- manette : cadre de sélection + clavier virtuel ----- */
.padFocus{outline:2px solid var(--blue2)!important;outline-offset:2px;box-shadow:0 0 0 5px rgba(93,180,255,.22),0 0 22px rgba(47,140,255,.55)!important;position:relative;z-index:2}
#padOsk{display:none;position:fixed;inset:0;z-index:300;background:rgba(2,5,12,.9);align-items:center;justify-content:center}
.oskBox{background:var(--glass2);border:1px solid var(--line2);border-radius:8px;padding:18px;display:flex;flex-direction:column;gap:8px;max-width:96vw}
#oskText{font:600 24px var(--ui);color:#fff;min-height:38px;border-bottom:2px solid var(--blue2);padding:4px 8px;margin-bottom:6px;word-break:break-all}
.oskRow{display:flex;gap:6px;justify-content:center}
.oskRow button{min-width:clamp(30px,6vw,54px);height:clamp(34px,6vw,52px);border:1px solid var(--line2);background:var(--glass);color:#fff;font:600 18px var(--ui);border-radius:4px;cursor:pointer}
.oskRow .wide{flex:1;min-width:110px}

/* =========================================================
   TÉLÉPHONE / TABLETTE (écran tactile) : tout est recalculé à partir de la taille de l'écran
========================================================= */
 #mobileUI{--u:clamp(54px,13vmin,82px);--g:max(16px,env(safe-area-inset-right,0px))}
 #joyBase{left:max(18px,env(safe-area-inset-left,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));width:calc(var(--u)*2.1);height:calc(var(--u)*2.1)}
 #joyKnob{width:calc(var(--u)*.9);height:calc(var(--u)*.9)}
 .mobileBtn{width:var(--u)!important;height:var(--u)!important;background:rgba(9,17,33,.55);border:1px solid rgba(130,175,255,.5);backdrop-filter:blur(4px)}
 .mobileBtn svg{width:48%;height:48%}
 .mobileBtn.shootBtn{width:calc(var(--u)*1.4)!important;height:calc(var(--u)*1.4)!important;background:rgba(255,77,77,.4);border-color:rgba(255,120,120,.9)}
 #btnShoot{right:var(--g)!important;bottom:max(18px,env(safe-area-inset-bottom,0px))!important}
 #btnJump{right:calc(var(--g) + var(--u)*1.4 + 10px)!important;bottom:calc(max(18px,env(safe-area-inset-bottom,0px)) + 4px)!important}
 #btnAim{right:calc(var(--g) + var(--u)*.2)!important;bottom:calc(max(18px,env(safe-area-inset-bottom,0px)) + var(--u)*1.4 + 12px)!important}
 #btnWeapon{right:calc(var(--g) + var(--u)*1.4 + 10px)!important;bottom:calc(max(18px,env(safe-area-inset-bottom,0px)) + var(--u) + 18px)!important}
 #btnView{right:var(--g)!important;bottom:calc(max(18px,env(safe-area-inset-bottom,0px)) + var(--u)*2.4 + 26px)!important}
}
@media (pointer:coarse){
 #btnPause{top:max(10px,env(safe-area-inset-top,0px));width:38px;height:38px}
 #hud{top:max(8px,env(safe-area-inset-top,0px));left:max(10px,env(safe-area-inset-left,0px))}
 #playerHealthNum{font-size:24px}#hud .bar{width:110px}
 #topRight{top:max(8px,env(safe-area-inset-top,0px));right:max(10px,env(safe-area-inset-right,0px))}
 #topRight .hudPanel{font-size:13px;padding:5px 9px;margin-bottom:4px}
 #mini{width:96px;height:96px;top:56px;left:max(10px,env(safe-area-inset-left,0px))}
 #hotbar{bottom:6px;gap:4px}#hotbar .slot{width:40px;height:40px}
 #mpHud{transform:scale(.8);transform-origin:top right}
 #hsMsg{font-size:18px}
 .actionBtn{padding:11px 16px}
}
@media (max-width:760px){
 #lbBar{padding:0 12px;gap:10px;height:56px}.lbLogo{font-size:20px!important}
 .lbTabs button{padding:0 10px;font-size:13px!important;letter-spacing:1px}
 .ibtn{width:32px;height:32px}
 #modeCards{gap:8px;padding:0 10px}
 .tile{padding:10px!important}.tile .desc{display:none}
 #playBtn{font-size:18px!important;letter-spacing:4px;padding:12px 40px}
 .ovl,#shop{padding-top:68px!important}
 .gxBox{padding:12px!important}
 #joinBox{right:10px;bottom:10px}
 #hostPanel{top:62px;right:10px;left:10px;width:auto}
 .msCard{width:min(290px,86vw);padding:22px 14px}.msLogo{font-size:40px!important}
 .statLine{font-size:26px!important}
 #pauseMenu,#gameOver{padding-left:22px;padding-right:22px}
}
@media (max-height:480px){
 #lbBar{height:48px}.lbTabs button{height:30px}
 #modeCards{margin-top:52px!important}
 .oskBox{padding:8px;gap:4px}#oskText{font-size:18px;min-height:28px}
}
`;
document.head.appendChild(st);
})();

/* ===== jeu-14 ===== */
/* ===== v10 : CORRECTIFS (touches coincées, clavier AZERTY, Ctrl+R, pause auto) + PETITES FONCTIONS (hit-marker, vibrations, plein écran, écran allumé) ===== */
(()=>{
const solo=()=>!(window.MP&&MP.active);
const buzz=p=>{ try{ if(isMobile&&navigator.vibrate) navigator.vibrate(p); }catch(e){} };

/* Touches coincées : tout est relâché quand la fenêtre perd le focus ou que l'onglet est caché */
const release=()=>{ for(const k in keys) keys[k]=false; };
addEventListener("blur",release);
document.addEventListener("visibilitychange",()=>{
    if(!document.hidden) return;
    release();
    if(state==="playing"&&!paused&&!gameFinished&&solo()) pauseGame();
});

/* Armes 1-9 : par position physique de la touche (sur AZERTY, les chiffres demandent Maj) + pavé numérique */
addEventListener("keydown",e=>{
    const m=/^(?:Digit|Numpad)([1-9])$/.exec(e.code||"");
    if(!m||e.repeat||state!=="playing"||paused) return;
    const k=weaponOrder[m[1]-1];
    if(!k||(window.G&&G.ok&&!G.ok(k))) return;
    currentWeapon=weapons[k]; updateWeaponHUD();
});

/* Ctrl = s'accroupir : on bloque Ctrl+R (recharge la page !), Ctrl+S, Ctrl+D… pendant la partie */
addEventListener("keydown",e=>{ if(state==="playing"&&e.ctrlKey&&!e.altKey&&/^Key[ADFGHPRSUZ]$/.test(e.code)) e.preventDefault(); },true);

/* Hit-marker : croix blanche quand on touche, rouge + vibration quand on élimine */
const hm=document.createElement("div"); hm.id="hitMark"; hm.innerHTML="<i></i><i></i><i></i><i></i>"; document.body.appendChild(hm);
const _dmg=damageEnemy;
damageEnemy=function(e,d){
    const u=e&&e.userData, a=!!(u&&u.alive), h=a?u.hp:0;
    const r=_dmg(e,d);
    if(a&&u.hp<h){ hm.className=""; void hm.offsetWidth; hm.className=u.alive?"on":"on kill"; buzz(u.alive?12:[18,30,26]); }
    return r;
};

/* Vibration quand on perd de la vie + titre de l'onglet « Pause » */
let hp0=100; const T0=document.title;
setInterval(()=>{
    if(typeof playerHP==="number"){ if(playerHP<hp0-.5) buzz(playerHP<=0?[60,40,120]:35); hp0=playerHP; }
    const t=state==="playing"&&paused?"⏸ Pause — "+T0:T0; if(document.title!==t) document.title=t;
},120);

/* Écran allumé pendant la partie (mobile) */
let wl=null;
const wake=async()=>{
    try{
        if(!isMobile||!navigator.wakeLock) return;
        if(state==="playing"&&!document.hidden&&!wl){ wl=await navigator.wakeLock.request("screen"); wl.addEventListener("release",()=>{ wl=null; }); }
        else if(state!=="playing"&&wl){ const w=wl; wl=null; await w.release(); }
    }catch(e){ wl=null; }
};
setInterval(wake,4000);
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) wake(); });

/* Bouton « Plein écran » dans le menu pause (absent sur iPhone, qui ne gère pas l'API) */
const de=document.documentElement, box=document.querySelector("#pauseMenu .actions");
if(de.requestFullscreen&&box){
    const b=document.createElement("button"); b.className="actionBtn secondary"; b.textContent="Plein écran";
    b.addEventListener("click",()=>{ try{ const p=document.fullscreenElement?document.exitFullscreen():de.requestFullscreen({navigationUI:"hide"}); if(p&&p.catch) p.catch(()=>{}); }catch(e){} });
    box.appendChild(b);
}
})();

}
demarrer();