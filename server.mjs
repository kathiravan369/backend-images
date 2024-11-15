import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { nanoid } from "nanoid";
import url from "url";

// Get the current directory of the module
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const app = express();
const PORT = 5000;
const uploadPath = path.join(__dirname, "uploads"); // Path to the uploads folder

// Ensure the uploads directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Enable CORS for all origins
app.use(cors());

// Serve static files from the uploads folder
app.use("/images", express.static(uploadPath));

// Parse JSON payloads
app.use(express.json({ limit: "10mb" })); // Adjust limit as needed

// Handle file upload
app.post("/upload", (req, res) => {
  const { image } = req.body; // Expecting base64 image data with prefix (data:image/jpeg;base64,)

  if (!image) {
    return res.status(400).json({ message: "No image data received" });
  }

  // Extract the base64 part of the image (removing the "data:image/*;base64," prefix)
  const base64Data = image.split(",")[1];
  
  const imageId = nanoid(10);

  // Convert base64 data to a buffer and save the file to disk
  const imgBuffer = Buffer.from(base64Data, "base64");
  const filePath = path.join(uploadPath, `${imageId}.jpg`);

  fs.writeFile(filePath, imgBuffer, (err) => {
    if (err) {
      console.error("Error saving image to disk:", err);
      return res.status(500).json({ message: "Failed to save image" });
    }

    // Send back a short URL to access the saved image
    const shortUrl = `${req.protocol}://${req.get("host")}/images/${imageId}.jpg`;
    res.json({ shortUrl });
  });
});

// Get all images
app.get("/images", (req, res) => {
  // Read all files in the 'uploads' folder
  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      console.error("Error reading uploads folder:", err);
      return res.status(500).json({ message: "Failed to retrieve images" });
    }

    // Filter out non-image files (you can modify this to check file extensions)
    const allImages = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/.test(file)) // Only include image files
      .map((file) => ({
        imageId: file.replace(/\.(jpg|jpeg|png|gif)$/, ""),
        shortUrl: `${req.protocol}://${req.get("host")}/images/${file}`,
      }));

    res.json(allImages);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

