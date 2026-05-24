/* CBFX Hub — infra data adapter
 *
 * Today: loads from window.CBFX_INFRA_FIXTURES (set per-page).
 * Tomorrow: swap _fetch() bodies for real API calls:
 *   - ShotGrid REST API for shows
 *   - AWS EC2 describe-instances for machines
 *   - Deadline Cloud REST for jobs / workers / failed
 *
 * Every page reads through this adapter, so the migration is
 * isolated to this file.
 */
(function(global){
  const CBFXInfra = {
    async getMachines(){
      return _wrap(global.CBFX_INFRA_FIXTURES?.machines || []);
    },
    async getShows(){
      return _wrap(global.CBFX_INFRA_FIXTURES?.shows || []);
    },
    async getRenderFarm(){
      return _wrap(global.CBFX_INFRA_FIXTURES?.renderFarm || { stats:{}, jobs:[], workers:[], failed:[] });
    },
    formatLastSync(){
      return new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false }) + ' (mock fixture)';
    }
  };

  // Simulate latency so the UI shows a real loading state even on fixtures
  function _wrap(data){
    return new Promise(resolve => {
      setTimeout(() => resolve(structuredClone(data)), 60);
    });
  }

  global.CBFXInfra = CBFXInfra;
})(window);
