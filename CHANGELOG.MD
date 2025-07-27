# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Untitled] - YYYY-MM-DD
### New
- Added resolution preview in upscale settings dialog - now you can see input dimensions (like 1920×1080) and output dimensions (3840×2160) before processing
- Added FPS preview in interpolation settings dialog - shows current composition FPS and what FPS you will get after interpolation (example: 24.000 FPS → 48.000 FPS for 2x)
- New functions getCompDimensions() and getCompFPS() in After Effects script to get composition information
Viewport zoom slider was added to `ToolBox`
- Added a brand new Graph Editor ( Alpha )
- Added a function to dynamically fetch the available space in C drive and display it in the download tas dependencies dialog.

### Changed
- Made big performance improvements to main interface - now it renders much faster and uses less memory
- Converted many functions to use useCallback and useMemo for better React performance
- Moved progress bar display to separate component file for cleaner code organization
- Resolution and FPS previews automatically fetch data when you open the settings dialogs
- Slight refactor to the dependencies dialog to improve readability.
- Removed Motion and fade in/out effects in order to retain snappiness. 

### Fixed
- Fixed issue where executeProcess function was used before it was declared (TypeScript error)
- Loading states now show properly when fetching composition information

## [2.3.2] - 2025-07-19
- N/A

## [2.3.1] - 2025-07-18
### New
- N/A

### Changed
- Better I/O handling if the pre-render input file is a video file.
- Removed `socket.io-client` dependency and replaced with flask.
- Massive refactor to the code and better usage of helpers.
- Improved error handling and logging throughout the application.
- Slightly improved logging throughout to `LogTab`.

### Fixed
- Fixed an issue where the naming scheme for pre-rendered files was not consistent.
- Fixed an issue wehre the progress bar was not updating correctly during processing.

## [2.3.0] - 2025-07-16
### New
- Introduced `addPortToCommand` function to dynamically add the AE comms server URL to commands.
- Improved error handling and reconnection logic in the socket connection.
- Added a new `startExtraTabLogic` function to handle logic for extra tabs like depth map extraction and background removal.
- Added a new supporters pannel.
  
### Changed
- Updated WebSocket to dynamically adjust the port based on if a port is already in use or not.
- Updated the `main.tsx` file to include more detailed descriptions for depth map quality settings.
- Removed unused functions and imports to clean up the codebase.
- Improved error handling for `ExecuteProcess` to ensure better user feedback and logging.