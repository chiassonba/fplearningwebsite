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
const sidebarDefaults=[
  {name:'COMMUNICATIONS',url:'https://mail.google.com/'},
  {name:'CHRONOMETER',url:'https://calendar.google.com/'},
  {name:'ARCHIVES',url:'https://drive.google.com/'},
  {name:'FPLearning Interlink',url:'https://fplearning.ca/'}
];
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{$('storage-status').textContent='STORAGE UNAVAILABLE';return false;}}
function safeURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u:null;}catch{return null;}}
function destinationMode(d){
  if(['screen','tab'].includes(d.mode))return d.mode;
  const url=safeURL(d.url);
  return url&&(url.origin===location.origin||['fplearning.ca','www.fplearning.ca'].includes(url.hostname))?'screen':'tab';
}
let saved=read('voyager.destinations',defaults);
function validLinks(value){return Array.isArray(value)&&value.every(d=>d&&typeof d.name==='string'&&d.name.trim()&&safeURL(d.url));}
let destinations=validLinks(saved)?saved:defaults.map(d=>({...d}));
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
const storedLinks=read('voyager.links',null);
if(storedLinks&&validLinks(storedLinks.destinations)&&validLinks(storedLinks.sidebar))destinations=storedLinks.destinations;
let sidebarLinks=storedLinks&&validLinks(storedLinks.destinations)&&validLinks(storedLinks.sidebar)?storedLinks.sidebar:sidebarDefaults;
destinations=destinations.map(d=>({...d,mode:destinationMode(d)}));
sidebarLinks=sidebarLinks.map(d=>({...d,mode:destinationMode(d)}));
let screenTrigger;
function showStation(){
  $('screen-frame').removeAttribute('src');
  $('embedded-screen').hidden=true;$('command-station').hidden=false;
  (screenTrigger?.isConnected?screenTrigger:$('command')).focus();screenTrigger=null;
}
function openScreen(url,label,trigger){
  const destination=safeURL(url);if(!destination)return;
  if(destination.origin===location.origin&&destination.pathname===location.pathname){showStation();return;}
  screenTrigger=trigger;
  $('screen-title').textContent=label;
  $('screen-external').href=destination.href;
  $('screen-frame').title=`${label} in the LCARS screen`;
  $('screen-frame').src=destination.href;
  $('command-station').hidden=true;$('embedded-screen').hidden=false;
  $('screen-title').focus();
}
$('screen-home').addEventListener('click',showStation);
$('navigation-home').addEventListener('click',e=>{e.preventDefault();showStation();$('command').focus();});
function prepareLink(link,d){
  link.href=d.url;
  if(destinationMode(d)==='screen'){
    link.addEventListener('click',e=>{
      if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
      e.preventDefault();openScreen(d.url,d.name,link);
    });
    link.setAttribute('aria-label',`${d.name}, opens in LCARS screen`);
  }else{link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',`${d.name}, opens in a new tab`);}
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
  $('sidebar-links').replaceChildren();
  sidebarLinks.forEach((d,i)=>{
    const link=document.createElement('a');link.className=['peach','blue','silver','earth'][i%4];
    prepareLink(link,d);link.textContent=`${String(i+2).padStart(2,'0')} / ${d.name}`;$('sidebar-links').append(link);
  });
  destinations.forEach((d,i)=>{
    const a=document.createElement('a');a.className='destination';prepareLink(a,d);
    a.style.setProperty('--tile',['#ffe1ca','#55a7ff','#828cad','#cc9966','#99ccff','#ffbb33'][i%6]);
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
function directAddress(q){
  if(/^https?:\/\//i.test(q)){const u=safeURL(q);if(u)return u.href;}
  if(!/\s/.test(q)&&/^(localhost(?::\d+)?|(?:[\w-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#].*)?$/i.test(q))return new URL((q.startsWith('localhost')?'http://':'https://')+q).href;
  return null;
}
function resolveCommand(q,engine){
  const address=directAddress(q);if(address)return address;
  return (engines[engine]||engines.google)+encodeURIComponent(q);
}
$('command-form').addEventListener('submit',e=>{
  e.preventDefault();const q=$('command').value.trim();if(!q)return;
  const address=directAddress(q);
  if(address){openScreen(address,new URL(address).hostname,$('command'));return;}
  const link=document.createElement('a');link.href=resolveCommand(q,$('engine').value);link.target='_blank';link.rel='noopener';link.click();
});
let editDrafts,editKind='destinations';
function captureDraft(){
  const data=new FormData($('edit-form'));
  editDrafts[editKind]=editDrafts[editKind].map((d,i)=>({name:String(data.get(`name-${i}`)??''),url:String(data.get(`url-${i}`)??''),mode:data.get(`mode-${i}`)==='screen'?'screen':'tab'}));
}
function renderEditor(){
  $('edit-rows').replaceChildren();$('edit-error').textContent='';
  $('edit-list').value=editKind;
  editDrafts[editKind].forEach((d,i)=>{
    const row=document.createElement('div');row.className='edit-row';
    for(const [key,label]of [['name',`${i+1} / LABEL`],['url','WEBSITE ADDRESS']]){
      const l=document.createElement('label');l.textContent=label;
      const input=document.createElement('input');input.name=`${key}-${i}`;input.value=d[key];input.required=true;input.maxLength=key==='name'?35:2048;input.type=key==='url'?'url':'text';l.append(input);row.append(l);
    }
    const displayLabel=document.createElement('label');displayLabel.textContent='OPEN IN';
    const display=document.createElement('select');display.name=`mode-${i}`;
    for(const [value,label]of [['tab','New tab'],['screen','LCARS screen']]){const option=document.createElement('option');option.value=value;option.textContent=label;display.append(option);}
    display.value=destinationMode(d);displayLabel.append(display);row.append(displayLabel);
    const actions=document.createElement('div');actions.className='edit-actions';
    for(const [action,label]of [['up','Up'],['down','Down'],['remove','Remove']]){
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.setAttribute('aria-label',`${label} link ${i+1}`);button.dataset.action=action;button.dataset.index=String(i);
      button.disabled=(action==='up'&&i===0)||(action==='down'&&i===editDrafts[editKind].length-1);
      actions.append(button);
    }
    row.append(actions);
    $('edit-rows').append(row);
  });
}
$('edit').addEventListener('click',()=>{
  editDrafts={destinations:destinations.map(d=>({...d})),sidebar:sidebarLinks.map(d=>({...d}))};
  editKind='destinations';renderEditor();$('editor').showModal();
});
$('edit-list').addEventListener('change',()=>{captureDraft();editKind=$('edit-list').value;renderEditor();});
$('add-link').addEventListener('click',()=>{
  captureDraft();editDrafts[editKind].push({name:'',url:'https://',mode:'tab'});renderEditor();
  $('edit-rows').lastElementChild.querySelector('input').focus();
});
$('edit-rows').addEventListener('click',e=>{
  const button=e.target.closest('button[data-action]');if(!button)return;
  captureDraft();const i=Number(button.dataset.index),list=editDrafts[editKind];
  if(button.dataset.action==='remove')list.splice(i,1);
  else{const target=i+(button.dataset.action==='up'?-1:1);if(target<0||target>=list.length)return;[list[i],list[target]]=[list[target],list[i]];}
  renderEditor();
});
$('close').addEventListener('click',()=>$('editor').close());
$('edit-form').addEventListener('submit',e=>{
  e.preventDefault();captureDraft();
  const next=Object.fromEntries(Object.entries(editDrafts).map(([kind,list])=>[kind,list.map(d=>({...d,name:d.name.trim(),url:d.url.trim()}))]));
  const invalid=['destinations','sidebar'].find(kind=>!validLinks(next[kind]));
  if(invalid){editKind=invalid;renderEditor();$('edit-error').textContent='ENTER A LABEL AND A VALID HTTP OR HTTPS ADDRESS FOR EVERY LINK.';return;}
  if(!write('voyager.links',next)){$('edit-error').textContent='THIS BROWSER COULD NOT SAVE YOUR LINKS. CHECK LOCAL STORAGE SETTINGS.';return;}
  destinations=next.destinations;sidebarLinks=next.sidebar;render();$('editor').close();
});
function clock(){const d=new Date();$('clock').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});$('clock').dateTime=d.toISOString();$('date').textContent=d.toLocaleDateString([],{year:'numeric',month:'short',day:'2-digit'}).toUpperCase();}
clock();let timer=setInterval(clock,30000);
document.addEventListener('visibilitychange',()=>{clearInterval(timer);if(!document.hidden){clock();timer=setInterval(clock,30000);}});
render();soundLabel();
