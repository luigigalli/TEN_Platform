INSERT INTO users (
    first_name,
    last_name,
    email,
    password,
    role,
    email_verified,
    active,
    permissions
) VALUES (
    'Admin',
    'User',
    'admin@tenplatform.com',
    '$2a$10$v/MRgN9fasRpLNno.Kw7Qu251F6F4L/28YRRtZTRsnG6ZbkwZNniy', -- This is 'Admin123!'
    'admin',
    true,
    true,
    '["admin.access", "admin.manage_users", "admin.manage_content"]'
);
