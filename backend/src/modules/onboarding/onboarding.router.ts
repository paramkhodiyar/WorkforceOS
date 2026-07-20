import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { onboardingSchema } from "./onboarding.validation";
import { onboard, uploadEmployees, setupExisting } from "./onboarding.controller";
import { rateLimit } from "../../middleware/rateLimit.middleware";
import path from "path";
import multerModule from "multer";

const router = Router();

const excelFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv"
  ];
  const allowedExtensions = [".xlsx", ".xls", ".csv"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed. Only Excel and CSV files are permitted."));
  }
};

const memoryUpload = multerModule({
  storage: multerModule.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: excelFilter
});

router.post("/", rateLimit(5, 60), validate(onboardingSchema), onboard);
router.post("/setup", authenticate, setupExisting);
router.post("/upload-employees", rateLimit(5, 60), memoryUpload.single("file"), uploadEmployees);

export const onboardingRouter = router;
