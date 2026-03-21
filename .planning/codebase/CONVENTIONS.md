# CryptoX Coding Conventions

This document outlines the coding standards, naming conventions, and patterns used throughout the CryptoX codebase.

## Overview

CryptoX is a Next.js 14 application with TypeScript using a modern React component architecture. The codebase emphasizes type safety, server-side rendering, and clean separation of concerns.

## TypeScript Patterns

### Type Annotations

All files use explicit TypeScript annotations. The project is configured with `strict: true` in `tsconfig.json` for maximum type safety.

**File:** `/Users/harrykang/Desktop/cryptox/tsconfig.json`
```typescript
// Strict mode enabled
"strict": true
"noEmit": true
```

### Generic Component Types

Components use a consistent type pattern with `T` prefix followed by the component name:

**File:** `/Users/harrykang/Desktop/cryptox/src/components/file-uploader.tsx`
```typescript
type TFileUploader = {
  onChange?: (files: File[]) => void;
  labelText?: string;
  multiple?: boolean;
  accept?: string;
  initialFile?: string;
  onDeleted?: () => void;
};

const FileUploader: React.FC<TFileUploader> = ({ ... }) => { ... };
```

**File:** `/Users/harrykang/Desktop/cryptox/src/app/[lang]/(navigator)/posts/new/new-form.tsx`
```typescript
type TPostNewForm = {};
const PostNewForm: React.FC<TPostNewForm> = ({}) => { ... };
```

### Interface Patterns

Service and store interfaces use the `I` prefix:

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/stores/calculator-store.ts`
```typescript
interface ICalculatorStore {
  selectedExchange: IExchange;
  setSelectedExchange: (selectedExchange: IExchange) => void;
  seed: number;
  setSeed: (seed: number) => void;
  // ...
}

interface IExchange extends Exchange {}
```

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/services/posts/posts.service.ts`
```typescript
export interface IGetPosts
  extends Prisma.PostGetPayload<{
    include: { ... };
  }> {
  isFollowing: boolean;
  isLiked: boolean;
}
```

### Prisma Types

Prisma types are often extended to add computed properties:

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/services/posts/posts.service.ts`
```typescript
export interface IGetPost
  extends Prisma.PostGetPayload<{
    include: {
      user: { include: { followers: true; }; };
      comments: { ... };
      likes: { include: { user: true; }; };
    };
  }> {
  isFollowing: boolean;
  isLiked: boolean;
}
```

## Naming Conventions

### Files and Directories

- **Component files:** kebab-case with `.tsx` extension
  - Example: `file-uploader.tsx`, `post-list-section.tsx`, `me-detail-card.tsx`
  - Location: `/Users/harrykang/Desktop/cryptox/src/components/`
  - Feature-specific components co-located with their routes

- **Service files:** kebab-case with `.ts` extension, singular noun form
  - Example: `posts.service.ts`, `users.service.ts`, `comment-likes.service.ts`
  - Location: `/Users/harrykang/Desktop/cryptox/src/lib/services/`

- **Store files:** kebab-case with `.ts` extension
  - Example: `calculator-store.ts`, `alert-dialog-store.ts`, `rich-text-store.ts`
  - Location: `/Users/harrykang/Desktop/cryptox/src/lib/stores/`

- **Utility files:** kebab-case with `.ts` extension
  - Example: `date-fomatting.ts`, `get-animation-props.ts`, `get-image-url.ts`
  - Location: `/Users/harrykang/Desktop/cryptox/src/lib/utils/`

- **Server Action files:** Always named `actions.ts`, co-located with their route
  - Example: `/Users/harrykang/Desktop/cryptox/src/app/[lang]/(navigator)/posts/new/actions.ts`
  - Example: `/Users/harrykang/Desktop/cryptox/src/app/[lang]/(navigator)/posts/[id]/actions.ts`

- **API route files:** Named `route.ts`, following Next.js conventions
  - Example: `/Users/harrykang/Desktop/cryptox/src/app/api/news/crypto/route.ts`

### Variables and Constants

- **Stores:** camelCase exported singletons
  - Example: `export const richTextStore = create<...>(...)`
  - Example: `export const useCalculatorStore = create<...>(...)`

- **Services:** camelCase exported singletons
  - Example: `export const postsService = new PostsService()`
  - Example: `export const usersService = new UsersService()`

- **Class names:** PascalCase
  - Example: `class PostsService extends CoreService { ... }`
  - Example: `class UsersService extends CoreService { ... }`

- **React hook functions:** Use `use` prefix for custom hooks
  - Example: `export function useAction<T>(...)`
  - File: `/Users/harrykang/Desktop/cryptox/src/hooks/use-action.ts`

- **Internal state:** camelCase
  - Example: `const [isDragging, setIsDragging] = useState(false)`
  - Example: `const [files, setFiles] = useState<File[]>([])`

## Component Patterns

### Client vs Server Components

Client components use the `"use client"` directive at the top of the file. Server components do not have this directive.

**Client Component Example:**
**File:** `/Users/harrykang/Desktop/cryptox/src/components/file-uploader.tsx`
```typescript
"use client";

