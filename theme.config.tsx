import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const basePath = '/cardinal-docs';

const config: DocsThemeConfig = {
  logo: (
    <>
      <img src={`${basePath}/cardinal.png`} width="36" />
      <h1 className="nx-font-bold nx-text-2xl">Cardinal</h1>
    </>
  ),
  head: (
    <>
      <link rel="icon" type="image/png" href={`${basePath}/cardinal.png`} />
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
