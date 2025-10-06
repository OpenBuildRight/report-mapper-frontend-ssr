import type { Meta, StoryObj } from '@storybook/nextjs';
import { SessionProvider } from 'next-auth/react';
import UserProfile from './UserProfile';
import { Role } from '@/types/rbac';

const meta = {
  title: 'Components/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-gray-800 p-4 rounded-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UserProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock session for logged out state
export const LoggedOut: Story = {
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <div className="bg-gray-800 p-4 rounded-md">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
};

// Mock session for logged in state
export const LoggedIn: Story = {
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          user: {
            id: '12345',
            name: 'John Doe',
            email: 'john.doe@example.com',
            image: 'https://i.pravatar.cc/150?img=12',
            roles: [Role.VALIDATED_USER],
          },
          accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          expires: '9999-12-31T23:59:59.999Z',
        }}
      >
        <div className="bg-gray-800 p-4 rounded-md">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
};
