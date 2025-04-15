import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Block, Button, Image, Text, LessonCard, ProgressBar } from '../components/';
import Modal from 'react-native-modal';
import { useTheme } from '../hooks/';
import { getLesson, getCourseById, getLessonVideo } from '../queries/courses';
import { SPACING } from '../constants/light';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { withSequence, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CourseStackParamList } from '../navigation/StackParamLists';
import { StackNavigationProp } from '@react-navigation/stack';
import { Portal } from 'react-native-paper';
import { useVideoPlayer, VideoView } from 'expo-video';

// Video asset mapping
const videoAssets = {
  'ba1': require('../assets/videos/ba1.mp4'),
};

interface VideoLessonProps {
  videoAssetKey: string | null;
  sizes: any;
  lessonName?: string;
}

const Course = () => {
  const route = useRoute<RouteProp<CourseStackParamList, 'Course'>>();
  const { params } = route;
  const course_id = params.course_id || "basic_anatomy";
  const lesson_id = params.lesson_id || 1;
  
  const {assets, colors, sizes, gradients} = useTheme();
  const [newData, setNewData] =  useState<string[]>([]) // lesson content
  const [lessonName, setLessonName] = useState<string>("");
  const [courseName, setCourseName] = useState<string>("");
  const [totalLessons, setTotalLessons] = useState(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState(0); // current lesson card
  const [videoAssetKey, setVideoAssetKey] = useState<string | null>(null); // store video asset key
  const animatedValue = useSharedValue(0);
  const MAX = 3; // maximum cards visible in stack
  const {width} = useWindowDimensions();

  const buttonX = useSharedValue(width);  // animate from offscreen-right to 0

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: buttonX.value }],
  }));

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  useFocusEffect(
    useCallback(() => {
      // Reset all animated values to their initial state
      setCurrentIndex(0);  
      animatedValue.value = 0;
      buttonX.value = width;
    }, [])
  );

  // loads lesson content
  useEffect(() => {
    const fetchCourseInfo = async () => {
      try {
        if (!course_id) {
          console.error("Missing course_id");
          return;
        }
        
        const courseData = await getCourseById(course_id);
        
        if (courseData && courseData.totalLessons) {
          setTotalLessons(courseData.totalLessons);
        } else {
          console.warn("Could not determine total lessons count");
        }
      } catch (error) {
        console.error("Error fetching course info:", error);
      }
    };

    const fetchCourseName = async () => {
        try {
          const courseData = await getCourseById(course_id);
          setCourseName(courseData?.name || "");
        } catch (error) {  

        }
    };

    const fetchLessonData = async () => {
      try {
        const lessonResult = await getLesson(course_id, lesson_id);
        if (lessonResult){
          setLessonName(lessonResult.name);
          setNewData(lessonResult.paragraphs);
        }

        // Check if there's a video key for this lesson
        const videoKey = await getLessonVideo(course_id, lesson_id);

        // If we get a key for a local asset
        if (videoKey && videoAssets[videoKey]) {
          setVideoAssetKey(videoKey);
        }
        // If no video available
        else {
          setVideoAssetKey(null);
        }
      } catch (error) {
        console.error("Error fetching course's lesson content:", error);
      }
    };

    fetchCourseInfo();
    fetchCourseName();
    fetchLessonData();
  }, [course_id, lesson_id]);

  // handles NEXT button animation
  useEffect(() => {
    // If video is available, show button immediately
    if (videoAssetKey) {
      buttonX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
      return;
    }

    // For regular lesson content, use the original logic
    if (currentIndex === newData.length - 1) {
      // Slide in from right → overshoot → settle back
      buttonX.value = withSequence(
        // 1. Slide from right offscreen to x=0 with an ease-in
        withTiming(-35, { duration: 250, easing: Easing.in(Easing.ease) }),
        withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) }),
      );
    } else {
      // Move off to the right side again if not at last card
      buttonX.value = withTiming(200, { duration: 400, easing: Easing.out(Easing.ease) });
    }
  }, [currentIndex, newData, videoAssetKey]);


  const VideoLesson: React.FC<VideoLessonProps> = ({ videoAssetKey, sizes, lessonName }) => {
    // If no video key is provided, return null
    if (!videoAssetKey || !videoAssets[videoAssetKey]) {
      return null;
    }
  
    // Use the useVideoPlayer hook
    const player = useVideoPlayer(videoAssets[videoAssetKey], (player) => {
      // Optional: Configure initial player state
      player.play();
    });
  
    return (
      <Block card top={-15} marginHorizontal={sizes.padding} style={styles.videoContainer}>
        
        <VideoView
          player={player}
          style={styles.videoPlayer}
          allowsFullscreen
          showsPlaybackControls
          videoSource={videoAssets[videoAssetKey]}
          resizeMode="contain"
        />
      </Block>
    );
  };


  // CONSTANTS //
  const CARD_WIDTH = (sizes.width - sizes.padding * 2 - sizes.sm) / 1.3; 
  const CARD_HEIGHT = 180; 

  const styles = useMemo(() => createStyles(sizes, colors, CARD_HEIGHT, CARD_WIDTH), [sizes]);
  type CourseNavigationProp = StackNavigationProp<CourseStackParamList, 'Course'>;
  const navigation = useNavigation<CourseNavigationProp>();

  return (
    <Block>
      <Block color={colors.card}
        row flex={0} paddingTop={sizes.l} paddingBottom={sizes.s} >
        <Button
          paddingLeft={sizes.padding}
          row
          flex={0}
          justify="flex-start"
          onPress={() => navigation.pop()}
          >
          <Image
            radius={0}
            width={10}
            height={18}
            color={colors.black}
            source={assets.arrow}
            transform={[{rotate: '180deg'}]}
          />
          <Text p semibold marginLeft={sizes.s}>
            Back
          </Text>
        </Button>

        {/* Spacer */}
        <Block flex={1} />

        {(videoAssetKey || currentIndex === newData.length - 1) && (
          <Animated.View style={[{ paddingRight: sizes.m }, animatedButtonStyle]}>
              <Block row align="center" style={{flexDirection: 'row', alignItems: 'center',}}>
              <Button onPress={() => setShowModal(true)} color={colors.primary} marginTop={sizes.s} paddingHorizontal={sizes.m} paddingVertical={sizes.s}>
                <Block row align="center">
                    <Text h4 bold white marginRight={sizes.s}>QUIZ</Text>
                    <Image style={{marginLeft: 4}} source={assets.arrow} color={colors.white}/>
                </Block>
              </Button>
              </Block>
          </Animated.View>
        )}
      </Block>

      <Block color={colors.card} flex={0}>
        <Text paddingLeft={sizes.sm} h4 bold>{courseName}</Text>
        <Text p paddingLeft={sizes.sm} marginBottom={sizes.s}>
            <Text h5 semibold>Lesson {lesson_id}</Text>
             {` | ${lessonName}`}
          </Text>
      </Block>

      {!videoAssetKey && (
        <ProgressBar total={newData.length} curr={currentIndex} height={6} gradientColors={['#F20089', '#A100F2']}/>
      )}

      {/* Pre-quiz Popup */}
      {showModal ? (
        <Portal>  
         <Modal
           isVisible={showModal}
           onBackdropPress={() => setShowModal(false)}
           onBackButtonPress={() => setShowModal(false)}
           animationIn="slideInUp"
           animationOut="slideOutDown"
           style={{
             margin: 0,              
             justifyContent: 'center',
             alignItems: 'center',
           }}
         >
          <Block row ></Block>
           <Block flex={0} style={{  padding: 20, backgroundColor: '#fff', borderRadius: 10,alignItems: 'center'}}>
            <Text h3 black bold marginBottom={sizes.l}>{"Lesson Finished!"}</Text>
            
            <Block row flex={0} style={{justifyContent: 'flex-end', alignItems: 'center'}}>
              <Text h5 black align="left" marginBottom={sizes.s}>
                {`Congratulations! You've completed the content for Lesson #${lesson_id}!\n\nDo you wish to proceed to the Lesson Quiz for this lesson?`}
              </Text>
              
            </Block>
            <Block row flex={0}>
              <Button
                style={styles.goButton} primary onPress={() => {
                  navigation.navigate("LessonQuiz", {course_id, lesson_id, totalLessons});
                  setShowModal(false);
                }}>
                <Text h4 bold white>{"GO"}</Text>
              </Button>
            </Block>
           </Block>
         </Modal>
       </Portal>
      ) : (null) }

      {/** Course Content Cards */}
      
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaView style={styles.container}>
        {(videoAssetKey) ? (
          <VideoLesson 
              videoAssetKey={videoAssetKey} 
              sizes={sizes} 
              lessonName={lessonName} 
            />
        ) : (
            // Display Content Cards
            <View style={styles.cardContainer}>
              {newData.map((item, index) => {
                if (index > currentIndex + MAX || index < currentIndex) {
                  return null;
                }
                return (
                  <LessonCard
                    newData={newData}
                    setNewData={setNewData}
                    maxVisibleItems={MAX}
                    item={item}
                    index={index}
                    dataLength={newData.length}
                    animatedValue={animatedValue}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                    key={index}
                  />
                );
              })}
            </View>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>

    </Block>
  );
};

export default Course;

    
const createStyles = (sizes, colors, CARD_HEIGHT, CARD_WIDTH) => StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: sizes.s,
  },
  videoPlayer: {
    width: '100%',
    height: '95%',
    borderRadius: 8,
  },
  nextButton : {
    width: CARD_WIDTH / 2,
  },
  goButton : {
    width: CARD_WIDTH / 2,
    marginTop: sizes.l
  }
});
