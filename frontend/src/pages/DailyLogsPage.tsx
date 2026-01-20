import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { Log, logConverter } from './BrowseLogsPage';
import { UserData } from './LoginPage';

interface LogWithImage extends Log {
  imageUrl?: string;
  userName?: string;
}

const DailyLogsPage = () => {
  const [logs, setLogs] = useState<LogWithImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  const fetchUserName = async (uid: string): Promise<string> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        return userData.name || 'Unknown User';
      }
      return 'Unknown User';
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Unknown User';
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Parse selected date and create start/end timestamps
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      // Query logs for the selected day
      const q = query(
        collection(db, 'logs').withConverter(logConverter),
        where('time', '>=', startTimestamp),
        where('time', '<=', endTimestamp),
        orderBy('time', 'desc')
      );

      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map((doc) => doc.data());
      
      // Fetch user names for all logs
      const logsWithNames = await Promise.all(
        logsData.map(async (log) => ({
          ...log,
          userName: await fetchUserName(log.uid),
        }))
      );
      
      setLogs(logsWithNames);

      // Fetch images
      if (logsWithNames.length > 0) {
        await fetchLogImages(logsWithNames);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogImages = async (logsData: LogWithImage[]) => {
    const token = await auth.currentUser?.getIdToken();
    
    // Set all images to loading
    const loadingState: Record<string, boolean> = {};
    logsData.forEach(log => {
      loadingState[log.id] = true;
    });
    setLoadingImages(loadingState);

    // Fetch all images in parallel
    const records: Record<string, string> = {};
    await Promise.all(logsData.map(async (log) => {
      try {
        const response = await fetch('http://localhost:5000/logs/face', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public_id: log.image }),
        });
        const data = await response.json();
        records[log.id] = data.url;
      } catch (err) {
        console.error(`Error fetching image for log ${log.id}:`, err);
      }
    }));

    // Update all logs with their image URLs at once
    setLogs((prevLogs) =>
      prevLogs.map((log) => ({
        ...log,
        imageUrl: records[log.id] || undefined,
      }))
    );

    // Clear all loading states
    const clearedLoadingState: Record<string, boolean> = {};
    logsData.forEach(log => {
      clearedLoadingState[log.id] = false;
    });
    setLoadingImages(clearedLoadingState);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Hidden when printing */}
        <div className="mb-6 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900">Daily Access Logs</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and print access logs for a specific day
          </p>
        </div>

        {/* Controls - Hidden when printing */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 print:hidden">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Loading...' : 'Fetch Logs'}
            </button>
            <button
              onClick={handlePrint}
              disabled={logs.length === 0}
              className="bg-gray-600 text-white px-6 py-2.5 rounded-md hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Print Report
            </button>
          </div>
        </div>

        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Log Report
          </h1>
          <p className="text-gray-600">
            Date: {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-gray-600">
            Total Entries: {logs.length}
          </p>
          <p className="text-gray-600">
            Generated: {new Date().toLocaleString('en-US')}
          </p>
          <hr className="my-4 border-gray-300" />
        </div>

        {/* Logs Display */}
        {isLoading ? (
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
        ) : logs.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-12 text-center">
            <p className="text-gray-500">No logs found for this date</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden print:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 print:grid-cols-2 print:gap-4 print:p-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg overflow-hidden print:break-inside-avoid"
                >
                  {/* Image */}
                  <div className="bg-gray-100 relative flex items-center justify-center min-h-[300px] print:min-h-[250px]">
                    {loadingImages[log.id] ? (
                      <div className="absolute inset-0 flex items-center justify-center">
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
                    ) : log.imageUrl ? (
                      <img
                        src={log.imageUrl}
                        alt="Access attempt"
                        className="w-full h-auto object-contain"
                        onLoad={() => setLoadingImages(prev => ({ ...prev, [log.id]: false }))}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 print:p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-gray-900 print:text-xl">
                        {log.time.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      {log.success ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-green-100 text-green-800 print:text-xs">
                          ✓ Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-red-100 text-red-800 print:text-xs">
                          ✗ Failed
                        </span>
                      )}
                    </div>
                    <div className="text-base font-medium text-gray-900 print:text-sm">
                      {log.userName || 'Unknown User'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary - Only visible when printing */}
        {logs.length > 0 && (
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
            <h2 className="text-lg font-bold mb-2">Summary</h2>
            <p className="text-sm">
              Successful Attempts: {logs.filter((log) => log.success).length}
            </p>
            <p className="text-sm">
              Failed Attempts: {logs.filter((log) => !log.success).length}
            </p>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyLogsPage;