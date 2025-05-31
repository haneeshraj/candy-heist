# Next.js 15 + Server Actions + Prisma + MongoDB Atlas Setup Guide

This guide will walk you through setting up a complete full-stack application with Next.js 15, Server Actions, Prisma ORM, and MongoDB Atlas.

## Prerequisites

- Node.js 18.17 or later
- MongoDB Atlas account
- Basic knowledge of React and TypeScript

## 1. Project Initialization

### Create Next.js 15 Project

```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint --app
cd my-app
```

### Install Required Dependencies

```bash
# Prisma dependencies
npm install prisma @prisma/client

# Development dependencies
npm install -D prisma
```

## 2. Prisma Setup

### Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/` directory with `schema.prisma`
- `.env` file with `DATABASE_URL`

### Configure Environment Variables

Update `.env`:

```env
# MongoDB Atlas Connection String
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

# Next.js
NEXTAUTH_SECRET="your-secret-key-here"
```

### Configure Prisma Schema

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
  
  @@map("users")
}

model Post {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String   @db.ObjectId
  
  @@map("posts")
}

model Category {
  id          String @id @default(auto()) @map("_id") @db.ObjectId
  name        String @unique
  description String?
  
  @@map("categories")
}
```

### Generate Prisma Client

```bash
npx prisma generate
```

## 3. Database Connection

### Create Prisma Client Instance

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Push Schema to Database

```bash
npx prisma db push
```

## 4. Server Actions Implementation

### Create Server Actions

Create `lib/actions.ts`:

```typescript
'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// User Actions
export async function createUser(formData: FormData) {
  const email = formData.get('email') as string
  const name = formData.get('name') as string

  if (!email || !name) {
    return { success: false, error: 'Email and name are required' }
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    })
    
    revalidatePath('/')
    return { success: true, user }
  } catch (error) {
    console.error('Failed to create user:', error)
    return { success: false, error: 'Failed to create user. Email might already exist.' }
  }
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            published: true,
          },
        },
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

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    })
    
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete user:', error)
    return { success: false, error: 'Failed to delete user' }
  }
}

// Post Actions
export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const authorId = formData.get('authorId') as string
  const published = formData.get('published') === 'on'

  if (!title || !authorId) {
    return { success: false, error: 'Title and author are required' }
  }

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        authorId,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })
    
    revalidatePath('/')
    revalidatePath('/posts')
    return { success: true, post }
  } catch (error) {
    console.error('Failed to create post:', error)
    return { success: false, error: 'Failed to create post' }
  }
}

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return posts
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return []
  }
}

export async function togglePostPublished(postId: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { published: true },
    })

    if (!post) {
      return { success: false, error: 'Post not found' }
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { published: !post.published },
    })
    
    revalidatePath('/')
    revalidatePath('/posts')
    return { success: true, post: updatedPost }
  } catch (error) {
    console.error('Failed to toggle post status:', error)
    return { success: false, error: 'Failed to update post' }
  }
}
```

## 5. Component Implementation

### Main Page Component

Update `app/page.tsx`:

```typescript
import { createUser, getUsers, deleteUser } from '@/lib/actions'
import { Suspense } from 'react'

function DeleteUserButton({ userId }: { userId: string }) {
  const deleteUserWithId = deleteUser.bind(null, userId)
  
  return (
    <form action={deleteUserWithId} className="inline">
      <button
        type="submit"
        className="text-red-600 hover:text-red-800 text-sm"
        onClick={(e) => {
          if (!confirm('Are you sure you want to delete this user?')) {
            e.preventDefault()
          }
        }}
      >
        Delete
      </button>
    </form>
  )
}

async function UsersList() {
  const users = await getUsers()

  if (users.length === 0) {
    return <p className="text-gray-500">No users found. Create one below!</p>
  }

  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <div key={user.id} className="p-6 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Posts: {user._count.posts} | Joined: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <DeleteUserButton userId={user.id} />
          </div>
          
          {user.posts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-1">Recent Posts:</p>
              <ul className="text-sm text-gray-600">
                {user.posts.slice(0, 3).map((post) => (
                  <li key={post.id} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${post.published ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                    {post.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>
      
      {/* Create User Form */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New User</h2>
        <form action={createUser} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Create User
          </button>
        </form>
      </div>

      {/* Users List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Users</h2>
        <Suspense fallback={<div className="animate-pulse">Loading users...</div>}>
          <UsersList />
        </Suspense>
      </div>
    </div>
  )
}
```

### Posts Page

Create `app/posts/page.tsx`:

```typescript
import { createPost, getPosts, getUsers, togglePostPublished } from '@/lib/actions'
import { Suspense } from 'react'

function TogglePublishButton({ postId, published }: { postId: string; published: boolean }) {
  const togglePublished = togglePostPublished.bind(null, postId)
  
  return (
    <form action={togglePublished} className="inline">
      <button
        type="submit"
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          published 
            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        }`}
      >
        {published ? 'Published' : 'Draft'}
      </button>
    </form>
  )
}

async function PostsList() {
  const posts = await getPosts()

  if (posts.length === 0) {
    return <p className="text-gray-500">No posts found. Create one below!</p>
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article key={post.id} className="p-6 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
            <TogglePublishButton postId={post.id} published={post.published} />
          </div>
          
          {post.content && (
            <p className="text-gray-700 mb-3 line-clamp-3">{post.content}</p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>By {post.author.name}</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </article>
      ))}
    </div>
  )
}

async function CreatePostForm() {
  const users = await getUsers()

  return (
    <form action={createPost} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Post Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Enter post title"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={4}
          placeholder="Write your post content here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="authorId" className="block text-sm font-medium text-gray-700 mb-1">
          Author
        </label>
        <select
          id="authorId"
          name="authorId"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select an author</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          id="published"
          name="published"
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
          Publish immediately
        </label>
      </div>
      
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Create Post
      </button>
    </form>
  )
}

export default function PostsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Posts Management</h1>
      
      {/* Create Post Form */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Post</h2>
        <Suspense fallback={<div>Loading form...</div>}>
          <CreatePostForm />
        </Suspense>
      </div>

      {/* Posts List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Posts</h2>
        <Suspense fallback={<div className="animate-pulse">Loading posts...</div>}>
          <PostsList />
        </Suspense>
      </div>
    </div>
  )
}
```

## 6. MongoDB Atlas Configuration

### Setting Up MongoDB Atlas

1. **Create Account**: Go to [MongoDB Atlas](https://cloud.mongodb.com/) and sign up
2. **Create Cluster**: 
   - Choose "Build a Database"
   - Select "FREE" tier (M0 Sandbox)
   - Choose your preferred cloud provider and region
   - Name your cluster

3. **Database Access**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username/password
   - Set privileges to "Read and write to any database"

4. **Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - For development: Add `0.0.0.0/0` (allow from anywhere)
   - For production: Add specific IP addresses

5. **Get Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### Connection String Format

```
mongodb+srv://<username>:<password>@<cluster-name>.xxxxx.mongodb.net/<database-name>?retryWrites=true&w=majority
```

## 7. Development Workflow

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Prisma commands
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma db seed       # Run seed script (if configured)
```

### Useful Prisma Commands

```bash
# View your data in browser
npx prisma studio

# Reset database (development only)
npx prisma db push --force-reset

# Format schema file
npx prisma format
```

## 8. Key Concepts

### Server Actions Best Practices

1. **Always use `'use server'`** at the top of server action files
2. **Use `revalidatePath()`** after data mutations to refresh cached data
3. **Handle errors gracefully** with try-catch blocks
4. **Validate input data** before processing
5. **Use TypeScript** for better type safety

### MongoDB with Prisma

1. **Use `@db.ObjectId`** for MongoDB ID fields
2. **Use `@default(auto())`** for auto-generated ObjectIds
3. **Use `@map("_id")`** to map to MongoDB's `_id` field
4. **Relationships** work the same as with relational databases

### Performance Tips

1. **Use `select`** to only fetch needed fields
2. **Use `include`** for eager loading related data
3. **Add indexes** for frequently queried fields
4. **Use `Suspense`** for loading states
5. **Implement pagination** for large datasets

## 9. Troubleshooting

### Common Issues

**Connection Issues**:
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has correct permissions

**Prisma Issues**:
- Run `npx prisma generate` after schema changes
- Use `npx prisma db push` to sync schema with database
- Check console for detailed error messages

**Next.js Issues**:
- Ensure server actions are marked with `'use server'`
- Check that you're using Next.js 13.4+ for stable server actions
- Verify proper import/export syntax

## 10. Production Deployment

### Environment Variables

Ensure these environment variables are set in production:

```env
DATABASE_URL="mongodb+srv://..."
NEXTAUTH_SECRET="your-production-secret"
```

### Deployment Checklist

- [ ] Set up production MongoDB Atlas cluster
- [ ] Configure proper IP restrictions
- [ ] Set secure environment variables
- [ ] Test server actions in production environment
- [ ] Monitor database performance and usage

## Conclusion

You now have a complete setup with Next.js 15, Server Actions, Prisma, and MongoDB Atlas. This stack provides:

- **Type-safe database operations** with Prisma
- **Seamless form handling** with Server Actions
- **Scalable database** with MongoDB Atlas
- **Modern React patterns** with Next.js 15

Continue building by adding authentication, file uploads, real-time features, or any other functionality your application needs!