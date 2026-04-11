!function(){var _0x={
a:'\x53\x4f\x46\x54\x57\x4f\x52\x4b\x53',
b:'shield-verify',c:'license/validate',d:'license/heartbeat',e:'license/activate',
f:'Content-Type',g:'application/json',h:'X-Shield-Hash',i:'X-Shield-Token',
j:'X-Timestamp',k:'script',l:'MutationObserver',m:'debugger',
n:'License protection active',o:'License verification failed',
p:'Shield integrity compromised',q:'Connection to license server failed',
r:function(s){return atob(s)},
s:function(t){return btoa(t)}
};
var _k1='sw-sh-',_k2='-v3',_nx=Date.now,_mr=Math.random,_mf=Math.floor;
var _st=setTimeout,_si=setInterval,_ci=clearInterval;
var _cs=function(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return h>>>0;};
var _enc=function(d,k){var r='';for(var i=0;i<d.length;i++){r+=String.fromCharCode(d.charCodeAt(i)^k.charCodeAt(i%k.length));}return _0x.s(r);};
var _dec=function(d,k){var b=_0x.r(d);var r='';for(var i=0;i<b.length;i++){r+=String.fromCharCode(b.charCodeAt(i)^k.charCodeAt(i%k.length));}return r;};

var _fp=function(){
if(typeof window==='undefined')return'n-'+Date.now();
var n=window.navigator,s=window.screen;
var d=[n.userAgent,n.language,s.width,s.height,s.colorDepth,
new Date().getTimezoneOffset(),n.hardwareConcurrency||0,n.platform,
n.maxTouchPoints||0,n.deviceMemory||0].join('|');
return'sf-'+_cs(d).toString(36);
};

var _sRef=null,_hbT=null,_hbT2=null,_vT=null,_adbT=null;
var _state={v:false,a:false,t:0,f:0,lk:''};
var _cfg={k:'',u:'',d:'',hi:180000,cb:null,cbf:null};

var _selfHash=null;
var _computeHash=function(){
try{
var scripts=document.getElementsByTagName('script');
for(var i=0;i<scripts.length;i++){
var src=scripts[i].src||'';
if(src.indexOf('softworks-shield')!==-1||src.indexOf('sw-shield')!==-1){
_sRef=scripts[i];
break;
}
}
if(!_sRef){
var all=document.querySelectorAll('script[src]');
for(var j=0;j<all.length;j++){
if(all[j].src.indexOf('shield')!==-1){_sRef=all[j];break;}
}
}
}catch(e){}
};

var _req=function(ep,data,cb){
var url=_cfg.u.replace(/\/$/,'')+'/api/'+ep;
var body=JSON.stringify(data);
var ts=_nx().toString();
var tk=_cs(body+ts+(_cfg.k||'')).toString(36);
try{
var x=new XMLHttpRequest();
x.open('POST',url,true);
x.setRequestHeader(_0x.f,_0x.g);
x.setRequestHeader(_0x.j,ts);
x.setRequestHeader(_0x.i,tk);
x.setRequestHeader('X-SDK-Version','3.0.0-shield');
x.timeout=15000;
x.onreadystatechange=function(){
if(x.readyState===4){
try{var r=JSON.parse(x.responseText);cb(null,r);}
catch(e){cb(e,null);}
}
};
x.onerror=function(){cb(new Error(_0x.q),null);};
x.ontimeout=function(){cb(new Error('Timeout'),null);};
x.send(body);
}catch(e){
try{
fetch(url,{
method:'POST',
headers:{[_0x.f]:_0x.g,[_0x.j]:ts,[_0x.i]:tk,'X-SDK-Version':'3.0.0-shield'},
body:body
}).then(function(r){return r.json();}).then(function(r){cb(null,r);}).catch(function(e2){cb(e2,null);});
}catch(e3){cb(e3,null);}
}
};

var _shutdown=function(reason){
_state.v=false;_state.f++;
if(_hbT){_ci(_hbT);_hbT=null;}
if(_hbT2){_ci(_hbT2);_hbT2=null;}
if(_vT){_ci(_vT);_vT=null;}
if(_cfg.cbf)_cfg.cbf(reason||_0x.o);
try{
var b=document.body;
if(b){
b.style.opacity='0';
b.style.pointerEvents='none';
b.style.userSelect='none';
b.style.transition='opacity 0.5s';
_st(function(){
b.innerHTML='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;z-index:999999;"><div style="text-align:center;color:#ff3333;font-family:monospace;"><h1 style="font-size:24px;margin-bottom:10px;">&#x26A0; Access Denied</h1><p style="color:#888;font-size:14px;">License verification failed.<br>Contact: support@softworks.dev</p></div></div>';
b.style.opacity='1';
},600);
}
}catch(e){}
};

var _antiDebug=function(){
var threshold=100;
var check=function(){
var s=_nx();
(function(){}).constructor('debugger')();
var e=_nx();
if(e-s>threshold){
_state.f++;
if(_state.f>2){
_shutdown('Debug environment detected');
}
}
};
_adbT=_si(function(){
try{check();}catch(e){}
},3000+_mf(_mr()*2000));

var devtools={open:false};
var el=new Image();
Object.defineProperty(el,'id',{get:function(){devtools.open=true;}});
_si(function(){
devtools.open=false;
console.log('%c',el);
if(devtools.open){
_state.f++;
if(_state.f>3){_shutdown('Unauthorized inspection detected');}
}
},4000+_mf(_mr()*3000));
};

var _watchDOM=function(){
if(typeof MutationObserver==='undefined')return;
var observer=new MutationObserver(function(mutations){
for(var i=0;i<mutations.length;i++){
var removed=mutations[i].removedNodes;
for(var j=0;j<removed.length;j++){
var node=removed[j];
if(node===_sRef||(node.tagName==='SCRIPT'&&node.src&&node.src.indexOf('shield')!==-1)){
_st(function(){_reinstall();},50);
return;
}
}
}
});
observer.observe(document.documentElement,{childList:true,subtree:true});
};

var _reinstall=function(){
try{
var s=document.createElement('script');
s.src=_sRef?_sRef.src:(_cfg.u+'/sdk/softworks-shield.js');
s.async=true;
s.onload=function(){
if(typeof window.__swShieldBoot==='function')window.__swShieldBoot(_cfg);
};
(document.head||document.documentElement).appendChild(s);
_sRef=s;
}catch(e){
_shutdown('Script protection triggered');
}
};

var _validate=function(){
_req(_0x.c,{
license_key:_cfg.k,domain:_cfg.d,hardware_id:_fp()
},function(err,res){
if(err||!res){
_state.f++;
if(_state.f>2)_shutdown(_0x.q);
return;
}
var d=res.data||res;
if(d.valid){
_state.v=true;_state.f=0;_state.t=_nx();
if(_cfg.cb)_cfg.cb(d);
}else{
_shutdown(d.error||_0x.o);
}
});
};

var _heartbeat=function(){
_req(_0x.d,{
license_key:_cfg.k,domain:_cfg.d,hardware_id:_fp()
},function(err,res){
if(err||!res){_state.f++;if(_state.f>3)_shutdown(_0x.q);return;}
if(!res.success||res.active===false){_shutdown('License revoked by administrator');}
else{_state.f=0;_state.t=_nx();}
});
};

var _shieldVerify=function(){
_req(_0x.b,{
license_key:_cfg.k,domain:_cfg.d,hardware_id:_fp(),
sdk_version:'3.0.0-shield',
shield_token:_cs(_cfg.k+_cfg.d+_nx().toString().slice(0,10)).toString(36)
},function(err,res){
if(err)return;
if(res&&res.tampered){_shutdown(_0x.p);}
});
};

var _activate=function(){
_req(_0x.e,{
license_key:_cfg.k,domain:_cfg.d,hardware_id:_fp(),
user_agent:(typeof navigator!=='undefined')?navigator.userAgent:'Shield/3.0',
fingerprint:_fp(),sdk_version:'3.0.0-shield'
},function(err,res){
if(err||!res){_state.f++;if(_state.f>2)_shutdown(_0x.q);return;}
if(res.success){
_state.a=true;_state.v=true;_state.f=0;_state.t=_nx();
if(_cfg.cb)_cfg.cb(res.data||res);
_startProtection();
}else{
_shutdown(res.error||'Activation failed');
}
});
};

var _startProtection=function(){
_hbT=_si(function(){_heartbeat();},_cfg.hi+_mf(_mr()*30000));
_hbT2=_si(function(){_heartbeat();},_cfg.hi*2.5+_mf(_mr()*60000));
_vT=_si(function(){_validate();},_cfg.hi*3+_mf(_mr()*120000));
_si(function(){_shieldVerify();},_cfg.hi*5+_mf(_mr()*300000));
try{_antiDebug();}catch(e){}
_watchDOM();
_st(function(){_validate();},5000+_mf(_mr()*5000));
};

var _boot=function(config){
if(!config||!config.k&&!config.licenseKey){return;}
_cfg.k=config.k||config.licenseKey||'';
_cfg.u=config.u||config.serverUrl||'';
_cfg.d=config.d||config.domain||(typeof window!=='undefined'?window.location.hostname:'');
_cfg.hi=config.hi||config.heartbeatInterval||180000;
_cfg.cb=config.cb||config.onValid||null;
_cfg.cbf=config.cbf||config.onInvalid||null;
_state={v:false,a:false,t:0,f:0,lk:_cfg.k};
_computeHash();
_activate();
};

window.__swShieldBoot=_boot;

var _autoInit=function(){
var scripts=document.querySelectorAll('script[data-license-key]');
for(var i=0;i<scripts.length;i++){
var s=scripts[i];
var k=s.getAttribute('data-license-key');
var u=s.getAttribute('data-server-url');
if(k&&u){
_boot({k:k,u:u,d:window.location.hostname});
return;
}
}
};

if(typeof document!=='undefined'){
if(document.readyState==='loading'){
document.addEventListener('DOMContentLoaded',_autoInit);
}else{
_st(_autoInit,0);
}
}

var _pub={
init:function(o){_boot(o);},
status:function(){return{valid:_state.v,activated:_state.a};},
destroy:function(){_shutdown('Manual shutdown');}
};

Object.defineProperty(window,'SoftworksShield',{
value:Object.freeze(_pub),
writable:false,configurable:false,enumerable:false
});
Object.defineProperty(window,'__swShield__',{
value:true,writable:false,configurable:false,enumerable:false
});
}();
