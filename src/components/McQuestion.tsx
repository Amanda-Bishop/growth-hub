import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MCQuestion {
  question_id: number;
  description: string;
  question_type: 'MC';
  a: { answer: string; is_correct: boolean };
  b: { answer: string; is_correct: boolean };
  c: { answer: string; is_correct: boolean };
  d: { answer: string; is_correct: boolean };
}

interface MultipleChoiceQuestionProps {
  question: MCQuestion; 
  onAnswer: (value: string) => void;
  selectedAnswer?: string;
  showResult?: boolean;
  isCorrect?: boolean;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({ 
  question, 
  onAnswer, 
  selectedAnswer, 
  showResult, 
  isCorrect 
}) => {
  const options = [
    { key: 'a', ...question.a },
    { key: 'b', ...question.b },
    { key: 'c', ...question.c },
    { key: 'd', ...question.d }
  ];

  const correctAnswer = options.find(option => option.is_correct)?.key || '';

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.description}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity 
            key={option.key}
            style={[
              styles.mcOption,
              selectedAnswer === option.key && styles.selectedButton,
              showResult && selectedAnswer === option.key && !isCorrect && styles.incorrectButton,
              showResult && option.is_correct && styles.correctButton
            ]}
            onPress={() => onAnswer(option.key)}
            disabled={showResult}
          >
            <Text style={styles.optionLabel}>{option.key.toUpperCase()}.</Text>
            <Text style={styles.optionText}>{option.answer}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {showResult && (
        <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.incorrectText]}>
          {isCorrect ? "Correct!" : `Incorrect! The correct answer is ${correctAnswer.toUpperCase()}.`}
        </Text>
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
  optionsContainer: {
    marginTop: 10,
  },
  mcOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 12,
    marginVertical: 6,
    borderRadius: 6,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
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
});

export default MultipleChoiceQuestion;