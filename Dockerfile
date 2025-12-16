# Używamy oficjalnego obrazu Pythona jako bazy
FROM python:3.11

# Ustawiamy katalog roboczy w kontenerze
WORKDIR /app

# Instalujemy zależności systemowe potrzebne dla cv2 i face-recognition
RUN apt-get update && apt-get install -y \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

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
# server:app: nazwa pliku (server.py) i instancja aplikacji Flask (app = Flask(__name__))
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "server:app"]