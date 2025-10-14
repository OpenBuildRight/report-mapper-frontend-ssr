import type { Meta, StoryObj } from '@storybook/nextjs';
import { SessionProvider } from 'next-auth/react';
import Navbar from './Navbar';
import { Role } from '@/types/rbac';

const meta = {
  title: 'Components/Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Not logged in
export const NotLoggedIn: Story = {
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

// Logged in as regular user
export const RegularUser: Story = {
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

// Logged in as moderator
export const Moderator: Story = {
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

// Logged in as admin
export const Admin: Story = {
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
