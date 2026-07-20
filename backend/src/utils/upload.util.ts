import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { config } from "../config/env";
import path from "path";
import fs from "fs";

let storage: multer.StorageEngine;

if (config.AWS_ACCESS_KEY_ID === "awsaccesskeyplaceholder") {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
} else {
  const s3 = new S3Client({
    region: config.AWS_REGION,
    endpoint: config.S3_ENDPOINT,
    forcePathStyle: config.S3_ENDPOINT ? true : undefined,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY
    }
  });
  storage = multerS3({
    s3: s3,
    bucket: config.AWS_BUCKET,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
}

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = ["image/png", "image/jpeg", "application/pdf"];
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed. Only PNG, JPEG, and PDF are permitted."));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

export function getFileUrl(file: any): string {
  if (file.location) {
    return file.location;
  }
  return `${config.S3_BASE_URL}/${file.filename}`;
}
