// Storage service types and interfaces

export interface StorageError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

