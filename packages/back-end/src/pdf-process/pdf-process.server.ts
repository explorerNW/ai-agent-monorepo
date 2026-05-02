// src/pdf-process/pdf-process.service.ts
import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { fromPath } from 'pdf2pic';
import Tesseract from 'tesseract.js';

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
   * 2. OCR 识别
   * 将 PDF 转为图片并进行文字识别
   * @param pdfPath PDF 文件路径
   * @returns 识别出的文本内容
   */
  async ocrPDF(pdfPath: string): Promise<string> {
    let fullText = '';

    // 配置 pdf2pic：将 PDF 每一页转为图片
    // density: 300 (DPI越高识别越准，但速度越慢)
    const storeAsImage = fromPath(pdfPath, {
      density: 300,
      savePath: './temp_ocr', // 临时存放图片的目录
      format: 'png',
      width: 1200,
    });

    try {
      // 获取页数（这里简化处理，实际可能需要先解析 PDF 获取总页数）
      // 为了演示，我们假设只处理第一页，或者你可以循环处理所有页
      // 注意：pdf2pic 的 convert 方法返回的是 Promise<ConvertResponse[]>

      const pages = await storeAsImage.bulk(-1); // -1 表示转换所有页

      for (const page of pages) {
        if (!page.path) continue;

        // 使用 Tesseract 识别图片文字
        // lang: 'eng+chi_sim' 支持英文和简体中文
        const worker = await Tesseract.createWorker('eng+chi_sim');

        const ret = await worker.recognize(page.path);
        fullText += `\n--- 第 ${pages.indexOf(page) + 1} 页 ---\n`;
        fullText += ret.data.text;

        await worker.terminate();

        // 删除临时图片文件
        fs.unlinkSync(page.path);
      }

      // 清理临时目录（如果为空）
      // fs.rmdirSync('./temp_ocr');

      return fullText.trim();
    } catch (error) {
      console.error('❌ OCR 识别失败:', error);
      throw new Error('OCR 识别过程出错');
    }
  }
}
