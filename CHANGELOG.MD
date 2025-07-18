# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - YYYY-MM-DD
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