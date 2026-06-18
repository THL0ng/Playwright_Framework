import * as fs from 'fs/promises';
import * as path from 'path';
import { IDataReader } from './IDataReader';
import { z } from 'zod';


export class JsonProvider implements IDataReader {
  async read<T>(filePath: string, schema?: z.ZodSchema): Promise<T[]> {
    const fullPath = path.resolve(process.cwd(), filePath);
    const rawData = await fs.readFile(fullPath, 'utf-8');
    const parsed = JSON.parse(rawData);
    console.log("Đang tìm file tại:", fullPath);

    // Nếu có truyền Schema, dùng nó để validate từng dòng
    return schema ? parsed.map((item: any) => schema.parse(item)) : parsed;
  }
}