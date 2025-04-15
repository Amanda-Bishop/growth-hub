import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';

interface MSQuestion {
  question_id: number;
  description: string;
  question_type: 'MS';
  a: { answer: string; is_correct: boolean };
  b: { answer: string; is_correct: boolean };
  c: { answer: string; is_correct: boolean };
  d: { answer: string; is_correct: boolean };
}

interface MultipleSelectQuestionProps {
  question: MSQuestion; 
  onAnswer: (values: string[]) => void;
  selectedAnswers?: string[];
  showResult?: boolean;
  isCorrect?: boolean;
}

const MultipleSelectQuestion: React.FC<MultipleSelectQuestionProps> = ({ 
  question, 
  onAnswer, 
  selectedAnswers = [], 
  showResult, 
  isCorrect 
}) => {
  const options = [
    { key: 'a', ...question.a },
    { key: 'b', ...question.b },
    { key: 'c', ...question.c },
    { key: 'd', ...question.d }
  ];

  const correctAnswers = options
    .filter(option => option.is_correct)
    .map(option => option.key);

  const handleToggle = (key: string) => {
    const newSelectedAnswers = selectedAnswers.includes(key)
      ? selectedAnswers.filter(item => item !== key)
      : [...selectedAnswers, key];
    
    onAnswer(newSelectedAnswers);
  };

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.description}</Text>
      <Text style={styles.instruction}>Select all that apply:</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity 
            key={option.key}
            style={[
              styles.msOption,
              selectedAnswers.includes(option.key) && styles.selectedButton,
              showResult && selectedAnswers.includes(option.key) && !option.is_correct && styles.incorrectButton,
              showResult && option.is_correct && styles.correctButton
            ]}
            onPress={() => handleToggle(option.key)}
            disabled={showResult}
          >
            <Checkbox
              status={selectedAnswers.includes(option.key) ? 'checked' : 'unchecked'}
              onPress={() => handleToggle(option.key)}
              disabled={showResult}
            />
            <Text style={styles.optionText}>{option.answer}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {showResult && (
        <View>
          <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.incorrectText]}>
            {isCorrect ? "Correct!" : "Incorrect!"}
          </Text>
          {!isCorrect && (
            <Text style={styles.correctAnswerText}>
              Correct answers: {correctAnswers.map(a => a.toUpperCase()).join(', ')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  questionContainer: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
    marginTop: -6,
  },
  optionsContainer: {
    marginTop: 10,
  },
  msOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 12,
    marginVertical: 6,
    borderRadius: 6,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  selectedButton: {
    backgroundColor: '#AEEBE6',
    borderColor: '#007bff',
    borderWidth: 1,
  },
  correctButton: {
    backgroundColor: '#c8e6c9',
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  incorrectButton: {
    backgroundColor: '#ffcdd2',
    borderColor: '#f44336',
    borderWidth: 1,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  correctText: {
    color: '#4caf50',
  },
  incorrectText: {
    color: '#f44336',
  },
  correctAnswerText: {
    fontSize: 14,
    marginTop: 4,
    color: '#616161',
  },
});

export default MultipleSelectQuestion;