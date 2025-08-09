import axios from 'axios';

const API = 'http://127.0.0.1:8000/api/tests';

export const getTests = async () => {
  const res = await axios.get(`${API}/tests/`);
  return res.data.results || res.data;
};
export const createTest = async (data: Test) => (await axios.post(`${API}/tests/`, data)).data;
export const deleteTest = async (id: number) => (await axios.delete(`${API}/tests/${id}/`)).data;

export const submitAnswers = async (user_identifier: string, answers: Answer[]) => {
  return (await axios.post(`${API}/submit-answers/`, {
    user_identifier,
    answers,
  })).data;
};

export async function getTestById(id: number): Promise<Test> {
  const res = await axios.get(`/tests/${id}/`);
  return res.data;
}

export async function updateTest(id: number, data: Partial<Test>) {
  const res = await axios.patch(`/tests/${id}/`, data);
  return res.data;
}
