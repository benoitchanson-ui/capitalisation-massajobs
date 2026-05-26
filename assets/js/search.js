/* Recherche interne Massajobs
 * - Charge assets/search-index.json à la première interaction
 * - Modale ouverte via bouton .search-toggle ou raccourci Cmd/Ctrl+K
 * - Tokenisation simple (accents normalisés), matching AND, scoring titre>texte
 * - Résultats : titre de section, page, snippet surligné
 */
(function () {
    'use strict';

    var INDEX = null;
    var INDEX_LOADING = null;
    var MODAL = null;
    var INPUT = null;
    var LIST = null;
    var STATUS = null;
    var ACTIVE_INDEX = -1;
    var LAST_RESULTS = [];

    function inPagesFolder() {
        return /\/pages\//.test(window.location.pathname);
    }
    function resolveIndexUrl() {
        return inPagesFolder() ? '../assets/search-index.json' : 'assets/search-index.json';
    }
    function resolveLinkUrl(rootRelativeUrl) {
        if (inPagesFolder()) {
            if (rootRelativeUrl.indexOf('pages/') === 0) {
                return rootRelativeUrl.substring('pages/'.length);
            }
            return '../' + rootRelativeUrl;
        }
        return rootRelativeUrl;
    }

    function normalize(s) {
        if (!s) return '';
        return s.toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9\s'-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    function tokenize(q) {
        return normalize(q).split(' ').filter(function (t) { return t.length >= 2; });
    }

    function ensureIndex() {
        if (INDEX) return Promise.resolve(INDEX);
        if (INDEX_LOADING) return INDEX_LOADING;
        STATUS.textContent = 'Chargement de l’index…';
        INDEX_LOADING = fetch(resolveIndexUrl(), { cache: 'force-cache' })
            .then(function (r) {
                if (!r.ok) throw new Error('Index HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) {
                INDEX = (data.entries || []).map(function (e) {
                    return {
                        page: e.page || '',
                        url: e.url || '',
                        heading: e.heading || '',
                        text: e.text || '',
                        nHeading: normalize(e.heading || ''),
                        nText: normalize(e.text || ''),
                        nPage: normalize(e.page || '')
                    };
                });
                STATUS.textContent = '';
                return INDEX;
            })
            .catch(function (err) {
                STATUS.textContent = 'Impossible de charger l’index de recherche.';
                console.error(err);
                INDEX_LOADING = null;
                throw err;
            });
        return INDEX_LOADING;
    }

    function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function search(query) {
        var tokens = tokenize(query);
        if (tokens.length === 0) return [];
        var results = [];
        for (var i = 0; i < INDEX.length; i++) {
            var e = INDEX[i];
            var score = 0;
            var allMatch = true;
            for (var j = 0; j < tokens.length; j++) {
                var t = tokens[j];
                var inH = e.nHeading.indexOf(t) !== -1;
                var inT = e.nText.indexOf(t) !== -1;
                var inP = e.nPage.indexOf(t) !== -1;
                if (!inH && !inT && !inP) { allMatch = false; break; }
                if (inH) score += 10;
                if (inP) score += 4;
                if (inT) score += 1;
                if (inH && new RegExp('(^|\\s)' + escapeRegex(t)).test(e.nHeading)) score += 5;
            }
            if (allMatch) results.push({ entry: e, score: score });
        }
        results.sort(function (a, b) { return b.score - a.score; });
        return results.slice(0, 25);
    }

    function buildSnippet(text, tokens) {
        if (!text) return '';
        var n = normalize(text);
        var firstIdx = -1;
        for (var i = 0; i < tokens.length; i++) {
            var k = n.indexOf(tokens[i]);
            if (k !== -1 && (firstIdx === -1 || k < firstIdx)) firstIdx = k;
        }
        if (firstIdx === -1) return text.length > 200 ? text.substring(0, 200) + '…' : text;
        var start = Math.max(0, firstIdx - 60);
        var end = Math.min(text.length, firstIdx + 180);
        var snippet = text.substring(start, end);
        if (start > 0) snippet = '…' + snippet;
        if (end < text.length) snippet = snippet + '…';
        return snippet;
    }

    function highlight(htmlSafeText, tokens) {
        if (!tokens.length) return htmlSafeText;
        var pattern = tokens.map(escapeRegex).join('|');
        var re = new RegExp('(' + pattern + ')', 'gi');
        return htmlSafeText.replace(re, '<mark>$1</mark>');
    }

    function escapeHtml(s) {
        return (s || '').replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function render(query) {
        LIST.innerHTML = '';
        ACTIVE_INDEX = -1;
        if (!query || query.trim().length < 2) {
            STATUS.textContent = 'Tapez au moins 2 caractères pour rechercher.';
            LAST_RESULTS = [];
            return;
        }
        var tokens = tokenize(query);
        var results = search(query);
        LAST_RESULTS = results;
        if (results.length === 0) {
            STATUS.textContent = 'Aucun résultat pour « ' + query + ' ».';
            return;
        }
        STATUS.textContent = results.length + ' résultat' + (results.length > 1 ? 's' : '') + ' pour « ' + query + ' ».';
        var frag = document.createDocumentFragment();
        for (var i = 0; i < results.length; i++) {
            var r = results[i].entry;
            var li = document.createElement('li');
            li.className = 'search-result';
            li.setAttribute('role', 'option');
            li.dataset.index = i;
            var url = resolveLinkUrl(r.url);
            var snippet = buildSnippet(r.text, tokens);
            li.innerHTML =
                '<a href="' + escapeHtml(url) + '" class="search-result__link">' +
                    '<div class="search-result__page">' + escapeHtml(r.page) + '</div>' +
                    '<div class="search-result__heading">' + highlight(escapeHtml(r.heading), tokens) + '</div>' +
                    (snippet ? '<div class="search-result__snippet">' + highlight(escapeHtml(snippet), tokens) + '</div>' : '') +
                '</a>';
            frag.appendChild(li);
        }
        LIST.appendChild(frag);
    }

    function openModal() {
        ensureIndex().then(function () {
            if (INPUT.value) render(INPUT.value);
        });
        MODAL.classList.add('open');
        MODAL.setAttribute('aria-hidden', 'false');
        document.body.classList.add('search-open');
        setTimeout(function () { INPUT.focus(); INPUT.select(); }, 30);
    }
    function closeModal() {
        MODAL.classList.remove('open');
        MODAL.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('search-open');
    }
    function setActive(idx) {
        var items = LIST.querySelectorAll('.search-result');
        if (!items.length) return;
        if (idx < 0) idx = items.length - 1;
        if (idx >= items.length) idx = 0;
        items.forEach(function (it) { it.classList.remove('is-active'); });
        items[idx].classList.add('is-active');
        items[idx].scrollIntoView({ block: 'nearest' });
        ACTIVE_INDEX = idx;
    }
    function activateCurrent() {
        var items = LIST.querySelectorAll('.search-result');
        if (!items.length) return;
        var idx = ACTIVE_INDEX >= 0 ? ACTIVE_INDEX : 0;
        var link = items[idx].querySelector('a');
        if (link) {
            closeModal();
            window.location.href = link.href;
        }
    }

    function buildModal() {
        MODAL = document.createElement('div');
        MODAL.className = 'search-modal';
        MODAL.setAttribute('role', 'dialog');
        MODAL.setAttribute('aria-modal', 'true');
        MODAL.setAttribute('aria-label', 'Recherche dans le site');
        MODAL.setAttribute('aria-hidden', 'true');
        MODAL.innerHTML =
            '<div class="search-modal__backdrop" data-close="1"></div>' +
            '<div class="search-modal__panel" role="document">' +
                '<div class="search-modal__head">' +
                    '<svg class="search-modal__icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
                    '<input type="search" class="search-modal__input" placeholder="Rechercher dans la matière, les outils, la méthode…" autocomplete="off" autocorrect="off" spellcheck="false" />' +
                    '<button type="button" class="search-modal__close" aria-label="Fermer la recherche" data-close="1">×</button>' +
                '</div>' +
                '<div class="search-modal__status" aria-live="polite"></div>' +
                '<ul class="search-modal__list" role="listbox"></ul>' +
                '<div class="search-modal__footer">' +
                    '<span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>' +
                    '<span><kbd>↵</kbd> ouvrir</span>' +
                    '<span><kbd>Esc</kbd> fermer</span>' +
                '</div>' +
            '</div>';
        document.body.appendChild(MODAL);
        INPUT = MODAL.querySelector('.search-modal__input');
        LIST = MODAL.querySelector('.search-modal__list');
        STATUS = MODAL.querySelector('.search-modal__status');

        MODAL.addEventListener('click', function (e) {
            if (e.target.dataset && e.target.dataset.close === '1') closeModal();
        });
        var debounceTimer = null;
        INPUT.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            var v = INPUT.value;
            debounceTimer = setTimeout(function () {
                ensureIndex().then(function () { render(v); });
            }, 90);
        });
        INPUT.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(ACTIVE_INDEX + 1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(ACTIVE_INDEX - 1); }
            else if (e.key === 'Enter') { e.preventDefault(); activateCurrent(); }
            else if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
        });
    }

    function onGlobalKey(e) {
        if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            if (MODAL && MODAL.classList.contains('open')) closeModal();
            else openModal();
        }
        if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) {
            if (!MODAL || !MODAL.classList.contains('open')) {
                e.preventDefault();
                openModal();
            }
        }
    }

    function init() {
        buildModal();
        var triggers = document.querySelectorAll('.search-toggle');
        triggers.forEach(function (t) {
            t.addEventListener('click', function (e) {
                e.preventDefault();
                openModal();
            });
        });
        document.addEventListener('keydown', onGlobalKey);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