import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
// ... uses React hooks, event handlers, browser APIs
```

**Server Component Example:**
**File:** `/Users/harrykang/Desktop/cryptox/src/app/[lang]/(navigator)/layout.tsx`
```typescript
// No "use client" directive
// Uses async functions, direct database access
export async function generateMetadata({ ... }): Promise<Metadata> { ... }

export default async function LanguageLayout({ ... }) {
  const dictionary = await getDictionary(lang);
  // ...
}
```

### Component Structure

Components follow this pattern:

1. Imports (client directive if needed)
2. Type definitions (`type T...`)
3. Component function definition
4. Return JSX
5. Default export or named export with `displayName`

**File:** `/Users/harrykang/Desktop/cryptox/src/app/[lang]/(navigator)/login/login-form.tsx`
```typescript
"use client";

import React from "react";
// ... imports

type TLoginForm = {};

const LoginForm = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TLoginForm
>((props, ref) => {
  // ... component logic
  return (
    <div ref={ref} {...props}>
      {/* ... JSX */}
    </div>
  );
});

LoginForm.displayName = "LoginForm";
export { LoginForm };
```

### shadcn/ui Component Pattern

UI components extend from shadcn/ui base components using `React.forwardRef`:

**File:** `/Users/harrykang/Desktop/cryptox/src/components/ui/button.tsx`
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center ...",
  {
    variants: {
      variant: { ... },
      size: { ... },
    },
    defaultVariants: { ... },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### Styled Components with CVA (Class Variance Authority)

All UI components use the CVA pattern for styling:

- Define variant styles with `cva()`
- Merge classes with `cn()` from `@/lib/utils`
- Use `className-variance-authority` for type-safe variants

**File:** `/Users/harrykang/Desktop/cryptox/src/components/ui/button.tsx`
```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: { default: "...", destructive: "...", ... },
      size: { default: "...", sm: "...", ... },
    },
  }
);
```

## Error Handling Patterns

### API Routes

API routes use try-catch blocks with proper HTTP status codes:

**File:** `/Users/harrykang/Desktop/cryptox/src/app/api/news/crypto/route.ts`
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const news = await fetchCryptoNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error("Failed to fetch crypto news:", error);
    return NextResponse.json([], { status: 500 });
  }
}
```

### Service Layer

Services throw errors that are caught by callers:

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/services/users/users.service.ts`
```typescript
async login(email: string, password: string) {
  const user = await this.db.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await this.verifyPassword(password, user.password);

  if (!isValid) {
    throw new Error("Invalid password");
  }

  return user;
}
```

### Authentication Errors

Auth service uses Next.js `redirect()` for authentication failures:

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/services/users/users.service.ts`
```typescript
async follow(toId: string) {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }
  // ...
}
```

