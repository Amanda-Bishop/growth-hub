import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, Linking, StyleSheet, RefreshControl, TouchableOpacity, requireNativeComponent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/core';

import { Block, Button, Image, Text } from '../components/';
import { useData, useTheme, useTranslation } from '../hooks/';
import { getCompletedChallengeById, getChallengeById, completeChallenge, getCompletedChallenges, updateCurrUserChallenges } from '../queries/challenges';
import { getFriendsList, getFriendProfile, getFriendItem } from '../queries/friends';
import { getPostsByUser, likeUserPost, unlikeUserPost, getLikedPosts } from '../queries/feed';
import { getCourseById } from '../queries/courses';
import { avatarMap } from "../constants/avatars";

const isAndroid = Platform.OS === 'android';
const likedIcon = require("../assets/icons/liked.png");
const unlikedIcon = require("../assets/icons/unliked.png");
const challengeIcon = require("../assets/icons/challenges-pur.png");

const FriendsFeed = () => {
    const { user } = useData();
    const { t } = useTranslation();
    const [tab, setTab] = useState<number>(0);
        
    const navigation = useNavigation();
    const { assets, colors, fonts, gradients, sizes } = useTheme();

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
    
    const [feedList, setFeedList] = useState<FriendPost[]>([]);
    const [index, setIndex] = useState(0);
    const [layout, setLayout] = useState({ width: 0 });
    const [refreshing, setRefreshing] = useState(false);
    
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
      };
    
    const loadData = useCallback(async () => {
        try {
            await fetchFeed();
        } catch (error) {
        }
    }, [user.id]);
    
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);
    
    const fetchFeed = async () => {
        try {
            const friends = await getFriendsList(user.id);
            let allPosts: FriendPost[] = [];
            const likedPosts = await getLikedPosts(user.id);
            
            for (const friendID of friends) {
                const profile = await getFriendProfile(friendID);
                const posts = await getPostsByUser(friendID);
                
                if (posts && posts.length > 0) {
                    const friendPostsPromises = posts.map(async (post: any) => {
                        const description = await getPostDescription(post.type, post.id, user.id);
                        const detailedID = `${post.type}-${post.id}-${post.time || Date.now()}`;
                        const isLiked = likedPosts.includes(detailedID);
                        return {
                            id: detailedID, 
                            pid: post.id,
                            friendID,
                            username: profile?.username || '',
                            avatar: profile?.avatar || 0,
                            type: post.type || "",
                            description: description,
                            time: post.time || Date.now(),
                            likes: post.likes || 0,
                            isLiked: isLiked, 
                        };
                    });
                    
                    const friendPosts = await Promise.all(friendPostsPromises);
                    allPosts = [...allPosts, ...friendPosts];
                }
            }


            // Sort all posts by time in descending order (newest first)
            allPosts.sort((a, b) => b.time - a.time);
            setFeedList(allPosts);
        } catch (error) {
            console.error('[fetchFeed] Error fetching feed:', error);
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
            return `Did something`;
            console.log(`Error getting post description for ${type}-${id}:`, error);
        }
    };

    // Helper function to handle like/unlike post
    const handleLike = (postId: string) => {
        setFeedList(prev => 
            prev.map(post => {
                if (post.id === postId) {
                    const newIsLiked = !post.isLiked;
                    if (newIsLiked) {
                        likeUserPost(user.id, post.friendID, post.pid, post.id);
                    } else {
                        unlikeUserPost(user.id, post.friendID, post.pid, post.id);
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

    useEffect(() => {
        loadData();
        
        intervalRef.current = setInterval(() => {
            loadData();
        }, 15000); // 15 seconds
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const feed = () => (
        <Block>
            <Block 
                row 
                flex={0} 
                justify="space-between"
                align="center"
                color={colors.card} 
                paddingBottom={sizes.sm}
                paddingTop={sizes.xxl}
                paddingHorizontal={sizes.padding}
            >
                <Text h4 bold paddingLeft={"27%"}>Friends Feed</Text>
                
                {feedList.length > 0 && (
                    <Button
                        onPress={() => navigation.navigate('FriendList')}
                        color={colors.primary}
                        paddingHorizontal={sizes.s}
                        height={40}
                    >
                        <Block row align="center">
                            <Ionicons name="person-add" size={23} color={colors.white} />
                        </Block>
                    </Button>
                )}
            </Block>

            <Block marginTop={sizes.m} paddingHorizontal={sizes.padding}>
                <Block>
                    {feedList && feedList.map((post) => (
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
                                        size={24} 
                                        color={colors.purple}
                                        style={styles.challengeIcon}
                                    />
                                )}
                                
                                <Block row>
                                    <TouchableOpacity
                                        onPress={() => {
                                            navigation.navigate('FriendProfile', { thisFriendId: post.friendID });
                                        }}
                                        >
                                        <Image
                                            source={avatarMap[post.avatar] || avatarMap[0]}
                                            style={styles.avatar}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                    <Block flex={1} marginLeft={sizes.s}>
                                        <Text p bold>{post.username}</Text>
                                        <Text p gray>{formatDate(post.time)}</Text>
                                        <Text p style={styles.description}>{post.description}</Text>
                                    </Block>
                                </Block>
                                
                                <Block row align="center" style={styles.bottomRightLikeContainer}>
                                    <Text p marginRight={sizes.xs}>{post.likes}</Text>
                                    <TouchableOpacity 
                                        onPress={() => handleLike(post.id)}
                                        style={styles.likeButton}
                                    >
                                        <Image
                                            source={post.isLiked ? likedIcon : unlikedIcon}
                                            style={styles.likeIcon}
                                            resizeMode="contain"
                                        />
                                    </TouchableOpacity>
                                </Block>
                            </Block>
                        </Block>
                    ))}
                    {feedList.length === 0 && (
                        <Block center padding={sizes.padding} marginTop={200}>
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
                </Block>
            </Block>
        </Block>
    );

    return (
        <Block>
            <Block
                scroll
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}>
                {feed()}
            </Block>
        </Block>
    );
}

export default FriendsFeed;

const styles = StyleSheet.create({
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    likeButton: {
        padding: 0,
    },
    likeIcon: {
        width: 30,
        height: 30,
    },
    description: {
        flex: 1,
        paddingRight: 4,
        flexShrink: 1,
        maxWidth: '80%',
    },
    likeContainer: {
        width: 30, 
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'absolute',
        right: 0, 
    },
    challengeIcon: {
        width: 34,
        height: 34,
        position: 'absolute',
        top: 0,
        right: -5,
        zIndex: 1,
    },
    postContainer: {
        position: 'relative',
    },
    bottomRightLikeContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0, 
    },
});