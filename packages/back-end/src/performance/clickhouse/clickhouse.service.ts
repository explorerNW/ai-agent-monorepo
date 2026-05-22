import { Injectable } from '@nestjs/common';
import { createClient } from '@clickhouse/client';

// Type definitions for API metrics data
interface APIMetricData {
  url?: string;
  method?: string;
  startTime?: Date | number | string;
  duration?: number;
  status?: number;
  size?: number;
  pageUrl?: string;
  userAgent?: string;
  timestamp?: Date | number | string;
}

@Injectable()
export class ClickHouseService {
  private client = createClient({
    host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: process.env.CLICKHOUSE_DB || 'performance_db',
  });

  async onModuleInit() {
    // 创建数据库
    await this.client.command({
      query: `CREATE DATABASE IF NOT EXISTS ${process.env.CLICKHOUSE_DB || 'performance_db'}`,
    });

    // 创建性能数据表
    await this.client.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${process.env.CLICKHOUSE_DB || 'performance_db'}.performance_metrics (
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

    // 创建 API 性能数据表
    await this.client.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${process.env.CLICKHOUSE_DB || 'performance_db'}.api_metrics (
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
        ORDER BY (timestamp, url)
      `,
    });
  }

  /**
   * Converts various date/time formats to Unix timestamp (seconds)
   */
  private toUnixTimestamp(value: Date | number | string | undefined): number {
    if (value instanceof Date) {
      return Math.floor(value.getTime() / 1000);
    }

    if (typeof value === 'number') {
      // Assume milliseconds if > 1e12, otherwise seconds
      return value > 1e12 ? Math.floor(value / 1000) : value;
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${value}`);
      }
      return Math.floor(date.getTime() / 1000);
    }

