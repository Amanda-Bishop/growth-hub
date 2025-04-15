import React, {useEffect, useState} from 'react';
import {Platform, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {Block, Button, Image, Input, Text} from '../components/';
import {useData, useTheme, useTranslation} from '../hooks/';
import { getFriendItems, getFriendByUsername, addFriend, removeFriend } from '../queries/friends';
import { FriendItem } from '../constants/types/db';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../navigation/StackParamLists'
import { avatarMap } from "../constants/avatars";

const isAndroid = Platform.OS === 'android';


const FriendList = () => {
  const {user} = useData();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResult, setSearchResult] = useState<FriendItem[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const {t} = useTranslation();
  type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'Profile'>;
  const navigation = useNavigation<ProfileNavigationProp>();
  
  const {assets, colors, sizes, gradients} = useTheme();

  useEffect(() => {
    if (user?.id) {
      fetchFriendList(user.id); 
    }
  }, [user?.id]);

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
  };



  const renderFriendItem = ({ item }: { item: FriendItem }) => {
    const isFriend = friends.some(friend => friend.id === item.id);

    return (
      <TouchableOpacity
            onPress={() => {
              navigation.navigate('FriendProfile', { thisFriendId: item.id });
            }}
          >
      <Block
        row
        align="center"
        marginVertical={sizes.xs}
        padding={sizes.s}
        card
        style={styles.friendCard}
      >
        
        {/* Left Section: Avatar and Name */}
        <Block row align="center">
          <Image
            source={avatarMap[item.avatar] || avatarMap[0]}
            style={styles.avatar}
            resizeMode="cover"
          />
          <Block marginLeft={sizes.s}>
            <Text p bold>{item.username}</Text>
          </Block>
        </Block>

        {/* Right Section: Buttons */}
        <Block row align="center" justify="flex-end" flex={1}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('FriendProfile', { thisFriendId: item.id });
            }}
          >
            <Block paddingVertical={sizes.xs}  paddingHorizontal={sizes.s}  radius={sizes.s}
              color={colors.primary}
              justify='center'>
              <Text white bold>
                View
              </Text>
            </Block>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              if (isFriend) {
                removeFriend(user.id, item.id);
                fetchFriendList(user.id); 
              } else {
                addFriend(user.id, item.id);
                fetchFriendList(user.id);
              }
            }}
            >
            {isFriend ? (
              <Block marginLeft={sizes.s} paddingVertical={sizes.xs} paddingHorizontal={sizes.s} radius={sizes.s}
              color={colors.gray}
              justify='center'>
                <Text white bold>{isFriend ? "Unfriend" : "Add Friend"}</Text>
              </Block>
            ) : (
              <Block marginLeft={sizes.s} paddingVertical={sizes.xs} paddingHorizontal={sizes.s} radius={sizes.s}
              color={colors.tertiary}
              justify='center'>
                <Text white bold>{isFriend ? "Unfriend" : "Add Friend"}</Text>
              </Block>
            )}

          </TouchableOpacity>
        </Block>
        
      </Block>
      </TouchableOpacity>
    );
  };


  return (
    <Block color={colors.card}>
      <Block padding={sizes.sm}  marginTop={sizes.md}>

        <Button
          row
          flex={0}
          justify="flex-start"
          onPress={() => navigation.goBack()}>
          <Image
            radius={0}
            width={10}
            height={18}
            color={colors.black}
            source={assets.arrow}
            transform={[{rotate: '180deg'}]}
          />
          <Text p semibold color={colors.black} marginLeft={sizes.s}>
            Back
          </Text>
        </Button>

        <Block color={colors.card} flex={0} paddingVertical={sizes.padding}>
          <Input search placeholder={t('common.searchFriends')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={async (event) => {
              const query = event.nativeEvent.text;
              if (!query.trim()) {
                setSearchResult([]);
                return;
              }
              setLoading(true);

              const res = await getFriendByUsername(query);
              setSearchResult(res ? res : []);
              setLoading(false);
            }}
          />
        </Block>

        <Text h5 semibold style={styles.header}>
          Friends
        </Text>

        <Block style={styles.listWrapper}>
          <FlatList
            data={searchQuery ? searchResult : friends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            ListEmptyComponent={<Text>No friends found.</Text>}
            showsVerticalScrollIndicator={true}
            refreshing={loading}
            onRefresh={() => {
              () => fetchFriendList(user.id)
            }}
          />
        </Block>

      </Block>
    </Block>
  );
}


export default FriendList;


const styles = StyleSheet.create({
  header: {
    marginBottom: 8,
  },
  listWrapper: {
    height: 210, 
  },
  friendCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  divider: {
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  outerContainer: {
    flexDirection: 'row',         
    justifyContent: 'space-evenly',
    alignItems: 'center', 
    width: '100%', 
    paddingHorizontal: 10,  
  },
  text: {
    fontSize: 16,

  },
  squareBlock: {
    flex: 1,  
    marginHorizontal: 5,  
    backgroundColor: '#f0f0f0',
    alignItems: 'center', 
    borderRadius: 10,
    paddingTop: 15,
    paddingBottom: 15,
    minWidth: 125
  },
});