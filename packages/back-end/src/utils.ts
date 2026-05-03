import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

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
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    /* eslint-disable @typescript-eslint/no-unsafe-call */
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    const formData = new FormData();
    // Convert Buffer to Blob for FormData compatibility
    const blob = new Blob([fileBuffer], { type: 'text/plain' });
    formData.append('file', blob, fileName);
    formData.append('user', 'pdf-processor');
    formData.append('type', 'TXT'); // 必须指定文件类型

    // 上传文件到Dify
    const response = await axios.post(
      `${process.env.DIFY_BASE_URL}/files/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        },
      },
    );
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    /* eslint-enable @typescript-eslint/no-unsafe-call */
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */

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
