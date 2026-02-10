import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WaybillService {
    private readonly logger = new Logger(WaybillService.name);

    constructor(private prisma: PrismaService) { }

    async generateWaybill(shipmentId: string): Promise<Buffer> {
        const shipment = await this.prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
                driver: {
                    include: {
                        driverProfile: {
                            include: {
                                vehicle: true,
                            },
                        },
                    },
                },
            },
        });

        if (!shipment) {
            throw new NotFoundException('Shipment not found');
        }

        return new Promise(async (resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Load Font for Turkish Support
            try {
                const fontPath = path.join(process.cwd(), 'src/assets/fonts/Roboto-Regular.ttf');
                if (fs.existsSync(fontPath)) {
                    doc.font(fontPath);
                } else {
                    this.logger.warn('Custom font not found, using default');
                }
            } catch (e) {
                this.logger.error('Error loading font', e);
            }

            // --- Header ---
            doc.fontSize(20).text('SEVK İRSALİYESİ', { align: 'center' });
            doc.moveDown();

            // Date & Tracking
            doc.fontSize(10).text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, { align: 'right' });
            doc.text(`Takip No: ${shipment.trackingNumber}`, { align: 'right' });
            doc.text(`İrsaliye No: IRS-${shipment.trackingNumber.substring(3)}`, { align: 'right' }); // Fake Invoice No based on tracking

            doc.moveDown();
            doc.moveDown();

            // --- Parties ---
            const startY = doc.y;

            // Sender (Left)
            doc.text('GÖNDERİCİ:', 50, startY, { underline: true });
            doc.moveDown(0.5);
            doc.text('LogiTrack Lojistik A.Ş.'); // Static for now as we don't have Sender/Receiver explicitly in schema beyond address strings
            doc.text(shipment.origin); // Using origin address

            // Receiver (Right)
            doc.text('ALICI:', 300, startY, { underline: true });
            doc.moveDown(0.5);
            doc.text(shipment.destination); // Using destination address/name

            doc.moveDown(4);

            // --- Transport Details ---
            const transportY = doc.y;
            doc.text('TAŞIYICI / ŞOFÖR BİLGİLERİ:', 50, transportY, { underline: true });
            doc.moveDown(0.5);

            if (shipment.driver) {
                const driverName = shipment.driver.email ? shipment.driver.email : 'Belirtilmemiş'; // Fallback as we don't have name
                // Note: User model doesn't have name, using Email or adding TODO
                // Better: Check if we have profile?

                doc.text(`Ad Soyad: ${driverName.split('@')[0].toUpperCase()}`); // Basic extraction
                doc.text(`TC Kimlik / Ehliyet: ${shipment.driver.driverProfile?.licenseNumber || '---'}`);
                doc.text(`Araç Plaka: ${shipment.driver.driverProfile?.vehicle?.plateNumber || '---'}`);
            } else {
                doc.text('Şoför Atanmamış');
            }

            doc.moveDown(2);

            // --- Goods ---
            doc.text('MALZEME LİSTESİ:', { underline: true });
            doc.moveDown(0.5);

            // Draw a simple table header
            const tableTop = doc.y;
            doc.text('Açıklama', 50, tableTop, { width: 300 });
            doc.text('Miktar', 350, tableTop);
            doc.text('Birim', 450, tableTop);

            // Line
            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Item (Single item for now based on shipment)
            doc.text('Genel Kargo / Lojistik Taşıma Hizmeti', 50, tableTop + 25);
            doc.text('1', 350, tableTop + 25);
            doc.text('Adet/Sefer', 450, tableTop + 25);

            doc.moveDown(4);

            // --- QR Code ---
            try {
                // Generate QR containing tracking URL
                const qrData = `https://logitrack.com/track/${shipment.trackingNumber}`;
                const qrImage = await QRCode.toDataURL(qrData);
                const qrBuffer = Buffer.from(qrImage.split(',')[1], 'base64');

                doc.image(qrBuffer, 450, 700, { width: 100 });
                doc.fontSize(8).text('Doğrulama Kodu', 450, 805, { width: 100, align: 'center' });
            } catch (error) {
                this.logger.error('Error generating QR', error);
            }

            // Footer
            doc.fontSize(8).text('Bu belge LogiTrack sistemi tarafından elektronik ortamda üretilmiştir.', 50, 750, { align: 'center', width: 500 });

            doc.end();
        });
    }
}
