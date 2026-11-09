/* FACT Folio concept figure for fact.kaist.ac.kr
   Shows how Folio reads two entries against one brief (module 09) and one set of entered design rules
   (module 02 Section), using the synthetic example of model 09.area-review.1.1.0 and
   synthetic_rules_2026.11.02_v1. Not the working screen, a real competition or a legal standard. */
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

/* module 02 Section: the entered design rules of the same synthetic example.
   The limits are test assumptions, not Korean law, and pass or fail is only a numeric comparison. */
var SET='synthetic_rules_2026.11.02_v1';
var SEC=[
  {id:'SYN_COVERAGE_01',mod:'02',type:'max',m:'cov',T:55,u:'%',name:{ko:'가상 건폐율 상한',en:'Virtual building coverage cap'}},
  {id:'SYN_FAR_01',mod:'02',type:'max',m:'far',T:300,u:'%',name:{ko:'가상 용적률 상한',en:'Virtual floor area ratio cap'}},
  {id:'SYN_DOOR_01',mod:'02',type:'min',m:'door',T:950,u:'mm',name:{ko:'가상 출입문 유효폭 하한',en:'Virtual door clear width minimum'}}
];
var ST2={ok:{ko:'적합',en:'Pass'},rv:{ko:'부적합',en:'Fail'},na:{ko:'정보 부족',en:'Insufficient information'}};
/* site, building area, total floor area, test exclusion, floor area for the ratio, one door */
DES[0].s={site:2000,bldg:1080,gfa:6600,ex:900,far:5700,door:{val:900,unit:'mm'}};
DES[1].s={site:2000,bldg:1000,gfa:6800,ex:900,far:5900,door:{val:1,unit:'m'}};
RULES.forEach(function(r){r.mod='09';});
var ROWS=RULES.concat(SEC);

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
/* one design rule, one entry: the limit is inclusive */
function checkS(r,d){
  var b=d.s,v;
  if(!b)return {st:'na'};
  if(r.m==='cov')v=100*b.bldg/b.site;
  else if(r.m==='far')v=100*b.far/b.site;
  else{if(!b.door)return {st:'na'};v=b.door.val*(b.door.unit==='m'?1000:1);}
  return {st:(r.type==='max'?v<=r.T+1e-9:v>=r.T-1e-9)?'ok':'rv',v:v,margin:r.type==='max'?r.T-v:v-r.T};
}
function ev(r,d){return r.mod==='02'?checkS(r,d):check(r,d.v[r.id]);}
function num(x){var r=Math.round(x*100)/100;return Math.abs(r)>=1000?r.toLocaleString('en-US'):String(r);}
function sign(x){var r=Math.round(x*100)/100,s=num(Math.abs(r));return r>0?'+'+s:(r<0?'−'+s:'0');}
function pct(b){return (b>0?'+':(b<0?'−':''))+Math.abs(b)+'%';}
function sq(){return ' m²';}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

