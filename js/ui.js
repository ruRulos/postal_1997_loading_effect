/* Interfaz: controles, paneles, modales y arranque. Se ejecuta cuando el idioma ya cargó. */
var VIEW, EFF, ALL, TIPS;

function defineControls(){
VIEW=[
 {id:'z',t:'t',l:tr('ctl.z'),min:5,max:100,d:80},
 {id:'ov',t:'s',l:tr('ctl.ov'),o:[['clip',tr('ctl.ov.clip')],['out',tr('ctl.ov.out')]],d:'clip'},
 {id:'fr',t:'c',jp:true,l:tr('ctl.fr'),d:false,dep:function(V){return V.ov==='clip'}},
 {id:'frw',t:'r',jp:true,l:tr('ctl.frw'),min:1,max:40,step:1,d:8,dep:function(V){return !!V.fr&&V.ov==='clip'}}
];
EFF=[
 {id:'n',t:'r',l:tr('ctl.n'),min:1,max:6,step:1,d:2},
 {id:'A',t:'r',l:tr('ctl.A'),min:0.05,max:1,step:0.05,d:0.5},
 {id:'Rp',t:'r',l:tr('ctl.Rp'),min:0,max:30,step:0.05,d:3.75},
 {id:'sp',t:'r',l:tr('ctl.sp'),min:-4,max:4,step:0.1,d:1},
 {id:'C',t:'r',l:tr('ctl.C'),min:2000,max:30000,step:500,d:10000},
 {id:'F',t:'r',l:tr('ctl.F'),min:1,max:60,step:1,d:15},
 {id:'rot',t:'r',l:tr('ctl.rot'),min:0,max:45,step:1,d:0},
 {id:'zm',t:'r',l:tr('ctl.zm'),min:0.8,max:1.4,step:0.01,d:1},
 {id:'P',t:'s',l:tr('ctl.P'),o:[['loop',tr('ctl.P.loop')],['once',tr('ctl.P.once')]],d:'loop'},
 {id:'bl',t:'s',l:tr('ctl.bl'),o:[['source-over',tr('ctl.bl.source-over')],['lighter',tr('ctl.bl.lighter')],['screen',tr('ctl.bl.screen')],['difference',tr('ctl.bl.difference')]],d:'source-over'},
 {id:'rest',t:'c',l:tr('ctl.rest'),d:true},
 {id:'int',t:'c',l:tr('ctl.int'),d:true}
];
VIEW=VIEW.filter(function(c){return !c.jp||(FEATURES[LANG]&&FEATURES[LANG].jp)});
ALL=VIEW.concat(EFF);
TIPS={n:tr('tip.n'),A:tr('tip.A'),Rp:tr('tip.Rp'),sp:tr('tip.sp'),C:tr('tip.C'),F:tr('tip.F'),rot:tr('tip.rot'),zm:tr('tip.zm'),P:tr('tip.P'),bl:tr('tip.bl'),rest:tr('tip.rest'),int:tr('tip.int')};
}

