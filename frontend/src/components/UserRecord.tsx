import { useState } from "react";
import { UserData } from "../pages/LoginPage";
import { QRCodeCanvas } from "qrcode.react";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase-config";
import { Log, logConverter } from "../pages/BrowseLogsPage";


interface UserProps{
    user:UserData
}

const UserRecord = ({user}: UserProps)=>{

    const [showQr, setShowQr] = useState<boolean>();
    const [entries, setEntries] = useState<Array<Log> | undefined>();
    const [showEntries, setShowEntries] = useState<boolean>();
    const [intruderImage, setIntruderImage] = useState();
    const toggleQr = ()=>{
        setShowQr(!showQr);
    }

    const showEntriesHandler = ()=>{

        const fetchEntries = async()=>{

        const q = query(collection(db, "logs").withConverter(logConverter), where("uid", "==", user.uid), limit(20));
        const snapshot = await getDocs(q);
        setEntries(snapshot.docs.map(x=>x.data()));
        
        }
        fetchEntries();
    }

    const getIntruderImgLink = (id:string)=>{
        return "http://127.0.0.1:5000/intruder/"+id
    }
    return (
        <div>
            <label>{user.name}</label>
            {showQr && <QRCodeCanvas value={user.uid}/>}
            <button onClick={toggleQr}>{showQr? "Hide QR" : "Show QR"}</button>
            <button onClick={showEntriesHandler}>Entry log</button>
            {entries?.map(x=><div>
                <label>{x.time.toLocaleString("en-US")} - {x.success ? "ok" : "not recognized"}</label>
                {!x.success && <img width="300" height="400" src={getIntruderImgLink(x.image)}/>}
                
                </div>)}


        </div>
    )

}

export default UserRecord;