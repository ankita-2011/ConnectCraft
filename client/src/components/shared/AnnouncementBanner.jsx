import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiVolume2, FiX } from 'react-icons/fi';
import '../../styles/admin/admin.css';

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await api.get('/admin/announcements');
        if (response.data?.status === 'success' && response.data.announcements?.length > 0) {
          setAnnouncement(response.data.announcements[0]);
        }
      } catch  {
        // Quiet catch for guest routes
      }
    };
    fetchAnnouncements();
  }, []);

  if (!announcement || dismissed || !announcement.isBanner) return null;

  return (
    <div className={`announcement-banner ${announcement.type}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <FiVolume2 style={{ fontSize: '1.1rem' }} />
        <span><strong>[{announcement.type}]</strong> {announcement.title}: {announcement.content}</span>
      </div>
      <button onClick={() => setDismissed(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
        <FiX />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
