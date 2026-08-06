import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getConnections,
  getSuggestions,
  getPendingRequests,
  getSentRequests,
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  cancelConnection,
  removeConnection,
} from '../controllers/connectionController.js';

const router = express.Router();

// Get active connections
router.get('/', protect, getConnections);

// Get connection suggestions
router.get('/suggestions', protect, getSuggestions);

// Get pending received requests
router.get('/pending', protect, getPendingRequests);

// Get sent requests
router.get('/sent', protect, getSentRequests);

// Send a connection request
router.post('/request', protect, sendConnectionRequest);

// Accept a connection request
router.post('/accept/:id', protect, acceptConnection);

// Reject a connection request
router.post('/reject/:id', protect, rejectConnection);

// Cancel a sent connection request
router.post('/cancel/:id', protect, cancelConnection);

// Remove an active connection
router.delete('/:id', protect, removeConnection);

export default router;
