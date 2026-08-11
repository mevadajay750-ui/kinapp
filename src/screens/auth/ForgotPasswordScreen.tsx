import React, {useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {ArrowLeft} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {Input} from '../../components/Input';
import {useAuth} from '../../hooks/useAuth';
import {authErrorMessage} from '../../lib/authErrors';
import {AuthStackParamList} from '../../navigation/AuthStack';
import {colors, spacing} from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const {resetPassword} = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError('Add your email to continue.');
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("That email doesn't look right. Mind checking it?");
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const onEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      if (!text.trim()) {
        setEmailError('Add your email to continue.');
      } else if (!EMAIL_RE.test(text.trim())) {
        setEmailError("That email doesn't look right. Mind checking it?");
      } else {
        setEmailError(undefined);
      }
    }
  };

  const onSubmit = async () => {
    setFormError('');
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSentEmail(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Screen style={styles.successScreen}>
        <View style={styles.successContent}>
          <View style={styles.marigoldDot} />
          <Text variant="h2" style={styles.successHeading}>
            Check your email.
          </Text>
          <Text variant="body" color="ink60" style={styles.successBody}>
            {`If an account exists for ${sentEmail}, a reset link is on its way.`}
          </Text>
          <Button
            label="Back to sign in"
            variant="ghost"
            onPress={() => navigation.navigate('SignIn')}
            style={styles.successButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={styles.back}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <ArrowLeft size={22} color={colors.plum} />
            </Pressable>

            <Text variant="eyebrow" color="warmGray" style={styles.eyebrow}>
              Reset
            </Text>
            <Text variant="h1" style={styles.heading}>
              Let's get you back in.
            </Text>
            <Text variant="body" color="ink60" style={styles.body}>
              Enter your email and we'll send a link to set a new password.
            </Text>

            <View style={styles.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={onEmailChange}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                textContentType="emailAddress"
                autoComplete="email"
              />

              {formError ? (
                <Text variant="caption" color="clay" style={styles.formError}>
                  {formError}
                </Text>
              ) : null}

              <Button
                label="Send reset link"
                onPress={onSubmit}
                loading={loading}
                style={styles.submit}
              />
            </View>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    marginTop: spacing.sm,
  },
  heading: {
    marginTop: spacing.sm,
  },
  body: {
    marginTop: spacing.md,
  },
  form: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  formError: {
    marginTop: -spacing.sm,
  },
  submit: {
    marginTop: spacing.sm,
  },
  successScreen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  marigoldDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.marigold,
  },
  successHeading: {
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  successBody: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  successButton: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
});
