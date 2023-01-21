const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token, api_key, api_key_secret, access_token, access_token_secret } = require('./config.json');
const fs = require('fs');
const schedule = require('node-schedule');
const got = require('got');
const { TwitterApi } = require('twitter-api-v2');
const { data } = require('./commands/meme');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions] });

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, c => {
    fs.readdir('commands/', (err, files) => {
        if (err) return console.error(err);
    
        const jsfile = files.filter(f => f.split('.').pop() === 'js');
        if (jsfile.length <= 0) {
            return console.log('Bot Couldn\'t Find Commands in commands Folder.');
        }
        
        jsfile.forEach(f => {
            const pull = require(`./commands/${f}`);
            //client.application.commands.create(pull.data)
            client.guilds.cache.get("807705159479066656").commands.create(pull.data)
        });
    });

    var json = JSON.parse(fs.readFileSync('./data/meme_channels.json', 'utf-8'))
    for (const x in json) {
        let exist = false;
        client.guilds.cache.get(x).emojis.fetch().then(emojis => {
            emojis.forEach(emoji => {
                if(emoji.name == 'omegalul') exist = true;
            })
            if(!exist){
                client.guilds.cache.get(x).emojis.create({
                    attachment: 'https://media.discordapp.net/attachments/793852699652653056/1066039442571284531/538460923480899589.webp',
                    name: 'omegalul'
                }).catch(console.error)
            }
        })
        
    }

    schedule.scheduleJob('0 0 19 * * *', finishVote);
    
    //Security check for schedule (if bot isn't start when it's time to vote)
    if(fs.existsSync('./data/vote.json')){
        var vote_json = JSON.parse(fs.readFileSync('./data/vote.json', 'utf-8'))
        var date = new Date()
        if(date.getHours() > 19)
        {
            if(date.getDate() > vote_json.day && vote_json.day != 1){
                finishVote()
            }
            if(date.getDate() == vote_json.day){
                finishVote()
            }
        }
    }

	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on("interactionCreate", interaction => {
    if(interaction.isCommand()){
        fs.readdir('commands/', (err, files) => {
            if (err) return console.error(err);
        
            const jsfile = files.filter(f => f.split('.').pop() === 'js');
            if (jsfile.length <= 0) {
                return console.log('Bot Couldn\'t Find Commands in commands Folder.');
            }
            
            jsfile.forEach(f => {
                const pull = require(`./commands/${f}`);
                if(interaction.commandName == pull.data.name){
                    pull.execute(interaction)
                }
            });
        });
        
    }
})

async function finishVote(){
    var json = JSON.parse(fs.readFileSync('./data/meme_channels.json', 'utf-8'))
    if(fs.existsSync("./data/vote.json")){
        var vote_json = JSON.parse(fs.readFileSync('./data/vote.json', 'utf-8'))
        var score = []
        console.log("before")
        for(const vote in vote_json.vote)
        {
            var temp_score = 0
            for(const guild in vote_json.vote[vote]){
                let id = vote_json.vote[vote][guild]
                let channel = client.guilds.cache.get(guild).channels.cache.get(json[guild].channel_id)
                await channel.messages.fetch(id).then(message => message.reactions.cache.forEach(reaction => {
                        if(reaction.emoji.name == "omegalul"){
                            temp_score += (reaction.count - 1)
                        }
                    })).catch(console.error)
            }
            score.push(temp_score)
        }
        console.log("after")
        console.log(score)
        var max = score[0];
        var index = 0;
        for (var i = 0; i < score.length; i++) 
        {
            if (max < score[i]) 
            {
                max = score[i];
                index = i;
            }
        }

        const userClient = new TwitterApi({
            appKey: api_key,
            appSecret: api_key_secret,
            accessToken: access_token,
            accessSecret: access_token_secret
        });

        var embed_info = vote_json.embed_info[index]
        await userClient.v2.tweet('The meme elected official of today is : ' + embed_info[0] + "\nYou can see it here: " + embed_info[1])
        await send_memes(json)
    } else {
        await send_memes(json)
    }
}

async function send_memes(json){
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    var vote_new_json = {
        "day": currentDate.getDate(),
        "vote": {},
        "embed_info": {},
    }
    
    var embeds = []
    for(var i = 0; i < 10; i++)
    {
        vote_new_json.vote[i] = {}
        let embed = await embed_creator()
        embeds.push(embed[0])
        vote_new_json.embed_info[i] = embed[1]
    }

    for (const guild in json) {
        let channel = client.guilds.cache.get(guild).channels.cache.get(json[guild].channel_id)
        channel.send("It's time to vote!")
        embeds.forEach((embed, index) => {
            channel.send({embeds: [embed]}).then(message => {
                message.guild.emojis.fetch().then(emojis => {
                    emojis.forEach(emoji => {
                        if(emoji.name == "omegalul")
                        {
                            message.react(emoji)
                        }
                    })
                })
                
                vote_new_json.vote[index][guild] = message.id
                if(index == 9)
                {
                    fs.writeFileSync('./data/vote.json', JSON.stringify(vote_new_json), 'utf-8')
                }
            })
        })

        channel.send("End of the vote : <t:" + parseInt(currentDate.getTime()/1000) + ":R>")
    }
}

async function embed_creator(){
    const embed = new EmbedBuilder();
    let embed_info = []
		await got('https://www.reddit.com/r/memes/random/.json')
			.then(async function (response) {
				const [list] = JSON.parse(response.body);
				const [post] = list.data.children;

				const permalink = post.data.permalink;
				const memeUrl = `https://reddit.com${permalink}`;
				const memeImage = post.data.url;
				const memeTitle = post.data.title;
                embed_info = [memeTitle, memeUrl, memeImage]
				embed.setTitle(`${memeTitle}`);
				embed.setURL(`${memeUrl}`);
				embed.setColor('Random');
				embed.setImage(memeImage);
			})
			.catch(console.error);
    return [embed, embed_info];
}

// Log in to Discord with your client's token
client.login(token);