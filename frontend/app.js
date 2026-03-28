/* ============================================
   FOCO — Contract Intelligence
   Application Logic
   ============================================ */

const API_BASE = 'http://localhost:5001/api/v1/contracts';
const API_DASHBOARD = 'http://localhost:5001/api';
const HEALTH_URL = 'http://localhost:5001/health';
const TENANT_ID = 'tenant-test-123';

// ============ STATE ============
let currentFile = null;
let extractedText = '';
let analysisResult = null;

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
        } else {
            throw new Error();
        }
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

    // Dropzone click
    dropzone.addEventListener('click', () => fileInput.click());

    // Drag events
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleWelcomeFile(e.dataTransfer.files[0]);
    });

    // File input
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleWelcomeFile(fileInput.files[0]);
    });

    // Remove file
    btnRemove.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        $('#welcome-file-selected').style.display = 'none';
        dropzone.style.display = 'block';
        btnStart.disabled = true;
    });

    // Start analysis
    btnStart.addEventListener('click', startWelcomeAnalysis);

    // Continue to app
    btnContinue.addEventListener('click', transitionToApp);
}

function handleWelcomeFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
    if (!allowed.includes(ext)) {
        showToast('Formato non supportato. Usa PDF, DOCX, JPG o PNG.', 'error');
        return;
    }

    currentFile = file;
    $('#welcome-file-name').textContent = file.name;
    $('#welcome-file-size').textContent = formatFileSize(file.size);
    $('#welcome-file-selected').style.display = 'flex';
    $('#welcome-dropzone').style.display = 'none';
    $('#welcome-btn-start').disabled = false;
}

async function startWelcomeAnalysis() {
    if (!currentFile) return;

    // Switch to processing phase
    setWelcomePhase('processing');

    const formData = new FormData();
    formData.append('file', currentFile);

    try {
        // Step 1: Upload & extract text
        updateProcessingStep(1, 'Estrazione testo dal documento...');

        const uploadRes = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'X-Tenant-ID': TENANT_ID },
            body: formData
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || uploadData.status !== 'success') {
            throw new Error(uploadData.message || 'Errore durante l\'upload');
        }

        extractedText = uploadData.data.extracted_text;

        // Step 2: AI Analysis
        updateProcessingStep(2, 'Analisi AI in corso...');

        const analyzeRes = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': TENANT_ID
            },
            body: JSON.stringify({ text: extractedText })
        });
        const analyzeData = await analyzeRes.json();

        if (!analyzeRes.ok || analyzeData.status !== 'success') {
            throw new Error(analyzeData.message || 'Errore durante l\'analisi AI');
        }

        analysisResult = analyzeData.data;

        // Step 3: Recognition complete
        updateProcessingStep(3, 'Riconoscimento completato!');

        // Extract company name (used implicitly for sidebar)
        const companyName = analysisResult?.anagrafica?.cliente_ragione_sociale || 'Cliente';

        // Wait a moment, then show greeting
        await sleep(800);

        // Show greeting
        setWelcomePhase('greeting');

        // Start multi-language animation - updated to just Benvenuti with fade-in
        const titleHtml = document.getElementById('greeting-multi-title');
        if(titleHtml) {
            titleHtml.textContent = 'Benvenuti';
            // Start transparent, text is scaled down, then add show-lang to trigger CSS transition
            titleHtml.className = 'greeting-multi-title';
            setTimeout(() => {
                titleHtml.className = 'greeting-multi-title show-lang';
            }, 100);
        }

    } catch (err) {
        showToast(err.message || 'Errore durante l\'elaborazione.', 'error');
        // Go back to upload
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
    // Hide welcome page, show app shell
    $('#welcome-page').classList.remove('active');
    $('#app-shell').classList.add('active');

    // Update sidebar tenant name
    const companyName = analysisResult?.anagrafica?.cliente_ragione_sociale || 'Cliente';
    $('#sidebar-tenant-name').textContent = companyName;

    // Pre-populate the analysis view in the upload section
    renderAnalysisResult(analysisResult);
    
    // Go directly to step 3 (analysis review) in the upload view
    switchView('upload');
    goToStep(3);
    
    // Also load contracts list in background
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

    $('#menu-toggle').addEventListener('click', () => {
        $('#sidebar').classList.toggle('open');
    });

    $('#btn-refresh-dashboard').addEventListener('click', loadContracts);
    $('#btn-refresh-contracts').addEventListener('click', loadContracts);
}

