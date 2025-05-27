import React, { useState, useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Box } from '@mui/material';
import { isElectron, isBrowser } from '../utils/environment';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

// Import the aura animation JSON data
import auraAnimationData from '../styles/aura-new.json';

const LottieFileIcon = ({
  size = 64,
  color = 'text.secondary',
  isDragActive = false,
  isHovered = false,
  sx = {},
  ...props
}) => {
  const lottieRef = useRef();
  const [animationData, setAnimationData] = useState(auraAnimationData);
  const [internalIsHovered, setInternalIsHovered] = useState(false);
  const [animationFailed, setAnimationFailed] = useState(false);

  // Handle animation speed based on interaction states
  useEffect(() => {
    if (lottieRef.current) {
      // Increase animation speed when dragging or hovering for more responsive feedback
      if (isDragActive || isHovered || internalIsHovered) {
        lottieRef.current.setSpeed(1.5); // Faster animation during interaction
      } else {
        lottieRef.current.setSpeed(1); // Normal speed when idle
      }
    }
  }, [isDragActive, isHovered, internalIsHovered]);

  // Environment-specific animation loading and debugging
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        // Use the aura animation for both Electron and browser environments
        if (isElectron()) {
          console.log('LottieFileIcon: Running in Electron environment with aura animation');
        } else if (isBrowser()) {
          console.log('LottieFileIcon: Running in browser environment with aura animation');
        }

        // Debug: Check if animation data is loaded
        console.log('LottieFileIcon: Animation data loaded:', !!auraAnimationData);
        console.log('LottieFileIcon: Animation data keys:', Object.keys(auraAnimationData || {}));

        // Use the aura animation data for both environments
        setAnimationData(auraAnimationData);
      } catch (error) {
        console.warn('LottieFileIcon: Failed to load aura animation, using fallback:', error);
        // Keep using the aura animation as fallback
        setAnimationData(auraAnimationData);
        setAnimationFailed(true);
      }
    };

    loadAnimation();
  }, []);

  // Ensure animation starts playing after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (lottieRef.current) {
        console.log('LottieFileIcon: Ensuring animation is playing...');
        lottieRef.current.play();
      }
    }, 100); // Small delay to ensure Lottie is fully initialized

    return () => clearTimeout(timer);
  }, [animationData]);

  const handleMouseEnter = () => {
    setInternalIsHovered(true);
    // Animation is always playing due to autoplay, just change speed
  };

  const handleMouseLeave = () => {
    setInternalIsHovered(false);
    // Animation continues playing, just returns to normal speed
  };

  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
        },
        // Let the animation render naturally without forcing styles
        '& .lottie-animation': {
          display: 'block',
        },
        ...sx
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {!animationFailed ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{
            width: size,
            height: size,
          }}
          className="lottie-animation"
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
            clearCanvas: false,
            progressiveLoad: false,
            hideOnTransparent: false,
          }}
          onComplete={() => {
            console.log('LottieFileIcon: Animation completed');
          }}
          onLoopComplete={() => {
            console.log('LottieFileIcon: Animation loop completed');
          }}
          onEnterFrame={() => {
            // Animation is playing - frame callback for potential future use
          }}
          onSegmentStart={() => {
            console.log('LottieFileIcon: Animation segment started');
          }}
          onConfigReady={() => {
            console.log('LottieFileIcon: Animation config ready');
          }}
          onDataReady={() => {
            console.log('LottieFileIcon: Animation data ready');
          }}
          onDataFailed={() => {
            console.error('LottieFileIcon: Animation data failed to load');
            setAnimationFailed(true);
          }}
          onLoadedImages={() => {
            console.log('LottieFileIcon: Animation images loaded');
          }}
          onDOMLoaded={() => {
            console.log('LottieFileIcon: Animation DOM loaded');
          }}
        />
      ) : (
        // Fallback icon when animation fails
        <InsertDriveFileIcon
          sx={{
            fontSize: size,
            color: color,
            animation: internalIsHovered || isDragActive ? 'pulse 1s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' }
            }
          }}
        />
      )}
    </Box>
  );
};

export default LottieFileIcon;
