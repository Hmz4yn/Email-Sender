require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");
const fs = require("fs/promises");
const { sendEmailNotifications } = require("./shared");

const app = express();
const PORT = 3000;

// MySQL connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// JSON file for storing customer emails
const customersFile = "./customers.json";

// Route for sending notifications
app.get("/send-notifications", async (req, res) => {
  console.log("Route '/send-notifications' triggered."); // Debugging log

  try {
    // Check database connection
    await db.query("SELECT 1");
    console.log("Database connection verified."); // Debugging log

    // Fetch notifications where `mail_sent` is false
    const [notifications] = await db.query(
      `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5`
    );

    if (notifications.length === 0) {
      console.log("No notifications to send."); // Debugging log
      return res.status(200).send("No notifications to send.");
    }

    const customerEmails = [];

    // Process notifications
    for (const notification of notifications) {
      console.log(
        `Processing notification ID: ${notification.notification_id}`
      ); // Debugging log

      const [licenses] = await db.query(
        `SELECT * FROM licenses WHERE license_id = ?`,
        [notification.license_id]
      );

      if (licenses.length === 0) {
        console.log(
          `No license found for notification ID: ${notification.notification_id}`
        );
        continue;
      }

      const license = licenses[0];
      const [customers] = await db.query(
        `SELECT customer_email FROM customer WHERE customer_uuid = ?`,
        [license.customer_uuid]
      );

      if (customers.length > 0) {
        customerEmails.push({
          message: notification.notification_message,
          email: customers[0].customer_email,
        });
        console.log(`Added email: ${customers[0].customer_email}`); // Debugging log
      }
    }

    // Send email notifications
    await sendEmailNotifications(customerEmails);
    console.log(customerEmails);

    res.sendStatus(204);
  } catch (error) {
    console.error("Error occurred while processing notifications:", error);
    res
      .status(500)
      .json({ message: "An error occurred while sending notifications." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
