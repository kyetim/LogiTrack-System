import React, { useRef, useState, useImperativeHandle, forwardRef, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, Typography } from '@/theme/tokens';

export interface SignaturePadProps {
    onSignatureChange: (hasSignature: boolean) => void;
    onClear: () => void;
    height?: number;
}

export interface SignaturePadRef {
    getSignatureData: () => string | null;
}

export const SignaturePad = memo(forwardRef<SignaturePadRef, SignaturePadProps>(({
    onSignatureChange,
    onClear,
    height = 200,
}, ref) => {
    // Array of paths, each path is a string like "M10 10 L20 20 L30 30"
    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');

    // Track canvas layout to offset touch coordinates correctly
    const [canvasLayout, setCanvasLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const handleClear = () => {
        setPaths([]);
        setCurrentPath('');
        onClear();
        onSignatureChange(false);
    };

    useImperativeHandle(ref, () => ({
        getSignatureData: () => {
            const allPaths = [...paths];
            if (currentPath) {
                allPaths.push(currentPath);
            }
            if (allPaths.length === 0) return null;
            return JSON.stringify(allPaths);
        }
    }));

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath(`M${locationX} ${locationY}`);
                // Since this might not trigger a state update immediately, 
                // we can't reliably call onSignatureChange here without a race condition.
                // We'll call it in Move.
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                // Boundaries check: prevent drawing outside the canvas
                if (
                    locationX >= 0 && locationX <= canvasLayout.width &&
                    locationY >= 0 && locationY <= canvasLayout.height
                ) {
                    setCurrentPath((prev) => `${prev} L${locationX} ${locationY}`);
                    if (paths.length === 0) {
                        onSignatureChange(true);
                    }
                }
            },
            onPanResponderRelease: () => {
                setPaths((prev) => {
                    const newPaths = [...prev];
                    // Using function closure to safely access the latest state is tricky here
                    // so we do it in a setState callback to guarantee ordering
                    return newPaths;
                });
                // To avoid closure staleness on currentPath during Release,
                // we just flush currentPath to paths via a separate setState
                setPaths(prev => [...prev, currentPath]);
                setCurrentPath('');
            },
        })
    ).current;

    const hasSignature = paths.length > 0 || currentPath.length > 0;

    return (
        <View style={styles.wrapper}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>İmza Alanı</Text>
                <TouchableOpacity activeOpacity={0.8} onPress={handleClear}>
                    <Text style={styles.clearText}>Temizle</Text>
                </TouchableOpacity>
            </View>

            {/* Canvas Area */}
            <View
                style={[styles.canvasContainer, { height }]}
                onLayout={(e: LayoutChangeEvent) => setCanvasLayout(e.nativeEvent.layout)}
                {...panResponder.panHandlers}
            >
                {!hasSignature && (
                    <View style={styles.hintContainer} pointerEvents="none">
                        <Text style={styles.hintText}>Parmağınızla buraya imzalayın</Text>
                    </View>
                )}

                <Svg width="100%" height="100%">
                    {paths.map((path, index) => (
                        <Path
                            key={index}
                            d={path}
                            stroke={Colors.white}
                            strokeWidth={2.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}
                    {currentPath ? (
                        <Path
                            d={currentPath}
                            stroke={Colors.white}
                            strokeWidth={2.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ) : null}
                </Svg>
            </View>
        </View>
    );
}));

SignaturePad.displayName = 'SignaturePad';

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
    },
    clearText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.error,
    },
    canvasContainer: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    hintContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hintText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: '#3A3A3A',
        fontStyle: 'italic',
    },
});
