const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const got = require('got');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("meme")
		.setDescription("display random meme"),
	async execute(interaction){
		const embed = new EmbedBuilder();
		await got('https://www.reddit.com/r/memes/random/.json')
			.then(async function (response) {
				const [list] = JSON.parse(response.body);
				const [post] = list.data.children;

				const permalink = post.data.permalink;
				const memeUrl = `https://reddit.com${permalink}`;
				const memeImage = post.data.url;
				const memeTitle = post.data.title;
				const memeUpvotes = post.data.ups;
				const memeNumComments = post.data.num_comments;

				embed.setTitle(`${memeTitle}`);
				embed.setURL(`${memeUrl}`);
				embed.setColor('Random');
				embed.setImage(memeImage);

				await interaction.reply({ embeds: [embed] });
			})
			.catch(console.error);
	}
};
