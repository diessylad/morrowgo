export const motionEasing = 'cubic-bezier(0.16, 1, 0.3, 1)';

export const motionPresets = {
  softReveal: [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
  maskedTextReveal: [{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'translateY(0)' }],
  scaleReveal: [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }],
  sideReveal: [{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'translateX(0)' }],
  imageReveal: [{ opacity: 0, transform: 'scale(1.05)' }, { opacity: 1, transform: 'scale(1)' }]
};
