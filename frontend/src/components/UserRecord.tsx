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

    return (



        <>
        
        <tr key={user.uid} className="odd:bg-gray-100 even:bg-white py-4 pl-3">

            
            

            <td className={user.role =="admin" ? "font-bold text-amber-700" : "font-normal"}> {user.name}</td>
            <td >{user.email}</td>
                       <td>
            <span className="text-center my-2 inline-block">
            {showQr && <QRCodeCanvas value={user.uid}/>}
            </span>
            </td>
            <td className="flex items-center space-x-2">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" onClick={toggleQr}>{showQr? "Hide QR" : "Show QR"}</button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" onClick={showEntriesHandler}>{showEntries ? "Hide logs" : "Show logs"}</button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" onClick={showModelFaceHandler}>{showModel ? "Hide face" : "Show face"}</button>
            {user.role != "admin" &&<button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={deleteUserHandler}>Delete</button>}

            {isLoading && <label>Loading...</label>}
            </td>
 
            
         

        </tr>
        {showModel &&
        <tr>
            <td>
                <div className="ml-2">
                <label className="font-medium">Model face:</label>
                <img src={modelFaceUrl}/>
                </div>
            </td>
        </tr>
        }
        <tr>
            {showEntries &&<td>
                
            <span className="font-medium">Log history:</span>
            <ul className="flex flex-col ml-4">
            { entries?.map(x=><li className="my-4">
                
                <label className="text-base font-semibold">{x.time.toLocaleString("en-US")} - {x.success ? <span className="text-green-700">pass</span> : <span className="text-red-700">not recognized</span>}</label>
                <img width="300" height="400" src={links[x.id]}/>
                
                </li>)}
                </ul>
            </td>}
        </tr>
        </>
    )

}

export default UserRecord;