import React, { useState } from 'react';
import { View, Platform, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/core';

import { Block, Button, Image, Text } from '../components';
import { useData, useTheme } from '../hooks';

const linkIcon = require("../assets/icons/link.jpg");

const isAndroid = Platform.OS === 'android';

const tags = {
    "24/7": { color: "#3a0ca3" },
    "Waterloo": { color: "#f72585" },
    "Counseling": { color: "#4361ee" },
    "Legal Support": { color: "#2D00F7" },
    "Crisis Support": { color: "#FF4D4D" },
    "Sexual Assault": { color: "#D100D1" },
    "Domestic Violence": { color: "#E500A4" },
    "Workshops": { color: "#64dfdf" },
    "Prevention": { color: "#8900F2" },
    "Multilingual": { color: "#A100F2" },
};

const resourcesList = [
    {
        type: 'Crisis Support',
        items: [
            {
                title: 'UW Special Constable Service',
                description: 'Provides safety planning, reports facilitation, and referrals.',
                link: 'https://uwaterloo.ca/sexual-violence-prevention-response-office/resources/crisis-support-services',
                tags: ["24/7", "Waterloo", "Crisis Support"]
            },
            {
                title: 'Sexual Assault/Domestic Violence Treatment Centre',
                description: 'Provides 24/7 on-call support for medical care, safety planning, and evidence collection.',
                link: 'https://sadvtcwaterloo.ca/',
                tags: ["24/7", "Sexual Assault", "Domestic Violence"]
            },
        ],
    },
    {
        type: 'Counseling & Therapy',
        items: [
            {
                title: 'Sexual Assault Support Centre of Kitchener Waterloo (SASC)',
                description: 'Offers crisis support, advocacy, and multilingual services.',
                link: 'https://www.sascwr.org/',
                tags: ["Counseling", "Sexual Assault", "Multilingual"]
            },
        ],
    },
    {
        type: 'Education & Prevention',
        items: [
            {
                title: 'UW SVPRO Education Workshops',
                description: 'Offers workshops on topics such as consent, boundaries, and sexual violence.',
                link: 'https://uwaterloo.ca/sexual-violence-prevention-response-office/education-offerings',
                tags: ["Workshops", "Prevention", "Waterloo"]
            },
        ],
    },
    {
        type: 'Legal & Reporting Support',
        items: [
            {
                title: 'UW Sexual Violence Policies',
                description: 'Learn about sexual violence prevention policies and resources.',
                link: 'https://uwaterloo.ca/sexual-violence-prevention-response-office/',
                tags: ["Legal Support", "Waterloo", "Prevention"]
            },
            {
                title: 'Victim Services of Waterloo Region',
                description: 'Provides 24/7 crisis intervention, practical assistance, and court process guidance.',
                link: 'https://www.vswr.ca/',
                tags: ["24/7", "Legal Support", "Waterloo"]
            },
        ],
    },
    {
        type: 'Community Support',
        items: [
            {
                title: 'Sexual Assault/Domestic Violence Treatment Centre',
                description: 'Medical care and support for survivors of sexual and domestic violence.',
                link: 'https://sadvtcwaterloo.ca/',
                tags: ["Sexual Assault", "Domestic Violence", "Waterloo"]
            },
            {
                title: 'Conestoga College Wellness Portal',
                description: 'Access resources to get help, support others, report incidents, and workshops.',
                link: 'https://studentsuccess.conestogac.on.ca/myWellness/sexualandgenderbasedviolence/index',
                tags: ["Workshops", "Prevention", "Waterloo"]
            },
        ],
    },
];

const Resources = () => {
    const { user, setUser } = useData(); 
    const navigation = useNavigation();
    const { assets, colors, fonts, gradients, sizes } = useTheme();

    const renderTags = (tagsArray) => {
        return tagsArray.map((tag, index) => (
            <Block 
                key={index} 
                flex={0}
                style={{
                    backgroundColor: tags[tag].color,
                    borderRadius: 8,
                    marginRight: 8,
                    marginBottom: 1,
                    paddingHorizontal: 2,
                    paddingVertical: 1,
                }}
            >
                <Text marginLeft={sizes.s} marginRight={sizes.s} size={12} color="#fff">{tag}</Text>
            </Block>
        ));
    };

    return (
        <ScrollView contentContainerStyle={{ padding: sizes.padding }}>

            {/* Back button */}
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
                top={20}
                />
                <Text p semibold black top={20} marginLeft={sizes.s}>
                    {"Back"}
                </Text>
            </Button>

            <Text h4 center marginBottom={sizes.m}> Resources </Text>

            {resourcesList.map((section) => (
                <Block key={section.type} marginBottom={sizes.m}>

                    {/* Section Title */}
                    <Text h5 marginLeft={sizes.s} marginBottom={15}>{section.type}</Text>

                    {/* Resource Cards */}
                    {section.items.map((item, index) => (
                        <Block key={index} card padding={sizes.m} marginBottom={sizes.s} style={{ backgroundColor: colors.primary }} >
                            
                            {/* Title & Link Icon */}
                            <Block row justify="space-between">
                                <Block flex={1}> 
                                    <Text h5 bold>{item.title}</Text>
                                </Block>
                                <TouchableOpacity 
                                    onPress={() => Linking.openURL(item.link)}
                                    style={{ alignSelf: "flex-start" }}
                                >
                                    <Image 
                                        source={linkIcon} 
                                        style={{ width: 20, height: 27, resizeMode: "contain" }} 
                                    />
                                </TouchableOpacity>
                            </Block>

                            {/* Description */}
                            <Text p marginTop={sizes.s} marginBottom={15}>{item.description}</Text>

                            {/* Tags */}
                            <Block row flex={0} marginTop={sizes.s}>
                                {renderTags(item.tags)}
                            </Block>

                        </Block>
                    ))}
                </Block>
            ))}

        </ScrollView>
    );
};

export default Resources;

