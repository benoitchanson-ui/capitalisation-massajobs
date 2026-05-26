// Sommaire latéral : surbrillance automatique de la section en cours de lecture
(function () {
    const tocLinks = document.querySelectorAll(".toc a[href^='#']");
    if (!tocLinks.length) return;

    const sections = [];
    tocLinks.forEach((link) => {
        const id = link.getAttribute("href").slice(1);
        const target = document.getElementById(id);
        if (target) sections.push({ link, target });
    });

    if (!sections.length) return;

    const HEADER_OFFSET = 120; // marge sous le header sticky

    function updateActive() {
        const scrollY = window.scrollY;
        let current = sections[0];

        for (const s of sections) {
            const top = s.target.getBoundingClientRect().top + scrollY;
            if (top - HEADER_OFFSET <= scrollY) {
                current = s;
            } else {
                break;
            }
        }

        tocLinks.forEach((l) => l.classList.remove("active"));
        if (current) current.link.classList.add("active");
    }

    // Throttle simple via requestAnimationFrame
    let ticking = false;
    window.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateActive();
                    ticking = false;
                });
                ticking = true;
            }
        },
        { passive: true }
    );

    // Au chargement
    updateActive();

    // Scroll doux sur clic + offset pour éviter d'être caché par le header
    tocLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            const id = link.getAttribute("href").slice(1);
            const target = document.getElementById(id);
            if (!target) return;
            e.preventDefault();
            const y = target.getBoundingClientRect().top + window.scrollY - 88;
            window.scrollTo({ top: y, behavior: "smooth" });
            history.replaceState(null, "", "#" + id);
        });
    });
})();

// ---------- Contrôles de taille de texte (A- / A+) ----------
(function () {
    var toc = document.querySelector('.toc');
    var reading = document.querySelector('.reading');
    if (!toc || !reading) return;

    var SIZES = ['text-small', '', 'text-large'];
    var LABELS = ['Petit', 'Normal', 'Grand'];
    var STORAGE_KEY = 'massajobs:reading-size';

    function apply(idx) {
        reading.classList.remove('text-small', 'text-large');
        if (SIZES[idx]) reading.classList.add(SIZES[idx]);
        if (label) label.textContent = LABELS[idx];
        try { localStorage.setItem(STORAGE_KEY, String(idx)); } catch (e) {}
    }

    // Lire la préférence avant tout (avant même le rendu visuel des contrôles)
    var saved = 1;
    try {
        var s = parseInt(localStorage.getItem(STORAGE_KEY), 10);
        if (s === 0 || s === 1 || s === 2) saved = s;
    } catch (e) {}

    // Construit la mini-barre de contrôles
    var wrap = document.createElement('div');
    wrap.className = 'toc__reading-controls';
    wrap.innerHTML =
        '<span class="toc__reading-label">Taille du texte</span>' +
        '<div class="toc__reading-buttons">' +
            '<button type="button" class="toc__reading-btn" data-action="dec" aria-label="Diminuer la taille du texte">A−</button>' +
            '<span class="toc__reading-value" aria-live="polite"></span>' +
            '<button type="button" class="toc__reading-btn" data-action="inc" aria-label="Augmenter la taille du texte">A+</button>' +
        '</div>';

    // Insérer juste avant "Haut de page"
    var backToTop = toc.querySelector('.toc__back-to-top');
    if (backToTop) toc.insertBefore(wrap, backToTop);
    else toc.appendChild(wrap);

    var label = wrap.querySelector('.toc__reading-value');
    var current = saved;
    apply(current);

    wrap.addEventListener('click', function (e) {
        var btn = e.target.closest('.toc__reading-btn');
        if (!btn) return;
        var action = btn.dataset.action;
        if (action === 'dec' && current > 0) current--;
        if (action === 'inc' && current < SIZES.length - 1) current++;
        apply(current);
    });
})();

// ---------- Barre de progression de lecture ----------
(function () {
    var reading = document.querySelector('.reading');
    if (!reading) return;

    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.innerHTML = '<div class="reading-progress__fill"></div>';
    document.body.appendChild(bar);
    var fill = bar.querySelector('.reading-progress__fill');

    function update() {
        var rect = reading.getBoundingClientRect();
        var start = window.scrollY + rect.top;
        var end = start + reading.offsetHeight - window.innerHeight;
        var progress = end > start
            ? (window.scrollY - start) / (end - start)
            : 0;
        progress = Math.max(0, Math.min(1, progress));
        fill.style.transform = 'scaleX(' + progress + ')';
    }

    var ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
})();

