import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  name: string;
  resetLink: string;
}

export const ResetPasswordEmail: React.FC<ResetPasswordEmailProps> = ({
  name,
  resetLink,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your TEN2 password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            We received a request to reset your password for your TEN2 account. Click the button below
            to create a new password:
          </Text>
          <Section style={buttonContainer}>
            <Button
              pX={20}
              pY={12}
              style={button}
              href={resetLink}
            >
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
            This link will expire in 1 hour. If you didn't request a password reset, you can safely
            ignore this email.
          </Text>
          <Text style={text}>
            Alternatively, you can copy and paste this URL into your browser:
            <br />
            <Link href={resetLink} style={link}>
              {resetLink}
            </Link>
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#2754C5',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
};

const link = {
  color: '#2754C5',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};
