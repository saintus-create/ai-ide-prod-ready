import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const meta = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Error boundary component that catches JavaScript errors and displays a user-friendly fallback UI.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      description: 'Child components to wrap with error boundary',
    },
  },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

const ErrorComponent = () => {
  throw new Error('Something went wrong!');
  return <div>This will not render</div>;
};

const WorkingComponent = () => (
  <div className="p-4 bg-green-600 text-white rounded">
    This component works fine!
  </div>
);

export const WithError: Story = {
  args: {
    children: <ErrorComponent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Error boundary catches and displays JavaScript errors with recovery options.',
      },
    },
  },
};

export const Working: Story = {
  args: {
    children: <WorkingComponent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Error boundary allows normal components to render without interference.',
      },
    },
  },
};

export const WithCustomError: Story = {
  args: {
    children: (
      <div>
        <button
          onClick={() => {
            throw new TypeError('Custom error message');
          }}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Trigger Custom Error
        </button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive story where you can trigger an error to see the boundary in action.',
      },
    },
  },
};