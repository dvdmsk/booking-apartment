import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 

const EditRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchRoomData = async () => {
      if (!id) {
        setError('ID кімнати відсутній.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const roomDocRef = doc(db, 'rooms', id);
        const roomDocSnap = await getDoc(roomDocRef);

        if (roomDocSnap.exists()) {
          const data = roomDocSnap.data();
          setRoomName(data.name || '');
          setRoomDescription(data.description || '');
        } else {
          setError('Кімнату не знайдено.');
        }
      } catch (err) {
        setError('Помилка завантаження даних кімнати.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [id]);

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim() || !roomDescription.trim()) {
      setError('Назва та опис не можуть бути порожніми.');
      return;
    }
    if (!id) {
      setError('Немає ID кімнати для оновлення.');
      return;
    }

    setSubmissionLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const roomDocRef = doc(db, 'rooms', id);
      await updateDoc(roomDocRef, {
        name: roomName,
        description: roomDescription,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
      
      setTimeout(() => {
        navigate(`/rooms/${id}`);
      }, 1500); 
      
    } catch (err) {
      setError('Не вдалося оновити кімнату.');
    } finally {
      setSubmissionLoading(false);
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

  if (error && !submissionLoading) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-2xl mx-auto mt-8">
        <p>{error}</p>
        <button onClick={() => navigate('/rooms')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
          До кімнат
        </button>
      </div>
    );
  }

  if (!roomName && !roomDescription && !loading && id && !error) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 max-w-2xl mx-auto mt-8">
        <p>Кімнату з ID "{id}" не знайдено.</p>
        <button onClick={() => navigate('/rooms')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
          До кімнат
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Редагувати кімнату: {roomName || 'Завантаження...'}</h2>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-md mb-4 text-center">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 bg-green-50 border border-green-200 p-3 rounded-md mb-4 text-center">
          Кімнату оновлено!
        </p>
      )}

      <form onSubmit={handleUpdateRoom} className="space-y-4">
        <div>
          <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">Назва:</label>
          <input
            type="text"
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            disabled={submissionLoading}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Назва переговорної"
          />
        </div>

        <div>
          <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 mb-1">Опис:</label>
          <textarea
            id="roomDescription"
            value={roomDescription}
            onChange={(e) => setRoomDescription(e.target.value)}
            disabled={submissionLoading}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Детальний опис кімнати"
          />
        </div>

        <button
          type="submit"
          disabled={submissionLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {submissionLoading ? 'Оновлення...' : 'Оновити'}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={submissionLoading}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out mt-2"
        >
          Назад
        </button>
      </form>
    </div>
  );
};

export default EditRoom;