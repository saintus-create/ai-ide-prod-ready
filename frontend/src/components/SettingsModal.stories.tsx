import type { Meta, StoryObj } from '@storybook/react';
import { SettingsModal } from '../components/SettingsModal';

const meta = {
  title: 'Components/SettingsModal',
  component: SettingsModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive settings modal with tabbed interface for configuring AI-IDE preferences.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the modal is visible',
    },
    onClose: {
      action: 'closed',
      description: 'Callback fired when modal is closed',
    },
  },
} satisfies Meta<typeof SettingsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default settings modal with all tabs and default settings.',
      },
    },
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log('Modal closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings modal in closed state - not visible to user.',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Settings modal with dark theme applied.',
      },
    },
  },
};

export const LightTheme: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-white text-black">
        <Story />
      </div>
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'light',
    },
    docs: {
      description: {
        story: 'Settings modal with light theme applied.',
      },
    },
  },
};