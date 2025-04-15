import React, {useCallback, useEffect, useState} from 'react';
import {Linking, Platform, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/core';

import {useData, useTheme, useTranslation} from '../hooks/';
import * as regex from '../constants/regex';
import {Block, Button, Input, Image, Text, Checkbox} from '../components/';
import { loginUser } from '../queries/auth';

const isAndroid = Platform.OS === 'android';

interface ILogin {
  email: string;
  password: string;
}
interface ILoginValidation {
  email: boolean;
  password: boolean;
}

const Login = () => {
  const {isDark} = useData();
  const {t} = useTranslation();
  const navigation = useNavigation();
  const { user } = useData();
  const [isValid, setIsValid] = useState<ILoginValidation>({
    email: false,
    password: false,
  });
  const [login, setLoginData] = useState<ILogin>({
    email: "",
    password: "",
  });
  const {assets, colors, gradients, sizes} = useTheme();

  const handleChange = useCallback(
    (value) => {
      setLoginData((state) => ({...state, ...value}));
    },
    [setLoginData],
  );

  const handleSignIn = useCallback(async () => {
    const res = await loginUser(login.email, login.password)
    if (res.success){
      Alert.alert("Welcome back!", "Successfully logged in.");
      setLoginData({ email: "", password: "", });
      setIsValid({ email: false, password: false });
    } else {
      Alert.alert("Error", "Incorrect login information. Try again.");
      setLoginData((prev) => ({ ...prev, password: ""}));
      setIsValid((prev) => ({ ...prev, password: false }));
    }
  }, [login, navigation]);

  useEffect(() => {
    setIsValid((prevState) => {
      const updatedState = {
        email: regex.email.test(login.email),
        password: regex.password.test(login.password),
      };
      
      // Avoid unnecessary re-renders if state hasn't changed
      if (JSON.stringify(prevState) !== JSON.stringify(updatedState)) {
        return updatedState;
      }
      return prevState;
    });
  }, [login]);

  // if user state changes
  useEffect(() => {
    if (user) {
      console.log("User is logged in, navigating to Home...");
    }
  }, [user]);

  return (
    <Image
            background
            resizeMode="cover"
            
            
            source={assets.background}
            style={{ flex: 1 }}
            >
    <Block safe padding={sizes.sm} marginTop={sizes.md}>
      <Block paddingHorizontal={0}>
        <Block flex={0} style={{zIndex: 0}}>
            <Block flex={0} row justify='flex-start'>
              <Button
                row onPress={() => navigation.goBack()}>
                <Image
                  radius={0}
                  width={10}
                  height={18}
                  color={colors.white}
                  source={assets.arrow}
                  transform={[{rotate: '180deg'}]}
                />
                <Text p semibold white marginLeft={sizes.s}>
                  Back
                </Text>
              </Button>
            </Block>

            <Block flex={0}>
              <Image style={{alignSelf: 'center'}} source={assets.logoWhite} height={120} width={120}/>
              <Text h2 transform='uppercase' center white marginTop={sizes.s} marginBottom={sizes.m}>Growth Hub</Text>
            </Block>

                    {/* login form */}
        <Block flex={0} keyboard behavior={!isAndroid ? 'padding' : undefined}>
          <Block
            flex={0}
            radius={sizes.sm}
            marginHorizontal="0%"
            shadow={!isAndroid}
          >
            <Block
              color={colors.card}
              flex={0}
              intensity={90}
              radius={sizes.sm}
              overflow="hidden"
              justify="space-evenly"
              tint={colors.blurTint}
              paddingVertical={sizes.sm}>
                
              <Text h5 semibold center>
                {t('login.subtitle')}
              </Text>

              {/* form inputs */}
              <Block paddingHorizontal={sizes.sm}>
                <Input
                  label={t('common.email')}
                  autoCapitalize="none"
                  marginBottom={sizes.m}
                  keyboardType="email-address"
                  placeholder={t('common.emailPlaceholder')}
                  success={Boolean(login.email && isValid.email)}
                  danger={Boolean(login.email && !isValid.email)}
                  onChangeText={(value) => handleChange({email: value})}
                />
                <Input
                  secureTextEntry
                  label={t('common.password')}
                  autoCapitalize="none"
                  marginBottom={sizes.m}
                  placeholder={t('common.passwordPlaceholder')}
                  onChangeText={(value) => handleChange({password: value})}
                  success={Boolean(login.password && isValid.password)}
                  danger={Boolean(login.password && !isValid.password)}
                />
              </Block>

              <Button
                onPress={handleSignIn}
                marginVertical={sizes.s}
                marginHorizontal={sizes.sm}
                color={colors.primary}
                disabled={Object.values(isValid).includes(false)}>
                <Text bold white transform="uppercase">
                  {t('common.signin')}
                </Text>
              </Button>
            </Block>
          </Block>
        </Block>
        </Block>

      </Block>
    </Block>
    </Image>
  );
};

export default Login;
