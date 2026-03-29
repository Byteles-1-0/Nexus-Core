from flask import Blueprint, jsonify

dashboard_bp = Blueprint('dashboard', __name__)

# ==========================================
# 1. KPI Dashboard
# ==========================================
@dashboard_bp.route('/kpi', methods=['GET'])
def get_kpi():
    from datetime import datetime, timedelta
    from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
    
    today = datetime.now()
    
    # Freader contracts
    freader_contracts = FreaderContract.query.all()
    freader_active = FreaderContract.query.filter_by(status='ACTIVE').all()
    
    fatturato_freader = 0
    freader_expiring_90 = 0
    
    for contract in freader_active:
        if contract.versions:
            latest = contract.versions[0]
            # Fatturato annuo = canone_trimestrale * 4
            fatturato_freader += latest.canone_trimestrale * 4
            
            # Check if expiring in 90 days
            try:
                data_firma = datetime.strptime(latest.data_firma, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                if 0 <= giorni_scadenza <= 90:
                    freader_expiring_90 += 1
            except ValueError:
                pass
    
    # CutAI contracts
    cutai_contracts = CutAIContract.query.all()
    cutai_active = CutAIContract.query.filter_by(status='ACTIVE').all()
    
    fatturato_cutai = 0
    cutai_expiring_90 = 0
    
    for contract in cutai_active:
        if contract.versions:
            latest = contract.versions[0]
            # Fatturato annuo = canone_base_trimestrale * 4
            fatturato_cutai += latest.canone_base_trimestrale * 4
            
            # Check if expiring in 90 days
            try:
                data_firma = datetime.strptime(latest.data_sottoscrizione, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                if 0 <= giorni_scadenza <= 90:
                    cutai_expiring_90 += 1
            except ValueError:
                pass
    
    # Totals
    fatturato_totale = fatturato_freader + fatturato_cutai
    attivi = len(freader_active) + len(cutai_active)
    totale_contratti = len(freader_contracts) + len(cutai_contracts)
    in_scadenza_90 = freader_expiring_90 + cutai_expiring_90
    
    # Percentages
    fatt_pct_freader = round((fatturato_freader / fatturato_totale * 100) if fatturato_totale > 0 else 0, 1)
    fatt_pct_cutai = round((fatturato_cutai / fatturato_totale * 100) if fatturato_totale > 0 else 0, 1)
    
    # Costi (from analisi_costi_azienda_saas2.md)
    costo_totale = 1789000
    freader_ratio = 0.855
    cutai_ratio = 0.145
    
    costo_freader = costo_totale * freader_ratio
    costo_cutai = costo_totale * cutai_ratio
    
    margine_freader = fatturato_freader - costo_freader
    margine_cutai = fatturato_cutai - costo_cutai
    margine_totale = fatturato_totale - costo_totale
    
    margine_pct = round((margine_totale / fatturato_totale * 100) if fatturato_totale > 0 else 0, 1)
    margine_pct_freader = round((margine_freader / fatturato_freader * 100) if fatturato_freader > 0 else 0, 1)
    margine_pct_cutai = round((margine_cutai / fatturato_cutai * 100) if fatturato_cutai > 0 else 0, 1)
    
    avg_fatturato = round(fatturato_totale / attivi) if attivi > 0 else 0
    
    # Mock growth rates (would need historical data)
    mom_growth = 2.5
    yoy_growth = 15.3
    mom_margine = 1.8
    
    return jsonify({
        "fatturato_totale": round(fatturato_totale, 2),
        "fatturato_freader": round(fatturato_freader, 2),
        "fatturato_cutai": round(fatturato_cutai, 2),
        "fatt_pct_freader": fatt_pct_freader,
        "fatt_pct_cutai": fatt_pct_cutai,
        "margine_totale": round(margine_totale, 2),
        "margine_pct": margine_pct,
        "margine_freader": round(margine_freader, 2),
        "margine_cutai": round(margine_cutai, 2),
        "margine_pct_freader": margine_pct_freader,
        "margine_pct_cutai": margine_pct_cutai,
        "mom_growth": mom_growth,
        "yoy_growth": yoy_growth,
        "mom_margine": mom_margine,
        "yoy_margine": 12.4,
        "mom_fatt_freader": 2.1,
        "yoy_fatt_freader": 14.8,
        "mom_fatt_cutai": 3.2,
        "yoy_fatt_cutai": 19.1,
        "attivi": attivi,
        "totale_contratti": totale_contratti,
        "attivi_freader": len(freader_active),
        "attivi_cutai": len(cutai_active),
        "contratti_freader": len(freader_contracts),
        "contratti_cutai": len(cutai_contracts),
        "mom_contratti": 1.5,
        "yoy_contratti": 10.0,
        "scaduti": 0,
        "in_scadenza_90": in_scadenza_90,
        "bep_contratti": 8,
        "bep_euro": 240000,
        "avg_fatturato": avg_fatturato
    }), 200

# ==========================================
# 2. Contratti
# ==========================================
@dashboard_bp.route('/contracts', methods=['GET'])
def get_contracts():
    from datetime import datetime, timedelta
    from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
    
    result = []
    today = datetime.now()
    
    # Freader contracts
    freader_contracts = FreaderContract.query.all()
    for contract in freader_contracts:
        if contract.versions:
            latest = contract.versions[0]
            
            try:
                data_firma = datetime.strptime(latest.data_firma, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                
                result.append({
                    "id": contract.id,
                    "cliente": contract.cliente_ragione_sociale,
                    "prodotto": "Freader",
                    "sede": contract.cliente_sede_legale,
                    "canone_trim": latest.canone_trimestrale,
                    "fatturato_annuo": latest.canone_trimestrale * 4,
                    "durata_mesi": latest.durata_mesi,
                    "data_firma": latest.data_firma,
                    "scadenza": scadenza.strftime('%Y-%m-%d'),
                    "giorni_scadenza": giorni_scadenza,
                    "preavviso_gg": latest.preavviso_giorni,
                    "credito_uptime": latest.credito_uptime,
                    "credito_ticketing": latest.credito_ticketing,
                    "tetto_cred": latest.tetto_crediti,
                    "prezzo_f1": latest.prezzo_fascia_1,
                    "prezzo_f2": latest.prezzo_fascia_2,
                    "prezzo_f3": latest.prezzo_fascia_3,
                    "profilo": "Standard",
                    "status": contract.status,
                    "versioni": len(contract.versions)
                })
            except ValueError:
                pass
    
    # CutAI contracts
    cutai_contracts = CutAIContract.query.all()
    for contract in cutai_contracts:
        if contract.versions:
            latest = contract.versions[0]
            
            try:
                data_firma = datetime.strptime(latest.data_sottoscrizione, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                
                result.append({
                    "id": contract.id,
                    "cliente": contract.cliente_ragione_sociale,
                    "prodotto": "CutAI",
                    "sede": contract.cliente_sede_legale,
                    "canone_trim": latest.canone_base_trimestrale,
                    "fatturato_annuo": latest.canone_base_trimestrale * 4,
                    "durata_mesi": latest.durata_mesi,
                    "data_firma": latest.data_sottoscrizione,
                    "scadenza": scadenza.strftime('%Y-%m-%d'),
                    "giorni_scadenza": giorni_scadenza,
                    "preavviso_gg": latest.preavviso_giorni,
                    "credito_uptime": latest.credito_uptime,
                    "credito_ticketing": latest.credito_ticketing,
                    "tetto_cred": latest.tetto_crediti,
                    "prezzo_f1": 0.0,
                    "prezzo_f2": 0.0,
                    "prezzo_f3": 0.0,
                    "profilo": latest.profilo_commerciale,
                    "status": contract.status,
                    "versioni": len(contract.versions)
                })
            except ValueError:
                pass
    
    return jsonify(result), 200

# ==========================================
# 3. Contratto Singolo
# ==========================================
@dashboard_bp.route('/contracts/<contract_id>', methods=['GET'])
def get_contract(contract_id):
    from datetime import datetime, timedelta
    from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
    
    today = datetime.now()
    
    # Try Freader first
    contract = FreaderContract.query.get(contract_id)
    if contract and contract.versions:
        latest = contract.versions[0]
        
        try:
            data_firma = datetime.strptime(latest.data_firma, '%d/%m/%Y')
            scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
            giorni_scadenza = (scadenza - today).days
            
            # Detect issues
            issues = []
            if latest.tetto_crediti > 15:
                issues.append({
                    "gravita": "alta",
                    "sezione": "SLA",
                    "desc": f"Tetto crediti al {latest.tetto_crediti}% (soglia consigliata: 15%)"
                })
            if latest.credito_uptime > 5:
                issues.append({
                    "gravita": "media",
                    "sezione": "SLA",
                    "desc": f"Credito uptime elevato: {latest.credito_uptime}%"
                })
            if latest.credito_ticketing > 5:
                issues.append({
                    "gravita": "media",
                    "sezione": "SLA",
                    "desc": f"Credito ticketing elevato: {latest.credito_ticketing}%"
                })
            if 0 <= giorni_scadenza <= latest.preavviso_giorni:
                issues.append({
                    "gravita": "alta",
                    "sezione": "Scadenza",
                    "desc": f"Contratto in scadenza tra {giorni_scadenza} giorni"
                })
            
            return jsonify({
                "contract": {
                    "id": contract.id,
                    "cliente": contract.cliente_ragione_sociale,
                    "prodotto": "Freader",
                    "sede": contract.cliente_sede_legale,
                    "canone_trim": latest.canone_trimestrale,
                    "fatturato_annuo": latest.canone_trimestrale * 4,
                    "durata_mesi": latest.durata_mesi,
                    "data_firma": latest.data_firma,
                    "scadenza": scadenza.strftime('%Y-%m-%d'),
                    "giorni_scadenza": giorni_scadenza,
                    "preavviso_gg": latest.preavviso_giorni,
                    "credito_uptime": latest.credito_uptime,
                    "credito_ticketing": latest.credito_ticketing,
                    "tetto_cred": latest.tetto_crediti,
                    "prezzo_f1": latest.prezzo_fascia_1,
                    "prezzo_f2": latest.prezzo_fascia_2,
                    "prezzo_f3": latest.prezzo_fascia_3,
                    "profilo": "Standard",
                    "status": contract.status
                },
                "issues": issues
            }), 200
        except ValueError:
            pass
    
    # Try CutAI
    contract = CutAIContract.query.get(contract_id)
    if contract and contract.versions:
        latest = contract.versions[0]
        
        try:
            data_firma = datetime.strptime(latest.data_sottoscrizione, '%d/%m/%Y')
            scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
            giorni_scadenza = (scadenza - today).days
            
            # Detect issues
            issues = []
            if latest.tetto_crediti > 15:
                issues.append({
                    "gravita": "alta",
                    "sezione": "SLA",
                    "desc": f"Tetto crediti al {latest.tetto_crediti}% (soglia consigliata: 15%)"
                })
            if latest.credito_uptime > 5:
                issues.append({
                    "gravita": "media",
                    "sezione": "SLA",
                    "desc": f"Credito uptime elevato: {latest.credito_uptime}%"
                })
            if latest.credito_ticketing > 5:
                issues.append({
                    "gravita": "media",
                    "sezione": "SLA",
                    "desc": f"Credito ticketing elevato: {latest.credito_ticketing}%"
                })
            if 0 <= giorni_scadenza <= latest.preavviso_giorni:
                issues.append({
                    "gravita": "alta",
                    "sezione": "Scadenza",
                    "desc": f"Contratto in scadenza tra {giorni_scadenza} giorni"
                })
            
            return jsonify({
                "contract": {
                    "id": contract.id,
                    "cliente": contract.cliente_ragione_sociale,
                    "prodotto": "CutAI",
                    "sede": contract.cliente_sede_legale,
                    "canone_trim": latest.canone_base_trimestrale,
                    "fatturato_annuo": latest.canone_base_trimestrale * 4,
                    "durata_mesi": latest.durata_mesi,
                    "data_firma": latest.data_sottoscrizione,
                    "scadenza": scadenza.strftime('%Y-%m-%d'),
                    "giorni_scadenza": giorni_scadenza,
                    "preavviso_gg": latest.preavviso_giorni,
                    "credito_uptime": latest.credito_uptime,
                    "credito_ticketing": latest.credito_ticketing,
                    "tetto_cred": latest.tetto_crediti,
                    "prezzo_f1": 0.0,
                    "prezzo_f2": 0.0,
                    "prezzo_f3": 0.0,
                    "profilo": latest.profilo_commerciale,
                    "status": contract.status
                },
                "issues": issues
            }), 200
        except ValueError:
            pass
    
    return jsonify({"error": "Contract not found"}), 404

# ==========================================
# 4. Contratti in Scadenza
# ==========================================
@dashboard_bp.route('/expiring', methods=['GET'])
def get_expiring():
    from datetime import datetime, timedelta
    from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
    
    result = []
    today = datetime.now()
    days_threshold = 90  # Contratti in scadenza nei prossimi 90 giorni
    
    # Freader contracts
    freader_contracts = FreaderContract.query.filter_by(status='ACTIVE').all()
    for contract in freader_contracts:
        if contract.versions:
            latest = contract.versions[0]
            # Parse data_firma (formato gg/mm/aaaa)
            try:
                data_firma = datetime.strptime(latest.data_firma, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                
                if 0 <= giorni_scadenza <= days_threshold:
                    result.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "Freader",
                        "scadenza": scadenza.strftime('%d/%m/%Y'),
                        "canone_trim": latest.canone_trimestrale,
                        "giorni_scadenza": giorni_scadenza
                    })
            except ValueError:
                pass
    
    # CutAI contracts
    cutai_contracts = CutAIContract.query.filter_by(status='ACTIVE').all()
    for contract in cutai_contracts:
        if contract.versions:
            latest = contract.versions[0]
            # Parse data_sottoscrizione (formato gg/mm/aaaa)
            try:
                data_firma = datetime.strptime(latest.data_sottoscrizione, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                
                if 0 <= giorni_scadenza <= days_threshold:
                    result.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "CutAI",
                        "scadenza": scadenza.strftime('%d/%m/%Y'),
                        "canone_trim": latest.canone_base_trimestrale,
                        "giorni_scadenza": giorni_scadenza
                    })
            except ValueError:
                pass
    
    # Sort by giorni_scadenza (ascending)
    result.sort(key=lambda x: x['giorni_scadenza'])
    
    return jsonify(result), 200

# ==========================================
# 5. Anomalie Pagamenti
# ==========================================
@dashboard_bp.route('/anomalies', methods=['GET'])
def get_anomalies():
    from datetime import datetime, timedelta
    from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
    
    anomalies = []
    today = datetime.now()
    
    # Freader contracts
    freader_contracts = FreaderContract.query.filter_by(status='ACTIVE').all()
    for contract in freader_contracts:
        if contract.versions:
            latest = contract.versions[0]
            
            try:
                data_firma = datetime.strptime(latest.data_firma, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                
                # Anomalia: Contratto scaduto
                if giorni_scadenza < 0:
                    anomalies.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "Freader",
                        "tipo": "contratto_scaduto",
                        "gravita": "alta",
                        "desc": f"Contratto scaduto da {abs(giorni_scadenza)} giorni",
                        "data_evento": scadenza.strftime('%Y-%m-%d')
                    })
                
                # Anomalia: In scadenza senza preavviso
                elif 0 <= giorni_scadenza <= latest.preavviso_giorni:
                    anomalies.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "Freader",
                        "tipo": "scadenza_imminente",
                        "gravita": "alta",
                        "desc": f"Scade tra {giorni_scadenza} giorni (preavviso {latest.preavviso_giorni}gg)",
                        "data_evento": scadenza.strftime('%Y-%m-%d')
                    })
                
                # Anomalia: Tetto crediti alto
                if latest.tetto_crediti > 15:
                    anomalies.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "Freader",
                        "tipo": "tetto_crediti_alto",
                        "gravita": "media",
                        "desc": f"Tetto crediti SLA al {latest.tetto_crediti}% (soglia consigliata: 15%)",
                        "data_evento": today.strftime('%Y-%m-%d')
                    })
                
                # Anomalia: Crediti SLA elevati
                if latest.credito_uptime > 5 or latest.credito_ticketing > 5:
                    anomalies.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "Freader",
                        "tipo": "crediti_sla_elevati",
                        "gravita": "media",
                        "desc": f"Crediti SLA: uptime {latest.credito_uptime}%, ticketing {latest.credito_ticketing}%",
                        "data_evento": today.strftime('%Y-%m-%d')
                    })
                
            except ValueError:
                pass
    
    # CutAI contracts
    cutai_contracts = CutAIContract.query.filter_by(status='ACTIVE').all()
    for contract in cutai_contracts:
        if contract.versions:
            latest = contract.versions[0]
            
            try:
                data_firma = datetime.strptime(latest.data_sottoscrizione, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                
                # Anomalia: Contratto scaduto
                if giorni_scadenza < 0:
                    anomalies.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "CutAI",
                        "tipo": "contratto_scaduto",
                        "gravita": "alta",
                        "desc": f"Contratto scaduto da {abs(giorni_scadenza)} giorni",
                        "data_evento": scadenza.strftime('%Y-%m-%d')
                    })
                
                # Anomalia: In scadenza senza preavviso
                elif 0 <= giorni_scadenza <= latest.preavviso_giorni:
                    anomalies.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "CutAI",
                        "tipo": "scadenza_imminente",
                        "gravita": "alta",
                        "desc": f"Scade tra {giorni_scadenza} giorni (preavviso {latest.preavviso_giorni}gg)",
                        "data_evento": scadenza.strftime('%Y-%m-%d')
                    })
                
                # Anomalia: Tetto crediti alto
                if latest.tetto_crediti > 15:
                    anomalies.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "CutAI",
                        "tipo": "tetto_crediti_alto",
                        "gravita": "media",
                        "desc": f"Tetto crediti SLA al {latest.tetto_crediti}% (soglia consigliata: 15%)",
                        "data_evento": today.strftime('%Y-%m-%d')
                    })
                
                # Anomalia: Crediti SLA elevati
                if latest.credito_uptime > 5 or latest.credito_ticketing > 5:
                    anomalies.append({
                        "cliente": contract.cliente_ragione_sociale,
                        "prodotto": "CutAI",
                        "tipo": "crediti_sla_elevati",
                        "gravita": "media",
                        "desc": f"Crediti SLA: uptime {latest.credito_uptime}%, ticketing {latest.credito_ticketing}%",
                        "data_evento": today.strftime('%Y-%m-%d')
                    })
                
            except ValueError:
                pass
    
    # Sort by gravita (alta first) then by data_evento
    anomalies.sort(key=lambda x: (0 if x['gravita'] == 'alta' else 1, x['data_evento']))
    
    return jsonify(anomalies), 200

