import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ name }) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to TEN2 - Get Started with Your Account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to TEN2!</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Thank you for joining TEN2! We're excited to have you on board. Your account has been
            created successfully, and you're now part of our growing community.
          </Text>
          <Text style={text}>Here's what you can do next:</Text>
          <ul style={list}>
            <li>Complete your profile</li>
            <li>Explore available experiences</li>
            <li>Connect with other members</li>
            <li>Start sharing your own experiences</li>
          </ul>
          <Text style={text}>
            If you have any questions or need assistance, don't hesitate to{' '}
            <Link href="mailto:support@ten2.com" style={link}>
              contact our support team
            </Link>
            .
          </Text>
          <Text style={text}>
            Best regards,
            <br />
            The TEN2 Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '20px',
};

const list = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '20px',
  marginLeft: '24px',
};

const link = {
  color: '#2754C5',
  textDecoration: 'underline',
};
