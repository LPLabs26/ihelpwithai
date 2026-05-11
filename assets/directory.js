(function(){
const t=document.querySelector('[data-menu-toggle]');const m=document.querySelector('[data-menu]');if(t&&m){t.addEventListener('click',()=>{m.classList.toggle('open');});}
const search=document.querySelector('[data-tool-search]');const cat=document.querySelector('[data-tool-category]');const cards=[...document.querySelectorAll('[data-tool-card]')];
function filter(){if(!search&&!cat)return;const q=(search?.value||'').toLowerCase();const c=(cat?.value||'all').toLowerCase();cards.forEach(card=>{const text=card.innerText.toLowerCase();const k=card.getAttribute('data-category');const okQ=!q||text.includes(q);const okC=c==='all'||k===c;card.style.display=(okQ&&okC)?'block':'none';});}
search&&search.addEventListener('input',filter);cat&&cat.addEventListener('change',filter);
const quiz=document.querySelector('[data-quiz]');if(quiz){const questions=[...quiz.querySelectorAll('[data-question]')];let idx=0;const answers={};const rules={content:['ChatGPT','Claude','Jasper'],automation:['Make.com','Zapier','n8n'],support:['Intercom AI','Tidio','Otter.ai'],coding:['GitHub Copilot','Cursor','Replit AI'],research:['ChatGPT','Claude','Notion AI']};
function show(i){questions.forEach((q,qi)=>q.classList.toggle('hidden',qi!==i));}
quiz.addEventListener('click',e=>{const b=e.target.closest('[data-answer]');if(!b)return;const q=b.closest('[data-question]');answers[q.dataset.question]=b.dataset.answer;idx++;if(idx<questions.length)show(idx);else render();});
function render(){const goal=answers.goal||'content';const picks=(rules[goal]||rules.content).slice();if(answers.budget==='free')picks[2]='Canva AI';if(answers.tech==='beginner')picks[1]='Notion AI';const out=document.querySelector('[data-results]');out.innerHTML='<h3>Your shortlist</h3>'+picks.map(p=>`<div class="card"><strong>${p}</strong><p class="muted">Recommended because it fits your goal, team size, and budget profile.</p></div>`).join('');out.classList.remove('hidden');quiz.classList.add('hidden');}
show(0);
}
})();
