import nodemailer, {
  getTestMessageUrl,
  SendMailOptions,
  SentMessageInfo,
  TestAccount,
  Transporter,
} from 'nodemailer';
import { promisify } from 'util';

const createTestAccountAsync = promisify<TestAccount>(
  nodemailer.createTestAccount,
);

// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing
async function configureTransporter(): Promise<Transporter> {
  try {
    const account = await createTestAccountAsync();

    const options =
      process.env.NODE_ENV !== 'production'
        ? {
          auth: {
            pass: account.pass,
            user: account.user,
          },
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          }
        : {
          auth: {
            pass: process.env.SENDGRID_PASSWORD,
            user: process.env.SENDGRID_USERNAME,
          },
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false, // true for 465, false for other ports
          };

    // create reusable transporter object using the default SMTP transport
    return nodemailer.createTransport(options);
  } catch (e) {
    throw new Error(
      'Error while configuring node-mailer transporter: ' + e.message,
    );
  }
}

let transporter: Transporter;

export const sendMailAsync = async (
  mailOptions: SendMailOptions,
): Promise<SentMessageInfo> => {
  if (!transporter) {
    transporter = await configureTransporter();
  }
  return transporter.sendMail(mailOptions);
};

export { getTestMessageUrl };
