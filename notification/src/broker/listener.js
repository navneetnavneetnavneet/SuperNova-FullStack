const { subscribeToQueue } = require("./broker");
const { sendEmail } = require("../email");

module.exports = function () {
  subscribeToQueue("AUTH_NOTIFICATION.USER_CREATED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Welcome to Our Service !</h1>
    <p>Dear ${data.fullName.firstName + " " + (data.fullName.lastName || "")},</p>
    <p>Thank you for registering with us. We're exited to have you on board !</p>
    <p>Best regards, <br/> The Team</p>
    `;

    await sendEmail(
      data.email,
      "Welcome to Our Service",
      "Thank you for registering with us.",
      emailHTMLTemplate,
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", async (data) => {
    const emailHTMLTemaplate = `
    <h1>Payment Initiated</h1>

    <p>Dear ${data.username},</p>
    
    <p>We have received your payment initiation request for the order <strong>${data.orderId}</strong>.
    Your payment of <strong>${data.currency} ${Number(data.amount).toFixed(2)}</strong> is being processed.</p> 
    <p>We will notify you once the payment is completed or if there are any issues.</p>
    <p>Thank you for your patience.</p>

    <p>Best regards,<br/> The Team</p>
    `;

    await sendEmail(
      data.email,
      "Payment Initiated",
      "Your payment is being processed.",
      emailHTMLTemaplate,
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", async (data) => {
    const emailHTMLTemplate = `
  <h1>Payment Successful!</h1>

  <p>Dear ${data.username},</p>

  <p>
    We have successfully received your payment of 
    <strong>${data.currency} ${Number(data.amount).toFixed(2)}</strong>.
  </p>

  <h3>Payment Details:</h3>
  <ul>
    <li><strong>Order ID:</strong> ${data.orderId}</li>
    <li><strong>Payment ID:</strong> ${data.paymentId}</li>
    <li><strong>Email:</strong> ${data.email}</li>
  </ul>

  <p>
    Thank you for your purchase! If you have any questions, please contact our support team.
  </p>

  <p>
    Best regards,<br/>
    The Team
  </p>

  <hr/>
  <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
`;

    await sendEmail(
      data.email,
      "Payment Successful",
      "Your payment has been processed successfully.",
      emailHTMLTemplate,
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", async (data) => {
    const emailHTMLTemplate = `
  <h1>Payment Failed!</h1>

  <p>Dear ${data.username},</p>

  <p>
    Unfortunately, your payment could not be processed.
    Please try again or contact support for assistance.
  </p>

  <h3>Payment Details:</h3>
  <ul>
    <li><strong>Order ID:</strong> ${data.orderId}</li>
    <li><strong>Payment ID:</strong> ${data.paymentId}</li>
    <li><strong>Email:</strong> ${data.email}</li>
  </ul>

  <p>
    If the amount was deducted from your account, it will be automatically refunded
    within a few business days depending on your bank.
  </p>

  <p>
    Best regards,<br/>
    The Team
  </p>

  <hr/>
  <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
`;

    await sendEmail(
      data.email,
      "Payment Failed",
      "Unfortunately, your payment could not be processed.",
      emailHTMLTemplate,
    );
  });

  subscribeToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED", async (data) => {
    const emailHTMLTemplate = `
      <h1>Product Created</h1>
      <p>Dear ${data.username},</p>
      <p>A new product has been created by you:</p>
      <ul>
        <li><strong>Product ID:</strong> ${data.productId}</li>
        <li><strong>Seller:</strong> ${data.seller}</li>
      </ul>
      <p>Thank you for your contribution!</p>
      <p>Best regards,<br/> The Team</p>
    `;

    await sendEmail(
      data.email,
      "Product Created",
      "A new product has been created.",
      emailHTMLTemplate,
    );
  });
};
