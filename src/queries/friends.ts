import { doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, query, collection, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { updateChallengeProgress } from './challenges';

export async function getFriendsList(user_id: string ) {
    try {
        const userDocRef = doc(db, 'users', user_id);
        const userDocSnapshot = await getDoc(userDocRef);
        if (!userDocSnapshot.exists()) {
            console.error('User does not exist!');
            return;
        }
        const userData = userDocSnapshot.data();

        const friendList = userData?.friendsID || [];
        return friendList;
    } catch (error) {
        console.error('Could not get friend`s List', error);
        throw error;
    }
}

export async function getFriendItem(friendUid: string) {
    try {
        const friendDocRef = doc(db, "users", friendUid);
        const friendDocSnapshot = await getDoc(friendDocRef);
        if (!friendDocSnapshot.exists()) {
            console.error('Friend does not exist!');
            return;
        }
        const friendData = friendDocSnapshot.data();

        const friendInfo = friendData ? {
            id: friendData.id || "",
            username: friendData.username || "",
            avatar: friendData.avatar || 0, // 0 -> default avatar
        } : {
            id: "",
            username: "",
            avatar: 0,
        };

        return friendInfo;
    } catch (error) {
        console.error('Could not get friend`s Profile', error);
        throw error;
    }
}

export async function updatePoints(user: { uid: string }, currPoints: number) {
    try {
        const currentUserRef = doc(db, "users", user.uid);
        await updateDoc(currentUserRef, {
            points: arrayUnion(currPoints), 
        });
    } catch (error) {
        console.error('Could not update Points', error);
        throw error;
    }
}

export async function getFriendCompletedLessons(user_id: string) {
    try {
        const friendDocRef = doc(db, "users", user_id);
        const friendDocSnapshot = await getDoc(friendDocRef);
        const friendData = friendDocSnapshot.data();

        const friendCompletedLessons = friendData?.completedLessons || 0;
        return friendCompletedLessons;
    } catch (error) {
        console.error('Could not get friend`s Completed Lessons', error);
        throw error;
    }
}

export async function addFriend(user_id: string, friend_id: string) {
  try {
      const currentUserRef = doc(db, "users", user_id);
      await updateDoc(currentUserRef, {
          friendsID: arrayUnion(friend_id),
      });

      updateChallengeProgress(user_id, "FRIEND");

      console.log('[addFriend] Friend added successfully');
      return true;
  } catch (error) {
      console.error('[addFriend] Could not add friend', error);
      throw error;
  }
}

export async function removeFriend(user_id: string, friend_id: string) {
  try {
      const currentUserRef = doc(db, "users", user_id);
      await updateDoc(currentUserRef, {
          friendsID: arrayRemove(friend_id),
      });

      console.log('[removeFriend] Friend removed successfully');
      return true;
  } catch (error) {
      console.error('[removeFriend] Could not remove friend', error);
      throw error;
  }
}

export async function getFriendItems(user_id: string) {
    let friendDocs = [];
    try {
      const friendIDs = await getFriendsList(user_id);
      for (const friendID of friendIDs){
        try{
          const res = await getFriendItem(friendID);
          if (!res){
            console.warn("[getFriendItems] Failed to retrieve a Friend");
            return
          }
          friendDocs.push(res);
        } catch (err){

        }
      }      
    } catch (error) {
      console.error('[getFriendItems] Error fetching friend list:', error);
    }

    return friendDocs;
  };

export async function getFriendCount(user_id: string){
  try {
      const userDocRef = doc(db, 'users', user_id);
      const userDocSnapshot = await getDoc(userDocRef);
      if (!userDocSnapshot.exists()) {
          console.error('User does not exist!');
          return;
      }
      const userData = userDocSnapshot.data();
      return userData?.friendsID.length || 0;
  } catch (error) {
      console.error('[getFriendCount] Could not get friend`s List', error);
      throw error;
  }
}

export async function getFriendProfile(friend_id: string){
  try {
    const friendDocRef = doc(db, "users", friend_id);
    const friendDocSnapshot = await getDoc(friendDocRef);
    if (!friendDocSnapshot.exists()) {
        console.error('[getFriendProfile] Friend does not exist!');
        return;
    }
    const friendData = friendDocSnapshot.data();

    const friendInfo = friendData ? {
        id: friendData.id || "",
        username: friendData.username || "",
        badges: friendData.badges || [],
        avatar: friendData.avatar || 0, 
        points: friendData.points || 0,
    } : {
        id: "",
        username: "",
        badges: [],
        avatar: 0,
        points: 0,
    };

    return friendInfo;
  } catch (error) {
    console.error('[getFriendProfile] Could not get friend`s profile data', error);
    throw error;
  }
}

// differs from getUserPointsRank - this function returns the friend's ranking relative to THEIR friends
export async function getFriendPointsRank(friend_id: string) {
  try {
    // Get the friend's document
    const friendRef = doc(db, "users", friend_id);
    const friendDoc = await getDoc(friendRef);

    if (!friendDoc.exists()) {
      return null;
    }

    const friendData = friendDoc.data();
    // Assume the friend's document has a field "friendsID" that is an array of their friend IDs
    const friendFriendsIDs: string[] = friendData.friendsID || [];

    // To rank the friend among their friends, we query for both their friends and the friend themselves.
    const queryIDs = [...friendFriendsIDs, friend_id];

    const friendsQuery = query(
      collection(db, "users"),
      where("__name__", "in", queryIDs)
    );

    const friendsSnapshot = await getDocs(friendsQuery);
    const friendsWithPoints = friendsSnapshot.docs.map((doc) => ({
      id: doc.id,
      points: doc.data().points || 0, 
    }));

    // Sort in descending order by points
    friendsWithPoints.sort((a, b) => b.points - a.points);

    // Determine the rank by finding the index of the friend (add 1 because rank starts at 1)
    const rank = friendsWithPoints.findIndex(f => f.id === friend_id) + 1;

    return rank;
  } catch (error) {
    console.error("[getFriendPointsRank] Error fetching friend's rank:", error);
    return null;
  }
}

export async function getUserPointsRank(userId: string) {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
       return null;
    }

    const userData = userDoc.data();
    const friendsID: string[] = userData.friendsID || [];

    const friendsQuery = query(
      collection(db, "users"),
      where("__name__", "in", [...friendsID, userId]) 
    );

    const friendsSnapshot = await getDocs(friendsQuery);
    const friendsWithPoints = friendsSnapshot.docs.map((doc) => ({
      id: doc.id,
      points: doc.data().points || 0, 
    }));

    friendsWithPoints.sort((a, b) => b.points - a.points);

    const rank = friendsWithPoints.findIndex(friend => friend.id === userId) + 1; 

    return rank;

  } catch (error) {
    console.error("[getUserPointsRank] Error fetching rank:", error);
    return null;
  }
};

