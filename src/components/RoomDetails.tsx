import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp, deleteDoc } from 'firebase/firestore'; 

interface Room {
  id: string;
  name: string;
  description: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
}

interface Booking {
  id: string;
  roomId: string;
  roomName: string; 
  bookedByUserId: string;
  bookedByUserName: string;
  startTime: Timestamp;
  endTime: Timestamp;    
  description: string;
  participants: Participant[]; 
  createdAt: Timestamp; 
}

const RoomDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchRoomAndBookings = async () => {
      if (!id) {
        setError('ID кімнати відсутній.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const roomDocRef = doc(db, 'rooms', id);
        const roomDocSnap = await getDoc(roomDocRef);

        if (roomDocSnap.exists()) {
          setRoom({ id: roomDocSnap.id, ...roomDocSnap.data() } as Room);
        } else {
          setError('Кімнату не знайдено.');
          setRoom(null);
          setLoading(false); 
          return;
        }

        const bookingsCollectionRef = collection(db, 'bookings');
        const q = query(bookingsCollectionRef, where('roomId', '==', id));
        const bookingsSnapshot = await getDocs(q);

        const fetchedBookings: Booking[] = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          startTime: doc.data().startTime, 
          endTime: doc.data().endTime,
          createdAt: doc.data().createdAt,
          ...doc.data()
        })) as Booking[];
        
        fetchedBookings.sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime());

        setBookings(fetchedBookings);

      } catch (err) {
        setError('Помилка завантаження даних.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomAndBookings();
  }, [id]);

  const formatDateTime = (timestamp: Timestamp | Date) => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return new Intl.DateTimeFormat('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  };

  const handleBookingClick = (bookingId: string) => {
    navigate(`/bookings/${bookingId}`);
  };

  const handleDeleteRoom = async () => {
    if (!id) {
      setError('ID кімнати відсутній.');
      return;
    }

    setIsDeleting(true); 
    setError(null);       

    try {
      const bookingQuery = query(collection(db, 'bookings'), where('roomId', '==', id));
      const bookingSnapshot = await getDocs(bookingQuery);
      
      const deleteBookingPromises = bookingSnapshot.docs.map(docToDelete => 
        deleteDoc(doc(db, 'bookings', docToDelete.id))
      );
      await Promise.all(deleteBookingPromises); 

      const roomDocRef = doc(db, 'rooms', id);
      await deleteDoc(roomDocRef);

      navigate('/rooms'); 
    } catch (err) {
      setError('Помилка видалення кімнати або бронювань.');
    } finally {
      setIsDeleting(false); 
      setShowDeleteConfirm(false); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-2xl mx-auto mt-8">
        <p>{error}</p>
        <button onClick={() => navigate('/rooms')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
          До кімнат
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 max-w-2xl mx-auto mt-8">
        <p>Кімнату не знайдено.</p>
        <button onClick={() => navigate('/rooms')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
          До кімнат
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Кімната: {room.name}
        </h2>
        <div className="flex space-x-2"> 
          <button
            onClick={() => navigate(`/rooms/${id}/edit-room`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            Редагувати
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)} 
            disabled={isDeleting} 
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out disabled:bg-red-400 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Видалення...' : 'Видалити'}
          </button>
          <button
            onClick={() => navigate('/rooms')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out"
          >
            &larr; Назад
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Опис</h3>
        <p className="text-gray-700">{room.description || 'Немає опису.'}</p>
      </div>

      <div className="mb-8">
        <button 
          onClick={() => navigate(`/rooms/${id}/book`)}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
        >
          Забронювати
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Бронювання</h3>
        {bookings.length === 0 ? (
          <p className="text-gray-600 italic">Немає бронювань.</p>
        ) : (
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <li 
                key={booking.id} 
                onClick={() => handleBookingClick(booking.id)}
                className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out"
              >
                <p className="text-lg font-semibold text-indigo-700 mb-1">
                  {booking.description}
                </p>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Початок:</span> {formatDateTime(booking.startTime)}
                </p>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Кінець:</span> {formatDateTime(booking.endTime)}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Бронював: <span className="font-medium">{booking.bookedByUserName}</span>
                </p>
                
                {booking.participants && booking.participants.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Учасники:</p>
                    <ul className="list-disc list-inside text-gray-600 text-sm">
                      {booking.participants.map((p, index) => (
                        <li key={index}>
                          {p.name} ({p.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-red-700 mb-4">Видалити?</h3>
            <p className="text-gray-700 mb-6">
              Видалити кімнату "{room.name}"?<br />
              <span className="font-bold text-red-600">Усі бронювання теж видаляться!</span>
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDeleteRoom}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition"
              >
                {isDeleting ? 'Видалення...' : 'Так'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 transition"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetails;