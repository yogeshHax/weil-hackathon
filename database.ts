// In-memory user storage for development
// In production, replace with actual database (PostgreSQL, MongoDB, etc.)

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'buyer' | 'seller' | 'admin';
  createdAt: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
}

class UserDatabase {
  private users: Map<string, User> = new Map();
  private userIdCounter = 1;

  // Initialize with some test users
  constructor() {
    this.initializeTestUsers();
  }

  private async initializeTestUsers() {
    const bcrypt = await import('bcryptjs');
    
    // Create test users
    const testUsers = [
      {
        email: 'admin@datamarket.com',
        name: 'Admin User',
        password: 'Admin123!@#',
        role: 'admin' as const,
      },
      {
        email: 'buyer@datamarket.com',
        name: 'Buyer User',
        password: 'Buyer123!@#',
        role: 'buyer' as const,
      },
      {
        email: 'seller@datamarket.com',
        name: 'Seller User',
        password: 'Seller123!@#',
        role: 'seller' as const,
      },
    ];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user: User = {
        id: `user_${this.userIdCounter++}`,
        email: userData.email.toLowerCase(),
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        createdAt: new Date().toISOString(),
        isActive: true,
        emailVerified: true,
      };
      this.users.set(user.email, user);
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'isActive' | 'emailVerified'>): Promise<User> {
    const user: User = {
      ...userData,
      id: `user_${this.userIdCounter++}`,
      email: userData.email.toLowerCase(),
      createdAt: new Date().toISOString(),
      isActive: true,
      emailVerified: false,
    };

    this.users.set(user.email, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.get(email.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  async updateUserLastLogin(email: string): Promise<void> {
    const user = this.users.get(email.toLowerCase());
    if (user) {
      user.lastLoginAt = new Date().toISOString();
    }
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deactivateUser(email: string): Promise<boolean> {
    const user = this.users.get(email.toLowerCase());
    if (user) {
      user.isActive = false;
      return true;
    }
    return false;
  }

  async verifyEmail(email: string): Promise<boolean> {
    const user = this.users.get(email.toLowerCase());
    if (user) {
      user.emailVerified = true;
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const userDb = new UserDatabase();
