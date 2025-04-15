import { doc, getDoc, setDoc, getDocs, collection, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Add new user to the database
export async function addNewUser(email: string, password: string, username: string) {
    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
        console.log("[addNewUser] Username already taken.");
        return false; 
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User created with UID:", user.uid);

        const newUser = {
            id: user.uid, 
            username: username,
            email: email,
            avatar: 0,
            points: 0,
            badges: [], 
            friendsID: [],
            currCourses: [],
            currLessons: {},
            currChallenges: [],
            completedCourses: [],
            completedLessons: {},
            completedChallenges: [],
            survey: {},
            feedPosts: [],
            likedPosts: [],
        };
        // Save the user in Firestore using `user.uid` as the document ID
        await setDoc(doc(db, "users", user.uid), newUser);
        console.log("User saved in Firestore with ID:", user.uid);

        return true;
    } catch (error) {
        console.error("[addNewUser] Error creating user:", error);
        return false;
    }
}

// Login user
export async function loginUser(email: string, password: string) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user);

        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("[loginUser] Login failed:", error);
        return { success: false, message: error };
    }
}

// Get user data from uid
export async function getUser(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        console.log('User data:', userSnap.data());
        return userSnap.data();
    } else {
        console.log('[getUser] No such user');
        return null;
    }
}

// Get username from uid
export async function getUsername(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        console.log('User data:', userSnap.data());
        return userSnap.data().username;
    } else {
        console.log('[getUsername] No such user');
        return null;
    }

}

export async function isUsernameUnique(username: string): Promise<boolean> {
    const usersCollection = collection(db, "users");
    const usernameQuery = query(usersCollection, where("username", "==", username));
    const querySnapshot = await getDocs(usernameQuery);

    return querySnapshot.empty; 
}


// Add user initial survey to database
export async function addUserSurvey(uid: string, surveyResponses: any) {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { survey: surveyResponses });
        console.log("Added initial survey responses for user.");
    } catch (error) {
        console.error("Error updating survey responses:", error);
    }
}

// Updates user's avatar selection
export async function updateUserAvatar(uid: string, avatarId: number) {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { avatar: avatarId });
        console.log("Avatar updated for user.");
    } catch (error) {
        console.error("Error updating avatar:", error);
    }
}

// Returns user's points
export async function getUserPoints(uid: string) {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data().points;
        } else {
            return null;
        }
    } catch (error) {
        console.error("[getUserPoints] Error getting user points:", error);
    }
}