/* ============================================
   FOCO — Contract Intelligence
   Application Logic
   ============================================ */

const API_BASE = 'http://localhost:5001/api/v1/contracts';
const API_DASHBOARD = 'http://localhost:5001/api';
const HEALTH_URL = 'http://localhost:5001/health';
const TENANT_ID = 'tenant-test-123';

function fetchApi(url, opts = {}) {
    opts.headers = { ...opts.headers, 'X-Tenant-ID': TENANT_ID };
    return fetch(url, opts);
}

// ============ STATE ============
let currentFiles = [];
let currentFileIndex = 0;
let extractedText = '';
let analysisResult = null;
let batchResults = [];

// ============ DOM REFS ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    checkApiHealth();
    setupWelcome();
    setupNavigation();
    setupUploadFlow();
});

// ============ HEALTH CHECK ============
async function checkApiHealth() {
    const indicator = $('#api-status');
    try {
        const res = await fetch(HEALTH_URL);
        if (res.ok) {
            indicator.className = 'status-indicator online';
            indicator.querySelector('.status-text').textContent = 'API Online';
        } else { throw new Error(); }
    } catch {
        indicator.className = 'status-indicator offline';
        indicator.querySelector('.status-text').textContent = 'API Offline';
    }
}

// ============================================
// WELCOME PAGE LOGIC
// ============================================
function setupWelcome() {
    const dropzone = $('#welcome-dropzone');
    const fileInput = $('#welcome-file-input');
    const btnStart = $('#welcome-btn-start');
    const btnRemove = $('#welcome-file-remove');
    const btnContinue = $('#greeting-btn-continue');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('drag-over'); });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleWelcomeFiles(Array.from(e.dataTransfer.files));
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleWelcomeFiles(Array.from(fileInput.files));
    });

    btnRemove.addEventListener('click', () => {
        currentFiles = [];
        currentFileIndex = 0;
        fileInput.value = '';
        $('#welcome-file-selected').style.display = 'none';
        dropzone.style.display = 'block';
        btnStart.disabled = true;
    });

    btnStart.addEventListener('click', startWelcomeAnalysis);
    btnContinue.addEventListener('click', transitionToApp);
}

function handleWelcomeFiles(files) {
    const allowed = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
    const valid = files.filter(f => allowed.includes(f.name.split('.').pop().toLowerCase()));
    if (valid.length === 0) {
        showToast('Formato non supportato. Usa PDF, DOCX, JPG o PNG.', 'error');
        return;
    }
    currentFiles = valid;
    currentFileIndex = 0;
    if (valid.length === 1) {
        $('#welcome-file-name').textContent = valid[0].name;
        $('#welcome-file-size').textContent = formatFileSize(valid[0].size);
    } else {
        $('#welcome-file-name').textContent = `${valid.length} file selezionati`;
        $('#welcome-file-size').textContent = formatFileSize(valid.reduce((s, f) => s + f.size, 0));
    }
    $('#welcome-file-selected').style.display = 'flex';
    $('#welcome-dropzone').style.display = 'none';
    $('#welcome-btn-start').disabled = false;
}

async function startWelcomeAnalysis() {
    if (!currentFiles.length) return;
    setWelcomePhase('processing');

    try {
        if (currentFiles.length > 1) {
            updateProcessingStep(1, `Caricamento di ${currentFiles.length} file...`);
            const formData = new FormData();
            currentFiles.forEach(f => formData.append('files', f));
            const res = await fetch(`${API_BASE}/upload-and-analyze-batch`, {
                method: 'POST', headers: { 'X-Tenant-ID': TENANT_ID }, body: formData
            });
            const data = await res.json();
            if (!res.ok || data.status !== 'success') throw new Error(data.message || 'Errore batch upload');
            updateProcessingStep(2, 'Analisi AI completata...');
            batchResults = data.data || [];
            updateProcessingStep(3, `${batchResults.length} contratti riconosciuti!`);
        } else {
            const formData = new FormData();
            formData.append('file', currentFiles[0]);
            updateProcessingStep(1, 'Estrazione testo dal documento...');
            const uploadRes = await fetch(`${API_BASE}/upload`, {
                method: 'POST', headers: { 'X-Tenant-ID': TENANT_ID }, body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || uploadData.status !== 'success') throw new Error(uploadData.message || 'Errore upload');
            extractedText = uploadData.data.extracted_text;
            updateProcessingStep(2, 'Analisi AI in corso...');
            const analyzeRes = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
                body: JSON.stringify({ text: extractedText })
            });
            const analyzeData = await analyzeRes.json();
            if (!analyzeRes.ok || analyzeData.status !== 'success') throw new Error(analyzeData.message || 'Errore analisi');
            analysisResult = analyzeData.data;
            updateProcessingStep(3, 'Riconoscimento completato!');
        }
        await sleep(800);
        setWelcomePhase('greeting');
        const titleHtml = document.getElementById('greeting-multi-title');
        if (titleHtml) {
            titleHtml.textContent = 'Benvenuti';
            titleHtml.className = 'greeting-multi-title';
            setTimeout(() => { titleHtml.className = 'greeting-multi-title show-lang'; }, 100);
        }
    } catch (err) {
        showToast(err.message || 'Errore durante l\'elaborazione.', 'error');
        setWelcomePhase('upload');
        console.error(err);
    }
}

