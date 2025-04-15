import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import StarRating from 'react-native-star-rating-widget';
import Slider from '@react-native-community/slider';
import { CourseStackParamList } from '../navigation/StackParamLists'
import { useRoute, RouteProp } from '@react-navigation/native';

import { Block, Button, Text } from '../components';
import { useData, useTheme } from '../hooks';
import { addCourseFeedback } from '../queries/courses';

const questions = [
  {
    id: 1,
    title: "Overall Course Rating",
    prompt: "How satisfied are you with the course?",
    key: "CourseRating",
  },
  {
    id: 2,
    title: "Content Quality",
    prompt: "How would you rate the quality of the course content?",
    key: "ContentQuality",
  },
  {
    id: 3,
    title: "Delivery Style",
    prompt: "How effective was the teaching style that was used?",
    key: "DeliveryStyle",
  },
  {
    id: 4,
    title: "Ease of Understanding",
    prompt: "Was the course easy to understand and follow?",
    key: "EaseOfUnderstanding",
  },
  {
    id: 5,
    title: "Relevance to Your Goals",
    prompt: "How relevant was this course to your interests and learning goals?",
    key: "Relevance",
  },
];

const Feedback = () => {
  const { user } = useData();
  const navigation = useNavigation();
  const { colors, gradients, sizes } = useTheme();

  const route = useRoute<RouteProp<CourseStackParamList, 'Feedback'>>();
  const courseId = route.params?.course_id || 'basic_anatomy';

  const [ratings, setRatings] = useState({
    CourseRating: 3,
    ContentQuality: 3,
    DeliveryStyle: 3,
    EaseOfUnderstanding: 3,
    Relevance: 3
  });

  const [recommend, setRecommend] = useState<boolean | null>(null);

  const handleSubmit = async () => {
    if (!user?.id) {
      console.log('Error', 'User not found.');
      return;
    }
    try {
      await addCourseFeedback(courseId, { ratings, recommend });
      console.log(courseId);
      console.log('Success', 'Survey responses saved!');
      navigation.navigate('Courses');
    } catch (error) {
      console.log('Error saving survey responses:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: sizes.padding }}>
      {/* Survey Header */}
      <Block card padding={sizes.m} marginBottom={sizes.m} marginTop={sizes.s}>
        <Text h3 bold center marginBottom={sizes.s}>
          Course Survey
        </Text>
        <Text p center marginTop={10}>
          We'd love to hear your feedback! Your responses help us improve the learning experiences here at GrowthHub.
        </Text>
      </Block>

      {/* Ratings Section */}
      {questions.map((question) => (
        <Block key={question.id} card padding={sizes.l} marginBottom={sizes.m}>
          <Text size={19} bold center>{question.title}</Text>
          <Text size={17} center marginTop={sizes.s}>{question.prompt}</Text>
          <Block align="center" marginTop={sizes.m}>
            <StarRating
              rating={ratings[question.key]}
              onChange={(value) => setRatings((prev) => ({ ...prev, [question.key]: value }))}
              maxStars={5}
              color={colors.secondary}
              starSize={50}
            />
          </Block>
        </Block>
      ))}

      {/* Recommend Question */}
      <Block card padding={sizes.l} marginBottom={sizes.m}>
        <Text size={19} bold center>Course Recommendation</Text>
        <Text size={17} center marginTop={sizes.s}>
            How likely are you to recommend this course to a friend?
        </Text>

        {/* Star Rating for Recommendation */}
        <Block align="center" marginTop={sizes.m}>
            <StarRating
            rating={recommend || 3}
            onChange={setRecommend}
            maxStars={5}
            color={colors.secondary}
            starSize={50}
            />
        </Block>
       </Block>

      {/* Submit Button */}
      <Button flex={1} color={colors.primary} marginBottom={sizes.base} onPress={handleSubmit}>
        <Text p white bold transform="uppercase">
          Submit
        </Text>
      </Button>
    </ScrollView>
  );
};

export default Feedback;
