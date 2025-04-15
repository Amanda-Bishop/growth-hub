import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Quiz from '../components/Question';
import { Question } from '../components/questiontype';
import { Modal, Block, Image, Button, Text } from '../components';
import { useTheme, useData } from '../hooks/';
import { useNavigation, NavigationProp } from '@react-navigation/core';
import { CourseStackParamList } from '../navigation/StackParamLists'
import { StackNavigationProp } from '@react-navigation/stack';
import { getEndOfCourseQuiz, getLessonQuestions } from '../queries/courses';
import { getQuestionById } from '../queries/questions';
import { useRoute, RouteProp } from '@react-navigation/native';
import { SIZES } from '../constants/light';
import { submitLessonQuiz, submitEndOfCourseQuiz } from '../queries/submissions';

const sampleQuestions: Question[] = [
];

const LessonQuiz: React.FC = () => {
  const { user } = useData();
  const { assets, colors, sizes } = useTheme();
  const [quizComplete, setQuizComplete] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [scorePercentage, setScorePercentage] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  type CourseNavigationProp = StackNavigationProp<CourseStackParamList, 'LessonQuiz'>;
  const navigation = useNavigation<CourseNavigationProp>();

  const route = useRoute<RouteProp<CourseStackParamList, 'LessonQuiz'>>();
  const { params = {} } = route;
  const lesson_id = params.lesson_id || 1;
  const course_id = params.course_id || "basic_anatomy";
  const totalLessons = params.totalLessons || 1;

  // Fetch questions only once when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        
        if (!course_id || !lesson_id) {
          console.error("Missing course_id or lesson_id - using sample questions");
          setQuestions(sampleQuestions);
          return;
        }
        
        const quiz = await getLessonQuestions(course_id, lesson_id);
        
        if (quiz && quiz.length > 0) {
          const questionPromises = quiz.map((questionId: number) => 
            getQuestionById(questionId.toString())
          );
          
          const fetchedQuestions = await Promise.all(questionPromises);
          const validQuestions = fetchedQuestions.filter((question): question is Question => 
            question !== null
          );
          
          if (validQuestions.length > 0) {
            setQuestions(validQuestions);
          } else {
            console.warn("No valid questions found - using sample questions");
            setQuestions(sampleQuestions);
          }
        } else {
          console.warn("No quiz questions found - using sample questions");
          setQuestions(sampleQuestions);
        }
      } catch (error) {
        console.error("Error fetching quiz questions:", error);
        setQuestions(sampleQuestions);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [course_id, lesson_id]);
  
  const handleQuizComplete = (results: any[]) => {
    setQuizComplete(true);
    setQuizResults(results);
    
    const correctAnswers = results.filter(result => result.isCorrect).length;
    setScore(correctAnswers);
    
    const totalQuestions = questions.length || sampleQuestions.length;
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
  
  const handleCompleteLesson = () => {
    if (totalLessons > 0 && lesson_id === totalLessons) {
      submitEndOfCourseQuiz(user.id, lesson_id, course_id);
      navigation.navigate('CourseQuiz', { course_id: course_id });
    } else {
      submitLessonQuiz(user.id, lesson_id, course_id);
      navigation.navigate('Course', { course_id: course_id, lesson_id: lesson_id + 1 });
    }
  };

  const quizQuestions = questions.length > 0 ? questions : sampleQuestions;
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* BACK Button */}
        <Button
          row
          flex={0}
          justify="flex-start"
          marginLeft={sizes.s}
          onPress={() => navigation.goBack()}>
          <Image
            radius={0}
            width={10}
            height={18}
            color={colors.gray}
            source={assets.arrow}
            transform={[{rotate: '180deg'}]}
          />
          <Text h5 black marginLeft={sizes.s}>
            {"Back"}
          </Text>
        </Button>
        <Text style={styles.title} h4>End of Lesson Quiz</Text>
        
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
              <Text style={styles.buttonText} color={colors.white}>
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
                  primary
                  marginBottom={sizes.s}
                  onPress={handleCompleteLesson}
                >
                  <Text bold style={styles.buttonText} color={colors.white}>Complete Lesson</Text>
                </Button>
                {/* Reset quiz button */}
                <Button 
                  gray
                  onPress={resetQuiz}
                >
                  <Text bold style={styles.buttonText}>Take Quiz Again</Text>
                </Button>
              </View>
            ) : (
              <View style={styles.buttonsContainer}>
                <Button 
                primary
                onPress={resetQuiz}
              >
                <Text style={styles.buttonText} color={colors.white}>Take Quiz Again</Text>
              </Button>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.quizContainer}>
            <Quiz 
              questions={quizQuestions}
              onComplete={handleQuizComplete}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 36,
    paddingBottom: 100,
  },
  quizContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  startContainer: {
    backgroundColor: '#F5F5F9',
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
    backgroundColor: '#F5F5F9',
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
  buttonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  }
});

export default LessonQuiz;
