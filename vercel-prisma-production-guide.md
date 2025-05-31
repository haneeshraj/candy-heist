# Vercel Production Setup Guide for Prisma + MongoDB Atlas

This guide will help you optimize your Prisma client setup for production deployment on Vercel with MongoDB Atlas.

## 1. Prisma Client Setup for Vercel

Your current setup is good, but here's an improved version optimized for Vercel deployment:

### Basic Setup (Your Current Approach - Improved)

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error"],
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = global.prisma;
}

export default prisma;
```

### Enhanced Setup with Connection Pooling

For better performance on Vercel:

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = global.prisma;
}

export default prisma;
```

### Advanced Singleton Pattern (Recommended)

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

class PrismaClientSingleton {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === "development" 
          ? ["query", "error", "warn"] 
          : ["error"],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
    }
    return PrismaClientSingleton.instance;
  }
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = PrismaClientSingleton.getInstance();
} else {
  if (!global.__prisma) {
    global.__prisma = PrismaClientSingleton.getInstance();
  }
  prisma = global.__prisma;
}

// Graceful shutdown
if (typeof window === "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
```

## 2. Environment Variables Configuration

### Development Environment (`.env.local`)

```env
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/myapp-dev?retryWrites=true&w=majority"
NODE_ENV="development"
```

### Production Environment (Vercel Dashboard)

Configure these environment variables in your Vercel project settings:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/myapp-prod?retryWrites=true&w=majority&maxPoolSize=10&serverSelectionTimeoutMS=5000&socketTimeoutMS=45000` |
| `NODE_ENV` | `production` |

### Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add the variables above
5. Make sure to set them for **Production**, **Preview**, and **Development** environments as needed

## 3. MongoDB Atlas Configuration for Vercel

### Optimized Connection String Parameters

For serverless deployments on Vercel, use these connection string parameters:

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?retryWrites=true&w=majority&maxPoolSize=10&serverSelectionTimeoutMS=5000&socketTimeoutMS=45000&maxIdleTimeMS=60000&minPoolSize=0
```

**Parameter Explanations:**
- `maxPoolSize=10`: Limits connection pool to 10 connections
- `serverSelectionTimeoutMS=5000`: 5-second timeout for server selection
- `socketTimeoutMS=45000`: 45-second socket timeout
- `maxIdleTimeMS=60000`: Close idle connections after 60 seconds
- `minPoolSize=0`: Minimum pool size (good for serverless)

### MongoDB Atlas Network Configuration

1. **Navigate to Network Access** in MongoDB Atlas
2. **Add IP Address**: `0.0.0.0/0` (Allow access from anywhere)
   - Required because Vercel functions run from dynamic IP addresses
   - For enhanced security, you can add specific Vercel IP ranges

3. **Database Access**: Ensure your database user has appropriate permissions
   - Username/password authentication
   - "Read and write to any database" privilege

## 4. Package.json Configuration

Update your build scripts to ensure Prisma client generation:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
```

**Key Scripts:**
- `postinstall`: Ensures Prisma client is generated after npm install
- `build`: Generates Prisma client before building Next.js app

## 5. Vercel Configuration (Optional)

Create `vercel.json` in your project root for advanced configuration:

```json
{
  "functions": {
    "app/**/*.js": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Configuration Options:**
- `maxDuration`: Maximum function execution time (30 seconds for Pro plans)
- `regions`: Deploy to specific regions (iad1 = US East)
- `env`: Environment-specific variables

## 6. Server Actions Implementation

Update your server actions to work optimally with the production setup:

```typescript
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  const email = formData.get('email') as string
  const name = formData.get('name') as string

  if (!email || !name) {
    return { success: false, error: 'Email and name are required' }
  }

  try {
    const user = await prisma.user.create({
      data: { email, name },
    })
    
    revalidatePath('/')
    return { success: true, user }
  } catch (error) {
    console.error('Failed to create user:', error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return { success: false, error: 'Email already exists' }
    }
    
    return { success: false, error: 'Failed to create user' }
  }
  // Note: No need to manually disconnect - Vercel handles this
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return users
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}
```

## 7. Database Connection Testing

Create an API route to test your database connection:

```typescript
// app/api/test-db/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    
    return NextResponse.json({ 
      success: true, 
      userCount,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
```

Test this endpoint after deployment:
```
https://your-app.vercel.app/api/test-db
```

## 8. Deployment Process

### Method 1: Automatic Deployment (Recommended)

1. **Push to Git Repository**:
   ```bash
   git add .
   git commit -m "Production setup"
   git push origin main
   ```

2. **Connect Repository to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Configure environment variables
   - Deploy

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login and Deploy**:
   ```bash
   vercel login
   vercel --prod
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add NODE_ENV production
   ```

## 9. Performance Optimization Tips

### Database Query Optimization

```typescript
// ✅ Good: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
})