function setWelcomePhase(phase) {
    $$('.welcome-phase').forEach(p => p.classList.remove('active'));
    $(`#welcome-phase-${phase}`).classList.add('active');
}

function updateProcessingStep(step, statusText) {
    $('#processing-status').textContent = statusText;
    for (let i = 1; i <= 3; i++) {
        const el = $(`#proc-step-${i}`);
        el.classList.remove('active', 'done');
        if (i < step) el.classList.add('done');
        if (i === step) el.classList.add('active');
    }
}

function transitionToApp() {
    $('#welcome-page').classList.remove('active');
    $('#app-shell').classList.add('active');

    if (batchResults.length > 0) {
        $('#sidebar-tenant-name').textContent = `${batchResults.length} contratti`;
        $('#single-analysis-view').style.display = 'none';
        $('#batch-analysis-view').style.display = 'block';
        renderBatchResults(batchResults, []);
    } else if (analysisResult) {
        const companyName = analysisResult?.anagrafica?.cliente_ragione_sociale || 'Cliente';
        $('#sidebar-tenant-name').textContent = companyName;
        $('#single-analysis-view').style.display = 'block';
        $('#batch-analysis-view').style.display = 'none';
        renderAnalysisResult(analysisResult);
    }

    switchView('upload');
    goToStep(3);
    loadContracts();
}

// ============ NAVIGATION ============
function setupNavigation() {
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(link.dataset.view);
        });
    });
    const menuToggle = $('#menu-toggle');
    if (menuToggle) menuToggle.addEventListener('click', () => { $('#sidebar').classList.toggle('open'); });
    const btnRefresh = $('#btn-refresh-contracts');
    if (btnRefresh) btnRefresh.addEventListener('click', loadContracts);
}

function switchView(viewName) {
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = $(`[data-view="${viewName}"]`);
    if (activeLink) activeLink.classList.add('active');

    $$('.view').forEach(v => v.classList.remove('active'));
    const viewEl = $(`#view-${viewName}`);
    if (viewEl) viewEl.classList.add('active');

    const titles = {
        overview:'Overview', costs:'Reparto Costi', upload:'Carica Contratto',
        contracts:'Contratti', radar:'Risk Radar', topclients:'Top Clients',
        advisor:'AI Advisor', detail:'Dettaglio Contratto'
    };
    const pageTitle = $('#page-title');
    if (pageTitle) pageTitle.textContent = titles[viewName] || 'FOCO';

    try {
        if (viewName === 'overview') renderOverview();
        else if (viewName === 'costs') renderCosts('totale');
        else if (viewName === 'contracts') { loadContracts().then(() => { renderContractsKpiAndAnomalies(); renderMap(); }); }
        else if (viewName === 'radar') renderRadar();
        else if (viewName === 'topclients') renderTopClients();
        else if (viewName === 'advisor') renderAdvisor();
    } catch(e) { console.error('Error switching view:', e); }

    const sidebar = $('#sidebar');
    if (sidebar) sidebar.classList.remove('open');
}

window.switchView = switchView;
window.saveContract = saveContract;
window.saveAllContracts = saveAllContracts;
window.resetUploadFlow = resetUploadFlow;
window.removeFile = removeFile;
window.loadContractDetail = loadContractDetail;

// ============ UPLOAD FLOW ============
function setupUploadFlow() {
    const dropzone = $('#dropzone');
    const fileInput = $('#file-input');
    const btnUpload = $('#btn-upload');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('drag-over'); });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFilesSelect(Array.from(e.dataTransfer.files));
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFilesSelect(Array.from(fileInput.files));
    });

    btnUpload.addEventListener('click', uploadFile);
    $('#btn-back-to-upload').addEventListener('click', () => goToStep(1));
    $('#btn-analyze').addEventListener('click', analyzeText);
    $('#btn-back-to-text').addEventListener('click', () => goToStep(2));

    const searchInput = $('#search-contracts');
    if (searchInput) searchInput.addEventListener('input', (e) => { filterContracts(e.target.value); });
}

function handleFilesSelect(files) {
    const allowed = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
    const valid = files.filter(f => allowed.includes(f.name.split('.').pop().toLowerCase()));
    if (valid.length === 0) { showToast('Nessun formato supportato.', 'error'); return; }
    currentFiles = valid;
    currentFileIndex = 0;
    renderFilesList();
    $('#dropzone').style.display = 'none';
    $('#btn-upload').disabled = false;
}

