/* Durexporta — procedural 3D fruits that assemble piece by piece (three.js r128) */
(function(){
const T=THREE;
const ease={
  outBack:t=>{const c=1.9,c3=c+1;return 1+c3*Math.pow(t-1,3)+c*Math.pow(t-1,2)},
  outCubic:t=>1-Math.pow(1-t,3),inCubic:t=>t*t*t,
  smooth:t=>t*t*(3-2*t)
};
const cl=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
function hash(x,y,z){const s=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return s-Math.floor(s)}
function noise3(x,y,z){ // cheap value noise
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz);let r=0;
  for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)
    r+=hash(ix+a,iy+b,iz+c)*(a?u:1-u)*(b?v:1-v)*(c?w:1-w);
  return r;
}

/* ---- geometry helpers ---- */
function profilePts(fn,n=48){const p=[];for(let i=0;i<=n;i++){const t=i/n;p.push(new T.Vector2(Math.max(.0005,fn(t)),(t-.5)));}return p}
function colorize(g,fn){
  const pos=g.attributes.position,c=new Float32Array(pos.count*3),col=new T.Color();
  for(let i=0;i<pos.count;i++){fn(pos.getX(i),pos.getY(i),pos.getZ(i),col);col.convertSRGBToLinear();c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b}
  g.setAttribute('color',new T.BufferAttribute(c,3));
}
function displace(g,fn){const p=g.attributes.position;for(let i=0;i<p.count;i++){const v=fn(p.getX(i),p.getY(i),p.getZ(i));p.setXYZ(i,v[0],v[1],v[2])}g.computeVertexNormals()}

const skinMat=o=>new T.MeshPhysicalMaterial(Object.assign({vertexColors:true,roughness:.42,clearcoat:.6,clearcoatRoughness:.35,sheen:0},o));
const fleshMat=c=>new T.MeshStandardMaterial({color:new T.Color(c).convertSRGBToLinear(),roughness:.55,side:T.BackSide});

/* wedge-split body: returns parts (each = skin + flesh) */
function wedgeBody(profile,{wedges=8,skin,flesh,bump,scaleY=1}){
  const parts=[];
  for(let w=0;w<wedges;w++){
    const phi0=w/wedges*Math.PI*2,len=Math.PI*2/wedges;
    const g=new T.LatheGeometry(profilePts(profile),18,phi0,len);
    g.scale(1,scaleY,1);
    if(bump)displace(g,bump);
    colorize(g,skin);
    const grp=new T.Group();
    grp.add(new T.Mesh(g,skinMat()));
    const gi=g.clone();gi.deleteAttribute('color');
    grp.add(new T.Mesh(gi,fleshMat(flesh)));
    const mid=phi0+len/2;grp.userData.dir=new T.Vector3(Math.sin(mid),0,Math.cos(mid));
    parts.push(grp);
  }
  return parts;
}

/* ---- fruits ---- */
function mango(){
  const prof=t=>Math.pow(Math.sin(Math.PI*t),.55)*(.40-.06*t);
  const parts=wedgeBody(prof,{wedges:10,scaleY:1.15,flesh:0xFFB21F,
    bump:(x,y,z)=>[x*1.08+.06*Math.sin(y*3),y,z*.86],
    skin:(x,y,z,c)=>{const t=y+.55,n=noise3(x*6,y*6,z*6);
      const g=new T.Color(0x6E9E2A),yel=new T.Color(0xE8C33A),red=new T.Color(0xC2273A);
      c.copy(g).lerp(yel,cl(t*.9+n*.25-.2)).lerp(red,cl((t-.45)*1.8+(x+z)*.6+n*.3))}});
  const stem=new T.Mesh(new T.CylinderGeometry(.012,.02,.12,8),new T.MeshStandardMaterial({color:0x5B3A1A,roughness:.8}));
  stem.position.y=.62;stem.rotation.z=.25;stem.userData.dir=new T.Vector3(0,1,0);
  const leaf=new T.Mesh(leafGeo(.32,.1),new T.MeshPhysicalMaterial({color:0x2F7A1F,roughness:.4,clearcoat:.5,side:T.DoubleSide}));
  leaf.position.set(.08,.64,0);leaf.rotation.set(.3,0,-.9);leaf.userData.dir=new T.Vector3(1,1,0);
  return {parts:[...parts,stem,leaf],tilt:-.35};
}
function leafGeo(L,W){const s=new T.Shape();s.moveTo(0,0);s.quadraticCurveTo(W,L*.5,0,L);s.quadraticCurveTo(-W,L*.5,0,0);const g=new T.ShapeGeometry(s,12);
  const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),x=p.getX(i);p.setZ(i,Math.sin(y/L*Math.PI)*.04+x*x*2)}g.computeVertexNormals();return g}

