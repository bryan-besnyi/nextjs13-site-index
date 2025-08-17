import 'jest-axe/extend-expect';

// Optional: Configure axe for testing
// @ts-ignore - jest-axe types not available
import { configureAxe } from 'jest-axe';

const axe = configureAxe({
  rules: {
    // Disable rules that might be too strict for development
    'color-contrast': { enabled: true }, // Keep color contrast checking
    'landmark-one-main': { enabled: true }, // Ensure one main landmark
    'region': { enabled: false }, // Disable region requirement for now
  },
});

export { axe };