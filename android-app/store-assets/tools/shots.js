const {chromium}=require('playwright');const fs=require('fs');const http=require('http');const path=require('path');
const R='/home/claude/baby-app/';const F='/tmp/claude-0/work/fonts/node_modules/@fontsource/';const OUT='/tmp/claude-0/work/promo/raw/';fs.mkdirSync(OUT,{recursive:true});
const ff=(fam,file,w)=>`@font-face{font-family:"${fam}";font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`;
const fontCss=[ff('Bricolage Grotesque','bricolage-grotesque/files/bricolage-grotesque-latin-500-normal.woff2',500),ff('Bricolage Grotesque','bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2',700),...[400,500,600,700].map(w=>ff('Figtree',`figtree/files/figtree-latin-${w}-normal.woff2`,w))].join('\n');
const html=fs.readFileSync(R+'index.html','utf8').replace('</head>','<style>.banner{display:none!important}</style></head>');
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];if(u==='/'||u==='/index.html'){r.setHeader('content-type','text/html; charset=utf-8');return r.end(html);} if(u==='/config.js'){r.setHeader('content-type','application/javascript');return r.end('window.NESTLING_CONFIG={};');} const f=path.join(R,u);if(fs.existsSync(f)&&fs.statSync(f).isFile()){return r.end(fs.readFileSync(f));}r.statusCode=404;r.end();}).listen(8796);
const NOW=new Date('2026-11-03T15:10:00-05:00').getTime(); const DATA=require('./data.js')(NOW);
(async()=>{const b=await chromium.launch();const errs=[];
const shot=async(name,{theme='peach',dark=false,icons='soft',view='today',act,scroll,rn}={})=>{
 const ctx=await b.newContext({viewport:{width:390,height:720},deviceScaleFactor:3,timezoneId:'America/New_York',colorScheme:dark?'dark':'light'});
 await ctx.addInitScript(([p,d])=>{try{localStorage.setItem('nestling.prefs',JSON.stringify(p));localStorage.setItem('nestling.v1',JSON.stringify(d));}catch(e){}},[{theme,icons,appearance:dark?'dark':'light',rnRange:rn||'24h',stashOpen:true},DATA]);
 await ctx.route(/fonts\.googleapis\.com/,r=>r.fulfill({contentType:'text/css',body:fontCss}));await ctx.route(/fonts\.gstatic|cdn\.jsdelivr/,r=>r.fulfill({body:''}));
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));await p.clock.install({time:NOW});await p.goto('http://localhost:8796/');await p.waitForTimeout(500);
 if(view!=='today'){await p.click(`#tabbar [data-view=${view}]`);await p.waitForTimeout(200);}
 if(act) await act(p);
 if(scroll) await p.evaluate(s=>{const el=document.querySelector(s); if(el) window.scrollTo(0,el.getBoundingClientRect().top+scrollY-12);},scroll);
 await p.waitForTimeout(250);await p.screenshot({path:OUT+name});await ctx.close();};
await shot('1-home.png');
await shot('2-log.png',{theme:'mint',act:async p=>{await p.click('.logrow [data-new=bottle]');await p.fill('#f_amt','3');await p.waitForTimeout(150);}});
await shot('3-stash.png',{scroll:'#app .stash'});
await shot('4-trends.png',{theme:'lullaby',dark:true,view:'history',act:async p=>{await p.click('[data-hist=trends]');await p.waitForTimeout(150);},scroll:'#app .panel:nth-of-type(2)'});
await shot('5-growth.png',{theme:'sky',view:'health',scroll:'#app .panel'});
await shot('6-ask.png',{theme:'cotton',view:'ask',act:async p=>{await p.fill('#askQ','Is she getting enough milk?');await p.click('#askForm button[type=submit]');await p.waitForTimeout(600);}});
await shot('7-week.png',{rn:'7d',theme:'peach'});
console.log('errors',errs);srv.close();await b.close();})();
