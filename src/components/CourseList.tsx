import React, { useEffect, useState, useCallback } from 'react';
import Course from './Course';
import Block from './Block';
import Button from './Button';
import { View } from 'react-native';
import { getCourseList } from '../queries/courses';
import Text from './Text';
import { useData } from '../hooks/useData';


interface CourseData {
  name: string;
  description: string;
  duration: string;
  id: string;
  aggregatedRating?: {
    averageRating: number;
    numRatings: number;
    total: number;
  };
}

interface CourseListProps {
  onNavigate: (course_id: string) => void;
  searchQuery?: string;
  filters?: {
    minRating: number | null;
    maxDuration: number | null;
  };
  onlyActive?: boolean
  max?: number
}

const CourseList: React.FC<CourseListProps> = ({ 
  searchQuery = '', 
  filters = { minRating: null, maxDuration: null } ,
  onNavigate,
  onlyActive = false,
  max = 10 
}) => {
  const { user, setUser } = useData(); 
  const [allCourses, setAllCourses] = useState<CourseData[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseData[]>([]);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const { completedCourses, setCompletedCourses, currentCourses, setCurrentCourses } = useData();


  useEffect(() => {
    const fetchCourseList = async () => {
      try {
        let res = await getCourseList(user.id) as CourseData[];
        if (onlyActive && currentCourses && currentCourses.length > 0){

          res = res.filter((c: CourseData) => {return currentCourses.includes(c.id);});
        }

        if (max && currentCourses && currentCourses.length > max){
          res = res.slice(0, max);
        }
        const typedResponse = res as CourseData[];

        setAllCourses(typedResponse);
        setFilteredCourses(typedResponse);
      } catch (error) {
        console.error('Error fetching course list:', error);
      }
    };
    fetchCourseList();
  }, [currentCourses]);

  // Parse duration string to number of hours
  const parseDuration = useCallback((duration: string): number => {
    const hoursMatch = duration.match(/(\d+(\.\d+)?)\s*hours?/i);
    if (hoursMatch && hoursMatch[1]) {
      return parseFloat(hoursMatch[1]);
    }
    
    const hoursMatch2 = duration.match(/(\d+(\.\d+)?)\s*h/i);
    if (hoursMatch2 && hoursMatch2[1]) {
      return parseFloat(hoursMatch2[1]);
    }
    
    return 0; 
  }, []);

  // Separate the filter values from the filters object
  const { minRating, maxDuration } = filters;

  useEffect(() => {
    let filtered = [...allCourses];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course => 
          course.name.toLowerCase().includes(query) || 
          course.description.toLowerCase().includes(query)
      );
    }
    
    // Apply rating filter - with proper null check
    if (minRating !== null && typeof minRating === 'number') {
      filtered = filtered.filter(
        course => course.aggregatedRating && 
                 course.aggregatedRating.averageRating >= minRating
      );
    }
    
    // Apply duration filter - with proper null check
    if (maxDuration !== null && typeof maxDuration === 'number') {
      filtered = filtered.filter(course => {
        const durationHours = parseDuration(course.duration);
        return durationHours <= maxDuration;
      });
    }
    
    setFilteredCourses(filtered);
  }, [searchQuery, allCourses, minRating, maxDuration, parseDuration]);

  const toggleDescription = useCallback((courseId: string) => {
    setExpandedCourseId(prevId => prevId === courseId ? null : courseId);
  }, []);

  return (
    <View>
      {filteredCourses.length === 0 ? (
        <Block padding={20} align="center">
          <Text p semibold>No active courses found</Text>
        </Block>
      ) : (
        filteredCourses.map((course) => (
          <Block key={course.id} justify="space-between" marginVertical={10}>
            <Course 
              course={course} 
              isExpanded={expandedCourseId === course.id}
              onToggle={() => toggleDescription(course.id)}
              onNavigate={onNavigate}
              isActive={
                completedCourses.length > 0 
                  ? !completedCourses.includes(course.id) 
                  : true
              }
            />
          </Block>
        ))
      )
      }
    </View>
  );
};

export default CourseList;