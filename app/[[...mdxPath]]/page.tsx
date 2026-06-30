import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { notFound } from 'next/navigation'
import { useMDXComponents } from '../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

// ponytail: importPage throws MODULE_NOT_FOUND for any non-page path (icons, /js/app.js,
// scanner probes). Turn that into a real 404 instead of a logged stack trace.
async function loadPage(mdxPath?: string[]) {
  try {
    return await importPage(mdxPath)
  } catch {
    notFound()
  }
}

export async function generateMetadata(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params
  const { metadata } = await loadPage(params.mdxPath)
  return metadata
}

const { wrapper: Wrapper } = useMDXComponents()

export default async function Page(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params
  const result = await loadPage(params.mdxPath)
  const { default: MDXContent, toc, metadata, sourceCode } = result
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
