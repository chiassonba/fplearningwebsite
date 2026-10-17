'use strict';
const $ = id => document.getElementById(id);
const defaults = [
  {name:'COMMUNICATIONS',url:'https://mail.google.com/'},
  {name:'CHRONOMETER',url:'https://calendar.google.com/'},
  {name:'DATA ARCHIVES',url:'https://drive.google.com/'},
  {name:'ASTROMETRICS',url:'https://www.google.com/maps'},
  {name:'SUBSPACE MEDIA',url:'https://spotify.com/'},
  {name:'FPL RESOURCES',url:'https://fplearning.ca/files.htm'}
];
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{$('storage-status').textContent='STORAGE UNAVAILABLE';return false;}}
function safeURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u:null;}catch{return null;}}
let saved=read('voyager.destinations',defaults);
let destinations=Array.isArray(saved)&&saved.length===6&&saved.every(d=>d&&typeof d.name==='string'&&safeURL(d.url))?saved:defaults.map(d=>({...d}));
if(read('voyager.media-version',0)<2){
  destinations=destinations.map(d=>d.name.trim().toUpperCase()==='SUBSPACE MEDIA'?{...d,url:'https://spotify.com/'}:d);
  if(write('voyager.destinations',destinations))write('voyager.media-version',2);
}
if(read('voyager.maps-version',0)<1){
  destinations=destinations.map(d=>d.name.trim().toUpperCase()==='ASTROMETRICS'?{...d,url:'https://www.google.com/maps'}:d);
  if(write('voyager.destinations',destinations))write('voyager.maps-version',1);
}
if(read('voyager.resources-version',0)<1){
  destinations=destinations.map(d=>d.name.trim().toUpperCase()==='LCARS DATABASE'?{name:'FPL RESOURCES',url:'https://fplearning.ca/files.htm'}:d);
  if(write('voyager.destinations',destinations))write('voyager.resources-version',1);
}
let sound=read('voyager.sound',!/OPR\//.test(navigator.userAgent))===true;
const samples=Object.fromEntries(Object.entries({letter:'beep2',space:'beep1',enter:'beep4',backspace:'beep3'}).map(([kind,file])=>{
  const sample=new Audio(`lcars/assets/audio/${file}.mp3`);sample.preload='auto';sample.volume=.35;return [kind,sample];
}));
let activeSample;
function chirp(kind='letter'){
  if(!sound)return;
  try{
    activeSample?.pause();activeSample=samples[kind]||samples.letter;activeSample.currentTime=0;
    void activeSample.play().catch(()=>{});
  }catch{/* Sound is optional if this browser restricts audio. */}
}
function render(){
  $('destinations').replaceChildren();
  destinations.forEach((d,i)=>{
    const a=document.createElement('a');a.className='destination';a.href=d.url;
    a.style.setProperty('--tile',['#ffe1ca','#55a7ff','#828cad','#cc9966','#99ccff','#ffbb33'][i]);
    const number=document.createElement('span');number.className='index';number.textContent=String(i+1).padStart(2,'0');
    const target=document.createElement('span');target.className='target';
    const name=document.createElement('span');name.className='name';name.textContent=d.name;
    const host=document.createElement('span');host.className='host';host.textContent=new URL(d.url).hostname.replace(/^www\./,'').toUpperCase();
    target.append(name,host);a.append(number,target);$('destinations').append(a);
  });
}
function soundLabel(){$('sound').textContent=`PAGE CHIRPS: ${sound?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(sound));}
$('sound').addEventListener('click',()=>{sound=!sound;write('voyager.sound',sound);soundLabel();if(!sound)activeSample?.pause();chirp('enter');});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.repeat)return;
  if(e.key.length===1||['Backspace','Enter'].includes(e.key))chirp(e.key==='Enter'?'enter':e.key==='Backspace'?'backspace':e.key===' '?'space':'letter');
});
const engines={google:'https://www.google.ca/search?q=',duckduckgo:'https://duckduckgo.com/?q=',bing:'https://www.bing.com/search?q='};
// Apply the requested Google.ca default once, while preserving later manual choices.
if(read('voyager.search-version',0)<2){if(write('voyager.engine','google'))write('voyager.search-version',2);}
const selected=read('voyager.engine','google');$('engine').value=Object.hasOwn(engines,selected)?selected:'google';
$('engine').addEventListener('change',()=>write('voyager.engine',$('engine').value));
function resolveCommand(q,engine){
  if(/^https?:\/\//i.test(q)){const u=safeURL(q);if(u)return u.href;}
  if(!/\s/.test(q)&&/^(localhost(?::\d+)?|(?:[\w-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#].*)?$/i.test(q))return new URL((q.startsWith('localhost')?'http://':'https://')+q).href;
  return (engines[engine]||engines.google)+encodeURIComponent(q);
}
$('command-form').addEventListener('submit',e=>{e.preventDefault();const q=$('command').value.trim();if(q)location.assign(resolveCommand(q,$('engine').value));});
$('edit').addEventListener('click',()=>{
  $('edit-rows').replaceChildren();$('edit-error').textContent='';
  destinations.forEach((d,i)=>{
    const row=document.createElement('div');row.className='edit-row';
    for(const [key,label]of [['name',`${i+1} / LABEL`],['url','WEBSITE ADDRESS']]){
      const l=document.createElement('label');l.textContent=label;
      const input=document.createElement('input');input.name=`${key}-${i}`;input.value=d[key];input.required=true;input.maxLength=key==='name'?35:2048;input.type=key==='url'?'url':'text';l.append(input);row.append(l);
    }
    $('edit-rows').append(row);
  });$('editor').showModal();
});
$('close').addEventListener('click',()=>$('editor').close());
$('edit-form').addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(e.currentTarget);
  const next=Array.from({length:6},(_,i)=>({name:String(data.get(`name-${i}`)).trim(),url:String(data.get(`url-${i}`)).trim()}));
  if(next.some(d=>!d.name||!safeURL(d.url))){$('edit-error').textContent='ENTER A LABEL AND A VALID HTTP OR HTTPS ADDRESS FOR EACH DESTINATION.';return;}
  if(!write('voyager.destinations',next)){$('edit-error').textContent='THIS BROWSER COULD NOT SAVE YOUR DESTINATIONS. CHECK LOCAL STORAGE SETTINGS.';return;}
  destinations=next;render();$('editor').close();
});
function clock(){const d=new Date();$('clock').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});$('clock').dateTime=d.toISOString();$('date').textContent=d.toLocaleDateString([],{year:'numeric',month:'short',day:'2-digit'}).toUpperCase();}
clock();let timer=setInterval(clock,30000);
document.addEventListener('visibilitychange',()=>{clearInterval(timer);if(!document.hidden){clock();timer=setInterval(clock,30000);}});
render();soundLabel();
