import { ThemedComponentThis } from '@connectv/jss-theme';  // @see [CONNECTIVE JSS Theme](https://github.com/CONNECT-platform/connective-jss-theme)
import { RendererLike } from '@connectv/html';              // @see [CONNECTIVE HTML](https://github.com/CONNECT-platform/connective-html)
import { CodedocTheme } from '@codedoc/core';               // --> Type helper for theme object

import { ImageWrapStyle } from './style';                    


export interface ImageWrapOptions {
  align: string;      
  url: string
}

export function ImageWrap(
  this: ThemedComponentThis,           
  options: ImageWrapOptions,
  renderer: RendererLike<any, any>,
  content: any,
) {
  const classes = this.theme.classes(ImageWrapStyle);
  let align = classes.right
  if(options.align == 'left') { 
    align = classes.left 
  }

  return <div>
    <img src={`${options.url}`} alt="A photo" class={`${classes.left}`} />
    {content}
  </div>;
}