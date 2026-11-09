(function(){
"use strict";

/* ================= Konstanten ================= */
var MAXD = 24, ND = 22; /* MAXD: Speicherplätze je Saison, ND: Fahrer im Feld der aktuellen Saison */
var SPRINT_F2 = [0,10,8,6,5,4,3,2,1];
var SPRINT_F1 = [0,8,7,6,5,4,3,2,1];
var RACE_PTS  = [0,25,18,15,12,10,8,6,4,2,1];
var DNF = "DNF";
var SESSLBL = {q:"Qualifying", sq:"Sprint-Quali", s:"Sprint", r:"Rennen"};
var SESSSHORT = {q:"Quali", sq:"Sprint-Q", s:"Sprint", r:"Rennen"};
var MODES = {
  f1:{name:"F1", qualy:0, fl:false, sprint:SPRINT_F1,
      desc:"Keine Punkte fürs Qualifying und keine für die schnellste Runde. Sprint: 8 bis 1 Punkt für P1 bis P8."},
  f2:{name:"F2", qualy:2, fl:true, sprint:SPRINT_F2,
      desc:"2 Punkte für die Pole, je 1 Punkt für die schnellste Runde in Sprint und Rennen (nur in den Top 10). Sprint: 10, 8, 6, 5, 4, 3, 2, 1."}
};
var DEF_RACES = [
  ["🇦🇺","Melbourne"],["🇸🇦","Saudi-Arabien"],["🇨🇦","Montreal"],
  ["🇪🇸","Barcelona"],["🇬🇧","Silverstone"],["🇦🇹","Spielberg"],
  ["🇧🇪","Spa"],["🇮🇹","Monza"],["🇳🇱","Zandvoort"],
  ["🇦🇿","Baku"],["🇲🇽","Mexiko"],["🇺🇸","Las Vegas"],
  ["🇧🇷","São Paulo"]
];
var TEAM_COLORS = ["#E8002D","#0090FF","#FF8700","#00D7B6","#8E44E8","#12A45C","#F0C300","#FF5FA2","#5A7DFF","#B5121B","#00B3C8"];

/* ================= Kleine Helfer ================= */
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
function uid(p){ return p+Date.now().toString(36)+Math.floor(Math.random()*1e8).toString(36); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function num(v){ return typeof v==="number" ? v : 0; }
function isNum(v){ return typeof v==="number"; }
function plural(n, one, many){ return n+" "+(n===1 ? one : many); }
function fmt1(v){ return v==null ? "–" : v.toFixed(1).replace(".", ","); }
function signed(v){ return v==null ? "–" : (v>0 ? "+"+v : (v<0 ? "−"+(-v) : "0")); }
function nulls(){ var a=[], i; for(i=0;i<MAXD;i++) a.push(null); return a; }
function hexc(c, fb){ return (typeof c==="string" && /^#[0-9a-fA-F]{6}$/.test(c)) ? c : fb; }
function natCmp(a,b){ try{ return String(a).localeCompare(String(b), "de", {numeric:true, sensitivity:"base"}); }catch(e){ return a<b?-1:(a>b?1:0); } }
function ico(p, size, sw){
  size = size || 20;
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(sw||2)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
}
var APP_MARK='<svg viewBox="0 0 108 108" aria-hidden="true"><rect width="108" height="108" rx="26" fill="#14161D"/><g transform="translate(54 54) scale(.95) translate(-50 -54.5)">'+
  '<defs><pattern id="chk" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#F2F3F7"/><rect width="5" height="5" fill="#14161D"/><rect x="5" y="5" width="5" height="5" fill="#14161D"/></pattern></defs>'+
  '<path d="M46 31c8-5 16 3 24-1s10-3 12-2v25c-4-1-6 0-12 2s-16-4-24 1z" fill="url(#chk)" stroke="#F2F3F7" stroke-width="2" stroke-linejoin="round"/>'+
  '<path d="M46 29v51" stroke="#F2F3F7" stroke-width="4.5" stroke-linecap="round"/>'+
  '<path d="M22 42h16M17 51h21M24 60h14" stroke="#FF5A36" stroke-width="4.5" stroke-linecap="round"/></g></svg>';
var IC = {
  standings:'<path d="M4 20v-7h5v7M9 20V5h6v15M15 20v-5h5v5"/>',
  race:'<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>',
  stats:'<path d="M3 20h18M6 16v-4M11 16V6M16 16v-7M21 16v-2"/>',
  pred:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  teams:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  set:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  pen:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',
  left:'<path d="M15 18l-6-6 6-6"/>',
  right:'<path d="M9 18l6-6-6-6"/>',
  up:'<path d="M18 15l-6-6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  cup:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>',
  download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload:'<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  check:'<path d="M5 12l5 5 9-10"/>',
  sync:'<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>',
  gauge:'<path d="M12 14l4-4M3.5 17a9 9 0 1 1 17 0"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'
};

/* ================= Datenmodell (kompatibel zur alten HTML-Datei) ================= */
function blankSession(){ return {q:nulls(), sq:nulls(), s:nulls(), r:nulls(), fls:null, flr:null, notes:"", wx:{}, memo:blankMemo()}; }
function blankMemo(){ return {sq:"", s:"", q:"", r:"", drv:[], tyres:[]}; }
var TYRES=[["S","Soft","#E8002D"],["M","Medium","#F2C200"],["H","Hard","#E9E9EC"],["I","Intermediate","#2FB14C"],["W","Regen","#2E7CF6"]];
function intOrNull(v, lo, hi){ v=parseInt(v,10); return (isFinite(v) && v>=lo && v<=hi) ? v : null; }
function normMemo(m){
  var o=blankMemo(); if(!m || typeof m!=="object") return o;
  ["sq","s","q","r"].forEach(function(k){ if(typeof m[k]==="string") o[k]=m[k].slice(0,4000); });
  if(Array.isArray(m.drv)) o.drv=m.drv.slice(0,60).map(function(x){ return {d:intOrNull(x && x.d,0,MAXD-1), text:(x && typeof x.text==="string") ? x.text.slice(0,2000) : ""}; });
  if(Array.isArray(m.tyres)) o.tyres=m.tyres.slice(0,120).map(function(x){ x=x||{};
    return {d:intOrNull(x.d,0,MAXD-1), sess:["sq","s","q","r"].indexOf(x.sess)>=0 ? x.sess : "r", c:TYRES.some(function(t){ return t[0]===x.c; }) ? x.c : "M",
      laps:intOrNull(x.laps,0,999), pit:intOrNull(x.pit,0,999), wear:intOrNull(x.wear,0,100)}; });
  return o;
}
var WX=[
  ["sun","Sonnig",'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'],
  ["mixed","Wechselhaft",'<path d="M8 3.5v1.5M3.5 8H5M4.8 4.8l1 1M12 6.5a4 4 0 0 0-6.6 4"/><path d="M9 20h8.5a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.4A2.8 2.8 0 0 0 9 20z"/>'],
  ["cloud","Bewölkt",'<path d="M7 19h10.5a4 4 0 0 0 0-8 6 6 0 0 0-11.6 1.6A3.2 3.2 0 0 0 7 19z"/>'],
  ["rain","Regen",'<path d="M7 15h10.5a4 4 0 0 0 0-8 6 6 0 0 0-11.6 1.6A3.2 3.2 0 0 0 7 15z"/><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/>'],
  ["storm","Starkregen",'<path d="M7 14h10.5a4 4 0 0 0 0-8 6 6 0 0 0-11.6 1.6A3.2 3.2 0 0 0 7 14z"/><path d="M8 17l-1.5 3.5M12 17l-1.5 3.5M16 17l-1.5 3.5M13 14l-2 3h3l-2 3"/>']
];
function wxDef(k){ for(var i=0;i<WX.length;i++) if(WX[i][0]===k) return WX[i]; return null; }
var PH=[["a","Anfang"],["m","Mitte"],["e","Ende"]];
/* Wetter je Session: {a:Anfang, m:Mitte, e:Ende}; alter Einzelwert gilt für alle drei */
function normWx(v){
  if(typeof v==="string") return wxDef(v) ? {a:v, m:v, e:v} : null;
  if(!v || typeof v!=="object") return null;
  var o={}, any=false;
  PH.forEach(function(p){ if(wxDef(v[p[0]])){ o[p[0]]=v[p[0]]; any=true; } });
  return any ? o : null;
}
function wxIcon(k, size){ var w=wxDef(k); return w ? '<span class="wx wx-'+k+'" title="'+w[1]+'">'+ico(w[2], size||16, 2)+'</span>' : ''; }
function cleanVal(v){
  if(v===DNF) return DNF;
  if(typeof v==="number" && v>=1 && v<=MAXD) return v;
  if(typeof v==="string" && /^\d+$/.test(v)){ var n=parseInt(v,10); if(n>=1 && n<=MAXD) return n; }
  return null;
}
function cleanLogo(s){
  return (typeof s==="string" && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(s) && s.length<700000) ? s : "";
}
function normTeam(t, k){
  t = t || {};
  return {name:(typeof t.name==="string" && t.name.trim()) ? t.name : ("Team "+(k+1)),
          color:hexc(t.color, TEAM_COLORS[k%TEAM_COLORS.length]),
          short:(typeof t.short==="string") ? t.short.trim().slice(0,4) : "",
          logo:cleanLogo(t.logo)};
}
function normNd(n){ n=parseInt(n,10); return (n>=10 && n<=MAXD) ? n : 22; }
function freshSeason(name, drivers, teams, dTeam, races, sprints, mode, nd){
  var i, d=[], t=[], dt=[], rs=[], res={}, sp={};
  if(drivers) d = drivers.map(function(x){ return {name:x.name, num:x.num}; });
  for(i=d.length;i<MAXD;i++) d.push({name:"Fahrer "+(i+1), num:String(i+1)});
  if(teams) t = teams.map(function(x,k){ return normTeam(x,k); });
  else for(i=0;i<11;i++) t.push(normTeam({name:"Team "+(i+1)}, i));
  if(dTeam) dt = dTeam.slice();
  for(i=dt.length;i<MAXD;i++) dt.push(Math.min(Math.floor(i/2), t.length-1));
  if(races){
    rs = races.map(function(x){ return {id:x.id, flag:x.flag, name:x.name}; });
    for(i=0;i<rs.length;i++){ res[rs[i].id]=blankSession(); sp[rs[i].id] = sprints ? !!sprints[rs[i].id] : false; }
  } else {
    for(i=0;i<DEF_RACES.length;i++){
      var id="r"+(i+1);
      rs.push({id:id, flag:DEF_RACES[i][0], name:DEF_RACES[i][1]});
      res[id]=blankSession(); sp[id]=false;
    }
  }
  var maxN=0;
  rs.forEach(function(r){ var m=/^r(\d+)$/.exec(r.id); if(m && +m[1]>maxN) maxN=+m[1]; });
  return {id:uid("s"), name:name||"Saison 1", mode:mode==="f1" ? "f1" : "f2", nd:normNd(nd), spare:[],
          drivers:d, teams:t, dTeam:dt, races:rs, sprints:sp, res:res, power:{}, nextId:maxN+1};
}
var FLAGRE = /^\s*((?:[\u{1F1E6}-\u{1F1FF}]{2})|(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}][\u{FE0F}\u{200D}]?)+)\s*/u;
function splitFlag(s){
  s = String(s||"");
  var m = FLAGRE.exec(s);
  if(m) return {flag:m[1], name:s.slice(m[0].length).trim() || s.trim()};
  return {flag:"", name:s.trim()};
}
function normSeason(x, idx){
  var out = freshSeason("Saison "+(idx+1)), i, j;
  if(!x || typeof x!=="object") return out;
  if(typeof x.id==="string" && x.id) out.id=x.id;
  if(typeof x.name==="string" && x.name.trim()) out.name=x.name;
  else if(typeof x.season==="string" && x.season.trim()) out.name=x.season;
  out.mode = x.mode==="f1" ? "f1" : "f2";
  out.nd = normNd(x.nd);
  if(Array.isArray(x.drivers)) for(i=0;i<MAXD;i++){
    var dv = x.drivers[i];
    if(typeof dv==="string") out.drivers[i]={name:dv, num:String(i+1)};
    else if(dv && typeof dv==="object"){
      out.drivers[i]={name:typeof dv.name==="string" ? dv.name : ("Fahrer "+(i+1)),
                      num:(dv.num===undefined || dv.num===null) ? "" : String(dv.num)};
    }
  }
  if(Array.isArray(x.teams) && x.teams.length) out.teams = x.teams.map(normTeam);
  for(i=0;i<MAXD;i++){
    var v = Array.isArray(x.dTeam) ? x.dTeam[i] : undefined;
    out.dTeam[i] = (typeof v==="number" && v>=0 && v<out.teams.length) ? v : Math.min(Math.floor(i/2), out.teams.length-1);
  }
  if(Array.isArray(x.races) && x.races.length){
    out.races=[]; out.res={}; out.sprints={};
    var used={}, maxN=0;
    for(i=0;i<x.races.length;i++){
      var R=x.races[i];
      var id=(R && typeof R.id==="string" && R.id) ? R.id : ("r"+(i+1));
      if(used[id]) id=id+"_"+i;
      used[id]=true;
      var fl, nm;
      if(R && typeof R.flag==="string"){ fl=R.flag; nm=typeof R.name==="string" ? R.name : ("Rennen "+(i+1)); }
      else { var sp2=splitFlag(R && R.name); fl=sp2.flag; nm=sp2.name || ("Rennen "+(i+1)); }
      out.races.push({id:id, flag:fl, name:nm});
      out.res[id]=blankSession();
      out.sprints[id] = !!(x.sprints && x.sprints[id]);
      var m=/^r(\d+)$/.exec(id); if(m && +m[1]>maxN) maxN=+m[1];
    }
    out.nextId=Math.max(maxN+1, typeof x.nextId==="number" ? x.nextId : 0);
  }
  out.spare=[];
  if(Array.isArray(x.spare)) x.spare.forEach(function(R,i){
    if(!R || typeof R!=="object") return;
    var id=(typeof R.id==="string" && R.id && !out.res[R.id]) ? R.id : ("r"+(out.nextId++));
    out.spare.push({id:id, flag:typeof R.flag==="string" ? R.flag : "", name:typeof R.name==="string" ? R.name : "Strecke"});
    out.res[id]=blankSession(); out.sprints[id]=!!(x.sprints && x.sprints[id]);
    var m2=/^r(\d+)$/.exec(id); if(m2 && +m2[1]>=out.nextId) out.nextId=+m2[1]+1;
  });
  var allR=out.races.concat(out.spare);
  if(x.res) for(i=0;i<allR.length;i++){
    var rid=allR[i].id, src=x.res[rid];
    if(!src) continue;
    ["q","sq","s","r"].forEach(function(k){
      if(Array.isArray(src[k])) for(j=0;j<MAXD;j++) out.res[rid][k][j]=cleanVal(src[k][j]);
    });
    if(src.wx && typeof src.wx==="object") ["q","sq","s","r"].forEach(function(k){ var w=normWx(src.wx[k]); if(w) out.res[rid].wx[k]=w; });
    if(typeof src.notes==="string") out.res[rid].notes=src.notes.slice(0,4000);
    else if(typeof src.note==="string") out.res[rid].notes=src.note.slice(0,4000);
    out.res[rid].memo=normMemo(src.memo);
    if(typeof src.fls==="number" && src.fls>=0 && src.fls<MAXD) out.res[rid].fls=src.fls;
    if(typeof src.flr==="number" && src.flr>=0 && src.flr<MAXD) out.res[rid].flr=src.flr;
  }
  out.power={};
  if(x.power && typeof x.power==="object") allR.forEach(function(R){
    var a=x.power[R.id];
    if(Array.isArray(a)) out.power[R.id]=out.teams.map(function(_,k){
      var v=a[k]; return (typeof v==="number" && isFinite(v)) ? clamp(Math.round(v),0,100) : null;
    });
  });
  return out;
}
function normSeasons(x){
  if(!x || typeof x!=="object") return {seasons:[freshSeason("Saison 1")], cur:null};
  var seasons = (Array.isArray(x.seasons) && x.seasons.length) ? x.seasons.map(normSeason) : [normSeason(x,0)];
  var ids={};
  seasons.forEach(function(s,i){ if(ids[s.id]) s.id=s.id+"_"+i; ids[s.id]=true; });
  var cur = (typeof x.cur==="string" && ids[x.cur]) ? x.cur : seasons[seasons.length-1].id;
  return {seasons:seasons, cur:cur};
}
function normSave(x, i){
  var o=normSeasons(x||{});
  var nm=(x && typeof x.name==="string" && x.name.trim() && Array.isArray(x.seasons)) ? x.name : ("Spielstand "+((i||0)+1));
  return {id:(x && typeof x.id==="string" && /^g/.test(x.id)) ? x.id : uid("g"), name:nm, seasons:o.seasons, cur:o.cur};
}
function defPrefs(){ return {theme:"system", motion:true, predW:0.5, predUse:{}}; }
function normPrefs(p){
  var d=defPrefs(), k;
  if(!p || typeof p!=="object") return d;
  if(p.theme==="dark" || p.theme==="light" || p.theme==="system") d.theme=p.theme;
  if(typeof p.motion==="boolean") d.motion=p.motion;
  if(typeof p.predW==="number" && isFinite(p.predW)) d.predW=clamp(p.predW,0,1);
  if(p.predUse && typeof p.predUse==="object") for(k in p.predUse) if(typeof p.predUse[k]==="boolean") d.predUse[k]=p.predUse[k];
  return d;
}
function normApp(x){
  var a={v:6, app:"f1-manager", saves:[], curSave:null, prefs:defPrefs(), updatedAt:0};
  if(!x || typeof x!=="object") return a;
  if(Array.isArray(x.saves)) a.saves=x.saves.map(normSave);
  var ids={};
  a.saves.forEach(function(s){ if(ids[s.id]) s.id=uid("g"); ids[s.id]=true; });
  a.curSave=(typeof x.curSave==="string" && ids[x.curSave]) ? x.curSave : null;
  a.prefs=normPrefs(x.prefs);
  a.updatedAt=(typeof x.updatedAt==="number") ? x.updatedAt : 0;
  return a;
}

/* ================= Zustand ================= */
var APP = normApp(null), SV = null, S = null;
var ui = {view:"standings", wMode:"d", gMode:"r", race:null, sess:"r", statKey:"pts", statScope:"season", hidden:{}, entryOpen:false};
var N = window.F1N || null, NATIVE = !!(N && N.native);

function findSave(id){ for(var i=0;i<APP.saves.length;i++) if(APP.saves[i].id===id) return APP.saves[i]; return null; }
function findSeason(sv, id){ for(var i=0;i<sv.seasons.length;i++) if(sv.seasons[i].id===id) return sv.seasons[i]; return null; }
function lastSeason(sv){ return sv.seasons[sv.seasons.length-1]; }
function pickCurrent(){
  SV = findSave(APP.curSave) || APP.saves[APP.saves.length-1] || null;
  if(SV){
    APP.curSave = SV.id;
    if(!SV.seasons.length) SV.seasons.push(freshSeason("Saison 1"));
    setS(findSeason(SV, SV.cur) || lastSeason(SV));
    SV.cur = S.id;
  } else setS(null);
}
function setS(se){ S=se; ND = se ? normNd(se.nd) : 22; }
function withSeason(season, fn){ var keep=S; setS(season); try{ return fn(); } finally{ setS(keep); } }
function uniqueName(base){
  var taken={}, n=2, nm=base;
  APP.saves.forEach(function(s){ taken[s.name]=true; });
  while(taken[nm]) nm=base+" "+(n++);
  return nm;
}

/* ================= Speichern ================= */
var KEY="f1-manager-v1", KEY_BAK="f1-manager-v1-bak";
var OLD_V5=["f1-karriere-v5","f1-karriere-v5-bak"], OLD_V1=["f1-karriere-v1","f1-karriere-v1-bak"];
var saveT=null, lastSaved=null, storageOk=true;

var prefT=null, prefBlob=null;
function savePrefs(){ clearTimeout(prefT); if(!NATIVE || prefBlob===null) return; var b=prefBlob; prefBlob=null;
  N.Preferences.set({key:KEY, value:b}).then(function(){ if(!storageOk){ storageOk=true; lastSaved=new Date(); showBanner(); } }).catch(function(){}); }
function saveLocal(){
  clearTimeout(saveT);
  var blob;
  try{ blob=JSON.stringify(APP); }catch(e){ return; }
  try{
    localStorage.setItem(KEY, blob);
    localStorage.setItem(KEY_BAK, blob);
    lastSaved=new Date(); storageOk=true;
  }catch(e){ storageOk=false; }
  // Die Kopie in den Android-Einstellungen ist nur die Rückfallebene: selten schreiben, beim Verlassen sofort
  if(NATIVE){ prefBlob=blob; clearTimeout(prefT); prefT=setTimeout(savePrefs, 8000); }
  showBanner();
}
function flush(){ clearTimeout(saveT); saveLocal(); savePrefs(); }
function touch(){
  APP.updatedAt=Date.now();
  clearTimeout(saveT); saveT=setTimeout(saveLocal, (SH && SH.type==="entry") ? 1200 : 400);
  updateHeader();
}
function loadApp(){
  var i, raw;
  var keys=[KEY, KEY_BAK].concat(OLD_V5);
  for(i=0;i<keys.length;i++){
    try{ raw=localStorage.getItem(keys[i]); if(raw) return normApp(JSON.parse(raw)); }catch(e){}
  }
  for(i=0;i<OLD_V1.length;i++){
    try{
      raw=localStorage.getItem(OLD_V1[i]);
      if(raw){
        var o=normSeasons(JSON.parse(raw)), app=normApp(null);
        app.saves.push({id:uid("g"), name:"Spielstand 1", seasons:o.seasons, cur:o.cur});
        return app;
      }
    }catch(e){}
  }
  return normApp(null);
}
function showBanner(){
  var b=$("banner");
  if(!b) return;
  b.innerHTML = storageOk ? "" :
    '<div class="banner">Dieses Gerät speichert gerade nichts dauerhaft. Sichere deine Daten unter Einstellungen → Daten & Sync als Datei oder Text.</div>';
}
function stamp(d){ return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2); }

/* Import: versteht diese App, die alte Datei (Spielstände) und die ganz alte Version (eine Saison) */
function parseImport(txt){
  var obj=JSON.parse(String(txt||"").trim());
  if(obj && Array.isArray(obj.saves)){
    var list=obj.saves.map(normSave);
    if(!list.length) throw new Error("leer");
    return {saves:list, cur:typeof obj.curSave==="string" ? obj.curSave : null};
  }
  if(obj && typeof obj==="object" && (Array.isArray(obj.seasons) || Array.isArray(obj.drivers) || Array.isArray(obj.races))){
    var o=normSeasons(obj);
    return {saves:[{id:uid("g"), name:uniqueName(typeof obj.name==="string" && obj.name.trim() ? obj.name : "Importierter Spielstand"), seasons:o.seasons, cur:o.cur}], cur:null};
  }
  throw new Error("unbekanntes Format");
}
function importAdd(txt){
  var p=parseImport(txt);
  p.saves.forEach(function(s){
    if(findSave(s.id)){ s.id=uid("g"); s.name=uniqueName(s.name+" (Import)"); }
    APP.saves.push(s);
  });
  APP.curSave=p.saves[p.saves.length-1].id;
  APP.updatedAt=Date.now(); flush(); pickCurrent();
  return p.saves.length;
}
function importReplace(txt){
  var p=parseImport(txt);
  APP.saves=p.saves;
  APP.curSave=(p.cur && findSave(p.cur)) ? p.cur : p.saves[p.saves.length-1].id;
  APP.updatedAt=Date.now(); flush(); pickCurrent();
  return p.saves.length;
}

/* ================= Rechnen ================= */
function cfg(){ return MODES[(S && S.mode)==="f1" ? "f1" : "f2"]; }
function dname(d){ return S.drivers[d].name; }
function dnum(d){ return S.drivers[d].num; }
function teamOfD(d){ return S.teams[S.dTeam[d]] || null; }
function teamColor(d){ var t=teamOfD(d); return t ? t.color : "#888888"; }
function raceLabel(R){ return ((R.flag ? R.flag+" " : "")+R.name).trim(); }
var CODEMAP={"melbourne":"MEL","australien":"AUS","saudi arabien":"SAU","jeddah":"JED","dschidda":"JED","montreal":"MTL","kanada":"CAN",
  "barcelona":"BCN","spanien":"ESP","madrid":"MAD","silverstone":"SIL","grossbritannien":"GBR","spielberg":"SPI","osterreich":"AUT","oesterreich":"AUT",
  "spa":"SPA","belgien":"BEL","monza":"MNZ","italien":"ITA","imola":"IMO","zandvoort":"ZAN","niederlande":"NED","baku":"BAK","aserbaidschan":"AZE",
  "mexiko":"MEX","mexico":"MEX","las vegas":"LVS","sao paulo":"SAO","interlagos":"INT","brasilien":"BRA","monaco":"MON","miami":"MIA","bahrain":"BHR",
  "sakhir":"BHR","suzuka":"SUZ","japan":"JPN","shanghai":"SHA","china":"CHN","singapur":"SIN","singapore":"SIN","austin":"COT","usa":"USA","katar":"QAT",
  "qatar":"QAT","lusail":"LUS","abu dhabi":"ABU","yas marina":"YAS","budapest":"BUD","ungarn":"HUN","hungaroring":"HUN","portimao":"POR","istanbul":"IST",
  "paul ricard":"PRC","hockenheim":"HOC","nurburgring":"NUR","nuerburgring":"NUR","sotschi":"SOC"};
function baseCode(R){
  var n=normName(R.name);
  if(CODEMAP[n]) return CODEMAP[n];
  var s=n.replace(/[^a-z]/g,"");
  return (s.slice(0,3) || "GP").toUpperCase();
}
function raceCode(R){
  var b=baseCode(R), idx=S ? raceIndex(R.id) : -1, n=1;
  for(var i=0;i<idx;i++) if(baseCode(S.races[i])===b) n++;
  return n>1 ? b+n : b;
}
function anyRace(id){ var i=raceIndex(id); if(i>=0) return S.races[i]; var sp=S.spare||[]; for(var j=0;j<sp.length;j++) if(sp[j].id===id) return sp[j]; return null; }
function raceIndex(id){ for(var i=0;i<S.races.length;i++) if(S.races[i].id===id) return i; return -1; }
function sessionsOf(id){ return S.sprints[id] ? ["sq","s","q","r"] : ["q","r"]; }
function weekendPts(id, d){
  var c=cfg(), R=S.res[id], hs=S.sprints[id], o={q:0, s:0, fls:0, r:0, flr:0, t:0};
  if(R.q[d]===1) o.q=c.qualy;
  if(hs){
    var s=num(R.s[d]);
    if(s && s<=8) o.s=c.sprint[s];
    if(c.fl && R.fls===d && s && s<=10) o.fls=1;
  }
  var r=num(R.r[d]);
  if(r && r<=10) o.r=RACE_PTS[r];
  if(c.fl && R.flr===d && r && r<=10) o.flr=1;
  o.t=o.q+o.s+o.fls+o.r+o.flr;
  return o;
}
function gainAt(id, d){
  var R=S.res[id], g=0, has=false, q=R.q[d], r=R.r[d];
  if(isNum(q) && isNum(r)){ g+=q-r; has=true; }
  if(S.sprints[id]){
    var sg=isNum(R.sq[d]) ? R.sq[d] : (isNum(q) ? q : null), sr=R.s[d];
    if(isNum(sg) && isNum(sr)){ g+=sg-sr; has=true; }
  }
  return has ? g : null;
}
function gainTotal(d){
  var t=0, any=false;
  for(var i=0;i<S.races.length;i++){ var g=gainAt(S.races[i].id, d); if(g!==null){ t+=g; any=true; } }
  return any ? t : null;
}
function cmp(a,b){
  if(b.pts!==a.pts) return b.pts-a.pts;
  for(var p=1;p<=ND;p++) if(b.rc[p]!==a.rc[p]) return b.rc[p]-a.rc[p];
  for(var q=1;q<=ND;q++) if(b.sc[q]!==a.sc[q]) return b.sc[q]-a.sc[q];
  var ka=(a.d!==undefined ? a.d : a.t), kb=(b.d!==undefined ? b.d : b.t);
  return ka-kb;
}
function standings(){
  var rows=[], d, i;
  for(d=0; d<ND; d++){
    var pts=0, rc=new Array(ND+1).fill(0), sc=new Array(ND+1).fill(0);
    for(i=0;i<S.races.length;i++){
      var id=S.races[i].id, R=S.res[id];
      pts+=weekendPts(id,d).t;
      var rp=num(R.r[d]); if(rp) rc[rp]++;
      if(S.sprints[id]){ var sp=num(R.s[d]); if(sp) sc[sp]++; }
    }
    rows.push({d:d, pts:pts, rc:rc, sc:sc});
  }
  rows.sort(cmp);
  return rows;
}
function teamStandings(){
  var st=standings(), byD={}, i;
  for(i=0;i<st.length;i++) byD[st[i].d]=st[i];
  var rows=S.teams.map(function(t,k){
    var r={t:k, pts:0, rc:new Array(ND+1).fill(0), sc:new Array(ND+1).fill(0), drivers:[]};
    for(var d=0; d<ND; d++) if(S.dTeam[d]===k){
      r.pts+=byD[d].pts; r.drivers.push(d);
      for(var p=1;p<=ND;p++){ r.rc[p]+=byD[d].rc[p]; r.sc[p]+=byD[d].sc[p]; }
    }
    return r;
  }).filter(function(r){ return r.drivers.length; });
  rows.sort(cmp);
  return rows;
}
function raceDone(id){
  var R=S.res[id];
  for(var d=0; d<ND; d++) if(R.r[d] || R.q[d] || R.s[d] || R.sq[d]) return true;
  return false;
}
function raceDriven(id){
  var R=S.res[id];
  for(var d=0; d<ND; d++) if(R.r[d]!==null) return true;
  return false;
}
function drivenCount(){ var n=0; S.races.forEach(function(R){ if(raceDriven(R.id)) n++; }); return n; }
function nextRaceIdx(){ for(var i=0;i<S.races.length;i++) if(!raceDriven(S.races[i].id)) return i; return -1; }
function lastCompleted(){ var last=-1; for(var i=0;i<S.races.length;i++) if(raceDone(S.races[i].id)) last=i; return last; }
function champOf(season){
  return withSeason(season, function(){
    if(!S.races.length) return null;
    for(var i=0;i<S.races.length;i++) if(!raceDriven(S.races[i].id)) return null;
    var st=standings();
    return (st[0] && st[0].pts>0) ? {d:st[0].d, name:dname(st[0].d)} : null;
  });
}
function prevSeasonOf(season){
  if(!SV) return null;
  var i=SV.seasons.indexOf(season);
  return i>0 ? SV.seasons[i-1] : null;
}
function teammates(d){ var out=[]; for(var j=0;j<ND;j++) if(j!==d && S.dTeam[j]===S.dTeam[d]) out.push(j); return out; }

/* Statistik je Fahrer und Saison */
function dStats(season){
  return withSeason(season, function(){
    var st=standings(), rank={}, out=[], d, i;
    st.forEach(function(r,i){ rank[r.d]=i+1; });
    for(d=0; d<ND; d++){
      var o={d:d, name:dname(d), rank:rank[d], pts:0, wins:0, pods:0, poles:0, t10s:0, t10f:0, dnf:0, fl:0, swins:0, frow:0,
             tmq:0, tmqN:0, sumS:0, nS:0, sumF:0, nF:0, starts:0, races:0, best:null, gain:gainTotal(d)};
      var mates=teammates(d);
      for(i=0;i<S.races.length;i++){
        var id=S.races[i].id, R=S.res[id], q=R.q[d], r=R.r[d];
        o.pts+=weekendPts(id,d).t;
        if(isNum(q)){ o.starts++; o.sumS+=q; o.nS++; if(q===1) o.poles++; if(q<=10) o.t10s++; if(q<=2) o.frow++;
          mates.forEach(function(m){ var q2=R.q[m]; if(isNum(q2)){ o.tmqN++; if(q<q2) o.tmq++; } }); }
        if(isNum(r)){ o.races++; o.sumF+=r; o.nF++; if(r===1) o.wins++; if(r<=3) o.pods++; if(r<=10) o.t10f++; if(o.best===null || r<o.best) o.best=r; }
        else if(r===DNF){ o.races++; o.dnf++; }
        if(S.sprints[id]){ if(R.s[d]===1) o.swins++; if(R.s[d]===DNF) o.dnf++; if(R.fls===d) o.fl++; }
        if(R.flr===d) o.fl++;
      }
      o.avgS=o.nS ? o.sumS/o.nS : null;
      o.avgF=o.nF ? o.sumF/o.nF : null;
      out.push(o);
    }
    return out;
  });
}
var STATS=[
  {k:"pts",   l:"Punkte"},
  {k:"wins",  l:"Siege"},
  {k:"pods",  l:"Podien"},
  {k:"poles", l:"Pole-Positions"},
  {k:"t10s",  l:"Top-10-Starts"},
  {k:"t10f",  l:"Top-10-Ziele"},
  {k:"dnf",   l:"Ausfälle", hint:"Rennen und Sprint zusammen"},
  {k:"gain",  l:"Plätze gutgemacht", signed:true, hint:"Startplatz minus Zielplatz, Rennen und Sprint"},
  {k:"avgS",  l:"Ø Startplatz", low:true, dec:true},
  {k:"avgF",  l:"Ø Zielplatz", low:true, dec:true, hint:"ohne Ausfälle"},
  {k:"fl",    l:"Schnellste Runden"},
  {k:"swins", l:"Sprintsiege"},
  {k:"frow",  l:"Erste Startreihe"},
  {k:"tmq",   l:"Quali-Duelle gewonnen", hint:"gegen den eigenen Teamkollegen"},
  {k:"titles",l:"Titel", career:true},
  {k:"seasons",l:"Saisons", career:true}
];
function statDef(k){ for(var i=0;i<STATS.length;i++) if(STATS[i].k===k) return STATS[i]; return STATS[0]; }
var SUMKEYS=["pts","wins","pods","poles","t10s","t10f","dnf","fl","swins","frow","tmq","tmqN","sumS","nS","sumF","nF","starts","races"];
function career(){
  var map={}, order=[];
  SV.seasons.forEach(function(se){
    var ds=dStats(se), ch=champOf(se);
    withSeason(se, function(){
      ds.forEach(function(o){
        var nm=String(o.name||"").trim(); if(!nm) return;
        var k=nm.toLowerCase(), a=map[k];
        if(!a){ a=map[k]={key:k, name:nm, seasons:0, titles:[], team:null, num:"", gain:0, gainAny:false, best:null, teams:[]}; SUMKEYS.forEach(function(x){ a[x]=0; }); order.push(k); }
        a.seasons++; a.name=nm;
        var tm=S.teams[S.dTeam[o.d]];
        a.team=tm || a.team; a.num=S.drivers[o.d].num || a.num;
        if(tm && a.teams.indexOf(tm.name)<0) a.teams.push(tm.name);
        SUMKEYS.forEach(function(x){ a[x]+=o[x]; });
        if(o.gain!==null){ a.gain+=o.gain; a.gainAny=true; }
        if(o.best!==null && (a.best===null || o.best<a.best)) a.best=o.best;
        if(ch && ch.d===o.d) a.titles.push(se.name);
      });
    });
  });
  return order.map(function(k){
    var a=map[k];
    a.avgS=a.nS ? a.sumS/a.nS : null; a.avgF=a.nF ? a.sumF/a.nF : null;
    if(!a.gainAny) a.gain=null;
    return a;
  });
}
function statVal(o, k){
  if(k==="titles") return o.titles ? o.titles.length : 0;
  return o[k]===undefined ? null : o[k];
}

/* ================= Prognose ================= */
var SIM_N=2000, SIM_SD=3.5, SIM_K=3, SIM_DNF=0.06, simCache={key:null, val:null};
function remMax(id){
  var c=cfg(), R=S.res[id], d, qDone=false, sDone=false;
  for(d=0; d<ND; d++){ if(R.q[d]!==null) qDone=true; if(R.s[d]!==null) sDone=true; }
  var p=RACE_PTS[1]+(c.fl ? 1 : 0);
  if(!qDone) p+=c.qualy;
  if(S.sprints[id] && !sDone) p+=c.sprint[1]+(c.fl ? 1 : 0);
  return p;
}
function finishStats(season){
  var out={};
  withSeason(season, function(){
    for(var d=0; d<ND; d++){
      var key=String(dname(d)).trim().toLowerCase(), sum=0, n=0, fin=0, dnf=0;
      for(var i=0;i<S.races.length;i++){
        var v=S.res[S.races[i].id].r[d];
        if(isNum(v)){ sum+=v; fin++; n++; } else if(v===DNF){ dnf++; n++; }
      }
      out[key]={sum:sum, fin:fin, n:n, dnf:dnf};
    }
  });
  return out;
}
function mergeFS(list){
  var out={};
  list.forEach(function(fs){ for(var k in fs){ var a=out[k]||(out[k]={sum:0,fin:0,n:0,dnf:0}), b=fs[k]; a.sum+=b.sum; a.fin+=b.fin; a.n+=b.n; a.dnf+=b.dnf; } });
  return out;
}
function predUse(se){ var v=APP.prefs.predUse[se.id]; if(typeof v==="boolean") return v; return se===prevSeasonOf(S); }
function latestPower(uptoIdx){
  var lim = uptoIdx<0 ? S.races.length-1 : uptoIdx;
  for(var i=lim;i>=0;i--){
    var p=S.power[S.races[i].id];
    if(p && p.some(function(v){ return v!=null; })) return {vals:p, race:S.races[i], idx:i};
  }
  return null;
}
function carRatings(){
  var lp=latestPower(nextRaceIdx());
  if(!lp) return null;
  var vs=S.teams.map(function(_,k){ return isNum(lp.vals[k]) ? lp.vals[k] : null; });
  var have=vs.filter(function(v){ return v!=null; });
  if(have.length<2) return null;
  var mx=Math.max.apply(null, have);
  return {race:lp.race, vals:vs, r:vs.map(function(v){ return v==null ? null : clamp(1.5+(mx-v)*0.85, 1, ND); })};
}
function driverModel(){
  var prior=SV.seasons.filter(function(se){ return se!==S && predUse(se); });
  var pm=prior.length ? mergeFS(prior.map(finishStats)) : null, cm=finishStats(S), car=carRatings();
  var a=car ? APP.prefs.predW : 0, model=[], nCur=0;
  for(var d=0; d<ND; d++){
    var key=String(dname(d)).trim().toLowerCase(), p=pm ? pm[key] : null, c=cm[key];
    var priorR=(p && p.fin) ? p.sum/p.fin : (pm ? 13 : 11.5);
    var priorD=(p && p.n) ? (p.dnf+SIM_DNF*2)/(p.n+2) : SIM_DNF;
    var w=c.n/(c.n+SIM_K);
    var curR=c.fin ? c.sum/c.fin : priorR;
    var curD=(c.dnf+priorD*2)/(c.n+2);
    var form=w*curR+(1-w)*priorR, rating=form;
    var cr=car ? car.r[S.dTeam[d]] : null;
    if(cr!=null) rating=(1-a)*form+a*cr;
    model.push({rating:rating, dnf:Math.min(0.5, w*curD+(1-w)*priorD)});
    if(c.n>nCur) nCur=c.n;
  }
  return {m:model, prior:prior, nCur:nCur, w:nCur/(nCur+SIM_K), car:car, a:a};
}
function hashStr(s){ var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function mulberry(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function gauss(r){ var u=1-r(), v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function simulate(st){
  var key=JSON.stringify([S.id, S.mode, S.races, S.sprints, S.res, S.power, S.dTeam, S.drivers.map(function(x){ return x.name; }), APP.prefs.predW,
    SV.seasons.filter(function(se){ return se!==S && predUse(se); }).map(function(se){ return [se.id, se.res]; })]);
  if(simCache.key===key) return simCache.val;
  var model=driverModel(), m=model.m, c=cfg(), r=mulberry(hashStr(key));
  var rem=S.races.filter(function(R){ return !raceDriven(R.id); }).map(function(R){
    var Rs=S.res[R.id], d, q=false, s=false;
    for(d=0; d<ND; d++){ if(Rs.q[d]!==null) q=true; if(Rs.s[d]!==null) s=true; }
    return {q:!q && c.qualy>0, s:!!S.sprints[R.id] && !s};
  });
  var basePts=[], baseWins=[], d, i, n;
  for(i=0;i<st.length;i++){ basePts[st[i].d]=st[i].pts; baseWins[st[i].d]=st[i].rc[1]; }
  var champs=new Array(ND).fill(0), nextWin=new Array(ND).fill(0);
  function order(withDnf){
    var arr=[];
    for(var k=0;k<ND;k++){
      if(withDnf && r()<m[k].dnf) continue;
      arr.push({d:k, s:m[k].rating+gauss(r)*SIM_SD});
    }
    arr.sort(function(a,b){ return a.s-b.s; });
    return arr.map(function(x){ return x.d; });
  }
  for(n=0; n<SIM_N; n++){
    var pts=basePts.slice(), wins=baseWins.slice();
    rem.forEach(function(w, wi){
      var o;
      if(w.q){ o=order(false); pts[o[0]]+=c.qualy; }
      if(w.s){
        o=order(true);
        for(var p=0;p<8 && p<o.length;p++) pts[o[p]]+=c.sprint[p+1];
        if(c.fl && o.length) pts[o[Math.floor(r()*Math.min(10,o.length))]]+=1;
      }
      o=order(true);
      for(var q=0;q<10 && q<o.length;q++) pts[o[q]]+=RACE_PTS[q+1];
      if(o.length){ wins[o[0]]++; if(wi===0) nextWin[o[0]]++; if(c.fl) pts[o[Math.floor(r()*Math.min(10,o.length))]]+=1; }
    });
    var best=0;
    for(d=1; d<ND; d++){
      if(pts[d]>pts[best] || (pts[d]===pts[best] && (wins[d]>wins[best] || (wins[d]===wins[best] && r()<0.5)))) best=d;
    }
    champs[best]++;
  }
  var val={p:champs.map(function(x){ return x/SIM_N; }), next:nextWin.map(function(x){ return x/SIM_N; }), model:model, rem:rem.length};
  simCache={key:key, val:val};
  return val;
}
function pctTxt(p){
  if(p>=1) return "100 %";
  if(p>=0.995) return "> 99 %";
  if(p>0 && p<0.01) return "< 1 %";
  return Math.round(p*100)+" %";
}

/* Fahrerwechsel zur Vorsaison */
function seasonDiff(oldS, newDrivers, newDTeam, teams){
  function tn(tl, dt, d){ var t=tl[dt[d]]; return t ? t.name : "–"; }
  var om={}, nm={}, out=[], d, k;
  for(d=0; d<normNd(oldS.nd); d++){ var a=String(oldS.drivers[d].name||"").trim(); if(a) om[a.toLowerCase()]={name:a, team:tn(oldS.teams, oldS.dTeam, d)}; }
  for(d=0; d<ND; d++){ var b=String(newDrivers[d].name||"").trim(); if(b) nm[b.toLowerCase()]={name:b, team:tn(teams, newDTeam, d)}; }
  for(k in nm){
    if(om[k]){ if(om[k].team!==nm[k].team) out.push({type:"move", name:nm[k].name, from:om[k].team, to:nm[k].team}); }
    else out.push({type:"in", name:nm[k].name, to:nm[k].team});
  }
  for(k in om) if(!nm[k]) out.push({type:"out", name:om[k].name, from:om[k].team});
  var ord={move:0, "in":1, out:2};
  out.sort(function(a,b){ return ord[a.type]-ord[b.type] || natCmp(a.name,b.name); });
  return out;
}

/* ================= Bausteine fürs HTML ================= */
function lin(c){ c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function inkOn(hex){
  var m=/^#?([0-9a-f]{6})$/i.exec(hex||""); if(!m) return "#FFFFFF";
  var n=parseInt(m[1],16), L=0.2126*lin((n>>16)&255)+0.7152*lin((n>>8)&255)+0.0722*lin(n&255);
  return L>0.2 ? "#141414" : "#FFFFFF";
}
function shortOf(t){
  if(!t) return "?";
  if(t.short) return t.short.toUpperCase();
  var w=String(t.name||"").trim().split(/\s+/).filter(Boolean);
  var s = w.length>1 ? w.slice(0,3).map(function(x){ return x[0]; }).join("") : (w[0]||"").slice(0,3);
  return (s || "?").toUpperCase();
}
function logoHtml(t, size){
  size=size||36;
  var r=Math.round(size*0.28);
  if(!t) return '<span class="logo" style="--s:'+size+'px;border-radius:'+r+'px;background:var(--card-2)"></span>';
  if(t.logo) return '<span class="logo img" style="--s:'+size+'px;border-radius:'+r+'px"><img src="'+t.logo+'" alt=""></span>';
  return '<span class="logo" style="--s:'+size+'px;border-radius:'+r+'px;background:'+t.color+';color:'+inkOn(t.color)+'">'+esc(shortOf(t))+'</span>';
}
function dLogo(d, size){ return logoHtml(teamOfD(d), size); }
function numTag(d){ var n=dnum(d); return n ? '<span class="num-tag">'+esc(n)+'</span>' : ""; }
function segBtns(act, cur, pairs, extra){
  return pairs.map(function(p){
    return '<button type="button" data-act="'+act+'" data-v="'+esc(p[0])+'" aria-pressed="'+(p[0]===cur)+'"'+(p[2] ? ' disabled' : '')+(extra||"")+'>'+esc(p[1])+'</button>';
  }).join("");
}
function cardHead(title, hint){ return '<div class="chead"><h2>'+esc(title)+'</h2>'+(hint ? '<span class="hint">'+hint+'</span>' : '')+'</div>'; }
function emptyBox(icon, title, text, extra){
  return '<div class="empty">'+ico(icon,34,1.6)+'<b>'+esc(title)+'</b><span>'+text+'</span>'+(extra||"")+'</div>';
}
function posClass(v){ return v===1 ? "w" : (v<=3 ? "p" : (v<=10 ? "pt" : "")); }
function cellHtml(v, fl, act){
  var cls="cell", t="";
  if(v===DNF){ cls+=" dnf"; t="DNF"; }
  else if(isNum(v)){ cls+=" "+posClass(v); t=String(v); }
  else t="·";
  if(fl) cls+=" fl";
  return act ? '<button type="button" class="'+cls+'" '+act+'>'+t+'</button>' : '<span class="'+cls+'">'+t+'</span>';
}

/* Liniendiagramm mit Tipp-Werten */
var CHARTS={};
function niceStep(range, count){
  var raw=range/count, mag=Math.pow(10, Math.floor(Math.log10(raw))), f=raw/mag;
  return (f<=1 ? 1 : f<=2 ? 2 : f<=5 ? 5 : 10)*mag;
}
function lineChart(o){
  var W=640, H=o.h||250, L=36, R=16, T=12, B=26, n=o.labels.length;
  if(n<2) return '<div class="empty small">'+(o.emptyText||"Sobald Ergebnisse eingetragen sind, erscheint hier der Verlauf.")+'</div>';
  CHARTS[o.id]=o;
  var vis=o.series.filter(function(s){ return !(o.hidden && o.hidden[s.key]); });
  var mn=o.yMin, mx=o.yMax;
  if(mn==null || mx==null){
    var lo=Infinity, hi=-Infinity;
    vis.forEach(function(s){ s.vals.forEach(function(v){ if(v!=null){ lo=Math.min(lo,v); hi=Math.max(hi,v); } }); });
    if(!isFinite(lo)){ lo=0; hi=1; }
    if(mn==null) mn=lo; if(mx==null) mx=hi;
  }
  if(mx<=mn) mx=mn+1;
  var ticks=o.ticks;
  if(!ticks){
    var step=niceStep(mx-mn, 4); ticks=[];
    mx=Math.ceil(mx/step)*step;
    for(var tv=Math.ceil(mn/step)*step; tv<=mx+1e-9; tv+=step) ticks.push(Math.round(tv*100)/100);
  }
  function x(i){ return L+(W-L-R)*(i/(n-1)); }
  function y(v){ var f=(v-mn)/(mx-mn); return o.invert ? T+(H-T-B)*f : T+(H-T-B)*(1-f); }
  var h=['<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.label||"Verlauf")+'">'];
  ticks.forEach(function(t){
    h.push('<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(t).toFixed(1)+'" y2="'+y(t).toFixed(1)+'"></line>');
    h.push('<text x="'+(L-6)+'" y="'+(y(t)+3.5).toFixed(1)+'" text-anchor="end">'+esc(o.yFmt ? o.yFmt(t) : t)+'</text>');
  });
  var every=Math.max(1, Math.ceil(n/9));
  o.labels.forEach(function(lb,i){
    if(i%every && i!==n-1) return;
    h.push('<text x="'+x(i).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle">'+esc(lb)+'</text>');
  });
  vis.forEach(function(s, si){
    var segs=[], cur=[];
    s.vals.forEach(function(v,i){ if(v==null){ if(cur.length) segs.push(cur); cur=[]; } else cur.push([x(i), y(v)]); });
    if(cur.length) segs.push(cur);
    segs.forEach(function(sg){
      if(sg.length<2) return;
      var d="M"+sg.map(function(p){ return p[0].toFixed(1)+" "+p[1].toFixed(1); }).join(" L");
      h.push('<path class="ln" pathLength="1" d="'+d+'" style="stroke:'+s.color+';animation-delay:'+(si*45)+'ms'+(s.op ? ';opacity:'+s.op : '')+'"></path>');
    });
    for(var li=s.vals.length-1; li>=0; li--) if(s.vals[li]!=null){
      h.push('<circle cx="'+x(li).toFixed(1)+'" cy="'+y(s.vals[li]).toFixed(1)+'" r="4.5" style="fill:'+s.color+';stroke:var(--card);stroke-width:2'+(s.op ? ';opacity:'+s.op : '')+'"></circle>');
      break;
    }
    if(o.dots) s.vals.forEach(function(v,i){ if(v!=null) h.push('<circle cx="'+x(i).toFixed(1)+'" cy="'+y(v).toFixed(1)+'" r="3" style="fill:'+s.color+'"></circle>'); });
  });
  var cw=(W-L-R)/(n-1);
  for(var i=0;i<n;i++){
    h.push('<rect class="hit" x="'+(x(i)-cw/2).toFixed(1)+'" y="0" width="'+cw.toFixed(1)+'" height="'+H+'" data-act="tip" data-chart="'+o.id+'" data-i="'+i+'"></rect>');
  }
  h.push('</svg>');
  return '<div class="chartbox" style="position:relative">'+h.join("")+'<div class="tip" hidden></div></div>';
}
function showTip(el){
  var o=CHARTS[el.getAttribute("data-chart")], i=+el.getAttribute("data-i");
  if(!o) return;
  var box=el.closest(".chartbox"), tip=box.querySelector(".tip");
  var rows=o.series.filter(function(s){ return !(o.hidden && o.hidden[s.key]) && s.vals[i]!=null; })
    .map(function(s){ return {l:s.label, c:s.color, v:s.vals[i]}; });
  rows.sort(function(a,b){ return o.invert ? a.v-b.v : b.v-a.v; });
  rows=rows.slice(0,8);
  if(!rows.length){ tip.hidden=true; return; }
  tip.innerHTML='<b>'+esc(o.tipTitle ? o.tipTitle(i) : o.labels[i])+'</b>'+rows.map(function(r){
    return '<div><span><i style="display:inline-block;width:8px;height:8px;border-radius:4px;background:'+r.c+';margin-right:6px"></i>'+esc(r.l)+'</span><span class="num">'+esc(o.yFmt ? o.yFmt(r.v) : r.v)+'</span></div>';
  }).join("");
  tip.hidden=false;
  var bw=box.clientWidth, px=(i/(o.labels.length-1))*bw, tw=tip.offsetWidth;
  tip.style.left=clamp(px-tw/2, 0, Math.max(0,bw-tw))+"px";
  tip.style.top="-6px";
  clearTimeout(showTip.t);
  showTip.t=setTimeout(function(){ tip.hidden=true; }, 3500);
}

/* ================= Navigation & Kopf ================= */
var VIEWS=[
  {k:"standings", l:"Wertung"},
  {k:"race", l:"Rennen"},
  {k:"stats", l:"Statistik"},
  {k:"pred", l:"Prognose"},
  {k:"teams", l:"Teams"},
  {k:"set", l:"Einstellungen"}
];
function buildNav(){
  $("nav").innerHTML='<span class="ind" aria-hidden="true"></span>'+VIEWS.map(function(v){
    return '<button type="button" data-act="nav" data-v="'+v.k+'" aria-label="'+v.l+'" title="'+v.l+'">'+ico(IC[v.k],22,1.9)+'</button>';
  }).join("");
}
function updateHeader(){
  var nav=$("nav");
  nav.hidden=!S;
  VIEWS.forEach(function(x,i){ if(x.k===ui.view){ var prev=nav.style.getPropertyValue("--ni"); if(prev!==String(i)){ nav.style.setProperty("--ni", i); var ind=nav.querySelector(".ind"); if(ind && prev!==""){ ind.classList.remove("hop"); void ind.offsetWidth; ind.classList.add("hop"); } } } });
  nav.querySelectorAll("button").forEach(function(b){
    if(b.getAttribute("data-v")===ui.view) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current");
  });
  var v=null; VIEWS.forEach(function(x){ if(x.k===ui.view) v=x; });
  $("title").textContent = S ? (v ? v.l : "") : "F1 Manager";
  $("savepill").hidden=!S;
  if(S){
    $("savepill-t").innerHTML='<b>'+esc(SV.name)+'</b> · '+esc(S.name)+' · '+MODES[S.mode].name;
    var n=drivenCount();
    $("roundinfo").textContent = S.races.length ? (n>=S.races.length ? "Saison beendet" : "Rennen "+n+" / "+S.races.length) : "";
  } else $("roundinfo").textContent="";
}
function isDark(){
  var t=APP.prefs.theme;
  if(t==="dark") return true;
  if(t==="light") return false;
  try{ return window.matchMedia("(prefers-color-scheme: dark)").matches; }catch(e){ return true; }
}
var lastBars=null;
function applyTheme(){
  var t=APP.prefs.theme, root=document.documentElement, dark=isDark();
  if(t==="system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
  root.classList.toggle("nomo", !APP.prefs.motion);
  var mt=document.querySelector('meta[name="theme-color"]'); if(mt) mt.setAttribute("content", dark ? "#0E0F14" : "#ECEEF3");
  var tb=$("themebtn");
  if(tb && tb.getAttribute("data-dark")!==String(dark)){
    tb.setAttribute("data-dark", String(dark));
    tb.innerHTML = dark ? ico('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',20,2)
                        : ico('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',20,2);
    tb.setAttribute("aria-label", dark ? "Auf hell umschalten" : "Auf dunkel umschalten");
  }
  if(NATIVE && lastBars!==dark){
    lastBars=dark;
    try{ N.SystemBars.setStyle({style: dark ? N.SystemBarsStyle.Dark : N.SystemBarsStyle.Light}).catch(function(){}); }catch(e){}
  }
}
function reducedMotion(){ try{ return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } }
function switchTheme(next, el){
  var go2=function(){ APP.prefs.theme=next; touch(); applyTheme(); if(ui.view==="set") refresh(); };
  if(!document.startViewTransition || !APP.prefs.motion || reducedMotion() || !el){ go2(); return; }
  var r=el.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2;
  var rad=Math.hypot(Math.max(x, innerWidth-x), Math.max(y, innerHeight-y));
  var vt=document.startViewTransition(go2);
  vt.ready.then(function(){
    document.documentElement.animate({clipPath:["circle(0px at "+x+"px "+y+"px)", "circle("+rad+"px at "+x+"px "+y+"px)"]},
      {duration:600, easing:"cubic-bezier(.3,.8,.2,1)", pseudoElement:"::view-transition-new(root)"});
  }).catch(function(){});
}

/* ================= Ansichten ================= */
var lastIdx=null;
function render(anim){
  applyTheme();
  pickCurrent();
  updateHeader();
  var html;
  if(!S) html=vOnboarding();
  else if(ui.view==="race") html=vRace();
  else if(ui.view==="stats") html=vStats();
  else if(ui.view==="pred") html=vPred();
  else if(ui.view==="teams") html=vTeams();
  else if(ui.view==="set") html=vSettings();
  else html=vStandings();
  var idx=0; VIEWS.forEach(function(v,i){ if(v.k===ui.view) idx=i; });
  var dx = (lastIdx===null || lastIdx===idx) ? 0 : (idx>lastIdx ? 26 : -26);
  var m=$("main");
  m.className = anim ? "" : "still";
  m.innerHTML='<section class="view'+(anim ? ' enter' : '')+'" style="--dx:'+dx+'px">'+html+'</section>';
  lastIdx=idx;
  afterRender(anim);
}
function refresh(){ render(false); }
/* Gleitende Markierung in allen Umschaltern, wie die Leiste unten */
var SEGPREV={};
function segInd(root){
  (root||document).querySelectorAll(".seg").forEach(function(el){
    var bs=el.querySelectorAll("button"), cur=-1;
    bs.forEach(function(b,i){ if(b.getAttribute("aria-pressed")==="true") cur=i; });
    el.style.setProperty("--sn", bs.length);
    el.classList.toggle("noind", cur<0);
    if(cur<0) return;
    var key=(bs[0] && bs[0].getAttribute("data-act"))||"", prev=SEGPREV[key];
    SEGPREV[key]=cur;
    if(prev!=null && prev!==cur && prev<bs.length && APP.prefs.motion){
      el.style.setProperty("--si", prev); void el.offsetWidth;
      requestAnimationFrame(function(){ el.style.setProperty("--si", cur); el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop"); });
    } else el.style.setProperty("--si", cur);
  });
}
function afterRender(anim){
  segInd($("main"));
  document.querySelectorAll("#main .chips").forEach(function(box){
    var a=box.querySelector(".chip[aria-pressed='true']");
    if(a) box.scrollLeft=Math.max(0, a.offsetLeft-box.offsetLeft-box.clientWidth/2+a.offsetWidth/2);
  });
  if(anim && APP.prefs.motion) countUp();
  if(pendingConfetti){ pendingConfetti=false; confetti(); }
}
function countUp(){
  var els=document.querySelectorAll("[data-cu]");
  els.forEach(function(el){
    var to=parseFloat(el.getAttribute("data-cu")); if(!isFinite(to) || to===0) return;
    var t0=null, dec=el.hasAttribute("data-dec");
    function step(t){
      if(t0===null) t0=t;
      var f=Math.min(1,(t-t0)/750), e=1-Math.pow(1-f,3), v=to*e;
      el.textContent = dec ? v.toFixed(1).replace(".",",") : String(Math.round(v));
      if(f<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
function go(v){
  if(ui.view===v) return;
  ui.view=v; saveUi();
  window.scrollTo(0,0);
  render(true);
}
function saveUi(){ try{ localStorage.setItem("f1m-ui", JSON.stringify({view:ui.view, wMode:ui.wMode, statKey:ui.statKey, statScope:ui.statScope})); }catch(e){} }
function loadUi(){
  try{
    var x=JSON.parse(localStorage.getItem("f1m-ui")||"null");
    if(x){
      VIEWS.forEach(function(v){ if(v.k===x.view) ui.view=x.view; });
      if(["d","t","v","g"].indexOf(x.wMode)>=0) ui.wMode=x.wMode;
      if(typeof x.statKey==="string") ui.statKey=x.statKey;
      if(x.statScope==="all") ui.statScope="all";
    }
  }catch(e){}
}

/* ---------- Start ohne Daten ---------- */
function vOnboarding(){
  return '<div class="card st" style="--i:0;display:flex;flex-direction:column;gap:12px">'+
    '<div class="eyebrow">Willkommen</div>'+
    '<div style="font:800 30px/1.05 var(--display);text-transform:uppercase">Deine Karriere, Rennen für Rennen</div>'+
    '<p class="muted" style="margin:0">Hol deine Daten aus der alten HTML-Datei: Dort unter dem Zahnrad bei „Sicherung“ den Text kopieren oder als Datei sichern, dann hier einfügen.</p>'+
    '</div>'+
    dataImportBlock(true)+
    '<div class="card st" style="--i:2;display:flex;flex-direction:column;gap:10px">'+
      '<button type="button" class="bigact hand" data-act="new-save">'+'<span class="ic">'+ico(IC.plus,22)+'</span><span><span class="tt">Neuer Spielstand</span><br><span class="ds">Leer starten und Fahrer, Teams und Kalender eintragen</span></span></button>'+
      '<button type="button" class="bigact hand" data-act="demo">'+'<span class="ic">'+ico(IC.sparkle,22)+'</span><span><span class="tt">Beispiel ansehen</span><br><span class="ds">Lädt eine erfundene Beispiel-Karriere zum Ausprobieren</span></span></button>'+
    '</div>';
}

/* ---------- Wertung ---------- */
function vStandings(){
  var st=standings(), h=[];
  h.push('<div class="seg st" style="--i:0" role="group" aria-label="Ansicht">'+segBtns("wmode", ui.wMode, [["d","Fahrer"],["t","Teams"],["v","Duelle"],["g","Raster"]])+'</div>');
  if(ui.wMode==="g"){ h.push(matrixCard(st)); return h.join(""); }
  if(ui.wMode==="v"){ h.push('<div class="duelgrid">'+teamCompareCards(1)+'</div>'); return h.join(""); }
  if(ui.wMode==="t"){
    h.push('<div class="cols"><div class="stack">'+teamListCard()+'</div><div class="stack">'+pointsChartCard("t")+'</div></div>');
    return h.join("");
  }
  h.push('<div class="cols"><div class="stack">'+leaderCard(st)+driverListCard(st)+'</div><div class="stack">'+pointsChartCard("d")+constructorsMini()+'</div></div>');
  return h.join("");
}
function leaderCard(st){
  var L=st[0];
  if(!L || L.pts===0){
    return '<div class="card st" style="--i:1">'+emptyBox(IC.flag, "Noch keine Punkte", "Trag das erste Rennwochenende ein oder lies ein Ergebnis-Foto aus.",
      '<button type="button" class="btn pri" data-act="nav" data-v="race">Zum Rennen</button>')+'</div>';
  }
  var ch=champOf(S), gap=L.pts-(st[1] ? st[1].pts : 0), t=teamOfD(L.d);
  return '<button type="button" class="card leader st" style="--i:1;text-align:left;color:inherit;width:100%" data-act="driver" data-d="'+L.d+'">'+
    '<span class="flag" aria-hidden="true"></span>'+
    '<span class="p1">'+(ch ? ico(IC.cup,54,2) : '1')+'</span>'+dLogo(L.d,54)+
    '<span class="info"><span class="eyebrow">'+(ch ? 'Meister '+esc(S.name) : 'Führt die Wertung an')+'</span>'+
    '<span class="nm">'+esc(dname(L.d))+'</span>'+
    '<span class="small muted"><b class="num" data-cu="'+L.pts+'">'+L.pts+'</b> Pkt · '+esc(t ? t.name : "")+
    (st[1] ? ' · <span class="plus">+'+gap+'</span> auf '+esc(dname(st[1].d)) : '')+'</span></span></button>';
}
function driverListCard(st){
  var lead=st[0] ? st[0].pts : 0, skip=lead>0 ? 1 : 0;
  return '<div class="card flush st" style="--i:2"><div class="list">'+st.map(function(r,i){
    if(i<skip) return "";
    var d=r.d, t=teamOfD(d), pc=r.pts>0 ? (i===0 ? "g" : i===1 ? "s" : i===2 ? "b" : "") : "";
    return '<button type="button" class="li st" style="--i:'+(i+3)+'" data-act="driver" data-d="'+d+'">'+
      '<span class="pos '+pc+'">'+(i+1)+'</span>'+dLogo(d,36)+
      '<span class="who"><span class="n">'+esc(dname(d))+numTag(d)+'</span><span class="m">'+esc(t ? t.name : "–")+(r.rc[1] ? ' · '+plural(r.rc[1],"Sieg","Siege") : '')+'</span></span>'+
      '<span class="aux num">'+(i>0 && lead>0 ? '−'+(lead-r.pts) : '')+'</span>'+
      '<span class="val num">'+r.pts+'</span></button>';
  }).join("")+'</div></div>';
}
function constructorsMini(){
  var ts=teamStandings(), lead=ts[0] ? Math.max(1, ts[0].pts) : 1;
  return '<div class="card flush st" style="--i:3"><div class="chead"><h2>Konstrukteure</h2><button type="button" class="btn sm ghost" data-act="wmode" data-v="t">Alle Details</button></div><div class="list">'+ts.map(function(r,i){
    var t=S.teams[r.t], pc=r.pts>0 ? (i===0 ? "g" : i===1 ? "s" : i===2 ? "b" : "") : "";
    return '<div class="li cmini"><span class="pos '+pc+'">'+(i+1)+'</span>'+logoHtml(t,30)+
      '<span class="who"><span class="n">'+esc(t.name)+'</span><span class="bar" style="height:5px;margin-top:5px"><i style="width:'+(r.pts/lead*100).toFixed(1)+'%;background:'+t.color+'"></i></span></span>'+
      '<span class="val num" style="font-size:19px">'+r.pts+'</span></div>';
  }).join("")+'</div></div>';
}
function teamListCard(){
  var ts=teamStandings(), lead=ts[0] ? Math.max(1, ts[0].pts) : 1;
  return '<div class="card flush st" style="--i:1"><div class="list">'+ts.map(function(r,i){
    var t=S.teams[r.t], pc=r.pts>0 ? (i===0 ? "g" : i===1 ? "s" : i===2 ? "b" : "") : "";
    return '<div class="li st" style="--i:'+(i+2)+';flex-wrap:wrap">'+
      '<span class="pos '+pc+'">'+(i+1)+'</span>'+logoHtml(t,44)+
      '<span class="who"><span class="n">'+esc(t.name)+'</span><span class="m">'+r.drivers.map(function(d){ return esc(dname(d)); }).join(" · ")+'</span></span>'+
      '<span class="val num">'+r.pts+'</span>'+
      '<span class="bar" style="flex-basis:100%;margin-left:38px;height:6px"><i style="width:'+(r.pts/lead*100).toFixed(1)+'%;background:'+t.color+'"></i></span></div>';
  }).join("")+'</div></div>';
}
function cumulative(){
  var last=lastCompleted();
  if(last<0) return null;
  var per=[], d, i;
  for(d=0; d<ND; d++){
    var run=0, arr=[0];
    for(i=0;i<=last;i++){ run+=weekendPts(S.races[i].id, d).t; arr.push(run); }
    per.push(arr);
  }
  return {last:last, per:per};
}
function legendHtml(series, hid, mode){
  return series.length ? '<div class="legend">'+series.map(function(s){
    return '<button type="button" class="lg" data-act="lg" data-mode="'+mode+'" data-k="'+s.key+'" aria-pressed="'+(!hid[s.key])+'"><i style="background:'+s.color+(s.op ? ';opacity:'+s.op : '')+'"></i>'+esc(s.label)+'</button>';
  }).join("")+'</div>' : '';
}
function chartHead(title, id, can){
  return '<div class="chead"><h2>'+esc(title)+'</h2>'+(can ? '<button type="button" class="btn sm ghost" data-act="chart-full" data-chart="'+id+'" aria-label="'+esc(title)+' im Vollbild">'+ico('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',16,2.2)+' Vollbild</button>' : '')+'</div>';
}
function sheetChart(){
  var o=CHARTS[SH.id];
  if(!o) return {title:"Verlauf", body:""};
  var w=Math.max(280, Math.min(innerWidth, 1100)-40), avail=Math.max(260, innerHeight-(o.mode ? 300 : 170));
  var H=clamp(Math.round(640*avail/w), 220, 1400);
  var fo={}; for(var k in o) fo[k]=o[k];
  fo.id=o.id+"-fs"; fo.h=H;
  var series=o.series.slice();
  return {title:SH.title||"Verlauf", body:lineChart(fo)+(o.mode ? legendHtml(series, o.hidden||{}, o.mode)+
    '<div class="row" style="margin-top:4px"><button type="button" class="btn sm" data-act="lg-top" data-mode="'+o.mode+'">Top 6</button><button type="button" class="btn sm" data-act="lg-all" data-mode="'+o.mode+'">Alle zeigen</button></div>' : '')+
    '<p class="small muted" style="margin:0">Tipp auf das Diagramm für die Werte. Dreh das Handy quer für noch mehr Platz.</p>'};
}
function pointsChartCard(mode){
  var c=cumulative(), series=[], labels=["Start"];
  if(c){
    for(var i=0;i<=c.last;i++) labels.push(raceCode(S.races[i]));
    if(mode==="d"){
      for(var d=0; d<ND; d++){
        var second=teammates(d).some(function(m){ return m<d; });
        series.push({key:"d"+d, label:dname(d), color:teamColor(d), op:second ? 0.62 : 0, vals:c.per[d]});
      }
    } else {
      S.teams.forEach(function(t,k){
        var arr=c.per[0].map(function(){ return 0; }), any=false;
        for(var d2=0; d2<ND; d2++) if(S.dTeam[d2]===k){ any=true; for(var j=0;j<arr.length;j++) arr[j]+=c.per[d2][j]; }
        if(any) series.push({key:"t"+k, label:t.name, color:t.color, vals:arr});
      });
    }
  }
  series.sort(function(a,b){ return b.vals[b.vals.length-1]-a.vals[a.vals.length-1]; });
  if(!ui.hidden[mode]){
    ui.hidden[mode]={};
    series.forEach(function(s,i){ if(i>=6) ui.hidden[mode][s.key]=true; });
  }
  var hid=ui.hidden[mode];
  var chart=lineChart({id:"pts-"+mode, mode:mode, series:series, labels:labels, hidden:hid, yMin:0, label:"Punkteverlauf",
    tipTitle:function(i){ return i===0 ? "Start" : raceLabel(S.races[i-1]); }});
  var legend=legendHtml(series, hid, mode);
  var tools=series.length>6 ? '<div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-act="lg-top" data-mode="'+mode+'">Top 6</button><button type="button" class="btn sm" data-act="lg-all" data-mode="'+mode+'">Alle zeigen</button></div>' : '';
  return '<div class="card st" style="--i:2">'+chartHead("Saisonverlauf", "pts-"+mode, labels.length>1)+chart+legend+tools+'</div>';
}
function matrixCard(st){
  if(!S.races.length) return '<div class="card">'+emptyBox(IC.race,"Kein Rennkalender","Lege in den Einstellungen Rennen an.")+'</div>';
  var qm=ui.gMode==="q", main=qm ? "q" : "r", side=qm ? "sq" : "s";
  var cols=[];
  S.races.forEach(function(R){
    if(S.sprints[R.id]) cols.push({R:R, k:side, sp:true});
    cols.push({R:R, k:main, sp:false, spw:!!S.sprints[R.id]});
  });
  var h=['<div class="seg sm st" style="--i:1" role="group" aria-label="Raster zeigt">'+segBtns("gmode", ui.gMode, [["r","Rennen"],["q","Qualifying"]])+'</div>',
    '<div class="card flush st" style="--i:2"><div class="gridwrap"><table class="mx"><thead><tr><th class="stk">Fahrer</th><th class="pts">Pkt</th>'];
  cols.forEach(function(c){
    var cls=(c.sp ? 'spc' : '')+(c.sp||c.spw ? ' spw' : '');
    h.push('<th class="'+cls+'" title="'+esc(c.R.name+(c.sp ? (qm ? " · Sprint-Quali" : " · Sprint") : (qm ? " · Qualifying" : " · Rennen")))+'">'+
      (c.sp ? '<span class="spb">'+(qm ? 'SQ' : 'S')+'</span>' : '<span class="flg">'+(c.R.flag ? esc(c.R.flag) : esc(raceCode(c.R)))+'</span>')+'</th>');
  });
  h.push('</tr></thead><tbody>');
  st.forEach(function(r){
    var d=r.d;
    h.push('<tr><td class="stk"><span class="nm">'+dLogo(d,24)+'<span>'+esc(dname(d))+'</span></span></td><td class="pts num">'+r.pts+'</td>');
    cols.forEach(function(c){
      var Rs=S.res[c.R.id], v=Rs[c.k][d], fl = c.k==="r" ? Rs.flr===d : (c.k==="s" ? Rs.fls===d : false);
      h.push('<td class="'+(c.sp ? 'spc' : '')+'">'+cellHtml(v, fl, 'data-act="goto-race" data-r="'+esc(c.R.id)+'" data-s="'+c.k+'" title="'+esc(c.R.name+" · "+SESSLBL[c.k]+": "+(v===DNF ? "DNF" : (isNum(v) ? "P"+v : "–")))+'"')+'</td>');
    });
    h.push('</tr>');
  });
  h.push('</tbody></table></div></div>');
  h.push('<div class="legend st" style="--i:3">'+
    '<span class="lg">'+cellHtml(1)+(qm ? ' Pole' : ' Sieg')+'</span><span class="lg">'+cellHtml(2)+' Top 3</span><span class="lg">'+cellHtml(7)+' Top 10</span>'+
    (qm ? '' : '<span class="lg">'+cellHtml(DNF)+' Ausfall</span><span class="lg">'+cellHtml(12,true)+' Schnellste Runde</span>')+
    '<span class="lg"><span class="spb">S</span> Sprint-Wochenende</span></div>');
  return h.join("");
}

/* ---------- Rennwochenende ---------- */
function ensureRace(){
  if(ui.race && S.res[ui.race]) return;
  var i=nextRaceIdx();
  if(i<0) i=S.races.length-1;
  else if(i>0 && !raceDone(S.races[i].id)) i=i-1;
  ui.race = i>=0 ? S.races[i].id : null;
}
function vRace(){
  ensureRace();
  if(!ui.race) return '<div class="card">'+emptyBox(IC.race,"Kein Rennkalender","Lege in den Einstellungen Rennen an.",'<button type="button" class="btn pri" data-act="nav" data-v="set">Zu den Einstellungen</button>')+'</div>';
  var id=ui.race, ri=raceIndex(id), R=S.races[ri], sess=sessionsOf(id);
  if(sess.indexOf(ui.sess)<0) ui.sess="r";
  var h=[];
  h.push('<div class="chips st" style="--i:0" role="group" aria-label="Rennen wählen">'+S.races.map(function(x){
    var done=raceDriven(x.id);
    return '<button type="button" class="chip code'+(done ? ' done' : '')+'" data-act="race" data-r="'+esc(x.id)+'" aria-pressed="'+(x.id===id)+'" title="'+esc(x.name)+'">'+
      (x.flag ? '<span style="font-size:15px">'+esc(x.flag)+'</span>' : '')+esc(raceCode(x))+(done ? ico(IC.check,13,3) : '')+'</button>';
  }).join("")+'</div>');
  h.push('<div class="card gp st" style="--i:1">'+
    '<button type="button" class="iconbtn" data-act="race-step" data-v="-1" aria-label="Vorheriges Rennen"'+(ri<=0 ? ' disabled' : '')+'>'+ico(IC.left,20,2.4)+'</button>'+
    '<span class="fl" aria-hidden="true">'+esc(R.flag||"")+'</span>'+
    '<div class="t"><div class="eyebrow">Rennen '+(ri+1)+' von '+S.races.length+(S.sprints[id] ? ' · Sprint-Wochenende' : '')+'</div><div class="n">'+esc(R.name)+'</div>'+
    (function(){ var wx=S.res[id].wx||{}, out=sess.filter(function(k){ return normWx(wx[k]); }).map(function(k){ var w=normWx(wx[k]); return '<span class="wxs">'+esc(SESSSHORT[k])+' '+PH.map(function(p){ return w[p[0]] ? wxIcon(w[p[0]],14) : '<span class="wx">\u00B7</span>'; }).join("")+'</span>'; }); return out.length ? '<div class="wxrow">'+out.join("")+'</div>' : ''; })()+'</div>'+
    '<button type="button" class="iconbtn" data-act="race-step" data-v="1" aria-label="Nächstes Rennen"'+(ri>=S.races.length-1 ? ' disabled' : '')+'>'+ico(IC.right,20,2.4)+'</button></div>');
  h.push('<div class="cols"><div class="stack">'+weekendCard(id)+sessionCard(id, sess)+'</div><div class="stack">'+powerCard(id, ri)+entryCard(id)+'</div></div>');
  return h.join("");
}
function weekendCard(id){
  var rows=[];
  for(var d=0; d<ND; d++){ var p=weekendPts(id,d); if(p.t>0) rows.push({d:d, p:p}); }
  rows.sort(function(a,b){ return b.p.t-a.p.t || (num(S.res[id].r[a.d])||99)-(num(S.res[id].r[b.d])||99); });
  if(!rows.length) return '<div class="card st" style="--i:2">'+cardHead("Punkte am Wochenende")+
    emptyBox(IC.flag,"Noch nichts eingetragen","Ganz unten kannst du ein Ergebnis-Foto auslesen lassen oder Platz für Platz eintragen.")+'</div>';
  var top=rows.slice(0,3), order=[1,0,2], h=['<div class="card st" style="--i:2">'+cardHead("Punkte am Wochenende", plural(rows.length,"Fahrer","Fahrer")+" mit Punkten")+'<div class="podium">'];
  order.forEach(function(k){
    var x=top[k]; if(!x) { h.push('<div></div>'); return; }
    h.push('<button type="button" class="pd'+(k===0 ? ' p1' : '')+'" data-act="driver" data-d="'+x.d+'"><span class="rk">'+(k+1)+'.</span>'+dLogo(x.d, k===0 ? 50 : 40)+
      '<span class="n">'+esc(dname(x.d))+'</span><span class="v num" data-cu="'+x.p.t+'">'+x.p.t+'</span></button>');
  });
  h.push('</div><div class="list">');
  rows.forEach(function(x, i){
    var p=x.p, b=[];
    if(p.q) b.push('<span class="tagp a">Pole +'+p.q+'</span>');
    if(p.s) b.push('<span class="tagp n">Sprint +'+p.s+'</span>');
    if(p.r) b.push('<span class="tagp g">Rennen +'+p.r+'</span>');
    if(p.fls || p.flr) b.push('<span class="tagp p">'+ico(IC.bolt,11,2.4)+' +'+(p.fls+p.flr)+'</span>');
    h.push('<button type="button" class="li st" style="--i:'+(i+3)+';padding-inline:0" data-act="driver" data-d="'+x.d+'">'+dLogo(x.d,32)+
      '<span class="who"><span class="n">'+esc(dname(x.d))+'</span><span class="brk" style="justify-content:flex-start;margin-top:3px">'+b.join("")+'</span></span><span class="val num" style="min-width:38px">'+p.t+'</span></button>');
  });
  h.push('</div></div>');
  return h.join("");
}
function sessionCard(id, sess){
  var k=ui.sess, R=S.res[id], arr=R[k], rows=[], dnfs=[], d;
  for(d=0; d<ND; d++){ if(isNum(arr[d])) rows.push({d:d, p:arr[d]}); else if(arr[d]===DNF) dnfs.push(d); }
  rows.sort(function(a,b){ return a.p-b.p; });
  var lim = k==="r" ? 10 : (k==="s" ? 8 : 0), flD = k==="r" ? R.flr : (k==="s" ? R.fls : null);
  var h=['<div class="card st" style="--i:3">'+cardHead("Ergebnisse")+'<div class="seg sm" role="group" aria-label="Session" style="margin-bottom:8px">'+
    segBtns("sess", k, sess.map(function(s){ return [s, SESSSHORT[s]]; }))+'</div>'+wxLine(R, k)];
  if(!rows.length && !dnfs.length){
    h.push('<div class="empty small">'+esc(SESSLBL[k])+' noch nicht eingetragen.</div></div>');
    return h.join("");
  }
  h.push('<div class="list">');
  rows.forEach(function(x,i){
    var extra=[];
    if(k==="r"){
      var g=null, q=R.q[x.d]; if(isNum(q)) g=q-x.p;
      if(g) extra.push('<span class="tagp '+(g>0 ? 'g' : 'r')+'">'+(g>0 ? '▲ '+g : '▼ '+(-g))+'</span>');
    }
    if(k==="s" && R.sq[x.d]!=null && isNum(R.sq[x.d])){ var g2=R.sq[x.d]-x.p; if(g2) extra.push('<span class="tagp '+(g2>0?'g':'r')+'">'+(g2>0?'▲ '+g2:'▼ '+(-g2))+'</span>'); }
    if(flD===x.d) extra.push('<span class="tagp p">'+ico(IC.bolt,11,2.4)+' Schnellste</span>');
    var pts = k==="r" && x.p<=10 ? RACE_PTS[x.p] : (k==="s" && x.p<=8 ? cfg().sprint[x.p] : (k==="q" && x.p===1 && cfg().qualy ? cfg().qualy : 0));
    h.push('<button type="button" class="li st" style="--i:'+(i+4)+';padding-inline:0" data-act="driver" data-d="'+x.d+'">'+
      '<span class="pos '+(x.p===1 ? 'g' : x.p===2 ? 's' : x.p===3 ? 'b' : '')+'" style="width:34px">P'+x.p+'</span>'+dLogo(x.d,30)+
      '<span class="who"><span class="n">'+esc(dname(x.d))+'</span><span class="m">'+esc((teamOfD(x.d)||{}).name||"")+'</span></span><span class="brk">'+extra.join("")+
      (pts ? '<span class="tagp g">+'+pts+'</span>' : '')+'</span></button>');
  });
  dnfs.forEach(function(d2){
    h.push('<div class="li" style="padding-inline:0"><span class="pos" style="width:34px;font-size:14px">–</span>'+dLogo(d2,30)+
      '<span class="who"><span class="n">'+esc(dname(d2))+'</span></span><span class="tagp r">DNF</span></div>');
  });
  h.push('</div></div>');
  return h.join("");
}
function wxLine(R, k){
  var w=normWx((R.wx||{})[k]);
  if(!w) return '<div class="wxline"><span class="muted">Wetter nicht eingetragen</span></div>';
  return '<div class="wxline">'+PH.map(function(p){ var d=wxDef(w[p[0]]);
    return '<span class="wxph"><span class="wxk">'+p[1]+'</span>'+(d ? wxIcon(d[0],18)+'<span>'+esc(d[1])+'</span>' : '<span class="muted">\u2013</span>')+'</span>'; }).join("")+'</div>';
}
function wxPicker(R, k){
  var w=normWx((R.wx||{})[k])||{};
  return '<div class="field"><span class="lbl2">Wetter '+esc(SESSLBL[k])+'</span><div class="wxgrid">'+PH.map(function(p){
    return '<span class="wxk">'+p[1]+'</span><div class="wxopts">'+WX.map(function(x){
      return '<button type="button" class="wxbtn" data-act="e-wx" data-ph="'+p[0]+'" data-v="'+x[0]+'" aria-pressed="'+(w[p[0]]===x[0])+'" aria-label="'+p[1]+': '+x[1]+'" title="'+x[1]+'">'+wxIcon(x[0],20)+'</button>';
    }).join("")+'</div>';
  }).join("")+'</div><span class="small muted">Anfang füllt Mitte und Ende mit, solange die noch leer sind.</span></div>';
}
/* Bemerkungen: allgemein, je Session, zu einzelnen Fahrern und Reifen */
function memoOf(){ var R=S.res[ui.race]; if(!R.memo) R.memo=blankMemo(); return R.memo; }
function drvSelect(cur, attrs, emptyLabel){
  return '<select class="inp" '+attrs+'><option value="">'+esc(emptyLabel)+'</option>'+S.drivers.slice(0,ND).map(function(dv,d){
    return '<option value="'+d+'"'+(cur===d ? ' selected' : '')+'>'+(dv.num ? '#'+esc(dv.num)+' ' : '')+esc(dv.name)+'</option>'; }).join("")+'</select>';
}
function memoBlock(id){
  var R=S.res[id], M=R.memo||blankMemo(), sess=sessionsOf(id);
  var tabs=[["gen","Allgemein"]].concat(sess.map(function(k){ return [k, SESSSHORT[k]]; })).concat([["drv","Fahrer"],["ty","Reifen"]]);
  if(!tabs.some(function(t){ return t[0]===ui.memoTab; })) ui.memoTab="gen";
  var t=ui.memoTab, h='<div class="field"><span class="lbl2">Bemerkungen</span><div class="chips memotabs" role="group" aria-label="Bemerkungen zu">'+tabs.map(function(x){ return '<button type="button" class="chip" data-act="memo-tab" data-v="'+x[0]+'" aria-pressed="'+(x[0]===t)+'">'+esc(x[1])+'</button>'; }).join("")+'</div>';
  if(t==="gen") h+='<textarea class="notes" id="memo-gen-'+esc(id)+'" data-inp="memo-gen" placeholder="z. B. Safety-Car, Strafen, Strategie">'+esc(R.notes||"")+'</textarea>';
  else if(t==="drv"){
    h+=M.drv.map(function(x,i){
      return '<div class="memocard"><div class="row" style="flex-wrap:nowrap">'+drvSelect(x.d, 'data-chg="memo-drv-d" data-i="'+i+'" aria-label="Fahrer"', "\u2013 Fahrer wählen \u2013")+
        '<button type="button" class="iconbtn" data-act="memo-del" data-l="drv" data-i="'+i+'" aria-label="Notiz löschen">'+ico(IC.trash,16)+'</button></div>'+
        '<textarea class="notes" data-inp="memo-drv-t" data-i="'+i+'" placeholder="Was war bei diesem Fahrer los?">'+esc(x.text)+'</textarea></div>';
    }).join("")+'<button type="button" class="btn sm" data-act="memo-add" data-l="drv">'+ico(IC.plus,16,2.4)+' Notiz zu einem Fahrer</button>';
  }
  else if(t==="ty"){
    h+=M.tyres.map(function(x,i){
      return '<div class="memocard"><div class="row" style="flex-wrap:nowrap">'+drvSelect(x.d, 'data-chg="memo-ty-d" data-i="'+i+'" aria-label="Fahrer"', "Ich / allgemein")+
        '<select class="inp" style="width:auto" data-chg="memo-ty-s" data-i="'+i+'" aria-label="Session">'+sess.map(function(k){ return '<option value="'+k+'"'+(x.sess===k ? ' selected' : '')+'>'+esc(SESSSHORT[k])+'</option>'; }).join("")+'</select>'+
        '<button type="button" class="iconbtn" data-act="memo-del" data-l="tyres" data-i="'+i+'" aria-label="Reifen löschen">'+ico(IC.trash,16)+'</button></div>'+
        '<div class="tyrow">'+TYRES.map(function(c){ return '<button type="button" class="tyre-b" data-act="memo-ty-c" data-i="'+i+'" data-v="'+c[0]+'" aria-pressed="'+(x.c===c[0])+'" title="'+c[1]+'" aria-label="'+c[1]+'"><span class="tyre-i" style="--tc:'+c[2]+'">'+c[0]+'</span></button>'; }).join("")+'</div>'+
        '<div class="tygrid">'+
          '<label class="field"><span class="lbl2">Runden gefahren</span><input class="inp" type="number" inputmode="numeric" min="0" data-inp="memo-ty" data-f="laps" data-i="'+i+'" value="'+(x.laps==null ? '' : x.laps)+'"></label>'+
          '<label class="field"><span class="lbl2">Abgegeben in Runde</span><input class="inp" type="number" inputmode="numeric" min="0" data-inp="memo-ty" data-f="pit" data-i="'+i+'" value="'+(x.pit==null ? '' : x.pit)+'"></label>'+
          '<label class="field"><span class="lbl2">Höchster Verschleiß %</span><input class="inp" type="number" inputmode="numeric" min="0" max="100" data-inp="memo-ty" data-f="wear" data-i="'+i+'" value="'+(x.wear==null ? '' : x.wear)+'"></label>'+
        '</div></div>';
    }).join("")+'<button type="button" class="btn sm" data-act="memo-add" data-l="tyres">'+ico(IC.plus,16,2.4)+' Reifen hinzufügen</button>';
  }
  else h+='<textarea class="notes" data-inp="memo" data-k="'+t+'" placeholder="Notizen zu '+esc(SESSLBL[t])+'">'+esc(M[t]||"")+'</textarea>';
  return h+'</div>';
}
function powerCard(id, ri){
  var lp=latestPower(ri);
  if(!lp) return '';
  var rows=S.teams.map(function(t,k){ return {t:t, k:k, v:lp.vals[k]}; }).filter(function(x){ return isNum(x.v); });
  rows.sort(function(a,b){ return b.v-a.v; });
  var hint = lp.race.id===id ? "für dieses Rennen" : "Stand: "+esc(lp.race.name);
  return '<div class="card st" style="--i:2">'+cardHead("Autostärke vor dem GP", hint)+rows.map(function(x){
    return '<div class="brow">'+logoHtml(x.t,28)+'<span class="lbl" style="width:auto;flex:0 1 110px">'+esc(x.t.name)+'</span><span class="bar"><i style="width:'+x.v+'%;background:'+x.t.color+'"></i></span><span class="v num">'+x.v+'</span></div>';
  }).join("")+'</div>';
}
function entryCard(id){
  var R=S.res[id], open=ui.entryOpen;
  return '<div class="card st" style="--i:4">'+
    '<button type="button" class="collapse" data-act="entry-toggle" aria-expanded="'+open+'">'+
      '<span class="logo" style="--s:40px;border-radius:12px;background:var(--accent-soft);color:var(--accent)">'+ico(IC.pen,20)+'</span>'+
      '<span><span class="h2" style="display:block">Ergebnisse eintragen</span><span class="small muted">Plätze, Autostärke, Notizen</span></span>'+
      '<span class="chev">'+ico(IC.chev,20,2.4)+'</span></button>'+
    '<div class="reveal'+(open ? ' open' : '')+'"><div><div class="reveal-inner">'+
      '<button type="button" class="bigact photo" data-act="entry-open"><span class="ic">'+ico(IC.pen,22)+'</span><span><span class="tt">'+esc(SESSLBL[ui.sess])+' eintragen</span><br><span class="ds">Erste Buchstaben tippen, auf Weiter \u2013 fertig</span></span></button>'+
      '<button type="button" class="btn" data-act="power-hand">'+ico(IC.gauge,18)+' Autostärke vor diesem GP</button>'+
      memoBlock(id)+
      '<button type="button" class="btn danger sm" data-act="race-clear" style="align-self:flex-start">Dieses Wochenende leeren</button>'+
    '</div></div></div></div>';
}

/* ---------- Statistik ---------- */
function vStats(){
  var all=ui.statScope==="all", h=[];
  var multi=SV.seasons.length>1;
  h.push('<div class="seg st" style="--i:0" role="group" aria-label="Zeitraum">'+segBtns("stat-scope", ui.statScope, [["season","Diese Saison"],["all","Alle Saisons"+(multi ? " ("+SV.seasons.length+")" : "")]])+'</div>');
  var list = all ? career() : dStats(S);
  var keys = STATS.filter(function(s){ return all || !s.career; });
  if(!keys.some(function(s){ return s.k===ui.statKey; })) ui.statKey="pts";
  var def=statDef(ui.statKey);
  function logoOf(o){ return all ? logoHtml(o.team, 30) : dLogo(o.d, 30); }
  function act(o){ return all ? 'data-act="career" data-k="'+esc(o.key)+'"' : 'data-act="driver" data-d="'+o.d+'"'; }
  function best(k, low){
    var c=list.filter(function(o){ var v=statVal(o,k); return v!=null && (low || v>0); });
    c.sort(function(a,b){ return low ? statVal(a,k)-statVal(b,k) : statVal(b,k)-statVal(a,k); });
    return c[0] || null;
  }
  var hls=[["wins","Meiste Siege"],["poles","Pole-König"],["gain","Bester Überholer"],["dnf","Meiste Ausfälle"]];
  h.push('<div class="hl">'+hls.map(function(x,i){
    var o=best(x[0]), v=o ? statVal(o,x[0]) : null;
    return '<button type="button" class="hlc st" style="--i:'+(i+1)+'" '+(o ? act(o) : 'disabled')+'><span class="eyebrow">'+esc(x[1])+'</span>'+
      '<span class="v num"'+(o && v>0 ? ' data-cu="'+v+'"' : '')+'>'+(o ? (x[0]==="gain" ? signed(v) : v) : "–")+'</span>'+
      '<span class="w">'+(o ? logoOf(o).replace('--s:30px','--s:24px')+'<span>'+esc(o.name)+'</span>' : '<span class="muted">noch offen</span>')+'</span></button>';
  }).join("")+'</div>');
  h.push('<div class="chips st" style="--i:5" role="group" aria-label="Statistik wählen">'+keys.map(function(s){
    return '<button type="button" class="chip" data-act="stat-key" data-v="'+s.k+'" aria-pressed="'+(s.k===ui.statKey)+'">'+esc(s.l)+'</button>';
  }).join("")+'</div>');
  var rows=list.map(function(o){ return {o:o, v:statVal(o, def.k)}; });
  rows.sort(function(a,b){
    if(a.v==null && b.v==null) return natCmp(a.o.name,b.o.name);
    if(a.v==null) return 1; if(b.v==null) return -1;
    return (def.low ? a.v-b.v : b.v-a.v) || (b.o.pts-a.o.pts);
  });
  var vals=rows.filter(function(r){ return r.v!=null; }).map(function(r){ return r.v; });
  var mx=vals.length ? Math.max.apply(null, vals.map(Math.abs)) : 1; if(!mx) mx=1;
  h.push('<div class="card st" style="--i:6">'+cardHead(def.l, def.hint ? esc(def.hint) : (all ? esc(SV.name)+" · alle Saisons" : esc(S.name)))+
    rows.map(function(r,i){
      var o=r.o, w;
      if(r.v==null) w=0;
      else if(def.low) w=clamp((ND+1-r.v)/ND,0.02,1)*100;
      else w=Math.abs(r.v)/mx*100;
      var color = all ? (o.team ? o.team.color : "var(--ink-3)") : teamColor(o.d);
      if(def.signed && r.v<0) color="var(--red)";
      var shown = r.v==null ? "–" : (def.dec ? fmt1(r.v) : (def.signed ? signed(r.v) : r.v));
      return '<button type="button" class="brow st" style="--i:'+(i+7)+';width:100%;border:0;background:none;padding:2px 0;text-align:left;color:inherit" '+act(o)+'>'+
        '<span class="num" style="width:22px;text-align:right;color:var(--ink-3);font-weight:700">'+(i+1)+'</span>'+logoOf(o)+
        '<span class="lbl">'+(all ? '' : dNumSm(o.d))+esc(o.name)+'</span><span class="bar"><i style="width:'+w.toFixed(1)+'%;background:'+color+'"></i></span><span class="v num">'+shown+'</span></button>';
    }).join("")+'</div>');
  return h.join("");
}
function openDriver(d){ SH={type:"driver", d:d}; showSheet(); }
function sheetDriver(){
  var d=SH.d, ds=dStats(S)[d], t=teamOfD(d), mates=teammates(d);
  var h=['<div class="row" style="gap:14px;flex-wrap:nowrap">'+dLogo(d,64)+'<div style="min-width:0"><div style="font:800 28px/1.05 var(--display);text-transform:uppercase">'+esc(dname(d))+'</div>'+
    '<div class="muted">'+(dnum(d) ? '#'+esc(dnum(d))+' · ' : '')+esc(t ? t.name : "")+' · '+esc(S.name)+'</div></div></div>'];
  var boxes=[["WM-Platz", ds.pts>0 ? ds.rank+"." : "–"],["Punkte", ds.pts],["Siege", ds.wins],["Podien", ds.pods],["Poles", ds.poles],["Ausfälle", ds.dnf],
    ["Ø Start", fmt1(ds.avgS)],["Ø Ziel", fmt1(ds.avgF)],["Plätze gut", signed(ds.gain)],["Top-10-Starts", ds.t10s],["Top-10-Ziele", ds.t10f],["Schnellste R.", ds.fl]];
  h.push('<div class="sgrid">'+boxes.map(function(b){ return '<div class="sbox"><span class="v num">'+b[1]+'</span><span class="k">'+b[0]+'</span></div>'; }).join("")+'</div>');
  if(mates.length){
    h.push('<div class="card" style="background:var(--card-2);border:0"><div class="eyebrow" style="margin-bottom:6px">Quali-Duell im Team</div>'+mates.map(function(m){
      var w=0, l=0;
      S.races.forEach(function(R){ var a=S.res[R.id].q[d], b=S.res[R.id].q[m]; if(isNum(a) && isNum(b)){ if(a<b) w++; else l++; } });
      return '<div class="row" style="justify-content:space-between"><span>gegen <b>'+esc(dname(m))+'</b></span><span style="font:800 22px var(--display)" class="num">'+w+' : '+l+'</span></div>';
    }).join("")+'</div>');
  }
  h.push('<div class="eyebrow">Rennen für Rennen</div><div class="strip">'+S.races.map(function(R){
    var Rs=S.res[R.id];
    return '<button type="button" class="rs" style="border:0;background:none" data-act="goto-race" data-r="'+esc(R.id)+'">'+esc(raceCode(R))+cellHtml(Rs.r[d], Rs.flr===d)+'<span>Q'+(isNum(Rs.q[d]) ? Rs.q[d] : '–')+'</span></button>';
  }).join("")+'</div>');
  var labels=[], vals=[], qv=[];
  S.races.forEach(function(R){ if(raceDone(R.id)){ labels.push(raceCode(R)); var v=S.res[R.id].r[d], q=S.res[R.id].q[d]; vals.push(isNum(v) ? v : null); qv.push(isNum(q) ? q : null); } });
  h.push('<div class="eyebrow">Start- und Zielplätze</div>'+lineChart({id:"drv", labels:labels, invert:true, yMin:1, yMax:ND, ticks:[1,5,10,15,20], dots:true, h:200,
    label:"Start- und Zielplätze von "+dname(d), yFmt:function(v){ return "P"+v; },
    series:[{key:"r", label:"Ziel", color:teamColor(d), vals:vals},{key:"q", label:"Start", color:"var(--ink-3)", vals:qv}],
    emptyText:"Ab zwei Rennen siehst du hier den Verlauf."}));
  if(SV.seasons.length>1){
    var key=String(dname(d)).trim().toLowerCase(), c=null;
    career().forEach(function(a){ if(a.key===key) c=a; });
    if(c && c.seasons>1) h.push('<button type="button" class="btn wide" data-act="career" data-k="'+esc(c.key)+'">Karriere ansehen · '+plural(c.seasons,"Saison","Saisons")+', '+c.pts+' Punkte</button>');
  }
  return {title:"Fahrer", body:h.join("")};
}
function sheetCareer(){
  var a=null; career().forEach(function(x){ if(x.key===SH.k) a=x; });
  if(!a) return {title:"Karriere", body:'<p class="muted">Nicht gefunden.</p>'};
  var h=['<div class="row" style="gap:14px;flex-wrap:nowrap">'+logoHtml(a.team,64)+'<div style="min-width:0"><div style="font:800 28px/1.05 var(--display);text-transform:uppercase">'+esc(a.name)+'</div>'+
    '<div class="muted">'+plural(a.seasons,"Saison","Saisons")+' · '+esc(a.teams.join(", "))+'</div></div></div>'];
  if(a.titles.length) h.push('<div class="champ" style="padding:12px"><span class="cup" style="width:44px;height:44px">'+ico(IC.cup,24)+'</span><div><div class="eyebrow">'+plural(a.titles.length,"Titel","Titel")+'</div><b>'+esc(a.titles.join(", "))+'</b></div></div>');
  var boxes=[["Punkte",a.pts],["Siege",a.wins],["Podien",a.pods],["Poles",a.poles],["Ausfälle",a.dnf],["Bestes Ergebnis",a.best ? "P"+a.best : "–"],
    ["Ø Start",fmt1(a.avgS)],["Ø Ziel",fmt1(a.avgF)],["Plätze gut",signed(a.gain)],["Top-10-Starts",a.t10s],["Top-10-Ziele",a.t10f],["Schnellste R.",a.fl]];
  h.push('<div class="sgrid">'+boxes.map(function(b){ return '<div class="sbox"><span class="v num">'+b[1]+'</span><span class="k">'+b[0]+'</span></div>'; }).join("")+'</div>');
  return {title:"Karriere", body:h.join("")};
}

/* ---------- Prognose ---------- */
var champShown={};
function vPred(){
  var st=standings(), rem=S.races.filter(function(R){ return !raceDriven(R.id); });
  var maxes=rem.map(function(R){ return remMax(R.id); }), total=maxes.reduce(function(a,b){ return a+b; },0);
  var L=st[0], R2=st[1], done=S.races.length-rem.length, i;
  var started=L && L.pts>0;
  var champ=started && (rem.length===0 || (R2 && L.pts>R2.pts+total)) ? L : null;
  var h=[];
  if(champ){
    var ck=S.id+":"+champ.d;
    if(!champShown[ck]){ champShown[ck]=true; pendingConfetti=true; }
    h.push('<div class="champ st" style="--i:0"><span class="cup">'+ico(IC.cup,30)+'</span><div style="min-width:0"><div class="eyebrow">'+esc(S.name)+'</div>'+
      '<div style="font:800 26px/1.05 var(--display);text-transform:uppercase">'+esc(dname(champ.d))+' ist Meister!</div>'+
      '<div class="small muted">'+(rem.length ? 'Vorzeitig entschieden, '+plural(rem.length,"Rennen","Rennen")+' vor Schluss.' : 'Saison beendet mit '+champ.pts+' Punkten.')+'</div></div></div>');
  }
  var clinch=-1, acc=0;
  if(!champ && started) for(i=0;i<rem.length;i++){ acc+=maxes[i]; if(R2 && (L.pts+acc)>(R2.pts+(total-acc))){ clinch=i; break; } }
  function kpi(k,v,s,n){ return '<div class="kpi st" style="--i:'+n+'"><div class="eyebrow">'+k+'</div><div class="v">'+v+'</div><div class="s">'+s+'</div></div>'; }
  h.push('<div class="kpis">'+
    kpi("Runde", done+' / '+S.races.length, rem.length ? 'nächstes: '+esc(raceLabel(rem[0])) : 'alle Rennen eingetragen', 1)+
    kpi("Noch zu vergeben", '<span class="num" data-cu="'+total+'">'+total+'</span> Pkt', rem.length ? 'max. '+Math.max.apply(null,maxes)+' pro Wochenende' : 'nichts mehr offen', 2)+
    kpi("Abstand an der Spitze", started ? (L.pts-(R2 ? R2.pts : 0))+' Pkt' : '–', started ? esc(dname(L.d))+' vor '+esc(dname(R2.d)) : 'noch keine Punkte', 3)+
    (champ ? kpi("Entschieden", esc(dname(champ.d)), "Titel vergeben", 4) :
      kpi("Frühester Titelgewinn", !started ? '–' : (clinch<0 ? 'im Finale' : esc(rem[clinch].name)), !started ? 'sobald Punkte vergeben sind' : (clinch<0 ? 'rechnerisch erst am Ende möglich' : 'wenn '+esc(dname(L.d))+' alles holt'), 4))+
    '</div>');
  var sim=simulate(st), prob=sim.p.slice();
  if(champ){ prob=prob.map(function(){ return 0; }); prob[champ.d]=1; }
  var mdl=sim.model;
  var others=SV.seasons.filter(function(se){ return se!==S; });
  var setCard='<div class="card st" style="--i:5">'+cardHead("Grundlage der Prognose")+
    '<div class="lbl2" style="margin-bottom:6px">Diese Saisons einrechnen</div><div class="chips" style="flex-wrap:wrap">'+
    '<button type="button" class="chip tog" aria-pressed="true" disabled title="Die aktuelle Saison zählt immer">'+ico(IC.check,13,3)+esc(S.name)+'</button>'+
    others.map(function(se){ var on=predUse(se); return '<button type="button" class="chip tog" data-act="pred-use" data-s="'+esc(se.id)+'" aria-pressed="'+on+'">'+(on ? ico(IC.check,13,3) : '')+esc(se.name)+'</button>'; }).join("")+'</div>'+
    (others.length ? '' : '<p class="small muted" style="margin:4px 0 0">Mehr Saisons gibt es erst, wenn du eine neue Saison anlegst.</p>')+
    '<div class="lbl2" style="margin:14px 0 4px">Bisherige Form ↔ Autostärke</div>'+
    '<input type="range" class="range" id="predw" min="0" max="100" step="5" value="'+Math.round(APP.prefs.predW*100)+'" data-inp="predw" aria-label="Gewichtung Autostärke"'+(mdl.car ? '' : ' disabled')+'>'+
    '<div class="row small muted" style="justify-content:space-between"><span>Form '+(100-Math.round(APP.prefs.predW*100))+' %</span><span id="predw-l">Auto '+Math.round(APP.prefs.predW*100)+' %</span></div>'+
    '<p class="small muted" style="margin:8px 0 0">'+(mdl.car ? 'Autostärke vom GP '+esc(mdl.car.race.name)+'. ' : 'Noch keine Autostärke eingetragen: Im Tab Teams kannst du sie vor jedem GP eintragen. ')+
      (mdl.prior.length ? 'Die aktuelle Saison zählt zu '+Math.round(mdl.w*100)+' %, die gewählten Vorsaisons zu '+(100-Math.round(mdl.w*100))+' % – mit jedem Rennen verschiebt sich das zur aktuellen Saison.' :
        'Es zählt nur die aktuelle Saison.')+' Hochgerechnet aus '+SIM_N.toLocaleString("de-DE")+' simulierten Saisonverläufen.</p></div>';
  var ranked=st.map(function(r){ return r.d; }).filter(function(d){ return prob[d]>=0.0005; }).sort(function(a,b){ return prob[b]-prob[a]; }).slice(0,10);
  var titleCard='<div class="card st" style="--i:6">'+cardHead("Titelchance", rem.length ? plural(rem.length,"Rennen","Rennen")+" übrig" : "")+
    (ranked.length ? ranked.map(function(d,j){
      return '<button type="button" class="brow" style="width:100%;border:0;background:none;padding:0;color:inherit;text-align:left" data-act="driver" data-d="'+d+'">'+dLogo(d,32)+'<span class="lbl">'+esc(dname(d))+'</span>'+
        '<span class="bar"><i style="width:'+Math.max(1.5, prob[d]*100).toFixed(1)+'%;background:'+teamColor(d)+';animation-delay:'+(j*60)+'ms"></i></span><span class="v num">'+pctTxt(prob[d])+'</span></button>';
    }).join("") : '<div class="empty small">Noch keine Grundlage für eine Prognose.</div>')+'</div>';
  var nextCard='';
  if(rem.length && !champ){
    var nx=sim.next.map(function(p,d){ return {d:d,p:p}; }).filter(function(x){ return x.p>0; }).sort(function(a,b){ return b.p-a.p; }).slice(0,3);
    nextCard='<div class="card st" style="--i:7">'+cardHead("Nächstes Rennen · "+rem[0].name, "Siegchance")+'<div class="wins3">'+nx.map(function(x){
      return '<button type="button" class="pd" data-act="driver" data-d="'+x.d+'">'+dLogo(x.d,40)+'<span class="n">'+esc(dname(x.d))+'</span><span class="v num">'+pctTxt(x.p)+'</span></button>';
    }).join("")+'</div></div>';
  }
  var calcCard='<div class="card flush st" style="--i:8"><div class="chead"><h2>Rechnerischer Stand</h2><span class="hint">Max = alles gewinnen</span></div><div class="list">'+st.slice(0,12).map(function(r,idx){
    var maxPoss=r.pts+total, alive=champ ? r.d===champ.d : (idx===0 || maxPoss>=L.pts);
    var tag=champ ? (r.d===champ.d ? '<span class="tagp a">Meister</span>' : '<span class="tagp n">–</span>') : (alive ? '<span class="tagp g">im Rennen</span>' : '<span class="tagp r">raus</span>');
    return '<div class="li" style="'+(alive ? '' : 'opacity:.55')+'"><span class="pos">'+(idx+1)+'</span>'+dLogo(r.d,28)+'<span class="who"><span class="n">'+esc(dname(r.d))+'</span><span class="m">'+r.pts+' Pkt · max. '+maxPoss+'</span></span>'+tag+'</div>';
  }).join("")+'</div></div>';
  h.push('<div class="cols"><div class="stack">'+titleCard+nextCard+'</div><div class="stack">'+setCard+calcCard+'</div></div>');
  return h.join("");
}

/* ---------- Teamvergleich ---------- */
function h2h(a, b, k){
  var wa=0, wb=0;
  S.races.forEach(function(R){
    var x=S.res[R.id][k][a], y=S.res[R.id][k][b], xn=isNum(x), yn=isNum(y);
    if(xn && yn){ if(x<y) wa++; else if(y<x) wb++; }
    else if(xn && y===DNF) wa++;
    else if(yn && x===DNF) wb++;
  });
  return [wa, wb];
}
function shortName(d){
  var n=String(dname(d)).trim();
  if(n.length<=13) return n;
  var p=n.split(/\s+/); return p[p.length-1];
}
function dNumSm(d){ var n=dnum(d), t=teamOfD(d); return n ? '<span class="dnum sm" style="background:'+(t ? t.color : "var(--card-2)")+';color:'+inkOn(t ? t.color : "#333")+'">'+esc(n)+'</span>' : ''; }
function dNum(d, t){
  var n=dnum(d);
  return '<span class="dnum" style="background:'+t.color+';color:'+inkOn(t.color)+'">'+(n ? esc(n) : '\u2013')+'</span>';
}
function duelRow(label, va, vb, color, opt){
  opt=opt||{};
  var na=va==null ? null : +va, nb=vb==null ? null : +vb, fa=0.5;
  if(na!=null && nb!=null){
    if(opt.low) fa=(na+nb)>0 ? nb/(na+nb) : 0.5;
    else fa=(na+nb)>0 ? na/(na+nb) : 0.5;
  }
  var aWin = na!=null && nb!=null && (opt.low ? na<nb : na>nb), bWin = na!=null && nb!=null && (opt.low ? nb<na : nb>na);
  function show(v){ return v==null ? "\u2013" : (opt.dec ? fmt1(v) : String(v)); }
  return '<div class="duel"><span class="dv'+(aWin ? ' win' : '')+'">'+show(na)+'</span>'+
    '<span class="dmid"><span class="dl">'+esc(label)+'</span><span class="dbar"><i style="width:'+(fa*100).toFixed(1)+'%;background:'+color+'"></i><i style="flex:1;background:'+color+';opacity:.28"></i></span></span>'+
    '<span class="dv r'+(bWin ? ' win' : '')+'">'+show(nb)+'</span></div>';
}
function teamCompareCards(n0){
  var st=standings(), rank={}, ds=dStats(S), h=[];
  st.forEach(function(r,i){ rank[r.d]=i; });
  teamStandings().forEach(function(r, pos){
    var t=S.teams[r.t], drv=r.drivers.slice().sort(function(a,b){ return rank[a]-rank[b]; });
    var head='<div class="row" style="flex-wrap:nowrap;gap:12px;margin-bottom:10px">'+logoHtml(t,44)+
      '<div style="min-width:0;flex:1"><div style="font:800 19px/1.1 var(--display);text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(t.name)+'</div>'+
      '<div class="small muted">'+(pos+1)+'. der Teamwertung \u00B7 '+r.pts+' Pkt</div></div></div>';
    if(drv.length<2){
      h.push('<div class="card st" style="--i:'+(n0+pos)+'">'+head+'<p class="small muted" style="margin:0">Nur ein Fahrer in diesem Team.</p></div>');
      return;
    }
    var a=drv[0], b=drv[1], A=ds[a], B=ds[b], q=h2h(a,b,"q"), rr=h2h(a,b,"r");
    var body='<div class="duelnames"><span>'+dNum(a,t)+'<b>'+esc(shortName(a))+'</b></span><span class="r"><b>'+esc(shortName(b))+'</b>'+dNum(b,t)+'</span></div>'+
      duelRow("Punkte", A.pts, B.pts, t.color)+
      duelRow("Quali-Duell", q[0], q[1], t.color)+
      duelRow("Rennduell", rr[0], rr[1], t.color)+
      duelRow("Siege", A.wins, B.wins, t.color)+
      duelRow("Podien", A.pods, B.pods, t.color)+
      duelRow("Ø Startplatz", A.avgS, B.avgS, t.color, {low:true, dec:true})+
      duelRow("Ø Zielplatz", A.avgF, B.avgF, t.color, {low:true, dec:true})+
      duelRow("Ausfälle", A.dnf, B.dnf, t.color, {low:true});
    if(drv.length>2) body+='<p class="small muted" style="margin:8px 0 0">Außerdem im Team: '+drv.slice(2).map(function(d){ return esc(dname(d)); }).join(", ")+'</p>';
    h.push('<div class="card st duelcard" style="--i:'+(n0+pos)+'">'+head+body+'</div>');
  });
  return '<div class="h2 st" style="--i:'+n0+';margin-top:4px">Teamvergleich</div>'+h.join("");
}

/* ---------- Teams ---------- */
function powerTarget(){ var i=nextRaceIdx(); if(i<0) i=S.races.length-1; return i>=0 ? S.races[i].id : null; }
function vTeams(){
  var h=[], tgt=powerTarget(), tR=tgt ? S.races[raceIndex(tgt)] : null;
  if(tR) h.push('<button type="button" class="cta st" style="--i:0" data-act="power-hand" data-r="'+esc(tgt)+'"><span class="ic">'+ico(IC.gauge,26)+'</span>'+
    '<span><span class="tt">Autostärke eintragen</span><br><span class="ds">Wie im R&D-Vergleich im Spiel \u00B7 vor dem GP '+esc(tR.name)+'</span></span></button>');
  var ts=teamStandings(), lead=ts[0] ? Math.max(1,ts[0].pts) : 1;
  var stand='<div class="card flush st" style="--i:2"><div class="chead"><h2>Teamwertung</h2><span class="hint">'+esc(S.name)+'</span></div><div class="list">'+ts.map(function(r,i){
    var t=S.teams[r.t];
    return '<div class="li" style="flex-wrap:wrap"><span class="pos '+(r.pts>0 ? (i===0 ? 'g' : i===1 ? 's' : i===2 ? 'b' : '') : '')+'">'+(i+1)+'</span>'+logoHtml(t,48)+
      '<span class="who"><span class="n">'+esc(t.name)+'</span><span class="m">'+r.drivers.map(function(d){ return esc(dname(d)); }).join(" · ")+'</span></span><span class="val num">'+r.pts+'</span>'+
      '<span class="bar" style="flex-basis:100%;margin-left:38px;height:6px"><i style="width:'+(r.pts/lead*100).toFixed(1)+'%;background:'+t.color+'"></i></span></div>';
  }).join("")+'</div></div>';
  // Entwicklung der Autos
  var idxs=[]; S.races.forEach(function(R,i){ var p=S.power[R.id]; if(p && p.some(function(v){ return v!=null; })) idxs.push(i); });
  var dev;
  if(idxs.length){
    var series=S.teams.map(function(t,k){ return {key:"p"+k, label:t.name, color:t.color, vals:idxs.map(function(i){ var v=S.power[S.races[i].id][k]; return isNum(v) ? v : null; })}; })
      .filter(function(s){ return s.vals.some(function(v){ return v!=null; }); });
    var lastVals=S.power[S.races[idxs[idxs.length-1]].id];
    var curRows=S.teams.map(function(t,k){ return {t:t, v:lastVals[k]}; }).filter(function(x){ return isNum(x.v); }).sort(function(a,b){ return b.v-a.v; });
    var firstVals=S.power[S.races[idxs[0]].id];
    dev='<div class="card st" style="--i:3">'+chartHead("Entwicklung der Autos", "dev", idxs.length>1)+
      (idxs.length>1 ? lineChart({id:"dev", series:series, labels:idxs.map(function(i){ return raceCode(S.races[i]); }), dots:true, label:"Autostärke pro Team",
        tipTitle:function(j){ return "vor "+S.races[idxs[j]].name; }}) : '<p class="small muted" style="margin:0 0 8px">Ab zwei Messungen siehst du hier, wie sich die Teams entwickeln.</p>')+
      '<div style="margin-top:8px">'+curRows.map(function(x){
        var k=S.teams.indexOf(x.t), f=firstVals[k], dlt=(idxs.length>1 && isNum(f)) ? x.v-f : null;
        return '<div class="brow">'+logoHtml(x.t,28)+'<span class="lbl" style="width:auto;flex:0 1 110px">'+esc(x.t.name)+'</span><span class="bar"><i style="width:'+x.v+'%;background:'+x.t.color+'"></i></span>'+
          '<span class="v num">'+x.v+'</span>'+(dlt!==null ? '<span class="tagp '+(dlt>0 ? 'g' : dlt<0 ? 'r' : 'n')+'" style="min-width:44px;justify-content:center">'+signed(dlt)+'</span>' : '')+'</div>';
      }).join("")+'</div></div>';
  } else {
    dev='<div class="card st" style="--i:3">'+cardHead("Entwicklung der Autos")+emptyBox(IC.gauge,"Noch keine Messung","Trag vor einem Grand Prix die Autostärke ein. Dann siehst du hier, wie sich die Teams über die Saison entwickeln.")+'</div>';
  }
  var prev=prevSeasonOf(S), xfer='';
  if(prev){
    var list=seasonDiff(prev, S.drivers, S.dTeam, S.teams);
    xfer='<div class="card st" style="--i:4">'+cardHead("Fahrerwechsel", "seit "+esc(prev.name))+(list.length ? '<ul class="xl">'+list.map(function(x){
      if(x.type==="move") return '<li><span class="xi" style="background:var(--purple-soft);color:var(--purple)">⇄</span><span><b>'+esc(x.name)+'</b> wechselt von '+esc(x.from)+' zu <b>'+esc(x.to)+'</b></span></li>';
      if(x.type==="in") return '<li><span class="xi" style="background:var(--green-soft);color:var(--green)">+</span><span><b>'+esc(x.name)+'</b> kommt neu zu <b>'+esc(x.to)+'</b></span></li>';
      return '<li><span class="xi" style="background:var(--red-soft);color:var(--red)">−</span><span><b>'+esc(x.name)+'</b> verlässt das Feld (zuletzt '+esc(x.from)+')</span></li>';
    }).join("")+'</ul>' : '<p class="small muted" style="margin:0">Keine Wechsel – alle Fahrer bleiben in ihren Teams.</p>')+'</div>';
  }
  h.push('<div class="cols"><div class="stack">'+stand+'</div><div class="stack">'+dev+xfer+'</div></div>');
  return h.join("");
}

/* ---------- Einstellungen ---------- */
function vSettings(){
  var h=['<div class="setgrid">'];
  h.push('<div class="stack">');
  h.push('<div class="card st" style="--i:0;display:flex;flex-direction:column;gap:12px">'+cardHead("Saison")+
    '<div class="field"><label for="season-name">Name der Saison</label><input class="inp" id="season-name" data-inp="season-name" value="'+esc(S.name)+'"></div>'+
    '<div class="field"><span class="lbl2">Serie</span><div class="seg" role="group" aria-label="Serie">'+segBtns("mode", S.mode, [["f1","F1"],["f2","F2"]])+'</div>'+
    '<span class="small muted">'+esc(MODES[S.mode].desc)+'</span></div>'+
    '<div class="row"><button type="button" class="btn grow" data-act="new-season">'+ico(IC.plus,18)+' Neue Saison</button><button type="button" class="btn danger" data-act="del-season"'+(SV.seasons.length<2 ? ' disabled title="Die einzige Saison kann nicht gelöscht werden"' : '')+'>Saison löschen</button></div></div>');
  // Fahrer
  h.push('<div class="card st" style="--i:1">'+cardHead("Fahrer", "Nummer · Name · Team")+
    '<div class="field" style="margin-bottom:8px"><span class="lbl2">Fahrer im Feld</span><div class="seg sm" role="group" aria-label="Fahrer im Feld">'+segBtns("nd", String(ND), [["20","20"],["22","22"],["24","24"]])+'</div></div>'+
    S.drivers.slice(0,ND).map(function(dv,d){
    return '<div class="drvrow"><input class="inp n" id="dnum-'+d+'" data-inp="dnum" data-d="'+d+'" value="'+esc(dv.num||"")+'" inputmode="numeric" maxlength="3" aria-label="Startnummer Fahrer '+(d+1)+'">'+
      '<input class="inp" id="dname-'+d+'" data-inp="dname" data-d="'+d+'" value="'+esc(dv.name)+'" aria-label="Name Fahrer '+(d+1)+'">'+
      '<span class="tsel">'+dLogo(d,36)+'<select class="inp" id="dteam-'+d+'" data-chg="dteam" data-d="'+d+'" aria-label="Team von '+esc(dv.name)+'">'+
      S.teams.map(function(t,k){ return '<option value="'+k+'"'+(S.dTeam[d]===k ? ' selected' : '')+'>'+esc(t.name)+'</option>'; }).join("")+'</select></span></div>';
  }).join("")+'</div>');
  h.push('</div><div class="stack">');
  // Teams
  h.push('<div class="card st" style="--i:2">'+cardHead("Teams & Logos", "Logo antippen zum Ändern")+S.teams.map(function(t,k){
    var used=S.dTeam.indexOf(k)>=0;
    return '<div class="srow" style="flex-wrap:wrap">'+
      '<button type="button" class="logobtn" data-act="logo" data-k="'+k+'" aria-label="Logo für '+esc(t.name)+' wählen">'+logoHtml(t,50)+'<span class="ed">'+ico(IC.pen,12,2.4)+'</span></button>'+
      '<div class="grow" style="display:flex;flex-direction:column;gap:6px;min-width:150px">'+
        '<input class="inp" id="tname-'+k+'" data-inp="tname" data-k="'+k+'" value="'+esc(t.name)+'" aria-label="Teamname">'+
        '<div class="row" style="flex-wrap:nowrap"><input class="inp" style="width:84px;text-transform:uppercase" id="tshort-'+k+'" data-inp="tshort" data-k="'+k+'" value="'+esc(t.short)+'" maxlength="4" placeholder="'+esc(shortOf({name:t.name}))+'" aria-label="Kürzel">'+
        '<input type="color" id="tcolor-'+k+'" data-chg="tcolor" data-k="'+k+'" value="'+t.color+'" aria-label="Teamfarbe">'+
        (t.logo ? '<button type="button" class="btn sm ghost" data-act="logo-rm" data-k="'+k+'">Logo weg</button>' : '')+
        (!used && S.teams.length>1 ? '<button type="button" class="iconbtn" data-act="team-del" data-k="'+k+'" aria-label="Team löschen">'+ico(IC.trash,18)+'</button>' : '')+'</div></div></div>';
  }).join("")+'<button type="button" class="btn wide" data-act="team-add" style="margin-top:8px">'+ico(IC.plus,18)+' Eigenes Team hinzufügen</button>'+
    '<p class="small muted" style="margin:8px 0 0">Tipp: Zeichne dein Logo, fotografiere es und wähle das Foto hier aus. Es wird automatisch quadratisch zugeschnitten.</p></div>');
  // Kalender
  h.push('<div class="card st" style="--i:3">'+cardHead("Rennkalender", "Flagge · Name · Sprint")+
    '<div class="row" style="justify-content:space-between;flex-wrap:nowrap;margin-bottom:8px"><span><b>Anzahl Strecken</b><br><span class="small muted">zählt von oben nach unten</span></span>'+
    '<span class="stepper"><button type="button" class="iconbtn" data-act="race-count" data-v="-1" aria-label="Eine Strecke weniger"'+(S.races.length<=1 ? ' disabled' : '')+'>'+ico('<path d="M5 12h14"/>',18,2.6)+'</button>'+
    '<input class="inp n" id="race-count" type="number" inputmode="numeric" min="1" max="40" value="'+S.races.length+'" data-chg="race-count" aria-label="Anzahl Strecken">'+
    '<button type="button" class="iconbtn" data-act="race-count" data-v="1" aria-label="Eine Strecke mehr">'+ico(IC.plus,18,2.6)+'</button></span></div>'+
    '<div class="calsort" id="calsort">'+S.races.concat(S.spare||[]).map(function(R,i){
    var off=i>=S.races.length;
    return (i===S.races.length ? '<div class="caldiv">Nicht im Kalender \u2013 hochziehen oder Anzahl erhöhen</div>' : '')+'<div class="srow calrow'+(off ? ' off' : '')+'" data-r="'+esc(R.id)+'"><span class="grip" aria-label="Ziehen zum Verschieben">'+ico('<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',18,2)+'</span>'+
      '<span class="calno num">'+(off ? '\u2013' : (i+1))+'</span>'+
      '<input class="inp fl" id="rflag-'+esc(R.id)+'" data-inp="rflag" data-r="'+esc(R.id)+'" value="'+esc(R.flag)+'" aria-label="Flagge">'+
      '<input class="inp grow" id="rname-'+esc(R.id)+'" data-inp="rname" data-r="'+esc(R.id)+'" value="'+esc(R.name)+'" aria-label="Streckenname">'+
      '<button type="button" class="switch" role="switch" data-act="race-sprint" data-r="'+esc(R.id)+'" aria-checked="'+(!!S.sprints[R.id])+'" aria-label="Sprint in '+esc(R.name)+'" title="Sprint"></button>'+
      '<button type="button" class="iconbtn" style="width:36px" data-act="race-del" data-r="'+esc(R.id)+'" aria-label="Rennen löschen">'+ico(IC.trash,16)+'</button></div>';
  }).join("")+'</div>'+
    '<p class="small muted" style="margin:8px 0 0">Zum Verschieben eine Strecke lange gedrückt halten (oder am Griff links ziehen) und nach oben oder unten ziehen. Der Schalter aktiviert Sprint-Quali und Sprint.</p></div>');
  h.push('</div>');
  // Daten
  h.push('<div class="stack">'+dataExportBlock()+dataImportBlock(false)+'</div>');
  h.push('<div class="stack">');
  h.push('<div class="card st" style="--i:6;display:flex;flex-direction:column;gap:12px">'+cardHead("Darstellung")+
    '<div class="field"><span class="lbl2">Farbschema</span><div class="seg" role="group" aria-label="Farbschema">'+segBtns("theme", APP.prefs.theme, [["system","Automatisch"],["dark","Dunkel"],["light","Hell"]])+'</div></div>'+
    '<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span><b>Animationen</b><br><span class="small muted">Übergänge, Balken, Konfetti</span></span>'+
    '<button type="button" class="switch" role="switch" data-act="motion" aria-checked="'+APP.prefs.motion+'" aria-label="Animationen"></button></div></div>');
  h.push('<div class="card st" style="--i:7;display:flex;flex-direction:column;gap:12px">'+cardHead("Spielstand")+
    '<div class="field"><label for="save-name">Name des Spielstands</label><input class="inp" id="save-name" data-inp="save-name" value="'+esc(SV.name)+'"></div>'+
    '<div class="row"><button type="button" class="btn danger grow" data-act="reset-res">Ergebnisse dieser Saison löschen</button>'+
    '<button type="button" class="btn danger grow" data-act="del-save">Spielstand löschen</button></div></div>');
  h.push('</div></div>');
  return h.join("");
}
function dataExportBlock(){
  return '<div class="card st" style="--i:4;display:flex;flex-direction:column;gap:10px">'+cardHead("Daten & Sync", lastSaved ? "gespeichert "+stamp(lastSaved) : "")+
    '<p class="small muted" style="margin:0">Alles bleibt auf diesem Gerät. Zum Übertragen aufs Tablet oder Handy: hier „Text kopieren“, auf dem anderen Gerät einfügen und „Alles ersetzen“ tippen. Logos werden mitgenommen.</p>'+
    '<div class="row"><button type="button" class="btn grow" data-act="exp-copy">'+ico(IC.copy,18)+' Text kopieren</button>'+
    '<button type="button" class="btn grow" data-act="exp-file">'+ico(IC.download,18)+' Als Datei sichern</button></div>'+
    '<textarea class="notes" id="exp-text" readonly hidden aria-label="Sicherungstext" style="min-height:90px;font:11px var(--mono)"></textarea></div>';
}
function dataImportBlock(onb){
  return '<div class="card st" style="--i:'+(onb ? 1 : 5)+';display:flex;flex-direction:column;gap:10px">'+cardHead(onb ? "Daten aus der alten App holen" : "Importieren")+
    '<textarea class="notes" id="imp-text" spellcheck="false" placeholder="Sicherungstext hier einfügen …" aria-label="Sicherungstext einfügen" style="font:12px var(--mono)"></textarea>'+
    '<div class="row">'+(onb ? '<button type="button" class="btn pri grow" data-act="imp-add">'+ico(IC.upload,18)+' Importieren</button>' :
      '<button type="button" class="btn grow" data-act="imp-add">Als neuen Spielstand</button><button type="button" class="btn pri grow" data-act="imp-replace">'+ico(IC.sync,18)+' Alles ersetzen</button>')+
    '<button type="button" class="btn grow" data-act="imp-file">'+ico(IC.image,18)+' Datei wählen</button></div>'+
    (onb ? '' : '<p class="small muted" style="margin:0">„Als neuen Spielstand“ fügt hinzu, ohne etwas zu löschen. „Alles ersetzen“ übernimmt den Stand vom anderen Gerät komplett.</p>')+'</div>';
}

/* Anzahl der Strecken: hinten anfügen oder hinten wegnehmen */
function setRaceCount(n){
  n=clamp(n||1, 1, 40);
  S.spare=S.spare||[];
  if(n===S.races.length) return refresh();
  if(n>S.races.length){
    while(S.races.length<n){
      if(S.spare.length){ S.races.push(S.spare.shift()); continue; }
      var nid="r"+(S.nextId++); while(S.res[nid]) nid="r"+(S.nextId++);
      var j=S.races.length, def=DEF_RACES[j];
      S.races.push({id:nid, flag:def ? def[0] : "", name:def ? def[1] : "Rennen "+(j+1)});
      S.res[nid]=blankSession(); S.sprints[nid]=false;
    }
  } else {
    // Überzählige Strecken bleiben ausgegraut in der Liste, mit allem, was eingetragen ist
    S.spare=S.races.slice(n).concat(S.spare);
    S.races=S.races.slice(0,n);
    if(ui.race && raceIndex(ui.race)<0) ui.race=null;
  }
  touch(); refresh();
}
/* Strecken per langem Drücken und Ziehen sortieren */
(function(){
  var drag=null, timer=null, start=null;
  function rows(){ return [].slice.call(document.querySelectorAll("#calsort .calrow")); }
  function block(e){ if(drag) e.preventDefault(); }
  document.addEventListener("touchmove", block, {passive:false});
  function begin(row, y){
    var rs=rows(), h=row.getBoundingClientRect().height+0;
    drag={row:row, rows:rs, from:rs.indexOf(row), to:rs.indexOf(row), y0:y, h:h};
    row.classList.add("dragging");
    document.getElementById("calsort").classList.add("sorting");
    try{ navigator.vibrate && navigator.vibrate(15); }catch(e){}
  }
  function move(y){
    var dy=y-drag.y0, n=drag.rows.length;
    drag.row.style.transform="translateY("+dy+"px)";
    var to=clamp(drag.from+Math.round(dy/drag.h), 0, n-1);
    drag.to=to;
    drag.rows.forEach(function(r,i){
      if(r===drag.row) return;
      var sh=0;
      if(to>drag.from && i>drag.from && i<=to) sh=-drag.h;
      if(to<drag.from && i<drag.from && i>=to) sh=drag.h;
      r.style.transform= sh ? "translateY("+sh+"px)" : "";
    });
  }
  function end(){
    if(!drag) return;
    var d=drag; drag=null;
    document.getElementById("calsort").classList.remove("sorting");
    if(d.to!==d.from){
      var n=S.races.length, all=S.races.concat(S.spare||[]), R=all.splice(d.from,1)[0]; all.splice(d.to,0,R);
      S.races=all.slice(0,n); S.spare=all.slice(n);
      if(ui.race && raceIndex(ui.race)<0) ui.race=null;
      touch(); refresh(); toast(d.to<n ? R.name+" ist jetzt Rennen "+(d.to+1) : R.name+" ist nicht im Kalender");
    } else { d.rows.forEach(function(r){ r.style.transform=""; }); d.row.classList.remove("dragging"); }
  }
  document.addEventListener("pointerdown", function(e){
    var row=e.target.closest && e.target.closest("#calsort .calrow");
    if(!row) return;
    start={x:e.clientX, y:e.clientY, row:row};
    if(e.target.closest(".grip")){ e.preventDefault(); begin(row, e.clientY); return; }
    if(e.target.closest("input,button")) { clearTimeout(timer); timer=setTimeout(function(){ if(start && start.row===row){ document.activeElement && document.activeElement.blur && document.activeElement.blur(); begin(row, start.y); } }, 450); return; }
    clearTimeout(timer); timer=setTimeout(function(){ if(start && start.row===row) begin(row, start.y); }, 380);
  });
  document.addEventListener("pointermove", function(e){
    if(drag){ move(e.clientY); return; }
    if(start && Math.hypot(e.clientX-start.x, e.clientY-start.y)>8){ clearTimeout(timer); start=null; }
  });
  function up(){ clearTimeout(timer); start=null; end(); }
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", function(){ clearTimeout(timer); start=null; if(drag) end(); });
  document.addEventListener("contextmenu", function(e){ if(e.target.closest && e.target.closest("#calsort")) e.preventDefault(); });
})();

/* ================= Sheets ================= */
var SH=null;
function showSheet(){
  var sc=$("scrim"), sh=$("sheet");
  sc.hidden=false; sh.hidden=false;
  renderSheet();
  document.body.style.overflow="hidden";
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ sc.classList.add("on"); sh.classList.add("on"); }); });
}
function renderSheet(){
  if(!SH) return;
  var r;
  if(SH.type==="driver") r=sheetDriver();
  else if(SH.type==="career") r=sheetCareer();
  else if(SH.type==="saves") r=sheetSaves();
  else if(SH.type==="newsave") r=sheetNewSave();
  else if(SH.type==="entry") r=sheetEntry();
  else if(SH.type==="logo") r=sheetLogo();
  else if(SH.type==="crop") r=sheetCrop();
  else if(SH.type==="chart") r=sheetChart();
  else if(SH.type==="power") r=sheetPower();
  else if(SH.type==="confirm") r=sheetConfirm();
  else r={title:"", body:""};
  $("sheet-title").textContent=r.title;
  var body=$("sheet-body"), keep=SH.keepScroll ? body.scrollTop : 0;
  body.innerHTML=r.body;
  body.scrollTop=keep; SH.keepScroll=false;
  var f=$("sheet-foot");
  f.hidden=!r.foot; f.innerHTML=r.foot||"";
  $("sheet").classList.toggle("full", SH.type==="chart");
  segInd(body);
  if(SH.type==="crop") cropInit();
}
function closeSheet(){
  if(SH && SH.ctrl){ try{ SH.ctrl.abort(); }catch(e){} }
  var was=SH; SH=null;
  var sc=$("scrim"), sh=$("sheet");
  sc.classList.remove("on"); sh.classList.remove("on");
  document.body.style.overflow="";
  setTimeout(function(){ if(!SH){ sc.hidden=true; sh.hidden=true; } }, 380);
  if(was && was.after) was.after();
}
function askConfirm(o){ SH={type:"confirm", o:o}; showSheet(); }
function sheetConfirm(){
  var o=SH.o;
  return {title:o.title, body:'<p style="margin:0">'+o.text+'</p>',
    foot:'<button type="button" class="btn" data-act="sheet-close">Abbrechen</button><button type="button" class="btn '+(o.danger ? 'danger' : 'pri')+'" data-act="confirm-ok">'+esc(o.ok)+'</button>'};
}

/* Spielstände & Saisons */
function sheetSaves(){
  var h=APP.saves.map(function(sv){
    var champs=[];
    sv.seasons.forEach(function(se){ var c=champOf(se); if(c) champs.push(c.name+" ("+se.name+")"); });
    return '<div class="card" style="display:flex;flex-direction:column;gap:8px'+(sv===SV ? ';border-color:var(--accent)' : '')+'">'+
      '<div class="row" style="justify-content:space-between"><b style="font:800 20px var(--display);text-transform:uppercase">'+esc(sv.name)+'</b><span class="small muted">'+plural(sv.seasons.length,"Saison","Saisons")+'</span></div>'+
      (champs.length ? '<span class="small muted">Meister: '+esc(champs.join(", "))+'</span>' : '')+
      '<div class="chips" style="flex-wrap:wrap">'+sv.seasons.map(function(se){
        return '<button type="button" class="chip" data-act="pick-season" data-sv="'+esc(sv.id)+'" data-s="'+esc(se.id)+'" aria-pressed="'+(sv===SV && se===S)+'">'+esc(se.name)+' · '+MODES[se.mode].name+'</button>';
      }).join("")+'</div></div>';
  }).join("");
  return {title:"Spielstände", body:h,
    foot:'<button type="button" class="btn" data-act="new-season">'+ico(IC.plus,18)+' Neue Saison</button><button type="button" class="btn pri" data-act="new-save">'+ico(IC.plus,18)+' Neuer Spielstand</button>'};
}
function sheetNewSave(){
  return {title:"Neuer Spielstand", body:
    '<div class="field"><label for="ns-name">Name</label><input class="inp" id="ns-name" value="'+esc(SH.name)+'"></div>'+
    '<div class="field"><span class="lbl2">Serie</span><div class="seg" role="group" aria-label="Serie">'+segBtns("ns-mode", SH.mode, [["f1","F1"],["f2","F2"]])+'</div>'+
    '<span class="small muted">'+esc(MODES[SH.mode].desc)+'</span></div>'+
    '<p class="small muted" style="margin:0">Danach landest du in den Einstellungen und trägst Fahrer, Teams und Kalender ein.</p>',
    foot:'<button type="button" class="btn" data-act="sheet-close">Abbrechen</button><button type="button" class="btn pri" data-act="ns-ok">Anlegen</button>'};
}

/* Eintragen wie in der alten App: Anfangsbuchstaben oder Startnummer tippen, "Weiter" – fertig */
function openEntry(sess){
  SH={type:"entry", sess:sess||ui.sess};
  showSheet();
}
function entryState(k){
  var arr=S.res[ui.race][k], dnfs=[], maxNum=0, d;
  for(d=0; d<ND; d++){ if(arr[d]===DNF) dnfs.push(d); else if(isNum(arr[d]) && arr[d]>maxNum) maxNum=arr[d]; }
  return {arr:arr, dnfs:dnfs, bound:Math.max(ND-dnfs.length, maxNum)};
}
function driverAt(arr, p){ for(var d=0; d<ND; d++) if(arr[d]===p) return d; return null; }
function entryKey(k){ var st=entryState(k); return st.bound+"|"+st.dnfs.join(","); }
function sheetEntry(){
  var id=ui.race, R=S.res[id], k=SH.sess, sess=sessionsOf(id), RR=S.races[raceIndex(id)], st=entryState(k);
  var lim = k==="r" ? 10 : (k==="s" ? 8 : (k==="q" && cfg().qualy ? 1 : 0));
  var rows=[], idx=0, p, j;
  function row(kind, label, d, extra, sc){
    var t = d!=null ? teamOfD(d) : null;
    return '<div class="erow'+(sc ? ' sc' : '')+(kind==="add" ? ' add' : '')+(kind==="dnf" ? ' dnf' : '')+'"><span class="p">'+label+'</span>'+
      '<span class="elogo">'+(t ? logoHtml(t,30) : '<span class="dash"></span>')+'</span>'+
      '<input class="einp" type="text" data-idx="'+(idx++)+'" data-kind="'+kind+'" '+extra+' value="'+(d!=null ? esc(dname(d)) : '')+'" '+
      'placeholder="'+(kind==="add" ? '+ Ausfall' : '–')+'" enterkeyhint="next" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" '+
      'aria-label="'+esc(SESSLBL[k])+' '+(kind==="pos" ? label : 'Ausfall')+'"><span class="ehint" aria-hidden="true"></span></div>';
  }
  for(p=1; p<=st.bound; p++) rows.push(row("pos", "P"+p, driverAt(st.arr,p), 'data-p="'+p+'"', p<=lim));
  for(j=0; j<st.dnfs.length; j++) rows.push(row("dnf", "DNF", st.dnfs[j], 'data-d="'+st.dnfs[j]+'"', false));
  if(st.dnfs.length<ND) rows.push(row("add", "DNF", null, '', false));
  var h=['<div class="small muted">'+esc(raceLabel(RR))+'</div><div class="seg sm" role="group" aria-label="Session">'+segBtns("e-sess", k, sess.map(function(s2){ return [s2, SESSSHORT[s2]]; }))+'</div>',
    '<p class="small muted" style="margin:0">Tipp die ersten Buchstaben oder die Startnummer und drück auf <b>Weiter</b>. Der Fahrer wird eingetragen und es geht mit dem nächsten Platz weiter.</p>',
    wxPicker(R, k),
    '<div class="elist">'+rows.join("")+'</div>'];
  if(k==="r" || k==="s"){
    var flk = k==="r" ? "flr" : "fls", cur=R[flk];
    h.push('<div class="field"><label for="e-fl">'+ico(IC.bolt,13,2.4)+' Schnellste Runde'+(cfg().fl ? ' (+1 in den Top 10)' : '')+'</label><select class="inp" id="e-fl" data-chg="e-fl">'+
      '<option value="">– keine –</option>'+S.drivers.slice(0,ND).map(function(dv,d){ return '<option value="'+d+'"'+(cur===d ? ' selected' : '')+'>'+esc(dv.name)+(isNum(st.arr[d]) ? ' (P'+st.arr[d]+')' : '')+'</option>'; }).join("")+'</select></div>');
  }
  return {title:"Eintragen", body:h.join(""),
    foot:'<button type="button" class="btn danger" data-act="e-clearsess">'+esc(SESSSHORT[k])+' leeren</button><button type="button" class="btn pri" data-act="e-done">Fertig</button>'};
}
function focusEntry(i){
  var el=document.querySelector('#sheet-body .einp[data-idx="'+i+'"]');
  if(!el){ var a=document.activeElement; if(a && a.blur) a.blur(); return; }
  el.focus({preventScroll:true});
  if(el.value){ try{ el.select(); }catch(e){} }
  var body=$("sheet-body"), r=el.getBoundingClientRect(), br=body.getBoundingClientRect();
  if(r.bottom>br.bottom-60 || r.top<br.top+10) body.scrollTop+=r.top-br.top-br.height*0.35;
}
function focusFirstEmpty(){
  var els=document.querySelectorAll("#sheet-body .einp");
  for(var i=0;i<els.length;i++) if(!els[i].value){ focusEntry(+els[i].getAttribute("data-idx")); return; }
}
/* Schreibt einen Eintrag fest. Gibt zurück, ob sich die Liste (Ausfälle) verändert hat. */
function entryCommit(el){
  if(!SH || SH.type!=="entry") return false;
  var k=SH.sess, arr=S.res[ui.race][k], kind=el.getAttribute("data-kind"), val=el.value;
  var before=entryKey(k);
  var m = String(val||"").trim() ? matchDriver(val, arr) : -1;
  var cur = kind==="pos" ? driverAt(arr, +el.getAttribute("data-p")) : (kind==="dnf" ? +el.getAttribute("data-d") : null);
  if(m===cur || (m<0 && cur===null)){ entryPaint(el, cur); return false; }
  if(kind==="pos"){
    var p=+el.getAttribute("data-p");
    for(var d=0; d<ND; d++) if(arr[d]===p) arr[d]=null;
    if(m>=0) arr[m]=p;
  } else {
    if(cur!==null && cur!==m) arr[cur]=null;
    if(m>=0) arr[m]=DNF;
  }
  touch();
  entryPaint(el, m>=0 ? m : null);
  // Hatte der Fahrer vorher einen anderen Platz, diese Zeile leeren
  if(m>=0) document.querySelectorAll("#sheet-body .einp").forEach(function(o){
    if(o===el) return;
    var ok=o.getAttribute("data-kind"), od = ok==="pos" ? driverAt(arr, +o.getAttribute("data-p")) : (ok==="dnf" ? +o.getAttribute("data-d") : null);
    if(ok==="dnf" && arr[od]!==DNF) od=null;
    if(o.value && od===null) entryPaint(o, null);
  });
  return entryKey(k)!==before;
}
function entryPaint(el, d){
  el.value = d!=null ? dname(d) : "";
  var row=el.parentNode, lg=row.querySelector(".elogo"), hint=row.querySelector(".ehint");
  if(lg) lg.innerHTML = d!=null ? logoHtml(teamOfD(d),30) : '<span class="dash"></span>';
  if(hint) hint.textContent="";
  row.classList.remove("live");
}
var entryTyped=0;
var COARSE=false; try{ COARSE=window.matchMedia("(pointer: coarse)").matches; }catch(e){}
document.addEventListener("focusin", function(e){
  var el=e.target; if(!el.classList || !el.classList.contains("einp")) return;
  entryTyped=el.value.length;
  if(el.value) requestAnimationFrame(function(){ try{ if(document.activeElement===el) el.select(); }catch(x){} });
});
document.addEventListener("input", function(e){
  var el=e.target; if(!el.classList || !el.classList.contains("einp") || !SH || SH.type!=="entry") return;
  var v=el.value, arr=S.res[ui.race][SH.sess], m=String(v).trim() ? matchDriver(v, arr) : -1;
  var row=el.parentNode, lg=row.querySelector(".elogo"), hint=row.querySelector(".ehint");
  // Vorschau: Logo und voller Name des Treffers
  if(lg) lg.innerHTML = m>=0 ? logoHtml(teamOfD(m),30) : '<span class="dash"></span>';
  row.classList.toggle("live", m>=0);
  var full = m>=0 ? dname(m) : "";
  // Ergänzen direkt im Feld, wenn der Name so anfängt (nicht während die Tastatur noch ein Wort zusammensetzt)
  if(m>=0 && !COARSE && !e.isComposing && v.length>entryTyped && full.toLowerCase().indexOf(v.toLowerCase())===0 && full.length>v.length){
    el.value=full;
    try{ el.setSelectionRange(v.length, full.length); }catch(x){}
    if(hint) hint.textContent="";
  } else if(hint) hint.textContent = (m>=0 && full.toLowerCase()!==String(v).trim().toLowerCase()) ? "→ "+full : "";
  entryTyped=v.length;
}, true);
document.addEventListener("keydown", function(e){
  var el=e.target; if(!el.classList || !el.classList.contains("einp")) return;
  if(e.key==="Enter" || e.keyCode===13 || (e.key==="Tab" && !e.shiftKey)){
    e.preventDefault();
    var i=+el.getAttribute("data-idx"), kind=el.getAttribute("data-kind"), changed=entryCommit(el);
    if(changed){ SH.keepScroll=true; renderSheet(); }
    if(kind==="add" && changed){ var ad=document.querySelector('#sheet-body .einp[data-kind="add"]'); if(ad) focusEntry(+ad.getAttribute("data-idx")); }
    else focusEntry(i+1);
  } else if(e.key==="Escape"){ e.stopPropagation(); el.blur(); }
}, true);
document.addEventListener("focusout", function(e){
  var el=e.target; if(!el.classList || !el.classList.contains("einp") || !SH || SH.type!=="entry") return;
  if(entryCommit(el)){
    // Liste neu aufbauen (z. B. neuer Ausfall), Fokus behalten
    setTimeout(function(){
      if(!SH || SH.type!=="entry") return;
      var a=document.activeElement, ai=(a && a.classList && a.classList.contains("einp")) ? +a.getAttribute("data-idx") : -1;
      SH.keepScroll=true; renderSheet();
      if(ai>=0) focusEntry(ai);
    }, 0);
  }
});

/* Autostärke von Hand */
function openPower(raceId){
  var id=raceId || ui.race || powerTarget();
  var lp=latestPower(raceIndex(id));
  var vals=S.teams.map(function(_,k){ var v=lp ? lp.vals[k] : null; return isNum(v) ? v : 80; });
  SH={type:"power", race:id, vals:vals, keepScroll:false};
  showSheet();
}
function sheetPower(){
  var R=S.races[raceIndex(SH.race)];
  return {title:"Autostärke", body:'<p class="small muted" style="margin:0">Vor dem GP '+esc(R ? R.name : "")+'. 100 = stärkstes Auto. Zieh die Regler so, wie es im R&D-Vergleich im Spiel aussieht.</p>'+
    S.teams.map(function(t,k){
      return '<div class="brow">'+logoHtml(t,30)+'<span class="lbl" style="width:auto;flex:0 1 100px">'+esc(t.name)+'</span>'+
        '<input type="range" class="range" min="0" max="100" value="'+SH.vals[k]+'" data-inp="pw" data-k="'+k+'" aria-label="Autostärke '+esc(t.name)+'" style="flex:1;accent-color:'+t.color+'">'+
        '<span class="v num" id="pw-'+k+'">'+SH.vals[k]+'</span></div>';
    }).join(""),
    foot:(S.power[SH.race] ? '<button type="button" class="btn danger" data-act="pw-del">Löschen</button>' : '<button type="button" class="btn" data-act="sheet-close">Abbrechen</button>')+
      '<button type="button" class="btn pri" data-act="pw-save">Speichern</button>'};
}

/* ================= Fähigkeiten von claude.ai ================= */
var capP={};
function getCap(name){
  if(capP[name]) return capP[name];
  var c=window.claude;
  capP[name] = (c && typeof c.use==="function") ? Promise.resolve().then(function(){ return c.use(name); }).catch(function(){ return null; }) : Promise.resolve(null);
  return capP[name];
}
function normName(s){ return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim(); }
/* Fahrer zu getippten Buchstaben finden: ganzer Name, Startnummer, Anfang, Anfang eines Wortes, irgendwo im Namen.
   Bei mehreren Treffern gewinnt ein Fahrer, der in dieser Session noch keinen Platz hat. */
function matchDriver(v, arr){
  var q=normName(v); if(!q) return -1;
  var names=[], d;
  for(d=0; d<ND; d++) names.push(normName(dname(d)));
  var rules=[
    function(d){ return names[d]===q; },
    function(d){ return String(dnum(d)||"").trim()===q; },
    function(d){ return names[d].indexOf(q)===0; },
    function(d){ return names[d].split(" ").some(function(w){ return w.indexOf(q)===0; }); },
    function(d){ return names[d].replace(/ /g,"").indexOf(q.replace(/ /g,""))>=0; }
  ];
  for(var r=0;r<rules.length;r++){
    var hits=[];
    for(d=0; d<ND; d++) if(names[d] && rules[r](d)) hits.push(d);
    if(hits.length){
      if(arr) for(var i=0;i<hits.length;i++) if(arr[hits[i]]==null) return hits[i];
      return hits[0];
    }
  }
  return -1;
}

/* Logos verkleinern: quadratisch, 160 px */
function logoFromSrc(src, k){
  var img=new Image();
  img.onload=function(){ SH={type:"crop", k:k, img:img, zoom:1, x:0, y:0}; showSheet(); };
  img.onerror=function(){ toast("Dieses Bild konnte nicht gelesen werden"); };
  img.src=src;
}
/* Zuschneiden: quadratischer Ausschnitt, verschieben per Finger, Zoom per Regler oder zwei Fingern */
var CROPV=600;
function cropDraw(g, size){
  var img=SH.img, f=size/CROPV, base=CROPV/Math.max(img.naturalWidth, img.naturalHeight), sc=base*SH.zoom*f;
  var w=img.naturalWidth*sc, h=img.naturalHeight*sc;
  g.clearRect(0,0,size,size);
  g.drawImage(img, size/2+SH.x*f-w/2, size/2+SH.y*f-h/2, w, h);
}
function sheetCrop(){
  var t=S.teams[SH.k];
  return {title:"Zuschneiden", body:'<p class="small muted" style="margin:0">Verschieb das Bild mit dem Finger und zoome mit zwei Fingern oder dem Regler. Durchsichtige Stellen bleiben durchsichtig.</p>'+
    '<div class="cropbox"><canvas id="cropc" width="'+CROPV+'" height="'+CROPV+'" aria-label="Logo-Ausschnitt"></canvas></div>'+
    '<div class="row" style="flex-wrap:nowrap"><span class="small muted">Zoom</span><input type="range" class="range" id="cropz" min="50" max="400" value="'+Math.round(SH.zoom*100)+'" data-inp="cropz" aria-label="Zoom"></div>'+
    '<div class="row" style="justify-content:center;gap:18px"><span class="small muted">Vorschau</span><canvas id="cropp" width="120" height="120" style="width:60px;height:60px;border-radius:16px"></canvas><canvas id="cropp2" width="72" height="72" style="width:36px;height:36px;border-radius:10px"></canvas></div>',
    foot:'<button type="button" class="btn" data-act="crop-reset">Zurücksetzen</button><button type="button" class="btn pri" data-act="crop-ok">Übernehmen</button>'};
}
function cropRedraw(){
  var c=$("cropc"); if(!c || !SH || SH.type!=="crop") return;
  cropDraw(c.getContext("2d"), CROPV);
  ["cropp","cropp2"].forEach(function(id){ var p=$(id); if(p) cropDraw(p.getContext("2d"), p.width); });
}
function cropInit(){
  var c=$("cropc"); if(!c) return;
  var pts={}, last=null;
  function scale(){ return CROPV/c.clientWidth; }
  c.addEventListener("pointerdown", function(e){ c.setPointerCapture(e.pointerId); pts[e.pointerId]={x:e.clientX, y:e.clientY}; last=null; e.preventDefault(); });
  c.addEventListener("pointermove", function(e){
    if(!pts[e.pointerId]) return;
    var ids=Object.keys(pts), p=pts[e.pointerId];
    if(ids.length===1){ SH.x+=(e.clientX-p.x)*scale(); SH.y+=(e.clientY-p.y)*scale(); }
    pts[e.pointerId]={x:e.clientX, y:e.clientY};
    if(ids.length>=2){
      var a=pts[ids[0]], b=pts[ids[1]], d=Math.hypot(a.x-b.x, a.y-b.y);
      if(last) SH.zoom=clamp(SH.zoom*d/last, 0.5, 4);
      last=d; var z=$("cropz"); if(z) z.value=Math.round(SH.zoom*100);
    }
    cropRedraw();
  });
  function up(e){ delete pts[e.pointerId]; last=null; }
  c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
  c.addEventListener("wheel", function(e){ e.preventDefault(); SH.zoom=clamp(SH.zoom*(e.deltaY<0 ? 1.08 : 0.92), 0.5, 4); var z=$("cropz"); if(z) z.value=Math.round(SH.zoom*100); cropRedraw(); }, {passive:false});
  cropRedraw();
}
function cropSave(){
  var size=200, c=document.createElement("canvas"); c.width=size; c.height=size;
  try{
    cropDraw(c.getContext("2d"), size);
    var url=c.toDataURL("image/webp", 0.9);
    if(url.indexOf("data:image/webp")!==0) url=c.toDataURL("image/png");
    var k=SH.k;
    if(S.teams[k]){ S.teams[k].logo=cleanLogo(url); touch(); closeSheet(); refresh(); toast("Logo gespeichert"); }
  }catch(e){ toast("Dieses Bild konnte nicht verarbeitet werden"); }
}
function readLogo(file, k){
  var fr=new FileReader();
  fr.onload=function(){ logoFromSrc(String(fr.result), k); };
  fr.onerror=function(){ toast("Dieses Bild konnte nicht gelesen werden"); };
  fr.readAsDataURL(file);
}
function pickLogo(k, camera){
  if(NATIVE && N.Camera){
    var job = camera ? N.Camera.takePhoto({quality:90, correctOrientation:true})
                     : N.Camera.chooseFromGallery({mediaType:N.MediaTypeSelection.Photo, quality:90});
    job.then(function(r){
      var m = camera ? r : (r && r.results && r.results[0]);
      if(!m) return;
      var src = m.webPath || (m.thumbnail ? "data:image/jpeg;base64,"+m.thumbnail : "");
      if(!src){ toast("Dieses Bild konnte nicht gelesen werden"); return; }
      logoFromSrc(src, k);
    }).catch(function(e){
      var msg=String((e && (e.message||e.code)) || e);
      if(/cancel|abgebrochen/i.test(msg)) return;
      toast(camera ? "Kamera nicht verfügbar \u2013 erlaub den Zugriff in den Android-Einstellungen" : "Galerie konnte nicht geöffnet werden");
    });
    return;
  }
  logoFor=k;
  var inp=$(camera ? "file-cam" : "file-logo"); inp.value=""; inp.click();
}
function sheetLogo(){
  var t=S.teams[SH.k];
  if(!t) return {title:"Logo", body:""};
  return {title:"Logo", body:'<div class="row" style="gap:16px;flex-wrap:nowrap">'+logoHtml(t,84)+'<div><div style="font:800 24px/1.05 var(--display);text-transform:uppercase">'+esc(t.name)+'</div>'+
      '<div class="small muted">Zeichne dein Logo, fotografiere es oder nimm ein Bild aus der Galerie. Es wird automatisch quadratisch eingepasst.</div></div></div>'+
    '<div class="photoacts"><button type="button" class="bigact photo" style="flex-direction:column;align-items:flex-start;gap:8px" data-act="logo-gallery" data-k="'+SH.k+'"><span class="ic">'+ico(IC.image,22)+'</span><span class="tt">Aus der Galerie</span></button>'+
    '<button type="button" class="bigact hand" style="flex-direction:column;align-items:flex-start;gap:8px" data-act="logo-camera" data-k="'+SH.k+'"><span class="ic">'+ico(IC.camera,22)+'</span><span class="tt">Foto machen</span></button></div>'+
    (t.logo ? '<button type="button" class="btn danger" data-act="logo-rm" data-k="'+SH.k+'">Logo entfernen</button>' : ''),
    foot:'<button type="button" class="btn wide" data-act="sheet-close">Fertig</button>'};
}

/* ================= Konfetti & Toast ================= */
var pendingConfetti=false;
function confetti(){
  if(!APP.prefs.motion) return;
  try{ if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; }catch(e){}
  var cv=$("confetti"), g=cv.getContext("2d"), W=cv.width=innerWidth, H=cv.height=innerHeight, ps=[], i;
  var cs=getComputedStyle(document.documentElement);
  var cols=["--accent","--gold","--green","--purple","--ink"].map(function(v){ return cs.getPropertyValue(v).trim() || "#FF5A36"; });
  for(i=0;i<140;i++) ps.push({x:W/2+(Math.random()-0.5)*W*0.3, y:H*0.35, vx:(Math.random()-0.5)*14, vy:-Math.random()*14-4, r:Math.random()*6+4, a:Math.random()*6, va:(Math.random()-0.5)*0.4, c:cols[i%cols.length]});
  var t0=performance.now();
  function f(t){
    var dt=t-t0; g.clearRect(0,0,W,H);
    ps.forEach(function(p){ p.vy+=0.38; p.vx*=0.99; p.x+=p.vx; p.y+=p.vy; p.a+=p.va;
      g.save(); g.translate(p.x,p.y); g.rotate(p.a); g.fillStyle=p.c; g.globalAlpha=Math.max(0,1-dt/2200); g.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); g.restore(); });
    if(dt<2200) requestAnimationFrame(f); else g.clearRect(0,0,W,H);
  }
  requestAnimationFrame(f);
}
function toast(t){
  var el=$("toast"); el.textContent=t; el.classList.add("on");
  clearTimeout(toast.t); toast.t=setTimeout(function(){ el.classList.remove("on"); }, 2200);
}

/* ================= Export ================= */
function exportJson(){ return JSON.stringify(APP); }
function fileName(){ var d=new Date(); return "f1-manager-"+d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)+".json"; }
function exportFile(){
  var json=exportJson();
  if(NATIVE){
    N.Filesystem.writeFile({path:fileName(), data:json, directory:N.Directory.Cache, encoding:N.Encoding.UTF8}).then(function(r){
      return N.Share.share({title:"F1 Manager Sicherung", text:"Sicherung vom "+new Date().toLocaleDateString("de-DE"), files:[r.uri], dialogTitle:"Sicherung speichern oder teilen"});
    }).then(function(){ toast("Sicherung bereit"); }).catch(function(e){
      if(e && /cancel/i.test(String(e.message||e))) return;
      showExportText(json); toast("Teilen ging nicht \u2013 kopier den Text");
    });
    return;
  }
  getCap("downloads").then(function(dl){
    if(dl && typeof dl.save==="function"){
      return dl.save({filename:fileName(), data:json}).then(function(){ toast("Datei gesichert"); }).catch(function(e){
        if(e && e.code==="declined") return;
        showExportText(json); toast("Datei ging nicht – kopier den Text");
      });
    }
    try{
      var a=document.createElement("a");
      a.href=URL.createObjectURL(new Blob([json], {type:"application/json"})); a.download=fileName();
      document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      toast("Datei gesichert");
    }catch(e){ showExportText(json); }
  });
}
function showExportText(json){
  var ta=$("exp-text"); if(!ta) return;
  ta.hidden=false; ta.value=json; ta.focus(); ta.select();
}

/* ================= Demo ================= */
function makeDemo(){
  var teams=[["Falkenrot Racing","#E8002D"],["Nordlicht GP","#2E7CF6"],["Orangerie Motorsport","#FF8A00"],["Türkis Works","#11C5B0"],["Violetta Corse","#8E44E8"],
    ["Waldgrün Racing","#1E9E5A"],["Gelbfieber Team","#F2C200"],["Rosa Rakete","#FF5FA2"],["Blauwal Racing","#5A7DFF"],["Weinrot GP","#9E1B32"],["Mein Team","#00B3C8"]];
  var names=["L. Brandt","M. Okafor","J. Lindqvist","T. Marchetti","A. Duarte","K. Nakamura","S. Weber","R. Haddad","E. Kowalski","N. Ferreira","P. Laurent",
    "D. Moreau","F. Bianchi","C. O'Neill","V. Petrov","H. Tanaka","G. Silva","I. Novak","O. Svensson","B. Keller","Y. Mensah","Du"];
  var se=freshSeason("Saison 2026 (Beispiel)", names.map(function(n,i){ return {name:n, num:String([4,16,81,63,14,22,27,31,10,18,23,44,5,7,12,30,55,1,3,6,9,99][i])}; }),
    teams.map(function(t){ return {name:t[0], color:t[1]}; }), null, null, null, "f2");
  [1,4,7,10].forEach(function(i){ se.sprints[se.races[i].id]=true; });
  var r=mulberry(20261108), base=[0,1.2,0.6,2.5,4,5,6.5,7,8,9,7.5];
  withSeason(se, function(){
    for(var ri=0; ri<8; ri++){
      var id=se.races[ri].id, Rs=se.res[id];
      var pw=se.teams.map(function(_,k){ var v=97-base[k]*4.2+(r()-0.5)*4; if(k===10) v+=ri*1.6; return clamp(Math.round(v),40,100); });
      se.power[id]=pw;
      function order(){ var a=[]; for(var d=0; d<ND; d++) a.push({d:d, s:base[se.dTeam[d]]*1.6+(d%2)*0.8+gauss(r)*2.6-(se.dTeam[d]===10 ? ri*0.35 : 0)}); a.sort(function(x,y){ return x.s-y.s; }); return a.map(function(x){ return x.d; }); }
      var q=order(); q.forEach(function(d,i){ Rs.q[d]=i+1; });
      if(se.sprints[id]){ var sq=order(); sq.forEach(function(d,i){ Rs.sq[d]=i+1; }); var sp=order(); sp.forEach(function(d,i){ Rs.s[d]=i+1; }); Rs.fls=sp[Math.floor(r()*5)]; }
      var o=order(), out=o[Math.floor(r()*ND)];
      var pos=1; o.forEach(function(d){ if(d===out) Rs.r[d]=DNF; else Rs.r[d]=pos++; });
      Rs.flr=o.filter(function(d){ return d!==out; })[Math.floor(r()*6)];
    }
  });
  var sv={id:uid("g"), name:"Beispiel-Karriere", seasons:[se], cur:se.id};
  APP.saves.push(sv); APP.curSave=sv.id; flush();
}

/* ================= Ereignisse ================= */
var logoFor=null;
document.addEventListener("click", function(e){
  var el=e.target.closest ? e.target.closest("[data-act]") : null;
  if(!el || el.disabled) return;
  var a=el.getAttribute("data-act"), v=el.getAttribute("data-v");
  switch(a){
    case "nav": go(v); break;
    case "wmode": ui.wMode=v; saveUi(); refresh(); break;
    case "lg": { var m=el.getAttribute("data-mode"), k=el.getAttribute("data-k"); ui.hidden[m]=ui.hidden[m]||{}; ui.hidden[m][k]=!ui.hidden[m][k]; refresh(); if(SH && SH.type==="chart"){ SH.keepScroll=true; renderSheet(); } break; }
    case "chart-full": SH={type:"chart", id:el.getAttribute("data-chart"), title:(el.closest(".chead").querySelector("h2")||{}).textContent}; showSheet(); break;
    case "gmode": ui.gMode=v; refresh(); break;
    case "lg-all": ui.hidden[el.getAttribute("data-mode")]={}; refresh(); if(SH && SH.type==="chart"){ SH.keepScroll=true; renderSheet(); } break;
    case "lg-top": ui.hidden[el.getAttribute("data-mode")]=null; refresh(); if(SH && SH.type==="chart"){ SH.keepScroll=true; renderSheet(); } break;
    case "tip": showTip(el); break;
    case "driver": openDriver(+el.getAttribute("data-d")); break;
    case "career": SH={type:"career", k:el.getAttribute("data-k")}; showSheet(); break;
    case "goto-race": if(SH) closeSheet(); ui.race=el.getAttribute("data-r"); ui.sess=el.getAttribute("data-s")||"r"; if(ui.view!=="race"){ ui.view="race"; saveUi(); window.scrollTo(0,0); render(true); } else refresh(); break;
    case "race": ui.race=el.getAttribute("data-r"); refresh(); break;
    case "race-step": { var i=raceIndex(ui.race)+(+v); if(i>=0 && i<S.races.length){ ui.race=S.races[i].id; render(true); } break; }
    case "sess": ui.sess=v; refresh(); break;
    case "entry-toggle": ui.entryOpen=!ui.entryOpen; el.setAttribute("aria-expanded", ui.entryOpen); var rv=el.parentNode.querySelector(".reveal"); if(rv) rv.classList.toggle("open", ui.entryOpen); break;
    case "entry-open": openEntry(ui.sess); break;
    case "power-hand": openPower(el.getAttribute("data-r")); break;
    case "race-clear": askConfirm({title:"Wochenende leeren?", text:"Alle Ergebnisse von <b>"+esc(S.races[raceIndex(ui.race)].name)+"</b> werden gelöscht. Autostärke und Notizen bleiben.", ok:"Leeren", danger:true,
      onOk:function(){ var R=S.res[ui.race], n=R.notes, mm=R.memo; S.res[ui.race]=blankSession(); S.res[ui.race].notes=n; S.res[ui.race].memo=mm||blankMemo(); touch(); refresh(); toast("Geleert"); }}); break;
    case "stat-scope": ui.statScope=v; saveUi(); refresh(); break;
    case "stat-key": ui.statKey=v; saveUi(); refresh(); break;
    case "pred-use": { var sid=el.getAttribute("data-s"), se=findSeason(SV,sid); if(se){ APP.prefs.predUse[sid]=!predUse(se); touch(); refresh(); } break; }
    /* Sheets */
    case "sheet-close": closeSheet(); break;
    case "sheet-saves": SH={type:"saves"}; showSheet(); break;
    case "pick-season": { var sv=findSave(el.getAttribute("data-sv")); if(sv){ APP.curSave=sv.id; sv.cur=el.getAttribute("data-s"); ui.race=null; ui.hidden={}; touch(); closeSheet(); render(true); } break; }
    case "new-save": SH={type:"newsave", name:uniqueName("Spielstand "+(APP.saves.length+1)), mode:"f2"}; showSheet(); break;
    case "ns-mode": SH.name=$("ns-name").value; SH.mode=v; renderSheet(); break;
    case "ns-ok": {
      var nm=$("ns-name").value.trim()||uniqueName("Spielstand"), first=freshSeason("Saison 1", null, null, null, null, null, SH.mode);
      var nsv={id:uid("g"), name:nm, seasons:[first], cur:first.id};
      APP.saves.push(nsv); APP.curSave=nsv.id; ui.race=null; ui.hidden={}; flush(); closeSheet(); ui.view="set"; saveUi(); render(true); toast("Spielstand angelegt"); break; }
    case "new-season": {
      var base=S, ns=freshSeason("Saison "+(SV.seasons.length+1), base.drivers, base.teams, base.dTeam, base.races, base.sprints, base.mode, base.nd);
      (base.spare||[]).forEach(function(R){ var nid="r"+(ns.nextId++); ns.spare.push({id:nid, flag:R.flag, name:R.name}); ns.res[nid]=blankSession(); ns.sprints[nid]=!!base.sprints[R.id]; });
      SV.seasons.push(ns); SV.cur=ns.id; ui.race=null; ui.hidden={}; touch(); if(SH) closeSheet(); ui.view="set"; saveUi(); render(true);
      toast("Neue Saison angelegt – Fahrerwechsel hier eintragen"); break; }
    case "confirm-ok": { var o=SH.o; closeSheet(); o.onOk(); break; }
    /* Eintragen */
    case "e-sess": SH.sess=v; renderSheet(); break;
    case "e-wx": {
      var RW=S.res[ui.race], ph=el.getAttribute("data-ph"); RW.wx=RW.wx||{};
      var w=normWx(RW.wx[SH.sess])||{};
      if(w[ph]===v) delete w[ph];
      else { w[ph]=v; if(ph==="a"){ if(!w.m) w.m=v; if(!w.e) w.e=v; } }
      if(w.a||w.m||w.e) RW.wx[SH.sess]=w; else delete RW.wx[SH.sess];
      touch(); SH.keepScroll=true; renderSheet(); break; }
    case "e-clearsess": { var s0=SH.sess; S.res[ui.race][s0]=nulls(); if(s0==="r") S.res[ui.race].flr=null; if(s0==="s") S.res[ui.race].fls=null; touch(); renderSheet(); break; }
    case "memo-tab": ui.memoTab=v; refresh(); break;
    case "memo-add": { var ML=memoOf(), l=el.getAttribute("data-l");
      if(l==="drv") ML.drv.push({d:null, text:""});
      else { var last=ML.tyres[ML.tyres.length-1]; ML.tyres.push({d:last ? last.d : null, sess:last ? last.sess : (ui.sess||"r"), c:"M", laps:null, pit:null, wear:null}); }
      touch(); refresh(); break; }
    case "memo-del": { var MD=memoOf(); MD[el.getAttribute("data-l")].splice(+el.getAttribute("data-i"),1); touch(); refresh(); break; }
    case "memo-ty-c": { var MC=memoOf().tyres[+el.getAttribute("data-i")]; if(MC){ MC.c=v; touch(); refresh(); } break; }
    case "e-done": { var sd=SH.sess; ui.sess=sd; closeSheet(); if(sd==="r" && S.res[ui.race].r.indexOf(1)>=0) pendingConfetti=true; refresh(); toast("Gespeichert"); break; }
    /* Foto */
    /* Autostärke */
    case "pw-save": S.power[SH.race]=SH.vals.slice(); touch(); closeSheet(); toast("Autostärke gespeichert"); refresh(); break;
    case "pw-del": delete S.power[SH.race]; touch(); closeSheet(); toast("Autostärke gelöscht"); refresh(); break;
    /* Einstellungen */
    case "mode": S.mode=v; touch(); refresh(); break;
    case "nd": S.nd=normNd(v); setS(S); simCache.key=null; touch(); refresh(); toast(v+" Fahrer im Feld"); break;
    case "theme": switchTheme(v, el); break;
    case "theme-toggle": switchTheme(isDark() ? "light" : "dark", el); break;
    case "motion": APP.prefs.motion=!APP.prefs.motion; touch(); refresh(); break;
    case "logo": SH={type:"logo", k:+el.getAttribute("data-k")}; showSheet(); break;
    case "crop-ok": cropSave(); break;
    case "crop-reset": SH.zoom=1; SH.x=0; SH.y=0; $("cropz").value=100; cropRedraw(); break;
    case "logo-gallery": pickLogo(+el.getAttribute("data-k"), false); break;
    case "logo-camera": pickLogo(+el.getAttribute("data-k"), true); break;
    case "logo-rm": S.teams[+el.getAttribute("data-k")].logo=""; touch(); if(SH && SH.type==="logo") closeSheet(); refresh(); break;
    case "team-add": S.teams.push(normTeam({name:"Mein Team", color:"#FFC93C"}, S.teams.length)); touch(); refresh(); toast("Team hinzugefügt – Fahrer zuordnen nicht vergessen"); break;
    case "team-del": {
      var tk=+el.getAttribute("data-k");
      if(S.dTeam.indexOf(tk)>=0) break;
      S.teams.splice(tk,1);
      S.dTeam=S.dTeam.map(function(x){ return x>tk ? x-1 : x; });
      Object.keys(S.power).forEach(function(rid){ S.power[rid].splice(tk,1); });
      touch(); refresh(); break; }
    case "race-sprint": { var rid=el.getAttribute("data-r"); S.sprints[rid]=!S.sprints[rid]; el.setAttribute("aria-checked", S.sprints[rid]); touch(); break; }
    case "race-move": { var ri=raceIndex(el.getAttribute("data-r")), to=ri+(+v); if(to>=0 && to<S.races.length){ var tmp=S.races[ri]; S.races[ri]=S.races[to]; S.races[to]=tmp; touch(); refresh(); } break; }
    case "race-count": setRaceCount(S.races.length+(+v)); break;
    case "race-add": { var nid="r"+(S.nextId++); while(S.res[nid]) nid="r"+(S.nextId++); S.races.push({id:nid, flag:"", name:"Rennen "+(S.races.length+1)}); S.res[nid]=blankSession(); S.sprints[nid]=false; touch(); refresh(); break; }
    case "race-del": {
      var did=el.getAttribute("data-r"), spI=(S.spare||[]).findIndex(function(x){ return x.id===did; });
      if(spI>=0){ var sR=S.spare[spI]; askConfirm({title:"Strecke löschen?", text:"<b>"+esc(sR.name)+"</b> wird endgültig aus der Liste entfernt.", ok:"Löschen", danger:true, onOk:function(){ S.spare.splice(S.spare.indexOf(sR),1); delete S.res[did]; delete S.sprints[did]; delete S.power[did]; touch(); refresh(); }}); break; }
      var dR=S.races[raceIndex(did)];
      askConfirm({title:"Rennen löschen?", text:"<b>"+esc(dR.name)+"</b> wird mit allen Ergebnissen aus dem Kalender entfernt.", ok:"Löschen", danger:true, onOk:function(){
        S.races.splice(raceIndex(did),1); delete S.res[did]; delete S.sprints[did]; delete S.power[did]; if(ui.race===did) ui.race=null; touch(); refresh(); }});
      break; }
    case "del-season": if(SV.seasons.length<2) break;
      askConfirm({title:"Saison löschen?", text:"<b>"+esc(S.name)+"</b> wird mit allen Ergebnissen gelöscht. Das lässt sich nicht rückgängig machen.", ok:"Löschen", danger:true, onOk:function(){
        SV.seasons.splice(SV.seasons.indexOf(S),1); SV.cur=lastSeason(SV).id; ui.race=null; flush(); render(true); toast("Saison gelöscht"); }}); break;
    case "reset-res": askConfirm({title:"Ergebnisse löschen?", text:"Alle Ergebnisse und Autostärken von <b>"+esc(S.name)+"</b> werden gelöscht. Fahrer, Teams und Kalender bleiben.", ok:"Löschen", danger:true, onOk:function(){
        S.races.forEach(function(R){ S.res[R.id]=blankSession(); }); S.power={}; flush(); refresh(); toast("Ergebnisse gelöscht"); }}); break;
    case "del-save": askConfirm({title:"Spielstand löschen?", text:"<b>"+esc(SV.name)+"</b> mit "+plural(SV.seasons.length,"Saison","Saisons")+" wird gelöscht. Das lässt sich nicht rückgängig machen.", ok:"Löschen", danger:true, onOk:function(){
        APP.saves.splice(APP.saves.indexOf(SV),1); APP.curSave=null; ui.race=null; ui.hidden={}; flush(); ui.view="standings"; render(true); toast("Spielstand gelöscht"); }}); break;
    /* Daten */
    case "exp-copy": {
      var json=exportJson();
      if(NATIVE){ N.Clipboard.write({string:json}).then(function(){ toast("Text kopiert \u2013 jetzt auf dem anderen Gerät einfügen"); }, function(){ showExportText(json); }); break; }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(json).then(function(){ toast("Text kopiert – jetzt auf dem anderen Gerät einfügen"); }, function(){ showExportText(json); toast("Bitte den markierten Text kopieren"); });
      } else { showExportText(json); toast("Bitte den markierten Text kopieren"); }
      break; }
    case "exp-file": exportFile(); break;
    case "imp-file": $("file-json").value=""; $("file-json").click(); break;
    case "imp-add": case "imp-replace": {
      var txt=$("imp-text").value;
      if(!txt.trim()){ toast("Erst den Sicherungstext einfügen"); break; }
      if(a==="imp-replace" && APP.saves.length){
        askConfirm({title:"Alles ersetzen?", text:"Alle Spielstände auf diesem Gerät werden durch den eingefügten Stand ersetzt.", ok:"Ersetzen", danger:true, onOk:function(){ doImport(txt, true); }});
      } else doImport(txt, a==="imp-replace");
      break; }
    case "demo": makeDemo(); ui.view="standings"; saveUi(); render(true); toast("Beispiel geladen"); break;
  }
});
function doImport(txt, replace){
  try{
    var n = replace ? importReplace(txt) : importAdd(txt);
    ui.race=null; ui.hidden={};
    if(ui.view==="set" && !replace) ui.view="standings";
    render(true);
    toast(replace ? "Stand übernommen" : plural(n,"Spielstand","Spielstände")+" importiert");
  }catch(e){ toast("Das ist kein gültiger Sicherungstext"); }
}
document.addEventListener("input", function(e){
  var el=e.target, k=el.getAttribute && el.getAttribute("data-inp");
  if(!k || !S) return;
  var v=el.value, d=+el.getAttribute("data-d"), t=+el.getAttribute("data-k"), r=el.getAttribute("data-r");
  switch(k){
    case "season-name": S.name=v; touch(); break;
    case "save-name": SV.name=v; touch(); break;
    case "dnum": el.value=v.replace(/[^0-9]/g,""); S.drivers[d].num=el.value; touch(); break;
    case "dname": S.drivers[d].name=v; touch(); break;
    case "tname": S.teams[t].name=v; touch(); break;
    case "tshort": S.teams[t].short=v.trim().toUpperCase().slice(0,4); touch(); break;
    case "rflag": { var R=anyRace(r); if(R){ R.flag=v.trim().slice(0,8); touch(); } break; }
    case "rname": { var R2=anyRace(r); if(R2){ R2.name=v; touch(); } break; }
    case "memo": { var M=memoOf(); M[el.getAttribute("data-k")]=v.slice(0,4000); touch(); break; }
    case "memo-gen": if(S.res[ui.race]){ S.res[ui.race].notes=v.slice(0,4000); touch(); } break;
    case "memo-drv-t": { var Md=memoOf().drv[+el.getAttribute("data-i")]; if(Md){ Md.text=v.slice(0,2000); touch(); } break; }
    case "memo-ty": { var Mt=memoOf().tyres[+el.getAttribute("data-i")], f=el.getAttribute("data-f"); if(Mt){ Mt[f]=intOrNull(v,0,f==="wear" ? 100 : 999); touch(); } break; }
    case "cropz": if(SH && SH.type==="crop"){ SH.zoom=(+v)/100; cropRedraw(); } break;
    case "notes": if(S.res[ui.race]){ S.res[ui.race].notes=v.slice(0,4000); touch(); } break;
    case "predw": APP.prefs.predW=clamp((+v)/100,0,1); var l=$("predw-l"); if(l) l.textContent="Auto "+Math.round(+v)+" %"; break;
    case "pw": SH.vals[t]=+v; $("pw-"+t).textContent=v; break;
  }
});
document.addEventListener("change", function(e){
  var el=e.target, inp=el.getAttribute && el.getAttribute("data-inp"), k=el.getAttribute && el.getAttribute("data-chg");
  if(inp==="predw"){ touch(); refresh(); return; }
  if(inp==="dname"){ var d0=+el.getAttribute("data-d"); if(!S.drivers[d0].name.trim()){ S.drivers[d0].name="Fahrer "+(d0+1); el.value=S.drivers[d0].name; touch(); } return; }
  if(inp==="tname" || inp==="tshort"){ refresh(); return; }
  if(!k) return;
  var v=el.value;
  switch(k){
    case "race-count": setRaceCount(parseInt(v,10)); break;
    case "memo-drv-d": { var X=memoOf().drv[+el.getAttribute("data-i")]; if(X){ X.d= v==="" ? null : +v; touch(); } break; }
    case "memo-ty-d": { var Y=memoOf().tyres[+el.getAttribute("data-i")]; if(Y){ Y.d= v==="" ? null : +v; touch(); } break; }
    case "memo-ty-s": { var Z=memoOf().tyres[+el.getAttribute("data-i")]; if(Z){ Z.sess=v; touch(); } break; }
    case "dteam": S.dTeam[+el.getAttribute("data-d")]=+v; touch(); refresh(); break;
    case "tcolor": S.teams[+el.getAttribute("data-k")].color=hexc(v, "#888888"); touch(); refresh(); break;
    case "e-fl": { var fk=SH.sess==="r" ? "flr" : "fls"; S.res[ui.race][fk]= v==="" ? null : +v; touch(); break; }
  }
});
$("file-cam").addEventListener("change", function(){ var f=this.files && this.files[0]; if(f && logoFor!=null) readLogo(f, logoFor); });
$("file-logo").addEventListener("change", function(){ var f=this.files && this.files[0]; if(f && logoFor!=null) readLogo(f, logoFor); });
$("file-json").addEventListener("change", function(){
  var f=this.files && this.files[0]; if(!f) return;
  var fr=new FileReader();
  fr.onload=function(){ var ta=$("imp-text"); if(ta) ta.value=String(fr.result); toast("Datei geladen – jetzt importieren"); };
  fr.readAsText(f);
});
$("scrim").addEventListener("click", closeSheet);
/* Wischen links/rechts wechselt den Tab */
(function(){
  var sx=0, sy=0, st=0, on=false;
  var NOSWIPE=".chips,.gridwrap,.strip,.chartbox,.cropbox,input,textarea,select,.range", segEl=null;
  document.addEventListener("touchstart", function(e){
    on=false; segEl=null;
    if(!S || e.touches.length!==1) return;
    var t=e.target; if(!t.closest) return;
    var sg=t.closest(".seg");
    if(sg){ segEl=sg; }
    else if(SH || !t.closest("#main") || t.closest(NOSWIPE)) return;
    sx=e.touches[0].clientX; sy=e.touches[0].clientY; st=Date.now(); on=true;
  }, {passive:true});
  document.addEventListener("touchend", function(e){
    if(!on) return; on=false;
    var c=e.changedTouches[0], dx=c.clientX-sx, dy=c.clientY-sy;
    if(segEl){
      if(Math.abs(dx)<30 || Math.abs(dx)<Math.abs(dy)) return;
      var bs=[].slice.call(segEl.querySelectorAll("button")), ci=-1;
      bs.forEach(function(b,j){ if(b.getAttribute("aria-pressed")==="true") ci=j; });
      var nb=bs[ci+(dx<0 ? 1 : -1)];
      if(nb && !nb.disabled){ e.preventDefault && 0; nb.click(); }
      return;
    }
    if(Date.now()-st>700 || Math.abs(dx)<70 || Math.abs(dx)<Math.abs(dy)*1.6) return;
    var i=0; VIEWS.forEach(function(v,j){ if(v.k===ui.view) i=j; });
    var n=i+(dx<0 ? 1 : -1);
    if(n>=0 && n<VIEWS.length) go(VIEWS[n].k);
  }, {passive:true});
})();
document.addEventListener("keydown", function(e){ if(e.key==="Escape" && SH) closeSheet(); });
document.addEventListener("visibilitychange", function(){ if(document.visibilityState==="hidden") flush(); });
window.addEventListener("pagehide", flush);
try{ window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(){ if(APP.prefs.theme==="system") refresh(); }); }catch(e){}

/* ================= Start ================= */
function showIntro(){
  if(!APP.prefs.motion || reducedMotion()) return;
  var d=document.createElement("div"); d.className="intro"; d.setAttribute("aria-hidden","true");
  d.innerHTML=APP_MARK+'<b>F1 Manager</b><span class="stripe"></span>';
  document.body.appendChild(d);
  setTimeout(function(){ d.remove(); }, 1900);
}
var storageProbe=true;
try{ localStorage.setItem("f1m-probe","1"); localStorage.removeItem("f1m-probe"); }catch(e){ storageProbe=false; }
storageOk=storageProbe;
APP=loadApp();
loadUi();
buildNav();
if(NATIVE) showIntro();
render(true);
showBanner();
if(NATIVE){
  if(!APP.saves.length){
    N.Preferences.get({key:KEY}).then(function(r){
      if(r && r.value){ try{ APP=normApp(JSON.parse(r.value)); saveLocal(); render(true); }catch(e){} }
    }).catch(function(){});
  }
  N.App.addListener("backButton", function(){
    if(SH){ closeSheet(); return; }
    if(ui.view!=="standings"){ go("standings"); return; }
    N.App.minimizeApp ? N.App.minimizeApp() : N.App.exitApp();
  });
  N.App.addListener("pause", flush);
}
})();
