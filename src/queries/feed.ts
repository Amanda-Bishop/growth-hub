import { doc, getDoc, setDoc, getDocs, collection, addDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getFriendsList } from './friends';

// Gets all posts from the user's feed posts
export async function getPostsByUser(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const posts = userSnap.data().feedPosts;
        return posts;
    } else {
        console.log('[getPostsByUser] No such user');
        return null;
    }
}

// Adds post to user's feedPosts
export async function addPostToUser(uid: string, type: string, id: string) {
    try {
        const userRef = doc(db, 'users', uid);
        const time = Date.now();
        await updateDoc(userRef, {
            feedPosts: arrayUnion({ type, id, time: time }),
        });
    } catch (error) {
        console.error('Error adding post to user:', error);
    }

}

// Updates like count for a post when the user has liked it
export async function likeUserPost(uid: string, friendUid: string, postId: string, descriptiveId: string) {
    try {
        // Update the post owner's post to increment likes
        const friendRef = doc(db, 'users', friendUid);
        const friendSnap = await getDoc(friendRef);
        
        if (friendSnap.exists()) {
            const userData = friendSnap.data();
            const posts = userData.feedPosts || [];
            
            const updatedPosts = posts.map((post: any) => {
                if (post.id === postId) {
                    const currentLikes = post.likes || 0;
                    return {
                        ...post,
                        likes: currentLikes + 1
                    };
                }
                return post;
            });
            await updateDoc(friendRef, { feedPosts: updatedPosts });
            
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                await updateDoc(userRef, {
                        likedPosts: arrayUnion(descriptiveId)
                    });
                
            } else {
                console.error('[likeUserPost] Current user does not exist');
            }
        } else {
            console.error('[likeUserPost] No such friend user');
        }
    } catch (error) {
        console.error('[likeUserPost] Error liking post:', error);
    }
}

// Updates like count for a post when the user has unliked it
export async function unlikeUserPost(uid: string, friendUid: string, postId: string, descriptiveId: string) {
    try {
        const friendRef = doc(db, 'users', friendUid);
        const friendSnap = await getDoc(friendRef);
        
        if (friendSnap.exists()) {
            const userData = friendSnap.data();
            const posts = userData.feedPosts || [];
            
            // Find the post to update
            const updatedPosts = posts.map((post: any) => {
                if (post.id === postId) {
                    const currentLikes = post.likes || 0;
                    return {
                        ...post,
                        likes: Math.max(0, currentLikes - 1)
                    };
                }
                return post;
            });
            
            await updateDoc(friendRef, {
                feedPosts: updatedPosts
            });
            
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists() && userSnap.data().likedPosts) {
                const likedPosts = userSnap.data().likedPosts;
                const updatedLikedPosts = likedPosts.filter((id: string) => id !== descriptiveId);
                
                await updateDoc(userRef, {
                    likedPosts: updatedLikedPosts
                });
            }
        } else {
            console.error('[unlikeUserPost] No such user');
        }
    } catch (error) {
        console.error('[unlikeUserPost] Error unliking post:', error);
    }
}

// Gets all liked posts from the user's feed posts
export async function getLikedPosts(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const posts = userSnap.data().likedPosts;
        return posts;
    } else {
        console.log('[getLikedPosts] No such user');
        return null;
    }
}

// Gets a random friend's most recent post
export async function getRandomFriendPost(uid: string) {
    try {
        // Get the user's friends list
        const friends = await getFriendsList(uid);
        
        if (!friends || !Array.isArray(friends) || friends.length === 0) {
            return null;
        }
        
        // Shuffle the friends array to randomize the order
        const shuffledFriends = [...friends].sort(() => Math.random() - 0.5);
        
        // Try each friend in the shuffled order until we find one with posts
        for (const friendUid of shuffledFriends) {
            const friendPosts = await getPostsByUser(friendUid);
            
            if (friendPosts && Array.isArray(friendPosts) && friendPosts.length > 0) {
                // Get the most recent post (last in the array)
                const post = friendPosts[friendPosts.length - 1];
                
                // Return both the post and friendUid
                return {
                    post: post,
                    friendID: friendUid
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error('[getRandomFriendPost] Error:', error);
        return null;
    }
}