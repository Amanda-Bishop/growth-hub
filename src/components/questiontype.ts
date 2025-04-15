// Base interface for all question types
export interface BaseQuestion {
    question_id: number;
    description: string;
    question_type: 'TF' | 'MC' | 'MS' | 'MATCH';
  }
  
  // True/False question
  export interface TfQuestion extends BaseQuestion {
    question_type: 'TF';
    answer: boolean;
  }
  
  // Multiple Choice question
  export interface MCQuestion extends BaseQuestion {
    question_type: 'MC';
    a: { answer: string; is_correct: boolean };
    b: { answer: string; is_correct: boolean };
    c: { answer: string; is_correct: boolean };
    d: { answer: string; is_correct: boolean };
  }
  
  // Multiple Select question
  export interface MSQuestion extends BaseQuestion {
    question_type: 'MS';
    a: { answer: string; is_correct: boolean };
    b: { answer: string; is_correct: boolean };
    c: { answer: string; is_correct: boolean };
    d: { answer: string; is_correct: boolean };
  }
  
  // Matching question
  export interface MatchQuestion extends BaseQuestion {
    question_type: 'MATCH';
    answer_key: Array<{
      field_1: string;
      field_2: string;
    }>;
  }
  
  // Union type for all question types
  export type Question = TfQuestion | MCQuestion | MSQuestion | MatchQuestion;