function switchView(viewName) {
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = $(`[data-view="${viewName}"]`);
    if (activeLink) activeLink.classList.add('active');

    $$('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${viewName}`).classList.add('active');

    const titles = {
        overview: 'Overview',
        costs: 'Reparto Costi',
        dashboard: 'Dashboard',
        upload: 'Carica Contratto',
        contracts: 'Contratti',
        radar: 'Risk Radar',
        topclients: 'Top Clients',
        advisor: 'AI Advisor',
        detail: 'Dettaglio Contratto'
    };
    $('#page-title').textContent = titles[viewName] || 'FOCO';

    if (viewName === 'overview') {
        renderOverview();
    } else if (viewName === 'costs') {
        renderCosts('totale');
    } else if (viewName === 'contracts') {
        loadContracts().then(() => {
            renderContractsKpiAndAnomalies();
            renderMap();
        });
    } else if (viewName === 'radar') {
        renderRadar();
    } else if (viewName === 'topclients') {
        renderTopClients();
    } else if (viewName === 'advisor') {
        renderAdvisor();
    } else if (viewName === 'dashboard') {
        loadContracts();
    }

    $('#sidebar').classList.remove('open');
}

window.switchView = switchView;

// ============ UPLOAD FLOW (in-app, for subsequent uploads) ============
function setupUploadFlow() {
    const dropzone = $('#dropzone');
    const fileInput = $('#file-input');
    const btnUpload = $('#btn-upload');
    const btnRemoveFile = $('#btn-remove-file');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFileSelect(fileInput.files[0]);
    });

    btnRemoveFile.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        $('#file-preview').style.display = 'none';
        dropzone.style.display = 'block';
        btnUpload.disabled = true;
    });

    btnUpload.addEventListener('click', uploadFile);

    $('#btn-back-to-upload').addEventListener('click', () => goToStep(1));
    $('#btn-analyze').addEventListener('click', analyzeText);
    $('#btn-back-to-text').addEventListener('click', () => goToStep(2));
    $('#btn-save').addEventListener('click', saveContract);
    $('#btn-new-upload').addEventListener('click', resetUploadFlow);

    $('#search-contracts').addEventListener('input', (e) => {
        filterContracts(e.target.value);
    });
}

function handleFileSelect(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'jpg', 'jpeg', 'png'].includes(ext)) {
        showToast('Formato non supportato.', 'error');
        return;
    }
    currentFile = file;
    $('#file-name').textContent = file.name;
    $('#file-size').textContent = formatFileSize(file.size);
    $('#file-preview').style.display = 'flex';
    $('#dropzone').style.display = 'none';
    $('#btn-upload').disabled = false;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============ STEP MANAGEMENT ============
function goToStep(stepNum) {
    for (let i = 1; i <= 4; i++) {
        const indicator = $(`#step-indicator-${i}`);
        indicator.classList.remove('active', 'done');
        if (i < stepNum) indicator.classList.add('done');
        if (i === stepNum) indicator.classList.add('active');
    }
    $$('.step-content').forEach(s => s.classList.remove('active'));
    $(`#step-${stepNum}`).classList.add('active');
}

// ============ API CALLS ============
async function uploadFile() {
    if (!currentFile) return;
    showLoader('Caricamento e estrazione testo in corso...');

    const formData = new FormData();
    formData.append('file', currentFile);

    try {
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'X-Tenant-ID': TENANT_ID },
            body: formData
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            extractedText = data.data.extracted_text;
            $('#extracted-text').value = extractedText;
            $('#text-length-badge').textContent = `${extractedText.length} caratteri`;
            goToStep(2);
            showToast('Testo estratto con successo!', 'success');
        } else {
            showToast(data.message || 'Errore durante l\'upload', 'error');
        }
    } catch (err) {
        showToast('Impossibile contattare il server.', 'error');
    } finally {
        hideLoader();
    }
}

