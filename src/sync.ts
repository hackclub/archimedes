import syncFetch from "sync-fetch";

// Mahad, what the HELL are you doing?! you might ask.
// Great question!
// Essentially, the `slack-markdown` doesn't let you use async callbacks, so we have to use
// this hack to get the profile data without fetching every single user from Slack or something :pf:
// The real fix would be to PR async callbacks into the `slack-markdown` package, or even write my
// own with something like `micromark`/`remark`, but I need to get this shipped for the MVP and that
// would require a lot of work :/
// FIXME: Mahad, please expunge this function from the codebase.
export function synchronouslyGetProfileBySlackId(slackId: string) {
    const response = syncFetch(`https://slack.com/api/users.profile.get&token=${process.env.SLACK_BOT_TOKEN}&user=${slackId}`, {
        method: "POST"
    });
    return response.json().display_name as string;
}