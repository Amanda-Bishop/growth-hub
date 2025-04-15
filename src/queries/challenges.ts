import { doc, getDoc, setDoc, getDocs, collection, addDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { addPostToUser } from './feed';

// Updates the user's points count
export async function updatePoints(uid: string, type: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        console.log('[updatePoints] No such user');
        return false;
    }
    const userData = userSnap.data();
    const points = userData.points || 0;
    let updatedPoints = points;
    if (type === "CHALLENGE") {
        updatedPoints += 20;
    } else {
        updatedPoints += 10;
    }
    await updateDoc(userRef, { points: updatedPoints });
    return true;
}

// Gets challenge from challenges collection by challengeID
export async function getChallengeById(challengeID: number) {
    const challengeRef = doc(db, 'challenges', challengeID.toString());
    const challengeSnap = await getDoc(challengeRef);
    return challengeSnap.data();
}

// Gets completed challenge from the user's completedChallenges collection by challengeID
export async function getCompletedChallengeById(uid: string, challengeID: number) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const completedChallenges = userSnap.data().completedChallenges;
        if (!completedChallenges || completedChallenges.length < 1) return null;
        const completedChallenge = completedChallenges.find((challenge: { challengeID: number }) => challenge.challengeID === challengeID);
        return completedChallenge;
    } else {
        console.log('[getCompletedChallengeById] No such user');
        return null;
    }
}

// Gets all challenges from the user's currChallenges
export async function getCurrChallenges(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const currChallenges = userSnap.data().currChallenges;
        return currChallenges;
    } else {
        console.log('[getCurrChallenges] No such user');
        return null;
    }
}

// Gets all challenges from the user's currChallenges
export async function getCompletedChallenges(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const completedChallenges = userSnap.data().completedChallenges;
        return completedChallenges;
    } else {
        console.log('[getCompletedChallenges] No such user');
        return null;
    }
}

// Gets challenge info from challenges collection to match the challenges in the user's currChallenges
export async function getChallengeList(uid: string) {
    const currChallenges = await getCurrChallenges(uid);
    if (!currChallenges) {
        return [];
    }
    const challengesRef = collection(db, 'challenges');
    const challengesSnapshot = await getDocs(challengesRef);
    const challenges = challengesSnapshot.docs
        .filter((doc) => currChallenges.includes(doc.id))
        .map((doc) => {
            const challengeData = doc.data();
            const userChallenge = currChallenges.find((challenge: { challengeID: number; progress: number }) => challenge.challengeID === Number(doc.id));
            return { id: doc.id, ...challengeData, type: challengeData.type, isSolo: challengeData.isSolo, progress: userChallenge.progress, goal: challengeData.goal };
        });
    return challenges;
}

// Adds challenge to user's currChallenges
export async function addChallengeToUser(uid: string, challengeID: number, friendUid: string) {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            currChallenges: arrayUnion({ challengeID, progress: 0, friendUid }),
        });
    } catch (error) {
        console.error('[addChallengeToUser] Error adding challenge to user:', error);
        throw error;
    }
}

// Picks a friend to complete the challenge with and adds the challenge to both users currChallenges
export async function addFriendChallenge(uid: string, challengeID: number) {
    const { getFriendsList } = await import("./friends");
    const friends = await getFriendsList(uid);
    if (friends.length === 0) {
        console.log('[addFriendChallenge] No friends found');
        return;
    }
    const randFriendUid = friends[Math.floor(Math.random() * friends.length)];
    await addChallengeToUser(uid, challengeID, randFriendUid);
    await addChallengeToUser(randFriendUid, challengeID, uid);
}

// Returns if challenge goal has been met
export async function challengeIsCompleted(uid: string, challengeID: number) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        console.log('[challengeIsCompleted] No such user');
        return false;
    }
    const currChallenges = userSnap.data().currChallenges;
    const challengeData = await getChallengeById(challengeID);
    for (const challenge of currChallenges) {
        if (challenge.challengeID === challengeID && challengeData && challenge.progress >= challengeData.goal) {
            return true;
        }
    }
    return false;
}

// Completes challenge by removing it from currChallenges and adding it to completedChallenges
export async function completeChallenge(uid: string, challengeID: number) {
    if (await challengeIsCompleted(uid, challengeID)) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            console.log('[completeChallenge] No such user');
            return false;
        }
        
        const currChallenges = userSnap.data().currChallenges;
        const challengeToComplete = currChallenges.find((challenge: { challengeID: number }) => challenge.challengeID === challengeID);
        
        if (!challengeToComplete) {
            console.log(`[completeChallenge] Challenge ${challengeID} not found in currChallenges`);
            return false;
        }
        const challengeDetails = await getChallengeById(challengeID);
        if (!challengeDetails) {
            console.log(`[completeChallenge] Challenge details not found for ${challengeID}`);
            return false;
        }
        const updatedCurrChallenges = currChallenges.filter(
            (challenge: { challengeID: number }) => challenge.challengeID !== challengeID
        );
        const completedChallenges = userSnap.data().completedChallenges || [];
        completedChallenges.push({
            challengeID: challengeID,
            description: challengeDetails.description,
            progress: challengeDetails.goal,
            goal: challengeDetails.goal,
            friendUid: challengeToComplete.friendUid || ""
        });
        updatePoints(uid, "CHALLENGE");
        await updateDoc(userRef, { 
            currChallenges: updatedCurrChallenges, 
            completedChallenges: completedChallenges 
        });

        addPostToUser(uid, "CHALLENGE", challengeID.toString());
    } 
}

