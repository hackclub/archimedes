// Typings for the `slack-to-html` package.
// This fork publishes the changes in the GitHub repo (that weren't published to npm)
// Feel free to use this in other projects, but please do follow the license and give credits :)
// TODO(skyfall): finish the typings for `escapeForSlack`, then PR this in.

declare module '@skyfall-powered/slack-to-html' {
    interface Options {
        channels?: Record<string, string>;
        users?: Record<string, string>;
        customEmoji?: Record<string, string>;
        usergroups?: Record<string, string>;
        markdown?: boolean;
    }

    /**
     * Renders Slack [mrkdwn](https://slack.com/intl/en-gb/help/articles/202288908-Format-your-messages) as HTML.
     * 
     * ## Examples
     * 
     * ### Basic usage
     * ```ts
     * import { escapeForSlack, escapeForSlackWithMarkdown } from 'slack-hawk-down'
     * escapeForSlackWithMarkdown('`this is a code block`') // => '<span class="slack_code">this is a code block</span>'
     * ```
     * 
     * ### Replacing Slack user IDs with Slack usernames
     * ```ts
     * import { escapeForSlack, escapeForSlackWithMarkdown } from 'slack-hawk-down'
     * escapeForSlack('<@U123|david> did you see my pull request?', { users: { 'U123': 'david', ... } }) // => '@david did you see my pull request?'
     * ```
     * You can get a list of users by calling the `users.list` method of the [Slack API](https://api.slack.com/methods/users.list) with
     * the `users:read` scope.
     * 
     * ### Replacing Slack channel IDs with Slack channel names
     * ```ts
     * import { escapeForSlack, escapeForSlackWithMarkdown } from 'slack-hawk-down'
     * escapeForSlack('<#C123|devs> please take a look!', { channels: { 'C123': 'devs', ... } }) // => '#devs please take a look!'
     * ```
     * 
     * You can get a list of channels by calling the `channels.list` method of the [Slack API](https://api.slack.com/methods/channels.list) with
     * the `channels:read` scope.
     *
     * ### Replacing custom Slack emojis with images
     * ```ts
     * escapeForSlack(':facepalm:', { customEmoji: { facepalm: 'http://emojis.slackmojis.com/emojis/images/1450319441/51/facepalm.png', ... } }) // => '<img alt="facepalm" src="http://emojis.slackmojis.com/emojis/images/1450319441/51/facepalm.png" />'
     * ```
     * 
     * You can get a list of custom emojis by calling the `emoji.list` method of the [Slack API](https://api.slack.com/methods/emoji.list) with
     * the `emoji:read` scope.
     * 
     * ### Replacing Slack subteam/usergroup IDs with Slack subteam names
     * ```ts
     * escapeForSlack('<!subteam^S123>', { usergroups: { 'S123': 'swiftype-eng', ...} }) // => 'swiftype-eng'
     * ```
     * 
     * You can get a list of subteams by calling the `usergroups.list` method of the [Slack API](https://api.slack.com/methods/usergroups.list) with
     * the `usergroups:read` scope.
     */
    function escapeForSlackWithMarkdown(text: string, options?: Omit<Options, 'markdown'>): string
};