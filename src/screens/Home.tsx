import React, {useCallback, useState, useEffect} from 'react';

import {useData, useTheme, useTranslation} from '../hooks/';
import {Block, Button, Image, Input, Product, Text} from '../components/';
import * as Progress from 'react-native-progress';
import { TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { avatarMap } from '../constants/avatars';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLesson, getRandCourseInfo } from '../queries/courses';
import { getUserPointsRank } from '../queries/friends';
import { getRandChallenge, getChallengeById, getCompletedChallengeById } from '../queries/challenges';
import { getRandomFriendPost } from '../queries/feed';
import { getCourseById } from '../queries/courses';
import { getFriendItem, getFriendProfile } from '../queries/friends';

const isAndroid = Platform.OS === 'android';

const Home = () => {
  const {t} = useTranslation();
  const [tab, setTab] = useState<number>(0);
  const {following, trending, user} = useData();
  const [products, setProducts] = useState(following);
  const {assets, colors, icons, gradients, sizes} = useTheme();

  const navigation = useNavigation();

  const challengeIconW = require("../assets/icons/challenges-w.png");
  const leaderboardIconW = require("../assets/icons/leaderboard-w.png");
  const challengeIcon = require("../assets/icons/challenges-pur.png");

  interface Course {
    name: string;
    id: string;
    progress: number;
  }

  interface Challenge {
    description: string;
    progress: number;
    goal: number;
  }

  interface FriendPost {
    username: string;
    avatar: number;
    type: string;
    description: string;
    time: number;
  }

  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [friendPost, setPost] = useState<FriendPost | null>(null);

  // Refactored data fetching functions with useCallback
  const fetchCourseData = useCallback(async () => {
    try {
      if (!user?.id) return;
      const currCourse = await getRandCourseInfo(user.id);
      setCurrentCourse(currCourse);
      const lesson = await getCurrentLesson(user.id, currCourse.id);
      setCurrentLesson(lesson);
    } catch (error) {
      setCurrentCourse(null);
    }
  }, [user?.id]);

  const fetchRanking = useCallback(async () => {
    try {
      if (!user?.id) return;
      const res = await getUserPointsRank(user.id);
      if (res) setRank(res);
      else {
        console.warn("Rank returned was NULL.");
      }
    } catch (error) {
      console.error('Error calculating user rank.');
    }
  }, [user?.id]);

  const fetchChallenge = useCallback(async () => {
    try {
      if (!user?.id) return;
      const chal = await getRandChallenge(user.id);
      
      if (chal) {
        const chalInfo = await getChallengeById(chal.challengeID);
        
        if (chalInfo) {
          setChallenge({
            description: chalInfo.description,
            progress: chal.progress,
            goal: chalInfo.goal
          });
        }
      } else {
        console.warn("[fetchChallenge] No valid challenge returned");
      }
    } catch (error) {
      console.error('[fetchChallenge] Error fetching challenge:', error);
    }
  }, [user?.id]);

  const getPostDescription = async (type: string, id: string, user_id: string): Promise<string> => {
    try {
        switch (type) {
            case 'COURSE':
                const courseInfo = await getCourseById(id);
                return `Completed the ${courseInfo?.name || ''} course`;
            case 'CHALLENGE':
                const challengeInfo = await getChallengeById(Number(id));
                const completedInfo = await getCompletedChallengeById(user_id, Number(id));
                let friendUsername = '';
                if (completedInfo && completedInfo.friendUid && completedInfo.friendUid !== "") {
                    try {
                        const friend = await getFriendItem(completedInfo.friendUid);
                        friendUsername = friend?.username || '';
                    } catch (error) {
                        console.error(`Error fetching friend for challenge ${completedInfo.challengeID}:`, error);
                    }
                }
                return `Completed a challenge: ${challengeInfo?.description || ''} ${friendUsername ? `@${friendUsername}` : ''}`;
            default:
                return `Did something`;
        }
    } catch (error) {
        return `Did something`;
    }
  };

  const fetchPost = useCallback(async () => {
    try {
      if (!user?.id) return;
      const result = await getRandomFriendPost(user.id);
      
      if (result) {
        const { post, friendID } = result;
        
        if (post && post.type && post.id) {
          const description = await getPostDescription(post.type, post.id, user.id);
          const profile = await getFriendProfile(friendID);
          
          if (description && profile) {
            setPost({
              username: profile.username,
              avatar: profile.avatar || 0,
              type: post.type,
              description: description,
              time: post.time || Date.now()
            });
          } 
        } else {
          console.warn("[fetchPost] Invalid post object:", post);
        }
      } 
    } catch (error) {
      console.error("[fetchPost] Error fetching post:", error);
    }
  }, [user?.id]);

  // Consolidated data fetching effect with interval
  useEffect(() => {
    // Initial fetch
    if (user?.id) {
      fetchCourseData();
      fetchRanking();
      fetchChallenge();
      fetchPost();

      // Set up interval to refresh data every 30 seconds
      const intervalId = setInterval(() => {
        fetchCourseData();
        fetchRanking();
        fetchChallenge();
        fetchPost();
      }, 30000); // 30 seconds

      // Cleanup interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [user?.id, fetchCourseData, fetchRanking, fetchChallenge, fetchPost]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <Block>
      {/* Header with logo */}
      <Block
        row
        flex={0}
        align="center"
        justify="center"
        color={colors.card}
        paddingBottom={sizes.sm}
        paddingTop={sizes.xl}
        paddingHorizontal={sizes.sm}>
          
        <Block row center align='center'>
          <Image source={assets.logo} color={colors.black} height={30} width={30}/>
          <Text marginLeft={4} h4 bold>Growth Hub</Text>
        </Block>
      </Block>

      {/* Scrollable content area */}
      <Block
        scroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: sizes.padding }}
      >
        <Block 
        row 
        flex={0} 
        color={colors.card}
        paddingHorizontal={sizes.padding}
        paddingBottom={sizes.sm}
        marginTop={-sizes.m}
        style={{ alignItems: 'center' }}>
  
          <Block flex={0.7}>
            <Text h4>Welcome back,</Text>
            <Text p color={colors.gray}>Ready to continue your learning?</Text>
          </Block>
      
          <Block flex={0.3} align='flex-end'>
            <Button onPress={() => {
              navigation.navigate('Profile')
            }} style={{ alignItems: 'center', width: '100%' }}>
              <Image 
                width={60} 
                height={60} 
                source={avatarMap[user.avatar] || avatarMap[0]} 
                style={{ borderRadius: 30 }}
              />
              <Text 
                semibold 
                marginTop={sizes.xs} 
                color={colors.primary}
                style={{ textAlign: 'center' }}
              >
                {`@${user.username}`}
              </Text>
            </Button>
          </Block>
        </Block>


        {/* CARD 1: Jump back into [course] */}
        <Block card flex={0} style={{marginHorizontal: sizes.padding, marginBottom: sizes.s, paddingBottom: sizes.sm, marginTop: sizes.sm}}>
          <Text semibold>Jump back into...</Text>
          
          <TouchableOpacity 
            style={{width: '100%'}}
            onPress={() => {
              if (currentCourse?.id) {
                navigation.navigate('Course', { course_id: currentCourse?.id, lesson_id: currentLesson });
              }
            }}
            disabled={!currentCourse}
          >
            <Block align="center" justify="center" color={colors.secondary} marginTop={sizes.sm} style={{borderRadius: 8}}>
              {currentCourse ? (
                <>
                  <Text h5 bold color={colors.white} marginTop={sizes.s} center>
                    {currentCourse.name}
                  </Text>
                  <Text p color={colors.white} marginBottom={sizes.s}>
                    {currentCourse.progress}%
                  </Text>
                  
                  <Block width={sizes.width * 0.6} align="center" marginVertical={sizes.xs} marginBottom={sizes.m}>
                    <Progress.Bar 
                      progress={currentCourse.progress/100} 
                      width={sizes.width * 0.6}
                      color={colors.white}
                    />
                  </Block>
                </>
              ) : (
                <Block padding={sizes.m}>
                  <Text p semibold color={colors.white} center>
                  You haven't started any courses yet.
                  </Text>
                  <Button
                    onPress={() => navigation.navigate('Courses')}
                    color={colors.white}
                    marginTop={sizes.s}
                    paddingHorizontal={sizes.s} 
                    paddingVertical={sizes.s}
                    style={{ alignSelf: 'center', width: 'auto' }} 
                  >
                    <Block row align="center">
                        <Text p semibold secondary marginRight={sizes.s}> 
                            Start a Course
                        </Text>
                        <Ionicons name="school-outline" size={20} color={colors.secondary} />
                    </Block>
                </Button>
                </Block>
              )}
            </Block>
          </TouchableOpacity>
        </Block>
        
        {/* CARD 2: Row with two cards (Rating and Challenges) */}
        <Block row flex={0} marginHorizontal={sizes.padding} marginBottom={sizes.s} justify="space-between">
          {/* Rating Card */}
          <TouchableOpacity 
            style={{ width: '48%' }}
            onPress={() => {
               navigation.navigate('Challenges');
            }}
          >
            <Block card color={colors.primary} marginRight={sizes.s} padding={sizes.sm} style={styles.fixedHeightCard}>
              <Text h5 bold color={colors.white} align="center">Your Ranking</Text>
              <Block align="center" justify="center" marginTop={sizes.sm} style={{ flex: 1 }}>
                <Image
                  radius={0}
                  source={leaderboardIconW}
                  width={35}
                  height={35}
                />
              </Block>
              <Block align="center" justify="center" marginTop={sizes.xs}>
                <Text h2 color={colors.white} bold>#{rank}</Text>
              </Block>
            </Block>
          </TouchableOpacity>
          
          {/* Challenges Card */}
          <TouchableOpacity 
            style={{ width: '52%' }}
            onPress={() => {
               navigation.navigate('Challenges');
            }}
          >
          <Block card color={colors.primary} padding={sizes.sm} style={styles.fixedHeightCard}>
            <Block row align="center" justify="center"> 
              <Text h5 semibold color={colors.white} marginRight={sizes.xs}>Challenge</Text>
              <Image
                radius={0}
                source={challengeIconW}
                width={25}
                height={25}
                marginTop={-8}
              />
            </Block>
            <Block align="center" justify="center" marginTop={sizes.s}>
              <Text h5 bold color={colors.white} marginTop={sizes.s} center numberOfLines={2} ellipsizeMode="tail">
                {challenge?.description || "Loading..."}
              </Text>
              <Text p color={colors.white} marginBottom={sizes.s}>
                {challenge?.progress}/{challenge?.goal}
              </Text>

              <Block align="center" marginVertical={sizes.xs} marginBottom={sizes.sm}>
                <Progress.Bar 
                  progress={challenge && challenge.goal ? Math.min(1, challenge.progress / challenge.goal) : 0}
                  width={sizes.width * 0.35}
                  color={colors.white}
                  borderColor={colors.white}
                  unfilledColor={colors.primary}
                />
              </Block>
            </Block>
          </Block>
          </TouchableOpacity>
        </Block>
        
        {/* CARD 3: Friends Feed */}
        <Block card flex={0} color={colors.secondary} style={{marginHorizontal: sizes.padding, marginBottom: sizes.s, padding: sizes.sm}}>
          <Text h5 bold color={colors.white}>Friends Feed</Text>
          <TouchableOpacity 
            onPress={() => {
              navigation.navigate('FriendsFeed');
            }}
          >
            {friendPost ? (
              <Block card row marginBottom={sizes.s} color={colors.white}>
                <Block
                    padding={sizes.s}
                    width="100%"
                    style={styles.postContainer}>
                    {friendPost.type === 'CHALLENGE' ? (
                        <Image
                            source={challengeIcon}
                            style={styles.challengeIcon}
                            resizeMode="contain"
                        />
                    ) : (
                        <Ionicons 
                            name="school-outline" 
                            size={30} 
                            color={colors.purple}
                            style={styles.challengeIcon}
                        />
                    )}
                    
                    <Block row>
                        <Image
                            source={avatarMap[friendPost.avatar] || avatarMap[0]}
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                        <Block flex={1} marginLeft={sizes.s}>
                            <Text p bold>{friendPost.username}</Text>
                            <Text p gray>{formatDate(friendPost.time)}</Text>
                            <Text p style={styles.description}>{friendPost.description}</Text>
                        </Block>
                    </Block>
                </Block>
              </Block>
            ) : (
              <Block card padding={sizes.m} align="center" justify="center" color={colors.white}>
                <Text p center marginBottom={sizes.m}>
                    You haven't added any friends yet. Add some friends to see their updates.
                </Text>
                <Button
                    onPress={() => navigation.navigate('FriendList')}
                    color={colors.primary}
                    marginTop={sizes.s}
                    paddingHorizontal={sizes.m}
                    paddingVertical={sizes.s}
                >
                    <Block row align="center">
                        <Text p semibold white marginRight={sizes.s}>
                            Add Friends
                        </Text>
                        <Ionicons name="person-add" size={20} color={colors.white} />
                    </Block>
                </Button>
              </Block>
            )}
          </TouchableOpacity>
        </Block>
        
        {/* CARD 4: Resources Card */}
        <Block card flex={0} style={{marginHorizontal: sizes.padding, marginBottom: sizes.m, padding: sizes.sm, borderWidth: 2, borderColor: colors.secondary,}}>
          <Text h5 center bold>Resources</Text>
          <Text p marginTop={sizes.sm} marginBottom={sizes.s} center>
            Explore our library of healthcare resources in the KW region.
          </Text>
          
          <Block align="center" >
            <Button
              color={colors.secondary}
              shadow={false}
              paddingHorizontal={sizes.l}
              onPress={() => {
                navigation.navigate('Resources');
              }}
            >
              <Text p semibold color={colors.white}>
                View Resources
              </Text>
            </Button>
          </Block>
        </Block>
      </Block>
    </Block>
  );
};

export default Home;

const styles = StyleSheet.create({
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    description: {
        flex: 1,
        paddingRight: 4,
        flexShrink: 1,
        maxWidth: '90%',
    },
    challengeIcon: {
        width: 34,
        height: 34,
        position: 'absolute',
        top: '50%',         
        transform: [{translateY: -10}], 
        right: -5,
        zIndex: 1,
    },
    postContainer: {
        position: 'relative',
    },
});