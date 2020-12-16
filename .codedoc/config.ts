
import { configuration } from '@codedoc/core';
import { codingBlog } from '@codedoc/coding-blog-plugin';

import { theme } from './theme';



export const config = /*#__PURE__*/configuration({
  theme,
  src: {
    base: 'posts'
  },
  dest: {
    namespace: '/coding-blog-boilerplate',    // --> change this if you want to also deploy to GitHub Pages
    html: 'dist',
    assets: process.env.GITHUB_BUILD === 'true' ? 'dist' : '.',
    bundle: process.env.GITHUB_BUILD === 'true' ? 'bundle' : 'dist/bundle',
    styles: process.env.GITHUB_BUILD === 'true' ? 'styles' : 'dist/styles',
  },
  page: {
    title: {
      base: 'Nathan Sweeney\'s Blog'         // --> change this to change your blog's title
    },
    favicon: '/favicon.ico',
    meta: {
      keywords: ['software', 'development', 'programming', 'Nathan', 'Sweeney'],
    },
  },
  plugins: [
    codingBlog({
      assets: [
        'img',
        'favicon.ico',
      ],
    })
  ],
  misc: {
    github: {
      repo: 'nathan-sweeney-blog',         // --> change this to your github repo
      user: 'nathans1309'         // --> change this to your github username
    }
  }
});
