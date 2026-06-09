import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'idempotent';
export const Idempotent = (seconds: number = 5) =>
  SetMetadata(IDEMPOTENT_KEY, seconds);
