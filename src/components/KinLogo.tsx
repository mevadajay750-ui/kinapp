import React from 'react';
import Svg, {Rect, Circle} from 'react-native-svg';
import {colors} from '../theme';

type Props = {size?: number; variant?: 'full' | 'mark'};

export function KinLogo({size = 64, variant = 'full'}: Props) {
  if (variant === 'mark') {
    return (
      <Svg width={size} height={size} viewBox="0 0 256 256">
        <Circle cx={128} cy={128} r={32} fill={colors.marigold} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Rect width={1024} height={1024} rx={230} ry={230} fill={colors.plum} />
      <Circle cx={512} cy={512} r={112} fill={colors.marigold} />
    </Svg>
  );
}
