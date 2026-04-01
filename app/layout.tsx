import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import '../styles/globals.css'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Cardinal',
    template: '%s – Cardinal',
  },
  icons: '/cardinal.png',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={
            <Navbar
              logo={
                <>
                  <img src="/cardinal.png" width="36" alt="Cardinal" />
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
