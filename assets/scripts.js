
// Generic pagination renderer
function renderPaginatedGrid(options){
  const {containerId, items, itemsPerPage=15, sortFunc} = options;
  const grid = document.getElementById(containerId);
  if(!grid) return;

  let currentPage = 1;
  const sorted = sortFunc ? items.slice().sort(sortFunc) : items.slice().reverse(); // reversed by default so newest items (last in data) appear first
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));

  // Create pagination container
  let pagination = document.getElementById(containerId + '-pagination');
  if(!pagination){
    pagination = document.createElement('nav');
    pagination.id = containerId + '-pagination';
    pagination.className = 'pagination';
    grid.parentNode.insertBefore(pagination, grid.nextSibling);
  }

  function renderPage(page){
    if(page < 1) page = 1;
    if(page > totalPages) page = totalPages;
    currentPage = page;
    const start = (page-1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = sorted.slice(start, end);
    grid.innerHTML = pageItems.map(cardHTML).join('');
    attachCardClicks(grid);
    renderPagination();
  }

  function renderPagination(){
    let html = '';
    html += `<button class="pag-nav prev" data-page="${currentPage-1}" aria-label="Previous page" ${currentPage===1?'disabled':''}>‹ Prev</button>`;

    if(totalPages <= 7){
      for(let i=1;i<=totalPages;i++){
        html += `<button class="page-btn${i===currentPage?' active':''}" data-page="${i}">${i}</button>`;
      }
    } else {
      html += `<button class="page-btn${currentPage===1?' active':''}" data-page="1">1</button>`;
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);
      if(start > 2) html += `<span class="dots">…</span>`;
      for(let i=start; i<=end; i++){
        html += `<button class="page-btn${i===currentPage?' active':''}" data-page="${i}">${i}</button>`;
      }
      if(end < totalPages - 1) html += `<span class="dots">…</span>`;
      html += `<button class="page-btn${currentPage===totalPages?' active':''}" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button class="pag-nav next" data-page="${currentPage+1}" aria-label="Next page" ${currentPage===totalPages?'disabled':''}>Next ›</button>`;
    pagination.innerHTML = html;
    pagination.querySelectorAll('button[data-page]').forEach(btn => {
      const p = Number(btn.dataset.page);
      btn.onclick = () => { renderPage(p); grid.scrollIntoView({behavior:'smooth', block:'start'}); };
    });
  }

  renderPage(1);
}


// Main front-end logic for thisTV (static)
// Loads local data `data/movies.json` and renders pages.
// No frameworks — plain JS to keep static hosting simple.

const DATA_FILE = 'data/movies.json';

document.addEventListener('DOMContentLoaded', () => {
  setYear();
  bindHeaderSearch();
  enhancePerformance();
  loadData().then(data => {
    window._TV_DATA = data;
    renderHome(data); if (typeof renderHomePage === "function") renderHomePage(data);
    renderGenresPage(data);
    renderMoviesPage(data);
    renderWebseriesPage(data);
    renderTopIMDb(data);
    // render featured page if present
    if(typeof renderFeaturedPage === 'function') renderFeaturedPage(data);
    // populate movies industry dropdown in header
    try{ populateMoviesIndustryDropdown(data); }catch(e){/* ignore */}
    try{ populateMobileMoviesDropdown(data); }catch(e){/* ignore */}
  });

  // bindModalEvents(); // disabled: using direct card navigation now
});

// Performance enhancements: register service worker, preload minified CSS, lazy-load external fonts/icons
function enhancePerformance(){
  // register service worker if available
  if('serviceWorker' in navigator){
    try{ navigator.serviceWorker.register('/assets/sw.js', { scope: '/' }).catch(()=>{}); }catch(e){}
  }

  // prefer the minified stylesheet when supported
  try{
    const head = document.head || document.getElementsByTagName('head')[0];
    // preload minified css
    const pre = document.createElement('link');
    pre.rel = 'preload';
    pre.as = 'style';
    pre.href = 'assets/styles.min.css';
    head.appendChild(pre);
    // swap stylesheet after preload
    const swap = () => {
      const existing = document.querySelector('link[href="assets/styles.css"]');
      if(existing){
        const min = document.createElement('link'); min.rel = 'stylesheet'; min.href = 'assets/styles.min.css';
        existing.parentNode.insertBefore(min, existing.nextSibling);
        // keep original as fallback; don't remove to avoid flash if min fails
      }
    };
    // perform swap after a short idle
    if('requestIdleCallback' in window) requestIdleCallback(swap, {timeout:200}); else setTimeout(swap, 250);
  }catch(e){}

  // lazy-load Font Awesome icons to avoid blocking initial paint
  try{
    const fa = document.querySelector('link[href*="font-awesome"]');
    if(fa){
      fa.rel = 'preload'; fa.as = 'style';
      // load it non-blocking
      setTimeout(()=>{ fa.rel = 'stylesheet'; }, 500);
    }
  }catch(e){}
}

