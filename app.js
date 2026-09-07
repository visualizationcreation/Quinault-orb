'use strict';
const D=window.COURSE, $=s=>document.querySelector(s), audio=$('#audio');
const fmt=s=>{s=Math.max(0,Math.floor(s||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current=0,mode='ready',parked=null,history=[],visited=new Set([0]),trail=[0],complete=false,playToken=0;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,motion=!reduced;
const initialId=decodeURIComponent(location.hash.slice(1)), initialIndex=D.points.findIndex(p=>p.id===initialId);
if(initialIndex>=0){current=initialIndex;visited=new Set([current]);trail=[current];}
const initialTime=Number(new URLSearchParams(location.search).get('t'))||0;
$('#runtime').textContent=`8 stops · ${fmt(Math.round(D.totalDuration))} recorded · 15-minute pilot`;
const svg=(content)=>`<svg viewBox="0 0 600 220" role="img" aria-label="${esc(D.points[current].subtitle)}"><defs><linearGradient id="fade" x2="0" y2="1"><stop stop-color="#c7dca1" stop-opacity=".35"/><stop offset="1" stop-color="#c7dca1" stop-opacity=".03"/></linearGradient></defs>${content}</svg>`;
const tx=(x,y,t,size=12)=>`<text x="${x}" y="${y}" fill="#c8d7d0" font-family="Segoe UI,sans-serif" font-size="${size}" text-anchor="middle">${t}</text>`;
function diagram(i){
 if(i===1)return svg(`<path d="M0 170 Q70 162 135 170 T270 170" fill="none" stroke="#709ba2"/><path d="M235 183 L395 54 L550 183Z" fill="url(#fade)" stroke="#739693"/><path d="M65 105 Q195 135 300 67" fill="none" stroke="#c7dca1" stroke-width="3"/><path d="M286 67 L300 67 L297 81" fill="none" stroke="#c7dca1" stroke-width="3"/><g fill="#8ba6a7"><ellipse cx="320" cy="53" rx="35" ry="12"/><ellipse cx="340" cy="47" rx="29" ry="16"/></g><g stroke="#82b9c1">${[0,1,2,3,4].map(n=>`<path d="M${290+n*13} 78 l-8 25"/>`).join('')}</g>${tx(115,145,'PACIFIC AIR')}${tx(440,203,'OLYMPIC MOUNTAINS')}${tx(312,22,'RISE · COOL · CONDENSE',10)}`);
 if(i===2)return svg(`<path d="M40 55 L145 170 L245 55" fill="none" stroke="#65898c" stroke-width="3"/><path d="M350 55 Q355 175 445 175 Q535 175 545 55" fill="none" stroke="#c7dca1" stroke-width="3"/><path d="M359 95 Q372 174 445 175 Q515 175 537 95Z" fill="url(#fade)"/>${tx(145,205,'STREAM-CUT V')}${tx(445,205,'ICE-SHAPED U')}${tx(300,108,'→',32)}${tx(445,74,'MOVING ICE',10)}`);
 if(i===3)return svg(`<path d="M75 160 Q285 135 518 160 L518 183 Q287 165 75 183Z" fill="#8c7251"/><g stroke="#c7dca1" stroke-width="2">${[135,220,310,412].map((x,n)=>`<path d="M${x} 150 v-${45+n*11}"/><path d="M${x-17} ${126-n*9} l17 -26 l17 26" fill="#284b40"/>`).join('')}</g>${tx(296,205,'FALLEN WOOD → NEW GROWTH')}${tx(300,40,'A NURSE LOG',11)}`);
 if(i===5)return svg(`<circle cx="300" cy="108" r="51" fill="url(#fade)" stroke="#c7dca1"/>${tx(300,105,'QUINAULT',13)}${tx(300,124,'INDIAN NATION',11)}${[[120,60,'FISHERIES'],[490,60,'FORESTRY'],[115,172,'COMMUNITY'],[492,172,'WATER & LAND']].map(([x,y,t])=>`<path d="M${x<300?x+50:x-50} ${y} L${x<300?260:340} ${y<100?80:137}" stroke="#517577"/>${tx(x,y,t,10)}`).join('')}`);
 if(i===6)return svg(`<path d="M0 75 Q160 30 278 99 T600 92 L600 165 Q410 195 275 149 T0 145Z" fill="#2f5962"/><path d="M170 62 l83 108 M190 57 l76 98 M158 101 l117 31" stroke="#b5ad80" stroke-width="9" stroke-linecap="round"/><path d="M280 98 Q354 45 424 59" fill="none" stroke="#c7dca1" stroke-width="2"/><path d="M412 52 l12 7 l-13 7" fill="none" stroke="#c7dca1" stroke-width="2"/>${tx(450,35,'VARIED FLOW & HABITAT',10)}${tx(208,202,'LARGE WOOD',10)}`);
 return '';
}
function render(){
 const p=D.points[current];
 $('#point-title').textContent=p.title;$('#point-subtitle').textContent=p.subtitle;$('#point-number').textContent=`POINT ${String(current+1).padStart(2,'0')} / 08`;
 $('#point-time').textContent=fmt(p.duration)+' listening';$('#reading').textContent=p.text;
 document.title=`${p.title} · Quinault ORB`;
 $('#point-list').innerHTML=D.points.map((p,i)=>`<button data-point="${i}" aria-current="${i===current}"><span class="num">${String(i+1).padStart(2,'0')}</span><span>${esc(p.title)}</span></button>`).join('');
 $('#source-list').innerHTML=p.sources.map(k=>`<li><a href="${D.sources[k].url}" target="_blank" rel="noopener noreferrer">${esc(D.sources[k].title)} ↗</a></li>`).join('');
 $('#original-ids').textContent='Original ORB points: '+p.originalIds.join(' · ');
 const drawings=diagram(current);$('#scene').hidden=!!drawings;$('#diagram').hidden=!drawings;$('#diagram').innerHTML=drawings;
 $('#caption').innerHTML=drawings?'Explanatory diagram · ORB Studio · schematic, not a geographic map':'Lake Quinault, south shore · <a href="https://commons.wikimedia.org/wiki/File:Lake_Quinault_South_Shore_1-27-11_ONP_photo_(3)_(17126356720).jpg" target="_blank" rel="noopener">Olympic National Park photo · public domain</a>';
 const names={up:'↑ UP · Broader',down:'↓ DOWN · Deeper',left:'← LEFT · Related',right:'RIGHT · Related →',backward:'↶ BACKWARD · Thread',forward:'FORWARD · Thread ↷'};
 $('#directions').innerHTML=Object.entries(names).map(([dir,label])=>{const dest=p.links[dir];return `<button data-direction="${dir}" ${dest==null?'disabled title="No further authored connection in this pilot"':''}>${label}<small>${dest==null?'Edge of this pilot':esc(D.points[dest].title)}</small></button>`}).join('');
 $('#history').disabled=!history.length;$('#previous').disabled=current===0;$('#next').disabled=current===D.points.length-1;
 $('#completion').hidden=!complete||current!==7;
 $('#resume').hidden=!parked;updateTransport();setTarget();
}
function setSource(time=0){audio.src=D.points[current].audio;audio.playbackRate=Number($('#speed').value);audio.load();if(time){const loaded=()=>{audio.currentTime=Math.min(time,Math.max(0,D.points[current].duration-.1))};audio.addEventListener('loadedmetadata',loaded,{once:true})}}
function select(i,{browse=true,addHistory=true,time=0}={}){
 if(i<0||i>=D.points.length)return;
 if(browse&&mode==='course'&&!parked)parked={index:current,time:audio.currentTime};
 audio.pause();++playToken;
 if(addHistory&&i!==current)history.push(current);
 current=i;visited.add(i);if(trail.at(-1)!==i)trail.push(i);mode=browse?'browse':'course';complete=false;
 setSource(time);render();
 try{window.history.replaceState(null,'','#'+D.points[current].id)}catch{}
 $('#player-message').textContent='';
}
async function play(){
 if(complete){select(0,{browse:false});parked=null;}
 if(mode==='ready')mode='course';
 const token=++playToken;
 try{await audio.play();if(token===playToken){$('#player-message').textContent='';updateTransport()}}
 catch(e){if(e.name!=='AbortError')$('#player-message').textContent='Playback could not start. Keep the narration files beside index.html and try again.'}
}
function updateTransport(){
 const playing=!audio.paused;
 $('#play').textContent=playing?'Ⅱ Pause':complete?'↻ Replay journey':mode==='ready'?'▶ Begin journey':'▶ Play '+(mode==='browse'?'this point':'journey');
 $('#play').setAttribute('aria-label',playing?'Pause narration':complete?'Replay journey':mode==='browse'?'Play this point':'Play journey');
 $('#play-state').textContent=complete?'JOURNEY COMPLETE':(mode==='browse'?'BROWSING · ':mode==='ready'?'':'GUIDED · ')+(playing?'LISTENING':mode==='ready'?'READY TO LISTEN':'PAUSED');
 $('#now-title').textContent=D.points[current].title;
 $('#mode-label').textContent=mode==='browse'?'Exploring connections':complete?'Journey complete':playing?'Following the spiral':'Eight points · one connected valley';
 $('#resume').hidden=!parked;
 updateTime();
}
function updateTime(){const t=audio.currentTime||0,d=D.points[current].duration;$('#elapsed').textContent=fmt(t);$('#remaining').textContent=fmt(d);$('#seek').max=d||1;$('#seek').value=t;const before=D.points.slice(0,current).reduce((s,p)=>s+p.duration,0);$('#journey-time').textContent=mode==='browse'?'POINT '+(current+1)+' / 8':`${fmt(before+t)} / ${fmt(Math.round(D.totalDuration))}`}
$('#point-list').addEventListener('click',e=>{const b=e.target.closest('[data-point]');if(b)select(+b.dataset.point)});
$('#directions').addEventListener('click',e=>{const b=e.target.closest('[data-direction]');if(b&&!b.disabled)select(D.points[current].links[b.dataset.direction])});
$('#history').onclick=()=>{if(history.length)select(history.pop(),{addHistory:false})};
$('#play').onclick=()=>audio.paused?play():audio.pause();
for(const [id,delta]of[['previous',-1],['next',1]])$('#'+id).onclick=()=>{const wasPlaying=!audio.paused;parked=null;select(current+delta,{browse:false});if(wasPlaying)play()};
$('#resume').onclick=()=>{const p=parked;if(!p)return;parked=null;select(p.index,{browse:false,time:p.time});play()};
$('#speed').onchange=()=>{audio.playbackRate=Number($('#speed').value)};
$('#seek').oninput=e=>{audio.currentTime=+e.target.value;updateTime()};
audio.addEventListener('timeupdate',updateTime);audio.addEventListener('play',updateTransport);audio.addEventListener('pause',updateTransport);
audio.addEventListener('error',()=>{$('#player-message').textContent='Narration file unavailable. The reading and orb still work; open index.html with its narration files.'});
audio.addEventListener('ended',()=>{if(mode==='course'&&current<7){select(current+1,{browse:false});play()}else{complete=mode==='course'&&current===7;render();if(complete)$('#player-message').textContent='Journey complete. Revisit a point, or jump into the Orbiverse.'}});
$('#restart').onclick=()=>{parked=null;select(0,{browse:false});play()};
$('.chosen').onclick=()=>{parked=null;select(0,{browse:false});mode='ready';updateTransport()};
$('#print').onclick=()=>{audio.pause();const prior=$('#sources').open;$('#sources').open=true;window.addEventListener('afterprint',()=>{$('#sources').open=prior},{once:true});window.print()};
function checkpoint(){const p=D.points[current];return `/orbiverse\nContinue from the Quinault ORB.\nRoot anchor: ${D.anchor}\nCurrent point: ${p.id} — ${p.title}\nLocal anchor: ${p.subtitle}\nOriginal point IDs: ${p.originalIds.join(', ')}\nVisited route: ${trail.map(i=>D.points[i].id).join(' → ')}\nContext: ${p.text}\nSources:\n${p.sources.map(k=>D.sources[k].url).join('\n')}\nKeep the six-direction ORB compass. Offer connected sub-orbs and distinguish evidence from interpretation. This is a new live exploration from an HTML checkpoint.`}
$('#jump').onclick=()=>{audio.pause();$('#prompt').value=checkpoint();$('#copy-status').textContent='';$('#handoff').showModal()};
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#prompt').value);$('#copy-status').textContent='Copied. Paste it into your ORB chat.'}catch{$('#prompt').focus();$('#prompt').select();$('#copy-status').textContent='Text selected. Press Ctrl+C (or Command+C) to copy.'}};
$('#export').onclick=()=>{const p=parked||{index:current,time:audio.currentTime};const u=new URL(location.href);u.hash=D.points[p.index].id;u.searchParams.set('t',Math.floor(p.time));const text=`Quinault ORB saved place\n${D.points[p.index].title} at ${fmt(p.time)}\nReopen on this computer: ${u.href}\nIf the folder moves, open index.html, select point ${p.index+1}, and seek to ${fmt(p.time)}.\n\n${checkpoint()}`;const b=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='quinault-saved-place.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);$('#player-message').textContent='Saved place downloaded. No browser storage is required.'};
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)||$('#handoff').open)return;if(e.code==='Space'){e.preventDefault();$('#play').click()}});
window.addEventListener('hashchange',()=>{const i=D.points.findIndex(p=>p.id===decodeURIComponent(location.hash.slice(1)));if(i>=0&&i!==current)select(i)});
// Sphere positions represent authored course order only. Conceptual links live in data.js.
const canvas=$('#orb'),ctx=canvas.getContext('2d');let W=0,H=0,R=0,yaw=0,targetYaw=0,pitch=-.1,targetPitch=-.1,last=0,hits=[];
const turns=2.15;
function xyz(t){let lat=(.43-.86*t)*Math.PI,lon=t*Math.PI*2*turns;return [Math.cos(lat)*Math.sin(lon),-Math.sin(lat),Math.cos(lat)*Math.cos(lon)]}
function project(v){let [x,y,z]=v;let a=x*Math.cos(yaw)+z*Math.sin(yaw),b=z*Math.cos(yaw)-x*Math.sin(yaw);let c=y*Math.cos(pitch)-b*Math.sin(pitch),d=y*Math.sin(pitch)+b*Math.cos(pitch);return [W/2+a*R,H/2+c*R,d]}
function resize(){const b=canvas.getBoundingClientRect();W=b.width;H=b.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);R=Math.min(W*.39,H*.37)}
function setTarget(){const lon=current/7*Math.PI*2*turns;let next=-lon;while(next-yaw>Math.PI)next-=Math.PI*2;while(next-yaw< -Math.PI)next+=Math.PI*2;targetYaw=next;targetPitch=0;}
function path(points,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()}
function draw(now){const dt=Math.min((now-last)/1000||.016,.06);last=now;if(motion){yaw+=(targetYaw+(!audio.paused?Math.sin(now/8000)*.12:0)-yaw)*Math.min(1,dt*3);pitch+=(targetPitch-pitch)*Math.min(1,dt*3)}else{yaw=targetYaw;pitch=targetPitch}ctx.clearRect(0,0,W,H);const glow=ctx.createRadialGradient(W/2-R*.3,H/2-R*.4,R*.06,W/2,H/2,R);glow.addColorStop(0,'#1f494b');glow.addColorStop(.65,'#102e34');glow.addColorStop(1,'#091b21');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(W/2,H/2,R,0,Math.PI*2);ctx.fill();
 for(let lat=-75;lat<=75;lat+=15){let points=[];for(let d=0;d<=360;d+=3){const a=lat*Math.PI/180,b=d*Math.PI/180;const p=project([Math.cos(a)*Math.sin(b),-Math.sin(a),Math.cos(a)*Math.cos(b)]);if(p[2]>.01)points.push(p);else if(points.length){path(points,'#7aa6a019');points=[]}}if(points.length)path(points,'#7aa6a019')}
 for(let lon=0;lon<360;lon+=30){let ps=[];for(let lat=-90;lat<=90;lat+=3){let a=lat*Math.PI/180,b=lon*Math.PI/180;let p=project([Math.cos(a)*Math.sin(b),-Math.sin(a),Math.cos(a)*Math.cos(b)]);if(p[2]>0)ps.push(p);else if(ps.length){path(ps,'#7aa6a022');ps=[]}}if(ps.length)path(ps,'#7aa6a022')}
 let prev=null;for(let n=0;n<=400;n++){const p=project(xyz(n/400));if(prev)path([prev,p],p[2]>0?'#c7dca196':'#7b9c5c35',p[2]>0?1.6:1);prev=p}
 const ns=D.points.map((p,i)=>({i,p:project(xyz(i/7))})).sort((a,b)=>a.p[2]-b.p[2]);hits=[];
 for(const {i,p}of ns){const active=i===current,[x,y,z]=p;const rr=active?17:12;ctx.globalAlpha=active?1:z<0?.48:.95;if(active){ctx.beginPath();ctx.arc(x,y,24+(motion&&!audio.paused?Math.sin(now/650)*2:0),0,Math.PI*2);ctx.strokeStyle='#c7dca155';ctx.lineWidth=1;ctx.stroke()}ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fillStyle=active?'#c7dca1':'#112f35';ctx.fill();ctx.strokeStyle=active?'#ddecbd':'#729797';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=active?'#102621':'#d4e2d6';ctx.font=`${active?'bold ':''}11px Segoe UI`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),x,y);hits.push({i,x,y,r:rr+9})}ctx.globalAlpha=1;
 ctx.beginPath();ctx.arc(W/2,H/2,R,0,Math.PI*2);ctx.strokeStyle='#84a99d33';ctx.stroke();requestAnimationFrame(draw)}
canvas.addEventListener('click',e=>{const b=canvas.getBoundingClientRect();const hit=hits.slice().reverse().find(h=>Math.hypot(e.clientX-b.left-h.x,e.clientY-b.top-h.y)<h.r);if(hit)select(hit.i)});
$('#motion').onclick=()=>{motion=!motion;$('#motion').textContent=motion?'Motion on':'Motion off';$('#motion').setAttribute('aria-pressed',String(motion))};
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches){motion=false;$('#motion').textContent='Motion off';$('#motion').setAttribute('aria-pressed','false')}});
$('#motion').textContent=motion?'Motion on':'Motion off';$('#motion').setAttribute('aria-pressed',String(motion));
new ResizeObserver(resize).observe(canvas);resize();setSource(initialTime);render();requestAnimationFrame(draw);
