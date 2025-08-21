    // NSW holidays for FY25-26 (July 1, 2025 - June 30, 2026)
    const nswHolidays = new Set([
      // 2025 holidays in FY25-26
      '2025-08-04', // Bank Holiday (First Monday in August)
      '2025-10-06', // Labour Day (First Monday in October)
      '2025-12-25', // Christmas Day
      '2025-12-26', // Boxing Day
      // 2026 holidays in FY25-26
      '2026-01-01', // New Year's Day
      '2026-01-26', // Australia Day
      '2026-04-03', // Good Friday
      '2026-04-04', // Easter Saturday
      '2026-04-05', // Easter Sunday
      '2026-04-06', // Easter Monday
      '2026-04-25', // Anzac Day
      '2026-06-08'  // King's Birthday (Second Monday in June)
    ]);

    let work = [];
    let isFirstLoad = true;

    function isWeekend(d){ return d.getDay()===0||d.getDay()===6; }
    function iso(d){ return d.toISOString().slice(0,10); }
    function dayName(d){ return d.toLocaleDateString('en-AU',{weekday:'long'}); }
    function fmtDisplay(isoDate){ const d=new Date(isoDate); return d.toLocaleDateString('en-AU',{day:'2-digit',month:'2-digit',year:'2-digit'}); }

    // Show status message
    function showStatus(message, type = 'success') {
      const status = document.getElementById('status');
      status.textContent = message;
      status.className = `status ${type} show`;
      setTimeout(() => {
        status.classList.remove('show');
      }, 3000);
    }

    // Fixed date parsing function to handle DD/MM/YY format from CSV
    function parseDDMMYY(txt){
      txt = txt.replace(/"/g, '').trim();
      const parts = txt.split('/');
      if(parts.length !== 3) return null;
      
      const [dd, mm, yy] = parts;
      if(!dd || !mm || !yy) return null;
      
      const YYYY = yy.length === 2 ? (parseInt(yy) > 50 ? '19' + yy : '20' + yy) : yy;
      return `${YYYY}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }

    function randHours(){ 
      const r=Math.random(); 
      if(r<0.1) return 6; 
      if(r<0.3) return 7; 
      if(r<0.7) return 8; 
      if(r<0.9) return 9; 
      return 10; 
    }

    // Save data to embedded script tag
    function save(){ 
      try {
        const dataElement = document.getElementById('workLogData');
        const data = JSON.stringify({work, isFirstLoad: false});
        dataElement.textContent = data;
        console.log('Data saved to embedded script tag');
      } catch(e) {
        console.warn('Save failed:', e);
        showStatus('Save failed: ' + e.message, 'error');
      }
    }
    
    // Load data from embedded script tag
    function load(){
      try {
        const dataElement = document.getElementById('workLogData');
        const dataText = dataElement.textContent.trim();
        
        if(dataText) {
          const saved = JSON.parse(dataText);
          work = saved.work || [];
          isFirstLoad = saved.isFirstLoad !== false;
          
          if(work.length === 0) {
            initializeEmptyLog();
          }
          console.log('Data loaded from embedded script tag, entries:', work.length);
          return;
        }
      } catch(e) {
        console.warn('Load failed:', e);
      }
      
      // Fallback to initialize empty log
      initializeEmptyLog();
    }

    function initializeEmptyLog(){
      work = [];
      const start = new Date('2025-07-01'), end = new Date('2026-06-30');
      
      for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){
        const isoDate = iso(d), dn = dayName(d);
        let type = '', hours = 0, km = 0, notes = '';
        
        if(isWeekend(d)){
          notes = 'Weekend';
        } else if(nswHolidays.has(isoDate)){
          type = 'Public Holiday';
          notes = 'Public Holiday';
        } else {
          // Leave empty for user input
          notes = '';
        }
        
        work.push({date: isoDate, day: dn, type, hours, km, notes});
      }
      save();
    }

    function genLog(){
      // Generate random data for all working days except public holidays and annual leave
      work.forEach(entry => {
        if(!isWeekend(new Date(entry.date)) && !nswHolidays.has(entry.date) && entry.type !== 'Annual Leave') {
          // Random assignment logic - first visit of week gets client visit
          const d = new Date(entry.date);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay() + 1); // Monday of this week
          
          let hasClientVisitThisWeek = false;
          for(let checkDate = new Date(weekStart); checkDate < d; checkDate.setDate(checkDate.getDate() + 1)) {
            const checkIso = iso(checkDate);
            const existingEntry = work.find(e => e.date === checkIso);
            if(existingEntry && existingEntry.type === 'Client Visit') {
              hasClientVisitThisWeek = true;
              break;
            }
          }
          
          if(!hasClientVisitThisWeek && Math.random() < 0.3) { // 30% chance for client visit if none this week
            entry.type = 'Client Visit';
            entry.hours = 0;
            entry.km = 60;
            entry.notes = 'Client Visit';
          } else {
            entry.type = 'WFH';
            entry.hours = randHours();
            entry.km = 0;
            entry.notes = 'Work from home';
          }
        }
      });
      
      render(); 
      updateSummary(); 
      save();
      showStatus('Random data generated successfully');
    }

    function updateSummary(){
      const totalWfh = work.reduce((s,d) => s + (d.type === 'WFH' ? d.hours : 0), 0);
      const visits = work.filter(d => d.type === 'Client Visit').length;
      const totalKm = work.reduce((s,d) => s + (d.km || 0), 0);
      const days = work.filter(d => d.type === 'WFH' || d.type === 'Client Visit').length;

      document.getElementById('totalWfh').textContent = totalWfh.toFixed(1);
      document.getElementById('totalVisits').textContent = visits;
      document.getElementById('totalKm').textContent = totalKm.toFixed(1) + ' km';
      document.getElementById('totalDays').textContent = days;
    }

    function onCellChange(i, field, el){
      const v = el.value;
      if(field === 'date'){
        const isoD = parseDDMMYY(v);
        if(isoD){ 
          work[i].date = isoD; 
          work[i].day = dayName(new Date(isoD)); 
        }
      }
      else if(field === 'type'){
        work[i].type = v;
        if(v === 'Client Visit'){ 
          work[i].km = work[i].km || 60; 
          work[i].hours = 0; 
          work[i].notes = work[i].notes || 'Client Visit';
        }
        if(v === 'WFH'){ 
          work[i].hours = work[i].hours || randHours(); 
          work[i].km = 0; 
          work[i].notes = work[i].notes || 'Work from home';
        }
        if(v === 'Public Holiday'){ 
          work[i].hours = 0; 
          work[i].km = 0; 
          work[i].notes = 'Public Holiday';
        }
        if(v === 'Annual Leave'){ 
          work[i].hours = 0; 
          work[i].km = 0; 
          work[i].notes = 'Annual Leave';
        }
      }
      else if(field === 'hours'){ work[i].hours = parseFloat(v) || 0; }
      else if(field === 'km'){ work[i].km = parseFloat(v) || 0; }
      else if(field === 'notes'){ work[i].notes = v; }
      
      render(); 
      updateSummary(); 
      save();
    }

    function createCell(val, i, field){
      if(field === 'type'){
        const opts = ['', 'WFH', 'Client Visit', 'Public Holiday', 'Annual Leave'];
        let s = `<select onchange="onCellChange(${i},'type',this)">`;
        opts.forEach(o => s += `<option value="${o}"${o === val ? ' selected' : ''}>${o}</option>`);
        return s + '</select>';
      }
      if(field === 'date'){
        return `<input type="text" value="${fmtDisplay(val)}" onchange="onCellChange(${i},'date',this)">`;
      }
      if(field === 'hours' || field === 'km'){
        return `<input type="number" step="0.1" min="0" value="${val || ''}" onchange="onCellChange(${i},'${field}',this)">`;
      }
      return `<input type="text" value="${val || ''}" onchange="onCellChange(${i},'${field}',this)">`;
    }

    function render(){
      const body = document.getElementById('body'); 
      body.innerHTML = '';
      let lastMonth = '';
      
      work.forEach((r, i) => {
        const d = new Date(r.date);
        const month = d.toLocaleDateString('en-AU', {month: 'long', year: 'numeric'});
        
        if(month !== lastMonth){ 
          body.insertAdjacentHTML('beforeend', `<tr class="month-header"><td colspan="6">${month}</td></tr>`); 
          lastMonth = month; 
        }
        
        let cls = '';
        if(r.type === 'WFH') cls = 'wfh';
        if(r.type === 'Client Visit') cls = 'client';
        if(r.type === 'Public Holiday') cls = 'holiday';
        if(r.type === 'Annual Leave') cls = 'annual-leave';
        
        body.insertAdjacentHTML('beforeend',
          `<tr class="${cls}">` +
          `<td>${createCell(r.date, i, 'date')}</td>` +
          `<td>${r.day}</td>` +
          `<td>${createCell(r.type, i, 'type')}</td>` +
          `<td>${createCell(r.hours, i, 'hours')}</td>` +
          `<td>${createCell(r.km, i, 'km')}</td>` +
          `<td><input type="text" value="${r.notes || ''}" onchange="onCellChange(${i},'notes',this)"></td>` +
          `</tr>`
        );
      });
      
      const tw = work.reduce((s, d) => s + (d.type === 'WFH' ? d.hours : 0), 0).toFixed(1);
      const tk = work.reduce((s, d) => s + (d.km || 0), 0).toFixed(1);
      body.insertAdjacentHTML('beforeend',
        `<tr class="totals-row"><td colspan="3"><strong>TOTALS</strong></td><td><strong>${tw}</strong></td><td><strong>${tk}</strong></td><td><strong>FY25-26</strong></td></tr>`
      );
    }

    function regenerate(){ 
      genLog();
    }

    // Modal functions
    function showClearModal(){
      document.getElementById('clearModal').style.display = 'block';
    }

    function hideClearModal(){
      document.getElementById('clearModal').style.display = 'none';
    }

    function confirmClear(){
      initializeEmptyLog();
      render();
      updateSummary();
      hideClearModal();
      showStatus('All data cleared successfully');
    }

    // Click outside modal to close
    window.onclick = function(event) {
      const modal = document.getElementById('clearModal');
      if (event.target === modal) {
        hideClearModal();
      }
    }

    // Save file function - creates a new HTML file with current data
    function saveToFile() {
      try {
        // Get the current HTML content
        const htmlContent = document.documentElement.outerHTML;
        
        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'work-log-fy25-26-saved.html';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        
        showStatus('File saved successfully! Open the downloaded file to continue working.');
      } catch (error) {
        console.error('Save file error:', error);
        showStatus('Failed to save file: ' + error.message, 'error');
      }
    }

    // CSV import function
    function importCSV(e){
      const file = e.target.files[0]; 
      if(!file) return;
      
      const debug = document.getElementById('debug');
      debug.style.display = 'block';
      debug.innerHTML = 'Starting CSV import...';
      
      const reader = new FileReader();
      reader.onload = function(evt){
        try {
          const text = evt.target.result;
          debug.innerHTML += '<br>File read successfully. Length: ' + text.length;
          
          const lines = text.split(/\r?\n/).filter(l => l.trim());
          debug.innerHTML += '<br>Lines found: ' + lines.length;
          
          if (lines.length === 0) {
            debug.innerHTML += '<br>ERROR: No lines found in CSV';
            return;
          }
          
          const header = lines.shift();
          debug.innerHTML += '<br>Header: ' + header;
          
          const headerFields = parseCSVLine(header);
          debug.innerHTML += '<br>Header fields: ' + JSON.stringify(headerFields);
          
          const fieldIndex = {};
          headerFields.forEach((field, i) => {
            const cleanField = field.replace(/"/g, '').trim();
            fieldIndex[cleanField] = i;
          });
          
          debug.innerHTML += '<br>Field mapping: ' + JSON.stringify(fieldIndex);
          
          work = [];
          let successCount = 0;
          let errorCount = 0;
          
          lines.forEach((line, lineNum) => {
            if (!line.trim()) return;
            
            try {
              const cols = parseCSVLine(line);
              
              const dateStr = cols[fieldIndex['Date']] ? cols[fieldIndex['Date']].replace(/"/g, '').trim() : '';
              const parsedDate = parseDDMMYY(dateStr);
              
              if (!parsedDate) {
                debug.innerHTML += `<br>Warning: Could not parse date "${dateStr}" on line ${lineNum + 2}`;
                errorCount++;
                return;
              }
              
              const entry = {
                date: parsedDate,
                day: cols[fieldIndex['Day']] ? cols[fieldIndex['Day']].replace(/"/g, '').trim() : '',
                type: cols[fieldIndex['Type']] ? cols[fieldIndex['Type']].replace(/"/g, '').trim() : '',
                hours: parseFloat(cols[fieldIndex['WFH Hours']] || 0) || 0,
                km: parseFloat(cols[fieldIndex['Travel KM']] || 0) || 0,
                notes: cols[fieldIndex['Notes']] ? cols[fieldIndex['Notes']].replace(/"/g, '').trim() : ''
              };
              
              work.push(entry);
              successCount++;
              
            } catch (err) {
              debug.innerHTML += `<br>Error parsing line ${lineNum + 2}: ${err.message}`;
              errorCount++;
            }
          });
          
          debug.innerHTML += `<br>Import complete: ${successCount} entries imported, ${errorCount} errors`;
          
          if (successCount > 0) {
            save(); 
            render(); 
            updateSummary();
            debug.innerHTML += '<br>Data saved and display updated';
            showStatus(`CSV imported: ${successCount} entries`);
          }
          
          e.target.value = '';
          
          setTimeout(() => {
            debug.style.display = 'none';
          }, 5000);
          
        } catch (err) {
          debug.innerHTML += '<br>FATAL ERROR: ' + err.message;
          console.error('CSV Import Error:', err);
          showStatus('CSV import failed: ' + err.message, 'error');
        }
      };
      
      reader.onerror = function(err) {
        debug.innerHTML += '<br>File read error: ' + err;
        showStatus('File read error', 'error');
      };
      
      reader.readAsText(file);
    }

    function parseCSVLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current);
      return result;
    }

    function exportCSV(){
      const hdr = ['Date', 'Day', 'Type', 'WFH Hours', 'Travel KM', 'Notes'];
      const lines = [hdr.join(',')];
      work.forEach(r => {
        lines.push([
          `"${fmtDisplay(r.date)}"`,
          `"${r.day}"`,
          `"${r.type}"`,
          r.hours || 0,
          r.km || 0,
          `"${r.notes}"`
        ].join(','));
      });
      const blob = new Blob([lines.join('\n')], {type: 'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = 'work-log-fy25-26.csv'; 
      document.body.appendChild(a); 
      a.click(); 
      a.remove(); 
      URL.revokeObjectURL(url);
      showStatus('CSV exported successfully');
    }

    // Initialize
    load(); 
    render(); 
    updateSummary();
