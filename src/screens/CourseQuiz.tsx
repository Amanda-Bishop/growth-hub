import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Quiz from '../components/Question';
import { Question } from '../components/questiontype';
import { Modal, Block, Image, Button } from '../components';
import { useTheme } from '../hooks/';
import { useNavigation, NavigationProp } from '@react-navigation/core';
import { CourseStackParamList } from '../navigation/StackParamLists'
import { StackNavigationProp } from '@react-navigation/stack';
import { getEndOfCourseQuiz } from '../queries/courses';
import { getQuestionById } from '../queries/questions';
import { useRoute, RouteProp } from '@react-navigation/native';
import { badgeMap } from "../constants/badges";
import { useData } from '../hooks/useData';

// Sample questions for fallback
const sampleQuestions: Question[] = [
  // True/False question
  {
    question_id: 23,
    description: "True or False: The swab test is used only for sores",
    question_type: "TF" as const,
    answer: false
  },
  
  // Multiple Choice question
  {
    question_id: 233,
    description: "Which of the following is an example of psychological abuse?",
    question_type: "MC" as const,
    a: { answer: "Slapping or pushing", is_correct: false },
    b: { answer: "Threats of harm or humiliation", is_correct: true },
    c: { answer: "Withholding financial resources", is_correct: false },
    d: { answer: "Non-consensual touching", is_correct: false }
  },
  
  // Multiple Select question
  {
    question_id: 228,
    description: "What are considered forms of IPV?",
    question_type: "MS" as const,
    a: { answer: "Physical abuse", is_correct: true },
    b: { answer: "Emotional abuse", is_correct: true },
    c: { answer: "Financial abuse", is_correct: true },
    d: { answer: "Forced marriage", is_correct: false }
  },
];

