import { useRoute, RouteProp } from '@react-navigation/native';

import React, {useCallback, useEffect, useState, useMemo } from 'react';
import {Platform, Linking, FlatList, TouchableOpacity, View, StyleSheet} from 'react-native';
import {Route, useFocusEffect, useNavigation} from '@react-navigation/core';
import { Ionicons } from '@expo/vector-icons';

import {Block, Button, Image, Text} from '../components/';
import { useTheme, useTranslation} from '../hooks/';
import { getFriendItem, getFriendCount, getFriendProfile, getFriendPointsRank, getFriendsList } from '../queries/friends';
import { FriendProfileItem } from '../constants/types/db';

// import { RouteStackProp } from '../navigation/Screens';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../navigation/StackParamLists'

import { avatarMap } from "../constants/avatars";
import { SPACING } from '../constants/light';
import { IBadge } from '../constants/types';
import { badgeMap } from "../constants/badges";
import { getLikedPosts, getPostsByUser, likeUserPost, unlikeUserPost } from '../queries/feed';
import { getCourseById } from '../queries/courses';
import { getChallengeById, getCompletedChallengeById } from '../queries/challenges';

interface FriendPost {
  id: string; 
  pid: string; // post id as declared in the db
  friendID: string;
  username: string;
  avatar: number;
  type: string;
  description: string;
  time: number;
  likes: number;
  isLiked: boolean; 
}

const likedIcon = require("../assets/icons/liked.png");
const unlikedIcon = require("../assets/icons/unliked.png");
const challengeIcon = require("../assets/icons/challenges-pur.png");
const isAndroid = Platform.OS === 'android';
const FriendProfile = () => {
  const route = useRoute<RouteProp<ProfileStackParamList, 'FriendProfile'>>();
  const { params } = route;
  const { thisFriendId } = route.params;
    const [friend, setFriend] = useState<FriendProfileItem | null>(null)

  const {t} = useTranslation();
  type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'FriendProfile'>;
  const navigation = useNavigation<ProfileNavigationProp>();

  const {assets, colors, sizes, gradients} = useTheme();
  const [numfriends, setNumfriends] = useState<number>(0);
  const [feedList, setFeedList] = useState<FriendPost[]>([]);
  const [rank, setRank] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);


  
  ///// CONSTANTS //////
  const IMAGE_SIZE = (sizes.width - (sizes.padding + sizes.sm) * 2) / 3;
  const IMAGE_VERTICAL_SIZE =
    (sizes.width - (sizes.padding + sizes.sm) * 2) / 2;
  const IMAGE_MARGIN = (sizes.width - IMAGE_SIZE * 3 - sizes.padding * 2) / 2;
  const IMAGE_VERTICAL_MARGIN =
    (sizes.width - (IMAGE_VERTICAL_SIZE + sizes.sm) * 2) / 2;
  const CARD_WIDTH = (sizes.width - sizes.padding * 2 - sizes.sm) / 1.4; // FINE TUNE THIS
  const CARD_HEIGHT = 200; // FINE TUNE THIS
  const CARD_WIDTH_SPACING = CARD_WIDTH + SPACING.m; // + spacing.l; // FINE TUNE THIS



  const styles = useMemo(() => createStyles(sizes, colors, CARD_HEIGHT, CARD_WIDTH), [sizes]); // Styles only update when `sizes` changes


  useEffect(() => {
    if (thisFriendId) {
      loadFriendProfile();
      loadFriendCount(thisFriendId);
      fetchRanking(thisFriendId);
    }
  }, [params.thisFriendId]); // ignore the error highlighting by TS

  const loadFriendProfile = async () => {
    const thisFriendId = params.thisFriendId; // ignore the error highlighting by TS
    // console.log("thisFriendId:", thisFriendId)
    try {
      setLoading(true);
      const thisFriendProfileData = await getFriendProfile(thisFriendId);
      if (thisFriendProfileData) { setFriend(thisFriendProfileData);
        // console.log("username:", friend?.username);
       }
      else {
        console.warn("Friend profile not found.");
      }
    } catch (error) {
      console.error("Error loading friend profile:", error);
    }
    setLoading(false);
  }

  const loadFriendCount = async (thisFriendId: string) => {
    const count = await getFriendCount(thisFriendId);
    setNumfriends(count);
  }

  const fetchRanking = async (thisFriendId: string) => {
    try{
      const res = await getFriendPointsRank(thisFriendId);// getUserPointsRank(thisFriendId); //
      if (res) setRank(res);
      else {
        console.warn("[FriendProfile] Rank returned was NULL.");
      }
    } catch (error){
      console.error("[FriendProfile] Error calculating user rank.");
    }
  }
    const loadData = useCallback(async () => {
        try {
            await fetchFriendFeed();
        } catch (error) {
        }
    }, [thisFriendId]);
    
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );
  const fetchFriendFeed = async () => {
    try {
        let allPosts: FriendPost[] = [];
        const likedPosts = await getLikedPosts(thisFriendId);
        
        // Fetch specific friend's profile
        const profile = await getFriendProfile(thisFriendId);
        const posts = await getPostsByUser(thisFriendId);
        
        if (posts && posts.length > 0) {
            const friendPostsPromises = posts.map(async (post: any) => {
                const description = await getPostDescription(post.type, post.id, thisFriendId);
                const detailedID = `${post.type}-${post.id}-${post.time || Date.now()}`;
                const isLiked = likedPosts?.includes(detailedID) || false;
                
                return {
                    id: detailedID, 
                    pid: post.id,
                    friendID: thisFriendId,
                    username: profile?.username || '',
                    avatar: profile?.avatar || 0,
                    type: post.type || "",
                    description: description,
                    time: post.time || Date.now(),
                    likes: post.likes || 0,
                    isLiked: isLiked, 
                };
            });

            allPosts = await Promise.all(friendPostsPromises);
        }

        // Sort all posts by time in descending order (newest first)
        allPosts.sort((a, b) => b.time - a.time);
        setFeedList(allPosts);
    } catch (error) {
        console.error('[fetchFriendFeed] Error fetching feed:', error);
    }
};


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
                console.log(`Error getting post description for ${type}-${id}:`, error);
                  return `Did something`;
                  
              }
          };

      const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
      };

      // Helper function to handle like/unlike post
      const handleLike = (postId: string) => {
          setFeedList(prev => 
              prev.map(post => {
                  if (post.id === postId) {
                      const newIsLiked = !post.isLiked;
                      if (newIsLiked) {
                          likeUserPost(thisFriendId, post.friendID, post.pid, post.id);
                      } else {
                          unlikeUserPost(thisFriendId, post.friendID, post.pid, post.id);
                      }
                      return {
                          ...post,
                          isLiked: newIsLiked,
                          likes: newIsLiked ? post.likes + 1 : post.likes - 1
                      };
                  }
                  return post;
              })
          );
          
          
      };