function pitahaya(){
  const prof=t=>Math.pow(Math.sin(Math.PI*t),.8)*.38;
  const body=wedgeBody(prof,{wedges:8,scaleY:1.05,flesh:0xF4F1EA,
    skin:(x,y,z,c)=>{const n=noise3(x*5,y*5,z*5);c.set(0xE8336E).lerp(new T.Color(0xFF6C98),n*.6).lerp(new T.Color(0xB81E57),cl(-y*.8))}});
  // seeds inside flesh
  const scales=[];const sm=new T.MeshPhysicalMaterial({vertexColors:true,roughness:.35,clearcoat:.7,side:T.DoubleSide});
  const rows=6;
  for(let r=0;r<rows;r++){const t=.14+r/(rows-1)*.74,y=(t-.5)*1.05,rad=prof(t);const n=7-(r%2);
    for(let k=0;k<n;k++){const a=k/n*Math.PI*2+(r%2)*.4;
      const g=new T.ConeGeometry(.06,.24,3,4,true);g.translate(0,.12,0);
      colorize(g,(x,yy,z,c)=>{c.set(0xE8336E).lerp(new T.Color(0x9BD13A),cl(yy*4.5-.25))});
      const m=new T.Mesh(g,sm);m.scale.set(1,1,.25);
      m.position.set(Math.sin(a)*rad*.98,y,Math.cos(a)*rad*.98);
      m.lookAt(m.position.clone().multiplyScalar(2).setY(y+.35));m.rotateX(Math.PI/2);
      m.userData.dir=new T.Vector3(Math.sin(a),.3,Math.cos(a));m.userData.late=1;scales.push(m)}}
  return {parts:[...body,...scales],tilt:.2};
}
function avocado(){
  const prof=t=>{const b=Math.sin(Math.PI*t);return b*(.27+.17*Math.pow(1-t,1.6))};
  const parts=wedgeBody(prof,{wedges:2,scaleY:1.15,flesh:0xD9E58A,
    bump:(x,y,z)=>{const n=noise3(x*22,y*22,z*22)*.018;const r=Math.hypot(x,z)||1;return [x+x/r*n,y,z+z/r*n]},
    skin:(x,y,z,c)=>{const n=noise3(x*25,y*25,z*25);c.set(0x1F4A12).lerp(new T.Color(0x3E7A22),n*.8)}});
  const seed=new T.Mesh(new T.SphereGeometry(.17,32,24),new T.MeshPhysicalMaterial({color:0x7A4A22,roughness:.3,clearcoat:.8}));
  seed.position.y=-.12;seed.userData.dir=new T.Vector3(0,0,0);seed.userData.first=1;
  const stem=new T.Mesh(new T.CylinderGeometry(.015,.02,.06,8),new T.MeshStandardMaterial({color:0x5B3A1A}));stem.position.y=.6;stem.userData.dir=new T.Vector3(0,1,0);
  return {parts:[seed,...parts,stem],tilt:.15};
}
function bunch(color,tip,count,curve,len){
  const parts=[];const prof=t=>Math.pow(Math.sin(Math.PI*cl(t*1.02)),.55)*.075*(1-.25*t)+.008;
  for(let i=0;i<count;i++){
    const g=new T.LatheGeometry(profilePts(prof,40),14);g.scale(1,len,1);
    displace(g,(x,y,z)=>{const tt=y/len+.5;return [x+curve*Math.pow(tt,2)*.5,y,z]});
    // 5-sided ridges
    displace(g,(x,y,z)=>{const a=Math.atan2(z,x);const k=1+.06*Math.cos(a*5);return [x*k,y,z*k]});
    colorize(g,(x,y,z,c)=>{const tt=y/len+.5;c.set(color).lerp(new T.Color(tip),cl((Math.abs(tt-.5)-.42)*9))});
    const m=new T.Mesh(g,skinMat({roughness:.5,clearcoat:.3}));
    const a=(i-(count-1)/2)*.22;
    const piv=new T.Group();piv.add(m);m.position.set(.0,len/2*.9,0);
    piv.rotation.set(-.3+(i%2)*.15,a*1.2,-.9+Math.abs(a)*.2);piv.position.set(Math.sin(a)*.05,-.2,Math.cos(a)*.08);
    piv.userData.dir=new T.Vector3(Math.sin(a*3),-.4,Math.cos(a*3));parts.push(piv);
  }
  const crown=new T.Mesh(new T.CylinderGeometry(.05,.08,.32,10),new T.MeshStandardMaterial({color:0x6E7F2A,roughness:.7}));
  crown.position.set(-.05,-.25,0);crown.rotation.z=1.2;crown.userData.dir=new T.Vector3(-1,0,0);crown.userData.first=1;
  return {parts:[crown,...parts],tilt:0};
}
const banana=()=>Object.assign(bunch(0x9CCB3A,0x4A5A20,6,.55,.85),{tilt:.1});
const plantain=()=>Object.assign(bunch(0x7FB534,0x3C4A1A,5,.35,1.05),{tilt:-.1});
const BUILDERS=[mango,pitahaya,banana,plantain,avocado];

