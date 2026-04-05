# FloatFlow Frontend

Welcome to the frontend of FloatFlow, the digital solution for managing branch-level liquidity.

Managing petty cash across multiple locations is usually a nightmare of paper trails and messy spreadsheets. FloatFlow digitizes that entire process—from initial float allocation to real-time expense tracking—giving multi-branch organizations a single source of truth for their cash flow.

## Getting Started

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository:

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```

## Tech Stack

- **Vite + React** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **Tailwind CSS + shadcn/ui** - Utility-first CSS framework and Component library
- **Lucid React** - For clean, consistent iconography throughout the app.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run build:staging` - Build for staging
- `npm run build:prod` - Build for production
- `npm run build:analyze` - Build and analyze bundle size
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Environment Configuration

The application supports multiple environments:

- **Development**: `.env.development`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

Environment variables:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_ENVIRONMENT` - Current environment
- `VITE_SENTRY_DSN` - Sentry DSN for error tracking

## Deployment

### Docker Deployment

1. Build the Docker image:
   ```sh
   docker build -t floatflow-frontend .
   ```

2. Run the container:
   ```sh
   docker run -p 80:80 floatflow-frontend
   ```

### Manual Deployment

1. Build the application:
   ```sh
   npm run build:prod
   ```

2. Serve the `dist` folder with any static file server

### Environment Setup

1. Copy the appropriate `.env` file for your environment
2. Update the `VITE_SENTRY_DSN` with your actual Sentry project DSN
3. Configure the `VITE_API_BASE_URL` to point to your backend

## Monitoring

The application includes Sentry integration for error tracking and performance monitoring:

- **Error Tracking**: Automatic error capture with user context
- **Performance Monitoring**: Page load and API call tracking
- **Session Replay**: User session recording for debugging

Monitoring is automatically disabled in development and enabled in staging/production.


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
