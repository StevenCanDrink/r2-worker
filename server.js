import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand,DeleteObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());


const s3 = new S3Client({
    region: "us-east-1", // Cloudflare R2 uses 'auto' as the region
    endpoint: "https://2eb42e9bd8a2237f453bb35c9be59094.r2.cloudflarestorage.com", // Replace with your Cloudflare R2 endpoint
    credentials: {
        accessKeyId: "e8f5759376e689374b7c3731b1f927c2",
        secretAccessKey: "087dd13c10adbf717bcaf62b18dc9dbf1603701145f440a1a9492944d20f25c7",
    },
});



// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Upload Route
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        console.log("Received request:", req.body);

        const file = req.file;
        const idProduct = req.body.idproduct;

        if (!file) return res.status(400).json({ error: "No file uploaded" });
        if (!idProduct) return res.status(400).json({ error: "idproduct is required" });

        console.log("Received file:", file);

        const fileKey = `${idProduct}/${file.originalname}`;

        const uploadParams = {
            Bucket: 'giftpromotion',
            Key: fileKey,
            Body: file.buffer, // Use file.buffer directly
            ContentType: file.mimetype,
        };

        console.log("Uploading file:", uploadParams);

        const response =  await s3.send(new PutObjectCommand(uploadParams));

        const { ETag, VersionId } = response;

        // Send a JSON response to the client
        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            data: {
                fileKey: fileKey,
                ETag: ETag,
                VersionId: VersionId,
            },
        });   
    
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: error.message, details: error });
    }
});


// ✅ Delete Image from Cloudflare R2
app.delete("/delete/:idProduct/:fileName", async (req, res) => {
  try {
    const { idProduct, fileName } = req.params;
    const fileKey = `${idProduct}/${fileName}`;

    await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileKey,
        })
      );

    return res.json({
      ok: true,
      message: "File deleted successfully",
      file: fileKey,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Failed to delete image" });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});