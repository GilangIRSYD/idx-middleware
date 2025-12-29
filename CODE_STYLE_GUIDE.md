# IDX Stock API - Code Style Guide

Panduan gaya kode ini dibuat untuk memastikan konsistensi dan kemudahan pemahaman kode bagi seluruh developer tim.

## Daftar Isi

1. [Struktur Project](#struktur-project)
2. [Naming Conventions](#naming-conventions)
3. [Code Organization](#code-organization)
4. [Clean Architecture Pattern](#clean-architecture-pattern)
5. [Best Practices](#best-practices)
6. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
7. [TypeScript Guidelines](#typescript-guidelines)

---

## Struktur Project

```
src/
├── application/          # Use cases (business logic)
│   └── usecases/
│       ├── get-all-brokers.usecase.ts
│       ├── get-broker-action-summary.usecase.ts
│       └── get-broker-emiten-detail.usecase.ts
├── domain/              # Domain entities dan interfaces
│   ├── entities/
│   │   ├── broker.entity.ts
│   │   ├── emiten-summary.entity.ts
│   │   └── emiten-detail.entity.ts
│   └── repositories/
│       ├── broker.repository.interface.ts
│       └── broker-activity.repository.interface.ts
├── infrastructure/      # External concerns
│   ├── http/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── di.ts
│   │   └── server.ts
│   └── repositories/
│       ├── stockbit-broker.repository.impl.ts
│       └── stockbit-broker-activity.repository.impl.ts
├── types/               # TypeScript types (legacy, akan dihapus)
├── utils/               # Utility functions (legacy, akan dihapus)
├── services/            # External service integrations (legacy, akan dihapus)
├── routes/              # Route handlers (legacy, akan dihapus)
├── main.ts             # Main entry point (Composition Root)
└── index.ts            # Legacy entry point
```

---

## Naming Conventions

### Files

**Rule:** Gunakan **kebab-case** untuk nama file dengan suffix yang mengindikasikan jenisnya.

| Jenis | Pattern | Contoh |
|-------|---------|--------|
| Entity | `{name}.entity.ts` | `broker.entity.ts` |
| Use Case | `{action}-{resource}.usecase.ts` | `get-all-brokers.usecase.ts` |
| Repository Interface | `{resource}.repository.interface.ts` | `broker.repository.interface.ts` |
| Repository Implementation | `{source}-{resource}.repository.impl.ts` | `stockbit-broker.repository.impl.ts` |
| Controller | `{resource}.controller.ts` | `brokers.controller.ts` |
| Router | `{version}.router.ts` | `v1.router.ts` |
| DTO (inline) | `{name}DTO` | `BrokerActivityRaw` |

### Variables & Functions

**Rule:** Gunakan **camelCase** untuk variabel dan fungsi.

```typescript
// Good
const buyVolume = 1000;
const sellVolume = 500;
const netVolume = buyVolume - sellVolume;

function calculateStatus(volume: number): TradingStatus {
  if (volume > 0) return "ACCUMULATION";
  if (volume < 0) return "DISTRIBUTION";
  return "NEUTRAL";
}

// Bad - terlalu singkat/ambiguous
const b = 1000;
const s = 500;
const blot = 1000;  // singkatan yang tidak jelas
```

### Classes & Interfaces

**Rule:** Gunakan **PascalCase** untuk class dan interface.

```typescript
// Good
export class GetBrokerActionSummaryUseCase {}
export interface IBrokerActivityRepository {}
export class EmitenSummary {}

// Bad
export class getBrokerActionSummaryUseCase {}
export interface broker_activity_repository {}
```

### Constants

**Rule:** Gunakan **SCREAMING_SNAKE_CASE** untuk konstanta global.

```typescript
// Good
const DEFAULT_PAGE_SIZE = 50;
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = "https://api.example.com";

// Bad
const defaultPageSize = 50;
const page_size = 50;
```

### Private Properties

**Rule:** Gunakan **camelCase** tanpa prefix underscore untuk private property.

```typescript
// Good
export class StockbitBrokerRepository {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(config: Config) {
    this.baseUrl = config.baseUrl;
    this.accessToken = config.accessToken;
  }
}

// Bad - tidak perlu underscore
export class StockbitBrokerRepository {
  private readonly _baseUrl: string;
  private readonly _accessToken: string;
}
```

### Enum vs Union Types

**Rule:** Untuk nilai finite yang tidak berubah, gunakan **const assertion** atau **union type**.

```typescript
// Good - Union type untuk status trading
export type TradingStatus = "ACCUMULATION" | "DISTRIBUTION" | "NEUTRAL";

// Good - Const object untuk API constants
export const ApiConstants = {
  DEFAULT_PAGE_SIZE: 50,
  BROKER_PAGE_SIZE: 150,
  TRANSACTION_TYPE: "TRANSACTION_TYPE_NET",
  MARKET_BOARD: "MARKET_BOARD_ALL",
  INVESTOR_TYPE: "INVESTOR_TYPE_ALL",
} as const;

// Bad - Enum (unless you have a very good reason)
enum TradingStatus {
  ACCUMULATION = "ACCUMULATION",
  DISTRIBUTION = "DISTRIBUTION",
  NEUTRAL = "NEUTRAL",
}
```

---

## Code Organization

### Import Order

**Rule:** Susun import dalam urutan berikut:

1. External libraries (node, third-party)
2. Internal modules (dari project yang sama)
3. Type imports
4. Relative imports

```typescript
// Good
import { IBrokerActivityRepository } from "../../domain/repositories";
import { EmitenSummary } from "../../domain/entities";

import type { BrokerActivityDTO } from "./types";

// Bad - acak dan tidak terorganisir
import type { BrokerActivityDTO } from "./types";
import { EmitenSummary } from "../../domain/entities";
import { IBrokerActivityRepository } from "../../domain/repositories";
```

### Exports

**Rule:** Gunakan named exports untuk module, gunakan default export hanya untuk entry point.

```typescript
// Good - Named export
export function normalizeBrokerList(source: BrokersResponse): Broker[] {
  return source.data.map((b) => ({
    code: b.code,
    name: b.name,
    group: b.group,
  }));
}

export class BrokerController {}

// Good - Default export hanya untuk entry point
export default function main() {
  // ...
}

// Bad - Default export untuk non-entry point
export default class BrokerController {}
```

---

## Clean Architecture Pattern

### Layer Responsibilities

#### Domain Layer (Entities & Interfaces)

**Rule:** Domain layer TIDAK boleh bergantung pada layer manapun.

```typescript
// Good - domain/entities/broker.entity.ts
export class Broker {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly group: string
  ) {}

  toDTO(): BrokerDTO {
    return {
      code: this.code,
      name: this.name,
      group: this.group,
    };
  }
}

// Good - domain/repositories/broker.repository.interface.ts
export interface IBrokerRepository {
  getAll(): Promise<Broker[]>;
  getByCode(code: string): Promise<Broker | null>;
}
```

#### Application Layer (Use Cases)

**Rule:** Use case meng-orchestrate business logic tapi tidak mengetahui detail implementasi.

```typescript
// Good - application/usecases/get-all-brokers.usecase.ts
export class GetAllBrokersUseCase {
  constructor(private readonly brokerRepository: IBrokerRepository) {}

  async execute(): Promise<Broker[]> {
    return await this.brokerRepository.getAll();
  }
}
```

#### Infrastructure Layer (Repositories, Controllers, HTTP)

**Rule:** Infrastructure meng-implement interface dari domain dan meng-handle external concerns.

```typescript
// Good - infrastructure/repositories/stockbit-broker.repository.impl.ts
export class StockbitBrokerRepository implements IBrokerRepository {
  constructor(private readonly config: ApiConfig) {}

  async getAll(): Promise<Broker[]> {
    const response = await this.fetchFromApi();
    return response.data.map((dto) => new Broker(dto.code, dto.name, dto.group));
  }
}
```

### Dependency Injection

**Rule:** Gunakan constructor injection untuk dependencies. Gunakan Composition Root untuk wire semua dependencies.

```typescript
// Good - infrastructure/http/di.ts
export const brokerRepository = new StockbitBrokerRepository(apiConfig);
export const getAllBrokersUseCase = new GetAllBrokersUseCase(brokerRepository);

// Good - main.ts (Composition Root)
const server = createServer({
  port: PORT,
  v1Router,
});
```

---

## Best Practices

### 1. Jangan Hardcode Configuration

**Bad:**
```typescript
const accessToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6...";  // HUGE SECURITY RISK!
const baseUrl = "https://exodus.stockbit.com/findata-view";
const limit = 150;
```

**Good:**
```typescript
// config/constants.ts
export const ApiConstants = {
  BASE_URL: "https://exodus.stockbit.com/findata-view",
  DEFAULT_PAGE_SIZE: 50,
  BROKER_PAGE_SIZE: 150,
} as const;

// infrastructure/config/api.config.ts
export class ApiConfig {
  constructor(
    public readonly baseUrl: string = ApiConstants.BASE_URL,
    public readonly accessToken: string = process.env.STOCKBIT_ACCESS_TOKEN || "",
    public readonly useMock: boolean = process.env.USE_MOCK === "true"
  ) {}
}
```

### 2. Gunakan Factory Method untuk Entity Creation

**Bad:**
```typescript
const summary = new EmitenSummary(
  "BBCA",
  1000,
  500,
  500,  // manual calculation
  1000000,
  500000,
  500000,  // manual calculation
  "ACCUMULATION"  // manual status
);
```

**Good:**
```typescript
const summary = EmitenSummary.create(
  "BBCA",
  1000,  // buyVolume
  500,   // sellVolume
  1000000,  // buyValue
  500000    // sellValue
);
// create() akan otomatis hitung netVolume, netValue, dan status
```

### 3. Hindari Duplikasi Logic

**Bad:**
```typescript
// Di transform.ts
export function transformBrokerSummary(source: BrokerActivityResponse): EmitenSummary[] {
  const map: Record<string, EmitenSummary> = {};
  // ... 50 lines of transformation logic
}

// Di usecase.ts - HAMPIR SAMA!
private transformToSummaries(rawActivity: BrokerActivityRaw): EmitenSummary[] {
  const map: Record<string, EmitenSummary> = {};
  // ... 50 lines of NEARLY IDENTICAL logic
}
```

**Good:**
```typescript
// Buat reusable mapper di domain layer
// domain/mappers/broker-activity.mapper.ts
export class BrokerActivityMapper {
  static toEmitenSummaries(raw: BrokerActivityRaw): EmitenSummary[] {
    // Single source of truth untuk transformation logic
  }
}
```

### 4. Type Safety - Hindari `any`

**Bad:**
```typescript
private async fetchMock(path: string): Promise<any> {
  const file = await import(`../../../mock${path}.json`);
  return file.default;
}
```

**Good:**
```typescript
private async fetchMock<T>(path: string): Promise<T> {
  const file = await import(`../../../mock${path}.json`) as Promise<{ default: T }>;
  return (await file).default;
}
```

### 5. Error Handling yang Konsisten

**Bad:**
```typescript
try {
  // ...
} catch (error) {
  return Response.json({ error: "Unknown error" }, { status: 500 });
}
```

**Good:**
```typescript
// infrastructure/http/errors/app-error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
  }
}

// infrastructure/http/errors/error-handler.ts
export function handleError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  console.error("Unexpected error:", error);
  return Response.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

### 6. Validasi Input di Boundary

**Bad:**
```typescript
async execute(input: GetBrokerActionSummaryInput): Promise<BrokerActionSummaryOutput> {
  // Tidak ada validasi!
  const rawActivity = await this.brokerActivityRepository.getActivityRaw(
    input.broker,  // Bisa kosong atau invalid!
    input.from,    // Bukan tanggal yang valid!
    input.to       // Bukan tanggal yang valid!
  );
}
```

**Good:**
```typescript
async execute(input: GetBrokerActionSummaryInput): Promise<BrokerActionSummaryOutput> {
  // Validasi input
  this.validateInput(input);

  const rawActivity = await this.brokerActivityRepository.getActivityRaw(
    input.broker,
    input.from,
    input.to
  );
}

private validateInput(input: GetBrokerActionSummaryInput): void {
  if (!input.broker || input.broker.trim().length === 0) {
    throw new ValidationError("Broker code is required");
  }

  if (!this.isValidDate(input.from) || !this.isValidDate(input.to)) {
    throw new ValidationError("Invalid date format. Use YYYY-MM-DD");
  }

  if (new Date(input.from) > new Date(input.to)) {
    throw new ValidationError("'from' date must be before 'to' date");
  }
}
```

---

## Common Mistakes to Avoid

### 1. Mixing Snake Case dan Camel Case

**Bad:**
```typescript
// DTO pakai snake_case
interface EmitenSummaryDTO {
  buy_volume: number;
  sell_volume: number;
}

// Tapi entity pakai camelCase
class EmitenSummary {
  buyVolume: number;
  sellVolume: number;
}
```

**Good:**
```typescript
// DTO untuk API response (snake_case - JSON convention)
interface EmitenSummaryDTO {
  buy_volume: number;
  sell_volume: number;
}

// Entity untuk internal logic (camelCase - TypeScript convention)
class EmitenSummary {
  buyVolume: number;
  sellVolume: number;
}

// Mapping function yang jelas
toDTO(): EmitenSummaryDTO {
  return {
    buy_volume: this.buyVolume,
    sell_volume: this.sellVolume,
  };
}

static fromDTO(dto: EmitenSummaryDTO): EmitenSummary {
  return new EmitenSummary(dto.buy_volume, dto.sell_volume);
}
```

### 2. Variable Names yang Tidak Deskriptif

**Bad:**
```typescript
const b = buyList;
const s = sellList;
const blot = item.blot;  // Buy LOT? apa ini?
const bval = item.bval;  // Buy VALue? tidak jelas
```

**Good:**
```typescript
const buyList = rawActivity.broker_summary.brokers_buy;
const sellList = rawActivity.broker_summary.brokers_sell;
const buyLot = item.blot;
const buyValue = item.bval;
```

### 3. Magic Numbers

**Bad:**
```typescript
if (volume > 0) return "ACCUMULATION";
if (volume < 0) return "DISTRIBUTION";
return "NEUTRAL";

// Di tempat lain diulang lagi
if (otherVolume > 0) return "ACCUMULATION";
if (otherVolume < 0) return "DISTRIBUTION";
return "NEUTRAL";
```

**Good:**
```typescript
// domain/utils/trading-status.util.ts
export class TradingStatusCalculator {
  static calculate(volume: number): TradingStatus {
    if (volume > 0) return "ACCUMULATION";
    if (volume < 0) return "DISTRIBUTION";
    return "NEUTRAL";
  }
}

// Dipakai di mana-mana
const status = TradingStatusCalculator.calculate(volume);
```

### 4. Mengabaikan Entity dan Langsung Pakai DTO

**Bad:**
```typescript
// Controller langsung return DTO dari repository
async getAllBrokers(): Promise<Response> {
  const data = await this.repository.fetchBrokers();
  return Response.json({ data: data.data });  // Raw API response!
}
```

**Good:**
```typescript
// Repository return Entity
async getAllBrokers(): Promise<Response> {
  const brokers = await this.useCase.execute();  // Returns Broker[] entities
  return Response.json({
    data: brokers.map(b => b.toDTO()),  // Explicit transformation
  });
}
```

### 5. Duplikasi Kode di Berbagai Tempat

**Bad:**
```typescript
// Di tiga tempat berbeda, ada kode yang sama:
const buyVolume = Number(item.blot);
const sellVolume = Math.abs(Number(item.slot));
const buyValue = Number(item.bval);
const sellValue = Math.abs(Number(item.sval));
```

**Good:**
```typescript
// domain/value-objects/broker-transaction.vo.ts
export class BrokerTransaction {
  readonly buyVolume: number;
  readonly sellVolume: number;
  readonly buyValue: number;
  readonly sellValue: number;

  static fromAPI(dto: BrokerBuyItem | BrokerSellItem): BrokerTransaction {
    if ('blot' in dto) {
      return new BrokerTransaction(
        Number(dto.blot),
        0,
        Number(dto.bval),
        0
      );
    } else {
      return new BrokerTransaction(
        0,
        Math.abs(Number(dto.slot)),
        0,
        Math.abs(Number(dto.sval))
      );
    }
  }
}
```

---

## TypeScript Guidelines

### Type Imports

**Rule:** Gunakan `type` keyword untuk type-only imports.

```typescript
// Good
import type { Broker } from "../entities";
import { EmitenSummary } from "../entities";  // class/value import

// Bad
import { Broker } from "../entities";  // Ini type, harus pakai 'type' keyword
```

### Avoid Optional Returns

**Bad:**
```typescript
async getBroker(code: string): Promise<Broker | undefined> {
  return brokers.find(b => b.code === code);
}
```

**Good:**
```typescript
async getBroker(code: string): Promise<Broker | null> {
  return brokers.find(b => b.code === code) ?? null;
}
```

### Use Readonly untuk Immutability

**Good:**
```typescript
export class Broker {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly group: string
  ) {}
}

// Untuk array/object yang tidak boleh diubah
function processBrokers(brokers: readonly Broker[]): void {
  // Compiler akan error jika mencoba brokers.push()
}
```

### Discriminated Unions untuk Error Handling

**Good:**
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async getBroker(code: string): Promise<Result<Broker>> {
  try {
    const broker = await this.findByCode(code);
    return { success: true, data: broker };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Usage
const result = await getBroker("BBCA");
if (result.success) {
  console.log(result.data.name);  // Type-safe!
} else {
  console.error(result.error.message);
}
```

---

## Quick Reference Checklist

Sebelum commit code, pastikan:

- [ ] Nama file mengikuti convention (kebab-case dengan suffix)
- [ ] Variable/Function menggunakan camelCase yang deskriptif
- [ ] Class/Interface menggunakan PascalCase
- [ ] Constants menggunakan SCREAMING_SNAKE_CASE
- [ ] Tidak ada hardcoded credentials atau magic numbers
- [ ] Tidak ada penggunaan `any` tanpa alasan yang jelas
- [ ] Error handling konsisten
- [ ] Input validation di boundary
- [ ] Entity menggunakan factory method `create()`
- [ ] Tidak ada duplikasi logic
- [ ] Import terorganisir
- [ ] Type-only imports menggunakan `type` keyword
- [ ] Comments untuk complex logic (jika perlu)
