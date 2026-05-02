import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fromPath } from 'pdf2pic';
import Tesseract, { Scheduler, Worker } from 'tesseract.js';

const execAsync = promisify(exec);

@Injectable()
export class PDFProcessService {
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
      console.log(`✅ PDF 压缩完成: ${outputPath}`);
    } catch (error) {
      console.error('❌ Ghostscript 压缩失败:', error);
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
    // density: 300 (DPI越高识别越准，但速度越慢)
    // width/height: 保持宽高比的同时确保足够分辨率
    const storeAsImage = fromPath(pdfPath, {
      density: 300,
      savePath: tempDir,
      format: 'png',
      width: 1654, // A4纸在300dpi下的宽度（约）
      height: 2339, // A4纸在300dpi下的高度（约）
      preserveAspectRatio: true,
    });

    let scheduler: Scheduler | null = null;
    const workers: Worker[] = [];

    try {
      // 获取页数并转换所有页
      const pages = await storeAsImage.bulk(-1); // -1 表示转换所有页

      if (pages.length === 0) {
        console.warn('⚠️ PDF 没有可识别的页面');
        return '';
      }

      console.log(`📄 开始处理 ${pages.length} 页 PDF...`);

      // 计算最佳并发数：使用CPU核心数的75%，但不超过页面数
      const cpuCount = os.cpus().length;
      const optimalConcurrency =
        concurrency ||
        Math.max(1, Math.min(Math.floor(cpuCount * 0.75), pages.length));
      console.log(
        `🔧 使用 ${optimalConcurrency} 个并发任务 (CPU: ${cpuCount} 核)`,
      );

      // 创建 Worker 池
      console.log('🔨 创建 Tesseract Worker 池...');
      scheduler = Tesseract.createScheduler();

      // 创建固定数量的 Worker，添加详细配置和日志
      for (let i = 0; i < optimalConcurrency; i++) {
        const worker = await Tesseract.createWorker(
          'eng+chi_sim',
          undefined, // oem - use default
          {
            // logger: (m: Tesseract.LoggerMessage) => {
            //   if (m.status === 'loading tesseract core') {
            //     console.log(`[Worker ${i}] 加载 Tesseract 核心...`);
            //   } else if (m.status === 'initializing api') {
            //     console.log(`[Worker ${i}] 初始化 API...`);
            //   } else if (m.status === 'recognizing text') {
            //     console.log(
            //       `[Worker ${i}] 识别进度: ${(m.progress * 100).toFixed(1)}%`,
            //     );
            //   }
            // },
          },
        );

        workers.push(worker);
        scheduler.addWorker(worker);
      }

      console.log(`✅ Worker 池创建完成 (${workers.length} 个 Worker)`);

      // 使用 Scheduler 并行处理所有页面
      // 为每个页面分配任务到 Scheduler
      const promises = pages.map(async (page, index) => {
        const pageNumber = index + 1;

        if (!page.path || !fs.existsSync(page.path)) {
          console.warn(`⚠️ 跳过不存在的页面文件: ${page.path}`);
          return { pageNumber, text: '' };
        }

        try {
          // 通过 Scheduler 调度任务（自动分配到空闲 Worker）
          const ret = await scheduler!.addJob('recognize', page.path);

          // 删除临时图片文件
          try {
            if (fs.existsSync(page.path)) {
              fs.unlinkSync(page.path);
            }
          } catch (unlinkError) {
            console.warn(`⚠️ 无法删除临时文件 ${page.path}:`, unlinkError);
          }

          const text = `\n--- 第 ${pageNumber} 页 ---\n${ret.data.text}`;

          // 验证识别结果
          if (!ret.data.text || ret.data.text.trim().length === 0) {
            console.warn(`⚠️ 第 ${pageNumber} 页未识别到文字`);
          } else {
            console.log(
              `✓ 第 ${pageNumber} 页识别完成 (${ret.data.text.length} 字符)`,
            );
          }

          return { pageNumber, text };
        } catch (ocrError) {
          console.error(`❌ 第 ${pageNumber} 页 OCR 识别失败:`, ocrError);
          return { pageNumber, text: '' };
        }
      });

      // 等待所有任务完成
      const allResults = await Promise.all(promises);

      // 按页码排序并合并结果
      allResults.sort((a, b) => a.pageNumber - b.pageNumber);
      const fullText = allResults
        .map((r) => r.text)
        .join('')
        .trim();

      console.log(`✅ OCR 处理完成，共 ${pages.length} 页`);
      return fullText;
    } catch (error) {
      console.error('❌ OCR 识别失败:', error);
      throw new Error('OCR 识别过程出错');
    } finally {
      // 清理 Worker 池
      try {
        if (scheduler) {
          await scheduler.terminate();
          console.log('🧹 Scheduler 已终止');
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
          console.log(`🧹 ${workers.length} 个 Worker 已终止`);
        }
      } catch (cleanupError) {
        console.warn('⚠️ 清理 Worker 池失败:', cleanupError);
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
          console.log('🧹 临时目录已清理');
        }
      } catch (cleanupError) {
        console.warn('⚠️ 清理临时目录失败:', cleanupError);
      }
    }
  }
}
