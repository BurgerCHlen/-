/* Имитация API и рендер таблицы */
(function(){
  const TABS = document.querySelectorAll('.tabs__btn');
  const BODY = document.getElementById('table-body');
  const ROW_TMPL = document.getElementById('row-template');

  const dataBase = createDatabase();

  function createDatabase(){
    const base = [
      { id:1, logo:'logo/1X-logo.png', rating:4.9, review_count:325, bonus_amount:25000, badge:'exclusive', internal_link:'/bk/1', external_link:'https://example.com/1' },
      { id:2, logo:'logo/FONBET-logo.png', rating:4.8, review_count:123, bonus_amount:101000, badge:'no-deposit', internal_link:'/bk/2', external_link:'https://example.com/2' },
      { id:3, logo:'logo/LEON-logo.png', rating:4.7, review_count:325, bonus_amount:10000, badge:'', internal_link:'/bk/3', external_link:'https://example.com/3' },
      { id:4, logo:'logo/WINLINE-logo.png', rating:4.6, review_count:43, bonus_amount:0, badge:'no-bonus', internal_link:'/bk/4', external_link:'https://example.com/4' },
      { id:5, logo:'logo/MELBET-logo.png', rating:5.0, review_count:34, bonus_amount:2500, badge:'no-deposit', internal_link:'/bk/5', external_link:'https://example.com/5' },
      { id:6, logo:'logo/1X-logo.png', rating:4.5, review_count:109, bonus_amount:9900, badge:'exclusive', internal_link:'/bk/6', external_link:'https://example.com/6' },
      { id:7, logo:'logo/FONBET-logo.png', rating:4.6, review_count:67, bonus_amount:0, badge:'no-bonus', internal_link:'/bk/7', external_link:'https://example.com/7' },
    ];
    return { base };
  }

  function mockFetch(url){
    // /topbk?type=byuser | byeditors | bybonus | bysubrating&id=reliability
    const urlObj = new URL(url, location.origin);
    const type = urlObj.searchParams.get('type') || 'byuser';
    const id = urlObj.searchParams.get('id');
    let arr = [...dataBase.base];
    switch(type){
      case 'byeditors':
        arr.sort((a,b)=> b.rating - a.rating);
        break;
      case 'bybonus':
        arr.sort((a,b)=> (b.bonus_amount||0) - (a.bonus_amount||0));
        break;
      case 'bysubrating':
        // для примера меняем порядок по id и мешаем
        if(id==='reliability') arr.sort((a,b)=> (a.id%2)-(b.id%2) || a.id-b.id);
        break;
      case 'byuser':
      default:
        // Фиксированный порядок, как в макете (не сортируем)
        arr = [...dataBase.base];
    }
    return new Promise(resolve=>{
      setTimeout(()=> resolve({ json:()=>Promise.resolve(arr) }), 350);
    });
  }

  function renderRows(items){
    BODY.innerHTML='';
    BODY.setAttribute('aria-busy','false');
    const fragment = document.createDocumentFragment();
    items.forEach(item=>{
      const node = ROW_TMPL.content.firstElementChild.cloneNode(true);
      const logo = node.querySelector('.bk-logo');
      logo.src = item.logo;
      logo.width = 115; logo.height = 20;
      logo.alt = 'Логотип букмекера #' + item.id;

      // Stars width from rating 0..5
      const percent = Math.max(0, Math.min(1, item.rating/5)) * 100;
      node.querySelector('.stars__fill').style.width = percent + '%';
      node.querySelector('.rating-text').textContent = item.rating.toFixed(1);
      node.querySelector('.reviews-text').textContent = item.review_count.toLocaleString('ru-RU');

      const badgeEl = node.querySelector('.badge');
      if(item.badge === 'exclusive'){
        badgeEl.textContent = 'Эксклюзив';
        badgeEl.dataset.kind = 'exclusive';
      } else if(item.badge === 'no-deposit'){
        badgeEl.textContent = 'Без депозита';
        badgeEl.dataset.kind = 'no-deposit';
      } else if(item.badge === 'no-bonus'){
        badgeEl.textContent = 'Нет бонуса';
        badgeEl.dataset.kind = 'no-bonus';
        badgeEl.style.background = '#fde9ea';
        badgeEl.style.color = '#9b1c1c';
      } else {
        badgeEl.remove();
      }

      const bonusText = node.querySelector('.bonus-text');
      if(item.bonus_amount>0){
        bonusText.classList.add('has-bonus');
        bonusText.textContent = formatMoney(item.bonus_amount);
      } else {
        bonusText.remove();
      }

      const reviewLink = node.querySelector('[data-role="review"]');
      reviewLink.href = item.internal_link;

      const siteLink = node.querySelector('[data-role="site"]');
      siteLink.href = item.external_link;

      // микро-анимация при фокусе
      node.addEventListener('pointerenter',()=> node.style.background='#fafafa');
      node.addEventListener('pointerleave',()=> node.style.background='');

      fragment.appendChild(node);
    });
    BODY.appendChild(fragment);
  }

  function formatMoney(n){
    const formatter = new Intl.NumberFormat('ru-RU');
    if(n>=1000) return formatter.format(Math.round(n/1000)) + 'K ₽';
    return formatter.format(n) + ' ₽';
  }

  async function load(type, extra){
    BODY.setAttribute('aria-busy','true');
    const qs = new URLSearchParams({ type, ...(extra||{}) }).toString();
    const res = await mockFetch('/topbk?'+qs);
    const data = await res.json();
    renderRows(data);
  }

  function setActive(btn){
    TABS.forEach(b=> b.classList.toggle('is-active', b===btn));
    TABS.forEach(b=> b.setAttribute('aria-selected', String(b===btn)));
  }

  TABS.forEach(btn=>{
    btn.addEventListener('click',()=>{
      setActive(btn);
      const type = btn.dataset.type;
      const id = btn.dataset.id;
      load(type, id?{ id }:undefined);
    });
  });

  // initial
  const initial = document.querySelector('.tabs__btn.is-active');
  // На моб. версии скрываем вкладки и используем byuser без сортировок
  const isMobile = matchMedia('(max-width: 768px)').matches;
  load(isMobile ? 'byuser' : initial.dataset.type);
})();


