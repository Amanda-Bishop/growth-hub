import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Question, TrueFalseQuestion as TFQuestion, MultipleChoiceQuestion as MCQuestion, MultipleSelectQuestion as MSQuestion, MatchingQuestion as MatchQ } from './questiontype';
import TrueFalseQuestion from './TfQuestion';
import MultipleChoiceQuestion from './McQuestion';
import MultipleSelectQuestion from './MsQuestion';
import MatchingQuestion from './MatchQuestion';

// Props for the QuestionComponent
interface QuestionComponentProps {
  question: Question;
  onAnswer: (questionId: number, answer: any) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}

// Main Question Component that renders the appropriate question type
const QuestionComponent: React.FC<QuestionComponentProps> = ({ 
  question, 
  onAnswer,
  showResult = false,
  isCorrect = false
}) => {
  const [tfAnswer, setTfAnswer] = useState<boolean | undefined>();
  const [mcAnswer, setMcAnswer] = useState<string | undefined>();
  const [msAnswers, setMsAnswers] = useState<string[]>([]);
  const [matchAnswers, setMatchAnswers] = useState<Array<{ field_1: string, field_2: string }>>([]);

  // Reset answers when question changes
  useEffect(() => {
    setTfAnswer(undefined);
    setMcAnswer(undefined);
    setMsAnswers([]);
    setMatchAnswers([]);
  }, [question.question_id]);

  const handleAnswerChange = (answer: any) => {
    switch (question.question_type) {
      case 'TF':
        setTfAnswer(answer);
        break;
      case 'MC':
        setMcAnswer(answer);
        break;
      case 'MS':
        setMsAnswers(answer);
        break;
      case 'MATCH':
        setMatchAnswers(answer);
        break;
    }
    onAnswer(question.question_id, answer);
  };

  switch (question.question_type) {
    case 'TF':
      return (
        <TrueFalseQuestion 
          question={question} 
          onAnswer={handleAnswerChange}
          selectedAnswer={tfAnswer}
          showResult={showResult}
          isCorrect={isCorrect}
        />
      );
    case 'MC':
      return (
        <MultipleChoiceQuestion 
          question={question} 
          onAnswer={handleAnswerChange}
          selectedAnswer={mcAnswer}
          showResult={showResult}
          isCorrect={isCorrect}
        />
      );
    case 'MS':
      return (
        <MultipleSelectQuestion 
          question={question} 
          onAnswer={handleAnswerChange}
          selectedAnswers={msAnswers}
          showResult={showResult}
          isCorrect={isCorrect}
        />
      );
    case 'MATCH':
      return (
        <MatchingQuestion 
          question={question} 
          onAnswer={handleAnswerChange}
          selectedMatches={matchAnswers}
          showResult={showResult}
          isCorrect={isCorrect}
        />
      );
    default:
      return <Text>Unsupported question type</Text>;
  }
};

// Quiz Component that uses QuestionComponent
interface QuizProps {
  questions: Question[];
  onComplete: (results: {
    questionId: number;
    userAnswer: any;
    isCorrect: boolean;
  }[]) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{
    [questionId: number]: any;
  }>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    questionId: number;
    userAnswer: any;
    isCorrect: boolean;
  }[]>([]);

  const handleAnswer = (questionId: number, answer: any) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const checkMatchingAnswer = (question: Question, userAnswer: any) => {
    // For matching questions, ensure all pairs match correctly
    if (!userAnswer || !Array.isArray(userAnswer)) return false;
  
    const matchQuestion = question as MatchQ;
    
    // Check if the number of matches equals the answer key
    if (userAnswer.length !== matchQuestion.answer_key.length) return false;
  
    // Verify each match is correct
    return userAnswer.every((match, index) => {
      const correctMatch = matchQuestion.answer_key[index];
      return match.field_1 === correctMatch.field_1 && 
             match.field_2 === correctMatch.field_2;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate results
      const quizResults = questions.map(question => {
        const userAnswer = answers[question.question_id];
        let isCorrect = false;
        
        switch (question.question_type) {
          case 'TF':
            isCorrect = userAnswer === question.answer;
            break;
          case 'MC':
            const mcQuestion = question as MCQuestion;
            const correctOption = Object.entries(mcQuestion)
              .filter(([key]) => ['a', 'b', 'c', 'd'].includes(key))
              .find(([_, value]) => (value as any).is_correct)?.[0];
            isCorrect = userAnswer === correctOption;
            break;
          case 'MS':
            const msQuestion = question as MSQuestion;
            const correctOptions = Object.entries(msQuestion)
              .filter(([key]) => ['a', 'b', 'c', 'd'].includes(key))
              .filter(([_, value]) => (value as any).is_correct)
              .map(([key]) => key);
            isCorrect = Array.isArray(userAnswer) && 
                        userAnswer.length === correctOptions.length && 
                        userAnswer.every(a => correctOptions.includes(a));
            break;
          case 'MATCH':
            isCorrect = checkMatchingAnswer(question, userAnswer);
            break;
        }
        
        return {
          questionId: question.question_id,
          userAnswer,
          isCorrect
        };
      });
      
      setResults(quizResults);
      setShowResults(true);
      onComplete(quizResults);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const hasAnswer = answers[currentQuestion.question_id] !== undefined;
  
  if (showResults) {
    return (
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Quiz Results</Text>
        {questions.map((question, index) => (
          <View key={question.question_id} style={styles.resultItem}>
            <Text style={styles.questionText}>
              {index + 1}. {question.question_type}
            </Text>
            <QuestionComponent
              question={question}
              onAnswer={() => {}} 
              showResult={true}
              isCorrect={results.find(r => r.questionId === question.question_id)?.isCorrect}
            />
          </View>
        ))}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Final Score: {results.filter(r => r.isCorrect).length} / {questions.length}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <QuestionComponent
          key={currentQuestion.question_id}
          question={currentQuestion}
          onAnswer={handleAnswer}
        />
        <TouchableOpacity
          style={[styles.button, !hasAnswer && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!hasAnswer}
        >
          <Text style={styles.buttonText}>
            {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#F20089',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultItem: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  scoreContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
  }
});

export default Quiz;
