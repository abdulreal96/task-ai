import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Lock, RefreshCw, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import api from '../services/api';

interface ResetPasswordScreenProps {
  route: {
    params: {
      email: string;
    };
  };
  navigation: any;
}

export default function ResetPasswordScreen({ route, navigation }: ResetPasswordScreenProps) {
  const { colors } = useTheme();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const { email } = route.params;
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(120);
  const [canResend, setCanResend] = useState(false);

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

  const handleResetPassword = async () => {
    if (!otp || otp.length !== 6) {
      showAlert('Invalid Code', 'Please enter the complete 6-digit code from your email.', undefined, 'error');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showAlert('Invalid Password', 'Password must be at least 6 characters long.', undefined, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match. Please try again.', undefined, 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      
      showAlert(
        '🎉 Password Reset!',
        response.data.message,
        [
          {
            text: 'Login Now',
            onPress: () => navigation.navigate('Login')
          }
        ],
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to reset password';
      showAlert('Reset Failed', message, undefined, 'error');
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
      await api.post('/auth/forgot-password', { email });
      showAlert(
        '✉️ Code Sent!',
        'A new reset code has been sent to your email.',
        undefined,
        'success'
      );
      setCooldown(120);
      setCanResend(false);
      setOtp('');
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Lock size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the 6-digit code sent to:
          </Text>
          <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
        </View>

        <View style={styles.form}>
          {/* Timer */}
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
              {canResend ? 'Request new code' : formatTime(cooldown)}
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Reset Code</Text>
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
            />
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleResetPassword}
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
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
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    fontSize: 15,
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  timerContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
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
});
