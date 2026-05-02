import {
  Controller,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { PDFProcessService } from './pdf-process.server';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

@Controller('pdf')
export class PDFProcessController {
  private readonly logger = new Logger(PDFProcessController.name);
  constructor(private readonly pdfService: PDFProcessService) {}

  @Post('process')
  @UseInterceptors(
    FileInterceptor('file', {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      /* eslint-disable @typescript-eslint/no-unsafe-call */
      storage: diskStorage({
        destination: './uploads',
        filename: (
          req: Express.Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          // 生成唯一文件名
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      /* eslint-enable @typescript-eslint/no-unsafe-call */
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    }),
  )
  async processFile(@UploadedFile() file: MulterFile) {
    // 验证文件是否存在
    if (!file) {
      return {
        success: false,
        error: '未找到上传文件，请确保使用正确的字段名(file)上传PDF文件',
      };
    }

    this.logger.log('接收到的文件:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const originalPath: string = file.path!;
    const compressedPath = originalPath.replace('.pdf', '_compressed.pdf');

    try {
      // 1. 先压缩
      await this.pdfService.compressPDF(originalPath, compressedPath, 'ebook');

      // 2. 再对压缩后的文件进行 OCR (可选：也可以直接 OCR 原文件)
      const text = await this.pdfService.ocrPDF(compressedPath);

      // 3. 清理原文件（可选）
      fs.unlinkSync(originalPath);

      return {
        success: true,
        message: '处理成功',
        data: {
          textLength: text.length,
          preview: text.substring(0, 200) + '...', // 预览前200字
          downloadUrl: `/uploads/${path.basename(compressedPath)}`, // 假设有静态资源映射
        },
      };
    } catch (e: any) {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      return { success: false, error: e.message };
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    }
  }
}
