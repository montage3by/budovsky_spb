// Минимальная реализация API дашборда для автономной версии сайта.
// Загружает JSON из /data, считает calc-показатели и перерисовывает блоки data-draw.
(function () {
  const DATASETS = ['campaigns', 'totals', 'leads_service', 'leads_source'];
  const store = {};
  const calcs = {};
  const draws = {};
  const listeners = [];
  let params = { period: null };

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const dash = {
    colors: [],
    data(id) {
      if (id in calcs) {
        const c = calcs[id];
        const ins = c.inputs.map((i) => dash.data(i));
        if (ins.some((d) => d.status !== 'ok')) return { status: 'loading', data: [] };
        try { return { status: 'ok', data: c.fn(...ins.map((d) => d.data)) }; }
        catch (e) { console.error(e); return { status: 'error', data: [], message: String(e) }; }
      }
      return store[id] || { status: 'loading', data: [] };
    },
    calc(id, def) { calcs[id] = def; },
    loader() {},
    onData(fn) { listeners.push(fn); try { fn(); } catch (e) { console.error(e); } },
    draw(name, fn) { if (fn) { draws[name] = fn; } redraw(name); },
    params() { return { ...params }; },
    setParams(p) { params = { ...params, ...p }; render(); },
    resetParams() { params = { period: null }; render(); },
    setLink(name) { try { history.replaceState(null, '', '#' + name); } catch (e) {} },
    refresh() {},
  };

  function visible(el) { return !el.closest('[hidden]'); }

  function redraw(name) {
    const fn = draws[name];
    if (!fn) return;
    document.querySelectorAll('[data-draw="' + name + '"]').forEach((el) => {
      if (!visible(el)) return;
      try { (typeof fn === 'function' ? fn : fn.update)(el); } catch (e) { console.error(e); }
    });
  }

  function render() {
    dash.colors = [css('--chart-1'), css('--chart-2'), css('--chart-3'), css('--chart-4')];
    listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    Object.keys(draws).forEach(redraw);
  }

  window.dash = dash;
  dash.colors = [css('--chart-1'), css('--chart-2'), css('--chart-3'), css('--chart-4')];

  document.addEventListener('DOMContentLoaded', () => {
    Promise.all(DATASETS.map((id) =>
      fetch('data/' + id + '.json', { cache: 'no-cache' })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((rows) => { store[id] = { status: 'ok', data: rows }; })
        .catch((e) => { store[id] = { status: 'error', data: [], message: String(e) }; })
    )).then(render);

    // Перерисовка при переключении вкладок и смене ширины/темы
    new MutationObserver(() => requestAnimationFrame(render))
      .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(render, 150); });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
  });
})();
