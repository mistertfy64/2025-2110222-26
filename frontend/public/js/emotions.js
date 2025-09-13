const EXTREME = 11 / 13;

/**
 * Thresholds are adapted from
 * https://upload.wikimedia.org/wikipedia/commons/a/ad/Circumplex_model_of_emotion.svg
 * by mrAnmol, CC BY-SA 4.0, via Wikimedia Commons
 */
const EMOTION_THRESHOLDS = {
  "neutral": { valence: 0 * EXTREME, arousal: 0 * EXTREME, precedence: 13 },
  "happy": {
    valence: (Math.sqrt(3) / 2) * EXTREME,
    arousal: (1 / 2) * EXTREME,
    precedence: 12
  },
  "excited": {
    valence: (Math.sqrt(2) / 2) * EXTREME,
    arousal: (Math.sqrt(2) / 2) * EXTREME,
    precedence: 11
  },
  "alert": {
    valence: (1 / 2) * EXTREME,
    arousal: (Math.sqrt(3) / 2) * EXTREME,
    precedence: 10
  },
  "tense": {
    valence: -(1 / 2) * EXTREME,
    arousal: (Math.sqrt(3) / 2) * EXTREME,
    precedence: 9
  },
  "angry": {
    valence: -(Math.sqrt(2) / 2) * EXTREME,
    arousal: (Math.sqrt(2) / 2) * EXTREME,
    precedence: 8
  },
  "distressed": {
    valence: -(Math.sqrt(3) / 2) * EXTREME,
    arousal: (1 / 2) * EXTREME,
    precedence: 7
  },
  "sad": {
    valence: -(Math.sqrt(3) / 2) * EXTREME,
    arousal: -(1 / 2) * EXTREME,
    precedence: 6
  },
  "depressed": {
    valence: -(Math.sqrt(2) / 2) * EXTREME,
    arousal: -(Math.sqrt(2) / 2) * EXTREME,
    precedence: 5
  },
  "bored": {
    valence: -(1 / 2) * EXTREME,
    arousal: -(Math.sqrt(3) / 2) * EXTREME,
    precedence: 4
  },
  "calm": {
    valence: (1 / 2) * EXTREME,
    arousal: -(Math.sqrt(3) / 2) * EXTREME,
    precedence: 3
  },
  "relaxed": {
    valence: (Math.sqrt(2) / 2) * EXTREME,
    arousal: -(Math.sqrt(2) / 2) * EXTREME,
    precedence: 2
  },
  "content": {
    valence: (Math.sqrt(3) / 2) * EXTREME,
    arousal: -(1 / 2) * EXTREME,
    precedence: 1
  }
};

function getEmotionClassification(emotion) {
  let result = "";
  let distanceDifference = 100;
  let emotionPrecedence = -1;
  for (let classification of Object.keys(EMOTION_THRESHOLDS)) {
    const valenceDifference =
      EMOTION_THRESHOLDS[classification].valence - emotion.valence;
    const arousalDifference =
      EMOTION_THRESHOLDS[classification].arousal - emotion.arousal;
    const distance = Math.sqrt(
      valenceDifference * valenceDifference +
        arousalDifference * arousalDifference
    );
    if (distance < distanceDifference) {
      result = classification;
      distanceDifference = distance;
      emotionPrecedence = EMOTION_THRESHOLDS[classification].precedence;
    } else if (
      distance == distanceDifference &&
      EMOTION_THRESHOLDS[classification].precedence > emotionPrecedence
    ) {
      result = classification;
      distanceDifference = distance;
      emotionPrecedence = EMOTION_THRESHOLDS[classification].precedence;
    }
  }
  return result;
}
