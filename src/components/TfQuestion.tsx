import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TfQuestion {
  question_id: number;
  description: string;
  question_type: 'TF';
  answer: boolean;
}

interface TrueFalseQuestionProps {
  question: TfQuestion; 
  onAnswer: (value: boolean) => void;
  selectedAnswer?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
}

const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({ 
  question, 
  onAnswer, 
  selectedAnswer, 
  showResult, 
  isCorrect 
}) => {
  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.description}</Text>
      <View style={styles.tfContainer}>
        <TouchableOpacity 
          style={[
            styles.tfButton, 
            selectedAnswer === true && styles.selectedButton,
            showResult && selectedAnswer === true && !isCorrect && styles.incorrectButton,
            showResult && question.answer === true && styles.correctButton
          ]}
          onPress={() => onAnswer(true)}
          disabled={showResult}
        >
          <Text style={styles.tfButtonText}>True</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tfButton, 
            selectedAnswer === false && styles.selectedButton,
            showResult && selectedAnswer === false && !isCorrect && styles.incorrectButton,
            showResult && question.answer === false && styles.correctButton
          ]}
          onPress={() => onAnswer(false)}
          disabled={showResult}
        >
          <Text style={styles.tfButtonText}>False</Text>
        </TouchableOpacity>
      </View>
      {showResult && (
        <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.incorrectText]}>
          {isCorrect ? "Correct!" : "Incorrect!"}
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
  tfContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  tfButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    width: '40%',
    alignItems: 'center',
  },
  tfButtonText: {
    fontSize: 16,
    fontWeight: '600',
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

export default TrueFalseQuestion;