function setYear(){
  const y = new Date().getFullYear();
  document.querySelectorAll('[id^="year"]').forEach(el => el.textContent = y);
}

/* Fetch local JSON catalogue */
async function loadData(){
  try {
    const res = await fetch(DATA_FILE);
    if(!res.ok) throw new Error('Could not load data');
    return await res.json();
  } catch(err){
    console.error(err);
    return {items:[]};
  }
}

/* HEADER global search: navigate to Movies page with query (simple) */
function bindHeaderSearch(){
  // Small debounce utility to avoid thrashing localStorage on every keystroke
  function debounce(fn, wait){
    let t = null;
    return function(...args){
      if(t) clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  const ids = ['global-search','global-search-genres','global-search-movies','global-search-ws','global-search-top'];
  const elems = ids.map(id => document.getElementById(id)).filter(Boolean);
  if(elems.length === 0) return;

  const navigateWithEl = (el) => {
    if(!el) return;
    try{ localStorage.setItem('thisTV_q', el.value || ''); }catch(e){}
    window.location.href = 'movies.html';
  };

  const onKey = (ev) => {
    if(ev.key === 'Enter') navigateWithEl(ev.target);
  };

  // Attach handlers once; also save input value debounced so the last typed query is preserved
  elems.forEach(el => {
    el.addEventListener('keypress', onKey);
    const save = debounce((target) => { try{ localStorage.setItem('thisTV_q', target.value || ''); }catch(e){} }, 300);
    el.addEventListener('input', (ev) => save(ev.target));
  });
}

/* ----- HOME ----- */

function renderHome(data){
  renderPaginatedGrid({
    containerId: 'card-grid',
    items: data.items,
    itemsPerPage: 15
  });
}
/* ----- GENRES ----- */

/* ----- FEATURED ----- */
function renderFeaturedPage(data){
  const grid = document.getElementById('featured-grid');
  if(!grid) return;
  if(!data || !Array.isArray(data.items)) return;

  // Accept either 'recomendation' === 'Featured' (note spelling) or featured: true
  const items = data.items.filter(i => {
    if(!i) return false;
    if(typeof i.recomendation === 'string' && i.recomendation.toLowerCase() === 'featured') return true;
    if(i.featured === true) return true;
    return false;
  });

  renderPaginatedGrid({containerId: 'featured-grid', items: items, itemsPerPage: 15});
}

function renderGenresPage(data){
  const list = document.getElementById('genre-list');
  const grid = document.getElementById('genre-grid');
  if(!grid) return;
  const genreSelect = document.getElementById('genre-select');
  const genres = gatherGenres(data.items).filter(g => g);
  // populate list (chips) and select fallback
  if(list) {
    list.innerHTML = genres.map(g=>`<li data-genre="${escapeHtml(g)}">${escapeHtml(g)}</li>`).join('');
    // attach click handlers for chip-style filtering
    list.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => {
        // toggle active class
        list.querySelectorAll('li').forEach(x=>x.classList.remove('active'));
        li.classList.add('active');
        const genre = li.dataset.genre;
        const items = data.items.filter(i => i.genres && i.genres.includes(genre));
        renderPaginatedGrid({containerId: 'genre-grid', items: items, itemsPerPage: 15});
      });
    });
  }
  if(genreSelect) {
    genreSelect.innerHTML = `<option value="all">All genres</option>` + genres.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
  }

  function doRender(){
    let items = data.items;
    if(genreSelect && genreSelect.value !== 'all'){
      items = items.filter(i => i.genres.includes(genreSelect.value));
    }
    renderPaginatedGrid({containerId: 'genre-grid', items: items, itemsPerPage: 15});
  }
  if(genreSelect) genreSelect.addEventListener('change', doRender);
  // initial render uses select if present, otherwise render all
  doRender();
}


function gatherGenres(items){
  const s = new Set();
  items.forEach(it => it.genres.forEach(g => s.add(g)));
  return Array.from(s).sort();
}

