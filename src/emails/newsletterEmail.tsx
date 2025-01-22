import { Text, Container, Heading, Hr } from "@react-email/components";
import Layout from "./layout";
import type { Story } from "../airtable";
import { Fragment } from "react/jsx-runtime";
import { toHTML as unwrappedMrkdwnToHTML } from 'slack-markdown'

interface Props {
    intro: string;
    conclusion: string;
    stories: Story[]
}

const mrkdwnToHTML = (mrkdwn: string) => {
    const rawHtml = unwrappedMrkdwnToHTML(mrkdwn, {
        hrefTarget: "_blank",
    });
    return rawHtml.replace(/:([A-Za-z0-9_-]*):/g, (_, emojiName) => `
        <img
            src="https://cachet.dunkirk.sh/emojis/${emojiName}/r"
            height="22"
            width="22"
            style="vertical-align: baseline; height: auto; position: relative; overflow: visible; align-items: center; display: inline-flex;"
            alt="${emojiName} emoji"
        />
    `);
}

export default function Email({ intro, conclusion, stories }: Props) {
    const introHtml = mrkdwnToHTML(intro);
    const mappedStories = stories.map(story => ({
        ...story,
        headline: mrkdwnToHTML(story.headline),
        longArticle: mrkdwnToHTML(story.longArticle)
    }));

    const conclusionHtml = mrkdwnToHTML(conclusion);
    return (
        <Layout>
            <style>
                {`
                    html, body {
                        font-size: 16px;
                        line-height: 1.46668;
                    }
                `}
            </style>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: no way around it :shrug: */}
            <Text dangerouslySetInnerHTML={{ __html: introHtml }} className="text-[16px]" />
            <Hr />

            <Container>
                {mappedStories.map(story => (
                    <Fragment key={story.id}>
                        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: see above */}
                        <Heading as="h2" className="font-bold" dangerouslySetInnerHTML={{ __html: story.headline }} />
                        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: see above */}
                        <div dangerouslySetInnerHTML={{ __html: story.longArticle }} />
                    </Fragment>
                ))}
            </Container>

            <Hr />
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: no way around it :shrug: */}
            <Text dangerouslySetInnerHTML={{ __html: conclusionHtml }} />
        </Layout >
    );
}