// ❌ Avoid: Selecting all fields
const users = await prisma.user.findMany()

// ✅ Good: Use pagination for large datasets
const users = await prisma.user.findMany({
  take: 10,
  skip: page * 10,
  orderBy: { createdAt: 'desc' },
})
```

### Connection Management

```typescript
// ✅ Good: Reuse the same Prisma instance
import prisma from '@/lib/prisma'

// ❌ Avoid: Creating new instances
const prisma = new PrismaClient()
```

### Error Handling

```typescript
try {
  const result = await prisma.user.create({ data })
  return { success: true, data: result }
} catch (error) {
  // Log detailed error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Full error:', error)
  }
  
  // Return user-friendly error in production
  return { success: false, error: 'Operation failed' }
}
```

## 10. Monitoring and Debugging

### Vercel Function Logs

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to **Functions** tab
4. Click on individual function invocations to see logs

### MongoDB Atlas Monitoring

1. Go to MongoDB Atlas dashboard
2. Navigate to **Monitoring** tab
3. Check connection metrics and query performance

### Environment-Specific Logging

```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error']
})
```

## 11. Troubleshooting Common Issues

### Connection Timeout Issues

```typescript
// Add connection timeout handling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}&connectTimeoutMS=10000&socketTimeoutMS=45000`
    }
  }
})
```

### Memory Issues

```typescript
// Implement connection cleanup for long-running operations
export async function heavyOperation() {
  try {
    const result = await prisma.someHeavyQuery()
    return result
  } finally {
    // Force cleanup in development
    if (process.env.NODE_ENV === 'development') {
      await prisma.$disconnect()
    }
  }
}
```

### Build Issues

If you encounter build issues, ensure:

1. **Prisma client is generated**:
   ```bash
   npx prisma generate
   ```

2. **Environment variables are set** in Vercel dashboard

3. **Dependencies are correctly installed**:
   ```bash
   npm install @prisma/client prisma
   ```

## 12. Production Checklist

Before deploying to production:

- [ ] MongoDB Atlas cluster is configured for production
- [ ] Network access allows Vercel IP ranges (`0.0.0.0/0`)
- [ ] Database user has appropriate permissions
- [ ] Environment variables are set in Vercel
- [ ] Prisma client is properly configured
- [ ] Connection string includes serverless optimization parameters
- [ ] Error handling is implemented in server actions
- [ ] Database connection testing API route works
- [ ] Build process includes `prisma generate`
- [ ] Monitoring and logging are configured

## Conclusion

Your current Prisma setup will work excellently on Vercel! The key optimizations for production are:

✅ **Proper global variable handling** for development  
✅ **Clean instance creation** for production  
✅ **Environment-specific logging**  
✅ **Connection string optimization** for serverless  
✅ **Proper environment variable configuration**  

With these configurations, your Next.js app with Prisma and MongoDB Atlas will perform optimally on Vercel's serverless platform.