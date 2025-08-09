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

  export interface ICustomUser {
    id: number;
    username: string;
    email?: string;
    is_email_verified: boolean;
    is_teacher: boolean;
    is_certified_teacher?: boolean | null;

    profile_picture?: string | null;

    groups?: Array<{
      id: number;
      name: string;
    }>;

    user_permissions?: Array<{
      id: number;
      name: string;
      codename: string;

    }>;

    first_name?: string;
    last_name?: string;
    is_active?: boolean;
    date_joined?: string;
  }

  export interface Test {
    id: number;
    title: string;
    description: string;
    questions: Question[];
  }

  interface Lesson {
    id: number;
    title: string;
    description?: string;
    videoUrl?: string;
  }

  interface Answer {
    question: number;
    user_identifier: string;
    selected_choice?: number;
    text_answer?: string;
    is_true_false?: boolean;
  }
}