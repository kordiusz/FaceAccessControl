from flask import Flask, send_file
import firebase_admin
from firebase_admin import credentials, firestore, auth
import face_recognition
from flask import request, jsonify
cred = credentials.Certificate("./private-key.json")
firebase_admin.initialize_app(cred)
import numpy as np
import cv2
import datetime
import os
import time
import hashlib
from flask_cors import CORS

db = firestore.client()

app = Flask(__name__)
CORS(app)

face_image = cv2.imread("./igor.png")
rgb_face = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
face_encodings = face_recognition.face_encodings(rgb_face)

#temp just for now
faces = {"aaabbbbcccdddd": {
    "name": "Igor",
    "encodings": face_encodings[0]
}}

def get_uid_from_request():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    try:
        token = auth_header.split("Bearer ")[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception:
        return None


@app.route('/intruder/<img>', methods=["GET"])
def getImage(img):
    uid = get_uid_from_request()
    if uid:
        return send_file(os.path.join("./images/",img))
    return "dont have permissions", 401


@app.route('/verifyimg', methods=["POST"])
def verifyWithImg():
    uid = request.form.get("uid")
    requestFaceImage = request.files["face"]
    timestamp = int (time.time()*1000)
    raw = f'{uid}_{timestamp}'
    hash_str = hashlib.sha256(raw.encode())
    filename = f'{hash_str.hexdigest()}.png'
    path = os.path.join("./images/",filename)
    requestFaceImage.save(path)

    image = face_recognition.load_image_file(requestFaceImage)
    requestEncodings = face_recognition.face_encodings(image)
    actualEncodings = faces["aaabbbbcccdddd"]["encodings"] # tmp
    similarity = face_recognition.face_distance(requestEncodings, actualEncodings)[0]
    match = similarity > 0.6
    print(f"similarity: {similarity}%")

    doc_ref = db.collection("logs").document()
    log = {
        "uid":uid,
        "time":datetime.datetime.now(tz=datetime.timezone.utc),
        "success": bool(match),
        "image": filename
    }
    doc_ref.create(log)

    return "ok",200

if __name__ == '__main__':
    app.run(debug=True)