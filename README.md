# P2P Gear Rental Platform

A modern peer-to-peer marketplace for renting photography and videography equipment. Built with Next.js 15, React 19, and TypeScript, this platform enables users to list their gear for rent and discover equipment from other creators in their area.

## 🎯 Features

### Core Functionality
- **Gear Listings**: Create and manage equipment listings with photos, pricing, and availability
- **Advanced Search**: Filter by category, location, price range, condition, and more
- **Rental Management**: Request rentals, approve/decline requests, track rental status
- **User Profiles**: Manage personal information, gear listings, and rental history
- **Secure Payments**: Integrated Stripe payment processing for secure transactions
- **Authentication**: Supabase-powered user authentication and session management

### Planned Features
- **Real-time Messaging**: Chat with gear owners and renters (Pusher integration ready)
- **Reviews & Ratings**: User feedback system for trust and reputation
- **Location Services**: Map integration for gear discovery and meetup coordination
- **Mobile Responsive**: Optimized for all device sizes

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features and optimizations
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Clsx & Tailwind Merge** - Dynamic class management

### Backend & Database
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Robust relational database
- **Zod** - Runtime type validation and schema validation

### Authentication & Payments
- **Supabase** - Authentication, user management, and file storage
- **Stripe** - Payment processing and subscription management

### Development & DevOps
- **Jest** - Unit and integration testing
- **Playwright** - End-to-end testing
- **ESLint** - Code linting and quality
- **Docker** - Containerization and deployment
- **GitHub Actions** - CI/CD pipeline (configured)

### Performance & Monitoring
- **Redis** - Caching layer (ready for implementation)
- **LRU Cache** - In-memory caching for performance
- **Security Audit Scripts** - Built-in security monitoring

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- Supabase account (for authentication)
- Stripe account (for payments)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd p2p-gear-rental
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_webhook_secret"
```

4. Set up the database:
```bash
npm run prisma:migrate
npm run prisma:generate
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js 13+ app router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── gear/              # Gear-related pages
│   └── my-rentals/        # User rental management
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions
```

## 🧪 Testing

### Available Commands
```bash
# Unit tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# End-to-end tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

### Testing Strategy
- **Unit Tests**: Components, utilities, and API routes
- **Integration Tests**: Database operations and API workflows
- **E2E Tests**: Critical user journeys and rental flows

## 🐳 Docker Development

### Quick Start with Docker
```bash
# Start development environment
npm run docker:dev

# Stop development environment
npm run docker:dev:down

# View logs
npm run docker:logs
```

### Production Deployment
```bash
# Build and start production containers
npm run docker:prod

# Stop production containers
npm run docker:prod:down
```

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

### Security
- `npm run security:audit` - Run security audit
- `npm run security:check` - Check for vulnerabilities
- `npm run security:fix` - Fix security issues

## 🔒 Security Features

- **Input Validation**: Zod schemas for all API endpoints
- **Rate Limiting**: Protection against API abuse
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **Authentication**: Secure user sessions with Supabase
- **Payment Security**: PCI-compliant Stripe integration
- **Environment Variables**: Secure configuration management

## 📊 Performance Targets

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **API Response Time**: < 300ms (95th percentile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test`
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📝 License

This project is released into the public domain. You are free to use, modify, and distribute this code without any restrictions.

## 🔗 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
