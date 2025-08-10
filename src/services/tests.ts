import axios from 'axios';

// Предполагается, что Test, Answer и др. импортируются или видны глобально

const API = 'http://172.17.10.22:8000/api/tests';

// Для создания теста — без id
export type TestCreate = Omit<Test, 'id'>;

export const getTests = async () => {
  const res = await axios.get(`${API}/tests/`);
  return res.data.results || res.data;
};

// В createTest используем TestCreate — без обязательного id
export const createTest = async (data: TestCreate) => {
  const res = await axios.post(`${API}/tests/`, data);
  return res.data;
};

export const deleteTest = async (id: number) => {
  const res = await axios.delete(`${API}/tests/${id}/`);
  return res.data;
};

export const submitAnswers = async (user_identifier: string, answers: Answer[]) => {
  const res = await axios.post(`${API}/submit-answers/`, {
    user_identifier,
    answers,
  });
  return res.data;
};

export async function getTestById(id: number): Promise<Test> {
  const res = await axios.get(`${API}/tests/${id}/`);
  return res.data;
}

// Для обновления — частичный Test
export async function updateTest(id: number, data: Partial<Test>) {
  const res = await axios.patch(`${API}/tests/${id}/`, data);
  return res.data;
}