### Server Actions

Server actions use Next-Safe-Action wrapper with Zod validation:

**File:** `/Users/harrykang/Desktop/cryptox/src/app/[lang]/(navigator)/posts/new/actions.ts`
```typescript
"use server";

import { action } from "@/lib/safe-action";
import { z } from "zod";

const formSchema = z.object({
  isLong: z.boolean(),
  imageUrl: z.string(),
  title: z.string(),
  content: z.string(),
});

export const createPostAction = action(formSchema, async (data) => {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }

  const post = await postsService.create({
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl,
    isLong: data.isLong,
    user: { connect: { email: session.user.email } },
  });

  return post;
});
```

## Import Style and Path Aliases

### Path Alias Convention

All imports use the `@/*` path alias which maps to `./src/*`:

**tsconfig.json:**
```json
"paths": {
  "@/*": ["./src/*"]
}
```

**Examples:**
- Components: `import FileUploader from "@/components/file-uploader";`
- Services: `import { postsService } from "@/lib/services/posts/posts.service";`
- Stores: `import { richTextStore } from "@/lib/stores/rich-text-store";`
- Utils: `import { cn } from "@/lib/utils";`
- i18n: `import { getDictionary } from "@/i18n";`
- Auth: `import { auth } from "@/auth";`

### Import Organization

Imports are organized in this order:

1. External libraries (React, Next.js)
2. UI components and primitives
3. Relative project imports using `@/` alias
4. Types and interfaces

**File:** `/Users/harrykang/Desktop/cryptox/src/app/[lang]/(navigator)/posts/new/new-form.tsx`
```typescript
"use client";
import FileUploader from "@/components/file-uploader";
import Tiptap from "@/components/tip-tap";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { File } from "buffer";
import { sub } from "date-fns";
import React, { use, useEffect, useState } from "react";
import { ControllerRenderProps, FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { createPostAction } from "./actions";
import { useRouter } from "next/navigation";
import { richTextStore } from "@/lib/stores/rich-text-store";
import { Checkbox } from "@/components/ui/checkbox";
```

## State Management Patterns

### Zustand Stores

Zustand is used for client-side state management. All stores are created as singletons with a standard pattern:

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/stores/calculator-store.ts`
```typescript
import { Exchange } from "@prisma/client";
import { create } from "zustand";

interface IExchange extends Exchange {}

interface ICalculatorStore {
  selectedExchange: IExchange;
  setSelectedExchange: (selectedExchange: IExchange) => void;
  seed: number;
  setSeed: (seed: number) => void;
  leverage: number;
  setLeverage: (leverage: number) => void;
  frequency: number;
  setFrequency: (frequency: number) => void;
  frequencyText: string;
  setFrequencyText: (frequencyText: string) => void;
  expectationPayback: number;
  setExpectationPayback: (expectationPayback: number) => void;
}

export const useCalculatorStore = create<ICalculatorStore>((set) => {
  return {
    selectedExchange: { /* default values */ },
    setSelectedExchange: (selectedExchange) => set({ selectedExchange }),
    seed: 0,
    setSeed: (seed) => set({ seed }),
    // ... additional state and setters
  };
});
```

**Store Usage in Components:**
```typescript
const { richText, setRichText } = richTextStore();
```

**Store Naming:**
- Store hooks: `use[FeatureName]Store`
- Store files: `[feature-name]-store.ts`
- Location: `/Users/harrykang/Desktop/cryptox/src/lib/stores/`

## Form Handling Patterns

### React Hook Form + Zod

All forms use React Hook Form with Zod validation. Zod schemas are defined inside or outside the component:

**File:** `/Users/harrykang/Desktop/cryptox/src/app/[lang]/(navigator)/posts/new/new-form.tsx`
```typescript
"use client";