// 
  return (
    <Block safe marginTop={sizes.xl}>
      <Block
        scroll
        nestedScrollEnabled
        // paddingHorizontal={sizes.s}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: sizes.padding}}>
        <Block flex={0} paddingHorizontal={sizes.padding}>
          <Image
            paddingTop={sizes.m}
            background
            resizeMode="cover"
            padding={sizes.sm}
            paddingBottom={sizes.m}
            radius={sizes.cardRadius}
            source={assets.background}>
            <Button
              row
              flex={0}
              justify="flex-start"
              onPress={() => navigation.goBack()}>
              <Image
                radius={0}
                width={10}
                height={18}
                color={colors.white}
                source={assets.arrow}
                transform={[{rotate: '180deg'}]}
              />
              <Text p semibold white marginLeft={sizes.s}>
                {"Back"}
              </Text>
            </Button>
            <Block flex={0} align="center" paddingBottom={10}>
              <Image
                width={100}
                height={100}
                marginBottom={sizes.sm}
                source={friend? avatarMap[friend.avatar] || avatarMap[0] : avatarMap[0]}
              />
              <Text h3 center white>
                {friend?.username}
              </Text>
            </Block>

            <Block align="center" paddingTop={sizes.s}>
              <Text bold white h4>
                {(friend?.points|| 0)}
              </Text>
              <Text semibold white h5>{" Points"}</Text>
            </Block>
          </Image>

          <Block row justify="space-evenly" width="100%" padding={0}>
            <Button
              style={{ flex: 1, paddingRight: sizes.s, marginTop: sizes.sm}}>
              <Block row align="center" color={colors.primary} style={styles.squareBlock} paddingHorizontal={sizes.m}>
                <Text white semibold p style={{ flex: 1 }}>Ranking</Text>
                <Text white bold h5 style={{ marginRight: sizes.s }}>#{rank}</Text>
              </Block>
            </Button>

            <Button
              style={{ flex: 1, paddingLeft: sizes.s, marginTop: sizes.sm}}>
              <Block row align="center" color={colors.primary} style={styles.squareBlock} paddingHorizontal={sizes.m}>
                <Text white semibold p style={{ flex: 1 }}>Friends</Text> 
                <Text white bold h5 style={{ marginRight: sizes.s }}>{numfriends || 0}</Text>
              </Block>
            </Button>

          </Block>


        {/* Friend Feed Posts */}
        
        <Block marginTop={sizes.m} >
          <Text h5 semibold paddingBottom={sizes.cardPadding}>
                {"Recent Activity"}
          </Text>
          
          {feedList && feedList.length > 0 ? (
            feedList && feedList.slice(0,3).map((post) => (
              <Block key={post.id} card row marginBottom={sizes.s} color={colors.white}>
                <Block
                    padding={sizes.s}
                    width="100%"
                    style={styles.postContainer}>
                    {post.type === 'CHALLENGE' ? (
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
                            source={avatarMap[post.avatar] || avatarMap[0]}
                            style={styles.friendAvatar}
                            resizeMode="cover"
                        />
                        <Block flex={1} marginLeft={sizes.s}>
                            <Text p bold>{post.username}</Text>
                            <Text p gray>{formatDate(post.time)}</Text>
                            <Text p style={styles.description}>{post.description}</Text>
                        </Block>
                    </Block>
                </Block>
              </Block>
            ))
          ) : (
            <Block
              row
              flex={0}
              align="center"
              justify="center"
              marginVertical={sizes.l}
              >
              <Text p center marginHorizontal={sizes.s}>
                No recent activity!
              </Text>
            </Block>
          )}
        </Block>

          {/** Course Badges */}

          <Block marginTop={sizes.m}>

            <Block row align="center" justify="space-between">
              <Text h5 semibold paddingBottom={sizes.cardPadding}>
              {"Course Badges "}

              </Text>
            </Block>

          </Block>

          {friend && friend.badges.length > 0 ? (
            <FlatList
            style={{marginHorizontal: sizes.m}}

              data={friend?.badges}
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
            <Block
            row
            flex={0}
            align="center"
            justify="center"
            marginVertical={sizes.l}
            >
              <Text p center marginHorizontal={sizes.s}>
                No badges earned!
              </Text>
            </Block>
          )}



        </Block>
      </Block>
    </Block>
  );



}



export default FriendProfile;

const createStyles = (sizes, colors, CARD_HEIGHT, CARD_WIDTH) => StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  squareBlock: {
    flex: 1,               // Each block takes equal horizontal space
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
    elevation: 3, // Shadow effect
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

  friendAvatar: {
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