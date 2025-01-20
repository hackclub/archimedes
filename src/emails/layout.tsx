import { Font, Head, Container, Html, Tailwind, Heading, Text } from "@react-email/components";

function Preview() {
    return (
        <>
            <Heading as="h2" className="font-bold">Orpheus spotted in the streets of Vermont</Heading>
            <Text>Creatures lie here...</Text>
        </>
    )
}
export default function Layout({ children }: { children: React.ReactNode } = { children: <Preview /> }) {
    return (
        <Html lang="en">
            <Head>
                <Font
                    fontFamily="Inter"
                    fallbackFontFamily="sans-serif"
                    webFont={{
                        url: "https://rsms.me/inter/font-files/Inter-Regular.woff2?v=4.1",
                        format: "woff2",
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
                <Font
                    fontFamily="Inter"
                    fallbackFontFamily="sans-serif"
                    webFont={{
                        url: "https://rsms.me/inter/font-files/Inter-Italic.woff2?v=4.1",
                        format: "woff2",
                    }}
                    fontWeight={400}
                    fontStyle="italic"
                />
                <Font
                    fontFamily="Inter"
                    fallbackFontFamily="sans-serif"
                    webFont={{
                        url: "https://rsms.me/inter/font-files/Inter-Bold.woff2?v=4.1",
                        format: "woff2",
                    }}
                    fontWeight={700}
                    fontStyle="normal"
                />
                <Font
                    fontFamily="Inter"
                    fallbackFontFamily="sans-serif"
                    webFont={{
                        url: "https://rsms.me/inter/font-files/Inter-BoldItalic.woff2?v=4.1",
                        format: "woff2",
                    }}
                    fontWeight={700}
                    fontStyle="italic"
                />
            </Head>
            <Container>
                <Tailwind>
                    {children}
                </Tailwind>
            </Container>
        </Html>
    );
}
