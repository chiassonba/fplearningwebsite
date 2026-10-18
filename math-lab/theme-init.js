// Only an appearance preference is stored. No learning records belong here.
(() => {
  let theme = 'dark';
  try {
    const saved = localStorage.getItem('fplab.theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch {
    // Storage may be disabled. Theme switching still works for this visit.
  }
  document.documentElement.dataset.theme = theme;
})();
