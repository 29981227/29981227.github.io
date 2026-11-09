'use strict';
const ART={priest:'../assets/images/第五人格-祭司头像.webp',seer:'../assets/images/第五人格-先知头像.webp',merc:'../assets/images/第五人格-佣兵头像.webp',barmaid:'../assets/images/第五人格-调酒师头像.webp',me:'../assets/images/第五人格-玩家头像.webp',film:'../assets/images/第五人格-胶片插画.webp',raven:'../assets/images/第五人格-乌鸦插画.webp',event:'../assets/images/第五人格-事件插画.webp',next:'../assets/images/第五人格-后续预告.webp'};
const ICON={candle:'<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="2"><path d="M26 22h10v26H26zM18 49h26M20 53h23M31 21c-10-8 1-11 1-19 13 13 1 17-1 19zM9 42l10-3M41 39l9 3"/></svg>',film:'<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="10" width="44" height="39" rx="2" transform="rotate(-10 30 30)"/><path d="M8 20h45M10 41h44M19 10v10M29 8v11M40 7v11M18 42v9M30 40v9M40 39v9"/></svg>',ticket:'<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 15h46v10a5 5 0 0 0 0 10v10H7V35a5 5 0 0 0 0-10z"/><path d="M16 20h30v20H16zM22 29h18M22 34h12M43 16v29"/></svg>'};
const EVENTS={
seer:{id:'seer',name:'先知',art:'seer',title:'门前的最后一只鸟',fact:'大门开启后，先知用鸟替你挡下了关键伤害。',short:'刚才这只鸟替你挡下了关键伤害。',goals:['thanks','know','again'],comic:false},
barmaid:{id:'barmaid',name:'调酒师',art:'barmaid',title:'谁都不肯先翻的木板',fact:'你们在同一块木板前犹豫，把监管者等来了。',short:'你们一起在板前礼让，把监管者等来了。',goals:['know','again'],comic:true}
};
const GOALS={thanks:{name:'留一句谢幕',desc:'谢谢TA，不打扰',icon:'candle'},know:{name:'认识一下',desc:'借这次配合自然<br>打开话题',icon:'film'},again:{name:'再演一局',desc:'顺着这次默契，<br>邀请继续开黑',icon:'ticket'}};
const TONES={sincere:'真诚',casual:'随和',fun:'整活'};
const $=id=>document.getElementById(id),layer=$('episode-layer'),input=$('chat-input'),chat=$('chat-log');
const state={view:'preview',scenario:'rescue',event:null,goal:null,tone:'sincere',selected:-1,round:0,channel:'赛后',agentOff:false,nextOff:false,nextOffered:false,dirty:false,generated:'',pending:null,session:0,friend:false,invite:false,team:false,polishSource:'',polishDirection:'natural'};
let idleTimer,replyTimer,toastTimer,modalCallback,lastFocus,toastText='';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(text){$('status-text').textContent=text;}
function toast(text){toastText=text;clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3300);}
function wax(){return '<div class="wax" aria-hidden="true">幕</div>';}
function shell(title,body,foot='',cls=''){return `<article class="paper ${cls}"><button class="close-paper" data-action="dismiss" aria-label="关闭彩蛋">×</button><h2>${title}</h2>${body}${foot?`<div class="paper-footer">${foot}</div>`:''}${wax()}</article>`;}
function foot(label='暂且谢幕',action='dismiss'){return `<span class="ornament" aria-hidden="true">─➛</span><button class="text-button" data-action="${action}">${label}</button><span class="ornament" aria-hidden="true">➛─</span>`;}
function eventHeader(){const e=EVENTS[state.event];return `<div class="event-header"><img src="${ART[e.art]}" alt="${e.name}头像"><div><h3>${esc(e.title)}${e.comic?'<span class="event-label">共同彩蛋</span>':''}</h3><p>${esc(e.short)}</p>${state.goal?`<span class="goal-tag">${GOALS[state.goal].name}</span>`:''}</div></div>`;}
function changeView(view){clearTimeout(idleTimer);state.view=view;render();}
function updateProgress(){const order=['preview','cast','goal','draft','next'];const v=state.view==='next-preview'?'next':state.view==='mini'?'preview':state.view;let index=order.indexOf(v);document.querySelectorAll('[data-step]').forEach((el,i)=>{el.classList.toggle('active',i===index);el.classList.toggle('done',i<index);});}
function updateInput(){const count=Array.from(input.value).length;$('letter-count').textContent=`${count} / 50`;$('send-button').disabled=!input.value.trim()||state.team;}
function addMessage(name,text,art,isFact=false){const row=document.createElement('div');row.className='message'+(isFact?' fact':'');row.innerHTML=`<img class="avatar" src="${ART[art]}" alt="${esc(name)}头像"><div class="message-body"><div class="sender"><span class="sigil" aria-hidden="true">${name==='你'?'♧':'♧'}</span><span>${esc(name)}</span>${isFact?'<span class="fact-badge">幕间彩蛋 · 本局事实</span>':''}</div><p>${esc(text)}</p></div>`;chat.appendChild(row);return row;}
function addSystem(text){const row=document.createElement('div');row.className='message system';row.textContent='✦ '+text;chat.appendChild(row);}
function initialChat(){chat.innerHTML='';if(state.scenario==='none'){addMessage('祭司','这局辛苦了！','priest');addMessage('先知','辛苦啦，下局见。','seer');addMessage('你','辛苦各位。','me');addSystem('本局没有通过筛选的共同事件。');return;}addMessage('祭司','谢谢你刚才帮我挡刀！','priest');addMessage('先知','门前的最后一只鸟，大门前保护了你。','seer',true);addMessage('佣兵','那只鸟好难啊，救了我一命！','merc');addMessage('调酒师',state.scenario==='comic'?'我们俩在板前也太客气了。':'配合得太好了！','barmaid');addMessage('你','谢谢各位！','me');addSystem('地窖已开启！');}
function render(){
updateProgress();layer.innerHTML='';if(state.channel!=='赛后')return;
if(state.view==='off')return;
if(state.view==='mini'){layer.innerHTML='<button class="mini-egg" data-action="open" aria-label="查看幕间彩蛋">幕</button>';return;}
if(state.view==='preview'){
layer.innerHTML=`<div class="preview" tabindex="0" role="button" aria-label="打开幕间彩蛋，查看本局剧组名单" data-action="open"><img class="film-art" src="${ART.film}" alt="先知放鸟，鸟为队友挡伤的纸偶胶片"><span class="gold-dust"></span><span class="flying-bird" aria-hidden="true">✦</span><span class="preview-caption"><b>幕间彩蛋</b>刚才那一下……</span><span class="click-tip">点击看看 ›</span><button class="preview-close" data-action="dismiss" aria-label="关闭本局彩蛋">×</button></div>`;
status('彩蛋只重演本局演示事实。点开胶片，看看值得留住的队友。');
idleTimer=setTimeout(()=>{if(state.view==='preview')changeView('mini')},30000);return;
}
if(state.view==='cast'){
const list=state.scenario==='comic'?['barmaid','seer']:['seer','barmaid'];
const rows=list.map(id=>{const e=EVENTS[id];return `<div class="cast-row"><img class="avatar" src="${ART[e.art]}" alt="${e.name}头像"><div class="cast-copy"><div class="name">队友：${e.name}</div><h3>${e.title}${e.comic?'<span class="event-label">彩蛋</span>':''}</h3><p>事实：${e.fact}</p></div><button class="native-button" data-action="event" data-id="${id}">${e.comic?'看看花絮':'和TA说一句'}</button></div>`}).join('');
layer.innerHTML=shell('幕间彩蛋 · 本局剧组名单<small>每人一个共同瞬间，只留下值得聊的这一幕</small>',rows,foot());status('选择一位队友。推荐理由来自固定的演示对局事实。');return;
}
if(state.view==='goal'){
const e=EVENTS[state.event];const cards=e.goals.map(g=>`<button class="goal-card" data-action="goal" data-id="${g}"><span class="goal-icon" aria-hidden="true">${ICON[GOALS[g].icon]}</span><b>${GOALS[g].name}</b><small>${GOALS[g].desc}</small></button>`).join('');
layer.innerHTML=shell('幕间彩蛋',eventHeader()+`<p class="question">你想让这段配合停在哪一幕？</p><div class="goal-grid ${e.goals.length===2?'two':''}">${cards}</div><img class="raven" src="${ART.raven}" alt="">`,foot('换一位队友','back-cast'));status('关系停在哪一幕，由你决定。整活事件不提供不合适的谢幕目标。');return;
}
if(state.view==='draft'){
const allowed=EVENTS[state.event].comic?['sincere','casual','fun']:['sincere','casual'];
const tones=allowed.map(t=>`<button class="tone-button ${state.tone===t?'active':''}" data-action="tone" data-id="${t}" aria-pressed="${state.tone===t}">${TONES[t]}</button>`).join('');
const options=getDrafts().map((t,i)=>`<button class="draft-option ${state.selected===i?'selected':''}" data-action="draft" data-index="${i}" aria-pressed="${state.selected===i}"><span class="draft-dot" aria-hidden="true"></span><span>${esc(t)}</span></button>`).join('');
layer.innerHTML=shell('幕间彩蛋 · 这一句，像你',eventHeader()+`<p class="question">怎么说会更像你？</p><div class="tone-bar">${tones}</div><p class="draft-intro">选一句写进输入框，再改成你想说的样子。</p><div class="draft-list">${options}</div><p class="draft-tip">不会自动发送 · 不会覆盖已修改的文字${EVENTS[state.event].comic?'':' · 整活仅用于双方共同参与的事件'}</p>`,`<button class="text-button" data-action="back-goal">‹ 换个目标</button><button class="text-button" data-action="shuffle">换一句 ↻</button><button class="text-button" data-action="collapse">收起</button>`);
status('点击草稿写入输入框。可编辑或清空，再用原生“发送”按钮发出。');return;
}
if(state.view==='next-preview'){
layer.innerHTML=`<div class="preview next-preview" data-action="open-next" tabindex="0" role="button" aria-label="打开下一幕"><img src="${ART.next}" alt="两名纸偶角色并肩谢幕"><div><strong>幕间彩蛋 · 下一幕</strong><small>这场配合，要不要留到下一局？</small></div><button class="preview-close" data-action="dismiss" aria-label="不再推荐下一幕">×</button></div>`;status('你已发出续局邀约，或队友接住了话题。下一幕只建议一次。');return;
}
if(state.view==='next'){
const e=EVENTS[state.event];let info=state.goal==='again'?'你把下一场剧票递给了「'+e.name+'」。':'「'+e.name+'」接住了刚才那段'+(e.comic?'共同花絮。':'门前救援。');
layer.innerHTML=shell('幕间彩蛋 · 下一幕',`<img class="next-art" src="${ART.next}" alt="两名Q版角色并肩谢幕，乌鸦递出剧票"><p class="next-copy">${info}<br>这场配合，要不要留到下一局？</p><div class="next-actions"><button class="native-button red" data-action="friend" ${state.friend?'disabled':''}>${state.friend?'已发送申请':'加为好友'}</button><button class="native-button" data-action="invite" ${state.invite?'disabled':''}>${state.invite?'已发送邀请':'再演一局'}</button></div>`,foot(),'next-paper');return;
}
if(state.view==='polish')renderPolish();
}
const BANK={
seer:{
thanks:{sincere:['門口那只鸟来得太及时了，真的谢谢！'.replace('門','门'),'刚才要不是你给鸟，我可能真出不去了。谢谢你！','大门前那次保护帮了大忙，谢谢这局的配合。','谢谢你在门口给的鸟，那次挡伤真的很关键。','最后那只鸟把我护住了，真心谢谢。','门口那波多亏你的鸟，辛苦啦。'],casual:['谢啦！门口那只鸟，来得刚刚好。','刚才那只鸟救命了，谢了谢了！','门口有你这只鸟，我才出得来。谢谢啦。','门前那波接得漂亮，谢啦！','门口那只鸟，记你一份人情啦。','你的鸟来得太是时候了，谢啦～']},
know:{sincere:['刚才要不是你给鸟，我可能真出不去了。想认识一下。','门口那只鸟让我记住你了，方便认识一下吗？','那次保护太及时了，谢谢你。很高兴这局遇见你。','刚才门口配合得很好，想和你聊两句。','大门前那只鸟真的很关键，认识一下吧？','谢谢你给鸟护住我，下次遇见还能打个招呼。'],casual:['门前那只鸟真救命！认识一下？','鸟给得好及时，交个游戏搭子不？','刚才多亏你护住我啦，认识一下呗。','门口那波接住了！想认识这个靠谱队友。','那只鸟来得刚好，方便认识一下嘛？','这局有幸蹭到你的鸟了，认识一下～']},
again:{sincere:['门口那次配合很默契，下一局还一起玩吗？','谢谢你刚才给鸟，下把还想和你一起玩。','那次保护帮了大忙，愿意再一起开一局吗？','门前那只鸟很关键，下局继续一起配合吧？','刚才有你护住我真好，下一局要一起玩吗？','这局的配合想再来一次，下把一起吗？'],casual:['门口那只鸟太及时了！下把一起？','鸟给得漂亮，下局继续搭个伙呗？','这局配合不错！再一起开一把不？','好队友别散场，下把还一起玩？','门前那波不错，再一起玩一局嘛？','下局一起呗，还想跟你配合！']}
},
barmaid:{
know:{sincere:['刚才我们在板前一起犹豫了，好有画面感。认识一下？','那块板前我们都停住了，聊起这幕还挺有趣。','板前那下我们想到一起去了，想认识一下。','我们在板前都没先翻，现在想起来挺好笑的。','板前一起停住那一下，成了这局的共同花絮。','刚才板前我们都在等对方，方便认识一下吗？'],casual:['咱俩板前也太客气了吧，认识一下？','刚才是你等我、我等你，结果把监管者等来了。','板前那一停，我们还挺有默契的哈哈。','我们俩在板前礼让半天，真是同款犹豫。','那块板承包了我们这局的笑点，认识一下呗？','我以为你先翻，你是不是也这么想的？'],fun:['两位演员在板前礼让，成功把监管者等来了。','咱俩不是不翻板，是给监管者留了个登场位。','板前礼让节目正式杀青，认识一下搭档？','你先请，我先请，最后请来了监管者。','这块板见证了我们共同的犹豫，搭档留个名？','板前双人静止艺术，咱俩都是主演。']},
again:{sincere:['刚才我们一起在板前犹豫了，下局再一起玩吧？','还记得板前那一幕吗？想再和你开一局。','这一局留下了共同花絮，下一局要一起吗？','我们在板前停住的样子太有画面了，再玩一局？','下局继续一起，看看我们会不会又想到一块。','那块板前的共同经历挺难忘，下把一起玩吧？'],casual:['下把一起吧，板前这次我先翻！','我们俩太客气了，下局继续一起玩不？','下局一起，这次板前别相互等了哈哈。','咱俩刚才同时犹豫，下把一起再试试？','板前礼让到此为止，下局继续一起玩？','下把一起吧，这次先说好谁先翻。'],fun:['板前礼让剧组申请续订，下一场你来吗？','两位主演请别散场，下一局继续开演！','下局一起吧，我们的板前节目还没演完。','监管者都来捧场了，咱俩再演一局？','板前双人静止艺术要续集，下把一起！','这次改演“谁先翻板”，下一局搭档还来不？']}
}
};
function getDrafts(){const bank=BANK[state.event][state.goal][state.tone]||BANK[state.event][state.goal].casual;return bank.slice((state.round%2)*3,(state.round%2)*3+3);}
function chooseEvent(id){state.event=id;state.goal=null;state.selected=-1;state.tone=EVENTS[id].comic?'fun':'sincere';state.round=0;state.pending=null;changeView('goal');}
function chooseGoal(id){if(!EVENTS[state.event].goals.includes(id))return;state.goal=id;state.selected=-1;state.round=0;state.pending=null;changeView('draft');}
function writeDraft(text,index=-1){const apply=()=>{input.value=text.slice(0,50);state.dirty=false;state.generated=input.value;state.selected=index;updateInput();render();input.focus();input.setSelectionRange(input.value.length,input.value.length);toast('草稿已写入输入框。可修改后手动发送。');};if(input.value&&input.value!==text&&(state.dirty||!state.generated)||state.dirty&&input.value===''){openDialog('保留你的修改？','<p>输入框内容已由你编辑或清空。是否用这条草稿替换？取消会保留当前内容。</p><p class="modal-note">'+esc(text)+'</p>','替换草稿',apply);}else apply();}
function dismiss(){clearTimeout(idleTimer);state.agentOff=true;state.nextOff=true;state.pending=null;changeView('off');status('幕间彩蛋已退场，本局不再推荐。正常聊天不受影响。');toast('暂且谢幕。不打扰，下一次有缘再见。');}
function collapse(){changeView('off');status('浮窗已收起，输入框内容已保留。发送与否由你决定。');}
function offerNext(){if(state.agentOff||state.nextOff||state.nextOffered||state.channel!=='赛后'||state.scenario==='none')return;state.nextOffered=true;changeView('next-preview');}
function isRelated(text,e){return e==='seer'?/鸟|给鸟|门口|门前|大门|护|挡|保护/.test(text):/板|礼让|犹豫|主演|演员|剧组|静止|节目|监管者|搭档/.test(text);}
function isInvitation(text){return /下局|下把|下场|下一|下次|再.*局|再.*把|再.*开|再.*玩|继续|一起|续订|续集/.test(text)&&/[?？]|玩|一起|开|继续|来|演|配合|搭伙|搭个伙/.test(text);}
function sendMessage(){const text=input.value.trim();if(!text||state.team)return;const context=state.channel==='赛后'&&state.event&&state.goal&&state.scenario!=='none'&&isRelated(text,state.event)?{event:state.event,goal:state.goal,session:state.session,reply:$('reply-mode').value,text}:null;addMessage('你',text,'me');input.value='';state.dirty=false;state.generated='';state.selected=-1;updateInput();chat.scrollTop=chat.scrollHeight;changeView('off');if(context?.goal==='thanks'){state.agentOff=true;state.nextOff=true;state.pending=null;status('谢谢已经说出口。幕间彩蛋主动退场，不继续推荐关系。');return;}
if(!context||state.agentOff||state.nextOff){status('留言已发送。本地演示不会发送任何真实消息。');return;}
state.pending=context;if(context.goal==='again'&&isInvitation(text))offerNext();else status('留言已发出。只有队友接住这一话题，才会有下一幕。');
clearTimeout(replyTimer);if(context.reply==='none'){status('队友暂未回复。幕间彩蛋不追问，不自动推荐加好友。');return;}
replyTimer=setTimeout(()=>{if(context.session!==state.session||state.channel!=='赛后'||state.agentOff||state.nextOff)return;const positive=context.reply==='positive';const response=positive?(context.event==='seer'?(context.goal==='again'?'可以呀，下把继续！':'嘿嘿，应该的～那只鸟来得正好。'):(context.goal==='again'?'来！下一场板前礼让先暂停哈哈。':'哈哈，我们俩真的想到一起去了！')):'谢谢啦，不过我准备下线了，下次有缘再玩。';addMessage(EVENTS[context.event].name,response,EVENTS[context.event].art);chat.scrollTop=chat.scrollHeight;if(!positive){state.pending=null;state.nextOff=true;changeView('off');status('队友婉拒，幕间彩蛋退场，不继续推荐。');}else if(context.goal==='know')offerNext();},1700);
}
function renderPolish(){const source=state.polishSource;let body='<p class="polish-lead">想说什么就写下来，<br>我可以帮你说得自然一点。</p><p class="polish-note">没有共同事件，不虚构彩蛋，<br>也不引导加好友或组队。</p>';if(source){const texts=polishTexts();body+=`<p class="draft-intro">只润色你的原话，不补写对局经历。</p><div class="draft-list">${texts.map((t,i)=>`<button class="draft-option ${state.selected===i?'selected':''}" data-action="polish-draft" data-index="${i}"><span class="draft-dot"></span><span>${esc(t)}</span></button>`).join('')}</div>`;}
layer.innerHTML=shell('幕间彩蛋 · 普通润色',body,`<button class="text-button" data-action="polish" data-id="natural">更自然</button><button class="text-button" data-action="polish" data-id="light">更轻松</button><button class="text-button" data-action="polish-shuffle">换一句</button><button class="text-button" data-action="collapse">收起</button>`);status('没有符合规则的共同事件。先输入自己的话，再选择润色方向。');}
function polishTexts(){let text=state.polishSource.replace(/[。！!？?～~]+$/,'');if(!text)return[];let out=state.polishDirection==='light'?[text.replace(/辛苦了/g,'辛苦啦').replace(/谢谢你/g,'谢啦')+'～',text+'呀！',text+'～']:[text+'。',text.replace(/辛苦了/g,'辛苦啦')+'！',text+'，谢谢。'];if(state.round%2)out=state.polishDirection==='light'?[text+'～',text.replace(/了$/,'啦')+'！',text+'呀～']:[text+'！',text+'，谢谢你。',text+'。'];return out.map(t=>t.slice(0,50));}
function requestPolish(direction){if(!input.value.trim()){toast('先在输入框写下想说的话，再选择润色方向。');input.focus();return;}if(!state.polishSource||state.dirty)state.polishSource=input.value.trim();state.polishDirection=direction;state.selected=-1;render();}
function openDialog(title,body,confirmLabel,callback,cancelLabel='取消'){lastFocus=document.activeElement;modalCallback=callback;$('modal-title').textContent=title;$('modal-body').innerHTML=body;$('modal-actions').innerHTML=`<button class="text-button" id="dialog-cancel">${cancelLabel}</button>${confirmLabel?`<button class="native-button" id="dialog-confirm">${confirmLabel}</button>`:''}`;$('modal-shade').hidden=false;$('dialog-cancel').onclick=closeDialog;if(confirmLabel)$('dialog-confirm').onclick=()=>{const fn=modalCallback;closeDialog();if(fn)fn();};$('modal-paper').focus();}
function closeDialog(){$('modal-shade').hidden=true;modalCallback=null;if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
function profile(){const e=EVENTS[state.event];return `<div class="dialog-profile"><img src="${ART[e.art]}" alt="${e.name}头像"><div><strong>${e.name}</strong><small>本局队友 · ${esc(e.title)}</small></div></div>`;}
function friend(){if(state.friend)return;openDialog('发送好友申请',profile()+'<p>要向这位队友发送好友申请吗？申请是否通过由对方决定。</p><p class="modal-note">本地演示：不连接游戏，不发送真实请求。</p>','确认申请',()=>{state.friend=true;addSystem('演示：已向「'+EVENTS[state.event].name+'」发送好友申请，等待对方确认。');render();toast('好友申请已模拟发送，等待对方确认。');status('申请已发出，不代表已成为好友。下一局邀约仍由你决定。');});}
function invite(){if(state.invite)return;openDialog('邀请再演一局',profile()+'<p>向这位队友发送组队邀请？只有对方接受后才进入组队。</p><p class="modal-note">本地演示：取消不会发送邀请。</p>','确认邀请',()=>{state.invite=true;addSystem('演示：已邀请「'+EVENTS[state.event].name+'」再演一局。');render();toast('已模拟发送邀请，等待队友接受。');openDialog('等待队友接下剧票',profile()+'<p>邀请已发送。请选择队友的回应，演示组队流程。</p><p class="modal-note">下面的回应由演示者选择，并非真实玩家反馈。</p>','模拟队友接受',()=>{state.team=true;state.agentOff=true;state.nextOff=true;changeView('off');updateInput();addSystem('演示：队友已接受，你和「'+EVENTS[state.event].name+'」进入组队，下一局尚未开始。');chat.scrollTop=chat.scrollHeight;status('队友接受邀请，组队流程演示完成。点击“重新体验”可从彩蛋开始。');toast('已进入模拟组队，下一幕由你们继续。');},'模拟队友拒绝');$('dialog-cancel').onclick=()=>{closeDialog();state.nextOff=true;state.agentOff=true;changeView('off');addSystem('演示：队友没有接受邀请。');status('队友拒绝邀请，幕间彩蛋立即退场，不追问。');};});}
function help(){openDialog('幕间彩蛋 · 体验说明','<ol><li>点击输入框上方的胶片，查看最多两位队友和共同事件。</li><li>选择队友，再选择“谢幕 / 认识 / 再演”和语气。</li><li>点选草稿写入输入框，可以改字或清空，再手动发送。</li><li>“认识一下”需要正向回应；真正发出的续局邀约可直接出现下一幕。</li><li>好友申请、组队邀请均需确认，组队还需模拟队友接受。</li></ol><p>底部可切换“关键救援 / 共同整活 / 无共同事件”，以及正向回复、不回复、婉拒。切换本局将重置体验。</p><p class="modal-note">这是基于 v5 文档制作的离线交互 Demo。草稿是固定演示内容，非实时 AI 生成；聊天、事件和社交操作均为本地模拟。庄园背景菜单不在演示范围。</p>',null,null,'开始体验');}
function reset(){clearTimeout(idleTimer);clearTimeout(replyTimer);closeDialog();const scenario=$('scenario').value;const session=state.session+1;Object.assign(state,{view:scenario==='none'?'polish':'preview',scenario,event:null,goal:null,tone:scenario==='comic'?'fun':'sincere',selected:-1,round:0,channel:'赛后',agentOff:false,nextOff:false,nextOffered:false,dirty:false,generated:'',pending:null,session,friend:false,invite:false,team:false,polishSource:'',polishDirection:'natural'});input.value='';$('emoji-menu').hidden=true;document.querySelectorAll('[data-channel]').forEach(b=>{b.classList.toggle('active',b.dataset.channel==='赛后');b.setAttribute('aria-selected',b.dataset.channel==='赛后');});initialChat();updateInput();render();chat.scrollTop=0;}
function switchChannel(channel){if(state.channel===channel)return;clearTimeout(idleTimer);clearTimeout(replyTimer);state.channel=channel;state.agentOff=true;state.nextOff=true;state.pending=null;state.view='off';document.querySelectorAll('[data-channel]').forEach(b=>{b.classList.toggle('active',b.dataset.channel===channel);b.setAttribute('aria-selected',b.dataset.channel===channel);});chat.innerHTML='';if(channel==='赛后')initialChat();else addSystem(channel==='好友'?'好友频道演示。不会重复推荐已关闭的彩蛋。':'全国频道演示。彩蛋已随着离开赛后聊天而退场。');render();status('已切换到'+channel+'频道。幕间彩蛋退场，本局不再重复推荐。');}
const actions={open:()=>{if(!state.agentOff)changeView(state.scenario==='none'?'polish':'cast')},dismiss,event:b=>chooseEvent(b.dataset.id),goal:b=>chooseGoal(b.dataset.id),tone:b=>{state.tone=b.dataset.id;state.selected=-1;state.round=0;render()},draft:b=>{const i=Number(b.dataset.index);writeDraft(getDrafts()[i],i)},'back-cast':()=>{state.goal=null;state.event=null;state.pending=null;changeView('cast')},'back-goal':()=>{state.goal=null;state.pending=null;changeView('goal')},shuffle:()=>{state.round++;state.selected=-1;render();toast('候选已更换，输入框原有文字保持不变。')},collapse,'open-next':()=>{if(!state.nextOff)changeView('next')},friend,invite,polish:b=>requestPolish(b.dataset.id),'polish-shuffle':()=>{if(!state.polishSource){requestPolish('natural');return;}state.round++;state.selected=-1;render();toast('只更换候选，不改动输入框。')},'polish-draft':b=>{const i=Number(b.dataset.index);writeDraft(polishTexts()[i],i)}};
layer.addEventListener('click',ev=>{const b=ev.target.closest('[data-action]');if(!b)return;ev.stopPropagation();const fn=actions[b.dataset.action];if(fn)fn(b)});
layer.addEventListener('keydown',ev=>{if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('[role="button"]')){ev.preventDefault();ev.target.click()}});
input.addEventListener('input',()=>{state.dirty=true;state.selected=-1;updateInput();layer.querySelectorAll('.draft-option.selected').forEach(e=>{e.classList.remove('selected');e.setAttribute('aria-pressed','false');});});
input.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey&&!ev.isComposing){ev.preventDefault();sendMessage();}});
$('send-button').onclick=sendMessage;$('reset-button').onclick=()=>{reset();toast('已重新开始这一局的演示。')};$('help-button').onclick=help;$('scenario').onchange=()=>{reset();toast('已切换本局场景，输入框与流程已重置。')};
$('reply-mode').onchange=()=>toast('下一次发送时，将模拟“'+$('reply-mode').selectedOptions[0].textContent+'”。');
$('voice-button').onclick=()=>toast('本原型不采集语音，请在输入框输入文字。');
$('emoji-button').onclick=()=>{const hidden=$('emoji-menu').hidden;$('emoji-menu').hidden=!hidden;$('emoji-button').setAttribute('aria-expanded',String(hidden));};
$('emoji-menu').onclick=ev=>{if(ev.target.tagName!=='BUTTON')return;const txt=ev.target.textContent;const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.value=(input.value.slice(0,start)+txt+input.value.slice(end)).slice(0,50);state.dirty=true;state.selected=-1;updateInput();input.focus();$('emoji-menu').hidden=true;$('emoji-button').setAttribute('aria-expanded','false');};
document.querySelectorAll('[data-channel]').forEach(b=>b.onclick=()=>switchChannel(b.dataset.channel));
function toggleFocus(){document.body.classList.toggle('focus-mode');$('exit-focus').hidden=!document.body.classList.contains('focus-mode');resize();}
$('focus-button').onclick=toggleFocus;$('exit-focus').onclick=toggleFocus;
document.addEventListener('keydown',ev=>{if(!$('modal-shade').hidden){if(ev.key==='Escape')closeDialog();if(ev.key==='Tab'){const list=$('modal-paper').querySelectorAll('button:not(:disabled),[tabindex="0"]');const first=list[0],last=list[list.length-1];if(ev.shiftKey&&(document.activeElement===first||document.activeElement===$('modal-paper'))){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&(document.activeElement===last||document.activeElement===$('modal-paper'))){ev.preventDefault();first.focus();}}return;}if(ev.key==='Escape'){if(!$('emoji-menu').hidden){$('emoji-menu').hidden=true;$('emoji-button').setAttribute('aria-expanded','false');}else if(state.view!=='off')dismiss();}});
let resizeQueued=false,lastSize='',viewportObserver=null,visibilityObserver=null;
const nextFrame=typeof window.requestAnimationFrame==='function'
  ? callback=>window.requestAnimationFrame(callback)
  : callback=>window.setTimeout(callback,16);
