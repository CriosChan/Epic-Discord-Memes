const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs')

module.exports = {
	data: new SlashCommandBuilder()
		.setName("set-meme-channel")
		.setDescription("Define the channel that will be used to make the memes votes.")
        .addChannelOption(option => option
            .setName("channel")
            .setDescription("Channel that will be used to send memes and vote.")
            .setRequired(true)
            )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction){
		let channel = interaction.options.getChannel("channel")
        if(channel.isVoiceBased())
        {
            await interaction.reply({content: "Sorry, this is a vocal channel... We need a text channel. Please try again", ephemeral: true })
        }
        var json = JSON.parse(fs.readFileSync('./data/meme_channels.json', 'utf-8'))
        json[interaction.guildId] = {}
        json[interaction.guildId].channel_id = channel.id
        fs.writeFileSync('./data/meme_channels.json', JSON.stringify(json), 'utf-8')
        await interaction.reply({content: "Okey, #" + channel.name + " will be the channel where we will send memes", ephemeral: true })
	}
};
