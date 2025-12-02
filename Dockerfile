# Używamy oficjalnego obrazu Pythona jako bazy
FROM python:3.11-slim

# Ustawiamy katalog roboczy w kontenerze
WORKDIR /app

# Kopiujemy plik z zależnościami i instalujemy je
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy resztę kodu aplikacji do katalogu roboczego
COPY . .

# Flask nasłuchuje domyślnie na porcie 5000
# EXPOSE informuje Dockera, że aplikacja używa tego portu
EXPOSE 5000

# Uruchamiamy aplikację za pomocą Gunicorn (serwer produkcyjny dla Flask)
# Gunicorn jest lepszy niż wbudowany serwer Flask dla środowisk produkcyjnych
# -w 4: 4 procesy robocze
# -b 0.0.0.0:5000: nasłuchuj na wszystkich interfejsach na porcie 5000
# app:app: nazwa pliku (app.py) i instancja aplikacji Flask (app = Flask(__name__))
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]