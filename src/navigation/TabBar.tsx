import { View, Text, TouchableOpacity, StyleSheet, Platform, LayoutChangeEvent } from 'react-native'
import React, {useState, useEffect} from 'react'
import TabButton from './TabButton';
import { useTheme } from '../hooks/';

import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const isAndroid = Platform.OS === 'android';


const TabBar = ({ state, descriptors, navigation }) => {
  const [dimensions, setDimensions] = useState({height: 30, width: 100});
  const {colors} = useTheme();

  const buttonWidth = (dimensions.width - 30) / 5; 
  
  useEffect(() => {
    tabPositionX.value = withTiming(buttonWidth * state.index + 13.5, { duration: 200 });
  }, [state.index, buttonWidth]);

  const onTabBarLayout = (e: LayoutChangeEvent) => {
    setDimensions({height: e.nativeEvent.layout.height, width: e.nativeEvent.layout.width})
  }

  const tabPositionX = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(()=>{
    return {
      transform: [{translateX: tabPositionX.value}]
    }
  });

  return (
    <View style={[styles.tabbar, {borderColor: colors.tabcolor}]} onLayout={onTabBarLayout}>
      <Animated.View style={[animatedStyle, {
        position: "absolute", backgroundColor: colors.primary, top: -0.2, left: 20, height: 2, width: buttonWidth/2
      }]}/>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        if(['_sitemap', '+not-found'].includes(route.name)) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabButton 
            key={route.name}
            style={styles.tabbarItem}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            color={isFocused? colors.primary: colors.tabcolor}
            label={label}
          />
        )


      })}
    </View>
  )
}

const styles = StyleSheet.create({
    tabbar: {

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: isAndroid? 20 : 25,
        shadowColor: 'black',
        borderTopWidth: 0.2,
        borderColor: 'grey',
        
    },
    tabbarItem: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    }
})

export default TabBar