// Populate Movies industry dropdown in header
function populateMoviesIndustryDropdown(data){
  if(!data || !Array.isArray(data.items)) return;
  const container = document.getElementById('movies-industry-dropdown');
  if(!container) return;

  // Build list of industries present in the dataset
  const set = new Set();
  data.items.forEach(it => { if(it && it.industry) set.add(it.industry); });
  const industries = Array.from(set).sort();

  // Render each industry link (no "All industries" option)
  const html = industries.map(ind => `<a href="movies.html?industry=${encodeURIComponent(ind)}" data-industry="${escapeHtml(ind)}">${escapeHtml(ind)}</a>`).join('\n');
  container.innerHTML = html;

  // Attach click handlers for SPA-like behavior on movies page
  function markDesktopActive(ind){
    container.querySelectorAll('a').forEach(el => el.classList.toggle('active', el.getAttribute('data-industry') === ind));
  }

  container.querySelectorAll('a[data-industry]').forEach(a => {
    a.addEventListener('click', (e) => {
      const ind = a.getAttribute('data-industry');
      if(location.pathname.endsWith('/movies.html') || location.pathname.endsWith('movies.html')){
        e.preventDefault();
        const url = new URL(location.href);
        url.searchParams.set('industry', ind);
        history.pushState({}, '', url);
        if(window._TV_DATA) renderMoviesPage(window._TV_DATA);
      }
      // mark active even on navigation
      markDesktopActive(ind);
    });
  });
  // mark initial active based on URL
  try{ const cur = (new URL(location.href)).searchParams.get('industry'); if(cur) markDesktopActive(cur); }catch(e){}
}

// Populate mobile movies dropdown and wire toggle behavior
function populateMobileMoviesDropdown(data){
  if(!data || !Array.isArray(data.items)) return;
  const mobileContainer = document.getElementById('mobile-movies-dropdown');
  const toggle = document.getElementById('mobile-movies-toggle');
  if(!mobileContainer || !toggle) return;

  // same industry list
  const set = new Set();
  data.items.forEach(it => { if(it && it.industry) set.add(it.industry); });
  const industries = Array.from(set).sort();

  // Add an "All Movies" option at the top for mobile which navigates to movies.html with no industry param
  const allHtml = `<a href="movies.html" data-industry="all">All Movies</a>`;
  mobileContainer.innerHTML = allHtml + '\n' + industries.map(ind => `<a href="movies.html?industry=${encodeURIComponent(ind)}" data-industry="${escapeHtml(ind)}">${escapeHtml(ind)}</a>`).join('\n');

  // toggle behavior
  toggle.addEventListener('click', (e) => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    if(open){
      mobileContainer.classList.remove('open');
      mobileContainer.setAttribute('aria-hidden','true');
    } else {
      mobileContainer.classList.add('open');
      mobileContainer.setAttribute('aria-hidden','false');
    }
  });

  // clicking a mobile industry link navigates (or SPA-like behavior)
  mobileContainer.querySelectorAll('a[data-industry]').forEach(a => {
    a.addEventListener('click', (e) => {
      const ind = a.getAttribute('data-industry');
      // If the clicked item is the All Movies link, navigate to movies.html without an industry param
      if(ind === 'all'){
        // allow normal navigation when not on movies page
        if(!(location.pathname.endsWith('/movies.html') || location.pathname.endsWith('movies.html'))){
          // normal navigation to movies.html
          return;
        }
        // If already on movies page, handle client-side: remove the industry param and re-render full unsorted list
        e.preventDefault();
        const url = new URL(location.href);
        url.searchParams.delete('industry');
        history.pushState({}, '', url);
        if(window._TV_DATA) renderMoviesPage(window._TV_DATA);
      } else {
        // normal navigation for industry items; if on movies page, do client-side filtering
        if(location.pathname.endsWith('/movies.html') || location.pathname.endsWith('movies.html')){
          e.preventDefault();
          const url = new URL(location.href);
          url.searchParams.set('industry', ind);
          history.pushState({}, '', url);
          if(window._TV_DATA) renderMoviesPage(window._TV_DATA);
        }
      }
      // mark active
      mobileContainer.querySelectorAll('a').forEach(el => el.classList.toggle('active', el.getAttribute('data-industry') === ind));
      // close mobile dropdown and main mobile nav
      mobileContainer.classList.remove('open');
      mobileContainer.setAttribute('aria-hidden','true');
      toggle.setAttribute('aria-expanded','false');
      // if mobile nav overlay is open, close it (hamburger toggles it)
      const mnav = document.getElementById('mobile-nav');
      if(mnav && mnav.getAttribute('aria-hidden') === 'false'){
        mnav.setAttribute('aria-hidden','true');
        const hamb = document.getElementById('hamburger');
        if(hamb) hamb.setAttribute('aria-expanded','false');
      }
    });
  });
  // set initial active based on URL
  try{ const cur = (new URL(location.href)).searchParams.get('industry'); if(cur){ mobileContainer.querySelectorAll('a').forEach(el => el.classList.toggle('active', el.getAttribute('data-industry') === cur)); } }catch(e){}
}

