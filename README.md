# TypeScript Express API Server

A robust Node.js Express server built with TypeScript, featuring user authentication, item management, and performance testing capabilities.

## Features

- TypeScript for type safety and better developer experience
- MongoDB integration with Typegoose for type-safe models
- User authentication with secure password hashing (argon2)
- In-memory caching for improved performance
- Comprehensive performance testing with k6
- ESLint and Prettier for code quality

## Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB (local or remote instance)
- pnpm (or npm/yarn)

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Start the server
pnpm start
```

## Available Scripts

- `pnpm start`: Start the server in production mode
- `pnpm dev`: Start the server with ts-node-dev for development (auto-restart on file changes)
- `pnpm build`: Compile TypeScript to JavaScript
- `pnpm lint`: Run ESLint to check code quality
- `pnpm format`: Run Prettier to format code
- `pnpm test`: Run tests
- `pnpm test:perf`: Run performance tests with k6

## Project Structure

- `src/`: Source code
  - `controllers/`: Request handlers
  - `models/`: Typegoose models
  - `routes/`: API routes
  - `services/`: Business logic
  - `tests/`: Test files
    - `performance/`: k6 performance tests
- `dist/`: Compiled JavaScript (generated)

## API Endpoints

### Base Routes

- `GET /`: Welcome message with timestamp
- `GET /health`: Server health check with uptime information

### User Routes

- `POST /users/register`: Register a new user
  - Request body: `{ firstName, lastName, email, password }`
  - Returns: User object (without password) and success message

- `POST /users/login`: Authenticate a user
  - Request body: `{ email, password }`
  - Returns: User object (without password) and success message

### Item Routes

- `POST /items`: Create a new item
  - Request body: `{ name, price, description? }`
  - Returns: Created item object and success message

- `GET /items`: Get all items
  - Returns: Array of item objects and success message

- `GET /items/:id`: Get a specific item by ID
  - Returns: Item object and success message

## Performance Testing

The application includes k6 performance tests for API endpoints:

```bash
# Run all performance tests
pnpm test:perf

# Run a specific test
./src/tests/performance/run-single-test.sh item.js
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

### CI Workflow

The CI workflow runs on every push to main/master and on pull requests:

- Sets up Node.js with multiple versions (16.x, 18.x)
- Spins up a MongoDB service container for testing
- Installs dependencies with pnpm
- Runs linting checks
- Builds the TypeScript code
- Runs tests
- Uploads build artifacts for the deployment workflow

### CD Workflow

The CD workflow runs after a successful CI workflow on the main/master branch:

- Downloads the build artifacts from the CI workflow
- Installs production dependencies
- Deploys to Heroku
- Sends a notification on deployment status

### Environment Variables

The following environment variables are required for deployment:

- `NODE_ENV`: The environment (production, development, test)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Port for the server to listen on (provided by Heroku)

### Heroku Deployment

To deploy to Heroku, you need to set the following secrets in your GitHub repository:

- `HEROKU_API_KEY`: Your Heroku API key
- `HEROKU_APP_NAME`: Your Heroku app name
- `HEROKU_EMAIL`: Your Heroku account email
- `MONGODB_URI`: Your MongoDB connection string

## License

ISC