async function analyzeText() {
    const text = $('#extracted-text').value;
    if (!text || text.length < 10) {
        showToast('Il testo è troppo corto.', 'error');
        return;
    }
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
            renderAnalysisResult(analysisResult);
            goToStep(3);
            showToast('Analisi completata!', 'success');
        } else {
            showToast(data.message || 'Errore durante l\'analisi', 'error');
        }
    } catch (err) {
        showToast('Errore di rete.', 'error');
    } finally {
        hideLoader();
    }
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
            goToStep(4);
            showToast('Contratto salvato!', 'success');
        } else {
            showToast(data.message || 'Errore', 'error');
        }
    } catch (err) {
        showToast('Errore di rete.', 'error');
    } finally {
        hideLoader();
    }
}

async function loadContracts() {
    try {
        const res = await fetch(`${API_BASE}/list`, { headers: { 'X-Tenant-ID': TENANT_ID } });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            renderContractsTable(data.data);
            if ($('#view-overview').classList.contains('active')) {
                renderOverview();
            }
        }
    } catch (err) {
        console.error('Errore caricamento contratti:', err);
    }
}

async function loadContractDetail(contractId) {
    showLoader('Caricamento dettaglio...');
    try {
        const res = await fetch(`${API_BASE}/${contractId}`, { headers: { 'X-Tenant-ID': TENANT_ID } });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            renderContractDetail(data.data);
            switchView('detail');
        } else {
            showToast('Contratto non trovato.', 'error');
        }
    } catch (err) {
        showToast('Errore.', 'error');
    } finally {
        hideLoader();
    }
}

// ============ RENDERERS ============
function renderDashboard(contracts) {
    // Obsoleto: le viste originali di index.html sono state rimosse e sostituite con view-overview.
    // Funzione mantenuta vuota per evitare eccezioni in loadContracts.
}