# ==========================================
# 6. Dati Mappa Geografica
# ==========================================
@dashboard_bp.route('/map-data', methods=['GET'])
def get_map_data():
    from models import FreaderContract, CutAIContract
    
    # Aggregate contracts by location
    location_map = {}
    
    # Freader contracts
    for contract in FreaderContract.query.filter_by(status='ACTIVE').all():
        if contract.lat and contract.lng:
            key = f"{contract.lat},{contract.lng}"
            if key not in location_map:
                location_map[key] = {
                    "citta": contract.cliente_sede_legale,
                    "lat": contract.lat,
                    "lng": contract.lng,
                    "count": 0
                }
            location_map[key]["count"] += 1
    
    # CutAI contracts
    for contract in CutAIContract.query.filter_by(status='ACTIVE').all():
        if contract.lat and contract.lng:
            key = f"{contract.lat},{contract.lng}"
            if key not in location_map:
                location_map[key] = {
                    "citta": contract.cliente_sede_legale,
                    "lat": contract.lat,
                    "lng": contract.lng,
                    "count": 0
                }
            location_map[key]["count"] += 1
    
    result = list(location_map.values())
    return jsonify(result), 200

# ==========================================
# 7. Costi per Prodotto
# ==========================================
@dashboard_bp.route('/costs/<prodotto>', methods=['GET'])
def get_costs(prodotto):
    from models import FreaderContract, CutAIContract
    
    # Dati da analisi_costi_azienda_saas2.md
    # Costi totali annui per 40 clienti
    costo_personale = 862000
    costo_infrastruttura = 517000
    costo_sales_marketing = 250000
    costo_ga = 160000
    costo_totale_base = costo_personale + costo_infrastruttura + costo_sales_marketing + costo_ga  # 1.789.000€
    
    # Breakdown infrastruttura
    costo_cloud_fisso = 100000
    costo_inferenza_variabile = 387000
    costo_storage_variabile = 30000
    
    # Breakdown costi fissi vs variabili
    costi_fissi_base = costo_personale + costo_cloud_fisso + costo_sales_marketing + costo_ga  # 1.372.000€
    costi_variabili_base = costo_inferenza_variabile + costo_storage_variabile  # 417.000€
    
    # Breakdown costi diretti vs indiretti
    # Diretti: Personale tecnico (609k da tabella), Cloud fisso (100k), Inferenza (387k), Storage (30k)
    costi_diretti_base = 609000 + costo_cloud_fisso + costo_inferenza_variabile + costo_storage_variabile  # 1.126.000€
    # Indiretti: Management/Sales (253k da tabella), Marketing (250k), G&A (160k)
    costi_indiretti_base = 253000 + costo_sales_marketing + costo_ga  # 663.000€
    
    clienti_base = 40
    
    # Count real contracts
    freader_count = FreaderContract.query.filter_by(status='ACTIVE').count()
    cutai_count = CutAIContract.query.filter_by(status='ACTIVE').count()
    total_count = freader_count + cutai_count
    
    # Scale costs based on actual contracts
    if total_count > 0:
        scale_factor = total_count / clienti_base
    else:
        scale_factor = 0
    
    # Ripartizione per prodotto (85.5% Freader, 14.5% CutAI basata su ricavi)
    freader_ratio = 0.855
    cutai_ratio = 0.145

    if prodotto == 'prodotto1':
        # Freader
        molt = freader_ratio
    elif prodotto == 'prodotto2':
        # CutAI
        molt = cutai_ratio
    else:
        # Totale
        molt = 1.0
    
    costo_totale = costo_totale_base * scale_factor
    costo_prodotto = costo_totale * molt
    
    # Costo unitario per contratto
    if prodotto == 'prodotto1' and freader_count > 0:
        costo_unit = costo_prodotto / freader_count
    elif prodotto == 'prodotto2' and cutai_count > 0:
        costo_unit = costo_prodotto / cutai_count
    elif total_count > 0:
        costo_unit = costo_totale / total_count
    else:
        costo_unit = 0

    return jsonify({
        "tot_fissi": round(costi_fissi_base * scale_factor * molt, 2),
        "tot_variabili": round(costi_variabili_base * scale_factor * molt, 2),
        "tot_diretti": round(costi_diretti_base * scale_factor * molt, 2),
        "tot_indiretti": round(costi_indiretti_base * scale_factor * molt, 2),
        "costo_unit_trad": round(costo_unit, 2),
        "costo_prodotto_freader": round(costo_totale * freader_ratio, 2),
        "costo_prodotto_cutai": round(costo_totale * cutai_ratio, 2),
        "fissi": [
            {
                "voce": "Personale Tecnico (CTO, AI, Backend, CS)",
                "importo": round(609000 * scale_factor * molt, 2),
                "tipo": "diretto"
            },
            {
                "voce": "Personale Management & Sales",
                "importo": round(253000 * scale_factor * molt, 2),
                "tipo": "indiretto"
            },
            {
                "voce": "Infrastruttura Cloud Fissa & DB",
                "importo": round(costo_cloud_fisso * scale_factor * molt, 2),
                "tipo": "diretto"
            },
            {
                "voce": "Sales & Marketing",
                "importo": round(costo_sales_marketing * scale_factor * molt, 2),
                "tipo": "indiretto"
            },
            {
                "voce": "Spese Generali (G&A, Compliance, Tooling)",
                "importo": round(costo_ga * scale_factor * molt, 2),
                "tipo": "indiretto"
            }
        ],
        "variabili": [
            {
                "voce": "Inferenza AI (GPU)",
                "importo": round(costo_inferenza_variabile * scale_factor * molt, 2),
                "unita": "0.03 €/pagina",
                "tipo": "diretto"
            },
            {
                "voce": "Storage & Traffico Dati",
                "importo": round(costo_storage_variabile * scale_factor * molt, 2),
                "unita": "volume",
                "tipo": "diretto"
            }
        ]
    }), 200

