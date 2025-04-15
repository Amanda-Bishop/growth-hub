import React, { useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { useData, useTheme, useTranslation } from '../hooks/';
import { Block, Text, Searchbar, Input} from '../components';
import CourseList from '../components/CourseList';
import FilterPanel from '../components/FilterPanel';
import { addCourseToUser, addLessonToUser, removeCourseFromUser } from '../queries/courses';

const isAndroid = Platform.OS === 'android';

const Courses = () => {
    const { user, completedCourses, setCompletedCourses, currentLessons, currentCourses } = useData();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { assets, colors, gradients, sizes } = useTheme();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        minRating: null as number | null,
        maxDuration: null as number | null
    });
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleFilterChange = (newFilters: { 
        minRating: number | null;
        maxDuration: number | null;
    }) => {
        setFilters(newFilters);
    };

    const toggleFilterPanel = () => {
        setIsFilterExpanded(!isFilterExpanded);
    };

    const onNavigate = async (course_id: string) =>{
        let lesson_id: number;
        if (completedCourses.includes(course_id)){ // RESETTING
            lesson_id = 1
            removeCourseFromUser(user.id, course_id);
            const newCompletedCourses = completedCourses.filter(course_id_i => course_id_i !== course_id);
            setCompletedCourses(newCompletedCourses)
            addCourseToUser(user.id, course_id);
            addLessonToUser(user.id, course_id, 1);
        } else if ( ! currentCourses.includes(course_id) && ! completedCourses.includes(course_id)){
            // STARTING the course
            addCourseToUser(user.id, course_id);
            addLessonToUser(user.id, course_id, 1);
            lesson_id = 1;
        } else  {
            // RESUMING the course
            lesson_id = currentLessons[course_id];
        }

        // nav
        navigation.getParent()?.navigate('Course', { course_id, lesson_id});
    }

    return (
        <Block>
            <Block 
                row 
                flex={0} 
                justify="center"
                align="center"
                color={colors.card} 
                paddingBottom={sizes.sm}
                paddingTop={sizes.xl}
                paddingHorizontal={sizes.padding}
            >
                <Text h4 bold>Courses</Text>
            </Block>
            <Block
            scroll
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingVertical: sizes.padding}}
            keyboard
            >
            <Block paddingTop={sizes.s} paddingHorizontal={sizes.padding}>
                <Searchbar onSearch={handleSearch} placeholder="Search courses..." />
            </Block>
            
            <Block paddingHorizontal={sizes.padding} marginTop={sizes.s}>
                <FilterPanel 
                    onFilterChange={handleFilterChange}
                    isExpanded={isFilterExpanded}
                    onToggleExpand={toggleFilterPanel}
                />
            </Block>
            
            <Block marginHorizontal={sizes.padding}>
                <CourseList searchQuery={searchQuery} filters={filters} onNavigate={onNavigate}/>
            </Block>
        </Block>
        </Block>
    );
};

export default Courses;