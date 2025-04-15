import { doc, getDoc, setDoc, getDocs, collection, where, query, orderBy, QueryConstraint, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface SortOptions {
  field: string;
  direction?: "asc" | "desc";
}

// New function to get course info including total lessons count
// Get a course document by courseId with total lessons count
export async function getCourseById(courseId: string) {
  try {
    const docRef = doc(db, 'courses', courseId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    // Get the lessons collection for this course to count them
    const lessonsCollectionRef = collection(db, 'courses', courseId, 'lessons');
    const lessonsSnapshot = await getDocs(lessonsCollectionRef);
    // Return the course data with the total lessons count
    return {
      ...docSnap.data(),
      totalLessons: lessonsSnapshot.size 
    };
  } catch (error) {
    console.error('Error getting course by ID:', error);
    throw error;
  }
}

// Get course list (with optional filters)
export async function getCourseList(uid: string, filters: QueryConstraint[] = [], sortOptions: SortOptions | null = null) {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const userSurvey = userSnap.data()?.survey["2"] || [];

    const coursesRef = collection(db, "courses");
    let q = query(coursesRef, ...filters);
    const querySnapshot = await getDocs(q);

    const courses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    courses.sort((a, b) => {
      const indexA = userSurvey.indexOf(a.id);
      const indexB = userSurvey.indexOf(b.id);
  
      if (indexA === -1 && indexB === -1) return 0; // Both not in userSurvey, keep original order
      if (indexA === -1) return 1; // A is not in userSurvey, move down
      if (indexB === -1) return -1; // B is not in userSurvey, move down
  
      return indexA - indexB; // Sort based on userSurvey order
    });

    return courses;
  } catch (error) {
    console.error("Error getting courses:", error);
    throw error;
  }
}

/* Example filters and sort options for getCourseList
const filters = [
  where("rating", ">", 3)
];
const sortOptions: SortOptions = { field: "rating", direction: "desc" };
getCourseList([where("rating", ">", 3)], { field: "rating", direction: "desc" });
*/


// Get lesson by courseId and lessonId
export async function getLesson(courseId: string, lessonId: number) {
  try {
    const lessonRef = doc(db, "courses", courseId, "lessons", `${lessonId}`);
    const lessonSnapshot = await getDoc(lessonRef);
    return lessonSnapshot.exists() ? lessonSnapshot.data() : null;
  } catch (error) {
    console.error("Error fetching lesson:", error);
    throw error;
  }
}


// Get lesson questions array by courseId and lessonId
export async function getLessonQuestions(courseId: string, lessonId: number) {
  try {
    const lessonRef = doc(db, "courses", courseId, "lessons", `${lessonId}`);
    const lessonSnapshot = await getDoc(lessonRef);
    return lessonSnapshot.exists() ? lessonSnapshot.data()?.questions || [] : [];
  } catch (error) {
    console.error("Error fetching lesson questions:", error);
    throw error;
  }
}


// Get question by question type (e.g. "MS", "TF", "MC")
export async function getQuestionByType(questionType: string): Promise<number[]> {
  try {
    const questionRef = collection(db, "questions");

    // Query to filter by the 'question_type' field
    const q = query(questionRef, where("question_type", "==", questionType));

    // Fetch the documents based on the query
    const snapshot = await getDocs(q);

    // Get question ids from the snapshot
    const allQuestionIds: number[] = [];
    snapshot.docs.forEach(doc => {
      const questionId = doc.data().question_id; // Access the single question_id
      if (questionId) {
        allQuestionIds.push(questionId);  // Push the single question_id into the array
      }
    });
    return allQuestionIds
  } catch (error) {
    console.error("Error getting quiz questions:", error);
    throw error;
  }
}


// Add course to user's currentCourses array
export async function addCourseToUser(userId: string, courseId: string) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      currCourses: arrayUnion(courseId)  // Add courseId to currentCourses array
    });
  } catch (error) {
    console.error("Error adding course to user:", error);
    throw error;
  }
}

export async function removeCourseFromUser(user_id: string, course_id: string) {
  try {
    const userRef = doc(db, "users", user_id);
    await updateDoc(userRef, {
      completedCourses: arrayRemove(course_id)
    });
  } catch (error) {
    console.error("Error removing course from user:", error);
  }
}

// Add lesson to user's currentLessons object
export async function addLessonToUser(userId: string, course_id: string, lessonId: number) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      [`currLessons.${course_id}`]: lessonId
    });
  } catch (error) {
    console.error("Error adding lesson to user:", error);
    throw error;
  }
}


// Get course rating
export async function getCourseRating(courseId: string) {
  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnapshot = await getDoc(courseRef);
    return courseSnapshot.exists() ? courseSnapshot.data().rating : null;
  } catch (error) {
    console.error("Error getting course rating:", error);
    throw error;
  }
}