const CourseQuiz: React.FC = () => {
  const { assets, colors, sizes } = useTheme();
  const [quizComplete, setQuizComplete] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [scorePercentage, setScorePercentage] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const {user, setUser, handleUser, completedCourses, setCompletedCourses} = useData();
  
  type CourseNavigationProp = StackNavigationProp<CourseStackParamList, 'Course'>;
  const navigation = useNavigation<CourseNavigationProp>();

  const route = useRoute<RouteProp<CourseStackParamList, 'LessonQuiz'>>();
  const { params = {} } = route;
  const course_id = params.course_id || "basic_anatomy"; // Default course if missing

  // Fetch questions only once when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const quiz = await getEndOfCourseQuiz(course_id);
        
        if (quiz && quiz.length > 0) {
          const questionPromises = quiz.map((questionId: number) => 
            getQuestionById(questionId.toString())
          );
          
          const fetchedQuestions = await Promise.all(questionPromises);
          // Filter out null values and set questions
          const validQuestions = fetchedQuestions.filter((question): question is Question => 
            question !== null
          );
          
          setQuestions(validQuestions);
        }
      } catch (error) {
        console.error("Error fetching quiz questions:", error);
        // Fallback to sample questions if there's an error
        setQuestions(sampleQuestions);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []); // Empty dependency array means this runs once on mount
  
  const handleQuizComplete = (results: any[]) => {
    setQuizComplete(true);
    setQuizResults(results);
    
    // Calculate score
    const correctAnswers = results.filter(result => result.isCorrect).length;
    setScore(correctAnswers);
    
    // Get the total number of questions
    const totalQuestions = questions.length || sampleQuestions.length;
    
    // Calculate percentage
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    setScorePercentage(percentage);
  };
  
  const resetQuiz = () => {
    setQuizComplete(false);
    setQuizResults([]);
    setScore(0);
    setScorePercentage(0);
    setShowQuiz(false);
  };
  
  const handleCompletionSurvey = () => {
    setShowCompletionModal(false);
    console.log("Navigating to course completion survey");
    console.log(course_id);
    navigation.navigate('Feedback', { course_id });
  };
  
  const handleReturnToCourses = () => {
    setShowCompletionModal(false);
    console.log("Returning to courses");
    navigation.navigate('Courses');
  };
  
  const handleCompleteCourse = async () => {
    setShowCompletionModal(true);
  
    if (badgeMap[course_id] && user) {
      try {
        // Prepare updated user data
        const updatedUserData: IUser = {
          ...user,
          badges: user.badges 
            ? user.badges.some(badge => badge.id === course_id) 
              ? user.badges 
              : [
                  ...user.badges, 
                  { 
                    id: course_id, 
                    // Add any other required badge properties 
                  }
                ]
            : [{ 
                id: course_id, 
                // Add any other required badge properties 
              }]
        };
  
        // Use handleUser to update Firestore and local state
        await handleUser(updatedUserData);
      } catch (error) {
        console.error("Error adding course badge:", error);
      }
    }
  };

  // Use the fetched questions if available, otherwise use sample questions
  const quizQuestions = questions.length > 0 ? questions : sampleQuestions;
  
  // Determine if a badge exists for this course
  const badgeExists = badgeMap && course_id && badgeMap[course_id];
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>End of Course Quiz</Text>
      
      {!showQuiz && !quizComplete ? (
        <View style={styles.startContainer}>
          <Text style={styles.startText}>
            This quiz may contain {quizQuestions.length} questions of the following different types:
          </Text>
          <Text style={styles.bulletPoint}>• True/False</Text>
          <Text style={styles.bulletPoint}>• Multiple Choice</Text>
          <Text style={styles.bulletPoint}>• Multiple Select</Text>
          <Text style={styles.bulletPoint}>• Matching</Text>
          <Button 
            primary
            onPress={() => setShowQuiz(true)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Loading Questions..." : "Start Quiz"}
            </Text>
          </Button>
        </View>
      ) : quizComplete ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultTitle}>Quiz Results</Text>
          <Text style={styles.scoreText}>
            You scored {score} out of {quizQuestions.length}
            ({scorePercentage}%)
          </Text>
          
          {scorePercentage === 100 ? (
            <View style={styles.buttonsContainer}>
              <Button 
                success
                marginBottom={sizes.s}
                onPress={handleCompleteCourse}
              >
                <Text style={styles.buttonText}>Complete Course</Text>
              </Button>
              {/* Reset quiz button */}
              <Button 
                gray
                onPress={resetQuiz}
              >
                <Text style={styles.buttonText}>Take Quiz Again</Text>
              </Button>
            </View>
          ) : (
            <Button 
              primary
              onPress={resetQuiz}
            >
              <Text style={styles.buttonText}>Take Quiz Again</Text>
            </Button>
          )}
        </View>
      ) : (
        <Quiz 
          questions={quizQuestions}
          onComplete={handleQuizComplete}
        />
      )}
      
      {/* Course Completion Modal */}
      <Modal
        id="course-completion-modal"
        visible={showCompletionModal}
        onRequestClose={() => setShowCompletionModal(false)}>
        <Block flex={0} align="center">
          <Text style={styles.modalTitle}>Course Completed!</Text>
          
          <Text style={styles.modalText}>
            Congratulations! You have successfully completed this course and received its course badge.
          </Text>
          
          {/* Badge Image */}
          {badgeExists ? (
            <Image 
              source={badgeMap[course_id].image}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.modalText}>
              Badge not available for this course
            </Text>
          )}
          
          {/* Buttons */}
          <Block row flex={0} align="center" justify="space-between" width="100%" marginTop={sizes.m}>
            <Button 
              primary
              flex={1} 
              marginRight={sizes.s}
              onPress={handleCompletionSurvey}
            >
              <Text style={styles.buttonText}>Complete Course Survey</Text>
            </Button>
            
            <Button 
              secondary
              flex={1} 
              marginLeft={sizes.s}
              onPress={handleReturnToCourses}
            >
              <Text style={styles.buttonText}>Return to Courses</Text>
            </Button>
          </Block>
        </Block>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  startContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  startText: {
    fontSize: 16,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 6,
  },
  resultsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 18,
    marginBottom: 25,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
  },
  // Modal styles
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  badgeImage: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  }
});

export default CourseQuiz;
