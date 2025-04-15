import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Get a single question doc by ID
 */
export async function getQuestionById(questionId: string) {
  try {
    const docRef = doc(db, 'questions', questionId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting question by ID:', error);
    throw error;
  }
}

/**
 * Get all questions in the 'questions' collection
 */
export async function getAllQuestions() {
  try {
    const querySnapshot = await getDocs(collection(db, 'questions'));
    const questions: any[] = [];
    querySnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    return questions;
  } catch (error) {
    console.error('Error getting all questions:', error);
    throw error;
  }
}

/**
 * Add or update a question
 */
export async function addOrUpdateQuestion(questionId: string, data: any) {
  try {
    const docRef = doc(db, 'questions', questionId);
    await setDoc(docRef, data, { merge: true });
    console.log('Question saved successfully');
  } catch (error) {
    console.error('Error saving question:', error);
    throw error;
  }
}