function renderFilesList() {
    const container = $('#files-preview-list');
    container.style.display = 'flex';
    container.innerHTML = currentFiles.map((f, i) => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <i class="ri-file-text-line" style="color:var(--accent);"></i>
                <span style="font-size:0.85rem; font-weight:500;">${f.name}</span>
                <span style="font-size:0.75rem; color:var(--text-tertiary);">${formatFileSize(f.size)}</span>
            </div>
            <button class="btn btn--danger btn--sm" onclick="removeFile(${i})" style="padding:2px 6px;"><i class="ri-close-line"></i></button>
        </div>
    `).join('');
}

function removeFile(index) {
    currentFiles.splice(index, 1);
    if (currentFiles.length === 0) {
        $('#files-preview-list').style.display = 'none';
        $('#dropzone').style.display = 'block';
        $('#btn-upload').disabled = true;
        $('#file-input').value = '';
    } else { renderFilesList(); }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function goToStep(stepNum) {
    for (let i = 1; i <= 4; i++) {
        const indicator = $(`#step-indicator-${i}`);
        if (!indicator) continue;
        indicator.classList.remove('active', 'done');
        if (i < stepNum) indicator.classList.add('done');
        if (i === stepNum) indicator.classList.add('active');
    }
    $$('.step-content').forEach(s => s.classList.remove('active'));
    const step = $(`#step-${stepNum}`);
    if (step) step.classList.add('active');
}

// ============ API CALLS ============
async function uploadFile() {
    if (!currentFiles.length) return;

    if (currentFiles.length > 1) {
        showLoader(`Caricamento e analisi di ${currentFiles.length} file...`);
        const formData = new FormData();
        currentFiles.forEach(f => formData.append('files', f));
        try {
            const res = await fetch(`${API_BASE}/upload-and-analyze-batch`, {
                method: 'POST', headers: { 'X-Tenant-ID': TENANT_ID }, body: formData
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                batchResults = data.data || [];
                const errors = data.errors || [];
                $('#single-analysis-view').style.display = 'none';
                $('#batch-analysis-view').style.display = 'block';
                renderBatchResults(batchResults, errors);
                goToStep(3);
                showToast(`${batchResults.length} contratti analizzati!`, 'success');
            } else { showToast(data.message || 'Errore batch upload', 'error'); }
        } catch (err) { showToast('Impossibile contattare il server.', 'error'); }
        finally { hideLoader(); }
        return;
    }

    const file = currentFiles[0];
    showLoader(`Caricamento ${file.name}...`);
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST', headers: { 'X-Tenant-ID': TENANT_ID }, body: formData
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            extractedText = data.data.extracted_text;
            $('#extracted-text').value = extractedText;
            $('#text-length-badge').textContent = `${extractedText.length} caratteri`;
            goToStep(2);
            showToast(`Testo estratto!`, 'success');
        } else { showToast(data.message || 'Errore upload', 'error'); }
    } catch (err) { showToast('Impossibile contattare il server.', 'error'); }
    finally { hideLoader(); }
}

async function analyzeText() {
    const text = $('#extracted-text').value;
    if (!text || text.length < 10) { showToast('Il testo è troppo corto.', 'error'); return; }
    showLoader('Analisi AI in corso...');
    try {
        const res = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            analysisResult = data.data;
            $('#single-analysis-view').style.display = 'block';
            $('#batch-analysis-view').style.display = 'none';
            renderAnalysisResult(analysisResult);
            goToStep(3);
            showToast('Analisi completata!', 'success');
        } else { showToast(data.message || 'Errore analisi', 'error'); }
    } catch (err) { showToast('Errore di rete.', 'error'); }
    finally { hideLoader(); }
}

async function saveContract() {
    if (!analysisResult) return;
    showLoader('Salvataggio contratto...');
    try {
        const res = await fetch(`${API_BASE}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
            body: JSON.stringify({ user_id: 'frontend-user', extracted_data: analysisResult })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            $('#saved-contract-id').textContent = data.contract_id;
            $('#save-success-title').textContent = 'Contratto Salvato!';
            $('#save-success-desc').textContent = 'Il contratto è stato registrato con successo nel database.';
            $('#save-success-ids').innerHTML = `ID: <code>${data.contract_id}</code>`;
            goToStep(4);
            showToast('Contratto salvato!', 'success');
            loadContracts();
        } else { showToast(data.message || 'Errore', 'error'); }
    } catch (err) { showToast('Errore di rete.', 'error'); }
    finally { hideLoader(); }
}

async function saveAllContracts() {
    if (!batchResults.length) return;
    showLoader(`Salvataggio di ${batchResults.length} contratti...`);
    const savedIds = [], saveErrors = [];
    for (const r of batchResults) {
        try {
            const res = await fetch(`${API_BASE}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
                body: JSON.stringify({ user_id: 'frontend-user', extracted_data: r.analysis })
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') savedIds.push(data.contract_id);
            else saveErrors.push(r.filename);
        } catch { saveErrors.push(r.filename); }
    }
    hideLoader();
    if (savedIds.length > 0) {
        $('#save-success-title').textContent = `${savedIds.length} Contratti Salvati!`;
        $('#save-success-desc').textContent = saveErrors.length
            ? `${savedIds.length} salvati, ${saveErrors.length} errori (${saveErrors.join(', ')})`
            : `Tutti i ${savedIds.length} contratti registrati con successo.`;
        $('#save-success-ids').innerHTML = savedIds.map(id => `<code style="font-size:0.7rem; margin:2px;">${id.substring(0, 8)}...</code>`).join(' ');
        goToStep(4);
        showToast(`${savedIds.length} contratti salvati!`, 'success');
    } else { showToast('Errore nel salvataggio.', 'error'); }
    loadContracts();
}