/* ----- MOVIES PAGE ----- */

function renderMoviesPage(data){
  const grid = document.getElementById('movies-grid');
  if(!grid) return;
  // read industry from query param if present
  const url = new URL(location.href);
  const industryParam = url.searchParams.get('industry');
  const searchInput = document.getElementById('movie-search');
  const genreSelect = document.getElementById('movie-genre');
  const sortSelect = document.getElementById('movie-sort');
  const allMovies = data.items.filter(i=>i.type==='movie');

  // populate genre select if present
  const genres = gatherGenres(allMovies).filter(g=>g);
  if(genreSelect) {
    genreSelect.innerHTML = `<option value="all">All genres</option>` + genres.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
  }

  function doRender(){
    let items = allMovies.slice();
    // apply industry filter from query param or dropdown selection
    if(industryParam){
      items = items.filter(i => i.industry === industryParam);
    }
    // search filter (by title)
    const q = searchInput ? (searchInput.value || '').trim().toLowerCase() : '';
    if(q){
      items = items.filter(i => (i.title || '').toLowerCase().includes(q));
    }
    // genre filter
    if(genreSelect && genreSelect.value !== 'all'){
      items = items.filter(i => i.genres && i.genres.includes(genreSelect.value));
    }
    // sort
    if(sortSelect){
      const s = sortSelect.value;
      if(s === 'rating'){
        items.sort((a,b)=> (b.imdb||0) - (a.imdb||0));
      } else if(s === 'popular'){
        items.sort((a,b)=> (b.popularity||0) - (a.popularity||0));
      }
    }
    renderPaginatedGrid({containerId: 'movies-grid', items: items, itemsPerPage: 15});
  }

  // bind events
  if(searchInput) searchInput.addEventListener('input', doRender);
  if(genreSelect) genreSelect.addEventListener('change', doRender);
  if(sortSelect) sortSelect.addEventListener('change', doRender);

  // handle search query passed via header (localStorage)
  const pendingQ = localStorage.getItem('thisTV_q');
  if(pendingQ){
    if(searchInput) searchInput.value = pendingQ;
    localStorage.removeItem('thisTV_q');
  }

  doRender();
}


/* ----- WEB-SERIES PAGE ----- */
function renderWebseriesPage(data){
  const grid = document.getElementById('ws-grid');
  if(!grid) return;
  renderPaginatedGrid({containerId: 'ws-grid', items: data.items.filter(i=>i.type==='webseries'), itemsPerPage: 15});
}

/* ----- TOP IMDb ----- */
function renderTopIMDb(data){
  const grid = document.getElementById('top-grid');
  if(!grid) return;
  renderPaginatedGrid({containerId: 'top-grid', items: data.items, itemsPerPage: 12, sortFunc: (a,b)=>b.imdb - a.imdb});
}


/* CARD html for items */
function cardHTML(item){
  const poster = item.poster || 'assets/placeholder.png';
  const sub = item.type === 'movie' ? `${item.year} • ${item.runtime || '—'}` : `${item.seasons ? item.seasons+' seasons' : 'Series'}`;
  const meta = `${sub} • IMDb ${item.imdb || '—'}`;

  return `
    <article class="card"
             data-id="${item.id}"
             data-page="${escapeHtml(item.link || '')}"
             tabindex="0"
             role="button"
             aria-pressed="false">
      <img loading="lazy" decoding="async" src="${poster}" alt="${escapeHtml(item.title)} poster">
      <div class="card-body">
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-meta">${escapeHtml(meta)}</div>
      </div>
    </article>`;
}

