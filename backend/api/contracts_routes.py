from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
import os

from extensions import db
from models import FreaderContract, CutAIContract, FreaderContractVersion, CutAIContractVersion, DynamicContract, DynamicContractVersion
from service.db_service import save_contract_to_db, save_dynamic_contract_to_db
from service.ai_service import analyze_contract_text
from service.dynamic_ai_service import analyze_dynamic_contract
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

    # 2. Salvataggio temporaneo
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

        # 5. Ritorna il JSON all'utente per la verifica
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
# NUOVA ROTTA: ANALISI DINAMICA
# ==========================================
@contracts_bp.route('/upload-and-analyze-dynamic', methods=['POST'])
def upload_and_analyze_dynamic():
    """
    Endpoint per analizzare contratti con struttura sconosciuta.
    Usa l'AI per identificare automaticamente il tipo di documento e estrarre tutti i campi.
    """
    # 1. Verifica file
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "Nessun file fornito"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "Nome file vuoto"}), 400

    # 2. Salvataggio temporaneo
    filename = secure_filename(file.filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        # 3. Estrazione testo
        print(f"📄 Estrazione testo da {filename}...")
        text = parse_document(filepath)
        
        if not text or len(text.strip()) < 10:
            return jsonify({"status": "error", "message": "Impossibile estrarre testo dal documento"}), 422

        # 4. Analisi dinamica con LLM
        print(f"🧠 Analisi dinamica in corso...")
        analysis_result = analyze_dynamic_contract(text)

        # 5. Ritorna il JSON all'utente per la verifica
        return jsonify({
            "status": "success",
            "data": {
                "filename": filename,
                "analysis": analysis_result,
                "is_dynamic": True  # Flag per indicare che è un contratto dinamico
            }
        }), 200

    except Exception as e:
        print(f"❌ Errore durante l'analisi dinamica: {str(e)}")
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

    # Salvataggio sicuro del file
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


@contracts_bp.route('/analyze-dynamic', methods=['POST'])
def analyze_text_dynamic():
    """Endpoint per analizzare testo con approccio dinamico"""
    data = request.get_json()
    text = data.get('text')
    
    if not text:
        return jsonify({"status": "error", "message": "Testo mancante"}), 400

    try:
        struttura_json = analyze_dynamic_contract(text)
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
    is_dynamic = data.get('is_dynamic', False)

    if not extracted_data:
        return jsonify({"status": "error", "message": "Dati estratti mancanti"}), 400

    try:
        # Determina automaticamente se è dinamico controllando la struttura
        # Se ha 'metadata' e 'extracted_data' array, è dinamico
        if 'metadata' in extracted_data and isinstance(extracted_data.get('extracted_data'), list):
            is_dynamic = True
            print("🔍 Rilevato contratto dinamico dalla struttura")
        # Se ha 'prodotto' con valore diverso da Freader/CutAI, potrebbe essere dinamico
        elif 'prodotto' in extracted_data:
            prodotto = extracted_data.get('prodotto', '').lower()
            if 'freader' not in prodotto and 'cutai' not in prodotto:
                print(f"⚠️  Prodotto '{prodotto}' non riconosciuto, ma struttura standard")
                # Mantieni is_dynamic dal parametro
        
        # Salva con la funzione appropriata
        if is_dynamic:
            contract_id = save_dynamic_contract_to_db(tenant_id, extracted_data, created_by=user)
            print(f"✅ Contratto dinamico salvato: {contract_id}")
        else:
            contract_id = save_contract_to_db(tenant_id, extracted_data, created_by=user)
            print(f"✅ Contratto standard salvato: {contract_id}")
            
        return jsonify({"status": "success", "contract_id": contract_id, "is_dynamic": is_dynamic}), 201
    except Exception as e:
        print(f"❌ Errore salvataggio: {e}")
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
            "versioni": len(c.versions),
            "type": "static"
        })

    # Recuperiamo e uniformiamo i contratti CutAI
    cutai_contracts = CutAIContract.query.filter_by(tenant_id=tenant_id).all()
    for c in cutai_contracts:
        unified_list.append({
            "id": c.id,
            "prodotto": "CutAI",
            "cliente": c.cliente_ragione_sociale,
            "status": c.status,
            "versioni": len(c.versions),
            "type": "static"
        })

    # Recuperiamo i contratti dinamici
    dynamic_contracts = DynamicContract.query.filter_by(tenant_id=tenant_id).all()
    for c in dynamic_contracts:
        unified_list.append({
            "id": c.id,
            "prodotto": c.product_name,
            "cliente": c.cliente_ragione_sociale,
            "status": c.status,
            "versioni": len(c.versions),
            "type": "dynamic"
        })

    return jsonify({"status": "success", "data": unified_list}), 200

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
                "type": "static",
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
                "type": "static",
                "history": [{"version": v.version_number, "piano": v.profilo_commerciale, "canone": v.canone_base_trimestrale} for v in c_contract.versions]
            }
        }), 200

    # Cerchiamo nei contratti dinamici
    d_contract = DynamicContract.query.filter_by(id=contract_id, tenant_id=tenant_id).first()
    if d_contract:
        # Recupera l'ultima versione per i dettagli
        latest_version = d_contract.versions[0] if d_contract.versions else None
        
        return jsonify({
            "status": "success",
            "data": {
                "id": d_contract.id,
                "prodotto": d_contract.product_name,
                "cliente": d_contract.cliente_ragione_sociale,
                "sede": d_contract.cliente_sede_legale,
                "type": "dynamic",
                "document_type": latest_version.document_type if latest_version else None,
                "confidence_score": latest_version.confidence_score if latest_version else None,
                "extracted_data": latest_version.extracted_data if latest_version else [],
                "history": [
                    {
                        "version": v.version_number,
                        "document_type": v.document_type,
                        "confidence": v.confidence_score,
                        "fields_count": len(v.extracted_data) if v.extracted_data else 0
                    } for v in d_contract.versions
                ]
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
            data_firma=data.get('data_firma', last_version.data_firma),
            durata_mesi=data.get('durata_mesi', last_version.durata_mesi),
            preavviso_giorni=data.get('preavviso_giorni', last_version.preavviso_giorni),
            canone_trimestrale=data.get('canone_trimestrale', last_version.canone_trimestrale),
            prezzo_fascia_1=data.get('prezzo_fascia_1', last_version.prezzo_fascia_1),
            prezzo_fascia_2=data.get('prezzo_fascia_2', last_version.prezzo_fascia_2),
            prezzo_fascia_3=data.get('prezzo_fascia_3', last_version.prezzo_fascia_3),
            credito_uptime=data.get('credito_uptime', last_version.credito_uptime),
            credito_ticketing=data.get('credito_ticketing', last_version.credito_ticketing),
            tetto_crediti=data.get('tetto_crediti', last_version.tetto_crediti),
            created_by=data.get('user_id', 'System'),
            change_reason=data.get('change_reason', 'Rinegoziazione')
        )
        db.session.add(new_v)
        db.session.commit()
        return jsonify({"status": "success", "new_version": new_version_num}), 201

    # Analogamente puoi implementare l'if c_contract: per CutAI...
    
    return jsonify({"status": "error", "code": 404, "message": "Contratto non trovato."}), 404