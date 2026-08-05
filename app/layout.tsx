import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Figtree, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import 'nextra-theme-docs/style.css'
import '../styles/globals.css'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Cardinal',
    template: '%s – Cardinal',
  },
  icons: '/chip.png',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${figtree.variable} ${jetbrainsMono.variable}`}
    >
      <Head />
      <body>
        {/* Same GA4 stream as cardinalhq.io: docs is a subdomain, so one
            stream keeps a visitor who crosses over as one user/session.
            A second stream would split identity and self-refer. */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-051X4VR1RL" />
        <Script id="ga4">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-051X4VR1RL');
        `}</Script>
        <Layout
          navbar={
            <Navbar
              logo={
                <>
                  <img src="/chip.png" width="36" alt="Cardinal" />
                  <h1 className="font-bold text-2xl">Cardinal</h1>
                </>
              }
            />
          }
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/cardinalhq/cardinal-docs"
          editLink={null}
          feedback={{ content: null }}
          footer={
            <Footer>
              © 2025-2026 Cardinal HQ, Inc. All rights reserved.
            </Footer>
          }
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
