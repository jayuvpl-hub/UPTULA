// utils/invoice.js
//
// Generates a PDF invoice/receipt for a successful payment and stores it in S3.
//
// Storage note: these used to be written to `src/storage/invoices` on local
// disk. That does not survive on AWS — container/instance filesystems are
// ephemeral and a second instance behind the load balancer cannot serve an
// invoice written by the first. Invoices now go to the same S3 bucket as the
// rest of the uploads (see config/env.js), and the returned key is recorded on
// the payment row.

const PDFDocument = require('pdfkit');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, S3_BUCKET } = require('../config/env');

const INVOICE_PREFIX = 'invoices';

function renderInvoicePdf({ orderId, invoiceNumber, amountRupees, plan, userId }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const displayAmount = Number(amountRupees).toFixed(2);

    doc.fontSize(20).text('Uptula', { align: 'left' });
    doc.moveDown();
    doc.fontSize(14).text('Payment Receipt / Invoice', { underline: true });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Order ID: ${orderId}`);
    doc.text(`Date: ${new Date().toLocaleString('en-IN')}`);
    doc.text(`User ID: ${userId}`);
    doc.moveDown();

    doc.text(`Plan: ${plan}`);
    doc.text(`Amount Paid: Rs. ${displayAmount}`);
    doc.moveDown();

    doc
      .fontSize(9)
      .fillColor('gray')
      .text('This is a computer-generated receipt and does not require a signature.', {
        align: 'left',
      });

    doc.end();
  });
}

/**
 * Render the invoice and upload it to S3.
 *
 * @returns {Promise<string>} the S3 object key, to store on the payment row.
 */
async function generateInvoice({ orderId, invoiceNumber, amountRupees, plan, userId }) {
  if (!S3_BUCKET) {
    throw new Error('S3_BUCKET is not set — cannot store invoice');
  }

  const pdf = await renderInvoicePdf({ orderId, invoiceNumber, amountRupees, plan, userId });
  const key = `${INVOICE_PREFIX}/${invoiceNumber}.pdf`;

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: pdf,
      ContentType: 'application/pdf',
      // Invoices are customer financial records; never world-readable.
      ContentDisposition: `attachment; filename="${invoiceNumber}.pdf"`,
    })
  );

  return key;
}

/**
 * Fetch an invoice back out of S3 for download.
 *
 * @returns {Promise<{body: import('stream').Readable, contentLength: number|undefined}>}
 */
async function getInvoiceStream(key) {
  if (!S3_BUCKET) {
    throw new Error('S3_BUCKET is not set — cannot read invoice');
  }
  const result = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  return { body: result.Body, contentLength: result.ContentLength };
}

module.exports = { generateInvoice, getInvoiceStream, INVOICE_PREFIX };
