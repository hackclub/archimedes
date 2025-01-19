import { Button, Font, Head, Text, Container, Heading, Html, Tailwind, Hr } from "@react-email/components";
import * as React from "react";
import Layout from "./layout";

export default function Email() {
    return (
        <Layout>
            <Text>Welcome back to #happenings, the weekly newsletter which is now 10 weeks old! Enjoy this double-digit edition :).</Text>
            <Hr />

            <Container>
                <Heading as="h2" className="font-bold">Orpheus spotted in the streets of Vermont</Heading>
                <Text>Creatures lie here...</Text>

                <Heading as="h2" className="font-bold">Orpheus spotted in the streets of Vermont</Heading>
                <Text>Creatures lie here...</Text>
            </Container>

            <Hr />
            <Text>
                P.S. Send me a DM if you have cool community-oriented stuff, i.e. active YSWS, which you want featured (tenth edition :yay: - Written by @Felix Gao, revised by @radioblahaj)
            </Text>
        </Layout>
    );
}
