import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { Profile, FriendList, FriendProfile, Home, FriendsFeed, Courses, Challenges, Course, Feedback, LessonQuiz, CourseQuiz, Resources} from '../screens';

import TabBar from './TabBar';

import { useTheme, useTranslation } from '../hooks';


const Stack = createStackNavigator();

// Create nested stacks for each tab if needed
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={Home} />
    <Stack.Screen name="Resources" component={Resources} />
  </Stack.Navigator>
);

const CoursesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Courses" component={Courses} />
    <Stack.Screen name="Course" component={Course} />
    <Stack.Screen name="LessonQuiz" component={LessonQuiz} />
    <Stack.Screen name="Feedback" component={Feedback} />
    <Stack.Screen name="CourseQuiz" component={CourseQuiz} />
  </Stack.Navigator>
);

const FriendsFeedStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FriendsFeed" component={FriendsFeed} />
  </Stack.Navigator>
);

const ChallengesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Challenges" component={Challenges} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="FriendList" component={FriendList} />
    <Stack.Screen name="FriendProfile" component={FriendProfile} />
  </Stack.Navigator>
);

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{ headerShown: false, lazy: false}}
      tabBar={(props) => <TabBar {...props} />}
    >

      <Tab.Screen
        name="FriendsFeedTab"
        component={FriendsFeedStack}
        options={{ title: t('navigation.feed') }}
      />
      <Tab.Screen
        name="ChallengesTab"
        component={ChallengesStack}
        options={{ title: t('navigation.challenges') }}
      />
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: t('navigation.home')}}
      />
      <Tab.Screen
        name="CoursesTab"
        component={CoursesStack}
        options={{ title: t('navigation.courses') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ title: t('navigation.profile') }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;