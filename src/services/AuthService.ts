import axios from 'axios';

export async function register(
    role: string,
    name: string,
    email: string,
    password: string,
    birthDate: string
) {
    const response = await axios.post('http://172.17.10.22:8000/accounts/api/register/', {
        role,
        username: name,
        email,
        password,
        confirm_password: password,
        birth_date: birthDate
    }, {
        headers: { 'Content-Type': 'application/json' }
    });
    console.log('Registration response:', response.data);
    return response.data;
}