// ---------- Tooltips sur les renvois bibliographiques ----------
(function () {
    var links = document.querySelectorAll('a[href^="#ref-"]');
    if (!links.length) return;

    var tooltip = null;
    var currentLink = null;

    function ensureTooltip() {
        if (tooltip) return tooltip;
        tooltip = document.createElement('div');
        tooltip.className = 'biblio-tooltip';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.innerHTML =
            '<div class="biblio-tooltip__text"></div>' +
            '<a href="#" class="biblio-tooltip__jump">Voir dans la bibliographie →</a>' +
            '<button type="button" class="biblio-tooltip__close" aria-label="Fermer">×</button>';
        document.body.appendChild(tooltip);

        tooltip.querySelector('.biblio-tooltip__close').addEventListener('click', function (e) {
            e.preventDefault(); close();
        });
        tooltip.querySelector('.biblio-tooltip__jump').addEventListener('click', function (e) {
            e.preventDefault();
            if (currentLink) {
                var id = currentLink.getAttribute('href').slice(1);
                var t = document.getElementById(id);
                if (t) {
                    close();
                    var y = t.getBoundingClientRect().top + window.scrollY - 88;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                    t.classList.add('biblio-flash');
                    setTimeout(function () { t.classList.remove('biblio-flash'); }, 1600);
                }
            }
        });
        return tooltip;
    }

    function getRefText(id) {
        var target = document.getElementById(id);
        if (!target) return '';
        // Le contenu est généralement dans un <p id="ref-X-N">. On extrait le texte
        // tout en préservant les liens éventuels (vers livres, etc.).
        var clone = target.cloneNode(true);
        // Supprimer un éventuel chevron, ancre back-link, etc. — pas le cas ici
        return clone.innerHTML.trim();
    }

    function place(link) {
        var t = ensureTooltip();
        var rect = link.getBoundingClientRect();
        t.style.visibility = 'hidden';
        t.classList.add('open');
        // Mesurer hauteur après ajout pour positionner correctement
        var tHeight = t.offsetHeight;
        var tWidth = t.offsetWidth;
        var margin = 8;

        // X : centré sur le lien, mais contraint dans la fenêtre
        var x = rect.left + rect.width / 2 - tWidth / 2;
        x = Math.max(8, Math.min(window.innerWidth - tWidth - 8, x));
        // Y : préférer au-dessus, sinon en dessous
        var aboveY = rect.top - tHeight - margin;
        var belowY = rect.bottom + margin;
        var y, position;
        if (aboveY >= 8) { y = aboveY; position = 'top'; }
        else { y = belowY; position = 'bottom'; }

        t.style.left = (x + window.scrollX) + 'px';
        t.style.top = (y + window.scrollY) + 'px';
        t.dataset.position = position;
        // Arrow position : aligné sous/au-dessus du lien
        var arrowX = rect.left + rect.width / 2 - x;
        t.style.setProperty('--arrow-x', arrowX + 'px');
        t.style.visibility = '';
    }

    function open(link) {
        var id = link.getAttribute('href').slice(1);
        var refHtml = getRefText(id);
        if (!refHtml) return false;
        var t = ensureTooltip();
        t.querySelector('.biblio-tooltip__text').innerHTML = refHtml;
        currentLink = link;
        place(link);
        return true;
    }

    function close() {
        if (tooltip) tooltip.classList.remove('open');
        currentLink = null;
    }

    links.forEach(function (link) {
        link.addEventListener('click', function (e) {
            // Ne pas intercepter si l'utilisateur a Cmd/Ctrl/clic milieu (nouvel onglet)
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
            if (open(link)) e.preventDefault();
        });
    });

    document.addEventListener('click', function (e) {
        if (!tooltip || !tooltip.classList.contains('open')) return;
        if (tooltip.contains(e.target)) return;
        if (e.target.closest && e.target.closest('a[href^="#ref-"]')) return;
        close();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
    });
    window.addEventListener('resize', function () {
        if (currentLink && tooltip && tooltip.classList.contains('open')) place(currentLink);
    });
    window.addEventListener('scroll', function () {
        if (currentLink && tooltip && tooltip.classList.contains('open')) place(currentLink);
    }, { passive: true });
})();

// ---------- Tiroir TOC mobile ----------
(function () {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    // Bouton flottant (FAB)
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'toc-fab';
    fab.setAttribute('aria-label', 'Ouvrir le sommaire');
    fab.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>' +
        '<span>Sommaire</span>';
    document.body.appendChild(fab);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.className = 'toc-backdrop';
    document.body.appendChild(backdrop);

    function openDrawer() {
        document.body.classList.add('toc-open');
        fab.setAttribute('aria-expanded', 'true');
    }
    function closeDrawer() {
        document.body.classList.remove('toc-open');
        fab.setAttribute('aria-expanded', 'false');
    }
    function toggleDrawer() {
        if (document.body.classList.contains('toc-open')) closeDrawer();
        else openDrawer();
    }

    fab.addEventListener('click', toggleDrawer);
    backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeDrawer();
    });
    // Fermer le drawer quand on clique sur un lien du TOC
    toc.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function () {
            if (window.matchMedia('(max-width: 1024px)').matches) closeDrawer();
        });
    });
})();
