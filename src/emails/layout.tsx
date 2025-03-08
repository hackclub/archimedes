import {
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Tailwind,
	Text,
} from "@react-email/components";
import type React from "react";

function Preview() {
	return (
		<>
			<Heading as="h2" className="font-bold">
				Orpheus spotted in the streets of Vermont
			</Heading>
			<Text>Creatures lie here...</Text>
		</>
	);
}
export default function Layout(
	{ children }: { children: React.ReactNode } = { children: <Preview /> },
) {
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
					<Hr />
					<Text className="text-sm text-gray-500">
						Hack Club, a 501(c)(3) nonprofit
						<br />
						15 Falls Road, Shelburne, VT 05482
						<br />
						<Link
							href="{unsubscribe_link}"
							className="text-sm font-semibold text-gray-500"
						>
							Manage email preferences
						</Link>
					</Text>
					{/* Added by Loops */}

				</Tailwind>
			</Container>
		</Html>
	);
}
