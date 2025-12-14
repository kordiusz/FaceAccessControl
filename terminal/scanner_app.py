import cv2
import face_recognition
import requests
import base64
from io import BytesIO
from qreader import QReader
#img = cv2.imread('./messi1.jpg')
#img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
#face_encodings = face_recognition.face_encodings(img_rgb)[0]

#img2 = cv2.imread('./messi2.jpg')
#img_rgb2 = cv2.cvtColor(img2, cv2.COLOR_BGR2RGB)

url ="http://127.0.0.1:5000/verify"

cap = cv2.VideoCapture(0)
qreader = QReader()
qr_data = ""


while True:
    ret,frame =cap.read()
    cv2.imshow('QR',frame)
    qr_data = qreader.detect_and_decode(image=frame)
    if(qr_data and qr_data[0]):
        break
    key = cv2.waitKey(1)
    if key==ord('q'):
        break


def sendToServer(uid, image_bytes):
    url = "http://localhost:5000/verifyimg"
    files = {"face": ("frame.png", BytesIO(image_bytes), "image/png")}
    data = {"uid": uid}
    response = requests.post(url, data=data, files=files)
    return response.text

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    cv2.imshow('FACE', frame)

    # Convert BGR -> RGB for face_recognition
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    encodings = face_recognition.face_encodings(frame_rgb)
    if encodings:
        # Encode frame to PNG bytes
        success, encoded_image = cv2.imencode(".png", frame)
        if not success:
            raise Exception("Failed to encode frame")
        image_bytes = encoded_image.tobytes()

        # Send to server
        print(sendToServer(qr_data[0], image_bytes))

        # Stop the loop after first detection
        break

    key = cv2.waitKey(1)
    if key == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()




