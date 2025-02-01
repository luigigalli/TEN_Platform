-- Create enum for permission actions
CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'manage');

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    resource VARCHAR(255) NOT NULL,
    action permission_action NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Administrator with full access'),
    ('user', 'Regular user with basic access')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('user:create', 'Create users', 'user', 'create'),
    ('user:read', 'Read user information', 'user', 'read'),
    ('user:update', 'Update user information', 'user', 'update'),
    ('user:delete', 'Delete users', 'user', 'delete'),
    ('user:manage', 'Manage all user aspects', 'user', 'manage'),
    ('role:manage', 'Manage roles and permissions', 'role', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to admin role
WITH admin_role AS (SELECT id FROM roles WHERE name = 'admin'),
     all_permissions AS (SELECT id FROM permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT admin_role.id, all_permissions.id
FROM admin_role, all_permissions
ON CONFLICT DO NOTHING;

-- Assign basic permissions to user role
WITH user_role AS (SELECT id FROM roles WHERE name = 'user'),
     basic_permissions AS (
         SELECT id FROM permissions 
         WHERE name IN ('user:read', 'user:update')
     )
INSERT INTO role_permissions (role_id, permission_id)
SELECT user_role.id, basic_permissions.id
FROM user_role, basic_permissions
ON CONFLICT DO NOTHING;
