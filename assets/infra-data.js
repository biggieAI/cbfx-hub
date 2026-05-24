/* CBFX Hub — infra data adapter
 *
 * Data flow:
 *   1. Hit the cbfx-hub-api Worker (window.CBFX_API_BASE + /api/<route>)
 *   2. If the Worker returns source:'live', use it
 *   3. If the Worker returns source:'mock' (not configured / degraded), use that
 *   4. If the network call fails entirely, fall back to window.CBFX_INFRA_FIXTURES
 *
 * Override the API base per-environment:
 *   window.CBFX_API_BASE = 'https://api.chicken-bone.com';
 * Default is same-origin '' (assumes a route binding like /api/* -> Worker).
 *
 * Source label drives the "Last sync • <source>" footer text. Possible values:
 *   live      Worker returned upstream data
 *   mock      Worker returned mock (not configured / degraded)
 *   fixture   Worker unreachable; using local CBFX_INFRA_FIXTURES
 *   501       Endpoint not yet implemented in Worker; using local fixtures
 */
(function(global){
  const DEFAULT_API_BASE = '';                // same-origin
  const FETCH_TIMEOUT_MS = 4000;
  let lastSource = 'fixture';                 // updated by each call

  function apiBase(){
    return (global.CBFX_API_BASE != null ? global.CBFX_API_BASE : DEFAULT_API_BASE).replace(/\/$/, '');
  }

  async function _apiGet(route){
    const ctrl = new AbortController();
    const timeoutId = setTimeout(function(){ ctrl.abort(); }, FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(apiBase() + route, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
        signal: ctrl.signal
      });
      if (res.status === 501) return { ok:false, status:501, body:null };
      if (!res.ok)            return { ok:false, status:res.status, body:null };
      const body = await res.json();
      return { ok:true, status:200, body:body };
    } catch (err) {
      return { ok:false, status:0, body:null, err:String(err) };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function _hasData(body){
    if (!body || body.data == null) return false;
    if (Array.isArray(body.data)) return true;
    return typeof body.data === 'object';
  }

  async function _fetchOrFallback(route, fixtureKey, defaultShape){
    const r = await _apiGet(route);
    if (r.ok && _hasData(r.body)){
      lastSource = r.body.source || 'live';
      return structuredClone(r.body.data);
    }
    lastSource = r.status === 501 ? '501' : 'fixture';
    const fixtures = global.CBFX_INFRA_FIXTURES || {};
    const fallback = fixtures[fixtureKey] != null ? fixtures[fixtureKey] : defaultShape;
    return structuredClone(fallback);
  }

  const CBFXInfra = {
    async getMachines(){
      return _fetchOrFallback('/api/machines', 'machines', []);
    },
    async getShows(){
      // The active-shows page expects { active: [...], wrapped: [...] }.
      // Worker returns a flat ShowRow[]. Reshape here so the page is decoupled
      // from the Worker schema and fixtures keep working unchanged.
      const data = await _fetchOrFallback('/api/shows', 'shows',
        { active: [], wrapped: [] });

      // If fixture/shape is already {active, wrapped}, pass through.
      if (data && !Array.isArray(data) && (Array.isArray(data.active) || Array.isArray(data.wrapped))){
        return data;
      }

      // Map flat ShowRow[] into the page shape.
      const rows = Array.isArray(data) ? data : [];
      const active = [];
      const wrapped = [];
      for (const r of rows){
        const status = (r.status || '').toLowerCase();
        if (status === 'wrap' || status === 'wrapped'){
          wrapped.push({
            name:    r.name || r.code || '',
            client:  r.client || '',
            wrapped: r.due_date || '',
            shots:   r.shots_total || 0,
            sup:     '',
          });
        } else {
          active.push({
            name:     r.name || r.code || '',
            client:   r.client || '',
            sup:      '',
            shots:    r.shots_total || 0,
            start:    '',
            delivery: r.due_date || '',
            sg:       '',
            status:   status === 'bid' || status === 'bidding' ? 'bidding' : 'active',
          });
        }
      }
      return { active: active, wrapped: wrapped };
    },
    async getRenderFarm(){
      return _fetchOrFallback('/api/render-farm', 'renderFarm',
        { stats:{}, jobs:[], workers:[], failed:[] });
    },
    formatLastSync(){
      const time = new Date().toLocaleTimeString('en-US',
        { hour:'2-digit', minute:'2-digit', hour12:false });
      const labels = {
        live:    'live',
        mock:    'mock (not configured)',
        fixture: 'local fixture',
        '501':   'fixture (endpoint pending)'
      };
      return time + ' • ' + (labels[lastSource] || lastSource);
    },
    lastSource: function(){ return lastSource; }
  };

  global.CBFXInfra = CBFXInfra;
})(window);
