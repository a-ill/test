window.Genie = {};
Genie.Settings = {
    "websockets_exposed_port":window.location.port,
    "server_host":"0.0.0.0",
    "webchannels_autosubscribe":true,
    "webchannels_reconnect_delay":500,
    "webchannels_subscription_trails":4,
    "env":"dev",
    "webchannels_eval_command":">eval:",
    "websockets_host":"127.0.0.1",
    "webthreads_js_file":"webthreads.js",
    "webchannels_unsubscribe_channel":"unsubscribe",
    "webthreads_default_route": "/test",  // channel goes here
    "webchannels_subscribe_channel":"subscribe",
    "server_port":8000,
    "webchannels_keepalive_frequency":30000,
    "websockets_exposed_host":window.location.hostname,
    "webchannels_connection_attempts":10,
    "base_path":"",
    "websockets_protocol":window.location.protocol.replace('http', 'ws'),
    "webthreads_pull_route":"pull",
    "webchannels_default_route": "/test", // channel goes here
    "webchannels_server_gone_alert_timeout":10000,
    "webchannels_timeout":1000,
    "webthreads_push_route":"push",
    "websockets_port":8000,
    "websockets_base_path":""};
/*
** channels.js v1.2 // 24th January 2023
** Author: Adrian Salceanu and contributors // @essenciary
** GenieFramework.com // Genie.jl
*/
Genie.WebChannels = {};

Genie.WebChannels.initialize = function() {
    Genie.WebChannels.sendMessageTo = sendMessageTo;
    Genie.WebChannels.messageHandlers = [];
    Genie.WebChannels.errorHandlers = [];
    Genie.WebChannels.openHandlers = [];
    Genie.WebChannels.closeHandlers = [];
    Genie.WebChannels.subscriptionHandlers = [];
    Genie.WebChannels.processingHandlers = [];

    const waitForOpenConnection = () => {
        return new Promise((resolve, reject) => {
            const maxNumberOfAttempts = Genie.Settings.webchannels_connection_attempts;
            const delay = Genie.Settings.webchannels_reconnect_delay;

            let currentAttempt = 0;
            const interval = setInterval(() => {
                if (currentAttempt > maxNumberOfAttempts - 1) {
                    clearInterval(interval);
                    reject(new Error('Maximum number of attempts exceeded: Message not sent.'));
                } else if (eval('Genie.WebChannels.socket.readyState') === 1) {
                    clearInterval(interval);
                    resolve();
                };
                currentAttempt++;
            }, delay)
        })
    }

    // A message maps to a channel route so that channel + message = /action/controller
    // The payload is the data exposed in the Channel Controller
    async function sendMessageTo(channel, message, payload = {}) {
        let msg = JSON.stringify({
        'channel': channel,
        'message': message,
        'payload': payload
        });
        if (Genie.WebChannels.socket.readyState === 1) {
        Genie.WebChannels.socket.send(msg);
        } else if (Object.keys(payload).length > 0) {
        try {
                await waitForOpenConnection()
                eval('Genie.WebChannels.socket').send(msg);
            } catch (err) {
                console.error(err);
                console.warn('Could not send message: ' + msg);
            }
        }
    }
}

function displayAlert(content = 'Can not reach the server - please reload the page') {
  let elemid = 'wsconnectionalert';
  if (document.getElementById(elemid) === null) {
    let elem = document.createElement('div');
    elem.id = elemid;
    elem.style.cssText = 'position:absolute;width:100%;opacity:0.5;z-index:100;background:#e63946;color:#f1faee;text-align:center;';
    elem.innerHTML = content + '<a href="javascript:location.reload();" style="color:#a8dadc;padding: 0 10pt;font-weight:bold;">Reload</a>';
    setTimeout(() => {
      document.body.appendChild(elem);
      document.location.href = '#' + elemid;
    }, Genie.Settings.webchannels_server_gone_alert_timeout);
  }
}

