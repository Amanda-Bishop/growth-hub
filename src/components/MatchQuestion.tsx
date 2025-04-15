import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MatchQuestion {
  question_id: number;
  description: string;
  question_type: 'MATCH';
  answer_key: Array<{
    field_1: string;
    field_2: string;
  }>;
}

interface MatchingQuestionProps {
  question: MatchQuestion; 
  onAnswer: (matches: Array<{field_1: string, field_2: string}>) => void;
  selectedMatches?: Array<{field_1: string, field_2: string}>;
  showResult?: boolean;
  isCorrect?: boolean;
}

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({ 
  question, 
  onAnswer, 
  selectedMatches = [], 
  showResult, 
  isCorrect 
}) => {
  // State to track available and matched items
  const [leftItems, setLeftItems] = useState<string[]>([]);
  const [rightItems, setRightItems] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Array<{left: string, right: string}>>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  // Initialize state when question changes
  useEffect(() => {
    // Initialize with all items from answer key
    setLeftItems(question.answer_key.map(item => item.field_1));
    setRightItems(question.answer_key.map(item => item.field_2));
    setMatchedPairs([]);
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [question]);

  // Handle selection of left items
  const handleLeftItemSelect = (item: string) => {
    // If this left item is already matched, do nothing
    if (matchedPairs.some(pair => pair.left === item)) return;

    // If same item is selected, deselect
    if (selectedLeft === item) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(item);
      
      // If a right item is also selected, try to match
      if (selectedRight) {
        tryToMatch(item, selectedRight);
      }
    }
  };

  // Handle selection of right items
  const handleRightItemSelect = (item: string) => {
    // If this right item is already matched, do nothing
    if (matchedPairs.some(pair => pair.right === item)) return;

    // If same item is selected, deselect
    if (selectedRight === item) {
      setSelectedRight(null);
    } else {
      setSelectedRight(item);
      
      // If a left item is also selected, try to match
      if (selectedLeft) {
        tryToMatch(selectedLeft, item);
      }
    }
  };

  // Try to match selected items
  const tryToMatch = (left: string, right: string) => {
    // Check if this is a correct match according to the answer key
    const isCorrectMatch = question.answer_key.some(
      pair => pair.field_1 === left && pair.field_2 === right
    );

    if (isCorrectMatch) {
      // Add to matched pairs
      const newMatchedPairs = [...matchedPairs, { left, right }];
      setMatchedPairs(newMatchedPairs);

      // Reset selections
      setSelectedLeft(null);
      setSelectedRight(null);

      // Update parent with matches
      const updatedMatches = newMatchedPairs.map(pair => ({
        field_1: pair.left,
        field_2: pair.right
      }));
      onAnswer(updatedMatches);
    } else {
      // Reset selections if not a correct match
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  // Determine item style based on selection and matching status
  const getLeftItemStyle = (item: string) => {
    const isSelected = selectedLeft === item;
    const isMatched = matchedPairs.some(pair => pair.left === item);

    return [
      styles.matchItem,
      isSelected && styles.selectedItem,
      isMatched && styles.matchedItem
    ];
  };

  const getRightItemStyle = (item: string) => {
    const isSelected = selectedRight === item;
    const isMatched = matchedPairs.some(pair => pair.right === item);

    return [
      styles.matchItem,
      isSelected && styles.selectedItem,
      isMatched && styles.matchedItem
    ];
  };

  const getLeftItemTextStyle = (item: string) => {
    const isMatched = matchedPairs.some(pair => pair.left === item);
    return [
      styles.matchText,
      isMatched && styles.matchedText
    ];
  };

  const getRightItemTextStyle = (item: string) => {
    const isMatched = matchedPairs.some(pair => pair.right === item);
    return [
      styles.matchText,
      isMatched && styles.matchedText
    ];
  };

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.description}</Text>
      <Text style={styles.instruction}>Select matching pairs:</Text>
      
      <View style={styles.matchContainer}>
        {/* Left column */}
        <View style={styles.matchColumn}>
          <Text style={styles.columnHeader}>Left Column</Text>
          {leftItems.map((item) => (
            <TouchableOpacity
              key={item}
              style={getLeftItemStyle(item)}
              onPress={() => !showResult && handleLeftItemSelect(item)}
              disabled={showResult || matchedPairs.some(pair => pair.left === item)}
            >
              <Text style={getLeftItemTextStyle(item)}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Right column */}
        <View style={styles.matchColumn}>
          <Text style={styles.columnHeader}>Right Column</Text>
          {rightItems.map((item) => (
            <TouchableOpacity
              key={item}
              style={getRightItemStyle(item)}
              onPress={() => !showResult && handleRightItemSelect(item)}
              disabled={showResult || matchedPairs.some(pair => pair.right === item)}
            >
              <Text style={getRightItemTextStyle(item)}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Result Display */}
      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={[
            styles.resultText, 
            isCorrect ? styles.correctResultText : styles.incorrectResultText
          ]}>
            {isCorrect ? "Correct!" : "Incorrect!"}
          </Text>
          {!isCorrect && (
            <View style={styles.correctAnswersContainer}>
              <Text style={styles.correctAnswerHeader}>Correct Matches:</Text>
              {question.answer_key.map((match, index) => (
                <Text key={index} style={styles.correctAnswerText}>
                  {match.field_1} → {match.field_2}
                </Text>
              ))}
            </View>
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
  matchContainer: {
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 200,
  },
  matchColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  columnHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  matchItem: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    marginVertical: 6,
    borderRadius: 6,
    minHeight: 50,
    justifyContent: 'center',
  },
  selectedItem: {
    backgroundColor: '#b3e0ff',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  matchedItem: {
    backgroundColor: '#c8e6c9',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  matchText: {
    fontSize: 16,
    textAlign: 'center',
  },
  matchedText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  correctResultText: {
    color: '#4caf50',
  },
  incorrectResultText: {
    color: '#f44336',
  },
  correctAnswersContainer: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 6,
  },
  correctAnswerHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  correctAnswerText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 4,
    color: '#616161',
  },
});

export default MatchingQuestion;
