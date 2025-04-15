import React from 'react';
import Block from './Block';
import Text from './Text';
import { useData, useTheme, useTranslation } from '../hooks/';
import Image from './Image';
import { TouchableOpacity } from 'react-native';
import Button from './Button';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { badgeMap } from "../constants/badges";

interface CourseProps {
  course: {
    name: string;
    description: string;
    duration: string;
    id: string;
    aggregatedRating?: {
      averageRating: number;
      numRatings: number;
      total: number;
    };
  };
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (course_id: string) => void;
  isActive?: boolean;
}

const Course: React.FC<CourseProps> = ({ course, isExpanded, onToggle, onNavigate, isActive }) => {
  const { user } = useData();
  const { t } = useTranslation();
  const { assets, colors, gradients, icons, sizes } = useTheme();
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={onToggle}>
    <Block card>
     
      <Block row>
        <Image 
          source={badgeMap[course.id].image}
          style={{
            width: 80,
            height: 80,
            borderRadius: sizes.s,
            margin: sizes.s
          }}
        />
        <Block padding={sizes.s} justify="space-between" flex={1}>
          <Text p semibold>{course.name}</Text>
          <Block row marginTop={sizes.xs} align="center">
            <Block row align="center" marginRight={sizes.s}>
              <Image source={icons.clock} width={16} height={16}/>
              <Text p marginLeft={sizes.xs}>{course.duration}</Text>
            </Block>
            
            {/* Rating with star icon */}
            {course.aggregatedRating && (
              <Block row align="center">
                <Image source={icons.star} width={16} height={16} color={colors.secondary} />
                <Text p marginLeft={sizes.xs}>
                  {course.aggregatedRating.averageRating.toFixed(1)}
                </Text>
              </Block>
            )}
          </Block>
        </Block>
        <TouchableOpacity onPress={onToggle}>
          <Block justify="center" align="center" padding={sizes.s}>
            <Image 
              source={icons.arrow}
              color={colors.primary} 
              marginRight={sizes.s}
              width={16} 
              height={16} 
              style={{ 
                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] 
              }} 
            />
          </Block>
        </TouchableOpacity>
      </Block>
      
      
      {isExpanded && (
        <Block padding={sizes.s} paddingTop={0}>
          <Text p marginTop={sizes.s}>{course.description}</Text>
            {isActive? (
              <Button primary marginTop={sizes.m} onPress={() => {
                  // Check if it needs to be added to the user doc
                  onNavigate(course.id);}}
                  >
                <Text white bold h5 transform="uppercase">Go to course</Text>
              </Button>
             ) : (
              <Button row secondary marginTop={sizes.m} onPress={() => {
                // Reset user progress
                onNavigate(course.id);}}>
                <Text white bold h5 transform="uppercase" paddingHorizontal={sizes.m}>Completed</Text>
                <Ionicons name="checkmark-circle-outline" size={24} color="white" />
              </Button>
            )}
        </Block>
      )}
    </Block>
    </TouchableOpacity>
  );
};

export default Course;