/* ---- scene ---- */
function Stage(el,opts={}){
  const R=new T.WebGLRenderer({antialias:true,alpha:true});R.setPixelRatio(Math.min(2,devicePixelRatio));
  R.outputEncoding=T.sRGBEncoding;R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.0;R.physicallyCorrectLights=false;
  el.appendChild(R.domElement);Object.assign(R.domElement.style,{width:'100%',height:'100%',display:'block'});
  const S=new T.Scene(),C=new T.PerspectiveCamera(32,1,.1,50);C.position.set(0,0,4.2);
  S.add(new T.HemisphereLight(0xFFF6E0,0x3A2A10,.9));
  const key=new T.DirectionalLight(0xFFFFFF,1.6);key.position.set(2.5,3,3);S.add(key);
  const rim=new T.DirectionalLight(0xFFE2A8,1.1);rim.position.set(-3,1,-2);S.add(rim);
  const fill=new T.PointLight(0xFFFFFF,.5);fill.position.set(0,-2,3);S.add(fill);
  // contact shadow
  const sh=new T.Mesh(new T.CircleGeometry(.6,48),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.18,depthWrite:false}));
  sh.rotation.x=-Math.PI/2;sh.position.y=-.78;sh.scale.set(1,.5,1);S.add(sh);
  // sparkle burst
  const N=160,pg=new T.BufferGeometry(),pp=new Float32Array(N*3),pv=[];
  for(let i=0;i<N;i++){const u=Math.random()*Math.PI*2,v=Math.acos(2*Math.random()-1);pv.push(new T.Vector3(Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)).multiplyScalar(.6+Math.random()*.9))}
  pg.setAttribute('position',new T.BufferAttribute(pp,3));
  const pts=new T.Points(pg,new T.PointsMaterial({color:0xFFFFFF,size:.03,transparent:true,opacity:0,depthWrite:false}));S.add(pts);
  let burstT=9;

  const fruits=BUILDERS.map((b,i)=>{
    const f=b();const g=new T.Group();g.rotation.z=f.tilt;S.add(g);
    const late=[],early=[];
    f.parts.forEach(p=>{p.userData.home={pos:p.position.clone(),rot:p.rotation.clone(),q:p.quaternion.clone()};
      const d=p.userData.dir.clone();if(d.lengthSq()<.01)d.set(0,-1,0);d.normalize();
      p.userData.from=d.multiplyScalar(2.4+Math.random()*1.2).add(new T.Vector3(0,1.2+Math.random(),0));
      p.userData.spin=new T.Euler((Math.random()-.5)*6,(Math.random()-.5)*6,(Math.random()-.5)*6);
      g.add(p);(p.userData.first?early:p.userData.late?late:early.length>=0?early:late).push(p)});
    // order: first-flagged, then body pieces, then late (scales/leaves)
    const ordered=[...f.parts.filter(p=>p.userData.first),...f.parts.filter(p=>!p.userData.first&&!p.userData.late),...f.parts.filter(p=>p.userData.late)];
    return {g,parts:ordered,done:false};
  });

  function setFruit(i,build,leave){ // build 0..1 assembly, leave 0..1 departure
    const F=fruits[i];const vis=build>0&&leave<1;F.g.visible=vis;if(!vis){F.done=false;return}
    const n=F.parts.length;
    F.parts.forEach((p,j)=>{
      const st=j/n*.62,k=cl((build-st)/.38),e=ease.outBack(k);
      const h=p.userData.home,fr=p.userData.from,sp=p.userData.spin;
      const lk=ease.inCubic(cl((leave-(1-j/n)*.25)/.75));
      const off=(1-e)+lk*1.3;
      p.position.set(h.pos.x+fr.x*off,h.pos.y+fr.y*off-(lk*.6),h.pos.z+fr.z*off);
      p.rotation.set(h.rot.x+sp.x*off,h.rot.y+sp.y*off,h.rot.z+sp.z*off);
      const s=cl(k*1.6)*(1-lk*.5);p.scale.setScalar(Math.max(.001,s));
      if(p.scale&&p.userData.late&&k<1)p.scale.multiply(new T.Vector3(1,1,.25));
    });
    if(build>=1&&!F.done&&leave===0){F.done=true;burstT=0;F.pulse=0}
    if(build<.95)F.done=false;
  }
  function resize(){const w=el.clientWidth,h=el.clientHeight;R.setSize(w,h,false);C.aspect=w/h;C.updateProjectionMatrix()}
  addEventListener('resize',resize);resize();
  let t0=performance.now(),mx=0,my=0;
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5});
  el.addEventListener('pointerleave',()=>{mx=my=0});
  const api={fruits,setFruit,
    render(){const t=(performance.now()-t0)/1000;
      fruits.forEach(F=>{if(!F.g.visible)return;F.g.rotation.y=t*.45+mx*1.2;F.g.rotation.x=my*.5;
        if(F.pulse!=null&&F.pulse<1){F.pulse+=.035;const s=1+Math.sin(F.pulse*Math.PI)*.06;F.g.scale.setScalar(s)}else F.g.scale.setScalar(1)});
      F_burst(t);sh.material.opacity=.18;R.render(S,C)}};
  function F_burst(){burstT+=.016;const k=cl(burstT/1.1);pts.material.opacity=k<1?(1-k)*.9:0;
    for(let i=0;i<N;i++){const v=pv[i],d=ease.outCubic(k)*1.1;pp[i*3]=v.x*d;pp[i*3+1]=v.y*d;pp[i*3+2]=v.z*d}pg.attributes.position.needsUpdate=true}
  return api;
}
window.Fruit3D={Stage,ease};
})();