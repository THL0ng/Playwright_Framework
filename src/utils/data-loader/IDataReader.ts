import { z } from 'zod';

export interface IDataReader {
  read<T>(filePath: string, schema?: z.ZodTypeAny): Promise<T[]>;
}