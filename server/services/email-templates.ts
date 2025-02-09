interface EmailTemplateData {
  [key: string]: string;
}

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEN Platform</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: #f8f9fa;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0070f3;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      font-size: 0.875rem;
      color: #666;
      border-top: 1px solid #eaeaea;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TEN Platform</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEN Platform. All rights reserved.</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  verifyEmail: (data: EmailTemplateData) => {
    const content = `
      <h2>Welcome to TEN Platform!</h2>
      <p>Thank you for registering. Please verify your email address to get started.</p>
      <p>Click the button below to verify your email address:</p>
      <a href="${data.verificationUrl}" class="button">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${data.verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account with us, you can safely ignore this email.</p>
    `;
    return baseTemplate(content);
  },

  resetPassword: (data: EmailTemplateData) => {
    const content = `
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password.</p>
      <p>Click the button below to create a new password:</p>
      <a href="${data.resetUrl}" class="button">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${data.resetUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
    `;
    return baseTemplate(content);
  },

  welcomeEmail: (data: EmailTemplateData) => {
    const content = `
      <h2>Welcome to TEN Platform!</h2>
      <p>Dear ${data.firstName},</p>
      <p>Thank you for joining TEN Platform. We're excited to have you on board!</p>
      <p>Here are some things you can do to get started:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Explore our services</li>
        <li>Connect with other members</li>
      </ul>
      <p>If you have any questions, our support team is here to help.</p>
    `;
    return baseTemplate(content);
  }
};
