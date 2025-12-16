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
import json
import hashlib
from flask_cors import CORS

db = firestore.client()

app = Flask(__name__)
CORS(app)

face_image = cv2.imread("./igor.png")
rgb_face = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
face_encodings = face_recognition.face_encodings(rgb_face)

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
    if uid and isAdmin(uid):
        return send_file(os.path.join("./images/",img))
    return "dont have permissions", 401

def isAdmin(uid):
    docRef = db.collection("users").document(uid)
    snapshot = docRef.get()
    if not snapshot.exists:
        return False
    return snapshot.to_dict()["role"] == "admin"

@app.route("/users/add", methods=["POST"])
def addUser():
    uid = get_uid_from_request()
    if not uid:
        return "dont have permissions - not even user", 401
    if not isAdmin(uid):
        return "dont have permissions - you are not admin", 401
    
    data = json.loads(request.form.get("data"))
    name = data["name"]
    surname = data["surname"]
    email = data["email"]
    face = request.files["face"]
    requestEncodings = face_recognition.face_encodings(face_recognition.load_image_file(face))[0]

    user =auth.create_user(display_name=name+surname,email=email)
    userRecord = {
        "uid":user.uid,
        "name":f'{name} {surname}',
        "email": email,
        "face":requestEncodings.tolist(),
        "role":"user"
    }

    doc_ref = db.collection("users").document(user.uid)
    doc_ref.create(userRecord)

    return userRecord,200

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
    requestEncodings = face_recognition.face_encodings(image)[0]

    userData = db.collection("users").document(uid).get().to_dict()
    actualEncodings = np.array(userData["face"], dtype=np.float64)
    distance = face_recognition.face_distance([actualEncodings], requestEncodings)[0]
    match = distance < 0.45
    print(f"distance: {distance}")

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
    app.run(debug=False)