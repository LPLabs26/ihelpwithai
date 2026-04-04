(() => {
  const counters = document.querySelectorAll('[data-visit-counter]');
  if (!counters.length) return;

  const namespace = 'ihelpwithai';
  const key = 'site-visits';
  const storageKey = 'ihelpwithai-last-visit-hit';
  const now = Date.now();
  const lastHit = Number(localStorage.getItem(storageKey) || '0');
  const shouldIncrement = !lastHit || now - lastHit > 30 * 60 * 1000;
  const endpoint = shouldIncrement
    ? `https://api.countapi.xyz/hit/${namespace}/${key}`
    : `https://api.countapi.xyz/get/${namespace}/${key}`;

  fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      const value = Number(data?.value || 0);
      if (shouldIncrement) {
        localStorage.setItem(storageKey, String(now));
      }
      const label = value.toLocaleString();
      counters.forEach(node => {
        node.textContent = `Visits: ${label}`;
      });
    })
    .catch(() => {
      counters.forEach(node => {
        node.textContent = 'Visits unavailable';
      });
    });
})();
