const fs = require("fs/promises");
const nodemailer = require("nodemailer");
const mysql = require("mysql2/promise");
require("dotenv").config();

// MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Email transporter setup
// Looking to send emails in production? Check out our Email API/SMTP product!
var transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "931618586c9be7",
    pass: "0acf1f581c5c15",
  },
});

// JSON file for storing customer emails
const customersFile = "./customers.json";

/**
 * Sends email notifications to customers.
 * @param {Array} notifications - List of notifications to send.
 * @returns {Promise<void>}
 */

async function sendEmailNotifications(notifications) {
  try {
    for (const notification of notifications) {
      console.log(notification);
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: notification.email,
          subject: notification.message,
          text: `Dear Customer,\n\n${notification.message}`,
        });
        console.log(
          `Email sent to ${notification.email}`
        );

      } catch (emailError) {
        console.error(`Failed to send email to ${notification.email}:`, emailError);
      }
    }
  } catch (error) {
    console.error("Error in sending notifications:", error);
  }
}

module.exports = { sendEmailNotifications };
