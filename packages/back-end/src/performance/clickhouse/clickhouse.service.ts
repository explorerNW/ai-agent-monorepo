import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { fmt } from './tools';

interface APIMetricData {
  url?: string;
  method?: string;
  startTime?: Date | number | string;
  eventData: {
    duration?: number;
  };
  status?: number;
  size?: number;
  pageUrl?: string;
  userAgent?: string;
  timestamp?: Date | number | string;
}

interface PerformanceRecord {
  id: number;
  pageUrl: string;
  userAgent: string;
  timestamp: number;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  fid: number | null;
  ttfb: number | null;
  inp: number | null;
  navigationType: string;
  connectionInfo: string;
}

interface APIRecord {
  id: number;
  url: string;
  method: string;
  startTime: number;
  duration: number;
  status: number;
  size: number | null;
  pageUrl: string;
  userAgent: string;
  timestamp: number;
}

@Injectable()
export class ClickHouseService implements OnModuleDestroy {
  private readonly logger = new Logger(ClickHouseService.name);

  private client: ClickHouseClient;

  private readonly perfBuffer: PerformanceRecord[] = [];
  private readonly apiBuffer: APIRecord[] = [];

  private readonly PERF_BATCH_SIZE = Number(
    process.env.CH_PERF_BATCH_SIZE || 500,
  );
  private readonly API_BATCH_SIZE = Number(
    process.env.CH_API_BATCH_SIZE || 500,
  );
  private readonly FLUSH_INTERVAL_MS = Number(
    process.env.CH_FLUSH_INTERVAL_MS || 5_000,
  );

  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.client = createClient({
      url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
      database: process.env.CLICKHOUSE_DB || 'performance_db',
      request_timeout: Number(process.env.CH_REQUEST_TIMEOUT_MS || 30_000),
    });

