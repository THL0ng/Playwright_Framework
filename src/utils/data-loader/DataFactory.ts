import { JsonProvider } from '@utils/data-loader/JsonProvider';
import { CsvProvider } from '@utils/data-loader/CsvProvider';

export class DataFactory {
  static getProvider(type: 'json' | 'csv') {
    switch (type) {
      case 'json': return new JsonProvider();
      case 'csv': return new CsvProvider();
      default: throw new Error(`Định dạng ${type} chưa được hỗ trợ`);
    }
  }
}