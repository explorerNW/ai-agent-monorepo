import { Injectable, Logger } from '@nestjs/common';
import { promisify } from 'util';
import * as fs from 'fs';
import Tesseract, { Scheduler, Worker, RecognizeResult } from 'tesseract.js';

const unlinkAsync = promisify(fs.unlink);
const accessAsync = promisify(fs.access);
const logger = new Logger('TesseractService');

/**
 * Tesseract OCR 识别结果
 */
export interface TesseractOCRResult {
  pageNumber: number;
  text: string;
}

/**
 * Worker池配置选项
 */
export interface WorkerPoolOptions {
  /** 并发Worker数量 */
  concurrency: number;
  /** 语言配置，默认 'eng+chi_sim' */
  lang?: string;
  /** 是否启用详细日志 */
  enableLogging?: boolean;
}

/**
 * Worker池实例
 */
export interface WorkerPool {
  scheduler: Scheduler;
  workers: Worker[];
}

/**
 * Tesseract服务 - 提供通用的OCR功能
 */
@Injectable()
export class TesseractService {
  /**
   * 创建 Tesseract Worker 池
   * @param options Worker池配置选项
   * @returns Scheduler 和 Worker数组
   */
  async createWorkerPool(options: WorkerPoolOptions): Promise<WorkerPool> {
    const { concurrency, lang = 'eng+chi_sim', enableLogging = true } = options;

    logger.log(`🔨 创建 Tesseract Worker 池 (并发数: ${concurrency})...`);

    const scheduler = Tesseract.createScheduler();
    const workers: Worker[] = [];

    for (let i = 0; i < concurrency; i++) {
      const worker = await Tesseract.createWorker(lang, undefined, {
        logger: enableLogging
          ? (m) => {
              if (m.status === 'loading tesseract core') {
                logger.debug(`[Worker ${i}] 加载 Tesseract 核心...`);
              } else if (m.status === 'initializing api') {
                logger.debug(`[Worker ${i}] 初始化 API...`);
              } else if (m.status === 'recognizing text' && m.progress) {
                logger.debug(
                  `[Worker ${i}] 识别进度: ${(m.progress * 100).toFixed(1)}%`,
                );
              }
            }
          : undefined,
      });

      workers.push(worker);
      scheduler.addWorker(worker);
    }

    logger.log(`✅ Worker 池创建完成 (${workers.length} 个 Worker)`);

    return { scheduler, workers };
  }

  /**
   * 使用 Scheduler 识别单页图片
   * @param scheduler Tesseract Scheduler 实例
   * @param imagePath 图片文件路径
   * @param pageNumber 页码
   * @returns OCR 识别结果
   */
  async recognizePage(
    scheduler: Scheduler,
    imagePath: string | undefined,
    pageNumber: number,
  ): Promise<TesseractOCRResult> {
    // 检查文件是否存在
    if (!imagePath) {
      logger.warn(`⚠️ 跳过不存在的页面文件: ${imagePath}`);
      return { pageNumber, text: '' };
    }

    // 检查文件是否存在 (异步)
    try {
      await accessAsync(imagePath, fs.constants.F_OK);
    } catch {
      logger.warn(`⚠️ 文件不存在：${imagePath}`);
      return { pageNumber, text: '' };
    }

    try {
      // 通过 Scheduler 调度任务（自动分配到空闲 Worker）
      const result: RecognizeResult = await scheduler.addJob(
        'recognize',
        imagePath,
      );

      // 异步删除文件
      try {
        await unlinkAsync(imagePath);
      } catch (unlinkError) {
        logger.warn(`⚠️ 无法删除临时文件 ${imagePath}:`, unlinkError);
      }

      const text = `\n--- 第 ${pageNumber} 页 ---\n${result.data.text}`;

      // 验证识别结果
      if (!result.data.text || result.data.text.trim().length === 0) {
        logger.warn(`⚠️ 第 ${pageNumber} 页未识别到文字`);
      }

      return { pageNumber, text };
    } catch (error) {
      logger.error(`❌ 第 ${pageNumber} 页 OCR 识别失败:`, error);
      return { pageNumber, text: '' };
    }
  }

  /**
   * 清理 Tesseract 资源
   * @param pool Worker池实例
   */
  async cleanupResources(pool: WorkerPool): Promise<void> {
    const { scheduler, workers } = pool;

    // 清理 Worker 池
    try {
      if (scheduler) {
        await scheduler.terminate();
        logger.log('🧹 Scheduler 已终止');
      }

      // 确保所有 Worker 都被正确终止
      if (workers.length > 0) {
        await Promise.all(
          workers.map(async (worker) => {
            try {
              await worker.terminate();
            } catch {
              // Worker 可能已经被 scheduler.terminate() 终止
            }
          }),
        );
        logger.log(`🧹 ${workers.length} 个 Worker 已终止`);
      }
    } catch (cleanupError) {
      logger.warn('⚠️ 清理 Worker 池失败:', cleanupError);
    }
  }
}
