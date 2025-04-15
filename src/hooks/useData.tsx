import React, {useCallback, useContext, useEffect, useState} from 'react';
import Storage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig"; 


import {
  IUser,
  IUseData,
  ITheme,
} from '../constants/types';

import {light, dark} from '../constants';

export const DataContext = React.createContext({});

export const DataProvider = ({children}: {children: React.ReactNode}) => {
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState<ITheme>(light);
  const [user, setUser] = useState<IUser | null>(null);

  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [currentCourses, setCurrentCourses] = useState({});
  const [currentLessons, setCurrentLessons] = useState({});

  // manage User's authenticated state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        console.log("User logged in, fetching data...");
  
        try {
          const userRef = doc(getFirestore(), "users", firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as IUser;
            setUser(userData); // Update user state
            console.log("User data loaded!");
          } else {
            console.warn("User document not found in Firestore!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.log("No user logged in, resetting user state.");
        setUser(null);
      }
    });
  
    return () => unsubscribe(); // ✅ Cleanup listener on unmount
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;
    if (user?.id) {
      const userRef = doc(db, "users", user.id);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as IUser;
          setCompletedCourses(userData.completedCourses || []);
        }
      });
    }
    // Cleanup the listener when the component unmounts or user changes
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, user?.completedCourses]);

  useEffect(() => {
    let unsubscribe: () => void;
    if (user?.id) {
      const userRef = doc(db, "users", user.id);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as IUser;
          setCurrentCourses(userData.currCourses || []);
        }
      });
    }
    // Cleanup the listener when the component unmounts or user changes
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, user?.currCourses]);


  useEffect(() => {
    let unsubscribe: () => void;
    if (user?.id) {
      const userRef = doc(db, "users", user.id);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as IUser;
          setCurrentLessons(userData.currLessons || {});
        }
      });
    }
    // Cleanup the listener when the component unmounts or user changes
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, user?.currLessons]);


  // get isDark mode from storage
  const getIsDark = useCallback(async () => {
    // get preferance gtom storage
    const isDarkJSON = await Storage.getItem('isDark');

    if (isDarkJSON !== null) {
      // set isDark / compare if has updated
      setIsDark(JSON.parse(isDarkJSON));
    }
  }, [setIsDark]);

  // handle isDark mode
  const handleIsDark = useCallback(
    (payload: boolean) => {
      // set isDark / compare if has updated
      setIsDark(payload);
      // save preferance to storage
      Storage.setItem('isDark', JSON.stringify(payload));
    },
    [setIsDark],
  );


  // handle user
  const handleUser = useCallback(
    async (payload: IUser) => {
      if (!user?.id) return; // Ensure user is logged in
  
      try {
        const userRef = doc(getFirestore(), "users", user.id);
        await setDoc(userRef, payload, { merge: true });
        setUser(payload);
        console.log("User profile updated, synced to:", payload);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    },
    [user]
  );

  // get initial data for: isDark & language
  useEffect(() => {
    getIsDark();
  }, [getIsDark]);

  // change theme based on isDark updates
  useEffect(() => {
    setTheme(light);
  }, [isDark]);

  const contextValue = {
    isDark,
    handleIsDark,
    theme,
    setTheme,
    user,
    setUser,
    handleUser,
    completedCourses,
    setCompletedCourses,
    currentCourses,
    setCurrentCourses,
    currentLessons,
    setCurrentLessons,
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext) as IUseData;