function unitTxt(u){return u==='m2'?'m²':(u==='cm2'?'cm²':'mm²');}
function valueText(rule,item){
  var en=L()==='en';
  if(!item)return en?'No data':'자료 없음';
  if(rule.type==='area')return num(item.val*FAC[item.unit])+sq();
  if(rule.type==='count')return item.n+(en?' spaces':'대');
  return item.p?(en?'Present':'있음'):(en?'Absent':'없음');
}
function reqShort(r){
  var en=L()==='en';
  if(r.type==='area')return r.T+sq()+' ±'+r.tol+'%';
  if(r.type==='count')return (en?'at least ':'최소 ')+r.min+(en?' spaces':'대');
  return en?'required space':'필수 공간';
}
function reqLong(r){
  var en=L()==='en';
  if(r.type==='area')return (en?'Allowed ':'허용 ')+num(r.T*(1-r.tol/100))+(en?' to ':'에서 ')+num(r.T*(1+r.tol/100))+sq()+(en?', target ':', 목표 ')+r.T+sq()+(en?', tolerance ':', 허용편차 ')+r.tol+'%';
  if(r.type==='count')return en?'At least '+r.min+' spaces':'최소 '+r.min+'대';
  return en?'Required space. A stated absence and missing data are judged differently.':'필수 공간. 없다고 명시한 것과 자료가 빠진 것은 다르게 판정합니다.';
}
function srcLine(rule,item){
  var en=L()==='en';
  if(!item)return en?'No value submitted, no source':'제출값 없음, 근거 없음';
  var a;
  if(rule.type==='area')a=item.unit==='m2'?num(item.val)+' m2':num(item.val)+' '+item.unit+' × '+FAC[item.unit];
  else if(rule.type==='count')a=item.n+' count';
  else a=item.p?'true':'false';
  return esc(a)+', '+esc(T(item.ev));
}
function verdict(rule,c){
  var en=L()==='en';
  if(c.st==='na')return en?'On hold. A missing value is never read as zero.':'판정불가. 빈 값을 0으로 읽지 않습니다.';
  if(rule.type==='area'){
    if(c.st==='ok')return (en?'Met, ':'충족, ')+(en?'margin to the limit ':'경계까지 ')+num(c.margin)+sq()+(en?', deviation ':', 편차 ')+sign(c.dev)+'%';
    return (en?'Not met, ':'불충족, ')+(c.A>c.hi?(en?'above the upper limit by ':'상한보다 ')+num(c.A-c.hi)+sq()+(en?'':' 큼'):(en?'below the lower limit by ':'하한보다 ')+num(c.lo-c.A)+sq()+(en?'':' 작음'))+(en?', deviation ':', 편차 ')+sign(c.dev)+'%';
  }
  if(rule.type==='count'){
    if(c.st==='rv')return en?'Not met, '+Math.abs(c.margin)+' short':'불충족, '+Math.abs(c.margin)+'대 부족';
    return c.margin>0?(en?'Met, '+c.margin+' above the minimum':'충족, 기준보다 '+c.margin+'대 많음'):(en?'Met, exactly the minimum':'충족, 기준과 같음');
  }
  return c.p?(en?'Met, space provided':'충족, 공간 있음'):(en?'Not met, stated as absent':'불충족, 없다고 명시');
}
/* shared axis per item: the target or minimum sits in the middle for both entries */
function axis(r){
  var c=r.type==='area'?r.T:r.min,d=0;
  DES.forEach(function(e){var it=e.v[r.id];if(!it)return;var v=r.type==='area'?it.val*FAC[it.unit]:it.n;d=Math.max(d,Math.abs(v-c));});
  var half=r.type==='area'?Math.max(r.T*r.tol/100*1.9,d*1.25):Math.max(r.min*.25,d*1.3);
  return function(v){return Math.max(3,Math.min(97,50+50*(v-c)/half));};
}
function ruler(r,it,c){
  if(r.type==='presence')return '<span class="ru-p p-'+c.st+'" aria-hidden="true"><i></i></span>';
  if(!it)return '<span class="ru na" aria-hidden="true"><i class="ru-ax"></i><em>'+(L()==='en'?'no data':'자료 없음')+'</em></span>';
  var x=axis(r),h='<span class="ru" aria-hidden="true"><i class="ru-ax"></i>';
  if(r.type==='area'){var a=x(c.lo),b=x(c.hi);h+='<i class="ru-band" style="left:'+a.toFixed(1)+'%;width:'+(b-a).toFixed(1)+'%"></i><i class="ru-t" style="left:50%"></i><i class="ru-m m-'+c.st+'" style="left:'+x(c.A).toFixed(1)+'%"></i>';}
  else h+='<i class="ru-band open" style="left:50%;width:50%"></i><i class="ru-t solid" style="left:50%"></i><i class="ru-m m-'+c.st+'" style="left:'+x(c.n).toFixed(1)+'%"></i>';
  return h+'</span>';
}
function chip(st,mod){return '<span class="st st-'+st+'"><i aria-hidden="true"></i>'+esc(T((mod==='02'?ST2:ST)[st]))+'</span>';}

