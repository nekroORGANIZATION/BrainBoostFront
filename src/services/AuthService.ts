export const API_URL = 'http://127.0.0.1:8000/accounts/api';

export async function registerTeacher(formData: FormData) {
    const res = await fetch(`http://127.0.0.1:8000/accounts/register-teacher/`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) throw new Error('Teacher registration failed');
    return res.json();
}

export async function register(username: string, email: string, password: string) {
    const res = await fetch(`${API_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    if (!res.ok) throw new Error('Registration failed');
    return res.json();
}

export async function login(username: string, password: string) {
    const res = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) throw new Error('Login failed');
    return res.json(); // { access: string, refresh: string }
}

export async function refreshToken(refresh: string) {
    const res = await fetch(`${API_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
    });

    if (!res.ok) throw new Error('Token refresh failed');
    return res.json();
}
