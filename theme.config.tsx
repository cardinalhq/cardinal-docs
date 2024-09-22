import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: (
    <>
      <img src="/cardinal.png" width="36" />
      <h1 className="nx-font-bold nx-text-2xl">Cardinal</h1>
    </>
  ),
  project: {
    link: 'https://github.com/cardinalhq/cardinal-docs',
  },
  docsRepositoryBase: 'https://github.com/cardinalhq/cardinal-docs',
  footer: {
    text: '© 2024, Cardinal HQ, Inc. All rights reserved.',
  },
};

export default config;
