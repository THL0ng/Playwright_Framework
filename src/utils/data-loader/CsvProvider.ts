import * as fs from 'fs/promises';
import * as path from 'path';
import { parse } from 'csv-parse/sync'; // Dùng bản sync để đơn giản hóa logic
import { IDataReader } from './IDataReader';
import { z } from 'zod';

export class CsvProvider implements IDataReader {
  async read<T>(filePath: string, schema?: z.ZodSchema): Promise<T[]> {
    const fullPath = path.resolve(process.cwd(), filePath);
    const rawData = await fs.readFile(fullPath, 'utf-8');
    
    // Parse CSV thành JSON array
    const records = parse(rawData, {
      columns: true, // Tự động dùng dòng đầu làm header
      skip_empty_lines: true,
      trim: true
    });

    return schema ? records.map((item: any) => schema.parse(item)) as T[] : records as T[];
  }
}