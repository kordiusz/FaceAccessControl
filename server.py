from flask import Flask
import firebase_admin
from firebase_admin import credentials, firestore
import face_recognition
from flask import request, jsonify
cred = credentials.Certificate("./private-key.json")
firebase_admin.initialize_app(cred)
import numpy as np
import cv2
db = firestore.client()

app = Flask(__name__)

face_image = cv2.imread("./igor.png")
rgb_face = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
face_encodings = face_recognition.face_encodings(rgb_face)

#temp just for now
faces = {"aaabbbbcccdddd": {
    "name": "Igor",
    "encodings": face_encodings[0]
}}

@app.route('/verify', methods=['POST'])
def verify():
    data =request.json
    uid = data['uid']
    encodings = np.array( data["encodings"], dtype='float32')
    similarity = face_recognition.face_distance([encodings], faces[uid]['encodings'])[0]
    match = similarity > 0.6
    print(f'match: {match}, {similarity}')
    if match:
        return f"Ok {faces[uid]['name']}"
    else:
        return "Nope"
    

@app.route('/tmp', methods=['POST'])
def home():
    #doc_ref = db.collection("people").document()
    #doc_ref.set(data)
    
    try:
        face_image = face_recognition.load_image_file(request.files['jan_kowalski.jpg'])
    except Exception as e:
        return jsonify({"error": f"Could not load image file: {str(e)}"}), 400

    face_encodings = face_recognition.face_encodings(face_image)
    if not face_encodings:
        return jsonify({"error": "No face found in the image."}), 400
    
    face_vector = face_encodings[0].tolist()  
    return jsonify({
        "status": "success",
        "vector_dimension": len(face_vector),
        "face_vector": face_vector
    })
if __name__ == '__main__':
    app.run(debug=True)