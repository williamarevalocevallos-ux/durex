/* Durexporta — photo-real fruit morph (WebGL shader over the real fruit cut-outs) */
(function(){
const T=THREE;
const SRC=['img/mango-hd.webp','img/pitahaya-hd.webp','img/banano-hd.webp','img/platano-hd.webp','img/aguacate-hd.webp'];
const loader=new T.TextureLoader();
const ARS=SRC.map(()=>1);
const texs=SRC.map((s,i)=>{const t=loader.load(s,tx=>{ARS[i]=tx.image.width/tx.image.height;tx.needsUpdate=true});t.minFilter=T.LinearMipmapLinearFilter;t.encoding=T.sRGBEncoding;t.anisotropy=8;return t});

const VS=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FS=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uA,uB;uniform float uArA,uArB,uAr,uP,uT;uniform vec2 uM;
vec3 hash3(vec2 p){vec3 q=vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9)));return fract(sin(q)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  float a=hash3(i).x,b=hash3(i+vec2(1,0)).x,c=hash3(i+vec2(0,1)).x,d=hash3(i+vec2(1,1)).x;
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
vec2 fit(vec2 uv,float ar){vec2 s=uAr>ar?vec2(uAr/ar,1.):vec2(1.,ar/uAr);return (uv-.5)*s*1.6+.5;}
vec4 tex(sampler2D t,vec2 uv){if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return vec4(0);return texture2D(t,uv);}
void main(){
  vec2 uv=vUv;
  float p=smoothstep(0.,1.,uP);
  float bell=sin(p*3.14159);
  vec2 c=uv-.5;
  float bulge=1.-dot(c,c)*.35*bell;
  uv=.5+c*bulge+uM*.025*(1.-length(c));
  float n=fbm(uv*3.+uT*.15);
  vec2 warp=vec2(fbm(uv*4.+vec2(uT*.2,0.)),fbm(uv*4.+vec2(0.,uT*.2)))-.5;
  vec2 wa=uv+warp*.18*bell*(1.+p);
  vec2 wb=uv+warp*.18*bell*(2.-p);
  float ra=p*.25,rb=(p-1.)*.25;
  mat2 RA=mat2(cos(ra),-sin(ra),sin(ra),cos(ra)),RB=mat2(cos(rb),-sin(rb),sin(rb),cos(rb));
  vec2 ua=.5+RA*(wa-.5)*(1.+p*.25);
  vec2 ub=.5+RB*(wb-.5)*(1.+(1.-p)*.25);
  vec4 A=tex(uA,fit(ua,uArA)),B=tex(uB,fit(ub,uArB));
  float th=p*1.25-.12;
  float m=smoothstep(th-.06,th+.06,n+(1.-length(c)*1.2)*.25);
  vec4 col=mix(B,A,m);
  float edge=(1.-abs(m*2.-1.))*bell;
  col.rgb+=vec3(1.,.85,.45)*edge*.35*max(A.a,B.a);
  float sweep=smoothstep(.12,0.,abs(uv.x+uv.y-1.-(fract(uT*.08)*3.-1.5)));
  col.rgb+=sweep*.10*col.a;
  float sh=smoothstep(.4,0.,length((vUv-vec2(.5,.14))*vec2(1.,6.)))*.22;
  gl_FragColor=vec4(col.rgb*col.a,col.a)+vec4(0.,0.,0.,sh*(1.-col.a));
  #include <encodings_fragment>
}`;

function Morph(el){
  const R=new T.WebGLRenderer({antialias:true,alpha:true,premultipliedAlpha:true});
  R.setPixelRatio(Math.min(2,devicePixelRatio));R.outputEncoding=T.sRGBEncoding;
  el.appendChild(R.domElement);Object.assign(R.domElement.style,{position:'absolute',inset:0,width:'100%',height:'100%'});
  const S=new T.Scene(),C=new T.OrthographicCamera(-.5,.5,.5,-.5,0,1);
  const U={uA:{value:texs[0]},uB:{value:texs[1]},uArA:{value:1},uArB:{value:1},uAr:{value:1},uP:{value:0},uT:{value:0},uM:{value:new T.Vector2()}};
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
      let f=pos-a;if(a===b)f=0;
      f=Math.max(0,Math.min(1,(f-.25)/.5));
      U.uA.value=texs[a];U.uB.value=texs[b];U.uArA.value=ARS[a];U.uArB.value=ARS[b];U.uP.value=f;
    },
    render(){U.uT.value=(performance.now()-t0)/1000;U.uM.value.lerp(tgt,.08);R.render(S,C)}
  };
}
window.FruitMorph={Morph,count:SRC.length};
})();