function dec(s){var x=String(s).split('.')[1];return x?x.length:0}
function depOn(c){return typeof c.dep==='function'?c.dep(V):!!V[c.dep]}
function applyDeps(){
  ALL.forEach(function(c){
    if(!c.dep)return;var el=$(c.id);if(!el)return;
    var on=!!depOn(c),b=el.closest('.ctl');b.classList.toggle('off',!on);
    b.querySelectorAll('input,button,select').forEach(function(x){x.disabled=!on});
  });
}
function setV(id,val){
  V[id]=val;var el=$(id);if(!el)return;
  if(el.type==='checkbox')el.checked=val;else el.value=val;
  var nb=$('n_'+id);if(nb){var c=ALL.filter(function(k){return k.id===id})[0];nb.value=(+val).toFixed(dec(c.step))}
  applyDeps();
}
function clampStep(c,v){var st=c.step||1;v=Math.min(c.max,Math.max(c.min,v));v=c.min+Math.round((v-c.min)/st)*st;return +Math.min(c.max,v).toFixed(dec(st))}
function commit(c,v){setV(c.id,v);if(c.id==='fr'||c.id==='frw'||c.id==='ov')layout();redraw()}
function num(x,fb){var v=parseFloat(String(x).replace(',','.').replace('%',''));return isNaN(v)?fb:v}
function build(list,host){
  list.forEach(function(c){
    var d=document.createElement('div'),h='';
    var inf=TIPS[c.id]?'<button type="button" class="inf" aria-label="'+tr('a11y.info')+'" data-tip="'+TIPS[c.id].replace(/"/g,'&quot;')+'"></button>':'';
    var rs='<button type="button" class="rs" title="'+tr('btn.default')+'">\u21BA</button>';
    if(c.t==='r'||c.t==='t'){
      d.className='ctl r';
      h='<div class="hd"><span class="ttl">'+inf+'<label for="'+c.id+'">'+c.l+'</label></span><span class="tools">'+rs+(c.t==='r'?'<input id="n_'+c.id+'" class="num" type="text" inputmode="decimal">':'')+'</span></div>';
      h+='<div class="sl"><button type="button" class="ar" data-d="-1" aria-label="'+tr('a11y.less')+'">&lt;</button>'+(c.t==='r'?'<input id="'+c.id+'" type="range" min="'+c.min+'" max="'+c.max+'" step="'+c.step+'">':'<input id="'+c.id+'" class="num wide" type="text" inputmode="numeric">')+'<button type="button" class="ar" data-d="1" aria-label="'+tr('a11y.more')+'">&gt;</button></div>';
    }else{
      d.className='ctl'+(c.t==='c'?' c':'');
      if(c.t==='c')h=inf+'<label><input id="'+c.id+'" type="checkbox"> '+c.l+'</label>';
      else h=inf+'<label>'+c.l+'<select id="'+c.id+'">'+c.o.map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>'}).join('')+'</select></label>';
      h+=rs;
    }
    d.innerHTML=h;host.appendChild(d);
    var el=d.querySelector('#'+c.id),st=c.step||1,delta=c.max!==undefined?Math.max(st,Math.round((c.max-c.min)*0.1/st)*st):0;
    if(c.t==='r'){
      el.addEventListener('input',function(){commit(c,parseFloat(el.value))});
      var nb=d.querySelector('#n_'+c.id);
      nb.addEventListener('change',function(){commit(c,clampStep(c,num(nb.value,V[c.id])))});
    }else if(c.t==='t'){
      el.addEventListener('change',function(){commit(c,clampStep(c,num(el.value,V[c.id])))});
    }else if(c.t==='c'){
      el.addEventListener('input',function(){commit(c,el.checked)});
    }else{
      el.addEventListener('input',function(){commit(c,el.value)});
    }
    d.querySelectorAll('.ar').forEach(function(b){b.onclick=function(){commit(c,clampStep(c,V[c.id]+delta*(+b.dataset.d)))}});
    d.querySelector('.rs').onclick=function(){commit(c,c.d)};
    setV(c.id,c.d);
  });
}

var DEFBG='assets/img/backgrounds/default-bg.jpg';

function init(){
applyI18n();
defineControls();
build(VIEW,$('pv'));build(EFF,$('pe'));applyDeps();
img=sample();
function setMode(m){
  mode=m;
  $('mp').setAttribute('aria-pressed',m==='postal');
  $('my').setAttribute('aria-pressed',m==='your');
  $('pp').hidden=m!=='postal';$('py').hidden=m!=='your';$('all').hidden=m==='postal';
  t0=performance.now();redraw();
}
$('mp').onclick=function(){setMode('postal')};
$('my').onclick=function(){setMode('your')};
$('p').onclick=function(){
  if(!paused){paused=true;tPause=performance.now();this.textContent=tr('btn.resume')}
  else{paused=false;t0+=performance.now()-tPause;this.textContent=tr('btn.pause')}
};
$('rst').onclick=function(){t0=performance.now();tPause=t0;redraw()};
$('all').onclick=function(){ALL.forEach(function(c){setV(c.id,c.d)});layout();redraw()};
$('f').addEventListener('change',function(e){
  var file=e.target.files&&e.target.files[0];if(!file)return;
  var u=URL.createObjectURL(file),im=new Image();
  im.onload=function(){img=im;layout();t0=performance.now();tPause=t0;URL.revokeObjectURL(u);redraw()};
  im.src=u;
});
$('bgf').addEventListener('change',function(e){
  var file=e.target.files&&e.target.files[0];if(!file)return;
  var u=URL.createObjectURL(file),im=new Image();
  im.onload=function(){bgImg=im;buildBg();URL.revokeObjectURL(u);redraw()};
  im.src=u;
});
function closeM(){$('modal').hidden=true}
$('sv').onclick=function(){$('modal').hidden=false};
$('qc').onclick=closeM;
$('modal').addEventListener('click',function(e){if(e.target===this)closeM()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeM()});
function closeS(){$('smodal').hidden=true}
$('x1').onclick=closeM;$('x2').onclick=closeS;
$('smodal').addEventListener('click',function(e){if(e.target===this)closeS()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeS()});
document.querySelectorAll('.oc').forEach(function(b){b.onclick=closeS});
function togS(){var o=$('sup').classList.toggle('open');$('sup-t').setAttribute('aria-expanded',o)}
$('sup-t').onclick=togS;$('sup-heart').onclick=togS;
$('sup-mp').onclick=function(){$('smodal').hidden=false};
$('sup-ar').onclick=function(){$('smodal').hidden=false};
function showAlias(){$('spoil').classList.add('shown');$('copy').hidden=false}
$('spoil').onclick=showAlias;
$('spoil').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();showAlias()}});
$('copy').onclick=function(){
  var t=$('alias').textContent,b=this;
  function ok(){b.textContent=tr('copied')}
  function fb(){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){}a.remove()}
  try{navigator.clipboard.writeText(t).then(ok,fb)}catch(e){fb()}
};
$('qn').onclick=function(){closeM();exportVideo('normal')};
$('qh').onclick=function(){closeM();exportVideo('high')};
$('dl').onclick=doSave;
$('wrap').addEventListener('contextmenu',function(e){e.preventDefault()});
$('wrap').style.visibility='hidden';
var pend=2;function ready(){if(--pend<=0)$('wrap').style.visibility='visible'}
setTimeout(function(){$('wrap').style.visibility='visible'},4000);
defImg.onload=function(){bgImg=defImg;buildBg();redraw();ready()};defImg.onerror=ready;defImg.src=DEFBG;
var DEFPREV='assets/img/default-image.jpg',prevImg=new Image();
prevImg.onload=function(){img=prevImg;layout();t0=performance.now();tPause=t0;redraw();ready()};prevImg.onerror=ready;prevImg.src=DEFPREV;
var tipEl=document.createElement('div');tipEl.className='tip';tipEl.hidden=true;document.body.appendChild(tipEl);
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.inf');
  if(!b||(!tipEl.hidden&&tipEl._b===b)){tipEl.hidden=true;return}
  tipEl.textContent=b.getAttribute('data-tip');tipEl._b=b;tipEl.hidden=false;
  var r=b.getBoundingClientRect(),w=Math.min(280,window.innerWidth-16);tipEl.style.width=w+'px';
  tipEl.style.left=Math.max(8,Math.min(r.left,window.innerWidth-w-8))+'px';var th=tipEl.offsetHeight,top=r.bottom+8;if(top+th>window.innerHeight-8)top=Math.max(8,r.top-th-8);tipEl.style.top=top+'px';
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')tipEl.hidden=true});
$('sidebtn').onclick=function(){
  var c=$('side').classList.toggle('closed');
  this.textContent=c?'<':'>';this.setAttribute('aria-expanded',!c);this.setAttribute('aria-label',c?tr('side.open'):tr('side.close'));
};
function centerInk(){
  var c=document.createElement('canvas').getContext('2d');c.font='100px Smash';
  document.querySelectorAll('.ban span:not(.o)').forEach(function(sp){
    var m=c.measureText(sp.textContent),fa=m.fontBoundingBoxAscent,fd=m.fontBoundingBoxDescent;
    if(!(fa>=0)||!(fd>=0))return;
    var base=(100-(fa+fd))/2+fa,inkY=base+(m.actualBoundingBoxDescent-m.actualBoundingBoxAscent)/2;
    var inkX=(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2;
    sp.style.setProperty('--dy',((50-inkY)/100).toFixed(4));
    sp.style.setProperty('--dx',((m.width/2-inkX)/100).toFixed(4));
  });
}
if(document.fonts&&document.fonts.load)document.fonts.load('100px Smash').then(centerInk);
layout();requestAnimationFrame(loop);
}

function langError(){
  document.documentElement.classList.remove('i18n-pending');
  var d=document.createElement('p');d.className='info';
  d.textContent='No se pudieron cargar los archivos de idioma. Abre la página desde un servidor local (mira el README).';
  document.querySelector('main').prepend(d);
}

I18N_READY.then(init,langError);
