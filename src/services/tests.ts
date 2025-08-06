import axios from 'axios';

const API = 'http://127.0.0.1:8000/api/tests';

export const getTests = async () => {
  const res = await axios.get(`${API}/tests/`);
  return res.data.results || res.data;
};
export const getTestById = async (id: number) => (await axios.get(`${API}/tests/${id}/`)).data;
export const createTest = async (data: any) => (await axios.post(`${API}/tests/`, data)).data;
export const updateTest = async (id: number, data: any) => (await axios.put(`${API}/tests/${id}/`, data)).data;
export const deleteTest = async (id: number) => (await axios.delete(`${API}/tests/${id}/`)).data;

export const submitAnswers = async (user_identifier: string, answers: any[]) => {
  return (await axios.post(`${API}/submit-answers/`, {
    user_identifier,
    answers,
  })).data;
};