function renderContractsTable(contracts) {
    window._allContracts = contracts;
    const container = $('#contracts-table-body');
    if (contracts.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="ri-inbox-line"></i><p>Nessun contratto</p></div>';
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

    container.innerHTML = `
        <table class="data-table">
            <thead><tr><th>Cliente</th><th>Prodotto</th><th>Stato</th><th>Ver.</th><th>ID</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
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
    const grid = $('#analysis-grid');
    const prodotto = result.prodotto || 'N/A';

    const productBadge = $('#product-badge');
    productBadge.textContent = prodotto;
    productBadge.className = `badge ${prodotto === 'Freader' ? 'badge--purple' : 'badge--warning'}`;

    let html = '';
    const ana = result.anagrafica || {};
    html += buildSection('Anagrafica', 'ri-building-2-line', {
        'Ragione Sociale': ana.cliente_ragione_sociale,
        'Sede Legale': ana.cliente_sede_legale
    });

    const det = result.dettagli_contratto || {};
    html += buildSection('Dettagli Contratto', 'ri-calendar-line', {
        'Data Firma': det.data_firma,
        'Durata': det.durata_mesi ? `${det.durata_mesi} mesi` : 'N/A',
        'Preavviso': det.preavviso_giorni ? `${det.preavviso_giorni} giorni` : 'N/A'
    });

    if (prodotto.toLowerCase().includes('freader')) {
        const com = result.commerciale_freader || {};
        html += buildSection('Commerciale Freader', 'ri-money-euro-circle-line', {
            'Canone Trimestrale': formatCurrency(com.canone_trimestrale),
            'Fascia 1 (1k-10k)': com.prezzo_fascia_1 != null ? `${com.prezzo_fascia_1} cent` : 'N/A',
            'Fascia 2 (10k-50k)': com.prezzo_fascia_2 != null ? `${com.prezzo_fascia_2} cent` : 'N/A',
            'Fascia 3 (>50k)': com.prezzo_fascia_3 != null ? `${com.prezzo_fascia_3} cent` : 'N/A'
        });
    } else {
        const com = result.commerciale_cutai || {};
        html += buildSection('Commerciale CutAI', 'ri-money-euro-circle-line', {
            'Profilo': com.profilo_commerciale,
            'Canone Trimestrale': formatCurrency(com.canone_base_trimestrale),
            'Utenti Inclusi': com.soglia_utenti_inclusi,
            'Fee Utente Extra': formatCurrency(com.fee_utente_extra),
            'Soglia Servizio': com.soglia_minima_servizio ? `${com.soglia_minima_servizio}%` : 'N/A'
        });
    }

    const sla = result.sla || {};
    html += buildSection('SLA', 'ri-shield-check-line', {
        'Credito Uptime': sla.credito_uptime ? `${sla.credito_uptime}%` : 'N/A',
        'Credito Ticketing': sla.credito_ticketing ? `${sla.credito_ticketing}%` : 'N/A',
        'Tetto Crediti': sla.tetto_crediti ? `${sla.tetto_crediti}%` : 'N/A'
    });

    grid.innerHTML = html;
}

function buildSection(title, icon, fields) {
    const fieldsHtml = Object.entries(fields).map(([label, value]) => `
        <div class="analysis-field">
            <span class="analysis-field-label">${label}</span>
            <span class="analysis-field-value">${value ?? 'N/A'}</span>
        </div>`).join('');

    return `
        <div class="analysis-section">
            <div class="analysis-section-title"><i class="${icon}"></i> ${title}</div>
            ${fieldsHtml}
        </div>`;
}

function renderContractDetail(contract) {
    const badge = $('#detail-product-badge');
    badge.textContent = contract.prodotto;
    badge.className = `badge ${contract.prodotto === 'Freader' ? 'badge--purple' : 'badge--warning'}`;

    const history = contract.history || [];
    let timelineHtml = '';
    if (history.length > 0) {
        timelineHtml = history.map(v => {
            const details = contract.prodotto === 'Freader'
                ? `<span>Data firma: <strong>${v.data_firma || 'N/A'}</strong></span><span>Canone: <strong>${formatCurrency(v.canone)}</strong></span>`
                : `<span>Piano: <strong>${v.piano || 'N/A'}</strong></span><span>Canone: <strong>${formatCurrency(v.canone)}</strong></span>`;
            return `
                <div class="version-item">
                    <div class="version-number">Versione ${v.version}</div>
                    <div class="version-details">${details}</div>
                </div>`;
        }).join('');
    } else {
        timelineHtml = '<p style="color: var(--text-tertiary);">Nessuna versione trovata.</p>';
    }

    $('#detail-body').innerHTML = `
        <div class="detail-header"><h3 class="detail-client-name">${escapeHtml(contract.cliente)}</h3></div>
        <div class="detail-meta">
            <div class="detail-meta-item">ID: <strong><code>${contract.id}</code></strong></div>
            <div class="detail-meta-item">Prodotto: <strong>${contract.prodotto}</strong></div>
            <div class="detail-meta-item">Versioni: <strong>${history.length}</strong></div>
        </div>
        <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem;"><i class="ri-time-line" style="color: var(--accent);"></i> Storico Versioni</h4>
        <div class="version-timeline">${timelineHtml}</div>`;
}

// ============ RESET ============
function resetUploadFlow() {
    currentFile = null;
    extractedText = '';
    analysisResult = null;
    $('#file-input').value = '';
    $('#file-preview').style.display = 'none';
    $('#dropzone').style.display = 'block';
    $('#btn-upload').disabled = true;
    $('#extracted-text').value = '';
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showLoader(text) {
    $('#loader-text').textContent = text || 'Elaborazione in corso...';
    $('#loading-overlay').classList.add('active');
}

function hideLoader() {
    $('#loading-overlay').classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = $('#toast-container');
    const icons = { success: 'ri-checkbox-circle-line', error: 'ri-error-warning-line', info: 'ri-information-line' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

window.loadContractDetail = loadContractDetail;

// ============================================
// CONTRACTIQ MOCK DATA & RENDERERS
// ============================================

// --- MOCK DATA REMOVED ---

// --- RENDERERS ---
function renderOverview() {
    const grid = $('#kpi-grid');
    if(!grid) return;
    
    // Fetch KPI Data
    fetch(`${API_DASHBOARD}/kpi`)
        .then(res => res.json())
        .then(kpi => {
            let overviewKpi = [
                { title: 'Fatturato Annuo', value: '€ ' + (kpi.fatturato_totale/1000).toFixed(0) + 'k', desc: `+${kpi.yoy_growth.toFixed(1)}% YoY`, color: 'blue', icon: 'ri-money-euro-circle-line' },
                { title: 'Margine Operativo', value: kpi.margine_pct + '%', desc: `+${kpi.mom_margine.toFixed(1)}% MoM`, color: 'green', icon: 'ri-line-chart-line' },
                { title: 'Contratti Attivi', value: kpi.attivi, desc: `${kpi.in_scadenza_90} in scadenza`, color: 'purple', icon: 'ri-check-double-line' },
                { title: 'Tasso di Crescita', value: kpi.mom_growth + '%', desc: 'Mensile', color: 'orange', icon: 'ri-trend-up-line' }
            ];
            grid.innerHTML = overviewKpi.map(k => `
                <div class="stat-card">
                    <div class="stat-icon stat-icon--${k.color}"><i class="${k.icon}"></i></div>
                    <div class="stat-info">
                        <span class="stat-value">${k.value}</span>
                        <span class="stat-label">${k.title} <span style="font-size:0.75rem; color:var(--accent); margin-left:8px;">${k.desc}</span></span>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => console.error(err));

    const tableBody = $('#overview-table-body');
    if(window._allContracts && window._allContracts.length > 0) {
        tableBody.innerHTML = `
        <table class="data-table">
            <thead><tr><th>Cliente</th><th>Prodotto</th><th>Stato</th></tr></thead>
            <tbody>
                ${window._allContracts.slice(0, 5).map(c => `
                <tr onclick="switchView('contracts'); loadContractDetail('${c.id}')">
                    <td>${escapeHtml(c.cliente)}</td>
                    <td><span class="badge ${c.prodotto === 'Freader' ? 'badge--purple' : 'badge--warning'}">${c.prodotto}</span></td>
                    <td><span class="badge badge--success">${c.status}</span></td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    } else {
        tableBody.innerHTML = `<div class="empty-state"><p>Caricamento o nessun contratto...</p></div>`;
    }

    const expList = $('#expiring-list');
    if(expList) {
        fetch(`${API_DASHBOARD}/expiring`)
            .then(res => res.json())
            .then(expData => {
                expList.innerHTML = expData.map(e => `
                    <div class="anomaly-item hs-${e.giorni_scadenza < 60 ? 'alta' : 'media'}" style="margin-bottom:0.5rem; cursor:pointer;" onclick="switchView('contracts')">
                        <div style="flex:1;">
                            <div class="a-title">${e.cliente}</div>
                            <div class="a-desc">Scade il ${e.scadenza} — ${e.prodotto}</div>
                        </div>
                        <div class="a-client">€ ${e.canone_trim}/trim</div>
                    </div>
                `).join('');
            })
            .catch(err => console.error(err));
    }
}

