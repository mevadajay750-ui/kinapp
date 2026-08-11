import React, {useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ArrowLeft, ChevronRight} from 'lucide-react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {Input} from '../../components/Input';
import {ConfirmSheet} from '../../components/meals/ConfirmSheet';
import {colors, spacing, radius} from '../../theme';
import {useAuth} from '../../hooks/useAuth';
import {useProfile} from '../../hooks/useProfile';
import {authErrorMessage} from '../../lib/authErrors';
import {
  deleteAccountDataAndUser,
  isRecentLogin,
} from '../../lib/accountDelete';
import {buildKinExport} from '../../lib/dataExport';
import {auth} from '../../lib/firebase';
import type {ProgressStackParamList} from '../../navigation/ProgressStack';

// Metro resolves JSON; version stays in sync with package.json.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {version: appVersion} = require('../../../package.json') as {
  version: string;
};

type Props = NativeStackScreenProps<ProgressStackParamList, 'Settings'>;

type SheetKind =
  | null
  | 'signOut'
  | 'deleteConfirm'
  | 'deleteType'
  | 'reauth';

export function SettingsScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const {user, signOut} = useAuth();
  const {profile, updateProfile} = useProfile();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [deleteTyped, setDeleteTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const kcal = profile?.dailyKcalTarget;
  const goal = profile?.goalWeightKg;
  const name = profile?.name ?? '';
  const email = profile?.email ?? user?.email ?? '';

  const closeSheets = () => {
    setSheet(null);
    setDeleteTyped('');
    setBusy(false);
  };

  const onExport = async () => {
    if (!user) {
      return;
    }
    setError('');
    try {
      const {filename, json} = await buildKinExport(user.uid, profile);
      await Share.share({
        title: filename,
        message: json,
      });
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const onSignOutConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      await signOut();
      closeSheets();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const handleRequiresRecentLogin = async () => {
    setSheet('reauth');
    setBusy(false);
  };

  const onReauthAcknowledge = async () => {
    setBusy(true);
    try {
      await signOut();
    } catch {
      // Still leave the sheet — RootNavigator will show auth once signed out.
    } finally {
      closeSheets();
    }
  };

  const onDeleteTypedConfirm = async () => {
    if (deleteTyped !== 'delete' || !user || !auth?.currentUser) {
      return;
    }
    setBusy(true);
    setError('');

    const current = auth.currentUser;
    if (!isRecentLogin(current)) {
      await handleRequiresRecentLogin();
      return;
    }

    try {
      await deleteAccountDataAndUser(current);
      closeSheets();
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as {code: unknown}).code)
          : '';
      if (code === 'auth/requires-recent-login') {
        await handleRequiresRecentLogin();
        return;
      }
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const onResetOnboarding = async () => {
    setError('');
    try {
      await updateProfile({onboardingComplete: false});
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.plum} strokeWidth={1.8} />
        </Pressable>
        <Text variant="h3" color="plum" style={styles.headerTitle}>
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: insets.bottom + spacing.xxxl},
        ]}>
        <Text variant="eyebrow" color="warmGray" style={styles.groupLabel}>
          Your plan
        </Text>
        <View style={styles.card}>
          <SettingsRow
            label="Daily calorie target"
            value={
              kcal != null ? `${kcal.toLocaleString()} kcal` : '—'
            }
            onPress={() => navigation.navigate('EditTargets')}
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Goal weight"
            value={
              goal != null
                ? `${goal.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })} kg`
                : '—'
            }
            onPress={() => navigation.navigate('EditTargets')}
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Name"
            value={name || '—'}
            onPress={() => navigation.navigate('EditTargets')}
          />
        </View>

        <Text variant="eyebrow" color="warmGray" style={styles.groupLabel}>
          Your data
        </Text>
        <View style={styles.card}>
          <SettingsRow label="Export my data" onPress={onExport} />
        </View>

        <Text variant="eyebrow" color="warmGray" style={styles.groupLabel}>
          Account
        </Text>
        <View style={styles.card}>
          <SettingsRow label="Signed in as" value={email} />
          <View style={styles.divider} />
          <Pressable
            onPress={() => setSheet('signOut')}
            style={styles.row}
            accessibilityRole="button">
            <Text variant="body" color="plum">
              Sign out
            </Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            onPress={() => setSheet('deleteConfirm')}
            style={styles.row}
            accessibilityRole="button">
            <Text variant="body" color="clay">
              Delete account
            </Text>
          </Pressable>
        </View>

        <Text variant="eyebrow" color="warmGray" style={styles.groupLabel}>
          About
        </Text>
        <View style={styles.card}>
          <SettingsRow label="Version" value={appVersion} />
        </View>

        <Text variant="caption" color="warmGray" style={styles.disclaimer}>
          Kin is a journal, not medical advice.
        </Text>
        <Text variant="caption" color="warmGray" style={styles.disclaimerLine}>
          For concerns specific to you, a doctor or dietitian is the right
          place.
        </Text>

        {__DEV__ ? (
          <>
            <Text variant="eyebrow" color="warmGray" style={styles.groupLabel}>
              Dev
            </Text>
            <View style={styles.card}>
              <Pressable
                onPress={onResetOnboarding}
                style={styles.row}
                accessibilityRole="button">
                <Text variant="body" color="plum">
                  Reset onboarding
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {error ? (
          <Text variant="caption" color="clay" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <ConfirmSheet
        visible={sheet === 'signOut'}
        title="Sign out?"
        body="Your data stays safe. Sign back in any time."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        onConfirm={onSignOutConfirm}
        onCancel={closeSheets}
        confirmLoading={busy}
      />

      <ConfirmSheet
        visible={sheet === 'deleteConfirm'}
        title="Delete your account?"
        body="This removes your profile, meals, habits, and weight history. It can't be undone."
        confirmLabel="Delete everything"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          setDeleteTyped('');
          setSheet('deleteType');
        }}
        onCancel={closeSheets}
      />

      <ConfirmSheet
        visible={sheet === 'reauth'}
        title="Sign in again"
        body={authErrorMessage({code: 'auth/requires-recent-login'})}
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={onReauthAcknowledge}
        onCancel={closeSheets}
        confirmLoading={busy}
      />

      <Modal
        visible={sheet === 'deleteType'}
        transparent
        animationType="slide"
        onRequestClose={closeSheets}>
        <Pressable style={styles.backdrop} onPress={closeSheets}>
          <Pressable
            style={[
              styles.typeSheet,
              {paddingBottom: insets.bottom + spacing.xl},
            ]}
            onPress={e => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text variant="h3" color="plum" style={styles.typeTitle}>
              Delete your account?
            </Text>
            <Text variant="body" color="warmGray" style={styles.typeBody}>
              Type delete to confirm. This can't be undone.
            </Text>
            <Input
              label="Confirm"
              value={deleteTyped}
              onChangeText={setDeleteTyped}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              label="Delete everything"
              variant="destructive"
              onPress={onDeleteTypedConfirm}
              disabled={deleteTyped !== 'delete'}
              loading={busy}
              style={styles.typeBtn}
            />
            <Button
              label="Cancel"
              variant="ghost"
              onPress={closeSheets}
              style={styles.typeBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.rowText}>
        <Text variant="body" color="plum">
          {label}
        </Text>
        {value != null ? (
          <Text
            variant="body"
            color="warmGray"
            numberOfLines={1}
            style={styles.rowValue}>
            {value}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <ChevronRight size={18} color={colors.warmGray} strokeWidth={1.8} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={label}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.papaya},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {width: 22},
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  groupLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginLeft: spacing.lg,
  },
  disclaimer: {
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  disclaimerLine: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  error: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(61, 35, 55, 0.35)',
    justifyContent: 'flex-end',
  },
  typeSheet: {
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
  typeTitle: {
    marginBottom: spacing.sm,
  },
  typeBody: {
    marginBottom: spacing.lg,
  },
  typeBtn: {
    marginTop: spacing.sm,
  },
});
