# backend/app.py
import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Importa l'estensione e i modelli
from extensions import db
from models import Tenant
from api.contracts_routes import contracts_bp
from api.dashboard_routes import dashboard_bp

load_dotenv()

app = Flask(__name__)
CORS(app)  # Abilita CORS per tutte le rotte

# Usa __file__ per ottenere sempre il path corretto di app.py
basedir = os.path.abspath(os.path.dirname(__file__))

# 1. CREA LA CARTELLA 'instance' SE NON ESISTE
INSTANCE_FOLDER = os.path.join(basedir, 'instance')
os.makedirs(INSTANCE_FOLDER, exist_ok=True)

# 2. CONFIGURA IL DATABASE
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(INSTANCE_FOLDER, 'contracts.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 3. CREA LA CARTELLA 'uploads' SE NON ESISTE
UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# INIZIALIZZA L'ESTENSIONE CON L'APP
db.init_app(app)

# Setup iniziale DB
with app.app_context():
    db.create_all()
    if not Tenant.query.filter_by(id="tenant-test-123").first():
        db.session.add(Tenant(id="tenant-test-123", name="Acme Corp SaaS"))
        db.session.commit()

# Middleware Multi-Tenant GLOBALE
@app.before_request
def require_tenant_id():
    # Gestione richieste OPTIONS (preflight CORS)
    if request.method == 'OPTIONS':
        return
        
    # Escludiamo health e la rotta di download dei PDF (se il frontend scarica tramite tag <iframe> o <img> potrebbe non avere l'header)
    # NB: In produzione, il download PDF andrebbe protetto con un token via URL.
    if request.path.startswith('/health') or request.path.startswith('/api/v1/contracts/download/'):
        return
        
    tenant_id = request.headers.get('X-Tenant-ID')
    if not tenant_id:
        return jsonify({"status": "error", "code": 401, "message": "Autenticazione fallita: header X-Tenant-ID mancante"}), 401

# Registrazione delle rotte API
app.register_blueprint(contracts_bp, url_prefix='/api/v1/contracts')
app.register_blueprint(dashboard_bp, url_prefix='/api')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "success", "message": "API online e operative."}), 200

if __name__ == '__main__':
    # Modificato da 0.0.0.0 a 127.0.0.1
    app.run(debug=True, host='127.0.0.1', port=5001)