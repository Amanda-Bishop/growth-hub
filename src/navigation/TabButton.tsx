import { View, Text, Pressable, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AntDesign, Feather, Entypo, Ionicons, Octicons, MaterialCommunityIcons} from "@expo/vector-icons";

export const icons = {
    "HomeTab": (props) => <Ionicons name="home-outline" size={30} {...props} />,
    "FriendsFeedTab": (props)=> <Feather name="message-circle" size={30} {...props} />,
    "ChallengesTab": (props)=> <MaterialCommunityIcons name="podium-gold" size={30} {...props} />,
    "ProfileTab": (props)=> <AntDesign name="user" size={30} {...props} />,
    "CoursesTab": (props)=> <Ionicons name="school-outline" size={30} {...props}/>,
    "CourseTab": (props)=> <Ionicons name="school-outline" size={30} {...props}/>
}


const TabButton = (props) => {
    const {isFocused, label, routeName, color} = props;

    const scale = useSharedValue(0);

    useEffect(()=>{
        scale.value = withSpring(
            typeof isFocused === 'boolean'? (isFocused? 1: 0): isFocused,
            {duration: 350}
        );
    },[scale, isFocused]);

    const animatedIconStyle = useAnimatedStyle(()=>{

        const scaleValue = interpolate(
            scale.value,
            [0, 1],
            [1, 1.4]
        );
        const top = interpolate(
            scale.value,
            [0, 1],
            [0, 1.4]
        );

        return {
            transform: [{scale: scaleValue}],
            top
        }
    })
    const animatedTextStyle = useAnimatedStyle(()=>{

        const opacity = interpolate(
            scale.value,
            [0, 1],
            [1, 0]
        );

        return {
            opacity
        }
    })
  return (
    <Pressable {...props} style={styles.container}>
        <Animated.View style={[animatedIconStyle]}>
            {
                icons[routeName]({
                    color
                })
            }
        </Animated.View>
        
       
    </Pressable>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4
    }
})

export default TabButton