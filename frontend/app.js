/* ============================================
   FOCO — Contract Intelligence
   Application Logic
   ============================================ */

const API_BASE = 'http://localhost:5001/api/v1/contracts';
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

        // Extract company name
        const companyName = analysisResult?.anagrafica?.cliente_ragione_sociale || 'Cliente';

        // Wait a moment, then show greeting
        await sleep(800);

        // Show greeting
        $('#greeting-company-name').textContent = companyName;
        setWelcomePhase('greeting');

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
        dashboard: 'Dashboard',
        upload: 'Carica Contratto',
        contracts: 'Contratti',
        detail: 'Dettaglio Contratto'
    };
    $('#page-title').textContent = titles[viewName] || 'FOCO';

    if (viewName === 'dashboard' || viewName === 'contracts') {
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
            renderDashboard(data.data);
            renderContractsTable(data.data);
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
    const total = contracts.length;
    const active = contracts.filter(c => c.status === 'ACTIVE').length;
    const freader = contracts.filter(c => c.prodotto === 'Freader').length;
    const cutai = contracts.filter(c => c.prodotto === 'CutAI').length;

    $('#stat-total').textContent = total;
    $('#stat-active').textContent = active;
    $('#stat-freader').textContent = freader;
    $('#stat-cutai').textContent = cutai;

    const container = $('#dashboard-table-body');
    if (total === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-inbox-line"></i>
                <p>Nessun contratto caricato</p>
                <button class="btn btn--primary" onclick="switchView('upload')">
                    <i class="ri-upload-cloud-2-line"></i> Carica il primo contratto
                </button>
            </div>`;
        return;
    }

    const rows = contracts.slice(0, 10).map(c => `
        <tr onclick="loadContractDetail('${c.id}')">
            <td>${escapeHtml(c.cliente)}</td>
            <td><span class="badge ${c.prodotto === 'Freader' ? 'badge--purple' : 'badge--warning'}">${c.prodotto}</span></td>
            <td><span class="badge ${c.status === 'ACTIVE' ? 'badge--success' : 'badge--info'}">${c.status}</span></td>
            <td>${c.versioni}</td>
        </tr>`).join('');

    container.innerHTML = `
        <table class="data-table">
            <thead><tr><th>Cliente</th><th>Prodotto</th><th>Stato</th><th>Ver.</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
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
