import type { Meta, StoryObj } from '@storybook/nextjs';
import { SessionProvider } from 'next-auth/react';
import UserProfile from './UserProfile';

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
            name: 'John Doe',
            email: 'john.doe@example.com',
            image: 'https://i.pravatar.cc/150?img=12',
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

// Mock session with minimal user info
export const LoggedInMinimal: Story = {
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          user: {
            email: 'user@example.com',
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

// Mock session with dropdown open (requires interaction in Storybook)
export const LoggedInWithDropdown: Story = {
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          user: {
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            image: 'https://i.pravatar.cc/150?img=5',
          },
          accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IkphbmUgU21pdGgiLCJpYXQiOjE1MTYyMzkwMjJ9.POk6yJV_adQssw5cSflKxwRJSMeKKF2QT4fwpMeJf36',
          expires: '9999-12-31T23:59:59.999Z',
        }}
      >
        <div className="bg-gray-800 p-4 rounded-md h-96">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Click on the user email button to see the dropdown with profile details.',
      },
    },
  },
};
