import {ScrollView, StyleSheet, View, useWindowDimensions, TouchableOpacity } from 'react-native';
import Image from './Image';
import React, {useRef} from 'react';
import Animated, { SharedValue, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
import { Gesture, GestureDetector, NativeViewGestureHandler } from 'react-native-gesture-handler';
import {useTheme} from '../hooks/';
import Block from '../components/Block';
import Markdown from 'react-native-markdown-display';
import { icons } from '../navigation/TabButton';


type Props = {
  newData: string[];
  setNewData: React.Dispatch<React.SetStateAction<string[]>>;
  maxVisibleItems: number;
  item: string;
  index: number;
  dataLength: number;
  animatedValue: SharedValue<number>;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
};

const LessonCard = ({
  newData,
  setNewData,
  maxVisibleItems,
  item,
  index,
  dataLength,
  animatedValue,
  currentIndex,
  setCurrentIndex,
}: Props) => {
  const {width} = useWindowDimensions();
  const {assets, colors, sizes, gradients} = useTheme();
  const translateX = useSharedValue(0);
  const direction = useSharedValue(0);
  const scrollRef = useRef(null);
  const swipeProgress = useSharedValue(0);

  const cardWidth = width * 0.9;
  const cardHeight = cardWidth * (500 / 360);

  const pan = Gesture.Pan()
  .simultaneousWithExternalGesture(scrollRef)
  .onUpdate(e => {
    if (currentIndex === index) {
      if (e.translationX > 0) {
        // For a rightward swipe (i.e. going back) update swipeProgress.
        swipeProgress.value = e.translationX;
      } else {
        // For leftward swipes, update the current card normally.
        translateX.value = e.translationX;
        animatedValue.value = interpolate(
          Math.abs(e.translationX),
          [0, width],
          [currentIndex, currentIndex + 1]
        );
      }
    }
  })
  .onEnd(e => {
    if (currentIndex === index) {
      // Determine if the gesture was significant.
      if (Math.abs(e.translationX) > 50 || Math.abs(e.velocityX) > 1000) {
        const swipeDirection = e.translationX > 0 ? 1 : -1;
        if (swipeDirection > 0) {
          // RIGHT swipe: GO BACK.
          if (currentIndex > 0) {
            // Animate swipeProgress to full width.
            swipeProgress.value = withTiming(width, { duration: 100 }, () => {
              // Wait a bit before reordering
              runOnJS(setCurrentIndex)(currentIndex-1);
              animatedValue.value = withTiming(currentIndex - 1);
              swipeProgress.value = 0;

            });
          } else {
            // At the very first card—reset.
            swipeProgress.value = withTiming(0, { duration: 300 });
          }
        } else {
          // LEFT swipe: GO FORWARD (advance).
          if (currentIndex < newData.length - 1) {
            translateX.value = withTiming(-width, {}, () => {
              runOnJS(setCurrentIndex)(currentIndex + 1);
              translateX.value = withDelay(50, withTiming(0, { duration: 550 }));
            });
            animatedValue.value = withTiming(currentIndex + 1);
          } else {
            translateX.value = withTiming(0, { duration: 500 });
            animatedValue.value = withTiming(currentIndex, { duration: 500 });
          }
        }
      } else {
        // Gesture wasn’t significant: reset.
        if (e.translationX > 0) {
          swipeProgress.value = withTiming(0, { duration: 300 });
        } else {
          translateX.value = withTiming(0, { duration: 500 });
          animatedValue.value = withTiming(currentIndex, { duration: 500 });
        }
      }
    }
  });

  const animatedStyle = useAnimatedStyle(() => {
    const currentItem = index === currentIndex;
    const previousItem = index === currentIndex - 1;
    
    const translateY = interpolate(
      animatedValue.value,
      [index - 1, index],
      [-30, 0]
    );

    const scale = interpolate(
      animatedValue.value,
      [index - 1, index],
      [0.9, 1]
    );

    const rotateZ = interpolate(
      Math.abs(translateX.value),
      [0, width],
      [0, 20]
    );

    const opacity = interpolate(
      animatedValue.value + maxVisibleItems,
      [index, index + 1],
      [0, 1]
    );
    
    let cardTranslateX = 0;
    if (currentItem) {
      // For the active card, if a right swipe is in progress (swipeProgress > 0),
      // keep it stationary. Otherwise (or for left swipes) use the normal translation.
      cardTranslateX = swipeProgress.value > 0 ? 0 : translateX.value;

    } else if (previousItem) {
      // For the previous card, animate its horizontal movement using swipeProgress.
      // As swipeProgress goes from 0 to width, translate from -width (off-screen left) to 0.
      cardTranslateX = interpolate(swipeProgress.value, [0, width], [-width, 0]);
    } else {
      cardTranslateX = 0;
    }
    
    return {
      transform: [
        { translateY: currentItem ? 0 : translateY },
        { scale: currentItem ? 1 : scale },
        { translateX: cardTranslateX },
        { rotateZ: currentItem ? `${direction.value * rotateZ}deg` : '0deg' },
      ],
      opacity: index < currentIndex + maxVisibleItems ? 1 : opacity,
    };
  });

   

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: cardWidth,
            height: cardHeight,
            borderRadius: 28,
            backgroundColor: colors.light,
            zIndex: dataLength - index,
            justifyContent: 'flex-start',
          },
          animatedStyle,
        ]}
      >
        <Block card style={{ flex: 1, width: '100%', position: 'relative'}}>
          <NativeViewGestureHandler ref={scrollRef}>
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{
                paddingHorizontal: sizes.s,
                paddingVertical: 10,
                width: '100%',
              }}
              showsVerticalScrollIndicator={true}
            >
              <Markdown
                style={{
                  body: {
                    width: '100%',
                    textAlign: 'left',
                    fontSize: 18,
                  },
                }}
              >
                {newData[index]}
              </Markdown>
              <Block row justify="space-between" style={styles.arrowRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (currentIndex > 0) {
                      setCurrentIndex(currentIndex - 1);
                    }
                  }}
                  disabled={currentIndex === 0}
                >
                  <Image
                    source={assets.arrow}
                    color={colors.primary}
                    height={20} width={20}
                    style={[styles.leftArrow, { opacity: currentIndex > 0 ? 1 : 0.0 }]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (currentIndex < newData.length - 1) {
                      setCurrentIndex(currentIndex + 1);
                    }
                  }}
                  disabled={currentIndex >= newData.length - 1}
                >
                  <Image
                    source={assets.arrow}
                    color={colors.primary}
                    height={20} width={20}
                    style={[styles.rightArrow, { opacity: currentIndex < newData.length - 1 ? 1 : 0.0 }]}
                  />
                </TouchableOpacity>
              </Block>
            </ScrollView>
          </NativeViewGestureHandler>


        </Block>
      </Animated.View>
    </GestureDetector>
  );
};

export default LessonCard;

const styles = StyleSheet.create({
  container: {

  },
  // ARROW SWIPE HINT
  arrowRow: {
    marginTop: 16, 
    flexDirection: 'row',
    justifyContent: 'space-evenly', 
    alignItems: 'center',
    width: '60%', 
    alignSelf: 'center', 
  },
  leftArrow: {
    transform: [{ rotate: '180deg' }],
  },
  rightArrow: {},
});
