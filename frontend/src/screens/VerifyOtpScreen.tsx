import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Mail, RefreshCw } from 'lucide-react-native';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface VerifyOtpScreenProps {
  route: {
    params: {
      email: string;
    };
  };
  navigation: any;
}

export default function VerifyOtpScreen({ route, navigation }: VerifyOtpScreenProps) {
  const { colors } = useTheme();
  const { verifyOTP, resendOTP } = useAuth();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const { email } = route.params;
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(120); // Start with 2 minutes (120 seconds)
  const [canResend, setCanResend] = useState(false);

  // Main timer - counts down from 2 minutes
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [cooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      showAlert('Invalid Code', 'Please enter the complete 6-digit code from your email.', undefined, 'error');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(email, otp);
      showAlert(
        '🎉 Email Verified!',
        'Your email has been verified successfully. You can now access your account.',
        [
          { text: 'Continue', onPress: () => {} }
        ],
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Invalid or expired code';
      showAlert('Verification Failed', message, undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) {
      showAlert(
        'Please Wait',
        `You can resend the code in ${formatTime(cooldown)}`,
        undefined,
        'warning'
      );
      return;
    }

    setResendLoading(true);
    try {
      await resendOTP(email);
      showAlert(
        '✉️ Code Sent!',
        'A new verification code has been sent to your email. Please check your inbox.',
        undefined,
        'success'
      );
      setCooldown(120); // Reset to 2 minutes
      setCanResend(false);
      setOtp(''); // Clear the input
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to resend code';
      showAlert('Error', message, undefined, 'error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Mail size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We've sent a 6-digit verification code to:
          </Text>
          <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
          <Text style={[styles.checkSpam, { color: colors.textSecondary }]}>
            Please check your inbox (and spam folder)
          </Text>
        </View>

        <View style={styles.form}>
          {/* Timer Display */}
          <View style={[styles.timerContainer, { 
            backgroundColor: canResend ? colors.surface : colors.primary + '15',
            borderColor: canResend ? colors.border : colors.primary + '30'
          }]}>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
              {canResend ? '⏱️ Code Expired' : '⏱️ Time Remaining'}
            </Text>
            <Text style={[styles.timerText, { 
              color: canResend ? colors.textSecondary : colors.primary 
            }]}>
              {canResend ? 'Please request a new code' : formatTime(cooldown)}
            </Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Verification Code</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border,
                fontSize: 24,
                letterSpacing: 8,
                textAlign: 'center',
              }]}
              placeholder="000000"
              placeholderTextColor={colors.textSecondary}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleVerify}
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Didn't receive the code?
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendLoading || !canResend}
              style={[styles.resendButton, {
                opacity: (!canResend || resendLoading) ? 0.5 : 1
              }]}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={styles.resendButtonContent}>
                  <RefreshCw size={16} color={canResend ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.resendButtonText, { 
                    color: canResend ? colors.primary : colors.textSecondary 
                  }]}>
                    {canResend ? 'Resend Code' : `Wait ${formatTime(cooldown)}`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>
              Back to Registration
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkSpam: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  form: {
    width: '100%',
  },
  timerContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    height: 64,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
  },
});
