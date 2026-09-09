import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import storage from '../../services/storage';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { useProfile } from '../../contexts/ProfileContext';

const DriverAuthScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const [isLogin, setIsLogin] = useState<boolean>(true);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleMake, setVehicleMake] = useState('VoltRescue Van');
  const [showPassword, setShowPassword] = useState(false);

  // UI / Status States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const { connect } = useSocket();
  const { setName: setProfileName, setEmail: setProfileEmail, setPhone: setProfilePhone } = useProfile();

  const clearErrors = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setFieldErrors({});
  };

  const handleModeChange = (loginMode: boolean) => {
    setIsLogin(loginMode);
    clearErrors();
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        errors.email = 'Please enter a valid email format (e.g. driver@voltrescue.com).';
      }
    }

    if (!cleanPassword) {
      errors.password = 'Password is required.';
    } else if (cleanPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!isLogin) {
      const cleanName = name.trim();
      const cleanPhone = phone.trim();

      if (!cleanName) {
        errors.name = 'Full name is required.';
      } else if (cleanName.length < 2) {
        errors.name = 'Name must be at least 2 characters.';
      }

      if (!cleanPhone) {
        errors.phone = 'Phone number is required.';
      } else if (cleanPhone.length < 10) {
        errors.phone = 'Phone number must be at least 10 digits.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    clearErrors();
    if (!validateForm()) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    setIsLoading(true);
    try {
      let operatorData: any = null;
      let token: string | null = null;

      if (!isLogin) {
        const res = await api.post('/auth/operator/register', {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password: cleanPassword,
          vehicleDetails: {
            make: vehicleMake.trim() || 'VoltRescue Van',
            model: 'Rapid Rescue 80kW',
            capacityKWh: 80,
            supportedConnectors: ['CCS2', 'CHAdeMO', 'Type2'],
          },
        });
        operatorData = res.data?.data?.operator;
        token = res.data?.data?.token;
      } else {
        const res = await api.post('/auth/operator/login', {
          email: cleanEmail,
          password: cleanPassword,
        });
        operatorData = res.data?.data?.operator;
        token = res.data?.data?.token;
      }

      if (token) {
        await storage.setItem('operatorToken', token);
        if (operatorData) {
          if (operatorData.name) setProfileName(operatorData.name);
          if (operatorData.email) setProfileEmail(operatorData.email);
          if (operatorData.phone) setProfilePhone(operatorData.phone);
        }
        connect(token);
        setSuccessMsg('Driver authenticated successfully! Entering Dashboard...');
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'DriverDashboard' }],
          });
        }, 500);
      }
    } catch (e: any) {
      console.error('🚨 [Operator Auth Error Caught]:', {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
      });

      if (!e?.response) {
        setErrorMsg('Network Error: Unable to reach server. Please check your connection.');
      } else {
        const serverMsg = e?.response?.data?.message || e?.response?.data?.error;
        const validationErr = e?.response?.data?.errors?.[0]?.message;
        const msg = validationErr || serverMsg || e?.message || 'Authentication failed. Please check your credentials.';
        setErrorMsg(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDemoDriver = () => {
    setIsLogin(true);
    clearErrors();
    setEmail('driver@voltrescue.com');
    setPassword('pass1234');
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.brandRow}>
              <View style={styles.brandIconBox}>
                <Ionicons name="flash" size={16} color="#059669" />
              </View>
              <Text style={styles.headerTitle}>VOLTRESCUE FLEET</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Hero Headline */}
          <View style={styles.heroSection}>
            <View style={styles.operatorBadge}>
              <Ionicons name="car-sport" size={15} color="#059669" />
              <Text style={styles.operatorBadgeText}>RESCUE OPERATOR PORTAL</Text>
            </View>
            <Text style={styles.title}>
              {isLogin ? 'Driver Sign In' : 'Join Rescue Fleet'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Sign in to access live roadside dispatch requests and track shift earnings.'
                : 'Register your mobile rescue charging van and start receiving dispatch requests.'}
            </Text>
          </View>

          {/* Auth Card */}
          <View style={styles.authCard}>
            {/* Sign In vs Register Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => handleModeChange(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>SIGN IN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => handleModeChange(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>REGISTER</Text>
              </TouchableOpacity>
            </View>

            {/* Error / Success Notifications */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* Input Form */}
            <View style={styles.form}>
              {!isLogin && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <View style={[styles.inputWrapper, fieldErrors.name && styles.inputError]}>
                      <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Alex Vance"
                        placeholderTextColor="#94A3B8"
                        value={name}
                        onChangeText={(val) => {
                          setName(val);
                          if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        autoCapitalize="words"
                      />
                    </View>
                    {fieldErrors.name ? <Text style={styles.fieldErrorText}>{fieldErrors.name}</Text> : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>PHONE NUMBER</Text>
                    <View style={[styles.inputWrapper, fieldErrors.phone && styles.inputError]}>
                      <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#94A3B8"
                        value={phone}
                        onChangeText={(val) => {
                          setPhone(val);
                          if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        keyboardType="phone-pad"
                      />
                    </View>
                    {fieldErrors.phone ? <Text style={styles.fieldErrorText}>{fieldErrors.phone}</Text> : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>VEHICLE MODEL / FLEET ID</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="car-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Ford E-Transit / Tata Ace EV"
                        placeholderTextColor="#94A3B8"
                        value={vehicleMake}
                        onChangeText={setVehicleMake}
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View style={[styles.inputWrapper, fieldErrors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="driver@voltrescue.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {fieldErrors.email ? <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PASSWORD</Text>
                  {isLogin && (
                    <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.inputWrapper, fieldErrors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
                {fieldErrors.password ? <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.primaryButtonText}>
                      {isLogin ? 'Sign In as Driver' : 'Create Driver Account'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Demo Access Pill */}
            <View style={styles.demoSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>QUICK DEMO ACCESS</Text>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity
                style={styles.demoPill}
                onPress={autofillDemoDriver}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={16} color="#059669" />
                <Text style={styles.demoPillText}>Autofill Demo Driver (driver@voltrescue.com)</Text>
              </TouchableOpacity>
            </View>

            {/* Guest Link */}
            <TouchableOpacity
              style={styles.guestLink}
              onPress={() => navigation.navigate('Welcome')}
            >
              <Text style={styles.guestLinkText}>← Back to Customer Charging</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={forgotModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Driver Password</Text>
              <TouchableOpacity onPress={() => { setForgotModalVisible(false); setForgotSubmitted(false); }}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {forgotSubmitted ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={styles.mailSentIconBox}>
                  <Ionicons name="mail-unread" size={36} color="#059669" />
                </View>
                <Text style={styles.forgotSuccessTitle}>Reset Email Sent</Text>
                <Text style={styles.forgotSuccessSubtitle}>
                  If an account exists for {forgotEmail}, you will receive password reset instructions shortly.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { width: '100%', marginTop: 20 }]}
                  onPress={() => { setForgotModalVisible(false); setForgotSubmitted(false); }}
                >
                  <Text style={styles.primaryButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.modalSubtitle}>
                  Enter the email address associated with your driver account and dispatch will email you a reset link.
                </Text>
                <View style={[styles.inputWrapper, { marginTop: 16 }]}>
                  <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="driver@voltrescue.com"
                    placeholderTextColor="#94A3B8"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 20 }]}
                  onPress={() => {
                    if (forgotEmail.trim()) {
                      setForgotSubmitted(true);
                    }
                  }}
                >
                  <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  operatorBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  operatorBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#0F172A',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#059669',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  forgotText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
  },
  eyeButton: {
    padding: 8,
  },
  fieldErrorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoSection: {
    marginTop: 18,
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: 10,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  demoPillText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  guestLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 4,
  },
  guestLinkText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  mailSentIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  forgotSuccessTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  forgotSuccessSubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

export default DriverAuthScreen;
