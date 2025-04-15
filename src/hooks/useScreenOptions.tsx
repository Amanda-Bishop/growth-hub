import React from 'react';
import {TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/core';
import {DrawerActions} from '@react-navigation/native';
import {StackHeaderOptions} from '@react-navigation/stack/lib/typescript/src/types';

import {useData} from './useData';
import {useTranslation} from './useTranslation';

import Image from '../components/Image';
import Text from '../components/Text';
import useTheme from '../hooks/useTheme';
import Button from '../components/Button';
import Block from '../components/Block';

export default () => {
  const {t} = useTranslation();
  const {user, basket} = useData();
  const navigation = useNavigation();
  const {icons, colors, gradients, sizes} = useTheme();

  const menu = {
    headerStyle: {elevation: 0},
    headerLeftContainerStyle: {paddingLeft: sizes.s},
    headerTitle: () => null,
    headerLeft: () => (
      <Button onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
        <Image source={icons.menu} radius={0} color={colors.icon} />
      </Button>
    ),
    
  } as StackHeaderOptions;

  const options = {
    stack: menu,
    back: {
      ...menu,
      headerRight: () => null,
      headerLeft: () => (
        <Button onPress={() => navigation.goBack()}>
          <Image
            radius={0}
            width={10}
            height={18}
            color={colors.icon}
            source={icons.arrow}
            transform={[{rotate: '180deg'}]}
          />
        </Button>
      ),
    },
  };

  return options;
};
