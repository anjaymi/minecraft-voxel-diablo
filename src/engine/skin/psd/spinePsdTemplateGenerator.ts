import { ChibiPsdTemplateBuilder } from './ChibiPsdTemplateBuilder';
import { ChibiProportionType } from './ChibiProportionStandards';

export class SpinePsdTemplateGenerator {
  /**
   * Generate standard PSD template blob (defaults to 2.5-head GoodSmile standard)
   */
  public static generatePsdTemplateBlob(proportion: ChibiProportionType = '2.5_head'): Blob {
    return ChibiPsdTemplateBuilder.generatePsdBlob(proportion);
  }

  /**
   * Trigger direct download in browser
   */
  public static downloadTemplate(
    filename: string = 'spine_chibi_2.5_head_template.psd',
    proportion: ChibiProportionType = '2.5_head'
  ): void {
    ChibiPsdTemplateBuilder.downloadTemplate(proportion, filename);
  }

  /**
   * Download 2.0-head Nendoroid Chibi standard PSD template
   */
  public static download20HeadTemplate(): void {
    ChibiPsdTemplateBuilder.downloadTemplate('2.0_head');
  }

  /**
   * Download 2.5-head GoodSmile Figurine standard PSD template
   */
  public static download25HeadTemplate(): void {
    ChibiPsdTemplateBuilder.downloadTemplate('2.5_head');
  }
}
