import { Router } from "express";
import { listCustomers, mintKey, updateCustomerStatus, listInvoices, verifyInvoice } from "./admin-cms.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/errors.util";

const router = Router();

// Protect Platform Admin CMS routes: Require SYS_OWNER or SUPER_ADMIN systemRole
router.use(authenticate, (req, res, next) => {
  const role = req.user?.systemRole;
  const originalRole = req.user?.originalRole;
  if (role === "SYS_OWNER" || role === "SUPER_ADMIN" || originalRole === "SYS_OWNER") {
    return next();
  }
  return next(AppError.forbidden("Access denied: Platform Admin System Owner permissions required."));
});

router.get("/customers", listCustomers);
router.post("/keys/mint", mintKey);
router.patch("/customers/:orgId/status", updateCustomerStatus);
router.get("/invoices", listInvoices);
router.post("/invoices/:invoiceId/verify", verifyInvoice);

export const adminCmsRouter = router;
