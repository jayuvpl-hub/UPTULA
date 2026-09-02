// // utils/invoice.js
// //
// // Generates a PDF invoice/receipt for a successful payment.
// //
// // STATUS: minimal working version using `pdfkit` (npm install pdfkit).
// // Produces a simple, correct invoice now; the TODOs below are the
// // polish items to add later (letterhead, GST/tax lines if applicable,
// // itemized breakdown, etc.) — the call signature and storage location
// // won't need to change when you add those.

// const fs = require('fs');
// const path = require('path');
// const PDFDocument = require('pdfkit'); // npm install pdfkit

// const INVOICE_DIR = path.join(__dirname, '..', 'storage', 'invoices');

// // Ensure the storage directory exists on startup.
// if (!fs.existsSync(INVOICE_DIR)) {
//   fs.mkdirSync(INVOICE_DIR, { recursive: true });
// }

// /**
//  * generateInvoice({ orderId, invoiceNumber, amountPaise, plan, employerId })
//  *
//  * Returns: the absolute file path of the generated PDF.
//  *
//  * TODO (later):
//  *  - Pull real employer details (name, email, GST number if applicable)
//  *    from the DB instead of just employerId, and print them on the invoice.
//  *  - Add Uptula letterhead/logo.
//  *  - Add tax breakdown if/when GST applies to your plans.
//  *  - Consider a proper invoice template/library if requirements grow
//  *    beyond a simple one-page receipt.
//  */
// async function generateInvoice({ orderId, invoiceNumber, amountPaise, plan, employerId }) {
//   const filePath = path.join(INVOICE_DIR, `${invoiceNumber}.pdf`);
//   const amountRupees = (amountPaise / 100).toFixed(2);

//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({ margin: 50 });
//     const stream = fs.createWriteStream(filePath);

//     doc.pipe(stream);

//     doc.fontSize(20).text('Uptula', { align: 'left' });
//     doc.moveDown();
//     doc.fontSize(14).text('Payment Receipt / Invoice', { underline: true });
//     doc.moveDown();

//     doc.fontSize(11);
//     doc.text(`Invoice Number: ${invoiceNumber}`);
//     doc.text(`Order ID: ${orderId}`);
//     doc.text(`Date: ${new Date().toLocaleString('en-IN')}`);
//     doc.text(`Employer ID: ${employerId}`); // TODO: replace with real name/email once fetched
//     doc.moveDown();

//     doc.text(`Plan: ${plan}`);
//     doc.text(`Amount Paid: Rs. ${amountRupees}`);
//     doc.moveDown();

//     doc.fontSize(9).fillColor('gray').text(
//       'This is a computer-generated receipt and does not require a signature.',
//       { align: 'left' }
//     );

//     doc.end();

//     stream.on('finish', () => resolve(filePath));
//     stream.on('error', reject);
//   });
// }

// module.exports = { generateInvoice };
// utils/invoice.js
//
// Generates a PDF invoice/receipt for a successful payment.
//
// STATUS: minimal working version using `pdfkit` (npm install pdfkit).
// Produces a simple, correct invoice now; the TODOs below are the
// polish items to add later (letterhead, GST/tax lines if applicable,
// itemized breakdown, etc.) — the call signature and storage location
// won't need to change when you add those.

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit'); // npm install pdfkit

const INVOICE_DIR = path.join(__dirname, '..', 'storage', 'invoices');

// Ensure the storage directory exists on startup.
if (!fs.existsSync(INVOICE_DIR)) {
  fs.mkdirSync(INVOICE_DIR, { recursive: true });
}

/**
 * generateInvoice({ orderId, invoiceNumber, amountPaise, plan, employerId })
 *
 * Returns: the absolute file path of the generated PDF.
 *
 * TODO (later):
 *  - Pull real employer details (name, email, GST number if applicable)
 *    from the DB instead of just employerId, and print them on the invoice.
 *  - Add Uptula letterhead/logo.
 *  - Add tax breakdown if/when GST applies to your plans.
 *  - Consider a proper invoice template/library if requirements grow
 *    beyond a simple one-page receipt.
 */
async function generateInvoice({ orderId, invoiceNumber, amountRupees, plan, userId }) {
  const filePath = path.join(INVOICE_DIR, `${invoiceNumber}.pdf`);
  const displayAmount = Number(amountRupees).toFixed(2);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text('Uptula', { align: 'left' });
    doc.moveDown();
    doc.fontSize(14).text('Payment Receipt / Invoice', { underline: true });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Order ID: ${orderId}`);
    doc.text(`Date: ${new Date().toLocaleString('en-IN')}`);
    doc.text(`User ID: ${userId}`); // TODO: replace with real name/email once fetched
    doc.moveDown();

    doc.text(`Plan: ${plan}`);
    doc.text(`Amount Paid: Rs. ${displayAmount}`);
    doc.moveDown();

    doc.fontSize(9).fillColor('gray').text(
      'This is a computer-generated receipt and does not require a signature.',
      { align: 'left' }
    );

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generateInvoice };