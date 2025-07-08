import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc } from 'firebase/firestore'; 
import { useAuth } from '../auth/AuthContext';

import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

interface RoomDetailsData {
  id: string;
  name: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
}

interface BookingData {
  id: string;
  roomId: string;
  roomName: string;
  bookedByUserId: string;
  bookedByUserName: string;
  startTime: Date;
  endTime: Date;
  description: string;
  participants: Participant[];
}

const EditBook: React.FC = () => {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userData: currentAuthUserData, loading: authLoading } = useAuth(); 

  const [bookingDetails, setBookingDetails] = useState<BookingData | null>(null);
  const [roomDetails, setRoomDetails] = useState<RoomDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId || authLoading) {
        if (!bookingId) setError('ID бронювання відсутній.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const bookingDocRef = doc(db, 'bookings', bookingId);
        const bookingDocSnap = await getDoc(bookingDocRef);

        if (!bookingDocSnap.exists()) {
          setError('Бронювання не знайдено.');
          setLoading(false);
          return;
        }

        const data = bookingDocSnap.data();
        const fetchedBooking: BookingData = {
          id: bookingDocSnap.id,
          roomId: data.roomId,
          roomName: data.roomName,
          bookedByUserId: data.bookedByUserId,
          bookedByUserName: data.bookedByUserName,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
          description: data.description,
          participants: data.participants || [],
        };
        setBookingDetails(fetchedBooking);
        
        setStartTime(fetchedBooking.startTime);
        setEndTime(fetchedBooking.endTime);
        setDescription(fetchedBooking.description);
        setSelectedUserIds(fetchedBooking.participants.map(p => p.id));

        const roomDocRef = doc(db, 'rooms', fetchedBooking.roomId);
        const roomDocSnap = await getDoc(roomDocRef);

        if (roomDocSnap.exists()) {
          setRoomDetails({ id: roomDocSnap.id, ...roomDocSnap.data() } as RoomDetailsData);
        } else {
          setError('Кімнату не знайдено.');
          setRoomDetails(null);
        }

        const usersCollectionRef = collection(db, 'users');
        const usersQuery = query(usersCollectionRef, orderBy('name', 'asc')); 
        const usersSnapshot = await getDocs(usersQuery);
        const fetchedUsers: UserData[] = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().email || 'Невідомий', 
          email: doc.data().email,
        }));
        setUsers(fetchedUsers);

        if (currentUser && fetchedBooking.bookedByUserId !== currentUser.uid) {
            setError('Ви можете редагувати лише власні бронювання.');
        }

      } catch (err: any) {
        setError(`Помилка завантаження бронювання: ${err.message || 'Невідома помилка'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, currentUser, authLoading]);

  const handleUserSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options);
    const selected = options.filter(option => option.selected).map(option => option.value);
    setSelectedUserIds(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!startTime || !endTime || !description.trim() || selectedUserIds.length === 0) {
      setError('Заповніть поля та оберіть учасників.');
      return;
    }
    if (startTime >= endTime) {
      setError('Початок має бути раніше кінця.');
      return;
    }
    if (endTime <= new Date() && endTime.getTime() !== bookingDetails?.endTime.getTime()) { 
        setError('Кінець має бути в майбутньому (якщо змінюєте).');
        return;
    }
    if (!currentUser || !bookingDetails) {
        setError('Користувач не авторизований або бронювання не завантажено.');
        return;
    }
    if (bookingDetails.bookedByUserId !== currentUser.uid) {
        setError('Ви можете редагувати лише власні бронювання.');
        return;
    }

    setSubmissionLoading(true);
    try {
      const participantsData = selectedUserIds.map(id => {
        const user = users.find(u => u.id === id);
        return user ? { id: user.id, name: user.name, email: user.email } : null;
      }).filter(Boolean);

      const isCurrentUserParticipant = participantsData.some(p => p?.id === currentUser.uid);
      let finalParticipantsData = participantsData;
      if (!isCurrentUserParticipant && currentAuthUserData) {
        finalParticipantsData = [
          ...participantsData,
          { id: currentUser.uid, name: currentAuthUserData.name || currentUser.email || 'Невідомий', email: currentUser.email || '' }
        ];
      }

      const updatedBookingData = {
        startTime: startTime,
        endTime: endTime,
        description: description,
        participants: finalParticipantsData,
        updatedAt: new Date(), 
      };

      const bookingDocRef = doc(db, 'bookings', bookingId as string);
      await updateDoc(bookingDocRef, updatedBookingData);
      
      setSuccessMessage('Бронювання оновлено!');

    } catch (err: any) {
      setError(`Помилка оновлення бронювання: ${err.message || 'Невідома помилка'}`);
    } finally {
      setSubmissionLoading(false);
    }
  };

  if (!bookingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-red-600 text-lg mb-4">ID бронювання відсутній.</p>
        <button
          onClick={() => navigate('/bookings')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        >
          До бронювань
        </button>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (error && (!bookingDetails || (currentUser && bookingDetails.bookedByUserId !== currentUser.uid))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate('/bookings')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        >
          До бронювань
        </button>
      </div>
    );
  }

  const displayError = error && (currentUser && bookingDetails?.bookedByUserId === currentUser.uid) ? error : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Редагувати бронювання {roomDetails?.name ? `"${roomDetails.name}"` : ''}
        </h2>

        {displayError && <p className="text-red-500 text-center mb-4">{displayError}</p>}
        {successMessage && <p className="text-green-600 text-center mb-4">{successMessage}</p>}

        {currentUser?.uid !== bookingDetails?.bookedByUserId && (
             <p className="text-orange-500 text-center mb-4 font-medium">
                 Ви не автор. Можете лише переглядати.
             </p>
          )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Початок:
            </label>
            <DateTimePicker
              onChange={setStartTime}
              value={startTime}
              minDate={new Date()}
              disableClock={true}
              clearIcon={null}
              className="w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
              required
              disabled={currentUser?.uid !== bookingDetails?.bookedByUserId}
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              Кінець:
            </label>
            <DateTimePicker
              onChange={setEndTime}
              value={endTime}
              minDate={startTime || new Date()} 
              disableClock={true}
              clearIcon={null}
              className="w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
              required
              disabled={currentUser?.uid !== bookingDetails?.bookedByUserId}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Опис:
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Мета зустрічі"
              required
              disabled={currentUser?.uid !== bookingDetails?.bookedByUserId}
            ></textarea>
          </div>

          <div>
            <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">
              Учасники:
            </label>
            <select
              id="participants"
              multiple 
              value={selectedUserIds}
              onChange={handleUserSelectChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-32" 
              disabled={currentUser?.uid !== bookingDetails?.bookedByUserId}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) {currentUser?.uid === user.id ? '(Ви)' : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Ctrl (Windows/Linux) або Cmd (macOS) для вибору кількох.
            </p>
          </div>

          <button
            type="submit"
            disabled={submissionLoading || !currentUser || currentUser.uid !== bookingDetails?.bookedByUserId}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submissionLoading ? 'Оновлення...' : 'Оновити'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(-1)} 
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition duration-300"
          >
            &larr; Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBook;