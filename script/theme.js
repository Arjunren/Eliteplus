/* Shared Tailwind config + base styles for all ElitePlus+ pages.
   Loaded right after the Tailwind Play CDN, before page content renders. */
if (window.tailwind) {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: { DEFAULT: "#00eaff", dark: "#00b8cc", glow: "#5cf6ff" },
          ink: { 950: "#070709", 900: "#0c0c11", 800: "#16161d", 700: "#21212b" },
        },
        fontFamily: {
          sans: ['Montserrat', 'system-ui', 'Segoe UI', 'sans-serif'],
          display: ['Montserrat', 'system-ui', 'sans-serif'],
        },
        keyframes: {
          'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
          'fade-up': { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
          'scale-in': { '0%': { opacity: 0, transform: 'scale(.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
          shimmer: { '100%': { transform: 'translateX(100%)' } },
        },
        animation: {
          'fade-in': 'fade-in .4s ease both',
          'fade-up': 'fade-up .5s ease both',
          'scale-in': 'scale-in .3s ease both',
        },
      },
    },
  };
}

(function injectBaseStyles() {
  const css = `
    html { scroll-behavior: smooth; }
    body { font-family: 'Montserrat', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    /* Hide scrollbars on horizontal rows */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    /* Thin dark scrollbar for tables / panels */
    .thin-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .thin-scroll::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 8px; }
    .thin-scroll::-webkit-scrollbar-track { background: transparent; }
    /* Poster hover */
    .poster-card { transition: transform .25s ease, box-shadow .25s ease; }
    .poster-card:hover { transform: scale(1.06); z-index: 5; box-shadow: 0 12px 40px -8px rgba(0,0,0,.8); }
    /* Netflix-style intro */
    @keyframes ep-intro-pop { 0%{transform:scale(.4);opacity:0;letter-spacing:.6em;filter:blur(8px)} 45%{opacity:1;filter:blur(0)} 60%{transform:scale(1);letter-spacing:.05em} 100%{transform:scale(1);letter-spacing:.05em;opacity:1} }
    @keyframes ep-intro-sweep { 0%{transform:translateX(-130%) skewX(-12deg)} 100%{transform:translateX(230%) skewX(-12deg)} }
    @keyframes ep-intro-out { 0%{opacity:1} 100%{opacity:0;visibility:hidden} }
    @keyframes ep-plus { 0%,100%{text-shadow:0 0 18px rgba(0,234,255,.5)} 50%{text-shadow:0 0 42px rgba(0,234,255,.95)} }
    .ep-intro-text { animation: ep-intro-pop 1.7s cubic-bezier(.2,.8,.2,1) both; }
    .ep-intro-plus { animation: ep-plus 1.6s ease-in-out .9s 2; }
    .ep-intro-sweep { animation: ep-intro-sweep 1.1s ease .55s both; }
    .ep-intro-hide { animation: ep-intro-out .6s ease forwards; }
    /* progress shimmer for skeletons */
    .skeleton { position: relative; overflow: hidden; background:#16161d; }
    .skeleton::after { content:''; position:absolute; inset:0; transform:translateX(-100%);
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent); animation:shimmer 1.4s infinite; }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();
