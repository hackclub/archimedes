// For dev purposes :)
import Email from "./newsletterEmail";

export default function NewsletterEmailPreview() {
    const stories: { id: string, headline: string, longArticle: string }[] = [
        {
            id: "1",
            headline: ":scrapyard: Scrapyard",
            longArticle: "This is a really cool *email preview* with Slack mrkdwn! Here's an emoji: :yay:, and here's a link: https://slack.com"
        },
        {
            id: "2",
            headline: "Normal",
            longArticle: "This is a normal story. Boring :/"
        },
        {
            id: "3",
            headline: ":yay: WHAT A LEEK LADS :lfg:",
            longArticle: "THAT'S RIGHT FELLAS, *THE LEEKS ARE HERE!* JOIN #hackclub-leeks!!!"
        },
        {
            id: "4",
            headline: "Usergroup/user/channel name",
            longArticle: "@fire-fighters #skyfalls-airport <@U059VC0UDEU>"
        }
    ];
    return (
        // biome-ignore lint/suspicious/noExplicitAny: doesn't really matter, since the fields aren't even used anyway
        <Email stories={stories as any} intro="This is a really cool *email preview* with Slack mrkdwn! Here's an emoji: :yay:, and here's a link: https://slack.com" conclusion="This is the conclusion. :lfg:" userIdToName={() => "skyfall"} />
    )
}