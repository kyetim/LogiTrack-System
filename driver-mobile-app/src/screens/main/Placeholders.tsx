import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/theme/tokens';

export const MapScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Harita yakında...</Text>
        </View>
    );
};

export const ProfileScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Profil yakında...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontFamily: Typography.fontDisplay,
        fontSize: 18,
        color: Colors.gray,
    }
});
