import { Injectable, Logger } from '@nestjs/common';

// Note: Nodemailer should be installed
// npm install nodemailer @types/nodemailer

@Injectable()
export class EmailService {
    private logger = new Logger('EmailService');
    // private transporter: any; // Nodemailer transporter

    constructor() {
        // Initialize email transporter
        // this.initializeTransporter();
    }

    /**
     * Initialize Nodemailer transporter
     * Uncomment when ready to use
     */
    // private initializeTransporter() {
    //   this.transporter = nodemailer.createTransport({
    //     host: process.env.SMTP_HOST,
    //     port: parseInt(process.env.SMTP_PORT),
    //     secure: process.env.SMTP_SECURE === 'true',
    //     auth: {
    //       user: process.env.SMTP_USER,
    //       pass: process.env.SMTP_PASS,
    //     },
    //   });
    //   this.logger.log('Email transporter initialized');
    // }

    /**
     * Send email (mock implementation)
     */
    private async sendEmail(to: string, subject: string, html: string) {
        // TODO: Replace with actual Nodemailer implementation
        // const info = await this.transporter.sendMail({
        //   from: process.env.SMTP_FROM,
        //   to,
        //   subject,
        //   html,
        //   });
        //
        // return info;

        // Mock implementation
        this.logger.log(`[MOCK] Sending email to ${to}: ${subject}`);
        return { success: true, messageId: 'mock-id' };
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(email: string, resetToken: string) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const html = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

        return this.sendEmail(email, 'Password Reset Request', html);
    }

    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(email: string, name: string) {
        const html = `
      <h2>Welcome to LogiTrack!</h2>
      <p>Hi ${name},</p>
      <p>Welcome to LogiTrack fleet management system. Your account has been created successfully.</p>
      <p>You can now log in and start managing your fleet.</p>
      <a href="${process.env.FRONTEND_URL}/login">Login Now</a>
    `;

        return this.sendEmail(email, 'Welcome to LogiTrack', html);
    }

    /**
     * Send document expiry warning
     */
    async sendDocumentExpiryWarning(
        email: string,
        documentName: string,
        expiryDate: Date,
        daysRemaining: number
    ) {
        const html = `
      <h2>Document Expiring Soon</h2>
      <p>Your <strong>${documentName}</strong> will expire in <strong>${daysRemaining} days</strong>.</p>
      <p>Expiry Date: ${expiryDate.toLocaleDateString()}</p>
      <p>Please upload a new document before it expires.</p>
      <a href="${process.env.FRONTEND_URL}/documents">Manage Documents</a>
    `;

        return this.sendEmail(email, 'Document Expiring Soon - Action Required', html);
    }

    /**
     * Send invoice notification
     */
    async sendInvoiceNotification(
        email: string,
        invoiceNumber: string,
        amount: number,
        dueDate: Date
    ) {
        const html = `
      <h2>New Invoice Generated</h2>
      <p>A new invoice has been generated for your account.</p>
      <ul>
        <li><strong>Invoice Number:</strong> ${invoiceNumber}</li>
        <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
        <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}/invoices/${invoiceNumber}">View Invoice</a>
    `;

        return this.sendEmail(email, `Invoice ${invoiceNumber} - Payment Due`, html);
    }

    /**
     * Send shipment status update
     */
    async sendShipmentStatusUpdate(
        email: string,
        trackingNumber: string,
        oldStatus: string,
        newStatus: string
    ) {
        const html = `
      <h2>Shipment Status Updated</h2>
      <p>Your shipment status has been updated:</p>
      <ul>
        <li><strong>Tracking Number:</strong> ${trackingNumber}</li>
        <li><strong>Previous Status:</strong> ${oldStatus}</li>
        <li><strong>New Status:</strong> ${newStatus}</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}/shipments/${trackingNumber}">Track Shipment</a>
    `;

        return this.sendEmail(email, `Shipment ${trackingNumber} - Status Update`, html);
    }

    /**
     * Send driver assignment notification
     */
    async sendDriverAssignment(
        driverEmail: string,
        driverName: string,
        shipmentId: string,
        pickupLocation: string,
        deliveryLocation: string
    ) {
        const html = `
      <h2>New Shipment Assigned</h2>
      <p>Hi ${driverName},</p>
      <p>A new shipment has been assigned to you:</p>
      <ul>
        <li><strong>Shipment ID:</strong> ${shipmentId}</li>
        <li><strong>Pickup:</strong> ${pickupLocation}</li>
        <li><strong>Delivery:</strong> ${deliveryLocation}</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}/shipments/${shipmentId}">View Details</a>
    `;

        return this.sendEmail(driverEmail, 'New Shipment Assigned', html);
    }

    /**
     * Send geofence alert
     */
    async sendGeofenceAlert(
        email: string,
        driverName: string,
        geofenceName: string,
        eventType: string
    ) {
        const html = `
      <h2>Geofence Alert</h2>
      <p><strong>${driverName}</strong> has ${eventType === 'ENTER' ? 'entered' : 'exited'} the geofence:</p>
      <p><strong>${geofenceName}</strong></p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `;

        return this.sendEmail(email, `Geofence Alert - ${geofenceName}`, html);
    }
}
