import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import storage from '../services/storage';

type ProfileContextType = {
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  email: string;
  setEmail: (email: string) => void;
  profilePicture: string;
  setProfilePicture: (url: string) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [name, setName] = useState('Operator');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuC91jouvzvXDvRHN8QhqYX8kMHrMoPfAkp8zvgNNp4T0DW_LLtJmCpUR7cRbKWm91a45aDOd5i2kGE-YfJpJ_DbWKAHVM8nTIUhqR-Od17_6PtQAoYCiyOORlW5aGh2MWOQSRqOgKnuVDKmzppueR2FwNTsCmWUMuNHlXBm_Tm8VY3QfmHRB11_uhXwHQFXnO6H5VkbQGC1wWXkrnXDEns7R5oJII_EvQeuoYjqlT6IHxqTL7hbCngTVrOMX9nUIG-nf4yZjfHDom8p');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await storage.getItem('operatorToken');
        if (token) {
          // Set auth header just in case api service hasn't fully initialized with it
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get('/auth/me');
          const op = res.data.data.operator;
          if (op) {
            setName(op.name || 'Operator');
            setPhone(op.phone || '');
            setEmail(op.email || '');
          }
          const savedPic = await storage.getItem('operatorProfilePic');
          if (savedPic) {
            setProfilePicture(savedPic);
          } else if (op && op.profileImageUrl) {
            setProfilePicture(op.profileImageUrl);
          }
        }
      } catch (error) {
        console.log('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleSetProfilePicture = async (url: string) => {
    setProfilePicture(url);
    await storage.setItem('operatorProfilePic', url);
  };

  return (
    <ProfileContext.Provider value={{ 
      name, setName, 
      phone, setPhone, 
      email, setEmail, 
      profilePicture, setProfilePicture: handleSetProfilePicture 
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
