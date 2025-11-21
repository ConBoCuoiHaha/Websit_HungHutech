const jobBoards = require('../config/jobBoards');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function publishToChannel(channel, vacancy) {
  // Giả lập gọi API tới job board
  await delay(300); // giả lập network latency
  const boardConfig = jobBoards.find((item) => item.key === channel);
  if (!boardConfig) {
    throw new Error('Kenh khong ho tro');
  }
  const reference = `${channel.toUpperCase()}-${vacancy._id}-${Date.now()}`;
  const url = boardConfig.url_builder
    ? boardConfig.url_builder(reference)
    : `https://jobboard.example.com/${channel}/${reference}`;
  return {
    success: true,
    url,
    reference,
    payload: {
      title: vacancy.tieu_de,
      salary: vacancy.muc_luong || '',
      skills: vacancy.ky_nang || [],
    },
  };
}

module.exports = {
  publish: publishToChannel,
  getChannels: () => jobBoards,
};
