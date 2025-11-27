# Demo API - Local Development

## Running Locally

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Health Checks
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Application Endpoints
- `GET /` - Welcome message
- `GET /api/info` - Application information
- `GET /api/data` - Sample data

## Environment Variables

- `PORT` - Server port (default: 8080)
- `ENVIRONMENT` - Environment name (dev/staging/prod)
- `LOG_LEVEL` - Logging level (default: info)

## Testing

```bash
# Test health endpoint
curl http://localhost:8080/health/ready

# Test API
curl http://localhost:8080/api/info
```

## Docker

### Build
```bash
docker build -t demo-api:local ..
```

### Run
```bash
docker run -p 8080:8080 -e ENVIRONMENT=local demo-api:local
```