async function loadContracts() {
    try {
        const res = await fetch(`${API_BASE}/list`, { headers: { 'X-Tenant-ID': TENANT_ID } });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            renderContractsTable(data.data || []);
        }
    } catch (err) { console.error('Errore caricamento contratti:', err); }
}

async function loadContractDetail(contractId) {
    showLoader('Caricamento dettaglio...');
    try {
        const res = await fetch(`${API_BASE}/${contractId}`, { headers: { 'X-Tenant-ID': TENANT_ID } });
        const data = await res.json();
        if (res.ok && data.status === 'success') { renderContractDetail(data.data); switchView('detail'); }
        else { showToast('Contratto non trovato.', 'error'); }
    } catch (err) { showToast('Errore.', 'error'); }
    finally { hideLoader(); }
}

// ============ RENDERERS ============
function renderContractsTable(contracts) {
    window._allContracts = contracts || [];
    const container = $('#contracts-table-body');
    if (!container) return;
    if (!contracts || contracts.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="ri-inbox-line"></i><p>Nessun contratto. Carica il primo dalla sezione Upload.</p></div>';
        return;
    }
    buildContractsTableHTML(container, contracts);
}

function buildContractsTableHTML(container, contracts) {
    const rows = contracts.map(c => `
        <tr onclick="loadContractDetail('${c.id}')">
            <td>${escapeHtml(c.cliente)}</td>
            <td><span class="badge ${c.prodotto === 'Freader' ? 'badge--purple' : 'badge--warning'}">${c.prodotto}</span></td>
            <td><span class="badge ${c.status === 'ACTIVE' ? 'badge--success' : 'badge--info'}">${c.status}</span></td>
            <td>${c.versioni}</td>
            <td><code style="font-size:0.7rem;">${c.id.substring(0, 8)}...</code></td>
        </tr>`).join('');
    container.innerHTML = `<table class="data-table"><thead><tr><th>Cliente</th><th>Prodotto</th><th>Stato</th><th>Ver.</th><th>ID</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function filterContracts(query) {
    const contracts = window._allContracts || [];
    const filtered = contracts.filter(c =>
        c.cliente.toLowerCase().includes(query.toLowerCase()) ||
        c.prodotto.toLowerCase().includes(query.toLowerCase())
    );
    buildContractsTableHTML($('#contracts-table-body'), filtered);
}

function renderAnalysisResult(result) {
    if (!result) return;
    const grid = $('#analysis-grid');
    if (!grid) return;
    const prodotto = result.prodotto || 'N/A';
    const productBadge = $('#product-badge');
    if (productBadge) { productBadge.textContent = prodotto; productBadge.className = `badge ${prodotto === 'Freader' ? 'badge--purple' : 'badge--warning'}`; }

    let html = '';
    const ana = result.anagrafica || {};
    html += buildSection('Anagrafica', 'ri-building-2-line', { 'Ragione Sociale': ana.cliente_ragione_sociale, 'Sede Legale': ana.cliente_sede_legale });
    const det = result.dettagli_contratto || {};
    html += buildSection('Dettagli Contratto', 'ri-calendar-line', { 'Data Firma': det.data_firma, 'Durata': det.durata_mesi ? `${det.durata_mesi} mesi` : 'N/A', 'Preavviso': det.preavviso_giorni ? `${det.preavviso_giorni} giorni` : 'N/A' });

    if (prodotto.toLowerCase().includes('freader')) {
        const com = result.commerciale_freader || {};
        html += buildSection('Commerciale Freader', 'ri-money-euro-circle-line', { 'Canone Trimestrale': formatCurrency(com.canone_trimestrale), 'Fascia 1': com.prezzo_fascia_1 != null ? `${com.prezzo_fascia_1} cent` : 'N/A', 'Fascia 2': com.prezzo_fascia_2 != null ? `${com.prezzo_fascia_2} cent` : 'N/A', 'Fascia 3': com.prezzo_fascia_3 != null ? `${com.prezzo_fascia_3} cent` : 'N/A' });
    } else {
        const com = result.commerciale_cutai || {};
        html += buildSection('Commerciale CutAI', 'ri-money-euro-circle-line', { 'Profilo': com.profilo_commerciale, 'Canone Trimestrale': formatCurrency(com.canone_base_trimestrale), 'Utenti Inclusi': com.soglia_utenti_inclusi, 'Fee Extra': formatCurrency(com.fee_utente_extra) });
    }
    const sla = result.sla || {};
    html += buildSection('SLA', 'ri-shield-check-line', { 'Credito Uptime': sla.credito_uptime ? `${sla.credito_uptime}%` : 'N/A', 'Credito Ticketing': sla.credito_ticketing ? `${sla.credito_ticketing}%` : 'N/A', 'Tetto Crediti': sla.tetto_crediti ? `${sla.tetto_crediti}%` : 'N/A' });
    grid.innerHTML = html;
}

function buildSection(title, icon, fields) {
    const fieldsHtml = Object.entries(fields).map(([label, value]) => `
        <div class="analysis-field"><span class="analysis-field-label">${label}</span><span class="analysis-field-value">${value ?? 'N/A'}</span></div>`).join('');
    return `<div class="analysis-section"><div class="analysis-section-title"><i class="${icon}"></i> ${title}</div>${fieldsHtml}</div>`;
}

function renderBatchResults(results, errors) {
    $('#single-analysis-view').style.display = 'none';
    $('#batch-analysis-view').style.display = 'block';
    const list = $('#batch-results-list');
    if (!list) return;
    list.innerHTML = results.map(r => {
        const a = r.analysis || {};
        const prodotto = a.prodotto || 'N/A';
        const ana = a.anagrafica || {};
        const det = a.dettagli_contratto || {};
        const badgeClass = prodotto === 'Freader' ? 'badge--purple' : 'badge--warning';
        let comHtml = '';
        if (prodotto.toLowerCase().includes('freader')) {
            const com = a.commerciale_freader || {};
            comHtml = `<span>Canone: <strong>${formatCurrency(com.canone_trimestrale)}</strong>/trim</span>`;
        } else {
            const com = a.commerciale_cutai || {};
            comHtml = `<span>Profilo: <strong>${com.profilo_commerciale || '-'}</strong></span><br><span>Canone: <strong>${formatCurrency(com.canone_base_trimestrale)}</strong>/trim</span>`;
        }
        return `<div class="card"><div class="card-header"><h2 style="font-size:0.9rem;"><i class="ri-file-text-line"></i> ${escapeHtml(r.filename)}</h2><span class="badge ${badgeClass}">${prodotto}</span></div>
        <div class="card-body" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; font-size:0.85rem;">
            <div><div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-tertiary); margin-bottom:4px;">Anagrafica</div><strong>${escapeHtml(ana.cliente_ragione_sociale || 'N/A')}</strong><br><span style="color:var(--text-secondary);">${escapeHtml(ana.cliente_sede_legale || 'N/A')}</span></div>
            <div><div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-tertiary); margin-bottom:4px;">Contratto</div>Firma: ${det.data_firma || '-'}<br>Durata: ${det.durata_mesi || '-'} mesi</div>
            <div><div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-tertiary); margin-bottom:4px;">Commerciale</div>${comHtml}</div>
        </div></div>`;
    }).join('');
    const errContainer = $('#batch-errors');
    if (errContainer) {
        errContainer.innerHTML = errors.length > 0 ? `<div class="card" style="border-color:var(--color-danger);"><div class="card-header" style="background:rgba(239,68,68,0.05);"><h2 style="font-size:0.9rem; color:var(--color-danger);"><i class="ri-error-warning-line"></i> ${errors.length} errori</h2></div><div class="card-body">${errors.map(e => `<div style="padding:4px 0; font-size:0.85rem;"><strong>${escapeHtml(e.filename)}</strong>: ${escapeHtml(e.error)}</div>`).join('')}</div></div>` : '';
    }
}

function renderContractDetail(contract) {
    if (!contract) return;
    const badge = $('#detail-product-badge');
    if (badge) { badge.textContent = contract.prodotto; badge.className = `badge ${contract.prodotto === 'Freader' ? 'badge--purple' : 'badge--warning'}`; }
    const history = contract.history || [];
    let timelineHtml = history.length > 0 ? history.map(v => {
        const details = contract.prodotto === 'Freader'
            ? `<span>Data firma: <strong>${v.data_firma || 'N/A'}</strong></span><span>Canone: <strong>${formatCurrency(v.canone)}</strong></span>`
            : `<span>Piano: <strong>${v.piano || 'N/A'}</strong></span><span>Canone: <strong>${formatCurrency(v.canone)}</strong></span>`;
        return `<div class="version-item"><div class="version-number">Versione ${v.version}</div><div class="version-details">${details}</div></div>`;
    }).join('') : '<p style="color: var(--text-tertiary);">Nessuna versione trovata.</p>';
    const body = $('#detail-body');
    if (body) body.innerHTML = `<div class="detail-header"><h3>${escapeHtml(contract.cliente)}</h3></div><div class="detail-meta"><div class="detail-meta-item">ID: <strong><code>${contract.id}</code></strong></div><div class="detail-meta-item">Prodotto: <strong>${contract.prodotto}</strong></div></div><h4 style="margin:0.75rem 0; font-size:0.95rem;"><i class="ri-time-line" style="color:var(--accent);"></i> Storico Versioni</h4><div class="version-timeline">${timelineHtml}</div>`;
}

// ============ RESET ============
function resetUploadFlow() {
    currentFiles = [];
    currentFileIndex = 0;
    extractedText = '';
    analysisResult = null;
    batchResults = [];

    // Reset file input value (wrap in try-catch for browser compat)
    const fileInput = $('#file-input');
    if (fileInput) {
        try { fileInput.value = ''; } catch(e) { /* ignore */ }
        // If value reset doesn't work, replace with fresh input
        if (fileInput.value) {
            const form = document.createElement('form');
            fileInput.parentNode.insertBefore(form, fileInput);
            form.appendChild(fileInput);
            form.reset();
            form.parentNode.insertBefore(fileInput, form);
            form.remove();
        }
    }

    const filesList = $('#files-preview-list');
    if (filesList) { filesList.style.display = 'none'; filesList.innerHTML = ''; }
    const dropzone = $('#dropzone');
    if (dropzone) dropzone.style.display = 'block';
    const btnUpload = $('#btn-upload');
    if (btnUpload) btnUpload.disabled = true;
    const textarea = $('#extracted-text');
    if (textarea) textarea.value = '';
    const singleView = $('#single-analysis-view');
    if (singleView) singleView.style.display = 'block';
    const batchView = $('#batch-analysis-view');
    if (batchView) batchView.style.display = 'none';
    switchView('upload');
    goToStep(1);
}

// ============ HELPERS ============
function formatCurrency(value) {
    if (value == null || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function showLoader(text) {
    const lt = $('#loader-text'); if (lt) lt.textContent = text || 'Elaborazione in corso...';
    const lo = $('#loading-overlay'); if (lo) lo.classList.add('active');
}
function hideLoader() { const lo = $('#loading-overlay'); if (lo) lo.classList.remove('active'); }
function showToast(message, type = 'info') {
    const container = $('#toast-container'); if (!container) return;
    const icons = { success: 'ri-checkbox-circle-line', error: 'ri-error-warning-line', info: 'ri-information-line' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; toast.style.transition = 'all 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// ============================================
// DASHBOARD RENDERERS (with empty-state guards)
// ============================================
function renderOverview() {
    const grid = $('#kpi-grid');
    if (!grid) return;

    fetchApi(`${API_DASHBOARD}/kpi`)
        .then(res => res.ok ? res.json() : null)
        .then(kpi => {
            if (!kpi) { grid.innerHTML = '<div class="empty-state"><p>Dati KPI non disponibili. Carica il primo contratto.</p></div>'; return; }
            grid.innerHTML = [
                { title: 'Fatturato Annuo', value: '€ ' + (kpi.fatturato_totale/1000).toFixed(0) + 'k', desc: `+${kpi.yoy_growth}% YoY`, color: 'blue', icon: 'ri-money-euro-circle-line' },
                { title: 'Margine Operativo', value: kpi.margine_pct + '%', desc: `+${kpi.mom_margine}% MoM`, color: 'green', icon: 'ri-line-chart-line' },
                { title: 'Contratti Attivi', value: kpi.attivi, desc: `${kpi.in_scadenza_90} in scadenza`, color: 'purple', icon: 'ri-check-double-line' },
                { title: 'Tasso di Crescita', value: kpi.mom_growth + '%', desc: 'Mensile', color: 'orange', icon: 'ri-trend-up-line' }
            ].map(k => `<div class="stat-card"><div class="stat-icon stat-icon--${k.color}"><i class="${k.icon}"></i></div><div class="stat-info"><span class="stat-value">${k.value}</span><span class="stat-label">${k.title} <span style="font-size:0.75rem; color:var(--accent); margin-left:8px;">${k.desc}</span></span></div></div>`).join('');
        })
        .catch(() => { grid.innerHTML = '<div class="empty-state"><p>Impossibile caricare i KPI.</p></div>'; });

    const tableBody = $('#overview-table-body');
    if (tableBody) {
        const contracts = window._allContracts || [];
        if (contracts.length > 0) {
            tableBody.innerHTML = `<table class="data-table"><thead><tr><th>Cliente</th><th>Prodotto</th><th>Stato</th></tr></thead><tbody>${contracts.slice(0, 5).map(c => `<tr onclick="switchView('contracts')"><td>${escapeHtml(c.cliente)}</td><td><span class="badge ${c.prodotto === 'Freader' ? 'badge--purple' : 'badge--warning'}">${c.prodotto}</span></td><td><span class="badge badge--success">${c.status}</span></td></tr>`).join('')}</tbody></table>`;
        } else {
            tableBody.innerHTML = '<div class="empty-state"><i class="ri-inbox-line"></i><p>Nessun contratto ancora. Carica il primo dalla sezione Upload.</p></div>';
        }
    }

    const expList = $('#expiring-list');
    if (expList) {
        fetchApi(`${API_DASHBOARD}/expiring`)
            .then(res => res.ok ? res.json() : [])
            .then(expData => {
                if (!expData || expData.length === 0) { expList.innerHTML = '<p style="color:var(--text-tertiary);">Nessuna scadenza imminente.</p>'; return; }
                expList.innerHTML = expData.map(e => `<div class="anomaly-item" style="margin-bottom:0.5rem; cursor:pointer;" onclick="switchView('contracts')"><div style="flex:1;"><div class="a-title">${e.cliente}</div><div class="a-desc">Scade il ${e.scadenza} — ${e.prodotto}</div></div><div class="a-client">€ ${e.canone_trim}/trim</div></div>`).join('');
            })
            .catch(() => { expList.innerHTML = '<p style="color:var(--text-tertiary);">Errore caricamento scadenze.</p>'; });
    }
}

function renderCosts(prod) {
    $$('.seg-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = $(`.seg-btn[data-prod="${prod}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    fetchApi(`${API_DASHBOARD}/costs/${prod}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (!data) { $('#costs-kpi-grid').innerHTML = '<div class="empty-state"><p>Dati costi non disponibili.</p></div>'; return; }
            $('#costs-kpi-grid').innerHTML = [
                { title: 'Costi Fissi', value: '€ '+(data.tot_fissi/1000).toFixed(0)+'k', color: 'blue', icon: 'ri-building-line' },
                { title: 'Costi Variabili', value: '€ '+(data.tot_variabili/1000).toFixed(0)+'k', color: 'orange', icon: 'ri-arrow-up-down-line' },
                { title: 'Costo Medio / Contratto', value: '€ '+data.costo_unit_trad.toFixed(0), color: 'green', icon: 'ri-pie-chart-line' }
            ].map(k => `<div class="stat-card"><div class="stat-icon stat-icon--${k.color}"><i class="${k.icon}"></i></div><div class="stat-info"><span class="stat-value">${k.value}</span><span class="stat-label">${k.title}</span></div></div>`).join('');

            const fissiTable = $('#costi-fissi-table');
            if (fissiTable) fissiTable.innerHTML = data.fissi && data.fissi.length ? `<table class="data-table"><thead><tr><th>Voce</th><th>Tipo</th><th>Importo</th></tr></thead><tbody>${data.fissi.map(f => `<tr><td>${f.voce}</td><td><span class="badge badge--info">${f.tipo}</span></td><td><strong>€ ${f.importo.toLocaleString('it-IT')}</strong></td></tr>`).join('')}</tbody></table>` : '<p>Nessun costo fisso.</p>';
            const varTable = $('#costi-variabili-table');
            if (varTable) varTable.innerHTML = data.variabili && data.variabili.length ? `<table class="data-table"><thead><tr><th>Voce</th><th>Tipo</th><th>Costo</th></tr></thead><tbody>${data.variabili.map(v => `<tr><td>${v.voce}</td><td><span class="badge badge--purple">${v.tipo}</span></td><td><strong>${v.unita || 'N/A'}</strong></td></tr>`).join('')}</tbody></table>` : '<p>Nessun costo variabile.</p>';
        })
        .catch(() => { $('#costs-kpi-grid').innerHTML = '<div class="empty-state"><p>Errore caricamento costi.</p></div>'; });
}

