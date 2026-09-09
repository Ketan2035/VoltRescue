import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';

const PaymentScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 12;
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);

  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Review & Rating Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('⚡ Rapid Rescue');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Prevent back button from closing settlement screen
  useEffect(() => {
    const onBackPress = () => {
      return true; // prevent accidental exit
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const booking = res.data?.data?.booking;
        setBookingDetails(booking);
      } catch (err) {
        console.error('Failed to fetch booking details:', err);
      }
    };
    if (bookingId && bookingId !== 'mock-id') {
      fetchDetails();
    }
  }, [bookingId]);

  // When payment is confirmed by operator, open the Review Popup
  useEffect(() => {
    const currentSt = status || bookingDetails?.status;
    if (
      currentSt === 'PAYMENT_SUCCESS' ||
      currentSt === 'COMPLETED' ||
      currentSt === 'BOOKING_COMPLETED'
    ) {
      setShowReviewModal(true);
    }
  }, [status, bookingDetails?.status]);

  const deliveredEnergy =
    bookingDetails?.deliveredEnergyKWh || bookingDetails?.requestedEnergyKWh || 30;
  const baseFee = Number(bookingDetails?.pricing?.baseFee || 299).toFixed(2);
  const energyFee = Number(
    bookingDetails?.pricing?.energyFee || deliveredEnergy * 24
  ).toFixed(2);
  const tax = Number(
    bookingDetails?.pricing?.tax || (Number(baseFee) + Number(energyFee)) * 0.18
  ).toFixed(2);
  const totalAmount =
    bookingDetails?.pricing?.totalAmount !== undefined
      ? Number(bookingDetails.pricing.totalAmount).toFixed(2)
      : (Number(baseFee) + Number(energyFee) + Number(tax)).toFixed(2);

  const operatorName =
    bookingDetails?.operatorId?.name || 'VoltRescue Certified Technician';
  const operatorVehicle =
    bookingDetails?.operatorId?.vehicleDetails?.model || 'Mobile Fast Charger Unit #4';

  const handleSubmitReview = async () => {
    setIsSubmittingReview(true);
    try {
      if (bookingId && bookingId !== 'mock-id') {
        const fullReview = [selectedTag, reviewComment.trim()].filter(Boolean).join(' - ');
        await api.post(`/bookings/${bookingId}/rating`, {
          score: ratingScore,
          review: fullReview || 'Great service!',
        });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmittingReview(false);
      setShowReviewModal(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerDashboard' }],
      });
    }
  };

  const handleSkipReview = () => {
    setShowReviewModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'CustomerDashboard' }],
    });
  };

  const reviewTags = [
    '⚡ Rapid Rescue',
    '👨‍🔧 Polite Technician',
    '🔋 High-Speed DC Charge',
    '🌟 Highly Recommended',
  ];

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPill}>
          <View style={styles.statusDot} />
          <Text style={styles.headerPillText}>CHARGING COMPLETED • PAYMENT DUE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Amount Due Hero Card */}
        <View style={styles.amountDueCard}>
          <Text style={styles.dueSubLabel}>TOTAL AMOUNT TO PAY</Text>
          <Text style={styles.dueAmount}>₹{totalAmount}</Text>
          <View style={styles.kwhBadge}>
            <Ionicons name="flash" size={14} color="#059669" />
            <Text style={styles.kwhBadgeText}>{deliveredEnergy} kWh DC Fast Charge</Text>
          </View>
        </View>

        {/* Clear Payment Instruction Banner (No option selection) */}
        <View style={styles.paymentInstructionCard}>
          <View style={styles.instructionHeader}>
            <View style={styles.instructionIconBox}>
              <Ionicons name="wallet-outline" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instructionTitle}>Payment Instructions</Text>
              <Text style={styles.instructionDesc}>
                Please ask the rescue operator for their UPI QR Scanner to pay digitally, or pay directly in Cash.
              </Text>
            </View>
          </View>

          <View style={styles.acceptedMethodsRow}>
            <View style={styles.methodTag}>
              <Ionicons name="qr-code" size={13} color="#065F46" />
              <Text style={styles.methodTagText}>UPI / QR Scanner</Text>
            </View>
            <View style={styles.methodTag}>
              <Ionicons name="cash" size={13} color="#065F46" />
              <Text style={styles.methodTagText}>Cash Payment</Text>
            </View>
          </View>
        </View>

        {/* Complete Itemized Invoice Summary */}
        <View style={styles.invoiceCard}>
          <View style={styles.invoiceCardHeader}>
            <Ionicons name="receipt-outline" size={18} color="#0F172A" />
            <Text style={styles.invoiceCardTitle}>INVOICE SUMMARY</Text>
          </View>

          <View style={styles.invoiceDivider} />

          {/* Base Service Fee */}
          <View style={styles.invoiceRow}>
            <View>
              <Text style={styles.invoiceItemName}>Base Mobile Rescue Fee</Text>
              <Text style={styles.invoiceItemSub}>Dispatched rapid equipment & crew</Text>
            </View>
            <Text style={styles.invoiceItemValue}>₹{baseFee}</Text>
          </View>

          {/* Metered Energy */}
          <View style={styles.invoiceRow}>
            <View>
              <Text style={styles.invoiceItemName}>Energy Delivered ({deliveredEnergy} kWh)</Text>
              <Text style={styles.invoiceItemSub}>Metered DC power @ ₹24.00/kWh</Text>
            </View>
            <Text style={styles.invoiceItemValue}>₹{energyFee}</Text>
          </View>

          {/* Emergency Travel / Dispatch */}
          <View style={styles.invoiceRow}>
            <View>
              <Text style={styles.invoiceItemName}>Emergency Fleet Dispatch</Text>
              <Text style={styles.invoiceItemSub}>On-site arrival & road navigation</Text>
            </View>
            <Text style={[styles.invoiceItemValue, { color: '#059669', fontWeight: '800' }]}>FREE</Text>
          </View>

          {/* GST & Taxes */}
          <View style={styles.invoiceRow}>
            <View>
              <Text style={styles.invoiceItemName}>GST & Applicable Taxes (18%)</Text>
              <Text style={styles.invoiceItemSub}>Regulatory power cess</Text>
            </View>
            <Text style={styles.invoiceItemValue}>₹{tax}</Text>
          </View>

          <View style={styles.invoiceDividerBold} />

          {/* Total Amount Row */}
          <View style={styles.invoiceTotalRow}>
            <Text style={styles.invoiceTotalLabel}>Total Amount Payable</Text>
            <Text style={styles.invoiceTotalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Technician Info */}
        <View style={styles.operatorInfoCard}>
          <View style={styles.operatorAvatar}>
            <Ionicons name="person" size={20} color="#059669" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.operatorNameText}>{operatorName}</Text>
            <Text style={styles.operatorVehicleText}>{operatorVehicle}</Text>
          </View>
        </View>

        {/* Waiting for Operator Confirmation Indicator */}
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="small" color="#059669" />
          <Text style={styles.waitingText}>
            Waiting for operator to confirm payment receipt...
          </Text>
        </View>
      </ScrollView>

      {/* Review & Rating Modal Popup (Triggered when Operator completes payment) */}
      <Modal visible={showReviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalCard}>
            {/* Celebration Icon */}
            <View style={styles.reviewHeroIcon}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
            </View>

            <Text style={styles.reviewModalTitle}>Payment Confirmed! 🎉</Text>
            <Text style={styles.reviewModalSub}>
              How was your emergency rescue charging experience with {operatorName}?
            </Text>

            {/* 5-Star Interactive Rating */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRatingScore(star)}
                  activeOpacity={0.7}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= ratingScore ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= ratingScore ? '#F59E0B' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Feedback Chips */}
            <View style={styles.tagsContainer}>
              {reviewTags.map((tag, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
                  onPress={() => setSelectedTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagChipText, selectedTag === tag && styles.tagChipTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional Comment Input */}
            <TextInput
              style={styles.reviewInput}
              placeholder="Add optional remarks (e.g. prompt service, great tech)..."
              placeholderTextColor="#94A3B8"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={2}
            />

            {/* Submit & Skip Actions */}
            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={handleSubmitReview}
              disabled={isSubmittingReview}
              activeOpacity={0.88}
            >
              {isSubmittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitReviewText}>Submit Review & Finish</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkipReview}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
  },
  headerPillText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  amountDueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  dueSubLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 6,
  },
  dueAmount: {
    fontSize: 44,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  kwhBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  kwhBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },

  // Payment Instruction Card
  paymentInstructionCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 4,
  },
  instructionDesc: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
    fontWeight: '500',
  },
  acceptedMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  methodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  methodTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  // Itemized Invoice Card
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceCardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.8,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  invoiceItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  invoiceItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  invoiceItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceDividerBold: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  invoiceTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  invoiceTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
  },

  // Operator Card
  operatorInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  operatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  operatorNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  operatorVehicleText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },

  // Waiting Container
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  waitingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  // Review Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reviewModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  reviewHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reviewModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  reviewModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  starBtn: {
    padding: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tagChipTextActive: {
    color: '#059669',
  },
  reviewInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 18,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  submitReviewBtn: {
    width: '100%',
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  skipBtn: {
    marginTop: 12,
    paddingVertical: 6,
  },
  skipBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default PaymentScreen;
