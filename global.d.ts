export {};

declare global {
  interface Window {
    paypal: any;
  }
  export interface Choice {
    id: number;
    text: string;
    is_correct: boolean;
  }

  export interface Question {
    id: number;
    text: string;
    question_type: 'TF' | 'MC' | 'TXT';
    choices?: Choice[];
  }

  export interface Test {
    id: number;
    title: string;
    description: string;
    questions: Question[];
  }

  interface Answer {
    question: number;
    user_identifier: string;
    selected_choice?: number;
    text_answer?: string;
    is_true_false?: boolean;
  }
}