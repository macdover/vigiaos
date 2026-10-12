import QRCode from 'qrcode';
import { CompanySettings, FinancialTransaction } from '../types';

/**
 * Calculates CRC16-CCITT for standard EMVCo Pix BR Code
 */
function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats EMV TLV (Tag-Length-Value)
 */
function formatTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Normalizes text removing special characters/accents for EMVCo standard
 */
function sanitizeAscii(text: string, maxLen: number): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .substring(0, maxLen);
}

export interface PixPayloadParams {
  pixKey: string;
  amount?: number;
  beneficiaryName: string;
  city: string;
  txId?: string;
  description?: string;
}

/**
 * Generates an authentic, scanable Pix Copia e Cola payload (BRCode - Banco Central do Brasil)
 */
export function generatePixCopiaECola({
  pixKey,
  amount,
  beneficiaryName,
  city,
  txId = '***',
  description,
}: PixPayloadParams): string {
  const cleanKey = (pixKey || '').trim();
  const cleanName = sanitizeAscii(beneficiaryName || 'VIGIAOS', 25) || 'EMPRESA';
  const cleanCity = sanitizeAscii(city || 'RIO DE JANEIRO', 15) || 'CIDADE';
  const cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';

  // 00: Format Indicator
  let payload = formatTLV('00', '01');

  // 26: Merchant Account Information
  let merchantInfo = formatTLV('00', 'br.gov.bcb.pix');
  merchantInfo += formatTLV('01', cleanKey);
  if (description) {
    const cleanDesc = sanitizeAscii(description, 35);
    if (cleanDesc) {
      merchantInfo += formatTLV('02', cleanDesc);
    }
  }
  payload += formatTLV('26', merchantInfo);

  // 52: Merchant Category Code (0000 = general)
  payload += formatTLV('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += formatTLV('53', '986');

  // 54: Transaction Amount (optional, format: 0.00)
  if (amount && amount > 0) {
    payload += formatTLV('54', amount.toFixed(2));
  }

  // 58: Country Code
  payload += formatTLV('58', 'BR');

  // 59: Merchant Name
  payload += formatTLV('59', cleanName);

  // 60: Merchant City
  payload += formatTLV('60', cleanCity);

  // 62: Additional Data Field (TxID)
  const additionalData = formatTLV('05', cleanTxId);
  payload += formatTLV('62', additionalData);

  // 63: CRC16 calculation placeholder (Tag 63, length 04)
  const payloadToCrc = payload + '6304';
  const crc16 = calculateCRC16(payloadToCrc);

  return payloadToCrc + crc16;
}

/**
 * Generates a base64 Data URL for the QR Code
 */
export async function generatePixQrCodeImage(copiaECola: string): Promise<string> {
  try {
    return await QRCode.toDataURL(copiaECola, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating Pix QRCode:', err);
    return '';
  }
}

/**
 * Boleto Bancário Data Structure & Generation
 */
export interface BoletoDetails {
  bankCode: string;
  bankName: string;
  digitableLine: string;
  barcodeNumber: string;
  ourNumber: string;
  dueDate: string;
  amount: number;
  beneficiaryName: string;
  beneficiaryDocument: string;
  beneficiaryAddress: string;
  payerName: string;
  payerDocument: string;
  payerAddress: string;
  instructions: string[];
}

/**
 * Generates simulated / formatted standard Boleto Bancário data
 */
export function generateBoletoDetails(
  transaction: FinancialTransaction,
  company?: CompanySettings
): BoletoDetails {
  const bankCode = '341'; // Itaú / Padrão FEBRABAN
  const bankName = company?.bankName || 'Banco Itaú S.A. (341-7)';
  const amountStr = Math.round(transaction.amount * 100).toString().padStart(10, '0');
  
  // Hash seed from transaction id
  const numSeed = transaction.id.replace(/\D/g, '').padEnd(10, '7').substring(0, 8);
  const ourNumber = `175/${numSeed}-4`;

  // Calculate FEBRABAN Due Date Factor (reference base 07/10/1997)
  let factor = '9999';
  if (transaction.dueDate) {
    try {
      const base = new Date('1997-10-07T00:00:00Z').getTime();
      const target = new Date(`${transaction.dueDate}T00:00:00Z`).getTime();
      const diffDays = Math.floor((target - base) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        factor = diffDays.toString().padStart(4, '0');
      }
    } catch {
      factor = '9857';
    }
  }

  // Linha digitável FEBRABAN format: AAABC.CCCCX DDDDD.DDDDDY EEEEE.EEEEEZ K UUUUVVVVVVVVVV
  const field1 = `34191.79001`;
  const field2 = `01043.510047`;
  const field3 = `${numSeed.substring(0, 5)}.${numSeed.substring(5, 8)}008`;
  const field4 = '8';
  const field5 = `${factor}${amountStr}`;
  const digitableLine = `${field1} ${field2} ${field3} ${field4} ${field5}`;

  // Barcode 44 digits
  const barcodeNumber = `34198${factor}${amountStr}1790010104351004${numSeed}00`;

  const instructions = [
    'Pagável em qualquer banco ou aplicativo bancário até o vencimento.',
    'Após o vencimento, cobrar juros de mora de 1% ao mês e multa de 2%.',
    company?.defaultBoletoInstructions || 'Referente a atendimento e manutenção técnica especializada de segurança.',
    `Atendimento VigiaOS - ${transaction.workOrderNumber ? `Ref. O.S #${transaction.workOrderNumber}` : 'Visita Técnica Avulsa'}`,
  ];

  const payerName = transaction.isAvulso 
    ? (transaction.avulsoClientInfo?.name || transaction.clientName || 'Cliente Avulso')
    : (transaction.clientName || 'Cliente Cadastrado');

  const payerDoc = transaction.isAvulso
    ? (transaction.avulsoClientInfo?.document || 'CPF/CNPJ Não informado')
    : 'CPF/CNPJ Conforme Cadastro';

  const payerAddress = transaction.isAvulso
    ? (transaction.avulsoClientInfo?.address || 'Endereço no local do atendimento')
    : 'Endereço do Cadastro';

  return {
    bankCode,
    bankName,
    digitableLine,
    barcodeNumber,
    ourNumber,
    dueDate: transaction.dueDate,
    amount: transaction.amount,
    beneficiaryName: company?.tradeName || company?.name || 'VigiaOS Telefonia e Segurança Ltda',
    beneficiaryDocument: company?.cnpj || '11.601.831/0001-35',
    beneficiaryAddress: company?.address || 'Rio de Janeiro - RJ',
    payerName,
    payerDocument: payerDoc,
    payerAddress,
    instructions,
  };
}
