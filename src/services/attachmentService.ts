import { Attachment } from '../types';
import { db } from '../db';

export class AttachmentService {
  /**
   * 将文件转换为Base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 将Base64转换为Blob
   */
  static base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  }

  /**
   * 压缩图片
   */
  static async compressImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      img.onload = () => {
        // 计算新尺寸
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制并压缩
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 上传附件到IndexedDB
   */
  static async uploadAttachment(
    noteId: string,
    file: File,
    compressImage: boolean = true
  ): Promise<Attachment> {
    try {
      let dataUrl: string;
      let fileSize = file.size;

      // 如果是图片且需要压缩
      if (file.type.startsWith('image/') && compressImage) {
        const compressedBlob = await this.compressImage(file);
        dataUrl = await this.fileToBase64(
          new File([compressedBlob], file.name, { type: file.type })
        );
        fileSize = compressedBlob.size;
      } else {
        dataUrl = await this.fileToBase64(file);
      }

      const attachment: Attachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        noteId,
        name: file.name,
        type: file.type,
        size: fileSize,
        url: dataUrl,
        createdAt: Date.now()
      };

      await db.attachments.add(attachment);
      return attachment;
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw new Error('附件上传失败');
    }
  }

  /**
   * 获取笔记的所有附件
   */
  static async getAttachments(noteId: string): Promise<Attachment[]> {
    try {
      return await db.attachments
        .where('noteId')
        .equals(noteId)
        .toArray();
    } catch (error) {
      console.error('Failed to get attachments:', error);
      return [];
    }
  }

  /**
   * 删除附件
   */
  static async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      await db.attachments.delete(attachmentId);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      throw new Error('附件删除失败');
    }
  }

  /**
   * 批量删除笔记的所有附件
   */
  static async deleteNoteAttachments(noteId: string): Promise<void> {
    try {
      await db.attachments
        .where('noteId')
        .equals(noteId)
        .delete();
    } catch (error) {
      console.error('Failed to delete note attachments:', error);
    }
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 获取文件类型图标
   */
  static getFileIcon(type: string): string {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type.startsWith('video/')) {
      return '🎬';
    } else if (type.startsWith('audio/')) {
      return '🎵';
    } else if (type.includes('pdf')) {
      return '📄';
    } else if (type.includes('word') || type.includes('document')) {
      return '📝';
    } else if (type.includes('sheet') || type.includes('excel')) {
      return '📊';
    } else if (type.includes('presentation') || type.includes('powerpoint')) {
      return '📽️';
    } else if (type.includes('zip') || type.includes('rar') || type.includes('archive')) {
      return '📦';
    } else {
      return '📎';
    }
  }

  /**
   * 验证文件类型
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType + '/');
      }
      return file.type === type;
    });
  }

  /**
   * 验证文件大小
   */
  static validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
}

// 导出便捷函数
export const uploadAttachment = AttachmentService.uploadAttachment.bind(AttachmentService);
export const getAttachments = AttachmentService.getAttachments.bind(AttachmentService);
export const deleteAttachment = AttachmentService.deleteAttachment.bind(AttachmentService);
export const formatFileSize = AttachmentService.formatFileSize.bind(AttachmentService);
export const getFileIcon = AttachmentService.getFileIcon.bind(AttachmentService);
