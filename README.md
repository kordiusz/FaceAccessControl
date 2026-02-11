# FaceVerify 

**FaceVerify** is a smart biometric access control system. It combines facial recognition and QR code scanning to provide a secure and seamless entry management experience. The project integrates a **Python-based** detection client with a **React** administrative dashboard and a **Flask** backend. Made for Inżynieria Oprogramowania during ICT bachelor's degree study course.

---

## Preview:



### Admin panel
<img width="1334" height="927" alt="image" src="https://github.com/user-attachments/assets/2d4b81e1-e203-4bc1-a01c-cc597dc1bf9f" />
<img width="1381" height="871" alt="image" src="https://github.com/user-attachments/assets/413c1327-9a87-423c-91f5-d5767b6842c5" />

### Client app
<img width="646" height="511" alt="image" src="https://github.com/user-attachments/assets/d58b1ae7-2e26-470d-83fd-f156b33221f8" />

---

##  Architecture

The system is divided into three main layers:

* **Client (Python):** Handles real-time video processing. It uses the `face_recognition` library to identify faces and `pyzbar` to decode QR codes.
* **Backend (Flask):** Orchestrates data flow, handles authentication logic, and manages image uploads to **Cloudinary**. Uses Firestore for data access.
* **Admin Panel (React + Firebase):** A modern dashboard built with **TypeScript** and **Tailwind CSS**. It uses **Firebase** for data queries and user data management.

---

##  Tech Stack

### Client-Side (Python)
* `face_recognition`: High-accuracy face detection and identification.
* `opencv-python`: Image processing and camera stream handling.
* `pyzbar`: QR code detection and decoding.
* `requests`: Communication with the Flask API.

### Backend & Cloud
* **Flask**: Lightweight web framework for the API.
* **Cloudinary**: Cloud storage for profile photos and access logs.
* **Firebase**: Database access and accounting.

### Admin Dashboard (Web)
* **React JS**: Modern UI components.
* **TypeScript**: Type-safe development.
* **Tailwind CSS**: Utility-first styling for a clean, responsive design.

---

##  Project Structure

```text
├── scanner/              # Python application for face & QR detection
├── server/             # Flask API and Cloudinary integration
└── frontend/         # React dashboard (TypeScript + Tailwind)
