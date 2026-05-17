(function () {
    const STARTUP_SOUND = '/audio/computer/computer-access.mp3';
    const intro = document.getElementById('intro');
    const shell = document.getElementById('shell');
    const accessBtn = document.getElementById('access-btn');
    const viewRoot = document.getElementById('view-root');
    const mainNav = document.getElementById('main-nav');
    const userChipEl = document.getElementById('user-chip');
    const authNavEl = document.getElementById('auth-nav');

    const CENTERED_ROUTES = ['login', 'register', 'onboard', 'profile'];

    let user = null;
    let meta = { categories: [], tags: [] };
    let introPlayed = false;
    let quillEditor = null;

    const startupAudio = new Audio(STARTUP_SOUND);
    startupAudio.volume = 0.55;

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str == null ? '' : String(str);
        return d.innerHTML;
    }

    function formatDate(iso) {
        try {
            return new Date(iso).toLocaleString(undefined, {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return iso;
        }
    }

    async function api(path, options = {}) {
        const res = await fetch(path, {
            credentials: 'include',
            ...options,
            headers: {
                ...(options.body instanceof FormData
                    ? {}
                    : { 'Content-Type': 'application/json' }),
                ...options.headers,
            },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    }

    function navigate(hash) {
        if (!hash.startsWith('#')) hash = '#' + hash;
        if (location.hash === hash) renderRoute();
        else location.hash = hash;
    }

    function afterAuthRedirect() {
        navigate(user?.onboarded ? '#/dashboard' : '#/onboard');
    }

    function parseRoute() {
        const raw = (location.hash || '#/').slice(1);
        const pathOnly = raw.split('?')[0].replace(/^\//, '');
        const parts = pathOnly.split('/').filter(Boolean);
        return { parts, name: parts[0] || 'home' };
    }

    function hashParams() {
        const hash = location.hash || '#/';
        const i = hash.indexOf('?');
        return new URLSearchParams(i >= 0 ? hash.slice(i + 1) : '');
    }

    function navigateSearch(params) {
        const qs = params.toString();
        navigate(qs ? '#/search?' + qs : '#/search');
    }

    const DEFAULT_CATEGORIES = [
        'General',
        'Incidents',
        'Research',
        'Field Reports',
        'RPD',
        'Umbrella',
        'Bioweapons',
    ];

    function editorCategoryOptions(current) {
        const selected = current || 'General';
        const cats = [
            ...new Set([...DEFAULT_CATEGORIES, ...(meta.categories || [])]),
        ].sort((a, b) => a.localeCompare(b));
        return cats
            .map(
                (c) =>
                    `<option value="${escapeHtml(c)}"${
                        c === selected ? ' selected' : ''
                    }>${escapeHtml(c)}</option>`
            )
            .join('');
    }

    function scrollViewRoot(deltaY) {
        const root = document.getElementById('view-root');
        if (!root) return false;
        const maxScroll = root.scrollHeight - root.clientHeight;
        if (maxScroll <= 0) return false;
        const next = Math.max(0, Math.min(maxScroll, root.scrollTop + deltaY));
        if (next === root.scrollTop) return false;
        root.scrollTop = next;
        return true;
    }

    function bubblePointerEvents() {
        ['mousemove', 'mousedown', 'mouseup'].forEach((type) => {
            document.addEventListener(type, (e) => {
                window.parent.postMessage(
                    { type, clientX: e.clientX, clientY: e.clientY },
                    '*'
                );
            });
        });
        document.addEventListener(
            'wheel',
            (e) => {
                if (scrollViewRoot(e.deltaY)) {
                    e.preventDefault();
                }
            },
            { passive: false }
        );
        document.addEventListener('keydown', (e) => {
            window.parent.postMessage({ type: 'keydown', key: e.key }, '*');
        });
        document.addEventListener('keyup', (e) => {
            window.parent.postMessage({ type: 'keyup', key: e.key }, '*');
        });
    }

    function playStartupSound() {
        if (introPlayed) return;
        introPlayed = true;
        startupAudio.currentTime = 0;
        startupAudio.play().catch(() => {});
    }

    async function refreshUser() {
        const data = await api('/api/auth/me');
        user = data.user;
        return user;
    }

    function notifyJournalAuth() {
        window.parent.postMessage({ type: 'journalAuthChanged' }, '*');
    }

    async function loadMeta() {
        meta = await api('/api/posts/meta');
    }

    function pageHeader(title, subtitle) {
        return `<header class="page-header">
            <h2 class="page-title">${title}</h2>
            ${subtitle ? `<p class="page-sub">${subtitle}</p>` : ''}
        </header>`;
    }

    function centeredPage(content) {
        return `<div class="page page--centered">${content}</div>`;
    }

    function setViewLayout(routeName) {
        viewRoot.classList.toggle('view-root--center', CENTERED_ROUTES.includes(routeName));
    }

    function renderNav() {
        const links = [
            { hash: '#/', label: 'Home', routes: ['home', ''] },
            { hash: '#/archives', label: 'Archives', routes: ['archives'] },
            { hash: '#/search', label: 'Search', routes: ['search'] },
        ];
        if (user) {
            links.push({
                hash: '#/dashboard',
                label: 'Dashboard',
                routes: ['dashboard', 'editor'],
            });
        }

        const route = parseRoute();
        const profileActive = ['profile', 'onboard'].includes(route.name);
        const userChip = user
            ? `<div class="user-menu">
                <button type="button" class="user-menu-trigger nav-user" aria-expanded="false" aria-haspopup="true" aria-controls="user-menu-dropdown" title="${escapeHtml(user.email)}">
                    ${
                        user.avatarUrl
                            ? `<img src="${escapeHtml(user.avatarUrl)}" alt="" />`
                            : '<span class="avatar-fallback" aria-hidden="true">☣</span>'
                    }
                    <span class="user-menu-name">${escapeHtml(user.name)}</span>
                    <span class="user-menu-chevron" aria-hidden="true"></span>
                </button>
                <div class="user-menu-dropdown" id="user-menu-dropdown">
                    <a href="#/profile" class="user-menu-item${profileActive ? ' active' : ''}">Profile</a>
                    <button type="button" class="user-menu-item user-menu-item--logout" data-logout>Sign out</button>
                </div>
            </div>`
            : '';

        if (userChipEl) {
            userChipEl.innerHTML = userChip;
            bindUserMenu();
        }

        if (authNavEl) {
            if (!user) {
                authNavEl.innerHTML = [
                    { hash: '#/login', label: 'Login', routes: ['login'] },
                    { hash: '#/register', label: 'Sign up', routes: ['register'] },
                ]
                    .map((l) => {
                        const active = l.routes.includes(route.name);
                        const primary = l.hash === '#/register';
                        return `<a href="${l.hash}" class="auth-nav-link${primary ? ' auth-nav-link--primary' : ''}${active ? ' active' : ''}">${l.label}</a>`;
                    })
                    .join('');
            } else {
                authNavEl.innerHTML = '';
            }
        }

        mainNav.innerHTML = links
            .map((l) => {
                const active = l.routes.includes(route.name);
                if (!l.label) return '';
                return `<a href="${l.hash}" class="nav-link${active ? ' active' : ''}">${l.label}</a>`;
            })
            .join('');
    }

    let userMenuListenersBound = false;

    function closeUserMenu() {
        const menu = userChipEl?.querySelector('.user-menu');
        if (!menu) return;
        menu.classList.remove('is-open');
        const trigger = menu.querySelector('.user-menu-trigger');
        trigger?.setAttribute('aria-expanded', 'false');
    }

    function bindUserMenu() {
        const menu = userChipEl?.querySelector('.user-menu');
        if (!menu) return;

        const trigger = menu.querySelector('.user-menu-trigger');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = !menu.classList.contains('is-open');
            menu.classList.toggle('is-open', open);
            trigger.setAttribute('aria-expanded', String(open));
        });

        menu.querySelector('[data-logout]')?.addEventListener('click', async () => {
            closeUserMenu();
            await api('/api/auth/logout', { method: 'POST' });
            user = null;
            notifyJournalAuth();
            navigate('#/');
        });

        menu.querySelector('a[href="#/profile"]')?.addEventListener('click', () => {
            closeUserMenu();
        });

        if (!userMenuListenersBound) {
            userMenuListenersBound = true;
            document.addEventListener('click', (e) => {
                if (e.target.closest('.user-menu')) return;
                closeUserMenu();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeUserMenu();
            });
        }
    }

    function postCardHtml(post) {
        const cover = post.coverImageUrl
            ? `<div class="cover" style="background-image:url('${escapeHtml(post.coverImageUrl)}')"></div>`
            : `<div class="cover placeholder" aria-hidden="true">☣</div>`;
        const tags = (post.tags || [])
            .map(
                (t) =>
                    `<button type="button" class="tag" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`
            )
            .join('');
        return `<article class="post-card" data-id="${escapeHtml(post.id)}" tabindex="0" role="button" aria-label="Read ${escapeHtml(post.title)}">
            ${cover}
            <div class="body">
                <div class="meta">${escapeHtml(post.category)} · ${formatDate(post.createdAt)}</div>
                <h3>${escapeHtml(post.title)}</h3>
                <p class="excerpt">${escapeHtml(post.excerpt)}</p>
                <div class="tag-list">${tags}</div>
                <span class="read-hint">Open case file →</span>
            </div>
        </article>`;
    }

    function bindPostCards() {
        viewRoot.querySelectorAll('.post-card').forEach((el) => {
            const go = () => navigate('#/post/' + el.dataset.id);
            el.addEventListener('click', go);
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    go();
                }
            });
        });
        viewRoot.querySelectorAll('.tag[data-tag]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigate('#/search?tag=' + encodeURIComponent(btn.dataset.tag));
            });
        });
    }

    function shareBar(post) {
        const url = encodeURIComponent(
            location.origin + location.pathname + '#/post/' + post.id
        );
        const title = encodeURIComponent(post.title);
        const text = encodeURIComponent(post.excerpt || post.title);
        return `<div class="share-bar" role="group" aria-label="Share post">
            <span>TRANSMIT CASE FILE</span>
            <a class="btn" href="mailto:?subject=${title}&body=${url}" target="_blank" rel="noopener">Email</a>
            <a class="btn" href="https://twitter.com/intent/tweet?text=${text}&url=${url}" target="_blank" rel="noopener">Twitter</a>
            <a class="btn" href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener">Facebook</a>
            <a class="btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" rel="noopener">LinkedIn</a>
            <button type="button" class="btn" data-copy="${escapeHtml(location.origin + location.pathname + '#/post/' + post.id)}">Copy Link</button>
        </div>`;
    }

    function bindShare() {
        viewRoot.querySelector('[data-copy]')?.addEventListener('click', async (e) => {
            const url = e.target.dataset.copy;
            try {
                await navigator.clipboard.writeText(url);
                e.target.textContent = 'Copied!';
                setTimeout(() => (e.target.textContent = 'Copy Link'), 2000);
            } catch {
                prompt('Copy link:', url);
            }
        });
    }

    async function viewHome() {
        viewRoot.innerHTML = '<p class="loading">DECRYPTING FEATURED FILES…</p>';
        const [featured, recent] = await Promise.all([
            api('/api/posts?featured=true&limit=3'),
            api('/api/posts?limit=4'),
        ]);
        viewRoot.innerHTML = `<div class="page">
            ${pageHeader('Command Briefing', 'Featured intelligence from Raccoon City field operatives')}
            <section class="section" aria-labelledby="featured-heading">
                <div class="section-head"><h3 id="featured-heading" class="section-title">Featured cases</h3></div>
                <ul class="post-grid">${featured.posts.map((p) => '<li>' + postCardHtml(p) + '</li>').join('') || '<li class="empty-state">No featured files</li>'}</ul>
            </section>
            <section class="section" aria-labelledby="recent-heading">
                <div class="section-head"><h3 id="recent-heading" class="section-title section-title--green">Recent transmissions</h3>
                <a href="#/archives" class="btn btn-ghost">View all →</a></div>
                <ul class="post-grid">${recent.posts.map((p) => '<li>' + postCardHtml(p) + '</li>').join('')}</ul>
            </section>
        </div>`;
        bindPostCards();
    }

    async function viewArchives(page = 1) {
        viewRoot.innerHTML = '<p class="loading">LOADING ARCHIVES…</p>';
        await loadMeta();
        const params = hashParams();
        const category = params.get('category') || '';
        const qs = new URLSearchParams({
            page: String(page),
            limit: '6',
        });
        if (category) qs.set('category', category);
        const data = await api('/api/posts?' + qs.toString());
        const { pagination } = data;
        const catFilters = meta.categories
            .map(
                (c) =>
                    `<button type="button" class="filter-chip${c === category ? ' active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
            )
            .join('');
        viewRoot.innerHTML = `<div class="page">
            ${pageHeader('Case File Archives', `${pagination.total} classified document(s) on record${category ? ' · ' + escapeHtml(category) : ''}`)}
            <div class="filter-group" role="navigation" aria-label="Filter by category">
                <button type="button" class="filter-chip${!category ? ' active' : ''}" data-cat="">All</button>
                ${catFilters}
            </div>
            <ul class="post-grid">${data.posts.map((p) => '<li>' + postCardHtml(p) + '</li>').join('') || '<li class="empty-state">No archives found</li>'}</ul>
            <nav class="pagination" aria-label="Pagination">
                <span class="info">Page ${pagination.page} of ${pagination.totalPages}</span>
                ${pagination.page > 1 ? `<button type="button" class="btn" data-page="${pagination.page - 1}">← Prev</button>` : ''}
                ${pagination.page < pagination.totalPages ? `<button type="button" class="btn" data-page="${pagination.page + 1}">Next →</button>` : ''}
            </nav>
        </div>`;
        bindPostCards();
        viewRoot.querySelectorAll('[data-cat]').forEach((b) => {
            b.addEventListener('click', () => {
                const c = b.dataset.cat;
                navigate(
                    c
                        ? '#/archives?category=' + encodeURIComponent(c)
                        : '#/archives'
                );
            });
        });
        viewRoot.querySelectorAll('[data-page]').forEach((b) => {
            b.addEventListener('click', () => {
                const nextPage = +b.dataset.page;
                const cat = hashParams().get('category');
                let h = nextPage > 1 ? `#/archives/${nextPage}` : '#/archives';
                if (cat) h += '?category=' + encodeURIComponent(cat);
                navigate(h);
            });
        });
    }

    async function viewSearch() {
        const params = hashParams();
        const q = params.get('q') || '';
        const category = params.get('category') || '';
        const tag = params.get('tag') || '';
        await loadMeta();

        viewRoot.innerHTML = `<div class="page">
            ${pageHeader('Intelligence Search', 'Filter by keyword, category, or tag')}
            <div class="grid-2">
                <div>
                    <form id="search-form" class="panel" role="search">
                        <div class="field"><label for="q">Keywords</label><input id="q" name="q" value="${escapeHtml(q)}" placeholder="Search reports…" /></div>
                        <div class="field"><label for="cat">Category</label>
                            <select id="cat" name="category"><option value="">All</option>
                            ${meta.categories.map((c) => `<option value="${escapeHtml(c)}"${c === category ? ' selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                            </select></div>
                        <button type="submit" class="btn btn-primary">Search Database</button>
                    </form>
                    <div id="search-results"><p class="loading">SCANNING…</p></div>
                </div>
                <aside class="sidebar panel">
                    <div class="filter-group"><h3>Categories</h3>
                    ${meta.categories.map((c) => `<button type="button" class="filter-chip${c === category ? ' active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('') || '<p class="empty-state">None</p>'}
                    </div>
                    <div class="filter-group"><h3>Tags</h3>
                    ${meta.tags.map((t) => `<button type="button" class="filter-chip${t === tag ? ' active' : ''}" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`).join('') || '<p class="empty-state">None</p>'}
                    </div>
                </aside>
            </div>
        </div>`;

        const runSearch = async () => {
            const hp = hashParams();
            const qs = new URLSearchParams();
            const nq = (document.getElementById('q')?.value ?? hp.get('q') ?? '').trim();
            const nc = document.getElementById('cat')?.value ?? hp.get('category') ?? '';
            const nt = hp.get('tag') || '';
            if (nq) qs.set('q', nq);
            if (nc) qs.set('category', nc);
            if (nt) qs.set('tag', nt);
            qs.set('limit', '12');
            const data = await api('/api/posts?' + qs.toString());
            const el = document.getElementById('search-results');
            if (!el) return;
            el.innerHTML = `<p class="page-sub">${data.pagination.total} result(s)</p>
                <ul class="post-grid">${data.posts.map((p) => '<li>' + postCardHtml(p) + '</li>').join('') || '<li class="empty-state">No matches</li>'}</ul>`;
            bindPostCards();
        };

        document.getElementById('search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const p = hashParams();
            const nq = document.getElementById('q').value.trim();
            const nc = document.getElementById('cat').value;
            if (nq) p.set('q', nq);
            else p.delete('q');
            if (nc) p.set('category', nc);
            else p.delete('category');
            navigateSearch(p);
        });

        document.getElementById('cat')?.addEventListener('change', () => {
            document.getElementById('search-form').requestSubmit();
        });

        viewRoot.querySelectorAll('[data-cat]').forEach((b) => {
            b.addEventListener('click', () => {
                const p = hashParams();
                const cat = b.dataset.cat;
                if (cat) p.set('category', cat);
                else p.delete('category');
                const qInput = document.getElementById('q');
                if (qInput) {
                    const nq = qInput.value.trim();
                    if (nq) p.set('q', nq);
                    else p.delete('q');
                }
                navigateSearch(p);
            });
        });
        viewRoot.querySelectorAll('[data-tag]').forEach((b) => {
            b.addEventListener('click', () => {
                const p = hashParams();
                p.set('tag', b.dataset.tag);
                navigateSearch(p);
            });
        });
        await runSearch();
    }

    async function viewPost(id) {
        viewRoot.innerHTML = '<p class="loading">OPENING CASE FILE…</p>';
        const [{ post }, { comments }] = await Promise.all([
            api('/api/posts/' + id),
            api('/api/posts/' + id + '/comments'),
        ]);

        const author = post.author || {};
        const avatar = author.avatarUrl
            ? `<img src="${escapeHtml(author.avatarUrl)}" alt="" />`
            : `<span class="avatar-fallback" aria-hidden="true">☣</span>`;

        viewRoot.innerHTML = `<div class="page">
            <article class="article-hero">
                ${post.coverImageUrl ? `<img class="cover" src="${escapeHtml(post.coverImageUrl)}" alt="" />` : ''}
                <header class="article-header">
                    <p class="category">${escapeHtml(post.category)}</p>
                    <h1>${escapeHtml(post.title)}</h1>
                    <div class="author-row">${avatar}<span>Agent <strong>${escapeHtml(author.name || 'Unknown')}</strong> · ${formatDate(post.createdAt)}</span></div>
                </header>
                ${shareBar(post)}
                <div class="rich-content">${post.bodyHtml}</div>
                <section class="comments-section" aria-labelledby="comments-heading">
                    <h3 id="comments-heading">Field Transmissions (${comments.length})</h3>
                    ${comments.map((c) => `<div class="comment"><span class="name">${escapeHtml(c.name)}</span><span class="date">${formatDate(c.createdAt)}</span><p class="text">${escapeHtml(c.body)}</p></div>`).join('') || '<p class="empty-state">No transmissions yet.</p>'}
                    <form id="comment-form" class="panel" style="margin-top:1rem">
                        <h3 style="font-size:0.7rem;color:var(--green);margin-bottom:0.5rem">SUBMIT TRANSMISSION</h3>
                        <p class="page-sub" style="margin-bottom:0.5rem">Email is encrypted and never displayed publicly.</p>
                        <div class="field"><label for="c-name">Your Name</label><input id="c-name" required maxlength="80" /></div>
                        <div class="field"><label for="c-email">Email (private)</label><input id="c-email" type="email" required /></div>
                        <div class="field"><label for="c-body">Message</label><textarea id="c-body" required maxlength="2000"></textarea></div>
                        <p id="c-msg" class="message"></p>
                        <button type="submit" class="btn btn-primary">Transmit</button>
                    </form>
                </section>
            </article>
            <p class="form-actions" style="margin-top:1.5rem"><a href="#/archives" class="btn">← Back to archives</a></p>
        </div>`;

        bindShare();
        document.getElementById('comment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('c-msg');
            try {
                await api('/api/posts/' + id + '/comments', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: document.getElementById('c-name').value,
                        email: document.getElementById('c-email').value,
                        body: document.getElementById('c-body').value,
                    }),
                });
                msg.className = 'message success';
                msg.textContent = 'Transmission received.';
                viewPost(id);
            } catch (err) {
                msg.className = 'message error';
                msg.textContent = err.message;
            }
        });
    }

    function viewLogin() {
        viewRoot.innerHTML = centeredPage(`${pageHeader('Agent login', 'Sign in to manage case files on the Umbrella archive')}
            <form id="login-form" class="panel panel--narrow">
                <div class="field"><label for="login-email">Email</label>
                <input id="login-email" type="email" autocomplete="email" required placeholder="agent@umbrella.corp" /></div>
                <div class="field"><label for="login-password">Password</label>
                <input id="login-password" type="password" autocomplete="current-password" required minlength="6" /></div>
                <p id="login-msg" class="message"></p>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Sign in</button>
                </div>
                <p class="field-hint" style="margin-top:1rem">No account? <a href="#/register">Create one</a></p>
            </form>`);

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('login-msg');
            try {
                const r = await api('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: document.getElementById('login-email').value,
                        password: document.getElementById('login-password').value,
                    }),
                });
                user = r.user;
                notifyJournalAuth();
                afterAuthRedirect();
            } catch (err) {
                msg.className = 'message error';
                msg.textContent = err.message;
            }
        });
    }

    function viewRegister() {
        viewRoot.innerHTML = centeredPage(`${pageHeader('Create account', 'Register with email and password — then set up your agent profile')}
            <form id="register-form" class="panel panel--narrow">
                <div class="field"><label for="reg-email">Email</label>
                <input id="reg-email" type="email" autocomplete="email" required placeholder="agent@umbrella.corp" /></div>
                <div class="field"><label for="reg-password">Password</label>
                <input id="reg-password" type="password" autocomplete="new-password" required minlength="6" placeholder="At least 6 characters" /></div>
                <p id="reg-msg" class="message"></p>
                <div class="form-actions"><button type="submit" class="btn btn-primary">Create account</button></div>
                <p class="field-hint" style="margin-top:1rem">Already registered? <a href="#/login">Sign in</a></p>
            </form>`);

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('reg-msg');
            try {
                const r = await api('/api/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: document.getElementById('reg-email').value,
                        password: document.getElementById('reg-password').value,
                    }),
                });
                user = r.user;
                notifyJournalAuth();
                afterAuthRedirect();
            } catch (err) {
                msg.className = 'message error';
                msg.textContent = err.message;
            }
        });
    }

    function viewOnboard() {
        const preview = user?.avatarUrl
            ? `<img class="avatar-preview" src="${escapeHtml(user.avatarUrl)}" alt="Current avatar" />`
            : '<div class="avatar-preview avatar-fallback" aria-hidden="true">☣</div>';

        viewRoot.innerHTML = centeredPage(`${pageHeader('Agent onboarding', 'Set your field identity before accessing classified systems')}
            <form id="onboard-form" class="panel panel--narrow">
                <div class="field">
                    <label for="ob-name">Display Name</label>
                    <input id="ob-name" required maxlength="80" value="${escapeHtml(user?.name || '')}" placeholder="e.g. Jill Valentine" />
                </div>
                <div class="field">
                    <label for="ob-avatar">Avatar Image</label>
                    ${preview}
                    <input id="ob-avatar" type="file" accept="image/*" />
                    <p class="field-hint">PNG or JPG, max 2MB.</p>
                </div>
                <p id="ob-msg" class="message"></p>
                <div class="form-actions"><button type="submit" class="btn btn-primary">Complete setup</button></div>
            </form>`);

        document.getElementById('onboard-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('ob-msg');
            const fd = new FormData();
            fd.append('name', document.getElementById('ob-name').value.trim());
            const file = document.getElementById('ob-avatar').files[0];
            if (file) fd.append('avatar', file);

            try {
                const res = await fetch('/api/users/onboard', {
                    method: 'POST',
                    credentials: 'include',
                    body: fd,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                user = data.user;
                msg.className = 'message success';
                msg.textContent = 'Profile registered. Entering command center…';
                setTimeout(() => navigate('#/dashboard'), 600);
            } catch (err) {
                msg.className = 'message error';
                msg.textContent = err.message;
            }
        });
    }

    async function viewProfile() {
        const preview = user?.avatarUrl
            ? `<img class="avatar-preview" src="${escapeHtml(user.avatarUrl)}" alt="Current avatar" />`
            : '<div class="avatar-preview avatar-fallback" aria-hidden="true">☣</div>';

        viewRoot.innerHTML = centeredPage(`${pageHeader('Agent profile', 'Update your display name and avatar')}
            <form id="profile-form" class="panel panel--narrow">
                <div class="field">
                    <label for="pf-name">Display Name</label>
                    <input id="pf-name" required maxlength="80" value="${escapeHtml(user?.name || '')}" />
                </div>
                <div class="field">
                    <label for="pf-avatar">Avatar Image</label>
                    ${preview}
                    <input id="pf-avatar" type="file" accept="image/*" />
                </div>
                <p id="pf-msg" class="message"></p>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save profile</button>
                    <a href="#/dashboard" class="btn">Back</a>
                </div>
            </form>`);

        document.getElementById('profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('pf-msg');
            try {
                const name = document.getElementById('pf-name').value.trim();
                const updated = await api('/api/users/me', {
                    method: 'PATCH',
                    body: JSON.stringify({ name }),
                });
                user = updated.user;

                const file = document.getElementById('pf-avatar').files[0];
                if (file) {
                    const fd = new FormData();
                    fd.append('avatar', file);
                    const res = await fetch('/api/users/avatar', {
                        method: 'POST',
                        credentials: 'include',
                        body: fd,
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    user = data.user;
                }

                msg.className = 'message success';
                msg.textContent = 'Profile updated.';
                renderNav();
            } catch (err) {
                msg.className = 'message error';
                msg.textContent = err.message;
            }
        });
    }

    async function viewDashboard() {
        viewRoot.innerHTML = '<p class="loading">LOADING COMMAND CENTER…</p>';
        const { posts } = await api('/api/posts/manage/mine');
        viewRoot.innerHTML = `<div class="page">
            <div class="toolbar">
                <h2 class="page-title">Operations dashboard</h2>
                <a href="#/editor/new" class="btn btn-primary">+ New case file</a>
            </div>
            <p class="page-sub">Manage your classified field reports</p>
            ${posts.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Title</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>
            ${posts.map((p) => `<tr>
                <td>${escapeHtml(p.title)}</td>
                <td><span class="status-pill ${p.published ? 'pub' : 'draft'}">${p.published ? 'PUBLISHED' : 'DRAFT'}</span></td>
                <td>${formatDate(p.updatedAt)}</td>
                <td class="table-actions">
                    <a href="#/editor/${p.id}" class="btn">Edit</a>
                    <button type="button" class="btn btn-danger" data-del="${p.id}">Delete</button>
                </td>
            </tr>`).join('')}
            </tbody></table></div>` : '<p class="empty-state">No reports yet. Create your first case file.</p>'}
        </div>`;

        viewRoot.querySelectorAll('[data-del]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this case file permanently?')) return;
                await api('/api/posts/' + btn.dataset.del, { method: 'DELETE' });
                viewDashboard();
            });
        });
    }

    function initQuill(content) {
        if (quillEditor) {
            quillEditor = null;
        }
        const el = document.getElementById('editor-body');
        if (!el) return null;
        quillEditor = new Quill(el, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ header: [2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote'],
                    ['clean'],
                ],
            },
        });
        if (content) quillEditor.root.innerHTML = content;
        return quillEditor;
    }

    async function viewEditor(id) {
        const isNew = id === 'new';
        let post = null;
        if (!isNew) {
            const data = await api('/api/posts/' + id);
            if (data.post.authorId !== user?.id) {
                viewRoot.innerHTML = '<p class="empty-state warn">Unauthorized</p>';
                return;
            }
            post = data.post;
        }
        await loadMeta();

        viewRoot.innerHTML = `<div class="page">
            ${pageHeader(isNew ? 'New case file' : 'Edit case file', 'Compose and publish field reports')}
            <form id="editor-form" class="panel">
                <div class="field"><label for="e-title">Title</label>
                <input id="e-title" required maxlength="160" value="${escapeHtml(post?.title || '')}" /></div>
                <div class="field"><label for="e-excerpt">Excerpt</label>
                <input id="e-excerpt" maxlength="300" value="${escapeHtml(post?.excerpt || '')}" placeholder="Short summary" /></div>
                <div class="field"><label for="e-category">Category</label>
                <select id="e-category" required>${editorCategoryOptions(post?.category)}</select></div>
                <div class="field"><label for="e-tags">Tags (comma-separated)</label>
                <input id="e-tags" value="${escapeHtml((post?.tags || []).join(', '))}" /></div>
                <div class="field"><label for="e-cover">Cover Image</label>
                <input id="e-cover" type="file" accept="image/*" />
                ${post?.coverImageUrl ? `<p class="page-sub">Current: ${escapeHtml(post.coverImageUrl)}</p>` : ''}</div>
                <div class="field"><label>Report Body (Rich Text)</label>
                <div id="editor-body"></div></div>
                <div class="checkbox-row">
                    <label><input type="checkbox" id="e-featured" ${post?.featured ? 'checked' : ''} /> Featured</label>
                    <label><input type="checkbox" id="e-published" ${post?.published !== false ? 'checked' : ''} /> Published</label>
                </div>
                <p id="e-msg" class="message"></p>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">${isNew ? 'Publish report' : 'Save changes'}</button>
                    <a href="#/dashboard" class="btn">Cancel</a>
                </div>
            </form>
        </div>`;

        initQuill(post?.bodyHtml || '<p>Begin your field report…</p>');

        document.getElementById('editor-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('e-msg');
            const fd = new FormData();
            fd.append('title', document.getElementById('e-title').value);
            fd.append('excerpt', document.getElementById('e-excerpt').value);
            fd.append('category', document.getElementById('e-category').value);
            fd.append('tags', document.getElementById('e-tags').value);
            fd.append('bodyHtml', quillEditor.root.innerHTML);
            fd.append('featured', document.getElementById('e-featured').checked ? 'true' : 'false');
            fd.append('published', document.getElementById('e-published').checked ? 'true' : 'false');
            const cover = document.getElementById('e-cover').files[0];
            if (cover) fd.append('cover', cover);

            try {
                const url = isNew ? '/api/posts' : '/api/posts/' + id;
                const res = await fetch(url, {
                    method: isNew ? 'POST' : 'PATCH',
                    credentials: 'include',
                    body: fd,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                msg.className = 'message success';
                msg.textContent = 'Report archived successfully.';
                setTimeout(() => navigate('#/dashboard'), 800);
            } catch (err) {
                msg.className = 'message error';
                msg.textContent = err.message;
            }
        });
    }

    async function renderRoute() {
        try {
            await refreshUser().catch(() => {
                user = null;
            });
            renderNav();

            const { parts, name } = parseRoute();

            const authRequired = ['dashboard', 'editor', 'profile', 'onboard'];
            if (authRequired.includes(name) && !user) {
                return navigate('#/login');
            }

            if (user && !user.onboarded) {
                if (!['onboard', 'login', 'register'].includes(name)) {
                    return navigate('#/onboard');
                }
            }

            if (name === 'onboard' && user?.onboarded) {
                return navigate('#/profile');
            }

            setViewLayout(name);
            viewRoot.focus();

            switch (name) {
                case 'home':
                case '':
                    return await viewHome();
                case 'archives':
                    return await viewArchives(+(parts[1] || 1) || 1);
                case 'search':
                    return await viewSearch();
                case 'post':
                    return await viewPost(parts[1]);
                case 'login':
                    return viewLogin();
                case 'register':
                    return viewRegister();
                case 'onboard':
                    return viewOnboard();
                case 'profile':
                    return await viewProfile();
                case 'dashboard':
                    return await viewDashboard();
                case 'editor':
                    return await viewEditor(parts[1] || 'new');
                default:
                    return navigate('#/');
            }
        } catch (e) {
            viewRoot.innerHTML = `<p class="empty-state warn">${escapeHtml(e.message)}<br><br>Ensure the server is running.</p>`;
        }
    }

    function bindArchiveGameTools() {
        const tools = document.getElementById('archive-game-tools');
        const journalBtn = document.getElementById('archive-journal-btn');
        const helpBtn = document.getElementById('archive-help-btn');
        if (!tools || !journalBtn || !helpBtn) return;

        journalBtn.addEventListener('click', async () => {
            try {
                await refreshUser();
            } catch {
                /* ignore */
            }
            if (!user) {
                navigate('#/login');
            }
            window.parent.postMessage({ type: 'openFieldJournal' }, '*');
        });
        helpBtn.addEventListener('click', () => {
            window.parent.postMessage({ type: 'openGameHelp' }, '*');
        });
    }

    function setArchiveGameToolsVisible(show) {
        const tools = document.getElementById('archive-game-tools');
        if (!tools) return;
        if (show) tools.removeAttribute('hidden');
        else tools.setAttribute('hidden', '');
    }

    function enterShell() {
        intro.classList.add('hidden');
        shell.classList.remove('hidden');
        setArchiveGameToolsVisible(true);
        renderRoute();
    }

    function resetIntro() {
        introPlayed = false;
        intro.classList.remove('hidden');
        shell.classList.add('hidden');
        setArchiveGameToolsVisible(false);
    }

    accessBtn.addEventListener('click', enterShell);
    bindArchiveGameTools();
    window.addEventListener('hashchange', renderRoute);

    async function handleJournalBridgeRequest(event) {
        const { id, action, path, method, body } = event.data || {};
        const respond = (payload) => {
            window.parent.postMessage(
                { type: 'journalBridgeResponse', id, ...payload },
                '*'
            );
        };

        try {
            if (action === 'authMe') {
                await refreshUser();
                respond({ ok: true, result: { user } });
                return;
            }
            if (action === 'api' && path) {
                const verb = (method || 'GET').toUpperCase();
                const hasBody =
                    body != null &&
                    verb !== 'GET' &&
                    verb !== 'HEAD';
                const r = await api(path, {
                    method: verb,
                    body: hasBody ? JSON.stringify(body) : undefined,
                });
                respond({ ok: true, result: r });
                return;
            }
            respond({ ok: false, error: 'Unknown journal bridge action.' });
        } catch (err) {
            respond({
                ok: false,
                error: err.message || 'Request failed',
                status: 401,
            });
        }
    }

    window.addEventListener('message', (event) => {
        if (!event.data) return;
        if (event.data.type === 'journalBridgeRequest') {
            handleJournalBridgeRequest(event);
            return;
        }
        if (event.data.type === 'computerEnter') {
            playStartupSound();
            if (shell.classList.contains('hidden')) enterShell();
        }
        if (event.data.type === 'computerLeave') resetIntro();
        if (event.data.type === 'navigate' && event.data.hash) {
            navigate(event.data.hash);
        }
    });

    bubblePointerEvents();
})();
