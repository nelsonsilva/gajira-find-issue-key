const fetch = require('node-fetch')
const Jira = require('./common/net/Jira')

const issueIdRegEx = /([a-zA-Z0-9]+-[0-9]+)/g

module.exports = class {
  constructor ({ event, argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    this.argv = argv
    this.event = event
  }

  async execute () {
    const { from } = this.argv
    const { event } = this
    let str

    if (from === 'branch') {
      str = event.ref || event.pull_request.head.ref
    } else {
      console.log(event)
      console.log(await fetch(event.commits_url).then(r => r.json()))
      str = (await fetch(event.commits_url).then(r => r.json())).map(c => c.commit.message).join(' ')
    }

    const match = str.match(issueIdRegEx)

    if (!match) {
      console.log(`String "${str}" does not contain issueKeys`)

      return
    }

    return { issues: await Promise.all([...new Set(match)].map(this.Jira.getIssue)) }
  }
}