    this.flushTimer = setInterval(() => {
      this.flushPerformanceBuffer().catch((err) =>
        this.logger.error('Flush performance buffer failed', err),
      );
      this.flushAPIBuffer().catch((err) =>
        this.logger.error('Flush API buffer failed', err),
      );
    }, this.FLUSH_INTERVAL_MS);
  }

  async onModuleInit() {
    try {
      await this.client.command({
        query: `CREATE DATABASE IF NOT EXISTS ${this.getDatabase()}`,
      });

      await this.client.command({
        query: `
          CREATE TABLE IF NOT EXISTS ${this.getDatabase()}.performance_metrics (
            id UInt64,
            pageUrl String,
            userAgent String,
            timestamp DateTime,
            fcp Nullable(Float64),
            lcp Nullable(Float64),
            cls Nullable(Float64),
            fid Nullable(Float64),
            ttfb Nullable(Float64),
            inp Nullable(Float64),
            navigationType String,
            connectionInfo String,
            received_at DateTime DEFAULT now()
          ) ENGINE = MergeTree()
          PARTITION BY toYYYYMM(timestamp)
          ORDER BY (timestamp, pageUrl)
        `,
      });

      await this.client.command({
        query: `
          CREATE TABLE IF NOT EXISTS ${this.getDatabase()}.api_metrics (
            id UInt64,
            url String,
            method String,
            startTime DateTime,
            duration Float64,
            status UInt16,
            size Nullable(UInt64),
            pageUrl String,
            userAgent String,
            timestamp DateTime,
            received_at DateTime DEFAULT now()
          ) ENGINE = MergeTree()
          PARTITION BY toYYYYMM(timestamp)
          ORDER BY (timestamp, url, method)
        `,
      });

      this.logger.log('ClickHouse database and tables initialized');
    } catch (error) {
      this.logger.error(
        'Failed to initialize ClickHouse database/tables',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  onModuleDestroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    Promise.allSettled([
      this.flushPerformanceBuffer(),
      this.flushAPIBuffer(),
    ]).catch((err) => {
      this.logger.error('Final flush failed', err);
    });
  }

  async insertPerformanceData(data: any) {
    const timestamp = this.toUnixTimestamp(data.timestamp);

    const record: PerformanceRecord = {
      id: Math.floor(Date.now() / 1000),
      pageUrl: this.sanitizeString(data.pageUrl),
      userAgent: this.sanitizeString(data.userAgent),
      timestamp,
      fcp: data.eventData?.fcp != null ? Number(data.eventData.fcp) : null,
      lcp: data.eventData?.lcp != null ? Number(data.eventData.lcp) : null,
      cls: data.eventData?.cls != null ? Number(data.eventData.cls) : null,
      fid: data.eventData?.fid != null ? Number(data.eventData.fid) : null,
      ttfb: data.eventData?.ttfb != null ? Number(data.eventData.ttfb) : null,
      inp: data.eventData?.inp != null ? Number(data.eventData.inp) : null,
      navigationType: this.sanitizeString(data.eventData?.navigationType),
      connectionInfo: JSON.stringify(data.connectionInfo || {}),
    };

    this.perfBuffer.push(record);

    if (this.perfBuffer.length >= this.PERF_BATCH_SIZE) {
      await this.flushPerformanceBuffer();
    }

    const performanceList = data.filter(
        (data) => data.eventType === 'performance',
      );
      const apiList = data.filter(
        (data) => data.eventType === 'api',
      );
      const errorList = data.filter(
        (data) => data.eventType === 'error',
      );
      const customList = data.filter(
        (data) => data.eventType === 'custom',
      );

      // 性能指标
      await Promise.all(
        performanceList.map((data) => {
          // return this.performanceService.recordPerformance(data);
        }),
      );

      // API 指标
      await Promise.all(
        apiList.map((data) => {
          // return this.performanceService.recordAPIMetric(data);
        }),
      );

      // 错误指标
      await Promise.all(
        errorList.map((data) => {
          // return this.performanceService.recordErrorMetric(data);
        }),
      );

      // 自定义指标
      await Promise.all(
        customList.map((data) => {
          // return this.performanceService.recordCustomMetric(data);
        }),
      );
  }

  async insertAPIData(data: APIMetricData) {
    const startTimeTimestamp = this.toUnixTimestamp(data.startTime);
    const timestampValue = this.toUnixTimestamp(data.timestamp);

    const record: APIRecord = {
      id: Math.floor(Date.now() / 1000),
      url: this.sanitizeString(data.url),
      method: this.sanitizeString(data.method, 10),
      startTime: startTimeTimestamp,
      duration: Number(data.eventData.duration) || 0,
      status: Number(data.status) || 0,
      size: data.size != null ? Number(data.size) : null,
      pageUrl: this.sanitizeString(data.pageUrl),
      userAgent: this.sanitizeString(data.userAgent),
      timestamp: timestampValue,
    };

    this.apiBuffer.push(record);

    if (this.apiBuffer.length >= this.API_BATCH_SIZE) {
      await this.flushAPIBuffer();
    }
  }

  async getPerformanceSummary(fromDate: Date, toDate: Date) {
    const query = `
      SELECT 
        pageUrl,
        avg(fcp) AS avg_fcp,
        avg(lcp) AS avg_lcp,
        avg(cls) AS avg_cls,
        count(*) AS total_records
      FROM ${this.getDatabase()}.performance_metrics
      WHERE timestamp >= {from: DateTime}
        AND timestamp <= {to: DateTime}
        AND fcp IS NOT NULL
        AND lcp IS NOT NULL
      GROUP BY pageUrl
      ORDER BY avg_lcp DESC
    `;

    const result = await this.client.query({
      query,
      format: 'JSONEachRow',
      query_params: {
        from: fmt(fromDate),
        to: fmt(toDate),
      },
    });

    return result.json();
  }

  async getAPISummary(fromDate: Date, toDate: Date) {
    const query = `
      SELECT 
        url,
        method,
        avg(duration) AS avg_duration,
        avg(size) AS avg_size,
        count(*) AS total_requests,
        countIf(status >= 400) AS error_count
      FROM ${this.getDatabase()}.api_metrics
      WHERE timestamp >= {from: DateTime}
        AND timestamp <= {to: DateTime}
      GROUP BY url, method
      ORDER BY avg_duration DESC
    `;

    const result = await this.client.query({
      query,
      format: 'JSONEachRow',
      query_params: {
        from: fmt(fromDate),
        to: fmt(toDate),
      },
    });

    return result.json();
  }

  private async flushPerformanceBuffer() {
    if (this.perfBuffer.length === 0) return;

    const batch = this.perfBuffer.splice(0, this.PERF_BATCH_SIZE);

    try {
      await this.client.insert({
        table: `${this.getDatabase()}.performance_metrics`,
        values: batch,
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.perfBuffer.unshift(...batch);

      this.logger.error(
        'Failed to flush performance metrics',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async flushAPIBuffer() {
    if (this.apiBuffer.length === 0) return;

    const batch = this.apiBuffer.splice(0, this.API_BATCH_SIZE);

    try {
      await this.client.insert({
        table: `${this.getDatabase()}.api_metrics`,
        values: batch,
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.apiBuffer.unshift(...batch);

      this.logger.error(
        'Failed to flush API metrics',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private getDatabase(): string {
    return process.env.CLICKHOUSE_DB || 'performance_db';
  }

  private toUnixTimestamp(value: Date | number | string | undefined): number {
    if (value instanceof Date) {
      return Math.floor(value.getTime() / 1000);
    }

    if (typeof value === 'number') {
      return value > 1e12 ? Math.floor(value / 1000) : value;
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${value}`);
      }
      return Math.floor(date.getTime() / 1000);
    }

    return Math.floor(Date.now() / 1000);
  }

  private sanitizeString(value: any, maxLength = 500): string {
    if (!value) return '';

    return String(value)
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .trim()
      .substring(0, maxLength);
  }
}