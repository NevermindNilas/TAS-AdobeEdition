# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TAS-AdobeEdition is an Adobe CEP (Common Extensibility Platform) extension that bridges TheAnimeScripter CLI with Adobe After Effects and Premiere Pro. The extension enables automation and integration between Adobe applications and the TAS backend.

## Key Commands

### Development
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Watch mode for development
npm run watch

# Create ZXP installer package
npm run zxp

# Create ZIP package
npm run zip

# Serve panel for testing
npm run serve

# Create/remove symlinks for local development
npm run symlink
npm run delsymlink
```

## Architecture

### Three-Layer Architecture

1. **CEP Panel (TypeScript/React)**: `/src/js/`
   - Main UI built with React and Adobe Spectrum components
   - Socket communication with TAS backend
   - Handles user interactions and state management

2. **ExtendScript Layer**: `/src/jsx/`
   - Direct communication with Adobe applications (After Effects/Premiere Pro)
   - Executes host-specific operations
   - Type-safe bridge between CEP and host applications

3. **TAS Backend**: External CLI application
   - Handles heavy processing (interpolation, upscaling, etc.)
   - Communicates via WebSocket on configurable port

### Key Technologies

- **Vite**: Build tool with CEP plugin for Adobe extension development
- **React 19**: UI framework with Adobe Spectrum components
- **TypeScript**: Type safety across CEP and ExtendScript layers
- **WebSocket**: Real-time communication with TAS backend
- **ExtendScript**: Adobe's JavaScript variant for host application scripting

### Communication Flow

1. User interactions in React UI trigger actions
2. CEP layer uses `evalTS()` to call ExtendScript functions type-safely
3. ExtendScript executes operations in After Effects/Premiere Pro
4. Results flow back through promises to the UI
5. Heavy processing tasks are sent to TAS backend via WebSocket
6. Progress updates stream back via socket events

### Important Files

- `cep.config.ts`: CEP extension configuration
- `src/js/main/main.tsx`: Main React component and UI logic
- `src/jsx/aeft/aeft.ts`: After Effects ExtendScript functions
- `src/jsx/ppro/ppro.ts`: Premiere Pro ExtendScript functions  
- `src/js/lib/utils/bolt.ts`: Type-safe ExtendScript evaluation utilities
- `src/js/main/utils/socket.tsx`: WebSocket manager for TAS backend communication

### Type Safety

The project uses end-to-end type safety:
- ExtendScript functions are typed in `/src/jsx/index.ts`
- `evalTS()` provides type-safe calls from CEP to ExtendScript
- Shared types in `/src/shared/universals.d.ts`

### Port Configuration

The extension manages dynamic port allocation for TAS backend communication. Port selection logic is handled in the UI and passed to command execution.

## Development Notes

- The extension ID is "TheAnimeScripter" (defined in `cep.config.ts`)
- Supports After Effects and Premiere Pro (all versions)
- Uses mixed context and Node.js enabled for full CEP capabilities
- Panel dimensions: 600x650px default
- Debug ports start at 8860

## Building for Distribution

1. **Development Build**: `npm run build` - Creates unpackaged build in `/dist`
2. **ZXP Package**: `npm run zxp` - Creates signed installer with jsxbin obfuscation
3. **ZIP Package**: `npm run zip` - Creates distributable ZIP archive

The build process automatically handles jsxbin conversion for production builds to protect source code.