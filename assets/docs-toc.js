/* CBFX Hub — docs TOC scrollspy
 * Highlights the active link in .docs-toc as you scroll.
 * Smooth-scrolls TOC links to their sections with header offset.
 */
(function(){
  function init(){
    const toc = document.querySelector('.docs-toc');
    if (!toc) return;

    const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    const sections = links.map(a => {
      const id = a.getAttribute('href').slice(1);
      return { link: a, el: document.getElementById(id) };
    }).filter(s => s.el);

    // Smooth scroll with offset for any sticky topbar
    links.forEach(a => {
      a.addEventListener('click', function(e){
        const id = this.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({top:y, behavior:'smooth'});
        history.replaceState(null, '', '#' + id);
      });
    });

    // Scrollspy via IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          links.forEach(l => l.classList.remove('active'));
          const id = entry.target.id;
          const link = toc.querySelector('a[href="#' + id + '"]');
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s.el));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
