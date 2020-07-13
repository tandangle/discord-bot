const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const { prefix, token } = require("./config.json");

const readline = require("readline");
const { google } = require("googleapis");
const { writer } = require("repl");
// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

var dataStorage = {};

client.once("ready", () => {
  console.log("Ready!");
});

client.on("message", (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();
  if (message.content.startsWith(prefix) && command === "gold") {
    message.channel.send("Command received! Working...");
  }
  if (
    command === "gold" &&
    args.length !== 0 &&
    args[0] !== "help" &&
    args[0] !== "link"
  ) {
    console.log(args);
    // Load client secrets from a local file.
    if (!dataStorage[message.author.id]) {
      fs.readFile("credentials.json", (err, content) => {
        if (err) return console.log("Error loading client secret file:", err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), function (auth) {
          const sheets = google.sheets({ version: "v4", auth });
          const resource = {
            properties: {
              title: `${message.author.username}\'s Gold Sheet`,
            },
            sheets: [
              {
                data: [
                  {
                    rowData: [
                      {
                        values: [
                          {
                            userEnteredValue: {
                              stringValue: "Realm",
                            },
                          },
                          {
                            userEnteredValue: {
                              stringValue: "Gold",
                            },
                          },
                        ],
                      },
                      {
                        values: [
                          {
                            userEnteredValue: {
                              stringValue: args[0],
                            },
                          },
                          {
                            userEnteredValue: {
                              stringValue: args[1],
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          };

          sheets.spreadsheets.create(
            {
              resource,
            },
            (err, spreadsheet) => {
              if (err) {
                // Handle error.
                console.log(err);
              } else {
                console.log(spreadsheet.data);
                console.log(message.author.id);
                let newStorage = {
                  spreadsheetId: spreadsheet.data.spreadsheetId,
                  spreadsheetUrl: spreadsheet.data.spreadsheetUrl,
                };
                console.log(message);
                dataStorage[message.author.id] = newStorage;
                console.log(JSON.stringify(dataStorage));
                const drive = google.drive({ version: "v3", auth });
                drive.permissions.create(
                  {
                    resource: {
                      role: "writer",
                      type: "anyone",
                    },
                    fileId: spreadsheet.data.spreadsheetId,
                  },
                  function (err, res) {
                    if (err) {
                      console.log(err);
                    } else {
                      message.channel.send(
                        `New spreadsheet created! You can view the Spreadsheet here: ${spreadsheet.data.spreadsheetUrl}`
                      );
                    }
                  }
                );
              }
            }
          );
        });
      });
    } else if (dataStorage[message.author.id] && args[0] !== "link") {
      fs.readFile("credentials.json", (err, content) => {
        if (err) return console.log("Error loading client secret file:", err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), function (auth) {
          const sheets = google.sheets({ version: "v4", auth });
          sheets.spreadsheets.values.get(
            {
              spreadsheetId: dataStorage[message.author.id].spreadsheetId,
              range: "Sheet1",
            },
            (err, res) => {
              if (err) return console.log("The API returned an error: " + err);
              if (res.data.values) {
                console.log(res.data.values);
                let returnedValues = res.data.values;
                foundIndex = returnedValues.findIndex(
                  (element) =>
                    element[0].replace(/'/g, "").toLowerCase() ===
                    args[0].replace(/'/g, "").toLowerCase()
                );
                console.log(foundIndex);
                if (Math.sign(foundIndex) === 1) {
                  existingValue = returnedValues[foundIndex][1];
                  console.log(existingValue);
                  sheets.spreadsheets.values.update({
                    spreadsheetId: dataStorage[message.author.id].spreadsheetId,
                    range: `Sheet1!${String.fromCharCode(65 + foundIndex)}2`,
                    valueInputOption: "USER_ENTERED",
                    resource: {
                      range: `Sheet1!${String.fromCharCode(65 + foundIndex)}2`,
                      majorDimension: "ROWS",
                      values: [[parseInt(existingValue) + parseInt(args[1])]],
                    },
                  }),
                    (err, res) => {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log(res);
                        message.channel.send(
                          `Added ${args[1]} gold for ${args[0]}`
                        );
                      }
                    };
                } else {
                  sheets.spreadsheets.values.update({
                    spreadsheetId: dataStorage[message.author.id].spreadsheetId,
                    range: `Sheet1!A${returnedValues.length + 1}`,
                    valueInputOption: "USER_ENTERED",
                    resource: {
                      range: `Sheet1!A${returnedValues.length + 1}`,
                      majorDimension: "ROWS",
                      values: [[args[0]]],
                    },
                  });
                  sheets.spreadsheets.values.update({
                    spreadsheetId: dataStorage[message.author.id].spreadsheetId,
                    range: `Sheet1!B${returnedValues.length + 1}`,
                    valueInputOption: "USER_ENTERED",
                    resource: {
                      range: `Sheet1!B${returnedValues.length + 1}`,
                      majorDimension: "ROWS",
                      values: [[args[1]]],
                    },
                  });
                }
                message.channel.send(`Added ${args[1]} gold for ${args[0]}`);
              } else {
                console.log("No data found.");
              }
            }
          );
        });
      });
    }
  } else if (command === "gold" && args.length !== 0 && args[0] === "help") {
    message.channel.send(
      "Format your command like this: `!gold realm amount `"
    );
  } else if (command === "gold" && args.length !== 0 && args[0] === "link") {
    console.log("Getting link command");
    message.channel.send(dataStorage[message.author.id].spreadsheetUrl);
  } else if (command === "gold" && args.length === 0) {
    message.channel.send(
      "You didn't include any arguments. Please format your command like this: `!gold realm amount `"
    );
  } else {
    message.channel.send("I don't recognize that command");
  }
});

client.login(token);
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
