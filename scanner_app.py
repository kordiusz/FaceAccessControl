import cv2
import face_recognition
import requests
import base64
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

def sendToServer(uid, encodings):
    payload = {
        "uid":uid,
        "encodings":encodings.tolist(),
    }
    print(payload)
    x = requests.post(url,json=payload)
    return x.text

while True:
    ret,frame =cap.read()
    cv2.imshow('QR',frame)
    qr_data = qreader.detect_and_decode(image=frame)
    if(qr_data and qr_data[0]):
        break
    key = cv2.waitKey(1)
    if key==ord('q'):
        break


while True:
    ret,frame =cap.read()
    cv2.imshow('FACE',frame)
    

    encodings = face_recognition.face_encodings(frame)
    if encodings:
        face_locations = face_recognition.face_locations(frame)
        print(sendToServer(qr_data[0],encodings[0]))
        cap.release()
        cv2.destroyAllWindows()
        exit(0)

    key = cv2.waitKey(1)
    if key==ord('q'):
        break



