import cv2
import face_recognition
import requests
import numpy as np
from io import BytesIO
from qreader import QReader

# --- Configuration ---
LIMIT = 5
URL = "http://localhost:5000/verifyimg"

cap = cv2.VideoCapture(0)
qreader = QReader()

# State variables
qr_id = None
face_vectors = []
last_face_image = None
status_msg = "Scan QR Code to Start"
status_color = (100, 100, 100) 

while True:
    ret, frame = cap.read()
    if not ret: break

    # 1. QR Detection Phase
    if qr_id is None:
        decoded_data = qreader.detect_and_decode(image=frame)
        if decoded_data and decoded_data[0]:
            qr_id = decoded_data[0]
            status_msg = f"ID: {qr_id} | Detecting Face..."
            status_color = (255, 165, 0)
    
    # 2. Face Collection Phase
    else:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(rgb_frame)

        if encodings and len(face_vectors) < LIMIT:
            face_vectors.append(encodings[0])
            # Save the current frame as the representative image
            last_face_image = frame.copy() 
            status_msg = f"Collecting: {len(face_vectors)}/{LIMIT}"
            
            # Draw visual box
            face_locations = face_recognition.face_locations(rgb_frame)
            for (t, r, b, l) in face_locations:
                cv2.rectangle(frame, (l, t), (r, b), (0, 255, 0), 2)

        # 3. Processing & Sending
        elif len(face_vectors) >= LIMIT:
            # A. Calculate Mean Vector
            avg_vector = np.mean(face_vectors, axis=0).tolist()
            
            # B. Prepare Image Bytes
            _, buffer = cv2.imencode(".png", last_face_image)
            image_bytes = BytesIO(buffer.tobytes())

            # C. Multi-part Post (Sending Vector + Image)
            try:
                files = {"face": ("face.png", image_bytes, "image/png")}
                data = {
                    "uid": qr_id, 
                    "vector": str(avg_vector) # Sent as string to be parsed by server
                }
                
                response = requests.post(URL, data=data, files=files)
                
                if response.status_code == 200:
                    status_msg = "SUCCESS: Verified"
                    status_color = (0, 255, 0)
                else:
                    status_msg = f"DENIED: {response.status_code}"
                    status_color = (0, 0, 255)
            except Exception as e:
                status_msg = "SERVER UNREACHABLE"
                status_color = (0, 0, 255)
            
            # Reset for next scan
            qr_id = None
            face_vectors = []

    # UI: Draw Status Bar
    cv2.rectangle(frame, (0, frame.shape[0]-40), (frame.shape[1], frame.shape[0]), status_color, -1)
    cv2.putText(frame, status_msg, (10, frame.shape[0]-15), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    cv2.imshow('QR & Face Recognition', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()