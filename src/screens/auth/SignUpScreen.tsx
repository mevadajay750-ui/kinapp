import React, {useRef, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {Input} from '../../components/Input';
import {KinLogo} from '../../components/KinLogo';
import {useAuth} from '../../hooks/useAuth';
import {authErrorMessage} from '../../lib/authErrors';
import {AuthStackParamList} from '../../navigation/AuthStack';
import {spacing} from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

export function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const {signUp} = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) {
      next.name = 'Add your name to continue.';
    }
    if (!email.trim()) {
      next.email = 'Add your email to continue.';
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "That email doesn't look right. Mind checking it?";
    }
    if (!password) {
      next.password = 'Add a password to continue.';
    } else if (password.length < 6) {
      next.password = 'Passwords need at least 6 characters.';
    }
    if (!confirm) {
      next.confirm = 'Confirm your password.';
    } else if (confirm !== password) {
      next.confirm = "Those passwords don't match.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onNameChange = (text: string) => {
    setName(text);
    if (fieldErrors.name) {
      setFieldErrors(e => ({
        ...e,
        name: text.trim() ? undefined : 'Add your name to continue.',
      }));
    }
  };

  const onEmailChange = (text: string) => {
    setEmail(text);
    if (fieldErrors.email) {
      if (!text.trim()) {
        setFieldErrors(e => ({...e, email: 'Add your email to continue.'}));
      } else if (!EMAIL_RE.test(text.trim())) {
        setFieldErrors(e => ({
          ...e,
          email: "That email doesn't look right. Mind checking it?",
        }));
      } else {
        setFieldErrors(e => ({...e, email: undefined}));
      }
    }
  };

  const onPasswordChange = (text: string) => {
    setPassword(text);
    if (fieldErrors.password) {
      if (!text) {
        setFieldErrors(e => ({...e, password: 'Add a password to continue.'}));
      } else if (text.length < 6) {
        setFieldErrors(e => ({
          ...e,
          password: 'Passwords need at least 6 characters.',
        }));
      } else {
        setFieldErrors(e => ({...e, password: undefined}));
      }
    }
    if (fieldErrors.confirm && confirm) {
      setFieldErrors(e => ({
        ...e,
        confirm: confirm === text ? undefined : "Those passwords don't match.",
      }));
    }
  };

  const onConfirmChange = (text: string) => {
    setConfirm(text);
    if (fieldErrors.confirm) {
      if (!text) {
        setFieldErrors(e => ({...e, confirm: 'Confirm your password.'}));
      } else if (text !== password) {
        setFieldErrors(e => ({
          ...e,
          confirm: "Those passwords don't match.",
        }));
      } else {
        setFieldErrors(e => ({...e, confirm: undefined}));
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
      await signUp(email, password, name);
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
            <KinLogo size={56} />
            <Text variant="eyebrow" color="warmGray" style={styles.eyebrow}>
              Begin
            </Text>
            <Text variant="h1" style={styles.heading}>
              Begin, gently.
            </Text>
            <Text variant="body" color="ink60" style={styles.body}>
              A quiet space for meals, habits, and how you feel. No streaks to
              break.
            </Text>

            <View style={styles.form}>
              <Input
                label="Name"
                value={name}
                onChangeText={onNameChange}
                error={fieldErrors.name}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                textContentType="name"
                autoComplete="name"
              />
              <Input
                ref={emailRef}
                label="Email"
                value={email}
                onChangeText={onEmailChange}
                error={fieldErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                textContentType="emailAddress"
                autoComplete="email"
              />
              <Input
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={onPasswordChange}
                error={fieldErrors.password}
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <Input
                ref={confirmRef}
                label="Confirm password"
                value={confirm}
                onChangeText={onConfirmChange}
                error={fieldErrors.confirm}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                textContentType="newPassword"
                autoComplete="new-password"
              />

              {formError ? (
                <Text variant="caption" color="clay" style={styles.formError}>
                  {formError}
                </Text>
              ) : null}

              <Button
                label="Create account"
                onPress={onSubmit}
                loading={loading}
                style={styles.submit}
              />
            </View>

            <Pressable
              onPress={() => navigation.navigate('SignIn')}
              style={styles.footerLink}>
              <Text variant="body" color="warmGray">
                Already have an account? Sign in
              </Text>
            </Pressable>
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  eyebrow: {
    marginTop: spacing.xl,
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
  footerLink: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
});