# ==========================================
# 8. Top Clients
# ==========================================
@dashboard_bp.route('/top-clients', methods=['GET'])
def get_top_clients():
    from datetime import datetime, timedelta
    from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
    
    clients = []
    today = datetime.now()
    
    # Freader contracts
    freader_contracts = FreaderContract.query.filter_by(status='ACTIVE').all()
    for contract in freader_contracts:
        if contract.versions:
            latest = contract.versions[0]
            
            try:
                data_firma = datetime.strptime(latest.data_firma, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                
                # Calculate rating (0-100)
                # Factors: canone (40%), durata (20%), giorni_scadenza (20%), low SLA credits (20%)
                canone_score = min(latest.canone_trimestrale / 200, 40)  # Max 40 points
                durata_score = min(latest.durata_mesi / 36 * 20, 20)  # Max 20 points
                scadenza_score = min(max(giorni_scadenza, 0) / 365 * 20, 20)  # Max 20 points
                sla_score = max(20 - (latest.credito_uptime + latest.credito_ticketing), 0)  # Max 20 points
                
                rating = round(canone_score + durata_score + scadenza_score + sla_score)
                
                clients.append({
                    "cliente": contract.cliente_ragione_sociale,
                    "prodotto": "Freader",
                    "sede": contract.cliente_sede_legale,
                    "canone_trim": latest.canone_trimestrale,
                    "durata_mesi": latest.durata_mesi,
                    "rating": rating,
                    "credito_uptime": latest.credito_uptime,
                    "tetto_cred": latest.tetto_crediti,
                    "preavviso_gg": latest.preavviso_giorni,
                    "giorni_scadenza": max(giorni_scadenza, 0)
                })
            except ValueError:
                pass
    
    # CutAI contracts
    cutai_contracts = CutAIContract.query.filter_by(status='ACTIVE').all()
    for contract in cutai_contracts:
        if contract.versions:
            latest = contract.versions[0]
            
            try:
                data_firma = datetime.strptime(latest.data_sottoscrizione, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                
                # Calculate rating
                canone_score = min(latest.canone_base_trimestrale / 200, 40)
                durata_score = min(latest.durata_mesi / 36 * 20, 20)
                scadenza_score = min(max(giorni_scadenza, 0) / 365 * 20, 20)
                sla_score = max(20 - (latest.credito_uptime + latest.credito_ticketing), 0)
                
                rating = round(canone_score + durata_score + scadenza_score + sla_score)
                
                clients.append({
                    "cliente": contract.cliente_ragione_sociale,
                    "prodotto": "CutAI",
                    "sede": contract.cliente_sede_legale,
                    "canone_trim": latest.canone_base_trimestrale,
                    "durata_mesi": latest.durata_mesi,
                    "rating": rating,
                    "credito_uptime": latest.credito_uptime,
                    "tetto_cred": latest.tetto_crediti,
                    "preavviso_gg": latest.preavviso_giorni,
                    "giorni_scadenza": max(giorni_scadenza, 0)
                })
            except ValueError:
                pass
    
    # Sort by rating (descending)
    clients.sort(key=lambda x: x['rating'], reverse=True)
    
    # Add index
    for idx, client in enumerate(clients):
        client['index'] = idx
    
    return jsonify(clients), 200

# ==========================================
# 9. AI Advice
# ==========================================
@dashboard_bp.route('/ai-advice', methods=['GET'])
def get_ai_advice():
    from datetime import datetime, timedelta
    from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
    
    advice = []
    today = datetime.now()
    
    # Count contracts
    freader_count = FreaderContract.query.filter_by(status='ACTIVE').count()
    cutai_count = CutAIContract.query.filter_by(status='ACTIVE').count()
    total_count = freader_count + cutai_count
    
    if total_count == 0:
        return jsonify([]), 200
    
    # Calculate revenues
    freader_revenue = 0
    cutai_revenue = 0
    high_sla_count = 0
    expiring_soon = 0
    
    for contract in FreaderContract.query.filter_by(status='ACTIVE').all():
        if contract.versions:
            latest = contract.versions[0]
            freader_revenue += latest.canone_trimestrale * 4
            
            # Check high SLA credits
            if latest.tetto_crediti > 15:
                high_sla_count += 1
            
            # Check expiring soon
            try:
                data_firma = datetime.strptime(latest.data_firma, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                if 0 <= giorni_scadenza <= 90:
                    expiring_soon += 1
            except ValueError:
                pass
    
    for contract in CutAIContract.query.filter_by(status='ACTIVE').all():
        if contract.versions:
            latest = contract.versions[0]
            cutai_revenue += latest.canone_base_trimestrale * 4
            
            # Check high SLA credits
            if latest.tetto_crediti > 15:
                high_sla_count += 1
            
            # Check expiring soon
            try:
                data_firma = datetime.strptime(latest.data_sottoscrizione, '%d/%m/%Y')
                scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
                giorni_scadenza = (scadenza - today).days
                if 0 <= giorni_scadenza <= 90:
                    expiring_soon += 1
            except ValueError:
                pass
    
    total_revenue = freader_revenue + cutai_revenue
    
    # Advice 1: Diversification
    if total_revenue > 0:
        cutai_pct = (cutai_revenue / total_revenue) * 100
        if cutai_pct < 20:
            advice.append({
                "categoria": "Diversificazione",
                "priorita": "alta",
                "titolo": "Aumenta quota CutAI",
                "desc": f"CutAI rappresenta solo il {cutai_pct:.1f}% del fatturato. Concentrazione su Freader troppo alta.",
                "azione": "Acquisire 3-5 nuovi clienti CutAI nei prossimi 3 mesi"
            })
    
    # Advice 2: Expiring contracts
    if expiring_soon > 0:
        advice.append({
            "categoria": "Rinnovi",
            "priorita": "alta",
            "titolo": f"{expiring_soon} contratti in scadenza",
            "desc": f"Ci sono {expiring_soon} contratti che scadono nei prossimi 90 giorni.",
            "azione": "Avviare processo di rinnovo con anticipo per evitare churn"
        })
    
    # Advice 3: High SLA credits
    if high_sla_count > 0:
        advice.append({
            "categoria": "Ottimizzazione SLA",
            "priorita": "media",
            "titolo": f"{high_sla_count} contratti con tetto crediti alto",
            "desc": f"{high_sla_count} contratti hanno tetto crediti SLA > 15%, aumentando il rischio finanziario.",
            "azione": "Rinegoziare i tetti crediti al rinnovo per ridurre l'esposizione"
        })
    
    # Advice 4: Portfolio size
    if total_count < 30:
        advice.append({
            "categoria": "Crescita",
            "priorita": "media",
            "titolo": "Espandi il portfolio clienti",
            "desc": f"Con {total_count} clienti attivi, c'è margine per crescere verso i 40+ clienti.",
            "azione": "Investire in marketing B2B e partnership strategiche"
        })
    
    # Advice 5: Revenue concentration
    if freader_count > 0 and cutai_count > 0:
        avg_freader = freader_revenue / freader_count if freader_count > 0 else 0
        avg_cutai = cutai_revenue / cutai_count if cutai_count > 0 else 0
        
        if avg_freader > avg_cutai * 2:
            advice.append({
                "categoria": "Pricing",
                "priorita": "bassa",
                "titolo": "Rivedi pricing CutAI",
                "desc": f"Il valore medio per cliente Freader (€{avg_freader:.0f}) è molto superiore a CutAI (€{avg_cutai:.0f}).",
                "azione": "Valuta un aumento dei canoni CutAI o upselling di funzionalità premium"
            })
    
    return jsonify(advice), 200


# ==========================================
# 10. Simulatore Scenari
# ==========================================
@dashboard_bp.route('/simulate', methods=['POST'])
def simulate_scenario():
    from flask import request
    from datetime import datetime, timedelta
    from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
    
    data = request.get_json()
    scenario_type = data.get('type')  # 'increase_cutai', 'add_clients', 'custom'
    params = data.get('params', {})
    
    # Get current state
    freader_contracts = FreaderContract.query.filter_by(status='ACTIVE').all()
    cutai_contracts = CutAIContract.query.filter_by(status='ACTIVE').all()
    
    current_freader_revenue = sum(
        c.versions[0].canone_trimestrale * 4 
        for c in freader_contracts if c.versions
    )
    current_cutai_revenue = sum(
        c.versions[0].canone_base_trimestrale * 4 
        for c in cutai_contracts if c.versions
    )
    current_total = current_freader_revenue + current_cutai_revenue
    
    # Current costs (scaled)
    total_contracts = len(freader_contracts) + len(cutai_contracts)
    scale_factor = total_contracts / 40 if total_contracts > 0 else 0
    current_costs = 1789000 * scale_factor
    current_margin = current_total - current_costs
    current_margin_pct = (current_margin / current_total * 100) if current_total > 0 else 0
    
    # Simulate based on type
    if scenario_type == 'increase_cutai_pct':
        # Increase CutAI to target percentage
        target_pct = params.get('target_pct', 40)
        
        # Calculate needed CutAI revenue
        # If target is 40%, then CutAI = 40% and Freader = 60%
        # CutAI / (Freader + CutAI) = 0.4
        # CutAI = 0.4 * (Freader + CutAI)
        # CutAI = 0.4 * Freader + 0.4 * CutAI
        # 0.6 * CutAI = 0.4 * Freader
        # CutAI = (0.4 / 0.6) * Freader
        
        target_cutai_revenue = (target_pct / (100 - target_pct)) * current_freader_revenue
        delta_cutai = target_cutai_revenue - current_cutai_revenue
        
        # Estimate new clients needed (avg CutAI contract ~18k/year)
        avg_cutai_contract = current_cutai_revenue / len(cutai_contracts) if len(cutai_contracts) > 0 else 18000
        new_clients_needed = round(delta_cutai / avg_cutai_contract)
        
        # New totals
        new_total = current_freader_revenue + target_cutai_revenue
        new_contracts = total_contracts + new_clients_needed
        new_scale = new_contracts / 40
        new_costs = 1789000 * new_scale
        new_margin = new_total - new_costs
        new_margin_pct = (new_margin / new_total * 100) if new_total > 0 else 0
        
        # Timeline estimate (1 client per month)
        months_needed = new_clients_needed
        
        return jsonify({
            "status": "success",
            "scenario": {
                "type": "increase_cutai_pct",
                "description": f"Aumenta CutAI al {target_pct}%",
                "current": {
                    "freader_revenue": round(current_freader_revenue, 2),
                    "cutai_revenue": round(current_cutai_revenue, 2),
                    "total_revenue": round(current_total, 2),
                    "cutai_pct": round((current_cutai_revenue / current_total * 100) if current_total > 0 else 0, 1),
                    "costs": round(current_costs, 2),
                    "margin": round(current_margin, 2),
                    "margin_pct": round(current_margin_pct, 1),
                    "contracts": total_contracts
                },
                "simulated": {
                    "freader_revenue": round(current_freader_revenue, 2),
                    "cutai_revenue": round(target_cutai_revenue, 2),
                    "total_revenue": round(new_total, 2),
                    "cutai_pct": target_pct,
                    "costs": round(new_costs, 2),
                    "margin": round(new_margin, 2),
                    "margin_pct": round(new_margin_pct, 1),
                    "contracts": new_contracts
                },
                "delta": {
                    "revenue": round(new_total - current_total, 2),
                    "revenue_pct": round(((new_total - current_total) / current_total * 100) if current_total > 0 else 0, 1),
                    "margin": round(new_margin - current_margin, 2),
                    "margin_pct": round(new_margin_pct - current_margin_pct, 1),
                    "cutai_clients": new_clients_needed,
                    "months_estimate": months_needed
                },
                "actions": [
                    f"Acquisire {new_clients_needed} nuovi clienti CutAI",
                    f"Investire in marketing B2B per CutAI",
                    f"Timeline stimata: {months_needed} mesi (1 cliente/mese)"
                ]
            }
        }), 200
    
    elif scenario_type == 'add_clients':
        # Add N new clients to a product
        product = params.get('product', 'CutAI')
        num_clients = params.get('num_clients', 5)
        
        if product == 'CutAI':
            avg_revenue = current_cutai_revenue / len(cutai_contracts) if len(cutai_contracts) > 0 else 18000
            new_cutai_revenue = current_cutai_revenue + (avg_revenue * num_clients)
            new_freader_revenue = current_freader_revenue
        else:
            avg_revenue = current_freader_revenue / len(freader_contracts) if len(freader_contracts) > 0 else 50000
            new_freader_revenue = current_freader_revenue + (avg_revenue * num_clients)
            new_cutai_revenue = current_cutai_revenue
        
        new_total = new_freader_revenue + new_cutai_revenue
        new_contracts = total_contracts + num_clients
        new_scale = new_contracts / 40
        new_costs = 1789000 * new_scale
        new_margin = new_total - new_costs
        new_margin_pct = (new_margin / new_total * 100) if new_total > 0 else 0
        
        return jsonify({
            "status": "success",
            "scenario": {
                "type": "add_clients",
                "description": f"Aggiungi {num_clients} clienti {product}",
                "current": {
                    "freader_revenue": round(current_freader_revenue, 2),
                    "cutai_revenue": round(current_cutai_revenue, 2),
                    "total_revenue": round(current_total, 2),
                    "cutai_pct": round((current_cutai_revenue / current_total * 100) if current_total > 0 else 0, 1),
                    "costs": round(current_costs, 2),
                    "margin": round(current_margin, 2),
                    "margin_pct": round(current_margin_pct, 1),
                    "contracts": total_contracts
                },
                "simulated": {
                    "freader_revenue": round(new_freader_revenue, 2),
                    "cutai_revenue": round(new_cutai_revenue, 2),
                    "total_revenue": round(new_total, 2),
                    "cutai_pct": round((new_cutai_revenue / new_total * 100) if new_total > 0 else 0, 1),
                    "costs": round(new_costs, 2),
                    "margin": round(new_margin, 2),
                    "margin_pct": round(new_margin_pct, 1),
                    "contracts": new_contracts
                },
                "delta": {
                    "revenue": round(new_total - current_total, 2),
                    "revenue_pct": round(((new_total - current_total) / current_total * 100) if current_total > 0 else 0, 1),
                    "margin": round(new_margin - current_margin, 2),
                    "margin_pct": round(new_margin_pct - current_margin_pct, 1),
                    "new_clients": num_clients,
                    "months_estimate": num_clients
                },
                "actions": [
                    f"Acquisire {num_clients} nuovi clienti {product}",
                    f"Revenue incrementale: €{round((new_total - current_total) / 1000, 0)}k",
                    f"Timeline: ~{num_clients} mesi"
                ]
            }
        }), 200
    
    else:
        return jsonify({"status": "error", "message": "Tipo scenario non supportato"}), 400


# ==========================================
# 11. RE-PRICING
# ==========================================
@dashboard_bp.route('/repricing', methods=['GET'])
def get_repricing():
    """Contratti in scadenza entro 20 giorni con proposte di re-pricing."""
    from datetime import datetime, timedelta
    from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
    
    today = datetime.now()
    results = []
    
    # Collect all contracts with versions
    all_contracts_data = []
    
    freader_contracts = FreaderContract.query.filter_by(status='ACTIVE').all()
    for c in freader_contracts:
        if not c.versions:
            continue
        latest = c.versions[0]
        try:
            data_firma = datetime.strptime(latest.data_firma, '%d/%m/%Y')
            scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
            giorni_scadenza = (scadenza - today).days
            all_contracts_data.append({
                'id': c.id, 'cliente': c.cliente_ragione_sociale, 'prodotto': 'Freader',
                'canone_trim': latest.canone_trimestrale, 'durata_mesi': latest.durata_mesi,
                'preavviso_gg': latest.preavviso_giorni, 'tetto_cred': latest.tetto_crediti,
                'credito_uptime': latest.credito_uptime, 'credito_ticketing': latest.credito_ticketing,
                'giorni_scadenza': giorni_scadenza,
                'scadenza': scadenza.strftime('%d/%m/%Y')
            })
        except ValueError:
            pass
    
    cutai_contracts = CutAIContract.query.filter_by(status='ACTIVE').all()
    for c in cutai_contracts:
        if not c.versions:
            continue
        latest = c.versions[0]
        try:
            data_firma = datetime.strptime(latest.data_sottoscrizione, '%d/%m/%Y')
            scadenza = data_firma + timedelta(days=latest.durata_mesi * 30)
            giorni_scadenza = (scadenza - today).days
            all_contracts_data.append({
                'id': c.id, 'cliente': c.cliente_ragione_sociale, 'prodotto': 'CutAI',
                'canone_trim': latest.canone_base_trimestrale, 'durata_mesi': latest.durata_mesi,
                'preavviso_gg': latest.preavviso_giorni, 'tetto_cred': latest.tetto_crediti,
                'credito_uptime': latest.credito_uptime, 'credito_ticketing': latest.credito_ticketing,
                'giorni_scadenza': giorni_scadenza,
                'scadenza': scadenza.strftime('%d/%m/%Y')
            })
        except ValueError:
            pass
    
    # Calculate portfolio averages
    if all_contracts_data:
        avg_canone = sum(c['canone_trim'] for c in all_contracts_data) / len(all_contracts_data)
    else:
        avg_canone = 5000
    
    # Filter contracts expiring within 20 days
    expiring = [c for c in all_contracts_data if 0 < c['giorni_scadenza'] <= 20]
    expiring.sort(key=lambda x: x['giorni_scadenza'])
    
    for c in expiring:
        # ── Confidence index (0-100) based on contract-specific data ──
        # Each factor contributes independently based on actual values
        
        # Tetto crediti (weight 25): lower = more open client
        tetto_score = max(0, 25 - c['tetto_cred'] * 1.8)  # 10%→7, 5%→16, 15%→-2→0, 20%→-11→0
        
        # Credito uptime (weight 20): lower = more open
        uptime_score = max(0, 20 - c['credito_uptime'] * 2.5)  # 5%→7.5, 8%→0, 10%→-5→0
        
        # Credito ticketing (weight 15): lower = more open
        ticket_score = max(0, 15 - c['credito_ticketing'] * 2.0)  # 5%→5, 6%→3, 8%→-1→0
        
        # Preavviso (weight 20): longer = more stable client
        if c['preavviso_gg'] >= 90:
            preav_score = 20
        elif c['preavviso_gg'] >= 60:
            preav_score = 15
        elif c['preavviso_gg'] >= 30:
            preav_score = 8
        else:
            preav_score = 2
        
        # Durata (weight 20): longer = more committed
        if c['durata_mesi'] >= 36:
            durata_score = 20
        elif c['durata_mesi'] >= 24:
            durata_score = 14
        elif c['durata_mesi'] >= 12:
            durata_score = 8
        else:
            durata_score = 3
        
        confidence = min(100, max(0, round(tetto_score + uptime_score + ticket_score + preav_score + durata_score)))
        
        if confidence >= 65:
            label = 'alta'
        elif confidence >= 35:
            label = 'media'
        else:
            label = 'bassa'
        
        # ── Dynamic pricing percentages based on confidence + contract specifics ──
        canone = c['canone_trim']
        
        # Gap from portfolio average influences pricing aggressiveness
        gap_from_avg = (avg_canone - canone) / avg_canone if avg_canone > 0 else 0  # positive = under-priced
        gap_bonus = max(0, min(5, gap_from_avg * 15))  # 0-5% extra if under-priced
        
        # Urgency factor: fewer days = slightly less aggressive (less negotiation time)
        urgency_factor = 1.0 if c['giorni_scadenza'] >= 15 else 0.85
        
        # Calculate per-contract percentages
        if confidence >= 65:
            base_cons = 4 + gap_bonus * 0.3
            base_rec = 10 + gap_bonus * 0.8
            base_agg = 18 + gap_bonus
            prob_cons = min(95, 88 + confidence * 0.05)
            prob_rec = min(85, 68 + confidence * 0.1)
            prob_agg = min(65, 40 + confidence * 0.15)
        elif confidence >= 35:
            base_cons = 2 + gap_bonus * 0.2
            base_rec = 5 + gap_bonus * 0.5
            base_agg = 10 + gap_bonus * 0.7
            prob_cons = min(92, 82 + confidence * 0.08)
            prob_rec = min(75, 55 + confidence * 0.12)
            prob_agg = min(50, 28 + confidence * 0.15)
        else:
            base_cons = 1 + gap_bonus * 0.1
            base_rec = 2.5 + gap_bonus * 0.3
            base_agg = 5 + gap_bonus * 0.4
            prob_cons = min(96, 90 + confidence * 0.05)
            prob_rec = min(82, 72 + confidence * 0.1)
            prob_agg = min(60, 48 + confidence * 0.12)
        
        pcts = [
            round(base_cons * urgency_factor, 1),
            round(base_rec * urgency_factor, 1),
            round(base_agg * urgency_factor, 1)
        ]
        probs = [round(prob_cons), round(prob_rec), round(prob_agg)]
        
        proposte = []
        for fascia, pct, prob in zip(['conservativa', 'raccomandata', 'aggressiva'], pcts, probs):
            nuovo = round(canone * (1 + pct / 100), 2)
            proposte.append({
                'fascia': fascia,
                'percentuale': pct,
                'nuovo_canone': nuovo,
                'delta_revenue_annuo': round((nuovo - canone) * 4, 2),
                'probabilita_accettazione': prob
            })
        
        motivazioni = []
        if canone < avg_canone * 0.9:
            motivazioni.append(f"Canone sotto media portafoglio (€{avg_canone:,.0f}/trim)")
        if canone >= avg_canone * 1.1:
            motivazioni.append("Canone già sopra media — repricing moderato")
        motivazioni.append("Costi infrastruttura in aumento YoY")
        if c['tetto_cred'] <= 10:
            motivazioni.append(f"Basso tetto crediti ({c['tetto_cred']}%) — cliente aperto")
        elif c['tetto_cred'] > 12:
            motivazioni.append(f"Alto tetto crediti ({c['tetto_cred']}%) — cautela")
        if c['preavviso_gg'] >= 60:
            motivazioni.append(f"Preavviso lungo ({c['preavviso_gg']}gg) — cliente stabile")
        if c['credito_uptime'] > 7:
            motivazioni.append(f"Credito uptime elevato ({c['credito_uptime']}%) — clausola restrittiva")
        
        results.append({
            'contract_id': c['id'],
            'cliente': c['cliente'],
            'prodotto': c['prodotto'],
            'canone_attuale': canone,
            'giorni_scadenza': c['giorni_scadenza'],
            'scadenza': c['scadenza'],
            'indice_confidenza': confidence,
            'confidenza_label': label,
            'fattori_confidenza': {
                'tetto_crediti': {'valore': c['tetto_cred'], 'score': round(tetto_score / 25 * 100)},
                'credito_uptime': {'valore': c['credito_uptime'], 'score': round(uptime_score / 20 * 100)},
                'credito_ticketing': {'valore': c['credito_ticketing'], 'score': round(ticket_score / 15 * 100)},
                'preavviso': {'valore': c['preavviso_gg'], 'score': round(preav_score / 20 * 100)},
                'durata': {'valore': c['durata_mesi'], 'score': round(durata_score / 20 * 100)}
            },
            'proposte': proposte,
            'motivazioni': motivazioni,
            'revenue_a_rischio': round(canone * 4, 2)
        })
    
    return jsonify({"status": "success", "data": results}), 200