/* attach click handlers to cards to open modal */
function attachCardClicks(container){
  container.querySelectorAll('.card').forEach(card=>{
    const page = card.dataset.page;
    if(!page) return;

    card.addEventListener('click', (ev) => {
      window.location.href = page;
    });

    card.addEventListener('keypress', ev => {
      if(ev.key === 'Enter') window.location.href = page;
    });
  });
}


/* Modal details */
function openDetails(id){
  const data = window._TV_DATA;
  if(!data) return;
  const item = data.items.find(it=>String(it.id) === String(id));
  if(!item) return;
  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = `
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <img src="${item.poster || 'assets/placeholder.png'}" alt="${escapeHtml(item.title)} poster" style="width:220px;height:330px;object-fit:cover;border-radius:8px" />
      <div style="flex:1;min-width:220px">
        <h2 style="margin-top:0">${escapeHtml(item.title)} <span style="color:var(--muted);font-weight:600">(${item.year})</span></h2>
        <p style="color:var(--muted)">${escapeHtml(item.description || 'No description available.')}</p>
        <p style="margin:.4rem 0;color:var(--muted)"><strong>Genres:</strong> ${item.genres.join(', ')}</p>
        <p style="margin:.4rem 0;color:var(--muted)"><strong>IMDb:</strong> ${item.imdb} • <strong>Type:</strong> ${item.type}</p>
        ${item.trailer ? `<p><a href="${item.trailer}" target="_blank" rel="noopener">Watch trailer</a></p>` : ''}
        ${item.link ? `<p><a href="${item.link}" target="_blank" rel="noopener">Download or Watch</a></p>` : ''}
      </div>
    </div>
  `;
  const modal = document.getElementById('modal');
  modal.setAttribute('aria-hidden','false');
}

/* modal events */
function bindModalEvents(){
  const modal = document.getElementById('modal');
  const close = document.getElementById('modal-close');
  if(close) close.addEventListener('click', () => modal.setAttribute('aria-hidden','true'));
  window.addEventListener('click', e => {
    if(e.target === modal) modal.setAttribute('aria-hidden','true');
  });
  window.addEventListener('keydown', e => {
    if(e.key === 'Escape') modal.setAttribute('aria-hidden','true');
  });
}

