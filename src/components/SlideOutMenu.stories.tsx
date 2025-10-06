import type { Meta, StoryObj } from '@storybook/nextjs';
import { SessionProvider } from 'next-auth/react';
import SlideOutMenu from './SlideOutMenu';
import { Role } from '@/types/rbac';

const meta = {
  title: 'Components/SlideOutMenu',
  component: SlideOutMenu,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SlideOutMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// Menu closed state
export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
  },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <div className="bg-gray-900 min-h-screen">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
};

// Menu open - not logged in
export const OpenNotLoggedIn: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close menu'),
  },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <div className="bg-gray-900 min-h-screen">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
};

// Menu open - logged in as regular user
export const OpenRegularUser: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close menu'),
  },
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          user: {
            id: '12345',
            name: 'John Doe',
            email: 'john.doe@example.com',
            roles: [Role.VALIDATED_USER],
          },
          expires: '9999-12-31T23:59:59.999Z',
        }}
      >
        <div className="bg-gray-900 min-h-screen">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
};

// Menu open - logged in as moderator
export const OpenModerator: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close menu'),
  },
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          user: {
            id: '12345',
            name: 'Jane Moderator',
            email: 'jane.mod@example.com',
            roles: [Role.VALIDATED_USER, Role.MODERATOR],
          },
          expires: '9999-12-31T23:59:59.999Z',
        }}
      >
        <div className="bg-gray-900 min-h-screen">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
};

// Menu open - logged in as admin
export const OpenAdmin: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close menu'),
  },
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          user: {
            id: '12345',
            name: 'Admin User',
            email: 'admin@example.com',
            roles: [Role.VALIDATED_USER, Role.MODERATOR, Role.SECURITY_ADMIN],
          },
          expires: '9999-12-31T23:59:59.999Z',
        }}
      >
        <div className="bg-gray-900 min-h-screen">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
};
