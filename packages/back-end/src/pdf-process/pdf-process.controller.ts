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
import axios from 'axios';
import { PDFProcessService } from './pdf-process.server';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
const FormData = require('form-data');
/* eslint-enable @typescript-eslint/no-require-imports */
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

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

      // 3. 将OCR结果保存为txt文件
      const textFilePath = compressedPath.replace('.pdf', '.txt');
      fs.writeFileSync(textFilePath, text);

      // 4. 上传到Dify并添加到知识库（如果配置了DIFY_API_KEY和DIFY_DATASET_ID）
      let difyFileId: string | null = null;
      let datasetDocumentId: string | null = null;

      if (process.env.DIFY_API_KEY && process.env.DIFY_BASE_URL) {
        try {
          // 4.1 先上传文件
          difyFileId = await this.uploadTextToDify(textFilePath);
          console.log(`✅ 文件已上传到Dify，file_id: ${difyFileId}`);

          // 4.2 如果配置了数据集ID，将文件添加到知识库
          if (process.env.DIFY_DATASET_ID) {
            datasetDocumentId = await this.addFileToDataset(
              textFilePath,
              file.originalname.replace('.pdf', '.txt'),
            );
            console.log(
              `✅ 文件已添加到Dify知识库，document_id: ${datasetDocumentId}`,
            );
          }
        } catch (uploadError) {
          console.error('⚠️ Dify操作失败:', uploadError);
          // 不阻断流程，继续返回结果
        }
      }

      // 5. 清理临时文件（可选）
      fs.unlinkSync(originalPath);
      fs.unlinkSync(compressedPath);
      // 保留txt文件供Dify使用，或者根据需要删除

      return {
        success: true,
        message: '处理成功',
        data: {
          textLength: text.length,
          preview: text.substring(0, 200) + '...', // 预览前200字
          downloadUrl: `/uploads/${path.basename(compressedPath)}`,
          textFileUrl: `/uploads/${path.basename(textFilePath)}`,
          difyFileId: difyFileId, // Dify文件ID，可用于后续调用
          datasetDocumentId: datasetDocumentId, // Dify知识库文档ID
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

  /**
   * 上传文本文件到Dify
   */
  private async uploadTextToDify(filePath: string): Promise<string> {
    try {
      // 读取文件内容为Buffer
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);

      console.log(
        `准备上传文件到Dify: ${fileName}, 大小: ${fileBuffer.length} bytes`,
      );

      // 创建FormData用于文件上传
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      /* eslint-disable @typescript-eslint/no-unsafe-call */
      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'text/plain',
      });
      formData.append('user', 'pdf-processor');
      formData.append('type', 'TXT'); // 必须指定文件类型

      // 上传文件到Dify
      const response = await axios.post(
        `${process.env.DIFY_BASE_URL}/files/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
          },
        },
      );
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      /* eslint-enable @typescript-eslint/no-unsafe-call */
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */

      const uploadData = response.data as { id: string; name: string };
      console.log(
        `✅ 文件上传成功! file_id: ${uploadData.id}, 文件名: ${uploadData.name}`,
      );

      return uploadData.id;
    } catch (error) {
      console.error('❌ 文件上传失败:', error);
      throw new Error(`Failed to upload file to Dify: ${error}`);
    }
  }

  /**
   * 将文件添加到Dify知识库（数据集）
   * @param filePath 文件路径
   * @param originalFileName 原始文件名
   * @returns 文档ID
   */
  private async addFileToDataset(
    filePath: string,
    originalFileName: string,
  ): Promise<string> {
    try {
      // 读取文件内容为Buffer
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = originalFileName || path.basename(filePath);

      console.log(
        `准备将文件添加到Dify知识库: ${fileName}, 数据集ID: ${process.env.DIFY_DATASET_ID}`,
      );

      // 创建数据处理配置（自定义模式）
      const dataConfig = {
        indexing_technique: 'high_quality', // 高质量索引
        process_rule: {
          mode: 'custom', // 自定义处理规则
          rules: {
            pre_processing_rules: [
              { id: 'remove_extra_spaces', enabled: true }, // 移除多余空格
              { id: 'remove_urls_emails', enabled: true }, // 移除URL和邮箱
            ],
            segmentation: {
              separator: '###', // 分段符
              max_tokens: 500, // 每段最大token数
            },
          },
        },
      };

      // 创建FormData用于文件上传
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      /* eslint-disable @typescript-eslint/no-unsafe-call */
      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      const formData = new FormData();

      // 添加数据处理配置（作为JSON字符串）
      formData.append('data', JSON.stringify(dataConfig), {
        contentType: 'application/json',
      });

      // 添加文件（使用'file'字段名）
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'text/plain',
      });

      // 可选：添加元数据
      const metadata = {
        source: 'pdf-ocr',
        original_filename: fileName,
        processed_at: new Date().toISOString(),
      };
      formData.append('metadata', JSON.stringify(metadata));

      // 调用Dify数据集文档创建API（注意URL中使用连字符）
      const response = await axios.post(
        `${process.env.DIFY_BASE_URL}/datasets/${process.env.DIFY_DATASET_ID}/document/create-by-file`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
          },
        },
      );
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      /* eslint-enable @typescript-eslint/no-unsafe-call */
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */

      const responseData = response.data as { document: { id: string } };
      const documentId = responseData.document?.id;

      if (!documentId) {
        throw new Error('未获取到文档ID');
      }

      console.log(`✅ 文件已成功添加到知识库! document_id: ${documentId}`);

      return documentId;
    } catch (error) {
      this.logger.error('❌ 添加到知识库失败:', error);
      throw new Error(`Failed to add file to Dify dataset: ${error}`);
    }
  }
}
