/* KAIST NexSpace, concept animation for fact.kaist.ac.kr
   A simplified re-creation of how NexSpace models arrival waves, corridor walking
   and service queues on an example outpatient floor. Illustration only, not the engine. */
(function(){
'use strict';
var root=document.documentElement;
function lang(){return root.getAttribute('data-lang')==='en'?'en':'ko';}

/* keep the chosen language when moving between pages */
function syncLinks(){
  var l=lang();
  document.querySelectorAll('a[data-keep-lang]').forEach(function(a){
    var h=a.getAttribute('href')||'',hash='',i=h.indexOf('#');
    if(i>=0){hash=h.slice(i);h=h.slice(0,i);}
    h=h.replace(/[?&]lang=(ko|en)/,'');
    if(l==='en')h+=(h.indexOf('?')>=0?'&':'?')+'lang=en';
    a.setAttribute('href',(h||'./')+hash);
  });
}
syncLinks();
if('MutationObserver' in window){new MutationObserver(syncLinks).observe(root,{attributes:true,attributeFilter:['data-lang']});}

var W=100,PH=58,H=70,X0=2,X1=98,Y0=3,Y1=55,CY0=26,CY1=32,CORR=29,LOOP=36,DAY=240,PRE=690,PRE_STILL=760;
var RM={
  R101:{ko:'원무',en:'Reception',c:[8,8],svc:.35,w:[8,8]},
  R102:{ko:'라운지',en:'Lounge',c:[10,10],svc:2.0,w:[0,0]},
  R103:{ko:'내과',en:'Medicine',c:[8,8],svc:.9,w:[8,8]},
  R105:{ko:'소아과',en:'Pediatrics',c:[3,3],svc:1.6,w:[6,6]},
  R106:{ko:'채혈실',en:'Blood draw',c:[4,7],svc:1.25,w:[5,10]},
  R107:{ko:'영상의학',en:'Imaging',c:[2,2],svc:1.8,w:[6,6]},
  R108:{ko:'검진센터',en:'Check-up',c:[3,3],svc:1.5,w:[6,6]},
  R109:{ko:'처치실',en:'Treatment',c:[2,2],svc:1.6,w:[4,4]},
  R110:{ko:'수납/약국',en:'Pay/Pharmacy',c:[8,8],svc:.5,w:[10,10]}
};
var LAY=[
  {R101:['t',4,20],R102:['t',20,40],R103:['t',40,58],R105:['t',58,76],R107:['t',76,96],R108:['b',4,24],R109:['b',24,44],R106:['b',44,58],R110:['b',58,96]},
  {R101:['t',4,20],R106:['t',20,40],R103:['t',40,58],R105:['t',58,76],R107:['t',76,96],R108:['b',4,24],R109:['b',24,44],R102:['b',44,62],R110:['b',62,96]}
];
var IDS=['R101','R102','R103','R105','R107','R108','R109','R106','R110'];
var COH=[
  {p:.55,v:14,slow:0,r:['R101','R106','R103','R110']},
  {p:.30,v:8.5,slow:1,r:['R101','R106','R102','R103','R110']},
  {p:.08,v:14,slow:0,r:['R101','R108','R107','R110']},
  {p:.07,v:10.8,slow:0,r:['R101','R105','R109','R110']}
];
function lam(t){return .5+3.7*Math.exp(-Math.pow((t-90)/55,2));}
var LMAX=lam(90);
function ease(x){return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;}
function lerp(a,b,m){return a+(b-a)*m;}
function rr(row,x0,x1){return row==='t'?[x0,Y0,x1,CY0]:[x0,CY1,x1,Y1];}
function ptK(id,k,u,d){var L=LAY[k][id],r=rr(L[0],L[1],L[2]);return [r[0]+(r[2]-r[0])*u, L[0]==='t'?r[3]-(r[3]-r[1])*d:r[1]+(r[3]-r[1])*d];}
function doorK(id,k){var L=LAY[k][id];return [(L[1]+L[2])/2, L[0]==='t'?CY0:CY1];}
function walk(a){return a.st==='go'||(a.st==='out'&&a.ph===1);}

function Sim(fig){
  var self=this;
  this.fig=fig; this.stage=fig.querySelector('.nx-stage'); this.cv=fig.querySelector('canvas'); this.ctx=this.cv.getContext('2d');
  this.spillEl=fig.querySelector('[data-live="spill"]');
  this.reduce=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  this.mode=0; this.p=0; this.auto=!this.reduce; this.running=false; this.vis=false;
  this.reset(); this.resize();
  fig.querySelectorAll('[data-mode]').forEach(function(b){
    b.addEventListener('click',function(){self.auto=false;self.jump(b.getAttribute('data-mode')==='1'?1:0);});
  });
  if('ResizeObserver' in window){new ResizeObserver(function(){self.resize();self.draw();}).observe(this.stage);}
  else{window.addEventListener('resize',function(){self.resize();self.draw();});}
  this.prewarm(this.reduce?PRE_STILL:PRE);
  this.ui(); this.draw();
  if(!this.reduce){
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){es.forEach(function(e){self.vis=e.isIntersecting;if(self.vis)self.start();else self.stop();});},{threshold:.04}).observe(this.stage);
    }else{this.vis=true;this.start();}
    document.addEventListener('visibilitychange',function(){if(document.hidden)self.stop();else if(self.vis)self.start();});
  }
  if('MutationObserver' in window){new MutationObserver(function(){self.draw();}).observe(root,{attributes:true,attributeFilter:['data-lang']});}
}
Sim.prototype.reset=function(){
  this.t=0; this.acc=0; this.A=[]; this.R={};
  for(var i=0;i<IDS.length;i++)this.R[IDS[i]]={s:[],q:[],c:[]};
};
Sim.prototype.resize=function(){
  var r=this.stage.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  this.cw=Math.max(1,r.width); this.ch=Math.max(1,r.height); this.dpr=dpr;
  this.cv.width=Math.round(this.cw*dpr); this.cv.height=Math.round(this.ch*dpr);
  this.max=170;
};
Sim.prototype.start=function(){
  if(this.running)return; this.running=true; var self=this; this.last=performance.now();
  function loop(now){
    if(!self.running)return;
    var dt=Math.min(.05,Math.max(0,(now-self.last)/1000)); self.last=now;
    self.step(dt/2); self.step(dt/2); self.draw();
    self.raf=requestAnimationFrame(loop);
  }
  this.raf=requestAnimationFrame(loop);
};
Sim.prototype.stop=function(){this.running=false;if(this.raf)cancelAnimationFrame(this.raf);};
Sim.prototype.prewarm=function(n){for(var i=0;i<n;i++)this.step(1/30);};

