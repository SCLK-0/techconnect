# TechConnect Patch Notes

## Version 1.1.0 - November 22, 2025

### 🎉 System Improvements
- ✅ Removed "Under Maintenance" banner - all features now fully operational
- ✅ System stability improvements across all modules

### 🎥 Video Session Enhancements
- Fixed disconnect warning banner to only show during unexpected disconnects
- Improved video feed display for learners on initial join
- Fixed camera-off overlay visibility in small video thumbnails
- Added automatic page reload when session ends to properly stop camera
- Enhanced video stream initialization for faster display

### 🎨 Whiteboard Improvements
- Whiteboard refresh now only refreshes the connection (no full page reload)
- Moved refresh button to toolbar for easier access
- Simplified whiteboard connection logic for better reliability
- Removed redundant refresh button from waiting modal

### 📅 Availability & Scheduling
- Removed "Bulk Actions" button from tutor availability page
- Time slot indicators now hidden for past dates (cleaner calendar view)
- Fixed "Show only tutors I've booked before" filter to include in-progress sessions

### ⚡ Instant Sessions
- Changed duration input from dropdown to text field (10-60 minutes)
- Added clear messaging about 10-60 minute time limit
- Improved validation for duration input

### 🐛 Bug Fixes
- Fixed "In Session" badge query using wrong database column
- Created SQL scripts to fix stuck sessions
- Fixed session status detection and display
- Improved session cleanup and media track management

### 🔧 Technical Improvements
- Enhanced error handling across video sessions
- Improved database query performance
- Better state management for video streams
- Optimized presence detection for whiteboard

---

## How to Report Issues

If you encounter any bugs or have suggestions:
1. Document the issue with screenshots if possible
2. Note what you were doing when it occurred
3. Check if it's reproducible
4. Report to the development team

---

**Note**: For major feature requests or layout changes, please submit them for consideration in future versions.