function renderContractsKpiAndAnomalies() {
    const contracts = window._allContracts || [];
    fetchApi(`${API_DASHBOARD}/anomalies`)
        .then(res => res.ok ? res.json() : [])
        .then(anomalies => {
            anomalies = anomalies || [];
            const kpiGrid = $('#contracts-kpi-grid');
            if (kpiGrid) kpiGrid.innerHTML = `
                <div class="stat-card"><div class="stat-icon stat-icon--blue"><i class="ri-folder-shield-2-line"></i></div><div class="stat-info"><span class="stat-value">${contracts.length}</span><span class="stat-label">Contratti Totali</span></div></div>
                <div class="stat-card"><div class="stat-icon stat-icon--green"><i class="ri-checkbox-circle-line"></i></div><div class="stat-info"><span class="stat-value">${contracts.filter(c=>c.status==='ACTIVE').length}</span><span class="stat-label">Attivi</span></div></div>
                <div class="stat-card"><div class="stat-icon stat-icon--danger"><i class="ri-error-warning-line"></i></div><div class="stat-info"><span class="stat-value">${anomalies.length}</span><span class="stat-label">Anomalie</span></div></div>`;

            const anomContainer = $('#anomalies-container');
            if (anomContainer) {
                if (anomalies.length > 0) {
                    anomContainer.innerHTML = `<div class="card" style="border-color:var(--color-danger); background:var(--color-danger-bg);"><div class="card-header" style="border-bottom:none;"><h2 style="color:var(--color-danger);"><i class="ri-alarm-warning-fill"></i> ${anomalies.length} anomalie</h2></div><div class="card-body"><div class="anomalies-list">${anomalies.map(a => `<div class="anomaly-item hs-${a.gravita}"><i class="${a.gravita === 'alta' ? 'ri-close-circle-line' : 'ri-error-warning-line'}" style="font-size:1.5rem; color:var(--color-danger);"></i><div style="flex:1;"><div class="a-title">${a.tipo.toUpperCase().replace('_', ' ')}: ${a.cliente}</div><div class="a-desc">${a.desc}</div></div><div class="a-client">${a.prodotto}</div></div>`).join('')}</div></div></div>`;
                } else { anomContainer.innerHTML = ''; }
            }
            if (!window._notified) { checkAndNotify(anomalies); window._notified = true; }
        })
        .catch(() => {});
}

