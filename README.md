# IDX Stock API

Indonesian Stock Exchange (IDX) broker activity data API with replay attack prevention.

## Features

- **Broker Activity Data**: Get broker buy/sell summaries, emitten details, and action calendars
- **Replay Attack Prevention**: X-Nonce header validation for API security
- **Clean Architecture**: Organized code structure with dependency injection
- **TypeScript**: Fully typed for better development experience
- **Bruno Collection**: Ready-to-use API requests for testing

## Installation

```bash
bun install
```

## Development

```bash
# Run with hot reload
bun --hot run src/main.ts

# Or use the npm script
bun run dev
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `8000` | No |
| `STOCKBIT_ACCESS_TOKEN` | Stockbit API access token | - | Yes* |
| `USE_MOCK` | Use mock data instead of API | `false` | No |

*Required unless `USE_MOCK=true`

## API Usage

### Request Headers

All API requests (except `/health`) MUST include the `X-Nonce` header:

```bash
# Generate a unique nonce (UUID v4)
NONCE=$(uuidgen)  # Linux/Mac
# or use any random unique string

curl http://localhost:8000/api/v1/brokers \
  -H "X-Nonce: $NONCE"
```

### Example Request

```javascript
// Using fetch with random nonce
const nonce = crypto.randomUUID();

fetch('http://localhost:8000/api/v1/brokers', {
  headers: {
    'X-Nonce': nonce
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no nonce required) |
| GET | `/api/v1/brokers` | Get all brokers |
| GET | `/api/v1/broker-action-summary` | Get broker action summary |
| GET | `/api/v1/broker-emiten-detail` | Get emitten detail |
| GET | `/api/v1/broker-action-calendar` | Get broker action calendar |
| POST | `/api/v1/config/access-token` | Set access token |
| GET | `/api/v1/config/access-token` | Get access token |
| DELETE | `/api/v1/config/access-token` | Delete access token |

### Error Responses

```json
{
  "error": "MissingNonceError",
  "message": "X-Nonce header is required"
}
```

```json
{
  "error": "DuplicateNonceError",
  "message": "Nonce already used: <nonce>"
}
```

## Testing with Bruno

1. Open Bruno app
2. Import the collection from `idx-mw-collection/`
3. Configure the collection-level pre-request script to generate nonces automatically

**Collection Pre-request Script:**
```javascript
// Generate random UUID v4 as nonce
const nonce = crypto.randomUUID();
bru.setVar("nonce", nonce);
```

Then all requests will automatically include the `X-Nonce: {{nonce}}` header.

## Project Structure

```
src/
├── application/          # Use cases (business logic)
├── domain/              # Entities and interfaces
├── infrastructure/      # External concerns (HTTP, repositories)
│   ├── http/
│   │   ├── controllers/
│   │   ├── middleware/   # Middleware (nonce, etc.)
│   │   └── routes/
│   └── storage/         # In-memory storage implementations
└── main.ts             # Entry point
```

## Security

- **Nonce Validation**: Each request requires a unique nonce (valid for 5 minutes)
- **Auto-cleanup**: Expired nonces are automatically cleaned up every 8 hours
- **Config Storage**: Access tokens stored in-memory with configurable TTL

## License

MIT
