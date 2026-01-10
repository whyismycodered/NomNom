import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function BottomNavigation({
  slide,
  index,
  totalSlides,
  onNext,
  onFinish,
}) {
  return (
    <View style={styles.bottomContainer}>
      <View style={styles.whiteCard}>
        <View style={styles.buttonSection}>
          {slide.showNextSkip ? (
            <View style={styles.bottomRow}>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={onNext}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={onFinish}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onNext}
            >
              <Text style={styles.buttonText}>
                {slide.button}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dotsContainer}>
          {Array.from({ length: totalSlides }).map((_, d) => (
            <View
              key={d}
              style={[
                styles.dot,
                d === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'transparent',
  },
  whiteCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 24,
    elevation: 10,
  },
  buttonSection: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },
  skipButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#98959aff',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  skipButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#504e51ff',
  },
  nextButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#8B00C4',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#8B00C4',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
    fontSize: 17,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139,0,196,0.4)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#8B00C4',
  },
});