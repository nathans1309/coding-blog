import { themedStyle } from '@connectv/jss-theme';  // @see [Connective JSS Theme](https://github.com/CONNECT-platform/connective-jss-theme)
import { CodedocTheme } from '@codedoc/core';
export const ImageWrapStyle = themedStyle<CodedocTheme>(theme => ({
imagewrap: {
   '& img.left': {
    float: 'left',
    padding: '0 10px 0 0'
  },

  '& img.right': {
    float: 'right',
    padding: '0 0 0 10px'
  },

  '& strong': {
    fontSize: 18,
    display: 'block',
    color: theme.light.primary,                               // --> so lets make the title's of the primary color
    'body.dark &': { color: theme.dark.primary },             // --> but also do respect dark-mode settings
    '@media (prefers-color-scheme: dark)': {                  // --> this is to ensure proper dark-mode colors even before the scripts are loaded and user overrides are fetched
      'body:not(.dark-mode-animate) &': {
        color: theme.dark.primary,
      },
    },
  },
 }
}));