/* geometry, blended between original (0) and NexSpace plan (1) */
Sim.prototype.m=function(){return ease(this.p);};
Sim.prototype.rect=function(id){var m=this.m(),a=LAY[0][id],b=LAY[1][id],r0=rr(a[0],a[1],a[2]),r1=rr(b[0],b[1],b[2]);return [lerp(r0[0],r1[0],m),lerp(r0[1],r1[1],m),lerp(r0[2],r1[2],m),lerp(r0[3],r1[3],m)];};
Sim.prototype.pt=function(id,u,d){var m=this.m(),p0=ptK(id,0,u,d),p1=ptK(id,1,u,d);return [lerp(p0[0],p1[0],m),lerp(p0[1],p1[1],m)];};
Sim.prototype.door=function(id){var m=this.m(),a=doorK(id,0),b=doorK(id,1);return [lerp(a[0],b[0],m),lerp(a[1],b[1],m)];};
Sim.prototype.width=function(id){var r=this.rect(id);return r[2]-r[0];};
Sim.prototype.srvPt=function(id,i){
  var cap=RM[id].c[this.mode],R=this.R[id],hi=cap;
  for(var k=R.s.length-1;k>=cap;k--){if(R.s[k]){hi=k+1;break;}}
  var per=Math.max(1,Math.min(hi,Math.floor(this.width(id)/2.3))),row=Math.floor(i/per),col=i%per;
  return this.pt(id,(col+.5)/per,.6+row*.2);
};
Sim.prototype.wqPt=function(id,j){
  j=Math.max(0,j); var per=Math.max(3,Math.floor(this.width(id)/2.3)),row=Math.floor(j/per),col=j%per;
  return this.pt(id,(col+.5)/per,Math.max(.1,.4-row*.15));
};
Sim.prototype.cqPt=function(id,j){
  j=Math.max(0,j); var d=this.door(id),side=(this.m()<.5?LAY[0][id][0]:LAY[1][id][0])==='t'?-1:1;
  return [Math.max(X0+1,d[0]-1.8-j*1.25),CORR+side*1.95];
};

