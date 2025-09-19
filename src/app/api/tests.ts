import axios from 'axios';

const API_BASE = 'https://brainboost.pp.ua/api/api/tests';

export const getTests = () => axios.get(`${API_BASE}/tests/`);
export const getTest = (id: number) => axios.get(`${API_BASE}/tests/${id}/`);