function renderMap() {
    const container = $('#map-container');
    if (!container) return;
    fetchApi(`${API_DASHBOARD}/map-data`)
        .then(res => res.ok ? res.json() : [])
        .then(mapData => {
            if (!mapData || mapData.length === 0) { container.innerHTML = '<p style="color:var(--text-tertiary);">Nessun dato geografico.</p>'; return; }
            container.innerHTML = `<div style="position:relative; width:100%; height:300px;">${mapData.map(d => `<div class="map-dot" style="position:absolute; left:${d.lng*3}%; top:${100 - d.lat*2}%;" title="${d.citta}: ${d.count}"><i class="ri-map-pin-2-fill" style="color:var(--accent); font-size:1.5rem;"></i><div style="position:absolute; background:var(--bg-card); border:1px solid var(--border-color); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.7rem; margin-top:4px; transform:translate(-25%, 0); pointer-events:none;">${d.citta} (${d.count})</div></div>`).join('')}</div>`;
        })
        .catch(() => { container.innerHTML = '<p style="color:var(--text-tertiary);">Errore mappa.</p>'; });
}

function renderTopClients() {
    const container = $('#topclients-container');
    if (!container) return;
    fetchApi(`${API_DASHBOARD}/top-clients`)
        .then(res => res.ok ? res.json() : [])
        .then(clients => {
            if (!clients || clients.length === 0) { container.innerHTML = '<div class="empty-state"><p>Nessun cliente. Carica contratti per vedere la classifica.</p></div>'; return; }
            container.innerHTML = `<table class="data-table"><thead><tr><th>Rank</th><th>Cliente</th><th>Score</th><th>Prodotto</th><th>Canone</th></tr></thead><tbody>${clients.map(c => `<tr><td>#${c.index+1}</td><td><strong>${c.cliente}</strong></td><td><span class="rank-score">${c.rating}/100</span></td><td><span class="badge ${c.rating > 90 ? 'badge--success' : 'badge--info'}">${c.prodotto}</span></td><td>€ ${c.canone_trim}</td></tr>`).join('')}</tbody></table>`;
        })
        .catch(() => { container.innerHTML = '<div class="empty-state"><p>Errore caricamento.</p></div>'; });
}

