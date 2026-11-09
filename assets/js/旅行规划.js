function setNav(active){
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    if(active==='Plan') document.getElementById('navPlan').classList.add('active');
    if(active==='Discover') document.getElementById('navDiscover').classList.add('active');
    if(active==='Map') document.getElementById('navMap').classList.add('active');
  }

  const agentCopy = {
    home:['Trip Agent 统一入口','从一句话、截图、链接、订单或他人行程开始。'],
    clarify:['Agent 正在澄清需求','只确认影响方案质量的关键约束。'],
    goal:['Agent 正在推进任务','目标已结构化，多 Agent 正在协同检索。'],
    explore:['偏好模型正在更新','收藏、加入候选或不感兴趣都会影响推荐。'],
    decision:['Agent 正在压缩选择','已从大量资源中保留 3 套可执行方案。'],
    workspace:['Workspace 已就绪','地图、时间轴、预算、任务和预订状态联动。'],
    action:['Agent 正在执行','支付和高风险操作仍由用户确认。'],
    tripobject:['Trip Object 持续运行','订单、待办、提醒和异常监测已聚合。'],
    replan:['Agent 正在重规划','已分析影响范围，等待授权执行。']
  };

  function go(id, nav){
    const target=document.getElementById(id);
    if(!target || !agentCopy[id]) return;
    document.querySelectorAll('.modal-mask').forEach(modal=>modal.classList.remove('show'));
    document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s===target));
    document.querySelector('.content').scrollTop=0;
    target.scrollTop=0;
    setNav(nav || 'Plan');
    document.getElementById('agentPill').textContent = 'Agent Demo';
    document.getElementById('agentTitle').textContent = agentCopy[id][0];
    document.getElementById('agentDesc').textContent = agentCopy[id][1];
  }

  document.getElementById('navPlan').addEventListener('click',()=>go('home','Plan'));
  document.getElementById('navDiscover').addEventListener('click',()=>go('explore','Discover'));
  document.getElementById('navMap').addEventListener('click',()=>go('workspace','Map'));

  document.querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('click',()=>chip.classList.toggle('selected'));
  });

  function addShort(name){
    const el=document.getElementById('shortText');
    if(!el.textContent.includes(name)){
      el.textContent += '，' + name;
      demoFeedback('已加入本地候选：'+name+'。未调用推荐后台。');
    }else{
      demoFeedback(name+'已在本地候选列表中。');
    }
  }

  function showImpact(){
    document.getElementById('impactModal').classList.add('show');
  }
  function hideImpact(applySuggestion){
    document.getElementById('impactModal').classList.remove('show');
    document.getElementById('agentTitle').textContent=applySuggestion?'演示：已应用 Agent 建议':'演示：已保留我的调整';
    document.getElementById('agentDesc').textContent=applySuggestion
      ?'示例方案减少 40min 路程，未修改任何真实预约。'
      :'保留原调整；交通 +32min、步行 +1.8km，晚餐可能延迟。';
    demoFeedback(applySuggestion?'已应用建议到本地预览，未执行真实预订。':'已保留你的调整，未应用 Agent 建议，请留意交通与晚餐风险。');
  }
  function showAdjustDone(){
    document.getElementById('adjustModal').classList.add('show');
  }
  function hideAdjustDone(){
    document.getElementById('adjustModal').classList.remove('show');
    go('tripobject','Plan');
    document.getElementById('agentTitle').textContent='演示调整已确认';
    document.getElementById('agentDesc').textContent='仅更新本地演示状态，未联系酒店或同步真实订单。';
    demoFeedback('已返回旅行示例，未执行改签、取消、通知或日历同步。');
  }

  let feedbackTimer;
  function demoFeedback(message){
    const feedback=document.getElementById('demoFeedback');
    clearTimeout(feedbackTimer);
    feedback.textContent=message;
    feedback.hidden=false;
    feedbackTimer=setTimeout(()=>{feedback.hidden=true;},4200);
  }

  function previewBooking(){
    go('tripobject','Plan');
    demoFeedback('仅展示固定预订完成示例，未付款、未出票、未调用任何后台。');
  }

  // Only otherwise-unhandled buttons receive demo feedback; existing flows stay intact.
  document.querySelectorAll('button').forEach(button=>{
    if(button.hasAttribute('onclick') || button.closest('.nav')) return;
    button.addEventListener('click',()=>{
      const label=button.textContent.trim();
      const card=button.closest('.destination-card');
      const name=card ? card.querySelector('h3').textContent : '';
      if(label==='Create It Myself'){
        go('goal','Plan');
        demoFeedback('Manual planning preview: sample fields only; no trip is saved.');
      }else if(label==='Edit any field'){
        go('clarify','Plan');
        demoFeedback('Edit preferences in this local demo; no AI request will be sent.');
      }else if(label==='收藏' || label==='已收藏'){
        const saved=button.getAttribute('aria-pressed')!=='true';
        button.setAttribute('aria-pressed',String(saved));
        button.textContent=saved?'已收藏':'收藏';
        demoFeedback((saved?'已在本页收藏：':'已取消本页收藏：')+name+'。刷新后重置。');
      }else if(label==='不感兴趣' || label==='已标记'){
        const marked=button.getAttribute('aria-pressed')!=='true';
        button.setAttribute('aria-pressed',String(marked));
        button.textContent=marked?'已标记':'不感兴趣';
        demoFeedback((marked?'已在本页标记不感兴趣：':'已取消标记：')+name+'。不会更新真实推荐模型。');
      }else if(label==='解释' && card){
        demoFeedback('示例说明：'+card.querySelector('.destination-body > .sub').textContent);
      }else if(button.closest('.day-tabs')){
        demoFeedback(label+' is a static preview. The sample Day 2 itinerary remains displayed.');
      }else{
        demoFeedback('“'+label+'”仅提供本地演示反馈，未执行交易或后台任务。');
      }
    });
  });
