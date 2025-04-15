import { doc, getDoc, setDoc, getDocs, collection, addDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { SubmitSurveyPayload } from '../constants/types/db';
import { updateChallengeProgress } from './challenges';
import { addPostToUser } from './feed';

/**
 * Adds the end-of-lesson quiz to the user's completed lessons and updates currLessons.
 * For each course_id, stores an array of completed lesson_ids.
 */
export async function submitLessonQuiz(user_id: string, lesson_id: number, course_id: string) {
  try {
    const userRef = doc(db, 'users', user_id.toString());
    
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User document does not exist!');
    }
    
    const userData = userDoc.data();
    
    const completedLessons = userData.completedLessons || {};
    
    if (!completedLessons[course_id] || !Array.isArray(completedLessons[course_id])) {
      completedLessons[course_id] = [];
    }
    if (!completedLessons[course_id].includes(lesson_id)) {
      completedLessons[course_id].push(lesson_id);
    }
    
    let currLessons: Record<string, number> = {};
    if (userData.currLessons) {
      currLessons = { ...userData.currLessons };  
    }

    currLessons[course_id] = lesson_id + 1;

    await updateDoc(userRef, {
      completedLessons: completedLessons,
      currLessons: currLessons
    });

    updateChallengeProgress(user_id, "LESSON");

    return 400;
  } catch (error) {
    console.error("Error submitting lesson quiz:", error);
    throw error;
  }
}

/**
 * Adds the end-of-course quiz to the user's completed lessons and updates completedCourses.
 * Removes the course from currCourses and currLessons as it's now completed.
 */
export async function submitEndOfCourseQuiz(user_id: string, lesson_id: number, course_id: string) {
  try {
    const userRef = doc(db, 'users', user_id.toString());
    
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User document does not exist!');
    }
    
    const userData = userDoc.data();
    
    // Update completedLessons to include the final lesson
    const completedLessons = userData.completedLessons || {};
    
    if (!completedLessons[course_id] || !Array.isArray(completedLessons[course_id])) {
      completedLessons[course_id] = [];
    }
    if (!completedLessons[course_id].includes(lesson_id)) {
      completedLessons[course_id].push(lesson_id);
    }
    
    // Update completedCourses array
    const completedCourses = userData.completedCourses || [];
    if (!completedCourses.includes(course_id)) {
      completedCourses.push(course_id);
    }
    
    // Remove course from currCourses if it exists
    const currCourses = userData.currCourses || [];
    const updatedCurrCourses = currCourses.filter((id) => id !== course_id);
    
    // Remove course from currLessons if it exists
    const currLessons = userData.currLessons || {};
    const updatedCurrLessons = { ...currLessons };
    
    // Delete the course from currLessons
    if (course_id in updatedCurrLessons) {
      delete updatedCurrLessons[course_id];
      console.log(`[submitEndOfCourseQuiz] Removed ${course_id} from currLessons`);
    }
   
    console.log("[submitEndOfCourseQuiz] Updating user document with:", {
      completedLessons,
      completedCourses,
      currCourses: updatedCurrCourses,
      currLessons: updatedCurrLessons
    });

    // Update the user document
    await updateDoc(userRef, {
      completedLessons: completedLessons,
      completedCourses: completedCourses,
      currCourses: updatedCurrCourses,
      currLessons: updatedCurrLessons
    });

    updateChallengeProgress(user_id, "COURSE");
    addPostToUser(user_id, "COURSE", course_id);

    return 400;
  } catch (error) {
    console.error("Error submitting end of course quiz:", error);
    throw error;
  }
}


/**
 * Submits the course completion survey and updates relevant records.
 * 
 * - Updates the course's aggregated rating.
 * - Adds the feedback to the course's feedback list.
 * - Stores the feedback in the user's course feedback record.
 */
export async function submitCourseCompletionSurvey(payload: SubmitSurveyPayload) {
  const { user_id, course_id, survey_answers } = payload;

  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', user_id.toString());
      const courseRef = doc(db, 'courses', course_id.toString());

      const userDoc = await transaction.get(userRef);
      const courseDoc = await transaction.get(courseRef);

      if (!courseDoc.exists()) {
        throw new Error('Course document does not exist!');
      }
      if (!userDoc.exists()) {
        throw new Error('User document does not exist!');
      }

      // Calculate new rating
      const courseData = courseDoc.data();
      const aggregatedRating = courseData?.aggregatedRating || {
        numRatings: 0,
        total: 0,
        averageRating: 0,
      };

      const newRating = survey_answers.rating;
      aggregatedRating.numRatings += 1;
      aggregatedRating.total += newRating;
      aggregatedRating.averageRating = parseFloat(
        (aggregatedRating.total / aggregatedRating.numRatings).toFixed(2)
      );

      const feedbacks = courseData.feedback || [];
      feedbacks.push({ survey_answers });

      // Update Course document
      transaction.update(courseRef, {
        aggregatedRating: aggregatedRating,
        feedback: feedbacks,
      });

      // Update User document
      const userData = userDoc.data();
      const userFeedbackRecords = userData?.feedback || {};

      if (!(course_id in userFeedbackRecords)) {
        userFeedbackRecords[course_id] = [];
      }
      userFeedbackRecords[course_id].push(survey_answers);
      
      transaction.update(userRef, {
        feedback: userFeedbackRecords,
      });
    });
    
    console.log('Course Completion Survey submitted successfully.');
    return 400;
  } catch (error) {
    console.error('Course Completion Survey transaction failed: ', error);
    throw error;
  }
}

/**
 * Retrieves the array of submitted course completion surveys for a given course.
 */
export async function getCourseCompletionSurvey(course_id: string) {
  try {
    const res = await runTransaction(db, async (transaction) => {
      const courseRef = doc(db, 'courses', course_id.toString());
      const courseDoc = await transaction.get(courseRef);

      if (!courseDoc.exists()) {
        throw new Error('Course document does not exist!');
      }
      return courseDoc.data()?.feedback || [];
    });
    return res;
  } catch (error) {
    console.error('Get Course Completion Survey transaction failed: ', error);
    throw error;
  }
}

/**
 * Retrieves the initial user survey for a given user.
 */
export async function getUserSurvey(user_id: string) {
  try {
    const res = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', user_id.toString());
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User document does not exist!');
      }
      const userData = userDoc.data();
      return userData?.initial_user_survey || {};
    });
    return res;
  } catch (error) {
    console.error('Get Course Completion Survey transaction failed: ', error);
    throw error;
  }
}