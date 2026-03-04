import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Truck } from 'lucide-react-native';
import { Colors } from '@/theme/tokens';

type HexLogoSize = 'sm' | 'md' | 'lg';

interface HexLogoProps {
    size?: HexLogoSize;
    showGlow?: boolean;
}

const SIZE_MAP = {
    sm: 32,
    md: 52,
    lg: 88,
};

const ICON_SIZE_MAP = {
    sm: 16,
    md: 26,
    lg: 44,
};

export const HexLogo: React.FC<HexLogoProps> = ({ size = 'md', showGlow = false }) => {
    const pixelSize = SIZE_MAP[size];
    const iconSize = ICON_SIZE_MAP[size];
    const glowSize = pixelSize * 2;

    // We draw a hexagon inside an SVG viewBox of "0 0 100 100" to keep scaling simple
    // 100x100 points: (50,0), (100,25), (100,75), (50,100), (0,75), (0,25)
    const hexagonPoints = "50,0 100,25 100,75 50,100 0,75 0,25";

    return (
        <View style={styles.container}>
            {/* Optional Glow Effect Behind */}
            {showGlow && (
                <View
                    style={[
                        styles.glowContainer,
                        { width: glowSize, height: glowSize },
                    ]}
                >
                    <Svg width="100%" height="100%" viewBox="0 0 100 100">
                        <Defs>
                            <RadialGradient cx="50%" cy="50%" r="50%" id="glow">
                                <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.4" />
                                <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0" />
                            </RadialGradient>
                        </Defs>
                        <Rect x="0" y="0" width="100" height="100" fill="url(#glow)" />
                    </Svg>
                </View>
            )}

            {/* Hexagon shape & Icon */}
            <View style={{ width: pixelSize, height: pixelSize, justifyContent: 'center', alignItems: 'center' }}>
                <Svg
                    width={pixelSize}
                    height={pixelSize}
                    viewBox="0 0 100 100"
                    style={StyleSheet.absoluteFillObject}
                >
                    <Polygon points={hexagonPoints} fill={Colors.primary} />
                </Svg>
                <Truck color={Colors.background} size={iconSize} strokeWidth={2.5} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
