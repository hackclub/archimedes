import { toHTML as unwrappedMrkdwnToHTML } from "slack-markdown";
import type { Story } from "../airtable";
import {
	Body,
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text,
	Tailwind,
} from "@react-email/components";

interface Props {
	intro: string;
	conclusion: string;
	stories: Story[];
}

const mrkdwnToHTML = (mrkdwn: string, largeText = false) => {
	const rawHtml = unwrappedMrkdwnToHTML(mrkdwn, {
		hrefTarget: "_blank",
	});
	const imageSize = largeText ? 26 : 22;
	const emojiPass = rawHtml.replace(
		/:([A-Za-z0-9_-]*):/g,
		(_, emojiName) => `
            <img
                src="https://cachet.dunkirk.sh/emojis/${(emojiName as string).toLowerCase()}/r"
                height="${imageSize}"
                width="${imageSize}"
                style="vertical-align: middle; height: ${imageSize}px; width: ${imageSize}px; margin: 0 1px; position: relative; top: -2px; display: inline-block; filter: none !important;"
                alt=":${emojiName}: emoji"
            />
        `,
	);
	return emojiPass;
};

export default function Email({ intro, conclusion, stories }: Props) {
	const introHtml = mrkdwnToHTML(intro);
	const mappedStories = stories.map((story) => ({
		...story,
		headline: mrkdwnToHTML(story.headline, true),
		longArticle: mrkdwnToHTML(story.longArticle),
	}));
	const conclusionHtml = mrkdwnToHTML(conclusion);

	return (
		<Html>
			<Head>
				<Font
					fontFamily="Phantom Sans"
					fallbackFontFamily="Helvetica"
					webFont={{
						url: "https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Regular.woff2",
						format: "woff2",
					}}
					fontWeight={400}
					fontStyle="normal"
				/>
				<Font
					fontFamily="Phantom Sans"
					fallbackFontFamily="Helvetica"
					webFont={{
						url: "https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Bold.woff2",
						format: "woff2",
					}}
					fontWeight={700}
					fontStyle="normal"
				/>
				<Font
					fontFamily="Phantom Sans"
					fallbackFontFamily="Helvetica"
					webFont={{
						url: "https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Italic.woff2",
						format: "woff2",
					}}
					fontWeight={400}
					fontStyle="italic"
				/>
			</Head>
			<Preview>{intro}</Preview>
			<Tailwind>
				<Body className="bg-gray-100 font-['Phantom Sans',Helvetica,sans-serif]">
					<Container className="mx-auto my-[40px] max-w-[600px] rounded-[8px] bg-white p-[20px]">
						{/* Header */}
						<Img
							src="https://new.email/static/app/placeholder.png"
							alt="Hack Club Logo"
							width="120"
							height="40"
							className="w-[120px] h-auto object-cover"
						/>

						{/* Intro Section */}
						<Section className="mt-[32px]">
							<Heading className="text-[24px] font-bold text-[#ec3750] m-0 font-['Phantom Sans',Helvetica,sans-serif]">
								Welcome back to Happenings!👋
							</Heading>
							<Text
								className="text-[16px] leading-[24px] text-gray-700 font-['Phantom Sans',Helvetica,sans-serif]"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
								dangerouslySetInnerHTML={{ __html: introHtml }}
							/>
						</Section>

						{mappedStories.map((story, index) => (
							<div key={story.id || index}>
								<Section className="mt-[24px]">
									<Heading
										className="text-[20px] font-bold text-[#ec3750] m-0 font-['Phantom Sans',Helvetica,sans-serif]"
										// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
										dangerouslySetInnerHTML={{ __html: story.headline }}
									/>
									{story.image && (
										<Img
											src={story.image}
											alt={story.headline}
											className="w-full h-auto object-cover my-[16px] rounded-[8px]"
										/>
									)}
									<Text
										className="text-[16px] leading-[24px] text-gray-700 font-['Phantom Sans',Helvetica,sans-serif]"
										// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
										dangerouslySetInnerHTML={{ __html: story.longArticle }}
									/>
									{/* <Button
									href={story.link}
									className="bg-[#ec3750] text-white font-bold py-[12px] px-[20px] rounded-[8px] mt-[16px] box-border font-['Phantom Sans',Helvetica,sans-serif]"
								>
									See All Projects
								</Button> */}
								</Section>
								<Hr className="border border-gray-200 my-[24px]" />
							</div>
						))}

						{/* Conclusion */}
						<Section className="mt-[24px] bg-gray-50 p-[20px] rounded-[8px]">
							<Heading className="text-[20px] font-bold text-[#ec3750] m-0 font-['Phantom Sans',Helvetica,sans-serif]">
								And that's a wrap!
							</Heading>
							<Text
								className="text-[16px] leading-[24px] text-gray-700 font-['Phantom Sans',Helvetica,sans-serif]"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
								dangerouslySetInnerHTML={{ __html: conclusionHtml }}
							/>
							<Text className="text-[16px] leading-[24px] text-gray-700 italic font-['Phantom Sans',Helvetica,sans-serif]">
								- Hack Club's Newspaper Team
							</Text>
						</Section>

						{/* Footer */}
						<Hr className="border border-gray-200 my-[24px]" />
						<Section className="text-center text-gray-500 text-[12px] font-['Phantom Sans',Helvetica,sans-serif]">
							<Text className="m-0">
								© {new Date().getFullYear()} Hack Club. All rights reserved.
							</Text>
							<Text className="m-0">
								Hack Club, 15 Falls Road, Shelburne, VT 05482
							</Text>
							<Text>
								<Link
									href="{unsubscribe_link}"
									className="text-gray-500 underline"
								>
									Manage email preferences
								</Link>
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
