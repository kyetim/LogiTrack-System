import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';

export default function MapScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Harita Ekranı</Text>
            <Text style={styles.subtext}>Yakında eklenecek...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtext: {
        fontSize: 16,
        color: COLORS.textLight,
        marginTop: 8,
    },
});
