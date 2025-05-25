# GitHub Copilot Instructions for Indian Mutual Fund AMC Simulation

## Project Overview

This is a comprehensive Indian Mutual Fund Asset Management Company (AMC) simulation system built with Node.js, PostgreSQL, TimescaleDB, and Redis. The system simulates realistic mutual fund operations including customer onboarding, folio management, transaction processing, and CAMS integration.

## Key Technologies

- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL with TimescaleDB extension for time-series data
- **Cache**: Redis for high-performance caching
- **Infrastructure**: Docker and Docker Compose
- **Validation**: Express Validator for API validation
- **Logging**: Winston for structured logging
- **Scheduling**: Node-cron for automated tasks

## Architecture

### Core Components

1. **Models**: Data access layer with PostgreSQL integration
   - Customer, Folio, Transaction, SIP, Scheme models
   - TimescaleDB hypertables for time-series data
   - Business logic for Indian MF operations

2. **Controllers**: API endpoint handlers
   - RESTful API design with proper error handling
   - Validation and authentication middleware
   - Standardized response format

3. **Services**: Business logic layer
   - SimulationService: Core simulation engine
   - Automated customer/folio/transaction creation
   - CAMS processing simulation

4. **Jobs**: Scheduled background tasks
   - NAV updates, SIP execution, data maintenance
   - Portfolio reconciliation and auditing

### Indian MF Specific Features

- **PAN Validation**: Realistic Indian PAN number generation
- **CAMS Integration**: Simulated CAMS processing workflow
- **Regulatory Compliance**: KYC status, transaction limits
- **Indian Names**: Realistic Indian customer names and addresses
- **Mobile Numbers**: Valid Indian mobile number patterns
- **Fund Categories**: Equity, Debt, Hybrid, ELSS with sub-categories

## Coding Standards

### File Structure
```
src/
├── config/          # Database, Redis, app configuration
├── controllers/     # API endpoint handlers
├── middleware/      # Authentication, validation, error handling
├── models/          # Data models with business logic
├── routes/          # API route definitions
├── services/        # Business logic services
├── jobs/            # Scheduled background jobs
└── utils/           # Helper functions and utilities
```

### Database Patterns

- Use parameterized queries to prevent SQL injection
- Implement proper connection pooling
- Use TimescaleDB for time-series data (transactions, NAV history)
- Implement proper indexing for performance
- Use transactions for data consistency

### API Design

- Follow RESTful conventions
- Use proper HTTP status codes
- Implement pagination for list endpoints
- Include validation middleware
- Return consistent JSON response format:
  ```json
  {
    "success": true,
    "data": {},
    "pagination": {},
    "error": ""
  }
  ```

### Error Handling

- Use async/await with try-catch blocks
- Implement centralized error handling middleware
- Log errors with context information
- Return user-friendly error messages
- Handle database constraint violations gracefully

### Validation

- Use express-validator for input validation
- Validate UUIDs, PAN numbers, phone numbers
- Implement business rule validation
- Sanitize user inputs

## Simulation Features

### Customer Creation
- Generate realistic Indian names (Hindi and English)
- Create valid PAN numbers with proper format
- Generate Indian mobile numbers (10 digits starting with 6-9)
- Assign random addresses from Indian cities
- Set appropriate KYC status and risk profiles

### Folio Management
- Link customers to mutual fund schemes
- Enforce maximum 100 folios per customer
- Track holdings with unit calculations
- Maintain folio status (Active, Suspended, Closed)

### Transaction Processing
- Support all transaction types: Purchase, Redemption, Switch, SIP, STP
- Implement CAMS processing simulation with realistic success/failure rates
- Calculate units based on NAV and amount
- Update holdings automatically
- Maintain transaction status workflow

### NAV Simulation
- Generate realistic NAV movements
- Consider market hours and holidays
- Implement different volatility for scheme categories
- Store NAV history in TimescaleDB

## Development Guidelines

### When Adding New Features

1. **Models First**: Create or update data models with proper validation
2. **Controllers**: Add API controllers with proper error handling
3. **Routes**: Define routes with validation middleware
4. **Tests**: Write unit and integration tests
5. **Documentation**: Update API documentation

### Database Changes

1. Update `docker/init.sql` for schema changes
2. Consider migration scripts for existing data
3. Update TimescaleDB hypertables if needed
4. Add appropriate indexes for performance

### API Endpoints

- Use middleware for authentication where needed
- Implement proper pagination (page, limit parameters)
- Add filtering and search capabilities
- Include statistics and metrics endpoints

### Simulation Logic

- Make intervals configurable via environment variables
- Implement realistic business rules (minimum amounts, frequencies)
- Add proper error handling for failed operations
- Log simulation activities for monitoring

## Common Patterns

### Database Queries
```javascript
// Use connection pool
const db = require('../config/database');

// Parameterized queries
const result = await db.query(
  'SELECT * FROM customers WHERE pan = $1',
  [panNumber]
);
```

### API Controllers
```javascript
async createResource(req, res, next) {
  try {
    const resource = await Model.create(req.body);
    logger.info(`Resource created: ${resource.id}`);
    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error) {
    next(error);
  }
}
```

### Validation Middleware
```javascript
const validation = [
  body('field').notEmpty().withMessage('Field is required'),
  handleValidationErrors
];
```

## Testing

- Write unit tests for models and services
- Create integration tests for API endpoints
- Use realistic test data for Indian MF scenarios
- Mock external dependencies (Redis, database)

## Performance Considerations

- Use Redis caching for frequently accessed data
- Implement database connection pooling
- Use TimescaleDB compression for historical data
- Add appropriate database indexes
- Monitor query performance

## Security

- Validate all inputs
- Use parameterized queries
- Implement rate limiting for APIs
- Secure sensitive configuration
- Use HTTPS in production

## Monitoring

- Log all important operations
- Track simulation metrics
- Monitor database performance
- Set up health check endpoints
- Implement graceful shutdown

## Indian Financial Context

When working on this project, consider:
- Indian mutual fund regulations and categories
- AMFI (Association of Mutual Funds in India) standards
- CAMS (Computer Age Management Services) processing
- Indian market timings and holidays
- Rupee-based calculations and formatting
- PAN and KYC requirements
- SIP and STP frequencies common in India

This simulation aims to provide a realistic representation of Indian mutual fund operations while maintaining educational and testing value.