function resize(){
  const vp=$('viewport'),stage=$('stage'),wrap=$('stage-wrap');
  if(!vp || !stage || !wrap) return;
  const availableWidth=vp.clientWidth,availableHeight=vp.clientHeight;
  if(!Number.isFinite(availableWidth) || !Number.isFinite(availableHeight) || availableWidth<=0 || availableHeight<=0) return;
  const mobile=window.innerWidth<=760;
  const width=mobile?900:1672;
  const scale=mobile?availableWidth/width:Math.min(availableWidth/width,availableHeight/941);
  if(!Number.isFinite(scale) || scale<=0) return;
  const height=mobile?availableHeight/scale:941;
  if(!Number.isFinite(height) || height<=0) return;
  const size=[mobile,availableWidth,availableHeight].join(':');
  if(size===lastSize) return;
  lastSize=size;
  stage.classList.toggle('mobile',mobile);
  stage.style.width=width+'px';
  stage.style.height=height+'px';
  stage.style.transform=`scale(${scale})`;
  const compactPaper=mobile && height<480;
  stage.style.setProperty('--paper-bottom',compactPaper?'20px':'171px');
  stage.style.setProperty('--paper-max-height',Math.max(1,height-(compactPaper?40:291))+'px');
  wrap.style.width=width*scale+'px';
  wrap.style.height=height*scale+'px';
}
function scheduleResize(){
  if(resizeQueued) return;
  resizeQueued=true;
  nextFrame(()=>{resizeQueued=false;resize();});
}
window.addEventListener('resize',scheduleResize);
window.addEventListener('pageshow',scheduleResize);
document.addEventListener('visibilitychange',()=>{if(!document.hidden) scheduleResize();});
if(window.visualViewport && typeof window.visualViewport.addEventListener==='function'){
  window.visualViewport.addEventListener('resize',scheduleResize);
}
if(typeof window.ResizeObserver==='function'){
  viewportObserver=new window.ResizeObserver(scheduleResize);
  viewportObserver.observe($('viewport'));
}else if(typeof window.IntersectionObserver==='function'){
  visibilityObserver=new window.IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)) scheduleResize();
  });
  visibilityObserver.observe($('viewport'));
}
// One deferred measurement, not a retry loop when a parent keeps this demo hidden.
reset();resize();scheduleResize();
