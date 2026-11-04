// Realistic 3-week-old demo log for store screenshots (fictional baby "Ava")
module.exports=function(NOW){
  const H=36e5,M=6e4,D=24*H,OZ=29.5735; const E=[]; let n=0; const add=o=>E.push({id:'d'+(n++),...o});
  let seed=11; const r=()=>{seed=(seed*9301+49297)%233280; return seed/233280;};
  const start=new Date('2026-10-12T00:00:00-04:00').getTime();
  for(let t=start+1*H; t<NOW-20*M; ){ // feeds every ~2.5-3.2h
    const breast=r()<.45;
    if(breast){ const l=(8+Math.round(r()*7))*M, rr=(6+Math.round(r()*7))*M; add({type:'breast',start:t,end:t+l+rr,left:l,right:rr}); }
    else add({type:'bottle',start:t,amount:Math.round((2+r()*1.5)*10)/10*OZ,volUnit:'oz',contents:r()<.6?'breastmilk':'formula'});
    // diaper around feeds
    if(r()<.85) add({type:'diaper',start:t+(10+Math.round(r()*20))*M,kind:r()<.62?'wet':r()<.5?'mixed':'dirty',pee:'medium'});
    // sleep after feed
    const s=t+(45+Math.round(r()*40))*M, len=(60+Math.round(r()*80))*M; if(s+len<NOW-40*M) add({type:'sleep',start:s,end:s+len,kind:new Date(s).getHours()>=20||new Date(s).getHours()<6?'night':'nap'});
    t+=(150+Math.round(r()*45))*M;
  }
  // pumping into the stash
  const pumps=[[46,'fridge',3.6],[30,'fridge',4.2],[20,'fridge',2.8],[8,'fridge',3.4],[3,'freezer',5],[120,'freezer',4.5],[200,'freezer',4]];
  pumps.forEach(([h,store,oz])=>add({type:'pump',start:NOW-h*H,left:oz/2*OZ,right:oz/2*OZ,volUnit:'oz',duration:15,store}));
  // vitamin D, tummy time
  for(let d=0; d<21; d++){ const day=start+d*D; if(day+10*H<NOW) add({type:'vitd',start:day+9.5*H}); if(day+11*H<NOW && d>4) add({type:'activity',kind:'Tummy time',start:day+11*H,duration:4}); }
  // growth
  [[0,3.3,50,34.5],[5,3.18,null,null],[14,3.55,52,35.6],[21,3.82,53,36.2]].forEach(([d,w,l,h])=>{ const t=start+d*D+10*H; if(t<NOW) add({type:'growth',start:t,weight:w,length:l,head:h}); });
  add({type:'doctor',start:start+14*D+9*H,title:'2-week checkup',note:'Back above birth weight. Keep vitamin D.'});
  add({type:'doctor',start:new Date('2026-11-12T09:30:00-05:00').getTime(),title:'1-month checkup'});
  add({type:'note',start:NOW-2*D,title:'Lifted her head during tummy time',milestone:true});
  add({type:'temp',start:NOW-3*D,value:36.9});
  return {app:'nestling',version:1,profile:{name:'Ava',birth:'2026-10-12',sex:'f',units:'imperial'},entries:E.sort((a,b)=>b.start-a.start),teeth:{}};
};
