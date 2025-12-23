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
       

    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-4" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-semibold text-gray-800">Add a new user of the system:</h2>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="John"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="surname"
            placeholder="Doe"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="john@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

                <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
        Upload Image
        </label>
        <input
        type="file"
        accept="image/*"
        name="face"
        onChange={handleImageChange}
        className="block w-full text-sm text-gray-600
        file:mr-4 file:py-2 file:px-4
        file:rounded-lg file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100"
        />


        {image && (
        <img
        src={image}
        alt="Preview"
        className="mt-3 h-32 w-32 object-cover rounded-lg border"
        />
        )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-indigo-700 text-white py-2 rounded-lg hover:bg-indigo-800 transition`}
        >
          Submit
        </button>
        {isLoading &&<label className="font-semibold leading-relaxed">Loading...</label>}
        {response && <label className={`leading-relaxed ${responseStatus === 201 ? "text-lime-700" : "text-red-700"}`}>{responseStatus} - {response}</label>}

      </form>
    </div>
  );
}
export default AddUserPage;
