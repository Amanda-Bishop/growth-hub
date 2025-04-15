import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, Linking, StyleSheet, RefreshControl, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/core';
import { TouchableOpacity } from 'react-native';
import * as Progress from 'react-native-progress';

import { Block, Button, Image, Text } from '../components/';
import { useData, useTheme, useTranslation } from '../hooks/';
import { getCurrChallenges, getChallengeById, completeChallenge, getCompletedChallenges, updateCurrUserChallenges } from '../queries/challenges';
import { getFriendsList, getFriendProfile, getFriendItem } from '../queries/friends';
import { getUserPoints } from '../queries/auth';
import { avatarMap } from "../constants/avatars";

const isAndroid = Platform.OS === 'android';

const Challenges = () => {
    const { user } = useData();
    const { t } = useTranslation();
    const [tab, setTab] = useState<number>(0);

        
    const navigation = useNavigation();
    const { assets, colors, fonts, gradients, sizes } = useTheme();
    const challengeIconW = require("../assets/icons/challenges-w.png");
    const challengeIconB = require("../assets/icons/challenges-b.png");
    const leaderboardIconW = require("../assets/icons/leaderboard-w.png");
    const leaderboardIconB = require("../assets/icons/leaderboard-b.png");
    const challengeIconP = require("../assets/icons/challenges-pur.png");
    const gold = require("../assets/icons/gold.png");
    const silver = require("../assets/icons/silver.png");
    const bronze = require("../assets/icons/bronze.png");

    interface Challenge {
        challengeID: number;
        description: string;
        progress: number;
        goal: number;
        friendUsername: string;
        friendUid?: string;
    }

    interface Friend {
        friendID: string;
        username: string;
        avatar: number;
        points: number;
    }
    
    const [currChallenges, setCurrChallenges] = useState<Challenge[]>([]);
    const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
    const [leaderboardList, setLeaderboardList] = useState<Friend[]>([]);
    const [index, setIndex] = useState(0);
    const [layout, setLayout] = useState({ width: 0 });
    const [refreshing, setRefreshing] = useState(false);
    
    // Reference to store the interval ID for cleanup
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Function to load all data
    const loadData = useCallback(async () => {
        try {
    
            // Update challenges
            await updateCurrUserChallenges(user?.id);
            
            // Fetch current challenges
            await fetchChallenges();
            
            // Fetch completed challenges
            await fetchCompletedChallenges();
            
            // Fetch leaderboard
            await fetchLeaderboard();
        } catch (error) {
        }
    }, [user.id]);
    
    // Pull-to-refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);
    
    // Fetch challenges function
    const fetchChallenges = async () => {
        try {
            const challenges = await getCurrChallenges(user.id);

            const detailedChallenges: Challenge[] = await Promise.all(
                challenges.map(async (challenge: Challenge): Promise<Challenge> => {
                    const challengeDetails: Partial<Challenge> = await getChallengeById(challenge.challengeID) || {};
                
                    let friendUsername = '';
                    if (challenge.friendUid && challenge.friendUid !== "") {
                        try {
                            const friend = await getFriendItem(challenge.friendUid);
                            friendUsername = friend?.username || '';
                        } catch (error) {
                            console.error(`Error fetching friend for challenge ${challenge.challengeID}:`, error);
                        }
                    }
                
                    return { 
                        ...challenge, 
                        ...challengeDetails,
                        friendUsername
                    };
                })
            );
            
            setCurrChallenges(detailedChallenges);
        } catch (error) {
            console.error('[fetchChallenges] Error fetching challenges:', error);
        }
    };
    
    // Fetch completed challenges function
    const fetchCompletedChallenges = async () => {
        try {
            const challenges = await getCompletedChallenges(user.id);
            const detailedChallenges: Challenge[] = await Promise.all(
                challenges.map(async (challenge: Challenge): Promise<Challenge> => {
                    let friendUsername = '';
                    if (challenge.friendUid && challenge.friendUid !== "") {
                        try {
                            const friend = await getFriendItem(challenge.friendUid);
                            friendUsername = friend?.username || '';
                        } catch (error) {
                            console.error(`Error fetching friend for challenge ${challenge.challengeID}:`, error);
                        }
                    }
                
                    return { 
                        ...challenge, 
                        friendUsername
                    };
                })
            );
            setCompletedChallenges(detailedChallenges);
        } catch (error) {
            console.error('[fetchCompletedChallenges] Error fetching challenges:', error);
        }
    };
    
    // Fetch leaderboard function
    const fetchLeaderboard = async () => {
        try {

            let userPoints = 0;
            try {
                userPoints = await getUserPoints(user.id) || 0;
            } catch (pointsError) {
                console.error("[fetchLeaderboard] Error fetching user points:", pointsError);
                userPoints = user.points || 0; 
            }
            
            const friends = await getFriendsList(user.id);
            const detailedFriends: Friend[] = await Promise.all(
                friends.map(async (friendID: string): Promise<Friend> => {
                    const profile = await getFriendProfile(friendID);
                    return {
                        friendID,
                        username: profile?.username || '',
                        avatar: profile?.avatar || 0,
                        points: profile?.points || 0,                 
                    };
                })
            );

            // Add the user to the friend list with the freshly fetched points
            const userProfile: Friend = {
                friendID: user.id,
                username: user.username,
                avatar: user.avatar,
                points: userPoints, 
            };
            detailedFriends.push(userProfile);

            // Sort the friend list by points in descending order
            detailedFriends.sort((a, b) => b.points - a.points);

            
            setLeaderboardList(detailedFriends);
        } catch (error) {
            console.error('[fetchLeaderboard] Error fetching leaderboard:', error);
        }
    };

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

    const challenges = () => (
        <Block>
            <Block marginTop={sizes.m} paddingHorizontal={sizes.padding}>
            <Block>
                {/* Render challenges */}
                {currChallenges && currChallenges.map((challenge, index) => {
                    const descriptionText = challenge.friendUid && challenge.friendUid !== "" && challenge.friendUsername 
                        ? `${challenge.description} @${challenge.friendUsername}`
                        : challenge.description;
                        
                    return (
                        <Block key={index} card row marginBottom={sizes.s}>
                            <Block padding={sizes.s} justify="center" style={{ alignItems: 'center' }}>
                                    <Image
                                        source={challengeIconP}
                                        style={styles.challengeIcon}
                                        resizeMode="contain"
                                    />
                                <Text p bold style={{ alignSelf: 'center', textAlign: 'center', maxWidth: "80%"}}>{descriptionText}</Text>
                                <Text p style={{ alignSelf: 'center', marginBottom: sizes.s }}>{challenge.progress}/{challenge.goal}</Text>
                                <Progress.Bar progress={challenge.progress / challenge.goal} width={200} color={colors.secondary}/>
                            </Block>
                        </Block>
                    );
                })}
                {/* Render completed challenges */}
                {completedChallenges && completedChallenges.map((challenge, index) => {
                    const descriptionText = challenge.friendUid && challenge.friendUid !== "" && challenge.friendUsername 
                        ? `${challenge.description} @${challenge.friendUsername}`
                        : challenge.description;
                        
                    return (
                        <Block key={index} card row marginBottom={sizes.s} color={colors.lightgray}>
                        <Block padding={sizes.s} justify="center" style={{ alignItems: 'center' }}>
                            <Image
                                source={challengeIconP}
                                style={styles.challengeIcon}
                                resizeMode="contain"
                            />
                            <Text p bold style={{ alignSelf: 'center', textAlign: 'center', maxWidth: "80%"}}>{descriptionText}</Text>
                            <Text p style={{ alignSelf: 'center', marginBottom: sizes.s }}>{challenge.progress}/{challenge.goal}</Text>
                            <Progress.Bar progress={challenge.progress / challenge.goal} width={200} color={colors.secondary}/>
                        </Block>
                    </Block>
                    );
                })}
            </Block>
            </Block>
        </Block>
    );

    const leaderboard = () => (
        <Block>
            <Block marginTop={sizes.m} paddingHorizontal={sizes.padding}>
            <Block>
                {/* Render leaderboard */}
                {leaderboardList && leaderboardList.length > 1 && leaderboardList.map((friend, index) => (
                    <Block 
                        key={index} 
                        card 
                        row 
                        marginBottom={sizes.s} 
                        color={friend.username === user.username ? colors.white : colors.secondary}
                        style={friend.username === user.username ? {
                            borderWidth: 2,
                            borderColor: colors.secondary,
                        } : {}}
                    >
                        <Block
                            row 
                            align="center"
                            marginVertical={sizes.xs}
                            padding={sizes.s}
                            width="100%"
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    navigation.navigate('FriendProfile', { thisFriendId: friend.friendID });
                                }}
                                >
                                <Image
                                    source={avatarMap[friend.avatar] || avatarMap[0]}
                                    style={styles.avatar}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                            <Block flex={1} marginLeft={sizes.s} marginRight={sizes.m}>
                                <Text 
                                    p 
                                    bold 
                                    color={friend.username === user.username ? colors.black : colors.white}
                                    numberOfLines={1}
                                >
                                    {friend.username}
                                </Text>
                                <Text 
                                    p 
                                    style={{ marginBottom: sizes.s }} 
                                    color={friend.username === user.username ? colors.black : colors.white}
                                >
                                    Points: {friend.points}
                                </Text>
                            </Block>
                            {index === 0 ? (
                                <Image
                                    source={gold}
                                    style={styles.medalIcon}
                                    resizeMode="contain"
                                />
                            ) : index === 1 ? (
                                <Image
                                    source={silver}
                                    style={styles.medalIcon}
                                    resizeMode="contain"
                                />
                            ) : index === 2 ? (
                                <Image
                                    source={bronze}
                                    style={styles.medalIcon}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View 
                                style={{
                                    width: 30,
                                    height: 30,
                                    backgroundColor: colors.secondarylight,
                                    borderRadius: 6,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    right: 15,
                                }}
                                >
                                <Text 
                                    p 
                                    bold 
                                    center
                                    color={friend.username === user.username ? colors.white : colors.secondarydark}
                                >
                                        {index + 1}
                                    </Text>
                                </View>
                            )}
                        </Block>
                    </Block>
                ))}
                {leaderboardList && leaderboardList.length === 1 && (
                    <Block center padding={sizes.padding} marginTop={200}>
                    <Text p center marginBottom={sizes.m}>
                        You haven't added any friends yet. Add some friends to compare your progress on the leaderboard.
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

    const [products, setProducts] = useState(challenges);
    
   const handleProducts = useCallback(
       (tab: number) => {
         setTab(tab);
         setProducts(tab === 0 ? challenges : leaderboard);
       },
       [challenges, leaderboard, setTab, setProducts],
     );
       
      return (
        <Block>
             {/* toggle tabs - connected buttons */}
            <Block
                row
                flex={0}
                align="center"
                justify="center"
                color={colors.card}
                paddingBottom={sizes.sm}
                paddingTop={sizes.xxl}
                paddingHorizontal={sizes.sm}
            >
                <Block 
                    row 
                    flex={0} 
                    style={{
                        borderRadius: 8,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}
                >
                    <Button 
                        onPress={() => handleProducts(0)}
                        color={tab === 0 ? colors.primary : colors.card}
                        style={{
                            borderTopLeftRadius: 8,
                            borderBottomLeftRadius: 8,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            paddingHorizontal: sizes.m,
                            paddingVertical: sizes.s,
                            elevation: 0,
                            shadowColor: 'transparent',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0,
                            shadowRadius: 0,
                            paddingRight: sizes.m + 15
                        }}
                    >
                        <Block row align="center">
                            <Image
                                radius={0}
                                source={tab === 0 ? challengeIconW : challengeIconB}
                                color={tab === 0 ? colors.white : colors.black}
                                width={sizes.socialRadius}
                                height={sizes.socialRadius}
                                marginRight={sizes.s}
                            />
                            <Text p 
                                font={fonts?.[tab === 0 ? 'medium' : 'normal']}
                                color={tab === 0 ? colors.white : colors.black}
                            >
                                Challenges
                            </Text>
                        </Block>
                    </Button>
                    
                    <Button 
                        onPress={() => handleProducts(1)}
                        color={tab === 1 ? colors.primary : colors.card}
                        style={{
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderTopRightRadius: 8,
                            borderBottomRightRadius: 8,
                            paddingHorizontal: sizes.m,
                            paddingVertical: sizes.s,
                            elevation: 0,
                            shadowColor: 'transparent',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0,
                            shadowRadius: 0,
                        }}
                    >
                        <Block row align="center">
                            <Image
                                radius={0}
                                source={tab === 1 ? leaderboardIconW : leaderboardIconB}
                                color={tab === 1 ? colors.white : colors.black}
                                width={sizes.socialRadius}
                                height={sizes.socialRadius}
                                marginRight={sizes.s}
                            />
                            <Text p 
                                font={fonts?.[tab === 1 ? 'medium' : 'normal']}
                                color={tab === 1 ? colors.white : colors.black}
                            >
                                Leaderboard
                            </Text>
                        </Block>
                    </Button>
                </Block>
            </Block>

            {/* content */}
            <Block
                scroll
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: sizes.padding }}>
            {tab === 0 ? challenges() : leaderboard()}
            </Block>
        </Block>
      );
}

export default Challenges;

const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  medalIcon: {
    width: 60,
    height: 60,
  },
  challengeIcon: {
    width: 34,
    height: 34,
    position: 'absolute',
    top: 0,
    right: -5,
    zIndex: 1,
  },
});