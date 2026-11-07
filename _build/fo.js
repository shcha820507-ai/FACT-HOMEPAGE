/* FACT Folio, review sheet replica for fact.kaist.ac.kr
   Re-creates how Folio reads two entries against one brief, using the synthetic
   example of model 09.area-review.1.1.0. Not a real competition or legal standard. */
(function(){
'use strict';
var root=document.documentElement;
function L(){return root.getAttribute('data-lang')==='en'?'en':'ko';}
function T(o){return typeof o==='string'?o:o[L()];}

/* keep the chosen language when moving between pages */
function syncLinks(){
  var l=L();
  document.querySelectorAll('a[data-keep-lang]').forEach(function(a){
    var h=a.getAttribute('href')||'',hash='',i=h.indexOf('#');
    if(i>=0){hash=h.slice(i);h=h.slice(0,i);}
    h=h.replace(/[?&]lang=(ko|en)/,'');
    if(l==='en')h+=(h.indexOf('?')>=0?'&':'?')+'lang=en';
    a.setAttribute('href',(h||'./')+hash);
  });
}

var RULES=[
  {id:'G01',type:'area',T:100,tol:5,name:{ko:'주민공동실 면적',en:'Community room area'},src:{ko:'합성지침 제1항',en:'Synthetic brief, clause 1'}},
  {id:'G02',type:'area',T:60,tol:5,name:{ko:'작은도서관 면적',en:'Small library area'},src:{ko:'합성지침 제2항',en:'Synthetic brief, clause 2'}},
  {id:'G03',type:'area',T:40,tol:5,name:{ko:'돌봄실 면적',en:'Childcare room area'},src:{ko:'합성지침 제3항',en:'Synthetic brief, clause 3'}},
  {id:'G04',type:'count',min:20,name:{ko:'제출 주차 수량',en:'Parking spaces'},src:{ko:'합성지침 제4항',en:'Synthetic brief, clause 4'}},
  {id:'G05',type:'presence',name:{ko:'관리실 유무',en:'Management office'},src:{ko:'합성지침 제5항',en:'Synthetic brief, clause 5'}}
];
var DES=[
  {key:'A',no:'01',role:{ko:'기준안',en:'Baseline'},v:{
    G01:{val:108,unit:'m2',ev:{ko:'A 면적표 1행',en:'A area schedule, row 1'}},
    G02:{val:58,unit:'m2',ev:{ko:'A 면적표 2행',en:'A area schedule, row 2'}},
    G03:{val:40,unit:'m2',ev:{ko:'A 면적표 3행',en:'A area schedule, row 3'}},
    G04:{n:18,ev:{ko:'A 수량표 1행',en:'A count sheet, row 1'}},
    G05:{p:true,ev:{ko:'A 공간목록 1행',en:'A space list, row 1'}}}},
  {key:'B',no:'02',role:{ko:'대안',en:'Alternative'},v:{
    G01:{val:104,unit:'m2',ev:{ko:'B 면적표 1행',en:'B area schedule, row 1'}},
    G02:{val:600000,unit:'cm2',ev:{ko:'B 면적표 2행',en:'B area schedule, row 2'}},
    G03:null,
    G04:{n:20,ev:{ko:'B 수량표 1행',en:'B count sheet, row 1'}},
    G05:{p:false,ev:{ko:'B 공간목록 1행',en:'B space list, row 1'}}}}
];
var FAC={m2:1,cm2:0.0001,mm2:0.000001};
var ST={ok:{ko:'충족',en:'Met'},rv:{ko:'불충족',en:'Not met'},na:{ko:'판정불가',en:'On hold'}};

/* one rule, one entry: inclusive bounds, null held as unknown */
function check(rule,item,tol,bias){
  if(tol==null)tol=rule.tol; bias=bias||0;
  if(!item)return {st:'na'};
  if(rule.type==='area'){
    var A=item.val*FAC[item.unit]*(1+bias/100),lo=rule.T*(1-tol/100),hi=rule.T*(1+tol/100);
    return {st:(A>=lo-1e-9&&A<=hi+1e-9)?'ok':'rv',A:A,lo:lo,hi:hi,dev:100*(A-rule.T)/rule.T,margin:Math.min(A-lo,hi-A)};
  }
  if(rule.type==='count')return {st:item.n>=rule.min?'ok':'rv',n:item.n,margin:item.n-rule.min};
  return {st:item.p?'ok':'rv',p:item.p};
}
function num(x){var r=Math.round(x*100)/100;return Math.abs(r)>=1000?r.toLocaleString('en-US'):String(r);}
function sign(x){var r=Math.round(x*100)/100,s=num(Math.abs(r));return r>0?'+'+s:(r<0?'−'+s:'0');}
function pct(b){return (b>0?'+':(b<0?'−':''))+Math.abs(b)+'%';}
function sq(){return ' m²';}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

function valueText(rule,item){
  var en=L()==='en';
  if(!item)return en?'No data':'자료 없음';
  if(rule.type==='area')return num(item.val*FAC[item.unit])+sq();
  if(rule.type==='count')return item.n+(en?' spaces':'대');
  return item.p?(en?'Present':'있음'):(en?'Absent':'없음');
}
function rawText(rule,item){
  var en=L()==='en';
  if(!item)return (en?'Data unconfirmed':'자료 미확인')+'<br>'+(en?'No source given':'입력 근거 미확인');
  var a;
  if(rule.type==='area')a=item.unit==='m2'?num(item.val)+' m2':num(item.val)+' '+item.unit+' × '+FAC[item.unit];
  else if(rule.type==='count')a=item.n+' count';
  else a=item.p?'true':'false';
  return esc(a)+'<br>'+esc(T(item.ev));
}

var UID=0;
function Folio(fig){
  var self=this;
  this.fig=fig; this.wide=fig.hasAttribute('data-wide'); this.uid='fo'+(++UID);
  this.sel=0; this.timer=null; this.vis=false;
  this.auto=!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  this.paper=fig.querySelector('.fo-paper');
  this.render(); this.sync();
  fig.addEventListener('click',function(e){
    if(e.target.closest('.fo-play')){
      self.auto=!self.auto;
      if(self.auto){self.select((self.sel+1)%RULES.length);if(self.vis)self.start();}else self.stop();
      self.sync(); return;
    }
    var b=e.target.closest('[data-r]'); if(!b||!fig.contains(b))return;
    self.auto=false; self.stop(); self.sync(); self.select(+b.getAttribute('data-i'));
  });
  fig.addEventListener('keydown',function(e){
    var t=e.target; if(!t.classList||!t.classList.contains('fo-tab'))return;
    var n=RULES.length,i=self.sel,k=e.key;
    if(k==='ArrowRight'||k==='ArrowDown')i=(i+1)%n; else if(k==='ArrowLeft'||k==='ArrowUp')i=(i+n-1)%n;
    else if(k==='Home')i=0; else if(k==='End')i=n-1; else return;
    e.preventDefault(); self.auto=false; self.stop(); self.sync(); self.select(i);
    var nb=fig.querySelector('.fo-tab[data-i="'+i+'"]'); if(nb)nb.focus();
  });
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){es.forEach(function(e){self.vis=e.isIntersecting;if(self.vis)self.start();else self.stop();});},{threshold:.25}).observe(fig);
  } else { this.vis=true; this.start(); }
  document.addEventListener('visibilitychange',function(){if(document.hidden)self.stop();else if(self.vis)self.start();});
  if('MutationObserver' in window)new MutationObserver(function(){self.render();}).observe(root,{attributes:true,attributeFilter:['data-lang']});
}
Folio.prototype.start=function(){
  var self=this; if(!this.auto||this.timer)return;
  this.timer=setInterval(function(){self.select((self.sel+1)%RULES.length);},3600);
};
Folio.prototype.stop=function(){if(this.timer){clearInterval(this.timer);this.timer=null;}};
Folio.prototype.sync=function(){this.fig.classList.toggle('auto',this.auto);};
Folio.prototype.select=function(i){
  this.sel=i;
  var id=RULES[i].id,uid=this.uid;
  this.fig.querySelectorAll('[data-r]').forEach(function(el){
    var on=el.getAttribute('data-r')===id; el.classList.toggle('on',on);
    if(el.classList.contains('fo-tab')){el.setAttribute('aria-selected',String(on));el.tabIndex=on?0:-1;}
  });
  var n=this.fig.querySelector('.fo-note');
  if(n){n.innerHTML=this.note(i);n.setAttribute('aria-labelledby',uid+'-t'+i);}
};
Folio.prototype.render=function(){
  var en=L()==='en',uid=this.uid,h='';
  if(this.wide)h+='<div class="fo-margin" aria-hidden="true"><span class="fo-mt'+(en?'':' up')+'">'+(en?'Entry review':'설계안 검토')+'</span><span class="fo-mb">FACT Folio</span></div>';
  DES.forEach(function(d){
    var cnt={ok:0,rv:0,na:0};
    RULES.forEach(function(r){cnt[check(r,d.v[r.id]).st]++;});
    h+='<section class="fo-sheet s-'+d.key.toLowerCase()+'" aria-label="'+esc(d.key+' '+T(d.role))+'"><header class="fo-sh"><span class="fo-no">'+d.no+'</span><span class="fo-dk">'+d.key+'</span><span class="fo-role">'+esc(T(d.role))+'</span>'
      +'<span class="fo-cov">'+(en?'Judged ':'판정 가능 ')+(RULES.length-cnt.na)+'/'+RULES.length+'</span></header><ol class="fo-list">';
    RULES.forEach(function(r,i){
      var it=d.v[r.id],c=check(r,it);
      h+='<li><button type="button" class="fo-e" data-r="'+r.id+'" data-i="'+i+'"><span class="fo-eg">'
        +'<span class="fo-id">'+r.id+'</span><span class="fo-lb">'+esc(T(r.name))+'</span><span class="fo-st st-'+c.st+'">'+esc(T(ST[c.st]))+'</span>'
        +'<span class="fo-v'+(it?'':' na')+'">'+esc(valueText(r,it))+'</span><span class="fo-raw">'+rawText(r,it)+'</span></span></button></li>';
    });
    h+='</ol></section>';
  });
  h+='<div class="fo-tabs" role="tablist" aria-label="'+(en?'Brief items':'지침 항목')+'">';
  RULES.forEach(function(r,i){
    var a=check(r,DES[0].v[r.id]).st,b=check(r,DES[1].v[r.id]).st;
    h+='<button type="button" role="tab" class="fo-tab" id="'+uid+'-t'+i+'" aria-controls="'+uid+'-note" data-r="'+r.id+'" data-i="'+i+'" aria-selected="false" tabindex="-1"><span class="fo-id">'+r.id+'</span><span class="fo-tl">'+esc(T(r.name))+'</span>'
      +'<span class="fo-ts"><i class="d-'+a+'" aria-hidden="true"></i><i class="d-'+b+'" aria-hidden="true"></i><span class="fo-tst">'+esc(T(ST[a]))+' / '+esc(T(ST[b]))+'</span></span></button>';
  });
  h+='</div><div class="fo-note" role="tabpanel" id="'+uid+'-note"></div>';
  this.paper.innerHTML=h;
  this.select(this.sel);
};
Folio.prototype.note=function(i){
  var en=L()==='en',r=RULES[i],ia=DES[0].v[r.id],ib=DES[1].v[r.id],a=check(r,ia),b=check(r,ib),n1='',n2='';
  var who=[[DES[0],a],[DES[1],b]];
  n1+='<span class="fo-k">'+(en?'Review ':'검토 ')+r.id+'</span><p class="fo-nt">'+esc(T(r.name))+'</p>';
  n1+='<dl class="fo-nv"><div><dt>'+esc(T(DES[0].role))+'</dt><dd>'+esc(valueText(r,ia))+'</dd></div><div><dt>'+esc(T(DES[1].role))+'</dt><dd>'+esc(valueText(r,ib))+'</dd></div></dl>';
  if(r.type==='area'){
    if(a.st!=='na'&&b.st!=='na')n1+='<p class="fo-nd">'+(en?'Alternative minus baseline ':'대안과 기준안의 차이 ')+sign(b.A-a.A)+sq()+'</p>';
    else n1+='<p class="fo-nd">'+(en?'Difference held, one entry has no data':'한쪽 자료가 없어 차이를 계산하지 않습니다')+'</p>';
    n1+='<p class="fo-lim">'+(en?'Allowed ':'허용 ')+num(a.lo)+(en?' to ':'에서 ')+num(a.hi)+sq()+(en?', target ':', 목표 ')+r.T+sq()+(en?', tolerance ':', 허용편차 ')+r.tol+'%</p>';
    n2+=this.range(a,b,r)+'<p class="fo-ax">'+(en?'Both entries share one axis, which may not start at zero.':'두 안은 같은 축을 씁니다. 축은 0에서 시작하지 않을 수 있습니다.')+'</p>';
    n2+='<ul class="fo-msg">'+who.map(function(p){
      var c=p[1],t=esc(T(p[0].role))+', ';
      if(c.st==='na')t+=en?'on hold, no data submitted. Missing data is never read as zero.':'제출 자료가 없어 판정불가. 빠진 자료를 0으로 읽지 않습니다.';
      else if(c.st==='ok')t+=(en?'met, ':'충족, ')+(en?'margin to the limit ':'경계까지 ')+num(c.margin)+sq()+(en?', deviation ':', 편차 ')+sign(c.dev)+'%';
      else t+=(en?'not met, ':'불충족, ')+(c.A>c.hi?(en?'above the upper limit by ':'상한보다 ')+num(c.A-c.hi)+sq()+(en?'':' 큼'):(en?'below the lower limit by ':'하한보다 ')+num(c.lo-c.A)+sq()+(en?'':' 작음'))+(en?', deviation ':', 편차 ')+sign(c.dev)+'%';
      return '<li class="m-'+c.st+'">'+t+'</li>';
    }).join('')+'</ul>';
  }else if(r.type==='count'){
    n1+='<p class="fo-lim">'+(en?'Minimum ':'최소 ')+r.min+(en?' spaces':'대')+'</p>';
    n2+='<ul class="fo-msg">'+who.map(function(p){
      var c=p[1];return '<li class="m-'+c.st+'">'+esc(T(p[0].role))+', '+c.n+(en?' spaces, ':'대, ')+(c.margin<0?(en?Math.abs(c.margin)+' short, not met':Math.abs(c.margin)+'대 부족, 불충족'):(en?'met':'충족'))+'</li>';
    }).join('')+'</ul>';
  }else{
    n1+='<p class="fo-lim">'+(en?'Required space':'필수 공간')+'</p>';
    n2+='<ul class="fo-msg">'+who.map(function(p){
      var c=p[1];return '<li class="m-'+c.st+'">'+esc(T(p[0].role))+', '+(c.p?(en?'present, met':'있음, 충족'):(en?'stated absent, not met':'없다고 명시, 불충족'))+'</li>';
    }).join('')+'</ul><p class="fo-ax">'+(en?'A stated absence and missing data are judged differently.':'없다고 명시한 공간과 자료 누락은 다르게 판정합니다.')+'</p>';
  }
  n2+='<p class="fo-src">'+(en?'Source, ':'근거, ')+esc(T(r.src))+'</p>';
  return '<div class="fo-n1">'+n1+'</div><div class="fo-n2">'+n2+'</div>';
};
Folio.prototype.range=function(a,b,r){
  var vals=[a.lo,a.hi]; if(a.st!=='na')vals.push(a.A); if(b.st!=='na')vals.push(b.A);
  var lo=Math.min.apply(null,vals),hi=Math.max.apply(null,vals),pad=(hi-lo)*0.08;lo-=pad;hi+=pad;
  var W=300,x0=40,x1=W-8;function x(v){return x0+(x1-x0)*(v-lo)/(hi-lo);}
  var en=L()==='en',s='<svg class="fo-rg" viewBox="0 0 '+W+' 104" role="img" aria-label="'+(en?'Area of both entries on one axis, with the allowed band':'허용 구간과 두 안의 면적을 같은 축에 표시')+'">';
  s+='<rect x="'+x(a.lo).toFixed(1)+'" y="10" width="'+(x(a.hi)-x(a.lo)).toFixed(1)+'" height="70" class="rg-band"/>';
  s+='<line x1="'+x(r.T).toFixed(1)+'" y1="5" x2="'+x(r.T).toFixed(1)+'" y2="85" class="rg-t"/>';
  [[30,a,'c',en?'Base':'기준'],[60,b,'s',en?'Alt':'대안']].forEach(function(row){
    var y=row[0],c=row[1];
    s+='<text x="0" y="'+(y+4)+'" class="rg-l">'+row[3]+'</text><line x1="'+x0+'" y1="'+y+'" x2="'+x1+'" y2="'+y+'" class="rg-ax"/>';
    if(c.st==='na'){s+='<text x="'+((x0+x1)/2).toFixed(1)+'" y="'+(y-6)+'" class="rg-na" text-anchor="middle">'+(en?'no data':'자료 없음')+'</text>';return;}
    var cx=x(c.A);
    s+=row[2]==='c'?'<circle cx="'+cx.toFixed(1)+'" cy="'+y+'" r="5" class="rg-a"/>':'<rect x="'+(cx-4.5).toFixed(1)+'" y="'+(y-4.5)+'" width="9" height="9" class="rg-b"/>';
  });
  s+='<text x="'+x0+'" y="100" class="rg-e">'+num(lo)+sq()+'</text><text x="'+x1+'" y="100" class="rg-e" text-anchor="end">'+num(hi)+sq()+'</text></svg>';
  return s;
};

