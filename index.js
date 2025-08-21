const express = require("express");
const cors = require("cors");
const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const app = express();
app.use(cors());
app.use(express.json());

// Global variable to store latest QR code
let latestQR = null;

// Initialize WhatsApp client
const client = new Client();

client.on("qr", qr => {
  console.log("📲 Scan this QR code in your WhatsApp (terminal log)");
  latestQR = qr; // store latest QR for /scan route
});

client.on("ready", () => {
  console.log("✅ WhatsApp client is ready!");
  latestQR = null; // clear QR after successful login
});

client.initialize();

// API route: show QR as base64 PNG
app.get("/scan", async (req, res) => {
  try {
    if (!latestQR) {
      return res.json({
        success: false,
        message: "WhatsApp already connected or QR not generated yet."
      });
    }

    // Convert QR to image
    const qrImage = await qrcode.toDataURL(latestQR);

    res.json({
      success: true,
      qr: qrImage
    });
  } catch (error) {
    console.error("❌ Error generating QR:", error);
    res.status(500).json({ success: false, error: "Failed to generate QR" });
  }
});

// API endpoint to send WhatsApp message
app.post("/send-enquiry", async (req, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      category,
      fuelType,
      brand,
      model,
      location,
      notes,
      serviceType
    } = req.body;

    const targetNumber = "917598825487@c.us"; // your number

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN");
    const formattedTime = now.toLocaleTimeString("en-IN");

    const message = `🔋 *New Battery Enquiry* 🔋

📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}

👤 Name: ${fullName}
📞 Mobile: ${mobileNumber}
📂 Category: ${category}
⛽ Fuel Type: ${fuelType || "N/A"}
🏷️ Brand: ${brand}
🚘 Model: ${model}
📍 Location: ${location}
🛠️ Service Type: ${serviceType}
📝 Notes: ${notes || "None"}
`;

    await client.sendMessage(targetNumber, message);

    res.json({ success: true, message: "Enquiry sent to WhatsApp ✅" });
  } catch (error) {
    console.error("❌ Error sending enquiry:", error);
    res.status(500).json({ success: false, error: "Failed to send enquiry" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
