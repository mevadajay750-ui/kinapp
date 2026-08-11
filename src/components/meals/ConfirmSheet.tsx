import React from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, radius} from '../../theme';
import {Text} from '../Text';
import {Button} from '../Button';

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Clay primary — delete account and other irreversible actions. */
  destructive?: boolean;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
};

export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive,
  confirmDisabled,
  confirmLoading,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, {paddingBottom: insets.bottom + spacing.xl}]}
          onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text variant="h3" color="plum" style={styles.title}>
            {title}
          </Text>
          {body ? (
            <Text variant="body" color="warmGray" style={styles.body}>
              {body}
            </Text>
          ) : null}
          <Button
            label={confirmLabel}
            variant={destructive ? 'destructive' : 'primary'}
            onPress={onConfirm}
            disabled={confirmDisabled}
            loading={confirmLoading}
            style={styles.btn}
          />
          <Button
            label={cancelLabel}
            variant="ghost"
            onPress={onCancel}
            style={styles.btn}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(61, 35, 55, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.papaya,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  body: {
    marginBottom: spacing.xl,
  },
  btn: {
    marginTop: spacing.sm,
  },
});
