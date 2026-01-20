import { ChangeEvent, FormEvent, useState } from "react";
import { auth } from "../firebase-config";

const AddUserPage = ()=>{

    const [image, setImage] = useState<string | null>(null);    
    const [response, setResponse] = useState<string | null>(null);    
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
    setImage(URL.createObjectURL(file));
    }
    };

         
    
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const makeNewUser = async ()=>{
        const form = e.currentTarget;
        const data = new FormData(form);
        data.set("data", JSON.stringify({
          name: data.get("name"),
          surname: data.get("surname"),
          email: data.get("email")
        }));
        setIsLoading(true)
        setResponse(null)
        const token= await auth.currentUser?.getIdToken();
        fetch("http://127.0.0.1:5000/users/add", 
          {
            method:"POST",
            body:data, 
            headers:{Authorization: "Bearer "+token}
          }
        ).then(x=> {setResponseStatus(x.status); return x.text()}).then(x=> {setResponse(x);setIsLoading(false); console.log("loaded")});
      }

      makeNewUser();
    }
    
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
            <p className="mt-2 text-sm text-gray-600">
              Register a new user in the access control system
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <form className="p-6 space-y-6" onSubmit={handleSubmit}>
              
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="John"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="surname"
                  placeholder="Doe"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Face Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  name="face"
                  required
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100 file:cursor-pointer
                    cursor-pointer border border-gray-300 rounded-md"
                />

                {image && (
                  <div className="mt-4 flex justify-center">
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <img
                        src={image}
                        alt="Face preview"
                        className="h-48 w-48 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>

              {/* Response Message */}
              {response && (
                <div className={`p-4 rounded-md ${responseStatus === 201 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {responseStatus === 201 ? (
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${responseStatus === 201 ? 'text-green-800' : 'text-red-800'}`}>
                        {response}
                      </p>
                      <p className={`text-xs mt-1 ${responseStatus === 201 ? 'text-green-600' : 'text-red-600'}`}>
                        Status: {responseStatus}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
}

export default AddUserPage;