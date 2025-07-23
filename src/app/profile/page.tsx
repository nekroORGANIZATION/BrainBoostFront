'use client';

import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

interface ProfileData {
    id: number;
    username: string;
    email: string;
    is_email_verified: boolean;
    is_teacher: boolean;
    is_certified_teacher: boolean;
    profile_picture: string;
}

export default function ProfilePage() {
    const { accessToken } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!accessToken) {
                console.log('Токен відсутній, запит не буде виконано');
                return;
            }

            console.log('accessToken:', accessToken);

            try {
                const res = await axios.get('http://127.0.0.1:8000/accounts/api/profile/', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                setProfile(res.data);
            } catch (error) {
                console.error('Помилка при отриманні профілю:', error);
            }
        };

        fetchProfile();
    }, [accessToken]);

    if (!profile) {
        return <p className="p-4">Завантаження профілю...</p>;
    }

    return (
        <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-lg">
            <h1 className="text-xl font-bold mb-4">Профіль користувача</h1>
            <div className="flex items-center gap-4 mb-4">
                <img
                    src={`http://127.0.0.1:8000${profile.profile_picture}`}
                    alt="Аватар"
                    className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                    <p className="font-semibold text-lg">{profile.username}</p>
                    <p className="text-gray-600">{profile.email}</p>
                </div>
            </div>
            <ul className="space-y-2 text-sm">
                <li>Email підтверджено: {profile.is_email_verified ? 'Так' : 'Ні'}</li>
                <li>Викладач: {profile.is_teacher ? 'Так' : 'Ні'}</li>
                <li>Сертифікований викладач: {profile.is_certified_teacher ? 'Так' : 'Ні'}</li>
            </ul>
        </div>
    );
}
