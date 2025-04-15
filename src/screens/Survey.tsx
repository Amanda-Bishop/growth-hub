import React, { useState } from 'react';
import { View, Platform, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/core';

import { Block, Button, Image, Text } from '../components';
import { useData, useTheme } from '../hooks';
import { getUser, addUserSurvey, updateUserAvatar } from '../queries/auth';
import { avatarMap } from "../constants/avatars";
import { IUser } from '../constants/types';

const isAndroid = Platform.OS === 'android';

const questions = [
    {
        id: 1,
        title: "Question Format Preferences",
        prompt: "What type of questions do you enjoy for learning?",
        options: ["Multiple Choice", "Multiple Select", "True/False", "Matching"],
    },
    {
        id: 2,
        title: "Favorite Topics",
        prompt: "What courses are you most interested in learning about?",
        options: ["Anatomy", "Healthcare", "Consent & Relationships", "Birth Control", "Gender Identity & Sexual Orientation", "Pleasure & Attraction"],
    },
    {
        id: 3,
        title: "Main Goals",
        prompt: "What are your main learning goals right now?",
        options: ["Keeping my mind sharp", "Learning new things", "Making the most of my free time", "Socializing and making new connections"],
    }
];

const courseMapping: Record<string, string> = {
    "anatomy": "basic_anatomy",
    "birth_control": "birth_control",
    "consent_&_relationships": "consent_and_healthy_relationships",
    "gender_identity_&_sexual_orientation": "gender_and_sexuality",
    "healthcare": "healthcare",
    "pleasure_&_attraction": "pleasure",
};

const Survey = () => {
    const { user, setUser } = useData(); 
    const navigation = useNavigation();
    const { assets, colors, fonts, gradients, sizes } = useTheme();

    const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: string[] }>({});
    const [selectedAvatar, setSelectedAvatar] = useState<number>(user?.avatar || 0);

    const normalizeOption = (option: string) => option.toLowerCase().replace(/\s+/g, "_");

    const toggleOption = (questionId: number, option: string) => {
        const normalizedOption = normalizeOption(option);
        setSelectedOptions((prev) => {
            const currentSelection = prev[questionId] || [];
            return {
                ...prev,
                [questionId]: currentSelection.includes(normalizedOption)
                    ? currentSelection.filter((item) => item !== normalizedOption)
                    : [...currentSelection, normalizedOption],
            };
        });
    };

    const handleAvatarSelect = (avatarId: number) => {
        setSelectedAvatar(avatarId);
    };

    const handleSubmit = async () => {
        if (!user?.id) {
            console.log("Error", "User not found.");
            return;
        }
        try {
            const transformedOptions: Record<number, string[]> = Object.fromEntries(
                Object.entries(selectedOptions).map(([key, values]) => [
                    key,
                    values.map(option => {
                        const mappedCourse = courseMapping[option]; 
                        return mappedCourse ? mappedCourse : option; 
                    })
                ])
            );
    
            await addUserSurvey(user.id, transformedOptions);
            await updateUserAvatar(user.id, selectedAvatar);
            console.log("Success", "Survey responses saved!");

            const userData = await getUser(user.id);
            setUser(userData as IUser);
        } catch (error) {
            console.log("Error saving survey responses:", error);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: sizes.padding }}>
            <Block card padding={sizes.m} marginTop={sizes.s} marginBottom={sizes.m} style={styles.headerCard}>
                <Text h3 color={colors.black} center>
                    Welcome to
                </Text>
                <Text h3 color={colors.black} center>
                    Growth Hub
                </Text>
                <Text h3 color={colors.primary} center>
                    {user?.username ? `${user.username}` : ""}
                </Text>
                <Text size={16.3} center marginTop={sizes.m}>
                    Please tell us a little bit about yourself and we'll personalize your learning experience!
                </Text>
            </Block>

            {questions.map((question) => (
                <Block key={question.id} card padding={sizes.m} marginBottom={sizes.m}>
                    <Text size={18} bold>{question.title}</Text>
                    <Text size={16.5} marginTop={sizes.s} marginBottom={sizes.s}>{question.prompt}</Text>

                    {question.options.map((option) => {
                        const normalizedOption = normalizeOption(option);
                        const isSelected = selectedOptions[question.id]?.includes(normalizedOption);
                        return (
                            <TouchableOpacity
                                key={option}
                                onPress={() => toggleOption(question.id, option)}
                                style={[
                                    styles.optionBox,
                                    {
                                        borderColor: isSelected ? "#007bff" : "#e9e9e9",
                                        backgroundColor: isSelected ? "#AEEBE6" : "#e9e9e9",
                                    },
                                ]}
                            >
                                <Text p semibold center color={isSelected ? colors.black : colors.text}>
                                    {option}  
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </Block>
            ))}

            <Block card padding={sizes.m} marginBottom={sizes.m}>
                <Text h5 bold>Select your Avatar</Text>
                <Block row wrap="wrap" justify="center" marginTop={sizes.m}>
                    {Object.keys(avatarMap).map((key) => {
                        const avatarId = parseInt(key);
                        return (
                            <TouchableOpacity key={avatarId} onPress={() => handleAvatarSelect(avatarId)}>
                                <Image
                                    source={avatarMap[avatarId]}
                                    style={[
                                        styles.avatar,
                                        {
                                            borderWidth: selectedAvatar === avatarId ? 2 : 0,
                                            borderColor: selectedAvatar === avatarId ? colors.primary : "transparent",
                                        },
                                    ]}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </Block>
            </Block>

            <Button flex={1} color={colors.primary} marginBottom={sizes.base} onPress={handleSubmit}>
                <Text white bold transform="uppercase" size={sizes.p}>
                    Submit
                </Text>
            </Button>
        </ScrollView>
    );
};

export default Survey;

const styles = StyleSheet.create({
  headerCard: {
      borderRadius: 10,
      padding: 10,
      alignItems: "center",
  },
  optionBox: {
      padding: 15,
      marginTop: 10,
      borderRadius: 8,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
  },
  avatar: {
      width: 90,
      height: 90,
      margin: 8
  },
});
