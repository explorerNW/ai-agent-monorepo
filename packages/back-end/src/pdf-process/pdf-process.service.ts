import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fromPath } from 'pdf2pic';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';
import { TesseractService, WorkerPool } from '../tesseract/tesseract.service';

const execAsync = promisify(exec);

@Injectable()
export class PDFProcessService {
  private readonly logger = new Logger(PDFProcessService.name);

  constructor(
    private readonly parallelTaskService: ParallelTaskService,
    private readonly tesseractService: TesseractService,
  ) {}

  /**
   * 1. 压缩 PDF
   * 使用 Ghostscript 进行有损压缩（推荐用于大幅减小体积）
   * @param inputPath 原始文件路径
   * @param outputPath 输出文件路径
   * @param quality 压缩等级: 'screen' (72dpi, 最小), 'ebook' (150dpi, 推荐), 'printer' (300dpi)
   */
  async compressPDF(
    inputPath: string,
    outputPath: string,
    quality: 'screen' | 'ebook' | 'printer' = 'ebook',
  ): Promise<void> {
    // Ghostscript 命令参数说明
    // -dPDFSETTINGS=/ebook 设置压缩策略
    // -dCompatibilityLevel=1.4 保证兼容性
    const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${quality} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
    try {
      await execAsync(command);
      this.logger.log(`✅ PDF 压缩完成: ${outputPath}`);
    } catch (error) {
      this.logger.error('❌ Ghostscript 压缩失败:', error);
      throw new Error('PDF 压缩失败，请确保服务器已安装 Ghostscript');
    }
  }

  /**
   * 2. OCR 识别（Worker池优化版本）
   * 将 PDF 转为图片并进行文字识别，利用多核并行处理和Worker池复用
   * @param pdfPath PDF 文件路径
   * @param concurrency 并发处理的页面数（默认使用CPU核心数的75%）
   * @returns 识别出的文本内容
   */
  async ocrPDF(pdfPath: string, concurrency?: number): Promise<string> {
    // 创建临时目录（使用绝对路径）
    const tempDir = path.join(process.cwd(), 'temp_ocr');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 配置 pdf2pic：将 PDF 每一页转为图片
    // density: 200 (DPI越高识别越准，但速度越慢；200是性能和质量的平衡点)
    // width/height: 保持宽高比的同时确保足够分辨率
    const storeAsImage = fromPath(pdfPath, {
      density: 200,
      savePath: tempDir,
      format: 'png',
      width: 1103, // A4纸在200dpi下的宽度（约）
      height: 1559, // A4纸在200dpi下的高度（约）
      preserveAspectRatio: true,
    });

    let workerPool: WorkerPool | null = null;

    try {
      // 获取页数并转换所有页
      const pages = await storeAsImage.bulk(-1); // -1 表示转换所有页

      if (pages.length === 0) {
        this.logger.warn('⚠️ PDF 没有可识别的页面');
        return '';
      }

      this.logger.log(`📄 开始处理 ${pages.length} 页 PDF...`);

      // 计算最佳并发数
      const optimalConcurrency =
        concurrency ||
        this.parallelTaskService.calculateOptimalConcurrency(pages.length);
      this.logger.log(
        `🔧 使用 ${optimalConcurrency} 个并发任务 (CPU: ${this.parallelTaskService.getCPUCores()} 核)`,
      );

      // 使用 TesseractService 创建 Worker 池
      workerPool = await this.tesseractService.createWorkerPool({
        concurrency: optimalConcurrency,
        lang: 'eng+chi_sim',
        enableLogging: true,
      });

      const { scheduler } = workerPool;

      // 使用 ParallelTaskService 并行处理所有页面
      const tasks = pages.map((page, index) => {
        const pageNumber = index + 1;

        return async () => {
          // 使用 TesseractService 识别单页
          return await this.tesseractService.recognizePage(
            scheduler,
            page.path,
            pageNumber,
          );
        };
      });

      // 使用 ParallelTaskService 执行并行任务
      const executionResult =
        await this.parallelTaskService.executeWithProgress<{
          pageNumber: number;
          text: string;
        }>(
          tasks,
          (completed, total) => {
            if (completed === 1) {
              this.logger.log(`🚀 OCR 处理开始...`);
            }
            if (completed === total) {
              this.logger.log('✅ OCR 处理完成');
            }
          },
          {
            concurrency: optimalConcurrency,
            continueOnError: true,
          },
        );

      // 按页码排序并合并结果
      const allResults = executionResult.results
        .filter((r) => r.result)
        .map((r) => r.result!)
        .sort((a, b) => a.pageNumber - b.pageNumber);

      const fullText = allResults
        .map((r) => r.text)
        .join('')
        .trim();

      this.logger.log(
        `✅ OCR 处理完成: 总计 ${executionResult.summary.total} 页, ` +
          `成功 ${executionResult.summary.succeeded}, ` +
          `失败 ${executionResult.summary.failed}, ` +
          `耗时 ${executionResult.totalDuration}ms`,
      );

      return fullText;
    } catch (error) {
      this.logger.error('❌ OCR 识别失败:', error);
      throw new Error('OCR 识别过程出错');
    } finally {
      // 清理 Worker 池资源
      if (workerPool) {
        await this.tesseractService.cleanupResources(workerPool);
      }

      // 清理临时目录
      try {
        if (fs.existsSync(tempDir)) {
          const files = fs.readdirSync(tempDir);
          for (const file of files) {
            const filePath = path.join(tempDir, file);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
          fs.rmdirSync(tempDir);
          this.logger.log('🧹 临时目录已清理');
        }
      } catch (cleanupError) {
        this.logger.warn('⚠️ 清理临时目录失败:', cleanupError);
      }
    }
  }
}
