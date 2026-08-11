import React from 'react';
import {Text as RNText, TextProps as RNTextProps, TextStyle} from 'react-native';
import {colors, typography, TypographyKey} from '../theme';

type Props = RNTextProps & {
  variant?: TypographyKey;
  color?: keyof typeof colors;
  style?: TextStyle | TextStyle[];
};

export function Text({
  variant = 'body',
  color = 'plum',
  style,
  ...rest
}: Props) {
  return (
    <RNText
      {...rest}
      style={[typography[variant], {color: colors[color]}, style]}
    />
  );
}
