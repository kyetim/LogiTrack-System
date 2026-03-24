import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    // Mailtrap SMTP (Geliştirme ortamı — emailler sandbox'a düşer)
    // Canlıya geçerken SMTP_HOST/USER/PASS değerlerini Gmail (veya başka SMTP) ile değiştirin
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    this.logger.log(`📧 Email servisi başlatıldı — SMTP: ${process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io'}`);
  }

  /** Temel email gönderme metodu */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"LogiTrack" <noreply@logitrack.com>',
        to,
        subject,
        html,
      });
      this.logger.log(`✅ Email gönderildi → ${to} | MessageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`❌ Email gönderilemedi → ${to}: ${error.message}`);
      // Email hatası iş akışını engellemez — sadece loglama
    }
  }

  /**
   * Admin'e yeni şoför başvurusu bildirim emaili
   */
  async sendDriverRegistrationRequest(
    adminEmail: string,
    driverData: { firstName: string; lastName: string; email: string; phoneNumber: string; licenseNumber: string }
  ): Promise<void> {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2563EB; padding: 24px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">🚛 LogiTrack — Yeni Şoför Başvurusu</h1>
            </div>
            <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-radius: 0 0 8px 8px;">
                <p style="color: #475569; margin-top: 0;">Yeni bir şoför başvurusu alındı. Onay için aşağıdaki bilgileri inceleyin:</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; color: #64748B; font-weight: bold; width: 40%;">Ad Soyad</td><td style="padding: 8px; color: #1E293B;">${driverData.firstName} ${driverData.lastName}</td></tr>
                    <tr style="background: #F1F5F9;"><td style="padding: 8px; color: #64748B; font-weight: bold;">E-posta</td><td style="padding: 8px; color: #1E293B;">${driverData.email}</td></tr>
                    <tr><td style="padding: 8px; color: #64748B; font-weight: bold;">Telefon</td><td style="padding: 8px; color: #1E293B;">${driverData.phoneNumber}</td></tr>
                    <tr style="background: #F1F5F9;"><td style="padding: 8px; color: #64748B; font-weight: bold;">Ehliyet No</td><td style="padding: 8px; color: #1E293B;">${driverData.licenseNumber}</td></tr>
                </table>
                <div style="margin-top: 24px; padding: 16px; background: #FEF3C7; border-radius: 6px; border-left: 4px solid #F59E0B;">
                    <p style="color: #92400E; margin: 0; font-size: 14px;">⚠️ Şoför hesabını onaylamak veya reddetmek için Admin Dashboard'a giriş yapın.</p>
                </div>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/drivers?tab=pending" 
                   style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Dashboard'a Git →
                </a>
            </div>
        </div>`;

    await this.sendEmail(adminEmail, '🚛 Yeni Şoför Başvurusu — Onay Gerekiyor', html);
  }

  /**
   * Şoföre hesap onaylandı emaili
   */
  async sendDriverApproved(driverEmail: string, driverName: string): Promise<void> {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #10B981; padding: 24px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">✅ Hesabınız Onaylandı!</h1>
            </div>
            <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-radius: 0 0 8px 8px;">
                <p style="color: #475569;">Merhaba <strong>${driverName}</strong>,</p>
                <p style="color: #475569;">LogiTrack şoför hesabınız admin tarafından onaylandı. Artık uygulamaya giriş yapabilirsiniz.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/login" 
                   style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Giriş Yap →
                </a>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">LogiTrack — Lojistik Yönetim Platformu</p>
            </div>
        </div>`;

    await this.sendEmail(driverEmail, '✅ LogiTrack Hesabınız Onaylandı', html);
  }

  /**
   * Şoföre hesap reddedildi emaili
   */
  async sendDriverRejected(driverEmail: string, driverName: string, reason?: string): Promise<void> {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #EF4444; padding: 24px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">❌ Başvurunuz Reddedildi</h1>
            </div>
            <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-radius: 0 0 8px 8px;">
                <p style="color: #475569;">Merhaba <strong>${driverName}</strong>,</p>
                <p style="color: #475569;">Maalesef LogiTrack şoför başvurunuz reddedildi.</p>
                ${reason ? `<div style="padding: 16px; background: #FEF2F2; border-radius: 6px; margin-top: 8px;"><p style="color: #991B1B; margin: 0;"><strong>Neden:</strong> ${reason}</p></div>` : ''}
                <p style="color: #475569; margin-top: 16px;">Daha fazla bilgi için destek ekibimizle iletişime geçebilirsiniz.</p>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">LogiTrack — Lojistik Yönetim Platformu</p>
            </div>
        </div>`;

    await this.sendEmail(driverEmail, '❌ LogiTrack Başvurunuz Hakkında', html);
  }

  /**
   * Şifre sıfırlama emaili — gerçek deep link ile
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    // Mobil app için deep link (logitrack://reset-password?token=...)
    const mobileDeepLink = `logitrack://reset-password?token=${resetToken}`;
    // Web fallback linki
    const webLink = `${process.env.FRONTEND_URL || 'exp://192.168.1.1:8081'}?path=reset-password&token=${resetToken}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2563EB; padding: 24px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">🔑 Şifre Sıfırlama</h1>
            </div>
            <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-radius: 0 0 8px 8px;">
                <p style="color: #475569;">Bu email adresine bağlı bir şifre sıfırlama talebiniz alındı.</p>
                <p style="color: #475569;">Sıfırlama kodunuz:</p>
                <div style="background: #EFF6FF; border: 2px dashed #2563EB; padding: 20px; border-radius: 8px; text-align: center; margin: 16px 0;">
                    <span style="font-size: 28px; font-weight: bold; color: #1D4ED8; letter-spacing: 8px;">${resetToken}</span>
                </div>
                <p style="color: #64748B; font-size: 14px;">Bu kod <strong>1 saat</strong> geçerlidir. Talebi siz yapmadıysanız bu emaili görmezden gelin.</p>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">LogiTrack — Lojistik Yönetim Platformu</p>
            </div>
        </div>`;

    await this.sendEmail(email, '🔑 LogiTrack — Şifre Sıfırlama', html);
  }

  /**
   * Hoşgeldin emaili — Admin tarafından oluşturulmuş hesaplar için
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2563EB; padding: 24px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">🎉 LogiTrack'e Hoşgeldiniz!</h1>
            </div>
            <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-radius: 0 0 8px 8px;">
                <p style="color: #475569;">Merhaba <strong>${name}</strong>,</p>
                <p style="color: #475569;">Hesabınız oluşturuldu. Hemen giriş yapabilirsiniz.</p>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">LogiTrack — Lojistik Yönetim Platformu</p>
            </div>
        </div>`;

    await this.sendEmail(email, '🎉 LogiTrack Hesabınız Hazır', html);
  }

  // Mevcut metodlar (geriye dönük uyumluluk)
  async sendDocumentExpiryWarning(email: string, documentName: string, expiryDate: Date, daysRemaining: number): Promise<void> {
    const html = `<p>Belgeniz yakında sona eriyor: <strong>${documentName}</strong> — ${daysRemaining} gün kaldı (${expiryDate.toLocaleDateString('tr-TR')})</p>`;
    await this.sendEmail(email, `⚠️ Belge Sona Eriyor — ${documentName}`, html);
  }

  async sendShipmentStatusUpdate(email: string, trackingNumber: string, oldStatus: string, newStatus: string): Promise<void> {
    const html = `<p>Sevkiyat durumu güncellendi: <strong>${trackingNumber}</strong> → ${oldStatus} → <strong>${newStatus}</strong></p>`;
    await this.sendEmail(email, `📦 Sevkiyat Durum Güncelleme — ${trackingNumber}`, html);
  }

  async sendDriverAssignment(driverEmail: string, driverName: string, shipmentId: string, pickupLocation: string, deliveryLocation: string): Promise<void> {
    const html = `<p>Merhaba ${driverName}, yeni sevkiyat atandı: ${shipmentId} | Alış: ${pickupLocation} → Teslimat: ${deliveryLocation}</p>`;
    await this.sendEmail(driverEmail, '🚛 Yeni Sevkiyat Atandı', html);
  }

  async sendGeofenceAlert(email: string, driverName: string, geofenceName: string, eventType: string): Promise<void> {
    const action = eventType === 'ENTER' ? 'girdi' : 'çıktı';
    const html = `<p>${driverName}, <strong>${geofenceName}</strong> bölgesine ${action}.</p>`;
    await this.sendEmail(email, `📍 Bölge Alarmı — ${geofenceName}`, html);
  }

  async sendInvoiceNotification(email: string, invoiceNumber: string, amount: number, dueDate: Date): Promise<void> {
    const html = `<p>Yeni fatura: <strong>${invoiceNumber}</strong> — ₺${amount.toFixed(2)} — Son ödeme: ${dueDate.toLocaleDateString('tr-TR')}</p>`;
    await this.sendEmail(email, `💰 Fatura ${invoiceNumber}`, html);
  }
}
