import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  name: string;
  code: string;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({
  name,
  code,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for TEN2</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify your email address</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Thanks for signing up for TEN2! Please verify your email address by entering the following code:
          </Text>
          <Section style={codeContainer}>
            <Text style={verificationCode}>{code}</Text>
          </Section>
          <Text style={text}>
            This code will expire in 30 minutes. If you didn't request this verification, you can safely ignore this email.
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

const codeContainer = {
  background: '#f4f4f4',
  borderRadius: '4px',
  margin: '16px 0',
  padding: '16px',
  textAlign: 'center' as const,
};

const verificationCode = {
  color: '#1a1a1a',
  fontFamily: 'monospace',
  fontSize: '32px',
  fontWeight: '700',
  letterSpacing: '8px',
  margin: 0,
};
