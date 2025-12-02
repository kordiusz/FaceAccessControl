# app.py

# Service URL: https://access-api-301592490166.europe-central2.run.app

from flask import Flask, request, jsonify
import os
import datetime

app = Flask(__name__)

# --- Konfiguracja (na potrzeby GCP, na razie uproszczona) ---
# W realnym projekcie to będzie pobierane z Secret Manager
# Np. ZMIENNA_PROJEKTU_GCP = os.environ.get('GCP_PROJECT_ID')

@app.route('/')
def hello_world():
    """Endpoint powitalny."""
    return 'Witaj w API kontroli dostępu!\n'

@app.route('/check_access', methods=['POST'])
def check_access():
    """
    Endpoint symulujący sprawdzanie dostępu.
    Przyjmuje dane w JSON.
    """
    if not request.is_json:
        return jsonify({"error": "Brak danych JSON w żądaniu"}), 400

    data = request.get_json()
    
    # Symulacja odbioru danych wejściowych
    access_method = data.get('method', 'UNKNOWN') # np. 'FACE', 'QRCODE'
    image_data = data.get('image_base64', None) # Zakładamy, że obraz jest Base64
    qr_code_value = data.get('qr_code_value', None) # Jeśli metoda to QRCODE

    # --- Symulacja logiki dostępu (w przyszłości integracja z Cloud Vision / Firestore) ---
    print(f"[{datetime.datetime.now()}] Otrzymano żądanie dostępu metodą: {access_method}")

    access_granted = False
    message = "Dostęp zabroniony"
    status_code = 403

    if access_method == 'FACE' and image_data:
        # Tutaj byłaby integracja z Cloud Vision API / Twoją logiką ML
        # Dla uproszczenia: zawsze udzielamy dostępu z twarzą :)
        print("Symulacja analizy twarzy...")
        access_granted = True
        message = "Dostęp udzielony (symulacja twarzy)"
        status_code = 200
    elif access_method == 'QRCODE' and qr_code_value == "admin_pass":
        # Symulacja sprawdzenia QR Code
        print(f"Symulacja odczytu QR Code: {qr_code_value}")
        access_granted = True
        message = "Dostęp udzielony (symulacja QR Code)"
        status_code = 200
    elif access_method == 'QRCODE' and qr_code_value:
        message = "QR Code nieuprawniony"
        status_code = 403
    else:
        message = "Nieprawidłowe dane lub metoda dostępu"
        status_code = 400

    # Tutaj byłby zapis do Firestore (rejestr wejść)
    # print(f"Zapisuję do Firestore: metoda={access_method}, status={access_granted}")

    return jsonify({
        "status": "success" if access_granted else "failure",
        "message": message,
        "timestamp": datetime.datetime.now().isoformat()
    }), status_code

# Standardowe uruchamianie Flask w trybie deweloperskim
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))