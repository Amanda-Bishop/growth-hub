import React, {useCallback, useEffect, useState, useMemo, useRef} from 'react';
import {Alert, Platform, Linking, FlatList, TouchableOpacity, View, StyleSheet, RefreshControl} from 'react-native';
import { useNavigation, useFocusEffect} from '@react-navigation/native';
import {Block, Button, Image, Text} from '../components/';
import {useTheme, useTranslation} from '../hooks/';
import {useData } from '../hooks/useData';
import { getFriendItems, getUserPointsRank } from '../queries/friends';
import { getUserPoints } from '../queries/auth';
import { ProfileStackParamList } from '../navigation/StackParamLists'
import { StackNavigationProp } from '@react-navigation/stack';
import { avatarMap } from "../constants/avatars";
import { IBadge } from '../constants/types';
import { SPACING } from '../constants/light';
import { badgeMap } from "../constants/badges";
import { auth } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import CourseList from '../components/CourseList';

interface CourseData {
  name: string;
  description: string;
  duration: string;
  id: string;
  aggregatedRating?: {
    averageRating: number;
    numRatings: number;
    total: number;
  };
}

// Logout
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const isAndroid = Platform.OS === 'android';

const Profile = () => {
  const [friends, setFriends] = useState<any>(null);
  const [rank, setRank] = useState<number>(1);
  const [userPoints, setPoints] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);
  const {user, setUser, completedCourses, setCompletedCourses, currentCourses, setCurrentCourses} = useData();
  const {t} = useTranslation();

  type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'Profile'>;
  const navigation = useNavigation<ProfileNavigationProp>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const {assets, colors, sizes, gradients, icons } = useTheme();
  ///// CONSTANTS //////
  const CARD_WIDTH = (sizes.width - sizes.padding * 2 - sizes.sm) / 1.3;
  const CARD_HEIGHT = 180;
  const CARD_WIDTH_SPACING = CARD_WIDTH + SPACING.m;
  const styles = useMemo(() => createStyles(sizes, colors, CARD_HEIGHT, CARD_WIDTH), [sizes]); 

  // Function to load all data
  const loadData = useCallback(async () => {
      try {
          
        if (user?.id) {
          fetchPoints(user.id);
          fetchFriendList(user.id);
          fetchRanking(user.id);
          
        }
      } catch (error) {
      }
  }, [user.id]);
  
  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await loadData();
      setRefreshing(false);
  }, [loadData]);

  const fetchPoints = async (user_id: string) => {
    try {
      const points = await getUserPoints(user_id);
      
      setPoints(points);
    } catch (pointsError) {
        console.error("[fetchLeaderboard] Error fetching user points:", pointsError);
        setPoints(0); 
    }
  }

  const fetchFriendList = async (user_id: string) => {
    try {
      setLoading(true);
      const friendProfiles = await getFriendItems(user_id)
      if (friendProfiles) setFriends(friendProfiles);

    } catch (error) {
      console.error('Error fetching friend list:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchRanking = async (user_id: string) => {
    try{
      const res = await getUserPointsRank(user_id);
      if (res) setRank(res);
      else {
        console.warn("Rank returned was NULL.");
      }
    } catch (error){
      console.error('Error calculating user rank.');
    }
  }

  const onNavigate = async (course_id: string) =>{ 
    const lesson_id: number =  user.currLessons[course_id];
    navigation.getParent()?.navigate('Course', { course_id, lesson_id});
  }

// Load data when the component mounts
    useEffect(() => {
        loadData();
        
        // Set up interval to reload data every 15 seconds
        intervalRef.current = setInterval(() => {
            loadData();
        }, 15000); // 15 seconds
        
        // Clean up the interval when the component unmounts
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    
    // Reload data when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

  return (
    <Block safe marginTop={sizes.xl}>
      <Block
        scroll
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{paddingBottom: sizes.padding}}>
        <Block flex={0} paddingHorizontal={sizes.padding}>
          <Image
            paddingTop={sizes.m}
            background
            resizeMode="cover"
            paddingBottom={sizes.m}
            radius={sizes.cardRadius}
            source={assets.background}>
            <Button
              white
              outlined
              row
              shadow={!isAndroid}
              marginHorizontal={sizes.sm}
              style={{
                alignSelf: "flex-end",
                paddingHorizontal: 12,
              }}
              onPress={async () => {
                try {
                    Alert.alert("Logging out!", "Come back soon!");
                    await auth.signOut();
                    setUser();
                    await ReactNativeAsyncStorage.clear();
                    console.log("User signed out and AsyncStorage cleared");
                } catch (error) {
                    console.error("Error during logout:", error);
                }
              }}>
              <Text bold white transform="uppercase" paddingHorizontal={sizes.s}>
                Logout
              </Text>
              <MaterialIcons name="logout" size={24} color={colors.white} />
            </Button>

            <Block flex={0} align="center" paddingBottom={10}>

              <Image
                width={100}
                height={100}
                marginBottom={sizes.sm}
                source={avatarMap[user.avatar] || avatarMap[0]}
              />
              <Text h3 center white>
                {user?.username}
              </Text>
            </Block>

            <Block align="center" paddingTop={sizes.s}>
              <Text bold white h4>
                {userPoints}
              </Text>
              <Text semibold white h5>{" Points"}</Text>
            </Block>
          </Image>

          <Block row justify="space-evenly" width="100%" >
            <Button
                style={{ flex: 1, paddingRight: sizes.s, marginTop: sizes.sm}}

              onPress={() => {
                navigation.getParent()?.navigate('Challenges');
              }}
            >
              <Block row align="center" color={colors.primary} style={styles.squareBlock} paddingHorizontal={sizes.m}>
                <Text white semibold p style={{ flex: 1 }}>Ranking</Text>
                <Text white bold h5 style={{ marginRight: sizes.s }}>#{rank}</Text>
                <Image source={icons.arrow} color={colors.white} />
              </Block>
            </Button>

            <Button 
                style={{ flex: 1, paddingLeft: sizes.s, marginTop: sizes.sm}}

              onPress={() => {
                navigation.navigate('FriendList');
              }}
            >
              <Block row align="center" color={colors.primary} style={styles.squareBlock} paddingHorizontal={sizes.m}>
                <Text white semibold p style={{ flex: 1 }}>Friends</Text> 
                <Text white bold h5 style={{ marginRight: sizes.s }}>{friends?.length || 0}</Text>

                <Image source={icons.arrow} color={colors.white} />
              </Block>
            </Button>

          </Block>

          {/** Current Courses */}    
          
          <Block >
            <Text h5 semibold marginBottom={sizes.s} marginTop={sizes.m}>
              {"Current Courses"}
            </Text>
            {currentCourses && currentCourses.length > 0 ? (
              <CourseList onNavigate={onNavigate} onlyActive={true} max={3}/>
            ) : (
              <Block>
                <Block flex={0} align="center" justify="center" marginVertical={sizes.m}>
                  <Text p center marginHorizontal={sizes.s}>
                    {"You haven't started any courses. Begin a course to see it here."}
                  </Text>
                </Block>

                <Button
                  onPress={() => navigation.navigate('Courses')}
                  color={colors.primary}
                  marginTop={sizes.s}
                  paddingHorizontal={sizes.m}
                  paddingVertical={sizes.s}
                >
                  <Block row align="center">
                      <Text h5 semibold white marginRight={sizes.s}>
                          Start Courses
                      </Text>
                      <Entypo name="open-book" size={20} color={colors.white}/>
                  </Block>
                </Button>
              </Block>
            )}
          </Block>

          {/* "See More" button */}
          {currentCourses && currentCourses.length > 3 ?
          (
            <Button
              primary row marginTop={sizes.m}
              onPress={() => {navigation.getParent()?.navigate("Courses");}}>
              <Text marginRight={sizes.s} semibold white h5>
                View Courses
              </Text>
              <Entypo name="open-book" size={20} color={colors.white}/>
            </Button>
          ) : null}


          {/** Course Badges */}
          <Block marginTop={sizes.m}>

            <Block row align="center" justify="space-between">
              <Text h5 semibold paddingBottom={sizes.cardPadding}>
              {"Course Badges "}

              </Text>
            </Block>
          </Block>


          {user.badges && user.badges.length > 0 ? (
            <FlatList
              style={{marginHorizontal: sizes.m}}
              data={user.badges}
              horizontal
              snapToInterval={CARD_WIDTH_SPACING}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(i: IBadge) => i.id}
              renderItem={({ item, index }: { item: IBadge; index: number }) => {
                return (
                  <View style={styles.outerBorder}>
                    <View style={styles.middleBorder}>
                      <View style={styles.shadowContainer}>
                        <View style={[styles.card, styles.dark]}>
                          <View style={styles.imageBox}>
                            <Image source={badgeMap[item.id].image} style={styles.image} />
                          </View>
                          <View style={styles.titleBox}>
                            <Text white h5 bold>{badgeMap[item.id].title}</Text>
                            <Text white semibold>{badgeMap[item.id].subtitle}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            <Block>
              <Block
              row
              flex={0}
              align="center"
              justify="center"
              marginVertical={sizes.m}
              >
                <Text p center marginHorizontal={sizes.s}>
                  {"You haven't earned any badges.\nComplete a course to earn a course badge."}
                </Text>
              </Block>
              <Button
                onPress={() => navigation.navigate('Courses')}
                color={colors.primary} marginTop={sizes.s} paddingHorizontal={sizes.m} paddingVertical={sizes.s}
              >
                <Block row align="center">
                    <Text h5 semibold white marginRight={sizes.s}>
                        Start Courses
                    </Text>
                    <Entypo name="open-book" size={20} color={colors.white}/>
                </Block>
              </Button>
            </Block>
          )}
        </Block>
          

      </Block>

    </Block>
  );
};

export default Profile;


const createStyles = (sizes, colors, CARD_HEIGHT, CARD_WIDTH) => StyleSheet.create({
  header: {
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  squareBlock: {
    flex: 1,
    width: "100%",
    alignItems: 'center',
    borderRadius: 10,
    paddingTop: 5,
    paddingBottom: 5,
  },

  // BADGES //
  outerBorder: {
    width: CARD_WIDTH / 4 + 10,
    height: CARD_WIDTH / 4 + 10,  
    borderRadius: (CARD_WIDTH / 4 + 8) / 2,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  middleBorder: {
    width: CARD_WIDTH / 4 + 8,
    height: CARD_WIDTH / 4 + 8,
    borderRadius: (CARD_WIDTH / 4 + 4) / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',  
    justifyContent: 'center',
    padding: 2,
  },
  shadowContainer: {
    width: CARD_WIDTH / 4,
    height: CARD_WIDTH / 4,
    borderRadius: (CARD_WIDTH / 4) / 2,
    elevation: 3,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH / 4,
    height: CARD_WIDTH / 4,
    borderRadius: CARD_WIDTH / 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBox: {
    width: CARD_WIDTH / 4,
    height: CARD_WIDTH / 4,
    borderRadius: (CARD_WIDTH / 4) / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: CARD_WIDTH / 4,
    height: CARD_WIDTH / 4,
    borderRadius: (CARD_WIDTH / 4) / 2,
    resizeMode: 'cover',
  },
  titleBox: {
    position: 'absolute',
    top: CARD_HEIGHT - 80,
    left: 16,
  },
  dark: {
    shadowColor: colors.black,
    shadowRadius: 4,
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
});