/* design rule rows: value, limit, calculation and verdict */
function valS(r,c){return c.st==='na'?(L()==='en'?'No data':'자료 없음'):num(c.v)+(r.u==='%'?'%':' mm');}
function limS(r,cap){var en=L()==='en';return (r.type==='max'?(en?(cap?'Cap ':'cap '):'상한 '):(en?(cap?'Minimum ':'min '):'하한 '))+r.T+(r.u==='%'?'%':' mm');}
function reqLongS(r){
  var en=L()==='en',f={cov:{ko:'건축면적 ÷ 대지면적 × 100',en:'building area ÷ site area × 100'},
    far:{ko:'산정용 연면적 ÷ 대지면적 × 100',en:'floor area for the ratio ÷ site area × 100'},
    door:{ko:'공개 출입 조건에서 출입문 한 개의 유효폭',en:'clear width of one door where public access applies'}}[r.m];
  return limS(r,true)+', '+T(f)+(en?'. A test assumption, not a legal standard.':'. 계산 시험용 가정이며 법규 기준이 아닙니다.');
}
function srcS(r,d){
  var en=L()==='en',b=d.s;
  if(r.m==='cov')return esc(num(b.bldg)+' m2 ÷ '+num(b.site)+' m2 × 100, '+(en?'synthetic building and site area':'합성 건축면적과 대지'));
  if(r.m==='far')return esc(num(b.far)+' m2 ÷ '+num(b.site)+' m2 × 100, '+(en?'floor area for the ratio, '+num(b.gfa)+' m2 less a '+num(b.ex)+' m2 test exclusion':'산정용 연면적, 전체 '+num(b.gfa)+' m2에서 시험용 제외 '+num(b.ex)+' m2를 뺀 값'));
  return esc((b.door.unit==='m'?num(b.door.val)+' m × 1000':num(b.door.val)+' mm')+', '+(en?'one synthetic door':'합성 문 한 개'));
}
function verdS(r,c){
  var en=L()==='en',d=num(Math.abs(c.margin)),u;
  if(c.st==='na')return en?'Insufficient information. A missing value is never read as zero.':'정보 부족. 빈 값을 0으로 읽지 않습니다.';
  if(Math.abs(c.margin)<1e-9)return en?'Pass, equal to the limit':'적합, 기준과 같음';
  u=r.u==='%'?(en?(d==='1'?' point':' points'):'%p'):' mm';
  if(r.type==='max')return c.st==='ok'?(en?'Pass, '+d+u+' under the cap':'적합, 상한보다 '+d+u+' 낮음'):(en?'Fail, '+d+u+' over the cap':'부적합, 상한보다 '+d+u+' 높음');
  return c.st==='ok'?(en?'Pass, '+d+u+' wider than the minimum':'적합, 하한보다 '+d+u+' 넓음'):(en?'Fail, '+d+u+' narrower than the minimum':'부적합, 하한보다 '+d+u+' 좁음');
}
/* shared axis per rule: the limit sits in the middle, the allowed side is hatched */
function rulerS(r,c){
  if(c.st==='na')return '<span class="ru na" aria-hidden="true"><i class="ru-ax"></i><em>'+(L()==='en'?'no data':'자료 없음')+'</em></span>';
  var d=0;DES.forEach(function(e){var k=checkS(r,e);if(k.v!=null)d=Math.max(d,Math.abs(k.v-r.T));});
  var half=Math.max(r.T*.06,d*1.3),x=Math.max(3,Math.min(97,50+50*(c.v-r.T)/half));
  return '<span class="ru" aria-hidden="true"><i class="ru-ax"></i>'+(r.type==='max'?'<i class="ru-band open-l" style="left:0;width:50%"></i>':'<i class="ru-band open" style="left:50%;width:50%"></i>')
    +'<i class="ru-t solid" style="left:50%"></i><i class="ru-m m-'+c.st+'" style="left:'+x.toFixed(1)+'%"></i></span>';
}