/* agents and queues */
Sim.prototype.spawn=function(){
  var r=Math.random(),k=0,acc=0;
  for(;k<COH.length-1;k++){acc+=COH[k].p;if(r<=acc)break;}
  var co=COH[k],lane=(Math.random()*2-1)*2;
  this.A.push({x:X0-2.5,y:CORR+lane,lane:lane,v:co.v*(.88+Math.random()*.24),slow:co.slow,route:co.r,k:0,room:co.r[0],st:'go',ph:0,tg:'',slot:-1,tm:0,al:0,nb:0,dead:0});
};
Sim.prototype.target=function(a){
  var id=a.room,d;
  switch(a.st){
    case 'go': if(!id)return [X1+4,CORR+a.lane]; d=this.door(id); return [d[0],CORR+a.lane];
    case 'in': if(a.ph===0)return this.door(id); return a.tg==='srv'?this.srvPt(id,a.slot):this.wqPt(id,this.R[id].q.indexOf(a));
    case 'srv': return this.srvPt(id,a.slot);
    case 'wq': return this.wqPt(id,this.R[id].q.indexOf(a));
    case 'cq': return this.cqPt(id,this.R[id].c.indexOf(a));
    case 'out': if(a.ph===0)return this.door(id); d=this.door(id); return [d[0],CORR+a.lane];
  }
  return [a.x,a.y];
};
Sim.prototype.arrive=function(a,id){
  var R=this.R[id],cap=RM[id].c[this.mode],wc=RM[id].w[this.mode],f=-1,i;
  if(!R.q.length&&!R.c.length){for(i=0;i<cap;i++){if(!R.s[i]){f=i;break;}}}
  if(f>=0){R.s[f]=a;a.slot=f;a.st='in';a.ph=0;a.tg='srv';}
  else if(R.q.length<wc&&!R.c.length){R.q.push(a);a.st='in';a.ph=0;a.tg='wq';}
  else{R.c.push(a);a.st='cq';}
};
Sim.prototype.pull=function(id){
  var R=this.R[id],cap=RM[id].c[this.mode],wc=RM[id].w[this.mode],ch=true,i,n;
  while(ch){
    ch=false;
    for(i=0;i<cap&&R.q.length;i++){if(!R.s[i]){n=R.q.shift();R.s[i]=n;n.slot=i;n.tg='srv';if(n.st==='wq'){n.st='in';n.ph=1;}ch=true;}}
    if(!R.q.length){for(i=0;i<cap&&R.c.length;i++){if(!R.s[i]){n=R.c.shift();R.s[i]=n;n.slot=i;n.tg='srv';n.st='in';n.ph=0;ch=true;}}}
    while(R.c.length&&R.q.length<wc){n=R.c.shift();R.q.push(n);n.st='in';n.ph=0;n.tg='wq';ch=true;}
  }
};
Sim.prototype.finish=function(a){var R=this.R[a.room];if(R.s[a.slot]===a)R.s[a.slot]=null;a.slot=-1;a.st='out';a.ph=0;this.pull(a.room);};
Sim.prototype.reach=function(a){
  switch(a.st){
    case 'go': if(!a.room){a.dead=1;return;} this.arrive(a,a.room); break;
    case 'in': if(a.ph===0){a.ph=1;}else if(a.tg==='srv'){a.st='srv';a.tm=RM[a.room].svc*(.55+.9*Math.random())*(a.slow?1.2:1);}else{a.st='wq';} break;
    case 'out': if(a.ph===0){a.ph=1;}else{a.k++;a.room=a.route[a.k]||null;a.st='go';} break;
  }
};
/* a click shows the same moment of the day under the other plan: re-run the morning in that layout */
Sim.prototype.jump=function(k){
  if(k===this.mode&&this.p===k){this.ui();return;}
  var t=this.t,cv=this.cv;
  this.mode=k; this.p=k; this.reset(); this.prewarm(Math.round(t*LOOP/DAY*30));
  if(!this.reduce){cv.style.transition='none';cv.style.opacity='.25';void cv.offsetWidth;cv.style.transition='opacity .5s ease';cv.style.opacity='1';}
  this.ui(); this.draw();
};
Sim.prototype.setMode=function(k){
  if(k!==this.mode){
    this.mode=k;
    for(var i=0;i<IDS.length;i++){
      var id=IDS[i],R=this.R[id],wc=RM[id].w[k];
      while(R.q.length>wc){var x=R.q[R.q.length-1];if(x.tg==='srv')break;R.q.pop();x.st='cq';R.c.unshift(x);}
      this.pull(id);
    }
  }
  this.ui(); this.draw();
};
Sim.prototype.ui=function(){
  var k=this.mode,f=this.fig;
  f.classList.toggle('after',k===1);
  f.querySelectorAll('[data-mode]').forEach(function(b){b.setAttribute('aria-pressed',String((b.getAttribute('data-mode')==='1'?1:0)===k));});
  f.querySelectorAll('[data-b]').forEach(function(el){el.textContent=el.getAttribute(k?'data-a':'data-b');});
};
Sim.prototype.step=function(dt){
  var A=this.A,i,j,a,b,n;
  this.t+=dt*DAY/LOOP;
  if(this.t>=DAY){this.t-=DAY;if(this.auto)this.setMode(1-this.mode);}
  var goal=this.mode;
  if(this.p!==goal){var dp=dt/1.1;this.p=goal>this.p?Math.min(goal,this.p+dp):Math.max(goal,this.p-dp);}
  this.acc+=lam(this.t)*dt;
  while(this.acc>=1){this.acc-=1;if(A.length<this.max)this.spawn();}
  n=A.length;
  for(i=0;i<n;i++)A[i].nb=0;
  for(i=0;i<n;i++){a=A[i];for(j=i+1;j<n;j++){b=A[j];
    var dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;
    if(d2<5.3){a.nb++;b.nb++;
      if(d2<1.3&&d2>1e-6){var d=Math.sqrt(d2),pu=(1.14-d)*.45,nx=dx/d,ny=dy/d,wa=walk(a),wb=walk(b);
        if(wa&&wb){a.x-=nx*pu*.5;a.y-=ny*pu*.5;b.x+=nx*pu*.5;b.y+=ny*pu*.5;}
        else if(wa){a.x-=nx*pu;a.y-=ny*pu;}
        else if(wb){b.x+=nx*pu;b.y+=ny*pu;}
      }
    }
  }}
  for(i=0;i<n;i++){a=A[i];
    var tg=this.target(a),ex=tg[0]-a.x,ey=tg[1]-a.y,dd=Math.sqrt(ex*ex+ey*ey),v=a.v;
    v*=walk(a)?Math.max(.3,1-.07*a.nb):1.3;
    var sl=v*dt;
    if(dd<=Math.max(.35,sl)){a.x=tg[0];a.y=tg[1];this.reach(a);}else{a.x+=ex/dd*sl;a.y+=ey/dd*sl;}
    if(walk(a)&&a.x>X0&&a.x<X1)a.y=Math.max(CY0+.7,Math.min(CY1-.7,a.y));
    if(a.st==='srv'){a.tm-=dt;if(a.tm<=0)this.finish(a);}
    if(a.al<1)a.al=Math.min(1,a.al+dt*3);
  }
  for(i=0;i<A.length;i++){if(A[i].dead){this.A=A.filter(function(x){return !x.dead;});break;}}
};

