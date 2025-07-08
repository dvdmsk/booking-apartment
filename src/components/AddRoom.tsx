import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AddRoom = () => {
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleAddRoom = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    if (!roomName.trim() || !roomDescription.trim()) {
      setError('Назва та опис кімнати не можуть бути порожніми.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await addDoc(collection(db, 'rooms'), {
        name: roomName,
        description: roomDescription,
        createdAt: new Date().toISOString(),
      });
      setSuccess(true);
      setRoomName('');
      setRoomDescription('');
      
      setTimeout(() => {
        navigate('/rooms');  
      }, 1500);
      
    } catch (err) {
      console.error('Помилка при додаванні кімнати:', err);
      setError('Не вдалося додати кімнату. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Додати нову кімнату</h2>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-md mb-4 text-center">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 bg-green-50 border border-green-200 p-3 rounded-md mb-4 text-center">
          Кімнату успішно додано!
        </p>
      )}

      <form onSubmit={handleAddRoom} className="space-y-4">
        <div>
          <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">Назва кімнати:</label>
          <input
            type="text"
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            disabled={loading}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Назва переговорної кімнати"
          />
        </div>

        <div>
          <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 mb-1">Опис кімнати:</label>
          <textarea
            id="roomDescription"
            value={roomDescription}
            onChange={(e) => setRoomDescription(e.target.value)}
            disabled={loading}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Детальний опис кімнати (місткість, обладнання тощо)"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {loading ? 'Додавання...' : 'Додати кімнату'}
        </button>
      </form>
    </div>
  );
};

export default AddRoom;