var UID=0;
function Folio(fig){
  var self=this;
  this.fig=fig; this.uid='fo'+(++UID);
  this.sel=0; this.timer=null; this.vis=false;
  this.auto=!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  this.stage=fig.querySelector('.fo-stage'); this.kp=fig.querySelector('.fo-kpis');
  this.render(); this.sync();
  fig.addEventListener('click',function(e){
    if(e.target.closest('.fo-play')){
      self.auto=!self.auto;
      if(self.auto){self.select((self.sel+1)%ROWS.length);if(self.vis)self.start();}else self.stop();
      self.sync(); return;
    }
    var b=e.target.closest('.fo-row'); if(!b||!fig.contains(b))return;
    self.auto=false; self.stop(); self.sync(); self.select(+b.getAttribute('data-i'));
  });
  fig.addEventListener('keydown',function(e){
    var t=e.target; if(!t.classList||!t.classList.contains('fo-row'))return;
    var n=ROWS.length,i=self.sel,k=e.key;
    if(k==='ArrowDown'||k==='ArrowRight')i=(i+1)%n; else if(k==='ArrowUp'||k==='ArrowLeft')i=(i+n-1)%n;
    else if(k==='Home')i=0; else if(k==='End')i=n-1; else return;
    e.preventDefault(); self.auto=false; self.stop(); self.sync(); self.select(i);
    var nb=fig.querySelector('.fo-row[data-i="'+i+'"]'); if(nb)nb.focus();
  });
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){es.forEach(function(e){self.vis=e.isIntersecting;if(self.vis)self.start();else self.stop();});},{threshold:.25}).observe(fig);
  } else { this.vis=true; this.start(); }
  document.addEventListener('visibilitychange',function(){if(document.hidden)self.stop();else if(self.vis)self.start();});
  if('MutationObserver' in window)new MutationObserver(function(){self.render();}).observe(root,{attributes:true,attributeFilter:['data-lang']});
}
Folio.prototype.start=function(){
  var self=this; if(!this.auto||this.timer)return;
  this.timer=setInterval(function(){self.select((self.sel+1)%ROWS.length);},3600);
};
Folio.prototype.stop=function(){if(this.timer){clearInterval(this.timer);this.timer=null;}};
Folio.prototype.sync=function(){this.fig.classList.toggle('auto',this.auto);};
Folio.prototype.select=function(i){
  this.sel=i;
  this.fig.querySelectorAll('.fo-row').forEach(function(el){
    var on=+el.getAttribute('data-i')===i; el.classList.toggle('on',on);
    el.setAttribute('aria-selected',String(on)); el.tabIndex=on?0:-1;
  });
  var p=this.fig.querySelector('.fo-insp');
  if(p){p.innerHTML=this.insp(i);p.setAttribute('aria-labelledby',this.uid+'-t'+i);}
};
Folio.prototype.render=function(){
  var en=L()==='en',uid=this.uid,h='<div class="fo-board"><div class="fo-head" aria-hidden="true"><span class="c-r">'+(en?'Brief and rules':'지침과 규칙')+'</span>';
  DES.forEach(function(d){
    var fu=0; ROWS.forEach(function(r){if(ev(r,d).st!=='ok')fu++;});
    h+='<span class="c-'+d.key.toLowerCase()+'"><b>'+d.key+'</b>'+esc(T(d.role))+'<em>'+(en?'follow-up ':'후속 검토 ')+fu+'/'+ROWS.length+'</em></span>';
  });
  h+='</div><div class="fo-rows" role="tablist" aria-orientation="vertical" aria-label="'+(en?'Brief items and design rules':'지침 항목과 설계 규칙')+'">';
  ROWS.forEach(function(r,i){
    var s=r.mod==='02';
    h+='<button type="button" role="tab" class="fo-row'+(i===RULES.length?' g2':'')+'" id="'+uid+'-t'+i+'" data-i="'+i+'" aria-controls="'+uid+'-in" aria-selected="false" tabindex="-1">'
      +'<span class="fo-rule"><span class="fo-id">'+r.mod+' / '+r.id+'</span><span class="fo-nm">'+esc(T(r.name))+'</span><span class="fo-rq">'+esc(s?limS(r):reqShort(r))+'</span></span>';
    DES.forEach(function(d){
      var c=ev(r,d),it=s?null:d.v[r.id],raw='',vt,ru,na;
      if(s){
        vt=valS(r,c);ru=rulerS(r,c);na=c.st==='na';
        if(r.m==='door'&&d.s.door.unit!=='mm')raw='<small>'+num(d.s.door.val)+' m'+(en?' converted':' 환산')+'</small>';
      }else{
        vt=valueText(r,it);ru=ruler(r,it,c);na=!it;
        if(it&&r.type==='area'&&it.unit!=='m2')raw='<small>'+num(it.val)+' '+unitTxt(it.unit)+(en?' converted':' 환산')+'</small>';
      }
      h+='<span class="fo-cell c-'+d.key.toLowerCase()+'"><span class="fo-v'+(na?' na':'')+'"><span class="vh">'+d.key+' '+esc(T(d.role))+', </span>'+esc(vt)+raw+'</span>'+chip(c.st,r.mod)+ru+'</span>';
    });
    h+='</button>';
  });
  h+='</div></div><div class="fo-insp" role="tabpanel" id="'+uid+'-in"></div>';
  this.stage.innerHTML=h;
  var conv=0,miss=0;
  DES.forEach(function(d){
    RULES.forEach(function(r){var it=d.v[r.id];if(!it)miss++;else if(r.type==='area'&&it.unit!=='m2')conv++;});
    if(d.s&&d.s.door&&d.s.door.unit!=='mm')conv++;
  });
  this.kp.innerHTML='<div><span class="l">'+(en?'Records, both entries on one basis':'두 안을 같은 근거로 읽은 기록')+'</span><b>'+(ROWS.length*DES.length)+'</b></div>'
    +'<div><span class="l">'+(en?'Values converted between units':'단위를 환산한 제출값')+'</span><b>'+conv+'</b></div>'
    +'<div><span class="l">'+(en?'Missing values held, not read as zero':'0으로 읽지 않고 보류한 빈 값')+'</span><b>'+miss+'</b></div>'
    +'<div class="k-no"><span class="l">'+(en?'Scores, rankings, automatic legal verdicts':'점수, 순위, 자동 법규 판정')+'</span><b>'+(en?'None':'없음')+'</b></div>';
  this.select(this.sel);
};
Folio.prototype.insp=function(i){
  var en=L()==='en',r=ROWS[i],s=r.mod==='02';
  var h='<div class="in-h"><span class="in-k">'+(en?'Module ':'모듈 ')+r.mod+' / '+r.id+'</span><span class="in-t">'+esc(T(r.name))+'</span><span class="in-r">'+esc(s?reqLongS(r):reqLong(r))+'</span></div><ul class="in-l">';
  var cs=DES.map(function(d){return ev(r,d);});
  DES.forEach(function(d,k){
    var it=s?null:d.v[r.id],c=cs[k];
    h+='<li><span class="in-e"><b>'+d.key+'</b>'+esc(T(d.role))+'</span><span class="in-s">'+(s?srcS(r,d):srcLine(r,it))+'</span><span class="in-v">'+esc(s?valS(r,c):valueText(r,it))+'</span><span class="in-m m-'+c.st+'"><i aria-hidden="true"></i>'+esc(s?verdS(r,c):verdict(r,c))+'</span></li>';
  });
  var a=cs[0],b=cs[1],diff='',held=en?'Difference held, one entry has no data':'한쪽 자료가 없어 차이를 계산하지 않습니다';
  if(s)diff=(a.st!=='na'&&b.st!=='na')?(en?'Alternative minus baseline ':'대안과 기준안의 차이 ')+sign(b.v-a.v)+(r.u==='%'?(en?' points':'%p'):' mm'):held;
  else if(r.type==='area')diff=(a.st!=='na'&&b.st!=='na')?(en?'Alternative minus baseline ':'대안과 기준안의 차이 ')+sign(b.A-a.A)+sq():held;
  else if(r.type==='count')diff=(en?'Alternative minus baseline ':'대안과 기준안의 차이 ')+sign(b.n-a.n)+(en?' spaces':'대');
  var src=s?(en?'Source, synthetic rule set ':'근거, 합성 규칙집 ')+SET:(en?'Source, ':'근거, ')+T(r.src);
  return h+'</ul><div class="in-f"><span>'+esc(diff)+'</span><span>'+esc(src)+'</span></div>';
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
  document.querySelectorAll('[data-scr]').forEach(function(f){
    if(f.__scr)return; f.__scr=true;
    f.addEventListener('click',function(e){
      var b=e.target.closest('[data-v]'); if(!b||!f.contains(b))return;
      var real=b.getAttribute('data-v')==='1',im=f.querySelector('.scr-img');
      if(real&&im)im.loading='eager';
      f.classList.toggle('real',real);
      f.querySelectorAll('[data-v]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});
    });
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
