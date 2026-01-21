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
        "sm": (320, 240),
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

@app.route("/logs/face", methods=["POST"])
def accessAttemptFace():
    uid = get_uid_from_request()
    if uid and isAdmin(uid):
        id = request.json["public_id"]
        presets = {
            "sm": (100, 100),
            "md": (300, 300),
            "lg": (600, 600),
        }
        w,h = presets[request.args.get("size", default="lg")]
        url,options = cloudinary.utils.cloudinary_url(id, type="authenticated", sign_url=True, secure=True, width=w, height=h, resource_type="image")
        return jsonify({"url":url}),200

    return "dont have permissions", 403

def isAdmin(uid):
    docRef = db.collection("users").document(uid)
    snapshot = docRef.get()
    if not snapshot.exists:
        return False
    data = snapshot.to_dict()
    if "role" not in data:
        return False
    return snapshot.to_dict()["role"] == "admin"

@app.route("/users/delete/<uid>", methods=["DELETE"])
def deleteUser(uid):
    request_uid = get_uid_from_request()
    if request_uid and isAdmin(request_uid):
        userRef = db.document("users", uid)
        try:
            cloudinary.uploader.destroy(public_id=f"user_{uid}/model")
        except Exception as e:
            return 400, e
        userRef.delete()
        query = db.collection("logs").where(filter=FieldFilter("uid","==", uid))
        batch = db.batch()
        for doc in query.stream():
            cloudinary_id = doc.to_dict().get("image")
            try:
                cloudinary.uploader.destroy(public_id=cloudinary_id)
            except Exception as e:
                return 400, e
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
        #so this is the fix to comment above:
        uploader.destroy(public_id=upload_result["public_id"])
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

    upload_result = uploader.upload(requestFaceImage, type="authenticated", folder=f"user_{uid}")
    image = face_recognition.load_image_file(requestFaceImage)
    faces = face_recognition.face_encodings(image)
    if not faces or len(faces) == 0:
        return "not a face", 400
    requestEncodings = faces[0]

    userData = db.collection("users").document(uid).get().to_dict()
    if (bool(userData["innactive"])):
        return "account innactive", 403
    actualEncodings = np.array(userData["face"], dtype=np.float64)
    distance = face_recognition.face_distance([actualEncodings], requestEncodings)
    if not distance or len(distance) > 1:
        return "not a face", 400
    print(f"distance: {distance}")
    match = distance[0] < 0.4
    doc_ref = db.collection("logs").document()
    log = {
        "uid":uid,
        "time":datetime.datetime.now(tz=datetime.timezone.utc),
        "success": bool(match),
        "image": upload_result["public_id"],
        "name": userData["name"],
        "similarity": 1-distance[0],
    }
    doc_ref.create(log)

    if match:
        return "recognized!",200
    else:
        return "not recognized",400

if __name__ == '__main__':
    app.run(debug=True)