/* Helpers */
function escapeHtml(s){ return (s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }


/* === Movie details page support ===
 - movie-details.html?id=<id>
 - Provides client-side editable description & screenshots saved to localStorage per-movie.
*/
function getQueryParam(name){
  const url = new URL(location.href);
  return url.searchParams.get(name);
}

function renderMovieDetails(data){
  if(!document.getElementById('movie-detail')) return;
  const id = getQueryParam('id');
  if(!id) {
    document.getElementById('movie-title').textContent = 'No movie selected';
    return;
  }
  const item = (data || window._TV_DATA || []).find(x => String(x.id) === String(id));
  if(!item){
    document.getElementById('movie-title').textContent = 'Movie not found';
    return;
  }
  document.getElementById('crumb-title').textContent = item.title;
  document.getElementById('movie-title').textContent = item.title + (item.year ? ' ('+item.year+')':'');
  document.getElementById('movie-meta').textContent = (item.runtime?item.runtime+' • ':'') + (item.imdb?('IMDb '+item.imdb):'');
  const posterDiv = document.getElementById('movie-poster');
  posterDiv.innerHTML = item.poster ? '<img src="'+item.poster+'" alt="'+escapeHtml(item.title)+' poster" class="detail-poster">' : '';

  // load saved edits from localStorage
  const key = 'thisTV_note_'+item.id;
  let saved = localStorage.getItem(key);
  if(saved){
    try{ saved = JSON.parse(saved); }catch(e){ saved=null; }
  }
  const descEl = document.getElementById('movie-description');
  descEl.textContent = (saved && saved.description) ? saved.description : (item.description || 'Write your notes here...');
  // screenshots
  const ssDiv = document.getElementById('movie-screenshots');
  ssDiv.innerHTML = '';
  const images = (saved && saved.screenshots) ? saved.screenshots : [];
  images.forEach((b64, idx) => {
    const img = document.createElement('img');
    img.src = b64;
    img.className = 'screenshot-thumb';
    img.alt = item.title + ' screenshot '+(idx+1);
    ssDiv.appendChild(img);
  });

  // wire up inputs
  document.getElementById('screenshot-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
      images.push(ev.target.result);
      localStorage.setItem(key, JSON.stringify({description: descEl.textContent, screenshots: images}));
      renderMovieDetails(window._TV_DATA);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('save-btn').addEventListener('click', () => {
    const payload = { description: descEl.textContent, screenshots: images };
    localStorage.setItem(key, JSON.stringify(payload));
    alert('Saved locally in your browser.');
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if(confirm('Reset your local edits for this movie?')) {
      localStorage.removeItem(key);
      renderMovieDetails(window._TV_DATA);
    }
  });
}

/* Attach click-to-open-detail behavior:
   If a movie card element has attribute data-movie-id, clicking it will navigate to movie-details.html?id=...
*/
function attachMovieLinking(){
  document.body.addEventListener('click', (e) => {
    // find closest element with data-movie-id
    const el = e.target.closest('[data-movie-id]');
    if(!el) return;
    // If user clicked a link (<a>), let it behave normally
    if(e.target.tagName === 'A') return;
    const id = el.getAttribute('data-movie-id');
    if(!id) return;
    // navigate
    location.href = 'movie-details.html?id=' + encodeURIComponent(id);
  });
}

// initialize details rendering on DOMContentLoaded too
document.addEventListener('DOMContentLoaded', () => {
  attachMovieLinking();
  // if data already loaded, render details immediately
  if(window._TV_DATA) renderMovieDetails(window._TV_DATA);
  else loadData().then(d => renderMovieDetails(d));
});




// --- Header Loader ---
async function loadSharedHeader(){
  const target = document.getElementById('site-header');
  if(!target) return;
  try {
    const res = await fetch('includes/header.html');
    if(!res.ok) throw new Error('Header not found');
    target.innerHTML = await res.text();

    // Inject light-weight performance hints into the document head when header loads
    try{
      const head = document.head || document.getElementsByTagName('head')[0];
      // preconnect to CDN used for icons/analytics
      const pc = document.createElement('link'); pc.rel = 'preconnect'; pc.href = 'https://cdnjs.cloudflare.com'; pc.crossOrigin = '';
      head.appendChild(pc);
      const pc2 = document.createElement('link'); pc2.rel = 'preconnect'; pc2.href = 'https://www.googletagmanager.com'; pc2.crossOrigin = '';
      head.appendChild(pc2);
      // preload minified CSS
      const pl = document.createElement('link'); pl.rel='preload'; pl.as='style'; pl.href='assets/styles.min.css'; head.appendChild(pl);
      // insert tiny critical CSS to reduce FOIT/FOUT (keeps it minimal)
      const crit = document.createElement('style');
      crit.textContent = `html,body{background:var(--bg);color:#fff}.site-header{visibility:visible}`;
      head.appendChild(crit);
    }catch(e){}
    // after inserting, initialize header-specific scripts
    setTimeout(() => {
      initMobileMenu();
      bindHeaderSearch();

      // ✅ Load footer only after header has finished
      // populate movies industry dropdown if data already loaded (fix header/data race)
  try{ if(window._TV_DATA) populateMoviesIndustryDropdown(window._TV_DATA); }catch(e){}
  try{ if(window._TV_DATA) populateMobileMoviesDropdown(window._TV_DATA); }catch(e){}
      // init header dropdown hover fallback
      try{ initHeaderDropdownHover(); }catch(e){}
      loadSharedFooter();
    }, 0);
  } catch(err){
    console.error('Header load error', err);
  }
}

document.addEventListener('DOMContentLoaded', loadSharedHeader);


// --- Footer Loader ---
async function loadSharedFooter(){
  const target = document.getElementById('site-footer');
  if(!target) return;
  try {
    const res = await fetch('includes/footer.html');
    if(!res.ok) throw new Error('Footer not found');
    target.innerHTML = await res.text();

    // Footer should NOT touch header logic
    if (typeof bindFooterSearch === "function") {
      bindFooterSearch();
    }
  } catch(err){
    console.error('Footer load error', err);
  }
}
// --- Mobile menu & iOS tweaks ---

function initMobileMenu(){
  const hamb = document.getElementById('hamburger');
  const mnav = document.getElementById('mobile-nav');
  if(!hamb || !mnav) return;

  function openMenu(){
    mnav.setAttribute('aria-hidden','false');
    hamb.setAttribute('aria-expanded','true');
    hamb.classList.add('is-active'); // added
    document.body.style.overflow = 'hidden';
  }

  function closeMenu(){
    mnav.setAttribute('aria-hidden','true');
    hamb.setAttribute('aria-expanded','false');
    hamb.classList.remove('is-active'); // added
    document.body.style.overflow = '';
  }

  hamb.addEventListener('click', ()=>{
    const open = hamb.getAttribute('aria-expanded') === 'true';
    if(open) closeMenu(); else openMenu();
  });

  mnav.addEventListener('click', e=>{
    if(e.target === mnav) closeMenu();
  });

  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') closeMenu();
  });

  mnav.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeMenu));
}


