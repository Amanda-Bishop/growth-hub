import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ProgressBarProps = {
  total: number;
  curr: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  gradientColors?: string[]; 
  currProgress?: number;
  totalProgress?: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  total,
  curr,
  height = 10,
  backgroundColor = '#e0e0e0',
  fillColor = '#3b5998',
  gradientColors,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!total) return; // Prevent NaN issues
    const progress = Math.min(Math.max( (curr + 1) / total, 0), 1);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [curr, total, progressAnim]);

  // Interpolate to a width percentage string
  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      {gradientColors ? (
        // Wrap the LinearGradient inside an Animated.View to animate its width.
        <Animated.View style={{ width: widthInterpolated }}>
          <LinearGradient
            colors={gradientColors}
            style={styles.filler}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.filler, { width: widthInterpolated, backgroundColor: fillColor }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  filler: {
    height: '100%',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
});

export default ProgressBar;
