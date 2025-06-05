import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { TypeEntity } from "./constant.js";

const corsOptions = {
  origin: [
    "http://localhost:8080",
    "https://giftpromotion-fe-fd54814e0d3f.herokuapp.com", // Your frontend
    "https://quatang8k.vip", // Your frontend
    "https://charity8k-fe-c8edadfb4d06.herokuapp.com",
  ],
  // origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204,
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4500;
app.use(cors(corsOptions));
const s3 = new S3Client({
  region: "us-east-1", // Cloudflare R2 uses 'auto' as the region
  endpoint: process.env.R2_ENDPOINT, // Replace with your Cloudflare R2 endpoint
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// giftpromotion

// ✅ Upload Route
app.post("/gf/upload/", upload.single("file"), async (req, res) => {
  try {
    console.log("Received request:", req.body);

    const file = req.file;
    const idProduct = req.body.idproduct;
    const isComment = req.body.isComment || false;
    const bucketName = req.params.bucketname; // Get bucketname from path parameter

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!idProduct)
      return res.status(400).json({ error: "idproduct is required" });

    console.log("Received file:", file);

    const fileKey = `${isComment ? "comment/" : ""}${idProduct}/${
      file.originalname
    }`;

    const uploadParams = {
      Bucket: "giftpromotion",
      Key: fileKey,
      Body: file.buffer, // Use file.buffer directly
      ContentType: file.mimetype,
    };

    console.log("Uploading file:", uploadParams);

    const response = await s3.send(new PutObjectCommand(uploadParams));

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
app.delete("/gf/delete/:idProduct/:fileName", async (req, res) => {
  try {
    const { idProduct, fileName } = req.params;
    const fileKey = `${idProduct}/${fileName}`;

    await s3.send(
      new DeleteObjectCommand({
        Bucket: "giftpromotion",
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

app.delete("/gf/delComment/:idProduct/:fileName", async (req, res) => {
  try {
    const { idProduct, fileName } = req.params;
    const fileKey = `comment/${idProduct}/${fileName}`;

    await s3.send(
      new DeleteObjectCommand({
        Bucket: "giftpromotion",
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

// charity

app.post("/charity/upload/", upload.single("file"), async (req, res) => {
  try {
    console.log("Received request:", req.body);

    const file = req.file;
    const type = TypeEntity[+req.body.type || ""] ?? "";
    const idEntity = req.body.idEntity || "";

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!type) return res.status(400).json({ error: "type is required" });
    if (!idEntity) return res.status(400).json({ error: "type is required" });

    console.log("Received file:", file);

    const fileKey = `${type}/${idEntity}/${file.originalname}`;

    const uploadParams = {
      Bucket: "charity",
      Key: fileKey,
      Body: file.buffer, // Use file.buffer directly
      ContentType: file.mimetype,
    };

    console.log("Uploading file:", uploadParams);

    const response = await s3.send(new PutObjectCommand(uploadParams));

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

app.delete("/charity/delete/", async (req, res) => {
  try {
    const idEntity = req.body.idEntity || "";
    const fileName = req.body.fileName || "";
    const type = TypeEntity[+req.body.type || ""] ?? "";

    const fileKey = `${type}/${idEntity}/${fileName}`;

    await s3.send(
      new DeleteObjectCommand({
        Bucket: "charity",
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
