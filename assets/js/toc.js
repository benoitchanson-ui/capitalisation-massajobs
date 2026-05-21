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