function renderCosts(prod) {
    $$('.seg-btn').forEach(b => b.classList.remove('active'));
    $(`.seg-btn[data-prod="${prod}"]`).classList.add('active');

    fetch(`${API_DASHBOARD}/costs/${prod}`)
        .then(res => res.json())
        .then(data => {
            let kpi = [
                { title: 'Costi Fissi', value: '€ '+(data.tot_fissi/1000).toFixed(0)+'k', color: 'blue', icon: 'ri-building-line' },
                { title: 'Costi Variabili', value: '€ '+(data.tot_variabili/1000).toFixed(0)+'k', color: 'orange', icon: 'ri-arrow-up-down-line' },
                { title: 'Costo Medio / Contratto', value: '€ '+data.costo_unit_trad.toFixed(0), color: 'green', icon: 'ri-pie-chart-line' }
            ];

            $('#costs-kpi-grid').innerHTML = kpi.map(k => `
                <div class="stat-card">
                    <div class="stat-icon stat-icon--${k.color}"><i class="${k.icon}"></i></div>
                    <div class="stat-info">
                        <span class="stat-value">${k.value}</span>
                        <span class="stat-label">${k.title}</span>
                    </div>
                </div>
            `).join('');

            $('#costi-fissi-table').innerHTML = `
                <table class="data-table">
                    <thead><tr><th>Voce Costo</th><th>Tipologia</th><th>Importo</th></tr></thead>
                    <tbody>${data.fissi.map(f => `<tr><td>${f.voce}</td><td><span class="badge badge--info">${f.tipo}</span></td><td><strong>€ ${f.importo.toLocaleString('it-IT')}</strong></td></tr>`).join('')}</tbody>
                </table>`;

            $('#costi-variabili-table').innerHTML = `
                <table class="data-table">
                    <thead><tr><th>Voce Costo</th><th>Tipologia</th><th>Costo Unitario</th></tr></thead>
                    <tbody>${data.variabili.map(v => `<tr><td>${v.voce}</td><td><span class="badge badge--purple">${v.tipo}</span></td><td><strong>${v.unita || 'N/A'}</strong></td></tr>`).join('')}</tbody>
                </table>`;
        })
        .catch(err => console.error(err));
}

