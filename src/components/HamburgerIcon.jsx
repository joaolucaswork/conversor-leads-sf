import React from 'react';
import { SvgIcon } from '@mui/material';

/**
 * Custom Hamburger Menu Icon Component
 * Uses currentColor for theming compatibility
 * Includes animation support for toggle states
 */
const HamburgerIcon = ({ isOpen = false, ...props }) => {
  return (
    <SvgIcon
      {...props}
      sx={{
        transition: 'transform 0.3s ease-in-out',
        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        ...props.sx,
      }}
      viewBox="0 0 24 24"
    >
      <path
        d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
        fill="currentColor"
      />
    </SvgIcon>
  );
};

export default HamburgerIcon;
