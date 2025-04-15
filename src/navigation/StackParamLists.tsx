export type ProfileStackParamList = {
  Profile: undefined;
  FriendList: undefined;
  FriendProfile: { thisFriendId: string };
};


export type CourseStackParamList = {
  Course: {course_id: string, lesson_id: number};
  LessonQuiz : {course_id: string, lesson_id: number, totalLessons: number};
  CourseQuiz : {course_id: string};
};