import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Register from '../screens/Register';
import Login from '../screens/Login';
import Survey from '../screens/Survey';
import { useTranslation } from '../hooks';

const AuthStackNavigator = createStackNavigator();

const AuthStack = () => {
  const { t } = useTranslation();
  return (
    <AuthStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNavigator.Screen 
        name="Register" 
        component={Register} 
        options={{ title: t('navigation.register') }} 
      />
      <AuthStackNavigator.Screen 
        name="Login" 
        component={Login} 
        options={{ title: t('navigation.login') }} 
      />
      <AuthStackNavigator.Screen 
        name="Survey" 
        component={Survey} 
        options={{ title: t('navigation.survey') }} 
      />
    </AuthStackNavigator.Navigator>
  );
};

export default AuthStack;