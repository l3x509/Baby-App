const {chromium}=require('playwright');const fs=require('fs');
const F='/tmp/claude-0/work/fonts/node_modules/@fontsource/';const RAW='/tmp/claude-0/work/promo/raw/';const OUT='/home/claude/baby-app/android-app/store-assets/';
const b64=f=>fs.readFileSync(f).toString('base64');
const fonts=`@font-face{font-family:B;font-weight:700;src:url(data:font/woff2;base64,${b64(F+'bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2')})}
@font-face{font-family:Fi;font-weight:500;src:url(data:font/woff2;base64,${b64(F+'figtree/files/figtree-latin-500-normal.woff2')})}
@font-face{font-family:Fi;font-weight:700;src:url(data:font/woff2;base64,${b64(F+'figtree/files/figtree-latin-700-normal.woff2')})}`;
const MARK=c=>`<svg viewBox="0 0 32 32" width="100%" height="100%"><path d="M8 18c2 5 14 5 16 0" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="12" r="4" fill="${c}"/></svg>`;
const S=[
 ['1-home.png','Everything at a glance','Last feed, milk and diapers, with the day laid out hour by hour.','#fff1ea','#f6c9b6','#c9543f'],
 ['3-stash.png','Your milk stash, sorted','Oldest bag first, with use-by dates for fridge and freezer.','#fff6ef','#f9d9c4','#c9543f'],
 ['2-log.png','Log it in one tap','Bottles from the stash come out of it automatically.','#eefaf4','#bfe8d4','#258a63'],
 ['7-week.png','Today or the whole week','Switch to 7-day averages and see her rhythm.','#fff1ea','#f6c9b6','#c9543f'],
 ['4-trends.png','See the patterns','Feeds, milk and diapers over days and weeks.','#241d33','#3a2f55','#b89cf0'],
 ['6-ask.png','Answers you can trust','Built on pediatric guidance, using your baby’s own log.','#fff1f6','#f8cfe0','#c94a80'],
 ['5-growth.png','Growth and checkups','Weight and height with the WHO reference line, plus every visit.','#eef6fd','#c4dff4','#2f7fc4'],
];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
fs.mkdirSync(OUT+'screenshots',{recursive:true}); for(const f of fs.readdirSync(OUT+'screenshots')) fs.unlinkSync(OUT+'screenshots/'+f);
for(let i=0;i<S.length;i++){ const [img,h,sub,bg,blob,acc]=S[i]; const dark=bg==='#241d33';
 await p.setContent(`<html><head><style>${fonts}
 body{margin:0}.c{width:1080px;height:1920px;position:relative;overflow:hidden;background:${bg};font-family:Fi}
 .blob{position:absolute;border-radius:50%;background:${blob};opacity:.7}
 .top{position:absolute;left:90px;right:90px;top:120px;text-align:center}
 .brand{display:inline-flex;align-items:center;gap:14px;font-family:B;font-size:34px;color:${acc};margin-bottom:34px}
 .brand i{width:52px;height:52px;border-radius:15px;background:${acc};display:grid;place-items:center;padding:8px;box-sizing:border-box}
 h1{font-family:B;font-size:92px;line-height:1.02;margin:0 0 26px;letter-spacing:-2px;color:${dark?'#f4eefc':'#2a1f1c'}}
 p{font-size:40px;line-height:1.3;margin:0;color:${dark?'#cbbfe0':'#6b5852'}}
 .phone{position:absolute;left:50%;top:640px;transform:translateX(-50%);width:760px;height:1403px;border-radius:78px;background:#1d1716;padding:20px;box-shadow:0 40px 90px rgba(40,20,10,.28)}
 .phone img{width:100%;height:100%;border-radius:60px;object-fit:cover;object-position:top;display:block}
 </style></head><body><div class="c"><div class="blob" style="width:700px;height:700px;right:-260px;top:-280px"></div><div class="blob" style="width:520px;height:520px;left:-240px;top:980px"></div>
 <div class="top"><div class="brand"><i>${MARK('#fff')}</i>Bebenou</div><h1>${h}</h1><p>${sub}</p></div>
 <div class="phone"><img src="data:image/png;base64,${b64(RAW+img)}"></div></div></body></html>`);
 await p.waitForTimeout(150); await p.screenshot({path:`${OUT}screenshots/${i+1}-${img.replace(/^\d-/,'')}`}); }
// feature graphic 1024x500
await p.setViewportSize({width:1024,height:500});
await p.setContent(`<html><head><style>${fonts}
body{margin:0}.f{width:1024px;height:500px;position:relative;overflow:hidden;background:linear-gradient(120deg,#fff4ee 0%,#ffe4d6 55%,#fbd3c2 100%);font-family:Fi}
.blob{position:absolute;border-radius:50%}
.copy{position:absolute;left:62px;top:86px;width:430px}
.row{display:flex;align-items:center;gap:18px}
.mark{width:76px;height:76px;border-radius:21px;background:#e8735e;padding:12px;box-sizing:border-box;box-shadow:0 12px 26px rgba(201,84,63,.3)}
h1{font-family:B;font-size:68px;margin:0;color:#2a1f1c;letter-spacing:-1.5px;line-height:1}
.tag{font-size:29px;line-height:1.25;color:#5b443c;margin:26px 0 22px;font-weight:500}
.pills{display:flex;flex-wrap:wrap;gap:8px}.pills span{font-weight:700;font-size:17px;padding:8px 14px;border-radius:99px;background:#fff;color:#c9543f;box-shadow:0 2px 0 rgba(201,84,63,.12)}
.ph{position:absolute;width:228px;height:421px;border-radius:30px;background:#1d1716;padding:8px;box-shadow:0 22px 50px rgba(80,40,30,.3)}
.ph img{width:100%;height:100%;border-radius:23px;object-fit:cover;object-position:top;display:block}
</style></head><body><div class="f">
<div class="blob" style="width:520px;height:520px;background:#f7b9a2;opacity:.45;right:-120px;top:-210px"></div>
<div class="blob" style="width:300px;height:300px;background:#ffd8c7;opacity:.7;left:-120px;bottom:-170px"></div>
<div class="copy"><div class="row"><div class="mark">${MARK('#fff')}</div><h1>Bebenou</h1></div>
<div class="tag">Every feed, every diaper,<br>everyone in the loop.</div>
<div class="pills"><span>Feeds</span><span>Diapers</span><span>Milk stash</span><span>Growth</span></div></div>
<div class="ph" style="right:250px;top:100px;transform:rotate(-6deg)"><img src="data:image/png;base64,${b64(RAW+'3-stash.png')}"></div>
<div class="ph" style="right:48px;top:40px;transform:rotate(5deg)"><img src="data:image/png;base64,${b64(RAW+'1-home.png')}"></div>
</div></body></html>`);
await p.waitForTimeout(150);await p.screenshot({path:OUT+'feature-graphic.png'});
await b.close();})();
