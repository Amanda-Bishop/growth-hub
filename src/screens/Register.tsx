import React, {useCallback, useEffect, useState} from 'react';
import {Linking, Platform, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/core';

import {useData, useTheme, useTranslation} from '../hooks/';
import * as regex from '../constants/regex';
import {Block, Button, Input, Image, Text } from '../components/';
import { addNewUser } from '../queries/auth';

const isAndroid = Platform.OS === 'android';

interface IRegistration {
  username: string;
  email: string;
  password: string;
}
interface IRegistrationValidation {
  username: boolean;
  email: boolean;
  password: boolean;
}

const Register = () => {
  const {isDark} = useData();
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [isValid, setIsValid] = useState<IRegistrationValidation>({
    username: false,
    email: false,
    password: false,
  });
  const [registration, setRegistration] = useState<IRegistration>({
    username: '',
    email: '',
    password: '',
  });
  const {assets, colors, gradients, sizes} = useTheme();

  const handleChange = useCallback(
    (value) => {
      setRegistration((state) => ({...state, ...value}));
    },
    [setRegistration],
  );

  const handleSignUp = useCallback(async () => {
    if (!Object.values(isValid).includes(false)) {
        console.log("[handleSignUp] | registration:", registration);

        try {
            const success = await addNewUser(
                registration.email,
                registration.password,
                registration.username
            );

            if (success) {
                Alert.alert("Success", "Your account has been created successfully.");
                setRegistration({ email: "", password: "", username: "" });
                setIsValid({ email: false, password: false, username: false });
                navigation.navigate('Survey');
            } else {
                Alert.alert("Error", "Username already taken. Please try another.");
                setRegistration((prev) => ({ ...prev, username: "" }));
                setIsValid((prev) => ({ ...prev, username: false }));
            }
        } catch (error) {
            console.error("[handleSignUp] Registration failed:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        }
    }
}, [isValid, registration, navigation, setIsValid]);

  useEffect(() => {
    setIsValid((state) => ({
      ...state,
      username: regex.username.test(registration.username),
      email: regex.email.test(registration.email),
      password: regex.password.test(registration.password),
    }));
  }, [registration, setIsValid]);

  return (
    

    
    <Image
    background
    resizeMode="cover"
    radius={0}
    source={assets.background}
    style={{ flex: 1 }}
    >
    <Block safe marginTop={0} padding={sizes.sm}>
      <Block paddingHorizontal={0}>
        <Block flex={0} style={{zIndex: 0}}>
            <Button justify="flex-start"></Button>
            
        {/* register form */}

            <Block flex={0}>
              <Image style={{alignSelf: 'center'}} source={assets.logoWhite} height={120} width={120}/>
              <Text h2 transform='uppercase' center white marginTop={sizes.s} marginBottom={sizes.m}>Growth Hub</Text>
            </Block>
            <Block flex={0} keyboard>
              <Block
                flex={0}
                radius={sizes.sm}
                shadow={!isAndroid}
              >
                <Block
                  color={colors.card}
                  flex={1}
                  radius={sizes.sm}
                  overflow="hidden"
                  justify="space-evenly"
                  paddingVertical={sizes.sm}
                  >
                  <Text h5 semibold center>
                    {t('register.subtitle')}
                  </Text>

                  {/* form inputs */}
                  <Block paddingHorizontal={sizes.sm}>
                    <Input
                      autoCapitalize="none"
                      marginBottom={sizes.m}
                      label={t('common.username')}
                      placeholder={t('common.usernamePlaceholder')}
                      success={Boolean(registration.username && isValid.username)}
                      danger={Boolean(registration.username && !isValid.username)}
                      onChangeText={(value) => handleChange({username: value})}
                    />
                    <Input
                      autoCapitalize="none"
                      marginBottom={sizes.m}
                      label={t('common.email')}
                      keyboardType="email-address"
                      placeholder={t('common.emailPlaceholder')}
                      success={Boolean(registration.email && isValid.email)}
                      danger={Boolean(registration.email && !isValid.email)}
                      onChangeText={(value) => handleChange({email: value})}
                    />
                    <Input
                      secureTextEntry
                      autoCapitalize="none"
                      marginBottom={sizes.m}
                      label={t('common.password')}
                      placeholder={t('common.passwordPlaceholder')}
                      onChangeText={(value) => handleChange({password: value})}
                      success={Boolean(registration.password && isValid.password)}
                      danger={Boolean(registration.password && !isValid.password)}
                    />
                  </Block>

                  <Button
                    onPress={handleSignUp}
                    marginVertical={sizes.s}
                    marginHorizontal={sizes.sm}
                    color={colors.primary}
                    disabled={Object.values(isValid).includes(false)}>
                    <Text bold white transform="uppercase">
                      {t('common.signup')}
                    </Text>
                  </Button>
                  <Button
                    primary
                    outlined
                    shadow={!isAndroid}
                    marginVertical={sizes.s}
                    marginHorizontal={sizes.sm}
                    onPress={() => navigation.navigate('Login')}>
                    <Text bold primary transform="uppercase">
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

export default Register;
