import React, { FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { UserData } from './LoginPage';

const EditUserPage = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [inactive, setInactive] = useState(false);
  
  // Model face
  const [modelFaceUrl, setModelFaceUrl] = useState<string | null>(null);
  const [newFaceImage, setNewFaceImage] = useState<File | null>(null);
  const [newFacePreview, setNewFacePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchModelFace();
  }, [uid]);

  const fetchUserData = async () => {
    if (!uid) return;
    
    setIsLoading(true);
    try {
      // TODO: Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        setName(userData.name || '');
        setEmail(userData.email || '');
        setRole(userData.role || 'user');
        setInactive(userData.inactive || false);
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModelFace = async () => {
    if (!uid) return;
    
    setIsLoadingImage(true);
    try {
      const response = await fetch(`http://localhost:5000/users/${uid}/model`);
      const data = await response.json();
      setModelFaceUrl(data.url);
    } catch (err) {
      console.error('Error fetching model face:', err);
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFaceImage(file);
      setNewFacePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (uid) await updateDoc(doc(db, 'users', uid), {innactive:inactive, email:email, role:role, name:name});

      // If there's a new face image, upload it
      if (newFaceImage) {
        const formData = new FormData();
        formData.append('face', newFaceImage);
        
        // TODO: Implement server call to update model face
        const faceResponse = await fetch(`http://localhost:5000/users/${uid}/update/face`, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer ' + token,
          },
          body: formData,
        });

        if (!faceResponse.ok) {
          throw new Error('Failed to update face model');
        }
      }

      setSuccess('User updated successfully');
      // Optionally redirect after success
      setTimeout(() => navigate('/users'), 1500);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update user information and permissions
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            
            {/* User ID (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={uid || ''}
                disabled
                className="w-full bg-gray-100 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-md cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">This field cannot be changed</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            {/* Model Face */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Face
              </label>
              
              {/* Current Model Face */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Current model face:</p>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden inline-block">
                  {isLoadingImage ? (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100">
                      <svg
                        className="animate-spin h-8 w-8 text-indigo-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  ) : modelFaceUrl ? (
                    <img
                      src={modelFaceUrl}
                      alt="Current model face"
                      className="w-48 h-48 object-cover"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100 text-gray-400">
                      No face model
                    </div>
                  )}
                </div>
              </div>

              {/* Upload New Face */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  Upload new model face (optional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100 file:cursor-pointer
                    cursor-pointer border border-gray-300 rounded-md"
                />
                
                {/* Preview New Face */}
                {newFacePreview && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">New face preview:</p>
                    <div className="border-2 border-indigo-200 rounded-lg overflow-hidden inline-block">
                      <img
                        src={newFacePreview}
                        alt="New face preview"
                        className="w-48 h-48 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>




            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-md bg-red-50 border border-red-200">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 rounded-md bg-green-50 border border-green-200">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? (
                  <span className="inline-flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserPage;