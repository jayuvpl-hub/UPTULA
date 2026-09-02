// // utils/mailer.js
// //
// // Sends the "payment successful" email with the invoice PDF attached.
// //
// // STATUS: stub. You already have a working nodemailer setup elsewhere in
// // Uptula (flexible SMTP — Gmail locally, cPanel SMTP on hosting — plus a
// // utils/ folder of HTML mail templates for OTP/registration emails).
// // REUSE that same transporter here rather than creating a second one —
// // wire the import below to wherever that lives in your existing codebase.
// //
// // TODO:
// //  1. Replace the placeholder `getTransporter()` import with your real one.
// //  2. Replace the inline HTML below with a proper template file, matching
// //     the style of your existing registerOtpTemplate/resetPasswordTemplate.
// //  3. Fetch the employer's real name/email from the DB using employerId —
// //     currently this function expects email/name to be passed in directly,
// //     since employer lookup logic already exists elsewhere in your app;
// //     wire that call in wherever this is invoked, or fetch it inside here.

// // const getTransporter = require('../config/mailer'); // <-- your existing setup

// /**
//  * sendPaymentSuccessEmail({ employerId, invoiceNumber, amountPaise, attachmentPath })
//  *
//  * Currently a safe no-op stub that logs intent — replace the body with a
//  * real nodemailer `sendMail` call once wired to your existing transporter.
//  * Keeping this as a stub for now means the rest of the payment flow (in
//  * payment.route.js / webhook.route.js) can call it safely today without
//  * needing changes later — only this file needs to change.
//  */
// async function sendPaymentSuccessEmail({ employerId, invoiceNumber, amountPaise, attachmentPath }) {
//     const amountRupees = (amountPaise / 100).toFixed(2);
  
//     // --- Replace everything below with a real send once wired up ---
//     console.log(
//       `[stub] Would send payment success email to employer ${employerId}: ` +
//       `invoice ${invoiceNumber}, amount Rs.${amountRupees}, attachment at ${attachmentPath}`
//     );
//     return;
  
//     // --- Real implementation shape, once ready (uncomment and adapt): ---
//     //
//     // const employer = await getEmployerContactInfo(employerId); // your own lookup
//     // const transporter = getTransporter();
//     //
//     // await transporter.sendMail({
//     //   from: '"Uptula" <no-reply@uptula.com>',
//     //   to: employer.email,
//     //   subject: `Payment Successful — Invoice ${invoiceNumber}`,
//     //   html: `
//     //     <p>Hi ${employer.name},</p>
//     //     <p>Your payment of Rs. ${amountRupees} was successful. Your invoice is attached.</p>
//     //     <p>Thank you for using Uptula.</p>
//     //   `,
//     //   attachments: [
//     //     { filename: `${invoiceNumber}.pdf`, path: attachmentPath },
//     //   ],
//     // });
//   }
  
//   module.exports = { sendPaymentSuccessEmail };
// utils/mailer.js
//
// Sends the "payment successful" email with the invoice PDF attached.
//
// STATUS: stub. You already have a working nodemailer setup elsewhere in
// Uptula (flexible SMTP — Gmail locally, cPanel SMTP on hosting — plus a
// utils/ folder of HTML mail templates for OTP/registration emails).
// REUSE that same transporter here rather than creating a second one —
// wire the import below to wherever that lives in your existing codebase.
//
// TODO:
//  1. Replace the placeholder `getTransporter()` import with your real one.
//  2. Replace the inline HTML below with a proper template file, matching
//     the style of your existing registerOtpTemplate/resetPasswordTemplate.
//  3. Fetch the employer's real name/email from the DB using employerId —
//     currently this function expects email/name to be passed in directly,
//     since employer lookup logic already exists elsewhere in your app;
//     wire that call in wherever this is invoked, or fetch it inside here.

// const getTransporter = require('../config/mailer'); // <-- your existing setup

/**
 * sendPaymentSuccessEmail({ employerId, invoiceNumber, amountPaise, attachmentPath })
 *
 * Currently a safe no-op stub that logs intent — replace the body with a
 * real nodemailer `sendMail` call once wired to your existing transporter.
 * Keeping this as a stub for now means the rest of the payment flow (in
 * payment.route.js / webhook.route.js) can call it safely today without
 * needing changes later — only this file needs to change.
 */
async function sendPaymentSuccessEmail({ userId, invoiceNumber, amountRupees, attachmentPath }) {
    const displayAmount = Number(amountRupees).toFixed(2);
  
    // --- Replace everything below with a real send once wired up ---
    console.log(
      `[stub] Would send payment success email to user ${userId}: ` +
      `invoice ${invoiceNumber}, amount Rs.${displayAmount}, attachment at ${attachmentPath}`
    );
    return;
  
    // --- Real implementation shape, once ready (uncomment and adapt): ---
    //
    // const employer = await getEmployerContactInfo(employerId); // your own lookup
    // const transporter = getTransporter();
    //
    // await transporter.sendMail({
    //   from: '"Uptula" <no-reply@uptula.com>',
    //   to: employer.email,
    //   subject: `Payment Successful — Invoice ${invoiceNumber}`,
    //   html: `
    //     <p>Hi ${employer.name},</p>
    //     <p>Your payment of Rs. ${amountRupees} was successful. Your invoice is attached.</p>
    //     <p>Thank you for using Uptula.</p>
    //   `,
    //   attachments: [
    //     { filename: `${invoiceNumber}.pdf`, path: attachmentPath },
    //   ],
    // });
  }
  
  module.exports = { sendPaymentSuccessEmail };