// Get end of course quiz ie. a random question from each lesson in the course
export async function getEndOfCourseQuiz(courseId: string): Promise<number[]> {
  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnapshot = await getDoc(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error("Course not found");
    }

    const lessonsRef = collection(courseRef, "lessons");
    const lessonsSnapshot = await getDocs(lessonsRef);

    const endOfCourseQuiz: number[] = [];
    for (const lessonDoc of lessonsSnapshot.docs) {
      const lessonId = parseInt(lessonDoc.id, 10);

      // Get questions from the lesson using getLessonQuestions
      const questions = await getLessonQuestions(courseId, lessonId);

      // Pick one question randomly from the lesson, if available
      if (questions.length > 0) {
        const randomIndex = Math.floor(Math.random() * questions.length);
        endOfCourseQuiz.push(questions[randomIndex]);
      }
    }
    return endOfCourseQuiz;

  } catch (error) {
    console.error("Error getting quiz questions:", error);
    throw error;
  }
}

// Gets the user's progress in a course as a decimal to be used in the progress bar
export async function getCourseProgressPercentage(uid: string, courseId: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      console.log("[getCourseProgressPercentage] User not found");
      return 0; 
    }

    const userData = userSnapshot.data();
    
    const courseRef = doc(db, "courses", courseId);
    const courseSnapshot = await getDoc(courseRef);
    
    if (!courseSnapshot.exists()) {
      console.log("[getCourseProgressPercentage] Course not found");
      return 0; 
    }
    
    const lessonsRef = collection(db, "courses", courseId, "lessons");
    const lessonsSnapshot = await getDocs(lessonsRef);
    const totalLessons = lessonsSnapshot.size;
    
    if (totalLessons === 0) {
      console.log("[getCourseProgressPercentage] Course has no lessons");
      return 0; 
    }
    
    const currLessons = userData.currLessons || {};
    const currLesson = currLessons[courseId] || 1;
    
    const rawProgress = (currLesson - 1) / totalLessons;
    
    const roundedProgress = Math.round(rawProgress * 100) / 100;
    
    return roundedProgress;
  } catch (error) {
    console.error("Error getting course progress:", error);
    // Return 0 instead of throwing to avoid breaking the UI
    return 0;
  }
}

// Add user's feedback for a course
export async function addCourseFeedback(courseId: string, surveyResponses: any) {
  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnapshot = await getDoc(courseRef);
    const courseData = courseSnapshot.data();
    if (!courseData) {
      throw new Error("Course data is undefined");
    }
    const currRating = courseData.aggregatedRating;
    const newNumRatings = currRating.numRatings + 1;
    const newTotalRating = currRating.totalRating + surveyResponses.ratings.CourseRating;
    let newAvgRating = newTotalRating / newNumRatings;

    newAvgRating = parseFloat(newAvgRating.toFixed(1));
    if (newAvgRating === Math.floor(newAvgRating)) {
      newAvgRating = Math.floor(newAvgRating);
    }

    await updateDoc(courseRef, {
      feedback: arrayUnion(surveyResponses),
      aggregatedRating: {
        numRatings: newNumRatings,
        totalRating: newTotalRating,
        averageRating: newAvgRating
      }
    });
  } catch (error) {
    console.error("Error appending course feedback survey:", error);
  }
}

// Get a random current course
export async function getRandomCurrentCourse(uid: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new Error("User not found");
    }

    const userCourses = userSnapshot.data()?.currCourses || [];
    const randomIndex = Math.floor(Math.random() * userCourses.length);
    return userCourses[randomIndex];

  } catch (error) {
    console.error("Error getting random current course:", error);
    throw error;
  }
}


// Get course name from id
export async function getRandCourseInfo(uid: string) {
  try {
    // Get a random course ID first (need to await this function)
    const courseID = await getRandomCurrentCourse(uid);
    
    if (!courseID) {
      return null;
    }
    
    // Get course name and progress in parallel for efficiency
    const [courseSnapshot, progressDecimal] = await Promise.all([
      getDoc(doc(db, "courses", courseID)),
      getCourseProgressPercentage(uid, courseID)
    ]);
    
    // Calculate progress percentage
    const progress = progressDecimal * 100;
    
    // Return all information in a single object
    if (courseSnapshot.exists()) {
      return {
        id: courseID,
        name: courseSnapshot.data().name,
        progress: progress
      };
    } else {
      console.log(`[getRandCourseInfo] Course document with ID ${courseID} does not exist`);
      return null;
    }
  } catch (error) {
    console.error("[getRandCourseInfo] Error getting course info:", error);
    throw error;
  }
}

// Get current lesson for a given course
export async function getCurrentLesson(uid: string, courseId: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      console.log("[getCurrentLesson] User not found");
      return null;
    }

    const currLessons = userSnapshot.data()?.currLessons || {};
    const currLesson = currLessons[courseId] || 1;

    return currLesson;
  } catch (error) {
    console.error("[getCurrentLesson] Error getting current lesson:", error);
    throw error;
  }
}

// Get video URL for a lesson
export async function getLessonVideo(courseId: string, lessonId: number) {
  try {
    const lessonRef = doc(db, "courses", courseId, "lessons", `${lessonId}`);
    const lessonSnapshot = await getDoc(lessonRef);
    if (lessonSnapshot.exists()) {
      return lessonSnapshot.data().video;
    } 
    return null;
  } catch (error) {
    console.error("[getLessonVideo] Error getting video URL:", error);
    throw error;
  }
}