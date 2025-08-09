import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api/tests';

export const getTests = () => axios.get(`${API_BASE}/tests/`);
export const getTest = (id: number) => axios.get(`${API_BASE}/tests/${id}/`);