    // Default to current time
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Sanitizes string fields to prevent JSON parsing issues
   * Removes control characters, newlines, and other problematic characters
   */
  private sanitizeString(value: any, maxLength = 500): string {
    if (!value) return '';

    const str = String(value);
    return str
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ' ') // Remove non-printable chars
      .replace(/[\r\n\t]/g, ' ') // Remove newlines and tabs
      .trim()
      .substring(0, maxLength); // Prevent excessively long strings
  }

  async insertPerformanceData(data: any) {
    // Ensure timestamp is properly formatted as ISO 8601 string
    let timestamp: string;
    if (data.timestamp instanceof Date) {
      timestamp = data.timestamp.toISOString();
    } else if (typeof data.timestamp === 'number') {
      // Numeric timestamp - convert to Date then to ISO string
      const dateObj = new Date(data.timestamp);
      if (isNaN(dateObj.getTime())) {
        timestamp = new Date().toISOString();
      } else {
        timestamp = dateObj.toISOString();
      }
    } else if (typeof data.timestamp === 'string') {
      // Already a string - validate it's a valid date
      const dateObj = new Date(data.timestamp);
      if (isNaN(dateObj.getTime())) {
        console.warn(
          `[ClickHouse] Invalid string timestamp: ${data.timestamp}, using current time`,
        );
        timestamp = new Date().toISOString();
      } else {
        timestamp = dateObj.toISOString();
      }
    } else {
      console.warn('[ClickHouse] Missing timestamp, using current time');
      timestamp = new Date().toISOString();
    }

    // Sanitize string fields to prevent JSON parsing issues
    const sanitizeString = (str: any) =>
      str
        ? String(str)
            .replace(/[\r\n\t]/g, ' ')
            .trim()
        : '';

    const sanitizedPageUrl = sanitizeString(data.pageUrl);
    const sanitizedUserAgent = sanitizeString(data.userAgent);
    const sanitizedNavigationType = sanitizeString(data.navigationType);
    const sanitizedConnectionInfo = JSON.stringify(data.connectionInfo || {});

    // Prepare the record with proper typing and sanitization
    const record = {
      id: Math.floor(Date.now() / 1000),
      pageUrl: sanitizedPageUrl,
      userAgent: sanitizedUserAgent,
      timestamp: timestamp,
      fcp: data.fcp != null ? Number(data.fcp) : null,
      lcp: data.lcp != null ? Number(data.lcp) : null,
      cls: data.cls != null ? Number(data.cls) : null,
      fid: data.fid != null ? Number(data.fid) : null,
      ttfb: data.ttfb != null ? Number(data.ttfb) : null,
      inp: data.inp != null ? Number(data.inp) : null,
      navigationType: sanitizedNavigationType,
      connectionInfo: sanitizedConnectionInfo,
    };

    try {
      await this.client.insert({
        table: `${process.env.CLICKHOUSE_DB || 'performance_db'}.performance_metrics`,
        values: [record],
        format: 'JSONEachRow',
      });
      console.log('[ClickHouse] ✅ Successfully inserted performance metric');
    } catch (error) {
      console.error('[ClickHouse] ❌ Performance insert failed!');
      console.error('[ClickHouse] Failed record JSON:', JSON.stringify(record));
      console.error('[ClickHouse] Error details:', error);
      throw error;
    }
  }

  async insertAPIData(data: APIMetricData) {
    try {
      // Convert and validate datetime fields
      const startTimeTimestamp = this.toUnixTimestamp(data.startTime);
      const timestampValue = this.toUnixTimestamp(data.timestamp);

      // Sanitize string fields
      const record = {
        id: Math.floor(Date.now() / 1000),
        url: this.sanitizeString(data.url),
        method: this.sanitizeString(data.method, 10),
        startTime: startTimeTimestamp,
        duration: Number(data.duration) || 0,
        status: Number(data.status) || 0,
        size: data.size != null ? Number(data.size) : null,
        pageUrl: this.sanitizeString(data.pageUrl),
        userAgent: this.sanitizeString(data.userAgent),
        timestamp: timestampValue,
      };

      // Insert into ClickHouse
      await this.client.insert({
        table: `${process.env.CLICKHOUSE_DB || 'performance_db'}.api_metrics`,
        values: [record],
        format: 'JSONEachRow',
        clickhouse_settings: {
          input_format_json_read_bools_as_strings: 0,
          output_format_json_quote_64bit_integers: 0,
        },
      });

      console.log('[ClickHouse] ✅ Successfully inserted API metric');
    } catch (error) {
      console.error(
        '[ClickHouse] ❌ Failed to insert API metric:',
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        '[ClickHouse] Data received:',
        JSON.stringify(data).substring(0, 500),
      );
      throw error;
    }
  }

  async getPerformanceSummary(fromDate: Date, toDate: Date) {
    const query = `
      SELECT 
        pageUrl,
        avg(fcp) as avg_fcp,
        avg(lcp) as avg_lcp,
        avg(cls) as avg_cls,
        count(*) as total_records
      FROM ${process.env.CLICKHOUSE_DB || 'performance_db'}.performance_metrics
      WHERE timestamp >= {from: DateTime} AND timestamp <= {to: DateTime}
        AND fcp IS NOT NULL
        AND lcp IS NOT NULL
      GROUP BY pageUrl
      ORDER BY avg_lcp DESC
    `;

    return await this.client
      .query({
        query,
        format: 'JSONEachRow',
        query_params: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
      })
      .then((res) => res.json());
  }

  async getAPISummary(fromDate: Date, toDate: Date) {
    const query = `
      SELECT 
        url,
        method,
        avg(duration) as avg_duration,
        avg(size) as avg_size,
        count(*) as total_requests,
        countIf(status >= 400) as error_count
      FROM ${process.env.CLICKHOUSE_DB || 'performance_db'}.api_metrics
      WHERE timestamp >= {from: DateTime} AND timestamp <= {to: DateTime}
      GROUP BY url, method
      ORDER BY avg_duration DESC
    `;

    return await this.client
      .query({
        query,
        format: 'JSONEachRow',
        query_params: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
      })
      .then((res) => res.json());
  }
}
