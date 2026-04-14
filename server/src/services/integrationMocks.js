/** Demo summaries when `USE_INTEGRATION_MOCKS=true` and real OAuth keys are not set. */

export function integrationMocksEnabled() {
  return process.env.USE_INTEGRATION_MOCKS === 'true';
}

export function mockYoutubeSummary() {
  return {
    channelTitle: 'Demo channel',
    channelId: 'UCdemo',
    subscriberCount: 128,
    videoCount: 42,
    likesPlaylistId: null,
    likedVideos: [
      { title: 'Building a personal dashboard (demo)', videoId: 'dQw4w9WgXcQ', publishedAt: '' },
      { title: 'OAuth flow explained (demo)', videoId: 'demo2', publishedAt: '' },
    ],
    note:
      'Demo data. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in server/.env and set USE_INTEGRATION_MOCKS=false for your real YouTube account.',
  };
}

export function mockInstagramSummary() {
  return {
    username: 'demo_creator',
    name: 'Demo Creator',
    biography: 'Demo Instagram summary — connect a real Creator/Business account after configuring Meta app credentials.',
    website: 'https://example.com',
    followersCount: 1024,
    followsCount: 256,
    mediaCount: 48,
    profilePictureUrl: null,
    recentMedia: [
      {
        id: 'demo1',
        caption: 'Morning walk — demo post',
        mediaType: 'IMAGE',
        permalink: 'https://www.instagram.com/',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'demo2',
        caption: 'Shipped a feature today #buildinpublic',
        mediaType: 'CAROUSEL_ALBUM',
        permalink: 'https://www.instagram.com/',
        timestamp: new Date().toISOString(),
      },
    ],
    note:
      'Demo data. Set META_APP_ID, META_APP_SECRET, META_REDIRECT_URI and set USE_INTEGRATION_MOCKS=false; Instagram Graph API requires a Professional account linked to a Facebook Page.',
  };
}
