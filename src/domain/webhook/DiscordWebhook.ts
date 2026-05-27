export type DiscordEmbed = {
  title: string;
  description?: string;
  color: number; // decimal color
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnail?: { url: string };
  footer?: { text: string };
  timestamp?: string;
};

export function buildDraftStartEmbed(room: {
  code: string;
  blueTeamName?: string | null;
  redTeamName?: string | null;
  bluePlayerName?: string | null;
  redPlayerName?: string | null;
  seriesFormat?: string | null;
  gameNumber?: number | null;
  draftTemplate?: any;
}, siteUrl: string): DiscordEmbed {
  const blue = room.blueTeamName || room.bluePlayerName || 'Blue';
  const red = room.redTeamName || room.redPlayerName || 'Red';
  const fields: DiscordEmbed['fields'] = [
    { name: '🔵 Blue', value: blue, inline: true },
    { name: '🔴 Red', value: red, inline: true },
  ];
  if (room.seriesFormat && room.seriesFormat !== 'BO1') {
    fields.push({ name: '🎮 Series', value: `${room.seriesFormat} Game ${room.gameNumber ?? 1}`, inline: true });
  }
  fields.push({ name: '🔗 Watch', value: `${siteUrl}/room/${room.code}` });
  return {
    title: `⚔️ Draft Started — Room ${room.code}`,
    color: 0x6366f1, // indigo
    fields,
    footer: { text: 'Genshin Ban/Pick' },
    timestamp: new Date().toISOString(),
  };
}

export function buildDraftResultEmbed(room: {
  code: string;
  blueTeamName?: string | null;
  redTeamName?: string | null;
  bluePlayerName?: string | null;
  redPlayerName?: string | null;
}, blueCost: number, redCost: number, siteUrl: string): DiscordEmbed {
  const blue = room.blueTeamName || room.bluePlayerName || 'Blue';
  const red = room.redTeamName || room.redPlayerName || 'Red';
  const winner = blueCost === redCost ? '⚖️ Draw' : blueCost > redCost ? `🔵 ${blue} wins` : `🔴 ${red} wins`;
  const diff = Math.abs(blueCost - redCost);
  return {
    title: `🏆 Draft Finished — Room ${room.code}`,
    description: winner,
    color: blueCost > redCost ? 0x3b82f6 : redCost > blueCost ? 0xef4444 : 0xf59e0b,
    fields: [
      { name: '🔵 ' + blue, value: `Cost: ${blueCost}`, inline: true },
      { name: '🔴 ' + red, value: `Cost: ${redCost}`, inline: true },
      { name: '📊 Difference', value: `${diff} points`, inline: true },
      { name: '🔗 Result', value: `${siteUrl}/room/${room.code}/result` },
    ],
    footer: { text: 'Genshin Ban/Pick' },
    timestamp: new Date().toISOString(),
  };
}

export async function sendDiscordWebhook(webhookUrl: string, embeds: DiscordEmbed[]): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function isValidDiscordWebhookUrl(url: string): boolean {
  return /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/.+$/.test(url);
}