function renderRadar() {
    const container = $('#radar-container');
    if (!container) return;
    fetchApi(`${API_DASHBOARD}/anomalies`)
        .then(res => res.ok ? res.json() : [])
        .then(anomalies => {
            if (!anomalies || anomalies.length === 0) { container.innerHTML = '<p style="color:var(--text-secondary);">Nessuna anomalia rilevata. Ottimo!</p>'; return; }
            container.innerHTML = anomalies.map(a => `<div style="flex:1 1 300px; background:rgba(255,255,255,0.02); border:1px solid ${a.gravita === 'alta' ? 'var(--color-danger)' : 'var(--border-color)'}; padding:1.5rem; border-radius:var(--radius-md);"><div style="display:flex; justify-content:space-between; margin-bottom:1rem;"><h3 style="margin:0;">${a.cliente}</h3><span class="badge ${a.gravita === 'alta' ? 'badge--danger' : 'badge--warning'}">${a.gravita.toUpperCase()}</span></div><p style="font-weight:600; font-size:0.95rem; margin-bottom:0.5rem;"><i class="ri-alert-line"></i> ${a.tipo.replace('_', ' ')}</p><p style="color:var(--text-secondary); font-size:0.85rem;">${a.desc}</p></div>`).join('');
        })
        .catch(() => { container.innerHTML = '<p style="color:var(--text-secondary);">Errore caricamento anomalie.</p>'; });
}