/* sensitivity: tolerance x common area bias, the nine conditions of the example */
function Sens(el){
  var self=this; this.el=el; this.sel=[5,0];
  this.render();
  el.addEventListener('click',function(e){
    var c=e.target.closest('[data-t]'); if(!c)return;
    var g=[].indexOf.call(el.querySelectorAll('.fs-g'),c.closest('.fs-g'));
    self.sel=[+c.getAttribute('data-t'),+c.getAttribute('data-b')]; self.render();
    var f=el.querySelectorAll('.fs-g')[g]; f=f&&f.querySelector('.fs-c[data-t="'+self.sel[0]+'"][data-b="'+self.sel[1]+'"]'); if(f)f.focus();
  });
  if('MutationObserver' in window)new MutationObserver(function(){self.render();}).observe(root,{attributes:true,attributeFilter:['data-lang']});
}
Sens.prototype.render=function(){
  var en=L()==='en',TOL=[3,5,8],BIAS=[-2,0,2],sel=this.sel,h='<div class="fs-grids">';
  DES.forEach(function(d){
    h+='<div class="fs-g"><div class="fs-gh"><span class="fs-dk">'+d.key+'</span>'+esc(T(d.role))+'</div><div class="fs-tb" role="group" aria-label="'+esc(d.key+' '+T(d.role))+'"><span class="fs-cn" aria-hidden="true"></span>';
    BIAS.forEach(function(b){h+='<span class="fs-ch" aria-hidden="true">'+(en?'bias ':'편향 ')+pct(b)+'</span>';});
    TOL.forEach(function(t){
      h+='<span class="fs-rh" aria-hidden="true">'+(en?'tol. ':'허용 ')+t+'%</span>';
      BIAS.forEach(function(b){
        var c={ok:0,rv:0,na:0},dots='';
        RULES.forEach(function(r){var s=check(r,d.v[r.id],r.type==='area'?t:null,r.type==='area'?b:0).st;c[s]++;dots+='<i class="d-'+s+'"></i>';});
        var on=sel[0]===t&&sel[1]===b,base=t===5&&b===0;
        h+='<button type="button" class="fs-c'+(on?' on':'')+(base?' base':'')+'" data-t="'+t+'" data-b="'+b+'" aria-pressed="'+on+'">'
          +'<span class="fs-vh">'+(en?'Tolerance ':'허용편차 ')+t+'%, '+(en?'bias ':'편향 ')+pct(b)+', </span>'
          +'<span class="fs-dots" aria-hidden="true">'+dots+'</span><span class="fs-n">'+(en?'Met ':'충족 ')+c.ok+'</span>'
          +'<span class="fs-vh">, '+(en?'not met ':'불충족 ')+c.rv+(c.na?', '+(en?'on hold ':'판정불가 ')+c.na:'')+'</span></button>';
      });
    });
    h+='</div></div>';
  });
  h+='</div>';
  var t=sel[0],b=sel[1],lines=[];
  DES.forEach(function(d){
    RULES.forEach(function(r){
      if(r.type!=='area')return;
      var c0=check(r,d.v[r.id]),c=check(r,d.v[r.id],t,b);
      if(c.st!==c0.st)lines.push(esc(T(d.role))+' '+r.id+' '+esc(T(r.name))+', '+esc(T(ST[c0.st]))+' → '+esc(T(ST[c.st]))+(en?' (adjusted ':' (조정 면적 ')+num(c.A)+sq()+(en?', allowed ':', 허용 ')+num(c.lo)+(en?' to ':'에서 ')+num(c.hi)+sq()+')');
    });
  });
  var base=t===5&&b===0;
  h+='<div class="fs-d" aria-live="polite"><span class="fs-dh">'+(en?'Tolerance ':'허용편차 ')+t+'%, '+(en?'common area bias ':'공통 측정 편향 ')+pct(b)+(base?(en?', the baseline condition':', 기본 조건'):'')+'</span>'
    +(base?'<p>'+(en?'Pick another cell to see which items change near the limits.':'다른 칸을 고르면 경계 근처에서 판정이 바뀌는 항목을 보여 줍니다.')+'</p>'
      :(lines.length?'<ul>'+lines.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'<p>'+(en?'Same checks as the baseline condition.':'기본 조건과 같은 판정입니다.')+'</p>'))
    +'</div>';
  this.el.innerHTML=h;
};

function init(){
  syncLinks();
  if('MutationObserver' in window)new MutationObserver(syncLinks).observe(root,{attributes:true,attributeFilter:['data-lang']});
  document.querySelectorAll('[data-fo]').forEach(function(f){if(!f.__fo)f.__fo=new Folio(f);});
  document.querySelectorAll('[data-fo-sens]').forEach(function(f){if(!f.__fs)f.__fs=new Sens(f);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
