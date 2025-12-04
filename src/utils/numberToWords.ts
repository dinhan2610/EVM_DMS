/**
 * Number to Vietnamese Words Converter
 * 
 * Convert numbers to Vietnamese words for invoice amounts
 * Example: 110000000 => "Một trăm mười triệu đồng chẵn"
 */

const UNITS = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const TENS = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];

/**
 * Convert number from 0-99 to Vietnamese words
 */
const convertTwoDigits = (num: number): string => {
  if (num === 0) return '';
  if (num < 10) return UNITS[num];
  if (num === 10) return 'mười';
  if (num < 20) return `mười ${UNITS[num % 10]}`;
  
  const tens = Math.floor(num / 10);
  const units = num % 10;
  
  if (units === 0) return TENS[tens];
  if (units === 1 && tens > 1) return `${TENS[tens]} mốt`;
  if (units === 5 && tens > 1) return `${TENS[tens]} lăm`;
  
  return `${TENS[tens]} ${UNITS[units]}`;
};

/**
 * Convert number from 0-999 to Vietnamese words
 */
const convertThreeDigits = (num: number): string => {
  if (num === 0) return '';
  
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;
  
  let result = '';
  
  if (hundreds > 0) {
    result = `${UNITS[hundreds]} trăm`;
    if (remainder > 0) {
      if (remainder < 10) {
        result += ` lẻ ${UNITS[remainder]}`;
      } else {
        result += ` ${convertTwoDigits(remainder)}`;
      }
    }
  } else {
    result = convertTwoDigits(remainder);
  }
  
  return result;
};

/**
 * Convert a number to Vietnamese words
 * 
 * @param num - The number to convert (max: 999,999,999,999,999 - 999 nghìn tỷ)
 * @returns Vietnamese words representation
 * 
 * @example
 * numberToWords(110000000) // "Một trăm mười triệu đồng chẵn"
 * numberToWords(5500000) // "Năm triệu năm trăm nghìn đồng chẵn"
 * numberToWords(123456789) // "Một trăm hai mươi ba triệu bốn trăm năm mươi sáu nghìn bảy trăm tám mươi chín đồng chẵn"
 */
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Không đồng';
  
  // Handle negative numbers
  if (num < 0) return 'Số âm không hợp lệ';
  
  // Round to nearest integer
  num = Math.round(num);
  
  // Handle numbers that are too large
  if (num >= 1000000000000000) return 'Số quá lớn';
  
  const billion = Math.floor(num / 1000000000); // Tỷ
  const million = Math.floor((num % 1000000000) / 1000000); // Triệu
  const thousand = Math.floor((num % 1000000) / 1000); // Nghìn
  const unit = num % 1000; // Đơn vị
  
  let result = '';
  
  // Tỷ
  if (billion > 0) {
    result += convertThreeDigits(billion) + ' tỷ';
  }
  
  // Triệu
  if (million > 0) {
    if (result) result += ' ';
    result += convertThreeDigits(million) + ' triệu';
  }
  
  // Nghìn
  if (thousand > 0) {
    if (result) result += ' ';
    result += convertThreeDigits(thousand) + ' nghìn';
  }
  
  // Đơn vị (units)
  if (unit > 0) {
    if (result) result += ' ';
    result += convertThreeDigits(unit);
  }
  
  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1);
  
  // Add "đồng" at the end
  if (num % 1000 === 0 && num >= 1000) {
    result += ' đồng chẵn';
  } else {
    result += ' đồng';
  }
  
  return result.trim();
};

/**
 * Format number to words for invoice display
 * Adds parentheses and proper formatting
 * 
 * @param num - The number to convert
 * @returns Formatted string ready for invoice display
 * 
 * @example
 * formatAmountInWords(110000000) // "(Một trăm mười triệu đồng chẵn)"
 */
export const formatAmountInWords = (num: number): string => {
  const words = numberToWords(num);
  return `(${words})`;
};

export default {
  numberToWords,
  formatAmountInWords,
};