function renderAdvisor() {
    const container = $('#advisor-container');
    if (!container) return;
    fetchApi(`${API_DASHBOARD}/ai-advice`)
        .then(res => res.ok ? res.json() : [])
        .then(advice => {
            if (!advice || advice.length === 0) { container.innerHTML = '<p style="color:var(--text-secondary);">Nessun consiglio disponibile al momento.</p>'; return; }
            container.innerHTML = advice.map(a => `<div class="advisor-card"><div class="adv-icon"><i class="ri-robot-2-fill"></i></div><div class="adv-content"><div class="adv-title">${a.titolo} <span class="badge ${a.priorita === 'alta' ? 'badge--danger' : 'badge--purple'}">${a.categoria}</span></div><div class="adv-desc">${a.desc}</div><button class="adv-action">${a.azione}</button></div></div>`).join('');
        })
        .catch(() => { container.innerHTML = '<p style="color:var(--text-secondary);">Errore caricamento consigli.</p>'; });
}

function checkAndNotify(anomalies) {
    if ("Notification" in window && anomalies) {
        if (Notification.permission === 'granted') {
            const critici = anomalies.filter(a => a.gravita === 'alta');
            if (critici.length > 0) new Notification('ContractIQ Alert', { body: `${critici.length} anomalie critiche!` });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => { if (p === 'granted') checkAndNotify(anomalies); });
        }
    }
}

// ============ INIT LISTENERS ============
document.addEventListener('DOMContentLoaded', () => {
    const segs = document.getElementById('costs-segment');
    if (segs) segs.addEventListener('click', (e) => { if (e.target.classList.contains('seg-btn')) renderCosts(e.target.dataset.prod); });

    const btnRefOv = document.getElementById('btn-refresh-overview');
    if (btnRefOv) btnRefOv.addEventListener('click', () => { loadContracts().then(() => renderOverview()); });
});
