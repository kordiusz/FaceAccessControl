import cv2
import face_recognition
import requests
import numpy as np
from io import BytesIO
from pyzbar import pyzbar
import threading
import time

# --- Configuration ---
URL = "http://localhost:5000/verifyimg"
FRAME_SKIP_FACE = 2  # Process every 2nd frame for face
FRAME_SKIP_QR = 5  # Process every 5th frame for QR (less frequent)
COUNTDOWN_SECONDS = 3  # Countdown duration after QR scan

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# State variables
qr_id = None
qr_detected_time = None  # Time when QR was detected
status_msg = "Scan QR Code to Start"
status_color = (100, 100, 100)
is_processing = False
frame_count = 0
full_size_frame = None  # Store full size frame for sending

def send_verification(uid, face_image):
    """Send verification request in background thread"""
    global status_msg, status_color, qr_id, is_processing
    
    try:
        # Encode full-size original image
        _, buffer = cv2.imencode(".png", face_image)
        image_bytes = BytesIO(buffer.tobytes())

        # Send POST request
        files = {"face": ("face.png", image_bytes, "image/png")}
        data = {"uid": uid}
        
        response = requests.post(URL, data=data, files=files, timeout=5)
        
        if response.status_code == 200:
            status_msg = "SUCCESS: Verified"
            status_color = (0, 255, 0)
        else:
            status_msg = f"DENIED: {response.status_code}"
            status_color = (0, 0, 255)
    except Exception as e:
        status_msg = f"ERROR: {str(e)[:30]}"
        status_color = (0, 0, 255)
    
    # Reset after a short delay to show result
    threading.Timer(2.0, reset_state).start()

def reset_state():
    """Reset to scan for next QR code"""
    global qr_id, qr_detected_time, is_processing, status_msg, status_color
    qr_id = None
    qr_detected_time = None
    is_processing = False
    status_msg = "Scan QR Code to Start"
    status_color = (100, 100, 100)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    
    # 1. QR Detection Phase (use pyzbar - much faster)
    if qr_id is None and not is_processing and (frame_count % FRAME_SKIP_QR == 0):
        # Convert to grayscale for faster QR detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect QR codes with pyzbar (faster than QReader)
        qr_codes = pyzbar.decode(gray)
        
        if qr_codes:
            qr_id = qr_codes[0].data.decode('utf-8')
            qr_detected_time = time.time()
            status_msg = f"ID: {qr_id} | Get Ready..."
            status_color = (255, 165, 0)
    
    # 1.5 Countdown Phase (show countdown after QR detection)
    elif qr_id is not None and qr_detected_time is not None and not is_processing:
        elapsed = time.time() - qr_detected_time
        remaining = COUNTDOWN_SECONDS - elapsed
        
        if remaining > 0:
            # Show countdown
            countdown = int(remaining) + 1
            status_msg = f"ID: {qr_id} | Get Ready: {countdown}s"
            status_color = (255, 165, 0)
        else:
            # Countdown finished, ready for face detection
            status_msg = f"ID: {qr_id} | Detecting Face..."
            status_color = (0, 255, 255)
    
    # 2. Face Detection & Sending Phase (only after countdown)
    if qr_id is not None and qr_detected_time is not None and not is_processing and (frame_count % FRAME_SKIP_FACE == 0):
        elapsed = time.time() - qr_detected_time
        
        # Only detect face after countdown
        if elapsed >= COUNTDOWN_SECONDS:
            # Use small frame ONLY for detection
            small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
            rgb_small = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            
            # Use faster HOG model for detection
            face_locations = face_recognition.face_locations(rgb_small, model="hog")
            
            if face_locations:
                # Send verification with FULL-SIZE ORIGINAL frame
                is_processing = True
                status_msg = "Processing..."
                status_color = (255, 255, 0)
                
                # Start verification in background thread with original full frame
                thread = threading.Thread(target=send_verification, args=(qr_id, frame.copy()))
                thread.daemon = True
                thread.start()

    # UI: Draw Status Bar
    cv2.rectangle(frame, (0, frame.shape[0]-40), (frame.shape[1], frame.shape[0]), status_color, -1)
    cv2.putText(frame, status_msg, (10, frame.shape[0]-15), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    cv2.imshow('QR & Face Recognition', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()