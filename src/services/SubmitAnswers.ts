import axios from 'axios';

interface AnswerData {
  question_id: number;
  selected_choice?: number;
  is_true_false?: boolean;
  text_answer?: string;
}

export const submitAnswers = async (
  user_identifier: string,
  answers: AnswerData[]
) => {
  try {
    const response = await axios.post('http://127.0.0.1:8000/api/tests/submit-answers/', {
      user_identifier,
      answers
    });
    return response.data;
  } catch (error: any) {
    console.error('Ошибка при отправке ответов:', error);
    throw error;
  }
};
