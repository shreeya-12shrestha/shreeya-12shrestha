import 'dotenv/config';
import { writeFileSync } from 'fs';

const token = process.env.GITHUB_TOKEN;
const login = process.env.GITHUB_USER;

const query = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              weekday
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { login } }),
});

const json = await res.json();

if (json.errors) {
    console.error('GraphQL error:', json.errors);
    process.exit(1);
}

const cal = json.data.user.contributionsCollection.contributionCalendar;

writeFileSync('contributions.json', JSON.stringify(cal, null, 2));

// quick visual check in the terminal
const symbol = {
    NONE: '·',
    FIRST_QUARTILE: '░',
    SECOND_QUARTILE: '▒',
    THIRD_QUARTILE: '▓',
    FOURTH_QUARTILE: '█',
};

console.log(`\n${login} — ${cal.totalContributions} contributions, ${cal.weeks.length} weeks\n`);

for (let d = 0; d < 7; d++) {
    let row = '';
    for (const week of cal.weeks) {
        const day = week.contributionDays.find((x) => x.weekday === d);
        row += day ? symbol[day.contributionLevel] : ' ';
    }
    console.log(row);
}