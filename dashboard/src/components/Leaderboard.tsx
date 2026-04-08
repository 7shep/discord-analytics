interface Props {
  data: Array<{
    rank: number;
    discordId: string;
    username: string;
    avatarUrl: string | null;
    messageCount: number;
  }>;
  search?: string;
}


export function Leaderboard({ data, search = "" }: Props) {
  const filtered = search
    ? data.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()))
    : data;
  return (
    <div className="chart-container">
      <h3>Top Users</h3>
      <div className="leaderboard">
        {filtered.map((user) => (
          <div key={user.discordId} className="leaderboard-row">
            <span className="leaderboard-rank">#{user.rank}</span>
            <img
              className="leaderboard-avatar"
              src={
                user.avatarUrl ??
                `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
              }
              alt=""
            />
            <div className="leaderboard-info">
              <span className="leaderboard-username">{user.username}</span>
              <span className="leaderboard-id">{user.discordId}</span>
            </div>
            <span className="leaderboard-count">
              {user.messageCount.toLocaleString()} messages
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
