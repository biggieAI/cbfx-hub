/* CBFX Hub — shared date-clamp
 * Auto-wires end-date inputs to never be earlier than the start-date.
 * Looks for common pairs by ID:
 *   startDate <-> endDate
 *   subDate   <-> dueDate
 *   start-date <-> end-date / due-date
 *   bid-start <-> bid-due / bid-end
 *
 * On change of the "start" field: sets `min` on the "end" field
 * and clears the end if it's earlier than the new start.
 *
 * Time travel not allowed.
 */
(function(){
  const PAIRS = [
    ['startDate', 'endDate'],
    ['startDate', 'dueDate'],
    ['subDate',   'dueDate'],
    ['start-date','end-date'],
    ['start-date','due-date'],
    ['bid-start', 'bid-due'],
    ['bid-start', 'bid-end'],
    ['bid-issued','bid-due'],
  ];

  function todayISO(){
    const d = new Date();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return d.getFullYear()+'-'+m+'-'+day;
  }

  function wireAllDateInputs(){
    // Hard floor: nothing before today on any date input that doesn't already have a min.
    document.querySelectorAll('input[type="date"]:not([min])').forEach(el => {
      // Don't force a floor on completion-date / submitted-date fields
      if (/sub|issue|complet/i.test(el.id)) return;
      el.min = todayISO();
    });
  }

  function wirePair(startId, endId){
    const start = document.getElementById(startId);
    const end   = document.getElementById(endId);
    if (!start || !end) return;

    function clampEnd(){
      const v = start.value;
      if (!v) return;
      end.min = v;
      if (end.value && end.value < v){
        end.value = v;
        end.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }

    function guardEnd(){
      // If end is set before start, snap forward
      if (start.value && end.value && end.value < start.value){
        end.value = start.value;
        end.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }

    start.addEventListener('change', clampEnd);
    start.addEventListener('input',  clampEnd);
    end.addEventListener('change', guardEnd);
    end.addEventListener('input',  guardEnd);
    clampEnd();
  }

  function init(){
    wireAllDateInputs();
    PAIRS.forEach(p => wirePair(p[0], p[1]));
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
