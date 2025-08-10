/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import MetricsCard from '../MetricsCard';
import { Database } from 'lucide-react';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

describe('Admin Dashboard Accessibility', () => {
  test('MetricsCard should have no accessibility violations', async () => {
    const { container } = render(
      <MetricsCard
        title="Total Index Items"
        value="1,525"
        description="Across all campuses"
        icon={Database}
        trend={{ value: 2.5, isPositive: true }}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('MetricsCard with minimal props should be accessible', async () => {
    const { container } = render(
      <MetricsCard
        title="API Response Time"
        value="120ms"
        icon={Database}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Multiple MetricsCards should not have duplicate IDs', async () => {
    const { container } = render(
      <div>
        <MetricsCard
          title="Total Items"
          value="1,525"
          icon={Database}
        />
        <MetricsCard
          title="Response Time"
          value="120ms"
          icon={Database}
        />
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});