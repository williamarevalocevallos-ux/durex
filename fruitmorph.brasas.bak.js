/* Durexporta — motion-design fruit morph (WebGL) */
(function(){
const T=THREE;
const SRC=['img/mango-hd.webp','img/pitahaya-hd.webp','img/banano-hd.webp','img/platano-hd.webp','img/aguacate-hd.webp'];
const COLS=[[1,.72,.18],[1,.25,.55],[1,.86,.2],[.55,.85,.25],[.35,.75,.25]];
const loader=new T.TextureLoader();const ARS=SRC.map(()=>1);
const texs=SRC.map((s,i)=>{const t=loader.load(s,tx=>{ARS[i]=tx.image.width/tx.image.height;tx.needsUpdate=true});t.minFilter=T.LinearMipmapLinearFilter;t.encoding=T.sRGBEncoding;t.anisotropy=8;return t});
const VS=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FS=`
precision highp float;varying vec2 vUv;
uniform sampler2D uA,uB;uniform float uArA,uArB,uAr,uP,uT,uSA,uSB,uRA,uRB,uDA,uDB,uSh;uniform vec2 uM;uniform vec3 uCA,uCB;
float h(float n){return fract(sin(n*127.1)*43758.5453);}
float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*nz(p);p*=2.1;a*=.5;}return v;}
vec2 rot(vec2 v,float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c)*v;}
vec2 fit(vec2 uv,float ar){vec2 s=uAr>ar?vec2(uAr/ar,1.):vec2(1.,ar/uAr);return (uv-.5)*s*1.35+.5;}
vec4 tx(sampler2D t,vec2 uv){if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return vec4(0);return texture2D(t,uv);}
// dissolve: d=0 solid, d=1 gone. returns premultiplied color incl. ember edge
vec4 fruit(sampler2D t,float ar,vec2 c,float s,float r,float d,vec3 acc,float seed){
  vec2 q=rot(c,r)/s;vec2 uv=fit(q+.5,ar);vec4 m=tx(t,uv);
  if(m.a<.01)return vec4(0);
  float n=fbm(uv*vec2(ar,1.)*4.+seed)*.75+(1.-uv.y)*.25; // burns from bottom-up with noise
  float th=d*1.15-.08;
  float keep=smoothstep(th,th+.02,n);
  float edge=smoothstep(th-.0,th+.05,n)-smoothstep(th+.05,th+.12,n);
  vec3 hot=mix(acc*2.2,vec3(1.,.97,.85)*2.,smoothstep(.6,1.,edge));
  vec4 o=vec4(m.rgb*m.a*keep,m.a*keep);
  float e=edge*m.a*step(.001,d)*step(d,.999);
  o.rgb+=hot*e;o.a=max(o.a,e*.9);
  return o;}
void main(){
  float p=uP,bell=sin(p*3.14159);
  vec2 c=vUv-.5;
  c.y-=sin(uT*1.3)*.008;c+=uM*.02;
  vec3 acc=mix(uCA,uCB,smoothstep(.35,.65,p));
  vec4 A=fruit(uA,uArA,c,uSA,uRA,uDA,uCA,1.7),B=fruit(uB,uArB,c,uSB,uRB,uDB,uCB,9.3);
  vec4 F=A+B*(1.-A.a);
  // premium sheen sweep across the fruit
  float sw=fract(uT*.12);float band=smoothstep(.06,0.,abs((vUv.x+vUv.y*.6)-(sw*2.6-.5)));
  F.rgb+=vec3(1.,.98,.92)*band*.22*F.a*(1.-bell);
  // rising embers
  vec3 em=vec3(0);
  for(int i=0;i<40;i++){float fi=float(i);
    float life=fract(p*1.6+h(fi));float x=(h(fi+2.)-.5)*.42+sin(uT*2.+fi)*.015;
    vec2 pp=vec2(x,-.2+life*.6);float sz=(.0025+.004*h(fi+9.))*(1.-life);
    em+=mix(acc*1.6,vec3(1.,.95,.8),h(fi+4.))*smoothstep(sz,0.,length((c-pp)*vec2(uAr,1.)))*bell;}
  // soft grounded shadow
  float sh=smoothstep(.2,0.,length((vUv-vec2(.5,.14))*vec2(1.,7.)))*.28*uSh;
  vec3 col=F.rgb+em*(1.-F.a);
  float ea=clamp(max(em.r,max(em.g,em.b)),0.,1.);
  gl_FragColor=vec4(col,max(F.a,max(ea,sh*(1.-F.a))));
  #include <encodings_fragment>
}`;
function ease(t){return t<.5?4.*t*t*t:1.-Math.pow(-2.*t+2.,3.)/2.}
function back(t){const c=2.2;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
function Morph(el){
  const R=new T.WebGLRenderer({antialias:true,alpha:true,premultipliedAlpha:true});
  R.setPixelRatio(Math.min(2,devicePixelRatio));R.outputEncoding=T.sRGBEncoding;
  el.appendChild(R.domElement);Object.assign(R.domElement.style,{position:'absolute',inset:0,width:'100%',height:'100%'});
  const S=new T.Scene(),C=new T.OrthographicCamera(-.5,.5,.5,-.5,0,1);
  const U={uA:{value:texs[0]},uB:{value:texs[1]},uArA:{value:1},uArB:{value:1},uAr:{value:1},uP:{value:0},uT:{value:0},uM:{value:new T.Vector2()},
    uSA:{value:1},uSB:{value:0},uRA:{value:0},uRB:{value:0},uDA:{value:0},uDB:{value:1},uSh:{value:1},uCA:{value:new T.Vector3()},uCB:{value:new T.Vector3()}};
  const mat=new T.ShaderMaterial({vertexShader:VS,fragmentShader:FS,uniforms:U,transparent:true});
  mat.blending=T.CustomBlending;mat.blendSrc=T.OneFactor;mat.blendDst=T.OneMinusSrcAlphaFactor;
  S.add(new T.Mesh(new T.PlaneGeometry(1,1),mat));
  function size(){const w=el.clientWidth,h=el.clientHeight;R.setSize(w,h,false);U.uAr.value=w/h}
  addEventListener('resize',size);size();
  const tgt=new T.Vector2();
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();tgt.set((e.clientX-r.left)/r.width-.5,-((e.clientY-r.top)/r.height-.5))});
  el.addEventListener('pointerleave',()=>tgt.set(0,0));
  const t0=performance.now();
  return{
    set(pos){
      const N=SRC.length,a=Math.max(0,Math.min(N-1,Math.floor(pos))),b=Math.min(N-1,a+1);
      let f=pos-a;if(a===b)f=0;f=Math.max(0,Math.min(1,(f-.2)/.6));
      // A burns away into embers, B materialises from them
      const fa=Math.min(1,f/.65),fb=Math.max(0,(f-.3)/.7);
      U.uDA.value=fa;U.uDB.value=1-fb;
      U.uSA.value=1+fa*.06;U.uRA.value=fa*.08;
      U.uSB.value=.94+.06*back(fb);U.uRB.value=(1-ease(fb))*-.08;
      U.uSh.value=Math.max(1-U.uDA.value,1-U.uDB.value);
      U.uA.value=texs[a];U.uB.value=texs[b];U.uArA.value=ARS[a];U.uArB.value=ARS[b];U.uP.value=f;
      U.uCA.value.set(...COLS[a]);U.uCB.value.set(...COLS[b]);
    },
    render(){U.uT.value=(performance.now()-t0)/1000;U.uM.value.lerp(tgt,.08);R.render(S,C)}
  };
}
window.FruitMorph={Morph,count:SRC.length};
})();
