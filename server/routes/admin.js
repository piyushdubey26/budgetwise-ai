import express from 'express';
import { auth } from '../middleware/auth.js';
import { User } from '../models/models.js';
import * as adminCtrl from '../controllers/adminController.js';

// Middleware to authorize admins only
export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied. Admins Only.' });
    }
    // Update req.user with role for controllers if needed
    req.user.role = user.role;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Authorization validation failed.', error: err.message });
  }
};

const router = express.Router();

// Apply auth + adminMiddleware to all routes here
router.use(auth, adminMiddleware);

// ==========================================
// ADMIN WORKSPACE ENDPOINTS
// ==========================================
router.get('/metrics', adminCtrl.getDashboardMetrics);
router.get('/users', adminCtrl.getAllUsers);
router.put('/users/:id', adminCtrl.updateUser);
router.delete('/users/:id', adminCtrl.deleteUser);

router.get('/transactions', adminCtrl.getAllTransactions);
router.post('/broadcast', adminCtrl.broadcastNotification);

router.post('/categories', adminCtrl.addCategory);
router.delete('/categories/:id', adminCtrl.deleteCategory);

router.get('/feedback', adminCtrl.getAllFeedback);
router.put('/feedback/:id/reply', adminCtrl.replyFeedback);

router.get('/revenue', adminCtrl.getRevenueDetails);
router.get('/logs', adminCtrl.getAdminLogs);
router.get('/telemetry', adminCtrl.getSystemTelemetry);

export default router;