const PostNewForm: React.FC<TPostNewForm> = ({}) => {
  const formSchema = z.object({
    imageUrl: z.string(),
    title: z.string(),
    isLong: z.boolean(),
    content: z.string(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      imageUrl: "",
      isLong: false,
      content: "",
    },
  });

  async function onSubmit() {
    form.setValue("content", richText);
    const formData = form.getValues();

    if (formData.title === "") {
      alert("제목을 입력해주세요.");
      return;
    }

    const response = await createPostAction(formData);

    if (response.serverError) {
      alert("등록되지 않았습니다.");
      return;
    }
    alert("등록되었습니다.");
    router.push("/posts");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 py-12 w-full"
      >
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FileUploader
                  labelText="썸네일을 업로드 해주세요"
                  onChange={async (files) => {
                    if (files.length < 1) return;
                    const file = files[0];
                    const fileUploader = new FileUploadModule();
                    const data = await fileUploader.upload(file);
                    const fileUrl = "https://..." + data.path;
                    field.onChange({ target: { value: fileUrl } });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
```

### Zod Schema Patterns

Zod schemas are defined at the module level in `src/lib/zod/`:

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/zod.ts`
```typescript
import { object, string } from "zod";

export const signInSchema = object({
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});
```

### Form Validation Messages

Error messages are defined with `.message()` in Zod schemas:

**File:** `/Users/harrykang/Desktop/cryptox/src/app/[lang]/(navigator)/login/login-form.tsx`
```typescript
const formSchema = z.object({
  email: z
    .string()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
      message: "이메일이 유효하지 않습니다.",
    })
    .min(2),
  password: z
    .string()
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()])/, {
      message: "비밀번호가 유효하지 않습니다.",
    })
    .min(8),
});
```

## Service Layer Pattern

### CoreService Base Class

All services extend `CoreService` which provides access to the Prisma client:

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/services/core/core.service.ts`
```typescript
import prisma from "@/lib/prisma";

export class CoreService {
  protected db = prisma;
}
```

### Service Implementation

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/services/posts/posts.service.ts`
```typescript
import { Prisma } from "@prisma/client";
import { CoreService } from "../core/core.service";
import { auth } from "@/auth";

class PostsService extends CoreService {
  async create(data: Prisma.PostCreateInput) {
    return this.db.post.create({
      data,
    });
  }

  async update(id: string, data: Prisma.PostUpdateInput) {
    return this.db.post.update({
      where: { id },
      data,
    });
  }

  async findMany(page: number, category?: string) {
    const session = await auth();
    const posts = await this.db.post.findMany({
      where: {
        ...(category && { isLong: category === "long" }),
      },
      take: 10 * page,
      include: {
        user: { include: { followers: true } },
        comments: true,
        likes: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return posts.map((post) => {
      const isFollowing = post.user.followers.some(
        (follower) => follower.email === session?.user?.email
      );
      const isLiked = post.likes
        .map((like) => like.user.email === session?.user?.email)
        .includes(true);

      return { ...post, isFollowing, isLiked };
    });
  }

  // ... other methods
}

export const postsService = new PostsService();
```

### Service Organization

- **Location:** `/Users/harrykang/Desktop/cryptox/src/lib/services/[feature]/`
- **Pattern:** Class with async methods
- **Export:** Singleton instance (e.g., `export const postsService = new PostsService()`)
- **Database:** All database access through `this.db` (Prisma client from CoreService)

## Database Access

### Prisma Client Singleton

The Prisma client is a singleton to prevent multiple instances:

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/prisma.ts`
```typescript
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production")
  globalThis.prismaGlobal = prisma;
```

### Type-Safe Queries

Prisma types are extended for computed properties in services:

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/services/posts/posts.service.ts`
```typescript
export interface IGetPosts
  extends Prisma.PostGetPayload<{
    include: {
      user: true;
      comments: true;
      likes: true;
    };
  }> {
  isFollowing: boolean;
  isLiked: boolean;
}
```

## Utility Functions

### Utility Organization

Utility functions are organized in `/Users/harrykang/Desktop/cryptox/src/lib/utils/`:

- `cn()` - Class name merging utility from `@/lib/utils`
- `getAnimationProps()` - Animation helper from `@/lib/utils/get-animation-props`
- `getImageUrl()` - Image URL formatting from `@/lib/utils/get-image-url`
- `dateFormatting()` - Date utilities from `@/lib/utils/date-fomatting`
- `password` - Password utilities from `@/lib/utils/password`

**File:** `/Users/harrykang/Desktop/cryptox/src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## i18n Pattern

### Dictionary-Based i18n

The app uses a custom middleware-based i18n with dictionaries:

**File:** `/Users/harrykang/Desktop/cryptox/src/i18n/index.ts`
```typescript
export type Dictionary = {
  home: string;
  dashboard: string;
  news: string;
  exchanges: string;
  community: string;
  // ... more translations
};

const dictionaries = {
  en: () => import('./en.json').then((module) => module.default as Dictionary),
  ko: () => import('./ko.json').then((module) => module.default as Dictionary),
};

export type ValidLocale = keyof typeof dictionaries;

export const getDictionary = async (locale: string | undefined) => {
  const validLocale = locale && locale in dictionaries ? locale as ValidLocale : 'en';

  try {
    return await dictionaries[validLocale]();
  } catch (error) {
    console.error(`Failed to load dictionary for locale '${validLocale}'`, error);
    return dictionaries.en();
  }
};
```

### Locale Routing

Routes are structured as `/[lang]/...`:

- `/en/...` - English pages
- `/ko/...` - Korean pages

**File:** `/Users/harrykang/Desktop/cryptox/middleware.ts`
```typescript
import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const locales = ["en", "ko"];
const defaultLocale = "en";

function getLocale(request: Request) {
  const headers = Object.fromEntries(request.headers);
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  const locale = getLocale(request);
  return NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url)
  );
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── [lang]/                    # i18n language segment
│   │   ├── (navigator)/           # Layout group with header/footer
│   │   │   ├── posts/             # Posts feature
│   │   │   ├── exchanges/         # Exchange integration
│   │   │   ├── news/              # News section
│   │   │   ├── me/                # User profile
│   │   │   └── layout.tsx         # Navigator layout
│   │   └── layout.tsx             # Root language layout
│   ├── api/                       # API routes
│   │   ├── news/
│   │   ├── exchanges/
│   │   └── auth/
│   └── layout.tsx                 # Root layout
├── components/                    # Shared React components
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── providers/                 # Context providers
│   ├── file-uploader.tsx
│   └── ...
├── lib/
│   ├── services/                  # Business logic services
│   │   ├── core/                  # Base service class
│   │   ├── posts/
│   │   ├── users/
│   │   └── ...
│   ├── stores/                    # Zustand stores
│   ├── zod/                       # Zod validation schemas
│   ├── modules/                   # Utility modules
│   ├── utils/                     # Utility functions
│   ├── prisma.ts                  # Prisma client singleton
│   ├── safe-action.ts             # Next-safe-action wrapper
│   └── utils.ts                   # Common utilities (cn, etc)
├── i18n/                          # Internationalization
│   ├── en.json                    # English translations
│   ├── ko.json                    # Korean translations
│   └── index.ts                   # i18n utils
├── hooks/                         # Custom React hooks
│   └── use-action.ts
├── auth.ts                        # NextAuth configuration
└── middleware.ts                  # Middleware (i18n routing)
```

## Code Quality Standards

- **Type Safety:** Strict TypeScript mode enabled
- **Linting:** ESLint with Next.js recommended config
- **Validation:** Zod for runtime validation on forms and API inputs
- **Error Handling:** Try-catch blocks in API routes, throw/redirect in services
- **Component Reusability:** UI components in `components/ui/` are reusable and accept standard props
- **DRY Principle:** Services and stores prevent duplication of business logic
- **Separation of Concerns:** Clear boundaries between components, services, and utilities
