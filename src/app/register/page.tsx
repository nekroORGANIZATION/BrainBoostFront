'use client';
import { useState } from 'react';
import { login, register } from '../../services/AuthService';

export default function AuthPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const handleRegister = async () => {
        try {
            await register(username, email, password);
            alert('User registered!');
        } catch (e) {
            alert('Registration error');
        }
    };

    const handleLogin = async () => {
        try {
            const data = await login(username, password);
            setAccessToken(data.access);
            localStorage.setItem('refreshToken', data.refresh); // або sessionStorage
            alert('Login successful!');
        } catch (e) {
            alert('Login error');
        }
    };

    return (
        <div className="p-4" style={{ maxWidth: '400px', margin: '0 auto', backgroundColor: 'white' }}>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />

            <button onClick={handleRegister}>Register</button>

            {accessToken && <p>Access Token: {accessToken.slice(0, 20)}...</p>}
        </div>
    );
}
