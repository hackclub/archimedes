import { Text, Container, Heading, Hr } from "@react-email/components";
import Layout from "./layout";
import type { Story } from "../airtable";
import { Fragment } from "react/jsx-runtime";

interface Props {
    intro: string;
    conclusion: string;
    stories: Story[]
}
export default function Email({ intro, conclusion, stories }: Props) {
    return (
        <Layout>
            <Text>{intro}</Text>
            <Hr />

            <Container>
                {stories.map(story => (
                    <Fragment key={story.id}>
                        <Heading as="h2" className="font-bold">{story.headline}</Heading>
                        <Text>{story.shortDescription}</Text>
                    </Fragment>
                ))}
            </Container>

            <Hr />
            <Text>{conclusion}</Text>
        </Layout >
    );
}