/* drawing */
Sim.prototype.draw=function(){
  var c=this.ctx,cw=this.cw,s=cw/W,m=this.m(),L=lang(),i,k,id;
  c.setTransform(this.dpr,0,0,this.dpr,0,0); c.clearRect(0,0,cw,this.ch);
  var fs=Math.max(8,Math.min(11.5,s*1.25)),mono=fs+'px "Space Mono","Pretendard Variable",monospace',sans='500 '+fs+'px "Pretendard Variable",Pretendard,sans-serif';
  c.textBaseline='alphabetic';
  /* grid */
  c.lineWidth=1; c.strokeStyle='rgba(255,255,255,.035)'; c.beginPath();
  for(i=0;i<=W;i+=4){var gx=Math.round(i*s)+.5;c.moveTo(gx,0);c.lineTo(gx,PH*s);}
  for(i=0;i<=PH;i+=4){var gy=Math.round(i*s)+.5;c.moveTo(0,gy);c.lineTo(cw,gy);}
  c.stroke();
  /* corridor */
  c.fillStyle='rgba(143,176,255,.045)'; c.fillRect(X0*s,CY0*s,(X1-X0)*s,(CY1-CY0)*s);
  c.setLineDash([3,5]); c.strokeStyle='rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(X0*s,CORR*s); c.lineTo(X1*s,CORR*s); c.stroke(); c.setLineDash([]);
  /* rooms */
  for(i=0;i<IDS.length;i++){
    id=IDS[i];
    var r=this.rect(id),R=this.R[id],q=R.q.length+R.c.length,h=Math.min(1,q/7),
        px=r[0]*s,py=r[1]*s,pw=(r[2]-r[0])*s,ph=(r[3]-r[1])*s,hi=(id==='R106'||id==='R102')?m:0;
    if(h>.02){c.fillStyle='rgba(255,106,61,'+(.06+.36*h).toFixed(3)+')';c.fillRect(px,py,pw,ph);}
    if(hi>.01){c.fillStyle='rgba(59,110,246,'+(.12*hi).toFixed(3)+')';c.fillRect(px,py,pw,ph);}
    var dr=this.door(id),top=Math.abs(dr[1]-r[3])<Math.abs(dr[1]-r[1]),g=1.7*s,dx=dr[0]*s,ey=top?py+ph:py,fy=top?py:py+ph;
    c.strokeStyle=hi>.5?'rgba(143,176,255,.95)':'rgba(237,237,237,.42)'; c.lineWidth=hi>.5?1.5:1.1;
    c.beginPath();
    c.moveTo(px,fy);c.lineTo(px+pw,fy); c.moveTo(px,py);c.lineTo(px,py+ph); c.moveTo(px+pw,py);c.lineTo(px+pw,py+ph);
    c.moveTo(px,ey);c.lineTo(Math.max(px,dx-g),ey); c.moveTo(Math.min(px+pw,dx+g),ey);c.lineTo(px+pw,ey);
    c.stroke();
    /* service stations */
    var cap=RM[id].c[this.mode]; c.strokeStyle='rgba(237,237,237,.55)'; c.lineWidth=1; c.beginPath();
    for(k=0;k<cap;k++){var sp=this.srvPt(id,k),yy=sp[1]*s+(top?-1:1)*.95*s;c.moveTo(sp[0]*s-.55*s,yy);c.lineTo(sp[0]*s+.55*s,yy);}
    c.stroke();
    /* labels */
    var ly1=top?py+fs+3:py+ph-fs-5,ly2=top?py+2*fs+6:py+ph-4;
    c.font=mono; c.fillStyle='rgba(185,188,195,.9)'; c.fillText(id,px+4,ly1);
    var nm=RM[id][L]; c.font=sans;
    if(c.measureText(nm).width+8<pw){c.fillStyle='rgba(237,237,237,.8)';c.fillText(nm,px+4,ly2);}
    if(q>0){c.font=mono;c.fillStyle='#FF8A65';var qt='Q '+q,qw=c.measureText(qt).width;if(qw+c.measureText(id).width+14<pw)c.fillText(qt,px+pw-qw-4,ly1);}
  }
  /* outer walls with entrance and exit */
  c.strokeStyle='rgba(237,237,237,.6)'; c.lineWidth=1.4; c.beginPath();
  c.moveTo(X0*s,CY0*s);c.lineTo(X0*s,Y0*s);c.lineTo(X1*s,Y0*s);c.lineTo(X1*s,CY0*s);
  c.moveTo(X0*s,CY1*s);c.lineTo(X0*s,Y1*s);c.lineTo(X1*s,Y1*s);c.lineTo(X1*s,CY1*s);
  c.stroke();
  c.font=mono; c.fillStyle='rgba(143,176,255,.95)';
  c.fillText('IN',(X0+.8)*s,CY0*s+fs+2);
  var ow=c.measureText('OUT').width; c.fillText('OUT',(X1-.8)*s-ow,CY0*s+fs+2);
  /* agents */
  var rad=Math.max(1.5,.6*s);
  for(i=0;i<this.A.length;i++){var a=this.A[i];c.globalAlpha=a.al;c.fillStyle=a.slow?'#8FB0FF':'#EDEDED';c.beginPath();c.arc(a.x*s,a.y*s,rad,0,6.2832);c.fill();}
  c.globalAlpha=1;
  /* arrival wave and clock */
  var base=(PH+7.2)*s,hh=4.9*s,x0=X0*s,x1=X1*s;
  function tx(t){return x0+(x1-x0)*t/DAY;}
  c.beginPath(); for(k=0;k<=DAY;k+=4){var yv=base-lam(k)/LMAX*hh;if(k)c.lineTo(tx(k),yv);else c.moveTo(tx(k),yv);}
  c.lineTo(tx(DAY),base); c.lineTo(tx(0),base); c.closePath(); c.fillStyle='rgba(143,176,255,.10)'; c.fill();
  c.beginPath(); for(k=0;k<=DAY;k+=4){var yw=base-lam(k)/LMAX*hh;if(k)c.lineTo(tx(k),yw);else c.moveTo(tx(k),yw);}
  c.strokeStyle='rgba(143,176,255,.9)'; c.lineWidth=1.2; c.stroke();
  c.strokeStyle='rgba(255,255,255,.22)'; c.lineWidth=1; c.beginPath(); c.moveTo(x0,base+.5); c.lineTo(x1,base+.5); c.stroke();
  var xp=tx(this.t); c.strokeStyle='#fff'; c.beginPath(); c.moveTo(xp,base+3); c.lineTo(xp,base-hh); c.stroke();
  c.fillStyle='#fff'; c.beginPath(); c.arc(xp,base-lam(this.t)/LMAX*hh,2.6,0,6.2832); c.fill();
  c.font=mono; c.fillStyle='rgba(128,132,140,1)';
  var tyl=base+fs+3; c.fillText('08:00',x0,tyl);
  var pk=(L==='en'?'Peak ':'피크 ')+'09:30',pkw=c.measureText(pk).width; c.fillText(pk,tx(90)-pkw/2,tyl);
  var ew=c.measureText('12:00').width; c.fillText('12:00',x1-ew,tyl);
  var mm=Math.floor(this.t),hr=8+Math.floor(mm/60),mi=mm%60,clk=(hr<10?'0':'')+hr+':'+(mi<10?'0':'')+mi;
  c.font='700 '+(fs+1)+'px "Space Mono",monospace'; c.fillStyle='#fff';
  var cwid=c.measureText(clk).width,cx=xp+7+cwid<=x1?xp+7:xp-7-cwid;
  c.fillStyle='rgba(12,13,16,.86)'; c.fillRect(cx-3,base-fs-6,cwid+6,fs+5); c.fillStyle='#fff'; c.fillText(clk,cx,base-4);
  var spill=0; for(i=0;i<IDS.length;i++)spill+=this.R[IDS[i]].c.length;
  c.font=mono; var t1=(L==='en'?'On floor ':'재실 ')+this.A.length,t2=(L==='en'?'Spillover ':'복도 역류 ')+spill,w1=c.measureText(t1).width,w2=c.measureText(t2).width,hy=PH*s+fs+1;
  c.fillStyle='rgba(185,188,195,.9)'; c.fillText(t1,x1-w2-16-w1,hy);
  c.fillStyle=spill?'#FF8A65':'rgba(185,188,195,.9)'; c.fillText(t2,x1-w2,hy);
  c.fillStyle='rgba(143,176,255,.9)'; c.fillText(L==='en'?'Arrivals λ(t)':'도착률 λ(t)',x0,hy);
  if(this.spillEl&&this.spillEl.textContent!==String(spill))this.spillEl.textContent=spill;
};

function init(){document.querySelectorAll('[data-nx]').forEach(function(f){if(!f.__nx)f.__nx=new Sim(f);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){document.querySelectorAll('[data-nx]').forEach(function(f){if(f.__nx)f.__nx.draw();});});}
})();
