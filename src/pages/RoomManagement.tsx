import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, query, where } from "firebase/firestore"; 
import { db } from "../firebase/config"; 
import Loader from "../components/Loader";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

interface Room {
  id: string;
  name: string;
  description: string;
}

function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userData, loading: authLoading } = useAuth();
  const isAdmin = userData?.role === "admin";
  const navigate = useNavigate();

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const roomsCollectionRef = collection(db, "rooms");
      const querySnapshot = await getDocs(roomsCollectionRef);

      const roomsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];

      setRooms(roomsData);
    } catch (err: any) {
      setError("Помилка завантаження кімнат.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    setError(null); 

    try {
      const bookingsCollectionRef = collection(db, 'bookings');
      const q = query(bookingsCollectionRef, where('roomId', '==', roomId));
      const bookingSnapshot = await getDocs(q);

      const deleteBookingPromises = bookingSnapshot.docs.map(docToDelete => 
        deleteDoc(doc(db, 'bookings', docToDelete.id))
      );
      await Promise.all(deleteBookingPromises); 

      const roomDocRef = doc(db, "rooms", roomId);
      await deleteDoc(roomDocRef);

      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));

    } catch (err: any) {
      setError(`Не вдалося видалити "${roomName}".`);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []); 

  if (loading || authLoading) { 
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-md mb-4 text-center">
        Помилка: {error}
        <button 
          onClick={fetchRooms} 
          className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mt-8 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">
          Доступні кімнати
        </h3>
        <button
          className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out
            ${isAdmin
              ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
              : "bg-gray-400 cursor-not-allowed"
            }`}
          disabled={!isAdmin}
          onClick={() => navigate('/rooms/add-room')}
        >
          Додати кімнату
        </button>
      </div>
      <ul className="space-y-4 mt-3">
        {rooms.length === 0 ? (
          <p className="text-gray-600 text-center py-4">Кімнат поки немає.</p>
        ) : (
          rooms.map((room) => (
            <li key={room.id}>
              <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                <Link to={`/rooms/${room.id}`} className="flex-grow"> 
                  <p className="text-lg font-medium text-gray-900 hover:text-indigo-600 transition duration-150 ease-in-out">
                    {room.name}
                  </p>
                </Link>
                
                {isAdmin && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/rooms/${room.id}/edit-room`);
                      }}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      aria-label="Редагувати"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-4.75 2.528l-4.243 4.243a1 1 0 00-.293.707v4.243a1 1 0 001 1h4.243a1 1 0 00.707-.293l4.243-4.243-5.657-5.657z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleDeleteRoom(room.id, room.name);
                      }}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      aria-label="Видалити"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default RoomManagement;