// JS fallback for dropdown hover (helps if CSS hover is unreliable)
function initHeaderDropdownHover(){
  const navDropdowns = document.querySelectorAll('.nav-dropdown');
  navDropdowns.forEach(nd => {
    nd.addEventListener('mouseenter', () => nd.classList.add('open'));
    nd.addEventListener('mouseleave', () => nd.classList.remove('open'));
    // also support focus within for keyboard users
    nd.addEventListener('focusin', () => nd.classList.add('open'));
    nd.addEventListener('focusout', () => nd.classList.remove('open'));
  });
}

// detect iOS and add class for targeted styles if needed
function detectiOS(){
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  if(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)){
    document.documentElement.classList.add('is-ios');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  initMobileMenu();
  detectiOS();
  try{ initHeaderDropdownHover(); }catch(e){}
});


// Added search functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      document.querySelectorAll('.movie-card').forEach(card => {
        const title = (card.dataset.title || '').toLowerCase();
        card.style.display = title.includes(query) ? 'block' : 'none';
      });
    });
  }
});


// Added genre chip filter
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.genre-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const genre = chip.dataset.genre.toLowerCase();
      document.querySelectorAll('.movie-card').forEach(card => {
        const genres = (card.dataset.genres || '').toLowerCase();
        card.style.display = genres.includes(genre) ? 'block' : 'none';
      });
    });
  });
});



// --- renderHomePage: main-content search & controls for index.html ---
function renderHomePage(data) {
  data = data || window._TV_DATA;
  if(!data || !data.items) return;
  // Look for a main search area in the current page
  const main = document.querySelector('main') || document.body;

  // Heuristics to find inputs/selects within the main section
  const searchInput = main.querySelector('input[placeholder*="Search" i], input[id*="search" i], input[class*="search" i], input.input-lg, input[type="search"], input[type="text"]');
  const genreSelect = main.querySelector('select[id*="genre" i], select[class*="genre" i], select.select-sm');
  const sortSelect  = main.querySelector('select[id*="sort" i], select[class*="sort" i], select.select-sm:nth-of-type(2)');

  // Find a grid container inside main (prefer id'd element, else .grid)
  let gridEl = main.querySelector('#home-grid, #grid, .grid, .cards, .card-grid');
  if(!gridEl) gridEl = main.querySelector('div');
  if(!gridEl) return;

  // Ensure the grid has an id for renderPaginatedGrid
  if(!gridEl.id) gridEl.id = 'home-grid-auto';
  const containerId = gridEl.id;

  const allItems = data.items.slice();

  // Populate genre select if present
  if(genreSelect) {
    try {
      const genres = gatherGenres(allItems).filter(g=>g);
      genreSelect.innerHTML = '<option value="all">All genres</option>' + genres.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
    } catch(e) { console.warn('renderHomePage: failed to populate genres', e); }
  }

  function applyFilters(){
    let items = allItems.slice();
    // search
    const q = searchInput ? (searchInput.value||'').trim().toLowerCase() : '';
    if(q) {
      items = items.filter(i => (i.title||'').toLowerCase().includes(q));
    }
    // genre
    if(genreSelect && genreSelect.value && genreSelect.value !== 'all') {
      const val = genreSelect.value;
      items = items.filter(i => (i.genres || '').includes(val));
    }
    // sort
    if(sortSelect) {
      const s = sortSelect.value;
      if(s === 'rating') items.sort((a,b)=> (b.imdb||0) - (a.imdb||0));
      else if(s === 'popular' || s === 'popularity') items.sort((a,b)=> (b.popularity||0) - (a.popularity||0));
      else if(s === 'year') items.sort((a,b)=> (b.year||0) - (a.year||0));
    }

    // Render using existing renderer
    try {
      renderPaginatedGrid({containerId: containerId, items: items, itemsPerPage: 15});
    } catch(e) {
      console.error('renderHomePage: renderPaginatedGrid failed', e);
    }
  }

  // Bind events
  if(searchInput) {
    searchInput.addEventListener('input', applyFilters);
    // If there's a stored search (from header) use it
    const pending = localStorage.getItem('thisTV_q');
    if(pending) {
      searchInput.value = pending;
      localStorage.removeItem('thisTV_q');
    }
  }
  if(genreSelect) genreSelect.addEventListener('change', applyFilters);
  if(sortSelect) sortSelect.addEventListener('change', applyFilters);

  // Initial render
  applyFilters();
}
// --- end renderHomePage ---

