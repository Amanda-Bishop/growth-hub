import React from 'react';
import {createStackNavigator, StackNavigationProp} from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import {
  Home,
  Profile,
  FriendProfile,
  FriendList,
  Register,
  Login,
  Challenges,
  Courses,
  Survey,
  FriendsFeed,
} from '../screens';

import {useScreenOptions, useTranslation} from '../hooks';

const Stack = createStackNavigator();

export default () => {
  const {t} = useTranslation();
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions.stack}>
      <Stack.Screen
        name="Register"
        component={Register}
        options={{headerShown: false}}
      />
      
      <Stack.Screen
        name="Login"
        component={Login}
        options={{headerShown: false}}
      />
      
      <Stack.Screen
        name="Home"
        component={Home}
        options={{title: t('navigation.home')}}
      />

      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="Challenges"
        component={Challenges}
        options={{title: t('navigation.challenges')}}
      />
      <Stack.Screen
        name="Courses"
        component={Courses}
        options={{title: t('navigation.courses')}}
      />
      <Stack.Screen
        name="Survey"
        component={Survey}
        options={{title: t('navigation.survey')}}
      />

      <Stack.Screen
        name="FriendsFeed"
        component={FriendsFeed}
        options={{title: t('navigation.friendsfeed')}}
      />

      <Stack.Screen
        name="FriendProfile"
        component={FriendProfile}
        options={{headerShown: false, title: t('navigation.friend_profile'), ...screenOptions.back}}
      />
      
      <Stack.Screen
        name="FriendList"
        component={FriendList}
        options={{headerShown: false, title: t('navigation.friend_list'), ...screenOptions.back}}
      />
    </Stack.Navigator>
  );
};
