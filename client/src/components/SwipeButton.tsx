import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const BUTTON_HEIGHT = 60;
const THUMB_SIZE = 52;
const PADDING = 4;
const TRACK_WIDTH = Dimensions.get('window').width - 48;
const MAX_SWIPE = TRACK_WIDTH - THUMB_SIZE - PADDING * 2;

interface SwipeButtonProps {
  onSwipeSuccess: () => void;
  text: string;
  successText?: string;
}

const SwipeButton: React.FC<SwipeButtonProps> = ({ onSwipeSuccess, text, successText = 'DONE' }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isSwiped, setIsSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSwiped,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0 && gesture.dx <= MAX_SWIPE && !isSwiped) {
          pan.setValue({ x: gesture.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (isSwiped) return;

        if (gesture.dx >= MAX_SWIPE * 0.8) {
          Animated.timing(pan, {
            toValue: { x: MAX_SWIPE, y: 0 },
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            setIsSwiped(true);
            onSwipeSuccess();
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const textOpacity = pan.x.interpolate({
    inputRange: [0, MAX_SWIPE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, { opacity: isSwiped ? 1 : textOpacity }]}>
        {isSwiped ? successText : text}
      </Animated.Text>

      <Animated.View style={[styles.thumb, { transform: [{ translateX: pan.x }] }]} {...panResponder.panHandlers}>
        <Ionicons
          name={isSwiped ? 'checkmark' : 'chevron-forward'}
          size={28}
          color="#FFFFFF"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: BUTTON_HEIGHT,
    backgroundColor: '#F1F5F9',
    borderRadius: BUTTON_HEIGHT / 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  text: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    position: 'absolute',
    zIndex: 1,
  },
  thumb: {
    position: 'absolute',
    left: PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default SwipeButton;