function renderContractsKpiAndAnomalies() {
    fetch(`${API_DASHBOARD}/anomalies`)
        .then(res => res.json())
        .then(anomalies => {
            $('#contracts-kpi-grid').innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon stat-icon--blue"><i class="ri-folder-shield-2-line"></i></div>
                    <div class="stat-info"><span class="stat-value">${window._allContracts ? window._allContracts.length : 0}</span><span class="stat-label">Contratti Totali</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-icon--green"><i class="ri-checkbox-circle-line"></i></div>
                    <div class="stat-info"><span class="stat-value">${window._allContracts ? window._allContracts.filter(c=>c.status==='ACTIVE').length : 0}</span><span class="stat-label">Attivi</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-icon--danger"><i class="ri-error-warning-line"></i></div>
                    <div class="stat-info"><span class="stat-value">${anomalies.length}</span><span class="stat-label">Anomalie Rilevate</span></div>
                </div>
            `;

            $('#anomalies-container').innerHTML = `
                <div class="card" style="border-color:var(--color-danger); background: var(--color-danger-bg);">
                    <div class="card-header" style="border-bottom:none; padding-bottom:0;">
                        <h2 style="color:var(--color-danger);"><i class="ri-alarm-warning-fill"></i> Attenzione: ${anomalies.length} anomalie riscontrate</h2>
                    </div>
                    <div class="card-body">
                        <div class="anomalies-list">
                            ${anomalies.map(a => `
                                <div class="anomaly-item hs-${a.gravita}">
                                    <i class="${a.gravita === 'alta' ? 'ri-close-circle-line' : 'ri-error-warning-line'}" style="font-size:1.5rem; color:var(--color-danger);"></i>
                                    <div style="flex:1;">
                                        <div class="a-title">${a.tipo.toUpperCase().replace('_', ' ')}: ${a.cliente}</div>
                                        <div class="a-desc">${a.desc}</div>
                                    </div>
                                    <div class="a-client">${a.prodotto}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            if (!window._notified) {
                checkAndNotify(anomalies);
                window._notified = true;
            }
        })
        .catch(err => console.error(err));
}

function renderMap() {
    fetch(`${API_DASHBOARD}/map-data`)
        .then(res => res.json())
        .then(mapData => {
            $('#map-container').innerHTML = `
                <svg viewBox="0 0 100 100" style="width:100%; height:100%; opacity:0.3; position:absolute; z-index:0; pointer-events:none;">
                    <path d="M25,20 L40,25 L50,40 L65,55 L80,70 L75,80 L60,85 L50,75 L45,85 L35,70 L30,55 L25,45 Z" fill="none" stroke="var(--text-tertiary)" stroke-width="2" stroke-linejoin="round"/>
                </svg>
                <div style="position:relative; width:100%; height:300px; z-index:1;">
                    ${mapData.map(d => `
                        <div class="map-dot" style="position:absolute; left:${d.lng*3}%; top:${100 - d.lat*2}%;" title="${d.citta}: ${d.count} contratti">
                            <i class="ri-map-pin-2-fill" style="color:var(--accent); font-size:1.5rem; filter:drop-shadow(0 0 10px var(--accent-glow));"></i>
                            <div style="position:absolute; background:var(--bg-card); border:1px solid var(--border-color); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.7rem; color:var(--text-primary); margin-top:4px; transform:translate(-25%, 0); pointer-events:none;">
                                ${d.citta} (${d.count})
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        })
        .catch(err => console.error(err));
}

function renderTopClients() {
    fetch(`${API_DASHBOARD}/top-clients`)
        .then(res => res.json())
        .then(clients => {
            $('#topclients-container').innerHTML = `
                <table class="data-table">
                    <thead><tr><th>Rank</th><th>Cliente</th><th>Score</th><th>Prodotto</th><th>Canone Trimestrale</th></tr></thead>
                    <tbody>
                        ${clients.map(c => `
                        <tr>
                            <td><div class="rank-number">#${c.index+1}</div></td>
                            <td><strong style="font-size:1.05rem; color:var(--text-primary);">${c.cliente}</strong></td>
                            <td><span class="rank-score">${c.rating}/100</span></td>
                            <td><span class="badge ${c.rating > 90 ? 'badge--success' : (c.rating > 70 ? 'badge--info' : 'badge--warning')}">${c.prodotto}</span></td>
                            <td>€ ${c.canone_trim}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        })
        .catch(err => console.error(err));
}

function renderRadar() {
    fetch(`${API_DASHBOARD}/anomalies`)
        .then(res => res.json())
        .then(anomalies => {
            $('#radar-container').innerHTML = anomalies.map(a => `
                <div style="flex: 1 1 300px; background: rgba(255,255,255,0.02); border: 1px solid ${a.gravita === 'alta' ? 'var(--color-danger)' : 'var(--border-color)'}; padding: 1.5rem; border-radius: var(--radius-md);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">${a.cliente}</h3>
                        <span class="badge ${a.gravita === 'alta' ? 'badge--danger' : 'badge--warning'}">${a.gravita.toUpperCase()}</span>
                    </div>
                    <p style="color: var(--text-primary); font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem;"><i class="ri-alert-line"></i> ${a.tipo.replace('_', ' ')}</p>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.4;">${a.desc}</p>
                    <button class="btn btn--sm btn--primary" style="margin-top: 1rem; width: 100%;">Apri Pratica</button>
                </div>
            `).join('') || '<p style="color:var(--text-secondary);">Nessuna anomalia contrattuale rilevata.</p>';
        })
        .catch(err => console.error(err));
}

function renderAdvisor() {
    fetch(`${API_DASHBOARD}/ai-advice`)
        .then(res => res.json())
        .then(advice => {
            $('#advisor-container').innerHTML = advice.map(a => `
                <div class="advisor-card">
                    <div class="adv-icon"><i class="ri-robot-2-fill"></i></div>
                    <div class="adv-content">
                        <div class="adv-title">${a.titolo} <span class="badge ${a.priorita === 'alta' ? 'badge--danger' : 'badge--purple'}">${a.categoria}</span></div>
                        <div class="adv-desc">${a.desc}</div>
                        <button class="adv-action">${a.azione}</button>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => console.error(err));
}

function checkAndNotify(anomalies) {
    if ("Notification" in window) {
        if (Notification.permission === 'granted' && anomalies) {
            const critici = anomalies.filter(a => a.gravita === 'alta');
            if (critici.length > 0) {
                new Notification('ContractIQ Alert', { 
                    body: `${critici.length} anomalie critiche rilevate nei contratti!`,
                });
            }
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') checkAndNotify(anomalies);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const segs = document.getElementById('costs-segment');
    if (segs) {
        segs.addEventListener('click', (e) => {
            if(e.target.classList.contains('seg-btn')) {
                renderCosts(e.target.dataset.prod);
            }
        });
    }
    
    const btnRefOv = document.getElementById('btn-refresh-overview');
    if (btnRefOv) {
        btnRefOv.addEventListener('click', () => {
            loadContracts().then(() => renderOverview());
        });
    }

    // Set initial view after a small delay to allow health checks to run
    setTimeout(() => {
        loadContracts().then(() => {
            switchView('overview');
        });
    }, 500);
});