/* ----- SMART RELATED MOVIES/WEB SERIES ----- */
function renderRelated(data) {
  const grid = document.getElementById('related-grid');
  if (!grid) return;

  // --- Parse current movie details from JSON-LD in <head> ---
  const ldJsonEl = document.querySelector('script[type="application/ld+json"]');
  if (!ldJsonEl) return;
  let ldData;
  try {
    ldData = JSON.parse(ldJsonEl.textContent);
  } catch (e) {
    console.warn('Failed to parse JSON-LD:', e);
    return;
  }

  const currentGenres = (ldData.genre || []).map(g => g.toLowerCase());
  const currentTitleRaw = (ldData.name || '');

  if (!currentGenres.length) return;

  // normalize titles for robust comparisons (strip year/parentheses/punctuation)
  function normalizeTitle(t){
    if(!t) return '';
    let s = String(t).toLowerCase();
    s = s.replace(/\(.*?\)/g, ''); // remove parenthesis
    s = s.split('|')[0];
    s = s.split('-')[0];
    s = s.replace(/[^a-z0-9\s]/g, ' '); // drop punctuation
    s = s.replace(/\b(19|20)\d{2}\b/g, ''); // remove years
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  const currentNormalized = normalizeTitle(currentTitleRaw);

  // --- Compute genre overlap score and title-based boost (for sequels) ---
  // token utility and Jaccard similarity to detect near-duplicates (same movie with different qualifiers)
  function tokensOf(s){ return (s||'').split(/\s+/).filter(Boolean); }
  function jaccard(a, b){
    const A = new Set(tokensOf(a));
    const B = new Set(tokensOf(b));
    if(A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    A.forEach(x => { if(B.has(x)) inter++; });
    return inter / (A.size + B.size - inter);
  }

  let related = data.items
    .filter(i => {
      if (!i || !i.genres) return false;
      const candidateNorm = normalizeTitle(i.title || i.name || '');
      if (!candidateNorm) return false;
      // detect near-duplicate titles (same movie with different suffixes like "480p" or "Free Download")
      const sim = jaccard(candidateNorm, currentNormalized);
      if (sim >= 0.80) return false; // treat as same movie, skip
      // require at least one shared genre
      return i.genres.some(g => currentGenres.includes(g.toLowerCase()));
    })
    .map(i => {
      const overlap = i.genres.filter(g => currentGenres.includes(g.toLowerCase())).length;
      const candidateNorm = normalizeTitle(i.title || i.name || '');
      // title boost: if candidate contains the current base title (likely sequel/spinoff) but is not a near-duplicate, boost strongly
      const contains = candidateNorm && currentNormalized && (candidateNorm.includes(currentNormalized) || currentNormalized.includes(candidateNorm));
      const sim = jaccard(candidateNorm, currentNormalized);
      const titleBoost = contains && sim < 0.80 ? 100 : 0;
      return { ...i, _overlap: overlap, _titleBoost: titleBoost };
    });

  // --- Sort: title boost (sequels) > overlap > IMDb > popularity ---
  related.sort((a, b) => {
    if ((b._titleBoost || 0) !== (a._titleBoost || 0)) return (b._titleBoost || 0) - (a._titleBoost || 0);
    if (b._overlap !== a._overlap) return b._overlap - a._overlap;
    const imdbDiff = (b.imdb || 0) - (a.imdb || 0);
    if (imdbDiff !== 0) return imdbDiff;
    return (b.popularity || 0) - (a.popularity || 0);
  });

  // --- Take top 5 best matches ---
  const suggestions = related.slice(0, 5);

  if (suggestions.length > 0) {
    grid.innerHTML = suggestions.map(cardHTML).join('');
    attachCardClicks(grid);
  } else {
    document.getElementById('related-section').style.display = 'none';
  }
}

// Attach to existing load cycle
document.addEventListener('DOMContentLoaded', () => {
  if (window._TV_DATA) renderRelated(window._TV_DATA);
  else loadData().then(d => renderRelated(d));
});