function newSocketConnection(host = Genie.Settings.websockets_exposed_host) {
  let ws = new WebSocket(Genie.Settings.websockets_protocol + '//' + host
    + (Genie.Settings.websockets_exposed_port > 0 ? (':' + Genie.Settings.websockets_exposed_port) : '') + '/' +
    Genie.Settings.webchannels_default_route);

    //console.log(ws)

    ws.addEventListener('open', event => {
      for (let i = 0; i < Genie.WebChannels.openHandlers.length; i++) {
        let f = Genie.WebChannels.openHandlers[i];
        if (typeof f === 'function') {
          f(event);
        }
      }
    });

    ws.addEventListener('message', event => {
      for (let i = 0; i < Genie.WebChannels.messageHandlers.length; i++) {
        let f = Genie.WebChannels.messageHandlers[i];
        if (typeof f === 'function') {
          f(event);
        }
      }
    });

    ws.addEventListener('error', event => {
      for (let i = 0; i < Genie.WebChannels.errorHandlers.length; i++) {
        let f = Genie.WebChannels.errorHandlers[i];
        if (typeof f === 'function') {
          f(event);
        }
      }
    });

    ws.addEventListener('close', event => {
      for (let i = 0; i < Genie.WebChannels.closeHandlers.length; i++) {
        let f = Genie.WebChannels.closeHandlers[i];
        if (typeof f === 'function') {
          f(event);
        }
      }
    });

    ws.addEventListener('error', _ => {
      Genie.WebChannels.socket = newSocketConnection();
    });

    return ws
}

Genie.WebChannels.initialize();
Genie.WebChannels.socket = newSocketConnection();

window.addEventListener('beforeunload', _ => {
  if (Genie.Settings.env == 'dev') {
    console.info('Preparing to unload');
  }

  if (Genie.Settings.webchannels_autosubscribe) {
    unsubscribe();
  }

  if (Genie.WebChannels.socket.readyState === 1) {
    Genie.WebChannels.socket.close();
  }
});

Genie.WebChannels.processingHandlers.push(event => {
  window.parse_payload(event.data);
});

Genie.WebChannels.messageHandlers.push(event => {
  try {
    event.data = event.data.trim();

    if (event.data.startsWith('{') && event.data.endsWith('}')) {
      window.parse_payload(JSON.parse(event.data, function (key, value) {
        if (value == '__undefined__') {
          return undefined;
        } else {
          return value;
        }
      }));
    } else if (event.data.startsWith(Genie.Settings.webchannels_eval_command)) {
      return Function('"use strict";return (' + event.data.substring(Genie.Settings.webchannels_eval_command.length).trim() + ')')();
    } else if (event.data == 'Subscription: OK') {
      window.subscription_ready();
    } else {
      window.process_payload(event);
    }
  } catch (ex) {
    console.error(ex);
    console.error(event.data);
  }
});

Genie.WebChannels.errorHandlers.push(event => {
  if (Genie.Settings.env == 'dev') {
    console.error(event.data);
  }
});

Genie.WebChannels.closeHandlers.push(event => {
  if (Genie.Settings.env == 'dev') {
    console.warn('WebSocket connection closed: ' + event.code + ' ' + event.reason + ' ' + event.wasClean);
  }
});

Genie.WebChannels.closeHandlers.push(event => {
  if (Genie.Settings.webchannels_autosubscribe) {
    if (Genie.Settings.env == 'dev') {
      console.info('Attempting to reconnect');
    }
    Genie.WebChannels.socket = newSocketConnection();
    subscribe();
  }
});

Genie.WebChannels.openHandlers.push(event => {
  if (Genie.Settings.webchannels_autosubscribe) {
    subscribe();
  }
});

function parse_payload(json_data) {
  if (Genie.Settings.env == 'dev') {
    console.info('Overwrite window.parse_payload to handle messages from the server');
    console.info(json_data);
  }
};

function process_payload(event) {
  for (let i = 0; i < Genie.WebChannels.processingHandlers.length; i++) {
    let f = Genie.WebChannels.processingHandlers[i];
    if (typeof f === 'function') {
      f(event);
    }
  }
};

function subscription_ready() {
  for (let i = 0; i < Genie.WebChannels.subscriptionHandlers.length; i++) {
    let f = Genie.WebChannels.subscriptionHandlers[i];
    if (typeof f === 'function') {
      f();
    }
  }

  if (Genie.Settings.env == 'dev') {
    console.info('Subscription ready');
  }
};


function subscribe(trial = 1) {
  if (Genie.WebChannels.socket.readyState && (document.readyState === 'complete' || document.readyState === 'interactive')) {
    Genie.WebChannels.sendMessageTo(window.Genie.Settings.webchannels_default_route, window.Genie.Settings.webchannels_subscribe_channel);
  } else if (trial < Genie.Settings.webchannels_subscription_trails) {
    if (Genie.Settings.env == 'dev') {
      console.warn('Queuing subscription');
    }
    trial++;
    setTimeout(subscribe.bind(this, trial), Genie.Settings.webchannels_timeout);
  } else {
    displayAlert();
  }
};

function unsubscribe() {
  Genie.WebChannels.sendMessageTo(window.Genie.Settings.webchannels_default_route, window.Genie.Settings.webchannels_unsubscribe_channel);
  if (Genie.Settings.env == 'dev') {
    console.info('Unsubscription completed');
  }
};