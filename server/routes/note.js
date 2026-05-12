const express = require('express');
const router = express.Router();
const {
  getNotes, listUserNotes, generateNotes, updateNotes,
  updateFlashcard, deleteNotes, getNotesStatus, exportMarkdown,
} = require('../controllers/notesController');
const { protect } = require('../middleware/auth');

router.get('/', protect, listUserNotes);
router.get('/:videoId', protect, getNotes);
router.get('/:videoId/status', protect, getNotesStatus);
router.post('/:videoId/generate', protect, generateNotes);
router.put('/:notesId', protect, updateNotes);
router.put('/:notesId/flashcard', protect, updateFlashcard);
router.delete('/:notesId', protect, deleteNotes);
router.get('/:notesId/export/markdown', protect, exportMarkdown);

module.exports = router;
