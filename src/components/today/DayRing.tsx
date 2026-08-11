import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, StyleSheet, View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {colors} from '../../theme';
import {Text} from '../Text';

const SIZE = 132;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  kcal: number;
  target: number;
  loading?: boolean;
};

export function DayRing({kcal, target, loading}: Props) {
  const ratio = target > 0 ? kcal / target : 0;
  const visualRatio = Math.min(Math.max(ratio, 0), 1);
  const over = ratio > 1;
  const fillColor = over ? colors.marigold : colors.moss;

  const progress = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (reduceMotion) {
      progress.setValue(visualRatio);
      return;
    }
    Animated.timing(progress, {
      toValue: visualRatio,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [visualRatio, loading, reduceMotion, progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [C, 0],
  });

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`${kcal} of ${target} calories logged`}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={colors.hairline}
          strokeWidth={STROKE}
          fill="none"
        />
        {!loading ? (
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={fillColor}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${C} ${C}`}
            strokeDashoffset={strokeDashoffset}
            rotation={-90}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        ) : null}
      </Svg>
      <View style={styles.centre} pointerEvents="none">
        {loading ? (
          <View style={styles.skelNum} />
        ) : (
          <Text variant="h2" color="plum" style={styles.kcal}>
            {kcal.toLocaleString()}
          </Text>
        )}
        <Text variant="caption" color="warmGray">
          of {target.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kcal: {
    fontVariant: ['tabular-nums'],
  },
  skelNum: {
    width: 56,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.hairline,
    marginBottom: 4,
  },
});
