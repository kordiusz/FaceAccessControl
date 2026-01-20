import { useEffect, useState } from "react";
import { UserData } from "../pages/LoginPage";
import { QRCodeCanvas } from "qrcode.react";
import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "../firebase-config";
import { Log, logConverter } from "../pages/BrowseLogsPage";


interface UserProps{
    user:UserData,
    onRemove: (uid:string) => Promise<void>
}

const UserRecord = ({user, onRemove}: UserProps)=>{

    const [showQr, setShowQr] = useState<boolean>();
    const [entries, setEntries] = useState<Array<Log> | undefined>();
    const [links, setLinks] = useState<Record<string,string>>({});
    const [imagesLoaded, setImagesLoaded] = useState<Record<string,boolean>>({});
    const [showEntries, setShowEntries] = useState<boolean>();
    const [showModel, setShowModel] =useState<boolean>(false);
    const [modelFaceUrl, setModelFaceUrl] = useState<string>();
    const [intruderImage, setIntruderImage] = useState();
    const [isLoading, setIsLoading] = useState(false);
    
    const toggleQr = ()=>{
        setShowQr(!showQr);
    }

    const showEntriesHandler = ()=>{

        if (showEntries){
            setShowEntries(false)
            return
        }

        const fetchEntries = async()=>{

        const q = query(collection(db, "logs").withConverter(logConverter), where("uid", "==", user.uid), limit(20));
        const snapshot = await getDocs(q);
        setEntries(snapshot.docs.map(x=>x.data()));
        setShowEntries(true)
        }
        fetchEntries();
    }



    const getModelFaceLink = (uid:string)=>{
        return `http://localhost:5000/users/${uid}/model`
    }

    const getLogAccessImage = (id:string)=>{
        return `http://localhost:5000/logs/face`;
    }
    
    useEffect(()=>{
        
        const fetchLinks = async ()=>{
            if (!entries)
                return
            const token= await auth.currentUser?.getIdToken();
            const records:Record<string,string> = {};   
            await Promise.all(entries.map(async e=>{

                await fetch(getLogAccessImage(e.image), {method:"POST", headers:{Authorization: "Bearer "+token, "Content-Type":"application/json"}, body: JSON.stringify({"public_id":e.image})}).then(res=> res.json()).then(data=>{                    
                    records[e.id] = data["url"];
                }).catch(err=>console.log(err));

            }));
            
            setLinks(records);
            console.log(records);
        }

        fetchLinks();
        
    },[entries])

    const deleteUserHandler = () => {
        if (isLoading) return;
        setIsLoading(true);
        onRemove(user.uid).then(_=> setIsLoading(false));
    };

    const showModelFaceHandler =()=>{
        if(!showModel){
            setIsLoading(true)
            fetch(getModelFaceLink(user.uid)).then(res=>res.json()).then(data=> 
                {
                    setModelFaceUrl(data["url"]);
                    setIsLoading(false);
                    setShowModel(true);
                });   
            return
        }
        setShowModel(false)
        
    }
    
    const handleImageLoad = (id: string) => {
        setImagesLoaded(prev => ({...prev, [id]: true}));
    };

    return (



        <>
        
        <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-900">
                  {user.name}
                  {user.role === 'admin' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </td>
            
            <td className="px-6 py-4">
              <div className="text-sm text-gray-700">{user.email}</div>
            </td>
            
            <td className="px-6 py-4">
              <div className="flex justify-center">
                <button
                  onClick={toggleQr}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                >
                  View QR
                </button>
              </div>
            </td>
            
            <td className="px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={showEntriesHandler}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  {showEntries ? 'Hide Logs' : 'Show Logs'}
                </button>
                
                <button
                  onClick={showModelFaceHandler}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  View Face
                </button>
                
                {user.role !== 'admin' && (
                  <button
                    onClick={deleteUserHandler}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                )}
                
                {isLoading && (
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                )}
              </div>
            </td>
        </tr>

        {/* QR Code Modal */}
        {showQr && (
          <tr>
            <td colSpan={4} className="p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={toggleQr}>
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">QR Code for {user.name}</h3>
                    <button
                      onClick={toggleQr}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-lg">
                    <QRCodeCanvas value={user.uid} size={200} />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">User ID: {user.uid}</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}

        {/* Model Face Modal */}
        {showModel && (
          <tr>
            <td colSpan={4} className="p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={showModelFaceHandler}>
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Model Face for {user.name}</h3>
                    <button
                      onClick={showModelFaceHandler}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                      <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : (
                    <div className="flex justify-center border border-gray-200 rounded-lg overflow-hidden">
                      <img src={modelFaceUrl} alt="Model face" className="w-auto h-auto max-w-full" />
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}

        {showEntries && entries && (
          <tr className="bg-gray-50 border-b border-gray-200">
            <td colSpan={4} className="px-6 py-4">
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">Log History:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entries.map((x) => (
                    <div key={x.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-xs text-gray-500">
                          {x.time.toLocaleString('en-US')}
                        </div>
                        <div>
                          {x.success ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✓ Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              ✗ Not Recognized
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded overflow-hidden bg-gray-100 relative min-h-[400px]">
                        {!imagesLoaded[x.id] && links[x.id] && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                        {links[x.id] && (
                          <img
                            src={links[x.id]}
                            alt="Access attempt"
                            className={`w-full h-auto transition-opacity duration-300 ${imagesLoaded[x.id] ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => handleImageLoad(x.id)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </td>
          </tr>
        )}
        </>
    )

}

export default UserRecord;