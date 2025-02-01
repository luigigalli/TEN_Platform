import { z } from 'zod';
import { db } from '../../../db';
import { users, roles, userRoles } from '../../../db/schema';
import { eq, like, sql, desc, asc, isNull } from 'drizzle-orm';
import { hash, compare } from 'bcrypt';

// Validation schemas
export const createUserSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  fname: z.string().min(2),
  lname: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'supplier']),
  status: z.enum(['active', 'inactive', 'pending']),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).optional(),
});

export const userQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['all', 'admin', 'user', 'supplier']).optional(),
  status: z.enum(['all', 'active', 'inactive', 'pending']).optional(),
  sortBy: z.enum(['email', 'fname', 'lname', 'role', 'status', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class UserService {
  private static SALT_ROUNDS = 10;

  async createUser(data: z.infer<typeof createUserSchema>) {
    try {
      console.log('Creating user with data:', { ...data, password: '[REDACTED]' });
      const hashedPassword = await hash(data.password, UserService.SALT_ROUNDS);

      // Start a transaction to create user and assign role
      const result = await db.transaction(async (tx) => {
        // Create the user
        const [user] = await tx.insert(users).values({
          ...data,
          password: hashedPassword,
          type: 2, // Default type
        }).returning();

        console.log('User created:', { ...user, password: '[REDACTED]' });

        // Find the role
        const [role] = await tx.select().from(roles).where(eq(roles.code, data.role.toUpperCase()));
        
        if (!role) {
          throw new Error(`Role ${data.role} not found`);
        }

        console.log('Found role:', role);

        // Assign role to user
        await tx.insert(userRoles).values({
          userId: user.id,
          roleId: role.id,
        });

        console.log('Role assigned to user');

        return user;
      });

      console.log('User created successfully with role:', result);
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
    if (data.password) {
      data.password = await hash(data.password, UserService.SALT_ROUNDS);
    }

    const [user] = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  async deleteUser(id: string) {
    const [user] = await db.update(users)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error('User not found');
    }
  }

  async getUser(id: string) {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .where(isNull(users.deletedAt))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getUserByEmail(email: string) {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .where(isNull(users.deletedAt))
      .limit(1);

    return user;
  }

  async getUsers(filters: z.infer<typeof userQuerySchema>) {
    console.log('Getting users with filters:', filters);
    
    const { page, limit, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        sql`(
          ${users.email} LIKE ${`%${search}%`} OR
          ${users.fname} LIKE ${`%${search}%`} OR
          ${users.lname} LIKE ${`%${search}%`} OR
          ${users.username} LIKE ${`%${search}%`}
        )`
      );
    }

    if (role && role !== 'all') {
      whereConditions.push(eq(users.role, role));
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(users.status, status));
    }

    // Always exclude deleted users
    whereConditions.push(isNull(users.deletedAt));

    // Get total count
    const [{ count }] = await db.select({
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(sql.join(whereConditions, sql` AND `));

    // Get users
    const results = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      fname: users.fname,
      lname: users.lname,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      image_name: users.image_name,
      prefix: users.prefix,
      mname: users.mname,
      suffix: users.suffix,
      type: users.type,
    })
    .from(users)
    .where(sql.join(whereConditions, sql` AND `))
    .orderBy(
      sortOrder === 'desc' 
        ? desc(users[sortBy as keyof typeof users]) 
        : asc(users[sortBy as keyof typeof users])
    )
    .limit(limit)
    .offset(offset);

    console.log('Found users:', results);

    return {
      users: results,
      pagination: {
        total: Number(count),
        page,
        limit,
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  }

  async validatePassword(id: string, password: string) {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .where(isNull(users.deletedAt))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return await compare(password, user.password);
  }
}
