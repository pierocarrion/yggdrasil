import {
  DISMISSAL_COOLDOWN_MS,
  ENTRY_FIVE_TRIGGER,
  getFeedbackStorageKey,
  isFeedbackPromptEligible,
  isValidNpsScore,
  markFeedbackPromptShown,
  markFeedbackSubmitted,
  normalizeFeedback,
  readFeedbackThrottleState,
  SUBMISSION_COOLDOWN_MS,
} from './feedback';

jest.mock('@/lib/firebase/client', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  getCountFromServer: jest.fn(),
  serverTimestamp: jest.fn(),
}));

describe('feedback helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('accepts the inclusive integer score range', () => {
    expect(isValidNpsScore(0)).toBe(true);
    expect(isValidNpsScore(10)).toBe(true);
  });

  it.each([-1, 11, 4.5])('rejects invalid score %p', (score) => {
    expect(isValidNpsScore(score)).toBe(false);
  });

  it('omits a blank comment', () => {
    expect(
      normalizeFeedback({
        userId: 'user-1',
        score: 0,
        comment: '   ',
        trigger: ENTRY_FIVE_TRIGGER,
      })
    ).toEqual({
      userId: 'user-1',
      score: 0,
      trigger: ENTRY_FIVE_TRIGGER,
    });
  });

  it('trims a nonblank comment', () => {
    expect(
      normalizeFeedback({
        userId: 'user-1',
        score: 10,
        comment: '  Thoughtful and useful.  ',
        trigger: ENTRY_FIVE_TRIGGER,
      })
    ).toEqual({
      userId: 'user-1',
      score: 10,
      comment: 'Thoughtful and useful.',
      trigger: ENTRY_FIVE_TRIGGER,
    });
  });

  it('blocks a trigger that has already been seen', () => {
    expect(
      isFeedbackPromptEligible(
        { seenTriggers: [ENTRY_FIVE_TRIGGER] },
        ENTRY_FIVE_TRIGGER
      )
    ).toBe(false);
  });

  it('applies dismissal and submission cooldowns', () => {
    const now = 10_000_000_000;

    expect(
      isFeedbackPromptEligible(
        {
          seenTriggers: [],
          lastShownAt: now - DISMISSAL_COOLDOWN_MS + 1,
        },
        'future_trigger',
        now
      )
    ).toBe(false);

    expect(
      isFeedbackPromptEligible(
        {
          seenTriggers: [],
          lastShownAt: now - DISMISSAL_COOLDOWN_MS,
        },
        'future_trigger',
        now
      )
    ).toBe(true);

    expect(
      isFeedbackPromptEligible(
        {
          seenTriggers: [],
          lastSubmittedAt: now - SUBMISSION_COOLDOWN_MS + 1,
        },
        'future_trigger',
        now
      )
    ).toBe(false);

    expect(
      isFeedbackPromptEligible(
        {
          seenTriggers: [],
          lastSubmittedAt: now - SUBMISSION_COOLDOWN_MS,
        },
        'future_trigger',
        now
      )
    ).toBe(true);
  });

  it('uses separate throttle state for different users', () => {
    const now = 1_000;

    expect(markFeedbackPromptShown('user-1', ENTRY_FIVE_TRIGGER, now)).toBe(
      true
    );
    expect(markFeedbackSubmitted('user-1', now + 1)).toBe(true);

    expect(getFeedbackStorageKey('user-1')).not.toBe(
      getFeedbackStorageKey('user-2')
    );
    expect(readFeedbackThrottleState('user-1')).toEqual({
      lastShownAt: now,
      lastSubmittedAt: now + 1,
      seenTriggers: [ENTRY_FIVE_TRIGGER],
    });
    expect(readFeedbackThrottleState('user-2')).toEqual({
      seenTriggers: [],
    });
  });
});