// Updates the challenge progress for a friend so it matches the user's updated progress
export async function updateFriendChallengeProgress(uid: string, challengeID: number, progress: number) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        console.log('[updateFriendChallengeProgress] No such user');
        return false;
    }
    const currChallenges = userSnap.data().currChallenges;
    for (const challenge of currChallenges) {
        if (challenge.challengeID === challengeID) {
            challenge.progress = progress;
        }
    }
    await updateDoc(userRef, { currChallenges });
}

// Updates the challenge progress for a user based on the action type
export async function updateChallengeProgress(uid: string, type: string) {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            console.log('[updateChallengeProgress] No such user');
            return false;
        }
        
        const userData = userSnap.data();
        if (!userData.currChallenges || !Array.isArray(userData.currChallenges)) {
            console.log('[updateChallengeProgress] User has no current challenges');
            return false;
        }
        
        const currChallenges = [...userData.currChallenges];
        let updatedAny = false;
        
        for (let i = 0; i < currChallenges.length; i++) {
            const challenge = currChallenges[i];
            const challengeData = await getChallengeById(challenge.challengeID);
            
            if (challengeData && challengeData.type === type) {
                currChallenges[i] = {
                    ...challenge,
                    progress: (challenge.progress || 0) + 1
                };
                if (!challengeData.isSolo && challenge.friendUid) {
                    await updateFriendChallengeProgress(challenge.friendUid, challenge.challengeID, currChallenges[i].progress);
                }
                
                updatedAny = true;
            }
            if (challengeData && challengeData.type === "POINTS") {
                currChallenges[i] = {
                    ...challenge,
                    progress: (challenge.progress || 0) + 10
                };
            }
        }
        
        if (updatedAny) {
            updatePoints(uid, "POINTS");
            await updateDoc(userRef, { currChallenges });
            return true;
        } 
    } catch (error) {
        console.error(`[updateChallengeProgress] Error updating challenge progress:`, error);
        return false;
    }
}


// Updates the user's currChallenges
export async function updateCurrUserChallenges(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        console.log('[updateCurrUserChallenges] No such user');
        return false;
    }
    
    const currChallenges = userSnap.data().currChallenges;
    for (const challenge of currChallenges) {
        await completeChallenge(uid, challenge.challengeID);
    }

    const updatedCurrChallenges = await getCurrChallenges(uid);
    const completedChallenges = userSnap.data().completedChallenges || [];
    if (updatedCurrChallenges.length < 4) {
        const challengesRef = collection(db, 'challenges');
        const challengesSnapshot = await getDocs(challengesRef);
        
        const allChallenges = challengesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                isSolo: data.isSolo
            };
        });
        
        for (let i = 0; i < 4 - updatedCurrChallenges.length; i++) {
            const availableChallenges = allChallenges.filter(challenge => {
                const inCurrent = updatedCurrChallenges.some(
                    (curr: { challengeID: number }) => curr.challengeID === Number(challenge.id)
                );
                
                const inCompleted = completedChallenges.some(
                    (comp: { challengeID: number }) => comp.challengeID === Number(challenge.id)
                );
                return !inCurrent && !inCompleted;
            });

            if (availableChallenges.length === 0) {
                console.log('[updateCurrUserChallenges] No more available challenges to add');
            }
            
            const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
            const challengeID = Number(randomChallenge.id);
            if (randomChallenge.isSolo) {
                await addChallengeToUser(uid, challengeID, "");
            } else {
                await addFriendChallenge(uid, challengeID);
            }
        }
    }
}

// Gets a random solo challenge from user's current challenges
export async function getRandChallenge(uid: string) {
    try {
        const currChallenges = await getCurrChallenges(uid);
        
        if (!currChallenges || !Array.isArray(currChallenges) || currChallenges.length === 0) {
            return null;
        }
        
        // Filter to only include solo challenges (where friendUid is empty)
        const soloChallenges = currChallenges.filter(challenge => 
            !challenge.friendUid || challenge.friendUid === ""
        );
        
        if (soloChallenges.length === 0) {
            return null;
        }
        
        // Select a random solo challenge
        const randIndex = Math.floor(Math.random() * soloChallenges.length);
        const randChallenge = soloChallenges[randIndex];
        
        return randChallenge;
        
    } catch (error) {
        console.error("[getRandChallenge] Error getting random challenge:", error);
        return null;
    }
}