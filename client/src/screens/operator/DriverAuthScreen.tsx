import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import storage from '../../services/storage';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const DriverAuthScreen = ({ navigation }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { connect } = useSocket();

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }
    setIsLoading(true);
    try {
      if (!isLogin) {
        if (!name || !phone) {
          setErrorMsg('Name and phone are required for registration.');
          setIsLoading(false);
          return;
        }
        const res = await api.post('/auth/register', { 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          phone: phone.trim(), 
          password 
        });
        await storage.setItem('operatorToken', res.data.data.token);
      } else {
        const res = await api.post('/auth/login', { 
          email: email.trim().toLowerCase(), 
          password 
        });
        await storage.setItem('operatorToken', res.data.data.token);
      }
      const token = await storage.getItem('operatorToken');
      connect(token || undefined);
      navigation.navigate('DriverDashboard');
    } catch (e: any) {
      const serverMsg = e?.response?.data?.message || e?.response?.data?.error;
      const validationErr = e?.response?.data?.errors?.[0]?.message;
      const msg = validationErr || serverMsg || e?.message || 'Authentication failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>VOLT DRIVE</Text>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>RESCUE NETWORK ACTIVE</Text>
            </View>
            <Text style={styles.title}>Power the Future</Text>
            <Text style={styles.subtitle}>Join the elite network of mobile rapid-charging operators.</Text>
          </View>

          {/* Auth Card */}
          <View style={styles.authCard}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => { setIsLogin(true); setErrorMsg(''); }}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>LOGIN</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => { setIsLogin(false); setErrorMsg(''); }}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>REGISTER</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              {!isLogin && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="Johnathan Doe" 
                      placeholderTextColor={colors.onSurfaceVariant}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>PHONE NUMBER</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="9876543210" 
                      placeholderTextColor={colors.onSurfaceVariant}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="operator@example.com" 
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PASSWORD</Text>
                  {isLogin && (
                    <TouchableOpacity>
                      <Text style={styles.forgotText}>Forgot?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••••" 
                  placeholderTextColor={colors.onSurfaceVariant}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Enter Dashboard' : 'Join the Network'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>FLEET PARTNER</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>Sign in with Fleet Connect</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.footerText}>
            By joining, you agree to the VoltRescue Service Terms and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(121, 255, 91, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(121, 255, 91, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.secondaryFixed,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: colors.secondaryFixed,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.onSurface,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
  },
  authCard: {
    width: '100%',
    backgroundColor: 'rgba(32, 31, 31, 0.7)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(53, 53, 52, 0.5)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.surfaceVariant,
  },
  tabText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.onSurface,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 10,
  },
  input: {
    backgroundColor: 'rgba(14, 14, 14, 0.5)',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    padding: 16,
    color: colors.onSurface,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(65, 71, 85, 0.3)',
  },
  dividerText: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginHorizontal: 16,
  },
  socialButton: {
    backgroundColor: 'rgba(42, 42, 42, 0.5)',
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  socialButtonText: {
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  footerText: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
});

export default DriverAuthScreen;
