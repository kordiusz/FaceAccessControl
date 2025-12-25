from flask import Flask, send_file
import firebase_admin
from firebase_admin import credentials, firestore, auth
from google.cloud.firestore_v1 import FieldFilter
from firebase_admin.auth import EmailAlreadyExistsError
import face_recognition
from flask import request, jsonify
import numpy as np
import cv2
import datetime
import os
import time
import json
import hashlib
from cloudinary import uploader, utils as cloudinary_utils
import cloudinary
from flask_cors import CORS
from dotenv import load_dotenv


cred = credentials.Certificate("./private-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
app = Flask(__name__)
CORS(app)
load_dotenv()  # must be called before reading env vars

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)




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


@app.route('/users/<uid>/model', methods=["GET"])
def getModelFace(uid):
    presets = {
        "sm": (100, 100),
        "md": (300, 300),
        "lg": (600, 600),
    }
    w,h = presets[request.args.get("size", default="sm")]
    url,options = cloudinary.utils.cloudinary_url(f"user_{uid}/model", type="authenticated", sign_url=True, secure=True, width=w, height=h)
    return jsonify({"url":url}),200

@app.route('/intruder/<img>', methods=["GET"])
def getImage(img):
    uid = get_uid_from_request()
    if uid and isAdmin(uid):
        return send_file(os.path.join("./images/",img))
    return "dont have permissions", 403

def isAdmin(uid):
    docRef = db.collection("users").document(uid)
    snapshot = docRef.get()
    if not snapshot.exists:
        return False
    return snapshot.to_dict()["role"] == "admin"

@app.route("/users/delete/<uid>", methods=["DELETE"])
def deleteUser(uid):
    request_uid = get_uid_from_request()
    if request_uid and isAdmin(request_uid):
        userRef = db.document("users", uid)
        userRef.delete()
        query = db.collection("logs").where(filter=FieldFilter("uid","==", uid))
        batch = db.batch()
        for doc in query.stream():
            batch.delete(doc.reference)
        batch.commit()
        return "deleted succesfully.", 200
    return "dont have permissions - you are not admin", 403

@app.route("/users/add", methods=["POST"])
def addUser():
    uid = get_uid_from_request()
    if not uid:
        return "dont have permissions - not even user", 401
    if not isAdmin(uid):
        return "dont have permissions - you are not admin", 403
    
    data = json.loads(request.form.get("data"))
    name = data["name"]
    surname = data["surname"]
    email = data["email"]

    face = request.files["face"]

    if not face:
        return "image missing", 400
    try:
        user =auth.create_user(display_name=name+surname,email=email)
    except EmailAlreadyExistsError:
        return "email alredy in-use",409
    except Exception as ex:
        return ex, 400
    
    #upload to cloudinary
    #using "face" after face_recognition would somehow affect the face object and i cannot upload it anymore.
    #needs a fix in the future.
    upload_result = uploader.upload(face, type="authenticated", folder=f"user_{user.uid}", public_id="model")

    requestEncodings = face_recognition.face_encodings(face_recognition.load_image_file(face))
    if not requestEncodings or len(requestEncodings) > 1:
        return "bad photo", 409
    finalEncodings = requestEncodings[0]
 
    
    userRecord = {
        "uid":user.uid,
        "name":f'{name} {surname}',
        "email": email,
        "face":finalEncodings.tolist(),
        "role":"user",
        "picture": upload_result["public_id"]
    }

    doc_ref = db.collection("users").document(user.uid)
    doc_ref.create(userRecord)

    

    return userRecord,201

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
    distance = face_recognition.face_distance([actualEncodings], requestEncodings)
    if not distance or len(distance) > 1:
        return "not a face", 400
    print(f"distance: {distance}")
    match = distance[0] < 0.5
    doc_ref = db.collection("logs").document()
    log = {
        "uid":uid,
        "time":datetime.datetime.now(tz=datetime.timezone.utc),
        "success": bool(match),
        "image": filename,
        "name": userData["name"]
    }
    doc_ref.create(log)

    return "ok",200

if __name__ == '__main__':
    app.run(debug=True)