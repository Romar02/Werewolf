import mysql from 'mysql';
import dotenv from 'dotenv';
import util from 'util';
import fs from 'fs';

const localization = {};

export default {
    loadLocalization() {
        const localeFiles = fs.readdirSync('./localization').filter((file) => file.endsWith('.json'));

        for (const file of localeFiles) {
            const fileName = file.split('.')[0];
            localization[fileName] = JSON.parse(fs.readFileSync(`./localization/${file}`, 'utf8'));
        }
    },

    getLocale(language, string, ...vars) {
        if (!(Object.keys(localization))[0]) loadLocale();

        language = language.split('-')[0];

        let locale = localization[language][string];

        let count = (locale.match(/%VAR%/g))?.length ?? 0;
        for (let i = 0; i < count; i++) {
            locale = locale.replace('%VAR%', (vars[i] !== null ? vars[i] : "%VAR%"));
        }

        return locale;
    },

    initMySQLDatabase(client) {
        //check if `locales` table exists
        client.query('SELECT 1 FROM `locales` LIMIT 1', function (err, result) {
            if (err) {
                const query = `CREATE TABLE \`Game_Bot\`.\`locales\` ( \`LANGUAGE\` VARCHAR(20) NOT NULL , \`CODE\` VARCHAR(5) NOT NULL ) ENGINE = InnoDB;
                ALTER TABLE \`locales\` ADD PRIMARY KEY(\`LANGUAGE\`);
                INSERT INTO \`Game_Bot\`.\`locales\` (\`LANGUAGE\`, \`CODE\`) VALUES ('English', 'en'), ('Français', 'fr');`;

                query.split(';').forEach((q) => {
                    if (q) client.connection.query(q, function (err, result) {
                        if (err) throw err;
                    });
                });

                console.log('Table `locales` created');
            }
        });
    },

    initMySQLConnection(client) {
        client.connection = mysql.createConnection({
            host: process.env.SQL_HOST,
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            database: process.env.SQL_DATABASE,
        });

        client.connection.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }

            console.log('connected as id ' + client.connection.threadId);
        });
        client.query = util.promisify(client.connection.query).bind(client.connection);

        this.initMySQLDatabase(client);
    },

    async loadEvents(client) {
        const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js') || file.endsWith('.cjs'));

        for (const file of eventFiles) {
            const event = (await import(`../events/${file}`)).default;
            const eventName = file.split('.')[0];
            if (event.once) {
                client.once(eventName, (...args) => event.execute(...args, client));
            } else {
                client.on(eventName, (...args) => {
                    event.execute(...args, client);
                });
            }
            console.log("Load event => " + eventName);
        }
    },

    async loadCommands(client) {
        client.guilds.cache.forEach(async (guild) => await guild.commands.set([]));
        client.application.commands.set([]);

        const commandsFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js') || file.endsWith('.cjs'));

        for (let i = 0; i < commandsFiles.length; i++) {
            const cmd = (await import(`../commands/${commandsFiles[i]}`)).default;

            if (cmd && cmd.data && cmd.options.activate) {
                client.commands.set(cmd.data.name, cmd);
                if (Array.isArray(cmd.options.guilds) && cmd.options.guilds.length) {
                    cmd.options.guilds.forEach(async (guildId) => {
                        const guild = client.guilds.cache.find((g) => g.id == guildId);
                        guild.commands.create(cmd.data);
                        console.log(`Load command ${cmd.data.name} in the guild ${guild.name}`);
                    });
                } else {
                    client.application.commands.create(cmd.data);
                }
            }
        }
    }
};
