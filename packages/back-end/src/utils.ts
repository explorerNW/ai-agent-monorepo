import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';

/**
 * 日志记录器
 */
export const logger = new Logger('Utils');

/**
 * 上传文本文件到Dify
 */
export async function uploadTextToDify(filePath: string): Promise<string> {
  try {
    // 读取文件内容为Buffer
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    logger.log(
      `准备上传文件到Dify: ${fileName}, 大小: ${fileBuffer.length} bytes`,
    );

    // 创建FormData用于文件上传

    const formData = new FormData();
    // Append buffer directly to form-data
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

    const uploadData = response.data as { id: string; name: string };
    logger.log(
      `✅ 文件上传成功! file_id: ${uploadData.id}, 文件名: ${uploadData.name}`,
    );

    return uploadData.id;
  } catch (error) {
    logger.error('❌ 文件上传失败:', error);
    throw new Error(`Failed to upload file to Dify: ${error}`);
  }
}
