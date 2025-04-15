// types (for anything DB-related)

import { Float } from "react-native/Libraries/Types/CodegenTypes";


// --------------------------------------------------------------------------
// SUBMISSIONS //////////////////////////////////////////////////////////////
// --------------------------------------------------------------------------

export interface SurveyAnswers {
  rating: Float;
  comments?: string;
}

export interface SubmitSurveyPayload {
  user_id: string;
  course_id: string;
  survey_answers: SurveyAnswers;
}

export interface FriendItem {
  id: string;
  username: string;
  avatar: number;
}


export interface FriendProfileItem {
  badges: [];
  id: string;
  username: string;
  avatar: number;
  points: number;
}