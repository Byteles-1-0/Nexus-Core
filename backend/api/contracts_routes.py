from flask import Blueprint, request, jsonify, current_app, send_from_directory, send_file
from werkzeug.utils import secure_filename
from datetime import datetime
import os

from extensions import db
from models import FreaderContract, CutAIContract, FreaderContractVersion, CutAIContractVersion
from service.db_service import save_contract_to_db
from service.ai_service import analyze_contract_text
from utils.parser import parse_document

contracts_bp = Blueprint('contracts', __name__)


@contracts_bp.route('/upload-and-analyze', methods=['POST'])
def upload_and_analyze():
    # 1. Verifica file
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "Nessun file fornito"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "Nome file vuoto"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

    file.save(filepath)

    try:
        # 3. Estrazione testo (OCR o DOCX)
        print(f"📄 Estrazione testo da {filename}...")
        text = parse_document(filepath)
        
        if not text or len(text.strip()) < 10:
            return jsonify({"status": "error", "message": "Impossibile estrarre testo dal documento"}), 422

        # 4. Analisi con LLM
        print(f"🧠 Analisi IA in corso...")
        analysis_result = analyze_contract_text(text)

        # 5. Ritorna il JSON all'utente per la verifica (include filename)
        return jsonify({
            "status": "success",
            "data": {
                "filename": filename,
                "analysis": analysis_result
            }
        }), 200

    except Exception as e:
        print(f"❌ Errore durante il processo: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# 0. BATCH UPLOAD AND ANALYZE (POST)
# ==========================================
@contracts_bp.route('/upload-and-analyze-batch', methods=['POST'])
def upload_and_analyze_batch():
    if 'files' not in request.files:
        return jsonify({"status": "error", "message": "Nessun file fornito (chiave 'files' mancante)"}), 400
        
    files = request.files.getlist('files')
    if not files or all(file.filename == '' for file in files):
        return jsonify({"status": "error", "message": "Nessun file valido trovato"}), 400

    results = []
    errors = []

    for file in files:
        if file.filename == '':
            continue
            
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

        file.save(filepath)

        try:
            print(f"📄 Estrazione testo da {filename}...")
            text = parse_document(filepath)
            
            if not text or len(text.strip()) < 10:
                print(f"⚠️ Testo non sufficiente per {filename}")
                errors.append({"filename": filename, "error": "Impossibile estrarre testo o testo troppo breve"})
                continue

            print(f"🧠 Analisi IA in corso per {filename}...")
            analysis_result = analyze_contract_text(text)
            
            results.append({
                "filename": filename,
                "analysis": analysis_result
            })
            
        except Exception as e:
            print(f"❌ Errore durante l'elaborazione di {filename}: {str(e)}")
            errors.append({"filename": filename, "error": str(e)})

    return jsonify({
        "status": "success",
        "data": results,
        "errors": errors
    }), 200

# ==========================================
# 1. UPLOAD (POST)
# ==========================================
@contracts_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "Nessun file fornito"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "Nome file vuoto"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

    file.save(filepath)

    try:
        # Estrazione testo grezzo
        extracted_text = parse_document(filepath)
        return jsonify({
            "status": "success",
            "data": {
                "filename": filename,
                "extracted_text": extracted_text
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# 2. ANALYZE (POST)
# ==========================================
@contracts_bp.route('/analyze', methods=['POST'])
def analyze_text():
    data = request.get_json()
    text = data.get('text')
    
    if not text:
        return jsonify({"status": "error", "message": "Testo mancante"}), 400

    try:
        struttura_json = analyze_contract_text(text)
        return jsonify({
            "status": "success",
            "data": struttura_json
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# 3. SAVE (POST) - Conferma Utente
# ==========================================
@contracts_bp.route('/save', methods=['POST'])
def save_contract():
    tenant_id = request.headers.get('X-Tenant-ID')
    data = request.get_json()
    user = data.get('user_id', 'System')
    extracted_data = data.get('extracted_data')
    filename = data.get('filename')

    if not extracted_data:
        return jsonify({"status": "error", "message": "Dati estratti mancanti"}), 400

    try:
        contract_id = save_contract_to_db(tenant_id, extracted_data, created_by=user, filename=filename)
        return jsonify({"status": "success", "contract_id": contract_id}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# 4. LIST (GET) - Data Table Frontend
# ==========================================
@contracts_bp.route('/list', methods=['GET'])
def list_contracts():
    tenant_id = request.headers.get('X-Tenant-ID')
    unified_list = []

    # Recuperiamo e uniformiamo i contratti Freader
    freader_contracts = FreaderContract.query.filter_by(tenant_id=tenant_id).all()
    for c in freader_contracts:
        unified_list.append({
            "id": c.id,
            "prodotto": "Freader",
            "cliente": c.cliente_ragione_sociale,
            "status": c.status,
            "versioni": len(c.versions)
        })

    # Recuperiamo e uniformiamo i contratti CutAI
    cutai_contracts = CutAIContract.query.filter_by(tenant_id=tenant_id).all()
    for c in cutai_contracts:
        unified_list.append({
            "id": c.id,
            "prodotto": "CutAI",
            "cliente": c.cliente_ragione_sociale,
            "status": c.status,
            "versioni": len(c.versions)
        })

    return jsonify({"status": "success", "data": unified_list}), 200

# ==========================================
# 4b. MAP DATA (GET) - Contratti con coordinate
# ==========================================
@contracts_bp.route('/map', methods=['GET'])
def get_map_contracts():
    tenant_id = request.headers.get('X-Tenant-ID')
    features = []

    freader_contracts = FreaderContract.query.filter_by(tenant_id=tenant_id).all()
    for c in freader_contracts:
        if c.lat and c.lng:
            latest = c.versions[0] if c.versions else None
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [c.lng, c.lat]},
                "properties": {
                    "id": c.id,
                    "prodotto": "Freader",
                    "cliente": c.cliente_ragione_sociale,
                    "sede": c.cliente_sede_legale,
                    "status": c.status,
                    "canone": latest.canone_trimestrale if latest else None
                }
            })

    cutai_contracts = CutAIContract.query.filter_by(tenant_id=tenant_id).all()
    for c in cutai_contracts:
        if c.lat and c.lng:
            latest = c.versions[0] if c.versions else None
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [c.lng, c.lat]},
                "properties": {
                    "id": c.id,
                    "prodotto": "CutAI",
                    "cliente": c.cliente_ragione_sociale,
                    "sede": c.cliente_sede_legale,
                    "status": c.status,
                    "canone": latest.canone_base_trimestrale if latest else None
                }
            })

    return jsonify({
        "type": "FeatureCollection",
        "features": features
    }), 200

# ==========================================
# 5. DOWNLOAD PDF/FILE (GET) - PDF Viewer
# ==========================================
@contracts_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Permette al frontend di visualizzare il PDF. 
    Esempio in React: <iframe src="http://localhost:5000/api/v1/contracts/download/contratto.pdf" />
    """
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], secure_filename(filename))

# ==========================================
# 6. GET SINGOLO CONTRATTO (GET)
# ==========================================
@contracts_bp.route('/<contract_id>', methods=['GET'])
def get_contract(contract_id):
    tenant_id = request.headers.get('X-Tenant-ID')
    
    # Cerchiamo in Freader
    f_contract = FreaderContract.query.filter_by(id=contract_id, tenant_id=tenant_id).first()
    if f_contract:
        return jsonify({
            "status": "success",
            "data": {
                "id": f_contract.id,
                "prodotto": "Freader",
                "cliente": f_contract.cliente_ragione_sociale,
                "sede": f_contract.cliente_sede_legale,
                "filename": f_contract.original_filename,
                "history": [{"version": v.version_number, "data_firma": v.data_firma, "canone": v.canone_trimestrale} for v in f_contract.versions]
            }
        }), 200

    # Cerchiamo in CutAI
    c_contract = CutAIContract.query.filter_by(id=contract_id, tenant_id=tenant_id).first()
    if c_contract:
        return jsonify({
            "status": "success",
            "data": {
                "id": c_contract.id,
                "prodotto": "CutAI",
                "cliente": c_contract.cliente_ragione_sociale,
                "sede": c_contract.cliente_sede_legale,
                "filename": c_contract.original_filename,
                "history": [{"version": v.version_number, "piano": v.profilo_commerciale, "canone": v.canone_base_trimestrale} for v in c_contract.versions]
            }
        }), 200

    return jsonify({"status": "error", "code": 404, "message": "Contratto non trovato."}), 404

# ==========================================
# 7. CREA NUOVA VERSIONE (POST / UPDATE)
# ==========================================
@contracts_bp.route('/<contract_id>/versions', methods=['POST'])
def add_new_version(contract_id):
    tenant_id = request.headers.get('X-Tenant-ID')
    data = request.get_json()
    
    # Verifica se è Freader
    f_contract = FreaderContract.query.filter_by(id=contract_id, tenant_id=tenant_id).first()
    if f_contract:
        last_version = FreaderContractVersion.query.filter_by(contract_id=contract_id).order_by(FreaderContractVersion.version_number.desc()).first()
        new_version_num = (last_version.version_number + 1) if last_version else 1
        
        # Inserisci nuova riga (Audit-Ready)
        new_v = FreaderContractVersion(
            contract_id=contract_id,
            version_number=new_version_num,
            data_firma=data.get('data_firma', last_version.data_firma if last_version else ''),
            durata_mesi=data.get('durata_mesi', last_version.durata_mesi if last_version else 12),
            preavviso_giorni=data.get('preavviso_giorni', last_version.preavviso_giorni if last_version else 30),
            canone_trimestrale=data.get('canone_trimestrale', last_version.canone_trimestrale if last_version else 0),
            prezzo_fascia_1=data.get('prezzo_fascia_1', last_version.prezzo_fascia_1 if last_version else 0),
            prezzo_fascia_2=data.get('prezzo_fascia_2', last_version.prezzo_fascia_2 if last_version else 0),
            prezzo_fascia_3=data.get('prezzo_fascia_3', last_version.prezzo_fascia_3 if last_version else 0),
            credito_uptime=data.get('credito_uptime', last_version.credito_uptime if last_version else 0),
            credito_ticketing=data.get('credito_ticketing', last_version.credito_ticketing if last_version else 0),
            tetto_crediti=data.get('tetto_crediti', last_version.tetto_crediti if last_version else 0),
            created_by=data.get('user_id', 'System'),
            change_reason=data.get('change_reason', 'Rinegoziazione')
        )
        db.session.add(new_v)
        db.session.commit()
        return jsonify({"status": "success", "new_version": new_version_num}), 201

    # Verifica se è CutAI
    c_contract = CutAIContract.query.filter_by(id=contract_id, tenant_id=tenant_id).first()
    if c_contract:
        last_version = CutAIContractVersion.query.filter_by(contract_id=contract_id).order_by(CutAIContractVersion.version_number.desc()).first()
        new_version_num = (last_version.version_number + 1) if last_version else 1
        
        # Inserisci nuova riga (Audit-Ready)
        new_v = CutAIContractVersion(
            contract_id=contract_id,
            version_number=new_version_num,
            data_sottoscrizione=data.get('data_firma', last_version.data_sottoscrizione if last_version else ''),
            durata_mesi=data.get('durata_mesi', last_version.durata_mesi if last_version else 12),
            preavviso_giorni=data.get('preavviso_giorni', last_version.preavviso_giorni if last_version else 30),
            profilo_commerciale=data.get('profilo_commerciale', last_version.profilo_commerciale if last_version else 'Standard'),
            canone_base_trimestrale=data.get('canone_trimestrale', last_version.canone_base_trimestrale if last_version else 0),
            soglia_utenti_inclusi=data.get('soglia_utenti_inclusi', last_version.soglia_utenti_inclusi if last_version else 0),
            fee_utente_extra=data.get('fee_utente_extra', last_version.fee_utente_extra if last_version else 0),
            soglia_minima_servizio=data.get('soglia_minima_servizio', last_version.soglia_minima_servizio if last_version else 98.0),
            credito_uptime=data.get('credito_uptime', last_version.credito_uptime if last_version else 0),
            credito_ticketing=data.get('credito_ticketing', last_version.credito_ticketing if last_version else 0),
            tetto_crediti=data.get('tetto_crediti', last_version.tetto_crediti if last_version else 0),
            created_by=data.get('user_id', 'System'),
            change_reason=data.get('change_reason', 'Rinegoziazione')
        )
        db.session.add(new_v)
        db.session.commit()
        return jsonify({"status": "success", "new_version": new_version_num}), 201
    
    return jsonify({"status": "error", "code": 404, "message": "Contratto non trovato."}), 404


# ==========================================
# 8. PRE-SIGN ANALYSIS (POST)
# ==========================================
@contracts_bp.route('/pre-sign-analysis', methods=['POST'])
def pre_sign_analysis():
    """
    Analizza un contratto pre-firma confrontandolo con lo storico.
    Restituisce 3 livelli di modifiche suggerite.
    """
    from service.ai_service import analyze_pre_sign
    from datetime import datetime, timedelta
    
    tenant_id = request.headers.get('X-Tenant-ID')
    data = request.get_json()
    
    contract_data = data.get('contract_data')
    if not contract_data:
        return jsonify({"status": "error", "message": "Dati contratto mancanti"}), 400
    
    prodotto = contract_data.get('prodotto')
    
    try:
        # Get historical contracts of same product
        historical = []
        today = datetime.now()
        
        if prodotto == 'Freader':
            contracts = FreaderContract.query.filter_by(tenant_id=tenant_id, status='ACTIVE').all()
            for c in contracts:
                if c.versions:
                    latest = c.versions[0]
                    try:
                        data_firma = datetime.strptime(latest.data_firma, '%d/%m/%Y')
                        scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                        giorni_scadenza = (scadenza - today).days
                        
                        historical.append({
                            'cliente': c.cliente_ragione_sociale,
                            'canone_trim': latest.canone_trimestrale,
                            'durata_mesi': latest.durata_mesi,
                            'preavviso_gg': latest.preavviso_giorni,
                            'tetto_cred': latest.tetto_crediti,
                            'credito_uptime': latest.credito_uptime,
                            'credito_ticketing': latest.credito_ticketing,
                            'giorni_scadenza': giorni_scadenza
                        })
                    except ValueError:
                        pass
        
        elif prodotto == 'CutAI':
            contracts = CutAIContract.query.filter_by(tenant_id=tenant_id, status='ACTIVE').all()
            for c in contracts:
                if c.versions:
                    latest = c.versions[0]
                    try:
                        data_firma = datetime.strptime(latest.data_sottoscrizione, '%d/%m/%Y')
                        scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                        giorni_scadenza = (scadenza - today).days
                        
                        historical.append({
                            'cliente': c.cliente_ragione_sociale,
                            'canone_trim': latest.canone_base_trimestrale,
                            'durata_mesi': latest.durata_mesi,
                            'preavviso_gg': latest.preavviso_giorni,
                            'tetto_cred': latest.tetto_crediti,
                            'credito_uptime': latest.credito_uptime,
                            'credito_ticketing': latest.credito_ticketing,
                            'giorni_scadenza': giorni_scadenza
                        })
                    except ValueError:
                        pass
        
        # Run AI analysis
        analysis = analyze_pre_sign(contract_data, historical)
        
        return jsonify({
            "status": "success",
            "data": analysis
        }), 200
        
    except Exception as e:
        print(f"❌ Errore analisi pre-firma: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# 9. RISK ANALYSIS (POST)
# ==========================================
@contracts_bp.route('/risk-analysis', methods=['POST'])
def risk_analysis():
    """Analizza rischio contratto: risk score, punti critici, errori ortografici."""
    from service.ai_service import analyze_contract_risk
    
    data = request.get_json()
    contract_data = data.get('contract_data')
    testo_originale = data.get('testo_originale', '')
    
    if not contract_data:
        return jsonify({"status": "error", "message": "Dati contratto mancanti"}), 400
    
    try:
        result = analyze_contract_risk(contract_data, testo_originale)
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        print(f"❌ Errore risk analysis: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# 10. IMPROVE CLAUSE (POST)
# ==========================================
@contracts_bp.route('/improve-clause', methods=['POST'])
def improve_clause():
    """AI riscrive una clausola critica con termini migliori."""
    from service.ai_service import improve_contract_clause
    
    data = request.get_json()
    clausola_originale = data.get('clausola_originale', '')
    tipo_problema = data.get('tipo_problema', '')
    contesto = data.get('contesto_contratto', '')
    valore_rif = data.get('valore_riferimento', '')
    
    if not clausola_originale:
        return jsonify({"status": "error", "message": "Clausola originale mancante"}), 400
    
    try:
        result = improve_contract_clause(clausola_originale, tipo_problema, contesto, valore_rif)
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        print(f"❌ Errore improve clause: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# 11. RECALCULATE RISK (POST)
# ==========================================
@contracts_bp.route('/recalculate-risk', methods=['POST'])
def recalculate_risk():
    """Ricalcola risk score con le modifiche applicate."""
    from service.ai_service import analyze_contract_risk
    
    data = request.get_json()
    contract_data = data.get('contract_data')
    
    if not contract_data:
        return jsonify({"status": "error", "message": "Dati contratto mancanti"}), 400
    
    try:
        result = analyze_contract_risk(contract_data, '')
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# 12. DOWNLOAD MODIFIED CONTRACT PDF (POST)
# ==========================================
@contracts_bp.route('/download-modified-pdf', methods=['POST'])
def download_modified_pdf():
    """Genera un PDF con il contratto originale e le sezioni modificate evidenziate."""
    from io import BytesIO
    from flask import send_file
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.units import mm
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    
    data = request.get_json()
    contract_data = data.get('contract_data', {})
    original_risk = data.get('original_risk', {})
    modifications = data.get('modifications', {})
    new_risk_score = data.get('new_risk_score', 0)
    
    ana = contract_data.get('anagrafica', {})
    det = contract_data.get('dettagli_contratto', {})
    sla = contract_data.get('sla', {})
    prodotto = contract_data.get('prodotto', 'N/A')
    
    if 'freader' in prodotto.lower():
        comm = contract_data.get('commerciale_freader', {})
        canone_label = 'Canone Trimestrale'
        canone_val = comm.get('canone_trimestrale', 'N/A')
    else:
        comm = contract_data.get('commerciale_cutai', {})
        canone_label = 'Canone Base Trimestrale'
        canone_val = comm.get('canone_base_trimestrale', 'N/A')
    
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Title2', parent=styles['Title'], fontSize=18, textColor=HexColor('#1E293B'), spaceAfter=6))
    styles.add(ParagraphStyle(name='SectionHead', parent=styles['Heading2'], fontSize=13, textColor=HexColor('#4F46E5'), spaceBefore=14, spaceAfter=6))
    styles.add(ParagraphStyle(name='Field', parent=styles['Normal'], fontSize=10, leading=14))
    styles.add(ParagraphStyle(name='FieldLabel', parent=styles['Normal'], fontSize=9, textColor=HexColor('#64748B'), leading=12))
    styles.add(ParagraphStyle(name='Modified', parent=styles['Normal'], fontSize=10, leading=14, backColor=HexColor('#ECFDF5'), borderColor=HexColor('#059669'), borderWidth=1, borderPadding=6))
    styles.add(ParagraphStyle(name='Original', parent=styles['Normal'], fontSize=10, leading=14, backColor=HexColor('#FEF2F2'), textColor=HexColor('#94A3B8')))
    styles.add(ParagraphStyle(name='SmallNote', parent=styles['Normal'], fontSize=8, textColor=HexColor('#94A3B8'), alignment=TA_CENTER))
    
    elements = []
    
    # Header
    elements.append(Paragraph('FOCO — Contract Intelligence', styles['SmallNote']))
    elements.append(Spacer(1, 4*mm))
    elements.append(Paragraph(f'Contratto: {ana.get("cliente_ragione_sociale", "N/A")}', styles['Title2']))
    elements.append(Paragraph(f'Prodotto: {prodotto} | Data: {det.get("data_firma", "N/A")}', styles['Field']))
    elements.append(Spacer(1, 2*mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=HexColor('#E2E8F0')))
    elements.append(Spacer(1, 4*mm))
    
    # Risk score comparison
    orig_score = original_risk.get('risk_score', 0)
    score_color = '#059669' if new_risk_score < orig_score else '#DC2626'
    elements.append(Paragraph('Risk Score', styles['SectionHead']))
    score_data = [
        ['Prima', 'Dopo', 'Delta'],
        [f'{orig_score}%', f'{new_risk_score}%', f'{new_risk_score - orig_score:+d}%']
    ]
    score_table = Table(score_data, colWidths=[60*mm, 60*mm, 40*mm])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#F1F5F9')),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#E2E8F0')),
        ('TEXTCOLOR', (2, 1), (2, 1), HexColor(score_color)),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 6*mm))
    
    # Anagrafica
    elements.append(Paragraph('Anagrafica', styles['SectionHead']))
    elements.append(Paragraph(f'<b>Ragione Sociale:</b> {ana.get("cliente_ragione_sociale", "N/A")}', styles['Field']))
    elements.append(Paragraph(f'<b>Sede Legale:</b> {ana.get("cliente_sede_legale", "N/A")}', styles['Field']))
    elements.append(Spacer(1, 3*mm))
    
    # Dettagli contratto
    elements.append(Paragraph('Dettagli Contratto', styles['SectionHead']))
    elements.append(Paragraph(f'<b>Data Firma:</b> {det.get("data_firma", "N/A")}', styles['Field']))
    elements.append(Paragraph(f'<b>Durata:</b> {det.get("durata_mesi", "N/A")} mesi', styles['Field']))
    elements.append(Paragraph(f'<b>Preavviso:</b> {det.get("preavviso_giorni", "N/A")} giorni', styles['Field']))
    elements.append(Spacer(1, 3*mm))
    
    # Commerciale
    elements.append(Paragraph('Condizioni Commerciali', styles['SectionHead']))
    elements.append(Paragraph(f'<b>{canone_label}:</b> €{canone_val}', styles['Field']))
    if 'freader' in prodotto.lower():
        elements.append(Paragraph(f'<b>Fascia 1:</b> {comm.get("prezzo_fascia_1", "N/A")} cent', styles['Field']))
        elements.append(Paragraph(f'<b>Fascia 2:</b> {comm.get("prezzo_fascia_2", "N/A")} cent', styles['Field']))
        elements.append(Paragraph(f'<b>Fascia 3:</b> {comm.get("prezzo_fascia_3", "N/A")} cent', styles['Field']))
    else:
        elements.append(Paragraph(f'<b>Profilo:</b> {comm.get("profilo_commerciale", "N/A")}', styles['Field']))
        elements.append(Paragraph(f'<b>Utenti Inclusi:</b> {comm.get("soglia_utenti_inclusi", "N/A")}', styles['Field']))
        elements.append(Paragraph(f'<b>Fee Extra:</b> €{comm.get("fee_utente_extra", "N/A")}', styles['Field']))
    elements.append(Spacer(1, 3*mm))
    
    # SLA
    elements.append(Paragraph('SLA', styles['SectionHead']))
    elements.append(Paragraph(f'<b>Credito Uptime:</b> {sla.get("credito_uptime", "N/A")}%', styles['Field']))
    elements.append(Paragraph(f'<b>Credito Ticketing:</b> {sla.get("credito_ticketing", "N/A")}%', styles['Field']))
    elements.append(Paragraph(f'<b>Tetto Crediti:</b> {sla.get("tetto_crediti", "N/A")}%', styles['Field']))
    elements.append(Spacer(1, 6*mm))
    
    # Modifications section
    punti = original_risk.get('punti_critici', [])
    modified_ids = set(modifications.keys()) if modifications else set()
    
    if modified_ids:
        elements.append(HRFlowable(width="100%", thickness=2, color=HexColor('#4F46E5')))
        elements.append(Spacer(1, 4*mm))
        elements.append(Paragraph('Clausole Modificate', styles['SectionHead']))
        elements.append(Spacer(1, 2*mm))
        
        for p in punti:
            if p.get('id') not in modified_ids:
                continue
            mod = modifications[p['id']]
            
            elements.append(Paragraph(f'<b>{p.get("sezione", "")}</b> — Gravità: {p.get("gravita", "").upper()}', styles['Field']))
            elements.append(Spacer(1, 2*mm))
            
            # Original (strikethrough style)
            elements.append(Paragraph(f'<b>ORIGINALE:</b>', styles['FieldLabel']))
            elements.append(Paragraph(f'<strike>{p.get("testo_contratto_originale", "")}</strike>', styles['Original']))
            elements.append(Spacer(1, 2*mm))
            
            # Modified (green highlight)
            elements.append(Paragraph(f'<b>MODIFICATO:</b>', styles['FieldLabel']))
            elements.append(Paragraph(mod.get('testo_migliorato', ''), styles['Modified']))
            
            if mod.get('motivazione'):
                elements.append(Spacer(1, 1*mm))
                elements.append(Paragraph(f'<i>Motivazione: {mod["motivazione"]}</i>', styles['FieldLabel']))
            
            elements.append(Spacer(1, 5*mm))
    
    # Unmodified critical points
    unmodified = [p for p in punti if p.get('id') not in modified_ids]
    if unmodified:
        elements.append(HRFlowable(width="100%", thickness=1, color=HexColor('#E2E8F0')))
        elements.append(Spacer(1, 4*mm))
        elements.append(Paragraph('Punti Critici Non Modificati', styles['SectionHead']))
        for p in unmodified:
            elements.append(Paragraph(f'• <b>[{p.get("gravita", "").upper()}]</b> {p.get("sezione", "")}: {p.get("spiegazione", "")}', styles['Field']))
            elements.append(Spacer(1, 2*mm))
    
    # Footer
    elements.append(Spacer(1, 10*mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor('#CBD5E1')))
    elements.append(Paragraph(f'Generato da FOCO Contract Intelligence — {datetime.now().strftime("%d/%m/%Y %H:%M")}', styles['SmallNote']))
    
    doc.build(elements)
    buf.seek(0)
    
    filename = f'contratto_modificato_{ana.get("cliente_ragione_sociale", "contratto").replace(" ", "_")}.pdf'
    return send_file(buf, mimetype='application/pdf', as_attachment=True, download_name=filename)