export async function getFriendByUsername(username: string) {
  try {
    const allResults = [];

    // Generate both uppercase and lowercase versions of the username
    const uppercaseUsername = username.toUpperCase();
    const lowercaseUsername = username.toLowerCase();

    // Query 1: Exact match
    const query1 = query(
      collection(db, "users"),
      where("username", "==", username)
    );
    const result1 = await getDocs(query1);
    allResults.push(...result1.docs);

    // Query 2: Search with Uppercase
    if (username !== uppercaseUsername) {  
      const query2 = query(
        collection(db, "users"),
        where("username", "==", uppercaseUsername)
      );
      const result2 = await getDocs(query2);
      allResults.push(...result2.docs);
    }

    // Query 3: Search with Lowercase
    if (username !== lowercaseUsername) { 
      const query3 = query(
        collection(db, "users"),
        where("username", "==", lowercaseUsername)
      );
      const result3 = await getDocs(query3);
      allResults.push(...result3.docs);
    }

    // Remove duplicates by document ID
    const uniqueResults = allResults.reduce((acc, doc) => {
      if (!acc.find(user => user.id === doc.id)) {
        acc.push(doc);
      }
      return acc;
    }, []);

    if (uniqueResults.length === 0) {
      console.log(`[getFriendByUsername] User with username "${username}" not found.`);
      return null;
    }

    // Return all unique user documents as an array
    return uniqueResults.map(userDoc => ({
      id: userDoc.id,
      username: userDoc.data().username,
      avatar: userDoc.data().avatar || 0,
    }));

  } catch (error) {
    console.error("[getFriendByUsername] Error checking user by username:", error);
    return null;
  }
}